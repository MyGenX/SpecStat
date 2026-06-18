# @specstat/openspec-parser

Pure parsing and validation for OpenSpec / `visualize.json` files, used by both
the [web app](../../apps/web/README.md) and the
[GitHub Action](../../packages/openspec-action/README.md). No I/O — it operates on
strings and objects, so it runs identically in the browser and in Node.

Depends only on [`@specstat/types`](../types/README.md) and `zod`.

## Exports

### Manifest & metadata

| Export | Purpose |
| --- | --- |
| `parseIndex` / `safeParseIndex` | Parse `openspec/index.json`. |
| `parseItem` / `safeParseItem` | Parse an item's `visualize.json`. |
| `parseFolder` / `safeParseFolder` | Parse a folder's `visualize.json`. |

### Spec markdown

| Export | Purpose |
| --- | --- |
| `parseSpecMarkdown` | Parse a spec into requirements & scenarios (`ParsedSpec`, `SpecRequirement`, `SpecScenario`, `SpecScenarioStep`). |
| `parseDeltaSpec` | Parse a delta/change spec (`ParsedDeltaSpec`, `DeltaRequirement`, `DeltaOp`, `SpecRename`). |
| `mergeSpecWithDeltas` | Merge deltas onto a base spec (`MergedSpec`, `RequirementState`, `ScenarioState`). |
| `parseTasks` / `parseTasksFull` | Parse task checklists (`ParsedTasks`, `TaskItem`, `TaskSection`, `TaskProgress`). |
| `parseSections` | Generic markdown section parser (`ParsedSections`, `MarkdownSection`). |

### Graph & classification

| Export | Purpose |
| --- | --- |
| `buildGraph` | Build nodes/edges from item relations. |
| `getTransitiveDeps` | Resolve transitive dependencies for an item. |
| `classifyPath` | Classify an OpenSpec path into a track (`ClassifyResult`, `Track`). |

### Schemas (Zod)

`VisualizeItemSchema`, `VisualizeFolderSchema`, `IndexJsonSchema`,
`SpecStatusSchema`, `SpecTypeSchema`, `PrioritySchema`, plus the inferred types
`VisualizeItemInferred`, `VisualizeFolderInferred`, `IndexJsonInferred`.

## Usage

```ts
import { parseIndex, parseSpecMarkdown, buildGraph } from '@specstat/openspec-parser'

const index = parseIndex(indexJsonString)
const spec = parseSpecMarkdown(markdownString)
const { nodes, edges } = buildGraph(index.items)
```

Use the `safeParse*` variants when input may be invalid — they return a result
object instead of throwing.
