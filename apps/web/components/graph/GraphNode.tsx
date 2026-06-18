import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { IndexItem } from '@specstat/types'
import { TypeIcon } from '@/components/shared/TypeIcon'
import { cn } from '@/lib/cn'

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-gray-500/40 bg-gray-500/10',
  'in-review': 'border-yellow-500/40 bg-yellow-500/10',
  approved: 'border-green-500/40 bg-green-500/10',
  implemented: 'border-blue-500/40 bg-blue-500/10',
  deprecated: 'border-orange-500/40 bg-orange-500/10',
  archived: 'border-slate-500/40 bg-slate-500/10',
}

export const GraphNode = memo(function GraphNode({
  data,
}: NodeProps<{ item: IndexItem; repo?: string; dimmed?: boolean; highlighted?: boolean }>) {
  const { item, repo, dimmed, highlighted } = data
  const isStub = repo === '__stub__'

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-muted-foreground" />
      <div
        className={cn(
          'rounded-lg border-2 px-3 py-2 min-w-[140px] max-w-[180px] transition-opacity',
          STATUS_COLORS[item.status] ?? 'border-border bg-card',
          dimmed && 'opacity-30',
          highlighted && 'ring-2 ring-primary',
          isStub && 'opacity-40 border-dashed',
        )}
      >
        {!isStub && <TypeIcon type={item.type} />}
        <div className="text-[10px] font-mono text-muted-foreground">{item.id}</div>
        <div className="text-xs font-medium leading-snug mt-0.5 line-clamp-2">{item.title}</div>
        {repo && repo !== '__stub__' && (
          <div className="text-[9px] text-muted-foreground mt-1">{repo.split('/')[0]}</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-muted-foreground" />
    </>
  )
})
