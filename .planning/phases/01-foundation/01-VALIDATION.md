---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (not yet installed — Wave 0 installs) |
| **Config file** | `vitest.config.ts` — Wave 0 creates this |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~10 seconds (unit only; SQL audits are manual) |

Phase 1 has no browser-dependent UI beyond stub pages — Playwright E2E is deferred to Phase 2. Phase 1 validation focuses on: unit tests for Server Actions, SQL-level schema/RLS queries (run against local Supabase), service role bundle audit, and type generation verification.

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run` + SQL audit queries
- **Before `/gsd:verify-work`:** Full suite green + all SQL audits pass
- **Max feedback latency:** ~10 seconds (unit tests)

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| AUTH-01 | signInWithPassword returns session | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 | ⬜ pending |
| AUTH-02 | signInWithOtp sends magic link | unit (mock supabase) | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 | ⬜ pending |
| AUTH-03 | Non-company email rejected | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 | ⬜ pending |
| AUTH-04 | Session persists via cookies | manual | Sign in, hard refresh, confirm still authenticated | — | ⬜ pending |
| AUTH-05 | Middleware reads role from JWT, 0 DB queries | manual | Check Supabase logs: 0 `profiles` queries during middleware | — | ⬜ pending |
| AUTH-06 | Role-based redirect per role | manual | Sign in as each seed user, verify URL destination | — | ⬜ pending |
| AUTH-07 | assignUserRole updates app_metadata | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 | ⬜ pending |
| AUTH-08 | CSV import creates users with correct roles | unit | `pnpm vitest run src/lib/actions/import.test.ts` | ❌ Wave 0 | ⬜ pending |
| AUTH-09 | db reset produces 18 seed users | SQL audit | `psql -c "SELECT count(*) FROM auth.users"` → 18 | — | ⬜ pending |
| AUTH-10 | signOut clears session | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 | ⬜ pending |
| SCHEMA-01 | All 23 tables exist after migration | SQL audit | `psql -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"` → 23 | — | ⬜ pending |
| SCHEMA-02 | All tables have RLS enabled | SQL audit | `psql -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false"` → 0 rows | — | ⬜ pending |
| SCHEMA-03 | Analytics views exist | SQL audit | `psql -c "\dv public.*"` → confirm aggregate views present | — | ⬜ pending |
| SCHEMA-04 | Seed: 18 users, 12 dimensions, 1 survey | SQL audit | `psql -c "SELECT count(*) FROM profiles"` → 18; `SELECT count(*) FROM dimensions` → 12 | — | ⬜ pending |
| PRIVACY-01 | responses table has no user_id column | SQL audit | `psql -c "\d responses"` → confirm no user_id column | — | ⬜ pending |
| PRIVACY-02 | No policy joins participation_tokens to responses | code review | Review `_rls.sql` — no cross-table join between these tables | — | ⬜ pending |
| PRIVACY-03 | Text responses hidden below threshold in views | SQL audit | Run analytics view with <10 response filter → no text returned | — | ⬜ pending |
| PRIVACY-04 | Manager threshold enforcement | deferred | Phase 3 — views not yet populated | — | ⬜ deferred |
| PRIVACY-05 | Service role key not in .next/ bundle | build audit | `pnpm build && grep -r "service_role" .next/` → 0 matches | — | ⬜ pending |
| PRIVACY-06 | app_settings contains threshold defaults | SQL audit | `psql -c "SELECT * FROM app_settings"` → 2 rows with correct defaults | — | ⬜ pending |
| PRIVACY-07 | No profiles self-join in RLS policies | SQL audit | `psql -c "SELECT policyname, qual FROM pg_policies WHERE tablename='profiles'"` → no `profiles` reference in USING clause | — | ⬜ pending |
| DX-01 | README.md exists with setup instructions | file check | `test -f README.md && echo OK` | ❌ Wave 0 | ⬜ pending |
| DX-02 | .env.example committed | file check | `test -f .env.example && echo OK` | ❌ Wave 0 | ⬜ pending |
| DX-03 | Migration SQL has privacy design comments | code review | Review migration files for inline comments explaining participation token pattern | — | ⬜ pending |
| DX-04 | Seed users cover all 6 roles + 5 tenure bands | SQL audit | `psql -c "SELECT app_metadata->>'role', count(*) FROM auth.users GROUP BY 1"` → 6 role groups | — | ⬜ pending |
| DX-05 | database.types.ts generated and importable | build check | `pnpm db:types && pnpm typecheck` → no errors | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/actions/auth.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-03, AUTH-07, AUTH-10
- [ ] `src/lib/actions/import.test.ts` — stub for AUTH-08
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `README.md` — setup instructions (DX-01)
- [ ] `.env.example` — env template (DX-02)
- [ ] `pnpm db:types` script in `package.json` — calls `supabase gen types typescript --local > src/lib/supabase/database.types.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session cookie persists | AUTH-04 | Requires real browser + cookie jar | Sign in, close tab, reopen, confirm /dashboard loads without re-auth |
| Middleware JWT read, 0 DB queries | AUTH-05 | Requires Supabase query log inspection | Navigate to /dashboard, check Studio logs — must show 0 `SELECT` on `profiles` |
| Role-based routing per role | AUTH-06 | Requires 6 test accounts | Sign in as each seed user, verify redirect destination |
| No cross-table join policy | PRIVACY-02 | Policy intent review required | Read `_rls.sql` — confirm no `IN (SELECT user_id FROM participation_tokens ...)` in `responses` policies |
| Migration comments explain privacy design | DX-03 | Content quality review | Read migration SQL — participation_tokens decoupling must be explained in comments |

---

## SQL Audit Scripts

Save as `supabase/tests/` for use during Wave verification:

```sql
-- anonymity_audit.sql: THE most important test
-- Verify it is structurally impossible to join participation_tokens to responses
-- Expected: 0 rows (no shared non-survey key)
SELECT r.id as response_id, pt.user_id
FROM responses r
JOIN participation_tokens pt ON pt.survey_id = r.survey_id
WHERE r.user_id IS NULL  -- anonymous responses
LIMIT 5;
-- If this returns rows, anonymity is NOT guaranteed — the join via survey_id alone
-- means an attacker who knows the survey_id still cannot link to a specific user,
-- but this query verifies there is truly no direct FK between the tables.

-- rls_check.sql: All tables must have RLS enabled
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: 0 rows

-- schema_check.sql: All 23 tables exist
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 23

-- seed_check.sql: Seed data complete
SELECT
  (SELECT count(*) FROM auth.users) as user_count,
  (SELECT count(*) FROM profiles) as profile_count,
  (SELECT count(*) FROM dimensions) as dimension_count,
  (SELECT count(*) FROM surveys) as survey_count;
-- Expected: 18, 18, 12, 1
```

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING test file references
- [ ] No watch-mode flags in any test commands
- [ ] Feedback latency < 10s for unit tests
- [ ] SQL audit scripts exist in `supabase/tests/`
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
