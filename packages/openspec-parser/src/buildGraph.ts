import type { IndexItem, GraphNode, GraphEdge, VisualizeItemRelations } from '@specstat/types'

const RELATION_KEYS: (keyof VisualizeItemRelations)[] = [
  'relates_to',
  'depends_on',
  'implements',
  'linked_tasks',
  'linked_designs',
  'supersedes',
]

interface RepoItems {
  repo: string
  items: IndexItem[]
}

export function buildGraph(
  repoDataList: RepoItems[],
  relations: Map<string, Partial<VisualizeItemRelations>>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const allItems = new Map<string, { item: IndexItem; repo: string }>()

  for (const { repo, items } of repoDataList) {
    for (const item of items) {
      allItems.set(item.id, { item, repo })
    }
  }

  const nodes: GraphNode[] = []
  let col = 0
  let row = 0
  const COLS = 5
  const X_GAP = 220
  const Y_GAP = 120

  for (const [id, { item, repo }] of allItems) {
    nodes.push({
      id,
      data: { item, repo },
      position: { x: (col % COLS) * X_GAP, y: row * Y_GAP },
    })
    col++
    if (col % COLS === 0) row++
  }

  const edges: GraphEdge[] = []
  const seen = new Set<string>()

  for (const [sourceId, rels] of relations) {
    for (const key of RELATION_KEYS) {
      const targets = rels[key]
      if (!targets) continue
      for (const targetId of targets) {
        const edgeId = `${sourceId}-${String(key)}-${targetId}`
        const reverseId = `${targetId}-relates_to-${sourceId}`
        if (seen.has(edgeId) || (key === 'relates_to' && seen.has(reverseId))) continue
        seen.add(edgeId)

        const targetEntry = allItems.get(targetId)
        if (!targetEntry) {
          nodes.push({
            id: targetId,
            data: { item: { id: targetId, title: targetId } as IndexItem, repo: '__stub__' },
            position: { x: (col % COLS) * X_GAP, y: row * Y_GAP },
          })
          col++
          if (col % COLS === 0) row++
        }

        const sourceEntry = allItems.get(sourceId)
        const sourceRepo = sourceEntry?.repo
        const targetRepo = targetEntry?.repo
        const crossTrack = !!(
          sourceEntry?.item.track &&
          targetEntry?.item.track &&
          sourceEntry.item.track !== targetEntry.item.track
        )
        edges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: key,
          data: {
            crossRepo: !!sourceRepo && !!targetRepo && sourceRepo !== targetRepo,
            crossTrack,
          },
        })
      }
    }
  }

  return { nodes, edges }
}

export function getTransitiveDeps(
  itemId: string,
  relations: Map<string, Partial<VisualizeItemRelations>>,
): Set<string> {
  const visited = new Set<string>()
  const queue = [itemId]
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    const rels = relations.get(current)
    if (!rels) continue
    for (const dep of [...(rels.depends_on ?? []), ...(rels.implements ?? [])]) {
      if (!visited.has(dep)) queue.push(dep)
    }
  }
  visited.delete(itemId)
  return visited
}
