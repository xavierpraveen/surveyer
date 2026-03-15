import { z } from 'zod'

// ─── Enum Schemas ─────────────────────────────────────────────────────────────

const questionTypeSchema = z.enum([
  'likert_5',
  'likert_10',
  'single_select',
  'multi_select',
  'short_text',
  'long_text',
])

const surveyStatusSchema = z.enum(['draft', 'scheduled', 'open', 'closed'])

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['scheduled', 'open'],
  scheduled: ['open', 'draft'],
  open: ['closed'],
  closed: [],
}

// ─── Conditional Rule ─────────────────────────────────────────────────────────

const conditionalRuleSchema = z.object({
  question_id: z.string().uuid(),
  operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte']),
  value: z.string(),
})

// ─── Survey Schemas ───────────────────────────────────────────────────────────

export const createSurveySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  is_anonymous: z.boolean(),
  public_link_enabled: z.boolean(),
  opens_at: z.string().datetime().optional(),
  closes_at: z.string().datetime().optional(),
})

export const updateSurveySchema = createSurveySchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Section Schemas ──────────────────────────────────────────────────────────

export const createSectionSchema = z.object({
  survey_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  target_roles: z.array(z.string()),
})

export const updateSectionSchema = createSectionSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Question Schemas ─────────────────────────────────────────────────────────

const questionOptionInputSchema = z.object({
  text: z.string().min(1),
  display_order: z.number().int().nonnegative(),
})

export const createQuestionSchema = z.object({
  section_id: z.string().uuid(),
  text: z.string().min(1, 'Question text is required').max(1000, 'Question text must be at most 1000 characters'),
  question_type: questionTypeSchema,
  is_required: z.boolean(),
  conditional_rule: conditionalRuleSchema.optional(),
  options: z.array(questionOptionInputSchema).optional(),
})

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  id: z.string().uuid(),
})

// ─── Reorder Schemas ──────────────────────────────────────────────────────────

export const reorderItemSchema = z.object({
  id: z.string().uuid(),
  display_order: z.number().int().nonnegative(),
})

export const reorderSectionsSchema = z.object({
  items: z.array(reorderItemSchema),
})

export const reorderQuestionsSchema = z.object({
  items: z.array(reorderItemSchema),
})

// ─── Dimension Mapping ────────────────────────────────────────────────────────

export const mapDimensionsSchema = z.object({
  question_id: z.string().uuid(),
  dimension_ids: z.array(z.string().uuid()).max(3, 'Maximum 3 dimensions per question'),
})

// ─── Lifecycle Schema ─────────────────────────────────────────────────────────

export const transitionStatusSchema = z
  .object({
    survey_id: z.string().uuid(),
    to_status: surveyStatusSchema,
    opens_at: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.to_status === 'scheduled' && !data.opens_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'opens_at is required when transitioning to scheduled',
        path: ['opens_at'],
      })
    }
  })

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const saveDraftSchema = z.object({
  survey_id: z.string().uuid(),
  answers: z.record(z.unknown()),
  last_section_index: z.number().int().nonnegative(),
})

export const submitResponseSchema = z.object({
  survey_id: z.string().uuid(),
  answers: z.record(
    z.union([
      z.string(),
      z.number(),
      z.array(z.union([z.string(), z.number()])),
    ])
  ),
})

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateSurveyInput = z.infer<typeof createSurveySchema>
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>
export type CreateSectionInput = z.infer<typeof createSectionSchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type MapDimensionsInput = z.infer<typeof mapDimensionsSchema>
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>
export type SaveDraftInput = z.infer<typeof saveDraftSchema>
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>

// Re-export ALLOWED_TRANSITIONS for use in actions
export { ALLOWED_TRANSITIONS }
