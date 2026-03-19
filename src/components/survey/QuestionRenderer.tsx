'use client'

import type { SurveyQuestion, QuestionOption } from '@/lib/types/survey'

interface QuestionRendererProps {
  question: SurveyQuestion
  options: QuestionOption[]
  value: unknown
  onChange: (value: unknown) => void
}

type QuestionLike = SurveyQuestion & {
  // Legacy DB column names still present in seeded/local data
  type?: SurveyQuestion['question_type']
  required?: boolean
}

const LIKERT_5_LABELS: Record<number, string> = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree',
}

const LIKERT_UNSELECTED =
  'border border-border bg-surface text-fg-muted rounded-md py-2 text-sm hover:border-indigo-300 hover:bg-brand-muted transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none'
const LIKERT_SELECTED =
  'border-2 border-brand bg-brand-muted text-brand font-bold rounded-md py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:outline-none'

export default function QuestionRenderer({
  question,
  options,
  value,
  onChange,
}: QuestionRendererProps) {
  const { questionType, isRequired } = getQuestionRenderMeta(question)
  const { text, id } = question
  const denseSingleSelect = questionType === 'single_select' && options.length >= 8

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-fg mb-3">
        {text}
        {isRequired && <span className="text-error ml-1" aria-label="required">*</span>}
      </p>

      {questionType === 'likert_5' && (
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className={`flex flex-col items-center gap-1 cursor-pointer px-3 ${
                value === n ? LIKERT_SELECTED : LIKERT_UNSELECTED
              }`}
            >
              <input
                type="radio"
                name={id}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              <span className="text-base font-semibold">{n}</span>
              <span className="text-xs text-fg-subtle text-center leading-tight max-w-[60px]">
                {LIKERT_5_LABELS[n]}
              </span>
            </label>
          ))}
        </div>
      )}

      {questionType === 'likert_10' && (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <label
              key={n}
              className={`flex items-center justify-center w-10 h-10 cursor-pointer ${
                value === n ? LIKERT_SELECTED : LIKERT_UNSELECTED
              }`}
            >
              <input
                type="radio"
                name={id}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              {n}
            </label>
          ))}
          <div className="w-full flex justify-between mt-1">
            <span className="text-xs text-fg-subtle">Not at all</span>
            <span className="text-xs text-fg-subtle">Extremely</span>
          </div>
        </div>
      )}

      {questionType === 'single_select' && (
        <div className={denseSingleSelect ? 'grid grid-cols-1 md:grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
          {options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 cursor-pointer ${
                value === opt.id ? LIKERT_SELECTED : LIKERT_UNSELECTED
              } ${denseSingleSelect ? 'px-2.5' : 'px-3'}`}
            >
              <input
                type="radio"
                name={id}
                value={opt.id}
                checked={value === opt.id}
                onChange={() => onChange(opt.id)}
                className="sr-only"
              />
              <span className="text-sm">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {questionType === 'multi_select' && (
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt.id)
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 px-3 cursor-pointer ${
                  selected ? LIKERT_SELECTED : LIKERT_UNSELECTED
                }`}
              >
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={selected}
                  onChange={(e) => {
                    const current: string[] = Array.isArray(value) ? (value as string[]) : []
                    if (e.target.checked) {
                      onChange([...current, opt.id])
                    } else {
                      onChange(current.filter((v) => v !== opt.id))
                    }
                  }}
                  className="sr-only"
                />
                <span className="text-sm">{opt.text}</span>
              </label>
            )
          })}
        </div>
      )}

      {questionType === 'short_text' && (
        <input
          type="text"
          maxLength={500}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full"
          placeholder="Your answer..."
        />
      )}

      {questionType === 'long_text' && (
        <textarea
          rows={4}
          maxLength={2000}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus w-full resize-y"
          placeholder="Your answer..."
        />
      )}
    </div>
  )
}

export function getQuestionRenderMeta(question: QuestionLike): {
  questionType: SurveyQuestion['question_type'] | undefined
  isRequired: boolean
} {
  const questionType = question.question_type ?? question.type
  const isRequired = Boolean(question.is_required ?? question.required ?? false)
  return { questionType, isRequired }
}
