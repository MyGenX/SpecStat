'use client'

import { useState } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { TreeView } from '@/components/tree/TreeView'
import { CardDetail } from '@/components/board/CardDetail'
import type { IndexItem } from '@specstat/types'

export default function TreePage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)
  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])

  function handleItemClick(item: IndexItem, r: string) {
    if (selectedItem) setBreadcrumbs((prev) => [...prev, selectedItem])
    setSelectedItem({ item, repo: r })
  }

  function handleClose() {
    setSelectedItem(null)
    setBreadcrumbs([])
  }

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <aside className="w-72 border-r overflow-y-auto">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">{repo}</h2>
          <p className="text-xs text-muted-foreground">{index.items.length} items</p>
        </div>
        <TreeView index={index} repo={repo} onItemClick={handleItemClick} />
      </aside>

      <main className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {!selectedItem && 'Click a spec item to view details'}
      </main>

      {selectedItem && (
        <CardDetail
          item={selectedItem.item}
          repo={selectedItem.repo}
          onClose={handleClose}
          onNavigate={(item, r) => {
            if (selectedItem) setBreadcrumbs((prev) => [...prev, selectedItem])
            setSelectedItem({ item, repo: r })
          }}
          breadcrumbs={breadcrumbs}
        />
      )}
    </div>
  )
}
