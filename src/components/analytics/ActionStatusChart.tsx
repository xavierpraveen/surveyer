'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PublicAction } from '@/lib/types/analytics'

interface ActionStatusChartProps {
  actions: PublicAction[]
}

const STATUS_META: Record<PublicAction['status'], { label: string; color: string }> = {
  identified: { label: 'Identified', color: '#94A3B8' },
  planned: { label: 'Planned', color: '#3B82F6' },
  in_progress: { label: 'In Progress', color: '#F59E0B' },
  blocked: { label: 'Blocked', color: '#EF4444' },
  completed: { label: 'Completed', color: '#10B981' },
}

export default function ActionStatusChart({ actions }: ActionStatusChartProps) {
  if (actions.length === 0) {
    return <p className="text-sm text-fg-muted">No action items yet.</p>
  }

  const counts = new Map<PublicAction['status'], number>()
  for (const action of actions) {
    counts.set(action.status, (counts.get(action.status) ?? 0) + 1)
  }

  const data = Array.from(counts.entries()).map(([status, value]) => ({
    status,
    name: STATUS_META[status].label,
    value,
    color: STATUS_META[status].color,
  }))

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={86} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [String(value), 'Items']} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

