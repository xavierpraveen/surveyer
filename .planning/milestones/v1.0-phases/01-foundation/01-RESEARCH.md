# Phase 1: Foundation - Research

**Researched:** 2026-03-15
**Domain:** Next.js 15 App Router + Supabase Auth/RLS + Privacy-correct DB schema
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Project Scaffold**
- Next.js 15 with App Router, `src/` directory layout, TypeScript strict mode
- Tailwind CSS v3; no component library in Phase 1 — add UI primitives as needed
- Route groups: `(auth)` login/magic-link, `(employee)` survey flow, `(manager)` manager views, `(leadership)` leadership views, `(admin)` admin tools
- Package manager: pnpm
- Env: `.env.local` for development, `.env.example` committed to repo

**Auth Implementation**
- Library: `@supabase/ssr` — not the deprecated `auth-helpers-nextjs`
- Methods: Email + password AND magic link (passwordless) — both enabled in v1
- Domain restriction: enforced server-side in the sign-up Server Action (check email domain against `ALLOWED_EMAIL_DOMAIN` env var); also set in Supabase dashboard as a backup
- Session: cookie-based via `@supabase/ssr`; `await cookies()` required (Next.js 15 breaking change — cookies() is async)
- Role storage: `app_metadata.role` set via service role client on user creation/import; middleware reads role from JWT claim — zero DB queries in middleware
- Role values: `employee | manager | leadership | admin | hr_admin | survey_analyst`

**Database Schema**
- All tables in `public` schema. Migrations in `supabase/migrations/` as numbered SQL files.
- Core tables: `profiles`, `departments`, `teams`, `roles`
- Survey structure: `surveys`, `survey_sections`, `questions`, `question_options`
- Dimension model: `dimensions`, `question_dimension_map`
- Response collection (anonymity-critical): `participation_tokens`, `responses`, `response_answers`, `response_drafts`, `response_metadata`
- Analytics & output: `derived_metrics`, `qualitative_tags`, `qualitative_themes`
- Actions & publication: `action_items`, `action_updates`, `publication_snapshots`
- Infrastructure: `audit_logs`, `app_settings`

**RLS Policy Design**
- Role check pattern: `auth.jwt()->'app_metadata'->>'role'` — NEVER query `profiles` inside a policy
- Helper: Create `public.current_user_role()` SECURITY DEFINER function returning the JWT role claim
- Anonymous responses: `responses` and `response_answers` have no SELECT policy for individual rows — all analytics access goes through SECURITY DEFINER aggregate views
- No policy enables joining `participation_tokens` to `responses`
- Service role: admin operations use service role client with `import 'server-only'`

**Folder & File Structure**
- `src/app/(auth)/`, `(employee)/`, `(manager)/`, `(leadership)/`, `(admin)/`
- `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `admin.ts`, `database.types.ts`
- `src/lib/actions/auth.ts`, `src/lib/validations/auth.ts`, `src/lib/constants/roles.ts`
- `supabase/migrations/` — four numbered SQL files: schema, rls, views, seed

**Seed Data**
- 5 departments, 18 employees covering all 6 RBAC roles and all tenure bands at `@acme.dev`
- 12 dimensions pre-loaded, 1 diagnostic survey in draft status with 13 sections and ~65 questions
- 3 sample action items
- Runs via `supabase db reset`

### Claude's Discretion

- Specific Tailwind color palette and spacing scale choices
- Exact login page field layout and spacing
- Loading state implementation (skeleton vs spinner) for auth
- Exact error message copy for domain restriction failures
- B-tree index strategy (Claude should add indexes on all FK columns + frequently-queried columns like `survey_id`, `status`, `is_public`)
- Whether to use `nuqs` for URL state (not needed until Phase 3 — defer)

### Deferred Ideas (OUT OF SCOPE)

- Supabase Realtime for live participation rate updates — Phase 3 consideration
- `nuqs` for URL-based filter state in dashboards — Phase 3
- Email notifications (survey open, reminder) — v2 feature
- SSO/SAML — explicitly out of scope for v1
- eNPS question type (0–10 scale) — v2 feature
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in with email and password via Supabase Auth | `@supabase/ssr` createBrowserClient pattern; Server Action with signInWithPassword |
| AUTH-02 | User can sign in with magic link (passwordless email) | Supabase `signInWithOtp()` + email OTP flow |
| AUTH-03 | System restricts sign-up to company email domain (configurable) | Server-side domain check in sign-up Server Action; `ALLOWED_EMAIL_DOMAIN` env var |
| AUTH-04 | User session persists across browser refresh via cookie-based sessions | `@supabase/ssr` cookie store with `getAll`/`setAll` pattern; middleware session refresh |
| AUTH-05 | Role stored in JWT `app_metadata` and enforced by middleware without DB queries | `auth.jwt()->'app_metadata'->>'role'` in middleware; `admin.updateUserById` for assignment |
| AUTH-06 | Middleware routes users to role-appropriate areas | `updateSession()` helper + role redirect logic in root `middleware.ts` |
| AUTH-07 | Admin can assign roles: employee, manager, leadership, admin, hr_admin, survey_analyst | Service role client `supabase.auth.admin.updateUserById()` in Server Action |
| AUTH-08 | Admin can import employee roster via CSV | Server Action reading CSV, creating users via admin client, setting app_metadata |
| AUTH-09 | Admin can seed initial employee data for local development and testing | `supabase/migrations/20260315000004_seed.sql` run via `supabase db reset` |
| AUTH-10 | User can sign out from any page | `supabase.auth.signOut()` in Server Action; redirect to login |
| SCHEMA-01 | Complete Postgres schema with migrations for all tables | Four numbered migration SQL files in `supabase/migrations/` |
| SCHEMA-02 | RLS policies implemented for all tables using JWT claim-based role checks | `current_user_role()` SECURITY DEFINER helper; per-table policies in `_rls.sql` |
| SCHEMA-03 | Postgres views and RPC functions for analytics aggregation | SECURITY DEFINER aggregate views in `_views.sql` migration |
| SCHEMA-04 | Seed SQL scripts including complete diagnostic survey and sample employee data | `_seed.sql` with realistic `@acme.dev` users and all dimension/question data |
| PRIVACY-01 | Anonymous survey responses are architecturally unattributable — no `user_id` on responses | `responses` table has no FK to `profiles`; `user_id` NULL for anonymous surveys |
| PRIVACY-02 | RLS policies prevent any role from joining participation tokens to response content | No policy allows cross-table join; `participation_tokens` and `responses` share only `survey_id` |
| PRIVACY-03 | Open-text responses respect the same privacy threshold | SECURITY DEFINER views enforce n-threshold before returning any text |
| PRIVACY-04 | Manager dashboards suppress all segmented data for teams below privacy threshold | Analytics views include threshold check before returning aggregate rows |
| PRIVACY-05 | Service role client isolated with `import 'server-only'` | `lib/supabase/admin.ts` with `import 'server-only'` at top |
| PRIVACY-06 | Privacy threshold is admin-configurable (default: 5 numeric, 10 open-text) | `app_settings` table with `privacy_threshold_numeric` and `privacy_threshold_text` keys |
| PRIVACY-07 | All RLS policies use JWT claims for role checks (no same-table policy recursion on profiles) | `current_user_role()` reads from `auth.jwt()` only; never queries `profiles` |
| DX-01 | README with local setup, Supabase setup, and environment variable documentation | `README.md` created as part of scaffold |
| DX-02 | `.env.example` template with all required environment variables | `.env.example` committed with all keys and no values |
| DX-03 | Architecture overview and RLS policy explanations in documentation | Comments in migration SQL + architecture section in README |
| DX-04 | Seed scripts produce realistic test data for all roles and survey responses | 18 employees across all roles and tenure bands at `@acme.dev` |
| DX-05 | TypeScript types generated from Supabase schema (`supabase gen types`) | `supabase gen types typescript --local > src/lib/supabase/database.types.ts` |
</phase_requirements>

---

## Summary

Phase 1 is the highest-leverage and highest-risk phase of the project. Everything built in phases 2–4 depends on the schema, RLS policies, and auth patterns established here. The good news is that the technical stack (`@supabase/ssr` + Next.js 15 App Router) is well-documented and stable. The critical wrinkle is that Next.js 15 made `cookies()`, `headers()`, and dynamic route params async — any Supabase SSR setup guide written before late 2024 will have broken patterns that cause silent session failures.

The key architectural invariant for this phase is the participation_token / response separation: the `responses` table must never carry a `user_id` column in anonymous mode, and no RLS policy must enable a join between the two tables. This must be enforced at the schema level — not just application code — because it is unrecoverable after real survey data exists. Similarly, the `current_user_role()` SECURITY DEFINER function must be the only mechanism for role checks in RLS policies; any policy that queries the `profiles` table to determine the current user's role will recurse infinitely.

The two additional architectural elements that must be locked down before any feature code: the service role client must be wrapped in `import 'server-only'` to prevent build-time leakage, and the `audit_logs` and `publication_snapshots` tables must be append-only via RLS (INSERT only, no UPDATE/DELETE policies defined).

**Primary recommendation:** Write the four migration files in dependency order (schema → RLS + helper functions → views → seed), reset the local DB, generate types, then build auth UI against real RLS-correct data. Never bypass RLS with service role during auth development — it masks policy gaps that will break in production.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 15.x | App Router framework | Locked by project decision |
| `react` / `react-dom` | 19.x | UI rendering | Ships with Next.js 15 |
| `@supabase/ssr` | 0.9.0 | Auth cookie management for SSR | Official replacement for deprecated auth-helpers; Next.js 15 async cookies supported |
| `@supabase/supabase-js` | latest v2 | Supabase JS client | Official client; peer dep of @supabase/ssr |
| `typescript` | 5.x | Type safety | Locked by project decision; strict mode required |
| `tailwindcss` | 3.x | Styling | Locked by project decision; v4 unstable at time of writing |
| `zod` | 3.x | Schema validation for Server Actions | Standard in Next.js App Router auth patterns |
| `server-only` | latest | Build-time guard for service role client | npm package; causes build error if imported in Client Component |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/node` | 20.x | Node type definitions | Dev dependency; required for env var types |
| `eslint-config-next` | 15.x | ESLint config | Dev dependency; ESLint 9 supported |
| `supabase` CLI | latest | Local dev, migrations, type gen | Dev dependency; `supabase db reset`, `supabase gen types` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | auth-helpers is deprecated; no Next.js 15 support; do not use |
| Tailwind v3 | Tailwind v4 | v4 API is stable but ecosystem (plugins, shadcn) still catching up; v3 is safer for Phase 1 |
| `next.config.ts` | `next.config.js` | TypeScript config is now standard in Next.js 15; use `.ts` |

**Installation:**
```bash
pnpm add next@15 react@19 react-dom@19 @supabase/ssr @supabase/supabase-js zod server-only
pnpm add -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next tailwindcss postcss autoprefixer supabase
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── magic-link/page.tsx
│   ├── (employee)/
│   │   └── dashboard/page.tsx     # stub
│   ├── (manager)/
│   │   └── dashboard/page.tsx     # stub
│   ├── (leadership)/
│   │   └── dashboard/page.tsx     # stub
│   ├── (admin)/
│   │   └── page.tsx               # stub
│   └── layout.tsx
├── components/
│   └── ui/                        # Button, Input, Label primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # createBrowserClient
│   │   ├── server.ts              # createServerClient (async)
│   │   ├── middleware.ts          # updateSession helper
│   │   ├── admin.ts              # service role client — import 'server-only'
│   │   └── database.types.ts     # generated by supabase gen types
│   ├── actions/
│   │   └── auth.ts               # signIn, signInWithMagicLink, signOut
│   ├── validations/
│   │   └── auth.ts               # Zod schemas
│   └── constants/
│       └── roles.ts              # AppRole type + role constants
└── middleware.ts                  # auth + role-based route protection
supabase/
├── migrations/
│   ├── 20260315000001_schema.sql
│   ├── 20260315000002_rls.sql
│   ├── 20260315000003_views.sql
│   └── 20260315000004_seed.sql
├── seed.sql                       # optional: forward to migration seed
└── config.toml
```

### Pattern 1: Three-Client Supabase Pattern

**What:** Three distinct Supabase clients for three different execution contexts — browser, server (RSC/Server Actions), and middleware.
**When to use:** Every DB interaction in the app uses exactly one of these three clients depending on where code executes.

**Browser client** (`lib/supabase/client.ts`):
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server client** (`lib/supabase/server.ts`) — async because Next.js 15 cookies() is async:
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore writes; middleware will persist
          }
        },
      },
    }
  )
}
```

**Middleware helper** (`lib/supabase/middleware.ts`):
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // CRITICAL: use getUser(), not getSession() — getUser() revalidates on Auth server
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

**Service role client** (`lib/supabase/admin.ts`):
```typescript
// import 'server-only' must be first — causes build error if imported in client
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### Pattern 2: Root Middleware with Role-Based Routing

**What:** The root `middleware.ts` refreshes auth session and redirects to the role-appropriate dashboard after sign-in. Role is read from `user.app_metadata.role` — zero DB queries.
**When to use:** This is the single route guard for all protected routes.

```typescript
// middleware.ts — Source: derived from Supabase SSR docs + CONTEXT.md decisions
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ROLE_DASHBOARD: Record<string, string> = {
  employee: '/dashboard',
  manager: '/manager/dashboard',
  leadership: '/leadership/dashboard',
  admin: '/admin',
  hr_admin: '/admin',
  survey_analyst: '/leadership/dashboard',
}

const PROTECTED_PREFIXES = ['/dashboard', '/manager', '/leadership', '/admin']
const AUTH_PATHS = ['/login', '/magic-link']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPath = AUTH_PATHS.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPath && user) {
    const role = user.app_metadata?.role as string | undefined
    const destination = ROLE_DASHBOARD[role ?? ''] ?? '/dashboard'
    const url = request.nextUrl.clone()
    url.pathname = destination
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Role Assignment via Service Role Admin Client

**What:** Setting `app_metadata.role` requires the service role client. This is done in a Server Action for manual assignment or during CSV roster import.
**When to use:** Anytime a role must be set or changed for a user.

```typescript
// lib/actions/auth.ts (Server Action)
'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AppRole } from '@/lib/constants/roles'

export async function assignUserRole(userId: string, role: AppRole) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role }
  })
  if (error) throw new Error(`Failed to assign role: ${error.message}`)
}

// For user creation with role pre-set:
export async function createUserWithRole(email: string, role: AppRole) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role }
  })
  if (error) throw new Error(`Failed to create user: ${error.message}`)
  return data.user
}
```

**Critical note on JWT staleness:** After calling `updateUserById` to change a role, the user must sign out and back in (or wait for token refresh) for the new role to appear in their JWT. Plan seed scripts to create users with roles set at creation time, not updated afterward.

### Pattern 4: `current_user_role()` SECURITY DEFINER Helper

**What:** A Postgres function that reads the role from the JWT `app_metadata` claim. Used in all RLS policies to avoid per-row table lookups.
**Why SECURITY DEFINER:** Allows the function to run as the defining role (postgres), bypassing any RLS on `profiles`. Critical: this function must be in a non-exposed schema or have `search_path` locked down.

```sql
-- Source: Supabase RBAC docs + confirmed pattern for app_metadata
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'anonymous'
  )
$$;
```

**Performance optimization:** Wrap JWT calls in a SELECT subquery in policies — Postgres optimizer caches the result per statement, not per row:
```sql
-- BAD (re-evaluated per row):
USING (public.current_user_role() = 'admin')

-- GOOD (cached per statement via initPlan):
USING ((SELECT public.current_user_role()) = 'admin')
```

### Pattern 5: Anonymity-Preserving RLS on Response Tables

**What:** The `responses` and `response_answers` tables have INSERT policies that validate the participation token is owned by the current user (confirming eligibility) but never write `auth.uid()` to any response column.

```sql
-- participation_tokens: employee can INSERT once per survey, SELECT own
CREATE POLICY "employee_insert_own_participation_token"
ON participation_tokens FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (SELECT public.current_user_role()) = 'employee'
);

CREATE POLICY "employee_select_own_participation_token"
ON participation_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- responses: employee can INSERT, but NO user_id goes into the row
-- The WITH CHECK validates a matching unused participation token exists,
-- but never writes auth.uid() into any column on the responses table.
CREATE POLICY "authenticated_insert_response"
ON responses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM participation_tokens pt
    WHERE pt.survey_id = responses.survey_id
      AND pt.user_id = auth.uid()
      AND pt.submitted_at IS NULL
  )
);

-- NO SELECT policy on responses for individual users — all reads go through views
-- NO SELECT policy on response_answers for individual users
```

**Why no SELECT on responses:** Individual rows cannot be read by any authenticated role. Leadership reads go through SECURITY DEFINER aggregate views that enforce the privacy threshold and never return identifiable rows.

### Pattern 6: Append-Only Tables via RLS

**What:** `audit_logs` and `publication_snapshots` must be immutable — INSERT only, no UPDATE or DELETE allowed for any role including admins.

```sql
-- audit_logs: INSERT only (service role via admin client, no UPDATE/DELETE policies)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_insert_audit_log"
ON audit_logs FOR INSERT
TO authenticated  -- service role bypasses RLS entirely; this policy is for app writes
WITH CHECK (true);

-- No UPDATE policy = UPDATE denied by default
-- No DELETE policy = DELETE denied by default

-- publication_snapshots: INSERT for leadership/admin only, no UPDATE, no DELETE
ALTER TABLE publication_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leadership_insert_snapshot"
ON publication_snapshots FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.current_user_role()) IN ('leadership', 'admin')
);

CREATE POLICY "all_authenticated_select_snapshot"
ON publication_snapshots FOR SELECT
TO authenticated
USING (true);

-- No UPDATE policy = UPDATE denied
-- No DELETE policy = DELETE denied
```

### Pattern 7: Seed SQL via `supabase db reset`

**What:** The `config.toml` is configured to use a seed SQL file at the default path `supabase/seed.sql`, or multiple files via `sql_paths` in `[db.seed]`.
**When to use:** Seed runs automatically on `supabase db reset`. Use `supabase db reset --no-seed` to skip seeding.

```toml
# supabase/config.toml
[db.seed]
enabled = true
sql_paths = ['./migrations/20260315000004_seed.sql']
```

**Alternative:** Place seed content directly in `supabase/seed.sql` (default path). Since the CONTEXT.md decision puts seed in the migrations directory as `20260315000004_seed.sql`, configure `config.toml` explicitly.

**Encoding note (known pitfall):** Seed files must be UTF-8 encoded. UTF-16 LE causes `insufficient data left in message` errors on `db reset`.

### Pattern 8: TypeScript Type Generation

**What:** Generate `database.types.ts` from the local Supabase instance after migrations are applied.

```bash
# Generate from local instance (requires supabase start)
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Or from remote project
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > src/lib/supabase/database.types.ts
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts",
    "db:reset": "supabase db reset"
  }
}
```

### Anti-Patterns to Avoid

- **`getSession()` in middleware:** Returns unvalidated data from cookies. A malicious client can spoof the user object. Always use `getUser()` in middleware and server code.
- **`cookies()` at module scope:** `cookies()` from `next/headers` throws if called outside a request context. Always call inside the function body, never at module initialization.
- **`createBrowserClient` in Server Components:** Browser client reads stale cookies and misses session refresh. Server Components must use `createServerClient` (the async version).
- **`NEXT_PUBLIC_` prefix on service role key:** Exposes the key in the client bundle. The service role key must use `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_`).
- **Self-referencing RLS on `profiles`:** Any policy on `profiles` that queries `profiles` to determine role causes infinite recursion (`stack depth limit exceeded`). Use `auth.jwt()->'app_metadata'->>'role'` only.
- **`for all` RLS policies:** Using `FOR ALL` is permissive and may allow unintended operations. Define separate policies for each operation type.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie refresh | Custom session management | `@supabase/ssr` `updateSession()` | Token rotation, HttpOnly, SameSite set correctly by default |
| Auth state in React | Custom auth context/provider | `supabase.auth.getUser()` in Server Components | App Router RSC makes client auth state management unnecessary for protected routes |
| Email validation on sign-up | Custom regex | Server Action with `email.endsWith('@' + domain)` | Keep simple; Supabase Auth validates email format |
| JWT parsing in middleware | Manual `atob` / `jose` decode | `user.app_metadata.role` from `supabase.auth.getUser()` | Already parsed by Supabase auth session |
| DB migration runner | Custom migration scripts | `supabase db reset` + numbered SQL files | CLI handles shadow DB comparison, ordering, and idempotency |
| TypeScript DB types | Manual type definitions | `supabase gen types typescript --local` | Generated from live schema; always accurate |
| Role checks in application code | if/else role checks at route level | Middleware + RLS | Defense in depth; application-layer checks are single point of failure |

**Key insight:** The Supabase CLI and `@supabase/ssr` handle every cross-cutting infrastructure concern. Hand-rolled alternatives introduce subtle bugs at the session boundary and the server/client component boundary.

---

## Common Pitfalls

### Pitfall 1: `cookies()` Not Awaited (Next.js 15 Breaking Change)

**What goes wrong:** The server Supabase client is called synchronously: `const cookieStore = cookies()` (without `await`). The function returns a Promise in Next.js 15, so `cookieStore.getAll()` returns undefined and the session is always empty.

**Why it happens:** Every Supabase SSR guide written before Next.js 15 used the synchronous form. Copy-pasting old examples causes silent auth failures.

**How to avoid:** The server client factory must be `async` and `await cookies()`:
```typescript
export async function createClient() {
  const cookieStore = await cookies()  // await is mandatory in Next.js 15
  return createServerClient(...)
}
```

**Warning signs:** Auth appears to work on initial load but session is lost on navigation. `user` is always `null` in Server Components despite having a valid cookie.

### Pitfall 2: `getSession()` Used Instead of `getUser()` in Middleware

**What goes wrong:** Middleware uses `supabase.auth.getSession()` to check authentication. `getSession()` reads directly from the cookie without network validation — a malicious user can craft a cookie containing a fake user ID and bypass route protection.

**Why it happens:** `getSession()` is simpler (no network call) and returns the same shape as `getUser()`. Old guides recommend it.

**How to avoid:** Always use `await supabase.auth.getUser()` in middleware and all server-side auth checks. This makes a request to the Supabase Auth server to revalidate the token every time.

**Warning signs:** Any middleware that calls `getSession()` for route protection. CVE-2025-29927 (Next.js middleware bypass) compounds this — do not rely on middleware alone for data access authorization; RLS is the authoritative gate.

### Pitfall 3: RLS Infinite Recursion on `profiles`

**What goes wrong:** A policy on the `profiles` table queries `profiles` to check the current user's role. Postgres evaluates the policy per-row, triggering the policy again, causing `ERROR: stack depth limit exceeded`.

**Why it happens:** Intuitive approach is `SELECT role FROM profiles WHERE id = auth.uid()`. Works everywhere except on the `profiles` table itself.

**How to avoid:** All role checks use `auth.jwt()->'app_metadata'->>'role'` or `current_user_role()` which reads the JWT. Never query `profiles` inside a `profiles` policy.

**Warning signs:** `stack depth limit exceeded` errors after schema migration. Slow first-request on any profile read.

### Pitfall 4: Service Role Key in Next.js Client Bundle

**What goes wrong:** `lib/supabase/admin.ts` is imported in a file used by both server and client code. The service role key appears in the `.next/` bundle and is visible in browser DevTools.

**Why it happens:** Next.js App Router's server/client boundary is enforced by the bundler based on `'use client'` directives and import chains. A file without `'use client'` can still end up in the client bundle if it's imported by a component that is.

**How to avoid:** `import 'server-only'` as the first line of `lib/supabase/admin.ts`. This npm package causes a build-time error if the file is transitively imported in a Client Component.
Post-build verification: `grep -r "service_role" .next/` — must return no results.

**Warning signs:** `SUPABASE_SERVICE_ROLE_KEY` visible in Network tab or browser console. Build completes without error but key is in bundle.

### Pitfall 5: Anonymous Response Table Gets a `user_id` Column

**What goes wrong:** A developer adds a `user_id` nullable column to `responses` "just for debugging" or autosave convenience. Any such column permanently destroys anonymity because a service role query can trivially identify every respondent.

**Why it happens:** Autosave requires knowing which user owns the draft. The path of least resistance is to reuse the `responses` table.

**How to avoid:** The `response_drafts` table carries `user_id` for in-progress autosave. On final anonymous submission: copy answers to `response_answers` (no user ID), mark participation token as redeemed (`submitted_at = now()`), delete the draft row. The `responses` table schema must have a comment explaining why there is no `user_id` column.

**Warning signs:** Any migration file that adds `user_id`, `respondent_id`, or `profile_id` to `responses` or `response_answers`. Any INSERT policy on `responses` that writes `auth.uid()` to a column.

### Pitfall 6: JWT Staleness After Role Assignment

**What goes wrong:** `supabase.auth.admin.updateUserById()` updates `app_metadata.role` but the user's active JWT still carries the old role. Middleware reads the stale JWT and routes to the wrong dashboard.

**Why it happens:** JWTs are signed tokens with a lifetime. The Auth server cannot push updates to already-issued tokens. The user's session cookie contains the old token until it expires or is refreshed.

**How to avoid:** For seed data, create users with roles set at creation time (`createUser({ app_metadata: { role } })`), not updated afterward. For live role changes, the user must sign out and back in. Document this in the admin UI.

**Warning signs:** Role-based routing sends a newly promoted user to the wrong dashboard. Admin cannot immediately access admin routes after role assignment.

### Pitfall 7: Seed File Encoding Issue

**What goes wrong:** `supabase db reset` fails with `failed to send batch: ERROR: insufficient data left in message (SQLSTATE 08P01)` when running seed SQL.

**Why it happens:** The seed file was saved with UTF-16 LE encoding instead of UTF-8.

**How to avoid:** Verify seed SQL files are UTF-8 encoded. In VS Code, check the encoding in the status bar (bottom right). Use the Command Palette "Change File Encoding" → "Save with Encoding" → "UTF-8" if needed.

---

## Code Examples

Verified patterns from official sources and confirmed research:

### Auth Sign-In Server Action

```typescript
// src/lib/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function signInWithPassword(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid credentials format' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) return { error: error.message }
  redirect('/dashboard') // middleware will redirect to role-correct destination
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const domain = process.env.ALLOWED_EMAIL_DOMAIN!

  if (!email.endsWith(`@${domain}`)) {
    return { error: `This app is for ${domain} employees. Please use your company email.` }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }, // only allow existing employees
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Domain Restriction on Sign-Up

```typescript
// src/lib/actions/auth.ts (sign-up — admin only for v1)
'use server'
import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AppRole } from '@/lib/constants/roles'

export async function createEmployeeAccount(
  email: string,
  fullName: string,
  role: AppRole
) {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN!
  if (!email.endsWith(`@${domain}`)) {
    throw new Error(`Email must be a ${domain} address`)
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role },
  })

  if (error) throw error
  return data.user
}
```

### RLS Helper Function

```sql
-- Source: Supabase RBAC docs pattern adapted for app_metadata
-- In: supabase/migrations/20260315000002_rls.sql

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'anonymous'
  )
$$;

-- Grant execute to all authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
```

### Profiles RLS (No Recursion)

```sql
-- Source: derived from Supabase RLS docs; avoids infinite recursion pattern
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Employee: SELECT own profile only
CREATE POLICY "profiles_employee_select_own"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  AND (SELECT public.current_user_role()) = 'employee'
);

-- Manager: SELECT profiles in own team
CREATE POLICY "profiles_manager_select_team"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT public.current_user_role()) = 'manager'
  AND team_id IN (
    SELECT id FROM teams WHERE manager_id = auth.uid()
  )
);

-- Leadership/admin/hr_admin: SELECT all active profiles
CREATE POLICY "profiles_leadership_select_all"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT public.current_user_role()) IN ('leadership', 'admin', 'hr_admin', 'survey_analyst')
);

-- INSERT/UPDATE: service role only (no user-facing policies)
```

### B-tree Indexes on Critical Columns

```sql
-- Source: Performance guidance from pitfalls research + CONTEXT.md discretion note
-- In: supabase/migrations/20260315000001_schema.sql

-- FK columns
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_profiles_team_id ON profiles(team_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_survey_sections_survey_id ON survey_sections(survey_id);
CREATE INDEX idx_questions_survey_section_id ON questions(survey_section_id);
CREATE INDEX idx_participation_tokens_survey_id ON participation_tokens(survey_id);
CREATE INDEX idx_participation_tokens_user_id ON participation_tokens(user_id);
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX idx_response_answers_question_id ON response_answers(question_id);
CREATE INDEX idx_response_drafts_user_id ON response_drafts(user_id);
CREATE INDEX idx_action_items_survey_id ON action_items(survey_id);

-- Frequently-queried non-FK columns
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_action_items_is_public ON action_items(is_public);
CREATE INDEX idx_participation_tokens_submitted_at ON participation_tokens(submitted_at)
  WHERE submitted_at IS NULL;  -- partial index for unsubmitted tokens

-- Composite for analytics queries
CREATE INDEX idx_response_answers_survey_question
  ON response_answers(question_id)
  INCLUDE (numeric_value);
```

### Environment Variables

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER use NEXT_PUBLIC_ prefix
ALLOWED_EMAIL_DOMAIN=acme.com
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023–2024 | auth-helpers deprecated; `@supabase/ssr` is the only supported approach |
| `cookies()` synchronous | `await cookies()` | Next.js 15 (Oct 2024) | Server client factory must be async; all callers must await it |
| `getSession()` for auth checks | `getUser()` for auth checks | Supabase security update 2024 | `getSession()` is insecure for server-side authorization |
| `next.config.js` | `next.config.ts` | Next.js 15 | TypeScript-native config with `NextConfig` type; use `.ts` |
| ESLint 8 | ESLint 9 | Next.js 15 | ESLint 9 is now the default; config format changed |
| Custom claims via `user_metadata` | Custom claims via `app_metadata` + auth hook | Supabase stable 2024 | `user_metadata` is user-writable; never use for authorization |

**Deprecated / outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated, no Next.js 15 support. Do not use.
- `createMiddlewareClient` (from auth-helpers): Replaced by `createServerClient` from `@supabase/ssr`.
- `createClientComponentClient` (from auth-helpers): Replaced by `createBrowserClient`.
- `createServerComponentClient` (from auth-helpers): Replaced by async `createServerClient`.

---

## Open Questions

1. **Custom Access Token Hook vs. direct `app_metadata` read in RLS**
   - What we know: The recommended 2025 approach for injecting roles into JWT is the Custom Access Token Hook (a Postgres function that runs before token issuance). This puts the role at the top level of the JWT (`auth.jwt() ->> 'user_role'`) rather than nested under `app_metadata`.
   - What's unclear: CONTEXT.md specifies `auth.jwt()->'app_metadata'->>'role'` directly. Using the hook would surface it as a top-level JWT claim, which is simpler and faster to access in RLS but requires a different read path.
   - Recommendation: **Proceed with the CONTEXT.md approach** (`app_metadata`) — it is a locked decision. The `app_metadata` path is secure (user cannot modify it) and the JWT path is clear: `auth.jwt()->'app_metadata'->>'role'`. The Custom Access Token Hook is an optimization that can be added later without schema changes.

2. **`app_settings` table query from RLS policies**
   - What we know: Privacy thresholds (`privacy_threshold_numeric`, `privacy_threshold_text`) are stored in `app_settings`. Analytics views need to read these values.
   - What's unclear: Calling `SELECT value FROM app_settings WHERE key = '...'` inside a SECURITY DEFINER view could cause a per-query lookup. This is acceptable in Phase 1 (views are not yet live) but should be addressed in Phase 3 before analytics are built.
   - Recommendation: In Phase 1, define the `app_settings` table and seed the default values. Phase 3 will decide whether to cache the threshold in the application layer or use a dedicated Postgres function.

3. **Supabase Local Docker `supabase start` resource requirements**
   - What we know: `supabase start` launches a local Docker stack (Postgres, GoTrue, Kong, Studio, etc.).
   - What's unclear: Whether the developer's machine has Docker Desktop installed. The DX-01 README must include a `supabase start` step.
   - Recommendation: Document `supabase start` as a prerequisite in README and `DX-01`.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (not yet installed — see Wave 0 gaps) |
| Config file | `vitest.config.ts` — Wave 0 creates this |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

Phase 1 has no browser-dependent UI beyond stub pages, so Playwright E2E is deferred to Phase 2 (survey submission flow). Phase 1 validation focuses on: schema correctness queries, RLS policy enforcement queries (run via Supabase SQL editor or psql), service role key bundle audit, and type generation verification.

Most Phase 1 tests are SQL-level (anonymity audit, RLS enforcement) run directly against the local Supabase instance, not through Vitest. They are documented as manual verification scripts in `supabase/tests/`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | signInWithPassword returns session | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 |
| AUTH-02 | signInWithOtp sends magic link | unit (mock supabase) | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 |
| AUTH-03 | Non-company email rejected in Server Action | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 |
| AUTH-04 | Session persists across requests via cookies | manual-only | Verify: sign in, hard refresh, confirm still logged in | — |
| AUTH-05 | Middleware reads role from JWT, no DB query | manual-only | Verify: Supabase logs show 0 `profiles` queries during middleware execution | — |
| AUTH-06 | Role-based redirect sends each role to correct dashboard | manual-only | Sign in as each seed user, verify URL | — |
| AUTH-07 | `assignUserRole` updates app_metadata | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 |
| AUTH-08 | CSV import creates users with correct roles | unit | `pnpm vitest run src/lib/actions/import.test.ts` | ❌ Wave 0 |
| AUTH-09 | `supabase db reset` produces seed users | SQL audit | `psql -c "SELECT count(*) FROM auth.users"` → 18 | — |
| AUTH-10 | signOut clears session | unit | `pnpm vitest run src/lib/actions/auth.test.ts` | ❌ Wave 0 |
| SCHEMA-01 | All 23 tables exist after migration | SQL audit | `psql -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"` → 23 | — |
| SCHEMA-02 | All tables have RLS enabled | SQL audit | `psql -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false"` → 0 rows | — |
| SCHEMA-03 | Analytics views exist | SQL audit | `psql -c "\dv"` → check for aggregate views | — |
| SCHEMA-04 | Seed data: 18 users, 12 dimensions, 1 survey | SQL audit | `psql -c "SELECT count(*) FROM profiles"` → 18; dimensions → 12 | — |
| PRIVACY-01 | `responses` table has no user_id column | SQL audit | `psql -c "\d responses"` → no user_id column | — |
| PRIVACY-02 | No policy joins participation_tokens to responses | manual code review | Review `_rls.sql` — confirm no cross-table join policy | — |
| PRIVACY-03 | Text responses hidden below threshold in views | SQL audit | Run analytics view with <5 response filter, verify no text returned | — |
| PRIVACY-04 | Manager dashboard suppresses below-threshold data | SQL audit | (Deferred to Phase 3 — views not yet populated) | — |
| PRIVACY-05 | Service role key not in `.next/` bundle | build audit | `pnpm build && grep -r "service_role" .next/` → 0 matches | — |
| PRIVACY-06 | `app_settings` contains threshold defaults | SQL audit | `psql -c "SELECT * FROM app_settings"` → 2 rows | — |
| PRIVACY-07 | No `profiles` self-join in any RLS policy | SQL audit | `psql -c "SELECT * FROM pg_policies WHERE tablename='profiles'"` → review USING clauses | — |
| DX-01 | README.md exists with setup instructions | file check | `test -f README.md` | ❌ Wave 0 |
| DX-02 | `.env.example` committed | file check | `test -f .env.example` | ❌ Wave 0 |
| DX-03 | Migration SQL has comments explaining privacy design | code review | Review migration files for inline comments | — |
| DX-04 | Seed users cover all 6 roles and 5 tenure bands | SQL audit | `psql -c "SELECT app_metadata->>'role', count(*) FROM auth.users GROUP BY 1"` | — |
| DX-05 | `database.types.ts` generated and importable | build check | `pnpm db:types && pnpm typecheck` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm vitest run --reporter=verbose` (unit tests only, < 10s)
- **Per wave merge:** Full suite + SQL audit queries against local Supabase instance
- **Phase gate:** All SQL audits green + `pnpm build && grep -r "service_role" .next/` returns nothing + `pnpm typecheck` passes before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest config at project root; `pnpm add -D vitest @vitejs/plugin-react`
- [ ] `src/lib/actions/auth.test.ts` — unit tests for auth Server Actions (covers AUTH-01, AUTH-02, AUTH-03, AUTH-07, AUTH-10)
- [ ] `src/lib/actions/import.test.ts` — unit tests for CSV roster import (covers AUTH-08)
- [ ] `README.md` — local setup instructions (covers DX-01)
- [ ] `.env.example` — env var template (covers DX-02)
- [ ] `pnpm add -D vitest @vitejs/plugin-react` — if Vitest not yet in devDependencies

---

## Sources

### Primary (HIGH confidence)

- [Supabase SSR Next.js setup docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — three-client pattern, `updateSession()` middleware, async `cookies()` requirement
- [Supabase SSR creating a client docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `getAll`/`setAll` cookie handler interface
- [Supabase Custom Claims & RBAC docs](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) — `app_metadata` for authorization, SECURITY DEFINER function pattern
- [Supabase Custom Access Token Hook docs](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) — hook function signature, claims injection pattern
- [Supabase Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy syntax, `WITH CHECK` for INSERT, append-only via omitting UPDATE/DELETE
- [Supabase seeding docs](https://supabase.com/docs/guides/local-development/seeding-your-database) — `config.toml` `[db.seed]` configuration, `sql_paths` pattern
- [Supabase TypeScript type generation docs](https://supabase.com/docs/guides/api/rest/generating-types) — `supabase gen types typescript --local` command
- [Next.js 15 installation docs](https://nextjs.org/docs/app/getting-started/installation) — `tsconfig.json` strict mode, `next.config.ts`, pnpm scaffold
- [@supabase/ssr v0.9.0 on npm](https://www.npmjs.com/package/@supabase/ssr) — current version confirmed

### Secondary (MEDIUM confidence)

- [Supabase RLS performance best practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — `SELECT` subquery wrapping for JWT function caching
- [Supabase admin API reference](https://supabase.com/docs/reference/javascript/auth-admin-createuser) — `admin.createUser` and `admin.updateUserById` signatures
- [Supabase JWT fields reference](https://supabase.com/docs/guides/auth/jwt-fields) — JWT claim structure including `app_metadata`
- [Next.js 15 release blog](https://nextjs.org/blog/next-15) — async `cookies()` / `headers()` / `params` breaking change confirmed

### Tertiary (LOW confidence — validate before implementing)

- WebSearch results on JWT staleness behavior — consistent with known Supabase behavior but not from official changelog post-August 2025

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@supabase/ssr` v0.9.0 confirmed current; Next.js 15 async cookies confirmed breaking change; all packages verified
- Architecture (three-client pattern, updateSession, admin client guard): HIGH — from official Supabase SSR docs
- RLS patterns (`current_user_role()`, append-only, no self-join): HIGH — from official Supabase RLS and RBAC docs
- Migration/seed patterns: HIGH — from official Supabase local dev docs; `config.toml` `sql_paths` confirmed
- Type generation: HIGH — from official Supabase TypeScript docs
- Pitfalls (async cookies, getUser vs getSession, recursion, bundle leakage): HIGH — all from official sources or confirmed security advisories

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable domain; `@supabase/ssr` releases frequently but API is stable; re-verify version before install)
