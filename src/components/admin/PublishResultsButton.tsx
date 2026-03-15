'use client'

import { useState } from 'react'
import PublishConfirmModal from './PublishConfirmModal'

interface PublishResultsButtonProps {
  surveyId: string
  surveyTitle: string
  surveyStatus: string // 'draft' | 'open' | 'closed' | 'scheduled'
  hasExistingSnapshot: boolean // true = already published
  // Pre-fetched counts for modal preview (from server — pass as props to avoid client fetch)
  snapshotPreview: {
    dimensionScoreCount: number
    participationRate: number
    actionItemCount: number
    themeCount: number
  }
}

export default function PublishResultsButton({
  surveyId,
  surveyTitle,
  surveyStatus,
  hasExistingSnapshot,
  snapshotPreview,
}: PublishResultsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPublished, setIsPublished] = useState(hasExistingSnapshot)

  // Only visible for closed surveys
  if (surveyStatus !== 'closed') {
    return null
  }

  if (isPublished) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
        Published
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
      >
        Publish Results
      </button>

      {isModalOpen && (
        <PublishConfirmModal
          surveyId={surveyId}
          surveyTitle={surveyTitle}
          dimensionScoreCount={snapshotPreview.dimensionScoreCount}
          participationRate={snapshotPreview.participationRate}
          actionItemCount={snapshotPreview.actionItemCount}
          themeCount={snapshotPreview.themeCount}
          onClose={() => setIsModalOpen(false)}
          onPublished={() => {
            setIsPublished(true)
            setIsModalOpen(false)
          }}
        />
      )}
    </>
  )
}
