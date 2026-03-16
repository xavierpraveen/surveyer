'use client'

import { useState } from 'react'
import { createPublicationSnapshot } from '@/lib/actions/publication'

interface PublishConfirmModalProps {
  surveyId: string
  surveyTitle: string
  // Preview counts loaded before modal opens
  dimensionScoreCount: number
  participationRate: number // 0-100
  actionItemCount: number
  themeCount: number
  onClose: () => void
  onPublished: () => void // called after successful snapshot creation
}

export default function PublishConfirmModal({
  surveyId,
  surveyTitle,
  dimensionScoreCount,
  participationRate,
  actionItemCount,
  themeCount,
  onClose,
  onPublished,
}: PublishConfirmModalProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePublish() {
    setIsPublishing(true)
    setError(null)
    try {
      const result = await createPublicationSnapshot(surveyId)
      if (result.success) {
        onPublished()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg shadow-md p-6 max-w-md w-full">
        {/* Header */}
        <h2 className="text-base font-bold tracking-tight text-fg mb-4">
          Publish Results: {surveyTitle}
        </h2>

        {/* Summary preview */}
        <div className="mb-4">
          <p className="text-sm text-fg-muted mb-3">
            You are about to publish an immutable snapshot of these results:
          </p>
          <ul className="space-y-1 text-sm text-fg-muted list-disc list-inside">
            <li>{dimensionScoreCount} dimension scores</li>
            <li>{participationRate}% participation rate</li>
            <li>{actionItemCount} public action items</li>
            <li>{themeCount} qualitative themes</li>
          </ul>
        </div>

        {/* Warning box */}
        <div className="bg-warning-muted border border-warning rounded-md p-3 mb-5">
          <p className="text-sm text-warning-text font-medium">
            This action cannot be undone. The snapshot will be permanent.
          </p>
        </div>

        {/* Inline error */}
        {error && (
          <div className="bg-error-muted border border-error rounded-md p-3 mb-4" role="alert">
            <p className="text-sm text-error-text">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            {isPublishing ? 'Publishing...' : 'Publish Results'}
          </button>
        </div>
      </div>
    </div>
  )
}
