export type SpecStatus =
  | 'draft'
  | 'in-review'
  | 'approved'
  | 'implemented'
  | 'deprecated'
  | 'archived'

export type SpecType =
  | 'spec'
  | 'impl'
  | 'task'
  | 'design'
  | 'proposal'
  | 'decision'
  | 'component'
  | 'domain'

export type Priority = 'high' | 'medium' | 'low'

export type DefaultView = 'board' | 'tree' | 'graph' | 'timeline'

export interface VisualizeItemCard {
  color?: string | null
  icon?: string | null
  cover_image?: string | null
  summary?: string | null
}

export interface VisualizeItemRelations {
  relates_to?: string[]
  depends_on?: string[]
  implements?: string[]
  linked_tasks?: string[]
  linked_designs?: string[]
  supersedes?: string[]
  superseded_by?: string | null
}

export interface VisualizeItemGithub {
  labels?: string[]
  linked_pr?: number | null
  linked_issue?: number | null
  milestone?: string | null
}

export interface VisualizeItemBoard {
  column?: string
  position?: number
  swimlane?: string
}

export interface VisualizeItemTriggers {
  on_status_change?: string
  on_approve?: string
}

export type Track = 'spec' | 'change'

export interface TaskProgress {
  total: number
  done: number
}

export interface ChangeDocs {
  proposal?: string
  design?: string
  tasks?: string
}

export interface VisualizeItem {
  type: 'item'
  id: string
  title: string
  spec_type: SpecType
  status: SpecStatus
  priority?: Priority | null
  owner?: string
  contributors?: string[]
  version?: string
  tags?: string[]
  archived?: boolean
  spec_file: string
  created_at: string
  last_updated: string
  last_commit?: string
  track?: Track
  tasks?: TaskProgress
  requirement_count?: number
  scenario_count?: number
  docs?: ChangeDocs
  card?: VisualizeItemCard
  relations?: VisualizeItemRelations
  github?: VisualizeItemGithub
  board?: VisualizeItemBoard
  triggers?: VisualizeItemTriggers
}

export interface VisualizeFolder {
  type: 'folder'
  label: string
  description?: string
  icon?: string
  color?: string
  archived?: boolean
  default_view?: DefaultView
  default_group_by?: string
  owners?: string[]
  tags?: string[]
  item_count?: number
}

export interface IndexMeta {
  repo: string
  repo_type?: 'mixed' | 'spec-only'
  generated_at: string
  openspec_version: string
  visualizer_version?: string
  root: string
}

export interface IndexFolder {
  path: string
  type: string
  archived: boolean
  item_count: number
  visualize: string
}

export interface IndexItem {
  id: string
  title: string
  type: SpecType
  status: SpecStatus
  path: string
  spec_file: string
  visualize: string
  archived: boolean
  last_updated: string
  last_commit?: string
  track?: Track
  tasks?: TaskProgress
  requirement_count?: number
  scenario_count?: number
  docs?: ChangeDocs
  relations?: VisualizeItemRelations
}

export interface IndexJson {
  meta: IndexMeta
  folders: IndexFolder[]
  items: IndexItem[]
}

export interface WorkspaceRepo {
  repo: string
  alias?: string
}

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  author: string
  authorAvatar?: string
  date: string
  prNumber?: number
}

export interface GraphNode {
  id: string
  data: {
    item: IndexItem
    repo?: string
  }
  position: { x: number; y: number }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: keyof VisualizeItemRelations
  data?: {
    crossRepo?: boolean
    crossTrack?: boolean
  }
}
