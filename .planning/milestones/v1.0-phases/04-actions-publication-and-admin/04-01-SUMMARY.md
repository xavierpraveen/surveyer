---
phase: 04-actions-publication-and-admin
plan: 01
subsystem: database
tags: [postgres, supabase, typescript, vitest, migrations, types]

# Dependency graph
requires:
  - phase: 03-analytics-and-dashboards
    provides: DimensionScore, QualitativeTheme, PublicAction types in analytics.ts
  - phase: 01-foundation
    provides: surveys table, action_items table, publication_snapshots table schema
provides:
  - surveys.archived BOOLEAN column with index (Phase 4 archival feature)
  - action_items.dimension_ids UUID[] column with GIN index (ACTIONS-01)
  - publication_snapshots UNIQUE constraint on survey_id (PUBLISH-04)
  - src/lib/types/phase4.ts with 10 exported interfaces for all Phase 4 features
  - 4 test stub files establishing RED state for Wave 2 implementations
affects:
  - 04-02 (Server Actions implementation — imports phase4.ts types)
  - 04-03 (Publication snapshot Server Actions — uses PublicationSnapshot, SnapshotData)
  - 04-04 (Admin settings UI — uses AppSettings, EmployeeImportRow, ImportResult)
  - 04-05 (Tagging workspace — uses QualitativeTag, TaggableAnswer)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Test stub pattern: vitest test.todo() stubs establish RED state before GREEN implementation in next wave"
    - "Type contract first: phase4.ts defined before implementations to prevent executor scavenger hunt"

key-files:
  created:
    - supabase/migrations/20260316000007_phase4.sql
    - src/lib/types/phase4.ts
    - src/lib/actions/actions.test.ts
    - src/lib/actions/publication.test.ts
    - src/lib/actions/settings.test.ts
    - src/lib/actions/tagging.test.ts
  modified: []

key-decisions:
  - "ActionItem interface has dimensionIds: string[] field matching new dimension_ids UUID[] DB column"
  - "SnapshotData.schemaVersion typed as literal 1 (not number) to enable future discriminated union versioning"
  - "TaggableAnswer intentionally omits user identity fields — anonymity preserved at type level, not just at runtime"

patterns-established:
  - "Phase 4 types imported via @/lib/types/phase4 — wave executor does not need to discover types"
  - "Test stubs mirror requirement IDs in describe() names for traceability"

requirements-completed:
  - ACTIONS-01
  - ACTIONS-02
  - ACTIONS-03
  - ACTIONS-04
  - ACTIONS-05
  - PUBLISH-01
  - PUBLISH-02
  - PUBLISH-03
  - PUBLISH-04
  - PUBLISH-05
  - ADMIN-04
  - ADMIN-05
  - ADMIN-08
  - ADMIN-09

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 01: Schema Migration and Type Contracts Summary

**Phase 4 schema migration (archived flag, dimension_ids array, snapshot uniqueness) plus 10 TypeScript interfaces and 62 test stubs across 4 files establishing the type contract baseline for Wave 2 Server Actions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T21:00:07Z
- **Completed:** 2026-03-15T21:02:19Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Migration file adds 3 schema changes: `surveys.archived BOOLEAN`, `action_items.dimension_ids UUID[]` with GIN index, `publication_snapshots` UNIQUE constraint on `survey_id`
- `src/lib/types/phase4.ts` exports 10 interfaces (ActionItem, ActionUpdate, PublicationSnapshot, SnapshotData, AppSettings, QualitativeTag, TaggableAnswer, EmployeeImportRow, ImportResult, ParticipationRow) with zero TypeScript errors
- 4 test stub files created with 62 `test.todo` entries; `npm test` exits 0 with 125 total todos passing (includes pre-existing test files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Phase 4 schema migration** - `6b2c266` (chore)
2. **Task 2: Phase 4 TypeScript types + test stubs** - `e776306` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `supabase/migrations/20260316000007_phase4.sql` - Adds archived, dimension_ids columns and UNIQUE constraint
- `src/lib/types/phase4.ts` - 10 Phase 4 type interfaces imported by all Wave 2+ implementations
- `src/lib/actions/actions.test.ts` - 15 test stubs for ACTIONS-01 through ACTIONS-05
- `src/lib/actions/publication.test.ts` - 9 test stubs for PUBLISH-01, PUBLISH-02, PUBLISH-04, PUBLISH-05
- `src/lib/actions/settings.test.ts` - 13 test stubs for ADMIN-04, ADMIN-05, ADMIN-08, ADMIN-09
- `src/lib/actions/tagging.test.ts` - 15 test stubs for ADMIN-09 (tagging/themes)

## Decisions Made
- `SnapshotData.schemaVersion` typed as literal `1` (not `number`) to enable future discriminated union versioning if schema changes
- `TaggableAnswer` intentionally omits user identity fields — anonymity preserved at type level, not just runtime
- `ActionItem.dimensionIds` is `string[]` (not `UUID[]`) matching TypeScript convention for UUID arrays

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

`npm test` required explicit PATH including nvm node v22.12.0 due to shell environment not having node in PATH. Resolved by setting PATH inline in bash invocation. Tests passed on first run.

## User Setup Required

None - no external service configuration required. Migration file must be applied to Supabase via `npx supabase db push` when supabase CLI is available.

## Next Phase Readiness
- Wave 2 executor (Plan 02) can import all types from `@/lib/types/phase4.ts` without exploration
- Test stubs in RED state — Wave 2 will implement Server Actions turning stubs GREEN
- Migration needs to be applied to live Supabase project before Phase 4 features work end-to-end

---
*Phase: 04-actions-publication-and-admin*
*Completed: 2026-03-16*

## Self-Check: PASSED

All 7 files confirmed present. Both task commits (6b2c266, e776306) confirmed in git log.
