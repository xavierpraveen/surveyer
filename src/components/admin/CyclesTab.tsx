'use client'

import { useState } from 'react'
import { archiveSurvey } from '@/lib/actions/settings'

interface SurveyItem {
  id: string
  title: string
  status: string
  archived: boolean
  createdAt: string
}

interface CyclesTabProps {
  initialSurveys: SurveyItem[]
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-success-muted text-success-text'
    case 'scheduled':
      return 'bg-warning-muted text-warning-text'
    case 'closed':
    case 'draft':
    default:
      return 'bg-surface-2 text-fg-muted'
  }
}

export default function CyclesTab({ initialSurveys }: CyclesTabProps) {
  const [surveys, setSurveys] = useState<SurveyItem[]>(initialSurveys)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleArchive(surveyId: string) {
    setArchivingId(surveyId)
    setErrorMsg(null)

    const result = await archiveSurvey(surveyId)

    if (result.success) {
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, archived: true } : s))
      )
    } else {
      setErrorMsg(result.error ?? 'Failed to archive survey')
    }

    setArchivingId(null)
  }

  if (surveys.length === 0) {
    return (
      <div className="text-center py-12 text-fg-muted text-sm">No survey cycles found.</div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-bold tracking-tight text-fg mb-4">Survey Cycles</h2>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-error-muted border border-error px-4 py-3 text-sm text-error-text" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3">
        {surveys.map((survey) => (
          <div
            key={survey.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-fg">{survey.title}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClasses(survey.status)}`}
              >
                {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
              </span>
              {survey.archived && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-surface-2 text-fg-subtle">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-fg-subtle">
                {new Date(survey.createdAt).toLocaleDateString()}
              </span>

              {!survey.archived && survey.status === 'closed' && (
                <button
                  onClick={() => handleArchive(survey.id)}
                  disabled={archivingId === survey.id}
                  className="bg-error hover:bg-error-text text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                >
                  {archivingId === survey.id ? 'Archiving...' : 'Archive'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
