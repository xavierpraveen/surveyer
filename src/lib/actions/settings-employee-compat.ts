import type { EmployeeDirectoryRow } from '@/lib/types/phase4'

export function normalizeEmployeeDirectoryRow(input: Record<string, unknown>): EmployeeDirectoryRow {
  const departments = (input.departments as { name?: string } | null) ?? null
  const roles = (input.roles as { name?: string } | null) ?? null

  const name =
    (typeof input.full_name === 'string' && input.full_name) ||
    (typeof input.name === 'string' && input.name) ||
    'Unknown'

  const email = typeof input.email === 'string' ? input.email : ''
  const department =
    (typeof departments?.name === 'string' && departments.name) ||
    (typeof input.department === 'string' && input.department) ||
    null

  const role =
    (typeof roles?.name === 'string' && roles.name) ||
    (typeof input.role === 'string' && input.role) ||
    null

  return {
    id: String(input.id ?? ''),
    name,
    email,
    department,
    role,
    tenureBand: (input.tenure_band as string | null | undefined) ?? null,
    isActive: (input.is_active as boolean | null | undefined) ?? true,
    createdAt: (input.created_at as string | null | undefined) ?? '',
  }
}
