'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Survey, SurveyStatus } from '@/lib/types/survey'
import { transitionSurveyStatus } from '@/lib/actions/survey'

interface Props {
  survey: Survey
}

const STATUS_STYLE: Record<SurveyStatus, string> = {
  draft: 'border-gray-400 bg-gray-50',
  scheduled: 'border-yellow-400 bg-yellow-50',
  open: 'border-green-500 bg-green-50',
  closed: 'border-slate-400 bg-slate-50',
}

const STATUS_LABEL: Record<SurveyStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  open: 'Open',
  closed: 'Closed',
}

export default function SurveyStatusBanner({ survey }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [opensAt, setOpensAt] = useState('')
  const [closesAt, setClosesAt] = useState('')

  async function handleTransition(toStatus: SurveyStatus, extra?: { opens_at?: string; closes_at?: string }) {
    setLoading(true)
    setError(null)
    const input: Record<string, unknown> = { survey_id: survey.id, to_status: toStatus }
    if (extra?.opens_at) input.opens_at = new Date(extra.opens_at).toISOString()
    if (extra?.closes_at) input.closes_at = new Date(extra.closes_at).toISOString()
    const result = await transitionSurveyStatus(input)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Transition failed')
    } else {
      setShowScheduleForm(false)
      router.refresh()
    }
  }

  return (
    <div className={`sticky top-0 z-10 border-l-4 px-4 py-3 mb-4 ${STATUS_STYLE[survey.status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</span>
          <p className="font-semibold text-gray-900">{STATUS_LABEL[survey.status]}</p>
          {survey.status === 'scheduled' && survey.opens_at && (
            <p className="text-xs text-gray-500 mt-0.5">
              Opens: {new Date(survey.opens_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-red-600 mr-2">{error}</p>}

          {survey.status === 'draft' && (
            <>
              <button
                onClick={() => setShowScheduleForm((v) => !v)}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Schedule
              </button>
              <button
                onClick={() => handleTransition('open')}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Opening...' : 'Open Now'}
              </button>
            </>
          )}

          {survey.status === 'scheduled' && (
            <button
              onClick={() => handleTransition('open')}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Opening...' : 'Open Now'}
            </button>
          )}

          {survey.status === 'open' && (
            <button
              onClick={() => handleTransition('closed')}
              disabled={loading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Closing...' : 'Close Survey'}
            </button>
          )}

          {survey.status === 'closed' && (
            <span className="text-sm text-slate-500 italic">Survey closed</span>
          )}
        </div>
      </div>

      {/* Schedule inline form */}
      {showScheduleForm && survey.status === 'draft' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opens at</label>
              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Closes at (optional)</label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800"
              />
            </div>
            <button
              onClick={() => handleTransition('scheduled', { opens_at: opensAt, closes_at: closesAt || undefined })}
              disabled={loading || !opensAt}
              className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
            <button
              onClick={() => setShowScheduleForm(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
