'use client'

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
  Legend,
} from 'recharts'
import type { ImprovementInsights } from '@/lib/types/analytics'

interface ImprovementInsightsPanelProps {
  insights: ImprovementInsights | null
  embedded?: boolean
  title?: string
}

type MatrixPoint = {
  name: string
  score: number
  respondents: number
  priority: number
  urgency: 'high' | 'medium' | 'low'
}

function urgencyClasses(urgency: 'high' | 'medium' | 'low'): string {
  if (urgency === 'high') return 'bg-error-muted text-error-text'
  if (urgency === 'medium') return 'bg-warning-muted text-warning-text'
  return 'bg-success-muted text-success-text'
}

function urgencyColor(urgency: 'high' | 'medium' | 'low'): string {
  if (urgency === 'high') return '#EF4444'
  if (urgency === 'medium') return '#F59E0B'
  return '#10B981'
}

interface MatrixTooltipProps {
  active?: boolean
  payload?: Array<{ payload: MatrixPoint }>
}

function MatrixTooltip({ active, payload }: MatrixTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="bg-surface border border-border rounded-md shadow-md p-3 text-sm">
      <p className="font-semibold text-fg mb-1">{point.name}</p>
      <p className="text-fg-muted text-xs">Score: {point.score.toFixed(1)} / 5</p>
      <p className="text-fg-muted text-xs">Responses: {point.respondents}</p>
      <p className="text-fg-muted text-xs">Priority: {point.priority.toFixed(1)}</p>
    </div>
  )
}

export default function ImprovementInsightsPanel({
  insights,
  embedded = false,
  title = 'Where We Should Improve First',
}: ImprovementInsightsPanelProps) {
  if (!insights || insights.priorityAreas.length === 0) {
    return (
      <div className={embedded ? '' : 'bg-surface border border-border rounded-lg shadow-sm p-6'}>
        <h2 className="text-xl font-bold tracking-snug text-fg mb-2">{title}</h2>
        <p className="text-sm text-fg-muted">
          No actionable improvement insights yet. Scores may be hidden by privacy thresholds.
        </p>
      </div>
    )
  }

  const matrixData: MatrixPoint[] = insights.priorityAreas.map((a) => ({
    name: a.dimensionName,
    score: a.avgScore,
    respondents: a.respondentCount,
    priority: a.priorityScore,
    urgency: a.urgency,
  }))
  const highPriority = matrixData.filter((d) => d.urgency === 'high')
  const mediumPriority = matrixData.filter((d) => d.urgency === 'medium')
  const lowPriority = matrixData.filter((d) => d.urgency === 'low')
  const topPriorityItems = insights.priorityAreas.slice(0, 8)

  const urgencyBreakdown = [
    { name: 'High', value: highPriority.length, color: urgencyColor('high') },
    { name: 'Medium', value: mediumPriority.length, color: urgencyColor('medium') },
    { name: 'Low', value: lowPriority.length, color: urgencyColor('low') },
  ].filter((x) => x.value > 0)

  return (
    <div className={embedded ? '' : 'bg-surface border border-border rounded-lg shadow-sm p-6 mb-6'}>
      <h2 className="text-xl font-bold tracking-snug text-fg mb-4">{title}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {insights.recommendedFocus.map((area, idx) => (
          <div key={area.dimensionId} className="border border-border rounded-lg p-4 bg-surface-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-fg">#{idx + 1} {area.dimensionName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyClasses(area.urgency)}`}>
                {area.urgency.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-fg-muted">Score: {area.avgScore.toFixed(1)} / 5</p>
            <p className="text-xs text-fg-muted">Responses: {area.respondentCount}</p>
            <p className="text-xs text-fg-muted">Priority: {area.priorityScore.toFixed(1)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="h-80 bg-surface border border-border rounded-lg p-3 xl:col-span-2">
          <p className="text-sm font-semibold text-fg mb-2">Priority Matrix (Impact vs Score)</p>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 12, bottom: 16, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                type="number"
                dataKey="respondents"
                name="Responses"
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <YAxis
                type="number"
                dataKey="score"
                domain={[1, 5]}
                name="Avg Score"
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <ZAxis type="number" dataKey="priority" range={[60, 280]} />
              <Tooltip content={<MatrixTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Scatter data={highPriority} fill={urgencyColor('high')} name="High urgency" />
              <Scatter data={mediumPriority} fill={urgencyColor('medium')} name="Medium urgency" />
              <Scatter data={lowPriority} fill={urgencyColor('low')} name="Low urgency" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="h-80 bg-surface border border-border rounded-lg p-3">
          <p className="text-sm font-semibold text-fg mb-2">Urgency Distribution</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={urgencyBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={82}
                paddingAngle={2}
              >
                {urgencyBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg mb-5 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-2">
          <p className="text-sm font-semibold text-fg">Top Improvement Priorities</p>
          <p className="text-xs text-fg-muted mt-0.5">Ranked by urgency and impact score</p>
        </div>

        <div className="divide-y divide-border">
          {topPriorityItems.map((area, idx) => {
            const normalizedPriority = Math.max(0, Math.min(100, area.priorityScore))
            return (
              <div key={area.dimensionId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0 flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-fg-muted">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg leading-5 break-words">{area.dimensionName}</p>
                      <p className="text-xs text-fg-muted mt-0.5">
                        Score {area.avgScore.toFixed(1)} / 5 • {area.respondentCount} responses
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${urgencyClasses(area.urgency)}`}>
                      {area.urgency.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-fg">{area.priorityScore.toFixed(1)}</span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${normalizedPriority}%`,
                      backgroundColor: urgencyColor(area.urgency),
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm font-semibold text-fg mb-2">Critical Areas (&lt; 3.5)</p>
          {insights.criticalAreas.length === 0 ? (
            <p className="text-xs text-fg-muted">No critical areas in this cycle.</p>
          ) : (
            <ul className="space-y-1">
              {insights.criticalAreas.slice(0, 5).map((a) => (
                <li key={a.dimensionId} className="text-sm text-fg flex items-center justify-between">
                  <span>{a.dimensionName}</span>
                  <span className="font-semibold">{a.avgScore.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm font-semibold text-fg mb-2">Strong Areas (&ge; 4.2)</p>
          {insights.strengthAreas.length === 0 ? (
            <p className="text-xs text-fg-muted">No strong areas yet.</p>
          ) : (
            <ul className="space-y-1">
              {insights.strengthAreas.slice(0, 5).map((a) => (
                <li key={a.dimensionId} className="text-sm text-fg flex items-center justify-between">
                  <span>{a.dimensionName}</span>
                  <span className="font-semibold">{a.avgScore.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
