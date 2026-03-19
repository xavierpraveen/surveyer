import { getRoleOptions } from '@/lib/actions/survey'
import NewSurveyForm from '@/components/admin/NewSurveyForm'

export default async function NewSurveyPage() {
  const rolesResult = await getRoleOptions()
  const roleOptions = rolesResult.success ? rolesResult.data : []

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-snug text-fg">Create Survey</h1>
        <p className="text-sm text-fg-muted mt-1">Fill in the details below to create a new survey.</p>
      </div>

      <NewSurveyForm roleOptions={roleOptions} />
    </div>
  )
}
