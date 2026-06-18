import type { SpecStatus, IndexItem } from '@specstat/types'

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

export const SPEC_FILTER_STATUSES: SpecStatus[] = [
  'draft', 'in-progress', 'implemented',
]

// ─── Proposal (change track) buckets ──────────────────────────────────────────
// Derived from task progress + archive state rather than the raw status field:
//   draft       — no task implemented yet
//   in-progress — some tasks implemented, but not all
//   in-review   — all tasks implemented, not archived yet
//   archived    — item lives in the archive folder
export type ProposalBucketId = 'draft' | 'in-progress' | 'in-review' | 'archived'

export interface ProposalBucketDef {
  id: ProposalBucketId
  label: string
}

export const PROPOSAL_BUCKETS: ProposalBucketDef[] = [
  { id: 'draft',       label: 'Draft' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review',   label: 'In Review' },
  { id: 'archived',    label: 'Archived' },
]

export function proposalBucket(item: IndexItem): ProposalBucketId {
  if (item.archived) return 'archived'
  const total = item.tasks?.total ?? 0
  const done = item.tasks?.done ?? 0
  if (total > 0 && done >= total) return 'in-review'
  if (done > 0) return 'in-progress'
  return 'draft'
}
