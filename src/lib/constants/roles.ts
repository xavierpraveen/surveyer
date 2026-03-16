// ─── Role Types ───────────────────────────────────────────────────────────────

/**
 * All role values that can be stored in Supabase app_metadata.role (AUTH-07).
 * v1 consolidation: manager, leadership, hr_admin, survey_analyst all route to
 * the /admin area. Dedicated sub-routes per role are a v2 concern (separate
 * dashboards per role with different data scopes). In v1, the admin area serves
 * all elevated roles.
 */
export type AppRole =
  | 'employee'
  | 'manager'
  | 'leadership'
  | 'admin'
  | 'hr_admin'
  | 'survey_analyst'

export const APP_ROLES: readonly AppRole[] = [
  'employee',
  'manager',
  'leadership',
  'admin',
  'hr_admin',
  'survey_analyst',
]

// ─── Route Map ────────────────────────────────────────────────────────────────

/**
 * AUTH-06: Maps each role to its home route.
 *
 * v1 consolidation decision: manager, leadership, hr_admin, and survey_analyst
 * all share the /admin area. This is an intentional v1 scope reduction — a
 * single admin surface is sufficient for the ~87-person org in v1. Role-specific
 * dashboards (e.g. /manager/dashboard, /leadership/dashboard) are deferred to v2.
 */
export const ROLE_ROUTES: Record<AppRole, string> = {
  employee: '/dashboard',
  // v1 consolidation: all elevated roles → /admin (see comment above)
  manager: '/admin',
  leadership: '/admin',
  admin: '/admin',
  hr_admin: '/admin',
  survey_analyst: '/admin',
}

/**
 * Roles that map to the admin area in v1.
 * Used by middleware to determine route protection (non-employee = can access /admin).
 */
export const ADMIN_ROLES: readonly AppRole[] = [
  'manager',
  'leadership',
  'admin',
  'hr_admin',
  'survey_analyst',
]
