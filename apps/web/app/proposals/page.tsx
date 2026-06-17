'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSession } from 'next-auth/react'
import { createOctokit, updateVisualizeJson } from '@specstat/github-client'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { KanbanColumn } from '@/components/board/KanbanColumn'
import { ProposalCard } from '@/components/board/ProposalCard'
import { SearchIcon, FilterIcon, PackageIcon } from '@/components/shared/Icons'
import { CHANGE_COLUMNS, CHANGE_FILTER_STATUSES } from '@/lib/kanban'
import type { IndexItem, SpecStatus } from '@specstat/types'

// ─── Sortable card wrapper ────────────────────────────────────────────────────

function SortableProposalCard({
  item,
  repo,
  onClick,
  selected,
}: {
  item: IndexItem
  repo: string
  onClick: () => void
  selected: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${repo}:${item.id}`,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProposalCard item={item} repo={repo} onClick={onClick} isDragging={isDragging} selected={selected} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)
  const { data: session } = useSession()

  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<SpecStatus[]>([])
  const [search, setSearch] = useState('')
  const [localProposals, setLocalProposals] = useState<IndexItem[] | null>(null)
  const [statusToast, setStatusToast] = useState<string | null>(null)

  const allProposals = useMemo(
    () =>
      (index?.items ?? []).filter(
        (i) => i.track === 'change' || (!i.track && i.path.includes('/changes/')),
      ),
    [index],
  )

  const proposals = localProposals ?? allProposals

  const statusCounts = useMemo((): Map<SpecStatus, number> => {
    const counts = new Map<SpecStatus, number>()
    for (const item of allProposals) {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    }
    return counts
  }, [allProposals])

  function toggleStatus(status: SpecStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return proposals
      .filter((i) => selectedStatuses.length === 0 || selectedStatuses.includes(i.status))
      .filter((i) =>
        !q ||
        i.id.toLowerCase().includes(q) ||
        (i.title ?? '').toLowerCase().includes(q),
      )
  }, [proposals, selectedStatuses, search])

  function openItem(item: IndexItem, r: string) {
    if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
    setSelectedItem({ item, repo: r })
  }

  function handleClose() {
    setSelectedItem(null)
    setBreadcrumbs([])
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const [dragRepo, itemId] = String(active.id).split(':')
      const targetColumn = CHANGE_COLUMNS.find((c) => c.id === String(over.id))
      if (!targetColumn) return

      const newStatus = targetColumn.dropStatus
      const prev = proposals

      setLocalProposals(prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)))

      try {
        const token = (session as { accessToken?: string } | null)?.accessToken
        if (!token) throw new Error('No token')
        const octokit = createOctokit(token)
        const target = prev.find((i) => i.id === itemId)
        if (!target?.visualize) throw new Error('No visualize path')
        await updateVisualizeJson(octokit, dragRepo ?? repo, target.visualize, { status: newStatus })
      } catch {
        setLocalProposals(null)
        setStatusToast('Failed to update status. Check branch protection settings.')
        setTimeout(() => setStatusToast(null), 4000)
      }
    },
    [session, proposals, repo],
  )

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Filter toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card flex-wrap">
        <FilterIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {CHANGE_FILTER_STATUSES.map((status) => {
            const count = statusCounts.get(status) ?? 0
            const active = selectedStatuses.includes(status)
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span className="capitalize">{status}</span>
                <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="relative ml-2">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search proposals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-border rounded-md pl-7 pr-2 py-1 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 w-48 transition-colors"
          />
        </div>

        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <PackageIcon className="w-3.5 h-3.5" />
          {filtered.length} proposals
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pt-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 px-4 pb-4 min-w-max">
            {CHANGE_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                statuses={col.statuses}
                items={filtered
                  .filter((i) => col.statuses.includes(i.status))
                  .map((item) => ({ item, repo }))}
                renderCard={(ki) => (
                  <SortableProposalCard
                    key={`${ki.repo}:${ki.item.id}`}
                    item={ki.item}
                    repo={ki.repo ?? repo}
                    onClick={() => openItem(ki.item, ki.repo ?? repo)}
                    selected={selectedItem?.item.id === ki.item.id}
                  />
                )}
                emptyText="No proposals"
              />
            ))}
          </div>
        </DndContext>
      </div>

      {statusToast && (
        <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-md shadow-md z-50">
          {statusToast}
        </div>
      )}

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
