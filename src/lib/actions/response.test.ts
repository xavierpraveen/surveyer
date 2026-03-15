import { describe, test } from 'vitest'

describe('saveDraft', () => {
  test.todo('upserts response_drafts row for (survey_id, user_id)')
  test.todo('overwrites existing draft on second call with same survey_id')
  test.todo('returns { success: false, error: "Unauthorized" } when user is not authenticated')
})

describe('submitResponse (anonymous survey)', () => {
  test.todo('inserts response row with user_id=NULL when survey.is_anonymous=true')
  test.todo('inserts response row with is_anonymous=true')
  test.todo('inserts participation_tokens row with the auth user id')
  test.todo('deletes response_drafts row after submission')
  test.todo('snapshots department, role, tenure_band, work_type from profiles at submission time')
})

describe('submitResponse (non-anonymous survey)', () => {
  test.todo('inserts response row with user_id set to auth user id')
  test.todo('inserts response row with is_anonymous=false')
  test.todo('inserts response_answers rows for each answer in the map')
})

describe('submitResponse duplicate blocked', () => {
  test.todo('returns { success: false, error } when participation_tokens row already exists for (survey_id, user_id)')
})

describe('getMyDraft', () => {
  test.todo('returns the response_drafts row for (survey_id, user_id)')
  test.todo('returns null when no draft exists')
  test.todo('returns { success: false, error: "Unauthorized" } when user is not authenticated')
})

describe('checkSubmissionStatus', () => {
  test.todo('returns "submitted" when participation_tokens row exists')
  test.todo('returns "in_progress" when response_drafts row exists but no token')
  test.todo('returns "not_started" when neither token nor draft exists')
  test.todo('returns { success: false, error: "Unauthorized" } when user is not authenticated')
})
