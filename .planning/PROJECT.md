# Surveyer

## What This Is

An internal organizational health platform for an ~87-person technology consulting and product company. Employees complete diagnostic surveys across organizational dimensions; leadership and managers analyze results through role-segmented dashboards; results and committed action plans are published transparently inside the company. The platform tracks follow-up actions over time to close the loop between feedback and change.

## Core Value

Leadership gets honest, actionable organizational insights from employees, and employees trust the process because results and actions are published transparently with accountability.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Authentication & Access**
- [ ] Supabase auth with email/password and magic link login
- [ ] Internal company email domain restriction
- [ ] Role-based access control: employee, manager, leadership, admin, hr_admin, survey_analyst
- [ ] Role-based route protection (server-side)
- [ ] Employee roster import / seed support
- [ ] Optional anonymous response mode configurable per survey

**Survey Management**
- [ ] Multiple survey campaigns with draft / scheduled / open / closed lifecycle states
- [ ] Survey sections with ordered questions
- [ ] Role-targeted sections (engineering, qa, uiux, project managers, sales/business, architects/technical leadership, hr/operations, marketing)
- [ ] Question types: Likert 1–5, Likert 1–10, single select, multi-select, short text, long text
- [ ] Required vs optional questions, conditional question visibility
- [ ] Survey versioning
- [ ] Company-wide core questions + role-specific sections

**Response Collection**
- [ ] Section-by-section progress display
- [ ] Autosave drafts during survey completion
- [ ] Submit once (unless re-opened by admin)
- [ ] Anonymous and non-anonymous response modes
- [ ] Store response timestamps and segmentation metadata (department, role, tenure band, work type, manager chain)
- [ ] Participation tracking decoupled from anonymous identity — rate visible by department, individual identity never revealed

**Organizational Diagnostic Dimensions**
- [ ] Dimension model: organizational clarity, sales-to-engineering handover, architecture & technical governance, engineering productivity, team structure & work allocation, delivery & project management, quality & testing, career growth, leadership & management, culture & work environment, innovation & learning, overall satisfaction
- [ ] Questions map to one or more dimensions

**Analytics Engine**
- [ ] Aggregate score per dimension, by department, by tenure band, by role, by survey cycle
- [ ] Trend over time and cycle deltas
- [ ] Participation rates and response heatmaps
- [ ] Favorable (≥4) / neutral (=3) / unfavorable (≤2) distribution on 1–5 scale
- [ ] Confidence indicators when sample size below privacy threshold
- [ ] Qualitative: manual tagging, theme clustering, pluggable AI summarization provider interface

**Dashboards**
- [ ] Leadership dashboard: org health score, dimension scores, risk areas, heatmap, trends, participation, key themes, action items, filters
- [ ] Manager dashboard: team participation, team results (privacy-gated), action plans, historical movement
- [ ] Public internal results dashboard: participation rate, company-wide results, dimension scores, top themes, committed actions, action progress, transparency notes

**Action Tracking & Transparency**
- [ ] Action items linked to survey cycle and dimensions with title, problem statement, owner, team, priority, target date, status, progress log, success criteria
- [ ] Public visibility toggle per action
- [ ] "Open Results and Actions" page accessible to all employees

**Privacy & Safety**
- [ ] Anonymous responses never deanonymizable — enforced at DB/RLS level
- [ ] No aggregate data shown when respondent count below configurable threshold (default 5)
- [ ] Open-text guarded from deanonymization
- [ ] Manager dashboards hide granular results for small teams
- [ ] Privacy-first RLS policies throughout

**Admin Interfaces**
- [ ] Survey creation, scheduling, question management, role targeting
- [ ] Employee directory import, dimension mapping, dashboard configuration
- [ ] Action item management, participation monitoring, privacy threshold settings, survey cycle archival

**Data Model & Infrastructure**
- [ ] Complete Supabase schema: profiles, departments, roles, teams, surveys, survey_sections, questions, question_options, survey_audiences, responses, response_answers, response_metadata, dimensions, question_dimension_map, derived_metrics, qualitative_tags, qualitative_themes, action_items, action_updates, publication_snapshots, audit_logs
- [ ] SQL migrations, RLS policies, seed data with complete diagnostic survey
- [ ] Publication workflow: immutable snapshots after analyst/leadership review

**Developer Experience**
- [ ] README, environment variable template, local setup instructions, Supabase setup guide
- [ ] Architecture overview, security notes, RLS policy explanations
- [ ] Example seeded data for testing

### Out of Scope

- Mobile native app — web-first; responsive web covers mobile use
- External/public-facing results page — internal trust only
- Hardcoded LLM/AI dependency — provider interface designed, no direct integration in v1
- Multi-tenant / multi-company support — single company v1
- Real-time collaborative editing of survey builder — admin-only survey creation is sequential
- SSO/SAML — email and magic link sufficient for v1

## Context

- Company size: ~87 people
- Industry: technology consulting and product
- This is a greenfield project; no existing survey infrastructure
- Privacy is paramount — anonymity must be enforced at the data layer, not just UI layer
- Results transparency is a core product value, not an afterthought
- The platform should grow with the company across multiple survey cycles

## Constraints

- **Tech Stack**: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, RLS, Storage, Realtime) — not negotiable per PRD
- **Validation**: Zod for all form and API validation
- **Privacy**: Anonymous responses must be unattributable even to admins, enforced via RLS
- **Scalability**: Design for multiple survey cycles and company growth to ~200 people
- **Security**: No client-only security; all access control server-side via RLS

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Anonymity enforced at DB/RLS level | Cannot rely on application layer; DB must prevent joins that reveal identity | — Pending |
| Pluggable AI provider interface, no direct LLM calls in v1 | PRD explicitly requires no hardcoded LLM dependency; adds abstraction cost but prevents lock-in | — Pending |
| Immutable publication snapshots | Employees must trust results won't change retroactively; builds institutional credibility | — Pending |
| Privacy threshold default of 5 respondents | Balances statistical utility with anonymity protection for small teams | — Pending |
| Participation token pattern for anonymous surveys | Separate participation_tokens table tracks who responded without linking to response content | — Pending |
| Recharts or Tremor for visualization | Modern, TypeScript-native, works well with Next.js App Router; no server-side rendering issues | — Pending |

---
*Last updated: 2026-03-15 after initialization*
