'use client'

import { useMemo, useState } from 'react'
import { sendSurveyReminders } from '@/lib/actions/settings'
import type { ReminderPanelData } from '@/lib/types/phase4'

interface ReminderTabProps {
  initialData: ReminderPanelData | null
}

export default function ReminderTab({ initialData }: ReminderTabProps) {
  const [data] = useState<ReminderPanelData | null>(initialData)
  const [isSending, setIsSending] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const completionRate = useMemo(() => {
    if (!data || data.totalEligible === 0) return 0
    return Math.round((data.totalResponded / data.totalEligible) * 100)
  }, [data])

  async function handleSend() {
    setIsSending(true)
    setStatus(null)
    setError(null)
    const result = await sendSurveyReminders()
    setIsSending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    const emailText = result.data.emailSkipped
      ? 'Email skipped (configure RESEND env vars to enable email).'
      : `Email sent: ${result.data.emailed}.`
    setStatus(`In-app reminders sent: ${result.data.notified}. ${emailText}`)
  }

  if (!data) {
    return (
      <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
        No active survey. Reminders are available when a survey is open (or scheduled and already within the open window).
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-bold tracking-tight text-fg mb-2">Pending Responses & Reminders</h2>
      <p className="text-sm text-fg-muted mb-3">
        Survey: <span className="font-semibold text-fg">{data.surveyTitle}</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Metric label="Eligible" value={String(data.totalEligible)} />
        <Metric label="Responded" value={String(data.totalResponded)} />
        <Metric label="Pending" value={String(data.pendingCount)} />
        <Metric label="Completed" value={String(data.completedCount)} />
        <Metric label="Completion" value={`${completionRate}%`} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleSend}
          disabled={isSending || data.pendingCount === 0}
          className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
        >
          {isSending ? 'Sending...' : `Send Reminder to ${data.pendingCount}`}
        </button>
      </div>

      {status && (
        <div className="mb-4 rounded-md bg-success-muted border border-success px-4 py-3 text-sm text-success-text">
          {status}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-error-muted border border-error px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      )}

      {data.pendingEmployees.length === 0 && (
        <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-success-text mb-4">
          Everyone has completed this survey.
        </div>
      )}

      <h3 className="text-sm font-semibold text-fg mb-2">Not Completed ({data.pendingCount})</h3>
      <EmployeeTable rows={data.pendingEmployees} emptyText="No pending employees." />

      <h3 className="text-sm font-semibold text-fg mt-5 mb-2">Completed ({data.completedCount})</h3>
      <EmployeeTable rows={data.completedEmployees} emptyText="No completed employees yet." />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-fg-subtle font-semibold">{label}</p>
      <p className="text-xl font-bold text-fg">{value}</p>
    </div>
  )
}

function EmployeeTable({
  rows,
  emptyText,
}: {
  rows: ReminderPanelData['pendingEmployees']
  emptyText: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-surface-2 border-b border-border">
          <tr>
            {['Name', 'Email', 'Department', 'Role'].map((col) => (
              <th
                key={col}
                className="px-4 py-2 text-left text-xs font-semibold text-fg uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((emp) => (
            <tr key={emp.id}>
              <td className="px-4 py-2 text-fg">{emp.name}</td>
              <td className="px-4 py-2 text-fg">{emp.email}</td>
              <td className="px-4 py-2 text-fg">{emp.department ?? <span className="text-fg-subtle">—</span>}</td>
              <td className="px-4 py-2 text-fg">{emp.role ?? <span className="text-fg-subtle">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
