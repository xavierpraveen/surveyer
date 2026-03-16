import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
import type { AppRole } from '@/lib/constants/roles'
import { ROLE_ROUTES } from '@/lib/constants/roles'

const PUBLIC_ROUTES = ['/login', '/magic-link', '/auth/callback', '/survey/public/']

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request)
  const pathname = request.nextUrl.pathname

  // Use getUser() — NOT getSession() — to avoid trusting unverified session data
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated: allow public routes, block everything else
  if (!user) {
    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated: redirect away from auth pages
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const rawRole = user.app_metadata?.role as string | undefined
    // v1 consolidation: all roles are now in ROLE_ROUTES; unknown roles default to employee
    const nr: AppRole = (rawRole && rawRole in ROLE_ROUTES) ? rawRole as AppRole : 'employee'
    return NextResponse.redirect(new URL(ROLE_ROUTES[nr], request.url))
  }

  // Redirect root "/" to role home
  if (pathname === '/') {
    const rawRole = user.app_metadata?.role as string | undefined
    // v1 consolidation: all roles are now in ROLE_ROUTES; unknown roles default to employee
    const nr: AppRole = (rawRole && rawRole in ROLE_ROUTES) ? rawRole as AppRole : 'employee'
    return NextResponse.redirect(new URL(ROLE_ROUTES[nr], request.url))
  }

  // Role-based route protection — reads JWT app_metadata, zero DB queries
  const role = user.app_metadata?.role as AppRole | undefined
  if (!role) {
    // Authenticated but no role assigned yet — redirect to login with message
    return NextResponse.redirect(new URL('/login?error=no_role', request.url))
  }

  // v1 consolidation: all roles map directly via ROLE_ROUTES (see src/lib/constants/roles.ts)
  // manager, leadership, hr_admin, survey_analyst all route to /admin in v1
  const normalizedRole: AppRole = role in ROLE_ROUTES ? role : 'employee'
  const home = ROLE_ROUTES[normalizedRole]

  // Employees cannot access /admin routes
  if (pathname.startsWith('/admin') && normalizedRole === 'employee') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
