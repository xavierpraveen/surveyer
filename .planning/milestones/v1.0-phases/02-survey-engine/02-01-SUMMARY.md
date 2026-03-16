---
phase: 02-survey-engine
plan: 01
subsystem: api
tags: [supabase, zod, server-actions, typescript, survey, response, anonymity]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: supabaseAdmin singleton, createSupabaseServerClient, AppRole types, auth patterns
provides:
  - All shared TypeScript interfaces for Phase 2 (Survey, SurveySection, SurveyQuestion, QuestionOption, SurveyResponse, ResponseAnswer, ResponseDraft, Dimension, QuestionDimensionMap)
  - Survey admin Server Actions (createSurvey, updateSurvey, createSection, updateSection, reorderSections, createQuestion, updateQuestion, reorderQuestions, deleteQuestion, mapQuestionDimensions, transitionSurveyStatus, duplicateSurvey)
  - Response Server Actions (saveDraft, getMyDraft, checkSubmissionStatus, submitResponse)
  - Zod validation schemas for all survey/response mutations
  - Wave 0 test stubs for all critical action behaviors
affects:
  - 02-survey-engine (all downstream plans import these types and actions)
  - 03-analytics-engine
  - 04-publication

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Actions use 'use server' directive with Zod parse-first pattern"
    - "supabaseAdmin cast to any for stub Database type — real types from Supabase CLI in Phase 3"
    - "Return type: { success: true; data: T } | { success: false; error: string } on all actions"
    - "getUser() called via createSupabaseServerClient for auth; supabaseAdmin for privileged DB writes"
    - "submitResponse inserts participation_token with user_id but sets response.user_id=NULL for anonymous"

key-files:
  created:
    - src/lib/types/survey.ts
    - src/lib/validations/survey.ts
    - src/lib/actions/survey.ts
    - src/lib/actions/response.ts
    - src/lib/actions/survey.test.ts
    - src/lib/actions/response.test.ts
  modified: []

key-decisions:
  - "supabaseAdmin cast to `any` for DB calls — database.types.ts is a stub; Supabase CLI generates real types in Phase 3, no premature coupling needed"
  - "ALLOWED_TRANSITIONS defined in both validations/survey.ts (exported) and actions/survey.ts (local) — action owns the runtime enforcement"
  - "Profile metadata (department, role, tenure_band, work_type) snapshotted at submission time from profiles table into responses row columns — not live FKs"
  - "duplicateSurvey preserves stable_question_id on all copied questions for longitudinal analytics continuity"

patterns-established:
  - "Server Action file starts with 'use server' then imports, then local `const db = supabaseAdmin as any`"
  - "Zod safeParse at top of every action — return early with error on failure"
  - "getUser() for identity, supabaseAdmin for privileged writes bypassing RLS"
  - "participation_tokens share only survey_id with responses — structural anonymity guarantee"

requirements-completed:
  - SURVEY-01
  - SURVEY-02
  - SURVEY-03
  - SURVEY-04
  - SURVEY-05
  - SURVEY-06
  - SURVEY-07
  - SURVEY-08
  - SURVEY-09
  - SURVEY-10
  - SURVEY-11
  - SURVEY-12
  - RESPONSE-05
  - RESPONSE-06
  - RESPONSE-07
  - RESPONSE-08
  - DIM-01
  - DIM-02
  - DIM-03

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 2 Plan 1: Survey Engine Core Types and Server Actions Summary

**Supabase Server Actions for survey CRUD, lifecycle transitions, duplications, and anonymous response collection with participation token deduplication**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T14:14:14Z
- **Completed:** 2026-03-15T14:18:00Z
- **Tasks:** 2
- **Files modified:** 6 created

## Accomplishments

- All shared TypeScript types for Phase 2 exported from `src/lib/types/survey.ts` (12 interfaces and union types)
- Survey admin Server Actions covering full CRUD + lifecycle state machine + duplicate + dimension mapping
- Response Server Actions enforcing anonymity (`user_id=NULL`), single-submit via participation tokens, draft upsert, and profile snapshot at submission time
- Wave 0 test stubs (61 total across project) ready for Wave 1 implementation

## Task Commits

1. **Task 1: Shared type contracts and Zod validation schemas** - `a69944e` (feat)
2. **Task 2: Survey admin Server Actions + response Server Actions + test stubs** - `908705b` (feat)

## Files Created/Modified

- `src/lib/types/survey.ts` - All shared TypeScript interfaces and union types for Phase 2
- `src/lib/validations/survey.ts` - Zod schemas for all survey/response mutations including transition matrix validation
- `src/lib/actions/survey.ts` - Admin Server Actions: createSurvey, updateSurvey, createSection, updateSection, reorderSections, createQuestion, updateQuestion, reorderQuestions, deleteQuestion, mapQuestionDimensions, transitionSurveyStatus, duplicateSurvey
- `src/lib/actions/response.ts` - Employee Server Actions: saveDraft, getMyDraft, checkSubmissionStatus, submitResponse
- `src/lib/actions/survey.test.ts` - Wave 0 test.todo stubs for 16 survey action behaviors
- `src/lib/actions/response.test.ts` - Wave 0 test.todo stubs for 14 response action behaviors

## Decisions Made

- `supabaseAdmin` cast to `any` for all DB calls — `database.types.ts` is a stub until Supabase CLI codegen runs in Phase 3. Avoids premature type coupling while keeping the rest of the codebase fully typed.
- `ALLOWED_TRANSITIONS` defined locally in `survey.ts` as the runtime authority for status transitions; the validation schema enforces preconditions (e.g., `opens_at` required for `scheduled`).
- Profile metadata snapshotted from `profiles` table at submission time into `responses` row columns — never stored as live FKs, preserving anonymity separation.
- `duplicateSurvey` preserves `stable_question_id` on copied questions so longitudinal analytics in Phase 3 can align questions across survey versions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

TypeScript overload errors from the `supabaseAdmin` generic `Database` stub type — `Record<string, unknown>` for all table Insert/Update types caused `.from().insert()` calls to resolve to `never`. Fixed (Rule 1 - Bug) by casting `supabaseAdmin as any` locally in each action file, consistent with the project's approach of deferring real DB types to Phase 3.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 2 type contracts and action signatures are locked — downstream plans (02-02 through 02-06) can import directly
- Wave 0 test stubs committed and tracked in CI
- Blocker from STATE.md still applies: participation token RLS policies for anonymous update path need careful testing before committing to implementation

## Self-Check: PASSED

All 6 created files verified on disk. Both task commits (a69944e, 908705b) confirmed in git history.

---
*Phase: 02-survey-engine*
*Completed: 2026-03-15*
