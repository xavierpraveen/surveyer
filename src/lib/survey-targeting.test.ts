import { describe, expect, test } from 'vitest'
import { sectionTargetsDepartment, slugifyDepartmentName } from './survey-targeting'

describe('slugifyDepartmentName', () => {
  test('converts display names to slugs', () => {
    expect(slugifyDepartmentName('Sales & Business')).toBe('sales-and-business')
    expect(slugifyDepartmentName('HR & Operations')).toBe('hr-and-operations')
    expect(slugifyDepartmentName('Engineering')).toBe('engineering')
  })
})

describe('sectionTargetsDepartment', () => {
  test('returns true for empty target roles', () => {
    expect(sectionTargetsDepartment([], 'Engineering')).toBe(true)
  })

  test('returns true when target contains all', () => {
    expect(sectionTargetsDepartment(['all'], 'Engineering')).toBe(true)
  })

  test('matches exact department name (legacy data)', () => {
    expect(sectionTargetsDepartment(['Engineering'], 'Engineering')).toBe(true)
  })

  test('matches slug token (new section UI)', () => {
    expect(sectionTargetsDepartment(['engineering'], 'Engineering')).toBe(true)
  })

  test('returns false when not targeted', () => {
    expect(sectionTargetsDepartment(['qa'], 'Engineering')).toBe(false)
  })
})
