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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create Survey</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to create a new survey.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {errors.general}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Q1 2026 Employee Survey"
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Brief overview of what this survey covers..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Anonymous responses</span>
              <button
                type="button"
                onClick={() => handleChange('is_anonymous', !form.is_anonymous)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.is_anonymous ? 'bg-gray-800' : 'bg-gray-300'
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
              <span className="text-sm font-medium text-gray-700">Public link access</span>
              <button
                type="button"
                onClick={() => handleChange('public_link_enabled', !form.public_link_enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.public_link_enabled ? 'bg-gray-800' : 'bg-gray-300'
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opens at <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.opens_at}
                onChange={(e) => handleChange('opens_at', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
              {errors.opens_at && <p className="mt-1 text-xs text-red-600">{errors.opens_at}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closes at <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.closes_at}
                onChange={(e) => handleChange('closes_at', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
              {errors.closes_at && <p className="mt-1 text-xs text-red-600">{errors.closes_at}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <a
              href="/admin/surveys"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
