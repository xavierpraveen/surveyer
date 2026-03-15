'use client'

import type { SurveyQuestion, QuestionOption } from '@/lib/types/survey'

interface QuestionRendererProps {
  question: SurveyQuestion
  options: QuestionOption[]
  value: unknown
  onChange: (value: unknown) => void
}

const LIKERT_5_LABELS: Record<number, string> = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree',
}

export default function QuestionRenderer({
  question,
  options,
  value,
  onChange,
}: QuestionRendererProps) {
  const { question_type, text, is_required, id } = question

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-900 mb-3">
        {text}
        {is_required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </p>

      {question_type === 'likert_5' && (
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className={`flex flex-col items-center gap-1 cursor-pointer px-3 py-2 rounded-md border transition-colors ${
                value === n
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:border-gray-400 text-gray-600'
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
              <span className="text-xs text-center leading-tight max-w-[60px]">
                {LIKERT_5_LABELS[n]}
              </span>
            </label>
          ))}
        </div>
      )}

      {question_type === 'likert_10' && (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <label
              key={n}
              className={`flex items-center justify-center w-10 h-10 rounded-md border cursor-pointer transition-colors ${
                value === n
                  ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                  : 'border-gray-200 hover:border-gray-400 text-gray-600'
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
        </div>
      )}

      {question_type === 'single_select' && (
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                value === opt.id
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700'
              }`}
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

      {question_type === 'multi_select' && (
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt.id)
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                  selected
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'border-gray-200 hover:border-gray-400 text-gray-700'
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

      {question_type === 'short_text' && (
        <input
          type="text"
          maxLength={500}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-900"
          placeholder="Your answer..."
        />
      )}

      {question_type === 'long_text' && (
        <textarea
          rows={4}
          maxLength={2000}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-900 resize-y"
          placeholder="Your answer..."
        />
      )}
    </div>
  )
}
