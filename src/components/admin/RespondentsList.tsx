import type { RespondentRow } from '@/lib/actions/survey'

interface Props {
  respondents: RespondentRow[]
  isAnonymous: boolean
  total: number
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function RespondentsList({ respondents, isAnonymous, total }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-extrabold tracking-snug text-fg">Responses</h1>
        <span className="text-sm bg-surface border border-border rounded-full px-3 py-0.5 text-fg-muted">
          {total} completion{total !== 1 ? 's' : ''}
        </span>
      </div>

      {isAnonymous && (
        <div className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg-muted">
          This survey is anonymous — names and emails are hidden.
        </div>
      )}

      {respondents.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg shadow-sm p-8 text-center">
          <p className="text-fg-muted">No responses yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-fg-muted w-8">#</th>
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Email</th>
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Department</th>
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Role</th>
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Tenure</th>
                <th className="px-4 py-3 text-left font-medium text-fg-muted">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {respondents.map((r, i) => (
                <tr key={r.userId} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 text-fg-muted">{i + 1}</td>
                  <td className="px-4 py-3 text-fg">{r.fullName ?? <span className="text-fg-muted italic">Anonymous</span>}</td>
                  <td className="px-4 py-3 text-fg">{r.email ?? <span className="text-fg-muted">—</span>}</td>
                  <td className="px-4 py-3 text-fg">{r.department ?? <span className="text-fg-muted">—</span>}</td>
                  <td className="px-4 py-3 text-fg">{r.role ?? <span className="text-fg-muted">—</span>}</td>
                  <td className="px-4 py-3 text-fg">{r.tenureBand ?? <span className="text-fg-muted">—</span>}</td>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{formatDate(r.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
