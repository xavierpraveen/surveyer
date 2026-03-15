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
      <div className="relative bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-2 bg-blue-500 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-sm text-gray-600">
          Section {currentSection + 1} of {totalSections} &mdash; {sectionTitle}
        </p>
        <p className="text-sm text-gray-500 font-medium">{percentage}%</p>
      </div>
    </div>
  )
}
