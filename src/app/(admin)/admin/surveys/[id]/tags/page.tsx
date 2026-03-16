import { notFound } from 'next/navigation'
import { getTaggableAnswers } from '@/lib/actions/tagging'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import TaggingWorkspace from '@/components/admin/TaggingWorkspace'
import type { Survey } from '@/lib/types/survey'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TagsPage({ params }: PageProps) {
  const { id } = await params

  // Fetch survey title for the heading
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

  // Fetch taggable answers
  const answersResult = await getTaggableAnswers(id)
  const answers = answersResult.success ? answersResult.data : []

  return (
    <div>
      {/* Top bar */}
      <div className="bg-surface border-b border-border px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <a href="/admin/surveys" className="hover:text-fg transition-colors">
            Surveys
          </a>
          <span className="text-fg-subtle">/</span>
          <a href={`/admin/surveys/${id}`} className="hover:text-fg transition-colors truncate max-w-[200px]">
            {survey.title}
          </a>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg font-medium">Tag Responses</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Count summary */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold tracking-snug text-fg">Tag Responses</h1>
          <p className="text-sm text-fg-muted mt-1">
            {answers.length} open-text response{answers.length !== 1 ? 's' : ''} to review
          </p>
        </div>

        {answers.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg shadow-sm p-8 text-center">
            <p className="text-fg-muted">No open-text responses found for this survey.</p>
          </div>
        ) : (
          <TaggingWorkspace surveyId={id} initialAnswers={answers} />
        )}
      </div>
    </div>
  )
}
