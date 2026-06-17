'use client'

import { useState, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SpecStoryCard } from '@/components/stories/SpecStoryCard'
import type { IndexItem, SpecStatus } from '@specstat/types'

// ─── Column groups ────────────────────────────────────────────────────────────

interface StoryColumnGroup {
  id: string
  label: string
  statuses: SpecStatus[]
}

const STORY_COLUMNS: StoryColumnGroup[] = [
  { id: 'draft',       label: 'Draft',       statuses: ['draft', 'in-progress'] },
  { id: 'review',      label: 'Review',      statuses: ['in-review', 'approved'] },
  { id: 'implemented', label: 'Implemented', statuses: ['implemented'] },
]

const FILTER_STATUSES: SpecStatus[] = [
  'draft', 'in-progress', 'in-review', 'approved', 'implemented',
]

// ─── Column ──────────────────────────────────────────────────────────────────

interface ColumnProps {
  group: StoryColumnGroup
  items: IndexItem[]
  inChangeMap: Map<string, string[]>
  onCardClick: (item: IndexItem) => void
  selectedId?: string
}

function StoryColumn({ group, items, inChangeMap, onCardClick, selectedId }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  const totalCount = items.length

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold">{group.label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {totalCount}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-lg p-2 transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30'
        }`}
      >
        {group.statuses.map((status) => {
          const statusItems = items.filter((i) => i.status === status)
          return (
            <div key={status} className="mb-3 last:mb-0">
              {group.statuses.length > 1 && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <StatusBadge status={status} />
                  <span className="text-xs text-muted-foreground">{statusItems.length}</span>
                </div>
              )}
              <div className="space-y-2">
                {statusItems.map((item) => (
                  <SpecStoryCard
                    key={item.id}
                    item={item}
                    activeChanges={inChangeMap.get(item.id)}
                    onClick={() => onCardClick(item)}
                    selected={selectedId === item.id}
                  />
                ))}
                {statusItems.length === 0 && group.statuses.length > 1 && (
                  <p className="text-xs text-muted-foreground/40 px-1 py-1 italic">empty</p>
                )}
              </div>
            </div>
          )
        })}
        {totalCount === 0 && (
          <p className="text-xs text-muted-foreground/50 px-1 py-2">No stories</p>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoriesPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)

  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<SpecStatus[]>([])
  const [search, setSearch] = useState('')

  const allSpecs = useMemo(
    () =>
      (index?.items ?? []).filter(
        (i) =>
          (i.track === 'spec' || (!i.track && !i.path.includes('/changes/'))) && !i.archived,
      ),
    [index],
  )

  // Cross-reference active changes → which specs are being worked on
  const inChangeMap = useMemo((): Map<string, string[]> => {
    const map = new Map<string, string[]>()
    for (const item of index?.items ?? []) {
      if (
        (item.track === 'change' || (!item.track && item.path.includes('/changes/'))) &&
        !item.archived
      ) {
        for (const relId of item.relations?.relates_to ?? []) {
          map.set(relId, [...(map.get(relId) ?? []), item.title || item.id])
        }
      }
    }
    return map
  }, [index])

  const statusCounts = useMemo((): Map<SpecStatus, number> => {
    const counts = new Map<SpecStatus, number>()
    for (const item of allSpecs) {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    }
    return counts
  }, [allSpecs])

  function toggleStatus(status: SpecStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allSpecs
      .filter((i) => selectedStatuses.length === 0 || selectedStatuses.includes(i.status))
      .filter(
        (i) =>
          !q ||
          i.id.toLowerCase().includes(q) ||
          (i.title ?? '').toLowerCase().includes(q),
      )
  }, [allSpecs, selectedStatuses, search])

  function openItem(item: IndexItem) {
    if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
    setSelectedItem({ item, repo })
  }

  function handleClose() {
    setSelectedItem(null)
    setBreadcrumbs([])
  }

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Filter toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_STATUSES.map((status) => {
            const count = statusCounts.get(status) ?? 0
            const active = selectedStatuses.includes(status)
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span className="capitalize">{status}</span>
                <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <input
          type="search"
          placeholder="Search stories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border rounded px-2 py-1 bg-background w-48 ml-2"
        />

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} stories</span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pt-4">
        <div className="flex gap-6 px-4 pb-4 min-w-max">
          {STORY_COLUMNS.map((group) => (
            <StoryColumn
              key={group.id}
              group={group}
              items={filtered.filter((i) => group.statuses.includes(i.status))}
              inChangeMap={inChangeMap}
              onCardClick={openItem}
              selectedId={selectedItem?.item.id}
            />
          ))}
        </div>
      </div>

      {selectedItem && (
        <CardDetail
          item={selectedItem.item}
          repo={selectedItem.repo}
          onClose={handleClose}
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
