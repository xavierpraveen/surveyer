import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

// Singleton — do not create multiple instances
export const supabaseAdmin = createClient<Database>(
  getSupabaseUrl(),
  getSupabaseServiceRoleKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
