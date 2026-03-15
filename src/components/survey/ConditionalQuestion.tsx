'use client'

import type { ConditionalRule } from '@/lib/types/survey'

interface ConditionalQuestionProps {
  rule: ConditionalRule | null
  answers: Record<string, unknown>
  children: React.ReactNode
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

export default function ConditionalQuestion({
  rule,
  answers,
  children,
}: ConditionalQuestionProps) {
  const isVisible = rule === null || evaluateRule(rule, answers)

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
