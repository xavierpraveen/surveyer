export function slugifyDepartmentName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function sectionTargetsDepartment(targetRoles: string[] | null | undefined, departmentName: string): boolean {
  if (!targetRoles || targetRoles.length === 0) return true

  const normalizedTargets = targetRoles.map((r) => String(r).trim().toLowerCase())
  if (normalizedTargets.includes('all')) return true

  const rawDept = (departmentName ?? '').trim()
  if (!rawDept) return false

  const deptLower = rawDept.toLowerCase()
  const deptSlug = slugifyDepartmentName(rawDept)

  return normalizedTargets.includes(deptLower) || normalizedTargets.includes(deptSlug)
}
