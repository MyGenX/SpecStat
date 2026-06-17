## 1. Monorepo & Shared Types Setup

- [x] 1.1 Initialize Turborepo monorepo with `apps/web` and `packages/` layout
- [x] 1.2 Create `packages/types` with TypeScript types for `VisualizeItem`, `VisualizeFolder`, `IndexJson`, `WorkspaceRepo`
- [x] 1.3 Create Zod schemas in `packages/openspec-parser/src/validateSchema.ts` covering item and folder `visualize.json` schemas (all status/type enums)
- [x] 1.4 Export generated TypeScript types from Zod schemas
- [x] 1.5 Configure Turborepo pipeline so `web` depends on `packages/*` builds

## 2. GitHub Client Package

- [x] 2.1 Create `packages/github-client/src/githubAuth.ts` — wraps Octokit initialization with user token from next-auth session
- [x] 2.2 Implement `getIndex.ts` — fetches and parses `openspec/index.json` from a given repo
- [x] 2.3 Implement `getItem.ts` — fetches and parses a single item's `visualize.json` by path
- [x] 2.4 Implement `getFileContent.ts` — fetches raw Markdown file content from GitHub raw API
- [x] 2.5 Implement `getCommitHistory.ts` — fetches last N commits for a given file path
- [x] 2.6 Implement `triggerAction.ts` — posts `repository_dispatch` event with payload to trigger GitHub Actions
- [x] 2.7 Implement `updateVisualizeJson.ts` — reads, patches, and commits a single `visualize.json` file via GitHub Contents API
- [x] 2.8 Add error handling for 401 (redirect to sign-in), 403 (permission denied), 404 (file not found) responses

## 3. OpenSpec Parser Package

- [x] 3.1 Implement `parseIndex.ts` — validates and parses `index.json` with Zod, returns typed `IndexJson`
- [x] 3.2 Implement `parseItem.ts` — validates and parses item-level `visualize.json`, returns typed `VisualizeItem`
- [x] 3.3 Implement `parseFolder.ts` — validates and parses folder-level `visualize.json`, returns typed `VisualizeFolder`
- [x] 3.4 Implement `buildGraph.ts` — builds a nodes+edges data structure from an array of `VisualizeItem` objects using the `relations` fields

## 4. GitHub OAuth Authentication

- [x] 4.1 Configure next-auth v5 with GitHub provider in `apps/web/auth.ts`
- [x] 4.2 Wrap app in `SessionProvider` and protect all routes via middleware (`middleware.ts`)
- [x] 4.3 Build sign-in page at `app/login/page.tsx` with GitHub sign-in button
- [x] 4.4 Expose `useSession` hook usage in layout for user avatar/sign-out in header
- [x] 4.5 Implement sign-out action in settings menu

## 5. App Shell & Routing

- [x] 5.1 Build main layout `app/layout.tsx` — top navigation bar (views switcher, repo selector, sign-out), sidebar
- [x] 5.2 Build workspace home `app/page.tsx` — shows connected repos with item counts; redirect to board if single repo
- [x] 5.3 Set up TanStack Query provider wrapping the app
- [x] 5.4 Implement TanStack Query hooks: `useIndex(repo)`, `useItem(repo, path)`, `useFileContent(repo, path)`, `useCommitHistory(repo, path)`
- [x] 5.5 Build repo settings page `app/settings/page.tsx` — add/remove repos, stored in localStorage

## 6. Tree View

- [x] 6.1 Build `components/tree/TreeView.tsx` — renders folder hierarchy from `index.json` folders array
- [x] 6.2 Build `components/tree/TreeFolder.tsx` — expand/collapse folder node with item count badge
- [x] 6.3 Implement archived folders in a separate collapsed "Archive" section at bottom, rendered at reduced opacity
- [x] 6.4 Wire folder click to navigate to board view pre-filtered by folder path
- [x] 6.5 Wire leaf item click to open spec detail panel

## 7. Board View

- [x] 7.1 Build `components/board/BoardView.tsx` — renders columns from grouped items, reads grouping from query param
- [x] 7.2 Build `components/board/BoardColumn.tsx` — column header with count, scrollable card list
- [x] 7.3 Build `components/board/SpecCard.tsx` — card layout per spec (ID badge, title, type icon, status pill, owner, priority, tags, relation count, last updated, GitHub link)
- [x] 7.4 Build shared components: `StatusBadge.tsx`, `PriorityIndicator.tsx`, `TypeIcon.tsx`, `OwnerAvatar.tsx`, `TagChip.tsx`
- [x] 7.5 Integrate dnd-kit — wrap board in `DndContext`, columns as `SortableContext`, enable drag between columns
- [x] 7.6 On card drop: call `updateVisualizeJson` with new status (optimistic update + background commit + rollback on error)
- [x] 7.7 Build grouping selector (by status, owner, type, tag, swimlane, milestone) in board toolbar
- [x] 7.8 Build filter panel — filter by type, owner, tag, priority; hide archived items by default

## 8. Spec Detail Panel

- [x] 8.1 Build `components/board/CardDetail.tsx` — side panel with close button and breadcrumb navigation
- [x] 8.2 Left pane: fetch and render spec Markdown file via `useFileContent` + markdown-it or react-markdown with syntax highlighting
- [x] 8.3 Resolve relative Markdown links to absolute GitHub URLs
- [x] 8.4 Right pane: render all metadata fields from `visualize.json` (status, priority, owner, contributors, tags, dates, version)
- [x] 8.5 Render `relations` fields as clickable links — clicking opens that item's detail panel (push to breadcrumb stack)
- [x] 8.6 Render `github` fields (linked_pr, linked_issue, milestone) as external links to GitHub
- [x] 8.7 Render commit history section using `useCommitHistory`
- [x] 8.8 Render `@visualizer:trigger` directives extracted from spec Markdown in a dedicated section

## 9. Graph View

- [x] 9.1 Build `components/graph/GraphView.tsx` — React Flow canvas with nodes and edges
- [x] 9.2 Build `components/graph/GraphNode.tsx` — custom node rendering (ID, title, type icon, status color)
- [x] 9.3 Build `components/graph/GraphEdge.tsx` — custom edge styles per relation type (dashed grey, solid red, solid green, dotted blue, dotted purple, solid orange)
- [x] 9.4 Use `buildGraph.ts` from openspec-parser to generate React Flow nodes/edges from index items
- [x] 9.5 Implement filter panel (by type, status, owner) — dim unmatched nodes
- [x] 9.6 Implement node selection — highlight direct and transitive `depends_on`/`implements` chains
- [x] 9.7 Node click opens spec detail panel
- [x] 9.8 Add minimap (React Flow built-in)

## 10. Timeline View

- [x] 10.1 Build `components/timeline/TimelineView.tsx` — vertical chronological event list
- [x] 10.2 Fetch commit history per item using `useCommitHistory`; merge and sort events across all items
- [x] 10.3 Render each event with: item ID, commit message, author avatar + username, date, PR link if available
- [x] 10.4 Fetch baseline tags from GitHub Tags API and render as labeled vertical markers on the timeline
- [x] 10.5 Build filter: by item ID and by folder path
- [x] 10.6 Implement virtual scrolling for large timelines (react-virtual or TanStack Virtual)

## 11. Archive View

- [x] 11.1 Build archive view page `app/archive/page.tsx` — lists all items with `archived: true` from index
- [x] 11.2 Render archived items as read-only cards (no drag-and-drop)
- [x] 11.3 Show original folder path on each archived card
- [x] 11.4 Add filter panel: by type, owner, original folder, date archived

## 12. Multi-repo Workspace

- [x] 12.1 Implement workspace state in localStorage: list of `{repo, alias}` entries
- [x] 12.2 Build "Add Repo" flow — input repo name, fetch `index.json`, validate it exists, add to workspace
- [x] 12.3 Show error "No OpenSpec manifest found. Run openspec-init first." for repos without `index.json`
- [x] 12.4 Merge items from all repos into unified lists in all views; add repo badge to each card
- [x] 12.5 Implement repo filter in all views
- [x] 12.6 In `buildGraph.ts`, resolve cross-repo relations by searching all connected repo indexes; render unresolved refs as stub nodes

## 13. openspec-action — Init Mode

- [x] 13.1 Scaffold `packages/openspec-action/` as Node.js action with `action.yml`
- [x] 13.2 Implement `src/init.ts` — walk OpenSpec root with glob, find all spec item folders
- [x] 13.3 Parse frontmatter from each spec Markdown file using gray-matter
- [x] 13.4 Generate item-level `visualize.json` for each item (skip if exists)
- [x] 13.5 Generate folder-level `visualize.json` for each folder (skip if exists)
- [x] 13.6 Generate `openspec/index.json` with full folder and item lists
- [x] 13.7 Commit all generated files (no commit if nothing generated)

## 14. openspec-action — Sync Mode

- [x] 14.1 Implement `src/sync.ts` — detect changed files via git diff (`@octokit/rest` or shell)
- [x] 14.2 Update `last_commit` and `last_updated` in affected item `visualize.json` files
- [x] 14.3 Add new items to `index.json` for newly added spec folders; remove entries for deleted folders
- [x] 14.4 Commit updated `index.json` and changed `visualize.json` files (push event only)
- [x] 14.5 Implement `src/prComment.ts` — post PR comment summarizing added/modified/removed items

## 15. openspec-action — Validate Mode

- [x] 15.1 Implement `src/validate.ts` — walk all `visualize.json` files and validate with Zod schemas
- [x] 15.2 Check required fields present, status/type values in allowed enums
- [x] 15.3 Check ID uniqueness across all items
- [x] 15.4 Check all relation references resolve to known IDs in the repo
- [x] 15.5 Aggregate errors and post PR comment; exit code 1 on any failure

## 16. openspec-action — Baseline Mode

- [x] 16.1 Implement `src/baseline.ts` — read inputs `baseline_name`, `description` (from workflow_dispatch or client_payload)
- [x] 16.2 Copy current `index.json` to `openspec/baselines/<baseline_name>.json` with added `baseline_name`, `created_at`, `description`, `triggered_by`
- [x] 16.3 Create and push Git tag `openspec-baseline-<baseline_name>`
- [x] 16.4 Create GitHub Release at the tag using `@octokit/rest`
- [x] 16.5 Add `repository_dispatch` trigger support (event type `openspec-create-baseline`)

## 17. openspec-action — Markdown Triggers

- [x] 17.1 Implement `src/processTriggers.ts` — scan changed Markdown files for `@visualizer:trigger` comments using regex
- [x] 17.2 Implement `notify-team` trigger — post GitHub comment @-mentioning the team
- [x] 17.3 Implement `create-task` trigger — create GitHub Issue with `openspec-task` label; check for existing issue to ensure idempotency
- [x] 17.4 Implement `link-issue` trigger — patch `github.linked_issue` in item `visualize.json`
- [x] 17.5 Implement `set-milestone` trigger — set milestone on linked PR/issue
- [x] 17.6 Implement `request-review` trigger — request review from GitHub user on linked PR
- [x] 17.7 Implement `deprecate` trigger — set `status: "deprecated"` in referenced item's `visualize.json`
- [x] 17.8 Implement `archive` trigger — set `archived: true` and move folder to archive directory
- [x] 17.9 Log warnings for unrecognized trigger types; never fail the action on unknown triggers

## 18. Workflow Files & GitHub Action Publishing

- [x] 18.1 Write `actions/openspec-init.yml` workflow (workflow_dispatch, calls openspec-action@v1 init mode)
- [x] 18.2 Write `actions/openspec-sync.yml` workflow (push + pull_request on openspec/**)
- [x] 18.3 Write `actions/openspec-validate.yml` workflow (pull_request on openspec/**)
- [x] 18.4 Write `actions/openspec-baseline.yml` workflow (workflow_dispatch + repository_dispatch)
- [ ] 18.5 Publish `packages/openspec-action` to GitHub Marketplace with README and action.yml metadata

## 19. Deployment & Documentation

- [ ] 19.1 Configure Vercel project for `apps/web`, set `NEXTAUTH_SECRET` and GitHub OAuth env vars
- [x] 19.2 Write `docs/getting-started.md` — step-by-step from sign-in to first board view
- [x] 19.3 Write `docs/repo-conventions.md` — folder structure, visualize.json placement rules
- [x] 19.4 Write `docs/visualize-json-schema.md` — full schema reference for item and folder files
- [x] 19.5 Write `docs/markdown-triggers.md` — all supported trigger types with examples
- [ ] 19.6 Create demo repo with example OpenSpec structure for onboarding
