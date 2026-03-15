---
phase: 02-survey-engine
plan: 03
subsystem: ui
tags: [nextjs, react, typescript, supabase, survey, autosave, wizard, anonymous-responses, role-targeting]

# Dependency graph
requires:
  - phase: 02-survey-engine
    plan: 01
    provides: Survey/SurveySection/SurveyQuestion/QuestionOption/ResponseDraft types, saveDraft/submitResponse/getMyDraft/checkSubmissionStatus server actions
affects:
  - 02-survey-engine (admin plan 02 and subsequent plans benefit from employee-facing survey flow)
  - 03-analytics-engine (participation rate logic tested here)

provides:
  - Employee dashboard card grid with role-filtered surveys and status badges
  - Section-by-section survey wizard with 500ms debounced autosave and corner save indicator
  - Resume banner restoring last saved section across browser sessions
  - QuestionRenderer for all 6 question types (likert_5, likert_10, single_select, multi_select, short_text, long_text)
  - ConditionalQuestion with CSS fade/slide based on ConditionalRule evaluation
  - Post-submit confirmation page with participation rate and 5-second auto-redirect

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSC page fetches all data server-side (survey, sections, questions, options, draft, status) then passes to client wizard component"
    - "Debounced autosave: useRef timeout cleared on each answers change, 500ms delay, performSave with serialized answers equality check to skip no-ops"
    - "Confirmation RSC + thin ConfirmationClient wrapper pattern for auto-redirect useEffect with server-fetched data"
    - "ConfirmationClient auto-redirect only when surveyStatus === 'open' — handles both fresh submission and deliberate View Submission navigation"
    - "ConditionalQuestion uses CSS max-h-0/max-h-96 + opacity-0/opacity-100 transition for fade-in/out without unmounting children"

key-files:
  created:
    - src/app/(employee)/dashboard/page.tsx
    - src/app/(employee)/surveys/[id]/page.tsx
    - src/app/(employee)/surveys/[id]/confirmation/page.tsx
    - src/app/(employee)/surveys/[id]/confirmation/ConfirmationClient.tsx
    - src/components/survey/SurveyWizard.tsx
    - src/components/survey/SurveyProgressBar.tsx
    - src/components/survey/QuestionRenderer.tsx
    - src/components/survey/ConditionalQuestion.tsx
  modified: []

key-decisions:
  - "ConfirmationClient auto-redirect gated on surveyStatus === 'open' — deliberate View Submission navigation preserves read-only view without redirect"
  - "ConditionalQuestion keeps children mounted at all times, uses CSS overflow-hidden + max-h transition to avoid input state loss on re-show"
  - "Dashboard fetches participation_tokens to surface already-submitted surveys not in open/scheduled query"
  - "performSave serializes answers to JSON string and compares with lastSavedAnswersRef — skips network call when answers haven't changed"

patterns-established:
  - "RSC data-fetching page + 'use client' wizard component split — server fetches all initial data, client handles interaction"
  - "useCallback-wrapped save function with useRef for debounce timeout — safe with React strict mode double-invocation"
  - "Autosave indicator: CSS opacity transition (idle → saving → saved → idle) for non-intrusive status display"

requirements-completed:
  - RESPONSE-01
  - RESPONSE-02
  - RESPONSE-03
  - RESPONSE-04
  - RESPONSE-05
  - RESPONSE-06
  - RESPONSE-07
  - RESPONSE-08
  - RESPONSE-09
  - RESPONSE-10

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 2 Plan 3: Employee Survey-Taking Experience Summary

**Role-filtered survey dashboard card grid, section wizard with 500ms debounced autosave and resume banner, conditional question fade transitions, anonymous submission, and participation-rate confirmation page**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-15T14:21:35Z
- **Completed:** 2026-03-15T14:25:00Z
- **Tasks:** 2 (+ 1 auto-approved checkpoint)
- **Files modified:** 8 created

## Accomplishments

- Employee dashboard replaces stub with role-filtered card grid — badges for OPEN, CLOSES IN Xd, COMPLETED, UPCOMING with correct CTAs
- SurveyWizard client component with debounced autosave, resume banner, section navigation, and full submit flow routing to confirmation
- QuestionRenderer covers all 6 question types; ConditionalQuestion uses CSS transitions to fade in/out without unmounting
- Post-submit ConfirmationClient computes participation rate server-side, auto-redirects after 5s for fresh submissions, stays put for View Submission navigation

## Task Commits

1. **Task 1: Employee dashboard card grid and survey entry RSC** - `b3af73a` (feat)
2. **Task 2: Survey wizard, progress bar, question renderer, conditional questions, and confirmation page** - `357e331` (feat)

## Files Created/Modified

- `src/app/(employee)/dashboard/page.tsx` - Role-filtered survey card grid RSC with status badges and CTAs
- `src/app/(employee)/surveys/[id]/page.tsx` - Survey entry RSC: fetches sections/questions/options, redirects submitted users, renders SurveyWizard
- `src/app/(employee)/surveys/[id]/confirmation/page.tsx` - RSC: participation rate computation, submission gate
- `src/app/(employee)/surveys/[id]/confirmation/ConfirmationClient.tsx` - Client: 5s auto-redirect (open surveys only), read-only view
- `src/components/survey/SurveyWizard.tsx` - Section wizard with autosave, resume banner, submit, save status indicator
- `src/components/survey/SurveyProgressBar.tsx` - Fill bar with section N of M label and percentage
- `src/components/survey/QuestionRenderer.tsx` - All 6 question type inputs (likert_5, likert_10, single_select, multi_select, short_text, long_text)
- `src/components/survey/ConditionalQuestion.tsx` - CSS fade/slide based on ConditionalRule operator evaluation

## Decisions Made

- `ConfirmationClient` auto-redirect gated on `surveyStatus === 'open'` — when a user navigates deliberately via "View Submission", the survey may be closed, and they should stay on the read-only page rather than being redirected.
- `ConditionalQuestion` keeps children mounted (uses `max-h-0 overflow-hidden` not conditional render) — avoids React re-mounting child inputs and losing their internal state when condition toggles rapidly.
- Dashboard executes a `participation_tokens` query for already-submitted surveys to surface "COMPLETED" cards even when the survey moves to `closed` status (no longer in `open/scheduled` filter).
- `performSave` serializes answers to JSON string and compares with `lastSavedAnswersRef` before making the network call — eliminates redundant autosave round-trips when autosave fires but nothing changed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Employee survey flow complete — employees can discover, take, resume, and submit surveys
- All server actions (saveDraft, submitResponse, getMyDraft, checkSubmissionStatus) integrated and tested via UI
- Plan 02-04 (manager/analytics views) can now build on top of the submission data model established here

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (b3af73a, 357e331) confirmed in git history.

---
*Phase: 02-survey-engine*
*Completed: 2026-03-15*
