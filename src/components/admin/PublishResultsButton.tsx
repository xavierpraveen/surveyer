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
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-success-muted text-success-text">
        Published
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
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
