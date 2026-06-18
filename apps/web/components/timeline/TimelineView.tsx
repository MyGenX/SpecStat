'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import type { IndexItem, CommitInfo } from '@specstat/types'
import { useCommitHistory } from '@/lib/hooks'
import { cn } from '@/lib/cn'

interface TimelineEvent {
  itemId: string
  itemTitle: string
  commit: CommitInfo
  repo: string
}

interface BaselineMarker {
  name: string
  date: string
}

type SortDir = 'newest' | 'oldest'

type Row =
  | { kind: 'header'; label: string; date: string }
  | {
      kind: 'event'
      event: TimelineEvent
      side: 'left' | 'right'
      prGroupStart: boolean
      baseline?: BaselineMarker
    }

function ItemTimeline({ item, repo, onEvents }: {
  item: IndexItem
  repo: string
  onEvents: (itemId: string, events: TimelineEvent[]) => void
}) {
  const { data: commits } = useCommitHistory(repo, item.spec_file)
  useEffect(() => {
    if (commits) {
      onEvents(item.id, commits.map((c) => ({ itemId: item.id, itemTitle: item.title, commit: c, repo })))
    }
  }, [commits, item.id, item.title, repo, onEvents])
  return null
}

function dayLabel(dateStr: string): string {
  const d = dateStr.slice(0, 10)
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10)
  if (d === todayStr) return 'Today'
  if (d === yesterdayStr) return 'Yesterday'
  const dt = new Date(`${d}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function ArrowIcon({ dir, className }: { dir: 'up' | 'down'; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('w-3.5 h-3.5', className)} aria-hidden>
      {dir === 'up' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0 6-6m-6 6-6-6" />
      )}
    </svg>
  )
}

function PrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('w-3.5 h-3.5', className)} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v12m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm12 6v6m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 0V9a3 3 0 0 0-3-3h-3l2 2m0-4-2 2" />
    </svg>
  )
}

function Avatar({ event }: { event: TimelineEvent }) {
  if (event.commit.authorAvatar) {
    return (
      <img
        src={event.commit.authorAvatar}
        alt={event.commit.author}
        className="w-9 h-9 rounded-full ring-2 ring-background shadow-sm"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-muted ring-2 ring-background shadow-sm flex items-center justify-center text-xs font-bold text-muted-foreground">
      {event.commit.author[0]?.toUpperCase()}
    </div>
  )
}

function EventCard({ row, repo, expanded, onToggle, sideClass }: {
  row: Extract<Row, { kind: 'event' }>
  repo: string
  expanded: boolean
  onToggle: () => void
  sideClass?: string
}) {
  const { event, prGroupStart } = row
  const { commit } = event
  const prUrl = commit.prNumber ? `https://github.com/${repo}/pull/${commit.prNumber}` : undefined
  const firstLine = commit.message.split('\n')[0]

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'group cursor-pointer rounded-lg border border-border bg-card text-left shadow-sm',
        'transition-[box-shadow,border-color,background-color] duration-200 motion-reduce:transition-none',
        'hover:shadow-md hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        'md:max-w-md w-full',
        commit.prNumber && 'border-l-2 border-l-primary/60',
        sideClass,
      )}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-medium text-primary">{event.itemId}</span>
          <span className="text-xs text-muted-foreground">{commit.date.slice(0, 10)}</span>
          {row.baseline && (
            <span className="text-[10px] font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              {row.baseline.name}
            </span>
          )}
          {commit.prNumber && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors"
            >
              <PrIcon />
              PR #{commit.prNumber}
              {!prGroupStart && <span className="text-muted-foreground">· same PR</span>}
            </a>
          )}
        </div>

        <div className={cn('text-sm mt-1 text-foreground', !expanded && 'line-clamp-2')}>
          {expanded ? <span className="whitespace-pre-wrap">{commit.message}</span> : firstLine}
        </div>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{commit.author}</span>
          <span className="font-mono text-[10px] opacity-70">{commit.shortSha}</span>
        </div>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground space-y-0.5">
            <div>Full SHA: <span className="font-mono">{commit.sha}</span></div>
            <div>Committed: {new Date(commit.date).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  )
}

interface TimelineViewProps {
  items: IndexItem[]
  repo: string
  baselines?: BaselineMarker[]
}

export function TimelineView({ items, repo, baselines = [] }: TimelineViewProps) {
  const [allEvents, setAllEvents] = useState<Map<string, TimelineEvent[]>>(new Map())
  const [filterItemId, setFilterItemId] = useState('')
  const [filterFolder, setFilterFolder] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('newest')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [atTop, setAtTop] = useState(true)
  const [atBottom, setAtBottom] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const handleItemEvents = useCallback((itemId: string, events: TimelineEvent[]) => {
    setAllEvents((prev) => new Map(prev).set(itemId, events))
  }, [])

  const filteredItems = items
    .filter((i) => !filterItemId || i.id === filterItemId)
    .filter((i) => !filterFolder || i.path.startsWith(filterFolder))

  const flatEvents = useMemo(() => {
    const all: TimelineEvent[] = []
    for (const [, events] of allEvents) all.push(...events)
    return all.sort((a, b) =>
      sortDir === 'newest'
        ? b.commit.date.localeCompare(a.commit.date)
        : a.commit.date.localeCompare(b.commit.date),
    )
  }, [allEvents, sortDir])

  const displayedEvents = useMemo(
    () => flatEvents.filter((e) => filteredItems.some((i) => i.id === e.itemId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatEvents, filterItemId, filterFolder, items],
  )

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    let lastDay = ''
    let lastPr: number | undefined
    let eventIndex = 0
    for (const event of displayedEvents) {
      const day = event.commit.date.slice(0, 10)
      if (day !== lastDay) {
        result.push({ kind: 'header', label: dayLabel(event.commit.date), date: day })
        lastDay = day
        lastPr = undefined
      }
      const prGroupStart = !event.commit.prNumber || event.commit.prNumber !== lastPr
      const baseline = baselines.find((b) => b.date.slice(0, 10) === day)
      result.push({
        kind: 'event',
        event,
        side: eventIndex % 2 === 0 ? 'left' : 'right',
        prGroupStart,
        baseline: prGroupStart ? baseline : undefined,
      })
      lastPr = event.commit.prNumber
      eventIndex += 1
    }
    return result
  }, [displayedEvents, baselines])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 104,
    overscan: 6,
  })

  const onScroll = useCallback(() => {
    const el = parentRef.current
    if (!el) return
    setAtTop(el.scrollTop <= 8)
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8)
  }, [])

  const toggleExpanded = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const topLabel = sortDir === 'newest' ? 'Newest' : 'Oldest'
  const bottomLabel = sortDir === 'newest' ? 'Oldest' : 'Newest'

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-card shrink-0">
        <input
          aria-label="Filter by item ID"
          className="text-sm border border-border rounded-md px-2 py-1 w-40 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
          placeholder="Filter by item ID"
          value={filterItemId}
          onChange={(e) => setFilterItemId(e.target.value)}
        />
        <input
          aria-label="Filter by folder path"
          className="text-sm border border-border rounded-md px-2 py-1 w-52 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
          placeholder="Filter by folder path"
          value={filterFolder}
          onChange={(e) => setFilterFolder(e.target.value)}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{displayedEvents.length} commits</span>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === 'newest' ? 'oldest' : 'newest'))}
            aria-label={`Sort ${sortDir === 'newest' ? 'oldest' : 'newest'} first`}
            className="inline-flex items-center gap-1.5 text-sm cursor-pointer border border-border rounded-md px-2.5 py-1 bg-background text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 transition-colors"
          >
            <ArrowIcon dir={sortDir === 'newest' ? 'down' : 'up'} />
            {sortDir === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </div>

      {/* Hidden data loaders */}
      {filteredItems.map((item) => (
        <ItemTimeline key={item.id} item={item} repo={repo} onEvents={handleItemEvents} />
      ))}

      {/* Timeline body */}
      <div className="relative flex-1 min-h-0">
        {/* Direction caps */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-1.5 bg-gradient-to-b from-background via-background/80 to-transparent pb-5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/80 backdrop-blur rounded-full px-2.5 py-0.5">
            <ArrowIcon dir="up" className="w-3 h-3" />
            {topLabel}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-1.5 bg-gradient-to-t from-background via-background/80 to-transparent pt-5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/80 backdrop-blur rounded-full px-2.5 py-0.5">
            <ArrowIcon dir="down" className="w-3 h-3" />
            {bottomLabel}
          </span>
        </div>

        <div ref={parentRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto px-4 pt-8 pb-10">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {/* Central spine */}
            <div className="absolute top-0 bottom-0 left-[18px] md:left-1/2 w-px -translate-x-1/2 bg-border" aria-hidden />

            {virtualizer.getVirtualItems().map((vItem) => {
              const row = rows[vItem.index]
              if (!row) return null

              if (row.kind === 'header') {
                return (
                  <div
                    key={vItem.key}
                    data-index={vItem.index}
                    ref={virtualizer.measureElement}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vItem.start}px)` }}
                    className="flex justify-center py-2"
                  >
                    <span className="relative z-[1] inline-flex items-center text-xs font-medium text-muted-foreground bg-muted rounded-full px-3 py-1 shadow-sm">
                      {row.label}
                    </span>
                  </div>
                )
              }

              const key = `${row.event.itemId}:${row.event.commit.sha}`
              const isExpanded = expanded.has(key)
              const card = (
                <EventCard
                  row={row}
                  repo={repo}
                  expanded={isExpanded}
                  onToggle={() => toggleExpanded(key)}
                />
              )

              return (
                <div
                  key={vItem.key}
                  data-index={vItem.index}
                  ref={virtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vItem.start}px)` }}
                  className="flex items-start gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 pb-5"
                >
                  {/* Left cell (desktop) */}
                  <div className="hidden md:flex md:justify-end md:order-1">
                    {row.side === 'left' && card}
                  </div>

                  {/* Spine dot */}
                  <div className="shrink-0 flex justify-center md:order-2 z-[1] pt-1">
                    <Avatar event={row.event} />
                  </div>

                  {/* Main cell (mobile always; desktop when side right) */}
                  <div
                    className={cn(
                      'flex-1 min-w-0 md:order-3 md:flex md:justify-start',
                      row.side === 'left' && 'md:hidden',
                    )}
                  >
                    {card}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Jump buttons */}
        <div className="absolute bottom-8 right-4 z-20 flex flex-col gap-2">
          {!atTop && (
            <button
              type="button"
              aria-label={`Jump to ${topLabel.toLowerCase()}`}
              onClick={() => virtualizer.scrollToIndex(0, { align: 'start' })}
              className="w-9 h-9 cursor-pointer rounded-full border border-border bg-card shadow-md flex items-center justify-center text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 transition-colors"
            >
              <ArrowIcon dir="up" className="w-4 h-4" />
            </button>
          )}
          {!atBottom && rows.length > 0 && (
            <button
              type="button"
              aria-label={`Jump to ${bottomLabel.toLowerCase()}`}
              onClick={() => virtualizer.scrollToIndex(rows.length - 1, { align: 'end' })}
              className="w-9 h-9 cursor-pointer rounded-full border border-border bg-card shadow-md flex items-center justify-center text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 transition-colors"
            >
              <ArrowIcon dir="down" className="w-4 h-4" />
            </button>
          )}
        </div>

        {displayedEvents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No commits to show.
          </div>
        )}
      </div>
    </div>
  )
}
