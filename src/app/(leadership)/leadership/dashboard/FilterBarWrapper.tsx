'use client'

import { useState } from 'react'
import FilterBar from '@/components/analytics/FilterBar'
import DimensionBarChart from '@/components/analytics/DimensionBarChart'
import DepartmentHeatmap from '@/components/analytics/DepartmentHeatmap'
import TrendLineChart from '@/components/analytics/TrendLineChart'
import QualitativeThemePanel from '@/components/analytics/QualitativeThemePanel'
import type { LeadershipDashboardData, PublicAction } from '@/lib/types/analytics'

// ─── Action Items Section ─────────────────────────────────────────────────────

type ActionStatus = PublicAction['status']

interface ActionGroup {
  label: string
  statuses: ActionStatus[]
  colorClass: string
}

const ACTION_GROUPS: ActionGroup[] = [
  { label: 'In Progress', statuses: ['in_progress'], colorClass: 'bg-blue-100 text-blue-700' },
  {
    label: 'Planned',
    statuses: ['identified', 'planned'],
    colorClass: 'bg-gray-100 text-gray-600',
  },
  { label: 'Blocked', statuses: ['blocked'], colorClass: 'bg-red-100 text-red-700' },
  { label: 'Completed', statuses: ['completed'], colorClass: 'bg-green-100 text-green-700' },
]

function ActionItemsSection({ actions }: { actions: PublicAction[] }) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No public action items for this survey cycle yet.
      </p>
    )
  }

  return (
    <div>
      {ACTION_GROUPS.map((group) => {
        const groupActions = actions.filter((a) =>
          (group.statuses as string[]).includes(a.status)
        )
        if (groupActions.length === 0) return null

        return (
          <div key={group.label} className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              {group.label}
              <span className={`text-xs rounded-full px-2 py-0.5 ${group.colorClass}`}>
                {groupActions.length}
              </span>
            </h3>
            {groupActions.map((action) => (
              <div key={action.id} className="bg-white border border-gray-200 rounded p-3 mb-2">
                <p className="font-medium text-sm text-gray-900">{action.title}</p>
                {action.departmentName && (
                  <p className="text-xs text-gray-500 mt-0.5">{action.departmentName}</p>
                )}
                {action.targetDate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Target:{' '}
                    {new Date(action.targetDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Participation Table ──────────────────────────────────────────────────────

function ParticipationTable({
  data,
}: {
  data: LeadershipDashboardData['participationBreakdown']
}) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No participation data available.</p>
  }

  const total = data.reduce((sum, r) => sum + r.respondentCount, 0)

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 px-3 font-semibold text-gray-700">Department</th>
          <th className="text-right py-2 px-3 font-semibold text-gray-700">Responses</th>
          <th className="text-right py-2 px-3 font-semibold text-gray-700">Share</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.department} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 px-3 text-gray-800">{row.department}</td>
            <td className="py-2 px-3 text-right text-gray-700 font-medium">
              {row.respondentCount}
            </td>
            <td className="py-2 px-3 text-right text-gray-500">
              {total > 0 ? Math.round((row.respondentCount / total) * 100) : 0}%
            </td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-semibold">
          <td className="py-2 px-3 text-gray-700">Total</td>
          <td className="py-2 px-3 text-right text-gray-900">{total}</td>
          <td className="py-2 px-3 text-right text-gray-500">100%</td>
        </tr>
      </tbody>
    </table>
  )
}

// ─── Filter Bar Wrapper ───────────────────────────────────────────────────────

interface FilterBarWrapperProps {
  initialData: LeadershipDashboardData
  availableSurveys: { id: string; title: string; closedAt: string }[]
  departments: string[]
  roles: string[]
  tenureBands: string[]
}

export default function FilterBarWrapper({
  initialData,
  availableSurveys,
  departments,
  roles,
  tenureBands,
}: FilterBarWrapperProps) {
  const [data, setData] = useState<LeadershipDashboardData>(initialData)
  const [filterError, setFilterError] = useState<string | null>(null)

  function handleFilterChange(updated: LeadershipDashboardData | null) {
    if (updated === null) {
      setFilterError('Failed to load filtered data. Showing previous results.')
    } else {
      setFilterError(null)
      setData(updated)
    }
  }

  return (
    <>
      <FilterBar
        availableSurveys={availableSurveys}
        departments={departments}
        roles={roles}
        tenureBands={tenureBands}
        onFilterChange={handleFilterChange}
      />

      {filterError && (
        <div className="mx-6 mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          {filterError}
        </div>
      )}

      <div className="px-6 py-6">
        {/* Section 1: Dimension Scores */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimension Scores</h2>
          <DimensionBarChart scores={data.dimensionScores} />
        </section>

        {/* Section 2: Department Heatmap */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Heatmap</h2>
          <DepartmentHeatmap rows={data.heatmapRows} />
        </section>

        {/* Section 3: Trends Across Cycles */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trends Across Cycles</h2>
          <TrendLineChart trendPoints={data.trendPoints} />
        </section>

        {/* Section 4: Participation by Department */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Participation by Department
          </h2>
          <ParticipationTable data={data.participationBreakdown} />
        </section>

        {/* Section 5: Qualitative Themes */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Qualitative Themes</h2>
          <QualitativeThemePanel themes={data.qualitativeThemes} />
        </section>

        {/* Section 6 (7th total): Action Items — read-only */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Action Items</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Public commitments from this survey cycle
            </p>
          </div>
          <ActionItemsSection actions={data.publicActions} />
        </section>
      </div>
    </>
  )
}
