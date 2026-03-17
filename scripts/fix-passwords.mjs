/**
 * Fixes passwords for existing seed users by updating via Admin API.
 * The SQL seed used crypt() but GoTrue needs passwords set via its own API.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const envContent = readFileSync(join(ROOT, '.env.local'), 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const users = [
  { id: '33300000-0000-0000-0000-000000000001', email: 'alice.chen@acme.dev',    role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000002', email: 'bob.kim@acme.dev',       role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000003', email: 'carol.patel@acme.dev',   role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000004', email: 'david.nguyen@acme.dev',  role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000005', email: 'eve.rodriguez@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000015', email: 'noah.hassan@acme.dev',   role: 'admin' },
  { id: '33300000-0000-0000-0000-000000000016', email: 'olivia.park@acme.dev',   role: 'admin' },
]

const commonHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
}

async function updateUserById(userId, user) {
  return fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: commonHeaders,
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
}

async function findUserIdByEmail(email) {
  const target = email.toLowerCase()
  let page = 1

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=100`,
      { headers: commonHeaders }
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !Array.isArray(data.users)) return null

    const found = data.users.find((u) => (u.email || '').toLowerCase() === target)
    if (found?.id) return found.id

    if (data.users.length < 100) return null
    page += 1
  }
}

async function createUser(user) {
  return fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify({
      email: user.email,
      password: 'password123',
      email_confirm: true,
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        role: user.role,
      },
      user_metadata: {
        full_name: user.email.split('@')[0],
      },
    }),
  })
}

console.log(`\nFixing passwords + app_metadata for ${users.length} users...\n`)

let updatedCount = 0
let createdCount = 0
let failedCount = 0

for (const user of users) {
  try {
    let resolvedUserId = user.id
    let res = await updateUserById(resolvedUserId, user)
    let data = await res.json().catch(() => ({}))

    if (!res.ok && data?.error_code === 'user_not_found') {
      const lookedUpId = await findUserIdByEmail(user.email)
      if (lookedUpId) {
        resolvedUserId = lookedUpId
        res = await updateUserById(resolvedUserId, user)
        data = await res.json().catch(() => ({}))
      }
    }

    if (res.ok) {
      updatedCount += 1
      const role = data?.app_metadata?.role ?? user.role
      const idNote = resolvedUserId === user.id ? '' : ` (resolved id: ${resolvedUserId})`
      console.log(`  ✓ ${user.email} — password set, role: ${role}${idNote}`)
      continue
    }

    if (data?.error_code === 'user_not_found') {
      const createRes = await createUser(user)
      const createData = await createRes.json().catch(() => ({}))
      if (createRes.ok) {
        createdCount += 1
        console.log(`  ✓ ${user.email} — user created with password123 (role: ${user.role})`)
      } else {
        failedCount += 1
        console.error(`  ✗ ${user.email}: create failed ${JSON.stringify(createData)}`)
      }
      continue
    }

    failedCount += 1
    console.error(`  ✗ ${user.email}: ${JSON.stringify(data)}`)
  } catch (error) {
    failedCount += 1
    console.error(`  ✗ ${user.email}: unexpected error: ${String(error)}`)
  }
}

console.log(`\nSummary: updated=${updatedCount}, created=${createdCount}, failed=${failedCount}`)
if (failedCount === 0) {
  console.log('✅ Done! Password is password123 for all listed users.')
} else {
  console.log('⚠ Completed with failures. See errors above.')
}
