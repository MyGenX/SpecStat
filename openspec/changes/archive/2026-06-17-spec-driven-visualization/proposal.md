## Why

SpecStat's index generator assumes every spec folder carries YAML frontmatter (`id/title/status/owner/spec_type`), but real OpenSpec `spec-driven` repositories — including this one and user repos like TypeWall — have **no frontmatter**. Specs are pure markdown (`## Requirements` / `#### Scenario:`), and `changes/` holds a `proposal → design → tasks → archive` lifecycle. The result today: every item collapses to `spec_type: spec, status: draft, owner: ''`, producing a flat, meaningless board that distinguishes nothing. We need SpecStat to visualize what an OpenSpec repo actually contains.

## What Changes

- **Two-track model.** Treat `openspec/specs/*` as **implemented project stories** (the canonical "what is really built") and `openspec/changes/*` as a **lifecycle track** (draft → in-progress → approved → archived).
- **Markdown-native parsing.** Derive items from folder semantics and markdown structure (`# Specification`, `## Requirements`, `#### Scenario:`) instead of requiring frontmatter. **BREAKING** for the index generator's assumptions: frontmatter becomes an optional override, not a requirement.
- **Change lifecycle.** Each change folder becomes one item aggregating its `proposal.md`, `design.md`, `tasks.md`, and delta `specs/`. Status is inferred from location (`changes/` vs `changes/archive/`) plus `tasks.md` checkbox completion.
- **Task progress.** Parse `tasks.md` checkboxes into `{total, done}` so changes show a real completion bar.
- **Relations.** Link a change's delta spec (`changes/<n>/specs/<id>`) to its final spec (`specs/<id>`) so the graph shows which change introduced or modified each capability.
- **New views.** A Stories view for implemented specs and a Changes-lifecycle board, with a detail panel that renders proposal/design/tasks/spec-delta content.

## Capabilities

### New Capabilities
- `stories-view`: Implemented specs from `openspec/specs/*` rendered as canonical project stories — each capability with its parsed Requirements and Scenarios and an `implemented` status.
- `changes-lifecycle-view`: `openspec/changes/*` rendered as a draft→in-progress→approved→archived board; each change surfaces its proposal/design/tasks plus a task-completion progress bar, and its delta specs link back to the final spec.

### Modified Capabilities
- `openspec-action-init`: parse the OpenSpec spec-driven layout natively — distinguish `specs/` vs `changes/<name>/` vs `changes/archive/<name>/`, build items from markdown structure and `tasks.md` rather than frontmatter (frontmatter overrides when present), and infer lifecycle status from folder + task completion.
- `visualize-json-schema`: extend the item/index model with `track` (`spec` | `change`), task progress, requirement/scenario counts, change-document references, and change↔spec relations.

## Impact

- **Action:** `packages/openspec-action/src/init.ts` (walker rewrite).
- **Parser:** `packages/openspec-parser/src/` (new markdown + tasks parsing utilities; `validateSchema.ts` extensions; `buildGraph.ts` relations).
- **Types:** `packages/types/src/index.ts` (new fields on `VisualizeItem`/`IndexItem`/`IndexJson`).
- **Web:** `apps/web` — new Stories and Changes-lifecycle views and detail-panel rendering; reuses `useIndex` (`apps/web/lib/hooks.ts`), board grouping, and `CardDetail`.
- **Backward compatibility:** repos that *do* carry frontmatter keep working — inferred values are overridden by frontmatter when present.
- **Generated data:** new `index.json` will gain fields; the parser must remain tolerant of older indexes missing them.
