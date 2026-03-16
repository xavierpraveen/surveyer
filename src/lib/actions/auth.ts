'use server'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { signInSchema, magicLinkSchema } from '@/lib/validations/auth'
import { ROLE_ROUTES, normalizeRole } from '@/lib/constants/roles'

function isDomainAllowed(email: string): boolean {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN
  if (!domain) return true // unconfigured = allow all (dev fallback)
  return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)
}

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { email, password } = parsed.data
  if (!isDomainAllowed(email)) {
    return {
      error: `This app is for company employees. Please use your company email to sign in.`,
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const role = normalizeRole(data.user?.app_metadata?.role as string | undefined)
  redirect(ROLE_ROUTES[role])
}

export async function signInWithMagicLink(
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { email } = parsed.data
  if (!isDomainAllowed(email)) {
    return { error: `This app is for company employees. Please use your company email.` }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }, // don't allow new sign-ups via magic link
  })
  if (error) return { error: error.message }
  return { success: 'Check your email for a magic link.' }
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function assignUserRole(
  userId: string,
  role: AppRole
): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  })
  if (error) return { error: error.message }
  return {}
}
