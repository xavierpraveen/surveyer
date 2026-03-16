import { getPublicResultsData } from '@/lib/actions/analytics'
import { getPublishedCycles } from '@/lib/actions/publication'
import DimensionBarChart from '@/components/analytics/DimensionBarChart'
import QualitativeThemePanel from '@/components/analytics/QualitativeThemePanel'
import CycleSelector from '@/components/results/CycleSelector'
import type { PublicAction } from '@/lib/types/analytics'

// ─── Page props ───────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ cycle?: string }>
}

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
    { label: 'In Progress', colorClass: 'bg-warning-muted text-warning-text', actions: inProgress },
    { label: 'Planned', colorClass: 'bg-brand-muted text-brand-text', actions: planned },
    { label: 'Blocked', colorClass: 'bg-error-muted text-error-text', actions: blocked },
    { label: 'Completed', colorClass: 'bg-success-muted text-success-text', actions: completed },
  ]

  // Only return groups that have actions
  return groups.filter((g) => g.actions.length > 0)
}

// ─── Health score color ────────────────────────────────────────────────────────

function healthScoreColor(score: number): string {
  if (score >= 4.0) return 'text-success'
  if (score >= 3.0) return 'text-warning'
  return 'text-error'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage({ searchParams }: PageProps) {
  const { cycle } = await searchParams

  // Fetch published cycles for the selector and live data in parallel
  const [publishedCyclesResult, result] = await Promise.all([
    getPublishedCycles(),
    getPublicResultsData(cycle || null),
  ])

  const publishedCycles = publishedCyclesResult.success ? publishedCyclesResult.data : []

  // Error or no data state
  if (!result.success || !result.data.hasData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-extrabold tracking-snug text-fg mb-2">Company Results</h1>
          <p className="text-fg-muted">
            Results will appear here after the first survey cycle closes and metrics are computed.
          </p>
          {publishedCycles.length > 0 && (
            <div className="mt-6">
              <CycleSelector
                cycles={publishedCycles.map((c) => ({ ...c, isPublished: true }))}
                currentCycleId={cycle || null}
                liveSurveyId={null}
              />
            </div>
          )}
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
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto p-8">

        {/* Cycle selector */}
        {publishedCycles.length > 0 && (
          <div className="mb-4">
            <CycleSelector
              cycles={publishedCycles.map((c) => ({ ...c, isPublished: true }))}
              currentCycleId={cycle || null}
              liveSurveyId={null}
            />
          </div>
        )}

        {/* Hero section */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold tracking-snug text-fg">Company Survey Results</h1>
            {(surveyTitle || closedDateLabel) && (
              <p className="text-sm text-fg-muted mt-1">
                {surveyTitle}
                {surveyTitle && closedDateLabel && ' · '}
                {closedDateLabel}
              </p>
            )}
            {cycle && (
              <span className="inline-flex items-center mt-2 text-xs bg-success-muted text-success-text font-semibold px-2 py-0.5 rounded-full">
                Published
              </span>
            )}
          </div>

          {/* KPI row */}
          {kpis && (
            <div className="flex flex-wrap gap-6 pt-4 border-t border-border">
              {/* Overall Health Score */}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em] mb-1">
                  Overall Health Score
                </span>
                {kpis.overallHealthScore !== null ? (
                  <span
                    className={`text-3xl font-bold tabular-nums ${healthScoreColor(kpis.overallHealthScore)}`}
                  >
                    {kpis.overallHealthScore.toFixed(1)}
                    <span className="text-lg font-normal text-fg-subtle"> / 5</span>
                  </span>
                ) : (
                  <span className="text-fg-subtle font-mono text-xl">---</span>
                )}
              </div>

              {/* Participation Rate */}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em] mb-1">
                  Participation Rate
                </span>
                <span className="text-3xl font-bold text-fg tabular-nums">
                  {kpis.participationRate}
                  <span className="text-lg font-normal text-fg-subtle">% participated</span>
                </span>
              </div>

              {/* Total Responses */}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em] mb-1">
                  Total Responses
                </span>
                <span className="text-3xl font-bold text-fg tabular-nums">
                  {kpis.totalResponses}
                  <span className="text-lg font-normal text-fg-subtle"> responses</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section: Dimension Scores */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold tracking-snug text-fg mb-4">Dimension Scores</h2>
          {dimensionScores.length === 0 ? (
            <p className="text-fg-muted text-sm">No dimension scores available.</p>
          ) : (
            <DimensionBarChart scores={dimensionScores} />
          )}
        </div>

        {/* Section: Qualitative Themes */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold tracking-snug text-fg mb-4">Qualitative Themes</h2>
          <QualitativeThemePanel themes={qualitativeThemes} />
        </div>

        {/* Section: Committed Actions */}
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold tracking-snug text-fg mb-4">What We&apos;re Doing About It</h2>

          {publicActions.length === 0 ? (
            <p className="text-fg-muted text-sm">No public action items yet.</p>
          ) : (
            <div>
              {actionGroups.map((group) => (
                <div key={group.label} className="mb-6 last:mb-0">
                  <h3 className="text-base font-bold tracking-tight text-fg mb-3 flex items-center gap-2">
                    {group.label}
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 font-semibold ${group.colorClass}`}
                    >
                      {group.actions.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {group.actions.map((action) => (
                      <div
                        key={action.id}
                        className="bg-surface border border-border rounded-lg p-4"
                      >
                        <p className="font-medium text-fg">{action.title}</p>
                        {action.problemStatement && (
                          <p className="text-sm text-fg-muted mt-1 line-clamp-2">
                            {action.problemStatement}
                          </p>
                        )}
                        {(action.departmentName || action.targetDate) && (
                          <div className="flex items-center gap-3 mt-2 text-xs text-fg-subtle">
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
