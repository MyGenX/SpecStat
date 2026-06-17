import { z } from 'zod'

const TrackSchema = z.enum(['spec', 'change']).optional()

const TaskProgressSchema = z.object({
  total: z.number(),
  done: z.number(),
}).optional()

const ChangeDocsSchema = z.object({
  proposal: z.string().optional(),
  design: z.string().optional(),
  tasks: z.string().optional(),
}).optional()

export const SpecStatusSchema = z.enum([
  'draft',
  'in-progress',
  'in-review',
  'approved',
  'implemented',
  'deprecated',
  'archived',
])

export const SpecTypeSchema = z.enum([
  'spec',
  'impl',
  'task',
  'design',
  'proposal',
  'decision',
  'component',
  'domain',
])

export const PrioritySchema = z.enum(['high', 'medium', 'low']).nullable().optional()

export const VisualizeItemSchema = z.object({
  type: z.literal('item'),
  id: z.string().min(1),
  title: z.string().min(1),
  spec_type: SpecTypeSchema,
  status: SpecStatusSchema,
  priority: PrioritySchema,
  owner: z.string().optional(),
  contributors: z.array(z.string()).optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
  spec_file: z.string().min(1),
  created_at: z.string().min(1),
  last_updated: z.string().min(1),
  last_commit: z.string().optional(),
  card: z
    .object({
      color: z.string().nullable().optional(),
      icon: z.string().nullable().optional(),
      cover_image: z.string().nullable().optional(),
      summary: z.string().nullable().optional(),
    })
    .optional(),
  relations: z
    .object({
      relates_to: z.array(z.string()).optional(),
      depends_on: z.array(z.string()).optional(),
      implements: z.array(z.string()).optional(),
      linked_tasks: z.array(z.string()).optional(),
      linked_designs: z.array(z.string()).optional(),
      supersedes: z.array(z.string()).optional(),
      superseded_by: z.string().nullable().optional(),
    })
    .optional(),
  github: z
    .object({
      labels: z.array(z.string()).optional(),
      linked_pr: z.number().nullable().optional(),
      linked_issue: z.number().nullable().optional(),
      milestone: z.string().nullable().optional(),
    })
    .optional(),
  board: z
    .object({
      column: z.string().optional(),
      position: z.number().optional(),
      swimlane: z.string().optional(),
    })
    .optional(),
  triggers: z
    .object({
      on_status_change: z.string().optional(),
      on_approve: z.string().optional(),
    })
    .optional(),
  track: TrackSchema,
  tasks: TaskProgressSchema,
  requirement_count: z.number().optional(),
  scenario_count: z.number().optional(),
  docs: ChangeDocsSchema,
})

export const VisualizeFolderSchema = z.object({
  type: z.literal('folder'),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  archived: z.boolean().optional(),
  default_view: z.enum(['board', 'tree', 'graph', 'timeline']).optional(),
  default_group_by: z.string().optional(),
  owners: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  item_count: z.number().optional(),
})

export const IndexMetaSchema = z.object({
  repo: z.string(),
  repo_type: z.enum(['mixed', 'spec-only']).optional(),
  generated_at: z.string().min(1),
  openspec_version: z.string().min(1),
  visualizer_version: z.string().optional(),
  root: z.string().min(1),
})

export const IndexFolderSchema = z.object({
  path: z.string().min(1),
  type: z.string().min(1),
  archived: z.boolean(),
  item_count: z.number(),
  visualize: z.string().min(1),
})

const RelationsSchema = z.object({
  relates_to: z.array(z.string()).optional(),
  depends_on: z.array(z.string()).optional(),
  implements: z.array(z.string()).optional(),
  linked_tasks: z.array(z.string()).optional(),
  linked_designs: z.array(z.string()).optional(),
  supersedes: z.array(z.string()).optional(),
  superseded_by: z.string().nullable().optional(),
}).optional()

export const IndexItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: SpecTypeSchema,
  status: SpecStatusSchema,
  path: z.string().min(1),
  spec_file: z.string().min(1),
  visualize: z.string().min(1),
  archived: z.boolean(),
  last_updated: z.string().min(1),
  last_commit: z.string().optional(),
  track: TrackSchema,
  tasks: TaskProgressSchema,
  requirement_count: z.number().optional(),
  scenario_count: z.number().optional(),
  docs: ChangeDocsSchema,
  relations: RelationsSchema,
})

export const IndexJsonSchema = z.object({
  meta: IndexMetaSchema,
  folders: z.array(IndexFolderSchema),
  items: z.array(IndexItemSchema),
})

export type VisualizeItemInferred = z.infer<typeof VisualizeItemSchema>
export type VisualizeFolderInferred = z.infer<typeof VisualizeFolderSchema>
export type IndexJsonInferred = z.infer<typeof IndexJsonSchema>
