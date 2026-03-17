import { describe, expect, test } from 'vitest'
import { isConditionalVisible } from './ConditionalQuestion'

describe('isConditionalVisible', () => {
  test('returns true when rule is undefined', () => {
    expect(isConditionalVisible(undefined, {})).toBe(true)
  })

  test('returns true when rule is null', () => {
    expect(isConditionalVisible(null, {})).toBe(true)
  })

  test('returns true when rule shape is invalid', () => {
    // Simulates bad DB payload where conditional_rule is incomplete
    const badRule = { operator: 'eq', value: 'yes' } as unknown
    expect(isConditionalVisible(badRule as never, {})).toBe(true)
  })

  test('evaluates valid eq rule', () => {
    const rule = { question_id: 'q1', operator: 'eq', value: 'yes' } as const
    expect(isConditionalVisible(rule, { q1: 'yes' })).toBe(true)
    expect(isConditionalVisible(rule, { q1: 'no' })).toBe(false)
  })
})
