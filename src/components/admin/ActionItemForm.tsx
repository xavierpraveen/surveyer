'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionItem } from '@/lib/types/phase4'
import { createActionItem, updateActionItem } from '@/lib/actions/actions'

interface ActionItemFormProps {
  item?: ActionItem
  onSuccess?: () => void
}

export default function ActionItemForm({ item, onSuccess }: ActionItemFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Controlled state
  const [title, setTitle] = useState(item?.title ?? '')
  const [problemStatement, setProblemStatement] = useState(item?.problemStatement ?? '')
  const [ownerId, setOwnerId] = useState(item?.ownerId ?? '')
  const [departmentId, setDepartmentId] = useState(item?.departmentId ?? '')
  const [priority, setPriority] = useState<ActionItem['priority']>(item?.priority ?? 'medium')
  const [targetDate, setTargetDate] = useState(item?.targetDate?.split('T')[0] ?? '')
  const [status, setStatus] = useState<ActionItem['status']>(item?.status ?? 'identified')
  const [successCriteria, setSuccessCriteria] = useState(item?.successCriteria ?? '')
  const [isPublic, setIsPublic] = useState(item?.isPublic ?? false)
  const [dimensionIds, setDimensionIds] = useState(item?.dimensionIds?.join(', ') ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const payload = {
      title,
      problemStatement: problemStatement || null,
      ownerId: ownerId || null,
      departmentId: departmentId || null,
      priority,
      targetDate: targetDate || null,
      status,
      successCriteria: successCriteria || null,
      isPublic,
      dimensionIds: dimensionIds.split(',').map((s) => s.trim()).filter(Boolean),
    }

    startTransition(async () => {
      const result = item
        ? await updateActionItem(item.id, payload)
        : await createActionItem(payload)

      if (!result.success) {
        setError(result.error)
        return
      }

      setSaved(true)
      onSuccess?.()
      router.refresh()

      if (!item) {
        router.push('/admin/actions')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Action item title"
        />
      </div>

      {/* Problem Statement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Problem Statement</label>
        <textarea
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the problem this action addresses"
        />
      </div>

      {/* Owner */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Owner User ID</label>
        {item?.ownerName && (
          <p className="text-xs text-gray-500 mb-1">Current owner: {item.ownerName}</p>
        )}
        <input
          type="text"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Owner user ID"
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department ID</label>
        <input
          type="text"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Department ID"
        />
      </div>

      {/* Priority and Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as ActionItem['priority'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ActionItem['status'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="identified">Identified</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Target Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Success Criteria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Success Criteria</label>
        <textarea
          value={successCriteria}
          onChange={(e) => setSuccessCriteria(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="How will we know this action succeeded?"
        />
      </div>

      {/* Dimension IDs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dimension IDs</label>
        <input
          type="text"
          value={dimensionIds}
          onChange={(e) => setDimensionIds(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Comma-separated dimension UUIDs"
        />
        <p className="text-xs text-gray-400 mt-1">Enter comma-separated UUIDs</p>
      </div>

      {/* Is Public */}
      <div className="flex items-center gap-2">
        <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
          Visible on public /results page
        </label>
      </div>

      {/* Error / success feedback */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">Saved</div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving...' : item ? 'Save Changes' : 'Create Action'}
      </button>
    </form>
  )
}
