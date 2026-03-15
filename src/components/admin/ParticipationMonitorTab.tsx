'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ParticipationRow } from '@/lib/types/phase4'
import { getParticipationForOpenSurvey } from '@/lib/actions/settings'

interface ParticipationMonitorTabProps {
  initialData: ParticipationRow[]
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.floor(diffSeconds / 60)
  return `${diffMinutes}m ago`
}

function rateColorClass(rate: number): string {
  if (rate >= 70) return 'text-green-700'
  if (rate >= 40) return 'text-yellow-700'
  return 'text-red-700'
}

function rateBarColorClass(rate: number): string {
  if (rate >= 70) return 'bg-green-500'
  if (rate >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function ParticipationMonitorTab({
  initialData,
}: ParticipationMonitorTabProps) {
  const [data, setData] = useState<ParticipationRow[]>(initialData)
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    const result = await getParticipationForOpenSurvey()
    if (result.success) {
      setData(result.data)
      setLastUpdated(new Date())
    }
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id) // MUST have cleanup
  }, [refresh])

  // Totals
  const totalEligible = data.reduce((sum, r) => sum + r.eligible, 0)
  const totalResponded = data.reduce((sum, r) => sum + r.responded, 0)
  const overallRate =
    totalEligible > 0 ? Math.round((totalResponded / totalEligible) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Live Participation</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Last updated: {formatRelativeTime(lastUpdated)}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      {/* Empty state */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          No survey currently open.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Department', 'Eligible', 'Responded', 'Rate'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <tr key={row.departmentId ?? row.department}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.department}</td>
                  <td className="px-4 py-3 text-gray-600">{row.eligible}</td>
                  <td className="px-4 py-3 text-gray-600">{row.responded}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${rateColorClass(row.rate)}`}>
                      {row.rate}%
                    </span>
                    <div
                      className={`h-1 ${rateBarColorClass(row.rate)} rounded mt-1`}
                      style={{ width: `${row.rate}%` }}
                    />
                  </td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <td className="px-4 py-3 text-gray-700">Total</td>
                <td className="px-4 py-3 text-gray-700">{totalEligible}</td>
                <td className="px-4 py-3 text-gray-700">{totalResponded}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${rateColorClass(overallRate)}`}>
                    {overallRate}%
                  </span>
                  <div
                    className={`h-1 ${rateBarColorClass(overallRate)} rounded mt-1`}
                    style={{ width: `${overallRate}%` }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
