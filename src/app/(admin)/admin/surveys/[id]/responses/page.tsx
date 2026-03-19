import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSurveyRespondents } from '@/lib/actions/survey'
import RespondentsList from '@/components/admin/RespondentsList'
import type { Survey } from '@/lib/types/survey'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResponsesPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: surveyData, error: surveyError } = await db
    .from('surveys')
    .select('id, title, status')
    .eq('id', id)
    .single()

  if (surveyError || !surveyData) notFound()
  const survey = surveyData as Survey

  const result = await getSurveyRespondents(id)
  const { respondents, isAnonymous, total } = result.success
    ? result.data
    : { respondents: [], isAnonymous: false, total: 0 }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-surface border-b border-border px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <a href="/admin/surveys" className="hover:text-fg transition-colors">
            Surveys
          </a>
          <span className="text-fg-subtle">/</span>
          <a
            href={`/admin/surveys/${id}`}
            className="hover:text-fg transition-colors truncate max-w-[200px]"
          >
            {survey.title}
          </a>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg font-medium">Responses</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <RespondentsList respondents={respondents} isAnonymous={isAnonymous} total={total} />
      </div>
    </div>
  )
}
