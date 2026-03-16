---
phase: 04-actions-publication-and-admin
plan: "04"
subsystem: admin-settings
tags: [admin, settings, csv-import, privacy, participation, cycles, archive]
dependency_graph:
  requires:
    - 04-02  # settings Server Actions (getAppSettings, updateAppSettings, importEmployees, archiveSurvey, getParticipationForOpenSurvey)
  provides:
    - /admin/settings UI with four operational tabs
    - archived survey filter on /admin/surveys list
  affects:
    - src/app/(admin)/admin/surveys/page.tsx — archived filter applied
tech_stack:
  added:
    - papaparse@5.5.3 — client-side CSV parsing (never server-side)
    - "@types/papaparse@5.5.2"
  patterns:
    - RSC page fetches all initial data server-side, passed as props to client components
    - SettingsTabs client tab switcher renders lazy tab components
    - setInterval + clearInterval cleanup pattern for auto-refresh
    - papaparse complete/error callbacks with client-only parsing
    - Optimistic state update for archive (set archived=true on success without refetch)
key_files:
  created:
    - src/app/(admin)/admin/settings/page.tsx
    - src/components/admin/SettingsTabs.tsx
    - src/components/admin/PrivacySettingsTab.tsx
    - src/components/admin/CyclesTab.tsx
    - src/components/admin/EmployeeImportTab.tsx
    - src/components/admin/ParticipationMonitorTab.tsx
  modified:
    - src/app/(admin)/admin/surveys/page.tsx — added .eq('archived', false) filter
    - package.json — added papaparse dependency
decisions:
  - papaparse parsed in client component only (never server) per project anti-pattern rule
  - EmployeeImportTab three-state UI (idle/preview/done) avoids conditional complexity
  - PrivacySettingsTab calls updateAppSettings for both thresholds in parallel via Promise.all
  - CyclesTab optimistic state update on archive success avoids full page refresh
  - ParticipationMonitorTab useCallback for refresh ensures stable setInterval dependency
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_changed: 8
---

# Phase 4 Plan 4: Admin Settings Page Summary

Admin settings UI at /admin/settings with four operational tabs backed by the Server Actions from 04-02, plus the archived=false filter on the /admin/surveys list page.

## What Was Built

**1 RSC page + 5 client components + 1 modified RSC page**

- `/admin/settings` RSC page: fetches `getAppSettings()`, all surveys, and `getParticipationForOpenSurvey()` server-side and passes data as props to `<SettingsTabs>`
- `SettingsTabs`: `'use client'` tab switcher with active tab state, renders the appropriate tab component for Employees | Privacy | Participation | Cycles
- `PrivacySettingsTab`: numeric and text threshold form fields pre-populated from DB, saves both via parallel `updateAppSettings` calls, shows "Settings saved" for 3 seconds
- `CyclesTab`: survey list with status badges, Archive button for closed+non-archived surveys, optimistic archived state update on success, "Archived" badge for already-archived surveys
- `EmployeeImportTab`: three-state UI (idle → preview → done), papaparse client-side CSV parsing, case-insensitive column matching, validation (name + email), preview table with red-highlighted error rows, calls `importEmployees` SA with valid rows only
- `ParticipationMonitorTab`: auto-refresh every 30s via `setInterval` with `clearInterval` cleanup, `useCallback(refresh)` for stable dependency, color-coded rate cells (green/yellow/red), total row at bottom, manual Refresh button with spinner
- `/admin/surveys/page.tsx`: targeted single-line change — `.eq('archived', false)` added to query so archived surveys are hidden from the active admin survey list

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `npx tsc --noEmit`: PASS (0 errors)
- `npm test`: 52 passed, 73 skipped (no regressions)
- `grep clearInterval src/components/admin/ParticipationMonitorTab.tsx`: found on line 50
- `grep "archived.*false\|eq.*archived" src/app/(admin)/admin/surveys/page.tsx`: found on line 19
- papaparse 5.5.3 in package.json dependencies

## Self-Check

Files exist:
- src/app/(admin)/admin/settings/page.tsx — FOUND
- src/components/admin/SettingsTabs.tsx — FOUND
- src/components/admin/PrivacySettingsTab.tsx — FOUND
- src/components/admin/CyclesTab.tsx — FOUND
- src/components/admin/EmployeeImportTab.tsx — FOUND
- src/components/admin/ParticipationMonitorTab.tsx — FOUND

Commits:
- e668d5c: feat(04-04): settings RSC page, SettingsTabs, PrivacySettingsTab, CyclesTab + archived filter
- dfdb902: feat(04-04): EmployeeImportTab + ParticipationMonitorTab + papaparse

## Self-Check: PASSED
