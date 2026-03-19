'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ParticipationRow } from '@/lib/types/phase4'
import { getParticipationForOpenSurvey, sendSurveyReminders } from '@/lib/actions/settings'

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

export default function ParticipationMonitorTab({
  initialData,
}: ParticipationMonitorTabProps) {
  const [data, setData] = useState<ParticipationRow[]>(initialData)
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSendingReminders, setIsSendingReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState<string | null>(null)

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

  const sendReminders = useCallback(async () => {
    setIsSendingReminders(true)
    setReminderResult(null)
    const result = await sendSurveyReminders()
    if (result.success) {
      const { notified, emailed, emailSkipped } = result.data
      setReminderResult(
        emailSkipped
          ? `In-app notifications sent to ${notified} pending respondents (email not configured).`
          : `Notified ${notified} respondents — ${emailed} emails sent.`
      )
    } else {
      setReminderResult(`Error: ${result.error}`)
    }
    setIsSendingReminders(false)
  }, [])

  // Totals
  const totalEligible = data.reduce((sum, r) => sum + r.eligible, 0)
  const totalResponded = data.reduce((sum, r) => sum + r.responded, 0)
  const overallRate =
    totalEligible > 0 ? Math.min(Math.round((totalResponded / totalEligible) * 100), 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-fg">Live Participation</h2>
          <p className="text-xs text-fg-subtle mt-0.5">
            Last updated: {formatRelativeTime(lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={sendReminders}
          disabled={isSendingReminders || data.length === 0}
          className="bg-brand text-white font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
        >
          {isSendingReminders ? 'Sending…' : 'Send Reminder'}
        </button>
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-fg-subtle"
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
      </div>

      {/* Reminder result feedback */}
      {reminderResult && (
        <p className="text-xs text-fg-muted mb-3">{reminderResult}</p>
      )}

      {/* Empty state */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-fg-subtle text-sm">
          No survey currently open.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                {['Department', 'Eligible', 'Responded', 'Rate'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-fg uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr key={row.departmentId ?? row.department}>
                  <td className="px-4 py-3 font-semibold text-fg">{row.department}</td>
                  <td className="px-4 py-3 text-fg-muted">{row.eligible}</td>
                  <td className="px-4 py-3 text-fg-muted">{row.responded}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-fg">
                      {row.rate}%
                    </span>
                    <div className="bg-brand-muted h-1.5 rounded-full mt-1">
                      <div
                        className="bg-gradient-to-r from-brand to-accent h-1.5 rounded-full"
                        style={{ width: `${row.rate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="bg-surface-2 border-t-2 border-border font-semibold">
                <td className="px-4 py-3 text-fg">Total</td>
                <td className="px-4 py-3 text-fg">{totalEligible}</td>
                <td className="px-4 py-3 text-fg">{totalResponded}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-fg">
                    {overallRate}%
                  </span>
                  <div className="bg-brand-muted h-1.5 rounded-full mt-1">
                    <div
                      className="bg-gradient-to-r from-brand to-accent h-1.5 rounded-full"
                      style={{ width: `${overallRate}%` }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
