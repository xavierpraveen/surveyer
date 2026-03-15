import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
import type { AppRole } from '@/lib/constants/roles'

const PUBLIC_ROUTES = ['/login', '/magic-link', '/auth/callback']

// Role → route prefix. Used for redirect and protection.
const ROLE_HOME: Record<AppRole, string> = {
  employee: '/dashboard',
  manager: '/manager/dashboard',
  leadership: '/leadership/dashboard',
  admin: '/admin',
  hr_admin: '/admin',
  survey_analyst: '/admin',
}

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
    const role = user.app_metadata?.role as AppRole | undefined
    const home = role ? ROLE_HOME[role] : '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  // Role-based route protection — reads JWT app_metadata, zero DB queries
  const role = user.app_metadata?.role as AppRole | undefined
  if (!role) {
    // Authenticated but no role assigned yet — redirect to login with message
    return NextResponse.redirect(new URL('/login?error=no_role', request.url))
  }

  const home = ROLE_HOME[role]

  // Protect role-specific route prefixes
  const rolePrefix = home.replace('/dashboard', '').replace('/admin', '/admin')
  // Simple protection: employees can't access /admin, /leadership, /manager routes
  if (pathname.startsWith('/admin') && role === 'employee') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (
    pathname.startsWith('/leadership') &&
    !(['leadership', 'admin'] as AppRole[]).includes(role)
  ) {
    return NextResponse.redirect(new URL(home, request.url))
  }
  if (
    pathname.startsWith('/manager') &&
    !(['manager', 'leadership', 'admin'] as AppRole[]).includes(role)
  ) {
    return NextResponse.redirect(new URL(home, request.url))
  }

  void rolePrefix
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
