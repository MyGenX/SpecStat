'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { IndexItem } from '@specstat/types'
import { SpecCard } from './SpecCard'
import { cn } from '@/lib/cn'

interface SortableCardProps {
  item: IndexItem
  repo?: string
  onClick: () => void
}

function SortableCard({ item, repo, onClick }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${repo}:${item.id}`,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SpecCard item={item} repo={repo} onClick={onClick} isDragging={isDragging} />
    </div>
  )
}

interface BoardColumnProps {
  id: string
  title: string
  items: { item: IndexItem; repo?: string }[]
  onCardClick: (item: IndexItem, repo?: string) => void
}

export function BoardColumn({ id, title, items, onCardClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const cardIds = items.map((i) => `${i.repo}:${i.item.id}`)

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold capitalize">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] rounded-lg p-2 space-y-2 transition-colors',
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30',
        )}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {items.map(({ item, repo }) => (
            <SortableCard
              key={`${repo}:${item.id}`}
              item={item}
              repo={repo}
              onClick={() => onCardClick(item, repo)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
