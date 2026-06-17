'use client'

import type { IndexItem } from '@specstat/types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CheckIcon } from '@/components/shared/Icons'

interface ProposalCardProps {
  item: IndexItem
  repo?: string
  onClick: () => void
  isDragging?: boolean
  selected?: boolean
}

export function ProposalCard({ item, onClick, isDragging, selected }: ProposalCardProps) {
  const tasks = item.tasks
  const pct = tasks && tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : null

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
        isDragging
          ? 'opacity-50 shadow-lg ring-2 ring-primary/30'
          : selected
          ? 'bg-muted border-primary shadow-sm'
          : 'bg-card border-border/60 hover:bg-muted/40 hover:shadow-md shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground leading-none pt-0.5">{item.id}</span>
        <StatusBadge status={item.status} />
      </div>

      <div className="font-medium text-sm leading-snug">{item.title || item.id}</div>

      {(item.docs?.proposal || item.docs?.design || item.docs?.tasks) && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {item.docs.proposal && (
            <span className="text-xs bg-blue-500/5 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">proposal</span>
          )}
          {item.docs.design && (
            <span className="text-xs bg-purple-500/5 text-purple-700 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded">design</span>
          )}
          {item.docs.tasks && (
            <span className="text-xs bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">tasks</span>
          )}
        </div>
      )}

      {pct !== null && tasks && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <CheckIcon className="w-3 h-3" />
              {tasks.done}/{tasks.total} tasks
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {item.relations?.relates_to && item.relations.relates_to.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1.5 truncate">
          → {item.relations.relates_to.join(', ')}
        </div>
      )}

      {item.last_updated && (
        <div className="text-right mt-2 text-xs text-muted-foreground/70">
          {item.last_updated.slice(0, 10)}
        </div>
      )}
    </button>
  )
}
