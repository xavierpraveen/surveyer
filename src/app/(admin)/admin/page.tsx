import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { count } = await (supabase as unknown as { from: (t: string) => { select: (c: string, o: object) => Promise<{ count: number | null }> } })
    .from('surveys')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Survey Management</h1>
          <p className="text-gray-500 mb-4">
            Create and manage employee surveys, configure sections, questions, and lifecycle.
          </p>
          {user && (
            <div className="text-sm text-gray-600 space-y-1 mb-6">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Role:</span>{' '}
                {(user.app_metadata?.role as string) ?? 'unassigned'}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Link
              href="/admin/surveys"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
            >
              View All Surveys {count !== null ? `(${count})` : ''}
            </Link>
            <Link
              href="/admin/surveys/new"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Create Survey
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
