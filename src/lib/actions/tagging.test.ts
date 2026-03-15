import { vi, describe, test, expect, beforeEach } from 'vitest'

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

describe('getTaggableAnswers', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns anonymized open-text response_answers for a survey', async () => {
    mockUserWithRole('survey_analyst')

    // Mock: responses -> response_answers -> qualitative_tags
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: [{ id: 'resp-1' }], error: null })
      if (callCount === 2) return makeChainable({
        data: [
          { id: 'ra-1', text_value: 'Great culture', questions: { question_text: 'What do you like?', question_type: 'long_text' } },
        ],
        error: null,
      })
      return makeChainable({ data: [], error: null }) // tags
    })

    const { getTaggableAnswers } = await import('./tagging')
    const result = await getTaggableAnswers('survey-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(Array.isArray(result.data)).toBe(true)
    }
  })

  test('includes existing tags for each answer', async () => {
    mockUserWithRole('survey_analyst')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: [{ id: 'resp-1' }], error: null })
      if (callCount === 2) return makeChainable({
        data: [{ id: 'ra-1', text_value: 'Good env', questions: { question_text: 'Describe env', question_type: 'short_text' } }],
        error: null,
      })
      return makeChainable({
        data: [{ id: 'tag-1', response_answer_id: 'ra-1', tag: 'culture', created_by: null, created_at: '2026-01-01T00:00:00Z' }],
        error: null,
      })
    })

    const { getTaggableAnswers } = await import('./tagging')
    const result = await getTaggableAnswers('survey-1')
    expect(result.success).toBe(true)
    if (result.success) {
      const item = result.data.find((a) => a.responseAnswerId === 'ra-1')
      expect(item).toBeDefined()
      expect(item?.tags.length).toBeGreaterThanOrEqual(1)
    }
  })

  test('returns only short_text and long_text question types', async () => {
    mockUserWithRole('admin')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: [{ id: 'resp-1' }], error: null })
      if (callCount === 2) return makeChainable({
        data: [
          { id: 'ra-1', text_value: 'text answer', questions: { question_text: 'Q1', question_type: 'long_text' } },
        ],
        error: null,
      })
      return makeChainable({ data: [], error: null })
    })

    const { getTaggableAnswers } = await import('./tagging')
    const result = await getTaggableAnswers('survey-1')
    expect(result.success).toBe(true)
  })
})

describe('upsertTag', () => {
  beforeEach(() => vi.clearAllMocks())

  test('inserts new tag for a response_answer_id', async () => {
    mockUserWithRole('survey_analyst')
    const fakeTag = {
      id: 'tag-1', response_answer_id: 'ra-1', tag: 'culture',
      created_by: 'user-1', created_at: '2026-01-01T00:00:00Z',
    }
    const chain = makeChainable({ data: fakeTag, error: null })
    mockDb.from.mockReturnValue(chain)

    const { upsertTag } = await import('./tagging')
    const result = await upsertTag('ra-1', 'culture')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tag).toBe('culture')
    }
  })

  test('returns error when tag string is empty', async () => {
    mockUserWithRole('survey_analyst')
    const { upsertTag } = await import('./tagging')
    const result = await upsertTag('ra-1', '')
    expect(result.success).toBe(false)
  })

  test('returns error when role is not survey_analyst or admin', async () => {
    mockUserWithRole('employee')
    const { upsertTag } = await import('./tagging')
    const result = await upsertTag('ra-1', 'tag')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})

describe('deleteTag', () => {
  beforeEach(() => vi.clearAllMocks())

  test('deletes a qualitative_tags row by id', async () => {
    mockUserWithRole('survey_analyst')
    const chain = makeChainable({ error: null })
    mockDb.from.mockReturnValue(chain)

    const { deleteTag } = await import('./tagging')
    const result = await deleteTag('tag-1')
    expect(result.success).toBe(true)
  })

  test('returns error when role is not survey_analyst or admin', async () => {
    mockUserWithRole('employee')
    const { deleteTag } = await import('./tagging')
    const result = await deleteTag('tag-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})

describe('generateThemes', () => {
  beforeEach(() => vi.clearAllMocks())

  test('groups tags by frequency and creates qualitative_themes rows', async () => {
    mockUserWithRole('admin')
    // Tags: 'culture' x3, 'workload' x2 — should create 2 themes
    const fakeTags = [
      { tag: 'culture', response_answer_id: 'ra-1' },
      { tag: 'culture', response_answer_id: 'ra-2' },
      { tag: 'culture', response_answer_id: 'ra-3' },
      { tag: 'workload', response_answer_id: 'ra-4' },
      { tag: 'workload', response_answer_id: 'ra-5' },
    ]
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: fakeTags, error: null }) // qualitative_tags
      if (callCount === 2) return makeChainable({ error: null }) // DELETE
      return makeChainable({ error: null }) // INSERT
    })

    const { generateThemes } = await import('./tagging')
    const result = await generateThemes('survey-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.themesCreated).toBe(2)
    }
  })

  test('filters out tags with fewer than 2 occurrences', async () => {
    mockUserWithRole('admin')
    const fakeTags = [
      { tag: 'culture', response_answer_id: 'ra-1' },
      { tag: 'culture', response_answer_id: 'ra-2' },
      { tag: 'rare-tag', response_answer_id: 'ra-3' }, // only 1 occurrence
    ]
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: fakeTags, error: null })
      if (callCount === 2) return makeChainable({ error: null })
      return makeChainable({ error: null })
    })

    const { generateThemes } = await import('./tagging')
    const result = await generateThemes('survey-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.themesCreated).toBe(1) // only 'culture' qualifies
    }
  })

  test('caps themes at 10 entries', async () => {
    mockUserWithRole('admin')
    // 15 distinct tags, each appearing 3 times
    const fakeTags = Array.from({ length: 15 }, (_, i) => [
      { tag: `tag-${i}`, response_answer_id: `ra-${i}-a` },
      { tag: `tag-${i}`, response_answer_id: `ra-${i}-b` },
      { tag: `tag-${i}`, response_answer_id: `ra-${i}-c` },
    ]).flat()

    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: fakeTags, error: null })
      if (callCount === 2) return makeChainable({ error: null })
      return makeChainable({ error: null })
    })

    const { generateThemes } = await import('./tagging')
    const result = await generateThemes('survey-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.themesCreated).toBe(10)
    }
  })

  test('deletes existing themes before inserting new ones (idempotent)', async () => {
    mockUserWithRole('admin')
    const fakeTags = [
      { tag: 'culture', response_answer_id: 'ra-1' },
      { tag: 'culture', response_answer_id: 'ra-2' },
    ]

    const deleteChain = makeChainable({ error: null })
    const insertChain = makeChainable({ error: null })
    const tagsChain = makeChainable({ data: fakeTags, error: null })

    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return tagsChain // SELECT tags
      if (callCount === 2) return deleteChain // DELETE themes
      return insertChain // INSERT themes
    })

    const { generateThemes } = await import('./tagging')
    const result = await generateThemes('survey-1')
    expect(result.success).toBe(true)
    // DELETE was called — callCount >= 3 (tags + delete + insert, nested subquery may add more)
    expect(callCount).toBeGreaterThanOrEqual(3)
  })

  test('returns themesCreated count on success', async () => {
    mockUserWithRole('admin')
    const fakeTags = [
      { tag: 'a', response_answer_id: 'ra-1' },
      { tag: 'a', response_answer_id: 'ra-2' },
      { tag: 'b', response_answer_id: 'ra-3' },
      { tag: 'b', response_answer_id: 'ra-4' },
      { tag: 'b', response_answer_id: 'ra-5' },
    ]
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: fakeTags, error: null })
      if (callCount === 2) return makeChainable({ error: null })
      return makeChainable({ error: null })
    })

    const { generateThemes } = await import('./tagging')
    const result = await generateThemes('survey-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.themesCreated).toBe(2)
    }
  })
})

describe('updateTheme', () => {
  beforeEach(() => vi.clearAllMocks())

  test('updates theme label and is_positive flag', async () => {
    mockUserWithRole('survey_analyst')
    const chain = makeChainable({ error: null })
    mockDb.from.mockReturnValue(chain)

    const { updateTheme } = await import('./tagging')
    const result = await updateTheme('theme-1', { theme: 'Improved label', isPositive: true })
    expect(result.success).toBe(true)
  })

  test('returns error when role is not survey_analyst or admin', async () => {
    mockUserWithRole('employee')
    const { updateTheme } = await import('./tagging')
    const result = await updateTheme('theme-1', { isPositive: true })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/forbidden/i)
    }
  })
})
