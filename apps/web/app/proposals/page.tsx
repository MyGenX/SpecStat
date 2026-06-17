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
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useSession } from 'next-auth/react'
import { createOctokit, updateVisualizeJson } from '@specstat/github-client'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { ProposalCard } from '@/components/board/ProposalCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { IndexItem, SpecStatus } from '@specstat/types'

// ─── Column groups ────────────────────────────────────────────────────────────

interface ColumnGroup {
  id: string
  label: string
  statuses: SpecStatus[]
  dropStatus: SpecStatus
}

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    id: 'draft',
    label: 'Draft',
    statuses: ['draft'],
    dropStatus: 'draft',
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    statuses: ['approved', 'in-progress', 'in-review'],
    dropStatus: 'approved',
  },
  {
    id: 'implemented',
    label: 'Implemented',
    statuses: ['implemented', 'archived'],
    dropStatus: 'implemented',
  },
]

const FILTER_STATUSES: SpecStatus[] = [
  'draft', 'approved', 'in-progress', 'in-review', 'implemented', 'archived',
]

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

// ─── Grouped column ──────────────────────────────────────────────────────────

interface GroupedColumnProps {
  group: ColumnGroup
  items: { item: IndexItem; repo: string }[]
  onCardClick: (item: IndexItem, repo: string) => void
  selectedId?: string
}

function GroupedColumn({ group, items, onCardClick, selectedId }: GroupedColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })
  const cardIds = items.map((i) => `${i.repo}:${i.item.id}`)
  const totalCount = items.length

  return (
    <div className="flex flex-col w-80 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold">{group.label}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {totalCount}
        </span>
      </div>

      {/* Droppable zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-lg p-2 transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/30'
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {group.statuses.map((status) => {
            const statusItems = items.filter((i) => i.item.status === status)
            return (
              <div key={status} className="mb-3 last:mb-0">
                {/* Status sub-divider — shown for multi-status groups */}
                {group.statuses.length > 1 && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">{statusItems.length}</span>
                  </div>
                )}
                <div className="space-y-2">
                  {statusItems.map(({ item, repo }) => (
                    <SortableProposalCard
                      key={`${repo}:${item.id}`}
                      item={item}
                      repo={repo}
                      onClick={() => onCardClick(item, repo)}
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
            <p className="text-xs text-muted-foreground/50 px-1 py-2">No proposals</p>
          )}
        </SortableContext>
      </div>
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
  const [statusToast, setStatusToast] = useState<string | null>(null)

  const allProposals = useMemo(
    () =>
      (index?.items ?? []).filter(
        (i) => i.track === 'change' || (!i.track && i.path.includes('/changes/')),
      ),
    [index],
  )

  const [localProposals, setLocalProposals] = useState<IndexItem[]>([])
  const proposals = localProposals.length > 0 && index ? localProposals : allProposals

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
      const targetGroup = COLUMN_GROUPS.find((g) => g.id === String(over.id))
      if (!targetGroup) return

      const newStatus = targetGroup.dropStatus
      const prev = proposals

      setLocalProposals(
        prev.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        ),
      )

      try {
        const token = (session as { accessToken?: string } | null)?.accessToken
        if (!token) throw new Error('No token')
        const octokit = createOctokit(token)
        const target = prev.find((i) => i.id === itemId)
        if (!target?.visualize) throw new Error('No visualize path')
        await updateVisualizeJson(octokit, dragRepo ?? repo, target.visualize, { status: newStatus })
      } catch {
        setLocalProposals([])
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
                <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <input
          type="search"
          placeholder="Search proposals…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border rounded px-2 py-1 bg-background w-48 ml-2"
        />

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} proposals
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pt-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 px-4 pb-4 min-w-max">
            {COLUMN_GROUPS.map((group) => (
              <GroupedColumn
                key={group.id}
                group={group}
                items={filtered
                  .filter((i) => group.statuses.includes(i.status))
                  .map((item) => ({ item, repo }))}
                onCardClick={openItem}
                selectedId={selectedItem?.item.id}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {statusToast && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md shadow-md z-50">
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
