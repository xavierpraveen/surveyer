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
   This outputs your local credentials. Copy the values into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` → "API URL" from output
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → "anon key" from output
   - `SUPABASE_SERVICE_ROLE_KEY` → "service_role key" from output

4. **Apply migrations and seed data**
   ```bash
   supabase db reset
   ```
   This applies all migrations in `supabase/migrations/` and seeds the database.

5. **Generate TypeScript types from schema**
   ```bash
   pnpm db:types
   ```

6. **Start the dev server**
   ```bash
   pnpm dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000)

---

## Test Accounts

All seed users have password: `password123`

| Email | Role | Department |
|-------|------|------------|
| alice.johnson@acme.dev | employee | Engineering |
| bob.smith@acme.dev | employee | Engineering |
| carol.white@acme.dev | employee | QA |
| david.brown@acme.dev | employee | Sales |
| eve.davis@acme.dev | employee | HR Operations |
| frank.miller@acme.dev | employee | Engineering |
| grace.wilson@acme.dev | employee | QA |
| henry.moore@acme.dev | employee | Sales |
| iris.taylor@acme.dev | employee | Engineering |
| jack.anderson@acme.dev | employee | HR Operations |
| karen.thomas@acme.dev | manager | Engineering |
| liam.jackson@acme.dev | manager | QA |
| mia.harris@acme.dev | manager | Sales |
| noah.martin@acme.dev | leadership | Leadership |
| olivia.garcia@acme.dev | leadership | Leadership |
| peter.martinez@acme.dev | hr_admin | HR Operations |
| quinn.robinson@acme.dev | survey_analyst | Leadership |
| admin@acme.dev | admin | Leadership |

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
