import type { QualitativeTheme } from '@/lib/types/analytics'

interface QualitativeThemePanelProps {
  themes: QualitativeTheme[]
}

interface ThemeColumnProps {
  themes: QualitativeTheme[]
}

function ThemeColumn({ themes }: ThemeColumnProps) {
  if (themes.length === 0) {
    return <p className="text-fg-muted text-sm italic">No themes yet.</p>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {themes.map((theme) => (
        <span
          key={theme.id}
          className="inline-flex items-center gap-1 bg-brand-muted text-brand-text text-xs font-semibold rounded-full px-3 py-1"
        >
          {theme.theme}
          <span className="bg-surface-2 text-fg-muted text-xs tabular-nums font-semibold rounded-full px-2 py-0.5 ml-1">
            {theme.tagCount}
          </span>
        </span>
      ))}
    </div>
  )
}

export default function QualitativeThemePanel({ themes }: QualitativeThemePanelProps) {
  const issues = themes
    .filter((t) => !t.isPositive)
    .sort((a, b) => b.tagCount - a.tagCount)

  const suggestions = themes
    .filter((t) => t.isPositive)
    .sort((a, b) => b.tagCount - a.tagCount)

  if (issues.length === 0 && suggestions.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
        <p className="text-fg-muted text-sm col-span-2">
          No qualitative themes yet — themes will appear after an analyst reviews responses.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-base font-bold tracking-tight text-fg mb-4">Top Issues</h3>
          <ThemeColumn themes={issues} />
        </div>
        <div>
          <h3 className="text-base font-bold tracking-tight text-fg mb-4">Top Suggestions</h3>
          <ThemeColumn themes={suggestions} />
        </div>
      </div>
    </div>
  )
}
