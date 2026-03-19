'use client'

import { useState } from 'react'
import { exportResultsCsv } from '@/lib/actions/analytics'

interface ExportCsvButtonProps {
  cycleId: string | null
}

export default function ExportCsvButton({ cycleId }: ExportCsvButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setIsLoading(true)
    setError(null)
    const result = await exportResultsCsv(cycleId)
    if (result.success) {
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="inline-flex items-center gap-2 text-xs font-medium text-fg-muted border border-border bg-surface-2 hover:bg-border rounded-md px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Exporting…' : 'Download CSV'}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
