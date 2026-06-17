'use client'

import type { IndexItem } from '@specstat/types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityIndicator } from '@/components/shared/PriorityIndicator'
import { TypeIcon } from '@/components/shared/TypeIcon'
import { OwnerAvatar } from '@/components/shared/OwnerAvatar'
import { TagChipList } from '@/components/shared/TagChip'
import { cn } from '@/lib/cn'

interface SpecCardProps {
  item: IndexItem
  repo?: string
  onClick?: () => void
  isDragging?: boolean
}

export function SpecCard({ item, repo, onClick, isDragging }: SpecCardProps) {
  const repoUrl = `https://github.com/${repo}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'bg-card border border-border/60 rounded-lg p-3 space-y-2 cursor-pointer select-none',
        'shadow-sm hover:shadow-md transition-all duration-200',
        isDragging && 'shadow-lg ring-2 ring-primary/30 opacity-80',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon type={item.type} />
          <span className="text-xs font-mono text-muted-foreground truncate">{item.id}</span>
        </div>
        {repo && (
          <a
            href={`${repoUrl}/tree/main/${item.path}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            aria-label="Open in GitHub"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        )}
      </div>

      <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>

      <StatusBadge status={item.status} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <OwnerAvatar owner={''} />
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{''}</span>
        </div>
        <span className="text-xs text-muted-foreground">{item.last_updated}</span>
      </div>

      {repo && (
        <div className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono w-fit">
          {repo.split('/')[0]}
        </div>
      )}
    </div>
  )
}
