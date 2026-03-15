'use client'

import { useRouter } from 'next/navigation'

interface CycleSelectorProps {
  cycles: Array<{
    surveyId: string
    surveyTitle: string
    closedAt: string | null
    isPublished: boolean
  }>
  currentCycleId: string | null // currently selected cycle (from URL param)
  liveSurveyId: string | null   // the most recent live/current cycle (no snapshot)
}

export default function CycleSelector({
  cycles,
  currentCycleId,
}: CycleSelectorProps) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value === '') {
      router.push('/results')
    } else {
      router.push(`/results?cycle=${value}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">Viewing:</span>
      <select
        value={currentCycleId ?? ''}
        onChange={handleChange}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Current (Live)</option>
        {cycles.map((cycle) => (
          <option key={cycle.surveyId} value={cycle.surveyId}>
            {cycle.surveyTitle} (Published)
          </option>
        ))}
      </select>
    </div>
  )
}
