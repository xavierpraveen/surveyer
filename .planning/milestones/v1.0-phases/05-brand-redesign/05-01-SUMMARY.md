---
phase: 05-brand-redesign
plan: "01"
subsystem: ui
tags: [tailwind, css-custom-properties, inter, next-font, design-tokens, layout]

# Dependency graph
requires: []
provides:
  - 21 semantic CSS custom properties in globals.css (brand, surface, fg, border, success, warning, error)
  - Full Tailwind token mapping via var(--color-*) references
  - Inter typeface via next/font/google with --font-inter variable
  - TopNav RSC component with logo gradient, wordmark, nav links, and user initials avatar
  - (admin)/layout.tsx wrapping all admin pages with TopNav
  - (employee)/layout.tsx wrapping all employee pages with TopNav
affects:
  - 05-02-admin-components
  - 05-03-survey-components
  - 05-04-analytics-components
  - 05-05-page-restyling

# Tech tracking
tech-stack:
  added:
    - next/font/google (Inter with variable --font-inter)
  patterns:
    - CSS custom property token system — all colors live in :root, Tailwind maps via var(--color-*)
    - Design token Tailwind classes — bg-brand, text-fg-muted, border-border all valid project-wide
    - TopNav as async RSC — fetches user server-side, no client hydration needed

key-files:
  created:
    - src/components/layout/TopNav.tsx
    - src/app/(admin)/layout.tsx
    - src/app/(employee)/layout.tsx
  modified:
    - src/app/globals.css
    - tailwind.config.ts
    - src/app/layout.tsx

key-decisions:
  - "Inter loaded exclusively via next/font/google — no @import in globals.css to avoid FOUC and hydration mismatch"
  - "TopNav added only to (admin) and (employee) route groups — (auth), (leadership), (manager), survey/public/, results/ intentionally excluded"
  - "borderRadius DEFAULT = 6px overrides bare rounded class only — rounded-md (6px) for interactive, rounded-lg (8px) for cards remains Tailwind default"
  - "boxShadow.sm and boxShadow.md override Tailwind built-in shadows intentionally — project shadows are softer than defaults"

patterns-established:
  - "Token class usage: always use semantic token classes (bg-brand, text-fg-muted) not raw Tailwind palette classes (bg-indigo-500) for branded UI"
  - "Opacity modifier note: hover:border-brand/40 does NOT work — CSS var tokens cannot be decomposed to RGB for opacity; use concrete Tailwind palette classes (indigo-300) when opacity modifier needed"
  - "TopNav layout pattern: route group layout.tsx wraps children with <TopNav /> + <main className='min-h-screen bg-bg'>"

requirements-completed:
  - BRAND-01
  - BRAND-02

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 5 Plan 01: Design System Foundation Summary

**21-token CSS custom property system, full Tailwind mapping via var(--color-*), Inter typeface, and TopNav RSC on admin and employee route groups**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T06:30:33Z
- **Completed:** 2026-03-16T06:38:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Established complete color token system: 21 CSS custom properties under :root covering brand, surface, text, border, success, warning, and error semantic groups
- Wired all 21 tokens into Tailwind via var(--color-*) plus font, borderRadius, letterSpacing, boxShadow, and ringColor extensions — bg-brand, text-fg-muted, border-border now valid everywhere
- Added Inter via next/font/google with variable --font-inter applied to html and antialiased body
- Built TopNav as async RSC: indigo→violet gradient logomark, "Surveyer" wordmark, Admin/Dashboard nav links, user initials avatar from Supabase session
- Created (admin)/layout.tsx and (employee)/layout.tsx route group layouts that wrap all pages in both groups with TopNav + main container

## Task Commits

Each task was committed atomically:

1. **Task 1: Design token infrastructure** - `2475c29` (feat)
2. **Task 2: TopNav component + route group layouts** - `6e83df7` (feat)

## Files Created/Modified
- `src/app/globals.css` - 21 CSS custom properties under :root + reduced-motion media query
- `tailwind.config.ts` - Full design token Tailwind mapping (colors, fontFamily, borderRadius, letterSpacing, boxShadow, ringColor)
- `src/app/layout.tsx` - Inter loaded via next/font/google; inter.variable on html; antialiased on body
- `src/components/layout/TopNav.tsx` - Async RSC: logo gradient, wordmark, nav links, user initials avatar using token classes
- `src/app/(admin)/layout.tsx` - Route group layout with TopNav wrapping all admin pages
- `src/app/(employee)/layout.tsx` - Route group layout with TopNav wrapping all employee pages

## Decisions Made
- Inter loaded exclusively via next/font/google — no @import in globals.css to avoid FOUC and hydration mismatch
- TopNav added only to (admin) and (employee) route groups — (auth), (leadership), (manager), survey/public/, results/ intentionally excluded per spec
- borderRadius DEFAULT = 6px affects bare rounded class only; rounded-md (6px) for interactive, rounded-lg (8px) for cards remains Tailwind default
- boxShadow.sm and boxShadow.md intentionally override Tailwind built-in shadows — project shadows are softer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All design token Tailwind classes (bg-brand, text-fg-muted, border-border, etc.) are valid project-wide — downstream plans can use them immediately
- TopNav appears on all /admin/* and /dashboard, /surveys/* (employee) pages
- Plans 05-02 through 05-05 can now restyle components using the token system

---
*Phase: 05-brand-redesign*
*Completed: 2026-03-16*

## Self-Check: PASSED

- FOUND: src/app/globals.css
- FOUND: tailwind.config.ts
- FOUND: src/app/layout.tsx
- FOUND: src/components/layout/TopNav.tsx
- FOUND: src/app/(admin)/layout.tsx
- FOUND: src/app/(employee)/layout.tsx
- FOUND commit: 2475c29 (Task 1)
- FOUND commit: 6e83df7 (Task 2)
