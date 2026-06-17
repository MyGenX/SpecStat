import type { SpecStatus } from '@specstat/types'
import { cn } from '@/lib/cn'

const STATUS_STYLES: Record<SpecStatus, { badge: string; dot: string }> = {
  draft:         { badge: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',        dot: 'bg-gray-400' },
  'in-progress': { badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',        dot: 'bg-blue-500' },
  'in-review':   { badge: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',  dot: 'bg-yellow-500' },
  approved:      { badge: 'bg-green-500/10 text-green-700 dark:text-green-400',     dot: 'bg-green-500' },
  implemented:   { badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',  dot: 'bg-violet-500' },
  deprecated:    { badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',  dot: 'bg-orange-500' },
  archived:      { badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',     dot: 'bg-slate-400' },
}

export function StatusBadge({ status }: { status: SpecStatus }) {
  const styles = STATUS_STYLES[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium capitalize', styles.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} />
      {status}
    </span>
  )
}
