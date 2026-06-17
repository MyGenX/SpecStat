'use client'

import { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { buildGraph, getTransitiveDeps } from '@specstat/openspec-parser'
import type { IndexItem, VisualizeItemRelations, SpecType, SpecStatus } from '@specstat/types'
import { GraphNode } from './GraphNode'
import { GraphEdge } from './GraphEdge'

const nodeTypes = { specNode: GraphNode }
const edgeTypes = { specEdge: GraphEdge }

interface GraphViewProps {
  items: IndexItem[]
  repo: string
  relations: Map<string, Partial<VisualizeItemRelations>>
  onNodeClick: (item: IndexItem, repo: string) => void
}

export function GraphView({ items, repo, relations, onNodeClick }: GraphViewProps) {
  const [filterType, setFilterType] = useState<SpecType | ''>('')
  const [filterStatus, setFilterStatus] = useState<SpecStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => buildGraph([{ repo, items }], relations),
    [items, repo, relations],
  )

  const highlightedIds = useMemo(() => {
    if (!selectedId) return new Set<string>()
    return getTransitiveDeps(selectedId, relations)
  }, [selectedId, relations])

  const nodes = rawNodes.map((n) => {
    const item = n.data.item
    const isFiltered =
      (filterType && item.type !== filterType) ||
      (filterStatus && item.status !== filterStatus)
    return {
      ...n,
      type: 'specNode',
      data: {
        ...n.data,
        dimmed: !!isFiltered,
        highlighted: selectedId ? highlightedIds.has(n.id) || n.id === selectedId : false,
      },
    }
  })

  const edges = rawEdges.map((e) => ({
    ...e,
    type: 'specEdge',
    data: { type: e.type },
  }))

  const [rfNodes, , onNodesChange] = useNodesState(nodes)
  const [rfEdges, , onEdgesChange] = useEdgesState(edges)

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setSelectedId(node.id)
      const found = items.find((i) => i.id === node.id)
      if (found) onNodeClick(found, repo)
    },
    [items, repo, onNodeClick],
  )

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-3 left-3 z-10 flex gap-2 bg-card border rounded-md p-2 shadow-sm">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SpecType | '')}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="">All types</option>
          {['spec', 'impl', 'task', 'design', 'proposal', 'decision', 'component', 'domain'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SpecStatus | '')}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="">All statuses</option>
          {['draft', 'in-review', 'approved', 'implemented', 'deprecated', 'archived'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <svg style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
