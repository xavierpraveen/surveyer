import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Survey } from '@/lib/types/survey'
import SurveyList from '@/components/admin/SurveyList'

export default async function SurveysPage() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: unknown) => {
          order: (col: string, opts: object) => Promise<{ data: Survey[] | null; error: unknown }>
        }
      }
    }
  })
    .from('surveys')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false })

  const surveys: Survey[] = error ? [] : (data ?? [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <SurveyList surveys={surveys} />
      </div>
    </div>
  )
}
