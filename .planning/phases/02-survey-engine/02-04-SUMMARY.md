---
phase: 02-survey-engine
plan: 04
subsystem: ui
tags: [nextjs, react, typescript, supabase, survey, public-routes, cookie-deduplication, anonymous-responses, middleware]

# Dependency graph
requires:
  - phase: 02-survey-engine
    plan: 03
    provides: SurveyWizard component, submitResponse action, survey types
  - phase: 02-survey-engine
    plan: 01
    provides: supabaseAdmin client, survey DB schema, response/response_answers tables

provides:
  - Public survey route /survey/public/[id] accessible without authentication
  - submitPublicResponse server action with cookie-based deduplication and user_id=NULL responses
  - PublicSurveyClient wrapper connecting SurveyWizard to public submit flow
  - Public confirmation page (no auto-redirect, no participation rate — Phase 3 analytics)
  - SurveyWizard autosaveEnabled/onSubmit/confirmationPath extensibility props

affects:
  - 03-analytics-engine (public response rows will be included in analytics; participation rate deferred)
  - 02-survey-engine (middleware change ensures public route bypasses auth redirect)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public route exempt from auth: add prefix to PUBLIC_ROUTES array in middleware.ts — startsWith check handles all child paths"
    - "Public survey RSC uses supabaseAdmin (not createSupabaseServerClient) — no auth user available on unauthenticated route"
    - "Cookie-based soft deduplication: server-side read in RSC page + server-side write in Server Action; cookie name scoped per survey ID"
    - "SurveyWizard extensibility: autosaveEnabled/onSubmit/confirmationPath props allow reuse in both auth and public contexts"
    - "PublicSurveyClient thin wrapper pattern: RSC fetches data, client component wires server action to SurveyWizard"

key-files:
  created:
    - src/lib/actions/public-response.ts
    - src/app/survey/public/[id]/page.tsx
    - src/app/survey/public/[id]/PublicSurveyClient.tsx
    - src/app/survey/public/[id]/confirmation/page.tsx
  modified:
    - src/middleware.ts
    - src/components/survey/SurveyWizard.tsx

key-decisions:
  - "supabaseAdmin used in public RSC pages — createSupabaseServerClient requires an auth cookie that doesn't exist for unauthenticated users"
  - "Cookie deduplication checked server-side in RSC (shows already-submitted page without JS) AND in Server Action (blocks DB write on race condition)"
  - "No public_response_count increment — participation rate tracking for public surveys deferred to Phase 3 analytics"
  - "No participation_token row created for public responses — no user_id to store; deduplication handled by cookie only"
  - "SurveyWizard onSubmit prop replaces submitResponse for public flow; autosaveEnabled=false disables debounced saveDraft calls that require auth"

patterns-established:
  - "Unauthenticated page pattern: use supabaseAdmin in RSC, no createSupabaseServerClient, check public flag before rendering content"
  - "Cookie dedup: read in RSC (fast path, no DB round-trip), write in Server Action after successful insert"

requirements-completed:
  - SURVEY-11
  - RESPONSE-06

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 2 Plan 4: Public Survey Route Summary

**Unauthenticated survey access via /survey/public/[id] with cookie-based deduplication, anonymous response storage (user_id=NULL), and SurveyWizard extensibility props**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T14:29:03Z
- **Completed:** 2026-03-15T14:31:11Z
- **Tasks:** 2
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- Middleware PUBLIC_ROUTES updated to whitelist `/survey/public/` prefix — unauthenticated users can access the route without being redirected to `/login`
- `submitPublicResponse` server action: validates survey availability (public_link_enabled=true AND status='open'), cookie dedup check, inserts response with user_id=NULL/is_anonymous=true, sets httpOnly cookie (1yr), no participation_token
- Public survey RSC page: server-side cookie check shows "already submitted" page without JS; supabaseAdmin used since no auth context; all sections shown to public (no role filtering)
- SurveyWizard extended with `autosaveEnabled`, `onSubmit`, and `confirmationPath` props for reuse in public context without breaking existing auth usage

## Task Commits

1. **Task 1: Middleware PUBLIC_ROUTES + submitPublicResponse server action** - `666560e` (feat)
2. **Task 2: Public survey page, confirmation page, SurveyWizard autosaveEnabled** - `4ffd197` (feat)

## Files Created/Modified

- `src/middleware.ts` - Added '/survey/public/' to PUBLIC_ROUTES array
- `src/lib/actions/public-response.ts` - submitPublicResponse: survey validation, cookie dedup, anonymous response insert
- `src/app/survey/public/[id]/page.tsx` - RSC: survey availability + cookie check, no role filtering, renders PublicSurveyClient
- `src/app/survey/public/[id]/PublicSurveyClient.tsx` - Client wrapper: wires SurveyWizard to submitPublicResponse, handles already_submitted edge case
- `src/app/survey/public/[id]/confirmation/page.tsx` - Static thank-you page; no auto-redirect, no participation rate
- `src/components/survey/SurveyWizard.tsx` - Added autosaveEnabled/onSubmit/confirmationPath props; gated autosave useEffect on autosaveEnabled flag

## Decisions Made

- `supabaseAdmin` used in public RSC pages — `createSupabaseServerClient` needs an auth session cookie that doesn't exist for unauthenticated visitors; admin client bypasses this requirement.
- Cookie deduplication is checked in both the RSC page (server-side read, shows "already submitted" UI before JS loads) AND in the Server Action (guards against race conditions or cookie cleared between page load and submit).
- `autosaveEnabled=false` passed from PublicSurveyClient — the `saveDraft` action requires a user session; calling it without auth would return 'Unauthorized' on every keystroke. Disabling the autosave useEffect entirely prevents this.
- Confirmation page intentionally has no auto-redirect — public users have no authenticated dashboard to return to.
- No participation rate shown on public confirmation — tracked via participation_tokens which only exists for authenticated users; Phase 3 analytics will compute public participation separately.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Public survey flow complete — anyone with a link can access, submit, and see confirmation without logging in
- Duplicate submissions blocked by httpOnly cookie (soft protection as designed)
- Phase 3 analytics can query `responses WHERE user_id IS NULL AND is_anonymous = TRUE` to compute public participation rates
- Middleware change is backward-compatible — all existing auth-protected routes unaffected

## Self-Check: PASSED

All 4 created files verified on disk. Both task commits (666560e, 4ffd197) confirmed in git history.

---
*Phase: 02-survey-engine*
*Completed: 2026-03-15*
