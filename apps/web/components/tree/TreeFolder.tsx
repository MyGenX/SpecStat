'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { IndexFolder, IndexItem } from '@specstat/types'
import { cn } from '@/lib/cn'

interface TreeFolderProps {
  folder: IndexFolder
  items: IndexItem[]
  repo: string
  archived?: boolean
  onItemClick: (item: IndexItem, repo: string) => void
}

export function TreeFolder({ folder, items, repo, archived = false, onItemClick }: TreeFolderProps) {
  const [open, setOpen] = useState(!archived)
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleFolderClick() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('repo', repo)
    params.set('folder', folder.path)
    router.push(`/board?${params.toString()}`)
  }

  const folderName = folder.path.split('/').pop() ?? folder.path

  return (
    <div className={cn('select-none', archived && 'opacity-50')}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1 rounded hover:bg-muted text-left group"
      >
        <span className={cn('text-xs transition-transform', open ? 'rotate-90' : '')}>▶</span>
        <span className="text-sm font-medium truncate flex-1">
          {folderName}
          {folder.item_count > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({folder.item_count})</span>
          )}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleFolderClick() }}
          className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:underline transition-opacity"
        >
          Board
        </button>
      </button>

      {open && (
        <div className="ml-4 space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item, repo)}
              className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted text-left"
            >
              <span className="text-xs font-mono text-muted-foreground truncate w-24 shrink-0">{item.id}</span>
              <span className="text-sm truncate">{item.title}</span>
            </button>
          ))}
          {items.length === 0 && (
            <div className="text-xs text-muted-foreground px-2 py-1">Empty</div>
          )}
        </div>
      )}
    </div>
  )
}
