import type { HeatmapRow } from '@/lib/types/analytics'
import ThresholdPlaceholder from './ThresholdPlaceholder'

interface DepartmentHeatmapProps {
  rows: HeatmapRow[]
}

function abbreviate(name: string, maxLen = 10): string {
  if (name.length <= maxLen) return name
  return name.slice(0, maxLen) + '…'
}

// avgScore is on a 1–5 scale. Thresholds: >=4.0 → success, >=3.0 → warning, else → error
function cellStyle(avgScore: number | null, belowThreshold: boolean): string {
  if (belowThreshold || avgScore === null) return 'bg-surface-2 text-fg-subtle'
  if (avgScore >= 4.0) return 'bg-success-muted text-success-text'
  if (avgScore >= 3.0) return 'bg-warning-muted text-warning-text'
  return 'bg-error-muted text-error-text'
}

export default function DepartmentHeatmap({ rows }: DepartmentHeatmapProps) {
  if (rows.length === 0) {
    return <p className="text-fg-muted text-sm">No department data available.</p>
  }

  // Collect all unique dimensions from first row (all rows share same dimension set)
  const dimensions = rows[0]?.scores ?? []

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em] border border-border bg-surface-2 whitespace-nowrap">
                Department
              </th>
              {dimensions.map((dim) => (
                <th
                  key={dim.dimensionId}
                  className="px-2 py-2 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em] border border-border bg-surface-2 text-center whitespace-nowrap"
                  title={dim.dimensionName}
                >
                  {abbreviate(dim.dimensionName)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.department}>
                <td className="px-3 py-2 text-sm text-fg-muted border border-border whitespace-nowrap">
                  {row.department}
                </td>
                {row.scores.map((score) => (
                  <td
                    key={score.dimensionId}
                    className={`px-2 py-2 text-center border border-border text-xs tabular-nums font-semibold ${cellStyle(score.avgScore, score.belowThreshold)}`}
                  >
                    {score.belowThreshold || score.avgScore === null ? (
                      <ThresholdPlaceholder />
                    ) : (
                      score.avgScore.toFixed(1)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
