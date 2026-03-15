'use client'

import { useState, useMemo, useRef } from 'react'
import { upsertTag, deleteTag, generateThemes } from '@/lib/actions/tagging'
import type { TaggableAnswer, QualitativeTag } from '@/lib/types/phase4'
import type { QualitativeTheme } from '@/lib/types/analytics'

interface TaggingWorkspaceProps {
  surveyId: string
  initialAnswers: TaggableAnswer[]
}

export default function TaggingWorkspace({ surveyId, initialAnswers }: TaggingWorkspaceProps) {
  const [answers, setAnswers] = useState<TaggableAnswer[]>(initialAnswers)
  const [themes, setThemes] = useState<QualitativeTheme[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Per-answer input state
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Compute tag frequency from all answers
  const tagFrequency = useMemo(() => {
    const freq = new Map<string, number>()
    for (const answer of answers) {
      const seenTags = new Set<string>()
      for (const tag of answer.tags) {
        if (!seenTags.has(tag.tag)) {
          seenTags.add(tag.tag)
          freq.set(tag.tag, (freq.get(tag.tag) ?? 0) + 1)
        }
      }
    }
    return freq
  }, [answers])

  // Top 10 tags sorted by frequency
  const topTags = useMemo(() => {
    return Array.from(tagFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  }, [tagFrequency])

  const allTagNames = useMemo(() => Array.from(tagFrequency.keys()), [tagFrequency])

  const hasAnyTags = answers.some((a) => a.tags.length > 0)

  async function handleAddTag(responseAnswerId: string, tag: string) {
    const trimmed = tag.trim()
    if (!trimmed) return

    const result = await upsertTag(responseAnswerId, trimmed)
    if (result.success) {
      setAnswers((prev) =>
        prev.map((a) => {
          if (a.responseAnswerId !== responseAnswerId) return a
          return { ...a, tags: [...a.tags, result.data] }
        })
      )
      setTagInputs((prev) => ({ ...prev, [responseAnswerId]: '' }))
    }
  }

  async function handleDeleteTag(responseAnswerId: string, tagId: string) {
    const result = await deleteTag(tagId)
    if (result.success) {
      setAnswers((prev) =>
        prev.map((a) => {
          if (a.responseAnswerId !== responseAnswerId) return a
          return { ...a, tags: a.tags.filter((t) => t.id !== tagId) }
        })
      )
    }
  }

  async function handleGenerateThemes() {
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const result = await generateThemes(surveyId)
      if (result.success) {
        // Reload the page to get the generated themes from the server
        window.location.reload()
      } else {
        setGenerateError(result.error)
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleUpdateThemeLabel(themeId: string, newLabel: string) {
    const { updateTheme } = await import('@/lib/actions/tagging')
    await updateTheme(themeId, { theme: newLabel })
    setThemes((prev) =>
      prev.map((t) => (t.id === themeId ? { ...t, theme: newLabel } : t))
    )
  }

  async function handleToggleIsPositive(themeId: string, currentValue: boolean) {
    const { updateTheme } = await import('@/lib/actions/tagging')
    const newValue = !currentValue
    await updateTheme(themeId, { isPositive: newValue })
    setThemes((prev) =>
      prev.map((t) => (t.id === themeId ? { ...t, isPositive: newValue } : t))
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: tag frequency sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Tags</h3>
          {topTags.length === 0 ? (
            <p className="text-xs text-gray-400">No tags yet. Tag some responses to see frequency.</p>
          ) : (
            <ul className="space-y-1">
              {topTags.map(([tag, count]) => (
                <li key={tag} className="text-sm text-gray-600 flex justify-between">
                  <span className="truncate mr-2">{tag}</span>
                  <span className="text-gray-400 text-xs shrink-0">{count} responses</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right: answers list + generate themes */}
      <div className="lg:col-span-3 space-y-4">
        {/* Answers */}
        {answers.map((answer) => (
          <div
            key={answer.responseAnswerId}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            {/* Question label */}
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              {answer.questionText}
            </p>

            {/* Response text */}
            <blockquote className="text-gray-700 text-sm bg-gray-50 p-3 rounded border-l-4 border-gray-300 mb-3">
              {answer.textValue}
            </blockquote>

            {/* Existing tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {answer.tags.map((tag: QualitativeTag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm rounded-full px-2 py-0.5"
                >
                  {tag.tag}
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(answer.responseAnswerId, tag.id)}
                    className="hover:text-blue-900 leading-none"
                    aria-label={`Remove tag ${tag.tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {/* Tag input */}
            <div className="flex gap-2">
              <input
                ref={(el) => { inputRefs.current[answer.responseAnswerId] = el }}
                type="text"
                list="tag-suggestions"
                placeholder="Add tag..."
                value={tagInputs[answer.responseAnswerId] ?? ''}
                onChange={(e) =>
                  setTagInputs((prev) => ({ ...prev, [answer.responseAnswerId]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag(answer.responseAnswerId, tagInputs[answer.responseAnswerId] ?? '')
                  }
                }}
                className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddTag(answer.responseAnswerId, tagInputs[answer.responseAnswerId] ?? '')}
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded"
              >
                Add
              </button>
            </div>
          </div>
        ))}

        {/* Datalist for autocomplete */}
        <datalist id="tag-suggestions">
          {allTagNames.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>

        {/* Generate Themes section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Qualitative Themes</h3>

          {generateError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <p className="text-sm text-red-700">{generateError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateThemes}
            disabled={isGenerating || !hasAnyTags}
            className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Themes'}
          </button>
          {!hasAnyTags && (
            <p className="text-xs text-gray-400 mt-2">
              Add tags to responses first to generate themes.
            </p>
          )}

          {/* Theme list */}
          {themes.length > 0 && (
            <div className="mt-4 space-y-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="border border-gray-200 rounded p-3 space-y-2"
                >
                  {/* Editable label */}
                  <input
                    type="text"
                    defaultValue={theme.theme}
                    onBlur={(e) => handleUpdateThemeLabel(theme.id, e.target.value)}
                    className="w-full text-sm font-medium text-gray-900 border-b border-gray-200 focus:outline-none focus:border-blue-500 pb-1"
                  />

                  {/* is_positive toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleIsPositive(theme.id, theme.isPositive)}
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      theme.isPositive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {theme.isPositive ? 'Improvement suggestion' : 'Identified issue'}
                  </button>

                  {/* Tag cluster */}
                  {theme.tagCluster.length > 0 && (
                    <p className="text-xs text-gray-400">
                      Tags: {theme.tagCluster.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
