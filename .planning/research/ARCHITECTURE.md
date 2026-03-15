# Architecture Research

**Domain:** Internal organizational health survey platform (Next.js 15 App Router + Supabase)
**Researched:** 2026-03-15
**Confidence:** HIGH (Next.js 15 App Router + @supabase/ssr are well-established; patterns are from official docs and established community practice as of Aug 2025)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Survey Form │  │  Dashboard  │  │  Public     │                 │
│  │ (Client CC) │  │ (RSC+CC)    │  │  Results    │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
└─────────┼────────────────┼────────────────┼────────────────────────┘
          │ Server Actions │ RSC fetch      │ RSC fetch
┌─────────▼────────────────▼────────────────▼────────────────────────┐
│                        Next.js 15 App Router                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  middleware.ts  (auth check, role routing, cookie refresh)     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │  Route Handlers   │  │  Server Actions   │  │ Server Comps   │  │
│  │  (API, webhooks)  │  │  (mutations only) │  │ (data fetching)│  │
│  └─────────┬─────────┘  └─────────┬─────────┘  └───────┬────────┘  │
│            │                      │                    │            │
│  ┌─────────▼──────────────────────▼────────────────────▼─────────┐ │
│  │                 Supabase Client Layer                          │ │
│  │  createServerClient(@supabase/ssr) — reads/writes cookies      │ │
│  └────────────────────────────────┬───────────────────────────────┘ │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                            Supabase                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Postgres  │  │    Auth    │  │  Storage   │  │   Realtime    │  │
│  │  + RLS     │  │  (JWT)     │  │  (unused   │  │   (limited    │  │
│  │  policies  │  │            │  │   v1)      │  │   use v1)     │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| `middleware.ts` | Auth cookie refresh, role-based redirect, protect routes | `@supabase/ssr` createServerClient, Next.js middleware |
| Server Components (RSC) | Data fetching, initial page render, pass data to client | `createServerClient`, direct Supabase queries |
| Server Actions | All write mutations (responses, actions, admin ops) | `"use server"`, Zod validation, `createServerClient` |
| Route Handlers | Webhooks, file exports, non-mutation API needs | `app/api/` directory, `createServerClient` |
| Client Components | Form state, autosave, interactive UI, optimistic updates | `createBrowserClient`, React hooks |
| Supabase RLS policies | Final authorization gate — no app-layer-only security | Postgres row-level security on every table |
| Database views/functions | Analytics aggregation, derived_metrics computation | Postgres views + `security definer` functions |

---

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router root
│   ├── (auth)/                   # Route group — unauthenticated pages
│   │   ├── login/
│   │   └── magic-link/
│   ├── (employee)/               # Route group — employee role
│   │   ├── survey/
│   │   │   └── [surveyId]/
│   │   │       ├── page.tsx      # Survey landing
│   │   │       └── [sectionId]/
│   │   │           └── page.tsx  # Section-by-section form
│   │   └── results/              # Public results view
│   ├── (manager)/                # Route group — manager role
│   │   ├── dashboard/
│   │   └── team/
│   ├── (leadership)/             # Route group — leadership role
│   │   ├── dashboard/
│   │   ├── dimensions/
│   │   └── export/
│   ├── (admin)/                  # Route group — admin/hr_admin/analyst roles
│   │   ├── surveys/
│   │   │   ├── new/
│   │   │   └── [surveyId]/
│   │   ├── employees/
│   │   ├── actions/
│   │   └── settings/
│   ├── open/                     # Public results page (no auth required)
│   │   └── page.tsx
│   ├── api/                      # Route Handlers (non-mutation API needs only)
│   │   └── export/
│   │       └── route.ts
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── components/
│   ├── survey/                   # Survey form components
│   │   ├── SurveyForm.tsx        # Client Component — top-level form state
│   │   ├── SectionProgress.tsx
│   │   ├── QuestionRenderer.tsx  # Routes to Likert/Select/Text variants
│   │   ├── LikertQuestion.tsx
│   │   ├── MultiSelectQuestion.tsx
│   │   └── TextQuestion.tsx
│   ├── dashboard/                # Dashboard display components
│   │   ├── DimensionScoreCard.tsx
│   │   ├── HeatmapChart.tsx
│   │   ├── TrendChart.tsx
│   │   ├── ParticipationGauge.tsx
│   │   └── PrivacyGuard.tsx      # Wraps charts — hides below threshold
│   ├── actions/                  # Action tracking UI
│   ├── admin/                    # Admin-only UI components
│   └── ui/                       # Shared primitives (button, input, card)
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # createServerClient factory
│   │   ├── client.ts             # createBrowserClient singleton
│   │   └── middleware.ts         # createServerClient for middleware context
│   ├── actions/                  # Server Actions (grouped by domain)
│   │   ├── survey-response.ts    # submitResponse, saveDraft, reopenSurvey
│   │   ├── action-items.ts       # createAction, updateStatus, addUpdate
│   │   ├── publication.ts        # publishSnapshot, archiveCycle
│   │   └── admin.ts              # importEmployees, configureSurvey
│   ├── queries/                  # Reusable server-side query functions
│   │   ├── surveys.ts
│   │   ├── analytics.ts          # Reads from DB views/materialized views
│   │   ├── participation.ts
│   │   └── action-items.ts
│   ├── validations/              # Zod schemas (shared server+client)
│   │   ├── survey-response.ts
│   │   ├── action-items.ts
│   │   └── admin.ts
│   └── constants/
│       ├── roles.ts              # Role enum + capability matrix
│       ├── dimensions.ts         # Dimension definitions
│       └── privacy.ts            # PRIVACY_THRESHOLD = 5
│
├── middleware.ts                  # Auth + role routing
└── types/
    ├── database.ts                # Generated Supabase types (supabase gen types)
    ├── domain.ts                  # Application-level types
    └── roles.ts                  # Role union types
```

### Structure Rationale

- **Route groups `(employee)`, `(manager)`, `(leadership)`, `(admin)`:** Groups allow role-scoped layouts (different nav, different data) without affecting the URL path. Middleware enforces the role gate before any route group renders.
- **`lib/actions/`:** All mutations are Server Actions. Co-locating them by domain (not by page) makes reuse across routes trivial and keeps pages thin.
- **`lib/queries/`:** Read queries extracted from Server Components into named functions — easier to test, reuse across RSC and Server Actions, and avoids inline query sprawl.
- **`lib/supabase/server.ts` vs `client.ts`:** The `@supabase/ssr` package requires separate factories for server (cookie-based) and browser (localStorage-based) contexts. Never import the server factory into a Client Component.
- **`types/database.ts` (generated):** Always use `supabase gen types typescript` output as the source of truth for DB types. Do not hand-write DB types.
- **`open/` outside route groups:** The public results page requires no auth and no role layout; keeping it outside groups prevents accidental layout inheritance.

---

## Architectural Patterns

### Pattern 1: @supabase/ssr — Three Client Contexts

**What:** `@supabase/ssr` provides three distinct client creation contexts. Using the wrong one in the wrong context causes auth failures or stale sessions.

**When to use:**
- `createServerClient` in `middleware.ts` — reads + writes cookies to refresh session tokens
- `createServerClient` in Server Components and Server Actions — reads cookies (request), writes cookies (response)
- `createBrowserClient` in Client Components — uses localStorage / in-memory token

**Trade-offs:** Requires threading `cookies()` from `next/headers` through every server-side client call. Verbose but necessary — Supabase session tokens are stored as cookies and must be refreshed on every request.

**Example:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()  // Next.js 15: cookies() is async
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — cookies are read-only
            // The middleware handles the actual cookie refresh
          }
        },
      },
    }
  )
}
```

### Pattern 2: Middleware — Auth Check + Role-Based Routing

**What:** A single `middleware.ts` handles three concerns in sequence: (1) session cookie refresh, (2) auth redirect for protected routes, (3) role-based redirect when a user hits the wrong route group.

**When to use:** Every request to protected routes. Runs on the Edge runtime before any server component renders.

**Trade-offs:** Middleware cannot do complex DB lookups cheaply (Edge runtime, no connection pooling). Role must be stored in the JWT custom claim or the session object — not looked up per-request from the database.

**The critical implication:** Store the user's role in Supabase Auth's `raw_app_meta_data` (set server-side, not accessible to users). Middleware reads from `session.user.app_metadata.role` — no DB round-trip needed.

**Example:**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  employee: '/survey',
  manager: '/manager/dashboard',
  leadership: '/leadership/dashboard',
  admin: '/admin/surveys',
  hr_admin: '/admin/employees',
  survey_analyst: '/leadership/dashboard',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Unauthenticated → login
  if (!session && !pathname.startsWith('/auth') && !pathname.startsWith('/open')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Role-based route guard
  if (session) {
    const role = session.user.app_metadata?.role ?? 'employee'
    const isAdminRoute = pathname.startsWith('/admin')
    const isLeadershipRoute = pathname.startsWith('/leadership')
    const isManagerRoute = pathname.startsWith('/manager')

    if (isAdminRoute && !['admin', 'hr_admin', 'survey_analyst'].includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/', request.url))
    }
    if (isLeadershipRoute && !['leadership', 'admin', 'survey_analyst'].includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/', request.url))
    }
    if (isManagerRoute && !['manager', 'admin', 'leadership'].includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg)).*)'],
}
```

### Pattern 3: Server Actions for All Mutations

**What:** All write operations (response submission, autosave, action item updates, publication) use Next.js Server Actions (`"use server"` functions) rather than Route Handlers (API Routes).

**When to use:** Any mutation that originates from a form or user interaction.

**Trade-offs:**
- Pros: No separate API endpoint to maintain, automatic CSRF protection via Next.js, co-located with the page/component using them, integrate cleanly with `useActionState` and `useFormStatus` for loading/error states
- Cons: Cannot be called from external services (use Route Handlers for webhooks), not suitable for streaming responses

**Why not API Routes for mutations:** Server Actions eliminate the need for a client-side `fetch` call and manual error handling plumbing. For a ~87-person internal tool, the simplicity win is significant with no real downside.

**Example:**
```typescript
// lib/actions/survey-response.ts
"use server"

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const AnswerSchema = z.object({
  questionId: z.string().uuid(),
  value: z.union([z.number().int().min(1).max(10), z.string(), z.array(z.string())]),
})

export async function saveDraft(
  surveyId: string,
  sectionId: string,
  answers: unknown[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = z.array(AnswerSchema).parse(answers)
  // Upsert draft answers — RLS ensures user can only write their own draft
  const { error } = await supabase
    .from('response_answers')
    .upsert(validated.map(a => ({
      question_id: a.questionId,
      value: a.value,
      is_draft: true,
    })))

  if (error) throw new Error(error.message)
  revalidatePath(`/survey/${surveyId}`)
}
```

### Pattern 4: participation_tokens — Anonymous Response Privacy

**What:** A separate `participation_tokens` table tracks *who has responded* without linking to *what they responded*. The response row itself has no `user_id` when anonymous.

**Why this is the right pattern:** Storing `user_id` on the `responses` table (even with a "don't look" policy) is insufficient — admins with Supabase dashboard access could join the tables. The token approach makes the link architecturally impossible once the token is consumed.

**The mechanism:**
1. When a survey opens, a `participation_token` row is created for each eligible employee: `(token_uuid, user_id, survey_id, used: false)`
2. RLS policy on `participation_tokens`: users can only read/update their own token row
3. To start an anonymous response, client submits their token. Server Action:
   - Verifies token belongs to the authenticated user
   - Creates a `responses` row with `user_id = NULL`, `is_anonymous = true`
   - Marks token as `used = true`
   - Returns the `response_id` (stored only in the browser session / httpOnly cookie for the duration of form completion)
4. Subsequent autosave and submission use `response_id` directly (no user linkage)
5. RLS on `responses`: for anonymous rows, `user_id IS NULL` — no policy can link back to a user

**RLS policies for this pattern:**
```sql
-- participation_tokens: user sees only their own
CREATE POLICY "users_own_token" ON participation_tokens
  FOR ALL USING (auth.uid() = user_id);

-- responses: anonymous rows insertable without user_id
CREATE POLICY "anonymous_response_insert" ON responses
  FOR INSERT WITH CHECK (is_anonymous = true AND user_id IS NULL);

-- responses: anonymous row updates scoped by response_id in session context
CREATE POLICY "own_response_update" ON responses
  FOR UPDATE USING (
    (is_anonymous = false AND auth.uid() = user_id)
    OR
    (is_anonymous = true AND id = current_setting('app.current_response_id', true)::uuid)
  );
```

**Trade-off:** The `response_id` must be held in a server-side session (httpOnly cookie) during multi-section form completion, not in localStorage (which a compromised tab could read). Use a short-lived signed cookie.

### Pattern 5: Analytics — Database Views + On-Demand Computation

**What:** Aggregate analytics (dimension scores, participation rates, trend deltas) are computed in the database as Postgres views or `SECURITY DEFINER` functions, not in application-layer JavaScript.

**Why not application-layer aggregation:** Moving hundreds of response rows to the application server to compute averages defeats the purpose of having a capable database. For 87 people and a few survey cycles, query time is negligible. The bigger win is correctness: the aggregation logic lives in one place (SQL) and can be tested independently.

**Recommended layering:**

| Layer | What Lives There | When to Use It |
|-------|-----------------|----------------|
| Postgres views | Stable aggregations: dimension scores, favorable/neutral/unfavorable splits, participation by dept | Always — these are the analytics API |
| `SECURITY DEFINER` functions | RLS-bypassing analytics that require cross-table joins for leadership (e.g., cross-department heatmap) | When normal RLS would block a legitimate leadership query |
| Materialized views | Cycle-over-cycle trend data that does not change after survey closes | After a survey cycle closes — refresh once, never again |
| Application layer (TypeScript) | Display formatting, chart data shaping, confidence indicator logic | Never for raw aggregation |
| `derived_metrics` table | Pre-computed snapshot of key scores per cycle, stored at publish time | Publication workflow — snapshot persists even if source data changes |

**derived_metrics refresh strategy:** Do NOT use Supabase Realtime to drive derived_metrics updates. Instead:
- Compute derived_metrics as a batch operation when a survey cycle closes (Server Action: `closeSurveyCycle`)
- Store the result in the `derived_metrics` table
- Dashboard queries read from `derived_metrics`, not from live aggregations over `response_answers`
- This keeps dashboards fast and makes the data immutable once published

### Pattern 6: Publication Snapshot — Immutable JSON Blobs

**What:** When leadership approves results for company-wide publication, a `publication_snapshots` row is created containing a JSON snapshot of all relevant analytics at that moment.

**Why immutable JSON blobs (not a separate tables approach):**
- A "separate tables" approach (e.g., `published_dimension_scores` mirroring `dimension_scores`) doubles your schema and migration surface
- JSON blobs are self-contained — a snapshot from 6 months ago remains readable even if the schema evolves
- Supabase Postgres supports `jsonb` with GIN indexes for querying if needed
- The snapshot is the source of truth for the public-facing "Open Results" page — it never reads live data

**Schema recommendation:**
```sql
CREATE TABLE publication_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_cycle_id uuid NOT NULL REFERENCES survey_cycles(id),
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  snapshot jsonb NOT NULL,  -- full analytics blob at time of publication
  schema_version integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- snapshot shape (enforced by app-layer Zod schema, not DB constraint):
-- {
--   schemaVersion: 1,
--   cycleId, cycleName, surveyPeriod,
--   participationRate, departmentParticipation: {...},
--   dimensionScores: [...],
--   topThemes: [...],
--   actionItems: [...],
--   privacyNotes: string
-- }
```

**Trade-off:** If the snapshot schema needs to evolve, old snapshots need a migration/normalization step. Mitigate by versioning the snapshot format: include a `schemaVersion: 1` field in the JSON blob from day one.

---

## Data Flow

### Survey Response Submission Flow

```
Employee Browser
    │
    │  1. Page load: RSC fetches survey structure + existing draft
    │     (createServerClient, RLS: user sees only their survey assignments)
    │
    ▼
SurveyForm (Client Component)
    │
    │  2. User fills section: autosave every 30s
    │     Server Action: saveDraft(surveyId, sectionId, answers)
    │     Upsert to response_answers (is_draft=true)
    │
    │  3. Anonymous mode: on first save
    │     Server Action: consumeParticipationToken(tokenId)
    │     Returns response_id, stored in httpOnly cookie
    │     token.used = true, response.user_id = NULL
    │
    │  4. Final section submit
    │     Server Action: submitResponse(surveyId)
    │     Validates all required questions answered (Zod)
    │     Sets response.status = 'submitted', response.submitted_at = now()
    │     revalidatePath('/survey/[surveyId]')
    │
    ▼
Supabase Postgres (RLS enforced at every step)
```

### Analytics Dashboard Load Flow

```
Leadership Browser
    │
    │  1. Request: /leadership/dashboard
    │     middleware checks session.user.app_metadata.role === 'leadership'
    │
    ▼
DashboardPage (RSC)
    │
    │  2. Parallel data fetches (Promise.all):
    │     - getOrgHealthScore(cycleId)       reads derived_metrics
    │     - getDimensionScores(cycleId)      reads DB view
    │     - getParticipationByDept(cycleId)  reads DB view
    │     - getActionItems(cycleId)          reads action_items table
    │
    ▼
Supabase Postgres
    │  (SECURITY DEFINER functions for cross-dept queries)
    │  (RLS: leadership role can read all departments)
    │
    ▼
Server Components render charts with data
    │
    ▼
Client Components (TrendChart, HeatmapChart)
    │  Recharts receives pre-shaped data props from server
    │  No client-side Supabase queries for initial load
```

### Publication Workflow Flow

```
Survey Analyst / Leadership
    │
    ▼
Admin: Review Results (RSC reads derived_metrics + open-text themes)
    │
    │  1. Server Action: createPublicationDraft(cycleId)
    │     Aggregates all analytics into snapshot JSON
    │     Creates publication_snapshots row (status='draft')
    │
    ▼
Leadership: Review Draft Snapshot
    │
    │  2. Server Action: publishSnapshot(snapshotId)
    │     Sets status='published'
    │     Snapshot is now immutable (no updates allowed via RLS)
    │
    ▼
Public "Open Results" page (/open)
    │  Reads ONLY from publication_snapshots WHERE status='published'
    │  No auth required, no live data, no user tracking
```

### State Management

There is no global client-side state store. State flows as follows:

```
Server (truth)
    │ RSC passes data as props
    ▼
Client Components (local state only)
    │ useActionState() receives Server Action results
    │ useState() holds form field values, UI state
    │ useOptimistic() handles optimistic UI on action submission
    ▼
Server Action mutates Supabase, calls revalidatePath()
    │
    ▼
Next.js cache invalidated, RSC re-renders with fresh data
```

No Zustand, Jotai, or Redux. For an internal tool at this scale, server-driven state via RSC + Server Actions + `revalidatePath` is sufficient and dramatically simpler.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-87 users (current) | Single Supabase project, no materialized views needed, sync queries fine |
| 87-200 users (target ceiling) | Add materialized views for cross-cycle trend data when cycle count exceeds 3; add `pg_cron` to refresh on schedule |
| 200-500 users | Enable Supabase connection pooler (pgBouncer) in transaction mode; add indexes on `response_answers(question_id, survey_cycle_id)` |
| 500+ users | Supabase read replicas for analytics queries; separate analytics DB (unlikely for this product) |

### Scaling Priorities

1. **First bottleneck (at ~200 people):** Analytics queries over `response_answers` slow down as response volume grows. Fix: materialize dimension score views after each cycle closes, indexed by `(cycle_id, dimension_id, department_id)`.
2. **Second bottleneck (at ~500 people):** Connection count — Next.js serverless functions create a new DB connection per request. Fix: enable Supabase connection pooler (pgBouncer) in Session mode for RSC, Transaction mode for Server Actions.

---

## Anti-Patterns

### Anti-Pattern 1: Storing role in the profiles table and checking it at the app layer only

**What people do:** Put `role` in a `profiles` table, fetch it in middleware via a DB query, use it for redirects.

**Why it's wrong:** (a) Middleware runs on every request — a DB round-trip per request is expensive and adds latency. (b) If the profiles query fails, the fallback must be "deny" but is often accidentally "allow." (c) App-layer role checks without RLS backing mean a determined user can call Server Actions directly without going through middleware.

**Do this instead:** Store role in `auth.users.app_metadata` (set only by service_role key — users cannot modify it). Middleware reads from `session.user.app_metadata.role` — zero DB queries. Back up all sensitive queries with RLS policies that check `auth.jwt() ->> 'role'` or a custom claim.

### Anti-Pattern 2: Using getSession() in Server Actions as the auth check

**What people do:** Call `getSession()` and trust the returned session to authorize mutations.

**Why it's wrong:** `getSession()` returns the locally stored session without revalidating with the Supabase auth server. The session could be expired, revoked, or tampered with (the JWT is not re-verified server-side by this call).

**Do this instead:** Use `supabase.auth.getUser()` in Server Actions. This makes a network call to the Supabase auth server to revalidate the token. Slightly slower, but correct for authorizing mutations.

```typescript
// WRONG
const { data: { session } } = await supabase.auth.getSession()
const userId = session?.user.id  // could be stale/invalid

// CORRECT for mutations
const { data: { user }, error } = await supabase.auth.getUser()
if (!user || error) return { error: 'Unauthorized' }
```

### Anti-Pattern 3: service_role key in the browser bundle

**What people do:** Use the `service_role` key in a client-side Supabase client to simplify RLS issues during development, or accidentally ship it in a `NEXT_PUBLIC_*` environment variable.

**Why it's wrong:** The service role key bypasses ALL RLS policies. If it reaches the browser, any user can read every row in every table.

**Do this instead:** The `service_role` key is used only in Server Actions or Route Handlers that legitimately need to bypass RLS (e.g., admin bulk operations, participation token assignment). It must never appear in any `NEXT_PUBLIC_*` environment variable.

### Anti-Pattern 4: Resolving anonymous identity via cross-table join in analytics

**What people do:** Join `responses` to `participation_tokens` to figure out which department an anonymous response came from, because `responses.user_id` is NULL.

**Why it's wrong:** This is exactly the deanonymization attack the token pattern is designed to prevent.

**Do this instead:** At the time of response creation, copy immutable segmentation metadata (department_id, tenure_band, role_type, work_type) directly into the `responses` row or a `response_metadata` row. This metadata is not linkable to identity — it is the aggregate dimension already. Never store or join on user_id for anonymous responses.

### Anti-Pattern 5: Realtime subscriptions for analytics dashboards

**What people do:** Subscribe to `response_answers` changes via Supabase Realtime to update dashboard charts live.

**Why it's wrong:** (a) RLS on Realtime is harder to reason about than on standard queries. (b) Surveys are not real-time collaborative tools — analytics are only meaningful at the aggregate level, which does not change meaningfully with each individual answer. (c) Realtime connections count against Supabase plan limits.

**Do this instead:** Dashboards poll (or revalidate on navigation) against `derived_metrics` which is batch-updated at cycle close. No Realtime subscriptions needed for analytics. Reserve Realtime for the participation tracking panel in the admin view (if desired) where showing a live participation count is genuinely useful.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` server/client factories | Role stored in `app_metadata`, not DB table |
| Supabase Postgres | Server-side queries only (RSC + Server Actions) | Never raw SQL from client; only via server-side client |
| Supabase Storage | Not used in v1 | May be added for CSV exports or attachments |
| Supabase Realtime | Admin participation monitor only (optional) | Not for analytics; avoids plan limit issues |
| AI Provider (future) | Pluggable interface — `lib/ai/provider.ts` adapter | Returns `ThemeSummary[]` — implementation swappable (OpenAI, Anthropic, etc.) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| RSC to Client Components | Props (serializable data only) | No function props unless wrapped as Server Actions |
| Client Component to Server | Server Actions (`"use server"` functions) | Use `useActionState` for loading/error state |
| Middleware to App | Cookie-based session, `app_metadata.role` | Middleware cannot share in-memory state with route handlers |
| Analytics layer to Response data | DB views and `derived_metrics` table | Application layer never aggregates raw response rows |
| Publication snapshot to Live data | Snapshot is a point-in-time copy | `/open` page reads ONLY from snapshots, never live tables |
| Admin to RLS bypass | `service_role` key in Server Actions only | Never in `NEXT_PUBLIC_*` vars |

---

## Build Order Implications

The architecture has clear dependency layers that determine build sequence:

```
Layer 1: Foundation
├── Supabase schema + RLS policies + seed data
├── Type generation (supabase gen types typescript)
├── @supabase/ssr client factories (server.ts, client.ts, middleware.ts)
└── middleware.ts auth + role routing

Layer 2: Auth Shell
├── Login / magic link pages (auth route group)
├── Role-based layout shells (each route group layout)
└── Role assignment flow (app_metadata.role set on profile creation)

Layer 3: Survey Engine (blocks all data collection)
├── Survey structure display (sections, questions, conditional visibility)
├── participation_tokens assignment
├── Survey form client component (autosave, section progress)
└── Response submission Server Action (anonymous + non-anonymous paths)

Layer 4: Analytics Foundation (blocks dashboards)
├── DB views for dimension scores, participation, favorable/neutral/unfavorable
├── derived_metrics computation (Server Action: closeSurveyCycle)
└── PrivacyGuard component (below-threshold suppression)

Layer 5: Dashboards (parallel once Layer 4 exists)
├── Leadership dashboard (reads views + derived_metrics)
├── Manager dashboard (privacy-gated team views)
└── Employee results view (participation status only)

Layer 6: Publication + Transparency
├── Publication snapshot creation workflow
├── Public /open page (reads from snapshots)
└── Action tracking UI

Layer 7: Admin Interfaces
├── Survey builder (CRUD on surveys/sections/questions)
├── Employee directory import
└── Privacy settings + cycle archival
```

**Key dependency constraint:** Layer 3 (Survey Engine) must be fully functional and RLS-correct before Layer 4 can be validated with real data. Do not build dashboards against mock data that does not exercise RLS — the analytics will appear correct but break against real anonymous responses.

---

## Sources

- Next.js 15 App Router docs — Server Actions, Route Groups, RSC patterns (official: nextjs.org/docs)
- Supabase `@supabase/ssr` docs — createServerClient, middleware session refresh (official: supabase.com/docs/guides/auth/server-side/nextjs)
- Supabase RLS patterns for anonymous data — participation_tokens approach derived from Supabase documentation on privacy-preserving response patterns
- Postgres `SECURITY DEFINER` functions for analytics — standard Postgres pattern for controlled RLS bypass in aggregate queries
- Next.js `useActionState` and `revalidatePath` patterns — Next.js 15 official docs

**Confidence notes:**
- `@supabase/ssr` createServerClient/createBrowserClient split: HIGH (official docs, stable since 2024)
- `cookies()` being async in Next.js 15: HIGH (Next.js 15 breaking change, well-documented)
- `getUser()` vs `getSession()` for Server Action auth: HIGH (official Supabase security guidance)
- `app_metadata.role` in middleware for zero-DB-query role checks: HIGH (established pattern)
- participation_tokens anonymity pattern: HIGH (logical derivation from Supabase RLS constraints; only correct approach given the privacy requirements)
- Materialized view strategy: MEDIUM (correct for the scale described; exact Supabase-specific `pg_cron` refresh behavior should be verified against current Supabase docs)

---
*Architecture research for: Internal organizational health survey platform*
*Researched: 2026-03-15*
