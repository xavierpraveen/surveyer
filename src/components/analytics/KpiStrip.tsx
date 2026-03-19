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
  subtitle?: string
}

function KpiCard({ label, children, subtitle }: KpiCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm p-5 flex-1 min-w-0">
      <p className="text-[11px] text-fg-subtle font-semibold uppercase tracking-[0.09em] mb-1">{label}</p>
      <div className="text-2xl font-extrabold tracking-snug text-fg tabular-nums">{children}</div>
      {subtitle && <p className="text-xs text-fg-subtle mt-1">{subtitle}</p>}
    </div>
  )
}

export default function KpiStrip({ kpis }: KpiStripProps) {
  const delta = kpis.completionDeltaPct
  const deltaClass =
    delta === null ? 'text-fg-subtle' : delta > 0 ? 'text-success-text' : delta < 0 ? 'text-error-text' : 'text-fg'

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

      <KpiCard label="Participation Rate" subtitle="Share of eligible employees who responded">
        <span>{kpis.participationRate}%</span>
      </KpiCard>

      <KpiCard label="Total Responses" subtitle="Raw response count for current cycle">
        <span>{kpis.totalResponses.toLocaleString()}</span>
      </KpiCard>

      <KpiCard label="Pending Responses" subtitle="Remaining responses to reach full participation">
        <span>{kpis.pendingResponses.toLocaleString()}</span>
      </KpiCard>

      <KpiCard label="Completion Delta">
        <span className={deltaClass}>
          {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}
        </span>
      </KpiCard>

      <KpiCard label="Actions Completed" subtitle="Public action items marked completed">
        <span>{kpis.completedActionPct === null ? '—' : `${kpis.completedActionPct}%`}</span>
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
