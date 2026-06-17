import type { Priority } from '@specstat/types'
import { cn } from '@/lib/cn'

const PRIORITY_CONFIG: Record<NonNullable<Priority>, { color: string; label: string }> = {
  high: { color: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-yellow-400', label: 'Medium' },
  low: { color: 'bg-green-500', label: 'Low' },
}

export function PriorityIndicator({ priority }: { priority?: Priority | null }) {
  if (!priority) return null
  const { color, label } = PRIORITY_CONFIG[priority]
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className={cn('w-2 h-2 rounded-full', color)} aria-hidden />
      {label}
    </span>
  )
}
