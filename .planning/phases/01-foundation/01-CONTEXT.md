# Phase 1: Foundation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a secure, deployable Next.js 15 App Router scaffold with working authentication, role-based routing middleware, and a complete privacy-correct Supabase database schema — including all migrations, RLS policies, seed data, and DX setup. No feature UI beyond login and stub dashboard shells. This is the foundation every subsequent phase builds on without risk of anonymity-breaking schema migrations.

</domain>

<decisions>
## Implementation Decisions

### Project Scaffold

- Next.js 15 with App Router, `src/` directory layout, TypeScript strict mode
- Tailwind CSS v3; no component library in Phase 1 — add UI primitives as needed
- Route groups: `(auth)` login/magic-link, `(employee)` survey flow, `(manager)` manager views, `(leadership)` leadership views, `(admin)` admin tools
- Package manager: pnpm
- Env: `.env.local` for development, `.env.example` committed to repo

### Auth Implementation

- Library: `@supabase/ssr` — not the deprecated `auth-helpers-nextjs`
- Methods: Email + password AND magic link (passwordless) — both enabled in v1
- Domain restriction: enforced server-side in the sign-up Server Action (check email domain against `ALLOWED_EMAIL_DOMAIN` env var); also set in Supabase dashboard as a backup
- Session: cookie-based via `@supabase/ssr`; `await cookies()` required (Next.js 15 breaking change — cookies() is async)
- Role storage: `app_metadata.role` set via service role client on user creation/import; middleware reads role from JWT claim — zero DB queries in middleware
- Role values: `employee | manager | leadership | admin | hr_admin | survey_analyst`

### Database Schema

All tables in `public` schema. Migrations in `supabase/migrations/` as numbered SQL files.

**Core tables:**
- `profiles` — (id UUID FK auth.users, full_name, email, department_id, role_id, team_id, tenure_band, work_type, is_active, created_at)
- `departments` — (id, name, slug, parent_id nullable, created_at)
- `teams` — (id, name, department_id, manager_id nullable, created_at)
- `roles` — lookup table for job roles (id, name, slug) — separate from RBAC roles in app_metadata

**Survey structure:**
- `surveys` — (id, title, description, status enum[draft|scheduled|open|closed], anonymous_mode bool, opens_at, closes_at, version int, created_by, created_at)
- `survey_sections` — (id, survey_id, title, description, display_order, target_roles text[], created_at)
- `questions` — stable IDs across cycles; (id, survey_section_id, type enum[likert_5|likert_10|single_select|multi_select|short_text|long_text], text, description, required bool, display_order, conditional_config jsonb, created_at)
- `question_options` — (id, question_id, text, value, display_order)

**Dimension model:**
- `dimensions` — (id, name, slug, description, created_at)
- `question_dimension_map` — (question_id, dimension_id, weight numeric default 1.0)

**Response collection — anonymity-critical design:**
- `participation_tokens` — WHO responded: (id, survey_id, user_id, submitted_at, department_id, role_id, tenure_band, created_at). No column linking to response content.
- `responses` — WHAT was responded: (id, survey_id, submitted_at, department text, role text, tenure_band text, work_type text, is_anonymous bool, user_id UUID nullable). `user_id` is NULL for anonymous surveys; populated only for non-anonymous follow-up surveys. No FK to participation_tokens.
- `response_answers` — (id, response_id, question_id, numeric_value, text_value, selected_options jsonb, created_at)
- `response_drafts` — autosave only, deleted on submission: (id, survey_id, user_id, section_progress jsonb, answers_draft jsonb, last_saved_at)
- `response_metadata` — (response_id, segmentation_snapshot jsonb) — point-in-time copy of profile data at submission

**Analytics & output:**
- `derived_metrics` — pre-computed aggregates refreshed on survey close: (id, survey_id, dimension_id nullable, segment_type text, segment_value text, avg_score numeric, favorable_pct numeric, neutral_pct numeric, unfavorable_pct numeric, respondent_count int, computed_at)
- `qualitative_tags` — (id, response_answer_id, tag text, created_by, created_at)
- `qualitative_themes` — (id, survey_id, theme text, tag_cluster text[], summary text, is_positive bool, created_at)

**Actions & publication:**
- `action_items` — (id, survey_id nullable, title, problem_statement, owner_id, department_id, priority enum[low|medium|high|critical], target_date, status enum[identified|planned|in_progress|blocked|completed], success_criteria, is_public bool, created_at)
- `action_updates` — (id, action_item_id, content, created_by, created_at)
- `publication_snapshots` — immutable JSONB blob: (id, survey_id, snapshot_data jsonb, published_by, published_at). No UPDATE ever allowed.

**Infrastructure:**
- `audit_logs` — (id, actor_id, action text, table_name text, record_id uuid, before_data jsonb, after_data jsonb, created_at)
- `app_settings` — (key text PK, value jsonb, updated_at) — configurable: `privacy_threshold_numeric` (default 5), `privacy_threshold_text` (default 10), `allowed_email_domain`

### RLS Policy Design

- Role check pattern: `auth.jwt()->'app_metadata'->>'role'` — NEVER query `profiles` inside a policy (prevents infinite recursion)
- Helper: Create `public.current_user_role()` SECURITY DEFINER function returning the JWT role claim — used in all policies
- Anonymous responses: `responses` and `response_answers` have no SELECT policy for individual rows — all analytics access goes through SECURITY DEFINER aggregate views
- Participation/response decoupling: no policy enables joining `participation_tokens` to `responses` — they share only `survey_id`, which is insufficient to reconstruct identity
- Service role: admin operations (roster import, derived_metrics refresh, user role assignment) use service role client with `import 'server-only'`

**Key policies:**
| Table | employee | manager | leadership/admin |
|-------|----------|---------|-----------------|
| `profiles` | SELECT own | SELECT team | SELECT all |
| `surveys` | SELECT open | SELECT open | SELECT/INSERT/UPDATE all |
| `response_drafts` | CRUD own | — | SELECT all (admin) |
| `participation_tokens` | INSERT own, SELECT own | SELECT team tokens by survey | SELECT all by survey |
| `responses` | INSERT own non-anon | — | No direct SELECT — views only |
| `response_answers` | INSERT own | — | No direct SELECT — views only |
| `action_items` | SELECT is_public=true | SELECT team+public | CRUD all |
| `publication_snapshots` | SELECT all | SELECT all | INSERT (leadership/admin) |

### Folder & File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── magic-link/page.tsx
│   ├── (employee)/
│   │   └── dashboard/page.tsx          # stub — "Welcome, your surveys are loading"
│   ├── (manager)/
│   │   └── dashboard/page.tsx          # stub
│   ├── (leadership)/
│   │   └── dashboard/page.tsx          # stub
│   ├── (admin)/
│   │   └── page.tsx                    # stub
│   └── layout.tsx                      # root layout with Supabase provider
├── components/
│   └── ui/                             # Button, Input, Label primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient
│   │   ├── server.ts                   # createServerClient (RSC/Server Actions)
│   │   ├── middleware.ts               # createServerClient (middleware cookie store)
│   │   ├── admin.ts                    # service role client — import 'server-only'
│   │   └── database.types.ts          # generated by supabase gen types
│   ├── actions/
│   │   └── auth.ts                     # signIn, signInWithMagicLink, signOut
│   ├── validations/
│   │   └── auth.ts                     # Zod schemas for auth forms
│   └── constants/
│       └── roles.ts                    # AppRole type + role constants
└── middleware.ts                       # auth check + role-based route protection
supabase/
├── migrations/
│   ├── 20260315000001_schema.sql       # all table definitions + enums
│   ├── 20260315000002_rls.sql          # all RLS policies + helper functions
│   ├── 20260315000003_views.sql        # analytics views + SECURITY DEFINER functions
│   └── 20260315000004_seed.sql        # dimensions, sample employees, diagnostic survey
└── config.toml
```

### Seed Data

- **Departments (5)**: engineering, qa, sales/business, hr-operations, leadership
- **Employees (18)**: covering all 6 RBAC roles and all tenure bands (0-6m, 6-12m, 1-2y, 2-5y, 5y+), realistic names/emails at `@acme.dev`
- **Dimensions (12)**: all org health dimensions pre-loaded with slugs and descriptions
- **Diagnostic survey**: 1 survey in `draft` status, 13 sections, ~65 questions with dimension mappings — ready to be opened in Phase 2
- **Action items (3)**: sample items in identified/in_progress/completed statuses for Phase 4 testing
- **Script**: `supabase/migrations/20260315000004_seed.sql` — runs via `supabase db reset`

### Claude's Discretion

- Specific Tailwind color palette and spacing scale choices
- Exact login page field layout and spacing
- Loading state implementation (skeleton vs spinner) for auth
- Exact error message copy for domain restriction failures
- B-tree index strategy (Claude should add indexes on all FK columns + frequently-queried columns like `survey_id`, `status`, `is_public`)
- Whether to use `nuqs` for URL state (not needed until Phase 3 — defer)

</decisions>

<specifics>
## Specific Ideas

- Auth domain restriction should feel like a helpful error, not a security warning: "This app is for [company] employees. Please use your company email to sign in."
- Dashboard stubs should show the user's name and role so the routing is visually verifiable during development
- The `participation_tokens` / `responses` structural decoupling is the core privacy invariant — comments in migration SQL should explain why this design exists

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- None — greenfield project. Phase 1 creates the foundation that all subsequent phases reuse.

### Established Patterns

- None yet — Phase 1 establishes the patterns:
  - `@supabase/ssr` three-client pattern (browser/server/middleware) becomes the standard for all DB access
  - Server Actions + Zod validation becomes the mutation pattern for all subsequent phases
  - `current_user_role()` JWT helper becomes the standard for all RLS policies

### Integration Points

- `middleware.ts` is the single entry point for all route protection — all phases add routes that this middleware must cover
- `supabase/migrations/` is append-only — subsequent phases add new migration files, never edit existing ones
- `database.types.ts` is regenerated after each migration — all phases import from this file

</code_context>

<deferred>
## Deferred Ideas

- Supabase Realtime for live participation rate updates — Phase 3 consideration
- `nuqs` for URL-based filter state in dashboards — Phase 3
- Email notifications (survey open, reminder) — v2 feature
- SSO/SAML — explicitly out of scope for v1
- eNPS question type (0–10 scale) — v2 feature

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-15*
