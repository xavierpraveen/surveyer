'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSurvey } from '@/lib/actions/survey'

interface FormErrors {
  title?: string
  description?: string
  opens_at?: string
  closes_at?: string
  general?: string
}

export default function NewSurveyPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [form, setForm] = useState({
    title: '',
    description: '',
    is_anonymous: true,
    public_link_enabled: false,
    opens_at: '',
    closes_at: '',
  })

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    const input: Record<string, unknown> = {
      title: form.title,
      description: form.description || undefined,
      is_anonymous: form.is_anonymous,
      public_link_enabled: form.public_link_enabled,
    }
    if (form.opens_at) input.opens_at = new Date(form.opens_at).toISOString()
    if (form.closes_at) input.closes_at = new Date(form.closes_at).toISOString()

    const result = await createSurvey(input)
    setSubmitting(false)

    if (!result.success) {
      // Try to parse field errors from Zod message
      const msg = result.error ?? 'Unknown error'
      if (msg.toLowerCase().includes('title')) {
        setErrors({ title: msg })
      } else {
        setErrors({ general: msg })
      }
      return
    }

    router.push(`/admin/surveys/${result.data.id}`)
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-snug text-fg">Create Survey</h1>
        <p className="text-sm text-fg-muted mt-1">Fill in the details below to create a new survey.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg shadow-sm p-6 space-y-5 max-w-xl">
        {errors.general && (
          <div className="p-3 bg-error-muted border border-error rounded-md text-sm text-error-text" role="alert">
            {errors.general}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-fg mb-1">
            Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            maxLength={200}
            placeholder="e.g. Q1 2026 Employee Survey"
            className={`w-full border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus ${
              errors.title ? 'border-error focus:ring-red-200' : 'border-border'
            }`}
          />
          {errors.title && <p className="mt-1 text-xs text-error-text" role="alert">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-fg mb-1">
            Description <span className="text-fg-subtle font-normal">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            placeholder="Brief overview of what this survey covers..."
            className="w-full border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus resize-none"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">Anonymous responses</span>
            <button
              type="button"
              onClick={() => handleChange('is_anonymous', !form.is_anonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.is_anonymous ? 'bg-brand' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.is_anonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">Public link access</span>
            <button
              type="button"
              onClick={() => handleChange('public_link_enabled', !form.public_link_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.public_link_enabled ? 'bg-brand' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.public_link_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              Opens at <span className="text-fg-subtle font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.opens_at}
              onChange={(e) => handleChange('opens_at', e.target.value)}
              className="w-full border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
            />
            {errors.opens_at && <p className="mt-1 text-xs text-error-text" role="alert">{errors.opens_at}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              Closes at <span className="text-fg-subtle font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.closes_at}
              onChange={(e) => handleChange('closes_at', e.target.value)}
              className="w-full border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
            />
            {errors.closes_at && <p className="mt-1 text-xs text-error-text" role="alert">{errors.closes_at}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <a
            href="/admin/surveys"
            className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Survey'}
          </button>
        </div>
      </form>
    </div>
  )
}
