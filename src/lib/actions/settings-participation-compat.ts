import type { ParticipationRow } from '@/lib/types/phase4'

type PartLike = {
  department_id?: string | null
  department_name?: string | null
  title?: string | null
  eligible_count?: number | string | null
  token_count?: number | string | null
  submitted_count?: number | string | null
}

type EligibleLike = {
  department_id: string | null
  department_name: string | null
  eligible_count: number | string | null
}

export function buildParticipationRows(
  partData: PartLike[],
  eligibleData: EligibleLike[]
): ParticipationRow[] {
  const eligibleMap = new Map<string, { name: string; eligible: number }>()

  for (const row of eligibleData) {
    const deptId = row.department_id ?? `name:${row.department_name ?? 'Unknown'}`
    const deptName = row.department_name ?? 'Unknown'
    const eligible = Number(row.eligible_count ?? 0)
    eligibleMap.set(deptId, { name: deptName, eligible })
  }

  // Merge responded counts onto eligible rows (or create rows for unknown depts)
  const respondedMap = new Map<string, number>()
  for (const row of partData) {
    const deptId = row.department_id ?? `name:${row.department_name ?? row.title ?? 'Unknown'}`
    const responded = Number(row.token_count ?? row.submitted_count ?? 0)
    respondedMap.set(deptId, responded)
    const partName = row.department_name ?? row.title ?? 'Unknown'

    if (!eligibleMap.has(deptId)) {
      eligibleMap.set(deptId, {
        name: partName,
        eligible: Number(row.eligible_count ?? 0),
      })
    } else {
      const existing = eligibleMap.get(deptId)!
      if (existing.name === 'Unknown' && partName !== 'Unknown') {
        eligibleMap.set(deptId, { ...existing, name: partName })
      }
    }
  }

  return Array.from(eligibleMap.entries()).map(([deptId, meta]) => {
    const responded = respondedMap.get(deptId) ?? 0
    const rate = meta.eligible > 0 ? Math.round((responded / meta.eligible) * 100) : 0
    return {
      department: meta.name,
      departmentId: deptId.startsWith('name:') ? null : deptId,
      eligible: meta.eligible,
      responded,
      rate,
    }
  })
}
