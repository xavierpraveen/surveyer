'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { DimensionScore } from '@/lib/types/analytics'
import ThresholdPlaceholder from './ThresholdPlaceholder'

interface DimensionBarChartProps {
  scores: DimensionScore[]
}

function barColor(score: number | null): string {
  if (score === null) return '#e5e7eb' // gray-200 — below threshold
  if (score >= 4.0) return '#16a34a' // green-600
  if (score >= 3.0) return '#ca8a04' // yellow-600
  return '#dc2626' // red-600
}

interface ChartDataItem extends DimensionScore {
  chartScore: number
}

interface TooltipPayloadEntry {
  payload: ChartDataItem
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="bg-white border border-gray-200 rounded shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{d.dimensionName}</p>
      {d.belowThreshold ? (
        <p className="text-gray-500 text-xs">Below threshold — results hidden</p>
      ) : (
        <>
          <p className="text-gray-700">
            Avg Score:{' '}
            <span className="font-medium">{d.avgScore !== null ? d.avgScore.toFixed(1) : '—'}</span>
          </p>
          {d.favorablePct !== null && (
            <p className="text-green-700 text-xs mt-0.5">
              Favorable: {Math.round(d.favorablePct)}%
            </p>
          )}
          {d.neutralPct !== null && (
            <p className="text-yellow-700 text-xs">Neutral: {Math.round(d.neutralPct)}%</p>
          )}
          {d.unfavorablePct !== null && (
            <p className="text-red-700 text-xs">Unfavorable: {Math.round(d.unfavorablePct)}%</p>
          )}
        </>
      )}
    </div>
  )
}

export default function DimensionBarChart({ scores }: DimensionBarChartProps) {
  const data: ChartDataItem[] = scores.map((s) => ({
    ...s,
    chartScore: s.belowThreshold || s.avgScore === null ? 0 : s.avgScore,
  }))

  const height = Math.max(300, scores.length * 44)

  if (scores.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No dimension score data available.
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 5]}
            tickCount={6}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis
            type="category"
            dataKey="dimensionName"
            width={200}
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="chartScore" maxBarSize={20} radius={[0, 3, 3, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={barColor(entry.belowThreshold ? null : entry.avgScore)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {scores.some((s) => s.belowThreshold) && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <ThresholdPlaceholder tooltip="Dimensions shown as empty bars have fewer than 5 responses — scores hidden to protect anonymity." />
          <span>= fewer than 5 responses (score hidden)</span>
        </p>
      )}
    </div>
  )
}
