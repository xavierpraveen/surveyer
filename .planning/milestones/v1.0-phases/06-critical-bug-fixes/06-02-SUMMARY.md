---
phase: 06-critical-bug-fixes
plan: 02
subsystem: auth
tags: [middleware, roles, routing, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: AppRole type and ROLE_ROUTES constant in roles.ts; middleware.ts auth flow
provides:
  - AppRole union with all 6 assignable roles (employee, manager, leadership, admin, hr_admin, survey_analyst)
  - ROLE_ROUTES Record<AppRole, string> mapping all 6 roles explicitly
  - ADMIN_ROLES readonly array for elevated-role guards
  - Middleware using ROLE_ROUTES-driven normalization (no hardcoded 'admin' fallback)
affects: [auth, middleware, role-based-routing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ROLE_ROUTES-driven normalization: `role in ROLE_ROUTES ? role : 'employee'` replaces hardcoded ternaries"
    - "v1 consolidation documented inline: all elevated roles explicitly map to /admin with JSDoc and inline comments"
    - "ADMIN_ROLES export: named set of elevated roles available for route guards and future permission checks"

key-files:
  created: []
  modified:
    - src/lib/constants/roles.ts
    - src/middleware.ts

key-decisions:
  - "AppRole union expanded to all 6 v1 roles: employee, manager, leadership, admin, hr_admin, survey_analyst — AUTH-07 assigns all 6, AUTH-06 routes all 6"
  - "ROLE_ROUTES-driven normalization replaces hardcoded ternary — middleware no longer needs to know which roles map where; ROLE_ROUTES is the single source of truth"
  - "v1 consolidation documented inline with JSDoc on AppRole type and ROLE_ROUTES constant — future developers understand the scope decision without hunting for ADRs"
  - "ADMIN_ROLES named export added to roles.ts — provides a reusable set for route guards and permission checks without duplicating the mapping logic"

patterns-established:
  - "roles.ts as single source of truth: all role-to-route mappings live in ROLE_ROUTES; middleware imports and uses it rather than encoding mappings itself"
  - "v1 scope reduction documented at definition site: consolidation comments appear on the type, constant, and middleware rather than only in planning docs"

requirements-completed: [AUTH-06]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 06 Plan 02: Role Routes and AUTH-06 Closure Summary

**Expanded AppRole to all 6 v1 roles and rewired middleware to use ROLE_ROUTES as single source of truth, closing AUTH-06 with explicit v1 consolidation documentation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-16T10:47:27Z
- **Completed:** 2026-03-16T10:49:14Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `AppRole` union now includes all 6 assignable roles: employee, manager, leadership, admin, hr_admin, survey_analyst
- `ROLE_ROUTES` maps all 6 explicitly with inline v1 consolidation comment and JSDoc explaining the scope decision
- `ADMIN_ROLES` export added as a named set of elevated roles for future guards
- Middleware replaced 3 hardcoded `'employee' ? 'admin'` ternaries with `role in ROLE_ROUTES ? role : 'employee'` — ROLE_ROUTES is now the single source of truth
- AUTH-06 requirement can now be checked: middleware routes users to role-appropriate areas for all 6 v1 roles

## Task Commits

1. **Task 1: Expand AppRole and ROLE_ROUTES with v1 consolidation documentation** - `8fdb58f` (feat)
2. **Task 2: Update middleware normalization to use ROLE_ROUTES-driven logic** - `865a069` (feat)

## Files Created/Modified

- `src/lib/constants/roles.ts` - AppRole union with 6 roles; ROLE_ROUTES mapping all 6; ADMIN_ROLES export; JSDoc v1 consolidation rationale
- `src/middleware.ts` - Three normalization expressions rewritten to use `role in ROLE_ROUTES`; v1 consolidation comments added referencing roles.ts

## Decisions Made

- ROLE_ROUTES-driven normalization: `role in ROLE_ROUTES ? role : 'employee'` replaces hardcoded ternary — middleware delegates the mapping to roles.ts, making future role additions a single-file change
- v1 consolidation documented at definition site on both the type and the constant rather than only in planning docs — self-documenting code prevents future developers from treating the 2-role list as authoritative
- ADMIN_ROLES named export added for future route guard and permission check reuse

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The existing 3 TypeScript errors in the codebase (`section_id` on `SurveyQuestion`) are pre-existing from plan 06-01 (BUG-01) and unrelated to this plan's changes. No middleware-specific TypeScript errors exist.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- AUTH-06 is now satisfiable and can be checked off in REQUIREMENTS.md
- Any future role added to the system requires only a new entry in `APP_ROLES`, `ROLE_ROUTES`, and optionally `ADMIN_ROLES` — middleware requires no changes
- v2 role-specific dashboards (e.g. /manager/dashboard) are deferred and the deferral is documented inline

---
*Phase: 06-critical-bug-fixes*
*Completed: 2026-03-16*
