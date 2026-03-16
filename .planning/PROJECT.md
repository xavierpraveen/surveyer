# Surveyer

## What This Is

An internal organizational health platform for an ~87-person technology consulting and product company. Employees complete diagnostic surveys across 12 organizational dimensions; leadership and managers analyze results through role-segmented dashboards with privacy threshold enforcement; immutable publication snapshots lock results at a point in time so employees can trust transparency; committed action plans are tracked publicly to close the loop between feedback and change.

**v1.0 shipped 2026-03-16.** The full platform is implemented: auth, schema, response collection, analytics engine, dashboards, action tracking, publication workflow, admin interfaces, brand system. See `.planning/milestones/v1.0-ROADMAP.md` for complete phase history.

## Core Value

Leadership gets honest, actionable organizational insights from employees, and employees trust the process because results and actions are published transparently with accountability.

## Requirements

### Validated (v1.0)

- ✓ Supabase auth with email/password and magic link login — v1.0
- ✓ Internal company email domain restriction — v1.0
- ✓ Role-based access control: employee, manager, leadership, admin, hr_admin, survey_analyst — v1.0
- ✓ Role-based route protection via normalizeRole() + ROLE_ROUTES (server-side, zero DB queries) — v1.0
- ✓ Employee roster import via CSV + seed support — v1.0
- ✓ Optional anonymous response mode configurable per survey — v1.0
- ✓ Multiple survey campaigns with full lifecycle (draft → scheduled → open → closed) — v1.0
- ✓ Survey sections with ordered questions, all question types (Likert 1–5/1–10, single-select, multi-select, short/long text) — v1.0
- ✓ Role-targeted sections, required/optional questions, conditional question visibility — v1.0
- ✓ Section-by-section survey wizard with autosave, resume, submit-once enforcement — v1.0
- ✓ Anonymous responses architecturally unattributable (no user_id in responses table; participation tokens in separate table; RLS prevents joins) — v1.0
- ✓ 12 org health dimensions: compute_derived_metrics RPC produces dimension scores with favorable/neutral/unfavorable distribution — v1.0
- ✓ Privacy threshold enforcement: no aggregate data below n=5 numeric / n=10 text; server-side on final filtered count — v1.0
- ✓ Leadership dashboard: org health score, dimension scores, department heatmap, trend lines, participation rate, qualitative themes, filter bar — v1.0
- ✓ Manager dashboard: team participation rate, team dimension scores (privacy-gated), department action plans — v1.0
- ✓ Public `/results` page: participation, company-wide scores, top themes, committed actions; accessible to all authenticated employees — v1.0
- ✓ Action items with title, problem statement, owner, team, priority, target date, status (5 states), progress log, success criteria, public visibility toggle — v1.0
- ✓ Immutable publication snapshots (JSONB) capturing dimension scores, participation, themes, and action items at time of publication — v1.0
- ✓ `/results` cycle selector for browsing historical published snapshots — v1.0
- ✓ Admin interfaces: survey CRUD, question editor, dimension mapping, CSV import, privacy config, participation monitor, survey archival, action management — v1.0
- ✓ Qualitative tagging workspace: tag open-text responses, generate theme clusters by frequency — v1.0
- ✓ Bold & Confident brand system: 22 CSS tokens, Tailwind token mapping, Inter typeface, TopNav — v1.0
- ✓ AI summarization provider interface (NullSummarizationProvider; no live LLM in v1) — v1.0
- ✓ Complete DB schema, RLS policies, SQL migrations, seed data — v1.0
- ✓ README, .env.example, architecture docs — v1.0

### Active (v2.0 scope)

**Routing & Navigation**
- [ ] Manager-role JWT users should reach Action Plans section — currently normalizeRole('manager') → 'admin' → `/admin`; requires routing change or action plans duplicated in manager dashboard
- [ ] TopNav in (leadership)/layout.tsx and (manager) route group for layout consistency

**Type Safety**
- [ ] Regenerate `database.types.ts` via `supabase gen types typescript` — currently a stub with `supabaseAdmin as any` casts throughout Server Actions

**AI Integration**
- [ ] Wire `summarizer` singleton to `tagging.ts` call sites — NullSummarizationProvider is the default; connect a real LLM provider (OpenAI, Anthropic) when ready

**Notifications (v2)**
- [ ] Email notification to employees when a new survey opens
- [ ] Reminder email to non-respondents before survey closes
- [ ] Email notification to action item owners on status change

**Advanced Analytics (v2)**
- [ ] Historical trend analysis for manager team scores across cycles (requires 2+ cycles of real data)
- [ ] eNPS question type (0–10 scale) with NPS formula
- [ ] Sentiment analysis on open-text responses
- [ ] Cohort stability metric: % of current respondents who also participated in prior cycle

### Out of Scope

- Mobile native app — web-first; responsive web covers mobile use
- External/public-facing results page — internal trust tool only
- Hardcoded LLM/AI dependency — provider interface designed for v1, direct integration in v2
- Multi-tenant / multi-company support — single company v1
- Real-time collaborative survey builder — admin-only sequential editing is sufficient
- SSO/SAML — email and magic link sufficient for ~87-person company in v1
- Continuous/pulse surveys — anti-feature for this platform; deep diagnostic cadence only
- Drag-and-drop action item reordering — manual priority field sufficient

## Context

- **Shipped:** v1.0 MVP — 2026-03-16
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, RLS) + Recharts + nuqs
- **Codebase:** 11,650 LOC TypeScript across 84 files; 204 total files; 143 git commits
- **Company size:** ~87 people; single company; single tenant
- **Privacy model:** Anonymous responses unattributable at DB level; RLS prevents joins even for admins; privacy thresholds configurable (default n=5 numeric, n=10 text)
- **Role model:** 5 raw JWT roles (manager, leadership, admin, hr_admin, survey_analyst) → `'admin'` via normalizeRole(); employee → `'employee'`
- **Known gaps:** DASH-07 manager routing (INFO-03), TopNav layout gaps (INFO-04), database.types.ts stub
- **Live Supabase verification pending:** Phases 01, 02, 04 automated checks all pass; auth flows, CSV import, and snapshot creation need live environment testing

## Constraints

- **Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase — not negotiable per PRD
- **Validation:** Zod for all form and server action validation
- **Privacy:** Anonymous responses must be unattributable even to admins; enforced via RLS
- **Scalability:** Design for multiple survey cycles and company growth to ~200 people
- **Security:** No client-only security; all access control server-side via RLS + Server Actions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Anonymity enforced at DB/RLS level | Cannot rely on application layer; DB prevents joins that reveal identity | ✓ Good — participation_tokens table fully decoupled from responses; zero join paths verified by RLS audit |
| Pluggable AI provider interface, no direct LLM calls in v1 | PRD explicitly requires no hardcoded LLM dependency; adds abstraction cost but prevents lock-in | ✓ Good — NullSummarizationProvider ships in v1; v2 can swap without touching call sites |
| Immutable publication snapshots | Employees must trust results won't change retroactively; builds institutional credibility | ✓ Good — DB trigger prevents UPDATE/DELETE on publication_snapshots; JSONB captures full state at publication time |
| Privacy threshold default of 5 respondents | Balances statistical utility with anonymity protection for small teams | ✓ Good — configurable via admin settings; enforcement server-side on final filtered count |
| Participation token pattern for anonymous surveys | Separate participation_tokens table tracks who responded without linking to response content | ✓ Good — RLS policy prevents any role (including admin) from joining tables |
| Recharts for visualization | Modern, TypeScript-native, works well with Next.js App Router; no SSR issues | ✓ Good — HEX threshold fills (not Tailwind) required by Recharts; documented as pattern |
| 2-role AppRole model with normalizeRole() | Raw JWT has 5 admin roles; application only needs employee|admin distinction; bridge function prevents raw string comparisons | ✓ Good — Phase 8 introduced, Phase 9 propagated to all 7 consumers; zero raw ['admin'].includes patterns remain |
| Server Actions with 'server-only' guard on supabaseAdmin | Prevents service role client from ever reaching client bundle; enforced at module level | ✓ Good — all 21 supabaseAdmin consumers confirmed server-side only |
| nuqs for URL state management on analytics filters | Shareable dashboard URLs; filter state survives navigation without lifting to client state | ✓ Good — filter bar wired cleanly; no additional state management needed |

---
*Last updated: 2026-03-16 after v1.0 milestone complete*
