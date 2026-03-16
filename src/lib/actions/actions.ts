'use server'
import 'server-only'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/constants/roles'
import type { ActionItem, ActionUpdate } from '@/lib/types/phase4'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createActionItemSchema = z.object({
  surveyId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required').max(300),
  problemStatement: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  targetDate: z.string().nullable().optional(),
  status: z.enum(['identified', 'planned', 'in_progress', 'blocked', 'completed']).default('identified'),
  successCriteria: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  dimensionIds: z.array(z.string()).default([]),
})

const updateActionItemSchema = z.object({
  surveyId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(300).optional(),
  problemStatement: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  targetDate: z.string().nullable().optional(),
  status: z.enum(['identified', 'planned', 'in_progress', 'blocked', 'completed']).optional(),
  successCriteria: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
  dimensionIds: z.array(z.string()).optional(),
})

const postActionUpdateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
})

// ─── Role guard helper ─────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  return { user, authError }
}

// ─── Row mapper ────────────────────────────────────────────────────────────────

function mapActionItem(row: Record<string, unknown>, ownerName?: string | null, departmentName?: string | null): ActionItem {
  return {
    id: row.id as string,
    surveyId: (row.survey_id as string | null) ?? null,
    title: row.title as string,
    problemStatement: (row.problem_statement as string | null) ?? null,
    ownerId: (row.owner_id as string | null) ?? null,
    ownerName: ownerName ?? null,
    departmentId: (row.department_id as string | null) ?? null,
    departmentName: departmentName ?? null,
    priority: row.priority as ActionItem['priority'],
    targetDate: (row.target_date as string | null) ?? null,
    status: row.status as ActionItem['status'],
    successCriteria: (row.success_criteria as string | null) ?? null,
    isPublic: Boolean(row.is_public),
    dimensionIds: (row.dimension_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  }
}

// ─── createActionItem ─────────────────────────────────────────────────────────

export async function createActionItem(
  input: unknown
): Promise<{ success: true; data: ActionItem } | { success: false; error: string }> {
  const parsed = createActionItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { dimensionIds: _dimensionIds, ...fields } = parsed.data
  const { data, error } = await db
    .from('action_items')
    .insert({
      survey_id: fields.surveyId ?? null,
      title: fields.title,
      problem_statement: fields.problemStatement ?? null,
      owner_id: fields.ownerId ?? null,
      department_id: fields.departmentId ?? null,
      priority: fields.priority,
      target_date: fields.targetDate ?? null,
      status: fields.status,
      success_criteria: fields.successCriteria ?? null,
      is_public: fields.isPublic,
      // dimension_ids omitted until Phase 4 migration is applied
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: mapActionItem(data as Record<string, unknown>) }
}

// ─── updateActionItem ─────────────────────────────────────────────────────────

export async function updateActionItem(
  id: string,
  input: unknown
): Promise<{ success: true; data: ActionItem } | { success: false; error: string }> {
  const parsed = updateActionItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { dimensionIds, isPublic, ownerId, departmentId, surveyId, targetDate, problemStatement, successCriteria, ...rest } = parsed.data

  // Build the patch object with snake_case keys
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = { ...rest }
  // dimension_ids omitted until Phase 4 migration is applied
  if (isPublic !== undefined) patch.is_public = isPublic
  if (ownerId !== undefined) patch.owner_id = ownerId
  if (departmentId !== undefined) patch.department_id = departmentId
  if (surveyId !== undefined) patch.survey_id = surveyId
  if (targetDate !== undefined) patch.target_date = targetDate
  if (problemStatement !== undefined) patch.problem_statement = problemStatement
  if (successCriteria !== undefined) patch.success_criteria = successCriteria

  const { data, error } = await db
    .from('action_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'Action item not found' }
  return { success: true, data: mapActionItem(data as Record<string, unknown>) }
}

// ─── deleteActionItem ─────────────────────────────────────────────────────────

export async function deleteActionItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { error } = await db.from('action_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── postActionUpdate ─────────────────────────────────────────────────────────

export async function postActionUpdate(
  actionItemId: string,
  content: string
): Promise<{ success: true; data: ActionUpdate } | { success: false; error: string }> {
  const parsed = postActionUpdateSchema.safeParse({ content })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await db
    .from('action_updates')
    .insert({
      action_item_id: actionItemId,
      content: parsed.data.content,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  const row = data as Record<string, unknown>
  return {
    success: true,
    data: {
      id: row.id as string,
      actionItemId: row.action_item_id as string,
      content: row.content as string,
      createdBy: (row.created_by as string | null) ?? null,
      createdByName: null,
      createdAt: row.created_at as string,
    },
  }
}

// ─── getActionItems ───────────────────────────────────────────────────────────

export async function getActionItems(
  statusFilter?: string
): Promise<{ success: true; data: ActionItem[] } | { success: false; error: string }> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  // Build query with optional status filter
  let query = db
    .from('action_items')
    .select('id, survey_id, title, problem_statement, owner_id, department_id, priority, target_date, status, success_criteria, is_public, created_at')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  const rows = (data as Array<Record<string, unknown>>) ?? []

  // Fetch owner profiles if any have owner_id
  const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter(Boolean) as string[])]
  const ownerMap = new Map<string, string>()
  if (ownerIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
    for (const p of (profiles as Array<{ id: string; full_name: string }>) ?? []) {
      ownerMap.set(p.id, p.full_name)
    }
  }

  // Fetch departments if any have department_id
  const deptIds = [...new Set(rows.map((r) => r.department_id).filter(Boolean) as string[])]
  const deptMap = new Map<string, string>()
  if (deptIds.length > 0) {
    const { data: depts } = await db
      .from('departments')
      .select('id, name')
      .in('id', deptIds)
    for (const d of (depts as Array<{ id: string; name: string }>) ?? []) {
      deptMap.set(d.id, d.name)
    }
  }

  const items: ActionItem[] = rows.map((row) => {
    const ownerName = row.owner_id ? ownerMap.get(row.owner_id as string) ?? null : null
    const departmentName = row.department_id ? deptMap.get(row.department_id as string) ?? null : null
    return mapActionItem(row, ownerName, departmentName)
  })

  return { success: true, data: items }
}

// ─── getActionItem ────────────────────────────────────────────────────────────

export async function getActionItem(
  id: string
): Promise<
  | { success: true; data: { item: ActionItem; updates: ActionUpdate[] } }
  | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const { data: rowData, error: rowError } = await db
    .from('action_items')
    .select('id, survey_id, title, problem_statement, owner_id, department_id, priority, target_date, status, success_criteria, is_public, created_at')
    .eq('id', id)
    .single()

  if (rowError) return { success: false, error: rowError.message }
  if (!rowData) return { success: false, error: 'Action item not found' }

  const { data: updatesData, error: updatesError } = await db
    .from('action_updates')
    .select('id, action_item_id, content, created_by, created_at')
    .eq('action_item_id', id)
    .order('created_at', { ascending: true })

  if (updatesError) return { success: false, error: updatesError.message }

  const updates: ActionUpdate[] = ((updatesData as Array<Record<string, unknown>>) ?? []).map(
    (u) => ({
      id: u.id as string,
      actionItemId: u.action_item_id as string,
      content: u.content as string,
      createdBy: (u.created_by as string | null) ?? null,
      createdByName: null,
      createdAt: u.created_at as string,
    })
  )

  return {
    success: true,
    data: {
      item: mapActionItem(rowData as Record<string, unknown>),
      updates,
    },
  }
}
