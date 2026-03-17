import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAppSettings } from '@/lib/actions/settings'
import { getEmployeeDirectory } from '@/lib/actions/settings'
import { getParticipationForOpenSurvey } from '@/lib/actions/settings'
import SettingsTabs from '@/components/admin/SettingsTabs'
import type { EmployeeDirectoryRow, ParticipationRow } from '@/lib/types/phase4'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

interface SurveyRow {
  id: string
  title: string
  status: string
  archived: boolean
  created_at: string
}

export default async function SettingsPage() {
  // 1. Fetch app settings for Privacy tab
  const settingsResult = await getAppSettings()
  const initialSettings = settingsResult.success
    ? settingsResult.data
    : { privacyThresholdNumeric: 5, privacyThresholdText: 10, allowedEmailDomain: '' }

  // 2. Fetch all surveys for Cycles tab
  const { data: surveysData } = await db
    .from('surveys')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })

  const initialSurveys = ((surveysData as Omit<SurveyRow, 'archived'>[] | null) ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    archived: false, // column pending migration
    createdAt: s.created_at,
  }))

  // 3. Fetch participation data for Participation tab
  const participationResult = await getParticipationForOpenSurvey()
  const initialParticipation: ParticipationRow[] = participationResult.success
    ? participationResult.data
    : []

  // 4. Fetch employee directory for Directory tab
  const employeeDirectoryResult = await getEmployeeDirectory()
  const initialEmployees: EmployeeDirectoryRow[] = employeeDirectoryResult.success
    ? employeeDirectoryResult.data
    : []

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-extrabold tracking-snug text-fg mb-6">Admin Settings</h1>
      <SettingsTabs
        initialSettings={initialSettings}
        initialSurveys={initialSurveys}
        initialParticipation={initialParticipation}
        initialEmployees={initialEmployees}
      />
    </div>
  )
}
