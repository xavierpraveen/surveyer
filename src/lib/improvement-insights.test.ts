import { describe, expect, test } from 'vitest'
import { computeImprovementInsights } from './improvement-insights'
import type { DimensionScore } from '@/lib/types/analytics'

function row(partial: Partial<DimensionScore>): DimensionScore {
  return {
    dimensionId: partial.dimensionId ?? 'd',
    dimensionName: partial.dimensionName ?? 'Dimension',
    dimensionSlug: partial.dimensionSlug ?? 'dimension',
    avgScore: partial.avgScore ?? null,
    favorablePct: partial.favorablePct ?? null,
    neutralPct: partial.neutralPct ?? null,
    unfavorablePct: partial.unfavorablePct ?? null,
    respondentCount: partial.respondentCount ?? 0,
    belowThreshold: partial.belowThreshold ?? false,
  }
}

describe('computeImprovementInsights', () => {
  test('ranks by low-score and impact', () => {
    const result = computeImprovementInsights([
      row({ dimensionId: 'a', dimensionName: 'A', avgScore: 3.2, respondentCount: 50 }),
      row({ dimensionId: 'b', dimensionName: 'B', avgScore: 2.9, respondentCount: 10 }),
      row({ dimensionId: 'c', dimensionName: 'C', avgScore: 4.4, respondentCount: 50 }),
    ])

    expect(result.priorityAreas[0]?.dimensionId).toBe('a')
    expect(result.priorityAreas[0]?.priorityScore).toBeGreaterThan(result.priorityAreas[1]?.priorityScore ?? 0)
  })

  test('excludes below-threshold dimensions from actionable insights', () => {
    const result = computeImprovementInsights([
      row({ dimensionId: 'hidden', belowThreshold: true, avgScore: 2.1, respondentCount: 2 }),
      row({ dimensionId: 'shown', avgScore: 3.1, respondentCount: 18 }),
    ])

    expect(result.priorityAreas.map((x) => x.dimensionId)).toEqual(['shown'])
    expect(result.criticalAreas.map((x) => x.dimensionId)).toEqual(['shown'])
  })

  test('classifies critical and strength areas using configured cutoffs', () => {
    const result = computeImprovementInsights([
      row({ dimensionId: 'critical', avgScore: 3.0, respondentCount: 22 }),
      row({ dimensionId: 'neutral', avgScore: 3.8, respondentCount: 22 }),
      row({ dimensionId: 'strong', avgScore: 4.5, respondentCount: 22 }),
    ])

    expect(result.criticalAreas.map((x) => x.dimensionId)).toContain('critical')
    expect(result.strengthAreas.map((x) => x.dimensionId)).toContain('strong')
    expect(result.recommendedFocus.length).toBeLessThanOrEqual(3)
  })

  test('returns empty collections when no visible scores exist', () => {
    const result = computeImprovementInsights([
      row({ dimensionId: 'hidden', belowThreshold: true, avgScore: null, respondentCount: 3 }),
    ])

    expect(result.priorityAreas).toHaveLength(0)
    expect(result.criticalAreas).toHaveLength(0)
    expect(result.strengthAreas).toHaveLength(0)
    expect(result.recommendedFocus).toHaveLength(0)
  })
})
