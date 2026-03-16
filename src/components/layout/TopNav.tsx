import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function TopNav() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Compute initials: first letter of full_name, or first letter of email prefix, uppercased
  const name: string = user?.user_metadata?.full_name ?? user?.email ?? 'U'
  const initials = name.includes(' ')
    ? name.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
    : name.replace(/@.*/, '')[0]?.toUpperCase() ?? 'U'

  return (
    <nav className="bg-surface border-b border-border h-11 px-5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span
            className="w-[22px] h-[22px] rounded-md bg-gradient-to-br from-brand to-accent flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-fg font-extrabold text-sm tracking-tight">Surveyer</span>
        </Link>
        {/* Nav links — rendered as plain links; active detection is a future enhancement */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs text-fg-muted font-medium hover:text-fg transition-colors">
            Admin
          </Link>
          <Link href="/dashboard" className="text-xs text-fg-muted font-medium hover:text-fg transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
      {/* User avatar */}
      <div
        className="w-[26px] h-[26px] rounded-full bg-brand-muted text-brand font-bold text-[10px] flex items-center justify-center flex-shrink-0"
        aria-label={`User: ${name}`}
      >
        {initials}
      </div>
    </nav>
  )
}
