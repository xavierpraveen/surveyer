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
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Privacy Thresholds</h2>
      <p className="text-sm text-gray-500 mb-6">
        Responses below these thresholds will be hidden to protect respondent anonymity.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="numeric-threshold"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="text-threshold"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            className="block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          {savedMessage && (
            <span
              className={
                savedMessage.startsWith('Error')
                  ? 'text-sm text-red-600'
                  : 'text-sm text-green-600'
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
