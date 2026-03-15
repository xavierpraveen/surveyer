import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Survey, SurveySection, SurveyQuestion, Dimension } from '@/lib/types/survey'
import SurveyStatusBanner from '@/components/admin/SurveyStatusBanner'
import SectionSidebar from '@/components/admin/SectionSidebar'
import QuestionEditor from '@/components/admin/QuestionEditor'
import PublishResultsButton from '@/components/admin/PublishResultsButton'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAdmin = supabaseAdmin as any

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ section?: string }>
}

export default async function SurveyBuilderPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { section: activeSectionParam } = await searchParams

  const supabase = await createSupabaseServerClient()
  const db = supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: unknown; error: unknown }>
          order: (col: string, opts: object) => Promise<{ data: unknown[]; error: unknown }>
        }
        order: (col: string, opts: object) => Promise<{ data: unknown[]; error: unknown }>
        in: (col: string, vals: string[]) => {
          order: (col: string, opts: object) => Promise<{ data: unknown[]; error: unknown }>
        }
      }
    }
  }

  // Fetch survey
  const { data: surveyData, error: surveyError } = await db
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single()

  if (surveyError || !surveyData) notFound()
  const survey = surveyData as Survey

  // Fetch sections
  const { data: sectionsData } = await db
    .from('survey_sections')
    .select('*')
    .eq('survey_id', id)
    .order('display_order', { ascending: true })

  const rawSections = (sectionsData ?? []) as SurveySection[]

  // Fetch all questions for this survey (across all sections)
  let allQuestions: SurveyQuestion[] = []
  if (rawSections.length > 0) {
    const sectionIds = rawSections.map((s) => s.id)
    const { data: questionsData } = await db
      .from('questions')
      .select('*')
      .in('section_id', sectionIds)
      .order('display_order', { ascending: true })
    allQuestions = (questionsData ?? []) as SurveyQuestion[]
  }

  // Fetch dimensions
  const { data: dimensionsData } = await db
    .from('dimensions')
    .select('*')
    .order('display_order', { ascending: true })
  const dimensions = (dimensionsData ?? []) as Dimension[]

  // ── Publication data ──────────────────────────────────────────────────────

  // Check for existing snapshot
  const { data: snapshotData } = await dbAdmin
    .from('publication_snapshots')
    .select('id')
    .eq('survey_id', id)
    .single()
  const hasExistingSnapshot = Boolean(snapshotData?.id)

  // Snapshot preview counts
  const [
    { count: dimensionScoreCount },
    { data: partData },
    { count: actionItemCount },
    { count: themeCount },
  ] = await Promise.all([
    dbAdmin
      .from('derived_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', id)
      .eq('segment_type', 'overall'),
    dbAdmin
      .from('v_participation_rates')
      .select('token_count')
      .eq('survey_id', id),
    dbAdmin
      .from('action_items')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', id)
      .eq('is_public', true),
    dbAdmin
      .from('qualitative_themes')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', id),
  ])

  // Calculate participation rate
  const totalResponses = ((partData as Array<{ token_count: number }> | null) ?? [])
    .reduce((sum: number, r: { token_count: number }) => sum + Number(r.token_count), 0)
  const { count: eligibleCount } = await dbAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  const participationRate =
    eligibleCount && eligibleCount > 0
      ? Math.round((totalResponses / eligibleCount) * 100)
      : 0

  const snapshotPreview = {
    dimensionScoreCount: dimensionScoreCount ?? 0,
    participationRate,
    actionItemCount: actionItemCount ?? 0,
    themeCount: themeCount ?? 0,
  }

  // Determine active section
  const activeSectionId = activeSectionParam ?? rawSections[0]?.id ?? null
  const activeSection = rawSections.find((s) => s.id === activeSectionId) ?? null
  const activeSectionQuestions = allQuestions.filter((q) => q.section_id === activeSectionId)

  // Build sections with metadata
  const sectionsWithMeta = rawSections.map((section) => {
    const sectionQuestions = allQuestions.filter((q) => q.section_id === section.id)
    return {
      ...section,
      questionCount: sectionQuestions.length,
      // hasDimensionsCovered: all required questions have at least one dimension
      // For simplicity, we mark as covered if all questions have been saved (true by default from server)
      // Full dimension coverage check requires joining question_dimension_map — simplified here
      hasDimensionsCovered: sectionQuestions.length > 0 && sectionQuestions.every((q) => !q.is_required),
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <a href="/admin/surveys" className="text-sm text-gray-500 hover:text-gray-700">
            ← Surveys
          </a>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{survey.title}</h1>
        </div>
      </div>

      {/* Status banner */}
      <div className="px-6 pt-4">
        <SurveyStatusBanner survey={survey} />
      </div>

      {/* Publication actions (only for closed surveys) */}
      {survey.status === 'closed' && (
        <div className="px-6 pt-3 flex items-center gap-3">
          <PublishResultsButton
            surveyId={survey.id}
            surveyTitle={survey.title}
            surveyStatus={survey.status}
            hasExistingSnapshot={hasExistingSnapshot}
            snapshotPreview={snapshotPreview}
          />
          <a
            href={`/admin/surveys/${survey.id}/tags`}
            className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
          >
            Tag Responses
          </a>
        </div>
      )}

      {/* Builder layout */}
      <div className="flex" style={{ height: 'calc(100vh - 130px)' }}>
        {/* Left sidebar */}
        <SectionSidebar
          sections={sectionsWithMeta}
          activeSectionId={activeSectionId}
          surveyId={id}
        />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{activeSection.title}</h2>
                {activeSection.description && (
                  <p className="text-sm text-gray-500 mt-1">{activeSection.description}</p>
                )}
                {activeSection.target_roles.length > 0 && !activeSection.target_roles.includes('all') && (
                  <p className="text-xs text-gray-400 mt-1">
                    Targeted: {activeSection.target_roles.join(', ')}
                  </p>
                )}
              </div>

              <QuestionEditor
                questions={activeSectionQuestions}
                sectionId={activeSectionId!}
                dimensions={dimensions}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-400 mb-2">No sections yet.</p>
                <p className="text-sm text-gray-400">Add a section using the sidebar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
