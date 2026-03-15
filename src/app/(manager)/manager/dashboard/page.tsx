import { getManagerDashboardData } from '@/lib/actions/analytics'
import DimensionBarChart from '@/components/analytics/DimensionBarChart'
import ThresholdPlaceholder from '@/components/analytics/ThresholdPlaceholder'

export default async function ManagerDashboardPage() {
  const result = await getManagerDashboardData()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Unable to Load Dashboard</h1>
          <p className="text-sm text-gray-600">{result.error}</p>
        </div>
      </div>
    )
  }

  const data = result.data
  const { participationCount, totalTeamMembers, teamName, surveyTitle, belowThreshold, dimensionScores } = data

  const participationRate =
    totalTeamMembers > 0 ? Math.round((participationCount / totalTeamMembers) * 100) : 0

  const participationColorClass =
    participationRate >= 70
      ? 'text-green-600'
      : participationRate >= 40
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Team Dashboard</h1>

        {/* Section 1: Team Participation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-medium text-gray-900">Team Participation</h2>
            {surveyTitle && (
              <span className="text-sm text-gray-500">Survey: {surveyTitle}</span>
            )}
          </div>

          {teamName && (
            <p className="text-sm text-gray-500 mb-4">{teamName}</p>
          )}

          {totalTeamMembers === 0 ? (
            <p className="text-gray-500">No team members found.</p>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="text-gray-700 text-base">
                {participationCount} of {totalTeamMembers} team members responded
              </span>
              <span className={`text-2xl font-bold ${participationColorClass}`}>
                {participationRate}%
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Team Dimension Scores */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dimension Scores</h2>

          {belowThreshold || dimensionScores === null ? (
            <div>
              <ThresholdPlaceholder tooltip="Your team has fewer than 5 respondents — dimension scores are hidden to protect anonymity." />
              <p className="text-sm text-gray-500 mt-2">
                Dimension scores will appear when at least 5 team members have submitted responses.
              </p>
            </div>
          ) : (
            <DimensionBarChart scores={dimensionScores} />
          )}
        </div>
      </div>
    </div>
  )
}
