export type AppRole = 'employee' | 'manager' | 'leadership' | 'admin' | 'hr_admin' | 'survey_analyst'

export const APP_ROLES: readonly AppRole[] = [
  'employee',
  'manager',
  'leadership',
  'admin',
  'hr_admin',
  'survey_analyst',
]

export const ROLE_ROUTES: Record<AppRole, string> = {
  employee: '/dashboard',
  manager: '/manager/dashboard',
  leadership: '/leadership/dashboard',
  admin: '/admin',
  hr_admin: '/admin',
  survey_analyst: '/admin',
}
