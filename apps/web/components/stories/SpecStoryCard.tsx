'use client'

import type { IndexItem } from '@specstat/types'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface SpecStoryCardProps {
  item: IndexItem
  activeChanges?: string[]
  onClick: () => void
  selected?: boolean
}

export function SpecStoryCard({ item, activeChanges, onClick, selected }: SpecStoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
        selected
          ? 'bg-muted border-primary shadow-sm'
          : 'bg-card hover:bg-muted/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground leading-none pt-0.5 truncate">
          {item.id}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <div className="font-medium text-sm leading-snug">{item.title || item.id}</div>

      {(item.requirement_count != null || item.scenario_count != null) && (
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          {item.requirement_count != null && (
            <span>{item.requirement_count} req{item.requirement_count !== 1 ? 's' : ''}</span>
          )}
          {item.requirement_count != null && item.scenario_count != null && (
            <span className="text-muted-foreground/40">·</span>
          )}
          {item.scenario_count != null && (
            <span>{item.scenario_count} scenario{item.scenario_count !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {activeChanges && activeChanges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {activeChanges.map((changeName) => (
            <span
              key={changeName}
              className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded"
            >
              ✦ {changeName}
            </span>
          ))}
        </div>
      )}

      {item.last_updated && (
        <div className="text-right mt-2 text-xs text-muted-foreground/60">
          {item.last_updated.slice(0, 10)}
        </div>
      )}
    </button>
  )
}
