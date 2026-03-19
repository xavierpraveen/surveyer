'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { ParticipationBreakdown } from '@/lib/types/analytics'

interface ParticipationOverviewChartProps {
  rows: ParticipationBreakdown[]
}

type ChartRow = {
  department: string
  respondents: number
  sharePct: number
}

const PIE_COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#64748B']

export default function ParticipationOverviewChart({ rows }: ParticipationOverviewChartProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted">No participation data available.</p>
  }

  const total = rows.reduce((sum, r) => sum + r.respondentCount, 0)
  const data: ChartRow[] = rows
    .slice()
    .sort((a, b) => b.respondentCount - a.respondentCount)
    .map((r) => ({
      department: r.department,
      respondents: r.respondentCount,
      sharePct: total > 0 ? Math.round((r.respondentCount / total) * 1000) / 10 : 0,
    }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="h-80 border border-border rounded-lg p-3 xl:col-span-2 bg-surface">
        <p className="text-sm font-semibold text-fg mb-2">Responses by Department</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} height={52} textAnchor="end" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
            <Tooltip
              formatter={(value, key) => {
                if (key === 'respondents') return [String(value), 'Responses']
                if (key === 'sharePct') return [`${value}%`, 'Share']
                return [String(value), String(key)]
              }}
            />
            <Bar dataKey="respondents" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-80 border border-border rounded-lg p-3 bg-surface">
        <p className="text-sm font-semibold text-fg mb-2">Participation Share</p>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="respondents"
              nameKey="department"
              innerRadius={45}
              outerRadius={82}
              paddingAngle={2}
            >
              {data.map((row, idx) => (
                <Cell key={row.department} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [String(value), 'Responses']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
