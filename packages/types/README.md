# @specstat/types

Shared TypeScript domain model for [SpecStat](../../README.md). Zero runtime
dependencies — pure type declarations consumed by every other package.

## Exports

All types are exported from `src/index.ts`.

### Enums

| Type | Values |
| --- | --- |
| `SpecStatus` | `draft` · `in-progress` · `in-review` · `approved` · `implemented` · `deprecated` · `archived` |
| `SpecType` | `spec` · `impl` · `task` · `design` · `proposal` · `decision` · `component` · `domain` |
| `Priority` | `high` · `medium` · `low` |
| `DefaultView` | `board` · `tree` · `graph` · `timeline` |
| `Track` | `spec` · `change` |

### `visualize.json` shapes

The per-item metadata file SpecStat generates alongside each spec.

- **`VisualizeItem`** — a single spec item (`id`, `title`, `spec_type`, `status`, `priority`, `owner`, `tasks`, `requirement_count`, `scenario_count`, …) plus nested:
  - `VisualizeItemCard` — card display (`color`, `icon`, `cover_image`, `summary`)
  - `VisualizeItemRelations` — `relates_to`, `depends_on`, `implements`, `linked_tasks`, `linked_designs`, `supersedes`, `superseded_by`
  - `VisualizeItemGithub` — `labels`, `linked_pr`, `linked_issue`, `milestone`
  - `VisualizeItemBoard` — `column`, `position`, `swimlane`
  - `VisualizeItemTriggers` — `on_status_change`, `on_approve`
- **`VisualizeFolder`** — folder metadata (`label`, `description`, `icon`, `default_view`, `owners`, `item_count`, …)
- `TaskProgress` (`total`, `done`) · `ChangeDocs` (`proposal`, `design`, `tasks`)

### `index.json` manifest

The root manifest read first when loading a repo.

- **`IndexJson`** — `{ meta, folders, items }`
- `IndexMeta` — `repo`, `repo_type`, `generated_at`, `openspec_version`, `visualizer_version`, `root`
- `IndexFolder`, `IndexItem` — lightweight folder/item entries

### App-level types

`WorkspaceRepo`, `CommitInfo`, `GraphNode`, `GraphEdge`.

## Usage

```ts
import type { VisualizeItem, IndexJson, SpecStatus } from '@specstat/types'
```
