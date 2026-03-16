---
phase: 05-brand-redesign
plan: "05"
subsystem: ui
tags: [tailwind, design-tokens, next.js, pages, layout]

requires:
  - phase: 05-brand-redesign
    provides: plan 01 (globals.css tokens, tailwind config, TopNav, layouts), plan 02 (admin components), plan 03 (survey components), plan 04 (analytics components)
provides:
  - All 16 page files restyled with spec layout tokens (max-w-6xl/max-w-3xl, p-8, bg-bg, token headings)
  - Auth pages provide standalone min-h-screen bg-bg centering with logo mark
  - Results and public survey pages provide standalone min-h-screen bg-bg
  - Zero ad-hoc bg-gray-50 / text-gray-900 / text-gray-500 remaining in restyled pages
affects:
  - Visual QA checkpoint — complete Phase 5 brand redesign visual verification

tech-stack:
  added: []
  patterns:
    - "Admin pages omit min-h-screen bg-bg (provided by (admin)/layout.tsx main); use max-w-6xl mx-auto p-8 only"
    - "Standalone pages (auth, results, public survey) provide their own min-h-screen bg-bg outer shell"
    - "Auth card: bg-surface border border-border rounded-lg shadow-md p-8 w-full max-w-sm with indigo logo mark"
    - "Employee survey cards: bg-surface border border-border rounded-lg shadow-sm p-5 hover:border-indigo-300 hover:shadow-md"
    - "Status badges use spec semantic colors: success-muted/success-text for Open/Completed, warning-muted/warning-text for In Progress"

key-files:
  created: []
  modified:
    - src/app/(admin)/admin/page.tsx
    - src/app/(admin)/admin/surveys/page.tsx
    - src/app/(admin)/admin/surveys/[id]/page.tsx
    - src/app/(admin)/admin/surveys/[id]/tags/page.tsx
    - src/app/(admin)/admin/surveys/new/page.tsx
    - src/app/(admin)/admin/actions/page.tsx
    - src/app/(admin)/admin/actions/[id]/page.tsx
    - src/app/(admin)/admin/settings/page.tsx
    - src/app/(employee)/dashboard/page.tsx
    - src/app/(employee)/surveys/[id]/page.tsx
    - src/app/(employee)/surveys/[id]/confirmation/ConfirmationClient.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/magic-link/page.tsx
    - src/app/results/page.tsx
    - src/app/survey/public/[id]/page.tsx
    - src/app/survey/public/[id]/confirmation/page.tsx

key-decisions:
  - "Employee confirmation card renders in ConfirmationClient.tsx (client component), not confirmation/page.tsx RSC — restyled ConfirmationClient directly"
  - "Actions page priority/status badge mapping updated to spec semantic tokens (error/warning/success/brand-muted) instead of ad-hoc Tailwind palette classes"
  - "Survey builder page ([id]/page.tsx) uses no outer max-w wrapper — its split sidebar+content layout fills full viewport height"
  - "Employee dashboard grid changed from 3-col responsive to single-col grid-cols-1 per spec (max-w-3xl + single column for focus)"

patterns-established:
  - "All 16 page shells now use spec layout; Phase 5 brand redesign complete across all 30 files"

requirements-completed:
  - BRAND-06
  - BRAND-07

duration: 7min
completed: 2026-03-16
---

# Phase 5 Plan 05: Page Shell Restyling Summary

**16 page files restyled with spec token-based layouts — max-w-6xl/max-w-3xl wrappers, standalone bg-bg on auth/results/public routes, Inter headings, spec card and badge classes throughout**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-16T07:46:55Z
- **Completed:** 2026-03-16T07:53:xx
- **Tasks:** 2 of 3 (checkpoint after Task 2 — awaiting visual verification before Task 3)
- **Files modified:** 16 (+ 1 ConfirmationClient)

## Accomplishments
- All 8 admin pages use `max-w-6xl mx-auto p-8` outer wrapper with token headings (text-2xl font-extrabold tracking-snug text-fg); removed all min-h-screen bg-gray-50
- Admin landing nav cards updated to spec interactive card classes (bg-surface border border-border hover:border-indigo-300)
- Actions page: spec badge token colors (error/warning/success/brand-muted), table wrapped in bg-surface border border-border rounded-lg shadow-sm
- Employee dashboard: max-w-3xl, single-column survey card grid with hover effects, token status badges
- Auth pages (login + magic-link): standalone min-h-screen bg-bg centering, indigo gradient logo mark, spec inputs and Primary button
- Results page: standalone min-h-screen bg-bg with max-w-6xl, token section cards, tabular-nums on KPI scores
- Public survey + confirmation: min-h-screen bg-bg, token unavailable/already-submitted states, success-muted checkmark icons
- Zero ad-hoc `bg-gray-50`, `text-gray-900`, `text-gray-500`, `text-slate-500` remaining in restyled files
- Zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle 8 admin page files** - `a14c397` (feat)
2. **Task 2: Restyle employee, auth, results, and public survey pages** - `43ea476` (feat)

## Files Created/Modified
- `src/app/(admin)/admin/page.tsx` — nav card grid with token interactive card classes
- `src/app/(admin)/admin/surveys/page.tsx` — removed bg-gray-50 wrapper, max-w-6xl delegates to SurveyList
- `src/app/(admin)/admin/surveys/[id]/page.tsx` — token breadcrumb, section heading, no full-page wrapper
- `src/app/(admin)/admin/surveys/[id]/tags/page.tsx` — max-w-6xl, token breadcrumb, spec empty state
- `src/app/(admin)/admin/surveys/new/page.tsx` — spec inputs, Primary/Secondary buttons, error token classes
- `src/app/(admin)/admin/actions/page.tsx` — spec badge colors, table in bg-surface border card, filter tabs
- `src/app/(admin)/admin/actions/[id]/page.tsx` — max-w-6xl, token breadcrumb and headings
- `src/app/(admin)/admin/settings/page.tsx` — token heading, removed min-h-screen bg-gray-50
- `src/app/(employee)/dashboard/page.tsx` — max-w-3xl, single-col grid, token badges and CTA buttons
- `src/app/(employee)/surveys/[id]/page.tsx` — max-w-3xl, token back link and error states
- `src/app/(employee)/surveys/[id]/confirmation/ConfirmationClient.tsx` — success-muted icon, brand-muted participation rate
- `src/app/(auth)/login/page.tsx` — standalone bg-bg, logo mark, spec inputs and buttons
- `src/app/(auth)/magic-link/page.tsx` — standalone bg-bg, logo mark, spec inputs and success state
- `src/app/results/page.tsx` — standalone bg-bg, max-w-6xl, token section cards and KPI display
- `src/app/survey/public/[id]/page.tsx` — min-h-screen bg-bg, token unavailable/already-submitted cards
- `src/app/survey/public/[id]/confirmation/page.tsx` — min-h-screen bg-bg, success-muted confirmation card

## Decisions Made
- Employee confirmation card restyled in `ConfirmationClient.tsx` directly (it is the client component rendered by the RSC page, which only handles data fetching and delegation)
- Actions page priority/status badge colors updated to spec semantic tokens rather than keeping ad-hoc palette classes
- Survey builder page omits outer max-w wrapper — its sidebar+editor split layout fills full viewport height; breadcrumb and content use token classes throughout
- Employee dashboard grid changed to `grid-cols-1` (single column) per spec for max-w-3xl focused layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 30 files across Phase 5 brand redesign are now restyled (plans 01-05)
- Visual verification checkpoint pending — user must confirm brand colors, TopNav, Likert scale, auth card, analytics components all render correctly
- After checkpoint approval: final cleanup commit (Task 3) will be authorized

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Task 1 commit a14c397: FOUND
- Task 2 commit 43ea476: FOUND

---
*Phase: 05-brand-redesign*
*Completed: 2026-03-16*
