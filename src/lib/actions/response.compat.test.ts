import { describe, expect, test } from 'vitest'
import { normalizeDraftRow, shouldRetryWithLegacyDraftColumns } from './response-draft-compat'

describe('normalizeDraftRow', () => {
  test('maps legacy response_drafts shape to app shape', () => {
    const row = {
      id: 'd1',
      survey_id: 's1',
      user_id: 'u1',
      answers_draft: { q1: 'yes' },
      section_progress: { last_section_index: 2 },
      last_saved_at: '2026-03-17T10:00:00.000Z',
    }

    const normalized = normalizeDraftRow(row)
    expect(normalized).toEqual({
      id: 'd1',
      survey_id: 's1',
      user_id: 'u1',
      answers: { q1: 'yes' },
      last_section_index: 2,
      updated_at: '2026-03-17T10:00:00.000Z',
    })
  })

  test('keeps modern shape when already modern', () => {
    const row = {
      id: 'd1',
      survey_id: 's1',
      user_id: 'u1',
      answers: { q2: 5 },
      last_section_index: 1,
      updated_at: '2026-03-17T11:00:00.000Z',
    }

    const normalized = normalizeDraftRow(row)
    expect(normalized).toEqual(row)
  })
})

describe('shouldRetryWithLegacyDraftColumns', () => {
  test('returns true for unknown/missing modern draft columns', () => {
    expect(
      shouldRetryWithLegacyDraftColumns({
        code: '42703',
        message: 'column response_drafts.answers does not exist',
      })
    ).toBe(true)

    expect(
      shouldRetryWithLegacyDraftColumns({
        code: 'PGRST204',
        message: "Could not find the 'last_section_index' column of 'response_drafts'",
      })
    ).toBe(true)
  })

  test('returns false for unrelated errors', () => {
    expect(
      shouldRetryWithLegacyDraftColumns({
        code: '42501',
        message: 'permission denied for table response_drafts',
      })
    ).toBe(false)
  })
})
