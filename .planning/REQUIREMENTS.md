# Requirements: Surveyer

**Defined:** 2026-03-15
**Core Value:** Leadership gets honest, actionable organizational insights from employees, and employees trust the process because results and actions are published transparently with accountability.

---

## v1 Requirements

### Authentication & Access Control (AUTH)

- [x] **AUTH-01**: User can sign in with email and password via Supabase Auth
- [x] **AUTH-02**: User can sign in with magic link (passwordless email)
- [x] **AUTH-03**: System restricts sign-up to company email domain (configurable)
- [x] **AUTH-04**: User session persists across browser refresh via Supabase SSR cookie-based sessions
- [x] **AUTH-05**: Role is stored in JWT `app_metadata` and enforced by middleware without DB queries
- [x] **AUTH-06**: Middleware routes users to role-appropriate areas (employee / manager / leadership / admin)
- [x] **AUTH-07**: Admin can assign roles: employee, manager, leadership, admin, hr_admin, survey_analyst
- [x] **AUTH-08**: Admin can import employee roster via CSV (name, email, department, role, tenure band)
- [x] **AUTH-09**: Admin can seed initial employee data for local development and testing
- [x] **AUTH-10**: User can sign out from any page

### Survey Management (SURVEY)

- [x] **SURVEY-01**: Admin can create a new survey campaign with title, description, and target audience
- [x] **SURVEY-02**: Survey has lifecycle states: draft → scheduled → open → closed, with state transitions enforced
- [x] **SURVEY-03**: Admin can schedule a survey to automatically open and close on specified dates
- [x] **SURVEY-04**: Admin can create survey sections with title, description, and display order
- [x] **SURVEY-05**: Admin can add questions to sections with configurable display order
- [x] **SURVEY-06**: System supports question types: Likert 1–5, Likert 1–10, single-select, multi-select, short text, long text
- [x] **SURVEY-07**: Admin can mark questions as required or optional
- [x] **SURVEY-08**: Admin can configure conditional question visibility based on prior answer values
- [x] **SURVEY-09**: Admin can target sections to specific roles (engineering, qa, uiux, project managers, sales/business, architects/technical leadership, hr/operations, marketing, or all)
- [x] **SURVEY-10**: Survey versioning — questions have stable IDs across survey cycles to support trend analysis
- [x] **SURVEY-11**: Admin can configure anonymous vs. non-anonymous mode per survey
- [x] **SURVEY-12**: Admin can duplicate an existing survey as the basis for a new cycle
- [x] **SURVEY-13**: Seed data includes one complete diagnostic survey covering all 12 organizational dimensions with company-wide and role-specific questions

### Response Collection (RESPONSE)

- [x] **RESPONSE-01**: Employee can view and take any open survey targeted to their role
- [x] **RESPONSE-02**: Survey UI shows section-by-section progress indicator
- [x] **RESPONSE-03**: Survey autosaves draft responses in a separate `response_drafts` table (never linked to final anonymous responses)
- [x] **RESPONSE-04**: Employee can resume an in-progress survey from where they left off
- [x] **RESPONSE-05**: Employee can submit a survey only once (resubmission requires admin to re-open)
- [x] **RESPONSE-06**: For anonymous surveys: final submitted response contains no user identifier — the participation token (who responded) is stored separately and detached from response content (what they responded)
- [x] **RESPONSE-07**: For non-anonymous surveys: respondent identity is retained for follow-up analysis
- [x] **RESPONSE-08**: System stores segmentation metadata with each response: department, role, tenure band, work type (derived from profile at submission time, not a live FK)
- [x] **RESPONSE-09**: System tracks participation rate per department using participation tokens (anonymous) or direct FK (non-anonymous), without revealing identities in anonymous mode
- [x] **RESPONSE-10**: Employee is shown a confirmation screen after submission

### Organizational Diagnostic Dimensions (DIM)

- [x] **DIM-01**: System has a configurable dimension model with the 12 standard dimensions: organizational clarity, sales-to-engineering handover, architecture & technical governance, engineering productivity, team structure & work allocation, delivery & project management, quality & testing, career growth, leadership & management, culture & work environment, innovation & learning, overall satisfaction
- [x] **DIM-02**: Admin can map each question to one or more dimensions
- [x] **DIM-03**: Dimension mappings are stored in a `question_dimension_map` table enabling multi-dimensional scoring

### Analytics Engine (ANALYTICS)

- [x] **ANALYTICS-01**: System computes aggregate dimension scores from submitted responses using Postgres views/RPC (never client-side aggregation)
- [x] **ANALYTICS-02**: Scores are broken down by department, role, tenure band, and survey cycle
- [x] **ANALYTICS-03**: System computes favorable (Likert ≥4), neutral (=3), unfavorable (≤2) distribution for all 1–5 scale questions
- [x] **ANALYTICS-04**: System displays confidence indicator when respondent count for a segment is below the privacy threshold
- [x] **ANALYTICS-05**: System computes delta scores between survey cycles for trend analysis
- [x] **ANALYTICS-06**: System computes participation rate as: submitted responses / eligible participants per survey
- [x] **ANALYTICS-07**: `derived_metrics` table stores batch-computed aggregates, refreshed when a survey closes
- [x] **ANALYTICS-08**: Privacy threshold enforcement: no aggregate data is returned when filtered result has fewer than the configured minimum respondents (default: 5); enforced server-side at the final filtered count, not per-filter
- [x] **ANALYTICS-09**: Qualitative analysis: analyst can manually tag open-text responses with themes
- [x] **ANALYTICS-10**: Qualitative analysis: system surfaces most frequent tags as "top recurring issues" and "top improvement suggestions"
- [ ] **ANALYTICS-11**: AI summarization abstraction layer (provider interface) designed but no live LLM integration in v1; interface accepts raw text and returns structured themes

### Dashboards (DASH)

- [x] **DASH-01**: Leadership dashboard shows: overall org health score, dimension scores, risk areas, participation rate, key qualitative themes, unresolved action items
- [x] **DASH-02**: Leadership dashboard shows heatmap of scores by department
- [x] **DASH-03**: Leadership dashboard shows trend lines across survey cycles per dimension
- [x] **DASH-04**: Leadership dashboard supports filters by department, role, tenure band, and survey period
- [x] **DASH-05**: Manager dashboard shows team participation rate (using participation tokens, no individual identities)
- [x] **DASH-06**: Manager dashboard shows team-level dimension scores only when team respondent count meets the privacy threshold
- [ ] **DASH-07**: Manager dashboard shows action plans relevant to their team/department
- [x] **DASH-08**: Public internal results dashboard (`/results`) shows: participation rate, company-wide dimension scores, top themes, committed actions, action progress, transparency notes
- [x] **DASH-09**: Public internal results dashboard is accessible to all authenticated employees without role restriction

### Action Tracking & Transparency (ACTIONS)

- [x] **ACTIONS-01**: Leadership/admin can create action items linked to survey cycle and one or more dimensions
- [x] **ACTIONS-02**: Each action item has: title, problem statement, owner, department/team, priority, target date, status, measurable success criteria
- [x] **ACTIONS-03**: Action status has five states: identified → planned → in-progress → blocked → completed
- [x] **ACTIONS-04**: Action item owners can post progress updates to a timeline log
- [x] **ACTIONS-05**: Each action has a public visibility toggle; only public actions appear on the employee-facing transparency page
- [x] **ACTIONS-06**: Employees can view the "Open Results and Actions" page showing: identified issues, committed actions, in-progress work, blocked items, completed items

### Privacy & Safety (PRIVACY)

- [x] **PRIVACY-01**: Anonymous survey responses are architecturally unattributable — `responses` and `response_answers` tables have no `user_id` column in anonymous mode
- [x] **PRIVACY-02**: RLS policies prevent any role (including admin) from joining participation tokens to response content
- [x] **PRIVACY-03**: Open-text responses respect the same privacy threshold as numeric responses; text is hidden when respondent count is below threshold
- [x] **PRIVACY-04**: Manager dashboards suppress all segmented data for teams below the privacy threshold
- [x] **PRIVACY-05**: Supabase service role client is isolated with `import 'server-only'`; never accessible client-side
- [x] **PRIVACY-06**: Privacy threshold is admin-configurable (default: 5 respondents minimum for numeric, 10 for open-text)
- [x] **PRIVACY-07**: All RLS policies use JWT claims for role checks (no same-table policy recursion on `profiles`)

### Admin Interfaces (ADMIN)

- [x] **ADMIN-01**: Admin can create, edit, publish, schedule, and close surveys
- [x] **ADMIN-02**: Admin can manage questions: create, edit, reorder, delete, set type and targeting
- [x] **ADMIN-03**: Admin can map questions to dimensions
- [x] **ADMIN-04**: Admin can import and manage employee directory
- [x] **ADMIN-05**: Admin can configure privacy thresholds
- [x] **ADMIN-06**: Admin can monitor participation rates in real time while a survey is open
- [x] **ADMIN-07**: Admin can manage action items (create, assign, update status)
- [x] **ADMIN-08**: Admin can archive completed survey cycles
- [x] **ADMIN-09**: Survey analyst can review and edit qualitative theme tags

### Brand & Visual Identity (BRAND)

- [x] **BRAND-01**: Application defines a semantic CSS custom property design token system (21 tokens: brand, accent, bg, surface, fg, border, success, warning, error groups) in `globals.css`
- [x] **BRAND-02**: Tailwind config maps all design tokens to utility classes via CSS custom properties; Inter typeface loaded via `next/font/google`
- [x] **BRAND-03**: A persistent `TopNav` component renders on all admin and employee layout pages with logo, role-appropriate nav links, and user avatar
- [x] **BRAND-04**: All button instances use one of four defined variants (Primary, Secondary, Ghost, Danger) — no ad-hoc Tailwind color classes
- [x] **BRAND-05**: All badge/status pills use `bg-*-muted` + `text-*-text` token pairs from the spec
- [x] **BRAND-06**: All admin and employee page files use semantic token classes; no raw hex colors or arbitrary Tailwind values
- [x] **BRAND-07**: App loads without console errors; no undefined Tailwind token warnings; `prefers-reduced-motion` respected

### Data Schema & Infrastructure (SCHEMA)

- [x] **SCHEMA-01**: Complete Supabase Postgres schema with migrations for all tables: profiles, departments, roles, teams, surveys, survey_sections, questions, question_options, survey_audiences, responses, response_answers, response_drafts, response_metadata, participation_tokens, dimensions, question_dimension_map, derived_metrics, qualitative_tags, qualitative_themes, action_items, action_updates, publication_snapshots, audit_logs
- [x] **SCHEMA-02**: RLS policies implemented for all tables; sensitive tables use JWT claim-based role checks
- [x] **SCHEMA-03**: Postgres views and RPC functions for analytics aggregation
- [x] **SCHEMA-04**: Seed SQL scripts including complete diagnostic survey with questions, sections, dimension mappings, and sample employee data

### Publication Workflow (PUBLISH)

- [x] **PUBLISH-01**: Analyst/leadership can create an immutable publication snapshot after a survey closes
- [x] **PUBLISH-02**: Snapshot is a versioned JSONB blob capturing dimension scores, participation, themes, and action items at time of publication
- [x] **PUBLISH-03**: Published snapshot is attached to committed action items
- [x] **PUBLISH-04**: Employees can view a published snapshot even after live data changes
- [x] **PUBLISH-05**: Survey must be in `closed` state before a snapshot can be created (DB-enforced)

### Developer Experience (DX)

- [x] **DX-01**: README with local setup, Supabase setup, and environment variable documentation
- [x] **DX-02**: `.env.example` template with all required environment variables
- [x] **DX-03**: Architecture overview and RLS policy explanations in documentation
- [x] **DX-04**: Seed scripts produce realistic test data for all roles and survey responses
- [x] **DX-05**: TypeScript types generated from Supabase schema (`supabase gen types`)

---

## v2 Requirements

### Notifications
- **NOTIF-01**: Email notification to employees when a new survey opens
- **NOTIF-02**: Reminder email to non-respondents before survey closes
- **NOTIF-03**: Email notification to action item owners on status change

### Manager Dashboard — Multi-Cycle Trends
- **MGR-01**: Historical trend analysis for team scores across cycles (requires 2+ cycles of real data)
- **MGR-02**: Manager chain segmentation (requires clean org hierarchy data)

### Advanced Qualitative Analysis
- **QUAL-01**: AI-assisted theme summarization via pluggable provider integration
- **QUAL-02**: Sentiment analysis on open-text responses

### eNPS
- **ENPS-01**: Employee Net Promoter Score question type (0–10 scale) with NPS formula calculation

### Cohort Stability Metrics
- **COHORT-01**: Measure what % of current respondents also participated in prior cycle (trend comparability indicator)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first; responsive web covers mobile use cases |
| External / public-facing results | Internal trust tool only; no unauthenticated access |
| Hardcoded LLM/AI integration | Provider interface designed but no direct integration in v1 — prevents vendor lock-in |
| Multi-tenant / multi-company | Single company v1; no tenant isolation needed |
| Real-time collaborative survey builder | Admin-only survey creation; sequential editing is sufficient |
| SSO / SAML | Email and magic link sufficient for ~87-person company in v1 |
| Continuous/pulse surveys | Anti-feature for this platform (survey fatigue); deep diagnostic cadence only |
| Video/multimedia question types | Not needed for organizational diagnostics |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 – AUTH-05, AUTH-07 – AUTH-10 | Phase 1 | Complete |
| AUTH-06 | Phase 6 | Complete |
| SCHEMA-01 – SCHEMA-04 | Phase 1 | Complete |
| PRIVACY-01 – PRIVACY-07 | Phase 1 | Complete |
| DX-01 – DX-05 | Phase 1 | Complete |
| SURVEY-01 – SURVEY-13 | Phase 2 | Complete |
| RESPONSE-01 – RESPONSE-10 | Phase 2 | Complete |
| DIM-01 – DIM-03 | Phase 2 | Complete |
| ANALYTICS-01 – ANALYTICS-10 | Phase 3 | Complete |
| ANALYTICS-11 | Phase 7 | Pending |
| DASH-01 – DASH-06, DASH-08 – DASH-09 | Phase 3 | Complete |
| DASH-07 | Phase 7 | Pending |
| ACTIONS-01 – ACTIONS-06 | Phase 4 | Complete |
| PUBLISH-01 – PUBLISH-05 | Phase 4 | Complete |
| ADMIN-01 – ADMIN-09 | Phase 4 | Complete |
| BRAND-01 – BRAND-07 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 99 total (AUTH:10, SCHEMA:4, PRIVACY:7, DX:5, SURVEY:13, RESPONSE:10, DIM:3, ANALYTICS:11, DASH:9, ACTIONS:6, PUBLISH:5, ADMIN:9, BRAND:7)
- Implemented [x]: 96/99
- Pending [ ]: 3 (AUTH-06, ANALYTICS-11, DASH-07 — closing in Phases 6–7)
- Unmapped: 0 ✓

Note: BRAND-01–07 added to REQUIREMENTS.md via Phase 6 gap closure. AUTH-06 reset to Pending (BUG-02 role routing gap). ANALYTICS-11 and DASH-07 closing in Phase 7.

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation*
