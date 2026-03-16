'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SurveyStatus } from '@/lib/types/survey'

interface ConfirmationClientProps {
  surveyTitle: string
  surveyStatus: SurveyStatus
  participationRate: number
  participationCount: number
}

export default function ConfirmationClient({
  surveyTitle,
  surveyStatus,
  participationRate,
  participationCount,
}: ConfirmationClientProps) {
  const router = useRouter()

  // Auto-redirect after 5 seconds only when the user just submitted (survey still open)
  // For deliberate "View Submission" navigation (read-only), we keep them on the page
  const shouldAutoRedirect = surveyStatus === 'open'

  useEffect(() => {
    if (!shouldAutoRedirect) return
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router, shouldAutoRedirect])

  return (
    <div className="max-w-3xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
      <div className="bg-surface border border-border rounded-lg shadow-sm p-8 w-full text-center">
        {/* Checkmark icon */}
        <div className="mx-auto mb-6 w-16 h-16 bg-success-muted rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-bold tracking-snug text-fg mb-2">{surveyTitle}</h1>
        <p className="text-sm text-fg-muted mt-2 mb-6">Thank you for participating!</p>

        {/* Participation rate */}
        <div className="bg-brand-muted border border-border rounded-lg px-6 py-4 mb-6">
          <p className="text-3xl font-bold text-brand tabular-nums mb-1">{participationRate}%</p>
          <p className="text-sm text-fg-muted">
            of employees have responded so far
            {participationCount > 0 && (
              <span className="text-fg-subtle ml-1">({participationCount} responses)</span>
            )}
          </p>
        </div>

        <p className="text-sm text-fg-muted mb-8">
          Results will be shared after the survey closes.
        </p>

        <a
          href="/dashboard"
          className="inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150"
        >
          Back to Surveys
        </a>

        {shouldAutoRedirect && (
          <p className="text-xs text-fg-subtle mt-4">
            Redirecting to dashboard in 5 seconds&hellip;
          </p>
        )}
      </div>
    </div>
  )
}
