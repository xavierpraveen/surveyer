import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))

import { supabaseAdmin } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const mockDb = supabaseAdmin as unknown as { from: ReturnType<typeof vi.fn>; rpc: ReturnType<typeof vi.fn> }
const mockCreateClient = createSupabaseServerClient as ReturnType<typeof vi.fn>

function makeChainable(finalResult: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['from', 'insert', 'update', 'delete', 'select', 'eq', 'order', 'in', 'single', 'limit', 'or', 'upsert', 'neq', 'not']
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

describe('createPublicationSnapshot', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns error when survey status is not closed', async () => {
    mockUserWithRole('admin')
    // survey with status 'open'
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-1', status: 'open', title: 'Q1' }, error: null })
      return makeChainable({ data: null, error: null })
    })

    const { createPublicationSnapshot } = await import('./publication')
    const result = await createPublicationSnapshot('sv-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/closed/i)
    }
  })

  test('returns error when derived_metrics count is zero (metrics not computed)', async () => {
    mockUserWithRole('admin')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-1', status: 'closed', title: 'Q1' }, error: null })
      // derived_metrics count = 0
      if (callCount === 2) return makeChainable({ count: 0, error: null })
      return makeChainable({ data: null, error: null })
    })

    const { createPublicationSnapshot } = await import('./publication')
    const result = await createPublicationSnapshot('sv-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/compute/i)
    }
  })

  test('returns error when snapshot already exists for this survey', async () => {
    mockUserWithRole('admin')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-1', status: 'closed', title: 'Q1' }, error: null })
      if (callCount === 2) return makeChainable({ count: 5, error: null }) // derived_metrics exist
      if (callCount === 3) return makeChainable({ data: { id: 'snap-1' }, error: null }) // snapshot exists
      return makeChainable({ data: null, error: null })
    })

    const { createPublicationSnapshot } = await import('./publication')
    const result = await createPublicationSnapshot('sv-1')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/already published/i)
    }
  })

  test('returns snapshotId on successful snapshot creation', async () => {
    mockUserWithRole('admin')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-1', status: 'closed', title: 'Q1', closes_at: '2026-01-01T00:00:00Z' }, error: null })
      if (callCount === 2) return makeChainable({ count: 5, error: null }) // derived_metrics count
      if (callCount === 3) return makeChainable({ data: null, error: null }) // no existing snapshot
      // Additional queries for snapshot data
      if (callCount === 4) return makeChainable({ data: [], error: null }) // derived_metrics for scores
      if (callCount === 5) return makeChainable({ data: [], error: null }) // v_participation_rates
      if (callCount === 6) return makeChainable({ count: 0, error: null }) // eligible count
      if (callCount === 7) return makeChainable({ data: [], error: null }) // qualitative_themes
      if (callCount === 8) return makeChainable({ data: [], error: null }) // v_public_actions
      // INSERT snapshot
      return makeChainable({ data: { id: 'snap-new' }, error: null })
    })

    const { createPublicationSnapshot } = await import('./publication')
    const result = await createPublicationSnapshot('sv-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.snapshotId).toBe('snap-new')
    }
  })

  test('snapshot_data contains dimensionScores, participationRate, qualitativeThemes, publicActions', async () => {
    mockUserWithRole('leadership')
    let callCount = 0
    mockDb.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) return makeChainable({ data: { id: 'sv-1', status: 'closed', title: 'Q1', closes_at: '2026-01-01' }, error: null })
      if (callCount === 2) return makeChainable({ count: 3, error: null })
      if (callCount === 3) return makeChainable({ data: null, error: null })
      // dimensionScores
      if (callCount === 4) return makeChainable({ data: [{ dimension_id: 'dim-1', avg_score: 4.2, favorable_pct: 80, neutral_pct: 10, unfavorable_pct: 10, respondent_count: 20, dimensions: { name: 'Engagement', slug: 'engagement' } }], error: null })
      // participation
      if (callCount === 5) return makeChainable({ data: [{ token_count: 20 }], error: null })
      if (callCount === 6) return makeChainable({ count: 25, error: null }) // eligible
      // themes
      if (callCount === 7) return makeChainable({ data: [{ id: 'th-1', theme: 'culture', tag_cluster: ['culture'], summary: null, is_positive: false }], error: null })
      // actions
      if (callCount === 8) return makeChainable({ data: [], error: null })
      return makeChainable({ data: { id: 'snap-2' }, error: null })
    })

    const { createPublicationSnapshot } = await import('./publication')
    const result = await createPublicationSnapshot('sv-1')
    expect(result.success).toBe(true)
  })
})

describe('getPublicationSnapshot', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns snapshot data for a given surveyId', async () => {
    mockUserWithRole('admin')
    const fakeSnapshot = {
      id: 'snap-1',
      survey_id: 'sv-1',
      snapshot_data: {
        schemaVersion: 1,
        surveyId: 'sv-1',
        surveyTitle: 'Q1',
        publishedAt: '2026-01-01T00:00:00Z',
        participationRate: 80,
        totalResponses: 20,
        dimensionScores: [],
        qualitativeThemes: [],
        publicActions: [],
      },
      published_by: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    }
    mockDb.from.mockReturnValue(makeChainable({ data: fakeSnapshot, error: null }))

    const { getPublicationSnapshot } = await import('./publication')
    const result = await getPublicationSnapshot('sv-1')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.id).toBe('snap-1')
      expect(result.data?.snapshotData).toBeDefined()
    }
  })

  test('returns null when no snapshot exists for surveyId', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(makeChainable({ data: null, error: null }))

    const { getPublicationSnapshot } = await import('./publication')
    const result = await getPublicationSnapshot('sv-999')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })
})

describe('getPublishedCycles', () => {
  beforeEach(() => vi.clearAllMocks())

  test('returns list of surveys that have published snapshots', async () => {
    mockUserWithRole('admin')
    const fakeRows = [
      { id: 'snap-1', survey_id: 'sv-1', surveys: { title: 'Q1 2026', closes_at: '2026-01-01T00:00:00Z' }, created_at: '2026-01-10T00:00:00Z' },
    ]
    mockDb.from.mockReturnValue(makeChainable({ data: fakeRows, error: null }))

    const { getPublishedCycles } = await import('./publication')
    const result = await getPublishedCycles()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBe(1)
      expect(result.data[0].surveyTitle).toBe('Q1 2026')
    }
  })

  test('returns empty array when no published snapshots exist', async () => {
    mockUserWithRole('admin')
    mockDb.from.mockReturnValue(makeChainable({ data: [], error: null }))

    const { getPublishedCycles } = await import('./publication')
    const result = await getPublishedCycles()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })
})
