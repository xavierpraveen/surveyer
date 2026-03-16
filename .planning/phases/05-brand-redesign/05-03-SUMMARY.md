---
phase: 05-brand-redesign
plan: "03"
subsystem: ui
tags: [tailwind, survey, likert, design-tokens, brand-redesign]

# Dependency graph
requires:
  - phase: 05-01
    provides: Design token CSS variables and Tailwind config with brand/accent/fg/surface tokens

provides:
  - Spec-defined gradient progress bar (from-brand to-accent) in SurveyProgressBar
  - Spec Likert button states (selected: border-brand bg-brand-muted text-brand font-bold; unselected: border-border bg-surface text-fg-muted) in QuestionRenderer
  - Restyled SurveyWizard with Primary/Secondary button variants and token-based autosave indicator
  - ConditionalQuestion with max-h reveal mechanism preserved exactly

affects: [05-04, any future survey UI work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Likert state ternary pattern: LIKERT_SELECTED / LIKERT_UNSELECTED constants at module top, applied via ternary on selected state"
    - "Progress bar gradient: bg-gradient-to-r from-brand to-accent with inline width style"
    - "Autosave indicator: per-status className ternary covering idle/saving/saved/error token classes"

key-files:
  created: []
  modified:
    - src/components/survey/SurveyProgressBar.tsx
    - src/components/survey/QuestionRenderer.tsx
    - src/components/survey/SurveyWizard.tsx
    - src/components/survey/ConditionalQuestion.tsx

key-decisions:
  - "Likert SELECTED/UNSELECTED class strings extracted to module-level constants for DRY application across likert_5, likert_10, single_select, multi_select question types"
  - "ConditionalQuestion wrapper classes unchanged — max-h-0/max-h-96 overflow-hidden reveal mechanism preserved exactly per architectural decision from Phase 02"
  - "SurveyWizard section heading changed to text-xl font-bold tracking-snug per spec type scale for page titles (20px/700)"

patterns-established:
  - "Ternary Likert state pattern: define LIKERT_SELECTED / LIKERT_UNSELECTED at top of file, apply with template literal ternary — avoids repeating 100+ char class strings"
  - "Error banners in forms: bg-error-muted border border-error text-error-text with role=alert"

requirements-completed:
  - BRAND-05

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 05 Plan 03: Survey Components Brand Restyle Summary

**Spec-exact Likert scale buttons (border-brand/bg-brand-muted selected state), gradient progress bar (from-brand to-accent), and token-based wizard navigation buttons applied across all 4 survey components**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T06:34:56Z
- **Completed:** 2026-03-16T06:37:29Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- SurveyProgressBar: gradient fill bar (bg-gradient-to-r from-brand to-accent), brand-muted track (h-1.5), percentage label uses text-xs text-fg-muted tabular-nums
- QuestionRenderer: spec Likert states applied to all question types (likert_5, likert_10, single_select, multi_select); text/textarea inputs use spec form input pattern
- SurveyWizard: Next/Submit = Primary variant (bg-brand), Back = Secondary variant (bg-surface-2); save indicator uses per-status token classes; error banner uses error token set with role=alert
- ConditionalQuestion: max-h-0/max-h-96 overflow-hidden reveal mechanism preserved exactly; zero cosmetic changes to reveal logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle SurveyProgressBar and QuestionRenderer** - `17c91b3` (feat)
2. **Task 2: Restyle SurveyWizard and ConditionalQuestion** - `59f6845` (feat)

## Files Created/Modified

- `src/components/survey/SurveyProgressBar.tsx` - Gradient progress bar with brand-muted track and from-brand to-accent fill
- `src/components/survey/QuestionRenderer.tsx` - Spec Likert selected/unselected token classes for all question types; form input spec pattern
- `src/components/survey/SurveyWizard.tsx` - Primary/Secondary nav buttons; token autosave indicator; error banner with role=alert
- `src/components/survey/ConditionalQuestion.tsx` - Unchanged reveal logic; verified clean re-write preserves max-h mechanism

## Decisions Made

- Extracted `LIKERT_SELECTED` and `LIKERT_UNSELECTED` as module-level constants in QuestionRenderer to avoid duplicating the long class strings across 4 question type branches.
- ConditionalQuestion was effectively a no-op restyle (the component is pure reveal logic with no cosmetic container classes to change) — preserved identically as required by the architectural decision from Phase 02.
- Section heading in SurveyWizard updated from `text-lg font-semibold text-gray-900 mb-1` to `text-xl font-bold tracking-snug text-fg mb-6` to match spec type scale for page titles.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx` not on PATH in bash tool shell; resolved by invoking TypeScript compiler directly via `~/.nvm/versions/node/v22.12.0/bin/node ./node_modules/typescript/bin/tsc --noEmit`. Zero compilation errors on all 4 survey component files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 survey components use brand design tokens — ready for visual QA during survey-taking flow
- ConditionalQuestion reveal logic intact — conditional survey questions remain functional
- Phase 05-04 (analytics and page components) can proceed

---
*Phase: 05-brand-redesign*
*Completed: 2026-03-16*
