'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Survey, SurveyStatus } from '@/lib/types/survey'
import { transitionSurveyStatus } from '@/lib/actions/survey'
import { computeDerivedMetrics } from '@/lib/actions/analytics'

interface Props {
  survey: Survey
}

const STATUS_STYLE: Record<SurveyStatus, string> = {
  draft: 'border-fg-subtle bg-surface-2',
  scheduled: 'border-warning bg-warning-muted',
  open: 'border-success bg-success-muted',
  closed: 'border-fg-muted bg-surface-2',
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
  const [computing, setComputing] = useState(false)
  const [computeResult, setComputeResult] = useState<string | null>(null)

  async function handleComputeMetrics() {
    setComputing(true)
    setError(null)
    const result = await computeDerivedMetrics(survey.id)
    setComputing(false)
    if (!result.success) {
      setError(result.error ?? 'Computation failed')
    } else {
      setComputeResult(`Results computed — ${result.data.rowsInserted} metrics calculated.`)
      router.refresh()
    }
  }

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
          <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-fg-subtle">Status</span>
          <p className="font-semibold text-fg">{STATUS_LABEL[survey.status]}</p>
          {survey.status === 'scheduled' && survey.opens_at && (
            <p className="text-xs text-fg-muted mt-0.5">
              Opens: {new Date(survey.opens_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-error-text mr-2">{error}</p>}

          {survey.status === 'draft' && (
            <>
              <button
                onClick={() => setShowScheduleForm((v) => !v)}
                disabled={loading}
                className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                Schedule
              </button>
              <button
                onClick={() => handleTransition('open')}
                disabled={loading}
                className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                {loading ? 'Opening...' : 'Open Now'}
              </button>
            </>
          )}

          {survey.status === 'scheduled' && (
            <button
              onClick={() => handleTransition('open')}
              disabled={loading}
              className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              {loading ? 'Opening...' : 'Open Now'}
            </button>
          )}

          {survey.status === 'open' && (
            <button
              onClick={() => handleTransition('closed')}
              disabled={loading}
              className="bg-error hover:bg-error-text text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              {loading ? 'Closing...' : 'Close Survey'}
            </button>
          )}

          {survey.status === 'closed' && (
            <div className="flex items-center gap-3">
              {computeResult && (
                <p className="text-xs text-success-text mr-2">{computeResult}</p>
              )}
              <button
                onClick={handleComputeMetrics}
                disabled={computing}
                className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                {computing ? 'Computing...' : 'Compute Results'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule inline form */}
      {showScheduleForm && survey.status === 'draft' && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">Opens at</label>
              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">Closes at (optional)</label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
              />
            </div>
            <button
              onClick={() => handleTransition('scheduled', { opens_at: opensAt, closes_at: closesAt || undefined })}
              disabled={loading || !opensAt}
              className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              {loading ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
            <button
              onClick={() => setShowScheduleForm(false)}
              className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
