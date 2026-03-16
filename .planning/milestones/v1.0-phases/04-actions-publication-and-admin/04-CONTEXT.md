# Phase 4: Actions, Publication and Admin - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 closes the transparency loop: leadership creates and manages action items linked to survey dimensions, immutable publication snapshots lock results at a point in time, employees view committed actions on the transparency page, admins run the platform operationally (CSV roster import, privacy threshold config, live participation monitoring, survey cycle archival), and survey analysts review and tag open-text responses to surface qualitative themes.

Phase 3 analytics, dashboards, and derived_metrics computation are already live. This phase adds all action/publication/admin UI on top of the existing schema.

</domain>

<decisions>
## Implementation Decisions

### Action Item Management

- **Location**: Dedicated `/admin/actions` page — full CRUD table separate from dashboards
- **List view**: Table with inline status filter tabs: All | Planned | In Progress | Blocked | Completed. Columns: title, owner, priority, target date, status badge, is_public toggle
- **Detail/edit**: `/admin/actions/[id]` — action fields (title, problem statement, owner, department, priority, target date, success criteria, is_public toggle) in an edit form at the top
- **Progress updates**: Timeline section below the edit form on `/admin/actions/[id]` — chronological list of `action_updates` with a "Post Update" text area + submit button at the bottom
- **Who can create**: `leadership`, `admin`, and `hr_admin` roles — all elevated roles can create and edit; ownership (who's responsible for delivering) is a separate owner_id field

### Publication Snapshot Workflow

- **Trigger location**: `/admin/surveys/[id]` page — after survey is `closed` and metrics are computed, a "Publish Results" button appears in the survey detail area
- **Review step**: Clicking "Publish Results" opens a confirmation modal showing a summary preview of what will be captured: dimension scores (count), participation rate, action item count, theme count — admin confirms before the immutable snapshot is written
- **Snapshot contents**: dimension scores (company-wide), participation rate, top qualitative themes, all currently public action items — captured as a JSONB blob in `publication_snapshots`
- **Historical browsing**: Cycle selector dropdown at the top of `/results` — "Viewing: Q1 2026 (published) | Q2 2026 (current)". Selecting a past cycle loads the frozen snapshot data instead of live `derived_metrics`

### Admin Operational Interfaces

- **Organization**: Single `/admin/settings` page with four tabs: Employees | Privacy | Participation | Cycles
- **Employees tab (CSV import)**: File picker input → parse CSV on selection → show a preview table of parsed rows (columns: name, email, department, role, tenure band) with error rows flagged red → "Import N employees" confirm button. Missing required fields block import per row.
- **Privacy tab**: Form fields for `privacy_threshold_numeric` (default 5) and `privacy_threshold_text` (default 10), read from and written to `app_settings` table
- **Participation tab**: Table showing department | eligible | responded | rate % for the currently open survey (if any). Auto-refreshes every 30 seconds via `setInterval` in a client component. Shows "No survey currently open" when none active.
- **Cycles tab**: List of all surveys with their status. Archived surveys show a badge. Non-archived closed surveys have an "Archive" button that sets an `archived` flag, hiding them from employee dashboard and active admin survey list while preserving all data for historical analytics

### Qualitative Tagging Interface

- **Location**: Dedicated `/admin/surveys/[id]/tags` page — per-survey tagging workspace
- **Tagging UI**: List of all open-text `response_answers` for the survey (anonymized — no user name attached). Each row shows: the response text, a tag input field with autocomplete showing existing tags from previous entries (free-form, no predefined taxonomy), and existing tags as removable pills
- **Theme generation**: After tagging, a "Generate Themes" button clusters tags by frequency and co-occurrence, writes rows to `qualitative_themes` (theme = most frequent tag in cluster as label, tag_cluster = array of contributing tags). Analyst can edit theme labels before saving.
- **Issue vs suggestion**: `qualitative_themes.is_positive` bool — after theme generation, analyst can toggle each theme as positive (suggestion shown on right column) or negative (issue shown on left column). Matches the two-column display on the leadership dashboard and `/results` already built in Phase 3.

### Claude's Discretion

- Exact Tailwind styling for the action items table (row hover, priority badge colors, status badge variants)
- Pagination vs infinite scroll for the `/admin/actions` table
- CSV parse library choice (built-in `TextDecoder` or a lightweight parser)
- Exact auto-refresh implementation detail (setInterval cleanup on unmount)
- Empty states for each admin settings tab
- Whether "Generate Themes" is async (background RPC) or sync — default to sync for v1 simplicity

</decisions>

<specifics>
## Specific Ideas

- The publication snapshot review modal should feel like a final confirmation, not a configuration step — show summarized counts ("12 dimension scores, 82% participation, 4 action items, 7 themes") so the analyst is confident before hitting confirm
- The `/results` cycle selector should make it visually clear which cycle is "published" (a lock icon or "Published" badge) vs "live" — employees need to understand what they're reading
- The participation auto-refresh in admin settings should show a "Last updated: Xm ago" timestamp so the admin knows how fresh the data is
- The tagging page should show a tag frequency sidebar ("workload: 12 responses", "communication: 8 responses") so the analyst can see which tags are trending as they work

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `supabaseAdmin` — service role client for action CRUD, snapshot creation, CSV import; consistent with Phase 2/3 pattern
- `createSupabaseServerClient()` — RSC data fetching for action lists, settings reads
- Server Action pattern (`src/lib/actions/`) — `{ success: bool; data?: T; error?: string }` return type, Zod validation, role check on `user.app_metadata?.role`
- `QualitativeThemePanel` (`src/components/analytics/`) — already renders themes in two-column pill layout; tagging page writes to `qualitative_themes` table which this component reads
- `SurveyStatusBanner` (`src/components/admin/SurveyStatusBanner.tsx`) — existing 5-state lifecycle banner; "Publish Results" trigger integrates here after the "Compute Results" state
- `v_public_actions` view — already in schema for reading public action items; `/results` page already queries it
- `ThresholdPlaceholder` — consistent privacy threshold UI component across all dashboard surfaces

### Established Patterns

- All mutations via Server Actions with Zod validation + role check (never client-side `supabase.from()` for mutations)
- RSC for data fetching; `'use client'` only where interaction is required (auto-refresh, file input, tag input)
- `supabaseAdmin as any` for all admin client DB calls (database.types.ts is a stub until `supabase gen types` is re-run)
- `await cookies()` required in all server contexts (Next.js 15 async cookies)
- `getUser()` not `getSession()` in all server auth checks
- Tailwind only — no component library; use existing primitive patterns from Phase 2/3

### Integration Points

- `/admin/surveys/[id]` — "Publish Results" button added after survey is `closed` + metrics computed; integrates with existing survey detail page
- `/results` page (`src/app/results/page.tsx`) — cycle selector dropdown added; must detect published snapshots and load snapshot data when a past cycle is selected
- `SurveyStatusBanner` — no new state needed for Phase 4 (the banner already handles `closed` + `compute_results`); "Publish Results" lives on the survey detail page, not the banner
- `action_items` and `action_updates` tables — already in schema from Phase 1; no migrations needed
- `qualitative_tags` and `qualitative_themes` tables — already in schema; Phase 4 populates them
- `publication_snapshots` table — already in schema with trigger enforcing no UPDATE/DELETE
- `app_settings` table — already in schema with `privacy_threshold_numeric` and `privacy_threshold_text` keys

</code_context>

<deferred>
## Deferred Ideas

- Export to CSV for action items or survey responses — post-v1
- Email notifications to action item owners on status change — v2 (NOTIF-03 in requirements)
- Manager dashboard action plans view (DASH-07) — deferred from Phase 3; could be added in Phase 4 as a stretch goal if time allows
- AI-assisted tag suggestions on the tagging page — explicitly out of scope in v1 (provider interface designed but no live LLM)
- Multi-tenant cycle comparison across organizations — out of scope v1
- Drag-and-drop reordering of action items by priority — post-v1; up/down arrows or manual priority field sufficient

</deferred>

---

*Phase: 04-actions-publication-and-admin*
*Context gathered: 2026-03-16*
