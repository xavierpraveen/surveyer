import { describe, test } from 'vitest'

describe('createPublicationSnapshot', () => {
  test.todo('returns error when survey status is not closed')
  test.todo('returns error when derived_metrics count is zero (metrics not computed)')
  test.todo('returns error when snapshot already exists for this survey')
  test.todo('returns snapshotId on successful snapshot creation')
  test.todo('snapshot_data contains dimensionScores, participationRate, qualitativeThemes, publicActions')
})

describe('getPublicationSnapshot', () => {
  test.todo('returns snapshot data for a given surveyId')
  test.todo('returns null when no snapshot exists for surveyId')
})

describe('getPublishedCycles', () => {
  test.todo('returns list of surveys that have published snapshots')
  test.todo('returns empty array when no published snapshots exist')
})
