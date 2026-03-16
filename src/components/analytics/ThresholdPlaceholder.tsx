'use client'

interface ThresholdPlaceholderProps {
  tooltip?: string
  className?: string
}

const DEFAULT_TOOLTIP =
  'Fewer than 5 responses in this segment — results hidden to protect anonymity.'

export default function ThresholdPlaceholder({
  tooltip = DEFAULT_TOOLTIP,
  className,
}: ThresholdPlaceholderProps) {
  return (
    <span className={`group relative inline-flex items-center ${className ?? ''}`}>
      <span className="text-fg-muted font-mono">---</span>
      <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-muted text-brand-text text-xs rounded px-2 py-1 w-56 z-50 pointer-events-none border border-indigo-200">
        {tooltip}
      </span>
    </span>
  )
}
