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
      <h2 className="text-base font-bold tracking-tight text-fg mb-4">Progress Updates</h2>

      {updates.length === 0 ? (
        <p className="text-sm text-fg-muted mb-6">No updates yet.</p>
      ) : (
        <ol className="space-y-4 mb-6">
          {updates.map((update) => (
            <li key={update.id} className="flex gap-3">
              <div className="mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-brand-muted border border-brand" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-fg">
                    {update.createdByName ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-fg-subtle">
                    {new Date(update.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-fg-muted whitespace-pre-wrap">{update.content}</p>
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
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Write a progress update..."
        />
        {error && (
          <div className="rounded-md bg-error-muted border border-error px-4 py-3 text-sm text-error-text" role="alert">{error}</div>
        )}
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
        >
          {isPending ? 'Posting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
