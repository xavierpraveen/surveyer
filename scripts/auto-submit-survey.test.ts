import { describe, expect, test } from 'vitest'
import { buildAnswerValue, mapAnswerValueToRowFields } from './auto-submit-survey.mjs'

describe('buildAnswerValue', () => {
  test('returns scalar for likert and text for short_text', () => {
    expect(typeof buildAnswerValue({ type: 'likert_5' }, [], 1, 'bob.kim@acme.dev')).toBe('number')
    expect(buildAnswerValue({ type: 'short_text' }, [], 1, 'bob.kim@acme.dev')).toContain('bob.kim')
  })

  test('returns option id arrays for multi_select', () => {
    const options = [{ id: 'o1' }, { id: 'o2' }, { id: 'o3' }]
    const value = buildAnswerValue({ type: 'multi_select' }, options, 2, 'carol.patel@acme.dev')
    expect(Array.isArray(value)).toBe(true)
    expect((value as string[]).length).toBeGreaterThan(0)
  })
})

describe('mapAnswerValueToRowFields', () => {
  test('never returns null selected_options', () => {
    expect(mapAnswerValueToRowFields('hello').selected_options).toEqual([])
    expect(mapAnswerValueToRowFields(8).selected_options).toEqual([])
    expect(mapAnswerValueToRowFields(['a', 'b']).selected_options).toEqual(['a', 'b'])
  })
})
