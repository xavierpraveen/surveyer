'use server'
import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizeRole } from '@/lib/constants/roles'
import type {
  LeadershipDashboardData,
  ManagerDashboardData,
  PublicResultsData,
  DashboardFilters,
  DimensionScore,
  HeatmapRow,
  TrendPoint,
  ParticipationBreakdown,
  QualitativeTheme,
  PublicAction,
  OrgKpis,
} from '@/lib/types/analytics'

// Untyped admin client — Database types are a stub until supabase gen types is re-run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

// ─── computeDerivedMetrics ────────────────────────────────────────────────────

/**
 * Triggers the compute_derived_metrics RPC for the given survey.
 * Requires admin, leadership, or survey_analyst role.
 * Idempotent — safe to call multiple times for the same survey.
 */
export async function computeDerivedMetrics(
  surveyId: string
): Promise<{ success: true; data: { rowsInserted: number } } | { success: false; error: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  const { data, error } = await db.rpc('compute_derived_metrics', {
    p_survey_id: surveyId,
  })

  if (error) return { success: false, error: error.message }
  return { success: true, data: { rowsInserted: data as number } }
}

// ─── getLeadershipDashboardData ───────────────────────────────────────────────

/**
 * Fetches the full leadership dashboard payload.
 * Requires admin or leadership role.
 * Applies department/role/tenureBand filters and enforces privacy threshold.
 */
export async function getLeadershipDashboardData(
  filters: DashboardFilters
): Promise<
  { success: true; data: LeadershipDashboardData } | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  // ── 1. Determine target survey ────────────────────────────────────────────
  let targetSurveyId = filters.surveyId

  if (!targetSurveyId) {
    // Most recent closed survey that has derived_metrics computed
    const { data: recentSurvey, error: recentError } = await db
      .from('surveys')
      .select('id')
      .eq('status', 'closed')
      .in(
        'id',
        db.from('derived_metrics').select('survey_id')
      )
      .order('closes_at', { ascending: false })
      .limit(1)
      .single()

    if (recentError || !recentSurvey) {
      // No computed survey — return empty shell
      const empty: LeadershipDashboardData = {
        kpis: {
          overallHealthScore: null,
          participationRate: 0,
          totalResponses: 0,
          surveyPeriod: '',
          dimensionsBelowThreshold: 0,
          surveyId: '',
          surveyTitle: '',
        },
        dimensionScores: [],
        heatmapRows: [],
        trendPoints: [],
        participationBreakdown: [],
        qualitativeThemes: [],
        publicActions: [],
        availableSurveys: [],
      }
      return { success: true, data: empty }
    }
    targetSurveyId = (recentSurvey as { id: string }).id
  }

  // ── 2. Fetch survey metadata ──────────────────────────────────────────────
  const { data: surveyRow, error: surveyError } = await db
    .from('surveys')
    .select('id, title, closes_at')
    .eq('id', targetSurveyId)
    .single()

  if (surveyError || !surveyRow) {
    return { success: false, error: 'Survey not found' }
  }

  const survey = surveyRow as { id: string; title: string; closes_at: string | null }
  const closedAt = survey.closes_at ? new Date(survey.closes_at) : new Date()
  const surveyPeriod = closedAt.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  // ── 3. Dimension scores ────────────────────────────────────────────────────
  // When a role or tenure band filter is active, read the pre-computed segment
  // rows from derived_metrics directly (threshold applied at final filtered count).
  // Otherwise use the company-wide RPC which also handles threshold enforcement.
  let dimensionScores: DimensionScore[]

  const activeSegmentType = filters.role
    ? 'role'
    : filters.tenureBand
    ? 'tenure_band'
    : null
  const activeSegmentValue = filters.role ?? filters.tenureBand ?? null

  if (activeSegmentType && activeSegmentValue) {
    // Fetch pre-computed segment from derived_metrics + dimension names via join
    const { data: dimRows, error: dimError } = await db
      .from('derived_metrics')
      .select(
        'dimension_id, avg_score, favorable_pct, neutral_pct, unfavorable_pct, respondent_count, dimensions(name, slug)'
      )
      .eq('survey_id', targetSurveyId)
      .eq('segment_type', activeSegmentType)
      .eq('segment_value', activeSegmentValue)

    if (dimError) return { success: false, error: dimError.message }

    dimensionScores = (
      (dimRows as Array<{
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
  } else {
    // Company-wide scores via RPC (handles threshold enforcement internally)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawDimScores, error: dimError } = await (supabase as any).rpc(
      'get_dimension_scores_for_survey',
      { p_survey_id: targetSurveyId, p_min_respondents: 5 }
    )

    if (dimError) return { success: false, error: dimError.message }

    dimensionScores = (
      (rawDimScores as Array<{
        dimension_id: string
        dimension_name: string
        dimension_slug: string
        avg_score: number | null
        favorable_pct: number | null
        neutral_pct: number | null
        unfavorable_pct: number | null
        respondent_count: number
        below_threshold: boolean
      }>) ?? []
    ).map((row) => ({
      dimensionId: row.dimension_id,
      dimensionName: row.dimension_name,
      dimensionSlug: row.dimension_slug,
      avgScore: row.avg_score,
      favorablePct: row.favorable_pct,
      neutralPct: row.neutral_pct,
      unfavorablePct: row.unfavorable_pct,
      respondentCount: Number(row.respondent_count),
      belowThreshold: row.below_threshold,
    }))
  }

  // ── 4. Participation (from v_participation_rates, supports old+new schema) ──
  const { data: participationRows } = await db
    .from('v_participation_rates')
    .select('*')
    .eq('survey_id', targetSurveyId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partRows = (participationRows as any[]) ?? []
  const totalResponses = partRows.reduce((sum: number, r: any) => sum + Number(r.token_count ?? r.submitted_count ?? 0), 0)

  const participationBreakdown: ParticipationBreakdown[] = partRows.map((r: any) => ({
    department: r.department_name ?? r.title ?? 'Unknown',
    departmentId: r.department_id ?? null,
    respondentCount: Number(r.token_count ?? r.submitted_count ?? 0),
  }))

  // ── 5. Department heatmap (from derived_metrics WHERE segment_type='department') ─
  let heatmapQuery = db
    .from('derived_metrics')
    .select(
      'segment_value, dimension_id, avg_score, respondent_count'
    )
    .eq('survey_id', targetSurveyId)
    .eq('segment_type', 'department')

  if (filters.department) {
    heatmapQuery = heatmapQuery.eq('segment_value', filters.department)
  }

  const { data: heatmapRaw, error: heatmapError } = await heatmapQuery

  if (heatmapError) return { success: false, error: heatmapError.message }

  // Group by department → map dimension scores
  const dimNameMap = new Map<string, string>(
    dimensionScores.map((d) => [d.dimensionId, d.dimensionName])
  )

  const heatmapByDept = new Map<
    string,
    {
      dimensionId: string
      dimensionName: string
      avgScore: number | null
      belowThreshold: boolean
    }[]
  >()

  for (const row of (heatmapRaw as Array<{
    segment_value: string | null
    dimension_id: string
    avg_score: number | null
    respondent_count: number
  }>) ?? []) {
    const dept = row.segment_value ?? 'Unknown'
    if (!heatmapByDept.has(dept)) heatmapByDept.set(dept, [])
    const belowThreshold = Number(row.respondent_count) < 5
    heatmapByDept.get(dept)!.push({
      dimensionId: row.dimension_id,
      dimensionName: dimNameMap.get(row.dimension_id) ?? row.dimension_id,
      avgScore: belowThreshold ? null : (row.avg_score !== null ? Number(row.avg_score) : null),
      belowThreshold,
    })
  }

  const heatmapRows: HeatmapRow[] = Array.from(heatmapByDept.entries()).map(
    ([department, scores]) => ({ department, scores })
  )

  // ── 6. Trend data (last 5 closed surveys with derived_metrics, segment_type='overall') ─
  const { data: trendSurveysRaw, error: trendSurveyError } = await db
    .from('surveys')
    .select('id, title, closes_at')
    .eq('status', 'closed')
    .order('closes_at', { ascending: false })
    .limit(5)

  if (trendSurveyError) return { success: false, error: trendSurveyError.message }

  const trendSurveyIds: string[] = (
    (trendSurveysRaw as Array<{ id: string; title: string; closes_at: string | null }>) ?? []
  ).map((s) => s.id)

  const trendSurveyMap = new Map(
    (
      (trendSurveysRaw as Array<{ id: string; title: string; closes_at: string | null }>) ?? []
    ).map((s) => [s.id, s])
  )

  let trendPoints: TrendPoint[] = []

  if (trendSurveyIds.length > 0) {
    const { data: trendRaw, error: trendError } = await db
      .from('derived_metrics')
      .select('survey_id, dimension_id, avg_score, respondent_count')
      .in('survey_id', trendSurveyIds)
      .eq('segment_type', 'overall')

    if (trendError) return { success: false, error: trendError.message }

    trendPoints = (
      (trendRaw as Array<{
        survey_id: string
        dimension_id: string
        avg_score: number | null
        respondent_count: number
      }>) ?? []
    ).map((row) => {
      const s = trendSurveyMap.get(row.survey_id)
      const belowThreshold = Number(row.respondent_count) < 5
      return {
        surveyId: row.survey_id,
        surveyTitle: s?.title ?? '',
        closedAt: s?.closes_at ?? '',
        dimensionId: row.dimension_id,
        dimensionName: dimNameMap.get(row.dimension_id) ?? row.dimension_id,
        avgScore: belowThreshold ? null : (row.avg_score !== null ? Number(row.avg_score) : null),
        belowThreshold,
      }
    })
  }

  // ── 7. Qualitative themes ─────────────────────────────────────────────────
  const { data: themesRaw, error: themesError } = await db
    .from('qualitative_themes')
    .select('id, theme, tag_cluster, summary, is_positive')
    .eq('survey_id', targetSurveyId)

  if (themesError) return { success: false, error: themesError.message }

  const qualitativeThemes: QualitativeTheme[] = (
    (themesRaw as Array<{
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

  // ── 8. Public action items (from v_public_actions or fallback to action_items) ─
  let actionsRaw: unknown[] = []
  {
    const { data, error: viewErr } = await db
      .from('v_public_actions')
      .select('id, title, problem_statement, status, priority, target_date, success_criteria, department_name, survey_id')
      .or(`survey_id.eq.${targetSurveyId},survey_id.is.null`)

    if (!viewErr) {
      actionsRaw = data ?? []
    } else {
      // View not yet created — fall back to action_items directly
      const { data: fallback } = await db
        .from('action_items')
        .select('id, title, problem_statement, status, priority, target_date, success_criteria, department_id, survey_id')
        .eq('is_public', true)
        .or(`survey_id.eq.${targetSurveyId},survey_id.is.null`)
      actionsRaw = fallback ?? []
    }
  }

  const publicActions: PublicAction[] = (
    (actionsRaw as Array<{
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

  // ── 9. Available surveys (for survey selector dropdown) ────────────────────
  const { data: availSurveysRaw, error: availSurveysError } = await db
    .from('surveys')
    .select('id, title, closes_at')
    .eq('status', 'closed')
    .in(
      'id',
      db.from('derived_metrics').select('survey_id')
    )
    .order('closes_at', { ascending: false })

  if (availSurveysError) return { success: false, error: availSurveysError.message }

  const availableSurveys: { id: string; title: string; closedAt: string }[] = (
    (availSurveysRaw as Array<{ id: string; title: string; closes_at: string | null }>) ?? []
  ).map((s) => ({
    id: s.id,
    title: s.title,
    closedAt: s.closes_at ?? '',
  }))

  // ── 10. KPIs ───────────────────────────────────────────────────────────────
  const validScores = dimensionScores
    .map((d) => d.avgScore)
    .filter((s): s is number => s !== null)
  const overallHealthScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100
      : null

  // Participation rate: total responses / total eligible (profiles is_active=true)
  const { count: eligibleCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const participationRate =
    eligibleCount && eligibleCount > 0
      ? Math.round((totalResponses / eligibleCount) * 100)
      : 0

  const kpis: OrgKpis = {
    overallHealthScore,
    participationRate,
    totalResponses,
    surveyPeriod,
    dimensionsBelowThreshold: dimensionScores.filter((d) => d.belowThreshold).length,
    surveyId: survey.id,
    surveyTitle: survey.title,
  }

  return {
    success: true,
    data: {
      kpis,
      dimensionScores,
      heatmapRows,
      trendPoints,
      participationBreakdown,
      qualitativeThemes,
      publicActions,
      availableSurveys,
    },
  }
}

// ─── getManagerDashboardData ──────────────────────────────────────────────────

/**
 * Fetches team-level dashboard data for the current manager.
 * Dimension scores are gated by privacy threshold (respondent_count >= 5).
 * Participation count is always returned regardless of threshold.
 */
export async function getManagerDashboardData(): Promise<
  { success: true; data: ManagerDashboardData } | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  const role = normalizeRole(user.app_metadata?.role as string | undefined)
  if (role !== 'admin') {
    return { success: false, error: 'Forbidden' }
  }

  // ── 1. Find manager's profile ─────────────────────────────────────────────
  const { data: managerProfile, error: profileError } = await db
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError || !managerProfile) {
    return { success: false, error: 'Manager profile not found' }
  }

  const managerProfileId = (managerProfile as { id: string }).id

  // ── 2. Find manager's team ─────────────────────────────────────────────────
  const { data: teamRow, error: teamError } = await db
    .from('teams')
    .select('id, name')
    .eq('manager_id', managerProfileId)
    .single()

  if (teamError || !teamRow) {
    return {
      success: true,
      data: {
        teamName: null,
        participationCount: 0,
        totalTeamMembers: 0,
        dimensionScores: null,
        belowThreshold: true,
        surveyTitle: null,
      },
    }
  }

  const team = teamRow as { id: string; name: string }

  // ── 3. Find team members ──────────────────────────────────────────────────
  const { data: memberProfiles, error: membersError } = await db
    .from('profiles')
    .select('id')
    .eq('team_id', team.id)

  if (membersError) return { success: false, error: membersError.message }

  const members = (memberProfiles as Array<{ id: string }>) ?? []
  const totalTeamMembers = members.length
  const memberUserIds = members.map((m) => m.id) // profiles.id === auth.users.id

  // ── 4. Most recent closed+computed survey ─────────────────────────────────
  const { data: latestSurvey, error: latestError } = await db
    .from('surveys')
    .select('id, title')
    .eq('status', 'closed')
    .in(
      'id',
      db.from('derived_metrics').select('survey_id')
    )
    .order('closes_at', { ascending: false })
    .limit(1)
    .single()

  if (latestError || !latestSurvey) {
    return {
      success: true,
      data: {
        teamName: team.name,
        participationCount: 0,
        totalTeamMembers,
        dimensionScores: null,
        belowThreshold: true,
        surveyTitle: null,
      },
    }
  }

  const latestSurveyData = latestSurvey as { id: string; title: string }

  // ── 5. Count participation tokens for team members ────────────────────────
  let participationCount = 0

  if (memberUserIds.length > 0) {
    const { count, error: countError } = await db
      .from('participation_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', latestSurveyData.id)
      .in('user_id', memberUserIds)

    if (countError) return { success: false, error: countError.message }
    participationCount = count ?? 0
  }

  // ── 6. Privacy threshold check ────────────────────────────────────────────
  if (participationCount < 5) {
    return {
      success: true,
      data: {
        teamName: team.name,
        participationCount,
        totalTeamMembers,
        dimensionScores: null,
        belowThreshold: true,
        surveyTitle: latestSurveyData.title,
      },
    }
  }

  // ── 7. Fetch org-wide dimension scores as proxy for team view ────────────
  // Team-level segment requires future work — for now managers see org-wide scores
  // when their team meets the threshold (participationCount >= 5).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawDimScores, error: dimError } = await (supabase as any).rpc(
    'get_dimension_scores_for_survey',
    { p_survey_id: latestSurveyData.id, p_min_respondents: 5 }
  )

  if (dimError) return { success: false, error: dimError.message }

  const dimensionScores: DimensionScore[] = (
    (rawDimScores as Array<{
      dimension_id: string
      dimension_name: string
      dimension_slug: string
      avg_score: number | null
      favorable_pct: number | null
      neutral_pct: number | null
      unfavorable_pct: number | null
      respondent_count: number
      below_threshold: boolean
    }>) ?? []
  ).map((row) => ({
    dimensionId: row.dimension_id,
    dimensionName: row.dimension_name,
    dimensionSlug: row.dimension_slug,
    avgScore: row.avg_score,
    favorablePct: row.favorable_pct,
    neutralPct: row.neutral_pct,
    unfavorablePct: row.unfavorable_pct,
    respondentCount: Number(row.respondent_count),
    belowThreshold: row.below_threshold,
  }))

  return {
    success: true,
    data: {
      teamName: team.name,
      participationCount,
      totalTeamMembers,
      dimensionScores,
      belowThreshold: false,
      surveyTitle: latestSurveyData.title,
    },
  }
}

// ─── getPublicResultsData ─────────────────────────────────────────────────────

/**
 * Fetches company-wide aggregates for the public /results page.
 * No role restriction — any authenticated user can call this.
 * If cycleId is provided and a published snapshot exists, returns snapshot data.
 * Returns hasData=false if no closed+computed survey exists.
 */
export async function getPublicResultsData(
  cycleId?: string | null
): Promise<{ success: true; data: PublicResultsData } | { success: false; error: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // ── 0. If cycleId provided, try to load from published snapshot ────────────
  if (cycleId) {
    const { data: snapData, error: snapError } = await db
      .from('publication_snapshots')
      .select('snapshot_data')
      .eq('survey_id', cycleId)
      .single()

    if (!snapError && snapData) {
      const snap = (snapData as { snapshot_data: Record<string, unknown> }).snapshot_data
      return {
        success: true,
        data: {
          hasData: true,
          surveyTitle: (snap.surveyTitle as string) ?? null,
          surveyClosedAt: null,
          kpis: {
            overallHealthScore: null,
            participationRate: (snap.participationRate as number) ?? 0,
            totalResponses: (snap.totalResponses as number) ?? 0,
          },
          dimensionScores: (snap.dimensionScores as DimensionScore[]) ?? [],
          qualitativeThemes: (snap.qualitativeThemes as QualitativeTheme[]) ?? [],
          publicActions: (snap.publicActions as PublicAction[]) ?? [],
        },
      }
    }
    // If snapshot not found for this cycleId, fall through to live path
  }

  // ── 1. Most recent closed+computed survey ─────────────────────────────────
  // Fetch survey_ids that have derived_metrics first (subqueries not supported in supabase-js)
  const { data: surveyIdsWithMetrics } = await db
    .from('derived_metrics')
    .select('survey_id')
  const surveyIdsArr = [...new Set(
    ((surveyIdsWithMetrics as Array<{ survey_id: string }>) ?? []).map((r) => r.survey_id)
  )]

  const latestQuery = db
    .from('surveys')
    .select('id, title, closes_at')
    .eq('status', 'closed')
    .order('closes_at', { ascending: false })
    .limit(1)

  if (surveyIdsArr.length > 0) {
    latestQuery.in('id', surveyIdsArr)
  }

  const { data: latestSurveyRaw, error: latestError } = await latestQuery.single()

  if (latestError || !latestSurveyRaw) {
    return {
      success: true,
      data: {
        hasData: false,
        surveyTitle: null,
        surveyClosedAt: null,
        kpis: null,
        dimensionScores: [],
        qualitativeThemes: [],
        publicActions: [],
      },
    }
  }

  const latestSurvey = latestSurveyRaw as {
    id: string
    title: string
    closes_at: string | null
  }

  // ── 2. Company-wide dimension scores ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawDimScores, error: dimError } = await (supabase as any).rpc(
    'get_dimension_scores_for_survey',
    { p_survey_id: latestSurvey.id, p_min_respondents: 5 }
  )

  if (dimError) return { success: false, error: dimError.message }

  const dimensionScores: DimensionScore[] = (
    (rawDimScores as Array<{
      dimension_id: string
      dimension_name: string
      dimension_slug: string
      avg_score: number | null
      favorable_pct: number | null
      neutral_pct: number | null
      unfavorable_pct: number | null
      respondent_count: number
      below_threshold: boolean
    }>) ?? []
  ).map((row) => ({
    dimensionId: row.dimension_id,
    dimensionName: row.dimension_name,
    dimensionSlug: row.dimension_slug,
    avgScore: row.avg_score,
    favorablePct: row.favorable_pct,
    neutralPct: row.neutral_pct,
    unfavorablePct: row.unfavorable_pct,
    respondentCount: Number(row.respondent_count),
    belowThreshold: row.below_threshold,
  }))

  // ── 3. Participation (total, supports old+new view schema) ───────────────
  const { data: partRaw } = await db
    .from('v_participation_rates')
    .select('*')
    .eq('survey_id', latestSurvey.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalResponses = ((partRaw as any[]) ?? [])
    .reduce((sum: number, r: any) => sum + Number(r.token_count ?? r.submitted_count ?? 0), 0)

  const { count: eligibleCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const participationRate =
    eligibleCount && eligibleCount > 0
      ? Math.round((totalResponses / eligibleCount) * 100)
      : 0

  const validScores = dimensionScores
    .map((d) => d.avgScore)
    .filter((s): s is number => s !== null)
  const overallHealthScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100
      : null

  // ── 4. Qualitative themes ─────────────────────────────────────────────────
  const { data: themesRaw, error: themesError } = await db
    .from('qualitative_themes')
    .select('id, theme, tag_cluster, summary, is_positive')
    .eq('survey_id', latestSurvey.id)

  if (themesError) return { success: false, error: themesError.message }

  const qualitativeThemes: QualitativeTheme[] = (
    (themesRaw as Array<{
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

  // ── 5. Public action items ─────────────────────────────────────────────────
  let actionsRaw: unknown[] = []
  {
    const { data, error: viewErr } = await db
      .from('v_public_actions')
      .select('id, title, problem_statement, status, priority, target_date, success_criteria, department_name, survey_id')
      .or(`survey_id.eq.${latestSurvey.id},survey_id.is.null`)
    if (!viewErr) {
      actionsRaw = data ?? []
    } else {
      const { data: fallback } = await db
        .from('action_items')
        .select('id, title, problem_statement, status, priority, target_date, success_criteria, department_id, survey_id')
        .eq('is_public', true)
        .or(`survey_id.eq.${latestSurvey.id},survey_id.is.null`)
      actionsRaw = fallback ?? []
    }
  }

  const publicActions: PublicAction[] = (
    (actionsRaw as Array<{
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

  return {
    success: true,
    data: {
      hasData: true,
      surveyTitle: latestSurvey.title,
      surveyClosedAt: latestSurvey.closes_at,
      kpis: {
        overallHealthScore,
        participationRate,
        totalResponses,
      },
      dimensionScores,
      qualitativeThemes,
      publicActions,
    },
  }
}
