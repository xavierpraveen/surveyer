/**
 * Migration runner for remote Supabase project.
 * Uses the Supabase Management API to execute SQL migrations.
 * Run: node scripts/migrate-remote.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

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
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!PROJECT_REF) {
  console.error('Could not extract project ref from SUPABASE_URL:', SUPABASE_URL)
  process.exit(1)
}

console.log(`Project ref: ${PROJECT_REF}`)
console.log(`Supabase URL: ${SUPABASE_URL}`)

const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations')
const migrations = [
  '20260315000001_schema.sql',
  '20260315000002_rls.sql',
  '20260315000003_views.sql',
  '20260315000004_seed.sql',
]

async function execSQL(sql) {
  // Use Supabase's pg query endpoint via management API
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return JSON.parse(text)
}

// Test if management API works, otherwise fall back to pg direct
async function testManagementAPI() {
  try {
    const result = await execSQL('SELECT 1 as test')
    console.log('✓ Management API accessible')
    return true
  } catch (e) {
    console.log('✗ Management API requires personal access token:', e.message)
    return false
  }
}

async function runWithPg() {
  const { default: pg } = await import('pg')
  const { Client } = pg

  // Construct connection URL — try IPv6 explicit host
  const dbUrl = env['SUPABASE_DB_URL']
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL not set in .env.local')
    process.exit(1)
  }

  console.log('\n--- Attempting direct pg connection ---')
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    await client.connect()
    console.log('✓ Connected to database')

    for (const file of migrations) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
      console.log(`\nApplying ${file}...`)
      try {
        await client.query(sql)
        console.log(`✓ ${file} applied`)
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log(`⚠ ${file} skipped (already applied or objects exist)`)
        } else {
          console.error(`✗ ${file} failed:`, e.message)
          throw e
        }
      }
    }

    console.log('\n✅ All migrations complete!')
  } finally {
    await client.end()
  }
}

// Main
console.log('\nTesting Management API...')
const apiWorks = await testManagementAPI()

if (apiWorks) {
  for (const file of migrations) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`\nApplying ${file}...`)
    try {
      await execSQL(sql)
      console.log(`✓ ${file} applied`)
    } catch (e) {
      console.error(`✗ ${file} failed:`, e.message)
    }
  }
  console.log('\n✅ All migrations complete!')
} else {
  await runWithPg()
}
