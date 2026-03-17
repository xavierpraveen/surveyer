import type { Survey, SurveyQuestion } from '@/lib/types/survey'

type DbErrorLike = { code?: string; message?: string } | null | undefined

export function getMissingColumnName(error: DbErrorLike): string | null {
  if (!error?.message) return null
  const byColumnPrefix = error.message.match(/column\s+['"]([^'"]+)['"]/i)
  if (byColumnPrefix?.[1]) return byColumnPrefix[1]

  const byColumnSuffix = error.message.match(/['"]([^'"]+)['"]\s+column/i)
  return byColumnSuffix?.[1] ?? null
}

export function buildLegacySurveyPayload(input: Record<string, unknown>) {
  const payload = { ...input }
  if ('is_anonymous' in payload) {
    payload.anonymous_mode = Boolean(payload.is_anonymous)
    delete payload.is_anonymous
  }
  // Legacy schema has no public_link_enabled column
  if ('public_link_enabled' in payload) {
    delete payload.public_link_enabled
  }
  return payload
}

export function normalizeSurveyRow(row: Record<string, unknown>): Survey {
  const isAnonymous =
    typeof row.is_anonymous === 'boolean'
      ? row.is_anonymous
      : typeof row.anonymous_mode === 'boolean'
      ? row.anonymous_mode
      : true

  const publicLinkEnabled =
    typeof row.public_link_enabled === 'boolean' ? row.public_link_enabled : false

  const opensAtRaw = row.opens_at as string | Date | null | undefined
  const closesAtRaw = row.closes_at as string | Date | null | undefined

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    description: (row.description as string | null | undefined) ?? null,
    status: String(row.status ?? 'draft') as Survey['status'],
    is_anonymous: isAnonymous,
    public_link_enabled: publicLinkEnabled,
    opens_at: opensAtRaw ? new Date(opensAtRaw) : null,
    closes_at: closesAtRaw ? new Date(closesAtRaw) : null,
    created_by: String(row.created_by ?? ''),
    created_at: (row.created_at as Date | string | undefined) as Date,
  }
}

export function shouldRetryWithLegacySurveyWriteColumns(error: DbErrorLike): boolean {
  if (!error) return false
  const code = (error.code ?? '').toUpperCase()
  const message = (error.message ?? '').toLowerCase()
  const missingColumnCode = code === '42703' || code === 'PGRST204'

  return missingColumnCode && message.includes('surveys')
}

export function buildLegacyQuestionPayload(input: Record<string, unknown>) {
  const payload = { ...input }
  if ('question_type' in payload) {
    payload.type = payload.question_type
    delete payload.question_type
  }
  if ('is_required' in payload) {
    payload.required = payload.is_required
    delete payload.is_required
  }
  if ('conditional_rule' in payload) {
    const rule = payload.conditional_rule
    payload.conditional_config =
      rule && typeof rule === 'object' ? rule : {}
    delete payload.conditional_rule
  }
  return payload
}

export function normalizeQuestionRow(row: Record<string, unknown>): SurveyQuestion {
  const conditionalRaw = row.conditional_rule ?? row.conditional_config ?? null
  let conditionalRule: SurveyQuestion['conditional_rule'] = null
  if (conditionalRaw && typeof conditionalRaw === 'object') {
    const candidate = conditionalRaw as Partial<SurveyQuestion['conditional_rule']>
    const isValid =
      typeof candidate?.question_id === 'string' &&
      candidate.question_id.length > 0 &&
      typeof candidate?.operator === 'string' &&
      ['eq', 'neq', 'gt', 'lt', 'gte', 'lte'].includes(candidate.operator) &&
      typeof candidate?.value === 'string'
    conditionalRule = isValid ? (candidate as SurveyQuestion['conditional_rule']) : null
  }

  const stableQuestionId =
    typeof row.stable_question_id === 'string' && row.stable_question_id
      ? row.stable_question_id
      : String(row.id ?? '')

  return {
    id: String(row.id ?? ''),
    survey_section_id: String(row.survey_section_id ?? ''),
    text: String(row.text ?? row.question_text ?? ''),
    question_type: String(row.question_type ?? row.type ?? 'short_text') as SurveyQuestion['question_type'],
    is_required: Boolean(row.is_required ?? row.required ?? false),
    display_order: Number(row.display_order ?? 0),
    conditional_rule: conditionalRule,
    stable_question_id: stableQuestionId,
    options: undefined,
  }
}

export function shouldRetryWithLegacyQuestionWriteColumns(error: DbErrorLike): boolean {
  if (!error) return false
  const code = (error.code ?? '').toUpperCase()
  const message = (error.message ?? '').toLowerCase()
  const missingColumnCode = code === '42703' || code === 'PGRST204'

  return missingColumnCode && message.includes('questions')
}
