'use client'

import { useState, useMemo } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { SpecStoryCard } from '@/components/stories/SpecStoryCard'
import { SearchIcon, FilterIcon, PackageIcon, FileTextIcon } from '@/components/shared/Icons'
import { SPEC_FILTER_STATUSES } from '@/lib/kanban'
import type { IndexItem, SpecStatus } from '@specstat/types'

// ─── Date grouping ──────────────────────────────────────────────────────────────

function dayLabel(dateStr: string): string {
  const d = dateStr.slice(0, 10)
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10)
  if (d === todayStr) return 'Today'
  if (d === yesterdayStr) return 'Yesterday'
  const dt = new Date(`${d}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return d || 'Undated'
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoriesPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)

  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<SpecStatus[]>([])
  const [search, setSearch] = useState('')

  const specs = useMemo(
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
    for (const item of specs) {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    }
    return counts
  }, [specs])

  function toggleStatus(status: SpecStatus) {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return specs
      .filter((i) => selectedStatuses.length === 0 || selectedStatuses.includes(i.status))
      .filter(
        (i) =>
          !q || i.id.toLowerCase().includes(q) || (i.title ?? '').toLowerCase().includes(q),
      )
  }, [specs, selectedStatuses, search])

  // Group filtered specs by day (newest first).
  const groups = useMemo(() => {
    const sorted = [...filtered].sort((a, b) =>
      (b.last_updated ?? '').localeCompare(a.last_updated ?? ''),
    )
    const map = new Map<string, IndexItem[]>()
    for (const item of sorted) {
      const day = (item.last_updated ?? '').slice(0, 10)
      const arr = map.get(day)
      if (arr) arr.push(item)
      else map.set(day, [item])
    }
    return [...map.entries()]
  }, [filtered])

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
      {/* Two panes */}
      <div className="relative flex-1 min-h-0 flex bg-background">
          {/* LEFT: story list */}
          <aside className="w-full md:w-96 shrink-0 md:border-r border-border flex flex-col min-h-0">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Stories
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <PackageIcon className="w-3.5 h-3.5" />
                {filtered.length}
              </span>
            </div>

            <div className="px-3 py-2 border-b border-border shrink-0 space-y-2">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search stories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm border border-border rounded-md pl-7 pr-2 py-1 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <FilterIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {SPEC_FILTER_STATUSES.map((status) => {
                  const count = statusCounts.get(status) ?? 0
                  const active = selectedStatuses.includes(status)
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
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
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1 py-4">No stories</p>
              ) : (
                groups.map(([day, items]) => (
                  <div key={day || 'undated'} className="space-y-2">
                    <div className="sticky top-0 z-[1] flex justify-center">
                      <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-3 py-0.5 shadow-sm">
                        {dayLabel(day)}
                      </span>
                    </div>
                    {items.map((item) => (
                      <SpecStoryCard
                        key={item.id}
                        item={item}
                        activeChanges={inChangeMap.get(item.id)}
                        onClick={() => openItem(item)}
                        selected={selectedItem?.item.id === item.id}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* RIGHT: detail / placeholder */}
          <section
            className={`${
              selectedItem ? 'flex' : 'hidden'
            } md:flex flex-1 min-w-0 min-h-0 absolute inset-0 z-20 bg-card md:static md:z-auto`}
          >
            {selectedItem ? (
              <CardDetail
                variant="inline"
                item={selectedItem.item}
                repo={selectedItem.repo}
                onClose={handleClose}
                onNavigate={(item, r) => {
                  if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
                  setSelectedItem({ item, repo: r })
                }}
                breadcrumbs={breadcrumbs}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
                <FileTextIcon className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm">Select a story to view its spec</p>
              </div>
            )}
          </section>
      </div>
    </div>
  )
}
