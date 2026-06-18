'use client'

import { useState } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TypeIcon } from '@/components/shared/TypeIcon'
import { ArchiveIcon, FilterIcon, FolderIcon, InboxIcon } from '@/components/shared/Icons'
import type { IndexItem, SpecType } from '@specstat/types'

export default function ArchivePage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)
  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [filterType, setFilterType] = useState<SpecType | ''>('')
  const [filterFolder, setFilterFolder] = useState('')

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  const archivedItems = index.items
    .filter((i) => i.archived)
    .filter((i) => !filterType || i.type === filterType)
    .filter((i) => !filterFolder || i.path.startsWith(filterFolder))

  const folders = [...new Set(index.items.filter((i) => i.archived).map((i) => i.path.split('/').slice(0, -1).join('/')))]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold mb-6">
        <ArchiveIcon className="w-6 h-6 text-muted-foreground" />
        Archive
      </h1>

      <div className="flex items-center gap-3 mb-6">
        <FilterIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SpecType | '')}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors cursor-pointer"
        >
          <option value="">All types</option>
          {(['spec', 'impl', 'task', 'design', 'proposal', 'decision', 'component', 'domain'] as SpecType[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterFolder}
          onChange={(e) => setFilterFolder(e.target.value)}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors cursor-pointer"
        >
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <span className="ml-auto text-xs text-muted-foreground">
          {archivedItems.length} archived items
        </span>
      </div>

      {archivedItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <InboxIcon className="w-8 h-8 opacity-40" />
          <p>No archived items.</p>
        </div>
      )}

      <div className="space-y-2">
        {archivedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
              setSelectedItem({ item, repo })
            }}
            className="w-full flex items-center gap-3 border rounded-lg px-4 py-3 hover:bg-muted/40 text-left transition-colors cursor-pointer"
          >
            <TypeIcon type={item.type} />
            <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{item.id}</span>
            <span className="text-sm font-medium flex-1 truncate">{item.title}</span>
            <StatusBadge status={item.status} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <FolderIcon className="w-3 h-3" />
              {item.path.split('/').slice(0, -1).join('/')}
            </span>
          </button>
        ))}
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
