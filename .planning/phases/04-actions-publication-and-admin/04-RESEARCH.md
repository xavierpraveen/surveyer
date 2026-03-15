# Phase 4: Actions, Publication and Admin - Research

**Researched:** 2026-03-16
**Domain:** Next.js 15 App Router + Supabase — CRUD UI, immutable snapshots, CSV import, qualitative tagging
**Confidence:** HIGH (all findings from direct codebase inspection; no library unknowns — stack frozen in Phases 1-3)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Action Item Management**
- Location: Dedicated `/admin/actions` page — full CRUD table separate from dashboards
- List view: Table with inline status filter tabs: All | Planned | In Progress | Blocked | Completed. Columns: title, owner, priority, target date, status badge, is_public toggle
- Detail/edit: `/admin/actions/[id]` — action fields (title, problem statement, owner, department, priority, target date, success criteria, is_public toggle) in an edit form at the top
- Progress updates: Timeline section below the edit form on `/admin/actions/[id]` — chronological list of `action_updates` with a "Post Update" text area + submit button at the bottom
- Who can create: `leadership`, `admin`, and `hr_admin` roles — all elevated roles can create and edit; ownership (who's responsible for delivering) is a separate owner_id field

**Publication Snapshot Workflow**
- Trigger location: `/admin/surveys/[id]` page — after survey is `closed` and metrics are computed, a "Publish Results" button appears in the survey detail area
- Review step: Clicking "Publish Results" opens a confirmation modal showing a summary preview (dimension scores count, participation rate, action item count, theme count) — admin confirms before the immutable snapshot is written
- Snapshot contents: dimension scores (company-wide), participation rate, top qualitative themes, all currently public action items — captured as a JSONB blob in `publication_snapshots`
- Historical browsing: Cycle selector dropdown at the top of `/results` — "Viewing: Q1 2026 (published) | Q2 2026 (current)". Selecting a past cycle loads the frozen snapshot data instead of live `derived_metrics`

**Admin Operational Interfaces**
- Organization: Single `/admin/settings` page with four tabs: Employees | Privacy | Participation | Cycles
- Employees tab (CSV import): File picker → parse CSV on selection → show preview table (name, email, department, role, tenure band) with error rows flagged red → "Import N employees" confirm button. Missing required fields block import per row.
- Privacy tab: Form fields for `privacy_threshold_numeric` (default 5) and `privacy_threshold_text` (default 10), read from and written to `app_settings` table
- Participation tab: Table showing department | eligible | responded | rate % for currently open survey. Auto-refreshes every 30 seconds via `setInterval`. Shows "No survey currently open" when none active.
- Cycles tab: List of all surveys with their status. Archived surveys show a badge. Non-archived closed surveys have an "Archive" button that sets an `archived` flag, hiding them from employee dashboard and active admin survey list while preserving all data for historical analytics

**Qualitative Tagging Interface**
- Location: Dedicated `/admin/surveys/[id]/tags` page — per-survey tagging workspace
- Tagging UI: List of all open-text `response_answers` for the survey (anonymized). Each row shows: the response text, a tag input field with autocomplete showing existing tags, and existing tags as removable pills
- Theme generation: After tagging, a "Generate Themes" button clusters tags by frequency and co-occurrence, writes rows to `qualitative_themes`. Analyst can edit theme labels before saving.
- `qualitative_themes.is_positive` bool — analyst can toggle each theme as positive (suggestion) or negative (issue)

### Claude's Discretion

- Exact Tailwind styling for the action items table (row hover, priority badge colors, status badge variants)
- Pagination vs infinite scroll for the `/admin/actions` table
- CSV parse library choice (built-in `TextDecoder` or a lightweight parser)
- Exact auto-refresh implementation detail (setInterval cleanup on unmount)
- Empty states for each admin settings tab
- Whether "Generate Themes" is async (background RPC) or sync — default to sync for v1 simplicity

### Deferred Ideas (OUT OF SCOPE)

- Export to CSV for action items or survey responses — post-v1
- Email notifications to action item owners on status change — v2 (NOTIF-03)
- Manager dashboard action plans view (DASH-07) — stretch goal only if time allows
- AI-assisted tag suggestions on the tagging page — explicitly out of scope in v1
- Multi-tenant cycle comparison across organizations — out of scope v1
- Drag-and-drop reordering of action items by priority — post-v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACTIONS-01 | Leadership/admin can create action items linked to survey cycle and one or more dimensions | `action_items` table has `survey_id` FK. Missing: dimension link — need `action_item_dimensions` join table OR store `dimension_ids TEXT[]` on action_items. Recommend TEXT[] array column for v1 simplicity; already supported by Postgres. Needs migration. |
| ACTIONS-02 | Each action item has: title, problem statement, owner, department/team, priority, target date, status, measurable success criteria | All columns exist in `action_items`: title, problem_statement, owner_id, department_id, priority (enum), target_date, status (enum), success_criteria. Schema complete. |
| ACTIONS-03 | Action status has five states: identified → planned → in-progress → blocked → completed | `action_status_enum` already defined with all five values. No migration needed. |
| ACTIONS-04 | Action item owners can post progress updates to a timeline log | `action_updates` table exists with action_item_id FK, content, created_by, created_at. Schema complete. |
| ACTIONS-05 | Each action has a public visibility toggle; only public actions appear on employee-facing transparency page | `is_public BOOLEAN DEFAULT FALSE` column on `action_items`. `v_public_actions` view already filters to is_public=TRUE. Both exist. |
| ACTIONS-06 | Employees can view the "Open Results and Actions" page showing: identified issues, committed actions, in-progress work, blocked items, completed items | `/results` page already renders grouped PublicActions. Phase 4 adds cycle selector for snapshot browsing. |
| PUBLISH-01 | Analyst/leadership can create an immutable publication snapshot after a survey closes | `publication_snapshots` table exists with immutability trigger. Need `createPublicationSnapshot` Server Action that gathers data and INSERTs. |
| PUBLISH-02 | Snapshot is a versioned JSONB blob capturing dimension scores, participation, themes, and action items at time of publication | `snapshot_data JSONB` column on `publication_snapshots`. Snapshot shape to define: `{ dimensionScores, participationRate, totalResponses, qualitativeThemes, publicActions }` |
| PUBLISH-03 | Published snapshot is attached to committed action items | Snapshot captures `publicActions` array in JSONB at time of publish. No schema FK needed — embedded in blob per immutability requirement. |
| PUBLISH-04 | Employees can view a published snapshot even after live data changes | `/results` cycle selector loads from `publication_snapshots.snapshot_data` when past cycle selected. Current cycle always reads live `derived_metrics`. |
| PUBLISH-05 | Survey must be in `closed` state before a snapshot can be created (DB-enforced) | Schema: `publication_snapshots.survey_id` FK to surveys. Need a CHECK or RPC guard. Safest: Server Action validates survey.status === 'closed' before INSERT; supabaseAdmin bypasses RLS but application-layer check is sufficient since RLS INSERT policy already requires elevated role. |
| ADMIN-01 | Admin can create, edit, publish, schedule, and close surveys | Already complete from Phase 2. "Publish Results" button added to `/admin/surveys/[id]` in Phase 4. |
| ADMIN-02 | Admin can manage questions: create, edit, reorder, delete, set type and targeting | Already complete from Phase 2. |
| ADMIN-03 | Admin can map questions to dimensions | Already complete from Phase 2. |
| ADMIN-04 | Admin can import and manage employee directory | `/admin/settings` Employees tab — CSV parse + preview + confirm import Server Action |
| ADMIN-05 | Admin can configure privacy thresholds | `/admin/settings` Privacy tab — reads/writes `app_settings` table keys |
| ADMIN-06 | Admin can monitor participation rates in real time while a survey is open | `/admin/settings` Participation tab — 30s auto-refresh client component reading `v_participation_rates` |
| ADMIN-07 | Admin can manage action items (create, assign, update status) | `/admin/actions` and `/admin/actions/[id]` — CRUD with timeline |
| ADMIN-08 | Admin can archive completed survey cycles | `/admin/settings` Cycles tab — "Archive" button sets `surveys.archived = true`. Needs migration to add `archived` column. |
| ADMIN-09 | Survey analyst can review and edit qualitative theme tags | `/admin/surveys/[id]/tags` — tagging workspace with Generate Themes |
</phase_requirements>

---

## Summary

Phase 4 is an **application-layer phase with zero analytics schema work**. All tables (`action_items`, `action_updates`, `publication_snapshots`, `qualitative_tags`, `qualitative_themes`, `app_settings`) already exist from Phase 1 with correct RLS. The work is building CRUD UI, a snapshot creation workflow, admin settings tabs, and the qualitative tagging workspace on top of the schema that is already in place.

Two migrations are needed:
1. Add `archived BOOLEAN NOT NULL DEFAULT FALSE` to the `surveys` table (ADMIN-08).
2. Optionally add `dimension_ids TEXT[]` to `action_items` to link action items to dimensions (ACTIONS-01). The existing schema has only `survey_id`; linking to specific dimensions is a Phase 4 addition.

The publication snapshot is the most complex piece. The STATE.md concern about "atomic snapshot creation may require a stored procedure" is real but manageable: the `supabaseAdmin` client can execute a multi-step snapshot build in application code because the `publication_snapshots` INSERT is the only write and it is atomic. All reads happen first, then one INSERT. No partial-state problem exists because the snapshot is new data — there is nothing to partially update. A Postgres RPC is a nicer pattern but not required.

The `/results` page cycle selector adds client interactivity (URL search param) to an existing RSC page — it will follow the nuqs pattern already used on the leadership dashboard.

**Primary recommendation:** Build Phase 4 as two plans — Plan 1 handles the migration + all Server Actions (actions, publication, settings, tagging) + new TypeScript types; Plan 2 handles all UI pages and components. This mirrors the Phase 2/3 structure and isolates data layer from presentation.

---

## Standard Stack

### Core (all already installed — no new deps needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.x (pinned) | RSC pages + Server Actions | Project standard |
| Supabase JS | 2.x | DB reads + auth | Project standard |
| Zod | 3.x | Server Action input validation | Project standard — every SA uses it |
| Tailwind CSS | 3.x | All styling | Project standard — no component library |
| nuqs | ^2.x | URL search params for cycle selector | Already installed from Phase 3 |

### New Dependency (for CSV import)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| papaparse | ^5.x | CSV parsing | Lightweight, browser+server, handles quoted fields and edge cases |

**Installation:**
```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

**Alternative:** Use the native `TextDecoder` + manual split approach. This is within Claude's discretion per CONTEXT.md. Papaparse is recommended because CSV edge cases (quoted commas, BOM byte, encoding) are reliably handled without custom code. It is 26KB and has no dependencies.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| papaparse | Manual TextDecoder split | Manual split fails on quoted fields containing commas — a real CSV gotcha |
| nuqs URL param for cycle | useState | URL param gives shareable/bookmarkable cycle selection, consistent with Phase 3 pattern |
| Application-layer snapshot | Postgres RPC/stored procedure | RPC is cleaner but adds another migration file; app-layer is sufficient since snapshot is a single INSERT |

---

## Architecture Patterns

### Recommended Project Structure (Phase 4 additions)

```
src/
├── lib/
│   ├── actions/
│   │   ├── actions.ts          # NEW: action item CRUD + progress updates Server Actions
│   │   ├── publication.ts      # NEW: createPublicationSnapshot + getPublicationSnapshot
│   │   ├── settings.ts         # NEW: getAppSettings, updateAppSettings, importEmployees
│   │   └── tagging.ts          # NEW: getResponseAnswersForTagging, upsertTag, deleteTag, generateThemes
│   └── types/
│       └── phase4.ts           # NEW: ActionItem, ActionUpdate, PublicationSnapshot, AppSettings types
├── app/
│   ├── (admin)/admin/
│   │   ├── actions/
│   │   │   ├── page.tsx        # NEW: /admin/actions list
│   │   │   └── [id]/page.tsx   # NEW: /admin/actions/[id] detail + timeline
│   │   ├── settings/
│   │   │   └── page.tsx        # NEW: /admin/settings tabbed page
│   │   └── surveys/
│   │       └── [id]/
│   │           ├── page.tsx    # EXISTING: add "Publish Results" button
│   │           └── tags/
│   │               └── page.tsx  # NEW: /admin/surveys/[id]/tags
│   └── results/
│       └── page.tsx            # EXISTING: add cycle selector dropdown
├── components/
│   ├── admin/
│   │   ├── ActionItemForm.tsx         # NEW: 'use client' form for create/edit
│   │   ├── ActionUpdateTimeline.tsx   # NEW: 'use client' timeline + post update
│   │   ├── PublishResultsButton.tsx   # NEW: 'use client' modal trigger
│   │   ├── PublishConfirmModal.tsx    # NEW: 'use client' review modal
│   │   ├── SettingsTabs.tsx           # NEW: 'use client' tab switcher wrapper
│   │   ├── EmployeeImportTab.tsx      # NEW: 'use client' CSV picker + preview
│   │   ├── PrivacySettingsTab.tsx     # NEW: 'use client' threshold form
│   │   ├── ParticipationMonitorTab.tsx # NEW: 'use client' auto-refresh table
│   │   ├── CyclesTab.tsx              # NEW: 'use client' archive controls
│   │   └── TaggingWorkspace.tsx       # NEW: 'use client' tag input + theme gen
│   └── results/
│       └── CycleSelector.tsx          # NEW: 'use client' dropdown for /results
supabase/migrations/
│   └── 20260316000007_phase4.sql      # NEW: add archived to surveys, add dimension_ids to action_items
```

### Pattern 1: Server Action with Zod + Role Guard

Every mutation follows this identical shape (established in Phases 1-3):

```typescript
// src/lib/actions/actions.ts
'use server'
import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const db = supabaseAdmin as any

const createActionItemSchema = z.object({
  surveyId: z.string().uuid().nullable(),
  title: z.string().min(1).max(300),
  problemStatement: z.string().nullable(),
  ownerId: z.string().uuid().nullable(),
  departmentId: z.string().uuid().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  targetDate: z.string().nullable(),   // ISO date string
  status: z.enum(['identified', 'planned', 'in_progress', 'blocked', 'completed']),
  successCriteria: z.string().nullable(),
  isPublic: z.boolean().default(false),
  dimensionIds: z.array(z.string().uuid()).default([]),
})

export async function createActionItem(
  input: unknown
): Promise<{ success: true; data: ActionItem } | { success: false; error: string }> {
  const parsed = createActionItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Unauthorized' }

  const role = user.app_metadata?.role as string | undefined
  if (!role || !['leadership', 'admin', 'hr_admin'].includes(role)) {
    return { success: false, error: 'Forbidden: leadership or admin role required' }
  }

  const { dimensionIds, ...fields } = parsed.data
  const { data, error } = await db
    .from('action_items')
    .insert({
      survey_id: fields.surveyId,
      title: fields.title,
      problem_statement: fields.problemStatement,
      owner_id: fields.ownerId,
      department_id: fields.departmentId,
      priority: fields.priority,
      target_date: fields.targetDate,
      status: fields.status,
      success_criteria: fields.successCriteria,
      is_public: fields.isPublic,
      dimension_ids: dimensionIds,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as ActionItem }
}
```

### Pattern 2: Publication Snapshot Creation

The snapshot is built in application layer — all reads, then one INSERT:

```typescript
// src/lib/actions/publication.ts
export async function createPublicationSnapshot(
  surveyId: string
): Promise<{ success: true; data: { snapshotId: string } } | { success: false; error: string }> {
  // 1. Role guard: leadership, admin, survey_analyst only
  // 2. Verify survey.status === 'closed' — return error if not
  // 3. Check no existing snapshot for this surveyId (prevent duplicate publish)
  // 4. Gather snapshot data:
  //    a. dimensionScores — from derived_metrics WHERE survey_id AND segment_type='overall'
  //    b. participationRate — from v_participation_rates
  //    c. qualitativeThemes — from qualitative_themes WHERE survey_id
  //    d. publicActions — from v_public_actions WHERE survey_id OR survey_id IS NULL
  // 5. Build snapshot_data JSONB object
  // 6. INSERT into publication_snapshots (survey_id, snapshot_data, published_by)
  //    — single INSERT is atomic; immutability trigger prevents UPDATE/DELETE
  // 7. Return snapshotId
}
```

**Why no stored procedure needed:** The snapshot is a net-new INSERT. There is no partial-update scenario. If step 6 fails, no snapshot exists and the user can retry. The only concern would be if the snapshot captured stale data between reads — acceptable for v1 where the analyst triggers this synchronously after computing metrics.

### Pattern 3: Auto-Refresh Client Component

```typescript
// src/components/admin/ParticipationMonitorTab.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'

export default function ParticipationMonitorTab({ initial }) {
  const [data, setData] = useState(initial)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refresh = useCallback(async () => {
    const result = await getParticipationForOpenSurvey()
    if (result.success) {
      setData(result.data)
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)  // cleanup on unmount
  }, [refresh])

  // render table + "Last updated: Xm ago"
}
```

**Key:** `useCallback` wrapping `refresh` prevents stale closure in `setInterval`. `clearInterval` in the cleanup prevents memory leaks.

### Pattern 4: CSV Import Flow

```typescript
// Client: EmployeeImportTab.tsx
// 1. <input type="file" accept=".csv"> — onChange calls Papa.parse(file, { header: true })
// 2. PapaParse returns { data: Row[], errors: ParseError[] }
// 3. Validate each row: required fields = name, email; optional = department, role, tenure_band
// 4. Show preview table with error rows highlighted red
// 5. "Import N employees" button calls importEmployees(validRows) Server Action

// Server Action: settings.ts
export async function importEmployees(rows) {
  // Role guard: admin, hr_admin only
  // For each row: upsert into auth.users (supabaseAdmin.auth.admin.createUser)
  //               then upsert into profiles
  // Return { imported: N, errors: string[] }
}
```

**Important:** `supabaseAdmin.auth.admin.createUser` must be used to create auth users — the public API requires email confirmation. Service role admin API creates users directly. Pattern established in Phase 1 seed scripts.

### Pattern 5: Cycle Selector on /results

```typescript
// Results page becomes a hybrid: RSC fetches initial data,
// CycleSelector is 'use client' with nuqs param ?cycle=<surveyId>
// When cycle is a past published survey → load from publication_snapshots.snapshot_data
// When cycle is the most recent (or unset) → load from live derived_metrics (existing behavior)

// getPublicResultsData() is extended with optional cycleId parameter:
export async function getPublicResultsData(cycleId?: string | null)
// If cycleId && publication_snapshots exists for that surveyId → return snapshot data
// Otherwise → existing live data path
```

### Anti-Patterns to Avoid

- **Never mutate publication_snapshots with UPDATE** — the DB trigger throws an exception. Only INSERT.
- **Never check survey.archived in the surveys RLS policy** — RLS policies cannot reference profiles; they should not add complex conditions. Filter `archived=false` at the application layer in all queries.
- **Never run setInterval without clearInterval cleanup** — leads to duplicate intervals if component remounts (React Strict Mode doubles mounts in dev).
- **Never use supabase.auth.admin from client** — only available server-side via supabaseAdmin with SUPABASE_SERVICE_ROLE_KEY. Pattern: `import 'server-only'` guards this.
- **Never call PapaParse on the server** — it works in Node but is designed for browser use; parse in the client component, then send validated rows to the Server Action.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Manual split/regex | papaparse | Quoted commas, BOM bytes, encoding, error rows — all handled |
| Snapshot immutability | Application-layer delete guard | Existing DB trigger `prevent_snapshot_mutation()` | Belt-and-suspenders already in schema |
| Tag autocomplete | Custom dropdown with manual filter | `<datalist>` HTML element OR simple `<input>` with filtered suggestion list from existing tags | Datalist is native, zero-dep, sufficient for v1 |
| Theme clustering | Custom NLP/clustering algorithm | Frequency count: group tags by value, sort by count descending — top N become themes | v1 has no LLM; frequency count matches the CONTEXT.md "free-form, no predefined taxonomy" design |

**Key insight:** The qualitative theme generation is defined in CONTEXT.md as: "clusters tags by frequency and co-occurrence, writes rows to `qualitative_themes` (theme = most frequent tag in cluster as label)". This means a simple `GROUP BY tag, COUNT(*)` query is the correct implementation — not ML clustering. The tags themselves are the themes.

---

## Common Pitfalls

### Pitfall 1: action_items missing dimension link
**What goes wrong:** The schema has `action_items.survey_id` but no column linking to specific dimensions. ACTIONS-01 requires actions to be "linked to one or more dimensions."
**Why it happens:** The schema was designed at Phase 1 before the dimension-link requirement was detailed.
**How to avoid:** Add `dimension_ids TEXT[]` column in the Phase 4 migration. Store dimension UUIDs as array. Application fetches dimension names by joining from the dimensions table client-side.
**Warning signs:** If ACTIONS-01 acceptance check asks "is this action linked to a dimension?" and no field exists.

### Pitfall 2: surveys table missing archived column
**What goes wrong:** ADMIN-08 requires archiving closed surveys. The `surveys` table has no `archived` column.
**Why it happens:** This was flagged as "Exception: surveys table may need an `archived` boolean column added" in the phase brief.
**How to avoid:** Migration `20260316000007_phase4.sql` adds `archived BOOLEAN NOT NULL DEFAULT FALSE`. The RLS on surveys does not need updating — `archived` is not a security boundary, it's a UI filter. The "surveys: employee sees open" policy already filters to `status = 'open'` so archived closed surveys are naturally hidden from employees.
**Warning signs:** Missing column error when trying to update surveys.archived.

### Pitfall 3: Duplicate publication snapshot for same survey
**What goes wrong:** Admin clicks "Publish Results" twice, creating two snapshots for the same survey.
**Why it happens:** No UNIQUE constraint on `publication_snapshots.survey_id`.
**How to avoid:** Server Action checks `SELECT count(*) FROM publication_snapshots WHERE survey_id = ?` before INSERT; if count > 0, return error "Results already published for this cycle." Optionally add a UNIQUE constraint in the migration.
**Warning signs:** Multiple snapshot rows for same survey_id.

### Pitfall 4: Auto-refresh interval not cleaned up
**What goes wrong:** ParticipationMonitorTab fires requests after component is unmounted (user navigates away). In React strict mode (dev), the interval fires twice.
**Why it happens:** `setInterval` without cleanup in `useEffect`.
**How to avoid:** Always return `() => clearInterval(id)` from the useEffect. Wrap refresh callback in `useCallback`.
**Warning signs:** Network requests appearing in DevTools after navigating away from /admin/settings.

### Pitfall 5: CSV import creating duplicate auth users
**What goes wrong:** Re-importing a CSV with existing emails fails or creates duplicate users.
**Why it happens:** `supabaseAdmin.auth.admin.createUser` throws if email already exists.
**How to avoid:** Use `upsert` semantics — check if user exists first via `supabaseAdmin.auth.admin.listUsers()`, or handle the 422 error gracefully and continue importing non-duplicate rows. Import Server Action should return `{ imported: N, skipped: M, errors: string[] }`.
**Warning signs:** Import fails entirely when even one email already exists.

### Pitfall 6: Snapshot reads stale derived_metrics
**What goes wrong:** Snapshot is created before metrics are computed, capturing zeroes.
**Why it happens:** Admin triggers publish without running "Compute Results" first.
**How to avoid:** Server Action checks `SELECT count(*) FROM derived_metrics WHERE survey_id = ?` before building snapshot. If count = 0, return error "Run 'Compute Results' before publishing."

### Pitfall 7: /results cycle selector breaking SSR for current cycle
**What goes wrong:** Adding `useSearchParams` to the results page makes it client-only, breaking the existing RSC fast path.
**Why it happens:** Mixing server and client rendering incorrectly.
**How to avoid:** Keep `results/page.tsx` as an RSC. Read the `?cycle` search param server-side via `searchParams` prop (Next.js 15 async searchParams pattern: `const { cycle } = await searchParams`). Pass the cycle param to `getPublicResultsData(cycle)`. No `'use client'` needed on the page itself. The `CycleSelector` component is `'use client'` but only manages the URL param change — no data fetching.

---

## Code Examples

### Migration: Phase 4 schema additions

```sql
-- supabase/migrations/20260316000007_phase4.sql

-- Add archived flag to surveys
ALTER TABLE public.surveys
  ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_surveys_archived ON public.surveys (archived);

-- Add dimension_ids array to action_items (links actions to specific dimensions)
ALTER TABLE public.action_items
  ADD COLUMN dimension_ids UUID[] NOT NULL DEFAULT '{}';

-- Optional: prevent duplicate snapshots per survey
ALTER TABLE public.publication_snapshots
  ADD CONSTRAINT uq_publication_snapshots_survey_id UNIQUE (survey_id);
```

### Reading app_settings

```typescript
// Server Action pattern for settings
export async function getAppSettings(): Promise<{ success: true; data: AppSettings } | { success: false; error: string }> {
  const { data, error } = await db
    .from('app_settings')
    .select('key, value')
    .in('key', ['privacy_threshold_numeric', 'privacy_threshold_text', 'allowed_email_domain'])

  if (error) return { success: false, error: error.message }

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return {
    success: true,
    data: {
      privacyThresholdNumeric: Number(map.privacy_threshold_numeric ?? 5),
      privacyThresholdText: Number(map.privacy_threshold_text ?? 10),
      allowedEmailDomain: String(map.allowed_email_domain ?? ''),
    },
  }
}
```

### Updating app_settings (UPSERT pattern)

```typescript
export async function updateAppSettings(
  key: string,
  value: number | string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db
    .from('app_settings')
    .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

### Qualitative theme generation (frequency-based)

```typescript
// In tagging.ts Server Action — sync, no LLM
export async function generateThemes(
  surveyId: string
): Promise<{ success: true; data: { themesCreated: number } } | { success: false; error: string }> {
  // 1. Fetch all tags for this survey's response_answers
  const { data: tags } = await db
    .from('qualitative_tags')
    .select('tag, response_answer_id')
    .in('response_answer_id',
      db.from('response_answers')
        .select('id')
        .in('response_id',
          db.from('responses').select('id').eq('survey_id', surveyId)
        )
    )

  // 2. Count tag frequencies
  const tagFreq = new Map<string, number>()
  const tagAnswers = new Map<string, Set<string>>()
  for (const t of tags ?? []) {
    tagFreq.set(t.tag, (tagFreq.get(t.tag) ?? 0) + 1)
    if (!tagAnswers.has(t.tag)) tagAnswers.set(t.tag, new Set())
    tagAnswers.get(t.tag)!.add(t.response_answer_id)
  }

  // 3. Top tags become themes (threshold: >= 2 occurrences)
  const themes = Array.from(tagFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)  // max 10 themes
    .map(([tag, count]) => ({
      survey_id: surveyId,
      theme: tag,
      tag_cluster: [tag],  // v1: single tag per theme; analyst can merge
      is_positive: false,   // default to issue; analyst toggles
    }))

  // 4. DELETE existing themes for this survey, INSERT new ones
  await db.from('qualitative_themes').delete().eq('survey_id', surveyId)
  const { error } = await db.from('qualitative_themes').insert(themes)

  if (error) return { success: false, error: error.message }
  return { success: true, data: { themesCreated: themes.length } }
}
```

### Snapshot data shape

```typescript
// Type for snapshot_data JSONB field
export interface SnapshotData {
  schemaVersion: 1
  surveyId: string
  surveyTitle: string
  publishedAt: string             // ISO timestamp
  participationRate: number       // 0-100
  totalResponses: number
  dimensionScores: Array<{
    dimensionId: string
    dimensionName: string
    dimensionSlug: string
    avgScore: number | null
    favorablePct: number | null
    neutralPct: number | null
    unfavorablePct: number | null
    respondentCount: number
    belowThreshold: boolean
  }>
  qualitativeThemes: Array<{
    id: string
    theme: string
    tagCluster: string[]
    summary: string | null
    isPositive: boolean
    tagCount: number
  }>
  publicActions: Array<{
    id: string
    title: string
    problemStatement: string | null
    status: string
    priority: string | null
    targetDate: string | null
    successCriteria: string | null
    departmentName: string | null
  }>
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js sync params | `await params` / `await searchParams` (async) | Next.js 15 | Must use async params in all pages — established pattern from Phase 2/3 |
| `getSession()` | `getUser()` for auth checks | Supabase best practice | Verifies JWT server-side; already established |
| Direct `supabase.from()` for mutations | Server Actions with Zod | Phase 1 decision | No mutations from client; consistent through all phases |

**Deprecated/outdated patterns in this codebase:**
- `supabase.auth.getSession()` — replaced by `getUser()` (already done in all actions)
- Client-side aggregation — banned; all analytics in Postgres (already done)

---

## Open Questions

1. **Dimension link on action items: array column vs join table**
   - What we know: `action_items` has only `survey_id`, not dimension FKs
   - What's unclear: Whether Phase 4 requires dimension filtering on the actions table or just display
   - Recommendation: Add `dimension_ids UUID[] DEFAULT '{}'` column (simpler migration, sufficient for v1 display). If filtering by dimension is needed, a GIN index covers it: `CREATE INDEX idx_action_items_dimension_ids ON action_items USING GIN (dimension_ids)`

2. **Publication snapshot uniqueness constraint**
   - What we know: No UNIQUE constraint on `publication_snapshots.survey_id`
   - What's unclear: Whether multiple snapshots per survey cycle are intentional (e.g., re-publish with updated action items)
   - Recommendation: For v1 (PUBLISH-04 — immutability), add the UNIQUE constraint. If the snapshot is immutable and employees view it unchanged, there should be exactly one per survey. If re-publishing is needed, a new survey cycle should be created.

3. **Employee import: create Supabase auth user or profile-only**
   - What we know: `supabaseAdmin.auth.admin.createUser` creates auth.users entry; profiles table has its own row
   - What's unclear: Whether the import flow should create auth users (full login) or just roster entries (profiles without auth)
   - Recommendation: Create full auth users with `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, password: <random> })` and upsert profiles. Users use magic link to log in — password is irrelevant. This matches CONTEXT.md "import employee roster" intent (AUTH-08 is already marked complete from Phase 1, so the pattern is already established in seed scripts at `/scripts/`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 2.1.9 + vite 5.4.21 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test` (runs `vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACTIONS-01 | createActionItem returns success with valid input | unit | `npm test -- src/__tests__/actions/actions.test.ts` | Wave 0 |
| ACTIONS-02 | createActionItem validates all required fields via Zod | unit | `npm test -- src/__tests__/actions/actions.test.ts` | Wave 0 |
| ACTIONS-03 | updateActionItem rejects invalid status transitions | unit | `npm test -- src/__tests__/actions/actions.test.ts` | Wave 0 |
| ACTIONS-04 | postActionUpdate stores content and created_by | unit | `npm test -- src/__tests__/actions/actions.test.ts` | Wave 0 |
| ACTIONS-05 | is_public toggle — only public actions in v_public_actions | unit | `npm test -- src/__tests__/actions/actions.test.ts` | Wave 0 |
| PUBLISH-01 | createPublicationSnapshot fails if survey not closed | unit | `npm test -- src/__tests__/actions/publication.test.ts` | Wave 0 |
| PUBLISH-02 | snapshot_data contains all required fields | unit | `npm test -- src/__tests__/actions/publication.test.ts` | Wave 0 |
| PUBLISH-05 | createPublicationSnapshot rejects open survey | unit | `npm test -- src/__tests__/actions/publication.test.ts` | Wave 0 |
| ADMIN-04 | importEmployees validates rows and returns skipped count | unit | `npm test -- src/__tests__/actions/settings.test.ts` | Wave 0 |
| ADMIN-05 | updateAppSettings persists threshold changes | unit | `npm test -- src/__tests__/actions/settings.test.ts` | Wave 0 |
| ADMIN-09 | generateThemes builds frequency-based theme list | unit | `npm test -- src/__tests__/actions/tagging.test.ts` | Wave 0 |
| ACTIONS-06/PUBLISH-04 | getPublicResultsData with cycleId loads snapshot not live data | unit | `npm test -- src/__tests__/actions/publication.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** All tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/actions/actions.test.ts` — covers ACTIONS-01 through ACTIONS-05
- [ ] `src/__tests__/actions/publication.test.ts` — covers PUBLISH-01, PUBLISH-02, PUBLISH-04, PUBLISH-05
- [ ] `src/__tests__/actions/settings.test.ts` — covers ADMIN-04, ADMIN-05
- [ ] `src/__tests__/actions/tagging.test.ts` — covers ADMIN-09 (generateThemes logic)

All Server Actions are pure async functions with supabase mocked — `vi.mock('@/lib/supabase/admin')` and `vi.mock('@/lib/supabase/server')` intercept the DB calls. No real Supabase connection needed.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `/supabase/migrations/20260315000001_schema.sql` — full schema: action_items, action_updates, publication_snapshots, qualitative_tags, qualitative_themes, app_settings columns confirmed
- `/supabase/migrations/20260315000002_rls.sql` — RLS policies for all Phase 4 tables confirmed; action_items leadership write policy allows 'leadership' and 'admin' (not 'hr_admin' — note discrepancy vs CONTEXT.md)
- `/supabase/migrations/20260315000003_views.sql` — v_public_actions view, v_participation_rates view, get_dimension_scores_for_survey RPC all confirmed
- `/src/lib/actions/analytics.ts` — established Server Action patterns, db = supabaseAdmin as any, await cookies() pattern, getUser() pattern
- `/src/lib/actions/auth.ts` — Zod + role check + return type pattern
- `/src/lib/actions/survey.ts` — ALLOWED_TRANSITIONS pattern, db.from().insert().select().single() pattern
- `/src/components/admin/SurveyStatusBanner.tsx` — 'use client' with useState, useRouter, handleTransition pattern
- `/src/app/results/page.tsx` — existing PublicActions groupByStatus rendering, component imports
- `/src/lib/types/analytics.ts` — PublicAction, QualitativeTheme, DimensionScore type shapes for snapshot_data

### Secondary (MEDIUM confidence)

- CONTEXT.md CONTEXT.md decisions — authoritative for locked UX decisions
- STATE.md accumulated decisions — authoritative for "supabaseAdmin as any" pattern, "await cookies()" requirement

### Important Discrepancy Found (HIGH confidence — requires attention)

**RLS vs CONTEXT.md on hr_admin write access to action_items:**

The RLS migration (20260315000002_rls.sql) has:
```sql
CREATE POLICY "action_items: leadership writes"
  ON public.action_items AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (current_user_role() IN ('leadership', 'admin'));
```

CONTEXT.md locked decision states: "Who can create: `leadership`, `admin`, and `hr_admin` roles"

**The RLS does NOT include `hr_admin`** for action_items INSERT/UPDATE. Server Actions using `supabaseAdmin` (service role) bypass RLS entirely, so this only matters if any action item mutation is attempted via the user's Supabase session (authenticated client). Since all mutations go through Server Actions with `supabaseAdmin`, this discrepancy does not cause a runtime bug. However, the role guard in the Server Action itself should be updated to include `hr_admin`.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new unknowns except papaparse
- Architecture: HIGH — patterns directly derived from existing Phase 1-3 codebase
- Schema findings: HIGH — direct inspection of migration files
- Pitfalls: HIGH — several are confirmed from existing code (missing archived column verified, missing UNIQUE constraint verified, RLS discrepancy verified)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable stack — Next.js 15, Supabase JS 2.x pinned)
