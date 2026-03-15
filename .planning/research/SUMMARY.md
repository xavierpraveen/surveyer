# Project Research Summary

**Project:** Surveyer — Internal Organizational Health Survey Platform
**Domain:** Employee survey SaaS with privacy-first anonymous response collection and transparent results publishing
**Researched:** 2026-03-15
**Confidence:** MEDIUM-HIGH (stack and architecture HIGH; features and pitfall UX patterns MEDIUM)

## Executive Summary

This is an internal organizational health survey platform for an ~87-person consulting firm, built on Next.js 15 App Router and Supabase. The domain is well-understood — Culture Amp, Lattice, Glint, and Leapsome have established the feature baseline — but this platform has a distinct differentiator: employees see the same aggregated results that leadership sees, and action items are publicly linked to survey outcomes. This transparency-first model is absent from all major competitors and is the core value proposition. Everything in the architecture must serve this goal while preserving credible anonymity.

The recommended approach is a Supabase-first stack where Row Level Security at the database level — not application-layer checks — enforces anonymity and role-based access. The participation token pattern (a separate table tracking who responded, decoupled from what they responded) is the foundational privacy mechanism that all other features depend on. Analytics live in Postgres views and a `derived_metrics` table, not in application-layer JavaScript. Publication happens via immutable JSONB snapshots. The public `/open` results page reads only from these snapshots and never from live data.

The primary risks are architectural: any shortcut that stores a user identifier on the responses table — even for autosave convenience — permanently destroys anonymity and requires a data migration to fix. Service role key exposure, RLS policy recursion, and small-group inference attacks via filter stacking are equally hard to recover from once data collection begins. The correct approach is to treat the data model and RLS policies as production-critical infrastructure built and locked down before any UI code is written.

## Key Findings

### Recommended Stack

The stack is constrained by the PRD (Next.js 15, TypeScript, Tailwind, Supabase, Zod) and those constraints are well-chosen. The primary decisions beyond the PRD are: `@supabase/ssr` (not the deprecated `auth-helpers-nextjs`) for App Router auth; Recharts for charts (not Tremor or Nivo); React Hook Form + Zod resolvers for the multi-step survey form; TanStack Table for data-heavy admin views; and `nuqs` for URL-state dashboard filters. There is no ORM — the raw Supabase JS client with generated types is the right choice because any ORM layer risks obscuring which RLS policies apply. See `.planning/research/STACK.md` for full rationale and alternatives considered.

**Core technologies:**
- **Next.js 15 App Router + `@supabase/ssr`**: Server components for analytics reads, server actions for all mutations, middleware for role-based routing with zero DB queries (role from JWT `app_metadata`)
- **Supabase (Postgres + Auth + RLS)**: The security enforcement layer; RLS policies are the final authorization gate, not the application layer
- **React Hook Form + Zod**: Multi-step survey form management with autosave; Zod schemas shared between server actions and client validation
- **Recharts**: All chart types needed (bar, line, radar, pie/donut); React-native SVG, no SSR issues
- **TanStack Table v8**: Headless, TypeScript-first data tables for admin and leadership views
- **Zustand + nuqs**: Zustand for survey form cross-section progress state only; nuqs for shareable URL-based dashboard filters
- **Vitest + Playwright**: Vitest for unit/integration tests on Zod schemas and score logic; Playwright for E2E on survey submission flow and RLS boundary enforcement

**Critical version note:** Next.js 15 makes `cookies()`, `headers()`, and `params` async. All `@supabase/ssr` setup must `await cookies()`. Any guide written for Next.js 14 will need updating.

### Expected Features

The feature set is well-defined by industry standards. The platform must meet the table stakes that all competitors provide, while delivering three differentiators that no existing competitor has: employee-visible results pages, immutable published snapshots, and action items visible on the same transparency page as results. See `.planning/research/FEATURES.md` for full competitor analysis and dependency graph.

**Must have (table stakes — v1):**
- Anonymous response mode with participation token pattern (credible anonymity is the trust foundation)
- Privacy threshold enforcement (n=5 minimum before showing aggregates — DB-enforced, not UI-only)
- Survey builder: sections, ordered questions, Likert 1-5/1-10, single-select, multi-select, short/long text
- Survey lifecycle: draft → scheduled → open → closed
- 12-dimension organizational diagnostic model with question-to-dimension mapping
- Score aggregation: mean + favorable/neutral/unfavorable bucketing per dimension
- RBAC: employee, manager, leadership, admin, hr_admin, survey_analyst roles
- Leadership dashboard: org health score, dimension scores, participation, heatmap
- Public internal results page: company-wide dimension scores — the core differentiator
- Action items linked to survey cycle + dimension with owner, status, priority, target date
- Immutable publication snapshot workflow
- Participation rate by department (decoupled from individual identity)
- Email reminders for survey completion
- Role-targeted question sections per department

**Should have (differentiators — v1.x after first cycle):**
- Trend analysis / cycle delta (requires 2 cycles of data)
- Manager dashboard (privacy-gated team views; requires validated org hierarchy)
- Tenure band segmentation
- eNPS question and scoring
- CSV/PDF export
- Confidence indicators on low-sample scores

**Defer (v2+):**
- Pluggable AI text summarization (provider interface designed in v1, implementation deferred)
- Manager chain / org hierarchy analytics (high maintenance cost for org chart accuracy)
- Conditional question visibility
- Multi-cycle longitudinal reporting
- Action item progress log (OKR-style timestamped updates)

**Anti-features to reject:** Individual response attribution, continuous pulse surveys, real-time live response dashboards, external benchmarking, per-response device fingerprinting.

### Architecture Approach

The architecture is a layered system where trust flows inward: browser client components make no direct Supabase calls for sensitive data; all reads go through React Server Components with `createServerClient`; all mutations go through Server Actions validated with Zod and authorized with `getUser()` (not `getSession()`); and every query is ultimately gated by RLS policies that enforce anonymity and role-based access at the Postgres level. Analytics live in DB views and a `derived_metrics` table computed at cycle close — dashboards never aggregate raw `response_answers` at query time. See `.planning/research/ARCHITECTURE.md` for full patterns, code examples, and build order.

**Major components:**
1. **`middleware.ts`** — Auth cookie refresh + role-based redirect; reads role from `session.user.app_metadata.role` (zero DB round-trips)
2. **Survey Engine** — Participation token consumption, multi-section form with autosave to `response_drafts`, anonymous response submission (no user_id on `responses` table)
3. **Analytics Layer** — Postgres views + `SECURITY DEFINER` functions + `derived_metrics` table; PrivacyGuard component suppresses below-threshold data at every render boundary
4. **Publication Workflow** — Immutable JSONB snapshot created atomically (survey must be closed first) at publish time; `/open` page reads only from snapshots
5. **Role-scoped Route Groups** — `(employee)`, `(manager)`, `(leadership)`, `(admin)` route groups with distinct layouts; middleware enforces role gates before any RSC renders
6. **Admin Interface** — Survey builder, employee roster import, participation management, cycle archival

### Critical Pitfalls

Ten pitfalls are documented in detail in `.planning/research/PITFALLS.md`. The five that are unrecoverable without data migration or trust destruction:

1. **Anonymity leak via `user_id` on responses** — Storing any user identifier on `responses` or `response_answers` (even for autosave) permanently destroys anonymity. Prevent by using a separate `response_drafts` table for in-progress work, deleted after final submission. Enforce with RLS: the INSERT policy on `responses` must never write `auth.uid()` into a column.

2. **Service role key in the client bundle** — The service role key bypasses all RLS. Create `lib/supabase/admin.ts` with `import 'server-only'` at the top to get build-time errors if it leaks into client components. Never use `NEXT_PUBLIC_` prefix for this key. Audit post-build: `grep -r "service_role" .next/`.

3. **Small-group inference via filter stacking** — The n=5 threshold check on a single filter dimension is insufficient. A manager applying department + tenure band + role simultaneously can narrow to 1-2 people even when each dimension alone has >5 respondents. The analytics API must check the final filtered count and return `below_threshold: true` at every combination. Limit simultaneous filter depth to 2 without analyst override.

4. **RLS infinite recursion on `profiles` table** — A policy on `profiles` that queries `profiles` to check the current user's role recurses infinitely. Store role in `auth.users.app_metadata` (set via service role key only); read from `auth.jwt() ->> 'role'` in policies — no table lookup needed.

5. **Publication snapshot race condition** — Snapshot reads from live tables across multiple queries; a concurrent response submission between reads produces an inconsistent snapshot. Require survey `status = 'closed'` as a hard prerequisite before snapshot creation, and wrap the entire aggregation in a `REPEATABLE READ` Postgres transaction or a single stored procedure.

## Implications for Roadmap

The architecture's own build order (documented in ARCHITECTURE.md) maps directly to a phase structure. Each layer strictly depends on the previous. Do not build dashboards against mock data — the anonymity mechanics must be real and RLS-correct before any analytics code is written.

### Phase 1: Foundation and Auth
**Rationale:** Everything else depends on this. The Supabase schema, RLS policies, type generation, and `@supabase/ssr` client factories must exist before a single UI component can query real data. Role assignment in `app_metadata` must be locked down before any route protection is meaningful. This phase has no UI deliverable other than the login/magic-link pages.
**Delivers:** Working auth with role-based middleware routing; all DB tables with RLS policies; generated TypeScript types; `createServerClient` / `createBrowserClient` factories; domain restriction in a Supabase Auth hook (not just UI redirect)
**Addresses:** RBAC setup, role-based routing
**Avoids:** RLS infinite recursion (Pitfall 2), service role key exposure (Pitfall 3), RLS policy performance degradation (Pitfall 8)

### Phase 2: Survey Engine (Core Data Collection)
**Rationale:** This is the critical path. Without working anonymous response submission, no data exists to analyze. The participation token pattern, `response_drafts` table, and anonymous submission server action must be built and verified with an anonymity audit query before any UI proceeds. The survey builder (admin interface for creating surveys) must also exist to create test surveys.
**Delivers:** Survey builder admin UI; participation token assignment; multi-section survey form with autosave (drafts table); anonymous response submission; survey lifecycle state machine (draft → scheduled → open → closed)
**Uses:** React Hook Form + Zod, Zustand for form progress, shadcn/ui form components
**Implements:** Survey Engine component, participation_tokens pattern
**Avoids:** Anonymity leak via user_id (Pitfall 1), survey fatigue and completion bias (Pitfall 9)

### Phase 3: Analytics Foundation
**Rationale:** Analytics must be built on top of real (or realistic) response data exercising RLS — not mock data. Postgres views for dimension scores, favorable/neutral/unfavorable splits, and participation by department must be built before dashboards are scaffolded. The `derived_metrics` computation (run at cycle close) and PrivacyGuard component must exist before any chart renders data.
**Delivers:** Postgres views for all analytics dimensions; `derived_metrics` table and `closeSurveyCycle` server action; PrivacyGuard component enforcing n=5 threshold at every render boundary; participation rate tracking decoupled from identity
**Implements:** Analytics Layer component
**Avoids:** Small-group inference via filter stacking (Pitfall 4), open-text deanonymization (Pitfall 5), RLS performance degradation (Pitfall 8), survivorship bias in trend comparisons (Pitfall 10)

### Phase 4: Dashboards
**Rationale:** Dashboards are consumers of the analytics foundation. The leadership dashboard and employee results view can be built in parallel once Phase 3 exists. Use `Promise.all()` at the page level to avoid the data fetch waterfall pitfall. The public `/open` results page is structurally separate (no auth, reads only snapshots) and should be scaffolded here even before the publication workflow is complete.
**Delivers:** Leadership dashboard (org health score, dimension scores, heatmap, participation); Employee results view; Public `/open` results page shell; `nuqs`-based URL filter state for sharable dashboard links
**Uses:** Recharts (all chart types), TanStack Table, nuqs, Suspense boundaries
**Avoids:** Next.js data fetch waterfall (Pitfall 7), manager horizontal privilege escalation

### Phase 5: Publication Workflow and Transparency
**Rationale:** The immutable snapshot workflow is the feature that closes the transparency loop — employees trust results won't be quietly revised. It depends on analytics being correct (Phase 3) and the `/open` page shell existing (Phase 4). Snapshot creation must be atomic and require survey-closed status as a prerequisite.
**Delivers:** Publication snapshot creation (REPEATABLE READ transaction or stored procedure); snapshot review workflow for leadership; snapshot publish/archive state machine; `/open` page reading from published snapshots; action items UI linked to survey dimensions and visible on the transparency page
**Avoids:** Publication snapshot race condition (Pitfall 6)

### Phase 6: Admin and Operations
**Rationale:** Admin and HR interfaces (employee roster import, privacy settings, cycle archival, email reminder configuration) are operational tooling. They depend on everything above being functional. These are not on the critical path for a first survey cycle but must exist before a second cycle runs.
**Delivers:** Employee directory import; email reminder configuration and sending; privacy settings (configurable threshold); cycle archival; audit log; admin survey management views
**Uses:** Resend + React Email for non-auth notification emails

### Phase 7: Manager Dashboard and v1.x Features
**Rationale:** The manager dashboard requires accurate org hierarchy data and is privacy-gated in ways that require real multi-cycle data to validate correctly. Trend analysis requires at least two complete cycles. These are explicitly v1.x features per the feature research.
**Delivers:** Manager dashboard (team results, privacy-gated); trend analysis / cycle delta; tenure band segmentation; eNPS scoring; CSV/PDF export; confidence indicators on low-sample scores
**Avoids:** Manager horizontal privilege escalation (verify org hierarchy integrity first)

### Phase Ordering Rationale

- **Phases 1-2 are strictly sequential and non-negotiable.** The data model cannot be revised after response collection begins without destroying anonymity guarantees. Get this right first.
- **Phase 3 before Phase 4** because dashboards built against mock data will appear to work but break against real anonymous responses where `user_id IS NULL`. The RLS must be real.
- **Phase 5 after Phase 4** because the `/open` page must exist (even as a shell) for the publication workflow to have somewhere to point. Snapshot immutability is the trust primitive — publish nothing until this works correctly.
- **Phase 6 is parallel-capable with Phase 5** for parts that don't depend on snapshots (roster import, email reminders can be built once survey engine is complete).
- **Phase 7 is explicitly deferred** because trend analysis without real cycles is untestable, and manager dashboards without validated org hierarchy data are a privacy risk.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Survey Engine):** The participation token + `response_drafts` pattern is architecturally novel (no vendor discloses their implementation). The exact RLS policies for the anonymous update path (`current_setting('app.current_response_id')`) need careful testing before committing to the implementation.
- **Phase 3 (Analytics Foundation):** The `SECURITY DEFINER` function approach for cross-department leadership queries and the Postgres `pg_cron` refresh strategy for materialized views should be verified against current Supabase docs (pg_cron availability may depend on Supabase plan level).
- **Phase 5 (Publication Workflow):** The `REPEATABLE READ` transaction approach for atomic snapshot creation may need a stored procedure rather than application-layer transaction management via Supabase JS client — verify current Supabase transaction support.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation and Auth):** `@supabase/ssr` + Next.js 15 middleware is well-documented. The only wrinkle is the `await cookies()` change in Next.js 15 — verify once against current Supabase docs.
- **Phase 4 (Dashboards):** Recharts + TanStack Table + nuqs are all mature, well-documented libraries with no known App Router issues. Standard patterns apply.
- **Phase 6 (Admin and Operations):** CRUD admin interfaces with server actions and Zod are the most standard Next.js App Router pattern. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | PRD-constrained choices are sound; `@supabase/ssr` + Next.js 15 patterns are well-documented; only Tremor deprecation status is MEDIUM |
| Features | MEDIUM | Feature baseline from training knowledge of Culture Amp/Lattice/Glint; patterns are stable and well-established; cannot live-verify competitor features |
| Architecture | HIGH | Next.js 15 App Router + `@supabase/ssr` patterns are from official docs; participation token pattern is a logical derivation from RLS constraints; SECURITY DEFINER analytics approach is standard Postgres |
| Pitfalls | HIGH for technical pitfalls; MEDIUM for UX/survey design pitfalls | RLS, service key exposure, and anonymity leak patterns are well-documented; survey fatigue benchmarks are training data |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **`pg_cron` availability on Supabase free/pro tier:** The materialized view refresh strategy for trend data requires `pg_cron`. Verify this is available on the target Supabase plan before committing to it in Phase 3. Alternative: trigger materialized view refresh from the `closeSurveyCycle` server action rather than a cron job.
- **Supabase transaction support via JS client:** The atomic snapshot creation in Phase 5 may require a stored procedure instead of application-layer transaction management. Verify `supabase.rpc()` behavior for multi-statement transactions before designing the publication workflow.
- **`@supabase/ssr` version and Next.js 15 compatibility:** Verify the current `@supabase/ssr` version and confirm the `await cookies()` pattern works exactly as described. The research is based on training data through August 2025; check Supabase changelog for any changes.
- **Email delivery for 87 users:** Supabase's built-in email provider may be sufficient for auth magic links but has unreliable deliverability for custom notifications. Validate whether Resend is needed from v1 or can genuinely be deferred.
- **Org hierarchy data accuracy:** Manager dashboard (Phase 7) requires accurate and maintained manager chain data. Before implementing, validate that the company has a clean org chart and a process for keeping it current in the system. Without this, the manager dashboard is a privacy risk (wrong manager sees wrong team's data).

## Sources

### Primary (HIGH confidence)
- Next.js 15 App Router official docs — Server Actions, Route Groups, RSC patterns, `async cookies()`
- Supabase `@supabase/ssr` official docs — `createServerClient`, middleware session refresh, `getUser()` vs `getSession()` security guidance
- Postgres `SECURITY DEFINER` functions and transaction isolation — standard Postgres behavior, well-documented

### Secondary (MEDIUM confidence)
- Culture Amp, Lattice, Leapsome, Officevibe/Workleap, Glint feature sets — training knowledge through August 2025; feature patterns are stable in this domain
- Survey methodology standards — Likert scale design, eNPS scoring formula (Promoters − Detractors), favorable/neutral/unfavorable bucketing (≥4 of 5 = favorable) are established academic and industry standards
- Privacy threshold of n=5 — documented in Culture Amp and Glint help documentation (training knowledge); HIGH confidence in the standard itself

### Tertiary (LOW confidence — validate before implementing)
- Tremor v3+ deprecation/pivot status — verify current project status before dismissing
- Resend pricing and deliverability SLAs for internal use — check current pricing and reliability before choosing as the email provider
- `nuqs` latest version and full Next.js 15 App Router support — verify against current package docs

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*
