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
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/admin/surveys" className="hover:text-gray-700">
            Surveys
          </a>
          <span className="text-gray-300">/</span>
          <a href={`/admin/surveys/${id}`} className="hover:text-gray-700 truncate max-w-[200px]">
            {survey.title}
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">Tag Responses</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Count summary */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Tag Responses</h1>
          <p className="text-sm text-gray-500">
            {answers.length} open-text response{answers.length !== 1 ? 's' : ''} to review
          </p>
        </div>

        {answers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No open-text responses found for this survey.</p>
          </div>
        ) : (
          <TaggingWorkspace surveyId={id} initialAnswers={answers} />
        )}
      </div>
    </div>
  )
}
