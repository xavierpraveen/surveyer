'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSurvey } from '@/lib/actions/survey'

interface RoleOption {
  id: string
  name: string
  slug: string
}

interface SurveyAudienceEditorProps {
  surveyId: string
  roleOptions: RoleOption[]
  initialTargetRoleIds: string[]
}

export default function SurveyAudienceEditor({
  surveyId,
  roleOptions,
  initialTargetRoleIds,
}: SurveyAudienceEditorProps) {
  const router = useRouter()
  const [targetRoleIds, setTargetRoleIds] = useState<string[]>(initialTargetRoleIds)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function toggleRole(roleId: string) {
    setSaved(false)
    setError(null)
    setTargetRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const result = await updateSurvey({ id: surveyId, target_role_ids: targetRoleIds })
    setSaving(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to save audience')
      return
    }

    setSaved(true)
    router.refresh()
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-4 mb-4">
      <h2 className="text-sm font-semibold text-fg">Survey Audience Roles</h2>
      <p className="text-xs text-fg-subtle mt-1 mb-3">
        Leave all unchecked to make this survey available to all roles.
      </p>

      {roleOptions.length === 0 ? (
        <p className="text-sm text-fg-subtle">No roles found. Audience defaults to all roles.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-3">
          {roleOptions.map((role) => (
            <label key={role.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={targetRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
                className="h-4 w-4"
              />
              <span className="text-sm text-fg-muted">{role.name}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Audience'}
        </button>
        {saved && <span className="text-xs text-success-text">Saved</span>}
        {error && <span className="text-xs text-error-text">{error}</span>}
      </div>
    </div>
  )
}
