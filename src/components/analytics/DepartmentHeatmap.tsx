import type { HeatmapRow } from '@/lib/types/analytics'
import ThresholdPlaceholder from './ThresholdPlaceholder'

interface DepartmentHeatmapProps {
  rows: HeatmapRow[]
}

function abbreviate(name: string, maxLen = 10): string {
  if (name.length <= maxLen) return name
  return name.slice(0, maxLen) + '…'
}

function cellStyle(avgScore: number | null, belowThreshold: boolean): string {
  if (belowThreshold || avgScore === null) return 'bg-gray-50 text-gray-400'
  if (avgScore >= 4.0) return 'bg-green-100 text-green-800'
  if (avgScore >= 3.0) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

export default function DepartmentHeatmap({ rows }: DepartmentHeatmapProps) {
  if (rows.length === 0) {
    return <p className="text-gray-500 text-sm">No department data available.</p>
  }

  // Collect all unique dimensions from first row (all rows share same dimension set)
  const dimensions = rows[0]?.scores ?? []

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200 bg-gray-50 whitespace-nowrap">
              Department
            </th>
            {dimensions.map((dim) => (
              <th
                key={dim.dimensionId}
                className="px-2 py-2 font-medium text-gray-600 border border-gray-200 bg-gray-50 text-center whitespace-nowrap text-xs"
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
              <td className="px-3 py-2 font-medium text-gray-800 border border-gray-200 whitespace-nowrap">
                {row.department}
              </td>
              {row.scores.map((score) => (
                <td
                  key={score.dimensionId}
                  className={`px-2 py-2 text-center border border-gray-200 ${cellStyle(score.avgScore, score.belowThreshold)}`}
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
  )
}
