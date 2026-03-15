'use client'

import { useQueryState, parseAsString } from 'nuqs'
import { useTransition } from 'react'
import { getLeadershipDashboardData } from '@/lib/actions/analytics'
import type { LeadershipDashboardData } from '@/lib/types/analytics'

interface FilterBarProps {
  availableSurveys: { id: string; title: string; closedAt: string }[]
  departments: string[]
  roles: string[]
  tenureBands: string[]
  onFilterChange: (data: LeadershipDashboardData | null) => void
}

const TENURE_BAND_LABELS: Record<string, string> = {
  less_than_1yr: '< 1 year',
  '1_to_2yr': '1–2 years',
  '3_to_5yr': '3–5 years',
  '6_to_10yr': '6–10 years',
  more_than_10yr: '10+ years',
}

export default function FilterBar({
  availableSurveys,
  departments,
  roles,
  tenureBands,
  onFilterChange,
}: FilterBarProps) {
  const [isPending, startTransition] = useTransition()

  const [surveyId, setSurveyId] = useQueryState('surveyId', parseAsString.withDefault(''))
  const [department, setDepartment] = useQueryState('department', parseAsString.withDefault(''))
  const [role, setRole] = useQueryState('role', parseAsString.withDefault(''))
  const [tenureBand, setTenureBand] = useQueryState('tenureBand', parseAsString.withDefault(''))

  function applyFilters(updates: {
    surveyId?: string
    department?: string
    role?: string
    tenureBand?: string
  }) {
    const filters = {
      surveyId: updates.surveyId !== undefined ? updates.surveyId : surveyId,
      department: updates.department !== undefined ? updates.department : department,
      role: updates.role !== undefined ? updates.role : role,
      tenureBand: updates.tenureBand !== undefined ? updates.tenureBand : tenureBand,
    }

    startTransition(async () => {
      const result = await getLeadershipDashboardData({
        surveyId: filters.surveyId || null,
        department: filters.department || null,
        role: filters.role || null,
        tenureBand: filters.tenureBand || null,
      })
      if (result.success) {
        onFilterChange(result.data)
      } else {
        onFilterChange(null)
      }
    })
  }

  function handleSurveyChange(value: string) {
    void setSurveyId(value)
    applyFilters({ surveyId: value })
  }

  function handleDepartmentChange(value: string) {
    void setDepartment(value)
    applyFilters({ department: value })
  }

  function handleRoleChange(value: string) {
    void setRole(value)
    applyFilters({ role: value })
  }

  function handleTenureBandChange(value: string) {
    void setTenureBand(value)
    applyFilters({ tenureBand: value })
  }

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-wrap">
      {/* Survey Period */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Survey</label>
        <select
          value={surveyId}
          onChange={(e) => handleSurveyChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">All Surveys</option>
          {availableSurveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Department */}
      {departments.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Department</label>
          <select
            value={department}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Role */}
      {roles.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Role</label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tenure Band */}
      {tenureBands.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Tenure</label>
          <select
            value={tenureBand}
            onChange={(e) => handleTenureBandChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All Tenures</option>
            {tenureBands.map((t) => (
              <option key={t} value={t}>
                {TENURE_BAND_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading spinner */}
      {isPending && (
        <div className="ml-2 flex items-center gap-1.5 text-xs text-blue-600">
          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading…</span>
        </div>
      )}
    </div>
  )
}
