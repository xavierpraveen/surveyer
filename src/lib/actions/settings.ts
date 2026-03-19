'use server'
import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/constants/roles'
import type {
  AppSettings,
  EmployeeDirectoryRow,
  EmployeeImportRow,
  ImportResult,
  PendingEmployeeRow,
  ParticipationRow,
  ReminderPanelData,
} from '@/lib/types/phase4'
import { normalizeEmployeeDirectoryRow } from './settings-employee-compat'
import { buildParticipationRows } from './settings-participation-compat'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

// ─── Role guard helper ─────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  return { user, authError }
}

// ─── getAppSettings ────────────────────────────────────────────────────────────

/**
 * Returns app-wide privacy settings from app_settings table.
 * No role restriction — all admin pages can read settings.
 */
export async function getAppSettings(): Promise<
  { success: true; data: AppSettings } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await db
    .from('app_settings')
    .select('key, value')
    .in('key', ['privacy_threshold_numeric', 'privacy_threshold_text', 'allowed_email_domain'])

  if (error) return { success: false, error: error.message }

  const map = Object.fromEntries(
    ((data as Array<{ key: string; value: string }>) ?? []).map((r) => [r.key, r.value])
  )

  return {
    success: true,
    data: {
      privacyThresholdNumeric: Number(map.privacy_threshold_numeric ?? 5),
      privacyThresholdText: Number(map.privacy_threshold_text ?? 10),
      allowedEmailDomain: String(map.allowed_email_domain ?? ''),
    },
  }
}

// ─── updateAppSettings ────────────────────────────────────────────────────────

/**
 * Upserts a single key-value pair in app_settings.
 * Requires admin or hr_admin role.
 */
export async function updateAppSettings(
  key: string,
  value: number | string
): Promise<{ success: boolean; error?: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { error } = await db
    .from('app_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── importEmployees ──────────────────────────────────────────────────────────

/**
 * Creates Supabase auth users + profiles for each valid EmployeeImportRow.
 * Handles duplicate emails gracefully (skip, increment skipped count).
 * Requires admin or hr_admin role.
 */
export async function importEmployees(
  rows: EmployeeImportRow[]
): Promise<{ success: true; data: ImportResult } | { success: false; error: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.isValid) {
      skipped++
      continue
    }

    // Create auth user (service role bypasses email confirmation)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: row.email,
      email_confirm: true,
      user_metadata: { name: row.name },
    })

    if (createError) {
      // 422 = user already registered — skip gracefully
      if (createError.status === 422 || createError.message?.includes('already registered')) {
        skipped++
        continue
      }
      errors.push(`${row.email}: ${createError.message}`)
      continue
    }

    if (!authData?.user) {
      errors.push(`${row.email}: failed to create user`)
      continue
    }

    // Upsert profile — best effort (no hard failure on profile upsert)
    await db.from('profiles').upsert({
      id: authData.user.id,
      email: row.email,
      name: row.name,
      role: row.role,
      tenure_band: row.tenureBand,
      is_active: true,
    })

    imported++
  }

  return { success: true, data: { imported, skipped, errors } }
}

// ─── archiveSurvey ─────────────────────────────────────────────────────────────

/**
 * Archives a closed survey — sets archived = true.
 * Requires admin role.
 */
export async function archiveSurvey(
  surveyId: string
): Promise<{ success: boolean; error?: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  // Verify survey is closed before archiving
  const { data: surveyData, error: surveyError } = await db
    .from('surveys')
    .select('id, status')
    .eq('id', surveyId)
    .single()

  if (surveyError || !surveyData) return { success: false, error: 'Survey not found' }

  const survey = surveyData as { id: string; status: string }
  if (survey.status !== 'closed') {
    return { success: false, error: 'Only closed surveys can be archived.' }
  }

  const { error } = await db
    .from('surveys')
    .update({ archived: true })
    .eq('id', surveyId)

  if (error) {
    // Column may not exist yet — provide actionable message
    if (error.message.includes('archived')) {
      return { success: false, error: 'Database migration pending. Run scripts/production-setup.sql in the Supabase SQL editor first.' }
    }
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ─── getParticipationForOpenSurvey ────────────────────────────────────────────

/**
 * Returns participation rows for the currently open survey.
 * Returns empty array if no survey is currently open.
 */
export async function getParticipationForOpenSurvey(): Promise<
  { success: true; data: ParticipationRow[] } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  // Find currently open survey
  const { data: openSurveyRows, error: surveyError } = await db
    .from('surveys')
    .select('id')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)

  const openSurvey = ((openSurveyRows as Array<{ id: string }> | null) ?? [])[0]

  if (surveyError || !openSurvey) {
    // No open survey — return empty array
    return { success: true, data: [] }
  }

  const { id: surveyId } = openSurvey

  // Fetch participation data from v_participation_rates
  // View may have either old schema (survey_id, title, submitted_count)
  // or new schema (survey_id, token_count, department_id, department_name)
  const { data: partData, error: partError } = await db
    .from('v_participation_rates')
    .select('*')
    .eq('survey_id', surveyId)

  if (partError) return { success: false, error: partError.message }

  // Eligible-by-department baseline so open surveys with zero responses still
  // render rows (responded=0) instead of appearing empty.
  const { data: eligibleData, error: eligibleError } = await db
    .from('profiles')
    .select('department_id, departments(name), is_active')
    .eq('is_active', true)

  if (eligibleError) return { success: false, error: eligibleError.message }

  const eligibleCounts = new Map<string, { department_id: string | null; department_name: string | null; eligible_count: number }>()
  for (const row of ((eligibleData as Array<{
    department_id: string | null
    departments: { name?: string } | Array<{ name?: string }> | null
    department?: string | null
    department_name?: string | null
  }>) ?? [])) {
    const deptId = row.department_id ?? null
    const deptName =
      (Array.isArray(row.departments)
        ? row.departments[0]?.name
        : row.departments?.name) ??
      row.department ??
      row.department_name ??
      'Unknown'
    const key = deptId ?? `name:${deptName}`
    const prev = eligibleCounts.get(key)
    if (prev) {
      prev.eligible_count += 1
    } else {
      eligibleCounts.set(key, {
        department_id: deptId,
        department_name: deptName,
        eligible_count: 1,
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: ParticipationRow[] = buildParticipationRows((partData as any[]) ?? [], Array.from(eligibleCounts.values()))

  return { success: true, data: rows }
}

// ─── getEmployeeDirectory ─────────────────────────────────────────────────────

/**
 * Returns employee/profile rows for admin verification after roster import.
 */
export async function getEmployeeDirectory(): Promise<
  { success: true; data: EmployeeDirectoryRow[] } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { data, error } = await db
    .from('profiles')
    .select('id, full_name, email, tenure_band, is_active, created_at, departments(name), roles(name)')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  const rows = ((data as Record<string, unknown>[] | null) ?? []).map((row) =>
    normalizeEmployeeDirectoryRow(row)
  )

  return { success: true, data: rows }
}

// ─── Reminder workflow ────────────────────────────────────────────────────────

async function getActiveSurveyIdAndTitle(): Promise<{ id: string; title: string } | null> {
  const { data: openSurveyRows, error } = await db
    .from('surveys')
    .select('id, title')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!error) {
    const openSurvey = ((openSurveyRows as Array<{ id: string; title: string }> | null) ?? [])[0] ?? null
    if (openSurvey) return openSurvey
  }

  // Fallback: scheduled surveys that are already within their active window.
  const now = new Date()
  const { data: scheduledRows, error: scheduledError } = await db
    .from('surveys')
    .select('id, title, opens_at, closes_at')
    .eq('status', 'scheduled')
    .order('opens_at', { ascending: false })
    .limit(20)

  if (scheduledError) return null

  const activeScheduled = ((scheduledRows as Array<{
    id: string
    title: string
    opens_at: string | null
    closes_at: string | null
  }> | null) ?? []).find((survey) => {
    if (!survey.opens_at) return false
    const opensAt = new Date(survey.opens_at)
    const closesAt = survey.closes_at ? new Date(survey.closes_at) : null
    return opensAt <= now && (!closesAt || closesAt > now)
  })

  if (!activeScheduled) return null
  return { id: activeScheduled.id, title: activeScheduled.title }
}

function normalizePendingEmployee(row: Record<string, unknown>): PendingEmployeeRow {
  const departments = row.departments as { name?: string } | Array<{ name?: string }> | null
  const roles = row.roles as { name?: string } | Array<{ name?: string }> | null
  const department = Array.isArray(departments)
    ? (departments[0]?.name ?? null)
    : (departments?.name ?? null)
  const roleName = Array.isArray(roles)
    ? (roles[0]?.name ?? null)
    : (roles?.name ?? null)

  return {
    id: String(row.id ?? ''),
    name:
      (typeof row.full_name === 'string' && row.full_name) ||
      (typeof row.name === 'string' && row.name) ||
      'Unknown',
    email: typeof row.email === 'string' ? row.email : '',
    department: department ?? (typeof row.department === 'string' ? row.department : null),
    role: roleName ?? (typeof row.role === 'string' ? row.role : null),
  }
}

async function buildReminderPanelData(): Promise<
  { success: true; data: ReminderPanelData | null } | { success: false; error: string }
> {
  const activeSurvey = await getActiveSurveyIdAndTitle()
  if (!activeSurvey) return { success: true, data: null }

  const modernEmployeesFetch = await db
    .from('profiles')
    .select('id, full_name, email, departments(name), roles(name)')
    .eq('is_active', true)

  let employeesRaw = modernEmployeesFetch.data
  let employeesError = modernEmployeesFetch.error

  if (employeesError) {
    const legacyEmployeesFetch = await db
      .from('profiles')
      .select('id, name, email, department, role')
      .eq('is_active', true)

    employeesRaw = legacyEmployeesFetch.data
    employeesError = legacyEmployeesFetch.error
  }

  if (employeesError) return { success: false, error: employeesError.message }

  const employees = ((employeesRaw as Record<string, unknown>[] | null) ?? [])
    .map((row) => normalizePendingEmployee(row))
    .filter((row) => row.id && row.email)

  const { data: tokenRows, error: tokenError } = await db
    .from('participation_tokens')
    .select('user_id')
    .eq('survey_id', activeSurvey.id)

  if (tokenError) return { success: false, error: tokenError.message }
  const respondedUserIds = new Set(
    ((tokenRows as Array<{ user_id: string }> | null) ?? []).map((r) => String(r.user_id))
  )

  const completedEmployees = employees.filter((emp) => respondedUserIds.has(emp.id))
  const pendingEmployees = employees.filter((emp) => !respondedUserIds.has(emp.id))
  return {
    success: true,
    data: {
      surveyId: activeSurvey.id,
      surveyTitle: activeSurvey.title,
      totalEligible: employees.length,
      totalResponded: completedEmployees.length,
      pendingCount: pendingEmployees.length,
      completedCount: completedEmployees.length,
      pendingEmployees,
      completedEmployees,
    },
  }
}

export async function getReminderPanelData(): Promise<
  { success: true; data: ReminderPanelData | null } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  return buildReminderPanelData()
}

async function sendReminderEmail(email: string, name: string, surveyTitle: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!resendApiKey || !fromEmail || !appUrl) {
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Reminder: ${surveyTitle} survey is waiting for your response`,
        html: `<p>Hi ${name || 'there'},</p><p>This is a reminder to complete <strong>${surveyTitle}</strong>.</p><p><a href="${appUrl}/dashboard">Open survey dashboard</a></p>`,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function sendSurveyReminders(): Promise<
  { success: true; data: { notified: number; emailed: number; emailSkipped: boolean } } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const panelResult = await buildReminderPanelData()
  if (!panelResult.success) return panelResult
  if (!panelResult.data) {
    return { success: false, error: 'No open survey available' }
  }

  const panel = panelResult.data
  if (panel.pendingEmployees.length === 0) {
    return { success: true, data: { notified: 0, emailed: 0, emailSkipped: true } }
  }

  const notifications = panel.pendingEmployees.map((emp) => ({
    user_id: emp.id,
    survey_id: panel.surveyId,
    kind: 'survey_reminder',
    title: `Pending survey: ${panel.surveyTitle}`,
    message: `Please complete your pending survey: ${panel.surveyTitle}`,
  }))

  const { error: notifyError } = await db
    .from('in_app_notifications')
    .insert(notifications)

  if (notifyError) return { success: false, error: notifyError.message }

  const emailConfigured =
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(process.env.RESEND_FROM_EMAIL) &&
    Boolean(process.env.NEXT_PUBLIC_APP_URL)

  let emailed = 0
  if (emailConfigured) {
    for (const emp of panel.pendingEmployees) {
      const ok = await sendReminderEmail(emp.email, emp.name, panel.surveyTitle)
      if (ok) emailed += 1
    }
  }

  return {
    success: true,
    data: {
      notified: panel.pendingEmployees.length,
      emailed,
      emailSkipped: !emailConfigured,
    },
  }
}
