import { describe, expect, test } from 'vitest'
import { buildParticipationRows } from './settings-participation-compat'

describe('buildParticipationRows', () => {
  test('returns zero-responded rows when participation view is empty', () => {
    const rows = buildParticipationRows([], [
      { department_id: 'd1', department_name: 'Engineering', eligible_count: 10 },
      { department_id: 'd2', department_name: 'QA', eligible_count: 5 },
    ])

    expect(rows).toEqual([
      { department: 'Engineering', departmentId: 'd1', eligible: 10, responded: 0, rate: 0 },
      { department: 'QA', departmentId: 'd2', eligible: 5, responded: 0, rate: 0 },
    ])
  })

  test('merges responded counts from participation rows', () => {
    const rows = buildParticipationRows(
      [
        { department_id: 'd1', department_name: 'Engineering', token_count: 7 },
        { department_id: 'd2', department_name: 'QA', token_count: 2 },
      ],
      [
        { department_id: 'd1', department_name: 'Engineering', eligible_count: 10 },
        { department_id: 'd2', department_name: 'QA', eligible_count: 5 },
      ]
    )

    expect(rows).toEqual([
      { department: 'Engineering', departmentId: 'd1', eligible: 10, responded: 7, rate: 70 },
      { department: 'QA', departmentId: 'd2', eligible: 5, responded: 2, rate: 40 },
    ])
  })

  test('upgrades Unknown eligible label using participation view name for same department_id', () => {
    const rows = buildParticipationRows(
      [{ department_id: 'd1', department_name: 'Engineering', token_count: 3 }],
      [{ department_id: 'd1', department_name: 'Unknown', eligible_count: 10 }]
    )

    expect(rows).toEqual([
      { department: 'Engineering', departmentId: 'd1', eligible: 10, responded: 3, rate: 30 },
    ])
  })
})
