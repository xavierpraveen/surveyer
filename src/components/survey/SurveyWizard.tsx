'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saveDraft, submitResponse } from '@/lib/actions/response'
import SurveyProgressBar from './SurveyProgressBar'
import QuestionRenderer from './QuestionRenderer'
import ConditionalQuestion from './ConditionalQuestion'
import type {
  Survey,
  SurveySection,
  SurveyQuestion,
  QuestionOption,
  ResponseDraft,
} from '@/lib/types/survey'

interface SurveyWizardProps {
  survey: Survey
  sections: SurveySection[]
  questionsMap: Record<string, SurveyQuestion[]>
  optionsMap: Record<string, QuestionOption[]>
  initialDraft: ResponseDraft | null
  initialSectionIndex: number
  /** When false, disables autosave useEffect (for public/unauthenticated flows with no user_id). Default: true */
  autosaveEnabled?: boolean
  /** Custom submit handler — overrides the default submitResponse action (used for public flow). */
  onSubmit?: (surveyId: string, answers: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  /** Path to redirect to on successful submission. Default: /surveys/<id>/confirmation */
  confirmationPath?: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function SurveyWizard({
  survey,
  sections,
  questionsMap,
  optionsMap,
  initialDraft,
  initialSectionIndex,
  autosaveEnabled = true,
  onSubmit,
  confirmationPath,
}: SurveyWizardProps) {
  const router = useRouter()

  // State
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    initialDraft?.answers ?? {}
  )
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    Math.min(initialSectionIndex, sections.length - 1)
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [showResumeBanner, setShowResumeBanner] = useState(Boolean(initialDraft))
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs for debounce management
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track last autosaved answers to avoid redundant saves
  const lastSavedAnswersRef = useRef<string>(JSON.stringify(initialDraft?.answers ?? {}))

  const currentSection = sections[currentSectionIndex]
  const isLastSection = currentSectionIndex === sections.length - 1
  const currentQuestions = questionsMap[currentSection?.id] ?? []

  // Autosave via debounced useEffect
  const performSave = useCallback(
    async (currentAnswers: Record<string, unknown>, sectionIndex: number) => {
      const serialized = JSON.stringify(currentAnswers)
      if (serialized === lastSavedAnswersRef.current) return

      setSaveStatus('saving')
      const result = await saveDraft({
        survey_id: survey.id,
        answers: currentAnswers,
        last_section_index: sectionIndex,
      })

      if (result.success) {
        lastSavedAnswersRef.current = serialized
        setSaveStatus('saved')
        if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current)
        savedStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    },
    [survey.id]
  )

  useEffect(() => {
    if (!autosaveEnabled) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void performSave(answers, currentSectionIndex)
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [answers, currentSectionIndex, performSave, autosaveEnabled])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleAnswerChange(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleNext() {
    // Validate required questions in current section
    const unanswered = currentQuestions.filter((q) => {
      if (!q.is_required) return false
      const v = answers[q.id]
      if (v === undefined || v === null || v === '') return true
      if (Array.isArray(v) && v.length === 0) return true
      return false
    })

    if (unanswered.length > 0) {
      setSubmitError(`Please answer all required questions before continuing.`)
      return
    }

    setSubmitError(null)

    if (isLastSection) {
      // Submit
      setIsSubmitting(true)
      let result: { success: boolean; error?: string }
      if (onSubmit) {
        result = await onSubmit(survey.id, answers)
      } else {
        result = await submitResponse({
          survey_id: survey.id,
          answers,
        })
      }
      setIsSubmitting(false)

      if (result.success) {
        const destination = confirmationPath ?? `/surveys/${survey.id}/confirmation`
        router.push(destination)
      } else {
        setSubmitError(result.error ?? 'Submission failed. Please try again.')
      }
    } else {
      // Save immediately (not debounced) before advancing
      if (autosaveEnabled) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        void performSave(answers, currentSectionIndex)
      }
      setCurrentSectionIndex((prev) => prev + 1)
    }
  }

  function handleBack() {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
    }
  }

  function handleResumeContinue() {
    setCurrentSectionIndex(Math.min(initialSectionIndex, sections.length - 1))
    setShowResumeBanner(false)
  }

  if (!currentSection) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sections available.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Resume Banner */}
      {showResumeBanner && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-blue-800">
            Your progress has been saved.{' '}
            <button
              onClick={handleResumeContinue}
              className="font-medium underline hover:no-underline"
            >
              Continue &rarr;
            </button>
          </span>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="ml-4 text-blue-600 hover:text-blue-800 font-medium text-base leading-none"
            aria-label="Dismiss banner"
          >
            &times;
          </button>
        </div>
      )}

      {/* Progress bar */}
      <SurveyProgressBar
        currentSection={currentSectionIndex}
        totalSections={sections.length}
        sectionTitle={currentSection.title}
      />

      {/* Section content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{currentSection.title}</h2>
        {currentSection.description && (
          <p className="text-sm text-gray-500 mb-6">{currentSection.description}</p>
        )}

        <div className="space-y-2">
          {currentQuestions.map((question) => (
            <ConditionalQuestion
              key={question.id}
              rule={question.conditional_rule}
              answers={answers}
            >
              <QuestionRenderer
                question={question}
                options={optionsMap[question.id] ?? []}
                value={answers[question.id]}
                onChange={(v) => handleAnswerChange(question.id, v)}
              />
            </ConditionalQuestion>
          ))}
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleBack}
            disabled={currentSectionIndex === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : isLastSection ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>

      {/* Save status indicator */}
      <div
        className={`fixed bottom-4 right-4 text-xs transition-opacity duration-500 ${
          saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'
        } ${saveStatus === 'error' ? 'text-red-500' : 'text-gray-500'}`}
      >
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved \u2713'}
        {saveStatus === 'error' && 'Save failed \u2014 retrying'}
      </div>
    </div>
  )
}
