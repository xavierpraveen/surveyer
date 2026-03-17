'use client'

import type { ConditionalRule } from '@/lib/types/survey'

interface ConditionalQuestionProps {
  rule: ConditionalRule | null
  answers: Record<string, unknown>
  children: React.ReactNode
}

function isValidRule(rule: unknown): rule is ConditionalRule {
  if (!rule || typeof rule !== 'object') return false
  const candidate = rule as Partial<ConditionalRule>
  const validOperator = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte'].includes(
    String(candidate.operator ?? '')
  )
  return (
    typeof candidate.question_id === 'string' &&
    candidate.question_id.length > 0 &&
    validOperator &&
    typeof candidate.value === 'string'
  )
}

function evaluateRule(rule: ConditionalRule, answers: Record<string, unknown>): boolean {
  const answerValue = answers[rule.question_id]

  // Coerce to comparable values
  const answerNum = typeof answerValue === 'number' ? answerValue : parseFloat(String(answerValue))
  const ruleNum = parseFloat(rule.value)
  const answerStr = String(answerValue ?? '').toLowerCase().trim()
  const ruleStr = rule.value.toLowerCase().trim()

  switch (rule.operator) {
    case 'eq':
      return answerStr === ruleStr || (!isNaN(answerNum) && !isNaN(ruleNum) && answerNum === ruleNum)
    case 'neq':
      return answerStr !== ruleStr && (isNaN(answerNum) || isNaN(ruleNum) || answerNum !== ruleNum)
    case 'gt':
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum > ruleNum
    case 'lt':
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum < ruleNum
    case 'gte':
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum >= ruleNum
    case 'lte':
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum <= ruleNum
    default:
      return false
  }
}

export function isConditionalVisible(
  rule: ConditionalRule | null | undefined,
  answers: Record<string, unknown>
): boolean {
  // Invalid or missing rule means "always visible" to avoid runtime crashes
  // from malformed legacy payloads.
  if (!isValidRule(rule)) return true
  return evaluateRule(rule, answers)
}

export default function ConditionalQuestion({
  rule,
  answers,
  children,
}: ConditionalQuestionProps) {
  const isVisible = isConditionalVisible(rule ?? null, answers)

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      {children}
    </div>
  )
}
