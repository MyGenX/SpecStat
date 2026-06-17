'use client'

import { useState } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { IndexItem } from '@specstat/types'

export default function StoriesPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)
  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [search, setSearch] = useState('')

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  const stories = index.items
    .filter((i) => i.track === 'spec' || (!i.track && !i.path.includes('/changes/')))
    .filter((i) =>
      !search ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.title.toLowerCase().includes(search.toLowerCase()),
    )

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <aside className="w-80 border-r flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm mb-2">Stories</h2>
          <input
            type="search"
            placeholder="Search stories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">{stories.length} implemented capabilities</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {stories.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No stories found.</p>
          )}
          {stories.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
                setSelectedItem({ item, repo })
              }}
              className={`w-full text-left px-4 py-3 border-b hover:bg-muted/40 transition-colors ${selectedItem?.item.id === item.id ? 'bg-muted' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-tight">{item.title || item.id}</span>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{item.id}</span>
                {item.requirement_count != null && (
                  <span>{item.requirement_count} req{item.requirement_count !== 1 ? 's' : ''}</span>
                )}
                {item.scenario_count != null && (
                  <span>{item.scenario_count} scenarios</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {!selectedItem && (
          <div className="text-center space-y-1">
            <p>Select a story to view its specification</p>
            <p className="text-xs">{index.items.filter((i) => i.track === 'spec' || (!i.track && !i.path.includes('/changes/'))).length} implemented capabilities</p>
          </div>
        )}
      </main>

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
