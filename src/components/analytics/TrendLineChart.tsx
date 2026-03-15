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

// 12-color palette for dimension lines
const DIMENSION_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#9333ea', // purple-600
  '#0891b2', // cyan-600
  '#ea580c', // orange-600
  '#4f46e5', // indigo-600
  '#0d9488', // teal-600
  '#db2777', // pink-600
  '#65a30d', // lime-600
  '#6b7280', // gray-500
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
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
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
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="surveyTitle"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval={0}
        />
        <YAxis
          domain={[1, 5]}
          tickCount={5}
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? value.toFixed(1) : 'N/A'
          }
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
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
  )
}
