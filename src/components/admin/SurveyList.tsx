'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Survey, SurveyStatus } from '@/lib/types/survey'
import { duplicateSurvey } from '@/lib/actions/survey'

interface Props {
  surveys: Survey[]
}

const STATUS_BADGE: Record<SurveyStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-yellow-100 text-yellow-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-600',
}

export default function SurveyList({ surveys }: Props) {
  const router = useRouter()
  const [duplicating, setDuplicating] = useState<string | null>(null)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Surveys</h1>
          <p className="text-sm text-gray-500 mt-1">{surveys.length} survey{surveys.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/surveys/new"
          className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
        >
          New Survey
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No surveys yet.</p>
          <Link
            href="/admin/surveys/new"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
          >
            Create your first survey
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Anonymous</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{survey.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[survey.status]}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {survey.is_anonymous ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/surveys/${survey.id}`}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDuplicate(survey.id)}
                        disabled={duplicating === survey.id}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {duplicating === survey.id ? 'Copying...' : 'Duplicate'}
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
