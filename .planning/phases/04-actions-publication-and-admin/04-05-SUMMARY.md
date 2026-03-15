---
phase: 04-actions-publication-and-admin
plan: 05
subsystem: ui
tags: [react, nextjs, publication, tagging, snapshots, qualitative-themes]

# Dependency graph
requires:
  - phase: 04-02
    provides: createPublicationSnapshot, getPublicationSnapshot, getPublishedCycles, getPublicResultsData(cycleId), getTaggableAnswers, upsertTag, deleteTag, generateThemes, updateTheme Server Actions
provides:
  - PublishResultsButton — client button showing Published badge or opening modal for closed surveys
  - PublishConfirmModal — client modal with snapshot preview counts and permanent-action warning
  - CycleSelector — client dropdown navigating /results?cycle= URL param with Published label
  - TaggingWorkspace — client tagging UI with tag input, autocomplete, removable pills, frequency sidebar, Generate Themes, theme label editing and is_positive toggle
  - /admin/surveys/[id]/tags RSC page — fetches taggable answers, renders count summary and TaggingWorkspace
  - /results RSC updated to read cycle searchParam server-side and render CycleSelector
  - Survey detail page updated to render PublishResultsButton and Tag Responses link for closed surveys
affects:
  - employees (public /results page browsing historical cycles)
  - survey analysts (tagging workspace)
  - leadership (publish workflow)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PublishResultsButton initialized with hasExistingSnapshot prop — avoids client-side fetch for initial published state
    - CycleSelector changes URL only (router.push) — RSC re-renders with new snapshot data server-side
    - TaggingWorkspace uses dynamic import for updateTheme to avoid circular module concerns
    - Results page reads cycle searchParam server-side via await searchParams — no 'use client' on page

key-files:
  created:
    - src/components/admin/PublishConfirmModal.tsx
    - src/components/admin/PublishResultsButton.tsx
    - src/components/results/CycleSelector.tsx
    - src/components/admin/TaggingWorkspace.tsx
    - src/app/(admin)/admin/surveys/[id]/tags/page.tsx
  modified:
    - src/app/(admin)/admin/surveys/[id]/page.tsx
    - src/app/results/page.tsx

key-decisions:
  - "PublishResultsButton renders nothing for non-closed surveys (surveyStatus !== 'closed') — button only appears in the correct lifecycle state"
  - "CycleSelector uses router.push with /results?cycle= URL param — RSC handles data loading, no client fetch needed"
  - "TaggingWorkspace uses window.location.reload() after generateThemes — simplest approach for v1 since theme list is a one-time post-generate view"
  - "Tag frequency computed with per-answer deduplication (Set) — one tag per response, not per raw occurrence"
  - "Snapshot preview counts (dimension scores, participation rate, action items, themes) fetched server-side on survey detail page — passed as props to avoid client fetch in modal"

patterns-established:
  - "Preview data passed as props from RSC to client buttons — no secondary client-side fetches for modal content"
  - "CycleSelector pattern: client changes URL, RSC re-renders — clean separation without client data fetching"

requirements-completed:
  - PUBLISH-01
  - PUBLISH-02
  - PUBLISH-03
  - PUBLISH-04
  - PUBLISH-05
  - ACTIONS-06
  - ADMIN-09
  - ANALYTICS-09
  - ANALYTICS-10

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 4 Plan 05: Publication UI, Cycle Selector, and Tagging Workspace Summary

**Publish Results button + modal with snapshot preview, /results cycle selector for historical snapshots, and qualitative tagging workspace with frequency sidebar and theme generation**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-15T21:15:15Z
- **Completed:** 2026-03-15T21:30:00Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 7

## Accomplishments
- Publication workflow: survey detail page shows Publish Results button for closed surveys; modal previews dimension score count, participation rate, action item count, theme count before confirming irreversible snapshot
- /results page reads cycle searchParam server-side and renders CycleSelector dropdown for browsing published historical snapshots; published cycles are labeled "(Published)"
- Tagging workspace at /admin/surveys/[id]/tags shows anonymized open-text responses with tag input (Enter key + button), autocomplete datalist, removable blue pills, top-tags frequency sidebar, and Generate Themes button that clusters tags by frequency; generated themes support editable labels and is_positive toggle

## Task Commits

1. **Task 1: Publication workflow — Publish button + modal on survey detail page** - `3e996d6` (feat)
2. **Task 2: /results cycle selector + qualitative tagging page** - `25c5c7a` (feat)
3. **Task 3: checkpoint:human-verify** — auto-approved (auto_advance: true)

## Files Created/Modified
- `src/components/admin/PublishConfirmModal.tsx` — 'use client' modal with preview counts, warning box, Publish/Cancel buttons
- `src/components/admin/PublishResultsButton.tsx` — 'use client' button with Published badge state, opens modal
- `src/components/results/CycleSelector.tsx` — 'use client' select dropdown navigating ?cycle= URL param
- `src/components/admin/TaggingWorkspace.tsx` — 'use client' full tagging UI with frequency sidebar, tag CRUD, theme generation
- `src/app/(admin)/admin/surveys/[id]/tags/page.tsx` — RSC fetching taggable answers, passing to TaggingWorkspace
- `src/app/(admin)/admin/surveys/[id]/page.tsx` — added publication data fetch and PublishResultsButton + Tag Responses link
- `src/app/results/page.tsx` — added PageProps with searchParams, cycle param read server-side, CycleSelector at top

## Decisions Made
- PublishResultsButton renders nothing for non-closed surveys — no UI clutter for draft/open/scheduled surveys
- CycleSelector uses router.push URL-only navigation — RSC re-renders with fresh server data, no client fetch
- window.location.reload() after generateThemes for v1 simplicity — theme list is a post-generate view, not real-time
- Snapshot preview counts fetched server-side on detail page using supabaseAdmin — consistent with service-role-only analytics pattern
- Tag frequency per-answer deduplication using Set — counts how many responses have each tag, not raw tag occurrences

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in SettingsTabs.tsx (missing EmployeeImportTab and ParticipationMonitorTab) — out of scope, belong to plans 03/04, not introduced by this plan

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 Plan 05 complete — all publication, cycle selector, and tagging UI delivered
- All PUBLISH-01 through PUBLISH-05, ACTIONS-06, ADMIN-09, ANALYTICS-09, ANALYTICS-10 have UI coverage
- Remaining Phase 4 plans (settings admin, employee import tab, participation monitor) can proceed independently
