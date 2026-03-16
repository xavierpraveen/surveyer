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
        <label className="block text-sm font-semibold text-fg mb-1">
          Title <span className="text-error-text">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Action item title"
        />
      </div>

      {/* Problem Statement */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1">Problem Statement</label>
        <textarea
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          rows={3}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Describe the problem this action addresses"
        />
      </div>

      {/* Owner */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1">Owner User ID</label>
        {item?.ownerName && (
          <p className="text-xs text-fg-subtle mb-1">Current owner: {item.ownerName}</p>
        )}
        <input
          type="text"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Owner user ID"
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1">Department ID</label>
        <input
          type="text"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Department ID"
        />
      </div>

      {/* Priority and Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-fg mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as ActionItem['priority'])}
            className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-fg mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ActionItem['status'])}
            className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
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
        <label className="block text-sm font-semibold text-fg mb-1">Target Date</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
        />
      </div>

      {/* Success Criteria */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1">Success Criteria</label>
        <textarea
          value={successCriteria}
          onChange={(e) => setSuccessCriteria(e.target.value)}
          rows={3}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="How will we know this action succeeded?"
        />
      </div>

      {/* Dimension IDs */}
      <div>
        <label className="block text-sm font-semibold text-fg mb-1">Dimension IDs</label>
        <input
          type="text"
          value={dimensionIds}
          onChange={(e) => setDimensionIds(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Comma-separated dimension UUIDs"
        />
        <p className="text-xs text-fg-subtle mt-1">Enter comma-separated UUIDs</p>
      </div>

      {/* Is Public */}
      <div className="flex items-center gap-2">
        <input
          id="isPublic"
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-border text-brand focus:ring-indigo-200"
        />
        <label htmlFor="isPublic" className="text-sm font-semibold text-fg">
          Visible on public /results page
        </label>
      </div>

      {/* Error / success feedback */}
      {error && (
        <div className="rounded-md bg-error-muted border border-error px-4 py-3 text-sm text-error-text" role="alert">{error}</div>
      )}
      {saved && (
        <div className="rounded-md bg-success-muted border border-success px-4 py-3 text-sm text-success-text">Saved</div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
      >
        {isPending ? 'Saving...' : item ? 'Save Changes' : 'Create Action'}
      </button>
    </form>
  )
}
