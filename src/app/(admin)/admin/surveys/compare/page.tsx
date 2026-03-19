import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

interface SurveyMetrics {
  id: string
  title: string
  status: string
  closedAt: string | null
  totalResponses: number
  eligibleCount: number
  participationRate: number
  overallHealthScore: number | null
  dimensionScores: { name: string; score: number | null }[]
}

async function fetchAllSurveyMetrics(): Promise<SurveyMetrics[]> {
  // 1. All surveys ordered by creation date
  const { data: surveys } = await db
    .from('surveys')
    .select('id, title, status, closes_at, created_at')
    .order('created_at', { ascending: false })

  if (!surveys || surveys.length === 0) return []

  // 2. Total eligible profiles
  const { count: eligibleCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  const eligible = Number(eligibleCount ?? 0)

  // 3. For each survey, gather metrics
  const metrics: SurveyMetrics[] = []

  for (const s of surveys as Array<{ id: string; title: string; status: string; closes_at: string | null }>) {
    // Participation tokens = submitted count
    const { count: tokenCount } = await db
      .from('participation_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', s.id)
    const submitted = Number(tokenCount ?? 0)
    const rate = eligible > 0 ? Math.min(Math.round((submitted / eligible) * 100), 100) : 0

    // Dimension scores from derived_metrics joined with dimensions for names
    const { data: dimRows } = await db
      .from('derived_metrics')
      .select('dimension_id, avg_score, dimensions(name)')
      .eq('survey_id', s.id)
      .eq('segment_type', 'overall')
      .not('avg_score', 'is', null)

    type DimRow = { dimension_id: string; avg_score: number; dimensions: { name: string } | null }
    const dimensionScores = ((dimRows as DimRow[] | null) ?? [])
      .map((r) => ({
        name: r.dimensions?.name ?? r.dimension_id,
        score: Number(r.avg_score),
      }))

    const validScores = dimensionScores.map((d) => d.score).filter((v): v is number => v !== null)
    const overallHealthScore =
      validScores.length > 0
        ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100
        : null

    metrics.push({
      id: s.id,
      title: s.title,
      status: s.status,
      closedAt: s.closes_at,
      totalResponses: submitted,
      eligibleCount: eligible,
      participationRate: rate,
      overallHealthScore,
      dimensionScores,
    })
  }

  return metrics
}

function ScoreBar({ score, max = 5 }: { score: number | null; max?: number }) {
  if (score === null) {
    return <span className="text-xs text-fg-subtle italic">N/A</span>
  }
  const pct = (score / max) * 100
  const color = score >= 4 ? 'bg-success' : score >= 3 ? 'bg-warning' : 'bg-error'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-surface-2 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-fg tabular-nums w-7 text-right">{score.toFixed(1)}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-success-muted text-success-text',
    closed: 'bg-surface-2 text-fg-muted',
    draft: 'bg-brand-muted text-brand-text',
    scheduled: 'bg-warning-muted text-warning-text',
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${map[status] ?? 'bg-surface-2 text-fg-muted'}`}>
      {status}
    </span>
  )
}

function ParticipationRing({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-error'
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-extrabold tabular-nums ${color}`}>{rate}%</span>
      <span className="text-[10px] text-fg-subtle uppercase tracking-wide">Participation</span>
    </div>
  )
}

export default async function SurveyComparePage() {
  const metrics = await fetchAllSurveyMetrics()

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-snug text-fg">Survey Comparison</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            All survey cycles — participation, health scores, and dimension breakdown.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-brand-text hover:underline"
        >
          ← Back to Admin
        </Link>
      </div>

      {metrics.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <p className="text-fg-muted">No surveys yet. Create your first survey to see statistics here.</p>
          <Link href="/admin/surveys/new" className="mt-4 inline-flex bg-brand text-white text-sm font-semibold px-4 py-2 rounded-md">
            Create Survey
          </Link>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-fg-subtle font-semibold">Total Surveys</p>
              <p className="text-2xl font-extrabold text-fg">{metrics.length}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-fg-subtle font-semibold">Closed</p>
              <p className="text-2xl font-extrabold text-fg">{metrics.filter((m) => m.status === 'closed').length}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-fg-subtle font-semibold">Open</p>
              <p className="text-2xl font-extrabold text-fg">{metrics.filter((m) => m.status === 'open').length}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-fg-subtle font-semibold">Avg Participation</p>
              <p className="text-2xl font-extrabold text-fg">
                {metrics.length > 0
                  ? Math.round(metrics.reduce((s, m) => s + m.participationRate, 0) / metrics.length)
                  : 0}%
              </p>
            </div>
          </div>

          {/* Survey cards */}
          <div className="space-y-4">
            {metrics.map((m, idx) => (
              <div
                key={m.id}
                className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-fg-subtle w-5 shrink-0">#{idx + 1}</span>
                    <div className="min-w-0">
                      <h2 className="font-bold text-fg text-sm truncate">{m.title}</h2>
                      {m.closedAt && (
                        <p className="text-xs text-fg-subtle">
                          Closed {new Date(m.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={m.status} />
                    <Link
                      href={`/leadership/dashboard?surveyId=${m.id}`}
                      className="text-xs font-medium text-brand-text hover:underline"
                    >
                      Full Dashboard →
                    </Link>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Participation */}
                  <ParticipationRing rate={m.participationRate} />

                  {/* Responses */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-extrabold tabular-nums text-fg">{m.totalResponses}</span>
                    <span className="text-[10px] text-fg-subtle uppercase tracking-wide">
                      of {m.eligibleCount} responses
                    </span>
                  </div>

                  {/* Health score */}
                  <div className="flex flex-col items-center">
                    {m.overallHealthScore !== null ? (
                      <>
                        <span className={`text-2xl font-extrabold tabular-nums ${m.overallHealthScore >= 4 ? 'text-success' : m.overallHealthScore >= 3 ? 'text-warning' : 'text-error'}`}>
                          {m.overallHealthScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-fg-subtle uppercase tracking-wide">Health Score</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-extrabold text-fg-subtle">—</span>
                        <span className="text-[10px] text-fg-subtle uppercase tracking-wide">
                          {m.status === 'open' ? 'In progress' : 'Not computed'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Dimension count */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-extrabold tabular-nums text-fg">{m.dimensionScores.length}</span>
                    <span className="text-[10px] text-fg-subtle uppercase tracking-wide">Dimensions scored</span>
                  </div>
                </div>

                {/* Dimension breakdown */}
                {m.dimensionScores.length > 0 && (
                  <div className="px-5 pb-4 border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-wide text-fg-subtle font-semibold mb-2">
                      Dimension Scores
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1.5">
                      {m.dimensionScores.map((d) => (
                        <div key={d.name}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-fg truncate pr-2">{d.name}</span>
                          </div>
                          <ScoreBar score={d.score} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live progress bar for open surveys */}
                {m.status === 'open' && (
                  <div className="px-5 pb-4 border-t border-border pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-fg-muted">Responses so far</span>
                      <span className="text-xs font-semibold text-fg">{m.totalResponses} / {m.eligibleCount}</span>
                    </div>
                    <div className="bg-surface-2 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-brand to-accent h-2 rounded-full transition-all"
                        style={{ width: `${m.participationRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
