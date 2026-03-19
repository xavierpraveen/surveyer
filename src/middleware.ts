import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'
import { ROLE_ROUTES, normalizeRole } from '@/lib/constants/roles'

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
    if (rawRole === 'manager') {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url))
    }
    const nr = normalizeRole(rawRole)
    return NextResponse.redirect(new URL(ROLE_ROUTES[nr], request.url))
  }

  // Redirect root "/" to role home
  if (pathname === '/') {
    const rawRole = user.app_metadata?.role as string | undefined
    if (rawRole === 'manager') {
      return NextResponse.redirect(new URL('/manager/dashboard', request.url))
    }
    const nr = normalizeRole(rawRole)
    return NextResponse.redirect(new URL(ROLE_ROUTES[nr], request.url))
  }

  // Role-based route protection — reads JWT app_metadata, zero DB queries
  const rawRole = user.app_metadata?.role as string | undefined
  const normalizedRole = normalizeRole(rawRole)

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
