import type { SpecStatus } from '@specstat/types'
import { cn } from '@/lib/cn'

const STATUS_STYLES: Record<SpecStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  'in-review': 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  implemented: 'bg-blue-100 text-blue-700',
  deprecated: 'bg-orange-100 text-orange-700',
  archived: 'bg-slate-100 text-slate-500',
}

export function StatusBadge({ status }: { status: SpecStatus }) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_STYLES[status])}>
      {status}
    </span>
  )
}
