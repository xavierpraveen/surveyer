# Surveyer — Production Setup Guide

## Prerequisites
- Node.js 18+
- Supabase project (free tier works)
- `.env.local` with credentials (see below)

## 1. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
ALLOWED_EMAIL_DOMAIN=         # optional: restrict sign-up to this domain
```

Get these from: Supabase Dashboard → Project Settings → API

## 2. Apply Database Migrations

Go to the [Supabase SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql/new) and run each file **in order**:

| Order | File | Description |
|-------|------|-------------|
| 1 | `supabase/migrations/20260315000001_schema.sql` | Tables, enums, indexes |
| 2 | `supabase/migrations/20260315000002_rls.sql` | Row-level security policies |
| 3 | `supabase/migrations/20260315000003_views.sql` | Analytics views |
| 4 | `supabase/migrations/20260315000004_seed.sql` | Base seed data (departments, roles, survey) |
| 5 | `supabase/migrations/20260315000005_phase2_seed.sql` | Survey responses seed |
| 6 | `supabase/migrations/20260315000006_compute_derived_metrics.sql` | Analytics function |
| 7 | `supabase/migrations/20260316000007_phase4.sql` | Phase 4 columns (archived, dimension_ids) |
| 8 | `supabase/migrations/20260316000008_questionnaire_seed.sql` | Questionnaire questions |

**Quick setup:** Run `scripts/production-setup.sql` to apply migrations 7+ idempotently.

## 3. Create Test Users

After applying migrations, run:

```bash
node scripts/create-users.mjs
```

This creates all test accounts via the Supabase Auth Admin API.

### Test Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `noah.hassan@acme.dev` | `password123` | admin | Full admin access |
| `olivia.park@acme.dev` | `password123` | admin | Full admin access |
| `alice.chen@acme.dev` | `password123` | employee | Survey + results |
| `bob.kim@acme.dev` | `password123` | employee | Survey + results |
| `carol.patel@acme.dev` | `password123` | employee | Survey + results |

## 4. Run the App

```bash
npm install
npm run dev
```

App runs at http://localhost:3000

## 5. Workflow

### Admin Workflow
1. Sign in as `noah.hassan@acme.dev`
2. **Surveys** → Create/manage surveys at `/admin/surveys`
3. **Open survey** → Use lifecycle buttons (Schedule → Open Now)
4. **Monitor participation** → Admin Settings → Participation tab (auto-refreshes 30s)
5. **Close survey** → Lifecycle button → Compute Results
6. **Publish results** → Survey detail → "Publish Results" button → confirm modal
7. **Tag responses** → Survey detail → "Tag Responses" link → `/admin/surveys/[id]/tags`
8. **Action items** → `/admin/actions` — create actions linked to findings
9. **Settings** → `/admin/settings` — employee import, privacy thresholds, cycle archival

### Employee Workflow
1. Sign in as any `employee` account
2. **Take survey** → shown automatically when survey is `open`
3. **View results** → `/results` — available after admin publishes

## 6. Role System

| Role | Access |
|------|--------|
| `admin` | All admin pages, CRUD on everything |
| `employee` | Survey taking, results viewing |

## 7. Troubleshooting

**DB migrations not applied**: Run `scripts/production-setup.sql` in Supabase SQL Editor.

**Login fails**: Run `node scripts/fix-passwords.mjs` to reset all passwords to `password123`.

**`column does not exist` errors**: The Phase 4 migration hasn't been applied. Run migration 7 above.

**`v_public_actions` errors**: Run migration 3 (views) to re-create with correct definition.

**Direct DB connection refused**: Supabase newer projects disable direct port 5432. Use the SQL Editor instead.

## 8. Project Structure

```
src/
  app/
    (admin)/admin/     — Admin dashboard, surveys, actions, settings
    (employee)/        — Employee survey-taking flow
    results/           — Public results page (cycle selector)
    login/             — Auth page
  components/
    admin/             — Admin UI components
    analytics/         — Chart and metric components
    results/           — Results display components
  lib/
    actions/           — Server Actions (all mutations)
    supabase/          — Client factory (server + admin)
    types/             — TypeScript types
supabase/
  migrations/          — SQL migration files (apply in order)
scripts/
  create-users.mjs     — Create test users via Auth Admin API
  fix-passwords.mjs    — Reset all test user passwords
  production-setup.sql — Idempotent SQL for missing migrations
  debug-connection.mjs — Debug DB connectivity issues
```
