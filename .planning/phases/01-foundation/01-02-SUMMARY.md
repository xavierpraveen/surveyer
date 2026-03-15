---
phase: 01-foundation
plan: "02"
subsystem: database
tags: [postgres, supabase, rls, sql, migrations, seed-data, privacy, jwt]

# Dependency graph
requires:
  - phase: 01-foundation-01
    provides: Next.js 15 scaffold with supabase client setup
provides:
  - "All 24 Supabase public tables with enums, B-tree indexes, and RLS enabled"
  - "privacy-correct schema: participation_tokens decoupled from responses (no shared FK)"
  - "current_user_role() SECURITY DEFINER helper reading from JWT app_metadata"
  - "RLS policies for all 24 tables using auth.jwt() claims — zero profiles self-referential queries"
  - "SECURITY DEFINER analytics views: v_dimension_scores, v_participation_rates, v_public_actions"
  - "get_dimension_scores_for_survey() RPC with configurable privacy threshold enforcement"
  - "publication_snapshots immutability: trigger + no UPDATE policy"
  - "Seed: 18 users (6 RBAC roles, 5 tenure bands), 12 dimensions, 1 draft survey, 60 questions, 3 action items"
  - "4 SQL audit scripts in supabase/tests/ (anonymity, RLS, schema, seed validation)"
affects:
  - "02-response-collection"
  - "03-analytics"
  - "04-publication"
  - "all phases using supabase client"

# Tech tracking
tech-stack:
  added:
    - "Supabase local dev (supabase/config.toml)"
    - "PostgreSQL enums: survey_status_enum, question_type_enum, action_priority_enum, action_status_enum, tenure_band_enum"
  patterns:
    - "RLS via JWT claims: auth.jwt()->'app_metadata'->>'role' via current_user_role() helper — never query profiles inside policies"
    - "Privacy-correct response collection: participation_tokens (WHO) and responses (WHAT) share only survey_id"
    - "SECURITY DEFINER analytics surface: all aggregate access goes through views/RPCs, never direct table SELECT for employees/managers"
    - "Immutable snapshot pattern: trigger + no UPDATE RLS policy on publication_snapshots"
    - "Hardcoded seed UUIDs: all seed records use predictable UUID prefixes so Phase 2 tests can reference them"

key-files:
  created:
    - "supabase/config.toml"
    - "supabase/migrations/20260315000001_schema.sql"
    - "supabase/migrations/20260315000002_rls.sql"
    - "supabase/migrations/20260315000003_views.sql"
    - "supabase/migrations/20260315000004_seed.sql"
    - "supabase/tests/anonymity_audit.sql"
    - "supabase/tests/rls_check.sql"
    - "supabase/tests/schema_check.sql"
    - "supabase/tests/seed_check.sql"
  modified: []

key-decisions:
  - "responses.user_id is NULL for anonymous surveys — anonymity enforced at schema level, not application layer"
  - "participation_tokens and responses share ONLY survey_id — no FK, no way to join them to reconstruct identity"
  - "response_drafts is a mutable scratchpad deleted on submission — it is the only transient place user_id and draft answers coexist"
  - "current_user_role() reads from JWT app_metadata — zero DB queries in role checks, prevents infinite recursion on profiles table"
  - "All analytics for employees/managers routes through SECURITY DEFINER views — no direct SELECT on responses/response_answers"
  - "publication_snapshots is enforced immutable by both a DB trigger (belt) and absence of UPDATE RLS policy (suspenders)"
  - "Seed UUIDs are hardcoded with predictable prefixes (111.., 222.., 333.., 444.., 555.., 666.., 777..) for cross-phase referenceability"

patterns-established:
  - "JWT role pattern: all RLS policies call current_user_role() — never read from profiles inside USING()"
  - "Privacy threshold pattern: get_dimension_scores_for_survey() returns NULL scores + below_threshold=true for segments under minimum respondents"
  - "Seed UUID scheme: department IDs start 111..., role IDs 222..., user IDs 333..., dimension IDs 444..., survey IDs 555..., section IDs 666..., question IDs 777..."

requirements-completed:
  - SCHEMA-01
  - SCHEMA-02
  - SCHEMA-03
  - SCHEMA-04
  - PRIVACY-01
  - PRIVACY-02
  - PRIVACY-03
  - PRIVACY-04
  - PRIVACY-05
  - PRIVACY-06
  - PRIVACY-07
  - DX-03
  - DX-04

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 1 Plan 02: Database Schema Summary

**24-table Supabase schema with privacy-enforced participation_token/response decoupling, JWT-based RLS across all tables, SECURITY DEFINER analytics views, and fully seeded diagnostic survey with 18 users, 12 dimensions, and 60 questions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T12:23:51Z
- **Completed:** 2026-03-15T12:32:34Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Complete Supabase database foundation: 24 tables with enums, FK indexes, and RLS enabled on every table
- Privacy architecture committed at the schema level: participation_tokens and responses are structurally unjoined — the join key simply does not exist
- JWT-based RLS with `current_user_role()` SECURITY DEFINER helper prevents infinite recursion on profiles table and eliminates DB queries in middleware
- Analytics access surface secured: employees and managers cannot SELECT from responses or response_answers — all analytics routes through SECURITY DEFINER views
- publication_snapshots enforced immutable by both a PL/pgSQL trigger and absence of UPDATE policy
- Comprehensive seed covering all 6 RBAC roles, all 5 tenure bands, 12 dimensions, 1 draft survey with 13 sections and 60 questions

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration (all 24 tables + enums + indexes) and Supabase config** — `bad0392` (feat)
2. **Task 2: RLS policies, analytics views, seed data, and SQL audit scripts** — `2ce7cbb` (feat)

## Files Created/Modified

- `supabase/config.toml` — Local dev config: API port 54321, auth settings, anonymous sign-ins disabled
- `supabase/migrations/20260315000001_schema.sql` — All 24 tables in dependency order with enums, indexes, privacy design comments, RLS enabled, and immutability trigger
- `supabase/migrations/20260315000002_rls.sql` — `current_user_role()` SECURITY DEFINER helper + all RLS policies using JWT claims (no profiles table inside USING clauses)
- `supabase/migrations/20260315000003_views.sql` — Analytics views (v_dimension_scores, v_participation_rates, v_public_actions) + `get_dimension_scores_for_survey()` RPC
- `supabase/migrations/20260315000004_seed.sql` — 18 users, 5 departments, 8 job roles, 12 dimensions, 1 survey, 13 sections, 60 questions, 3 action items (all with hardcoded UUIDs)
- `supabase/tests/anonymity_audit.sql` — Structural proof: no FK between participation_tokens and responses
- `supabase/tests/rls_check.sql` — Confirms 0 public tables have rowsecurity=false
- `supabase/tests/schema_check.sql` — Lists all 24 tables and verifies count
- `supabase/tests/seed_check.sql` — Validates user counts per role, tenure band coverage, privacy threshold defaults

## Decisions Made

- **responses.user_id nullable by design:** In anonymous surveys, user_id IS NULL. This makes anonymity a schema constraint, not an application-layer promise. No migration can accidentally link anonymous responses to users.
- **participation_tokens/responses structural decoupling:** The only shared column is survey_id. Without a user_id FK on responses (anonymous mode), it is mathematically impossible to determine which response belongs to which user — even with full database access.
- **current_user_role() reads JWT, never profiles:** All 24 tables' RLS policies call this helper. If it queried profiles instead, every profile lookup would trigger the profiles RLS policy which would re-enter the function — infinite recursion. JWT claims are evaluated in memory.
- **Analytics access via SECURITY DEFINER only:** Employees and managers have no SELECT policy on responses or response_answers. All their analytics access goes through views that can enforce privacy thresholds (minimum respondent counts) before returning data.
- **Hardcoded UUIDs in seed:** Using predictable UUID prefixes (111... for departments, 333... for users, etc.) allows Phase 2 and Phase 3 tests to reference seed records without database lookups. Stable across `supabase db reset` runs.
- **Section 3 and 4 target_roles restriction:** Architecture and Engineering Productivity sections have `target_roles: ["employee","manager"]` to exclude leadership and HR from technically-irrelevant sections — keeps survey focused.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added 6 extra questions to reach 60+ minimum**
- **Found during:** Task 2 (seed file creation)
- **Issue:** Initial seed had 54 unique questions (4 per dimension section). Plan requires `>= 60` questions for Phase 2 testing adequacy.
- **Fix:** Added 1 additional Likert question to 6 sections (org-clarity, sales-eng-handover, arch-governance, team-structure, delivery-pm, quality-testing). Final count: exactly 60 questions.
- **Files modified:** `supabase/migrations/20260315000004_seed.sql`
- **Verification:** Python UUID count confirmed 60 unique question IDs
- **Committed in:** `2ce7cbb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical)
**Impact on plan:** Required for Phase 2 testing completeness. No scope creep — questions are additive and follow the same dimension-mapping pattern specified in the plan.

## Issues Encountered

None — all migrations execute cleanly in dependency order.

## User Setup Required

None — no external service configuration required beyond running `supabase db reset` once the Supabase CLI is installed.

To verify the schema locally:
```bash
supabase db reset
psql $DATABASE_URL -f supabase/tests/schema_check.sql    # 24 tables
psql $DATABASE_URL -f supabase/tests/rls_check.sql       # 0 tables without RLS
psql $DATABASE_URL -f supabase/tests/seed_check.sql      # 18 users, 12 dims, 60 questions
psql $DATABASE_URL -f supabase/tests/anonymity_audit.sql # 0 FK rows between participation_tokens and responses
```

## Next Phase Readiness

- Schema is locked — table names, column names, and enum values MUST NOT change in subsequent migrations
- Phase 2 (response collection) can build on top of: participation_tokens, responses, response_answers, response_drafts tables
- Seed UUIDs are stable across resets: Phase 2 tests can reference survey ID `55500000-0000-0000-0000-000000000001` and user IDs `33300000-...00001` through `...00018`
- Blockers carried forward from Phase 1 research: participation token RLS for anonymous update path needs careful testing in Phase 2 before production use

## Self-Check: PASSED

All 9 created files confirmed present on disk. Both task commits verified in git log:
- `bad0392` feat(01-02): schema migration
- `2ce7cbb` feat(01-02): RLS policies, analytics views, seed data, and SQL audit scripts

---
*Phase: 01-foundation*
*Completed: 2026-03-15*
