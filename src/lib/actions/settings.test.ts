import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const mockDb = supabaseAdmin as unknown as {
  from: ReturnType<typeof vi.fn>
  auth: { admin: { createUser: ReturnType<typeof vi.fn> } }
}
const mockCreateClient = createSupabaseServerClient as ReturnType<typeof vi.fn>

function makeChainable(finalResult: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'insert', 'update', 'delete', 'select', 'eq', 'order', 'in', 'single', 'limit', 'or', 'upsert', 'neq', 'not', 'match']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(finalResult).then(resolve)
  return chain
}

function mockUserWithRole(role: string) {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', app_metadata: { role } } },
        error: null,
      }),
    },
  })
}

describe('getAppSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns privacyThresholdNumeric and privacyThresholdText from app_settings', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(
      makeChainable({
        data: [
          { key: 'privacy_threshold_numeric', value: '5' },
          { key: 'privacy_threshold_text', value: '10' },
          { key: 'allowed_email_domain', value: 'company.com' },
        ],
        error: null,
      })
    )

    const { getAppSettings } = await import('./settings')
    const result = await getAppSettings()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.privacyThresholdNumeric).toBe(5)
      expect(result.data.privacyThresholdText).toBe(10)
      expect(result.data.allowedEmailDomain).toBe('company.com')
    }
  })

  test('returns defaults (5, 10) when keys are missing from app_settings', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(makeChainable({ data: [], error: null }))

    const { getAppSettings } = await import('./settings')
    const result = await getAppSettings()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.privacyThresholdNumeric).toBe(5)
      expect(result.data.privacyThresholdText).toBe(10)
      expect(result.data.allowedEmailDomain).toBe('')
    }
  })
})

describe('updateAppSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  test('upserts the key-value pair into app_settings table', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(makeChainable({ error: null }))

    const { updateAppSettings } = await import('./settings')
    const result = await updateAppSettings('privacy_threshold_numeric', 7)
    expect(result.success).toBe(true)
  })

  test('returns error when role is not admin or hr_admin', async () => {
    mockUserWithRole('employee')
    const { updateAppSettings } = await import('./settings')
    const result = await updateAppSettings('privacy_threshold_numeric', 7)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})

describe('importEmployees', () => {
  beforeEach(() => vi.clearAllMocks())

  test('creates auth user and profile for each valid row', async () => {
    mockUserWithRole('admin')
    mockDb.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-1' } },
      error: null,
    })
    mockDb.from.mockReturnValue(makeChainable({ error: null })) // upsert profiles

    const { importEmployees } = await import('./settings')
    const result = await importEmployees([
      {
        name: 'Alice',
        email: 'alice@company.com',
        department: 'Engineering',
        role: 'employee',
        tenureBand: '1-3',
        isValid: true,
        errors: [],
      },
    ])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.imported).toBe(1)
      expect(result.data.skipped).toBe(0)
    }
  })

  test('skips rows with duplicate email and includes in skipped count', async () => {
    mockUserWithRole('admin')
    // Simulate 422 error (user already exists)
    mockDb.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { status: 422, message: 'User already registered' },
    })

    const { importEmployees } = await import('./settings')
    const result = await importEmployees([
      {
        name: 'Bob',
        email: 'bob@company.com',
        department: 'HR',
        role: 'employee',
        tenureBand: '1-3',
        isValid: true,
        errors: [],
      },
    ])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.skipped).toBe(1)
      expect(result.data.imported).toBe(0)
    }
  })

  test('returns imported count, skipped count, and error list', async () => {
    mockUserWithRole('hr_admin')
    mockDb.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: 'new-user-2' } },
      error: null,
    })
    mockDb.from.mockReturnValue(makeChainable({ error: null }))

    const { importEmployees } = await import('./settings')
    const result = await importEmployees([
      {
        name: 'Carol',
        email: 'carol@company.com',
        department: 'Sales',
        role: 'employee',
        tenureBand: '3-5',
        isValid: true,
        errors: [],
      },
    ])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.imported).toBe('number')
      expect(typeof result.data.skipped).toBe('number')
      expect(Array.isArray(result.data.errors)).toBe(true)
    }
  })

  test('returns error when role is not admin or hr_admin', async () => {
    mockUserWithRole('employee')
    const { importEmployees } = await import('./settings')
    const result = await importEmployees([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})

describe('archiveSurvey', () => {
  beforeEach(() => vi.clearAllMocks())

  test('sets surveys.archived = true for given surveyId', async () => {
    mockUserWithRole('admin')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-1', status: 'closed' }, error: null })
      return makeChainable({ error: null }) // UPDATE
    })

    const { archiveSurvey } = await import('./settings')
    const result = await archiveSurvey('sv-1')
    expect(result.success).toBe(true)
  })

  test('returns error when survey is not in closed state', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(makeChainable({ data: { id: 'sv-1', status: 'open' }, error: null }))

    const { archiveSurvey } = await import('./settings')
    const result = await archiveSurvey('sv-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/closed/i)
    }
  })

  test('returns error when role is not admin', async () => {
    mockUserWithRole('employee')
    const { archiveSurvey } = await import('./settings')
    const result = await archiveSurvey('sv-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})

describe('getParticipationForOpenSurvey', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns rows with department, eligible, responded, rate', async () => {
    mockUserWithRole('admin')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-open', status: 'open' }, error: null })
      // v_participation_rates
      return makeChainable({
        data: [
          { department_name: 'Engineering', department_id: 'dept-1', eligible_count: 10, token_count: 8 },
        ],
        error: null,
      })
    })

    const { getParticipationForOpenSurvey } = await import('./settings')
    const result = await getParticipationForOpenSurvey()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBe(1)
      expect(result.data[0].department).toBe('Engineering')
      expect(typeof result.data[0].rate).toBe('number')
    }
  })

  test('returns empty array when no survey is currently open', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(makeChainable({ data: null, error: { message: 'Not found' } }))

    const { getParticipationForOpenSurvey } = await import('./settings')
    const result = await getParticipationForOpenSurvey()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })
})
