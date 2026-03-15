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
      return 'bg-blue-100 text-blue-700'
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-700'
    case 'closed':
    case 'draft':
    default:
      return 'bg-gray-100 text-gray-600'
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
      <div className="text-center py-12 text-gray-500 text-sm">No survey cycles found.</div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Survey Cycles</h2>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3">
        {surveys.map((survey) => (
          <div
            key={survey.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">{survey.title}</span>
              <span
                className={`text-xs rounded px-2 py-0.5 font-medium ${statusBadgeClasses(survey.status)}`}
              >
                {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
              </span>
              {survey.archived && (
                <span className="bg-gray-200 text-gray-600 text-xs rounded px-2 py-0.5">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {new Date(survey.createdAt).toLocaleDateString()}
              </span>

              {!survey.archived && survey.status === 'closed' && (
                <button
                  onClick={() => handleArchive(survey.id)}
                  disabled={archivingId === survey.id}
                  className="text-sm text-gray-500 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
