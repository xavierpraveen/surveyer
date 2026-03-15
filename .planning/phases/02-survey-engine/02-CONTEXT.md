# Phase 2: Survey Engine - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the complete survey creation and response collection system: admin builds surveys via a section/question editor, employees discover and take surveys via a wizard UI, and responses are collected with full anonymity enforcement. Also includes public (unauthenticated) survey links for surveys the admin explicitly enables. Analytics, dashboards, and action tracking are Phase 3/4.

The Phase 1 schema is already live — this phase adds all UI, Server Actions, and business logic on top of it.

</domain>

<decisions>
## Implementation Decisions

### Survey Taking Flow (Employee)

- **Navigation**: Step-by-step wizard — one section at a time, Next/Back buttons. Not a single scrollable page.
- **Progress indicator**: Fill bar at top showing % complete + section name + count (e.g., "Section 3 of 13"). No step dots.
- **Back navigation**: Free — employee can go back to any previous section and change answers. No section locking.
- **Resume behavior**: On return to an in-progress survey, automatically restore the last saved section position and answers from `response_drafts`. Show a dismissible banner: "Your progress has been saved."
- **Conditional questions**: Smooth fade/slide-in animation when a condition is met (a question appears inline below its trigger). Instant hide when condition unmet. No mid-section re-layout surprises.
- **Conditional config**: Simple single-condition rule per question — "Show if [question X] [operator] [value]". No AND/OR multi-condition chains in v1.

### Admin Survey Builder

- **Layout**: Left sidebar lists all sections (with question count per section, checkmark if complete). Clicking a section loads its questions in the right content area. "Add Section" button at bottom of sidebar.
- **Question editing**: Inline list editor — questions appear as an ordered list. Click a question to expand an inline edit form within the list. No modal or slide-over. "Add Question" button at bottom of list.
- **Question edit fields**: text, type (Likert 1-5 / Likert 1-10 / single-select / multi-select / short text / long text), required toggle, dimension multi-select (see below), conditional config, display order.
- **Reordering**: ↑ ↓ arrow buttons next to each section and each question. No drag-and-drop in v1.
- **Survey lifecycle**: Persistent status banner at the top of the builder showing current status (Draft / Scheduled / Open / Closed) with a single primary action button that changes with state: "Schedule" → "Open Now" → "Close Survey". No separate settings page for lifecycle.
- **Section targeting**: Each section has a "Target roles" field (multi-select from: all, engineering, qa, uiux, project-managers, sales-business, architects, hr-operations, marketing).

### Dimension Mapping

- **Inline in question editor** — the question edit form includes a multi-select "Dimensions" field. Admin picks 1–3 dimensions per question while editing it. No separate matrix/bulk-mapping view in v1.

### Employee Survey List

- **Layout**: Card grid. Each card shows: survey title, short description, status badge (OPEN / CLOSES IN Xd / COMPLETED / UPCOMING), and a CTA button.
- **CTA by state**:
  - Open + not started → "Take Survey"
  - Open + draft in progress → "Resume Survey"
  - Completed → "View Submission"
  - Upcoming (not yet open) → "Coming soon" (disabled)
- **Completed survey view**: Read-only thank-you screen — "You submitted this survey on [date]. Thank you for your participation." with current participation rate if available. No re-editing.

### Submission Experience

- **Post-submit screen**: Full-page confirmation on the survey URL showing: title, thank-you message, participation rate (from participation tokens), brief note about when results will be shared. "Back to Surveys" button. Auto-redirect to survey list after 5 seconds.

### Autosave

- **Trigger**: On every answer change (debounced 500ms) AND on every "Next" button click. Maximizes capture — user never loses a completed section.
- **Visual feedback**: Small status indicator (corner of the survey card): "Saving..." while in-flight, then "Saved ✓" on success. Fades after 2 seconds. No toast notifications.
- **Storage**: `response_drafts` table per Phase 1 schema. Deleted on final submission.

### Public (Unauthenticated) Surveys — New in Phase 2

- **Per-survey toggle**: Admin can mark any survey as "Public link enabled" in the builder. Generates a shareable URL: `/survey/public/[survey-slug-or-id]`.
- **No login required**: The public survey route bypasses auth middleware for surveys with `public_link_enabled = true`.
- **No info collected**: Respondent provides nothing — name, email, or role. Completely anonymous fill.
- **Deduplication**: Cookie-based — on submit, set a cookie with the survey ID. If the cookie exists on return, show "You've already submitted this survey." Soft protection appropriate for internal org surveys.
- **No role-targeted sections for public**: Public respondents see all sections (no role targeting applies since there's no authenticated profile). Admin should design public surveys accordingly.
- **Segmentation metadata**: Public responses store `is_anonymous = true`, `user_id = NULL`. No department/tenure/role metadata (unknown). Stored separately so analytics can distinguish authenticated-anonymous vs. public responses.
- **Participation tracking**: Public submissions don't create a `participation_token` (no user_id). A separate `public_response_count` is tracked for participation rate display.

### Claude's Discretion

- Exact Tailwind color palette for status badges and progress bar
- Loading skeleton vs. spinner for survey list and section load
- Exact animation timing/easing for conditional question reveal
- Auto-redirect timer (5 seconds is guidance, Claude can adjust for UX feel)
- Admin survey list table/card design (how admin sees all surveys — not discussed)
- Error states for autosave failure (suggested: subtle red indicator "Save failed — retrying")
- Survey preview mode for admin (suggested: preview button opens a read-only take-survey flow)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `createSupabaseServerClient()` — RSC data fetching, already wired; use for all survey/response Server Components
- `createSupabaseBrowserClient()` — for client components needing realtime autosave
- `supabaseAdmin` — for privileged ops: creating surveys, setting public_link_enabled, refreshing metrics
- `signOut` server action — already in `lib/actions/auth.ts`; survey pages inherit the same sign-out pattern
- `ROLE_ROUTES` constant — used in middleware and post-login redirect; public survey route needs to be whitelisted in `PUBLIC_ROUTES` in `middleware.ts`
- Route groups: `(employee)` for `/dashboard` and survey flow; `(admin)` for `/admin` survey builder

### Established Patterns

- Server Actions for mutations (signIn, signOut) — use same pattern for survey submit, autosave, lifecycle transitions
- `await cookies()` required for server clients (Next.js 15 async cookies breaking change)
- `getUser()` not `getSession()` in all server contexts
- Tailwind only — no component library; build primitives inline
- TypeScript strict mode throughout
- `import 'server-only'` guard on `supabaseAdmin`

### Integration Points

- Middleware `PUBLIC_ROUTES` array needs `/survey/public/` prefix added for unauthenticated public surveys
- Employee `(employee)/dashboard/page.tsx` stub → replace with survey list component
- Admin `(admin)/admin/page.tsx` stub → replace with survey management list + link to builder
- `response_drafts` table already in schema — autosave writes here, submission deletes from here
- `participation_tokens` table — authenticated submissions write here for participation rate tracking
- `public.current_user_role()` helper available for RLS policies on new routes

</code_context>

<specifics>
## Specific Ideas

- Survey taking: resume banner should be dismissible but not permanent — "Your progress has been saved. [Continue →]" with the Continue button advancing to the last section
- Public surveys: the shareable URL should be human-readable where possible (slug-based)
- Admin builder: sections should show a visual checkmark when all required questions have been configured with dimensions
- Autosave failure: show "Save failed — retrying" in the same status indicator location, avoid blocking the user

</specifics>

<deferred>
## Deferred Ideas

- Email notifications when survey opens / reminder before close — v2 (NOTIF-01, NOTIF-02 in requirements)
- Real-time participation counter updating while survey is open — Phase 3 analytics
- Survey preview mode for admin — Claude can implement as discretion item; not a user decision
- Drag-and-drop reordering for sections/questions — deferred post-v1 (up/down arrows sufficient for now)
- AND/OR multi-condition rules for conditional questions — v2 (single condition sufficient for diagnostic survey)
- QR code generation for public survey links — future enhancement
- Survey response export (CSV/Excel) — Phase 4 admin tools

</deferred>

---

*Phase: 02-survey-engine*
*Context gathered: 2026-03-15*
