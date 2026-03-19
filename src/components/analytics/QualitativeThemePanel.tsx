import type { QualitativeTheme } from '@/lib/types/analytics'

interface QualitativeThemePanelProps {
  themes: QualitativeTheme[]
  embedded?: boolean
}

interface ThemeColumnProps {
  themes: QualitativeTheme[]
}

function ThemeColumn({ themes }: ThemeColumnProps) {
  if (themes.length === 0) {
    return <p className="text-fg-muted text-sm italic">No themes yet.</p>
  }
  return (
    <ul className="space-y-2">
      {themes.slice(0, 8).map((theme) => (
        <li
          key={theme.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm text-fg leading-5">{theme.theme}</span>
            {theme.summary && (
              <span className="text-xs text-fg-subtle line-clamp-2">{theme.summary}</span>
            )}
            <span
              className={`inline-block w-fit text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                theme.isPositive
                  ? 'bg-success-muted text-success-text'
                  : 'bg-warning-muted text-warning-text'
              }`}
            >
              {theme.isPositive ? 'Positive' : 'Concern'}
            </span>
          </div>
          <span className="shrink-0 bg-brand-muted text-brand-text text-xs tabular-nums font-semibold rounded-full px-2 py-0.5">
            {theme.tagCount}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function QualitativeThemePanel({ themes, embedded = false }: QualitativeThemePanelProps) {
  const issues = themes
    .filter((t) => !t.isPositive)
    .sort((a, b) => b.tagCount - a.tagCount)

  const suggestions = themes
    .filter((t) => t.isPositive)
    .sort((a, b) => b.tagCount - a.tagCount)

  if (issues.length === 0 && suggestions.length === 0) {
    return (
      <div className={embedded ? '' : 'bg-surface border border-border rounded-lg shadow-sm p-5'}>
        <p className="text-fg-muted text-sm col-span-2">
          No qualitative themes yet — themes will appear after an analyst reviews responses.
        </p>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'bg-surface border border-border rounded-lg shadow-sm p-5'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-fg mb-3">Top Issues</h3>
          <ThemeColumn themes={issues} />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight text-fg mb-3">Top Suggestions</h3>
          <ThemeColumn themes={suggestions} />
        </div>
      </div>
    </div>
  )
}
