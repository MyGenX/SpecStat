import { memo } from 'react'
import { BaseEdge, getStraightPath, type EdgeProps } from 'reactflow'
import type { VisualizeItemRelations } from '@specstat/types'

const EDGE_STYLES: Record<keyof VisualizeItemRelations, { stroke: string; strokeDasharray?: string }> = {
  relates_to: { stroke: '#94a3b8', strokeDasharray: '5 3' },
  depends_on: { stroke: '#ef4444' },
  implements: { stroke: '#22c55e' },
  linked_tasks: { stroke: '#3b82f6', strokeDasharray: '2 3' },
  linked_designs: { stroke: '#a855f7', strokeDasharray: '2 3' },
  supersedes: { stroke: '#f97316' },
  superseded_by: { stroke: '#f97316', strokeDasharray: '4 2' },
}

export const GraphEdge = memo(function GraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<{ type: keyof VisualizeItemRelations; crossTrack?: boolean }>) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const style = EDGE_STYLES[data?.type ?? 'relates_to'] ?? EDGE_STYLES.relates_to
  const strokeWidth = data?.crossTrack ? 2 : 1.5
  const strokeDasharray = data?.crossTrack ? '6 3' : style.strokeDasharray

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{ stroke: style.stroke, strokeDasharray, strokeWidth }}
      markerEnd={data?.type !== 'relates_to' ? 'url(#arrow)' : undefined}
    />
  )
})
