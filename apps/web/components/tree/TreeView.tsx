'use client'

import { useState } from 'react'
import type { IndexJson, IndexItem } from '@specstat/types'
import { TreeFolder } from './TreeFolder'

interface TreeViewProps {
  index: IndexJson
  repo: string
  onItemClick: (item: IndexItem, repo: string) => void
}

export function TreeView({ index, repo, onItemClick }: TreeViewProps) {
  const [archiveOpen, setArchiveOpen] = useState(false)

  const activeFolders = index.folders.filter((f) => !f.archived)
  const archivedFolders = index.folders.filter((f) => f.archived)

  function itemsInFolder(folderPath: string): IndexItem[] {
    return index.items.filter(
      (item) => item.path.startsWith(folderPath + '/') && !item.path.slice(folderPath.length + 1).includes('/'),
    )
  }

  return (
    <div className="py-2 space-y-0.5">
      {activeFolders.map((folder) => (
        <TreeFolder
          key={folder.path}
          folder={folder}
          items={itemsInFolder(folder.path)}
          repo={repo}
          onItemClick={onItemClick}
        />
      ))}

      {archivedFolders.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className="flex items-center gap-1.5 w-full px-2 py-1 rounded hover:bg-muted text-left opacity-50"
          >
            <span className={`text-xs transition-transform ${archiveOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="text-sm font-medium">Archive</span>
            <span className="text-xs text-muted-foreground ml-1">({archivedFolders.length})</span>
          </button>
          {archiveOpen && (
            <div className="ml-2 mt-1 space-y-0.5">
              {archivedFolders.map((folder) => (
                <TreeFolder
                  key={folder.path}
                  folder={folder}
                  items={itemsInFolder(folder.path)}
                  repo={repo}
                  archived
                  onItemClick={onItemClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
