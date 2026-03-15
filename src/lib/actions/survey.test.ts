import { describe, test } from 'vitest'

describe('createSurvey', () => {
  test.todo('inserts a survey row and returns { success: true, data: Survey }')
  test.todo('returns { success: false, error } when title is too short')
  test.todo('returns { success: false, error: "Unauthorized" } when user is not authenticated')
})

describe('transitionSurveyStatus', () => {
  test.todo('transitions draft → scheduled with opens_at provided')
  test.todo('transitions draft → open directly')
  test.todo('transitions scheduled → open')
  test.todo('transitions open → closed')
  test.todo('rejects open → draft (invalid transition)')
  test.todo('rejects closed → open (invalid transition)')
  test.todo('returns error when survey not found')
  test.todo('requires opens_at when transitioning to scheduled')
})

describe('duplicateSurvey', () => {
  test.todo('creates a new survey row with status=draft and new id')
  test.todo('copies all sections preserving display_order')
  test.todo('copies all questions preserving stable_question_id')
  test.todo('copies all question_options linked to new question ids')
  test.todo('copies all question_dimension_map entries linked to new question ids')
  test.todo('returns error when source survey not found')
})

describe('reorderSections', () => {
  test.todo('updates display_order for each section id provided')
  test.todo('returns error when any section id is invalid uuid')
})

describe('mapQuestionDimensions', () => {
  test.todo('deletes existing dimension mappings for question_id then inserts new ones')
  test.todo('rejects more than 3 dimension_ids')
  test.todo('accepts 0 dimension_ids (removes all mappings)')
})
