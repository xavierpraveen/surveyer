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
    <div className="flex items-center gap-3">
      <label className="text-sm font-semibold text-fg mb-1">Viewing:</label>
      <select
        value={currentCycleId ?? ''}
        onChange={handleChange}
        className="border border-border rounded-md bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-border-focus"
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
