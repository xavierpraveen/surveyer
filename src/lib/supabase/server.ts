import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies() // Next.js 15: cookies() is async
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from RSC — cookie mutation is expected to fail silently
          }
        },
      },
    }
  )
}
