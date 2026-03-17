import { describe, expect, test } from 'vitest'
import { buildRepairSql, isLocalSupabaseUrl, parseDotEnv } from './repair-local-auth.mjs'

describe('parseDotEnv', () => {
  test('parses leading-spaced keys and ignores comments', () => {
    const parsed = parseDotEnv(`
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# comment
   SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
`) as Record<string, string>

    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321')
    expect(parsed.SUPABASE_DB_URL).toContain('postgresql://postgres')
  })
})

describe('isLocalSupabaseUrl', () => {
  test('accepts localhost and loopback urls', () => {
    expect(isLocalSupabaseUrl('http://127.0.0.1:54321')).toBe(true)
    expect(isLocalSupabaseUrl('http://localhost:54321')).toBe(true)
  })

  test('rejects hosted supabase url', () => {
    expect(isLocalSupabaseUrl('https://abcd.supabase.co')).toBe(false)
  })
})

describe('buildRepairSql', () => {
  test('includes canonical instance bootstrap and token normalization', () => {
    const sql = buildRepairSql('00000000-0000-0000-0000-000000000000')

    expect(sql.some((q) => q.includes('insert into auth.instances'))).toBe(true)
    expect(sql.some((q) => q.includes('update auth.users set instance_id'))).toBe(true)
    expect(sql.some((q) => q.includes('confirmation_token = coalesce'))).toBe(true)
    expect(sql.some((q) => q.includes('insert into auth.identities'))).toBe(true)
  })
})
