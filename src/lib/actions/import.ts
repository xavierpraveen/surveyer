'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AppRole } from '@/lib/constants/roles'

export interface RosterRow {
  full_name: string
  email: string
  department: string
  role: AppRole
  tenure_band: string
}

export function parseCsvRoster(csvText: string): RosterRow[] {
  // Phase 4 implementation — stub returns empty array
  void csvText
  return []
}

export async function importRoster(_rows: RosterRow[]) {
  // Phase 4 implementation
  void supabaseAdmin
  return { imported: 0, errors: [] }
}
