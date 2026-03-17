import type { EmployeeDirectoryRow } from '@/lib/types/phase4'

interface EmployeeDirectoryTabProps {
  rows: EmployeeDirectoryRow[]
}

export default function EmployeeDirectoryTab({ rows }: EmployeeDirectoryTabProps) {
  const activeCount = rows.filter((r) => r.isActive).length

  return (
    <div className="max-w-5xl">
      <h2 className="text-base font-bold tracking-tight text-fg mb-2">Employee Directory</h2>
      <p className="text-sm text-fg-muted mb-4">
        {rows.length} total employees · {activeCount} active
      </p>

      {rows.length === 0 ? (
        <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-fg-muted">
          No employees found. Import a roster in the Employees tab.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                {['Name', 'Email', 'Department', 'Role', 'Tenure', 'Status'].map((col) => (
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2 text-fg">{row.name}</td>
                  <td className="px-4 py-2 text-fg">{row.email}</td>
                  <td className="px-4 py-2 text-fg">{row.department ?? <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2 text-fg">{row.role ?? <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2 text-fg">{row.tenureBand ?? <span className="text-fg-subtle">—</span>}</td>
                  <td className="px-4 py-2">
                    {row.isActive ? (
                      <span className="text-success-text text-xs font-semibold">Active</span>
                    ) : (
                      <span className="text-fg-subtle text-xs font-semibold">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
