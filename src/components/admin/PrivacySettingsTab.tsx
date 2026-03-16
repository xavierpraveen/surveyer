'use client'

import { useState } from 'react'
import type { AppSettings } from '@/lib/types/phase4'
import { updateAppSettings } from '@/lib/actions/settings'

interface PrivacySettingsTabProps {
  initialSettings: AppSettings
}

export default function PrivacySettingsTab({ initialSettings }: PrivacySettingsTabProps) {
  const [numericThreshold, setNumericThreshold] = useState(
    initialSettings.privacyThresholdNumeric
  )
  const [textThreshold, setTextThreshold] = useState(initialSettings.privacyThresholdText)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSavedMessage(null)

    const [numResult, textResult] = await Promise.all([
      updateAppSettings('privacy_threshold_numeric', numericThreshold),
      updateAppSettings('privacy_threshold_text', textThreshold),
    ])

    setIsSaving(false)

    if (!numResult.success) {
      setSavedMessage(`Error: ${numResult.error ?? 'Failed to save numeric threshold'}`)
      return
    }
    if (!textResult.success) {
      setSavedMessage(`Error: ${textResult.error ?? 'Failed to save text threshold'}`)
      return
    }

    setSavedMessage('Settings saved')
    setTimeout(() => setSavedMessage(null), 3000)
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-bold tracking-tight text-fg mb-1">Privacy Thresholds</h2>
      <p className="text-sm text-fg-muted mb-6">
        Responses below these thresholds will be hidden to protect respondent anonymity.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="numeric-threshold"
            className="block text-sm font-semibold text-fg mb-1"
          >
            Minimum respondents for numeric scores (default: 5)
          </label>
          <input
            id="numeric-threshold"
            type="number"
            min="1"
            max="50"
            value={numericThreshold}
            onChange={(e) => setNumericThreshold(Number(e.target.value))}
            className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-32"
          />
        </div>

        <div>
          <label
            htmlFor="text-threshold"
            className="block text-sm font-semibold text-fg mb-1"
          >
            Minimum respondents for open-text responses (default: 10)
          </label>
          <input
            id="text-threshold"
            type="number"
            min="1"
            max="50"
            value={textThreshold}
            onChange={(e) => setTextThreshold(Number(e.target.value))}
            className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-32"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          {savedMessage && (
            <span
              className={
                savedMessage.startsWith('Error')
                  ? 'text-sm text-error-text'
                  : 'text-sm text-success-text'
              }
            >
              {savedMessage}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
