'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { BoardView } from '@/components/board/BoardView'
import { CardDetail } from '@/components/board/CardDetail'
import type { IndexItem, SpecType } from '@specstat/types'

type GroupBy = 'status' | 'owner' | 'type' | 'tag'

export default function BoardPage() {
  const searchParams = useSearchParams()
  const folderFilter = searchParams.get('folder')
  const groupBy = (searchParams.get('groupBy') as GroupBy | null) ?? 'status'

  const { repo: primaryRepo, resolving } = useActiveRepo()
  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [filterType, setFilterType] = useState<SpecType | ''>('')
  const [showArchived, setShowArchived] = useState(false)

  const { data: index } = useIndex(primaryRepo)

  const rawItems = index?.items ?? []
  const boardItems = rawItems
    .filter((i) => !i.archived || showArchived)
    .filter((i) => !filterType || i.type === filterType)
    .filter((i) => !folderFilter || i.path.startsWith(folderFilter))
    .map((item) => ({ item, repo: primaryRepo, visualizePath: item.visualize }))

  function handleCardClick(item: IndexItem, repo?: string) {
    if (selectedItem) {
      setBreadcrumbs((prev) => [...prev, selectedItem])
    }
    setSelectedItem({ item, repo: repo ?? primaryRepo })
  }

  function handleClose() {
    setSelectedItem(null)
    setBreadcrumbs([])
  }

  function handleNavigate(item: IndexItem, repo: string) {
    if (selectedItem) {
      setBreadcrumbs((prev) => [...prev, selectedItem])
    }
    setSelectedItem({ item, repo })
  }

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-card">
        <select
          value={groupBy}
          onChange={(e) => {
            const url = new URL(window.location.href)
            url.searchParams.set('groupBy', e.target.value)
            window.history.pushState({}, '', url)
          }}
          className="text-sm border rounded px-2 py-1"
        >
          {['status', 'owner', 'type', 'tag', 'swimlane', 'milestone'].map((g) => (
            <option key={g} value={g}>Group by {g}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SpecType | '')}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">All types</option>
          {(['spec', 'impl', 'task', 'design', 'proposal', 'decision', 'component', 'domain'] as SpecType[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Show archived
        </label>

        <span className="ml-auto text-xs text-muted-foreground">
          {boardItems.length} items
        </span>
      </div>

      <div className="flex-1 overflow-x-auto pt-4">
        <BoardView items={boardItems} groupBy={groupBy} onCardClick={handleCardClick} />
      </div>

      {selectedItem && (
        <CardDetail
          item={selectedItem.item}
          repo={selectedItem.repo}
          onClose={handleClose}
          onNavigate={handleNavigate}
          breadcrumbs={breadcrumbs}
        />
      )}
    </div>
  )
}
