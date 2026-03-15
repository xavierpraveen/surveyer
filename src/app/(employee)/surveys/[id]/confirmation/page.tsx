import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkSubmissionStatus } from '@/lib/actions/response'
import ConfirmationClient from './ConfirmationClient'
import type { Survey } from '@/lib/types/survey'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { id: surveyId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch survey
  const { data: surveyData } = await db
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single()

  if (!surveyData) {
    redirect('/dashboard')
  }

  const survey = surveyData as Survey

  // Check if the user has actually submitted — if not, redirect to the survey
  const statusResult = await checkSubmissionStatus(surveyId)
  if (!statusResult.success || statusResult.data !== 'submitted') {
    redirect(`/surveys/${surveyId}`)
  }

  // Participation rate — count tokens vs total eligible employees
  const { count: tokenCount } = await db
    .from('participation_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', surveyId)

  const { count: employeeCount } = await db
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const participationCount = tokenCount ?? 0
  const totalEmployees = employeeCount ?? 0
  const participationRate =
    totalEmployees > 0 ? Math.round((participationCount / totalEmployees) * 100) : 0

  return (
    <ConfirmationClient
      surveyTitle={survey.title}
      surveyStatus={survey.status}
      participationRate={participationRate}
      participationCount={participationCount}
    />
  )
}
