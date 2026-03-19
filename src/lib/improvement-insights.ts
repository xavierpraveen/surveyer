import type { DimensionScore, ImprovementArea, ImprovementInsights } from '@/lib/types/analytics'

export const IMPROVEMENT_DEFAULTS = {
  criticalCutoff: 3.5,
  strongCutoff: 4.2,
} as const

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value * 100) / 100
}

function buildRationale(dimensionName: string, avgScore: number, respondentCount: number): string {
  return `${dimensionName} is at ${avgScore.toFixed(1)}/5 with ${respondentCount} responses.`
}

export function computeImprovementInsights(
  scores: DimensionScore[],
  config: Partial<typeof IMPROVEMENT_DEFAULTS> = {}
): ImprovementInsights {
  const criticalCutoff = config.criticalCutoff ?? IMPROVEMENT_DEFAULTS.criticalCutoff
  const strongCutoff = config.strongCutoff ?? IMPROVEMENT_DEFAULTS.strongCutoff

  const candidates = scores.filter((s) => !s.belowThreshold && s.avgScore !== null)
  const rawAreas = candidates.map((s) => {
    const avgScore = Number(s.avgScore as number)
    const respondentCount = Number(s.respondentCount ?? 0)
    const healthGap = Math.max(5 - avgScore, 0)
    const weighted = healthGap * Math.log1p(Math.max(respondentCount, 0))
    return {
      dimensionId: s.dimensionId,
      dimensionName: s.dimensionName,
      dimensionSlug: s.dimensionSlug,
      avgScore,
      respondentCount,
      healthGap,
      weighted,
    }
  })

  const maxWeighted = rawAreas.reduce((max, area) => Math.max(max, area.weighted), 0)

  const toArea = (area: typeof rawAreas[number]): ImprovementArea => {
    const priorityScore = maxWeighted > 0
      ? clampPercent((area.weighted / maxWeighted) * 100)
      : 0
    const urgency: ImprovementArea['urgency'] =
      priorityScore >= 70 ? 'high' : priorityScore >= 40 ? 'medium' : 'low'

    return {
      dimensionId: area.dimensionId,
      dimensionName: area.dimensionName,
      dimensionSlug: area.dimensionSlug,
      avgScore: area.avgScore,
      respondentCount: area.respondentCount,
      healthGap: clampPercent(area.healthGap),
      priorityScore,
      urgency,
      rationale: buildRationale(area.dimensionName, area.avgScore, area.respondentCount),
    }
  }

  const priorityAreas = rawAreas
    .map(toArea)
    .sort((a, b) => b.priorityScore - a.priorityScore)

  const criticalAreas = priorityAreas
    .filter((a) => a.avgScore < criticalCutoff)
    .sort((a, b) => a.avgScore - b.avgScore)

  const strengthAreas = priorityAreas
    .filter((a) => a.avgScore >= strongCutoff)
    .sort((a, b) => b.avgScore - a.avgScore)

  const recommendedFocus = priorityAreas.slice(0, 3)

  return {
    priorityAreas,
    criticalAreas,
    strengthAreas,
    recommendedFocus,
  }
}
