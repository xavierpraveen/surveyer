export type AppRole = 'employee' | 'admin'

export const APP_ROLES: readonly AppRole[] = ['employee', 'admin']

export const ROLE_ROUTES: Record<AppRole, string> = {
  employee: '/dashboard',
  admin: '/admin',
}
