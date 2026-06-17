## 1. Parser utilities (markdown + tasks)

- [x] 1.1 Add `parseSpecMarkdown(md)` in `packages/openspec-parser/src/` returning `{ title, purpose, requirements: [{ title, scenarios }] }` plus `requirement_count`/`scenario_count`, anchored on `# … Specification`, `### Requirement:`, `#### Scenario:`
- [x] 1.2 Add `parseTasks(md)` returning `{ total, done }` by counting `- [ ]` / `- [x]` lines and ignoring non-checkbox lines
- [x] 1.3 Add a `classifyPath(relPath, root)` helper that returns `{ track, archived, changeName? }` for `specs/*`, `changes/<name>/`, and `changes/archive/<name>/`
- [x] 1.4 Unit-test 1.1–1.3 against this repo's real `openspec/specs/*` and `openspec/changes/archive/*` files

## 2. Types & schema extensions

- [x] 2.1 Extend `VisualizeItem`/`IndexItem`/`IndexJson` in `packages/types/src/index.ts` with optional `track`, `tasks {total,done}`, `requirement_count`, `scenario_count`, `docs {proposal?,design?,tasks?}`; make `owner` optional
- [x] 2.2 Mirror the new optional fields in `packages/openspec-parser/src/validateSchema.ts` (all optional, tolerant of older indexes; `repo` non-empty per spec)
- [x] 2.3 Verify `parseIndex` still parses a legacy `index.json` fixture lacking the new fields without error

## 3. Init walker rewrite (spec-driven)

- [x] 3.1 Rewrite `packages/openspec-action/src/init.ts` to classify items via `classifyPath` instead of treating all `.md` folders uniformly
- [x] 3.2 For `specs/*`: emit `track: "spec"`, status `implemented`, populate `requirement_count`/`scenario_count` from `parseSpecMarkdown`
- [x] 3.3 For `changes/<name>/`: emit one `track: "change"` item aggregating `proposal.md`/`design.md`/`tasks.md` into `docs`, with `tasks {total,done}` from `parseTasks`
- [x] 3.4 Implement lifecycle status inference (archive→`archived`; 0 done→`draft`; some→`in-progress`; all→`approved`)
- [x] 3.5 Apply frontmatter override: when present, `id/title/status/owner/spec_type` override inferred values
- [x] 3.6 Emit change→spec relations when `changes/<name>/specs/<id>/` and `specs/<id>/` both exist
- [x] 3.7 Populate `meta.repo` from `GITHUB_REPOSITORY` and regenerate `index.json` shape with the new fields

## 4. Graph relations

- [x] 4.1 Update `packages/openspec-parser/src/buildGraph.ts` to render change→spec cross-track edges from the new relations
- [x] 4.2 Style/label cross-track edges so "which change introduced this capability" is legible

## 5. Stories view (implemented specs)

- [x] 5.1 Add a Stories view in `apps/web` filtered to `track === 'spec'`, reusing list/tree + `CardDetail` patterns
- [x] 5.2 Show per-story requirement/scenario counts and `implemented` status
- [x] 5.3 Render full `spec.md` (Purpose/Requirements/Scenarios) in the detail panel

## 6. Changes-lifecycle view

- [x] 6.1 Add a Changes board grouped into `draft`/`in-progress`/`approved`/`archived` columns, reusing `app/board/page.tsx` + `components/board/` patterns, filtered to `track === 'change'`
- [x] 6.2 Render a task-progress bar (`done/total`, %) on each change card; render no bar when `tasks` absent
- [x] 6.3 Extend `apps/web/components/board/CardDetail.tsx` to render `proposal`/`design`/`tasks` and list delta specs when `track === 'change'`

## 7. Navigation & backward compatibility

- [x] 7.1 Add top-level nav split (Stories / Changes) in `apps/web/components/layout/NavBar.tsx`, defaulting to Stories
- [x] 7.2 Guard all new-field reads in the web app so older indexes (no `track`/`tasks`) still render
- [x] 7.3 Regression-check a frontmatter fixture repo: frontmatter values still override inferred ones end-to-end
- [x] 7.4 Build all packages (`npm run build`) and the web app; manually verify this repo's `openspec/` renders Stories + the archived `2026-06-17-specstat` change with task progress
