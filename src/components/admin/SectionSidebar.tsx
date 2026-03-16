'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SurveySection } from '@/lib/types/survey'
import { createSection, reorderSections } from '@/lib/actions/survey'

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'qa', label: 'QA' },
  { value: 'uiux', label: 'UI/UX' },
  { value: 'project-managers', label: 'Project Managers' },
  { value: 'sales-business', label: 'Sales & Business' },
  { value: 'architects', label: 'Architects' },
  { value: 'hr-operations', label: 'HR & Operations' },
  { value: 'marketing', label: 'Marketing' },
]

interface SectionWithMeta extends SurveySection {
  questionCount: number
  hasDimensionsCovered: boolean
}

interface Props {
  sections: SectionWithMeta[]
  activeSectionId: string | null
  surveyId: string
}

export default function SectionSidebar({ sections, activeSectionId, surveyId }: Props) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newRoles, setNewRoles] = useState<string[]>(['all'])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  function handleSectionClick(sectionId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('section', sectionId)
    router.push(url.pathname + url.search)
  }

  function toggleRole(value: string) {
    if (value === 'all') {
      setNewRoles(['all'])
      return
    }
    setNewRoles((prev) => {
      const withoutAll = prev.filter((r) => r !== 'all')
      if (withoutAll.includes(value)) {
        const updated = withoutAll.filter((r) => r !== value)
        return updated.length === 0 ? ['all'] : updated
      }
      return [...withoutAll, value]
    })
  }

  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAdding(true)
    setAddError(null)
    const result = await createSection({
      survey_id: surveyId,
      title: newTitle.trim(),
      target_roles: newRoles,
    })
    setAdding(false)
    if (!result.success) {
      setAddError(result.error ?? 'Failed to add section')
    } else {
      setNewTitle('')
      setNewRoles(['all'])
      setShowAddForm(false)
      router.refresh()
    }
  }

  async function handleReorder(sectionId: string, direction: 'up' | 'down') {
    const idx = sections.findIndex((s) => s.id === sectionId)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sections.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updated = [...sections]
    const temp = updated[idx]
    updated[idx] = updated[swapIdx]
    updated[swapIdx] = temp

    const items = updated.map((s, i) => ({ id: s.id, display_order: i }))
    setReordering(true)
    await reorderSections({ items })
    setReordering(false)
    router.refresh()
  }

  return (
    <div className="w-64 flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-fg">Sections</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <p className="p-4 text-sm text-fg-subtle">No sections yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sections.map((section, idx) => (
              <li
                key={section.id}
                className={`group flex items-center gap-1 px-3 py-3 cursor-pointer transition-colors ${
                  activeSectionId === section.id
                    ? 'bg-brand-muted'
                    : 'hover:bg-surface-2'
                }`}
              >
                <button
                  className="flex-1 text-left min-w-0 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                  onClick={() => handleSectionClick(section.id)}
                >
                  <p className={`text-sm font-medium truncate ${
                    activeSectionId === section.id
                      ? 'text-brand font-semibold'
                      : 'text-fg-muted'
                  }`}>
                    {section.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-fg-subtle">
                      {section.questionCount} question{section.questionCount !== 1 ? 's' : ''}
                    </span>
                    {section.hasDimensionsCovered && (
                      <span className="text-xs text-success-text" title="All required questions have dimension mappings">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReorder(section.id, 'up') }}
                    disabled={idx === 0 || reordering}
                    className="p-0.5 text-fg-subtle hover:text-fg-muted disabled:opacity-20 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReorder(section.id, 'down') }}
                    disabled={idx === sections.length - 1 || reordering}
                    className="p-0.5 text-fg-subtle hover:text-fg-muted disabled:opacity-20 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add section */}
      <div className="p-3 border-t border-border">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            + Add Section
          </button>
        ) : (
          <form onSubmit={handleAddSection} className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Section title"
              autoFocus
              className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
            />

            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">Target roles:</p>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="h-3 w-3"
                    />
                    <span className="text-sm text-fg-muted">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {addError && <p className="text-xs text-error-text" role="alert">{addError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                className="flex-1 bg-brand hover:bg-brand-hover text-white font-semibold text-sm py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewTitle(''); setNewRoles(['all']); setAddError(null) }}
                className="flex-1 bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
