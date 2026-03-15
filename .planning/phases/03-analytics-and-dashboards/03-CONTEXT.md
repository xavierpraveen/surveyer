# Phase 3: Analytics and Dashboards - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the complete analytics engine and all three dashboard surfaces: leadership dashboard (full org health picture with filters), manager dashboard (team-level privacy-gated data), and the public `/results` page (company-wide aggregates for all authenticated employees). The `derived_metrics` table is populated via admin-triggered Supabase RPC after a survey closes. Analytics, dashboards, and qualitative theme display are in scope. Action creation/editing, publication snapshots, and qualitative tagging are Phase 4.

The Phase 1 schema (`derived_metrics`, `qualitative_themes`, `qualitative_tags`, analytics views) and Phase 2 survey/response data are already live — this phase adds the scoring RPC, all dashboard UI, and the `/results` page on top of them.

</domain>

<decisions>
## Implementation Decisions

### Visualization Library

- **Chart library**: Recharts — composable, lower-level, TypeScript-native, no opinionated design system overlay. Fits Tailwind-only codebase.
- **URL filter state**: `nuqs` — explicitly deferred to Phase 3 from Phase 1; use for all filter/selector state on leadership dashboard so links are shareable.
- **Chart types by section**:
  - Dimension scores: horizontal bar chart (12 bars, one per dimension, avg score 1–5, with favorable/neutral/unfavorable stacked segments)
  - Department heatmap: color-coded table (departments as rows, dimensions as columns, cell background green/yellow/red by score — pure Tailwind, no chart library)
  - Trend lines across cycles: line chart (one line per selected dimension, survey cycles on X axis)
  - Participation rate: simple numeric KPI (no chart needed)

### Leadership Dashboard Layout

- **Structure**: Single scrollable page at `/leadership/dashboard` — all sections on one page, no tabs or sub-routes.
- **Above the fold**: KPI strip with 4–5 key metrics: Overall Health Score, Participation Rate, # Responses, Survey Period, # Dimensions Below Threshold. Below the KPI strip: survey selector dropdown + sticky filter bar.
- **Sticky filter bar**: Sticks below the KPI strip as you scroll. Dropdowns for department, role, tenure band, and survey period. All filter state stored in URL via `nuqs`. Applying a filter re-fetches analytics data via Server Actions.
- **Section order (top to bottom)**: KPI strip → filter bar → dimension scores (horizontal bars) → department heatmap → trend lines → participation breakdown → qualitative themes → action items (read-only preview of public items)
- **Qualitative themes**: Two-column layout — "Top Issues" (left) and "Top Suggestions" (right). Each column shows pill badges with tag name + count, sorted by frequency.
- **Below-threshold behavior**: Replace any score/bar/cell with a gray `---` placeholder. On hover: tooltip reading "Fewer than 5 responses in this segment — results hidden to protect anonymity." Consistent across all sections (heatmap cells, bars, trend points).

### Manager Dashboard

- **Location**: `/manager/dashboard` (replacing existing stub)
- **Scope**: Team-level data only — manager sees their team's participation rate and dimension scores, privacy-gated by threshold.
- **Team definition**: Based on `profiles.team_id` matching profiles where the team's `manager_id` = current user's profile ID.
- **Privacy gate**: Dimension scores only appear when team respondent count ≥ 5 (same threshold as leadership). Participation rate always visible (no individual identity revealed by a count).
- **No segment filter controls**: Manager sees their team's data; no department/role drilling. Claude's discretion on exact layout.

### Derived Metrics Computation

- **Trigger**: Admin manually initiates via a "Compute Results" primary action button in the survey lifecycle status banner — appears after the survey transitions to `closed`. Same banner the admin already uses for Draft → Schedule → Open → Close.
- **Implementation**: Single `supabase.rpc('compute_derived_metrics', { survey_id })` call from a Server Action. The RPC stored procedure runs all aggregations in Postgres (by dimension, by segment type/value, computing avg_score, favorable/neutral/unfavorable pct, respondent_count) and bulk-inserts into `derived_metrics`. Returns count of rows inserted.
- **Admin UX**: Button shows loading state while RPC runs. On success: "Results computed — {N} metrics calculated." On error: descriptive error from RPC. Admin can re-run (idempotent — RPC deletes existing rows for that survey_id before inserting).
- **Lifecycle banner states after Phase 3**: Draft → Schedule → Open Now → Close Survey → Compute Results → (results available)

### Public Results Page (`/results`)

- **Route**: `/results` — accessible to ALL authenticated roles (no middleware restriction needed; existing middleware only blocks unauthenticated).
- **Default content**: Most recent closed survey that has computed `derived_metrics`. If no surveys have been computed yet: empty state "Results will appear here after the first survey cycle closes."
- **Data shown (company-wide aggregates only)**:
  - Participation rate (total submitted / total eligible)
  - Overall org health score (avg across all dimensions)
  - All 12 dimension scores (company-wide, no department/role breakdown)
  - Top qualitative themes — issues + suggestions (same two-column pill layout as leadership dashboard)
  - Public action items (is_public = true) in status-grouped list
- **No filters**: `/results` is intentionally filter-free. No department/role drilling — that's leadership-only.
- **Action items display**: Status-grouped list with four groups: Planned | In Progress | Blocked | Completed. Each item shows: title, owner name, target date, and most recent update excerpt. Count badge per group.
- **No cycle selector in v1**: Always shows most recent closed + computed cycle. Multi-cycle browsing deferred.

### Claude's Discretion

- Exact color scale for heatmap (green/yellow/red thresholds — e.g., ≥4.0 = green, 3.0–3.9 = yellow, <3.0 = red)
- Exact Recharts component configuration (margins, tooltips, legends, responsive container sizing)
- Manager dashboard layout density and card arrangement
- Loading skeleton design for chart sections
- Error states for RPC computation failure
- `/results` page hero section design (how participation rate and headline score are displayed)
- Whether to use `nuqs` for the survey selector on leadership dashboard (yes — consistent with filter approach)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `createSupabaseServerClient()` — RSC data fetching; use for all analytics Server Components
- `createSupabaseBrowserClient()` — for filter bar client component (nuqs + Supabase re-fetch)
- `supabaseAdmin` — for the `compute_derived_metrics` RPC call (privileged operation)
- `signOut` server action — dashboards inherit same sign-out pattern
- Phase 2 `SurveyWizard` components — not reused here, but survey types in `src/lib/types/survey.ts` are available

### Established Patterns

- Server Actions for mutations — use same pattern for `computeDerivedMetrics` action
- RSC data fetching with `createSupabaseServerClient()` for all dashboard Server Components
- `await cookies()` required (Next.js 15 async cookies — already set in all Phase 2 RSCs)
- `getUser()` not `getSession()` in server contexts (established Phase 1)
- Tailwind only — no component library; charts via Recharts, everything else Tailwind primitives
- TypeScript strict mode throughout; `supabaseAdmin` cast to `any` for DB calls until `supabase gen types` is re-run

### Integration Points

- Middleware needs `/results` added to allowed routes for `employee` role — actually, middleware already allows `/results` (no `leadership`/`admin`/`manager` prefix check). Verify before implementing.
- `src/app/(leadership)/leadership/dashboard/page.tsx` stub → replace with full leadership dashboard RSC
- `src/app/(manager)/manager/dashboard/page.tsx` stub → replace with manager dashboard RSC
- `derived_metrics` table already exists from Phase 1 schema — Phase 3 adds the RPC that populates it
- `qualitative_themes` and `qualitative_tags` tables exist but will be empty until Phase 4 analyst tagging — Phase 3 renders them (gracefully handles empty state)
- Survey lifecycle banner in `src/components/admin/SurveyStatusBanner.tsx` — needs "Compute Results" state added after `closed`

</code_context>

<specifics>
## Specific Ideas

- Heatmap cells: pure Tailwind background color (`bg-green-100`, `bg-yellow-100`, `bg-red-100` with text color to match) — no SVG or canvas. Makes it copy-pasteable and printer-friendly.
- The gray `---` below-threshold placeholder should use a consistent component (e.g. `<ThresholdPlaceholder />`) so all sections show exactly the same treatment.
- The KPI strip should be cards that feel like the employee survey cards from Phase 2 — consistent design language across the app.
- "Compute Results" button in the lifecycle banner: use a distinct color (e.g., blue primary) to distinguish it from the destructive red "Close Survey" — different intent.

</specifics>

<deferred>
## Deferred Ideas

- Multi-cycle browsing on `/results` — v2 (users asked for it conceptually but not in scope)
- Real-time participation counter while survey is open — Phase 3 analytics only shows closed surveys; Supabase Realtime for live counters was noted as a Phase 3 consideration but kept out of scope
- Manager dashboard historical trend lines across cycles — v2 (requires 2+ cycles of real data; noted in REQUIREMENTS as MGR-01)
- AI-assisted theme summarization on the qualitative section — v2 (provider interface exists but no live LLM; QUAL-01)
- Export to CSV for leadership dashboard — not in Phase 3 scope; Phase 4 admin tools

</deferred>

---

*Phase: 03-analytics-and-dashboards*
*Context gathered: 2026-03-15*
