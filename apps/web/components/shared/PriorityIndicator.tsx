import type { Priority } from '@specstat/types'
import { cn } from '@/lib/cn'
import { ArrowUpIcon, ArrowRightIcon, ArrowDownIcon } from './Icons'

const PRIORITY_CONFIG: Record<NonNullable<Priority>, { icon: React.FC<{ className?: string }>; color: string; label: string }> = {
  high:   { icon: ArrowUpIcon,    color: 'text-red-500',    label: 'High' },
  medium: { icon: ArrowRightIcon, color: 'text-yellow-500', label: 'Medium' },
  low:    { icon: ArrowDownIcon,  color: 'text-green-500',  label: 'Low' },
}

export function PriorityIndicator({ priority }: { priority?: Priority | null }) {
  if (!priority) return null
  const { icon: Icon, color, label } = PRIORITY_CONFIG[priority]
  return (
    <span className={cn('flex items-center gap-1 text-xs', color)}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </span>
  )
}
