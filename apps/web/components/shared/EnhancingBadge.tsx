import { SparklesIcon } from '@/components/shared/Icons'
import { cn } from '@/lib/cn'

/**
 * Derived indicator shown on an implemented spec that has one or more active
 * changes (enhancements) targeting it. The spec's own status stays `implemented`.
 */
export function EnhancingBadge({ count, className }: { count?: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
        'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20',
        className,
      )}
      title={count && count > 1 ? `${count} active enhancements` : 'Enhancement in progress'}
    >
      <SparklesIcon className="w-3 h-3" />
      Enhancing
      {count && count > 1 ? <span className="opacity-70">{count}</span> : null}
    </span>
  )
}
