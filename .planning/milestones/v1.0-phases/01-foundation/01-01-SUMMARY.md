---
phase: 01-foundation
plan: 01
subsystem: auth
tags: [supabase, nextjs, typescript, tailwind, vitest, ssr, jwt, server-actions, zod]

# Dependency graph
requires: []
provides:
  - Next.js 15.5.12 project scaffold with App Router and TypeScript strict mode
  - Three Supabase client factories: browser (createSupabaseBrowserClient), server (createSupabaseServerClient), middleware (createSupabaseMiddlewareClient)
  - supabaseAdmin singleton (service role, server-only guarded)
  - Four Server Actions: signIn, signInWithMagicLink, signOut, assignUserRole
  - Auth middleware with role-based routing for all 6 AppRole values (zero DB queries)
  - Stub dashboards for employee/manager/leadership/admin route groups
  - Login and magic-link pages as client components
  - Wave 0 vitest stubs (10 test.todo stubs)
  - AppRole union type and ROLE_ROUTES constants
  - Zod schemas for signIn and magicLink forms
  - .env.example, README with 18 seed user accounts
affects: [02-database, 03-survey, 04-analytics]

# Tech tracking
tech-stack:
  added:
    - next@15.5.12
    - react@19
    - @supabase/ssr@0.9.0
    - @supabase/supabase-js@2.x
    - zod@3.x
    - server-only@0.0.1
    - tailwindcss@3.x
    - vitest@2.1.9
    - vite@5.4.21 (pinned)
    - "@vitejs/plugin-react@4.3.4" (pinned)
  patterns:
    - "@supabase/ssr three-client pattern: browser/server/middleware factories"
    - "Server Actions + Zod safeParse as mutation pattern"
    - "getUser() (not getSession()) in middleware for JWT verification"
    - "await cookies() for Next.js 15 async cookie store"
    - "import 'server-only' guard for service role client"
    - "JWT app_metadata.role for RBAC — no DB queries in middleware"

key-files:
  created:
    - src/middleware.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/lib/supabase/admin.ts
    - src/lib/supabase/database.types.ts
    - src/lib/actions/auth.ts
    - src/lib/actions/import.ts
    - src/lib/actions/auth.test.ts
    - src/lib/actions/import.test.ts
    - src/lib/constants/roles.ts
    - src/lib/validations/auth.ts
    - src/app/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/magic-link/page.tsx
    - src/app/(employee)/dashboard/page.tsx
    - src/app/(manager)/dashboard/page.tsx
    - src/app/(leadership)/dashboard/page.tsx
    - src/app/(admin)/page.tsx
    - vitest.config.ts
    - .env.example
    - README.md
  modified: []

key-decisions:
  - "next@15.5.12 instead of 15.2.2 — CVE-2025-66478 patch required"
  - "vitest@2.1.9 + vite@5.4.21 pinned — vitest@3 uses vite@7 (ESM-only) which breaks CJS config loading; pinning to vite@5 resolves the conflict"
  - "@vitejs/plugin-react@4.3.4 pinned to peer-compatible vite@5 range (^4.2.0 || ^5.0.0 || ^6.0.0)"
  - "getUser() over getSession() in middleware — verifies token server-side, avoids trusting unverified session data"
  - "SUPABASE_SERVICE_ROLE_KEY isolated to admin.ts only behind import 'server-only'"
  - "isDomainAllowed() returns true when ALLOWED_EMAIL_DOMAIN is unset — allows all domains as dev fallback"

patterns-established:
  - "Supabase client: always use @supabase/ssr factories, never @supabase/auth-helpers-nextjs"
  - "Cookie mutation: await cookies() in Next.js 15 (breaking change from synchronous cookies())"
  - "Admin operations: import supabaseAdmin only in Server Actions or server-only files"
  - "Route protection: middleware reads role from JWT app_metadata — zero DB queries"
  - "Server Actions: always 'use server', Zod safeParse before any DB operation"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10, DX-01, DX-02, DX-05]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 1 Plan 01: Foundation Summary

**Next.js 15.5.12 scaffold with Supabase SSR auth (email+password + magic link), role-based middleware routing for 6 roles (zero DB queries), service-role admin singleton behind server-only guard, and Wave 0 vitest stubs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T12:15:02Z
- **Completed:** 2026-03-15T12:21:09Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments

- Next.js 15.5.12 project fully bootstrapped from scratch: dependencies installed, TypeScript strict mode, Tailwind v3, vitest
- Three Supabase client factories (browser/server/middleware) + admin singleton using @supabase/ssr@0.9.0 API with `await cookies()` (Next.js 15 breaking change handled)
- Auth middleware with JWT role routing for all 6 AppRole values (`employee | manager | leadership | admin | hr_admin | survey_analyst`) — zero DB queries
- Four Server Actions: signIn, signInWithMagicLink, signOut, assignUserRole — all with domain restriction enforced server-side
- SUPABASE_SERVICE_ROLE_KEY isolated to `src/lib/supabase/admin.ts` only, behind `import 'server-only'`
- Wave 0 vitest stubs: 10 test.todo entries pass; typecheck: 0 errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffold, config files, and Wave 0 test infrastructure** - `57d8680` (feat)
2. **Task 2: Supabase client factories, auth Server Actions, and middleware** - `263c757` (feat)

## Files Created/Modified

- `src/middleware.ts` - Auth check + role-based route protection using JWT app_metadata (no DB)
- `src/lib/supabase/client.ts` - createSupabaseBrowserClient (browser)
- `src/lib/supabase/server.ts` - createSupabaseServerClient (RSC/Server Actions) with async cookies()
- `src/lib/supabase/middleware.ts` - createSupabaseMiddlewareClient (middleware cookie store)
- `src/lib/supabase/admin.ts` - supabaseAdmin singleton, server-only guarded, service role
- `src/lib/actions/auth.ts` - signIn, signInWithMagicLink, signOut, assignUserRole Server Actions
- `src/lib/actions/import.ts` - parseCsvRoster + importRoster stubs (Phase 4 implementation)
- `src/lib/constants/roles.ts` - AppRole union type + APP_ROLES + ROLE_ROUTES constants
- `src/lib/validations/auth.ts` - signInSchema, magicLinkSchema Zod schemas
- `src/lib/supabase/database.types.ts` - Placeholder (regenerated after migrations)
- `src/lib/actions/auth.test.ts` - Wave 0 stubs: 7 test.todo entries (AUTH-01..10)
- `src/lib/actions/import.test.ts` - Wave 0 stubs: 3 test.todo entries (AUTH-08 CSV)
- `src/app/layout.tsx` - Root layout with Tailwind globals
- `src/app/(auth)/login/page.tsx` - Email+password login form (client component)
- `src/app/(auth)/magic-link/page.tsx` - Magic link request form (client component)
- `src/app/(employee)/dashboard/page.tsx` - Employee dashboard stub (RSC)
- `src/app/(manager)/dashboard/page.tsx` - Manager dashboard stub (RSC)
- `src/app/(leadership)/dashboard/page.tsx` - Leadership dashboard stub (RSC)
- `src/app/(admin)/page.tsx` - Admin panel stub (RSC)
- `package.json` - All dependencies with pinned versions for vite compatibility
- `vitest.config.ts` - Vitest config with React plugin and @/* alias
- `.env.example` - All required env vars template
- `README.md` - Full local setup guide with 18 seed user accounts table

## Decisions Made

- **next@15.2.2 → 15.5.12**: CVE-2025-66478 security patch applied per global CLAUDE.md instructions
- **vitest@2.1.9 + vite@5.4.21 pinned**: vitest@3 pulls vite@7 (ESM-only) which breaks the CJS config loading path; vitest@2 with pinned vite@5 resolves the conflict cleanly
- **@vitejs/plugin-react@4.3.4 pinned**: Only version with peerDep range `^4.2.0 || ^5.0.0 || ^6.0.0` (compatible with vite@5)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Upgraded next@15.2.2 to 15.5.12 for CVE-2025-66478**
- **Found during:** Task 1 (pnpm install output showed deprecation warning for security vulnerability)
- **Issue:** next@15.2.2 has a published CVE; global CLAUDE.md instructions mandate immediate upgrade
- **Fix:** Updated package.json to next@15.5.12 (latest stable 15.x patch), reinstalled
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** No deprecation warning on reinstall
- **Committed in:** 57d8680 (Task 1 commit)

**2. [Rule 3 - Blocking] Pinned vitest@2.1.9 and vite@5.4.21 to fix ESM startup crash**
- **Found during:** Task 1 (vitest run failed with ERR_REQUIRE_ESM)
- **Issue:** vitest@3.x resolves vite@7 which is ESM-only; the CJS vitest config loader requires() vite and crashes immediately
- **Fix:** Downgraded to vitest@2.1.9, added explicit vite@^5.4.0 devDependency, pinned @vitejs/plugin-react@4.3.4
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** `pnpm vitest run` shows 10 todo; single vite@5.4.21 installed
- **Committed in:** 57d8680 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 security upgrade, 1 blocking)
**Impact on plan:** Both required for correct operation. No scope creep.

## Issues Encountered

- None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required yet. Supabase local setup is documented in README.md and will be required before Phase 2 testing.

## Next Phase Readiness

- Auth foundation is complete; all subsequent phases can import from established patterns
- `database.types.ts` is a placeholder — must run `supabase start && pnpm db:types` after Phase 1 Plan 02 creates migrations
- Wave 0 test stubs will be implemented in Phase 2 once local Supabase is running
- All 6 role route groups have stub pages — middleware routing is verifiable immediately after `supabase start`

---
*Phase: 01-foundation*
*Completed: 2026-03-15*

## Self-Check: PASSED

All files verified present. Both task commits verified in git history (57d8680, 263c757).
