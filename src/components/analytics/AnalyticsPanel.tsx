interface AnalyticsPanelProps {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
}

export default function AnalyticsPanel({ title, subtitle, className, children }: AnalyticsPanelProps) {
  const base = 'bg-surface border border-border rounded-xl shadow-sm p-5'
  return (
    <section className={className ? `${base} ${className}` : base}>
      <div className="mb-3">
        <h2 className="text-base font-bold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

