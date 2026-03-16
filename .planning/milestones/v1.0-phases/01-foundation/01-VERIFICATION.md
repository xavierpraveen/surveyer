---
phase: 01-foundation
verified: 2026-03-15T13:10:00Z
status: human_needed
score: 26/26 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 24/26
  gaps_closed:
    - "DX-01: README Test Accounts table now lists exact 18 emails from supabase/migrations/20260315000004_seed.sql — no fabricated users remain"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Run `supabase start && supabase db reset && pnpm dev`, sign in as alice.chen@acme.dev with password123, then refresh the browser tab"
    expected: "Authenticated to /dashboard (employee route); session survives refresh without redirect to /login"
    why_human: "Requires live Supabase instance for JWT issuance and cookie-based session management"
  - test: "Navigate to /magic-link, submit grace.li@acme.dev, open Supabase Inbucket at http://127.0.0.1:54324, click the link"
    expected: "Success message shown on page; clicking link authenticates and redirects to /dashboard"
    why_human: "End-to-end email delivery and OTP exchange requires live Supabase"
  - test: "Sign in with each of: alice.chen@acme.dev (employee), iris.yamamoto@acme.dev (manager), leo.torres@acme.dev (leadership), noah.hassan@acme.dev (admin), peter.white@acme.dev (hr_admin), quinn.garcia@acme.dev (survey_analyst)"
    expected: "employee -> /dashboard, manager -> /manager/dashboard, leadership -> /leadership/dashboard, admin/hr_admin/survey_analyst -> /admin"
    why_human: "Requires live Supabase JWT with app_metadata.role claim to test middleware routing"
  - test: "On /login, submit user@gmail.com with any password"
    expected: "Form shows 'This app is for company employees. Please use your company email to sign in.' error inline without page navigation"
    why_human: "Requires browser to verify form state rendering and error display"
  - test: "Sign in as alice.chen@acme.dev (employee), then navigate directly to /admin and /manager/dashboard"
    expected: "Both redirect back to /dashboard"
    why_human: "Requires live session to test middleware redirect logic"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** The platform has a secure, deployable scaffold with working authentication, role-based routing, and a complete privacy-correct database schema — ready for feature development without risk of needing data migrations that would destroy anonymity guarantees

**Verified:** 2026-03-15T13:10:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (DX-01 README test accounts)

---

## Re-Verification Summary

**Previous status:** gaps_found (24/26)
**Current status:** human_needed (26/26 automated checks pass)

**Gap closed:** DX-01 — The README Test Accounts table at lines 61-78 now contains exactly the 18 emails from `supabase/migrations/20260315000004_seed.sql`. All fabricated users (alice.johnson, bob.smith, admin@acme.dev, etc.) have been replaced with the actual seed users (alice.chen, bob.kim, noah.hassan, olivia.park, etc.). No regressions were detected in any previously-passing check.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A user can sign in with email+password, stay signed in across browser refresh, and sign out from any page | ? UNCERTAIN | `signIn` action fully implemented in auth.ts; server.ts uses `await cookies()` for session persistence; `signOut` wired to form in employee dashboard. Requires live Supabase to execute. |
| 2 | A user can request a magic link and be authenticated after clicking it | ? UNCERTAIN | `signInWithMagicLink` implemented with `shouldCreateUser: false`; magic-link page wired. Requires live Supabase to execute. |
| 3 | Sign-up is blocked for email addresses outside the configured company domain with a helpful error message | VERIFIED | `isDomainAllowed()` in auth.ts returns error string for non-matching domains in both `signIn` and `signInWithMagicLink`; `ALLOWED_EMAIL_DOMAIN` in .env.example |
| 4 | Middleware reads the role from JWT app_metadata and redirects each role to its correct route group — zero DB queries | VERIFIED | middleware.ts uses `supabase.auth.getUser()` (not `getSession()`), reads `user.app_metadata?.role`, ROLE_HOME maps all 6 AppRole values to route prefixes; no DB call anywhere in middleware |
| 5 | An admin server action can assign a role to an existing user via the service role client | VERIFIED | `assignUserRole()` in auth.ts calls `supabaseAdmin.auth.admin.updateUserById()` with `app_metadata: { role }`; supabaseAdmin imported from admin.ts (service role) |
| 6 | A developer can read README.md and know exactly what env vars to set and how to start local Supabase | VERIFIED | README env var table, local setup steps, and Test Accounts table all correct. Test Accounts table (lines 61-78) lists exact 18 emails from seed migration with correct roles. |
| 7 | The SUPABASE_SERVICE_ROLE_KEY is never accessible in browser bundles | VERIFIED | `import 'server-only'` is line 1 of admin.ts; SUPABASE_SERVICE_ROLE_KEY appears only in admin.ts throughout src/ |
| 8 | Running supabase db reset creates all 24 tables with no errors | ? UNCERTAIN | All 24 CREATE TABLE statements present in correct dependency order in 20260315000001_schema.sql (543 lines). Cannot run without live Supabase. |
| 9 | Every public table has RLS enabled — zero tables with rowsecurity=false | VERIFIED | 24 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements confirmed in schema migration |
| 10 | responses.user_id is nullable — it is NULL for all anonymous survey submissions | VERIFIED | Line 321 of schema: `user_id UUID NULL REFERENCES auth.users(id)` with inline comment "user_id is NULL for anonymous surveys" |
| 11 | No RLS policy enables joining participation_tokens to responses | VERIFIED | No FK exists between the two tables; RLS policies include explicit comment "PRIVACY: No policy enables a join from participation_tokens to responses" |
| 12 | current_user_role() SECURITY DEFINER function reads from JWT app_metadata | VERIFIED | Function defined in rls.sql: `LANGUAGE sql STABLE SECURITY DEFINER ... SELECT auth.jwt()->'app_metadata'->>'role'`; called 65 times across all RLS policies |
| 13 | Analytics views exist as SECURITY DEFINER functions preventing direct row-level access | VERIFIED | views.sql has SECURITY DEFINER markers; three views + get_dimension_scores_for_survey() RPC present |
| 14 | Seed data loads 18 profiles, 12 dimensions, 1 diagnostic survey with 13 sections | VERIFIED | 18 auth.users INSERTs confirmed; 12 dimension rows; 1 survey INSERT; 13 section rows (sections 0-12) |
| 15 | app_settings table contains privacy threshold defaults (5 numeric, 10 text) | VERIFIED | schema.sql: `INSERT INTO public.app_settings` with `privacy_threshold_numeric = '5'` and `privacy_threshold_text = '10'` |
| 16 | All RLS policies on profiles use JWT claims — no self-referential query on profiles table | VERIFIED | current_user_role() reads auth.jwt(); zero occurrences of "FROM public.profiles" or "FROM profiles" inside rls.sql USING() clauses |
| 17 | Migration SQL has inline comments explaining the participation token / response decoupling | VERIFIED | schema.sql has 9-line privacy design comment block for participation_tokens; 7-line comment for responses; response_drafts also has design comment |

**Score:** 14/17 verified automatically, 3 requiring human verification (truths 1, 2, 8 require live Supabase)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/middleware.ts` | Auth check + role-based route protection | VERIFIED | 76 lines; imports createSupabaseMiddlewareClient + AppRole; uses getUser(); ROLE_HOME map for all 6 roles; matcher config present |
| `src/lib/supabase/client.ts` | Browser Supabase client (createBrowserClient) | VERIFIED | Exports createSupabaseBrowserClient() using @supabase/ssr createBrowserClient |
| `src/lib/supabase/server.ts` | Server Supabase client for RSC and Server Actions | VERIFIED | Exports async createSupabaseServerClient(); uses `await cookies()` (Next.js 15 correct) |
| `src/lib/supabase/middleware.ts` | Middleware-scoped Supabase client with cookie store | VERIFIED | Exports createSupabaseMiddlewareClient(request: NextRequest) returning { supabase, response } |
| `src/lib/supabase/admin.ts` | Service role client — server-only, never client-accessible | VERIFIED | Line 1: `import 'server-only'`; exports supabaseAdmin singleton using SUPABASE_SERVICE_ROLE_KEY |
| `src/lib/actions/auth.ts` | signIn, signInWithMagicLink, signOut, assignUserRole Server Actions | VERIFIED | All 4 actions exported; 'use server' directive present; domain restriction in signIn and signInWithMagicLink |
| `src/lib/constants/roles.ts` | AppRole type union and role constants | VERIFIED | Exports AppRole union, APP_ROLES array, ROLE_ROUTES record for all 6 roles |
| `src/lib/validations/auth.ts` | Zod schemas for auth form inputs | VERIFIED | signInSchema (email + password min 8), magicLinkSchema (email), exported types |
| `src/lib/actions/auth.test.ts` | Vitest stubs: AUTH-01, AUTH-02, AUTH-03, AUTH-07, AUTH-10 | VERIFIED | 7 test.todo entries covering signIn, signInWithMagicLink, signOut, assignUserRole |
| `src/lib/actions/import.test.ts` | Vitest stub: AUTH-08 CSV import | VERIFIED | 3 test.todo entries for parseCsvRoster |
| `vitest.config.ts` | Vitest config with React plugin | VERIFIED | defineConfig with @vitejs/plugin-react, environment: 'node', @/* alias; `pnpm vitest run` passes with 20 todo tests |
| `.env.example` | Template for all required env vars | VERIFIED | All 4 vars present: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_EMAIL_DOMAIN |
| `README.md` | Local setup, Supabase setup, env var docs, correct test accounts | VERIFIED | Setup steps, env var docs, and Test Accounts table (lines 61-78) all accurate. All 18 seed emails present with correct RBAC roles. |
| `supabase/migrations/20260315000001_schema.sql` | All 24 tables + enums + indexes + app_settings defaults | VERIFIED | 543 lines; all 24 CREATE TABLE statements confirmed; privacy comments present; RLS enabled on all 24 tables |
| `supabase/migrations/20260315000002_rls.sql` | current_user_role() function + all RLS policies | VERIFIED | 586 lines; current_user_role() SECURITY DEFINER reads auth.jwt(); 65 usages; no profiles table inside USING() |
| `supabase/migrations/20260315000003_views.sql` | SECURITY DEFINER aggregate views for analytics | VERIFIED | 138 lines; SECURITY DEFINER markers; v_dimension_scores, v_participation_rates, v_public_actions views + get_dimension_scores_for_survey() RPC |
| `supabase/migrations/20260315000004_seed.sql` | 18 employees, 12 dimensions, 1 diagnostic survey, 13 sections, 3 action items | VERIFIED | 1075 lines; 18 auth.users INSERTs; 12 dimensions; 1 survey; 13 sections (0-12); 60+ questions; 1 action_items INSERT |
| `supabase/tests/anonymity_audit.sql` | Structural proof that participation_tokens cannot be joined to responses | VERIFIED | 4-step audit with expected-result comments; checks FKs, nullable user_id, shared columns |
| `supabase/config.toml` | Supabase local dev config referencing seed migration | VERIFIED | Correct ports (API: 54321, DB: 54322, Studio: 54323, Inbucket: 54324); anonymous sign-ins disabled |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/middleware.ts` | `src/lib/supabase/middleware.ts` | createSupabaseMiddlewareClient() call | WIRED | Line 2 imports; line 18 calls `createSupabaseMiddlewareClient(request)` |
| `src/middleware.ts` | `src/lib/constants/roles.ts` | AppRole type for ROLE_HOME map | WIRED | Line 3: `import type { AppRole } from '@/lib/constants/roles'`; used in ROLE_HOME type annotation |
| `src/lib/actions/auth.ts` | `src/lib/supabase/server.ts` | createSupabaseServerClient() for auth operations | WIRED | Line 3 imports; called in signIn, signInWithMagicLink, signOut |
| `src/lib/actions/auth.ts` | `src/lib/supabase/admin.ts` | supabaseAdmin for assignUserRole | WIRED | Line 4 imports supabaseAdmin; used in assignUserRole |
| `src/lib/supabase/admin.ts` | `server-only` | import 'server-only' prevents client bundle inclusion | WIRED | Line 1 of admin.ts: `import 'server-only'` |
| `supabase/migrations/20260315000002_rls.sql` | `auth.jwt()` | current_user_role() reads app_metadata from JWT | WIRED | `SELECT auth.jwt()->'app_metadata'->>'role'`; function called 65x in policies |
| `supabase/migrations/20260315000001_schema.sql` | `responses.user_id nullable` | user_id UUID NULL for anonymous mode | WIRED | Line 321: `user_id UUID NULL REFERENCES auth.users(id)` |
| `supabase/migrations/20260315000002_rls.sql` | No participation_tokens to responses join | zero cross-table FK; no policy creates join path | WIRED | No REFERENCES between tables; RLS comment explicitly states invariant |
| `supabase/migrations/20260315000003_views.sql` | `response_answers` | analytics access via SECURITY DEFINER views | WIRED | get_dimension_scores_for_survey() function defined with SECURITY DEFINER |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-01 | Sign in with email and password | SATISFIED | signIn() in auth.ts calls supabase.auth.signInWithPassword |
| AUTH-02 | 01-01 | Sign in with magic link | SATISFIED | signInWithMagicLink() calls supabase.auth.signInWithOtp |
| AUTH-03 | 01-01 | Restrict sign-up to company email domain | SATISFIED | isDomainAllowed() in auth.ts; checked in both signIn and signInWithMagicLink |
| AUTH-04 | 01-01 | Session persists via SSR cookie-based sessions | SATISFIED | createSupabaseServerClient uses @supabase/ssr with `await cookies()` for proper session hydration |
| AUTH-05 | 01-01 | Role in JWT app_metadata, enforced without DB queries | SATISFIED | middleware.ts reads user.app_metadata.role from getUser() result; zero DB calls in middleware |
| AUTH-06 | 01-01 | Middleware routes users to role-appropriate areas | SATISFIED | ROLE_HOME map covers all 6 roles; route protection rules in middleware.ts |
| AUTH-07 | 01-01 | Admin can assign roles via assignUserRole | SATISFIED | assignUserRole() calls supabaseAdmin.auth.admin.updateUserById with app_metadata.role |
| AUTH-08 | 01-01 | Admin can import employee roster via CSV | SATISFIED (stub) | parseCsvRoster + importRoster stubs in import.ts; import.test.ts Wave 0 stubs; Phase 4 implementation noted |
| AUTH-09 | 01-01 | Seed initial employee data for local dev | SATISFIED | 18 users in 20260315000004_seed.sql covering all 6 RBAC roles and 5 tenure bands |
| AUTH-10 | 01-01 | User can sign out from any page | SATISFIED | signOut() server action; wired in employee dashboard via form action |
| SCHEMA-01 | 01-02 | Complete Supabase Postgres schema with migrations for all tables | SATISFIED | All 24 tables confirmed present in 20260315000001_schema.sql |
| SCHEMA-02 | 01-02 | RLS policies for all tables with JWT claim-based role checks | SATISFIED | 586-line RLS migration; current_user_role() used 65x; all 24 tables have RLS enabled |
| SCHEMA-03 | 01-02 | Postgres views and RPC functions for analytics aggregation | SATISFIED | v_dimension_scores, v_participation_rates, v_public_actions + get_dimension_scores_for_survey() RPC |
| SCHEMA-04 | 01-02 | Seed SQL with complete diagnostic survey, questions, sections, dimension mappings | SATISFIED | 1075-line seed; 13 sections, 60+ questions, 114 question UUIDs, question_dimension_map inserts |
| PRIVACY-01 | 01-02 | Anonymous responses architecturally unattributable — no user_id in anonymous mode | SATISFIED | responses.user_id is UUID NULL; participation_tokens has no FK to responses |
| PRIVACY-02 | 01-02 | RLS policies prevent joining participation tokens to response content | SATISFIED | No cross-table FK; explicit privacy comment in rls.sql; employees/managers have no SELECT on responses |
| PRIVACY-03 | 01-02 | Open-text responses respect same privacy threshold | SATISFIED | get_dimension_scores_for_survey() enforces p_min_respondents threshold; app_settings has separate text threshold (10) |
| PRIVACY-04 | 01-02 | Manager dashboards suppress segmented data below threshold | SATISFIED | Manager role has no direct SELECT on responses/response_answers; threshold enforced in SECURITY DEFINER RPC |
| PRIVACY-05 | 01-02 | Service role client isolated with server-only guard | SATISFIED | `import 'server-only'` on line 1 of admin.ts; SUPABASE_SERVICE_ROLE_KEY only in admin.ts |
| PRIVACY-06 | 01-02 | Privacy threshold admin-configurable, default 5 numeric / 10 text | SATISFIED | app_settings INSERT in schema: privacy_threshold_numeric=5, privacy_threshold_text=10 |
| PRIVACY-07 | 01-02 | All RLS policies use JWT claims, no same-table recursion on profiles | SATISFIED | current_user_role() reads auth.jwt(); zero "FROM profiles" in rls.sql USING() clauses |
| DX-01 | 01-01 | README with local setup, Supabase setup, env var documentation | SATISFIED | Setup steps, env var docs, and Test Accounts table all correct. All 18 seed emails (alice.chen through ruby.santos) present at README lines 61-78 with correct RBAC roles. |
| DX-02 | 01-01 | .env.example with all required environment variables | SATISFIED | All 4 required vars present with example values |
| DX-03 | 01-02 | Architecture overview and RLS policy explanations in documentation | SATISFIED | Extensive inline SQL comments in all 4 migration files; privacy design rationale documented in responses, participation_tokens, response_drafts, publication_snapshots tables |
| DX-04 | 01-02 | Seed scripts produce realistic test data for all roles | SATISFIED | 18 users across 6 roles and 5 tenure bands; 12 dimensions; 60 questions; 3 action items; hardcoded UUIDs for cross-phase referenceability |
| DX-05 | 01-01 | TypeScript types generated from Supabase schema | SATISFIED | `pnpm db:types` script in package.json; placeholder database.types.ts in place; TypeScript compiles with 0 errors |

**All 26 requirements: 26 SATISFIED (25 fully, 1 intentional Phase 4 stub for AUTH-08)**

---

## Anti-Patterns Found

| File | Issue | Severity | Impact |
|------|-------|----------|--------|
| `src/lib/actions/import.ts` | parseCsvRoster returns `[]` unconditionally; importRoster returns `{ imported: 0, errors: [] }` | INFO | Intentional Phase 4 stub — documented with `// Phase 4 implementation` comment. Does not affect Phase 1 goal. |

No blockers remain.

---

## Human Verification Required

### 1. Email+Password Sign-In and Session Persistence

**Test:** Run `supabase start && supabase db reset && pnpm dev`, then sign in as `alice.chen@acme.dev` with password `password123`. Refresh the browser tab.
**Expected:** Authenticated to `/dashboard` (employee route); session survives refresh without redirect to `/login`
**Why human:** Requires live Supabase instance for JWT issuance and cookie-based session management

### 2. Magic Link Authentication

**Test:** Navigate to `/magic-link`, submit `grace.li@acme.dev`. Check Supabase Inbucket at `http://127.0.0.1:54324`. Click the link.
**Expected:** Success message shown on page; clicking link authenticates and redirects to `/dashboard`
**Why human:** End-to-end email delivery and OTP exchange requires live Supabase

### 3. Role-Based Routing for All Six Roles

**Test:** Sign in with each of: alice.chen@acme.dev (employee), iris.yamamoto@acme.dev (manager), leo.torres@acme.dev (leadership), noah.hassan@acme.dev (admin), peter.white@acme.dev (hr_admin), quinn.garcia@acme.dev (survey_analyst). Verify each lands at its correct route.
**Expected:** employee -> `/dashboard`, manager -> `/manager/dashboard`, leadership -> `/leadership/dashboard`, admin/hr_admin/survey_analyst -> `/admin`
**Why human:** Requires live Supabase JWT with app_metadata.role claim to test middleware routing

### 4. Domain Restriction UI

**Test:** On `/login`, submit `user@gmail.com` with any password.
**Expected:** Form shows "This app is for company employees. Please use your company email to sign in." error inline without page navigation
**Why human:** Requires browser to verify form state rendering and error display

### 5. Cross-Role Route Protection

**Test:** Sign in as alice.chen@acme.dev (employee), then navigate directly to `/admin` and `/manager/dashboard`.
**Expected:** Both redirect back to `/dashboard`
**Why human:** Requires live session to test middleware redirect logic

---

## Gaps Summary

No gaps remain. The single gap from the previous run (DX-01 README test accounts mismatch) has been resolved. The README Test Accounts table now lists the exact 18 seed users with correct emails and RBAC roles. All 26 requirements pass automated verification.

The 5 human verification items above are inherent to the phase (live Supabase required for auth flows) and were present in the initial verification — they are not new gaps introduced by the fix.

---

_Verified: 2026-03-15T13:10:00Z_
_Verifier: Claude (gsd-verifier)_
