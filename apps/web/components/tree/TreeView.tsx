'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { IndexJson, IndexFolder, IndexItem } from '@specstat/types'

// ─── Internal tree node types ─────────────────────────────────────────────────

interface FolderNode {
  type: 'folder'
  name: string
  path: string
  folder: IndexFolder
  children: TreeNode[]
}

interface ItemNode {
  type: 'item'
  name: string
  path: string
  item: IndexItem
}

type TreeNode = FolderNode | ItemNode

// ─── Build tree from flat index data ─────────────────────────────────────────

function buildTree(index: IndexJson): FolderNode | null {
  const map = new Map<string, FolderNode>()
  for (const f of index.folders) {
    map.set(f.path, {
      type: 'folder',
      name: f.path.split('/').pop() ?? f.path,
      path: f.path,
      folder: f,
      children: [],
    })
  }

  let root: FolderNode | null = null
  for (const [path, node] of map) {
    const parentPath = path.slice(0, path.lastIndexOf('/'))
    const parent = map.get(parentPath)
    if (parent) {
      parent.children.push(node)
    } else {
      root = node
    }
  }

  for (const item of index.items) {
    const parentPath = item.path.slice(0, item.path.lastIndexOf('/'))
    map.get(parentPath)?.children.push({
      type: 'item',
      name: item.id,
      path: item.path,
      item,
    })
  }

  return root
}

// ─── Flatten tree for rendering ───────────────────────────────────────────────

interface FlatRow { node: TreeNode; depth: number }

function flattenNode(node: FolderNode, depth: number, expanded: Set<string>, result: FlatRow[]) {
  result.push({ node, depth })
  if (expanded.has(node.path)) {
    for (const child of node.children) {
      if (child.type === 'folder') {
        flattenNode(child, depth + 1, expanded, result)
      } else {
        result.push({ node: child, depth: depth + 1 })
      }
    }
  }
}

function buildInitialExpanded(node: FolderNode | null): Set<string> {
  if (!node) return new Set()
  const expanded = new Set<string>()
  function walk(n: FolderNode) {
    if (!n.folder.archived) {
      expanded.add(n.path)
      for (const child of n.children) {
        if (child.type === 'folder') walk(child)
      }
    }
  }
  walk(node)
  return expanded
}

// ─── Status dot color ─────────────────────────────────────────────────────────

function statusDotClass(status: string): string {
  switch (status) {
    case 'implemented': return 'bg-green-500'
    case 'approved': return 'bg-blue-500'
    case 'in-progress': return 'bg-amber-500'
    case 'draft': return 'bg-muted-foreground/40'
    case 'archived': return 'bg-muted-foreground/20'
    default: return 'bg-muted-foreground/40'
  }
}

// ─── TreeView component ───────────────────────────────────────────────────────

interface TreeViewProps {
  index: IndexJson
  repo: string
  selectedItemPath?: string
  onItemClick: (item: IndexItem, repo: string) => void
}

export function TreeView({ index, repo, selectedItemPath, onItemClick }: TreeViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')

  const root = useMemo(() => buildTree(index), [index])
  const [expanded, setExpanded] = useState<Set<string>>(() => buildInitialExpanded(root))

  const rows = useMemo((): FlatRow[] => {
    if (!root) return []
    const result: FlatRow[] = []
    flattenNode(root, 0, expanded, result)
    return result
  }, [root, expanded])

  function toggleFolder(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function openBoard(folderPath: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('repo', repo)
    params.set('folder', folderPath)
    router.push(`/proposals?${params.toString()}`)
  }

  // Search mode: show matching items flat with their folder label
  const searchResults = useMemo((): ItemNode[] => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return index.items
      .filter((i) => i.id.toLowerCase().includes(q) || (i.title ?? '').toLowerCase().includes(q))
      .map((item) => ({ type: 'item', name: item.id, path: item.path, item }))
  }, [search, index.items])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b">
        <input
          type="search"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs border rounded px-2 py-1.5 bg-background"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {search.trim() ? (
          // Search results: flat list with folder breadcrumb
          searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No results.</p>
          ) : (
            searchResults.map((node) => {
              const folderPath = node.path.slice(0, node.path.lastIndexOf('/'))
              const folderLabel = folderPath.split('/').slice(-2).join('/')
              const isSelected = node.path === selectedItemPath
              return (
                <button
                  key={node.path}
                  onClick={() => onItemClick(node.item, repo)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-muted/40 transition-colors ${isSelected ? 'bg-muted border-l-2 border-primary' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(node.item.status)}`} />
                    <span className="text-xs font-mono text-muted-foreground truncate w-24 shrink-0">{node.item.id}</span>
                    <span className="text-sm truncate">{node.item.title || node.item.id}</span>
                  </div>
                  <div className="text-xs text-muted-foreground/60 pl-3.5 mt-0.5 truncate">{folderLabel}</div>
                </button>
              )
            })
          )
        ) : (
          // Tree view
          rows.map(({ node, depth }) => {
            const indent = depth * 16
            if (node.type === 'folder') {
              const isOpen = expanded.has(node.path)
              const folderName = node.name
              const count = node.folder.item_count
              return (
                <div key={node.path} className="relative group">
                  {/* Indent guide lines */}
                  {Array.from({ length: depth }, (_, i) => (
                    <span
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-muted/40 pointer-events-none"
                      style={{ left: i * 16 + 8 }}
                    />
                  ))}
                  <button
                    onClick={() => toggleFolder(node.path)}
                    className="flex items-center gap-1.5 w-full py-1 pr-2 rounded hover:bg-muted/40 transition-colors text-left"
                    style={{ paddingLeft: indent + 6 }}
                  >
                    <span
                      className="shrink-0 text-[10px] text-muted-foreground transition-transform duration-150"
                      style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      ▶
                    </span>
                    <span className="text-sm font-medium truncate flex-1 select-none">{folderName}</span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">{count}</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openBoard(node.path) }}
                      className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:underline shrink-0 transition-opacity ml-1"
                    >
                      Board
                    </button>
                  </button>
                </div>
              )
            }

            // Item node
            const isSelected = node.path === selectedItemPath
            return (
              <div key={node.path} className="relative">
                {/* Indent guide lines */}
                {Array.from({ length: depth }, (_, i) => (
                  <span
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-muted/40 pointer-events-none"
                    style={{ left: i * 16 + 8 }}
                  />
                ))}
                <button
                  onClick={() => onItemClick(node.item, repo)}
                  className={`flex items-center gap-2 w-full py-1 pr-2 rounded transition-colors text-left ${
                    isSelected
                      ? 'bg-muted border-l-2 border-primary'
                      : 'hover:bg-muted/40'
                  }`}
                  style={{ paddingLeft: isSelected ? indent + 4 : indent + 6 }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(node.item.status)}`} />
                  <span className="text-xs font-mono text-muted-foreground truncate w-28 shrink-0">{node.item.id}</span>
                  <span className={`text-sm truncate ${node.item.archived ? 'line-through text-muted-foreground' : ''}`}>
                    {node.item.title || node.item.id}
                  </span>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
