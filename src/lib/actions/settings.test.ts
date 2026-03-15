import { describe, test } from 'vitest'

describe('getAppSettings', () => {
  test.todo('returns privacyThresholdNumeric and privacyThresholdText from app_settings')
  test.todo('returns defaults (5, 10) when keys are missing from app_settings')
})

describe('updateAppSettings', () => {
  test.todo('upserts the key-value pair into app_settings table')
  test.todo('returns error when role is not admin or hr_admin')
})

describe('importEmployees', () => {
  test.todo('creates auth user and profile for each valid row')
  test.todo('skips rows with duplicate email and includes in skipped count')
  test.todo('returns imported count, skipped count, and error list')
  test.todo('returns error when role is not admin or hr_admin')
})

describe('archiveSurvey', () => {
  test.todo('sets surveys.archived = true for given surveyId')
  test.todo('returns error when survey is not in closed state')
  test.todo('returns error when role is not admin')
})

describe('getParticipationForOpenSurvey', () => {
  test.todo('returns rows with department, eligible, responded, rate')
  test.todo('returns empty array when no survey is currently open')
})
