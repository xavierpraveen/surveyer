'use client'

interface SurveyProgressBarProps {
  currentSection: number // 0-indexed
  totalSections: number
  sectionTitle: string
}

export default function SurveyProgressBar({
  currentSection,
  totalSections,
  sectionTitle,
}: SurveyProgressBarProps) {
  const percentage = Math.round(((currentSection + 1) / totalSections) * 100)

  return (
    <div className="mb-6">
      <div className="relative bg-brand-muted h-1.5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand to-accent h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-sm text-fg-muted">
          Section {currentSection + 1} of {totalSections} &mdash; {sectionTitle}
        </p>
        <p className="text-xs text-fg-muted tabular-nums">{percentage}%</p>
      </div>
    </div>
  )
}
