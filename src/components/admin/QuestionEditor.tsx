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
    <div className="border border-gray-200 rounded-md overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-col gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onReorder(question.id, 'up') }}
            disabled={index === 0}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
          >
            ↑
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReorder(question.id, 'down') }}
            disabled={isLast}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
          >
            ↓
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {question.text || <span className="text-gray-400 italic">Untitled question</span>}
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {QUESTION_TYPE_LABELS[question.question_type]}
        </span>
        {question.is_required && (
          <span className="flex-shrink-0 text-xs text-red-500" title="Required">*</span>
        )}
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded form */}
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50 space-y-4">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
          )}

          {/* Text */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question text *</label>
            <textarea
              value={editState.text}
              onChange={(e) => updateField('text', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800 resize-none"
            />
          </div>

          {/* Type + Required */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={editState.question_type}
                onChange={(e) => updateField('question_type', e.target.value as QuestionType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800"
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
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    editState.is_required ? 'bg-gray-800' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    editState.is_required ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-xs font-medium text-gray-600">Required</span>
              </label>
            </div>
          </div>

          {/* Options — for single_select / multi_select */}
          {(editState.question_type === 'single_select' || editState.question_type === 'multi_select') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
              <div className="space-y-1">
                {editState.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                    <button
                      onClick={() => removeOption(i)}
                      className="text-red-400 hover:text-red-600 text-xs px-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          {/* Dimensions */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Dimensions (max 3)
              {editState.dimension_ids.length >= 3 && (
                <span className="ml-1 text-orange-500">— maximum reached</span>
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
                  <span className="text-xs text-gray-700">{dim.name}</span>
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
              <span className="text-xs font-medium text-gray-600">Show conditionally?</span>
            </label>

            {editState.conditional_enabled && editState.conditional_rule && (
              <div className="flex flex-wrap items-center gap-2 ml-4">
                <span className="text-xs text-gray-500">Show if</span>
                <select
                  value={editState.conditional_rule.question_id}
                  onChange={(e) =>
                    updateField('conditional_rule', { ...editState.conditional_rule!, question_id: e.target.value })
                  }
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-800"
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
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-800"
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
                  className="px-2 py-1 text-xs border border-gray-300 rounded w-20 focus:outline-none focus:ring-1 focus:ring-gray-800"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setEditState(fromQuestion(question, editState.dimension_ids)) }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50"
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
        <p className="text-sm text-gray-400 py-4">No questions yet. Click "Add Question" to get started.</p>
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
        <form onSubmit={handleAddQuestion} className="border border-blue-200 rounded-md bg-blue-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">New Question</h3>

          {addError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{addError}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question text *</label>
            <textarea
              value={newState.text}
              onChange={(e) => updateNewField('text', e.target.value)}
              rows={2}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                value={newState.question_type}
                onChange={(e) => updateNewField('question_type', e.target.value as QuestionType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800"
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
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    newState.is_required ? 'bg-gray-800' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    newState.is_required ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="text-xs font-medium text-gray-600">Required</span>
              </label>
            </div>
          </div>

          {(newState.question_type === 'single_select' || newState.question_type === 'multi_select') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
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
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => updateNewField('options', newState.options.filter((_, j) => j !== i).map((o, j) => ({ ...o, display_order: j })))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateNewField('options', [...newState.options, { text: '', display_order: newState.options.length }])}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  + Add option
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
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
                  <span className="text-xs text-gray-700">{dim.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewState(makeDefault()); setAddError(null) }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || !newState.text.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </form>
      )}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-dashed border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          + Add Question
        </button>
      )}
    </div>
  )
}
