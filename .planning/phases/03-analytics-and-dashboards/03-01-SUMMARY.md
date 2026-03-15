---
phase: 03-analytics-and-dashboards
plan: 01
subsystem: database
tags: [recharts, nuqs, postgres, plpgsql, analytics, derived-metrics, rpc]

# Dependency graph
requires:
  - phase: 02-survey-engine
    provides: response_answers with numeric_value, responses with department/role/tenure_band, question_dimension_map with weights, questions with type enum

provides:
  - compute_derived_metrics(UUID) stored procedure populating derived_metrics table
  - recharts ^2.15.4 installed as production dependency for chart components
  - nuqs ^2.8.9 installed as production dependency for URL filter state

affects:
  - 03-02 (data-fetching Server Actions call compute_derived_metrics RPC via supabaseAdmin)
  - 03-03 (leadership dashboard charts use recharts; filter state uses nuqs)
  - 03-04 (manager dashboard and public /results page use same recharts/nuqs)

# Tech tracking
tech-stack:
  added:
    - recharts@2.15.4 (pinned to v2.x — v3 has breaking API changes)
    - nuqs@2.8.9 (Next.js 15 App Router URL search param state)
  patterns:
    - compute_derived_metrics follows DELETE-then-INSERT idempotency pattern — safe to call multiple times
    - SECURITY DEFINER + REVOKE from PUBLIC/authenticated + GRANT to service_role for admin-only RPCs
    - Scale-aware scoring: likert_5 thresholds (>=4/=3/<=2), likert_10 thresholds (>=7/5-6/<=4) handled in FILTER clauses
    - Weight-adjusted mean: SUM(value * weight) / NULLIF(SUM(weight), 0) per dimension

key-files:
  created:
    - supabase/migrations/20260315000006_compute_derived_metrics.sql
  modified:
    - package.json (added recharts, nuqs to dependencies)
    - pnpm-lock.yaml

key-decisions:
  - "Used pnpm add instead of npm install — project uses pnpm (pnpm-lock.yaml present); npm fails with ERESOLVE peer conflict for nuqs"
  - "Pinned recharts to ^2.x (installed 2.15.4) — plan explicitly requires v2.x; v3 shipped breaking API changes that would break Phase 3 chart components"
  - "Used response_answers.numeric_value (NUMERIC column) not answer_value — plan interfaces block had incorrect column name; actual schema uses numeric_value"
  - "Added REVOKE from PUBLIC and authenticated before GRANT to service_role — belt-and-suspenders to ensure no authenticated users can call the privileged RPC directly"
  - "Migration not applied locally — Docker daemon not running; developer must run supabase db push after starting Docker + supabase start"

patterns-established:
  - "Admin RPC permissions: REVOKE from PUBLIC, REVOKE from authenticated, GRANT to service_role only"
  - "Idempotent analytics computation: DELETE WHERE survey_id, then bulk INSERT"
  - "Scale-aware likert scoring via FILTER (WHERE q.type = ... AND ra.numeric_value ...) in aggregates"

requirements-completed:
  - ANALYTICS-01
  - ANALYTICS-02
  - ANALYTICS-03
  - ANALYTICS-05
  - ANALYTICS-06
  - ANALYTICS-07
  - ANALYTICS-08

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 3 Plan 01: Compute Derived Metrics RPC + Chart Dependencies Summary

**Postgres stored procedure `compute_derived_metrics(UUID)` with weight-adjusted scoring across 4 segment types (overall/department/role/tenure_band) for likert_5/likert_10 scales, plus recharts@2.15.4 and nuqs@2.8.9 installed**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T15:21:31Z
- **Completed:** 2026-03-15T15:26:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `compute_derived_metrics` SECURITY DEFINER stored procedure that populates `derived_metrics` in four passes (overall, department, role, tenure_band), idempotent via DELETE-first, returning inserted row count
- Installed recharts@2.15.4 (pinned v2.x per plan requirement) and nuqs@2.8.9 as production dependencies using pnpm
- Migration accounts for scale differences: likert_5 (1–5 scale, favorable>=4) vs likert_10 (1–10 scale, favorable>=7), with all thresholds encoded in a single SQL FILTER expression

## Task Commits

1. **Task 1: Install recharts and nuqs** - `caa201e` (chore)
2. **Task 2: Create compute_derived_metrics RPC migration** - `4a3f1eb` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `supabase/migrations/20260315000006_compute_derived_metrics.sql` - PLPGSQL stored procedure populating derived_metrics; 270 lines; handles all 4 segment types with weight-adjusted scoring
- `package.json` - Added recharts@^2.15.4 and nuqs@^2.8.9 to dependencies
- `pnpm-lock.yaml` - Updated lockfile for new dependencies

## Decisions Made

- **pnpm over npm**: Project has `pnpm-lock.yaml` — using npm fails with ERESOLVE peer conflict on nuqs's `@remix-run/react` optional peer. pnpm resolves cleanly.
- **recharts pinned to ^2**: v3 has breaking component API changes; plan explicitly requires ^2.x for Phase 3 chart components.
- **numeric_value column**: The `response_answers` table uses `numeric_value NUMERIC(5,2)` (not `answer_value TEXT` as stated in the plan's interfaces block). The actual schema was confirmed before writing the migration.
- **REVOKE before GRANT**: Added explicit `REVOKE EXECUTE FROM PUBLIC` and `REVOKE EXECUTE FROM authenticated` before the `GRANT TO service_role` to close any default PUBLIC execute permissions that may have been set.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used pnpm instead of npm for dependency installation**
- **Found during:** Task 1 (Install recharts and nuqs)
- **Issue:** `npm install recharts nuqs` failed with ERESOLVE peer conflict — nuqs has `@remix-run/react` as peerOptional which pulls in `react-dom@^18`, conflicting with the project's `react-dom@19`. The project uses pnpm (pnpm-lock.yaml present), not npm.
- **Fix:** Used `pnpm add recharts nuqs` which resolved cleanly without peer conflicts
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** Both packages appear in package.json dependencies; recharts loads via `node -e "require('recharts')"`
- **Committed in:** caa201e (Task 1 commit)

**2. [Rule 1 - Bug] Corrected response_answers column name from answer_value to numeric_value**
- **Found during:** Task 2 (Create compute_derived_metrics RPC migration)
- **Issue:** The plan's `<interfaces>` block documented `response_answers.answer_value TEXT` but the actual schema at `20260315000001_schema.sql` line 341 defines `numeric_value NUMERIC(5,2)` and `text_value TEXT`. Using `answer_value` would cause a SQL column-not-found error at runtime.
- **Fix:** Used `ra.numeric_value` directly in all aggregation expressions — no cast required since it's already NUMERIC type
- **Files modified:** supabase/migrations/20260315000006_compute_derived_metrics.sql
- **Verification:** Grep confirms `numeric_value` used throughout migration; matches schema definition
- **Committed in:** 4a3f1eb (Task 2 commit)

**3. [Rule 1 - Bug] Downgraded recharts from 3.8.0 to 2.x after initial install**
- **Found during:** Task 1 (Install recharts and nuqs)
- **Issue:** `pnpm add recharts nuqs` installed recharts@3.8.0 (latest) — plan requires ^2.x because v3 has breaking API changes that would break Phase 3 chart components
- **Fix:** Immediately ran `pnpm add "recharts@^2"` to pin to v2 (installed 2.15.4)
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** package.json shows `"recharts": "^2.15.4"`
- **Committed in:** caa201e (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All fixes essential — wrong package manager blocked install, wrong column name would fail at DB runtime, wrong recharts version would break Phase 3 chart components. No scope creep.

## Issues Encountered

- **Migration not applied locally**: `supabase db push` failed with "Cannot connect to the Docker daemon" — Docker is not running. The migration file is correctly written and will be applied when the developer starts Docker and runs `supabase start && supabase db push` (or `supabase db reset`).

## User Setup Required

None - no external service configuration required beyond standard Supabase local dev (Docker + `supabase start`).

## Next Phase Readiness

- recharts and nuqs available for all Phase 3 dashboard and filter components
- `compute_derived_metrics` RPC ready for `supabaseAdmin.rpc()` calls from 03-02 Server Actions
- Migration will be applied automatically when `supabase db push` runs with Docker active
- No blockers for 03-02 (TypeScript types + Server Actions)

---
*Phase: 03-analytics-and-dashboards*
*Completed: 2026-03-15*
