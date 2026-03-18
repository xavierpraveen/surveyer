function requireEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]
    if (value && value.trim().length > 0) return value
  }
  throw new Error(`Missing Supabase environment variable. Set one of: ${keys.join(', ')}`)
}

export function getSupabaseUrl(): string {
  return requireEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'])
}

export function getSupabaseAnonKey(): string {
  return requireEnv(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'])
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv(['SUPABASE_SERVICE_ROLE_KEY'])
}

