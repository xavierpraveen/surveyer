import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

const nav = [
  {
    href: '/admin/surveys',
    label: 'Surveys',
    description: 'Create and manage survey cycles, lifecycle, and publication',
  },
  {
    href: '/admin/actions',
    label: 'Action Items',
    description: 'Track commitments linked to survey findings',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    description: 'Employees, privacy thresholds, participation, and cycle archival',
  },
]

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-snug text-fg">Admin Dashboard</h1>
        {user && (
          <p className="text-sm text-fg-muted mt-1">
            Signed in as <span className="font-medium text-fg">{user.email}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-surface border border-border rounded-lg shadow-sm p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <h2 className="text-base font-bold tracking-tight text-fg">{item.label}</h2>
            <p className="text-sm text-fg-muted mt-1">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/results"
          className="text-sm text-brand-text hover:underline"
        >
          View published results →
        </Link>
      </div>
    </div>
  )
}
