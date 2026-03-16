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

const users = [
  { id: '33300000-0000-0000-0000-000000000001', email: 'alice.chen@acme.dev',    role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000002', email: 'bob.kim@acme.dev',       role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000003', email: 'carol.patel@acme.dev',   role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000004', email: 'david.nguyen@acme.dev',  role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000005', email: 'eve.rodriguez@acme.dev', role: 'employee' },
  { id: '33300000-0000-0000-0000-000000000015', email: 'noah.hassan@acme.dev',   role: 'admin' },
  { id: '33300000-0000-0000-0000-000000000016', email: 'olivia.park@acme.dev',   role: 'admin' },
]

console.log(`\nFixing passwords + app_metadata for ${users.length} users...\n`)

for (const user of users) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
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

  const data = await res.json()
  if (res.ok) {
    console.log(`  ✓ ${user.email} — password set, role: ${data.app_metadata?.role}`)
  } else {
    console.error(`  ✗ ${user.email}: ${JSON.stringify(data)}`)
  }
}

console.log('\n✅ Done! All passwords set to: password123')
