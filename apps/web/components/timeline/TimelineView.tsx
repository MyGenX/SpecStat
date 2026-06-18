'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import type { IndexItem, CommitInfo } from '@specstat/types'
import { useCommitHistory } from '@/lib/hooks'

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

interface TimelineViewProps {
  items: IndexItem[]
  repo: string
  baselines?: BaselineMarker[]
}

export function TimelineView({ items, repo, baselines = [] }: TimelineViewProps) {
  const [allEvents, setAllEvents] = useState<Map<string, TimelineEvent[]>>(new Map())
  const [filterItemId, setFilterItemId] = useState('')
  const [filterFolder, setFilterFolder] = useState('')
  const parentRef = useRef<HTMLDivElement>(null)

  const handleItemEvents = useCallback((itemId: string, events: TimelineEvent[]) => {
    setAllEvents((prev) => new Map(prev).set(itemId, events))
  }, [])

  const flatEvents = useMemo(() => {
    const all: TimelineEvent[] = []
    for (const [, events] of allEvents) all.push(...events)
    return all.sort((a, b) => b.commit.date.localeCompare(a.commit.date))
  }, [allEvents])

  const filteredItems = items
    .filter((i) => !filterItemId || i.id === filterItemId)
    .filter((i) => !filterFolder || i.path.startsWith(filterFolder))

  const displayedEvents = flatEvents.filter(
    (e) => filteredItems.some((i) => i.id === e.itemId),
  )

  const virtualizer = useVirtualizer({
    count: displayedEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-3 px-4 py-2 border-b bg-card shrink-0">
        <input
          className="text-sm border border-border rounded-md px-2 py-1 w-40 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
          placeholder="Filter by item ID"
          value={filterItemId}
          onChange={(e) => setFilterItemId(e.target.value)}
        />
        <input
          className="text-sm border border-border rounded-md px-2 py-1 w-52 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
          placeholder="Filter by folder path"
          value={filterFolder}
          onChange={(e) => setFilterFolder(e.target.value)}
        />
      </div>

      {filteredItems.map((item) => (
        <ItemTimeline
          key={item.id}
          item={item}
          repo={repo}
          onEvents={handleItemEvents}
        />
      ))}

      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vItem) => {
            const event = displayedEvents[vItem.index]
            if (!event) return null
            const isBaseline = baselines.find((b) => b.date.slice(0, 10) === event.commit.date.slice(0, 10))
            return (
              <div
                key={vItem.key}
                style={{ position: 'absolute', top: vItem.start, left: 0, right: 0 }}
                className="flex gap-4 pb-4"
              >
                {isBaseline && (
                  <div className="absolute -left-2 inset-y-0 flex items-center">
                    <div className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                      {isBaseline.name}
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  {event.commit.authorAvatar ? (
                    <img src={event.commit.authorAvatar} alt={event.commit.author} className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {event.commit.author[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="w-px flex-1 bg-border mt-1" />
                </div>
                <div className="pb-2 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-primary">{event.itemId}</span>
                    <span className="text-xs text-muted-foreground">{event.commit.date.slice(0, 10)}</span>
                    {event.commit.prNumber && (
                      <a
                        href={`https://github.com/${repo}/pull/${event.commit.prNumber}`}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-primary hover:underline"
                      >
                        PR #{event.commit.prNumber}
                      </a>
                    )}
                  </div>
                  <div className="text-sm mt-0.5">{event.commit.message}</div>
                  <div className="text-xs text-muted-foreground">{event.commit.author}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
