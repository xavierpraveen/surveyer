#!/usr/bin/env node

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CANONICAL_INSTANCE_ID = '00000000-0000-0000-0000-000000000000'

const SEEDED_USERS = [
  { id: '33300000-0000-0000-0000-000000000001', email: 'alice.chen@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000002', email: 'bob.kim@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000003', email: 'carol.patel@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000004', email: 'david.nguyen@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000005', email: 'eve.rodriguez@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000015', email: 'noah.hassan@acme.dev', role: 'admin' },
  { id: '33300000-0000-0000-0000-000000000016', email: 'olivia.park@acme.dev', role: 'admin' },
]

export function parseDotEnv(content) {
  const parsed = {}
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIndex = line.indexOf('=')
    if (eqIndex <= 0) continue

    const key = line.slice(0, eqIndex).trim()
    const value = line.slice(eqIndex + 1).trim()
    parsed[key] = value
  }
  return parsed
}

export function isLocalSupabaseUrl(url) {
  if (!url) return false
  return (
    url.startsWith('http://127.0.0.1:') ||
    url.startsWith('http://localhost:') ||
    url.startsWith('http://[::1]:')
  )
}

export function buildRepairSql(instanceId) {
  return [
    `insert into auth.instances (id, uuid, raw_base_config, created_at, updated_at)
     values ('${instanceId}', '${instanceId}', null, now(), now())
     on conflict (id) do nothing`,
    `update auth.users set instance_id = '${instanceId}' where instance_id is null`,
    `update auth.users
       set confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change_token_current = coalesce(email_change_token_current, ''),
           email_change = coalesce(email_change, ''),
           phone_change = coalesce(phone_change, ''),
           phone_change_token = coalesce(phone_change_token, ''),
           reauthentication_token = coalesce(reauthentication_token, '')
     where email is not null`,
    `insert into auth.identities (
       id,
       provider_id,
       user_id,
       identity_data,
       provider,
       created_at,
       updated_at
     )
     select
       gen_random_uuid(),
       u.id::text,
       u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email',
       now(),
       now()
     from auth.users u
     where u.email is not null
       and not exists (
         select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
       )`,
  ]
}

function loadEnv() {
  const envText = readFileSync(join(ROOT, '.env.local'), 'utf8')
  return parseDotEnv(envText)
}

async function runSqlRepair(dbUrl) {
  const client = new pg.Client({ connectionString: dbUrl })
  await client.connect()

  try {
    const sqlStatements = buildRepairSql(CANONICAL_INSTANCE_ID)
    for (const statement of sqlStatements) {
      await client.query(statement)
    }

    const authUsersRes = await client.query('select count(*)::int as count from auth.users')
    const identitiesRes = await client.query('select count(*)::int as count from auth.identities')
    const instancesRes = await client.query('select count(*)::int as count from auth.instances')

    return {
      authUsers: authUsersRes.rows[0].count,
      identities: identitiesRes.rows[0].count,
      instances: instancesRes.rows[0].count,
    }
  } finally {
    await client.end()
  }
}

async function updateSeedPasswords(baseUrl, serviceKey) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  }

  let updated = 0
  let failed = 0

  for (const user of SEEDED_USERS) {
    const res = await fetch(`${baseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        password: 'password123',
        email_confirm: true,
        app_metadata: {
          provider: 'email',
          providers: ['email'],
          role: user.role,
        },
      }),
    })

    if (res.ok) {
      updated += 1
    } else {
      failed += 1
    }
  }

  return { updated, failed }
}

async function probeLogin(baseUrl, anonKey) {
  const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({
      email: 'alice.chen@acme.dev',
      password: 'password123',
    }),
  })

  const body = await res.json().catch(() => ({}))
  return {
    ok: res.ok,
    status: res.status,
    error: body.error_description || body.msg || body.error || null,
  }
}

export async function runRepair() {
  const env = loadEnv()

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const dbUrl = env.SUPABASE_DB_URL

  if (!url || !anonKey || !serviceKey || !dbUrl) {
    throw new Error(
      'Missing required env vars in .env.local. Expected NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL.'
    )
  }

  if (!isLocalSupabaseUrl(url)) {
    throw new Error(
      `Refusing to run against non-local Supabase URL: ${url}. This script is for local repair only.`
    )
  }

  const counts = await runSqlRepair(dbUrl)
  const passwordReset = await updateSeedPasswords(url, serviceKey)
  const loginProbe = await probeLogin(url, anonKey)

  return { counts, passwordReset, loginProbe }
}

async function main() {
  try {
    console.log('\nRepairing local Supabase auth/login state...')
    const result = await runRepair()

    console.log('\nCounts after repair:')
    console.log(`  auth.users:      ${result.counts.authUsers}`)
    console.log(`  auth.identities: ${result.counts.identities}`)
    console.log(`  auth.instances:  ${result.counts.instances}`)

    console.log('\nSeed password reset:')
    console.log(`  updated: ${result.passwordReset.updated}`)
    console.log(`  failed:  ${result.passwordReset.failed}`)

    console.log('\nLogin probe (alice.chen@acme.dev / password123):')
    if (result.loginProbe.ok) {
      console.log(`  OK (status ${result.loginProbe.status})`)
      console.log('\n✅ Local login repair complete.')
      process.exit(0)
    }

    console.log(`  FAILED (status ${result.loginProbe.status})`)
    if (result.loginProbe.error) {
      console.log(`  error: ${result.loginProbe.error}`)
    }
    console.log('\n⚠ Repair ran but login probe still fails.')
    process.exit(1)
  } catch (error) {
    console.error(`\n✗ Repair failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
