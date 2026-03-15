import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkSubmissionStatus } from '@/lib/actions/response'
import type { Survey, SurveyStatus, SubmissionStatus } from '@/lib/types/survey'
import { signOut } from '@/lib/actions/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

function getDaysRemaining(closesAt: Date | string | null): number | null {
  if (!closesAt) return null
  const close = new Date(closesAt)
  const now = new Date()
  const diff = close.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

interface SurveyCard {
  survey: Survey
  submissionStatus: SubmissionStatus
}

function StatusBadge({
  survey,
  submissionStatus,
}: {
  survey: Survey
  submissionStatus: SubmissionStatus
}) {
  if (submissionStatus === 'submitted') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        COMPLETED
      </span>
    )
  }

  if (survey.status === 'scheduled') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        UPCOMING
      </span>
    )
  }

  if (survey.status === 'open') {
    const days = getDaysRemaining(survey.closes_at)
    if (days !== null && days <= 7) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          CLOSES IN {days}d
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        OPEN
      </span>
    )
  }

  return null
}

function SurveyCardCTA({
  survey,
  submissionStatus,
}: {
  survey: Survey
  submissionStatus: SubmissionStatus
}) {
  if (submissionStatus === 'submitted') {
    return (
      <Link
        href={`/surveys/${survey.id}/confirmation`}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-colors"
      >
        View Submission
      </Link>
    )
  }

  if (survey.status === 'scheduled') {
    return (
      <button
        disabled
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
      >
        Coming soon
      </button>
    )
  }

  if (survey.status === 'open') {
    const label = submissionStatus === 'in_progress' ? 'Resume Survey' : 'Take Survey'
    return (
      <Link
        href={`/surveys/${survey.id}`}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        {label}
      </Link>
    )
  }

  return null
}

export default async function EmployeeDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const userRole: string = (user.app_metadata?.role as string) ?? 'employee'

  // Fetch surveys that are open or scheduled
  const { data: surveysData } = await db
    .from('surveys')
    .select('*')
    .in('status', ['open', 'scheduled'])
    .order('created_at', { ascending: false })

  const allSurveys: Survey[] = (surveysData ?? []) as Survey[]

  // Filter surveys by role targeting — keep surveys with at least one section matching user's role or 'all'
  const filteredSurveys: Survey[] = []
  for (const survey of allSurveys) {
    const { data: sections } = await db
      .from('survey_sections')
      .select('target_roles')
      .eq('survey_id', survey.id)

    const hasMatchingSection = (sections ?? []).some((s: { target_roles: string[] }) => {
      return (
        !s.target_roles ||
        s.target_roles.length === 0 ||
        s.target_roles.includes('all') ||
        s.target_roles.includes(userRole)
      )
    })

    if (hasMatchingSection) {
      filteredSurveys.push(survey)
    }
  }

  // Also include surveys the user has already submitted (participation_tokens)
  const { data: tokenData } = await db
    .from('participation_tokens')
    .select('survey_id')
    .eq('user_id', user.id)

  const submittedSurveyIds = new Set<string>(
    ((tokenData ?? []) as { survey_id: string }[]).map((t) => t.survey_id)
  )

  // For submitted surveys not already in filtered list, fetch the survey details
  const alreadyFetched = new Set(filteredSurveys.map((s) => s.id))
  const submittedToFetch = [...submittedSurveyIds].filter((id) => !alreadyFetched.has(id))

  if (submittedToFetch.length > 0) {
    const { data: submittedSurveysData } = await db
      .from('surveys')
      .select('*')
      .in('id', submittedToFetch)

    if (submittedSurveysData) {
      filteredSurveys.push(...(submittedSurveysData as Survey[]))
    }
  }

  // Build card data with submission status
  const surveyCards: SurveyCard[] = []
  for (const survey of filteredSurveys) {
    let submissionStatus: SubmissionStatus = 'not_started'

    if (submittedSurveyIds.has(survey.id)) {
      submissionStatus = 'submitted'
    } else {
      const statusResult = await checkSubmissionStatus(survey.id)
      if (statusResult.success) {
        submissionStatus = statusResult.data
      }
    }

    surveyCards.push({ survey, submissionStatus })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Surveys</h1>
            <p className="text-sm text-gray-500 mt-1">
              Surveys available for your role
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.email} &middot; {userRole}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {surveyCards.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No surveys available right now.</p>
            <p className="text-sm mt-2">Check back later for new surveys.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveyCards.map(({ survey, submissionStatus }) => (
              <div
                key={survey.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 text-base leading-tight">
                    {survey.title}
                  </h2>
                  <StatusBadge survey={survey} submissionStatus={submissionStatus} />
                </div>

                {survey.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{survey.description}</p>
                )}

                <div className="mt-auto pt-2">
                  <SurveyCardCTA survey={survey} submissionStatus={submissionStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
