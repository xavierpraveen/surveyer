import type { QualitativeTheme } from '@/lib/types/analytics'

interface QualitativeThemePanelProps {
  themes: QualitativeTheme[]
}

interface ThemeColumnProps {
  themes: QualitativeTheme[]
}

function ThemeColumn({ themes }: ThemeColumnProps) {
  if (themes.length === 0) {
    return <p className="text-gray-400 text-sm italic">No themes yet.</p>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {themes.map((theme) => (
        <span
          key={theme.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-800 mr-1 mb-1"
        >
          {theme.theme}
          <span className="text-gray-500 text-xs">{theme.tagCount}</span>
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
      <div className="grid grid-cols-2 gap-6">
        <p className="text-gray-500 text-sm col-span-2">
          No qualitative themes yet — themes will appear after an analyst reviews responses.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Issues</h3>
        <ThemeColumn themes={issues} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Suggestions</h3>
        <ThemeColumn themes={suggestions} />
      </div>
    </div>
  )
}
