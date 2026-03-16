---
phase: 08-response-and-role-fixes
plan: 02
subsystem: auth
tags: [roles, jwt, supabase, middleware, analytics, typescript]

# Dependency graph
requires:
  - phase: 06-critical-bug-fixes
    provides: ADMIN_ROLES export and 6-role AppRole — now being collapsed to 2-role model
  - phase: 03-analytics-and-dashboards
    provides: analytics.ts Server Actions whose role guards are being fixed
provides:
  - normalizeRole() utility that maps any raw JWT role string to 'employee' | 'admin'
  - 2-role AppRole type used by middleware and all analytics guards
  - BUG-04 fix — leadership/manager/hr_admin/survey_analyst users now pass admin guards
affects: [any future phase that adds role-gated Server Actions, middleware changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "normalizeRole(raw) call pattern for all role guards — never compare raw JWT string to AppRole directly"
    - "ADMIN_ROLES as readonly string[] (not AppRole[]) — holds raw JWT values, not normalized app roles"

key-files:
  created: []
  modified:
    - src/lib/constants/roles.ts
    - src/middleware.ts
    - src/lib/actions/analytics.ts

key-decisions:
  - "AppRole collapses to 'employee' | 'admin' — 6-role union removed; normalizeRole() is the bridge between raw JWT and AppRole"
  - "ADMIN_ROLES typed as readonly string[] not readonly AppRole[] — raw JWT values are not AppRole values before normalization"
  - "getManagerDashboardData guard changed to role !== 'admin' — employees do not call this action; the old ['admin','employee'] whitelist was a bug"
  - "no_role redirect removed from middleware — normalizeRole(undefined) safely returns 'employee', eliminating the error page for unassigned users"

patterns-established:
  - "All role guards use: const role = normalizeRole(user.app_metadata?.role as string | undefined); if (role !== 'admin') { ... }"

requirements-completed: [ANALYTICS-01, DASH-01, DASH-05]

# Metrics
duration: 8min
completed: 2026-03-16
---

# Phase 8 Plan 02: Role Normalization and BUG-04 Fix Summary

**2-role AppRole model (employee | admin) with normalizeRole() utility — all analytics guards now pass leadership, manager, hr_admin, and survey_analyst users**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T11:30:55Z
- **Completed:** 2026-03-16T11:38:00Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments
- Rewrote roles.ts: AppRole is now `'employee' | 'admin'` with exported `normalizeRole()` function that maps 5 raw JWT role strings to 'admin' and everything else to 'employee'
- Updated middleware.ts to use `normalizeRole()` in all 3 role-resolution blocks; removed the `no_role` error redirect (undefined roles now silently become 'employee')
- Fixed all 3 role guards in analytics.ts — `computeDerivedMetrics`, `getLeadershipDashboardData`, and `getManagerDashboardData` now accept any raw JWT role that normalizes to 'admin'
- Zero TypeScript compile errors after the refactor

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite roles.ts to 2-role model with normalizeRole** - `a0fa13a` (refactor)
2. **Task 2: Update middleware.ts to use normalizeRole** - `b1011d7` (refactor)
3. **Task 3: Update analytics.ts role guards to use normalizeRole** - `62359c9` (fix)
4. **Task 4: Full TypeScript compile check** - `fa01933` (chore)

## Files Created/Modified
- `src/lib/constants/roles.ts` - Rewritten: 2-role AppRole, ADMIN_ROLES as string[], normalizeRole() function, 2-entry ROLE_ROUTES
- `src/middleware.ts` - Updated: normalizeRole() replaces rawRole in ROLE_ROUTES pattern; AppRole import removed; no_role redirect removed
- `src/lib/actions/analytics.ts` - Updated: normalizeRole import added; 3 guard blocks use role !== 'admin' pattern

## Decisions Made
- AppRole collapses to `'employee' | 'admin'` — the 6-role union added in Phase 06 is removed. `normalizeRole()` is the single bridge between raw Supabase JWT strings and the app's role model.
- `ADMIN_ROLES` typed as `readonly string[]` not `readonly AppRole[]` — the array holds raw JWT values which are not AppRole values until normalized.
- `getManagerDashboardData` guard changed to `role !== 'admin'` — the previous `['admin', 'employee'].includes(role)` whitelist was a bug. Employees use `/dashboard`, not this Server Action. The correct check is admin-only.
- `no_role` redirect removed from middleware — with `normalizeRole(undefined) === 'employee'`, an authenticated user with no assigned role is safely routed to `/dashboard` instead of hitting an error page.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BUG-04 closed — all elevated-role users can now access admin Server Actions
- normalizeRole() is the canonical role-check pattern for any future gated Server Actions
- No blockers

---
*Phase: 08-response-and-role-fixes*
*Completed: 2026-03-16*
