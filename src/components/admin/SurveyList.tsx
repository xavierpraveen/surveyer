'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Survey, SurveyStatus } from '@/lib/types/survey'
import { deleteSurvey, duplicateSurvey } from '@/lib/actions/survey'

interface Props {
  surveys: Survey[]
}

const STATUS_BADGE: Record<SurveyStatus, string> = {
  draft: 'bg-surface-2 text-fg-muted',
  scheduled: 'bg-warning-muted text-warning-text',
  open: 'bg-success-muted text-success-text',
  closed: 'bg-surface-2 text-fg-subtle',
}

export default function SurveyList({ surveys }: Props) {
  const router = useRouter()
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDuplicate(surveyId: string) {
    setDuplicating(surveyId)
    setError(null)
    const result = await duplicateSurvey(surveyId)
    setDuplicating(null)
    if (!result.success) {
      setError(result.error ?? 'Failed to duplicate survey')
    } else {
      router.refresh()
    }
  }

  async function handleDelete(surveyId: string, surveyTitle: string) {
    if (!window.confirm(`Delete "${surveyTitle}" survey? This cannot be undone.`)) return
    setDeleting(surveyId)
    setError(null)
    const result = await deleteSurvey(surveyId)
    setDeleting(null)
    if (!result.success) {
      setError(result.error ?? 'Failed to delete survey')
    } else {
      router.refresh()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-snug text-fg">Surveys</h1>
          <p className="text-sm text-fg-muted mt-1">{surveys.length} survey{surveys.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/surveys/compare"
            className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150"
          >
            Compare Surveys
          </Link>
          <Link
            href="/admin/surveys/new"
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            New Survey
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-muted border border-error rounded-md text-sm text-error-text">
          {error}
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center shadow-sm">
          <p className="text-fg-muted mb-4">No surveys yet.</p>
          <Link
            href="/admin/surveys/new"
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            Create your first survey
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-fg">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Anonymous</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-fg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-bold tracking-tight text-fg">{survey.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[survey.status]}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {survey.is_anonymous ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-3 text-fg-subtle">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/surveys/${survey.id}`}
                        className="bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDuplicate(survey.id)}
                        disabled={duplicating === survey.id || deleting === survey.id}
                        className="bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none disabled:opacity-50"
                      >
                        {duplicating === survey.id ? 'Copying...' : 'Duplicate'}
                      </button>
                      <button
                        onClick={() => handleDelete(survey.id, survey.title)}
                        disabled={duplicating === survey.id || deleting === survey.id}
                        className="bg-error hover:bg-error-text text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none disabled:opacity-50"
                      >
                        {deleting === survey.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
