'use client'

import { useState } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { GraphView } from '@/components/graph/GraphView'
import { CardDetail } from '@/components/board/CardDetail'
import type { IndexItem, VisualizeItemRelations } from '@specstat/types'

export default function GraphPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)
  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])

  // Build relations map from index items (includes auto-detected change→spec links)
  const relations = new Map<string, Partial<VisualizeItemRelations>>()
  for (const item of index?.items ?? []) {
    if (item.relations) relations.set(item.id, item.relations)
  }

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  return (
    <div className="h-[calc(100vh-56px)] flex">
      <div className="flex-1">
        <GraphView
          items={index.items}
          repo={repo}
          relations={relations}
          onNodeClick={(item, r) => {
            if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
            setSelectedItem({ item, repo: r })
          }}
        />
      </div>
      {selectedItem && (
        <CardDetail
          item={selectedItem.item}
          repo={selectedItem.repo}
          onClose={() => { setSelectedItem(null); setBreadcrumbs([]) }}
          onNavigate={(item, r) => {
            if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
            setSelectedItem({ item, repo: r })
          }}
          breadcrumbs={breadcrumbs}
        />
      )}
    </div>
  )
}
