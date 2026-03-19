import { getPublicResultsData } from '@/lib/actions/analytics'
import DimensionBarChart from '@/components/analytics/DimensionBarChart'
import QualitativeThemePanel from '@/components/analytics/QualitativeThemePanel'
import ImprovementInsightsPanel from '@/components/analytics/ImprovementInsightsPanel'
import AnalyticsPanel from '@/components/analytics/AnalyticsPanel'
import ActionStatusChart from '@/components/analytics/ActionStatusChart'
import ActionExecutionContext from '@/components/analytics/ActionExecutionContext'
import ExportCsvButton from '@/components/results/ExportCsvButton'
import type { PublicAction } from '@/lib/types/analytics'
import Link from 'next/link'

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

  const groups: ActionGroup[] = [
    { label: 'In Progress', colorClass: 'bg-warning-muted text-warning-text', actions: inProgress },
    { label: 'Planned', colorClass: 'bg-brand-muted text-brand-text', actions: planned },
    { label: 'Blocked', colorClass: 'bg-error-muted text-error-text', actions: blocked },
    { label: 'Completed', colorClass: 'bg-success-muted text-success-text', actions: completed },
  ]

  return groups.filter((g) => g.actions.length > 0)
}

function healthScoreColor(score: number): string {
  if (score >= 4.0) return 'text-success'
  if (score >= 3.0) return 'text-warning'
  return 'text-error'
}

function highUrgencyCount(actions: PublicAction[]): number {
  return actions.filter((a) => a.status === 'blocked' || a.status === 'in_progress').length
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getPublicResultsData(id)

  if (!result.success || !result.data.hasData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-text hover:underline mb-6"
          >
            <span aria-hidden="true">←</span>
            <span>All Results</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-snug text-fg mb-2">Survey Results</h1>
          <p className="text-fg-muted">
            Results are not available for this survey yet.
          </p>
        </div>
      </div>
    )
  }

  const { surveyTitle, surveyClosedAt, kpis, dimensionScores, improvementInsights, qualitativeThemes, publicActions } =
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
      <div className="max-w-7xl mx-auto p-6 md:p-8">

        <div className="mb-4">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-text hover:underline"
          >
            <span aria-hidden="true">←</span>
            <span>All Results</span>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-snug text-fg">Company Survey Results</h1>
              {(surveyTitle || closedDateLabel) && (
                <p className="text-sm text-fg-muted mt-1">
                  {surveyTitle}
                  {surveyTitle && closedDateLabel && ' · '}
                  {closedDateLabel}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ExportCsvButton cycleId={id} />
            </div>
          </div>
          {kpis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              <div className="bg-white/85 border border-border rounded-xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">Overall Health</p>
                <p className={`text-3xl font-extrabold tabular-nums ${kpis.overallHealthScore !== null ? healthScoreColor(kpis.overallHealthScore) : 'text-fg-subtle'}`}>
                  {kpis.overallHealthScore !== null ? kpis.overallHealthScore.toFixed(1) : '—'}
                </p>
              </div>
              <div className="bg-white/85 border border-border rounded-xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">Participation</p>
                <p className="text-3xl font-extrabold tabular-nums text-fg">{kpis.participationRate}%</p>
              </div>
              <div className="bg-white/85 border border-border rounded-xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">Responses</p>
                <p className="text-3xl font-extrabold tabular-nums text-fg">{kpis.totalResponses}</p>
              </div>
              <div className="bg-white/85 border border-border rounded-xl p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">Execution Risk</p>
                <p className="text-3xl font-extrabold tabular-nums text-warning">{highUrgencyCount(publicActions)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <div className="xl:col-span-2">
            <AnalyticsPanel
              title="Priority Improvement Analysis"
              subtitle="Lowest score + highest impact areas to focus first."
            >
              <ImprovementInsightsPanel insights={improvementInsights} embedded />
            </AnalyticsPanel>
          </div>
          <AnalyticsPanel
            title="Action Execution Signal"
            subtitle="Status mix of committed actions from this cycle."
          >
            <ActionStatusChart actions={publicActions} />
            <ActionExecutionContext actions={publicActions} surveyClosedAt={surveyClosedAt} />
          </AnalyticsPanel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <AnalyticsPanel title="Dimension Scores" subtitle="Comparative scores across organizational dimensions.">
            {dimensionScores.length === 0 ? (
              <p className="text-fg-muted text-sm">No dimension scores available.</p>
            ) : (
              <DimensionBarChart scores={dimensionScores} />
            )}
          </AnalyticsPanel>
          <AnalyticsPanel title="Qualitative Themes" subtitle="Most frequent open-text themes from respondents.">
            <QualitativeThemePanel themes={qualitativeThemes} embedded />
          </AnalyticsPanel>
        </div>

        <AnalyticsPanel
          title="What We&apos;re Doing About It"
          subtitle="Current public commitments grouped by execution stage."
        >
          {publicActions.length === 0 ? (
            <p className="text-fg-muted text-sm">No public action items yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {actionGroups.map((group) => (
                <div key={group.label} className="border border-border rounded-lg p-4 bg-surface-2">
                  <h3 className="text-sm font-bold tracking-tight text-fg mb-3 flex items-center gap-2">
                    {group.label}
                    <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${group.colorClass}`}>
                      {group.actions.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {group.actions.slice(0, 4).map((action) => (
                      <div key={action.id} className="bg-surface border border-border rounded-lg p-3">
                        <p className="font-medium text-fg text-sm">{action.title}</p>
                        {action.problemStatement && (
                          <p className="text-xs text-fg-muted mt-1 line-clamp-2">{action.problemStatement}</p>
                        )}
                        {(action.departmentName || action.targetDate) && (
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-fg-subtle">
                            {action.departmentName && <span>{action.departmentName}</span>}
                            {action.departmentName && action.targetDate && <span>·</span>}
                            {action.targetDate && (
                              <span>
                                Target {new Date(action.targetDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
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
        </AnalyticsPanel>
      </div>
    </div>
  )
}
