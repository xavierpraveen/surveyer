'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '@/lib/types/analytics'

interface TrendLineChartProps {
  trendPoints: TrendPoint[]
  selectedDimensions?: string[]
}

// Brand + accent lead; remaining slots filled with other distinct colors
const DIMENSION_COLORS = [
  '#6366F1', // brand (indigo-500)
  '#8B5CF6', // accent (violet-500)
  '#10B981', // success (emerald-500)
  '#F59E0B', // warning (amber-500)
  '#EF4444', // error (red-500)
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#0d9488', // teal-600
  '#db2777', // pink-600
  '#65a30d', // lime-600
  '#4338CA', // brand-text (indigo-700)
  '#64748B', // fg-muted (slate-500)
]

interface ChartDataPoint {
  surveyTitle: string
  [dimensionName: string]: string | number | null
}

export default function TrendLineChart({
  trendPoints,
  selectedDimensions,
}: TrendLineChartProps) {
  if (trendPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-fg-muted text-sm">
        No trend data available yet — trends appear after multiple survey cycles.
      </div>
    )
  }

  // Collect unique dimensions and survey titles
  const uniqueDimensions = Array.from(
    new Map(trendPoints.map((p) => [p.dimensionId, p.dimensionName])).entries()
  )

  const filteredDimensions =
    selectedDimensions && selectedDimensions.length > 0
      ? uniqueDimensions.filter(([id]) => selectedDimensions.includes(id))
      : uniqueDimensions

  // Collect ordered survey titles (preserve order from trendPoints)
  const surveyOrder = Array.from(
    new Map(trendPoints.map((p) => [p.surveyId, p.surveyTitle])).entries()
  )

  // Build chart data: one object per survey cycle
  const chartData: ChartDataPoint[] = surveyOrder.map(([surveyId, surveyTitle]) => {
    const row: ChartDataPoint = { surveyTitle }
    for (const [dimId, dimName] of filteredDimensions) {
      const point = trendPoints.find(
        (p) => p.surveyId === surveyId && p.dimensionId === dimId
      )
      row[dimName] = point && !point.belowThreshold && point.avgScore !== null
        ? point.avgScore
        : null
    }
    return row
  })

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-5">
      <h2 className="text-base font-bold tracking-tight text-fg mb-4">Score Trends</h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="surveyTitle"
            tick={{ fontSize: 11, fill: '#64748B' }}
            interval={0}
          />
          <YAxis
            domain={[1, 5]}
            tickCount={5}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === 'number' ? value.toFixed(1) : 'N/A'
            }
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#64748B' }} />
          {filteredDimensions.map(([, dimName], index) => (
            <Line
              key={dimName}
              type="monotone"
              dataKey={dimName}
              stroke={DIMENSION_COLORS[index % DIMENSION_COLORS.length]}
              dot={true}
              connectNulls={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
