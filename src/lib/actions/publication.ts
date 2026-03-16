'use server'
import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/constants/roles'
import type { PublicationSnapshot, SnapshotData } from '@/lib/types/phase4'
import type { DimensionScore, QualitativeTheme, PublicAction } from '@/lib/types/analytics'

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

// ─── createPublicationSnapshot ────────────────────────────────────────────────

/**
 * Creates an immutable publication snapshot for a closed survey.
 * Validates: survey must be closed, metrics must be computed, no duplicate snapshot.
 */
export async function createPublicationSnapshot(
  surveyId: string
): Promise<
  { success: true; data: { snapshotId: string } } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  // 1. Fetch survey and verify it is closed
  const { data: surveyData, error: surveyError } = await db
    .from('surveys')
    .select('id, title, status, closes_at')
    .eq('id', surveyId)
    .single()

  if (surveyError || !surveyData) return { success: false, error: 'Survey not found' }

  const survey = surveyData as { id: string; title: string; status: string; closes_at: string | null }
  if (survey.status !== 'closed') {
    return { success: false, error: 'Survey must be in closed state before publishing.' }
  }

  // 2. Check derived_metrics exist (metrics have been computed)
  const { count: metricsCount, error: metricsError } = await db
    .from('derived_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('survey_id', surveyId)

  if (metricsError) return { success: false, error: metricsError.message }
  if (!metricsCount || metricsCount === 0) {
    return { success: false, error: 'Run Compute Results before publishing.' }
  }

  // 3. Check for existing snapshot (prevent duplicate publish)
  const { data: existingSnapshot, error: snapCheckError } = await db
    .from('publication_snapshots')
    .select('id')
    .eq('survey_id', surveyId)
    .single()

  if (snapCheckError && snapCheckError.code !== 'PGRST116') {
    // PGRST116 = no rows found (expected when no snapshot exists)
    return { success: false, error: snapCheckError.message }
  }
  if (existingSnapshot) {
    return { success: false, error: 'Results already published for this cycle.' }
  }

  // 4. Gather snapshot data

  // 4a. Dimension scores from derived_metrics (segment_type = 'overall')
  const { data: dimMetrics, error: dimError } = await db
    .from('derived_metrics')
    .select('dimension_id, avg_score, favorable_pct, neutral_pct, unfavorable_pct, respondent_count, dimensions(name, slug)')
    .eq('survey_id', surveyId)
    .eq('segment_type', 'overall')

  if (dimError) return { success: false, error: dimError.message }

  const dimensionScores: DimensionScore[] = (
    (dimMetrics as Array<{
      dimension_id: string
      avg_score: number | null
      favorable_pct: number | null
      neutral_pct: number | null
      unfavorable_pct: number | null
      respondent_count: number
      dimensions: { name: string; slug: string } | null
    }>) ?? []
  ).map((row) => {
    const belowThreshold = Number(row.respondent_count) < 5
    return {
      dimensionId: row.dimension_id,
      dimensionName: row.dimensions?.name ?? row.dimension_id,
      dimensionSlug: row.dimensions?.slug ?? row.dimension_id,
      avgScore: belowThreshold ? null : (row.avg_score !== null ? Number(row.avg_score) : null),
      favorablePct: belowThreshold ? null : (row.favorable_pct !== null ? Number(row.favorable_pct) : null),
      neutralPct: belowThreshold ? null : (row.neutral_pct !== null ? Number(row.neutral_pct) : null),
      unfavorablePct: belowThreshold ? null : (row.unfavorable_pct !== null ? Number(row.unfavorable_pct) : null),
      respondentCount: Number(row.respondent_count),
      belowThreshold,
    }
  })

  // 4b. Participation from v_participation_rates (supports old and new schema)
  const { data: partData } = await db
    .from('v_participation_rates')
    .select('*')
    .eq('survey_id', surveyId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalResponses = ((partData as any[]) ?? [])
    .reduce((sum: number, r: any) => sum + Number(r.token_count ?? r.submitted_count ?? 0), 0)

  const { count: eligibleCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const participationRate =
    eligibleCount && eligibleCount > 0
      ? Math.round((totalResponses / eligibleCount) * 100)
      : 0

  // 4c. Qualitative themes
  const { data: themesData, error: themesError } = await db
    .from('qualitative_themes')
    .select('id, theme, tag_cluster, summary, is_positive')
    .eq('survey_id', surveyId)

  if (themesError) return { success: false, error: themesError.message }

  const qualitativeThemes: QualitativeTheme[] = (
    (themesData as Array<{
      id: string
      theme: string
      tag_cluster: string[]
      summary: string | null
      is_positive: boolean
    }>) ?? []
  ).map((t) => ({
    id: t.id,
    theme: t.theme,
    tagCluster: t.tag_cluster ?? [],
    summary: t.summary,
    isPositive: t.is_positive,
    tagCount: (t.tag_cluster ?? []).length,
  }))

  // 4d. Public action items (v_public_actions with fallback to action_items)
  let actionsData: unknown[] = []
  {
    const { data, error: viewErr } = await db
      .from('v_public_actions')
      .select('id, title, problem_statement, status, priority, target_date, success_criteria, department_name, survey_id')
      .or(`survey_id.eq.${surveyId},survey_id.is.null`)
    if (!viewErr) {
      actionsData = data ?? []
    } else {
      const { data: fallback } = await db
        .from('action_items')
        .select('id, title, problem_statement, status, priority, target_date, success_criteria, department_id, survey_id')
        .eq('is_public', true)
        .or(`survey_id.eq.${surveyId},survey_id.is.null`)
      actionsData = fallback ?? []
    }
  }

  const publicActions: PublicAction[] = (
    (actionsData as Array<{
      id: string
      title: string
      problem_statement: string | null
      status: string
      priority: string | null
      target_date: string | null
      success_criteria: string | null
      department_name: string | null
    }>) ?? []
  ).map((a) => ({
    id: a.id,
    title: a.title,
    problemStatement: a.problem_statement,
    status: a.status as PublicAction['status'],
    priority: a.priority,
    targetDate: a.target_date,
    successCriteria: a.success_criteria,
    departmentName: a.department_name,
  }))

  // 5. Build snapshot data object
  const snapshotData: SnapshotData = {
    schemaVersion: 1,
    surveyId: survey.id,
    surveyTitle: survey.title,
    publishedAt: new Date().toISOString(),
    participationRate,
    totalResponses,
    dimensionScores,
    qualitativeThemes,
    publicActions,
  }

  // 6. INSERT the immutable snapshot
  const { data: insertedSnap, error: insertError } = await db
    .from('publication_snapshots')
    .insert({
      survey_id: surveyId,
      snapshot_data: snapshotData,
      published_by: user.id,
    })
    .select('id')
    .single()

  if (insertError) return { success: false, error: insertError.message }

  const snap = insertedSnap as { id: string }
  return { success: true, data: { snapshotId: snap.id } }
}

// ─── getPublicationSnapshot ───────────────────────────────────────────────────

/**
 * Returns the publication snapshot for a given survey, or null if none exists.
 */
export async function getPublicationSnapshot(
  surveyId: string
): Promise<
  { success: true; data: PublicationSnapshot | null } | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await db
    .from('publication_snapshots')
    .select('id, survey_id, snapshot_data, published_by, created_at')
    .eq('survey_id', surveyId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message }
  }
  if (!data) return { success: true, data: null }

  const row = data as {
    id: string
    survey_id: string
    snapshot_data: SnapshotData
    published_by: string | null
    created_at: string
  }

  return {
    success: true,
    data: {
      id: row.id,
      surveyId: row.survey_id,
      snapshotData: row.snapshot_data,
      publishedBy: row.published_by,
      createdAt: row.created_at,
    },
  }
}

// ─── getPublishedCycles ───────────────────────────────────────────────────────

/**
 * Returns all surveys that have a published snapshot, ordered by most recent.
 */
export async function getPublishedCycles(): Promise<
  | {
      success: true
      data: Array<{ surveyId: string; surveyTitle: string; closedAt: string | null; snapshotId: string }>
    }
  | { success: false; error: string }
> {
  const { user, authError } = await getAuthenticatedUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await db
    .from('publication_snapshots')
    .select('id, survey_id, surveys(title, closes_at), created_at')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  const rows = (
    (data as Array<{
      id: string
      survey_id: string
      surveys: { title: string; closes_at: string | null } | null
      created_at: string
    }>) ?? []
  )

  return {
    success: true,
    data: rows.map((r) => ({
      surveyId: r.survey_id,
      surveyTitle: r.surveys?.title ?? '',
      closedAt: r.surveys?.closes_at ?? null,
      snapshotId: r.id,
    })),
  }
}
