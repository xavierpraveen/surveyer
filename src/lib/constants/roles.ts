// ─── Role Types ───────────────────────────────────────────────────────────────

/**
 * v1 application roles. All elevated JWT roles (manager, leadership, hr_admin,
 * survey_analyst) normalize to 'admin'. Use normalizeRole() to convert a raw
 * Supabase JWT role string to an AppRole before any role check.
 */
export type AppRole = 'employee' | 'admin'

// ─── Raw JWT Role Normalization ───────────────────────────────────────────────

/**
 * Raw Supabase app_metadata.role values that map to the 'admin' AppRole.
 * 'employee' is the default for everything not in this list (including undefined).
 */
export const ADMIN_ROLES: readonly string[] = [
  'manager',
  'leadership',
  'admin',
  'hr_admin',
  'survey_analyst',
]

/**
 * Maps any raw JWT role string to an AppRole.
 * Unknown or missing roles default to 'employee'.
 */
export function normalizeRole(raw: string | undefined): AppRole {
  if (raw && ADMIN_ROLES.includes(raw)) return 'admin'
  return 'employee'
}

// ─── Route Map ────────────────────────────────────────────────────────────────

/**
 * AUTH-06: Maps each AppRole to its home route.
 * All elevated roles normalize to 'admin' before this lookup.
 */
export const ROLE_ROUTES: Record<AppRole, string> = {
  employee: '/dashboard',
  admin: '/admin',
}
