'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signInWithMagicLink } from '@/lib/actions/auth'

export default function MagicLinkPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    setPending(true)
    try {
      const result = await signInWithMagicLink(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-lg shadow-md p-8 w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand to-accent flex-shrink-0" />
          <span className="text-fg font-extrabold text-sm tracking-tight">Surveyer</span>
        </div>

        <h1 className="text-xl font-bold tracking-snug text-fg text-center mb-6">Sign in with magic link</h1>

        {success ? (
          <div className="text-sm text-success-text bg-success-muted px-4 py-3 rounded-md border border-success text-center">
            {success}
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-fg mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
                placeholder="you@company.com"
              />
            </div>

            {error && (
              <p className="text-xs text-error-text bg-error-muted px-3 py-2 rounded-md" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-fg-muted">
          Have a password?{' '}
          <Link href="/login" className="text-brand-text hover:underline text-sm">
            Sign in with email
          </Link>
        </p>
      </div>
    </div>
  )
}
