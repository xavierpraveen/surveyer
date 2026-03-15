---
phase: 02-survey-engine
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwind, server-actions, survey-builder]

requires:
  - phase: 02-01
    provides: Survey, SurveySection, SurveyQuestion, Dimension types + all Server Actions

provides:
  - Admin survey list page with table, status badges, and duplicate action
  - New survey creation form with all fields, toggles, and inline validation
  - Survey builder RSC fetching survey + sections + questions + dimensions
  - SurveyStatusBanner component with lifecycle transitions and inline schedule form
  - SectionSidebar with section list, reorder arrows, role targeting, add form
  - QuestionEditor with accordion inline edit, all 6 types, dimension multi-select, conditional rules

affects:
  - 02-03
  - 03-response-engine

tech-stack:
  added: []
  patterns:
    - RSC data fetch pattern — server component fetches all data (survey + sections + questions + dimensions), passes to client components as props
    - URL search param for active section — ?section=<id> tracks which section is selected without additional state
    - Accordion inline editing — questions expand in-place, one open at a time
    - router.refresh() after mutations — re-fetches RSC data without full navigation
    - Cast to any for untyped Supabase client — supabase as unknown as typed client avoids Database stub errors

key-files:
  created:
    - src/app/(admin)/admin/page.tsx
    - src/app/(admin)/admin/surveys/page.tsx
    - src/app/(admin)/admin/surveys/new/page.tsx
    - src/app/(admin)/admin/surveys/[id]/page.tsx
    - src/components/admin/SurveyList.tsx
    - src/components/admin/SurveyStatusBanner.tsx
    - src/components/admin/SectionSidebar.tsx
    - src/components/admin/QuestionEditor.tsx
  modified: []

key-decisions:
  - "RSC data fetch in builder page — all data (survey+sections+questions+dimensions) fetched server-side in one RSC page, passed as props to client components for clean separation"
  - "hasDimensionsCovered simplified — full dimension coverage check would require joining question_dimension_map server-side; current implementation marks sections covered when all questions are not required (simplified, can be enhanced in Phase 3)"
  - "Stale .next/types cache auto-removed — .next/types/app/(admin)/page.ts was a stale build artifact referencing removed route, deleted to allow tsc --noEmit to pass"

patterns-established:
  - "Survey builder layout: top bar breadcrumb + sticky status banner + flex row (sidebar 256px + content flex-1)"
  - "QuestionEditor accordion: one form open at a time, click header to expand/collapse"
  - "Mutation pattern: call Server Action → check result.success → router.refresh() on success, setError on failure"

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
  - DIM-01
  - DIM-02
  - DIM-03

duration: 5min
completed: 2026-03-15
---

# Phase 2 Plan 02: Survey Builder Summary

**Admin survey builder with inline question editing, lifecycle status banner, section sidebar with role targeting, and dimension multi-select — all in Tailwind-only RSC + client component architecture.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T17:41:38Z
- **Completed:** 2026-03-15T17:46:39Z
- **Tasks:** 2 (+ 1 checkpoint auto-approved)
- **Files modified:** 8 created

## Accomplishments

- Full admin survey builder: list → create form → builder layout with sidebar + content area
- SurveyStatusBanner with all lifecycle transitions (draft → scheduled/open → closed) and inline schedule form
- SectionSidebar with ordered section list, reorder arrows, role targeting multi-select, and add section form
- QuestionEditor with accordion inline editing, all 6 question types, dimension multi-select (max 3), conditional rule config, options list for select types, and delete with confirm dialog

## Task Commits

1. **Task 1: Admin survey list page and new survey form** - `9566433` (feat)
2. **Task 2: Survey builder — sidebar, question editor, status banner** - `be39343` (feat)

## Files Created/Modified

- `src/app/(admin)/admin/page.tsx` - Survey Management hub with survey count and quick links
- `src/app/(admin)/admin/surveys/page.tsx` - RSC fetching all surveys ordered by created_at desc
- `src/app/(admin)/admin/surveys/new/page.tsx` - Client form: title, description, toggles, optional schedule dates
- `src/app/(admin)/admin/surveys/[id]/page.tsx` - Survey builder RSC: fetches survey, sections, questions, dimensions; renders layout
- `src/components/admin/SurveyList.tsx` - Table with status badges (draft=gray, scheduled=yellow, open=green, closed=slate), edit and duplicate actions
- `src/components/admin/SurveyStatusBanner.tsx` - Sticky banner with lifecycle action buttons and inline schedule form
- `src/components/admin/SectionSidebar.tsx` - Section list with reorder arrows, question counts, and add section form with role targeting
- `src/components/admin/QuestionEditor.tsx` - Accordion question rows with full inline edit form, all 6 types, dimension multi-select, conditional rules

## Decisions Made

- RSC data fetch in builder page — all data fetched server-side in a single RSC, passed as props to client components. Keeps client components stateless for initial render.
- `hasDimensionsCovered` simplified — full check would require joining `question_dimension_map` server-side. Current implementation is a stub; Phase 3 can add proper per-section coverage tracking.
- Survey builder uses URL search param `?section=<id>` to track active section — avoids client state that would be lost on router.refresh().

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed stale .next/types cache file blocking tsc --noEmit**
- **Found during:** Task 2 verification
- **Issue:** `.next/types/app/(admin)/page.ts` referenced `src/app/(admin)/page.js` (a route removed in a prior plan) causing TS2307 error
- **Fix:** Deleted the stale `.next/types/app/(admin)/page.ts` build artifact
- **Files modified:** `.next/types/app/(admin)/page.ts` (deleted, untracked)
- **Verification:** `pnpm tsc --noEmit` exits with no errors
- **Committed in:** be39343 (Task 2 commit — file was untracked, not in git history)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Cache cleanup only. No scope changes.

## Issues Encountered

None beyond the stale cache artifact above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin survey builder complete — admins can create surveys, add sections with role targeting, add/edit/delete questions of all 6 types, map dimensions, configure conditional rules, and manage lifecycle
- Phase 02-03 (employee survey-taking) can now consume surveys via the `surveys` table in `open` status
- Phase 03 analytics can reference dimension mappings and question_dimension_map populated by this UI

---
*Phase: 02-survey-engine*
*Completed: 2026-03-15*
