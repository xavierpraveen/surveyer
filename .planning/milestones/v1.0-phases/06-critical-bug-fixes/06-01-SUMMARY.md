---
phase: 06-critical-bug-fixes
plan: 01
subsystem: database
tags: [supabase, postgrest, typescript, zod, survey-engine]

# Dependency graph
requires:
  - phase: 02-survey-engine
    provides: SurveyQuestion interface, createQuestionSchema, all question query files

provides:
  - Correct DB column name survey_section_id used in all question queries, types, validations, and components
  - Multi-section surveys now filter questions per section correctly

affects:
  - Any future phase reading questions from the DB
  - Analytics phases reading question data by section

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/lib/types/survey.ts
    - src/lib/validations/survey.ts
    - src/lib/actions/survey.ts
    - src/app/(employee)/surveys/[id]/page.tsx
    - src/app/survey/public/[id]/page.tsx
    - src/app/(admin)/admin/surveys/[id]/page.tsx
    - src/components/admin/QuestionEditor.tsx

key-decisions:
  - "survey_section_id is the canonical DB column name — all app code must use this, not section_id"

patterns-established:
  - "PostgREST silently ignores unknown filter columns — column name mismatches cause silent full-table returns, not errors"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 06 Plan 01: Fix BUG-01 — survey_section_id Column Name Mismatch Summary

**Silent data correctness bug fixed: replaced all bare `section_id` references with `survey_section_id` across 7 files so multi-section surveys now filter questions per section correctly via PostgREST**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T08:07:30Z
- **Completed:** 2026-03-16T08:10:09Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- `SurveyQuestion` interface now uses `survey_section_id: string` matching the DB schema
- `createQuestionSchema` Zod schema uses `survey_section_id` (updateQuestionSchema picks it up via `.partial()`)
- All four buggy references in `survey.ts` actions fixed: count query, duplicateSurvey fetch, duplicateSurvey destructure, duplicateSurvey insert
- Both page files and QuestionEditor updated with correct column and property names
- TypeScript build clean with zero errors; grep confirms zero bare `section_id` references remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix SurveyQuestion type and createQuestionSchema** - `49e7948` (fix)
2. **Task 2: Fix all query and destructure references in survey.ts actions** - `4f73ff3` (fix)
3. **Task 3: Fix query and filter references in all page files and QuestionEditor** - `4b60023` (fix)

## Files Created/Modified
- `src/lib/types/survey.ts` - SurveyQuestion.section_id renamed to survey_section_id
- `src/lib/validations/survey.ts` - createQuestionSchema.section_id renamed to survey_section_id
- `src/lib/actions/survey.ts` - 4 references fixed: count .eq(), duplicate .in(), duplicate destructure, duplicate insert
- `src/app/(employee)/surveys/[id]/page.tsx` - .in() query and filter fixed
- `src/app/survey/public/[id]/page.tsx` - .in() query and filter fixed
- `src/app/(admin)/admin/surveys/[id]/page.tsx` - .in() query and 2 filter calls fixed
- `src/components/admin/QuestionEditor.tsx` - createQuestion input key fixed

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BUG-01 resolved; multi-section surveys will now correctly show only the questions belonging to each section
- Ready for next plan in phase 06-critical-bug-fixes

---
*Phase: 06-critical-bug-fixes*
*Completed: 2026-03-16*
