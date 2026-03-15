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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 max-w-lg w-full text-center">
        {/* Checkmark icon */}
        <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{surveyTitle}</h1>
        <p className="text-lg text-gray-700 font-medium mb-6">Thank you for participating!</p>

        {/* Participation rate */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-6 py-4 mb-6">
          <p className="text-3xl font-bold text-blue-700 mb-1">{participationRate}%</p>
          <p className="text-sm text-gray-600">
            of employees have responded so far
            {participationCount > 0 && (
              <span className="text-gray-400 ml-1">({participationCount} responses)</span>
            )}
          </p>
        </div>

        <p className="text-sm text-gray-500 mb-8">
          Results will be shared after the survey closes.
        </p>

        <a
          href="/dashboard"
          className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Surveys
        </a>

        {shouldAutoRedirect && (
          <p className="text-xs text-gray-400 mt-4">
            Redirecting to dashboard in 5 seconds&hellip;
          </p>
        )}
      </div>
    </div>
  )
}
