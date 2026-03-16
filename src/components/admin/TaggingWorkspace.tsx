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
        <div className="bg-surface rounded-lg border border-border p-4 sticky top-4 shadow-sm">
          <h3 className="text-sm font-semibold text-fg mb-3">Top Tags</h3>
          {topTags.length === 0 ? (
            <p className="text-xs text-fg-subtle">No tags yet. Tag some responses to see frequency.</p>
          ) : (
            <ul className="space-y-1">
              {topTags.map(([tag, count]) => (
                <li key={tag} className="text-sm text-fg-muted flex justify-between">
                  <span className="truncate mr-2">{tag}</span>
                  <span className="text-fg-subtle text-xs shrink-0">{count} responses</span>
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
            className="bg-surface rounded-lg border border-border p-4 shadow-sm"
          >
            {/* Question label */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-fg-subtle mb-2">
              {answer.questionText}
            </p>

            {/* Response text */}
            <blockquote className="text-fg-muted text-sm bg-surface-2 p-3 rounded-md border-l-4 border-border mb-3">
              {answer.textValue}
            </blockquote>

            {/* Existing tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {answer.tags.map((tag: QualitativeTag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 bg-brand-muted text-brand-text text-xs font-semibold rounded-full px-2 py-0.5"
                >
                  {tag.tag}
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(answer.responseAnswerId, tag.id)}
                    className="hover:text-brand leading-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
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
                className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus flex-1"
              />
              <button
                type="button"
                onClick={() => handleAddTag(answer.responseAnswerId, tagInputs[answer.responseAnswerId] ?? '')}
                className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
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
        <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-fg mb-3">Qualitative Themes</h3>

          {generateError && (
            <div className="bg-error-muted border border-error rounded-md p-3 mb-3" role="alert">
              <p className="text-sm text-error-text">{generateError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateThemes}
            disabled={isGenerating || !hasAnyTags}
            className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            {isGenerating ? 'Generating...' : 'Generate Themes'}
          </button>
          {!hasAnyTags && (
            <p className="text-xs text-fg-subtle mt-2">
              Add tags to responses first to generate themes.
            </p>
          )}

          {/* Theme list */}
          {themes.length > 0 && (
            <div className="mt-4 space-y-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="border border-border rounded-md bg-surface p-3 space-y-2"
                >
                  {/* Editable label */}
                  <input
                    type="text"
                    defaultValue={theme.theme}
                    onBlur={(e) => handleUpdateThemeLabel(theme.id, e.target.value)}
                    className="w-full text-sm font-semibold text-fg border-b border-border focus:outline-none focus:border-border-focus pb-1 bg-transparent"
                  />

                  {/* is_positive toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleIsPositive(theme.id, theme.isPositive)}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none ${
                      theme.isPositive
                        ? 'bg-success-muted text-success-text'
                        : 'bg-error-muted text-error-text'
                    }`}
                  >
                    {theme.isPositive ? 'Improvement suggestion' : 'Identified issue'}
                  </button>

                  {/* Tag cluster */}
                  {theme.tagCluster.length > 0 && (
                    <p className="text-xs text-fg-subtle">
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
