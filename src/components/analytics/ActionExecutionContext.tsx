import type { PublicAction } from '@/lib/types/analytics'

interface ActionExecutionContextProps {
  actions: PublicAction[]
  surveyClosedAt?: string | null
}

type ActionWithDate = PublicAction & { parsedDate: Date | null }

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ActionExecutionContext({
  actions,
  surveyClosedAt,
}: ActionExecutionContextProps) {
  const total = actions.length
  const completed = actions.filter((a) => a.status === 'completed').length
  const blocked = actions.filter((a) => a.status === 'blocked').length
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0

  const now = new Date()
  const dueWindow = new Date(now)
  dueWindow.setDate(dueWindow.getDate() + 30)

  const nonCompleted = actions.filter((a) => a.status !== 'completed')
  const normalized: ActionWithDate[] = nonCompleted.map((a) => ({
    ...a,
    parsedDate: parseDate(a.targetDate),
  }))

  const dueSoon = normalized.filter((a) => a.parsedDate && a.parsedDate >= now && a.parsedDate <= dueWindow).length

  const blockers = actions
    .filter((a) => a.status === 'blocked')
    .map((a) => ({ ...a, parsedDate: parseDate(a.targetDate) }))
    .sort((a, b) => {
      if (a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime()
      if (a.parsedDate) return -1
      if (b.parsedDate) return 1
      return a.title.localeCompare(b.title)
    })
    .slice(0, 3)

  const immediateFocus = normalized
    .slice()
    .sort((a, b) => {
      if (a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime()
      if (a.parsedDate) return -1
      if (b.parsedDate) return 1
      return a.title.localeCompare(b.title)
    })
    .slice(0, 3)

  const activeDepartments = new Set(
    actions
      .map((a) => a.departmentName)
      .filter((d): d is string => typeof d === 'string' && d.length > 0)
  ).size

  const freshness = surveyClosedAt
    ? `Based on latest published cycle actions · ${formatDate(new Date(surveyClosedAt))}`
    : 'Based on latest published cycle actions'

  if (total === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-subtle mb-1">What This Means</p>
        <p className="text-sm text-fg-muted">
          This chart shows how commitments are progressing this cycle, so teams can prioritize blockers and near-term delivery risk.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Completed</p>
          <p className="text-lg font-bold tabular-nums text-success-text">{completedPct}%</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Blocked</p>
          <p className="text-lg font-bold tabular-nums text-error-text">{blocked}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">Due in 30d</p>
          <p className="text-lg font-bold tabular-nums text-warning-text">{dueSoon}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-subtle mb-2">Top Blockers</p>
          {blockers.length === 0 ? (
            <p className="text-sm text-fg-muted">No blocked actions currently.</p>
          ) : (
            <ul className="space-y-1.5">
              {blockers.map((a) => (
                <li key={a.id} className="text-sm text-fg">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-fg-subtle"> · {a.departmentName ?? 'Unassigned'}</span>
                  {a.parsedDate && <span className="text-fg-subtle"> · due {formatDate(a.parsedDate)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-subtle mb-2">Immediate Focus</p>
          {immediateFocus.length === 0 ? (
            <p className="text-sm text-fg-muted">No active actions to prioritize.</p>
          ) : (
            <ol className="space-y-1.5">
              {immediateFocus.map((a, idx) => (
                <li key={a.id} className="text-sm text-fg">
                  <span className="font-semibold mr-1">{idx + 1}.</span>
                  <span className="font-medium">{a.title}</span>
                  {a.parsedDate && <span className="text-fg-subtle"> · due {formatDate(a.parsedDate)}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="text-xs text-fg-subtle border-t border-border pt-2">
        Departments with active commitments: <span className="font-semibold text-fg">{activeDepartments}</span>
        <span className="mx-2">·</span>
        {freshness}
      </div>
    </div>
  )
}

