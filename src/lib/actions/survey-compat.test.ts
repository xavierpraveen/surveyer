import { describe, expect, test } from 'vitest'
import {
  buildLegacyQuestionPayload,
  buildLegacySurveyPayload,
  normalizeQuestionRow,
  normalizeSurveyRow,
  shouldRetryWithLegacySurveyWriteColumns,
} from './survey-compat'

describe('buildLegacySurveyPayload', () => {
  test('maps is_anonymous to anonymous_mode and removes public_link_enabled', () => {
    const payload = buildLegacySurveyPayload({
      title: 'Q2 Survey',
      description: 'desc',
      is_anonymous: true,
      public_link_enabled: false,
      opens_at: '2026-03-17T00:00:00.000Z',
      closes_at: '2026-03-30T00:00:00.000Z',
    })

    expect(payload).toEqual({
      title: 'Q2 Survey',
      description: 'desc',
      anonymous_mode: true,
      opens_at: '2026-03-17T00:00:00.000Z',
      closes_at: '2026-03-30T00:00:00.000Z',
    })
  })
})

describe('normalizeSurveyRow', () => {
  test('provides modern fields from legacy row', () => {
    const row = normalizeSurveyRow({
      id: 's1',
      title: 'Survey',
      description: null,
      status: 'draft',
      anonymous_mode: true,
      opens_at: null,
      closes_at: null,
      created_by: 'u1',
      created_at: '2026-03-17T00:00:00.000Z',
    })

    expect(row.is_anonymous).toBe(true)
    expect(row.public_link_enabled).toBe(false)
  })
})

describe('shouldRetryWithLegacySurveyWriteColumns', () => {
  test('returns true for missing modern survey columns', () => {
    expect(
      shouldRetryWithLegacySurveyWriteColumns({
        code: 'PGRST204',
        message: "Could not find the 'is_anonymous' column of 'surveys' in the schema cache",
      })
    ).toBe(true)
  })

  test('returns false for unrelated errors', () => {
    expect(
      shouldRetryWithLegacySurveyWriteColumns({
        code: '42501',
        message: 'permission denied',
      })
    ).toBe(false)
  })
})

describe('buildLegacyQuestionPayload', () => {
  test('maps modern question fields to legacy and normalizes null conditional_rule to {}', () => {
    const payload = buildLegacyQuestionPayload({
      survey_section_id: 'sec-1',
      text: 'Question?',
      question_type: 'single_select',
      is_required: true,
      conditional_rule: null,
    })

    expect(payload).toEqual({
      survey_section_id: 'sec-1',
      text: 'Question?',
      type: 'single_select',
      required: true,
      conditional_config: {},
    })
  })
})

describe('normalizeQuestionRow', () => {
  test('normalizes legacy fields and drops empty conditional_config object', () => {
    const q = normalizeQuestionRow({
      id: 'q1',
      survey_section_id: 'sec-1',
      text: 'Question?',
      type: 'short_text',
      required: false,
      display_order: 0,
      conditional_config: {},
    })

    expect(q.question_type).toBe('short_text')
    expect(q.is_required).toBe(false)
    expect(q.conditional_rule).toBeNull()
  })
})
