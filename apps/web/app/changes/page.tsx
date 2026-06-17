'use client'

import { useState } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { IndexItem, SpecStatus } from '@specstat/types'

const LIFECYCLE_COLUMNS: { status: SpecStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'in-progress' as SpecStatus, label: 'In Progress' },
  { status: 'approved', label: 'Approved' },
  { status: 'archived', label: 'Archived' },
]

function TaskProgressBar({ tasks }: { tasks: { total: number; done: number } }) {
  if (tasks.total === 0) return null
  const pct = Math.round((tasks.done / tasks.total) * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{tasks.done}/{tasks.total} tasks</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ChangeCard({ item, onClick, selected }: { item: IndexItem; onClick: () => void; selected: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors hover:shadow-sm ${selected ? 'bg-muted border-primary' : 'bg-card hover:bg-muted/40'}`}
    >
      <div className="font-medium text-sm truncate">{item.title || item.id}</div>
      {item.tasks && <TaskProgressBar tasks={item.tasks} />}
      {item.docs && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.docs.proposal && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">proposal</span>}
          {item.docs.design && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">design</span>}
          {item.docs.tasks && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">tasks</span>}
        </div>
      )}
      {item.relations?.relates_to && item.relations.relates_to.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1.5 truncate">
          → {item.relations.relates_to.join(', ')}
        </div>
      )}
    </button>
  )
}

export default function ChangesPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)
  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  const changes = index.items.filter(
    (i) => i.track === 'change' || (!i.track && i.path.includes('/changes/')),
  )

  function openItem(item: IndexItem) {
    if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
    setSelectedItem({ item, repo })
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {LIFECYCLE_COLUMNS.map(({ status, label }) => {
            const columnItems = changes.filter((i) => i.status === status)
            return (
              <div key={status} className="w-72 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">{columnItems.length}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {columnItems.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2">No changes</p>
                  )}
                  {columnItems.map((item) => (
                    <ChangeCard
                      key={item.id}
                      item={item}
                      onClick={() => openItem(item)}
                      selected={selectedItem?.item.id === item.id}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
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
