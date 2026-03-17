import { describe, expect, test } from 'vitest'
import { getQuestionRenderMeta } from './QuestionRenderer'

describe('getQuestionRenderMeta', () => {
  test('uses modern question_type/is_required fields when present', () => {
    const meta = getQuestionRenderMeta({
      question_type: 'long_text',
      is_required: true,
    } as never)

    expect(meta.questionType).toBe('long_text')
    expect(meta.isRequired).toBe(true)
  })

  test('falls back to legacy type/required fields', () => {
    const meta = getQuestionRenderMeta({
      type: 'short_text',
      required: true,
    } as never)

    expect(meta.questionType).toBe('short_text')
    expect(meta.isRequired).toBe(true)
  })
})
