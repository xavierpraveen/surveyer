import { describe, test } from 'vitest'

describe('computeDerivedMetrics', () => {
  test.todo('returns rowsInserted count on success')
  test.todo('returns error when user lacks permission')
  test.todo('is idempotent when called twice for same survey')
})

describe('getLeadershipDashboardData', () => {
  test.todo('returns dimension scores with below_threshold flags')
  test.todo('defaults to most recent closed computed survey')
  test.todo('filters heatmap rows by department when filter applied')
  test.todo('returns empty themes array when no qualitative_themes exist')
  test.todo('returns publicActions array from v_public_actions view')
})

describe('getManagerDashboardData', () => {
  test.todo('returns null dimensionScores when team count < 5')
  test.todo('participation count always included regardless of threshold')
})

describe('getPublicResultsData', () => {
  test.todo('returns hasData=false when no closed computed survey')
  test.todo('returns only company-wide scores, not segmented')
})
