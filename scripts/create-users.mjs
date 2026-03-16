/**
 * Creates all 18 seed users via Supabase Auth Admin API (bypasses bcrypt format issues).
 * Run: node scripts/create-users.mjs
 *
 * After running this script, apply the questionnaire questions by executing:
 *   supabase/migrations/20260316000008_questionnaire_seed.sql
 * via the Supabase CLI (`supabase db push`) or the Supabase SQL Editor.
 * That migration adds 9 department-specific survey sections and ~37 questions
 * from the PDF questionnaire (Company-Wide, Engineering, QA, UI/UX, Project Managers,
 * Sales/Business, Architects/Tech Lead, HR/Operations, Marketing) to the existing
 * Organizational Health Diagnostic survey (55500000-0000-0000-0000-000000000001).
 * It is idempotent and safe to re-run.
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
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars'); process.exit(1)
}

const users = [
  // Employees
  { id: '33300000-0000-0000-0000-000000000001', email: 'alice.chen@acme.dev',    role: 'employee', full_name: 'Alice Chen' },
  { id: '33300000-0000-0000-0000-000000000002', email: 'bob.kim@acme.dev',       role: 'employee', full_name: 'Bob Kim' },
  { id: '33300000-0000-0000-0000-000000000003', email: 'carol.patel@acme.dev',   role: 'employee', full_name: 'Carol Patel' },
  { id: '33300000-0000-0000-0000-000000000004', email: 'david.nguyen@acme.dev',  role: 'employee', full_name: 'David Nguyen' },
  { id: '33300000-0000-0000-0000-000000000005', email: 'eve.rodriguez@acme.dev', role: 'employee', full_name: 'Eve Rodriguez' },
  // Admins
  { id: '33300000-0000-0000-0000-000000000015', email: 'noah.hassan@acme.dev',   role: 'admin',    full_name: 'Noah Hassan' },
  { id: '33300000-0000-0000-0000-000000000016', email: 'olivia.park@acme.dev',   role: 'admin',    full_name: 'Olivia Park' },
]

async function upsertUser(user) {
  // Try to create first
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({
      email: user.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
      app_metadata: { role: user.role },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    if (data.msg?.includes('already been registered') || data.code === 'email_exists') {
      console.log(`  ⚠ ${user.email} already exists — updating app_metadata`)
      // Update existing user's app_metadata
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(user.email)}`, {
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
      })
      const listData = await listRes.json()
      const existingId = listData.users?.[0]?.id
      if (existingId) {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY,
          },
          body: JSON.stringify({
            password: 'password123',
            email_confirm: true,
            app_metadata: { role: user.role },
          }),
        })
        console.log(`  ✓ Updated ${user.email} (role: ${user.role})`)
      }
    } else {
      console.error(`  ✗ ${user.email}: ${JSON.stringify(data)}`)
    }
    return
  }

  console.log(`  ✓ Created ${user.email} (role: ${user.role}, id: ${data.id})`)
}

console.log(`\nCreating/updating ${users.length} users via Auth Admin API...`)
console.log(`Project: ${SUPABASE_URL}\n`)

for (const user of users) {
  await upsertUser(user)
}

console.log('\n✅ Done!')
