import { getClosedSurveys } from '@/lib/actions/analytics'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dateRange(openedAt: string | null, closedAt: string | null): string | null {
  if (!openedAt && !closedAt) return null
  if (openedAt && closedAt) return `${formatDate(openedAt)} – ${formatDate(closedAt)}`
  if (closedAt) return `Closed ${formatDate(closedAt)}`
  return null
}

export default async function ResultsIndexPage() {
  const result = await getClosedSurveys()
  const surveys = result.success ? result.data : []

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto p-6 md:p-8">

        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-text hover:underline"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-snug text-fg">Company Survey Results</h1>
          <p className="text-sm text-fg-muted mt-1">
            {surveys.length > 0
              ? `${surveys.length} closed survey cycle${surveys.length === 1 ? '' : 's'}`
              : 'All closed survey cycles'}
          </p>
        </div>

        {surveys.length === 0 ? (
          <div className="border border-border rounded-xl p-8 text-center bg-surface">
            <p className="text-fg font-semibold mb-1">No results yet</p>
            <p className="text-sm text-fg-muted">Results will appear here once a survey cycle closes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey) => {
              const range = dateRange(survey.openedAt, survey.closedAt)
              return (
                <Link
                  key={survey.id}
                  href={`/results/${survey.id}`}
                  className="group block border border-border rounded-xl p-5 bg-surface hover:bg-surface-2 hover:border-brand-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-fg">{survey.title}</p>
                        {survey.hasSnapshot && (
                          <span className="text-[11px] bg-success-muted text-success-text px-2 py-0.5 rounded-full font-semibold">
                            Published
                          </span>
                        )}
                      </div>

                      {survey.description && (
                        <p className="text-sm text-fg-muted mt-1 line-clamp-2">{survey.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {range && (
                          <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {range}
                          </span>
                        )}
                        {survey.totalResponses > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                            </svg>
                            {survey.totalResponses} {survey.totalResponses === 1 ? 'response' : 'responses'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center self-center">
                      <svg
                        className="w-4 h-4 text-fg-subtle group-hover:text-brand-text transition-colors"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
