# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-16
**Phases:** 9 | **Plans:** 30 | **Timeline:** 2 days

### What Was Built

- Complete privacy-correct survey platform: anonymous responses architecturally unattributable, participation tokens structurally separated from response content, RLS enforces separation even for admins
- Organizational diagnostics engine: `compute_derived_metrics` RPC scores 12 org health dimensions with favorable/neutral/unfavorable distribution; privacy threshold enforcement server-side
- Multi-dashboard system: leadership (full analytics), manager (team-scoped, privacy-gated), employee, public `/results` with immutable publication snapshot chain
- Full admin operations: CSV roster import, privacy config, real-time participation monitoring, survey archival, action item CRUD with progress timelines, qualitative tagging and theme clustering
- Bold & Confident brand token system: 22 CSS custom properties, Tailwind mapping, Inter typeface, TopNav — zero ad-hoc color classes in production
- `normalizeRole()` 2-role model propagated to all 7 server-side consumers — closed 3 rounds of audit findings (BUG-04, BUG-05, BUG-06)

### What Worked

- **GSD wave-based parallel execution**: Plans with no shared files ran as parallel subagents. Phase 09's two plans executed in parallel and completed in ~3 minutes combined.
- **Atomic task commits**: Every task committed individually made it easy to audit progress and revert if needed. The git log is a clean audit trail.
- **Surgical gap closure pattern**: The audit → plan-milestone-gaps → plan-phase → execute-phase cycle worked extremely well. Three rounds of audit found progressively deeper integration issues; each was fixed in a targeted phase without touching unrelated code.
- **3-source cross-reference for audit**: VERIFICATION.md × SUMMARY.md frontmatter × REQUIREMENTS.md checkboxes caught stale documentation (coverage count stuck at 83/99 after Phase 9) before the milestone was archived.
- **`normalizeRole()` bridge pattern**: Collapsing 5 JWT roles into `'admin'` and `'employee'` via a single utility eliminated the entire class of raw-role-comparison bugs.

### What Was Inefficient

- **Pattern propagation debt**: Phase 8 introduced `normalizeRole()` but only patched files actively being worked on. The 4 Phase 04 Server Action files (publication.ts, actions.ts, settings.ts, tagging.ts) weren't in scope, creating BUG-05 and BUG-06 that required Phase 9. A "grep all raw role comparisons before completing the fix phase" rule would have caught this.
- **ROADMAP description drift**: ROADMAP said `publication.ts` has "3 role guards" but source only had 1. The integration checker caught this, but the ROADMAP should be updated at plan-writing time, not post-hoc.
- **`database.types.ts` stub**: `supabaseAdmin as any` was established in Phase 2 as a temporary measure pending `supabase gen types`. It persisted through all 9 phases as unclosed tech debt. A concrete "regenerate types in Phase X" task would have forced closure.
- **REQUIREMENTS.md coverage count** didn't auto-update after Phase 9 `phase complete` — the count stayed at 83/99 instead of 99/99. Required a manual audit step to catch.

### Patterns Established

- `normalizeRole(raw: string | undefined): AppRole` — bridge function between raw Supabase JWT roles and application role model; must be used at every role-gated Server Action; never compare raw JWT string directly to AppRole values
- `import 'server-only'` + `supabaseAdmin` isolation — all service role DB access behind server module boundary; all 21 consumers confirmed server-side
- Server Action return type: `{ success: boolean; data?: T; error?: string }` — consistent across all 30+ Server Actions; Zod validates input, normalizeRole validates role, DB call returns data
- `response_answers` canonical column names: `text_value`, `numeric_value`, `selected_options` — PostgREST silently drops unknown INSERT columns; schema alignment is critical
- `compute_derived_metrics` idempotency: DELETE-then-INSERT pattern; safe to call multiple times
- Wave-based parallel execution: plans that modify no shared files can run as parallel agents; always group by file ownership before scheduling

### Key Lessons

1. **Fix the ecosystem, not just the instance.** When introducing a new utility (normalizeRole, correct column names), grep all call sites project-wide before closing the phase. A targeted fix that leaves identical patterns in other files creates audit debt.
2. **The 3-source audit catches what a single-source audit misses.** VERIFICATION.md alone wouldn't catch a stale REQUIREMENTS.md coverage count. SUMMARY.md frontmatter alone wouldn't catch a missing VERIFICATION.md. The intersection of all three is what makes the audit trustworthy.
3. **Parallel execution is an order-of-magnitude speedup for independent work.** Phase 09's two plans (different files, no deps) completed in 3 minutes total as parallel agents vs ~6 minutes sequential. At larger scale this compounds significantly.
4. **Atomic commits per task are worth the overhead.** 143 commits over 30 plans means every feature is independently revertable and the commit log is a self-documenting execution history.
5. **Schema alignment is the highest-leverage correctness problem.** The response_answers column name mismatch (BUG-03) silently NULLed every analytics data row for all of Phase 3–4. No type error, no runtime crash — just invisible NULL data. DB column names must match at insert time, not just at read time.

### Cost Observations

- Model mix: ~100% sonnet (all phases used sonnet per config)
- Sessions: ~5-6 work sessions across 2 days
- Notable: The most expensive step by context was the integration checker (84,967 tokens) — this is the correct trade-off; it caught BUG-05 and BUG-06 before the milestone would have shipped with broken role guards

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~6 | 9 | First milestone — established GSD workflow, atomic commits, 3-source audit pattern |

### Cumulative Quality

| Milestone | Wave-0 Tests | Verification | Audit Runs |
|-----------|-------------|-------------|-----------|
| v1.0 | 52 passing (73 todo stubs) | 8/9 phases have VERIFICATION.md | 4 audit runs — each deeper |

### Top Lessons (Verified Across Milestones)

1. Propagate new patterns project-wide at introduction time, not during audits
2. The 3-source cross-reference audit (VERIFICATION × SUMMARY × REQUIREMENTS) is the only reliable milestone gate
