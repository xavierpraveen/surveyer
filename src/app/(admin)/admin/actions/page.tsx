import Link from 'next/link'
import { getActionItems } from '@/lib/actions/actions'
import type { ActionItem } from '@/lib/types/phase4'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const PRIORITY_BADGE: Record<ActionItem['priority'], string> = {
  critical: 'bg-error-muted text-error-text',
  high: 'bg-error-muted text-error-text',
  medium: 'bg-warning-muted text-warning-text',
  low: 'bg-surface-2 text-fg-muted',
}

const STATUS_BADGE: Record<ActionItem['status'], string> = {
  in_progress: 'bg-warning-muted text-warning-text',
  planned: 'bg-brand-muted text-brand-text',
  identified: 'bg-brand-muted text-brand-text',
  blocked: 'bg-error-muted text-error-text',
  completed: 'bg-success-muted text-success-text',
}

const STATUS_LABEL: Record<ActionItem['status'], string> = {
  in_progress: 'In Progress',
  identified: 'Identified',
  planned: 'Planned',
  blocked: 'Blocked',
  completed: 'Completed',
}

const FILTER_TABS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Completed', value: 'completed' },
]

export default async function ActionsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const result = await getActionItems(status || undefined)

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-snug text-fg">Action Items</h1>
        <Link
          href="/admin/actions/new"
          className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150"
        >
          New Action
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        {FILTER_TABS.map((tab) => {
          const isActive = (tab.value ?? '') === (status ?? '')
          const href = tab.value ? `?status=${tab.value}` : '/admin/actions'
          return (
            <Link
              key={tab.label}
              href={href}
              className={`pb-3 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-brand text-brand font-semibold'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {!result.success ? (
        <div className="rounded-md bg-error-muted p-4 text-sm text-error-text" role="alert">
          Error loading action items: {result.error}
        </div>
      ) : result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
          <p className="mb-2">No action items found.</p>
          <Link href="/admin/actions/new" className="text-sm text-brand-text hover:underline">
            Create the first one.
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pt-3 px-4 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em]">Title</th>
                <th className="pb-3 pt-3 pr-4 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em]">Owner</th>
                <th className="pb-3 pt-3 pr-4 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em]">Priority</th>
                <th className="pb-3 pt-3 pr-4 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em]">Target Date</th>
                <th className="pb-3 pt-3 pr-4 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em]">Status</th>
                <th className="pb-3 pt-3 pr-4 text-xs font-semibold text-fg-subtle uppercase tracking-[0.07em]">Public</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/actions/${item.id}`}
                      className="font-medium text-fg hover:text-brand transition-colors block"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-fg-muted">
                    {item.ownerName ?? item.ownerId ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_BADGE[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-fg-muted">
                    {item.targetDate
                      ? new Date(item.targetDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {item.isPublic ? (
                      <span className="text-success font-bold">&#10003;</span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
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
