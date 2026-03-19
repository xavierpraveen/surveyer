import { describe, expect, test } from 'vitest'
import { isSurveyVisibleToRole, getTargetRoleIdsForSurvey } from './survey-audience'

describe('getTargetRoleIdsForSurvey', () => {
  test('returns role ids only for the requested survey', () => {
    const rows = [
      { survey_id: 's1', target_role_id: 'r1' },
      { survey_id: 's1', target_role_id: 'r2' },
      { survey_id: 's2', target_role_id: 'r3' },
      { survey_id: 's1', target_role_id: null },
    ]

    expect(getTargetRoleIdsForSurvey(rows, 's1')).toEqual(['r1', 'r2'])
  })
})

describe('isSurveyVisibleToRole', () => {
  test('allows survey when no role targets are configured', () => {
    expect(isSurveyVisibleToRole([], 'role-a')).toBe(true)
  })

  test('allows survey when user role is in selected targets', () => {
    expect(isSurveyVisibleToRole(['role-a', 'role-b'], 'role-b')).toBe(true)
  })

  test('blocks survey when user role is missing from selected targets', () => {
    expect(isSurveyVisibleToRole(['role-a', 'role-b'], 'role-c')).toBe(false)
  })

  test('blocks survey when targets exist and user has no role id', () => {
    expect(isSurveyVisibleToRole(['role-a'], null)).toBe(false)
  })
})
