'use client'

import { useState, useMemo } from 'react'
import { useActiveRepo, useIndex } from '@/lib/hooks'
import { CardDetail } from '@/components/board/CardDetail'
import { ProposalCard } from '@/components/board/ProposalCard'
import { SearchIcon, FilterIcon, PackageIcon } from '@/components/shared/Icons'
import { PROPOSAL_BUCKETS, proposalBucket, type ProposalBucketId } from '@/lib/kanban'
import type { IndexItem } from '@specstat/types'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)

  const [selectedItem, setSelectedItem] = useState<{ item: IndexItem; repo: string } | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<{ item: IndexItem; repo: string }[]>([])
  const [selectedBuckets, setSelectedBuckets] = useState<ProposalBucketId[]>([])
  const [search, setSearch] = useState('')

  const proposals = useMemo(
    () =>
      (index?.items ?? []).filter(
        (i) => i.track === 'change' || (!i.track && i.path.includes('/changes/')),
      ),
    [index],
  )

  const bucketCounts = useMemo((): Map<ProposalBucketId, number> => {
    const counts = new Map<ProposalBucketId, number>()
    for (const item of proposals) {
      const b = proposalBucket(item)
      counts.set(b, (counts.get(b) ?? 0) + 1)
    }
    return counts
  }, [proposals])

  function toggleBucket(bucket: ProposalBucketId) {
    setSelectedBuckets((prev) =>
      prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket],
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return proposals
      .filter((i) => selectedBuckets.length === 0 || selectedBuckets.includes(proposalBucket(i)))
      .filter((i) =>
        !q || i.id.toLowerCase().includes(q) || (i.title ?? '').toLowerCase().includes(q),
      )
  }, [proposals, selectedBuckets, search])

  function openItem(item: IndexItem, r: string) {
    if (selectedItem) setBreadcrumbs((p) => [...p, selectedItem])
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
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Filter toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-card flex-wrap">
        <FilterIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {PROPOSAL_BUCKETS.map((bucket) => {
            const count = bucketCounts.get(bucket.id) ?? 0
            const active = selectedBuckets.includes(bucket.id)
            return (
              <button
                key={bucket.id}
                onClick={() => toggleBucket(bucket.id)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-muted-foreground/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <span>{bucket.label}</span>
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
        <div className="flex gap-6 px-4 pb-4 min-w-max">
          {PROPOSAL_BUCKETS.map((col) => {
            const items = filtered.filter((i) => proposalBucket(i) === col.id)
            return (
              <div key={col.id} className="flex flex-col w-80 shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 min-h-[200px] rounded-lg p-2 bg-muted/30 dark:bg-muted/20">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <ProposalCard
                        key={`${repo}:${item.id}`}
                        item={item}
                        repo={repo}
                        onClick={() => openItem(item, repo)}
                        selected={selectedItem?.item.id === item.id}
                      />
                    ))}
                  </div>
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 px-1 py-2">No proposals</p>
                  )}
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
