---
phase: 03-analytics-and-dashboards
plan: 02
subsystem: analytics
tags: [typescript, server-actions, supabase, analytics, dashboard, privacy-threshold]

# Dependency graph
requires:
  - phase: 03-01
    provides: compute_derived_metrics RPC, recharts, nuqs installed
  - phase: 01-foundation
    provides: supabaseAdmin, createSupabaseServerClient, database schema (derived_metrics, qualitative_themes, participation_tokens, v_participation_rates, v_public_actions, get_dimension_scores_for_survey)

provides:
  - All TypeScript interfaces for analytics data shapes (src/lib/types/analytics.ts)
  - Four Server Actions for analytics data fetching and metric computation (src/lib/actions/analytics.ts)
  - Wave 0 test stubs for all analytics action behaviors (src/lib/actions/analytics.test.ts)

affects:
  - 03-03 (leadership dashboard imports getLeadershipDashboardData, DimensionScore, HeatmapRow, TrendPoint, OrgKpis)
  - 03-04 (manager dashboard imports getManagerDashboardData; public /results page imports getPublicResultsData)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "'use server' + import 'server-only' at top of Server Action files"
    - "const db = supabaseAdmin as any for privileged DB calls (avoids type errors until supabase gen types re-run)"
    - "(supabase as any).rpc() for RPC calls on typed client where function not yet in generated types"
    - "{ success: true; data: T } | { success: false; error: string } return type on all Server Actions"
    - "getUser() via createSupabaseServerClient() for identity (not getSession())"
    - "Privacy threshold enforcement in data layer: respondent_count < 5 → null scores + belowThreshold=true"

key-files:
  created:
    - src/lib/types/analytics.ts
    - src/lib/actions/analytics.ts
    - src/lib/actions/analytics.test.ts
  modified: []

key-decisions:
  - "Cast supabase as any for RPC calls: get_dimension_scores_for_survey not in generated Database types stub; casting avoids TS2345 errors without losing safety on the surrounding code"
  - "Managers see org-wide scores as proxy: team-level segment_type in derived_metrics requires future work; when team meets threshold managers see company-wide results with a belowThreshold=false flag"
  - "v_public_actions queried with .or(survey_id.eq.X,survey_id.is.null): action items may have no survey FK (created independently); this ensures all public actions are returned, not just survey-linked ones"
  - "participationRate computed as (totalResponses / active profiles count) * 100: v_participation_rates gives token_count per department; profiles WHERE is_active=true gives eligible denominator"

# Metrics
duration: 3min
completed: 2026-03-15
---

# Phase 3 Plan 02: Analytics TypeScript Types + Server Actions Summary

**Typed analytics contracts (11 interfaces) and four Server Actions implementing privacy-threshold-enforced data fetching from Postgres views, RPC, and base tables using the supabaseAdmin-as-any pattern**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-15T15:29:43Z
- **Completed:** 2026-03-15T15:32:57Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src/lib/types/analytics.ts` with all 11 TypeScript interfaces: `DashboardFilters`, `DimensionScore`, `OrgKpis`, `HeatmapRow`, `TrendPoint`, `ParticipationBreakdown`, `QualitativeTheme`, `PublicAction`, `LeadershipDashboardData` (with `publicActions` field), `ManagerDashboardData`, `PublicResultsData`
- Implemented `computeDerivedMetrics` Server Action calling the `compute_derived_metrics` RPC via `supabaseAdmin as any`, gated to admin/leadership/survey_analyst roles
- Implemented `getLeadershipDashboardData` fetching KPIs, dimension scores (via `get_dimension_scores_for_survey` RPC), department heatmap (from `derived_metrics WHERE segment_type='department'`), trend data (last 5 closed surveys), participation breakdown (from `v_participation_rates`), qualitative themes, public action items (from `v_public_actions`), and available surveys for the selector dropdown
- Implemented `getManagerDashboardData` with team lookup via `profiles → teams → participation_tokens` cross-reference, hard privacy gate returning `dimensionScores=null` when `participationCount < 5`
- Implemented `getPublicResultsData` returning company-wide aggregates only with `hasData=false` guard for no-data state
- Created Wave 0 test stubs with all describe blocks and `test.todo` entries
- `npx tsc --noEmit` passes cleanly

## Task Commits

1. **Task 1: Analytics TypeScript type contracts** - `26f476f` (feat)
2. **Task 2: Analytics Server Actions + test stubs** - `cf0de82` (feat)

## Files Created/Modified

- `src/lib/types/analytics.ts` — 11 exported interfaces for analytics data shapes; 122 lines
- `src/lib/actions/analytics.ts` — Four Server Actions with privacy enforcement; 740 lines
- `src/lib/actions/analytics.test.ts` — Wave 0 test stubs for all 4 action behaviors; 20 lines

## Decisions Made

- **supabase as any for RPC**: The `get_dimension_scores_for_survey` function is not in the generated `Database` type stub. Casting `supabase as any` for RPC calls (same as the existing `supabaseAdmin as any` pattern) avoids TypeScript errors without removing type safety on surrounding code.
- **Manager org-wide proxy**: The `derived_metrics` table stores `segment_type='overall'` as company-wide. There is no team-level segment row yet — that requires a future enhancement to `compute_derived_metrics`. Managers who meet the threshold (≥5 team respondents) see org-wide dimension scores as a proxy.
- **v_public_actions or-null query**: Action items may exist without a `survey_id` FK (created independently by leadership). The query uses `.or('survey_id.eq.X,survey_id.is.null')` so standalone public actions also appear in dashboards.
- **Participation rate denominator**: Uses `profiles WHERE is_active=true` count as the eligible population denominator — same as what leadership would use to assess engagement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] supabase.rpc() TypeScript error on typed client**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** `supabase.rpc('get_dimension_scores_for_survey', ...)` fails TS2345 because the Database type stub's `Functions` type is empty — the RPC is not yet in generated types
- **Fix:** Cast `supabase as any` for the three RPC call sites only (consistent with the `supabaseAdmin as any` pattern already established in the codebase). Added `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments.
- **Files modified:** src/lib/actions/analytics.ts
- **Committed in:** cf0de82 (Task 2 commit)

## Self-Check: PASSED

- `src/lib/types/analytics.ts` — FOUND
- `src/lib/actions/analytics.ts` — FOUND
- `src/lib/actions/analytics.test.ts` — FOUND
- Commit `26f476f` — FOUND
- Commit `cf0de82` — FOUND
- `npx tsc --noEmit` — PASS (no errors)

## Next Phase Readiness

- All analytics types available for import by 03-03 (leadership dashboard UI) and 03-04 (manager + public results)
- `computeDerivedMetrics` action ready for the "Compute Results" button in `SurveyStatusBanner` (03-03 task)
- `getLeadershipDashboardData` ready for the leadership dashboard RSC — returns full `LeadershipDashboardData` including `publicActions`
- `getManagerDashboardData` and `getPublicResultsData` ready for 03-04
- No blockers for 03-03

---
*Phase: 03-analytics-and-dashboards*
*Completed: 2026-03-15*
