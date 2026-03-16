/**
 * Debug Supabase connection and apply Phase 4 migration.
 * Tries multiple connection methods in order:
 *   1. Supabase Management API (needs personal token — will fail)
 *   2. Direct DB port 5432 via IPv4 (resolves hostname to A record)
 *   3. Session-mode pooler ap-southeast-1 port 5432
 *   4. Transaction-mode pooler ap-southeast-1 port 6543
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load env
const envContent = readFileSync(join(ROOT, '.env.local'), 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
const DB_URL = env['SUPABASE_DB_URL']
const PASSWORD = DB_URL?.match(/:([^:@]+)@/)?.[1] ?? ''
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''

console.log('\n=== Supabase Connection Debugger ===')
console.log(`Project ref: ${PROJECT_REF}`)
console.log(`URL:         ${SUPABASE_URL}`)
console.log(`Password:    ${PASSWORD ? '[set]' : '[missing]'}`)
console.log(`Service key: ${SERVICE_KEY ? '[set]' : '[missing]'}`)

// --- 1. DNS resolution ---
console.log('\n--- DNS Resolution ---')
const directHost = `db.${PROJECT_REF}.supabase.co`
let ipv4 = null
try {
  const records = await dns.resolve4(directHost)
  ipv4 = records[0]
  console.log(`✓ IPv4 (A):  ${directHost} → ${records.join(', ')}`)
} catch (e) {
  console.log(`✗ IPv4:      ${e.message}`)
}
try {
  const records = await dns.resolve6(directHost)
  console.log(`  IPv6 (AAAA): ${directHost} → ${records[0]} (often blocked)`)
} catch (e) {
  console.log(`  IPv6: ${e.message}`)
}

// Pooler regions to try
const POOLER_REGIONS = [
  'aws-0-ap-southeast-1',
  'aws-0-us-east-1',
  'aws-0-eu-west-1',
  'aws-0-ap-northeast-1',
]

// --- 2. Try pg connections ---
let { default: pg } = await import('pg').catch(() => ({ default: null }))
if (!pg) {
  console.error('\n✗ pg package not installed. Run: npm install pg')
  process.exit(1)
}
const { Client } = pg

async function tryConnect(label, connStr, opts = {}) {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
    ...opts,
  })
  try {
    await client.connect()
    const res = await client.query('SELECT version()')
    console.log(`✓ ${label}: connected — ${res.rows[0].version.split(' ').slice(0,2).join(' ')}`)
    await client.end()
    return connStr
  } catch (e) {
    console.log(`✗ ${label}: ${e.message.split('\n')[0]}`)
    try { await client.end() } catch {}
    return null
  }
}

console.log('\n--- Connection Attempts ---')

// 2a. Direct via IPv4 (skip IPv6)
let workingConn = null
if (ipv4) {
  const directIPv4 = `postgresql://postgres:${encodeURIComponent(PASSWORD)}@${ipv4}:5432/postgres`
  workingConn = await tryConnect('Direct DB (IPv4)', directIPv4)
}

// 2b. Direct via hostname (will try IPv6 first — likely fails)
if (!workingConn) {
  workingConn = await tryConnect('Direct DB (hostname)', `postgresql://postgres:${encodeURIComponent(PASSWORD)}@${directHost}:5432/postgres`)
}

// 2c. Pooler connections
for (const region of POOLER_REGIONS) {
  if (workingConn) break
  const poolerHost = `${region}.pooler.supabase.com`
  // Session mode (port 5432) — supports DDL
  workingConn = await tryConnect(
    `Session pooler ${region}:5432`,
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@${poolerHost}:5432/postgres`
  )
  if (!workingConn) {
    // Transaction mode (port 6543) — no DDL support, but useful for DML
    await tryConnect(
      `Txn pooler ${region}:6543`,
      `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(PASSWORD)}@${poolerHost}:6543/postgres`
    )
  }
}

if (!workingConn) {
  console.log('\n✗ All connection methods failed.')
  console.log('\nFallback: Apply the migration manually in the Supabase SQL editor:')
  console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
  console.log('\nSQL to run:\n')
  const sql = readFileSync(join(ROOT, 'supabase/migrations/20260316000007_phase4.sql'), 'utf8')
  console.log(sql)
  process.exit(1)
}

// --- 3. Apply Phase 4 migration ---
console.log('\n--- Applying Phase 4 Migration ---')
const client = new Client({
  connectionString: workingConn,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const MIGRATION_FILE = join(ROOT, 'supabase/migrations/20260316000007_phase4.sql')
const migrationSQL = readFileSync(MIGRATION_FILE, 'utf8')

// Split into individual statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 60)
  try {
    await client.query(stmt)
    console.log(`  ✓ ${preview}...`)
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log(`  ⚠ already exists — ${preview}...`)
    } else {
      console.error(`  ✗ FAILED: ${preview}...\n    Error: ${e.message}`)
    }
  }
}

await client.end()
console.log('\n✅ Phase 4 migration complete!')
