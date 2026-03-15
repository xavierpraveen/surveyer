---
phase: 03-analytics-and-dashboards
plan: 03
subsystem: ui
tags: [recharts, nuqs, react, tailwind, analytics, dashboard, typescript, server-actions]

# Dependency graph
requires:
  - phase: 03-02
    provides: getLeadershipDashboardData, computeDerivedMetrics Server Actions, all analytics TypeScript interfaces (DimensionScore, OrgKpis, HeatmapRow, TrendPoint, QualitativeTheme, PublicAction, LeadershipDashboardData)
  - phase: 03-01
    provides: recharts and nuqs installed

provides:
  - Full analytics component library in src/components/analytics/ (7 components)
  - Leadership dashboard full UI at /leadership/dashboard with all 7 sections
  - NuqsAdapter layout for (leadership) route group
  - SurveyStatusBanner Compute Results button for closed surveys

affects:
  - 03-04 (manager dashboard and public results page reuse DimensionBarChart, ThresholdPlaceholder, QualitativeThemePanel)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FilterBarWrapper pattern: RSC passes initial data to a 'use client' wrapper that holds state, child FilterBar calls Server Actions on nuqs param change"
    - "Default exports for all analytics components (not named exports)"
    - "ThresholdPlaceholder used consistently across all below-threshold UI surfaces"
    - "Recharts Tooltip content prop with custom component for full type safety"

key-files:
  created:
    - src/components/analytics/ThresholdPlaceholder.tsx
    - src/components/analytics/KpiStrip.tsx
    - src/components/analytics/QualitativeThemePanel.tsx
    - src/components/analytics/DepartmentHeatmap.tsx
    - src/components/analytics/DimensionBarChart.tsx
    - src/components/analytics/TrendLineChart.tsx
    - src/components/analytics/FilterBar.tsx
    - src/app/(leadership)/layout.tsx
    - src/app/(leadership)/leadership/dashboard/page.tsx
    - src/app/(leadership)/leadership/dashboard/FilterBarWrapper.tsx
  modified:
    - src/components/admin/SurveyStatusBanner.tsx
    - src/app/(manager)/manager/dashboard/page.tsx

key-decisions:
  - "FilterBarWrapper client component: RSC cannot hold mutable state, so initial data passes down to a client wrapper that manages useState; FilterBar calls the server action and passes updates to the wrapper via onFilterChange callback"
  - "DimensionBarChart uses custom Tooltip content component instead of formatter prop to avoid Recharts ValueType type conflict with number | null"
  - "Dashboard page sections (sections 1-6) rendered inside FilterBarWrapper so they reactively update when filters change without a full RSC re-render"
  - "NuqsAdapter added to (leadership) group layout.tsx since no layout existed; this scopes nuqs to the leadership routes only"

patterns-established:
  - "RSC initial fetch → FilterBarWrapper client state → FilterBar nuqs URL params + Server Action"
  - "Recharts custom tooltip via content prop for full TypeScript correctness"
  - "ThresholdPlaceholder: consistent 'use client' component used in both server and client components"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, ANALYTICS-08]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 3 Plan 03: Leadership Dashboard Full UI + SurveyStatusBanner Summary

**Seven Recharts + Tailwind analytics components, full leadership dashboard RSC with nuqs filter bar and 7 sections (KPIs, dimension bars, heatmap, trends, participation, themes, action items), and Compute Results button wired to computeDerivedMetrics Server Action**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-15T15:35:29Z
- **Completed:** 2026-03-15T15:41:15Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Created 7 analytics components: ThresholdPlaceholder (client, gray `---` tooltip), KpiStrip (server, 5 color-coded KPI cards), QualitativeThemePanel (server, two-column pill tags), DepartmentHeatmap (server, pure Tailwind green/yellow/red table), DimensionBarChart (client, Recharts horizontal bars), TrendLineChart (client, Recharts multi-line 12-color), FilterBar (client, nuqs URL state + useTransition + Server Action)
- Built full leadership dashboard page (`/leadership/dashboard`) as RSC: initial fetch → KpiStrip → FilterBarWrapper with 6 sections covering all data (dimension scores, heatmap, trends, participation, qualitative themes, action items read-only)
- Action Items section groups publicActions into In Progress / Planned / Blocked / Completed with count badges — read-only, no create/edit controls
- Added NuqsAdapter to new `(leadership)/layout.tsx` to enable nuqs URL state for FilterBar
- Updated SurveyStatusBanner: replaced `Survey closed` span with blue "Compute Results" button calling `computeDerivedMetrics`, shows success message with row count and calls `router.refresh()`

## Task Commits

1. **Task 1: Analytics shared components** - `b36fc4c` (feat)
2. **Task 2: Chart components, FilterBar, leadership dashboard, SurveyStatusBanner** - `9c3b663` (feat)

## Files Created/Modified

- `src/components/analytics/ThresholdPlaceholder.tsx` — 'use client', gray `---` with hover anonymity tooltip
- `src/components/analytics/KpiStrip.tsx` — 5 KPI cards, health score color-coded green/yellow/red
- `src/components/analytics/QualitativeThemePanel.tsx` — two-column issues/suggestions pill cloud
- `src/components/analytics/DepartmentHeatmap.tsx` — pure Tailwind table, belowThreshold shows ThresholdPlaceholder
- `src/components/analytics/DimensionBarChart.tsx` — Recharts horizontal bar, custom tooltip, threshold legend note
- `src/components/analytics/TrendLineChart.tsx` — Recharts line chart, 12 dimension colors, connectNulls=false
- `src/components/analytics/FilterBar.tsx` — nuqs useQueryState, useTransition, Server Action re-fetch, loading spinner
- `src/app/(leadership)/layout.tsx` — NuqsAdapter wrapper for (leadership) route group
- `src/app/(leadership)/leadership/dashboard/page.tsx` — RSC initial fetch, error/empty states, KpiStrip, FilterBarWrapper
- `src/app/(leadership)/leadership/dashboard/FilterBarWrapper.tsx` — client wrapper managing data state for all 6 sections
- `src/components/admin/SurveyStatusBanner.tsx` — added computing/computeResult state, handleComputeMetrics, Compute Results blue button
- `src/app/(manager)/manager/dashboard/page.tsx` — fixed named → default imports (Rule 1)

## Decisions Made

- **FilterBarWrapper pattern**: RSC cannot hold mutable state so initial data is passed to a client wrapper. The wrapper uses `useState` to store current data and passes `onFilterChange` to FilterBar. When nuqs params change, FilterBar calls the server action and passes the result up. This keeps the RSC thin while making filtered data reactive.
- **Dashboard sections inside FilterBarWrapper**: Moving all 6 data sections into FilterBarWrapper means they re-render reactively when filter data updates, without needing a full RSC re-render cycle.
- **Custom Tooltip content component in DimensionBarChart**: The Recharts `formatter` prop signature uses `ValueType` (string | number) which is not compatible with `number | null`. Using `content={<CustomTooltip />}` gives full type control.
- **NuqsAdapter in group layout**: No `(leadership)/layout.tsx` existed; created a minimal one wrapping children with NuqsAdapter so nuqs URL state works across all leadership routes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Manager dashboard page used named imports for default-export components**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** `src/app/(manager)/manager/dashboard/page.tsx` imported `{ ThresholdPlaceholder }` and `{ DimensionBarChart }` as named exports; both components export default
- **Fix:** Changed to `import ThresholdPlaceholder from '...'` and `import DimensionBarChart from '...'`
- **Files modified:** src/app/(manager)/manager/dashboard/page.tsx
- **Verification:** `npx tsc --noEmit` — no errors
- **Committed in:** b36fc4c (Task 1 commit)

**2. [Rule 1 - Bug] TrendLineChart Tooltip formatter type incompatibility**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** `formatter={(value: number | null) => ...}` fails because Recharts `Formatter<ValueType>` uses `ValueType = string | number`, not `number | null`
- **Fix:** Changed to `formatter={(value) => typeof value === 'number' ? value.toFixed(1) : 'N/A'}` — type narrowing instead of annotation
- **Files modified:** src/components/analytics/TrendLineChart.tsx
- **Verification:** `npx tsc --noEmit` — no errors
- **Committed in:** 9c3b663 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 - Bugs)
**Impact on plan:** Both bugs were pre-existing in stub files created by 03-04 plan. No scope creep.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Self-Check

- `src/components/analytics/ThresholdPlaceholder.tsx` — FOUND
- `src/components/analytics/KpiStrip.tsx` — FOUND
- `src/components/analytics/QualitativeThemePanel.tsx` — FOUND
- `src/components/analytics/DepartmentHeatmap.tsx` — FOUND
- `src/components/analytics/DimensionBarChart.tsx` — FOUND
- `src/components/analytics/TrendLineChart.tsx` — FOUND
- `src/components/analytics/FilterBar.tsx` — FOUND
- `src/app/(leadership)/layout.tsx` — FOUND
- `src/app/(leadership)/leadership/dashboard/page.tsx` — FOUND
- `src/app/(leadership)/leadership/dashboard/FilterBarWrapper.tsx` — FOUND
- `src/components/admin/SurveyStatusBanner.tsx` — FOUND
- Commit `b36fc4c` — FOUND
- Commit `9c3b663` — FOUND
- `npx tsc --noEmit` — PASS (exit 0)

## Self-Check: PASSED

## Next Phase Readiness

- DimensionBarChart, ThresholdPlaceholder, QualitativeThemePanel are ready to import in 03-04 (public /results page and manager dashboard — already wired up in previously committed stubs)
- Leadership dashboard at /leadership/dashboard renders all 7 sections from pre-computed Postgres aggregates
- FilterBar persists filter state in URL via nuqs; changing filters re-fetches via Server Action without full page reload
- SurveyStatusBanner Compute Results closes the admin workflow loop: closed → compute → results available in dashboard

---
*Phase: 03-analytics-and-dashboards*
*Completed: 2026-03-15*
