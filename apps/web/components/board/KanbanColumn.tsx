'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/cn'
import type { IndexItem, SpecStatus } from '@specstat/types'

export interface KanbanItem {
  item: IndexItem
  repo?: string
}

interface KanbanColumnProps {
  id: string
  label: string
  statuses: SpecStatus[]
  items: KanbanItem[]
  renderCard: (ki: KanbanItem) => React.ReactNode
  emptyText?: string
}

export function KanbanColumn({ id, label, statuses, items, renderCard, emptyText }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const cardIds = items.map((ki) => `${ki.repo ?? ''}:${ki.item.id}`)

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] rounded-lg p-2 transition-colors',
          isOver
            ? 'bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10'
            : 'bg-muted/30 dark:bg-muted/20',
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {statuses.map((status) => {
            const statusItems = items.filter((ki) => ki.item.status === status)
            return (
              <div key={status} className="mb-3 last:mb-0">
                {statuses.length > 1 && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">{statusItems.length}</span>
                  </div>
                )}
                <div className="space-y-2">
                  {statusItems.map((ki) => renderCard(ki))}
                  {statusItems.length === 0 && statuses.length > 1 && (
                    <p className="text-xs text-muted-foreground/40 px-1 py-1 italic">empty</p>
                  )}
                </div>
              </div>
            )
          })}
        </SortableContext>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground/50 px-1 py-2">{emptyText ?? 'Empty'}</p>
        )}
      </div>
    </div>
  )
}
