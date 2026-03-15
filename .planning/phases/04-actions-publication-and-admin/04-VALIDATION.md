---
phase: 4
slug: actions-publication-and-admin
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.1.9 + vite 5.4.21 |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | ACTIONS-01,02,03,04,05 | unit | `npm test -- src/lib/actions/actions.test.ts` | Wave 0 | ⬜ pending |
| 4-01-02 | 01 | 0 | PUBLISH-01,02,04,05 | unit | `npm test -- src/lib/actions/publication.test.ts` | Wave 0 | ⬜ pending |
| 4-01-03 | 01 | 0 | ADMIN-04,05 | unit | `npm test -- src/lib/actions/settings.test.ts` | Wave 0 | ⬜ pending |
| 4-01-04 | 01 | 0 | ADMIN-09 | unit | `npm test -- src/lib/actions/tagging.test.ts` | Wave 0 | ⬜ pending |
| 4-01-05 | 01 | 1 | ACTIONS-01,02,03 | unit | `npm test -- src/lib/actions/actions.test.ts` | Wave 0 | ⬜ pending |
| 4-01-06 | 01 | 1 | ACTIONS-04,05 | unit | `npm test -- src/lib/actions/actions.test.ts` | Wave 0 | ⬜ pending |
| 4-01-07 | 01 | 1 | PUBLISH-01,02,03,04,05 | unit | `npm test -- src/lib/actions/publication.test.ts` | Wave 0 | ⬜ pending |
| 4-01-08 | 01 | 1 | ADMIN-04,05,06 | unit | `npm test -- src/lib/actions/settings.test.ts` | Wave 0 | ⬜ pending |
| 4-01-09 | 01 | 1 | ADMIN-09 | unit | `npm test -- src/lib/actions/tagging.test.ts` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/actions/actions.test.ts` — stubs for ACTIONS-01 through ACTIONS-05
- [ ] `src/lib/actions/publication.test.ts` — stubs for PUBLISH-01, PUBLISH-02, PUBLISH-04, PUBLISH-05
- [ ] `src/lib/actions/settings.test.ts` — stubs for ADMIN-04, ADMIN-05
- [ ] `src/lib/actions/tagging.test.ts` — stubs for ADMIN-09 (generateThemes logic)

All Server Actions are pure async functions — mock with `vi.mock('@/lib/supabase/admin')` and `vi.mock('@/lib/supabase/server')`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /admin/actions table renders with status filter tabs | ACTIONS-06, ADMIN-07 | UI render | Navigate to /admin/actions, verify tabs |
| /admin/actions/[id] timeline posts update | ACTIONS-04 | UI interaction | Open action detail, post update, verify timeline |
| CSV import preview table shows parsed rows + errors | ADMIN-04 | File input | Upload CSV, verify preview table |
| Participation tab auto-refreshes every 30s | ADMIN-06 | Timing | Open /admin/settings Participation tab, wait 30s |
| /results cycle selector loads snapshot data | PUBLISH-04 | UI interaction | Select past cycle, verify frozen data |
| Publish Results modal shows correct summary counts | PUBLISH-01 | UI interaction | Click Publish Results, verify modal counts |
| Tagging page shows anonymized open-text responses | ADMIN-09 | UI render | Navigate to /admin/surveys/[id]/tags |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
