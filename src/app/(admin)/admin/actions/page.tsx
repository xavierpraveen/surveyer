import Link from 'next/link'
import { getActionItems } from '@/lib/actions/actions'
import type { ActionItem } from '@/lib/types/phase4'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const PRIORITY_BADGE: Record<ActionItem['priority'], string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

const STATUS_BADGE: Record<ActionItem['status'], string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  planned: 'bg-gray-100 text-gray-600',
  identified: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
        <Link
          href="/admin/actions/new"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Action
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {FILTER_TABS.map((tab) => {
          const isActive = (tab.value ?? '') === (status ?? '')
          const href = tab.value ? `?status=${tab.value}` : '/admin/actions'
          return (
            <Link
              key={tab.label}
              href={href}
              className={`pb-3 text-sm transition-colors ${
                isActive
                  ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {!result.success ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Error loading action items: {result.error}
        </div>
      ) : result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="mb-2">No action items found.</p>
          <Link href="/admin/actions/new" className="text-sm text-blue-600 hover:underline">
            Create the first one.
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Owner</th>
                <th className="pb-3 pr-4">Priority</th>
                <th className="pb-3 pr-4">Target Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Public</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/actions/${item.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors block"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {item.ownerName ?? item.ownerId ?? '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_BADGE[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {item.targetDate
                      ? new Date(item.targetDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </td>
                  <td className="py-3">
                    {item.isPublic ? (
                      <span className="text-green-600 font-bold">&#10003;</span>
                    ) : (
                      <span className="text-gray-400">—</span>
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
