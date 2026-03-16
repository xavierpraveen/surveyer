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

interface ActionItemRow {
  id: string
  title: string
  status: 'identified' | 'planned' | 'in_progress' | 'blocked' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'critical' | null
  target_date: string | null
  owner_name: string | null
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
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-surface-2 text-fg-muted">
        COMPLETED
      </span>
    )
  }

  if (survey.status === 'scheduled') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-brand-muted text-brand-text">
        UPCOMING
      </span>
    )
  }

  if (survey.status === 'open') {
    const days = getDaysRemaining(survey.closes_at)
    if (days !== null && days <= 7) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-warning-muted text-warning-text">
          CLOSES IN {days}d
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-success-muted text-success-text">
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
        className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 inline-flex items-center"
      >
        View Submission
      </Link>
    )
  }

  if (survey.status === 'scheduled') {
    return (
      <button
        disabled
        className="bg-surface-2 border border-border text-fg-subtle font-medium text-sm px-3.5 py-2 rounded-md cursor-not-allowed disabled:opacity-50 inline-flex items-center"
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
        className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 inline-flex items-center"
      >
        {label}
      </Link>
    )
  }

  return null
}

function ActionStatusBadge({ status }: { status: ActionItemRow['status'] }) {
  const map: Record<ActionItemRow['status'], { label: string; className: string }> = {
    identified:  { label: 'Identified',  className: 'bg-surface-2 text-fg-muted' },
    planned:     { label: 'Planned',     className: 'bg-brand-muted text-brand-text' },
    in_progress: { label: 'In Progress', className: 'bg-warning-muted text-warning-text' },
    blocked:     { label: 'Blocked',     className: 'bg-error-muted text-error-text' },
    completed:   { label: 'Completed',   className: 'bg-success-muted text-success-text' },
  }
  const { label, className } = map[status] ?? map.identified
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}

function ActionPriorityBadge({ priority }: { priority: ActionItemRow['priority'] }) {
  if (!priority) return null
  const map: Record<string, { label: string; className: string }> = {
    low:      { label: 'Low',      className: 'bg-surface-2 text-fg-muted' },
    medium:   { label: 'Medium',   className: 'bg-brand-muted text-brand-text' },
    high:     { label: 'High',     className: 'bg-warning-muted text-warning-text' },
    critical: { label: 'Critical', className: 'bg-error-muted text-error-text' },
  }
  const { label, className } = map[priority] ?? { label: priority, className: 'bg-surface-2 text-fg-muted' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
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

  // Fetch surveys that are open or scheduled — all employees see all active surveys
  const { data: surveysData } = await db
    .from('surveys')
    .select('*')
    .in('status', ['open', 'scheduled'])
    .order('created_at', { ascending: false })

  const filteredSurveys: Survey[] = (surveysData ?? []) as Survey[]

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

  // ── Action Plans: fetch public action items for the manager's department ──
  // Reads manager's department_id from their profile, then fetches
  // is_public action items matching that department (or company-wide if dept is null).
  let actionItems: ActionItemRow[] = []

  const { data: managerProfile } = await db
    .from('profiles')
    .select('department_id')
    .eq('id', user.id)
    .single()

  const managerDeptId: string | null =
    (managerProfile as { department_id: string | null } | null)?.department_id ?? null

  if (managerDeptId) {
    // Fetch action items where is_public=true AND department matches manager's dept
    const { data: actionRows } = await db
      .from('action_items')
      .select('id, title, status, priority, target_date, owner_id')
      .eq('is_public', true)
      .eq('department_id', managerDeptId)
      .order('target_date', { ascending: true, nullsFirst: false })

    const rawRows = (actionRows as Array<{
      id: string
      title: string
      status: string
      priority: string | null
      target_date: string | null
      owner_id: string | null
    }> | null) ?? []

    // Resolve owner names in a single query
    const ownerIds = [...new Set(rawRows.map((r) => r.owner_id).filter((id): id is string => id !== null))]
    const ownerMap = new Map<string, string>()

    if (ownerIds.length > 0) {
      const { data: ownerRows } = await db
        .from('profiles')
        .select('id, full_name')
        .in('id', ownerIds)

      for (const o of (ownerRows as Array<{ id: string; full_name: string }> | null) ?? []) {
        ownerMap.set(o.id, o.full_name)
      }
    }

    actionItems = rawRows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status as ActionItemRow['status'],
      priority: r.priority as ActionItemRow['priority'],
      target_date: r.target_date,
      owner_name: r.owner_id ? (ownerMap.get(r.owner_id) ?? null) : null,
    }))
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-snug text-fg">My Surveys</h1>
          <p className="text-sm text-fg-muted mt-1">
            Surveys available for your role
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-fg-muted">
            {user.email} &middot; {userRole}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {surveyCards.length === 0 ? (
        <div className="text-sm text-fg-muted text-center py-12">
          <p className="text-base">No surveys available right now.</p>
          <p className="mt-2">Check back later for new surveys.</p>
          <a
            href="/results"
            className="mt-6 inline-flex items-center text-sm text-brand-text hover:underline"
          >
            View published results
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {surveyCards.map(({ survey, submissionStatus }) => (
            <div
              key={survey.id}
              className="bg-surface border border-border rounded-lg shadow-sm p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-150 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold tracking-tight text-fg text-base leading-tight">
                  {survey.title}
                </h2>
                <StatusBadge survey={survey} submissionStatus={submissionStatus} />
              </div>

              {survey.description && (
                <p className="text-sm text-fg-muted line-clamp-2">{survey.description}</p>
              )}

              <div className="mt-auto pt-2">
                <SurveyCardCTA survey={survey} submissionStatus={submissionStatus} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Plans section — only shown to managers (requires department match) */}
      {managerDeptId !== null && (
        <div className="mt-10">
          <h2 className="text-lg font-extrabold tracking-tight text-fg mb-4">Action Plans</h2>
          {actionItems.length === 0 ? (
            <div className="text-sm text-fg-muted text-center py-8 bg-surface border border-border rounded-lg">
              No action plans for your department yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface border border-border rounded-lg shadow-sm p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-fg text-sm leading-snug">{item.title}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ActionStatusBadge status={item.status} />
                      <ActionPriorityBadge priority={item.priority} />
                    </div>
                  </div>
                  {(item.owner_name ?? item.target_date) && (
                    <div className="flex items-center gap-3 text-xs text-fg-muted">
                      {item.owner_name && <span>Owner: {item.owner_name}</span>}
                      {item.target_date && (
                        <span>
                          Due:{' '}
                          {new Date(item.target_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-border">
        <a href="/results" className="text-sm text-brand-text hover:underline">
          View published survey results →
        </a>
      </div>
    </div>
  )
}
