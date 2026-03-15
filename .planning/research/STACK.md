# Stack Research

**Domain:** Internal SaaS survey / organizational health analytics platform
**Researched:** 2026-03-15
**Confidence:** MEDIUM (training data cutoff August 2025; no live verification possible — see confidence notes per section)

---

## Recommended Stack

### Core Technologies (Non-Negotiable — Per PRD)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (App Router) | Full-stack React framework | PRD constraint. App Router enables server components, server actions, and middleware-based RLS enforcement. React 19 compat. |
| TypeScript | 5.x | Type safety | PRD constraint. Zod integration requires TS for full inference. |
| Tailwind CSS | 3.4.x | Utility-first styling | PRD constraint. Pairs well with shadcn/ui component primitives. |
| Supabase | latest JS SDK (`@supabase/supabase-js` ^2.x) | Postgres, Auth, RLS, Storage, Realtime | PRD constraint. Auth + RLS is the anonymity enforcement layer. |
| Zod | ^3.22 | Schema validation | PRD constraint. Use for all form inputs, server action payloads, and API responses. |

### Authentication

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `@supabase/ssr` | ^0.5.x | Supabase Auth in Next.js App Router (server components, middleware, route handlers) | HIGH |
| `@supabase/supabase-js` | ^2.x | Core Supabase client | HIGH |

**Decision: Use `@supabase/ssr`, NOT `@supabase/auth-helpers-nextjs`.**

`@supabase/auth-helpers-nextjs` is deprecated as of 2024. `@supabase/ssr` is the official replacement designed specifically for App Router. It exposes `createServerClient` (server components, route handlers, server actions) and `createBrowserClient` (client components), with cookie-based session management that works correctly in Next.js middleware for route protection.

Pattern: Middleware reads session cookie, redirects unauthenticated users server-side before any page renders. No client-only guards anywhere.

### Visualization / Charts

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| Recharts | ^2.12 | Bar charts, line charts, radar charts, pie charts for dimension scores and trend lines | HIGH |

**Decision: Recharts over Tremor, Nivo, and Chart.js.**

Rationale:
- **Recharts** is a React-native SVG library. It runs purely client-side (mark components `"use client"`), is composable, has excellent TypeScript types, and covers every chart type this platform needs: bar (dimension scores), line (trend over cycles), pie/donut (favorable/neutral/unfavorable distribution), and radar (org health overview). Version 2.x is stable and battle-tested.
- **Tremor** is a higher-level dashboard component library that wraps Recharts. As of 2024, Tremor v3+ changed significantly; the project is less actively maintained than its component library roots. Avoid: adds a heavy abstraction layer you don't control.
- **Nivo** produces beautiful charts but is heavily SVG/D3 dependent and has known SSR issues with Next.js App Router. It also ships a much larger bundle. Avoid unless you need canvas-based rendering at scale.
- **Chart.js** (via `react-chartjs-2`) is imperative/DOM-based, not React-native. It fights React's rendering model and has messy ref management in App Router. Avoid.

Confidence: HIGH for Recharts. The Tremor deprecation/pivot is MEDIUM confidence (based on community reports pre-August 2025).

### Form Handling

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| React Hook Form | ^7.51 | Multi-step survey form state, validation feedback, draft autosave coordination | HIGH |
| `@hookform/resolvers` | ^3.x | Connects RHF to Zod schemas | HIGH |

**Decision: React Hook Form + Zod resolvers for survey forms. Server Actions for simple admin mutations.**

Rationale:
- The survey form is the most complex UI surface: multi-step (section-by-section), conditional visibility, autosave, required/optional per question. React Hook Form manages all of this without a re-render on every keystroke.
- Server Actions alone are not sufficient for the survey UI: you need client-side field validation before submit, progress tracking, and autosave on blur/change. RHF handles this; server actions handle the actual submission.
- For simple admin forms (creating an action item, updating a status field), server actions with Zod validation are fine without RHF — keep them simple.
- Hybrid pattern: RHF manages client state, `handleSubmit` calls a server action (or fetch) as the submit handler.

### Data Tables

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| TanStack Table | ^8.17 (via `@tanstack/react-table`) | Leadership dashboard data grid, employee directory, action items table | HIGH |

**Decision: TanStack Table, not plain HTML tables.**

Rationale:
- The platform has multiple data-heavy views: dimension scores by department/role/tenure, employee lists, action item tracking. These need sorting, filtering, pagination, and row selection.
- TanStack Table v8 is headless (bring your own markup/Tailwind), TypeScript-first, and composes cleanly with shadcn/ui table primitives.
- Plain HTML tables will accumulate sorting/filtering hacks. TanStack Table is the de facto standard for complex tables in React as of 2025.

### Date Handling

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `date-fns` | ^3.6 | Survey cycle date formatting, tenure band calculations, action item due dates | HIGH |

**Decision: date-fns over dayjs.**

Rationale:
- `date-fns` v3 is tree-shakeable (import only what you use), immutable (no mutation bugs), and TypeScript-native. It handles `Date` objects directly — which matters because Supabase returns `Date` objects from Postgres timestamp columns.
- `dayjs` is smaller (~2KB) but uses mutable API patterns that are footguns in complex data pipelines. Its TypeScript support requires manual plugin extension.
- You will use `formatDistanceToNow`, `differenceInDays`, and `isWithinInterval` extensively for tenure bands and cycle tracking — all available in date-fns with full type inference.

### State Management

| Approach | Use Case | Confidence |
|----------|----------|------------|
| URL state (`useSearchParams` / `nuqs`) | Dashboard filters (department, role, tenure, cycle) | HIGH |
| React Context | Auth session passed to client tree | MEDIUM |
| Zustand | Survey form progress (current section, draft answers) | HIGH |
| Server component data (no client state) | All read-only analytics views | HIGH |

**Decision: URL state first, Zustand for survey form, no global client state store otherwise.**

Rationale:
- **URL state** for all dashboard filters is critical: managers/leaders need to share filtered views via link, and browser back works correctly. Use `nuqs` (^1.x) for type-safe URL search param management in App Router — it handles the `useSearchParams` Suspense boundary requirement automatically.
- **Zustand** (^4.5) for survey form progress only: multi-step section state, current answer drafts, completion percentage. This is the one place with genuinely complex ephemeral client state. Zustand is minimal (< 1KB), no provider needed, TypeScript-native.
- **React Context** only for auth session, which changes infrequently.
- **Avoid Jotai** here: atom-per-field patterns add indirection without benefit for a known, bounded form model.
- **Avoid Redux Toolkit**: overkill for this scale (87 users, single-company). The complexity cost is not justified.

### ORM / Database Layer

| Approach | Purpose | Confidence |
|----------|---------|------------|
| Supabase JS client (typed) + generated types | Primary data access — RLS-enforced queries | HIGH |
| `supabase gen types typescript` | Generate TypeScript types from Postgres schema | HIGH |

**Decision: Raw Supabase client with generated types. No ORM (no Drizzle, no Prisma).**

Rationale:
- This project's core security guarantee is RLS enforcement at the Postgres level. An ORM adds an abstraction layer between your code and Postgres that can bypass RLS if you use the service role key incorrectly, or obscure which policies apply.
- The Supabase JS client with `gen types` gives you full TypeScript safety on table shapes, and the query builder is expressive enough for the analytics queries needed (aggregates, joins, window functions via RPC/database functions).
- Complex analytics queries (dimension score aggregates, cross-tab by department/role) should live in Postgres functions (RPC), not be assembled in application code via ORM chaining. This keeps heavy computation at the DB layer and makes RLS reasoning clearer.
- **Drizzle** is an excellent choice for Postgres-first apps that need ORM ergonomics, but it does not have native Supabase RLS awareness. You would need to carefully manage which client (anon key vs service key) you use per query. Given that RLS is the anonymity enforcement mechanism, this is a risk surface not worth introducing.
- **Prisma** has poor Supabase compatibility (connection pooling friction with PgBouncer, no native RLS support, slow cold starts in serverless).

### UI Component Library

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| shadcn/ui | latest (not versioned — copy-paste model) | Form inputs, buttons, dialogs, tabs, badges, progress, cards | HIGH |
| Radix UI primitives | ^1.x (shadcn/ui dep) | Accessible base components | HIGH |
| Lucide React | ^0.400+ | Icon set | HIGH |

**Decision: shadcn/ui as component foundation.**

Rationale:
- shadcn/ui is not a dependency — it is a code generator that copies accessible Radix UI + Tailwind components into your project. You own the code.
- Perfect for this platform: you need accessible form controls (Likert scale inputs, multi-select, dropdowns), modal dialogs (survey preview, action item detail), and data display cards. All available as shadcn/ui components.
- Fully Tailwind-native, no CSS-in-JS, no style override fights.
- Works with App Router with no "use client" boundary issues.

### Email

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| Resend | ^3.x | Transactional email (magic link delivery, survey open/close notifications, action item reminders) | MEDIUM |
| React Email | ^2.x | Email template rendering | MEDIUM |

**Decision: Resend + React Email if supplementing Supabase's built-in email.**

Rationale:
- Supabase Auth handles magic link sending via its built-in email provider (SMTP). For a small internal deployment (87 users), Supabase's default email provider may be sufficient for v1 — no additional email service needed until you need custom templates or reliable delivery SLAs.
- If you need custom email templates (survey open/close notifications, weekly digest, action item reminders beyond auth), use Resend. It has an official Next.js App Router integration and React Email for component-based templates.
- **Avoid SendGrid** for a project of this scale: higher setup overhead, worse DX for transactional emails, no React-native template system.
- v1 recommendation: rely on Supabase email for auth, add Resend only when non-auth notification emails are needed.

### Testing

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| Vitest | ^1.6 | Unit and integration tests | HIGH |
| `@testing-library/react` | ^16.x | Component tests | HIGH |
| Playwright | ^1.44 | End-to-end tests | HIGH |

**Decision: Vitest + Testing Library + Playwright. Not Jest, not Cypress.**

Rationale:
- **Vitest** is the correct choice for a Next.js + TypeScript project in 2025. It is Jest-compatible (same API, can import existing Jest matchers), but uses Vite's transformer — meaning it handles TypeScript, JSX, and ESM natively without `ts-jest` configuration. Jest + Next.js requires `jest.config.mjs` dance with `@jest/globals` and SWC transforms that break frequently.
- **Playwright** over Cypress because: (1) Playwright is multi-browser by default (Chromium, Firefox, WebKit); (2) it handles authenticated test sessions via `storageState` — critical for testing role-based dashboard access; (3) no Electron dependency; (4) better async handling. The survey flow, anonymous submission, and role-based access restrictions are all Playwright test candidates.
- Test priority for this project: Playwright E2E for the survey submission flow and RLS boundary enforcement. Vitest unit tests for Zod schemas, score calculation functions, and privacy threshold logic.

---

## Installation

```bash
# Core (non-negotiable per PRD)
npm install next@15 react@19 react-dom@19 typescript tailwindcss @supabase/supabase-js @supabase/ssr zod

# UI Components
npx shadcn@latest init
npm install lucide-react

# Charts
npm install recharts

# Forms
npm install react-hook-form @hookform/resolvers

# Tables
npm install @tanstack/react-table

# Dates
npm install date-fns

# State
npm install zustand nuqs

# Email (deferred to Phase 2+)
npm install resend react-email @react-email/components

# Dev dependencies
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @playwright/test

# Supabase CLI (local development + migrations)
npm install -D supabase
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not / When Alternative is Better |
|-------------|-------------|--------------------------------------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Deprecated. Never use. |
| Recharts | Tremor | Tremor wraps Recharts and adds instability. Use if you want pre-built dashboard card components and accept less control. |
| Recharts | Nivo | Better aesthetics, worse App Router compatibility. Use if you need canvas rendering or complex graph layouts (force-directed, etc.). |
| Recharts | Chart.js | Chart.js is imperative/DOM-based. Only use if you have a chart type Recharts doesn't support (e.g., mixed scale scatter). |
| date-fns | dayjs | dayjs if bundle size is critical (2KB vs 35KB). For this app, tree-shaking date-fns gives similar results; prefer the immutable API. |
| Zustand | Jotai | Jotai if you have many fine-grained independent atoms. Survey form is bounded and cohesive — Zustand's single store slice is cleaner. |
| Zustand | Redux Toolkit | RTK if you need dev tools + time-travel debugging + team familiarity. Overkill for 87-user internal app. |
| TanStack Table | ag-Grid | ag-Grid for Excel-like spreadsheet features (inline editing, complex cell types). This app needs display tables, not editable grids. |
| Supabase client + types | Drizzle | Drizzle if you need complex query composition without SQL. Risk: can obscure RLS enforcement. Use only if you carefully constrain to anon key only. |
| Supabase client + types | Prisma | Prisma has PgBouncer/Supabase connection pooling issues and slow cold starts. Avoid. |
| Vitest | Jest | Jest if existing team has deep Jest expertise and doesn't want to change. Vitest is a drop-in replacement with better Next.js compatibility. |
| Playwright | Cypress | Cypress if team already has extensive Cypress suites. Playwright is better for auth flow testing (storageState) which this app needs extensively. |
| Resend | SendGrid | SendGrid for high-volume transactional email (> 10k/day) or marketing email. Not needed here. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Officially deprecated; diverges from App Router patterns | `@supabase/ssr` |
| Prisma | Supabase + PgBouncer connection pooling friction, slow serverless cold starts, no native RLS awareness | Raw Supabase client with generated types |
| Chart.js / react-chartjs-2 | Imperative DOM API, bad React integration, ref management nightmares in App Router | Recharts |
| Tremor v3+ | Changed scope/stability mid-development; wraps Recharts with less flexibility | Recharts directly |
| Redux Toolkit | Massively over-engineered for this scale; adds boilerplate with no benefit | Zustand for client state, URL state for filters |
| `next-auth` / Auth.js | Redundant with Supabase Auth; creates two auth systems | `@supabase/ssr` with Supabase Auth only |
| `react-query` / TanStack Query | Supabase client with server components + server actions handles data fetching at the right layer; TanStack Query adds a caching layer that fights RSC | Next.js server components for reads, server actions for writes |
| Cypress | Electron dependency, slower execution, weaker multi-browser support, harder auth flow simulation | Playwright |
| any `moment.js` | Deprecated, mutable, large bundle | date-fns |

---

## Stack Patterns by Variant

**For analytics read views (leadership dashboard, manager dashboard):**
- Use React Server Components — fetch Supabase data server-side with the user's session cookie
- No client-side data fetching library needed
- Pass data as props to `"use client"` Recharts components

**For the survey form (multi-step, autosave):**
- Use `"use client"` boundary at the survey shell component
- React Hook Form + Zod for field management
- Zustand for cross-section progress state
- Server action for draft save (debounced) and final submission

**For dashboard filter state:**
- URL search params via `nuqs` — makes filtered views shareable and browser-history-aware
- `nuqs` handles the App Router Suspense boundary requirement for `useSearchParams`

**For privacy-sensitive admin queries:**
- Always use the Supabase server client (cookie-based session, never the service key in client code)
- Service role key only in server actions/route handlers for specific admin operations that must bypass RLS (e.g., seeding roster)
- Document every service key usage explicitly in code comments

---

## Version Compatibility Notes

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15 | React 19 | App Router stable; Server Actions stable |
| `@supabase/ssr` ^0.5 | Next.js 15 | Uses `cookies()` from `next/headers` — async in Next.js 15 (must `await cookies()`) |
| React Hook Form ^7.51 | React 19 | Compatible; `useFormState` renamed to `useActionState` in React 19 — use RHF's own state, not React's |
| Recharts ^2.12 | React 18/19 | Mark all Recharts components `"use client"`. No SSR rendering. |
| TanStack Table ^8.17 | React 18/19 | Headless, no SSR issues — use client rendering only for interactive table features |
| `nuqs` ^1.x | Next.js 15 | Full App Router support including Suspense wrapping |
| Vitest ^1.6 | Next.js 15 | Requires `@vitejs/plugin-react` and `next/jest` config OR separate vitest config (separate is cleaner) |
| shadcn/ui | Next.js 15, React 19 | Use `npx shadcn@latest` — older `shadcn-ui` CLI is deprecated |

**Critical note for Next.js 15:** `cookies()`, `headers()`, and `params` are now async. Any `@supabase/ssr` setup guides written for Next.js 14 will need `await` added to `cookies()` calls. This is a breaking change from Next.js 14.

---

## Sources

All findings are based on training knowledge (cutoff August 2025). No live verification was possible (WebSearch, WebFetch, and Context7 unavailable in this session).

| Topic | Confidence | Basis |
|-------|------------|-------|
| `@supabase/ssr` recommendation | HIGH | Supabase officially deprecated `auth-helpers-nextjs` in 2024; `@supabase/ssr` was the stated replacement |
| Recharts compatibility | HIGH | Stable library with no known App Router incompatibilities as of mid-2025 |
| Tremor deprecation/pivot | MEDIUM | Community reports pre-August 2025 — verify current Tremor project status before dismissing |
| React Hook Form v7 + React 19 | HIGH | RHF v7.51+ added React 19 compatibility |
| TanStack Table v8 | HIGH | Headless, React-native, no SSR issues |
| date-fns v3 | HIGH | v3 released early 2024, tree-shakeable, immutable |
| Zustand v4 | HIGH | Stable, widely adopted, no provider pattern |
| nuqs v1 | HIGH | Explicitly built for App Router `useSearchParams` Suspense requirement |
| Playwright over Cypress | HIGH | Playwright has had better auth flow testing (storageState) and multi-browser since v1.20+ |
| Vitest over Jest | HIGH | Community consensus for Vite-based/Next.js TypeScript projects throughout 2024-2025 |
| No Prisma recommendation | HIGH | Supabase + Prisma connection pooling friction is well-documented |
| Resend + React Email | MEDIUM | Resend was growing rapidly; verify current pricing/reliability for internal use |

**Flags requiring verification before coding:**
1. Confirm `@supabase/ssr` current version and Next.js 15 async `cookies()` compatibility examples in official Supabase docs
2. Confirm `nuqs` latest version supports Next.js 15 App Router fully
3. Confirm Recharts ^2.12 has no React 19 peer dependency warnings
4. Verify shadcn/ui CLI command (`npx shadcn@latest` vs `npx shadcn-ui@latest`) — CLI was renamed

---

*Stack research for: Internal organizational health survey SaaS platform*
*Researched: 2026-03-15*
