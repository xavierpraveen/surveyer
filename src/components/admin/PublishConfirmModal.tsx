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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Publish Results: {surveyTitle}
        </h2>

        {/* Summary preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-3">
            You are about to publish an immutable snapshot of these results:
          </p>
          <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
            <li>{dimensionScoreCount} dimension scores</li>
            <li>{participationRate}% participation rate</li>
            <li>{actionItemCount} public action items</li>
            <li>{themeCount} qualitative themes</li>
          </ul>
        </div>

        {/* Warning box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-5">
          <p className="text-sm text-yellow-800 font-medium">
            This action cannot be undone. The snapshot will be permanent.
          </p>
        </div>

        {/* Inline error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish Results'}
          </button>
        </div>
      </div>
    </div>
  )
}
