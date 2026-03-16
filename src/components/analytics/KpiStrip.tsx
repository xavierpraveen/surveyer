import type { OrgKpis } from '@/lib/types/analytics'
import ThresholdPlaceholder from './ThresholdPlaceholder'

interface KpiStripProps {
  kpis: OrgKpis
}

function scoreColor(score: number): string {
  if (score >= 4.0) return 'text-success-text'
  if (score >= 3.0) return 'text-warning-text'
  return 'text-error-text'
}

interface KpiCardProps {
  label: string
  children: React.ReactNode
}

function KpiCard({ label, children }: KpiCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm p-5 flex-1 min-w-0">
      <p className="text-xs text-fg-subtle font-medium uppercase tracking-[0.07em] mb-1">{label}</p>
      <div className="text-2xl font-extrabold tracking-snug text-fg tabular-nums">{children}</div>
    </div>
  )
}

export default function KpiStrip({ kpis }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <span className={kpis.dimensionsBelowThreshold > 0 ? 'text-warning-text' : 'text-fg'}>
          {kpis.dimensionsBelowThreshold} segment{kpis.dimensionsBelowThreshold !== 1 ? 's' : ''}
        </span>
      </KpiCard>
    </div>
  )
}
