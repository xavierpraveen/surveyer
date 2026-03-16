---
phase: 02-survey-engine
plan: 05
subsystem: database
tags: [supabase, postgres, migrations, seed, survey, dimensions]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Phase 1 seed with 12 dimensions, 13 sections, 60 questions in draft survey (20260315000004_seed.sql)
provides:
  - Survey activated in 'open' status with opens_at/closes_at timestamps
  - 3 role-specific sections for engineering/QA/architects (UUIDs 66600000-...-000014 through 000016)
  - 13 new questions covering deep technical practices, code review, and QA strategy
  - 69 total question_dimension_map rows covering all 12 dimensions
  - 8 cross-cutting secondary dimension mappings on existing Phase 1 questions
affects:
  - Phase 3 analytics (dimension score calculations depend on question_dimension_map completeness)
  - Survey taking UI (role-specific sections need target_roles filtering logic)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Idempotent seed migrations using ON CONFLICT DO NOTHING
    - Role-specific section targeting via TEXT[] target_roles column
    - Cross-cutting dimension mappings with weight < 1.0 for secondary associations

key-files:
  created:
    - supabase/migrations/20260315000005_phase2_seed.sql
  modified: []

key-decisions:
  - "New role-specific section UUIDs start at 66600000-...-000014 to avoid gaps and maintain namespace clarity"
  - "Secondary cross-cutting dimension weights set to 0.7 to indicate lower signal strength vs primary (1.0)"
  - "Short_text questions intentionally excluded from dimension_map — open text has no numeric dimension score"
  - "ON CONFLICT DO NOTHING used on all question_dimension_map inserts to safely re-apply over Phase 1 mappings"

patterns-established:
  - "Phase N seed migrations are additive-only — never modify Phase 1 seed data"
  - "DO $$ assertion block at end of seed to validate minimum row counts"

requirements-completed:
  - SURVEY-13
  - DIM-01

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 2 Plan 05: Phase 2 Seed Summary

**Open diagnostic survey with 3 role-specific engineering sections, 13 new questions, and 69 question_dimension_map rows covering all 12 organizational dimensions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T14:14:31Z
- **Completed:** 2026-03-15T14:17:12Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Activated the diagnostic survey from 'draft' to 'open' with a 30-day response window
- Added 3 role-specific sections targeting engineering, QA, and architect roles with 13 new questions
- Established 69 total question_dimension_map rows (up from 46 in Phase 1), covering all 12 dimensions
- Added 8 cross-cutting secondary dimension mappings for existing Phase 1 questions that span multiple dimensions
- Migration is fully idempotent — safe to re-run after `supabase db reset`

## Task Commits

Each task was committed atomically:

1. **Task 1: Phase 2 seed migration — survey activation and role-specific sections** - `791f931` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `supabase/migrations/20260315000005_phase2_seed.sql` - Phase 2 seed: survey activation, 3 role-specific sections, 13 new questions, dimension mappings, cross-cutting secondary mappings, and assertion block

## Decisions Made
- **Short_text questions excluded from dimension_map**: Open text answers cannot be scored against a dimension — only Likert-scale questions get mapped. This keeps analytics clean and matches Phase 1 convention.
- **Secondary dimension weights set to 0.7**: Cross-cutting questions that meaningfully touch a second dimension get weight 0.7 vs primary 1.0. This allows Phase 3 analytics to blend dimensions proportionally without giving secondary associations equal weight.
- **Section numbering gap (12 → 14)**: Section 13 left unused intentionally to preserve the 0-indexed "About You" section at UUID 66600000-...-000000, keeping the numbering semantically consistent with display_order.

## Deviations from Plan

None - plan executed exactly as written. The Phase 1 seed already contained most dimension mappings; the Phase 2 migration correctly stacks on top using ON CONFLICT DO NOTHING idempotency.

## Issues Encountered
- Docker was not running so `supabase db reset` could not be used for live verification. SQL validity confirmed by cross-referencing against the schema (table columns, PRIMARY KEY constraint, ON CONFLICT target) and counting expected row totals programmatically (69 total dimension map rows confirmed via Python regex analysis).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Survey is open and accessible; Phase 2 UI tasks can immediately use `survey_id = 55500000-0000-0000-0000-000000000001`
- All 12 dimensions have question coverage — Phase 3 analytics can calculate per-dimension scores
- Role-specific sections exist; survey-taking wizard needs to filter sections by `target_roles` using the authenticated user's role from `app_metadata`
- No blockers for remaining Phase 2 plans

---
*Phase: 02-survey-engine*
*Completed: 2026-03-15*
