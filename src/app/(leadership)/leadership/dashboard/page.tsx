import { getLeadershipDashboardData } from '@/lib/actions/analytics'
import KpiStrip from '@/components/analytics/KpiStrip'
import FilterBarWrapper from './FilterBarWrapper'

export default async function LeadershipDashboardPage() {
  const result = await getLeadershipDashboardData({
    surveyId: null,
    department: null,
    role: null,
    tenureBand: null,
  })

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-red-700 mb-2">
            Unable to load dashboard data. Please try again.
          </h1>
          <p className="text-sm text-gray-600 mt-2">{result.error}</p>
        </div>
      </div>
    )
  }

  const data = result.data

  if (data.availableSurveys.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Leadership Dashboard</h1>
          <p className="text-gray-500">
            No completed survey results yet. Results will appear here after a survey closes and
            metrics are computed.
          </p>
        </div>
      </div>
    )
  }

  // Extract filter options from initial data
  const departments = Array.from(
    new Set([
      ...data.heatmapRows.map((r) => r.department),
      ...data.participationBreakdown.map((r) => r.department),
    ])
  )
    .filter(Boolean)
    .sort()

  // Roles and tenure bands reserved for future enrichment (not yet in derived_metrics)
  const roles: string[] = []
  const tenureBands: string[] = []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-semibold text-gray-900">Leadership Dashboard</h1>
        {data.kpis.surveyTitle && (
          <p className="text-sm text-gray-500 mt-0.5">{data.kpis.surveyTitle}</p>
        )}
      </div>

      {/* KPI Strip */}
      <div className="px-6 pt-5 pb-2">
        <KpiStrip kpis={data.kpis} />
      </div>

      {/* Filter Bar + all 6 sections (client wrapper manages filter state) */}
      <FilterBarWrapper
        initialData={data}
        availableSurveys={data.availableSurveys}
        departments={departments}
        roles={roles}
        tenureBands={tenureBands}
      />
    </div>
  )
}
