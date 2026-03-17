# Surveyer

Organizational health survey platform — employees submit anonymous surveys; leadership gets actionable, transparent insights with published action items.

## Local Setup

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **Supabase CLI** — `brew install supabase/tap/supabase` (or [docs](https://supabase.com/docs/guides/cli))

### Steps

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd surveyer
   pnpm install
   ```

2. **Copy env file**
   ```bash
   cp .env.example .env.local
   ```

3. **Start local Supabase**
   ```bash
   supabase start
   ```
   The local Supabase instance uses fixed default credentials — copy these into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ALLOWED_EMAIL_DOMAIN=acme.dev
   ```
   > These are the standard Supabase local development keys — they are the same for every developer and are not secrets.

4. **Apply migrations and seed data**
   ```bash
   supabase db reset
   ```
   This applies all 8 migrations in `supabase/migrations/` and seeds the database with 18 test users, a complete diagnostic survey, and all 12 org health dimensions.

5. **Generate TypeScript types from schema** *(optional — stub types ship with the repo)*
   ```bash
   pnpm db:types
   ```

6. **Start the dev server**
   ```bash
   pnpm dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000)

### Local Dev Tools

| Tool | URL | Purpose |
|------|-----|---------|
| App | http://localhost:3000 | Next.js dev server |
| Supabase Studio | http://127.0.0.1:54323 | DB browser, table editor, SQL runner |
| Mailpit | http://127.0.0.1:54324 | Email sandbox (catches all auth emails) |

---

## Test Accounts

All seed users have password: `password123`

| Email | Role | Department |
|-------|------|------------|
| alice.chen@acme.dev | employee | Engineering |
| bob.kim@acme.dev | employee | Engineering |
| carol.patel@acme.dev | employee | QA |
| david.nguyen@acme.dev | employee | Sales |
| eve.rodriguez@acme.dev | employee | HR Operations |
| frank.osei@acme.dev | employee | Engineering |
| grace.li@acme.dev | employee | QA |
| henry.muller@acme.dev | employee | Sales |
| ruby.santos@acme.dev | employee | Sales |
| iris.yamamoto@acme.dev | manager | Engineering |
| jake.solomon@acme.dev | manager | QA / Sales |
| karen.brooks@acme.dev | manager | HR Operations |
| leo.torres@acme.dev | leadership | Leadership |
| maya.johnson@acme.dev | leadership | Leadership |
| noah.hassan@acme.dev | admin | HR Operations |
| olivia.park@acme.dev | admin | Engineering |
| peter.white@acme.dev | hr_admin | HR Operations |
| quinn.garcia@acme.dev | survey_analyst | Engineering |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Available client-side. Local default: `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key. Available client-side. Used for authenticated requests with RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. **Server-only.** Never exposed to browser. Used for admin operations (role assignment, roster import). |
| `ALLOWED_EMAIL_DOMAIN` | Company email domain for sign-in restriction (e.g., `acme.dev`). If unset, all domains are allowed (dev fallback). |

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm typecheck` | TypeScript type check (no emit) |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:types` | Regenerate TypeScript types from local Supabase schema |
| `pnpm auth:repair-local` | Repair local Supabase auth/login state when seeded users cannot sign in |
