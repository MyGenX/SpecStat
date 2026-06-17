## Context

SpecStat's index generator (`packages/openspec-action/src/init.ts`) globs `${root}/**/*.md`, groups files by parent directory, and reads YAML frontmatter (`id/title/status/owner/spec_type`) to emit one `visualize.json` per folder plus a root `index.json`. The web app (`apps/web`) consumes `index.json` via `useIndex` (`apps/web/lib/hooks.ts`) and renders board/tree/graph/timeline views that filter only on a single boolean `archived` flag.

The official OpenSpec `spec-driven` schema — used by the `openspec` CLI (v1.4.1) in this repo and in user repos — has a different shape entirely:

- `openspec/specs/<id>/spec.md` — **no frontmatter**; `# <id> Specification` → `## Purpose` → `## Requirements` → `### Requirement:` → `#### Scenario:` (WHEN/THEN). These are implemented capabilities.
- `openspec/changes/<name>/` — `proposal.md`, `design.md`, `tasks.md`, `.openspec.yaml` (`schema`, `created`), and `specs/<id>/spec.md` deltas marked `## ADDED|MODIFIED Requirements`.
- `openspec/changes/archive/<name>/` — completed changes, same shape; a change's delta specs are the source clones of what later lands in `specs/`.

Because the current parser requires frontmatter that does not exist, every item degrades to `spec_type: spec, status: draft, owner: ''`, and folder semantics are ignored. The data model has no notion of spec-vs-change, lifecycle, or task progress.

## Goals / Non-Goals

**Goals:**
- Parse the OpenSpec spec-driven layout natively, classifying items into a `spec` track (implemented stories) and a `change` track (lifecycle).
- Infer lifecycle status from folder location + `tasks.md` completion; surface task progress.
- Parse markdown structure (Requirements/Scenarios, checkbox tasks) instead of relying on frontmatter; let frontmatter override when present.
- Link change delta specs to their implemented spec for the graph.
- Add Stories and Changes-lifecycle web views plus a detail panel for change documents, reusing existing data-fetch and board infrastructure.

**Non-Goals:**
- Editing OpenSpec files from the UI (board drag-drop status writes stay as-is for frontmatter repos; spec-driven status is derived, not user-set).
- Full markdown AST/rich rendering beyond requirement/scenario/task extraction and standard markdown display.
- Changing the `openspec` CLI or the on-disk OpenSpec conventions.
- Multi-repo workspace changes beyond carrying the new fields through.

## Decisions

### D1: Classify by folder path, not frontmatter
Walk `${root}` and route by the first path segment under root: `specs/*` → spec-track items; `changes/<name>/` → change-track items; `changes/archive/<name>/` → archived change items. The literal `archive` directory is a container, not a change.

**Alternatives considered:** require a `track` frontmatter field (rejected — real specs have no frontmatter); infer from file names only (rejected — ambiguous).
**Rationale:** the spec-driven layout encodes intent in folder structure; it is the most reliable signal and matches the user's mental model (specs = built, changes = lifecycle).

### D2: A change folder is one item, not many
Each `changes/<name>/` becomes a single `change`-track item aggregating `proposal.md` + `design.md` + `tasks.md` + delta `specs/`. Document paths are stored under a `docs` field; delta specs are stored as relations/children.

**Alternatives considered:** one item per markdown file (rejected — produces noise, breaks the lifecycle mental model).
**Rationale:** users reason about a change as one unit moving through the pipeline.

### D3: Lifecycle status inference (folder + task completion)
- Under `changes/archive/` → `archived` (and `archived: true`).
- Active change, `tasks.md` 0 done → `draft`.
- Active change, some done → `in-progress`.
- Active change, all done → `approved`.
- Under `specs/` → `implemented`.

Task counts come from parsing `- [ ]` / `- [x]` lines in `tasks.md` into `{ total, done }`.

**Alternatives considered:** folder-only status (simpler but loses in-progress signal); explicit status frontmatter (absent in real data).
**Rationale:** the user explicitly chose folder + task completion; it yields a meaningful board without requiring authors to maintain status by hand.

### D4: Markdown parsing utilities in `packages/openspec-parser`
Add small, pure helpers: `parseSpecMarkdown(md)` → `{ title, purpose, requirements: [{ title, scenarios: [...] }] }` and `requirement_count`/`scenario_count`; `parseTasks(md)` → `{ total, done, sections? }`. Reuse `gray-matter` (already a dependency) only to strip optional frontmatter when present.

**Rationale:** keeps parsing logic testable and shared between the action and any server-side consumers; avoids a heavy markdown AST dependency — heading and checkbox regex over lines is sufficient and predictable.

### D5: Backward-compatible schema extension
Extend `VisualizeItem`/`IndexItem` with optional fields: `track: 'spec' | 'change'`, `tasks?: { total: number; done: number }`, `requirement_count?`, `scenario_count?`, `docs?: { proposal?, design?, tasks? }`. Make `owner` optional. The Zod schemas in `packages/openspec-parser/src/validateSchema.ts` treat all new fields as optional so older `index.json` files still parse.

**Rationale:** non-breaking for existing frontmatter repos and previously generated indexes; the web app guards on presence.

### D6: Reuse existing view infrastructure
The Changes-lifecycle board reuses the board grouping pattern (`apps/web/app/board/page.tsx`, `components/board/`) with lifecycle columns and a task-progress bar on the card. The Stories view reuses the tree/list + `CardDetail` pattern, filtered to `track === 'spec'`. `CardDetail` (`apps/web/components/board/CardDetail.tsx`) is extended to render change documents (proposal/design/tasks) when `track === 'change'`. `useIndex` is unchanged; new fields flow through automatically.

**Rationale:** minimize new surface area; the existing components already group, filter, and render markdown.

### D7: Relations between delta specs and implemented specs
During init, when a change defines `changes/<name>/specs/<id>/` and `specs/<id>/` exists, emit a relation (`implements`/`relates_to`) from the change item to the spec story. `buildGraph.ts` renders these as cross-track edges.

**Rationale:** answers "which change introduced/modified this capability?" — a primary user question.

## Risks / Trade-offs

- **Markdown heading/checkbox parsing is regex-based** → Mitigation: anchor on the documented OpenSpec conventions (`### Requirement:`, `#### Scenario:`, `- [ ]`), unit-test against the real files in this repo's `openspec/`, and degrade gracefully (missing sections → undefined, never throw).
- **Status is derived, so authors can't override it for spec-driven repos** → Mitigation: frontmatter, if present, still overrides; derived status matches the OpenSpec lifecycle authors already follow.
- **Existing frontmatter repos must keep working** → Mitigation: D5 keeps all new fields optional and frontmatter overrides inferred values; add a regression check using a frontmatter fixture.
- **Larger `index.json`** → Mitigation: new per-item fields are small scalars/counts; folder/requirement bodies are not inlined.
- **Two boards (Stories vs Changes) could confuse navigation** → Mitigation: clear top-level nav split; default landing on Stories (the implemented truth).

## Migration Plan

1. Land parser utilities + schema/type extensions (all new fields optional).
2. Rewrite `init.ts` walker; regenerate `index.json` on existing repos via the `init` workflow.
3. Ship web views behind the same routes; older indexes render with new fields absent (guarded).
4. Rollback: revert the action and web changes; previously generated `index.json` files remain parseable because new fields are optional.

## Open Questions

- Should the Stories view also surface "pending" capabilities that exist only as change deltas (not yet in `specs/`), or strictly `specs/` content? (Leaning strictly `specs/` for "what's really implemented," with change deltas visible from the Changes side.)
- Do we want a combined timeline that interleaves spec implementation dates with change archival dates, or keep timeline scoped per track?
