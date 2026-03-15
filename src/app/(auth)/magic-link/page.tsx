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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in with magic link</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your company email and we&apos;ll send you a sign-in link.
        </p>

        {success ? (
          <div className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-md border border-green-200">
            {success}
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@company.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          Have a password?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in with email
          </Link>
        </p>
      </div>
    </div>
  )
}
