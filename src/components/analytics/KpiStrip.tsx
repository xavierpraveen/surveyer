import type { OrgKpis } from '@/lib/types/analytics'
import ThresholdPlaceholder from './ThresholdPlaceholder'

interface KpiStripProps {
  kpis: OrgKpis
}

function scoreColor(score: number): string {
  if (score >= 4.0) return 'text-green-600'
  if (score >= 3.0) return 'text-yellow-600'
  return 'text-red-600'
}

interface KpiCardProps {
  label: string
  children: React.ReactNode
}

function KpiCard({ label, children }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-2xl font-bold text-gray-900">{children}</div>
    </div>
  )
}

export default function KpiStrip({ kpis }: KpiStripProps) {
  return (
    <div className="flex items-stretch gap-4 flex-wrap">
      <KpiCard label="Overall Health Score">
        {kpis.overallHealthScore !== null ? (
          <span className={scoreColor(kpis.overallHealthScore)}>
            {kpis.overallHealthScore.toFixed(1)}
          </span>
        ) : (
          <ThresholdPlaceholder />
        )}
      </KpiCard>

      <KpiCard label="Participation Rate">
        <span>{kpis.participationRate}%</span>
      </KpiCard>

      <KpiCard label="Total Responses">
        <span>{kpis.totalResponses.toLocaleString()}</span>
      </KpiCard>

      <KpiCard label="Survey Period">
        <span className="text-lg">{kpis.surveyPeriod || '—'}</span>
      </KpiCard>

      <KpiCard label="Below Threshold">
        <span className={kpis.dimensionsBelowThreshold > 0 ? 'text-yellow-600' : 'text-gray-900'}>
          {kpis.dimensionsBelowThreshold} segment{kpis.dimensionsBelowThreshold !== 1 ? 's' : ''}
        </span>
      </KpiCard>
    </div>
  )
}
