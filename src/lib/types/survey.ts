// Shared TypeScript interfaces and union types for Phase 2 (Survey Engine)

// ─── Union / Enum Types ───────────────────────────────────────────────────────

export type QuestionType =
  | 'likert_5'
  | 'likert_10'
  | 'single_select'
  | 'multi_select'
  | 'short_text'
  | 'long_text'

export type SurveyStatus = 'draft' | 'scheduled' | 'open' | 'closed'

export type TenureBand =
  | 'less_than_1yr'
  | '1_to_2yr'
  | '3_to_5yr'
  | '6_to_10yr'
  | 'more_than_10yr'

export type SubmissionStatus = 'not_started' | 'in_progress' | 'submitted'

// ─── Conditional Logic ────────────────────────────────────────────────────────

export interface ConditionalRule {
  question_id: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string
}

// ─── Survey Hierarchy ─────────────────────────────────────────────────────────

export interface Survey {
  id: string
  title: string
  description: string | null
  status: SurveyStatus
  is_anonymous: boolean
  public_link_enabled: boolean
  opens_at: Date | null
  closes_at: Date | null
  created_by: string
  created_at: Date
}

export interface SurveySection {
  id: string
  survey_id: string
  title: string
  description: string | null
  display_order: number
  target_roles: string[] // can include 'all'
}

export interface QuestionOption {
  id: string
  question_id: string
  text: string
  display_order: number
}

export interface SurveyQuestion {
  id: string
  survey_section_id: string
  text: string
  question_type: QuestionType
  is_required: boolean
  display_order: number
  conditional_rule: ConditionalRule | null
  stable_question_id: string
  options?: QuestionOption[]
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

export interface Dimension {
  id: string
  name: string
  description: string | null
  display_order: number
}

export interface QuestionDimensionMap {
  question_id: string
  dimension_id: string
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface SurveyResponse {
  id: string
  survey_id: string
  user_id: string | null // NULL for anonymous responses
  is_anonymous: boolean
  submitted_at: Date
  department: string | null
  role: string | null
  tenure_band: TenureBand | null
  work_type: string | null
}

export interface ResponseAnswer {
  id: string
  response_id: string
  question_id: string
  text_value: string | null
  numeric_value: number | null
  selected_options: unknown | null // jsonb — array of option ids or values
}

export interface ResponseDraft {
  id: string
  survey_id: string
  user_id: string
  answers: Record<string, unknown>
  last_section_index: number
  updated_at: Date
}
