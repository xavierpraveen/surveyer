import { describe, expect, test } from 'vitest'
import { normalizeEmployeeDirectoryRow } from './settings-employee-compat'

describe('normalizeEmployeeDirectoryRow', () => {
  test('maps legacy profile shape (full_name + joins)', () => {
    const row = {
      id: 'u1',
      full_name: 'Alice Chen',
      email: 'alice.chen@acme.dev',
      tenure_band: '1-2y',
      is_active: true,
      created_at: '2026-03-17T00:00:00.000Z',
      departments: { name: 'Engineering' },
      roles: { name: 'Software Engineer' },
    }

    expect(normalizeEmployeeDirectoryRow(row)).toEqual({
      id: 'u1',
      name: 'Alice Chen',
      email: 'alice.chen@acme.dev',
      department: 'Engineering',
      role: 'Software Engineer',
      tenureBand: '1-2y',
      isActive: true,
      createdAt: '2026-03-17T00:00:00.000Z',
    })
  })

  test('falls back to modern name/role/department fields when joins absent', () => {
    const row = {
      id: 'u2',
      name: 'Bob Kim',
      email: 'bob.kim@acme.dev',
      department: 'Engineering',
      role: 'employee',
      tenure_band: null,
      is_active: null,
      created_at: null,
    }

    expect(normalizeEmployeeDirectoryRow(row)).toEqual({
      id: 'u2',
      name: 'Bob Kim',
      email: 'bob.kim@acme.dev',
      department: 'Engineering',
      role: 'employee',
      tenureBand: null,
      isActive: true,
      createdAt: '',
    })
  })
})
