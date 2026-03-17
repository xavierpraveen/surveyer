import { describe, expect, test } from 'vitest'
import { getSurveyAnonymousFlag, shouldRetryWithLegacySurveyColumns } from './response-draft-compat'

describe('getSurveyAnonymousFlag', () => {
  test('prefers modern is_anonymous', () => {
    expect(getSurveyAnonymousFlag({ is_anonymous: false, anonymous_mode: true })).toBe(false)
  })

  test('falls back to legacy anonymous_mode', () => {
    expect(getSurveyAnonymousFlag({ anonymous_mode: true })).toBe(true)
  })

  test('returns null when neither exists', () => {
    expect(getSurveyAnonymousFlag({})).toBeNull()
  })
})

describe('shouldRetryWithLegacySurveyColumns', () => {
  test('returns true for missing is_anonymous column errors', () => {
    expect(
      shouldRetryWithLegacySurveyColumns({
        code: '42703',
        message: 'column surveys.is_anonymous does not exist',
      })
    ).toBe(true)
  })

  test('returns false for unrelated errors', () => {
    expect(
      shouldRetryWithLegacySurveyColumns({
        code: '42501',
        message: 'permission denied for table surveys',
      })
    ).toBe(false)
  })
})
