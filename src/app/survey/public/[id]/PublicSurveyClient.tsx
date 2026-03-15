'use client'

import { useRouter } from 'next/navigation'
import { submitPublicResponse } from '@/lib/actions/public-response'
import SurveyWizard from '@/components/survey/SurveyWizard'
import type {
  Survey,
  SurveySection,
  SurveyQuestion,
  QuestionOption,
} from '@/lib/types/survey'

interface PublicSurveyClientProps {
  survey: Survey
  sections: SurveySection[]
  questionsMap: Record<string, SurveyQuestion[]>
  optionsMap: Record<string, QuestionOption[]>
  confirmationPath: string
}

export default function PublicSurveyClient({
  survey,
  sections,
  questionsMap,
  optionsMap,
  confirmationPath,
}: PublicSurveyClientProps) {
  const router = useRouter()

  async function handleSubmit(
    surveyId: string,
    answers: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    const result = await submitPublicResponse(surveyId, answers)
    if (result.success) {
      return { success: true }
    }
    // Treat 'already_submitted' as a redirect rather than inline error
    if (!result.success && result.error === 'already_submitted') {
      router.refresh()
      return { success: false, error: 'You have already submitted this survey.' }
    }
    return { success: false, error: result.error }
  }

  return (
    <SurveyWizard
      survey={survey}
      sections={sections}
      questionsMap={questionsMap}
      optionsMap={optionsMap}
      initialDraft={null}
      initialSectionIndex={0}
      autosaveEnabled={false}
      onSubmit={handleSubmit}
      confirmationPath={confirmationPath}
    />
  )
}
