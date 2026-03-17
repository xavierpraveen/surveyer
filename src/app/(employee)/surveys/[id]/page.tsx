import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getMyDraft, checkSubmissionStatus } from '@/lib/actions/response'
import SurveyWizard from '@/components/survey/SurveyWizard'
import { sectionTargetsDepartment } from '@/lib/survey-targeting'
import { normalizeQuestionRow } from '@/lib/actions/survey-compat'
import type {
  Survey,
  SurveySection,
  SurveyQuestion,
  QuestionOption,
  ResponseDraft,
} from '@/lib/types/survey'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SurveyPage({ params }: PageProps) {
  const { id: surveyId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user's department name for section targeting
  const { data: profileData } = await db
    .from('profiles')
    .select('department_id, departments(name)')
    .eq('id', user.id)
    .single()
  const userDepartment: string =
    (profileData?.departments as { name?: string } | null)?.name ?? ''

  // Fetch survey
  const { data: surveyData, error: surveyError } = await db
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single()

  if (surveyError || !surveyData) {
    notFound()
  }

  const survey = surveyData as Survey

  // Check if already submitted — redirect to confirmation (read-only)
  const statusResult = await checkSubmissionStatus(surveyId)
  if (statusResult.success && statusResult.data === 'submitted') {
    redirect(`/surveys/${surveyId}/confirmation`)
  }

  // If survey is not open, show message
  if (survey.status !== 'open') {
    return (
      <div className="max-w-3xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-surface border border-border rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold tracking-snug text-fg mb-2">{survey.title}</h1>
          <p className="text-fg-muted">
            {survey.status === 'scheduled'
              ? 'This survey is not yet open. Please check back later.'
              : 'This survey is not currently open.'}
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Fetch sections ordered by display_order
  const { data: sectionsData } = await db
    .from('survey_sections')
    .select('*')
    .eq('survey_id', surveyId)
    .order('display_order', { ascending: true })

  const allSections: SurveySection[] = (sectionsData ?? []) as SurveySection[]

  // Filter sections by department targeting (empty target_roles = show to all)
  const filteredSections = allSections.filter((s) => {
    return sectionTargetsDepartment(s.target_roles, userDepartment)
  })

  if (filteredSections.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-surface border border-border rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold tracking-snug text-fg mb-2">{survey.title}</h1>
          <p className="text-fg-muted">No sections in this survey are targeted to your role.</p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Fetch questions for all sections
  const sectionIds = filteredSections.map((s) => s.id)

  const { data: questionsData } = await db
    .from('questions')
    .select('*')
    .in('survey_section_id', sectionIds)
    .order('display_order', { ascending: true })

  const allQuestions: SurveyQuestion[] = ((questionsData ?? []) as Record<string, unknown>[]).map(normalizeQuestionRow)

  // Build questionsMap: sectionId -> questions[]
  const questionsMap: Record<string, SurveyQuestion[]> = {}
  for (const section of filteredSections) {
    questionsMap[section.id] = allQuestions.filter((q) => q.survey_section_id === section.id)
  }

  // Fetch options for all questions
  const questionIds = allQuestions.map((q) => q.id)
  const optionsMap: Record<string, QuestionOption[]> = {}

  if (questionIds.length > 0) {
    const { data: optionsData } = await db
      .from('question_options')
      .select('*')
      .in('question_id', questionIds)
      .order('display_order', { ascending: true })

    const allOptions: QuestionOption[] = (optionsData ?? []) as QuestionOption[]
    for (const option of allOptions) {
      if (!optionsMap[option.question_id]) {
        optionsMap[option.question_id] = []
      }
      optionsMap[option.question_id].push(option)
    }
  }

  // Fetch existing draft
  const draftResult = await getMyDraft(surveyId)
  const initialDraft: ResponseDraft | null = draftResult.success ? draftResult.data : null
  const initialSectionIndex = initialDraft?.last_section_index ?? 0

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <a href="/dashboard" className="text-sm text-brand-text hover:underline">
          &larr; Back to Dashboard
        </a>
        <h1 className="text-2xl font-extrabold tracking-snug text-fg mt-3">{survey.title}</h1>
        {survey.description && (
          <p className="text-fg-muted mt-1">{survey.description}</p>
        )}
      </div>
      <SurveyWizard
        survey={survey}
        sections={filteredSections}
        questionsMap={questionsMap}
        optionsMap={optionsMap}
        initialDraft={initialDraft}
        initialSectionIndex={initialSectionIndex}
      />
    </div>
  )
}
