import type { ResponseDraft } from '@/lib/types/survey'

type DraftRow = Record<string, unknown>

type DbErrorLike = {
  code?: string
  message?: string
} | null | undefined

export function normalizeDraftRow(row: DraftRow | null): ResponseDraft | null {
  if (!row) return null

  const answers =
    (row.answers as Record<string, unknown> | undefined) ??
    (row.answers_draft as Record<string, unknown> | undefined) ??
    {}

  const sectionProgress = (row.section_progress as Record<string, unknown> | undefined) ?? {}
  const lastSectionIndex =
    typeof row.last_section_index === 'number'
      ? row.last_section_index
      : typeof sectionProgress.last_section_index === 'number'
      ? sectionProgress.last_section_index
      : 0

  const updatedAt =
    (row.updated_at as string | undefined) ??
    (row.last_saved_at as string | undefined) ??
    new Date().toISOString()

  return {
    id: String(row.id),
    survey_id: String(row.survey_id),
    user_id: String(row.user_id),
    answers,
    last_section_index: lastSectionIndex,
    updated_at: updatedAt as unknown as Date,
  }
}

export function shouldRetryWithLegacyDraftColumns(error: DbErrorLike): boolean {
  if (!error) return false
  const message = (error.message ?? '').toLowerCase()
  const code = (error.code ?? '').toUpperCase()

  const missingColumnCode = code === '42703' || code === 'PGRST204'
  const mentionsDraftColumns =
    message.includes('response_drafts') &&
    (message.includes('answers') || message.includes('last_section_index') || message.includes('updated_at'))

  const explicitMissingColumn = message.includes('column') && message.includes('does not exist')

  return missingColumnCode || mentionsDraftColumns || explicitMissingColumn
}

export function getSurveyAnonymousFlag(row: Record<string, unknown> | null): boolean | null {
  if (!row) return null

  if (typeof row.is_anonymous === 'boolean') return row.is_anonymous
  if (typeof row.anonymous_mode === 'boolean') return row.anonymous_mode
  return null
}

export function shouldRetryWithLegacySurveyColumns(error: DbErrorLike): boolean {
  if (!error) return false
  const message = (error.message ?? '').toLowerCase()
  const code = (error.code ?? '').toUpperCase()
  const missingColumnCode = code === '42703' || code === 'PGRST204'

  return (
    missingColumnCode &&
    message.includes('survey') &&
    (message.includes('is_anonymous') || message.includes('column'))
  )
}

export function mapAnswerValueForStorage(value: unknown): {
  text_value: string | null
  numeric_value: number | null
  selected_options: unknown[]
} {
  return {
    text_value: typeof value === 'string' ? value : null,
    numeric_value: typeof value === 'number' ? value : null,
    selected_options: Array.isArray(value) ? value : [],
  }
}

export function buildLegacyDraftPayload(input: {
  survey_id: string
  user_id: string
  answers: Record<string, unknown>
  last_section_index: number
  nowIso: string
}) {
  return {
    survey_id: input.survey_id,
    user_id: input.user_id,
    answers_draft: input.answers,
    section_progress: { last_section_index: input.last_section_index },
    last_saved_at: input.nowIso,
  }
}

export function buildModernDraftPayload(input: {
  survey_id: string
  user_id: string
  answers: Record<string, unknown>
  last_section_index: number
  nowIso: string
}) {
  return {
    survey_id: input.survey_id,
    user_id: input.user_id,
    answers: input.answers,
    last_section_index: input.last_section_index,
    updated_at: input.nowIso,
  }
}
