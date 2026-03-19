// Analytics TypeScript type contracts
// Consumed by leadership dashboard, manager dashboard, and public results page RSCs

// Dashboard filter state (matches nuqs URL params)
export interface DashboardFilters {
  surveyId: string | null
  department: string | null
  role: string | null
  tenureBand: string | null
}

// Per-dimension score row (from get_dimension_scores_for_survey RPC)
export interface DimensionScore {
  dimensionId: string
  dimensionName: string
  dimensionSlug: string
  avgScore: number | null       // null when below_threshold = true
  favorablePct: number | null
  neutralPct: number | null
  unfavorablePct: number | null
  respondentCount: number
  belowThreshold: boolean
}

// Overall org KPIs shown in the KPI strip
export interface OrgKpis {
  overallHealthScore: number | null   // avg of all dimension avg_scores
  participationRate: number           // 0–100 percentage
  totalResponses: number
  pendingResponses: number
  completionDeltaPct: number | null   // current participation - previous cycle participation
  completedActionPct: number | null   // completed actions out of all public actions
  surveyPeriod: string                // e.g. "Q1 2026"
  dimensionsBelowThreshold: number
  surveyId: string
  surveyTitle: string
}

// One row in the department heatmap (one per department)
export interface HeatmapRow {
  department: string
  scores: {
    dimensionId: string
    dimensionName: string
    avgScore: number | null
    belowThreshold: boolean
  }[]
}

// One data point in the trend chart
export interface TrendPoint {
  surveyId: string
  surveyTitle: string
  closedAt: string               // ISO date string
  dimensionId: string
  dimensionName: string
  avgScore: number | null
  belowThreshold: boolean
}

// Participation broken down by department
export interface ParticipationBreakdown {
  department: string
  departmentId: string | null
  respondentCount: number
}

// Qualitative theme (from qualitative_themes table)
export interface QualitativeTheme {
  id: string
  theme: string
  tagCluster: string[]
  summary: string | null
  isPositive: boolean            // true = suggestion, false = issue
  tagCount: number               // tag_cluster.length as proxy for frequency
}

// Action item for public display (from v_public_actions view)
export interface PublicAction {
  id: string
  title: string
  problemStatement: string | null
  status: 'identified' | 'planned' | 'in_progress' | 'blocked' | 'completed'
  priority: string | null
  targetDate: string | null
  successCriteria: string | null
  departmentName: string | null
}

export interface ImprovementArea {
  dimensionId: string
  dimensionName: string
  dimensionSlug: string
  avgScore: number
  respondentCount: number
  healthGap: number
  priorityScore: number
  urgency: 'high' | 'medium' | 'low'
  rationale: string
}

export interface ImprovementInsights {
  priorityAreas: ImprovementArea[]
  criticalAreas: ImprovementArea[]
  strengthAreas: ImprovementArea[]
  recommendedFocus: ImprovementArea[]
}

// Full payload returned to leadership dashboard RSC
export interface LeadershipDashboardData {
  kpis: OrgKpis
  dimensionScores: DimensionScore[]
  heatmapRows: HeatmapRow[]
  trendPoints: TrendPoint[]
  participationBreakdown: ParticipationBreakdown[]
  qualitativeThemes: QualitativeTheme[]
  publicActions: PublicAction[]           // read-only preview of public action items (is_public=true)
  availableSurveys: { id: string; title: string; closedAt: string }[]
}

// Manager dashboard payload
export interface ManagerDashboardData {
  teamName: string | null
  participationCount: number     // always visible
  totalTeamMembers: number       // denominator for participation %
  dimensionScores: DimensionScore[] | null  // null if team < 5 respondents
  belowThreshold: boolean
  surveyTitle: string | null
}

// Public /results page payload
export interface PublicResultsData {
  hasData: boolean               // false = no closed+computed survey yet
  surveyTitle: string | null
  surveyClosedAt: string | null
  kpis: Pick<OrgKpis, 'overallHealthScore' | 'participationRate' | 'totalResponses'> | null
  dimensionScores: DimensionScore[]
  improvementInsights: ImprovementInsights | null
  qualitativeThemes: QualitativeTheme[]
  publicActions: PublicAction[]
}
