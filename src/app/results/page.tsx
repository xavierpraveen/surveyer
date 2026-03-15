import { getPublicResultsData } from '@/lib/actions/analytics'
import DimensionBarChart from '@/components/analytics/DimensionBarChart'
import QualitativeThemePanel from '@/components/analytics/QualitativeThemePanel'
import type { PublicAction } from '@/lib/types/analytics'

// ─── Action status grouping ───────────────────────────────────────────────────

type ActionGroup = {
  label: string
  colorClass: string
  actions: PublicAction[]
}

function groupActionsByStatus(actions: PublicAction[]): ActionGroup[] {
  const inProgress: PublicAction[] = []
  const planned: PublicAction[] = []
  const blocked: PublicAction[] = []
  const completed: PublicAction[] = []

  for (const action of actions) {
    if (action.status === 'in_progress') {
      inProgress.push(action)
    } else if (action.status === 'identified' || action.status === 'planned') {
      planned.push(action)
    } else if (action.status === 'blocked') {
      blocked.push(action)
    } else if (action.status === 'completed') {
      completed.push(action)
    }
  }

  // Order: In Progress, Planned, Blocked, Completed
  const groups: ActionGroup[] = [
    { label: 'In Progress', colorClass: 'bg-blue-100 text-blue-700', actions: inProgress },
    { label: 'Planned', colorClass: 'bg-gray-100 text-gray-600', actions: planned },
    { label: 'Blocked', colorClass: 'bg-red-100 text-red-700', actions: blocked },
    { label: 'Completed', colorClass: 'bg-green-100 text-green-700', actions: completed },
  ]

  // Only return groups that have actions
  return groups.filter((g) => g.actions.length > 0)
}

// ─── Health score color ────────────────────────────────────────────────────────

function healthScoreColor(score: number): string {
  if (score >= 4.0) return 'text-green-600'
  if (score >= 3.0) return 'text-yellow-600'
  return 'text-red-600'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage() {
  const result = await getPublicResultsData()

  // Error or no data state
  if (!result.success || !result.data.hasData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Company Results</h1>
          <p className="text-gray-500">
            Results will appear here after the first survey cycle closes and metrics are computed.
          </p>
        </div>
      </div>
    )
  }

  const { surveyTitle, surveyClosedAt, kpis, dimensionScores, qualitativeThemes, publicActions } =
    result.data

  const closedDateLabel = surveyClosedAt
    ? `Closed ${new Date(surveyClosedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}`
    : null

  const actionGroups = groupActionsByStatus(publicActions)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Company Survey Results</h1>
            {(surveyTitle || closedDateLabel) && (
              <p className="text-sm text-gray-500 mt-1">
                {surveyTitle}
                {surveyTitle && closedDateLabel && ' · '}
                {closedDateLabel}
              </p>
            )}
          </div>

          {/* KPI row */}
          {kpis && (
            <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100">
              {/* Overall Health Score */}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Overall Health Score
                </span>
                {kpis.overallHealthScore !== null ? (
                  <span
                    className={`text-3xl font-bold ${healthScoreColor(kpis.overallHealthScore)}`}
                  >
                    {kpis.overallHealthScore.toFixed(1)}
                    <span className="text-lg font-normal text-gray-400"> / 5</span>
                  </span>
                ) : (
                  <span className="text-gray-400 font-mono text-xl">---</span>
                )}
              </div>

              {/* Participation Rate */}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Participation Rate
                </span>
                <span className="text-3xl font-bold text-gray-900">
                  {kpis.participationRate}
                  <span className="text-lg font-normal text-gray-400">% participated</span>
                </span>
              </div>

              {/* Total Responses */}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Total Responses
                </span>
                <span className="text-3xl font-bold text-gray-900">
                  {kpis.totalResponses}
                  <span className="text-lg font-normal text-gray-400"> responses</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section: Dimension Scores */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dimension Scores</h2>
          {dimensionScores.length === 0 ? (
            <p className="text-gray-500 text-sm">No dimension scores available.</p>
          ) : (
            <DimensionBarChart scores={dimensionScores} />
          )}
        </div>

        {/* Section: Qualitative Themes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Qualitative Themes</h2>
          <QualitativeThemePanel themes={qualitativeThemes} />
        </div>

        {/* Section: Committed Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">What We&apos;re Doing About It</h2>

          {publicActions.length === 0 ? (
            <p className="text-gray-500 text-sm">No public action items yet.</p>
          ) : (
            <div>
              {actionGroups.map((group) => (
                <div key={group.label} className="mb-6 last:mb-0">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    {group.label}
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${group.colorClass}`}
                    >
                      {group.actions.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {group.actions.map((action) => (
                      <div
                        key={action.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <p className="font-medium text-gray-900">{action.title}</p>
                        {action.problemStatement && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {action.problemStatement}
                          </p>
                        )}
                        {(action.departmentName || action.targetDate) && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            {action.departmentName && <span>{action.departmentName}</span>}
                            {action.departmentName && action.targetDate && (
                              <span>·</span>
                            )}
                            {action.targetDate && (
                              <span>
                                Target:{' '}
                                {new Date(action.targetDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
