'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useSession } from 'next-auth/react'
import { createOctokit, updateVisualizeJson } from '@specstat/github-client'
import type { IndexItem, SpecStatus } from '@specstat/types'
import { BoardColumn } from './BoardColumn'
import { cn } from '@/lib/cn'

type GroupBy = 'status' | 'owner' | 'type' | 'tag' | 'swimlane' | 'milestone'

const STATUS_ORDER: SpecStatus[] = ['draft', 'in-progress', 'in-review', 'approved', 'implemented', 'deprecated', 'archived']

interface BoardItem {
  item: IndexItem
  repo?: string
  visualizePath?: string
}

interface BoardViewProps {
  items: BoardItem[]
  groupBy?: GroupBy
  onCardClick: (item: IndexItem, repo?: string) => void
}

function groupItems(items: BoardItem[], groupBy: GroupBy): Map<string, BoardItem[]> {
  const map = new Map<string, BoardItem[]>()
  for (const bi of items) {
    let key: string
    switch (groupBy) {
      case 'status': key = bi.item.status; break
      case 'owner': key = bi.item.id; break
      case 'type': key = bi.item.type; break
      default: key = bi.item.status
    }
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(bi)
  }
  return map
}

export function BoardView({ items, groupBy = 'status', onCardClick }: BoardViewProps) {
  const { data: session } = useSession()
  const [localItems, setLocalItems] = useState(items)
  const [statusToast, setStatusToast] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const filtered = localItems.filter((bi) => !bi.item.archived)
  const grouped = groupItems(filtered, groupBy)

  const columns = groupBy === 'status'
    ? STATUS_ORDER.map((s) => ({ id: s, items: grouped.get(s) ?? [] }))
    : [...grouped.entries()].map(([id, its]) => ({ id, items: its }))

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const [repo, itemId] = String(active.id).split(':')
      const newStatus = String(over.id) as SpecStatus

      const prevItems = localItems
      setLocalItems((prev) =>
        prev.map((bi) =>
          bi.item.id === itemId && bi.repo === repo
            ? { ...bi, item: { ...bi.item, status: newStatus } }
            : bi,
        ),
      )

      try {
        const token = (session as { accessToken?: string } | null)?.accessToken
        if (!token || !repo) throw new Error('No token')
        const octokit = createOctokit(token)
        const bi = localItems.find((b) => b.item.id === itemId && b.repo === repo)
        if (!bi?.visualizePath) throw new Error('No visualize path')
        await updateVisualizeJson(octokit, repo, bi.visualizePath, { status: newStatus })
      } catch {
        setLocalItems(prevItems)
        setStatusToast('Failed to update status. Check branch protection settings.')
        setTimeout(() => setStatusToast(null), 4000)
      }
    },
    [session, localItems],
  )

  return (
    <div className="relative">
      {statusToast && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-md shadow-md z-50">
          {statusToast}
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4">
          {columns.map(({ id, items: colItems }) => (
            <BoardColumn
              key={id}
              id={id}
              title={id}
              items={colItems}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
