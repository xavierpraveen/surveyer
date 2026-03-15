'use client'

import { useState } from 'react'
import type { ActionUpdate } from '@/lib/types/phase4'
import { postActionUpdate } from '@/lib/actions/actions'

interface ActionUpdateTimelineProps {
  actionItemId: string
  initialUpdates: ActionUpdate[]
}

export default function ActionUpdateTimeline({ actionItemId, initialUpdates }: ActionUpdateTimelineProps) {
  const [updates, setUpdates] = useState<ActionUpdate[]>(initialUpdates)
  const [content, setContent] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)
    setIsPending(true)

    const result = await postActionUpdate(actionItemId, content.trim())
    setIsPending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setUpdates((prev) => [...prev, result.data])
    setContent('')
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Updates</h2>

      {updates.length === 0 ? (
        <p className="text-sm text-gray-500 mb-6">No updates yet.</p>
      ) : (
        <ol className="space-y-4 mb-6">
          {updates.map((update) => (
            <li key={update.id} className="flex gap-3">
              <div className="mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-blue-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {update.createdByName ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(update.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write a progress update..."
        />
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Posting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
