# Pitfalls Research

**Domain:** Organizational health survey platform (Next.js App Router + Supabase)
**Researched:** 2026-03-15
**Confidence:** HIGH for architectural/RLS/Next.js patterns; MEDIUM for survey UX patterns (training data, no live verification available)

---

## Critical Pitfalls

### Pitfall 1: Anonymity Leak via Participation Token Pattern Misimplementation

**What goes wrong:**
The participation_tokens table correctly decouples "who responded" from "what they answered," but developers then store `respondent_id` or `user_id` directly on the `responses` or `response_answers` table as a convenience for debugging or autosave. Any column that links a response row back to an authenticated identity — even as a nullable foreign key — destroys anonymity. Admins or analysts with service role access can trivially join the tables.

**Why it happens:**
Autosave drafts require knowing which user owns the in-progress draft. Developers take the path of least resistance: add a `user_id` column to the `responses` table. This feels safe because "the UI hides it," but the data model itself is deanonymizable.

**How to avoid:**
Create a separate `response_drafts` table that *does* carry a `user_id` and stores ephemeral progress. On final submission, copy answers to `response_answers` (no user linkage), mark the participation token as redeemed, and delete the draft row. The `responses` table must never hold a user identifier. Enforce via RLS: the `responses` table INSERT policy should use `auth.uid()` only to validate the participation token is valid and unused — never to write `auth.uid()` into a response column.

**Warning signs:**
- Any migration adding a `user_id`, `respondent_id`, or `profile_id` column to `responses` or `response_answers`
- An autosave implementation that UPSERTs into `responses` using the authenticated user's ID as the lookup key
- A `responses` table with a foreign key constraint to `profiles`

**Phase to address:** Data model / schema phase (must be designed correctly before any response collection code is written)

---

### Pitfall 2: Supabase RLS Infinite Recursion via Self-Referencing Policies

**What goes wrong:**
An RLS policy on `profiles` references `profiles` in its `USING` clause (e.g., to check the `role` column of the current user). Postgres evaluates the policy to decide if the row is visible, which triggers the policy again, causing infinite recursion and a `stack depth limit exceeded` error in production.

**Why it happens:**
The intuitive pattern for role checks is: `SELECT role FROM profiles WHERE id = auth.uid()`. When this appears inside an RLS policy on the `profiles` table itself, it recurses. This pattern is copied from blog posts and examples that don't always demonstrate it on the `profiles` table specifically.

**How to avoid:**
Never query the `profiles` table inside a policy on `profiles`. Instead:
1. Store the user's role in the Supabase Auth `raw_user_meta_data` JWT claim — accessible via `auth.jwt() -> 'user_metadata' ->> 'role'` in policies, no table lookup needed.
2. Alternatively, use a security definer function that bypasses RLS to fetch the role, but note this creates a function that must be carefully locked down.
3. For other tables that need role checks, a `profiles` join is fine — the recursion only triggers when the table being queried IS the table the policy lives on.

**Warning signs:**
- `ERROR: stack depth limit exceeded` in Supabase logs
- Any RLS policy on `profiles` with a subquery `SELECT ... FROM profiles`
- Slow first-request performance as Postgres hits the recursion depth before erroring

**Phase to address:** Auth and RBAC phase (schema + policies)

---

### Pitfall 3: Service Role Key Exposure in Next.js App Router

**What goes wrong:**
The Supabase service role key — which bypasses all RLS — is used in a Next.js Server Action or Route Handler but leaks to the client bundle. This can happen by: (a) importing a `supabaseAdmin` client from a file that doesn't have the `"use server"` directive or a `.server.ts` suffix, (b) passing the admin client as a prop to a Client Component, or (c) using the service role key in a file that gets imported by both server and client code.

**Why it happens:**
Next.js App Router's server/client boundary is managed by bundler conventions, not runtime enforcement. A file imported by a Client Component is bundled client-side even if the developer intended it to be server-only. `NEXT_PUBLIC_` prefixed vars are intentionally client-visible; developers mistakenly use non-prefixed vars but import them in shared modules.

**How to avoid:**
- Create a dedicated `lib/supabase/admin.ts` that imports `server-only` (the npm package) at the top — this causes a build-time error if the module is ever imported in a Client Component
- Never use `SUPABASE_SERVICE_ROLE_KEY` in any file that lacks `'use server'` or `import 'server-only'`
- All RLS-bypassing operations must go through Server Actions or Route Handlers exclusively
- Audit with `NEXT_PUBLIC_` discipline: only vars that are safe to expose should use that prefix

**Warning signs:**
- `supabaseAdmin` imported in a file containing `'use client'`
- The service role key visible in browser Network tab (check response headers and inline scripts)
- A `lib/supabase.ts` file used by both server and client components that creates different clients based on an env var check

**Phase to address:** Auth and infrastructure phase (must be locked down before any data access is written)

---

### Pitfall 4: Small-Group Inference Attack via Filtered Aggregates

**What goes wrong:**
The privacy threshold (minimum 5 respondents) is enforced at the per-dimension aggregate level, but not at the intersection of filters. A manager dashboard that allows filtering by department AND tenure band AND role can produce a result set of 1-2 people even when each individual filter dimension has >5 respondents. For an ~87-person company with role-specific survey sections, many sub-groups are inherently small.

**Why it happens:**
Developers implement the threshold check as: `IF COUNT(responses) < 5 THEN hide`. They check the count of the current query result. But they don't check whether successive filter narrowing can produce a result from a group small enough to identify someone — especially through differential analysis (running two queries and diffing the scores).

**How to avoid:**
- Enforce minimum thresholds at every filter combination server-side, not just at the base query level
- For the analytics API, return a `below_threshold: true` flag instead of null data — this prevents clients from inferring data via error vs. no-data distinction
- Add a maximum filter depth: leadership dashboards should not allow more than 2 simultaneous segmentation filters without explicit analyst override
- Consider "noise addition" (differential privacy) for text-length distributions on open responses — a unique 3-word response in a filtered view can still identify the author
- Log all analytics queries server-side so anomalous filter patterns can be detected

**Warning signs:**
- Analytics endpoint that applies filters in sequence without rechecking final count
- Dashboard UI that allows unlimited simultaneous filter stacking
- Any endpoint returning empty arrays (vs. `below_threshold` signal) for small groups — an empty array leaks that the group exists but is too small

**Phase to address:** Analytics engine phase; must be designed before leadership dashboard is built

---

### Pitfall 5: Open-Text Response Deanonymization

**What goes wrong:**
Even in an anonymous survey, qualitative (open-text) responses can identify the author. This happens when: (a) responses contain unique personal context ("the project I worked on in Q3 with the Singapore client"), (b) the analyst dashboard surfaces raw open-text responses alongside segmentation metadata (role, department, tenure band), (c) a response is the only one in a filtered segment.

**Why it happens:**
Developers treat anonymity as a binary flag on the `responses` row. Once responses are anonymous at the DB level, the UI treats all text as safe to display. The intersection of qualitative content and metadata is not modeled as a risk.

**How to avoid:**
- Raw open-text responses must NEVER be displayed alongside specific segmentation metadata (e.g., "Engineering > Senior > 3-5 years tenure" + verbatim text = identified)
- Show verbatim text only in aggregate pools with a minimum count; prefer theme summaries
- Implement a "qualitative guard": the API endpoint serving open text must verify that the filtered pool contains at least N (configurable, default 5) responses before returning any verbatim text
- In the UI, visually distinguish between statistical data (scores, distributions) and qualitative content, and add explicit privacy warnings when showing text responses

**Warning signs:**
- Any API endpoint returning raw response text with segmentation filters applied
- A "verbatim responses" tab in the analytics dashboard that doesn't enforce the same thresholds as score data
- Open-text responses surfaced to managers for their team (a manager of 3 people can trivially identify who wrote what)

**Phase to address:** Analytics engine + manager dashboard phase

---

### Pitfall 6: Race Condition in Publication Snapshot Creation

**What goes wrong:**
The publication workflow is intended to create an immutable snapshot of survey results. If snapshot creation is not atomic, a concurrent response submission during snapshotting can produce a snapshot that partially includes the new response (some dimension aggregates updated, others not). Employees then see inconsistent published results — one dimension's score includes a late response that others don't.

**Why it happens:**
Snapshot creation reads from live `response_answers` and `derived_metrics` tables. If these reads happen across multiple queries (one per dimension, or one per filter segment), any concurrent write between reads produces an inconsistent snapshot.

**How to avoid:**
- Wrap snapshot creation in a Postgres transaction with `REPEATABLE READ` isolation level — all reads within the transaction see the same database state regardless of concurrent writes
- Better: close the survey (set status to `closed`) before snapshot creation as a hard prerequisite; this makes the underlying data immutable
- Snapshot creation should be a single stored procedure or database function that runs atomically, not a sequence of application-layer API calls
- Store the snapshot as JSONB (frozen computed data) rather than foreign key references to live rows — this prevents snapshot data from being affected by later row updates

**Warning signs:**
- Snapshot logic implemented as sequential `SELECT` queries in application code without a transaction wrapper
- Snapshot records that store references to `response_answer_id` rows rather than computed values
- No survey status gate before snapshot creation (survey still accepting responses during snapshot)

**Phase to address:** Publication workflow phase

---

### Pitfall 7: Next.js App Router Server/Client Component Data Fetch Waterfall

**What goes wrong:**
Dashboard pages that need multiple data segments (dimension scores + participation + action items + trend data) fetch each in sequence because each is in a separate Server Component that awaits its data before rendering children. The result is a waterfall of serial database queries that makes dashboards feel slow even when each individual query is fast.

**Why it happens:**
The App Router makes it easy to co-locate data fetching with the component that uses it. When components are nested, their fetches are inherently sequential. Developers don't realize that `await` in a Server Component blocks the entire subtree.

**How to avoid:**
- Use `Promise.all()` to initiate parallel fetches at the page level and pass results down as props
- Alternatively, use React's `use()` hook with promises initiated at the top level — this allows parallel execution while keeping component co-location
- Use `<Suspense>` boundaries strategically: wrap each dashboard section independently so above-fold content renders immediately while secondary sections load in parallel
- Avoid deeply nested `async` Server Components when the data dependencies are independent

**Warning signs:**
- Dashboard page load times that scale linearly with the number of dashboard sections
- Multiple `await` calls in sequence inside a single Server Component or page file
- Supabase query logs showing queries executing one-after-another rather than simultaneously

**Phase to address:** Dashboard development phase

---

### Pitfall 8: Supabase RLS Performance Degradation with Complex Per-Row Policies

**What goes wrong:**
RLS policies involving subqueries (e.g., "can this user see this response? check if they are a manager of the respondent's team") execute the subquery for every row scanned, not just once. On the `response_answers` table with thousands of rows and a complex org hierarchy check, this produces full-table scans that are unacceptably slow.

**Why it happens:**
RLS policies look like simple SQL conditions but are applied as a filter clause to every row access. Developers write them like application-level permission checks (readable, expressive) without considering that they execute at row granularity. Joins in policies are especially costly.

**How to avoid:**
- Keep RLS policies simple: prefer checking a column value against `auth.uid()` or a JWT claim over subqueries
- Pre-materialize expensive permission checks: store `manager_id` directly on team rows so the policy can be `manager_id = auth.uid()` rather than a multi-table join
- Use security definer functions for complex checks — the function result can be cached within a transaction
- Add `EXPLAIN ANALYZE` checks on all RLS-protected tables as part of the schema review process
- For analytics queries (always executed with service role), bypass RLS entirely with the service client — don't let RLS run on bulk analytics reads

**Warning signs:**
- Slow query logs showing sequential scans on `response_answers` or `responses`
- RLS policies with CTEs or multi-level subqueries
- Policy evaluation time that grows linearly with row count rather than being constant

**Phase to address:** Data model / schema phase; review again during analytics performance testing

---

### Pitfall 9: Survey Fatigue Causing Abandonment and Completion Bias

**What goes wrong:**
The ~87-person company survey covers 12 organizational dimensions with role-specific sections. If all questions are shown in a single unbroken flow, employees abandon mid-survey. Partial submissions that are not properly resumed produce incomplete data that inflates "unfavorable" scores for later dimensions (because only persistent/engaged employees reach them).

**Why it happens:**
Survey builders optimize for completeness of data collection, not for respondent experience. Every question feels important to the designer. The section-by-section progress display gets added but doesn't actually reduce the perceived length if each section is long.

**How to avoid:**
- Enforce a maximum of 5-7 questions visible at once, regardless of section length
- Show a persistent progress indicator (e.g., "Section 2 of 5, question 3 of 6") — not just a percentage bar, which feels meaningless
- Allow genuine partial saves with explicit "save and continue later" flows that resume at the exact question, not the section start
- Target total survey completion under 12 minutes — benchmark this with test users before launch
- For role-specific sections, show only the relevant questions; never show conditional questions that don't apply and are just hidden (they still inflate the perceived count)

**Warning signs:**
- Drop-off analytics showing abandonment spikes at specific questions (usually the first open-text after several Likerts)
- Low completion rates for the first survey cycle (below 70% is a warning sign for a company this size)
- Autosave resume data showing large numbers of "section 1 complete, never continued" records

**Phase to address:** Survey design + response collection phase

---

### Pitfall 10: Analytics Survivorship Bias in Trend Comparisons

**What goes wrong:**
Trend comparisons between survey cycles compare aggregate scores at face value. However, the population changes between cycles: new hires complete the survey, departing employees (who may have left due to dissatisfaction) don't. This produces artificially improving scores over time — not because the organization improved, but because the most dissatisfied voices left. Leadership interprets improving scores as evidence their interventions worked.

**Why it happens:**
Trend analysis joins cycles by dimension score without controlling for population stability. The data model stores who participated but the analytics engine doesn't surface cohort consistency.

**How to avoid:**
- Add a "cohort stability" metric to trend views: show what percentage of respondents in cycle N also participated in cycle N-1
- Surface new-hire vs. returning-respondent breakdown in trend dashboards — a high new-hire ratio in cycle N should flag trend comparisons as less reliable
- Add tenure-band segmentation to trends: show 0-6 month tenure separately from 1+ year respondents when population turnover is significant
- Document this limitation explicitly in the "Transparency Notes" section of the public results page

**Warning signs:**
- Trend charts showing consistent improvement across all dimensions simultaneously (statistically unlikely if genuine)
- Participation population changing by >20% between cycles
- No cohort overlap metric in the analytics design

**Phase to address:** Analytics engine phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing `user_id` on `responses` for autosave simplicity | Easier draft management code | Permanent anonymity violation; requires data migration and a breaking change to fix | Never |
| Using service role key in all server-side Supabase calls | Skip writing RLS policies | RLS never tested; policies have silent gaps; leaking the key bypasses all security | Never |
| Aggregate analytics computed at query time (no `derived_metrics` table) | No ETL step needed | Analytics queries become slow as response volume grows; adding materialization later requires backfilling | Acceptable for MVP only if `derived_metrics` table is included in schema from day 1 (empty but ready) |
| Checking privacy thresholds only in the UI layer | Simpler API design | Any direct API call or future integration bypasses threshold protection | Never |
| Single publication snapshot per survey with no versioning | Simpler publication workflow | Cannot republish with corrections without overwriting; immutability is violated by updates | Acceptable for v1 only if snapshot records have a `version` column added from day 1 |
| Hardcoding department/role lists instead of a database-driven taxonomy | Faster initial setup | Org structure changes require code deployments; breaks during company restructuring | Never — the project requires roster import support, making hardcoding immediately wrong |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + Next.js App Router | Using `createClient` (browser client) in Server Components — reads stale cookies, misses session refresh | Use `createServerClient` from `@supabase/ssr` in Server Components and Route Handlers; use `createBrowserClient` only in Client Components |
| Supabase Auth + middleware | Not refreshing the session in `middleware.ts` — session tokens expire mid-session silently | Call `supabase.auth.getSession()` in middleware and update response cookies on every request via the `supabaseMiddlewareClient` pattern |
| Supabase RLS + service role | Using service role for all writes "to be safe" — means RLS is never exercised on writes | Use the anon/user client for all user-facing writes; service role only for admin operations and analytics aggregation |
| Supabase Realtime + auth | Subscribing to Realtime channels from Client Components without validating RLS on the channel — Realtime does not currently enforce RLS on all subscription types | Do not use Realtime for sensitive survey data; use polling or server-driven refreshes instead |
| Next.js cookies + Supabase session | `cookies()` from `next/headers` throws if called outside a request context (e.g., in a module initializer) | Always call `cookies()` inside the handler function body, never at module scope |
| Zod + Supabase response types | Trusting Supabase TypeScript types without runtime Zod validation — generated types reflect schema but do not validate runtime data | Add Zod parse at every Supabase query result boundary, especially for analytics endpoints that perform complex aggregations |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Analytics computed by joining raw `response_answers` at query time | Dashboard load >3s; Supabase query timeouts | Compute `derived_metrics` (dimension scores per segment) on response submission, not at read time | ~500+ responses (2-3 survey cycles at 87 people) |
| Fetching all responses for a survey to compute participation rate | Memory spike; slow first-load on leadership dashboard | Store participation counts as counters on the `survey` row, updated on each response submission | ~200+ responses |
| No composite index on `response_answers(survey_id, question_id)` | Slow question-level aggregations | Add composite indexes on the most common analytics query patterns during schema design | Immediate — even small datasets show degraded performance without indexes |
| Rendering verbatim open-text responses for all respondents in a single query | Page timeout; large payload to client | Paginate open-text results; never fetch all at once | >30 open-text responses |
| Loading full `action_items` history (with all update logs) for the public transparency page | Slow public page | Limit update log entries per action to recent N; paginate action history | >50 actions with >10 updates each |
| N+1 queries in manager dashboard: fetching team participation for each department separately | Multiple sequential DB calls visible in Supabase logs | Batch participation queries by `survey_id` with `GROUP BY department` | 5+ departments |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing the `derived_metrics` table without RLS — it contains pre-aggregated dimension scores that could reveal small-group data | Bypasses the privacy threshold system entirely if queried directly | Apply RLS to `derived_metrics` enforcing the same threshold checks as the analytics API; or restrict to service-role-only access |
| Domain restriction checked only at UI layer, not in an auth hook | Employees from other companies could register if the check is only a UI redirect | Implement domain restriction in a Supabase Auth hook that rejects non-company emails at the database level |
| `audit_logs` table writable by the application role | Audit trail can be tampered with | Make `audit_logs` append-only: grant INSERT but not UPDATE or DELETE via RLS; even service role should not UPDATE |
| Manager dashboard RLS allows managers to query results for any team by passing a `team_id` parameter | Horizontal privilege escalation — a manager reads another team's results | RLS on analytics reads must join through `team_members` to verify the requesting user manages the specific team being queried |
| Publication snapshots stored as live foreign key references to mutable rows | A snapshot can be retroactively altered by updating source rows | Snapshots must copy computed values into JSONB columns; no live FK references to mutable rows |
| Session cookie not HttpOnly / SameSite Strict | XSS can steal session tokens | Supabase Auth sets this correctly by default via `@supabase/ssr`; do not use the legacy `auth-helpers` package, which had inconsistent cookie settings |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "no data available" without explaining the privacy threshold | Employees think the platform is broken; distrust results | Show "Results hidden — fewer than 5 responses in this group" with the actual threshold number |
| Survey shows "0% complete" until Section 2 is reached — the first section has no progress feedback | Employees feel like progress is not being saved; abandon early | Show progress from question 1 onward; autosave confirmation ("Progress saved") visible after each question |
| Action items on the transparency page show "Committed" status permanently even after target date passes | Employees lose trust — items appear abandoned | Auto-transition to "Overdue" status based on target date; require owner to mark complete |
| Manager dashboard shows a spinner on the entire page until all data loads | Managers with large teams experience long perceived load times | Load participation rate first (fast); load score data with Suspense; load trend charts last |
| Anonymous survey with no acknowledgment of how anonymity is enforced | Employees do not trust the anonymity claim; participation is low | Add an explicit "How anonymity works" section at survey start; link to the participation token explainer |
| Conditional questions that flash briefly before hiding | Respondents see a question appear and disappear, wonder if they should answer it | Pre-evaluate conditional logic server-side; only render questions the user should actually see |
| Public results page updates without notice | Employees who bookmarked old results are confused by changes | Show publication date prominently; notify via email when new results are published |

---

## "Looks Done But Isn't" Checklist

- [ ] **Anonymous responses:** Verify by querying `responses` as admin — confirm zero rows contain any user identifier or allow any join back to `profiles`. Run a dedicated "anonymity audit" query in the test suite.
- [ ] **Privacy thresholds:** Verify the threshold check fires at the API layer (not just UI) by calling the analytics endpoint directly with a small-group filter. Confirm a `below_threshold: true` response, not an empty array.
- [ ] **RLS on all tables:** Run `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` and verify every table has `rowsecurity = true`. Check the Supabase dashboard RLS status column.
- [ ] **Participation tracking without identity:** Verify that redeeming a participation token and submitting a response produces zero linkable rows by doing a full-schema join analysis — no path from `responses` back to `profiles`.
- [ ] **Survey status gate:** Verify that a `closed` survey rejects new response submissions at the API level (not just via a UI-disabled submit button).
- [ ] **Snapshot immutability:** Verify that updating a `response_answer` row after snapshot creation does NOT change any value in the published snapshot.
- [ ] **Manager scope enforcement:** Verify a manager cannot retrieve dimension scores for a team they do not manage by crafting a direct API call with a different `team_id`.
- [ ] **Service role key not in bundle:** Run `npx next build && grep -r "service_role" .next/` — this key must never appear in the client bundle.
- [ ] **Open-text threshold:** Verify that a filtered view with <5 responses returns no verbatim text even when score data is already hidden.
- [ ] **Domain restriction:** Verify that registering with a non-company email fails at the auth level, not just as a UI redirect.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `user_id` found on `responses` table after data collection begins | HIGH | Stop survey; migrate responses to strip user IDs; rotate any logs that recorded the link; communicate transparently to participants; redesign autosave with a dedicated drafts table |
| Service role key exposed in client bundle | HIGH | Immediately rotate the key in Supabase dashboard (all existing sessions using it are invalidated); audit logs for unusual API calls; redeploy with corrected code |
| Snapshot contains inconsistent data due to race condition | MEDIUM | Mark affected snapshot as `invalidated`; regenerate with survey closed; publish a correction notice on the transparency page |
| RLS infinite recursion in production | MEDIUM | Disable the recursive policy (`DROP POLICY`) immediately to restore availability; fix using JWT claims approach; re-enable |
| Survivorship bias in published trends discovered after publication | MEDIUM | Add cohort stability metric retroactively using `participation_tokens` data; republish with an explanatory transparency note |
| Privacy threshold bypass via filter stacking discovered | MEDIUM | Audit all past analytics queries in logs; add server-side filter depth limit; republish with correction if unauthorized data was surfaced |
| Survey fatigue causing <50% completion in first cycle | LOW-MEDIUM | Analyze drop-off points in autosave data; shorten survey for next cycle; add time estimate; implement genuine "save and return" flow |
| Open-text response identified a specific respondent post-publication | HIGH | Remove the response from public view immediately; investigate whether the analyst who surfaced it had appropriate access; review and harden the qualitative guard implementation |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Anonymity leak via `user_id` on responses | Data model / schema design | Anonymity audit query in test suite; no FK from `responses` to `profiles` |
| RLS infinite recursion | Auth + RBAC setup | Run all policy-protected queries as each role; no stack overflow errors |
| Service role key in client bundle | Infrastructure / auth setup | Post-build grep for service_role key in `.next/` |
| Small-group inference via filter stacking | Analytics engine | Integration test: filter to 1-person group, confirm `below_threshold` at every filter level |
| Open-text deanonymization | Analytics engine + qualitative features | Unit test: qualitative API with <5 response pool returns no verbatim text |
| Publication snapshot race condition | Publication workflow | Test: submit response mid-snapshot; verify snapshot is consistent with pre-submission state |
| Next.js data fetch waterfall | Dashboard development | Measure page load time with Supabase query logs; parallel queries visible |
| RLS policy performance degradation | Schema design + load testing | `EXPLAIN ANALYZE` on all RLS-protected queries; no sequential scans on large tables |
| Survey fatigue and completion bias | Survey design + response collection | Time-to-complete benchmark <12 min; tested with 5 internal users before launch |
| Survivorship bias in trend comparisons | Analytics engine | Cohort stability metric present in trend API response from first cycle |
| Manager horizontal privilege escalation | RBAC + dashboard | Integration test: manager calling API with another team's ID receives 403 |
| Domain restriction bypass | Auth setup | Register with external email; verify failure at DB level, not UI redirect |

---

## Sources

Note: WebSearch and WebFetch were unavailable during this research session. All findings are based on:

- Supabase RLS documentation patterns (training data, HIGH confidence — well-established Supabase-specific behaviors documented in official guides)
- Next.js App Router official patterns for server/client component boundaries (HIGH confidence — stable since Next.js 13.4)
- Privacy engineering literature on k-anonymity, small-group inference, and differential privacy (HIGH confidence — established academic and industry field)
- Employee survey platform design patterns from the Lattice/Culture Amp/Glint ecosystem (MEDIUM confidence — training data)
- Postgres transaction isolation behavior (HIGH confidence — standard Postgres behavior)
- Post-mortems on anonymity failures in survey tools (MEDIUM confidence — training data)

Verification recommended before implementation:
- Confirm `@supabase/ssr` cookie handling behavior matches described patterns (check Supabase changelog for changes post-August 2025)
- Confirm Next.js `server-only` package behavior in App Router (stable as of Next.js 13.4+, but verify current version)
- Verify Supabase Realtime RLS enforcement status (this has been an evolving area — check current docs before any Realtime usage)

---
*Pitfalls research for: Organizational health survey platform (Next.js + Supabase)*
*Researched: 2026-03-15*
