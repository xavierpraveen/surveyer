import { createSupabaseServerClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-500 mb-4">
            System administration, roster import, and user management.
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
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
