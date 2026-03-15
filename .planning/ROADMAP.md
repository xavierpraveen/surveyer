# Roadmap: Surveyer

## Overview

Surveyer is built in four sequential phases where each phase is a hard prerequisite for the next. Phase 1 locks down the data model and anonymity architecture before any UI code is written — the one shortcut that cannot be taken. Phase 2 builds the full data collection pipeline: admin survey builder, employee response form, and anonymous submission with participation tokens. Phase 3 builds the analytics engine in Postgres and surfaces it through the leadership dashboard and public results view. Phase 4 closes the transparency loop with action tracking, immutable publication snapshots, and the admin operational interfaces that run the platform across survey cycles.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffold, auth/RBAC, complete DB schema + RLS policies, privacy architecture, DX setup (completed 2026-03-15)
- [x] **Phase 2: Survey Engine** - Survey builder, question editor, response collection with participation tokens, autosave, submission flow (completed 2026-03-15)
- [x] **Phase 3: Analytics and Dashboards** - Scoring engine (Postgres views/RPC), derived_metrics, leadership dashboard, public results page, privacy threshold enforcement (completed 2026-03-15)
- [ ] **Phase 4: Actions, Publication and Admin** - Action tracking, immutable publication snapshots, transparency page, admin interfaces, qualitative tagging

## Phase Details

### Phase 1: Foundation
**Goal**: The platform has a secure, deployable scaffold with working authentication, role-based routing, and a complete privacy-correct database schema — ready for feature development without risk of needing data migrations that would destroy anonymity guarantees
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, PRIVACY-01, PRIVACY-02, PRIVACY-03, PRIVACY-04, PRIVACY-05, PRIVACY-06, PRIVACY-07, DX-01, DX-02, DX-03, DX-04, DX-05
**Success Criteria** (what must be TRUE):
  1. A user can sign in with email/password or magic link, stay signed in across browser refresh, and sign out from any page; sign-up is blocked for non-company email domains
  2. Middleware routes each role (employee, manager, leadership, admin, hr_admin, survey_analyst) to the correct area of the app with zero DB queries — role is read from JWT app_metadata
  3. Every database table exists with migrations applied; RLS policies are in place and verified to prevent any role (including admin) from joining participation tokens to response content
  4. The responses and response_answers tables have no user_id column in anonymous mode — anonymity is architecturally enforced at the schema level, not the application layer
  5. A developer can clone the repo, follow README instructions, run seed scripts, and have a fully working local environment with all roles testable within one session
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Next.js 15 scaffold, Supabase SSR auth (email+password + magic link), role-based middleware, Server Actions, Wave 0 test stubs
- [ ] 01-02-PLAN.md — Database schema (23 tables), RLS policies with JWT claims, analytics views, seed data (18 users, 12 dimensions, 1 survey)

### Phase 2: Survey Engine
**Goal**: Surveys can be created, configured, targeted, and completed end-to-end — employees submit anonymous responses that are architecturally unattributable, and participation is tracked without revealing individual identity
**Depends on**: Phase 1
**Requirements**: SURVEY-01, SURVEY-02, SURVEY-03, SURVEY-04, SURVEY-05, SURVEY-06, SURVEY-07, SURVEY-08, SURVEY-09, SURVEY-10, SURVEY-11, SURVEY-12, SURVEY-13, RESPONSE-01, RESPONSE-02, RESPONSE-03, RESPONSE-04, RESPONSE-05, RESPONSE-06, RESPONSE-07, RESPONSE-08, RESPONSE-09, RESPONSE-10, DIM-01, DIM-02, DIM-03
**Success Criteria** (what must be TRUE):
  1. An admin can create a survey with sections and questions (all supported types), target sections to specific roles, configure anonymous mode, and move the survey through draft → scheduled → open → closed lifecycle states
  2. An employee sees only the surveys targeted to their role, can complete the survey section-by-section with a visible progress indicator, and can resume from where they left off after closing the browser
  3. Submitting an anonymous survey produces a response record with no user_id and a detached participation token — running the anonymity audit query against the DB confirms zero joins are possible between participation and response content
  4. An employee cannot submit twice; attempting to revisit the survey after submission shows a confirmation state; resubmission requires an admin to re-open
  5. The seed data includes one complete diagnostic survey covering all 12 organizational dimensions with company-wide and role-specific questions, ready for testing analytics
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Shared TypeScript types + survey admin Server Actions + response Server Actions + Wave 0 test stubs
- [ ] 02-02-PLAN.md — Admin survey builder UI: survey list, new survey form, section sidebar, inline question editor, status banner, dimension mapping
- [ ] 02-03-PLAN.md — Employee survey wizard: dashboard card grid, section-by-section wizard, autosave, resume, conditional questions, submission, confirmation
- [ ] 02-04-PLAN.md — Public (unauthenticated) survey route: middleware whitelist, public page, cookie deduplication, anonymous submission
- [x] 02-05-PLAN.md — Phase 2 seed migration: open diagnostic survey, all 12 dimension mappings, role-specific sections (completed 2026-03-15)

### Phase 3: Analytics and Dashboards
**Goal**: Leadership can see the full organizational health picture — dimension scores, participation rates, trends, and qualitative themes — computed entirely in Postgres and displayed through privacy-enforced dashboards; employees can see company-wide results on the public results page
**Depends on**: Phase 2
**Requirements**: ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, ANALYTICS-04, ANALYTICS-05, ANALYTICS-06, ANALYTICS-07, ANALYTICS-08, ANALYTICS-09, ANALYTICS-10, ANALYTICS-11, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09
**Success Criteria** (what must be TRUE):
  1. The leadership dashboard shows overall org health score, dimension scores, a department heatmap, trend lines across cycles, participation rates, and top qualitative themes — all computed from Postgres views/RPC, never client-side aggregation
  2. Applying department, role, or tenure band filters on the leadership dashboard never reveals data for segments below the privacy threshold (n=5 numeric, n=10 open-text); a confidence indicator appears instead; this enforcement happens server-side on the final filtered count
  3. The manager dashboard shows team participation rate without individual identities, and shows team dimension scores only when the team respondent count meets the privacy threshold
  4. Any authenticated employee can navigate to /results and see company-wide participation rate, dimension scores, top themes, and committed actions — no role restriction required
  5. Closing a survey cycle triggers derived_metrics computation; all dashboard reads use these pre-computed aggregates rather than re-aggregating raw response_answers at query time
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — compute_derived_metrics RPC migration + install recharts/nuqs (completed 2026-03-15)
- [x] 03-02-PLAN.md — Analytics TypeScript types + all data-fetching Server Actions (computeDerivedMetrics, getLeadershipDashboardData, getManagerDashboardData, getPublicResultsData) (completed 2026-03-15)
- [x] 03-03-PLAN.md — Leadership dashboard full UI (KPI strip, dimension bars, heatmap, trends, filter bar, qualitative themes) + SurveyStatusBanner Compute Results state (completed 2026-03-15)
- [ ] 03-04-PLAN.md — Manager dashboard + public /results page

### Phase 4: Actions, Publication and Admin
**Goal**: Leadership can publish immutable result snapshots that employees trust won't be revised, committed action items are visible on a public transparency page, and admins have the full operational interfaces needed to run the platform across survey cycles
**Depends on**: Phase 3
**Requirements**: ACTIONS-01, ACTIONS-02, ACTIONS-03, ACTIONS-04, ACTIONS-05, ACTIONS-06, PUBLISH-01, PUBLISH-02, PUBLISH-03, PUBLISH-04, PUBLISH-05, ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08, ADMIN-09
**Success Criteria** (what must be TRUE):
  1. An analyst or leader can create a publication snapshot only after a survey is in closed state; the snapshot is an immutable JSONB record capturing dimension scores, participation, themes, and action items at that point in time; an employee viewing it two cycles later sees the original published data unchanged
  2. Leadership can create action items linked to survey dimensions with owner, priority, target date, and success criteria; owners can post progress updates; each action has a public visibility toggle
  3. Any authenticated employee can view the transparency page showing identified issues, committed actions, in-progress work, blocked items, and completed items — sourced from public-flagged action items only
  4. An admin can import an employee roster from CSV, configure privacy thresholds, monitor live participation rates while a survey is open, archive completed cycles, and manage all survey/question/dimension configuration through admin interfaces
  5. A survey analyst can review, tag, and edit qualitative theme tags on open-text responses; the system surfaces the most frequent tags as top recurring issues and improvement suggestions
**Plans**: 5 plans

Plans:
- [ ] 04-01-PLAN.md — Schema migration (surveys.archived, action_items.dimension_ids) + Phase 4 TypeScript types + Wave 0 test stubs
- [ ] 04-02-PLAN.md — All Phase 4 Server Actions: action CRUD, publication snapshot creation, settings (import/privacy/participation/archive), tagging + theme generation; extend getPublicResultsData for cycle selector
- [ ] 04-03-PLAN.md — Action items UI: /admin/actions list table with status filter tabs + /admin/actions/[id] edit form + progress update timeline
- [ ] 04-04-PLAN.md — Admin settings UI: /admin/settings with 4 tabs (Employees CSV import, Privacy thresholds, Participation monitor with auto-refresh, Cycles archive)
- [ ] 04-05-PLAN.md — Publication workflow (Publish Results button + confirm modal on survey detail) + /results cycle selector for snapshot browsing + /admin/surveys/[id]/tags qualitative tagging workspace

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Complete    | 2026-03-15 |
| 2. Survey Engine | 5/5 | Complete    | 2026-03-15 |
| 3. Analytics and Dashboards | 4/4 | Complete    | 2026-03-15 |
| 4. Actions, Publication and Admin | 3/5 | In Progress|  |
