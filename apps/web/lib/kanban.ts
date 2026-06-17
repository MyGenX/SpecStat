import type { SpecStatus } from '@specstat/types'

export interface KanbanColumnDef {
  id: string
  label: string
  statuses: SpecStatus[]
  dropStatus: SpecStatus
}

// Spec track (stories): draft/in-progress → in-review/approved → implemented
export const SPEC_COLUMNS: KanbanColumnDef[] = [
  { id: 'draft',       label: 'Draft',       statuses: ['draft', 'in-progress'], dropStatus: 'draft' },
  { id: 'review',      label: 'Review',      statuses: ['in-review', 'approved'], dropStatus: 'in-review' },
  { id: 'implemented', label: 'Implemented', statuses: ['implemented'],           dropStatus: 'implemented' },
]

// Change track (proposals): draft → in-progress/in-review → approved → done
export const CHANGE_COLUMNS: KanbanColumnDef[] = [
  { id: 'draft',       label: 'Draft',       statuses: ['draft'],                    dropStatus: 'draft' },
  { id: 'in-progress', label: 'In Progress', statuses: ['in-progress', 'in-review'], dropStatus: 'in-progress' },
  { id: 'approved',    label: 'Approved',    statuses: ['approved'],                 dropStatus: 'approved' },
  { id: 'done',        label: 'Done',        statuses: ['implemented', 'archived'],  dropStatus: 'implemented' },
]

export const SPEC_FILTER_STATUSES: SpecStatus[] = [
  'draft', 'in-progress', 'in-review', 'approved', 'implemented',
]

export const CHANGE_FILTER_STATUSES: SpecStatus[] = [
  'draft', 'in-progress', 'in-review', 'approved', 'implemented', 'archived',
]
