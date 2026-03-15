import { describe, test } from 'vitest'

describe('signIn', () => {
  test.todo('returns no error for valid company email + password')
  test.todo('returns domain error for non-company email')
})

describe('signInWithMagicLink', () => {
  test.todo('sends magic link for valid company email')
  test.todo('returns domain error for non-company email')
})

describe('signOut', () => {
  test.todo('clears the session cookie')
})

describe('assignUserRole', () => {
  test.todo('calls supabaseAdmin.auth.admin.updateUserById with app_metadata.role')
  test.todo('returns error for invalid role value')
})
