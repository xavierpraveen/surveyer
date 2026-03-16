import { vi, describe, test, expect, beforeEach } from 'vitest'

// Mock supabaseAdmin with chainable builder
const mockFrom = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockIn = vi.fn()
const mockSingle = vi.fn()

function makeChainable(finalResult: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'insert', 'update', 'delete', 'select', 'eq', 'order', 'in', 'single', 'limit', 'or', 'upsert', 'neq', 'not']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // Make the chain thenable (awaitable)
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(finalResult).then(resolve)
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const mockDb = supabaseAdmin as unknown as { from: ReturnType<typeof vi.fn> }
const mockCreateClient = createSupabaseServerClient as ReturnType<typeof vi.fn>

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

function mockDbChain(finalResult: unknown) {
  const chain = makeChainable(finalResult)
  mockDb.from.mockReturnValue(chain)
  return chain
}

describe('createActionItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns success with valid input including dimensionIds array', async () => {
    mockUserWithRole('admin')
    const fakeRow = {
      id: 'ai-1',
      survey_id: null,
      title: 'Improve communication',
      problem_statement: null,
      owner_id: null,
      department_id: null,
      priority: 'medium',
      target_date: null,
      status: 'identified',
      success_criteria: null,
      is_public: false,
      dimension_ids: ['dim-1'],
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    // getActionItems needs two queries; createActionItem just one
    const chain = makeChainable({ data: fakeRow, error: null })
    mockDb.from.mockReturnValue(chain)

    const { createActionItem } = await import('./actions')
    const result = await createActionItem({
      surveyId: null,
      title: 'Improve communication',
      problemStatement: null,
      ownerId: null,
      departmentId: null,
      priority: 'medium',
      targetDate: null,
      status: 'identified',
      successCriteria: null,
      isPublic: false,
      dimensionIds: ['11111111-1111-1111-1111-111111111111'],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeDefined()
    }
  })

  test('returns error when role is employee (forbidden)', async () => {
    mockUserWithRole('employee')
    const { createActionItem } = await import('./actions')
    const result = await createActionItem({
      title: 'Test',
      priority: 'low',
      status: 'identified',
      isPublic: false,
      dimensionIds: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })

  test('returns error when title is empty string', async () => {
    mockUserWithRole('admin')
    const { createActionItem } = await import('./actions')
    const result = await createActionItem({ title: '', priority: 'low', status: 'identified', isPublic: false, dimensionIds: [] })
    expect(result.success).toBe(false)
  })

  test('admin role is allowed to create action items', async () => {
    mockUserWithRole('admin')
    const fakeRow = {
      id: 'ai-2', survey_id: null, title: 'Test', problem_statement: null,
      owner_id: null, department_id: null, priority: 'low', target_date: null,
      status: 'identified', success_criteria: null, is_public: false,
      dimension_ids: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }
    const chain = makeChainable({ data: fakeRow, error: null })
    mockDb.from.mockReturnValue(chain)

    const { createActionItem } = await import('./actions')
    const result = await createActionItem({
      title: 'Test',
      priority: 'low',
      status: 'identified',
      isPublic: false,
      dimensionIds: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('updateActionItem', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns success when updating status to valid enum value', async () => {
    mockUserWithRole('admin')
    const fakeRow = {
      id: 'ai-1', survey_id: null, title: 'Test', problem_statement: null,
      owner_id: null, department_id: null, priority: 'low', target_date: null,
      status: 'planned', success_criteria: null, is_public: false,
      dimension_ids: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }
    const chain = makeChainable({ data: fakeRow, error: null })
    mockDb.from.mockReturnValue(chain)

    const { updateActionItem } = await import('./actions')
    const result = await updateActionItem('ai-1', { status: 'planned' })
    expect(result.success).toBe(true)
  })

  test('returns error when action item id does not exist', async () => {
    mockUserWithRole('admin')
    const chain = makeChainable({ data: null, error: { message: 'Row not found' } })
    mockDb.from.mockReturnValue(chain)

    const { updateActionItem } = await import('./actions')
    const result = await updateActionItem('nonexistent', { status: 'planned' })
    expect(result.success).toBe(false)
  })

  test('isPublic toggle updates the is_public column', async () => {
    mockUserWithRole('admin')
    const fakeRow = {
      id: 'ai-1', survey_id: null, title: 'Test', problem_statement: null,
      owner_id: null, department_id: null, priority: 'low', target_date: null,
      status: 'identified', success_criteria: null, is_public: true,
      dimension_ids: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }
    const chain = makeChainable({ data: fakeRow, error: null })
    mockDb.from.mockReturnValue(chain)

    const { updateActionItem } = await import('./actions')
    const result = await updateActionItem('ai-1', { isPublic: true })
    expect(result.success).toBe(true)
  })
})

describe('deleteActionItem', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns success for valid id with elevated role', async () => {
    mockUserWithRole('admin')
    const chain = makeChainable({ error: null })
    mockDb.from.mockReturnValue(chain)

    const { deleteActionItem } = await import('./actions')
    const result = await deleteActionItem('ai-1')
    expect(result.success).toBe(true)
  })

  test('returns error when role is employee', async () => {
    mockUserWithRole('employee')
    const { deleteActionItem } = await import('./actions')
    const result = await deleteActionItem('ai-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})

describe('postActionUpdate', () => {
  beforeEach(() => vi.clearAllMocks())

  test('inserts action_updates row with content and created_by', async () => {
    mockUserWithRole('employee')
    const fakeRow = {
      id: 'au-1', action_item_id: 'ai-1', content: 'Progress made',
      created_by: 'user-1', created_at: '2026-01-01T00:00:00Z',
    }
    const chain = makeChainable({ data: fakeRow, error: null })
    mockDb.from.mockReturnValue(chain)

    const { postActionUpdate } = await import('./actions')
    const result = await postActionUpdate('ai-1', 'Progress made')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('Progress made')
    }
  })

  test('returns error when content is empty', async () => {
    mockUserWithRole('employee')
    const { postActionUpdate } = await import('./actions')
    const result = await postActionUpdate('ai-1', '')
    expect(result.success).toBe(false)
  })
})

describe('getActionItems', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns all action items for admin role', async () => {
    mockUserWithRole('admin')
    const fakeItems = [
      {
        id: 'ai-1', survey_id: null, title: 'Test', problem_statement: null,
        owner_id: null, department_id: null, priority: 'low', target_date: null,
        status: 'identified', success_criteria: null, is_public: false,
        dimension_ids: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      },
    ]
    // getActionItems does multiple queries — mock from to return different results for each call
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      // First call: action_items
      if (callCount === 1) return makeChainable({ data: fakeItems, error: null })
      // Subsequent calls: profiles, departments (empty)
      return makeChainable({ data: [], error: null })
    })

    const { getActionItems } = await import('./actions')
    const result = await getActionItems()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(Array.isArray(result.data)).toBe(true)
    }
  })

  test('filters by status when statusFilter provided', async () => {
    mockUserWithRole('admin')
    const fakeItems = [
      {
        id: 'ai-1', survey_id: null, title: 'Test', problem_statement: null,
        owner_id: null, department_id: null, priority: 'low', target_date: null,
        status: 'planned', success_criteria: null, is_public: false,
        dimension_ids: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      },
    ]
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: fakeItems, error: null })
      return makeChainable({ data: [], error: null })
    })

    const { getActionItems } = await import('./actions')
    const result = await getActionItems('planned')
    expect(result.success).toBe(true)
  })
})

describe('getActionItem', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns action item with updates timeline', async () => {
    mockUserWithRole('admin')
    const fakeItem = {
      id: 'ai-1', survey_id: null, title: 'Test', problem_statement: null,
      owner_id: null, department_id: null, priority: 'low', target_date: null,
      status: 'identified', success_criteria: null, is_public: false,
      dimension_ids: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }
    const fakeUpdates = [
      { id: 'au-1', action_item_id: 'ai-1', content: 'Done some work', created_by: 'user-1', created_at: '2026-01-02T00:00:00Z' },
    ]
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: fakeItem, error: null })
      return makeChainable({ data: fakeUpdates, error: null })
    })

    const { getActionItem } = await import('./actions')
    const result = await getActionItem('ai-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.item).toBeDefined()
      expect(Array.isArray(result.data.updates)).toBe(true)
    }
  })

  test('returns null when id does not exist', async () => {
    mockUserWithRole('admin')
    const chain = makeChainable({ data: null, error: { message: 'Not found' } })
    mockDb.from.mockReturnValue(chain)

    const { getActionItem } = await import('./actions')
    const result = await getActionItem('nonexistent')
    expect(result.success).toBe(false)
  })
})
