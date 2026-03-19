import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getReminderPanelData } from '@/lib/actions/settings'

const nav = [
  {
    href: '/admin/surveys',
    label: 'Surveys',
    description: 'Create and manage survey cycles, lifecycle, and publication',
  },
  {
    href: '/admin/actions',
    label: 'Action Items',
    description: 'Track commitments linked to survey findings',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    description: 'Employees, privacy thresholds, participation, and cycle archival',
  },
]

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const reminderResult = await getReminderPanelData()
  const reminderData = reminderResult.success ? reminderResult.data : null

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-snug text-fg">Admin Dashboard</h1>
        {user && (
          <p className="text-sm text-fg-muted mt-1">
            Signed in as <span className="font-medium text-fg">{user.email}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-surface border border-border rounded-lg shadow-sm p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <h2 className="text-base font-bold tracking-tight text-fg">{item.label}</h2>
            <p className="text-sm text-fg-muted mt-1">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 bg-surface border border-border rounded-lg shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold tracking-tight text-fg">Survey Completion Status</h2>
          <Link href="/admin/settings" className="text-sm text-brand-text hover:underline">
            Open reminders →
          </Link>
        </div>

        {!reminderData ? (
          <p className="text-sm text-fg-subtle">No active survey right now.</p>
        ) : (
          <>
            <p className="text-sm text-fg-muted mb-3">
              Survey: <span className="font-medium text-fg">{reminderData.surveyTitle}</span>
            </p>
            <p className="text-sm text-fg-muted mb-3">
              Eligible: {reminderData.totalEligible} · Completed: {reminderData.completedCount} · Pending: {reminderData.pendingCount}
            </p>

            <h3 className="text-sm font-semibold text-fg mb-2">Not Completed ({reminderData.pendingCount})</h3>
            <div className="overflow-x-auto rounded-lg border border-border mb-4">
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
                  {reminderData.pendingEmployees.slice(0, 10).map((emp) => (
                    <tr key={emp.id}>
                      <td className="px-4 py-2 text-fg">{emp.name}</td>
                      <td className="px-4 py-2 text-fg">{emp.email}</td>
                      <td className="px-4 py-2 text-fg">{emp.department ?? <span className="text-fg-subtle">—</span>}</td>
                      <td className="px-4 py-2 text-fg">{emp.role ?? <span className="text-fg-subtle">—</span>}</td>
                    </tr>
                  ))}
                  {reminderData.pendingEmployees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm text-success-text">Everyone has completed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-semibold text-fg mb-2">Completed ({reminderData.completedCount})</h3>
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
                  {reminderData.completedEmployees.slice(0, 10).map((emp) => (
                    <tr key={emp.id}>
                      <td className="px-4 py-2 text-fg">{emp.name}</td>
                      <td className="px-4 py-2 text-fg">{emp.email}</td>
                      <td className="px-4 py-2 text-fg">{emp.department ?? <span className="text-fg-subtle">—</span>}</td>
                      <td className="px-4 py-2 text-fg">{emp.role ?? <span className="text-fg-subtle">—</span>}</td>
                    </tr>
                  ))}
                  {reminderData.completedEmployees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm text-fg-subtle">No completions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/results"
          className="text-sm text-brand-text hover:underline"
        >
          View published results →
        </Link>
      </div>
    </div>
  )
}
