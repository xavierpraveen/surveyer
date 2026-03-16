'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SurveyQuestion, QuestionType, Dimension, ConditionalRule, QuestionOption } from '@/lib/types/survey'
import { createQuestion, updateQuestion, deleteQuestion, reorderQuestions, mapQuestionDimensions } from '@/lib/actions/survey'

interface Props {
  questions: SurveyQuestion[]
  sectionId: string
  dimensions: Dimension[]
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  likert_5: 'Likert 1–5',
  likert_10: 'Likert 1–10',
  single_select: 'Single Select',
  multi_select: 'Multi Select',
  short_text: 'Short Text',
  long_text: 'Long Text',
}

const OPERATOR_LABELS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
]

interface EditState {
  text: string
  question_type: QuestionType
  is_required: boolean
  dimension_ids: string[]
  conditional_enabled: boolean
  conditional_rule: ConditionalRule | null
  options: { text: string; display_order: number }[]
}

function makeDefault(): EditState {
  return {
    text: '',
    question_type: 'likert_5',
    is_required: true,
    dimension_ids: [],
    conditional_enabled: false,
    conditional_rule: null,
    options: [],
  }
}

function fromQuestion(q: SurveyQuestion, dimensions: string[]): EditState {
  return {
    text: q.text,
    question_type: q.question_type,
    is_required: q.is_required,
    dimension_ids: dimensions,
    conditional_enabled: Boolean(q.conditional_rule),
    conditional_rule: q.conditional_rule,
    options: q.options?.map((o) => ({ text: o.text, display_order: o.display_order })) ?? [],
  }
}

interface QuestionRowProps {
  question: SurveyQuestion
  isLast: boolean
  index: number
  dimensions: Dimension[]
  allQuestions: SurveyQuestion[]
  onReorder: (id: string, dir: 'up' | 'down') => Promise<void>
  onDeleted: () => void
}

function QuestionRow({ question, isLast, index, dimensions, allQuestions, onReorder, onDeleted }: QuestionRowProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load dimension mappings lazily — passed from parent via question.options
  const [editState, setEditState] = useState<EditState>(() => fromQuestion(question, []))

  function updateField<K extends keyof EditState>(field: K, value: EditState[K]) {
    setEditState((prev) => ({ ...prev, [field]: value }))
  }

  function toggleDimension(dimId: string) {
    setEditState((prev) => {
      const current = prev.dimension_ids
      if (current.includes(dimId)) {
        return { ...prev, dimension_ids: current.filter((d) => d !== dimId) }
      }
      if (current.length >= 3) return prev // max 3
      return { ...prev, dimension_ids: [...current, dimId] }
    })
  }

  function addOption() {
    setEditState((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', display_order: prev.options.length }],
    }))
  }

  function updateOption(idx: number, text: string) {
    setEditState((prev) => {
      const opts = [...prev.options]
      opts[idx] = { ...opts[idx], text }
      return { ...prev, options: opts }
    })
  }

  function removeOption(idx: number) {
    setEditState((prev) => {
      const opts = prev.options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, display_order: i }))
      return { ...prev, options: opts }
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const input: Record<string, unknown> = {
      id: question.id,
      text: editState.text,
      question_type: editState.question_type,
      is_required: editState.is_required,
      conditional_rule: editState.conditional_enabled && editState.conditional_rule ? editState.conditional_rule : null,
    }

    if (editState.question_type === 'single_select' || editState.question_type === 'multi_select') {
      input.options = editState.options.filter((o) => o.text.trim())
    }

    const result = await updateQuestion(input)
    if (!result.success) {
      setError(result.error ?? 'Save failed')
      setSaving(false)
      return
    }

    // Update dimension mappings
    const dimResult = await mapQuestionDimensions({ question_id: question.id, dimension_ids: editState.dimension_ids })
    setSaving(false)
    if (!dimResult.success) {
      setError(dimResult.error ?? 'Failed to save dimensions')
      return
    }
    router.refresh()
    setOpen(false)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete this question? This cannot be undone.`)) return
    setDeleting(true)
    const result = await deleteQuestion(question.id)
    setDeleting(false)
    if (!result.success) {
      setError(result.error ?? 'Delete failed')
    } else {
      onDeleted()
      router.refresh()
    }
  }

  return (
    <div className="border border-border rounded-md overflow-hidden bg-surface">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-2 cursor-pointer transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-col gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onReorder(question.id, 'up') }}
            disabled={index === 0}
            className="text-fg-subtle hover:text-fg-muted disabled:opacity-20 text-xs leading-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            ↑
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReorder(question.id, 'down') }}
            disabled={isLast}
            className="text-fg-subtle hover:text-fg-muted disabled:opacity-20 text-xs leading-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
          >
            ↓
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg truncate">
            {question.text || <span className="text-fg-subtle italic">Untitled question</span>}
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-semibold text-fg-muted bg-surface-2 px-2 py-0.5 rounded-full">
          {QUESTION_TYPE_LABELS[question.question_type]}
        </span>
        {question.is_required && (
          <span className="flex-shrink-0 text-xs text-error-text" title="Required">*</span>
        )}
        <span className="text-fg-subtle text-sm">{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded form */}
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-border bg-surface-2 space-y-4">
          {error && (
            <div className="p-2 bg-error-muted border border-error rounded-md text-xs text-error-text" role="alert">{error}</div>
          )}

          {/* Text */}
          <div>
            <label className="block text-sm font-semibold text-fg mb-1">Question text *</label>
            <textarea
              value={editState.text}
              onChange={(e) => updateField('text', e.target.value)}
              rows={2}
              className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full resize-none"
            />
          </div>

          {/* Type + Required */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">Type</label>
              <select
                value={editState.question_type}
                onChange={(e) => updateField('question_type', e.target.value as QuestionType)}
                className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => updateField('is_required', !editState.is_required)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none ${
                    editState.is_required ? 'bg-brand' : 'bg-surface-2'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    editState.is_required ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-sm font-semibold text-fg">Required</span>
              </label>
            </div>
          </div>

          {/* Options — for single_select / multi_select */}
          {(editState.question_type === 'single_select' || editState.question_type === 'multi_select') && (
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">Options</label>
              <div className="space-y-1">
                {editState.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus flex-1"
                    />
                    <button
                      onClick={() => removeOption(i)}
                      className="bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-semibold text-fg mb-1">
              Dimensions (max 3)
              {editState.dimension_ids.length >= 3 && (
                <span className="ml-1 text-warning-text">— maximum reached</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {dimensions.map((dim) => (
                <label key={dim.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editState.dimension_ids.includes(dim.id)}
                    onChange={() => toggleDimension(dim.id)}
                    disabled={!editState.dimension_ids.includes(dim.id) && editState.dimension_ids.length >= 3}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-sm text-fg-muted">{dim.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional rule */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={editState.conditional_enabled}
                onChange={(e) => {
                  updateField('conditional_enabled', e.target.checked)
                  if (!e.target.checked) updateField('conditional_rule', null)
                  else updateField('conditional_rule', { question_id: '', operator: 'eq', value: '' })
                }}
                className="h-3.5 w-3.5"
              />
              <span className="text-sm font-semibold text-fg">Show conditionally?</span>
            </label>

            {editState.conditional_enabled && editState.conditional_rule && (
              <div className="flex flex-wrap items-center gap-2 ml-4">
                <span className="text-sm text-fg-muted">Show if</span>
                <select
                  value={editState.conditional_rule.question_id}
                  onChange={(e) =>
                    updateField('conditional_rule', { ...editState.conditional_rule!, question_id: e.target.value })
                  }
                  className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
                >
                  <option value="">-- Select question --</option>
                  {allQuestions
                    .filter((q) => q.id !== question.id)
                    .map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.text.length > 40 ? q.text.slice(0, 40) + '…' : q.text}
                      </option>
                    ))}
                </select>
                <select
                  value={editState.conditional_rule.operator}
                  onChange={(e) =>
                    updateField('conditional_rule', {
                      ...editState.conditional_rule!,
                      operator: e.target.value as ConditionalRule['operator'],
                    })
                  }
                  className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
                >
                  {OPERATOR_LABELS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editState.conditional_rule.value}
                  onChange={(e) =>
                    updateField('conditional_rule', { ...editState.conditional_rule!, value: e.target.value })
                  }
                  placeholder="value"
                  className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-20"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-error hover:bg-error-text text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setEditState(fromQuestion(question, editState.dimension_ids)) }}
                className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuestionEditor({ questions, sectionId, dimensions }: Props) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newState, setNewState] = useState<EditState>(makeDefault())
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  async function handleReorder(questionId: string, direction: 'up' | 'down') {
    const idx = questions.findIndex((q) => q.id === questionId)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === questions.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const updated = [...questions]
    const temp = updated[idx]
    updated[idx] = updated[swapIdx]
    updated[swapIdx] = temp

    const items = updated.map((q, i) => ({ id: q.id, display_order: i }))
    setReordering(true)
    await reorderQuestions({ items })
    setReordering(false)
    router.refresh()
  }

  function updateNewField<K extends keyof EditState>(field: K, value: EditState[K]) {
    setNewState((prev) => ({ ...prev, [field]: value }))
  }

  function toggleNewDimension(dimId: string) {
    setNewState((prev) => {
      const current = prev.dimension_ids
      if (current.includes(dimId)) return { ...prev, dimension_ids: current.filter((d) => d !== dimId) }
      if (current.length >= 3) return prev
      return { ...prev, dimension_ids: [...current, dimId] }
    })
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!newState.text.trim()) return
    setAdding(true)
    setAddError(null)

    const input: Record<string, unknown> = {
      section_id: sectionId,
      text: newState.text.trim(),
      question_type: newState.question_type,
      is_required: newState.is_required,
      conditional_rule: newState.conditional_enabled && newState.conditional_rule ? newState.conditional_rule : null,
    }
    if (newState.question_type === 'single_select' || newState.question_type === 'multi_select') {
      input.options = newState.options.filter((o) => o.text.trim())
    }

    const result = await createQuestion(input)
    if (!result.success) {
      setAddError(result.error ?? 'Failed to add question')
      setAdding(false)
      return
    }

    // Map dimensions if any selected
    if (newState.dimension_ids.length > 0 && result.data) {
      await mapQuestionDimensions({ question_id: result.data.id, dimension_ids: newState.dimension_ids })
    }

    setAdding(false)
    setNewState(makeDefault())
    setShowAddForm(false)
    router.refresh()
  }

  const _ = reordering // silence unused warning

  return (
    <div className="space-y-2">
      {questions.length === 0 && !showAddForm && (
        <p className="text-sm text-fg-subtle py-4">No questions yet. Click &quot;Add Question&quot; to get started.</p>
      )}

      {questions.map((question, idx) => (
        <QuestionRow
          key={question.id}
          question={question}
          index={idx}
          isLast={idx === questions.length - 1}
          dimensions={dimensions}
          allQuestions={questions}
          onReorder={handleReorder}
          onDeleted={() => {}}
        />
      ))}

      {/* New question form */}
      {showAddForm && (
        <form onSubmit={handleAddQuestion} className="border border-border rounded-md bg-surface-2 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-fg">New Question</h3>

          {addError && (
            <div className="p-2 bg-error-muted border border-error rounded-md text-xs text-error-text" role="alert">{addError}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-fg mb-1">Question text *</label>
            <textarea
              value={newState.text}
              onChange={(e) => updateNewField('text', e.target.value)}
              rows={2}
              autoFocus
              className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">Type</label>
              <select
                value={newState.question_type}
                onChange={(e) => updateNewField('question_type', e.target.value as QuestionType)}
                className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => updateNewField('is_required', !newState.is_required)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none ${
                    newState.is_required ? 'bg-brand' : 'bg-surface-2'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    newState.is_required ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-sm font-semibold text-fg">Required</span>
              </label>
            </div>
          </div>

          {(newState.question_type === 'single_select' || newState.question_type === 'multi_select') && (
            <div>
              <label className="block text-sm font-semibold text-fg mb-1">Options</label>
              <div className="space-y-1">
                {newState.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const opts = [...newState.options]
                        opts[i] = { ...opts[i], text: e.target.value }
                        updateNewField('options', opts)
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => updateNewField('options', newState.options.filter((_, j) => j !== i).map((o, j) => ({ ...o, display_order: j })))}
                      className="bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateNewField('options', [...newState.options, { text: '', display_order: newState.options.length }])}
                  className="bg-transparent hover:bg-brand-muted text-brand font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-fg mb-1">
              Dimensions (max 3)
            </label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {dimensions.map((dim) => (
                <label key={dim.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newState.dimension_ids.includes(dim.id)}
                    onChange={() => toggleNewDimension(dim.id)}
                    disabled={!newState.dimension_ids.includes(dim.id) && newState.dimension_ids.length >= 3}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-sm text-fg-muted">{dim.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewState(makeDefault()); setAddError(null) }}
              className="bg-surface-2 hover:bg-border border border-border text-fg-muted font-medium text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !newState.text.trim()}
              className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-3.5 py-2 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
            >
              {adding ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </form>
      )}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2.5 text-sm font-medium text-fg-muted bg-surface-2 border border-dashed border-border rounded-md hover:bg-border transition-colors focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none"
        >
          + Add Question
        </button>
      )}
    </div>
  )
}
