'use server'
import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/constants/roles'
import type { AppSettings, EmployeeImportRow, ImportResult, ParticipationRow } from '@/lib/types/phase4'

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
  const { data: openSurvey, error: surveyError } = await db
    .from('surveys')
    .select('id')
    .eq('status', 'open')
    .single()

  if (surveyError || !openSurvey) {
    // No open survey — return empty array
    return { success: true, data: [] }
  }

  const { id: surveyId } = openSurvey as { id: string }

  // Fetch participation data from v_participation_rates
  // View may have either old schema (survey_id, title, submitted_count)
  // or new schema (survey_id, token_count, department_id, department_name)
  const { data: partData, error: partError } = await db
    .from('v_participation_rates')
    .select('*')
    .eq('survey_id', surveyId)

  if (partError) return { success: false, error: partError.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: ParticipationRow[] = ((partData as any[]) ?? []).map((r) => {
    // Support both old schema (submitted_count) and new schema (token_count)
    const eligible = Number(r.eligible_count ?? 0)
    const responded = Number(r.token_count ?? r.submitted_count ?? 0)
    const rate = eligible > 0 ? Math.round((responded / eligible) * 100) : 0
    return {
      department: r.department_name ?? r.title ?? 'Unknown',
      departmentId: r.department_id ?? null,
      eligible,
      responded,
      rate,
    }
  })

  return { success: true, data: rows }
}
