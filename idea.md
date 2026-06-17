# Visualizer.App — Full Concept & Implementation Proposal

---

## Executive Summary

**Visualizer.App** is a GitHub-native, frontend-only specification management and visualization tool built around the OpenSpec standard. It requires zero backend infrastructure, zero database, and integrates with any GitHub repository — whether spec-only or mixed spec+code — through a lightweight file convention and two predefined GitHub Actions.

Every spec item owns its own `visualize.json` metadata file. A root `index.json` acts as a lightweight manifest. The Visualizer reads these files directly from GitHub and renders specs, implementations, tasks, designs, and proposals as Jira-like cards, relationship graphs, folder trees, and timelines.

---

## Core Principles

- **GitHub is the only backend** — no custom server, no database
- **OpenSpec files are never modified** — Visualizer only adds alongside
- **Every item owns its metadata** — distributed `visualize.json` files
- **GitHub Actions do the heavy lifting** — not the frontend
- **Lazy loading everywhere** — only fetch what is needed
- **Works with any repo structure** — spec-only or mixed
- **Triggers flow both ways** — GitHub Actions update Visualizer data, and Visualizer can trigger GitHub Actions

---

## Repository Convention

### Folder structure — spec-only repo

```text
repo-root/
  .github/
    workflows/
      openspec-init.yml       ← provided by Visualizer
      openspec-sync.yml       ← provided by Visualizer
  openspec/
    index.json                ← root manifest (auto-generated)
    visualize.json            ← root section metadata
    specs/
      visualize.json
      AUTH-001/
        AUTH-001.md           ← actual spec, never touched
        visualize.json        ← item metadata
      AUTH-002/
        AUTH-002.md
        visualize.json
    designs/
      visualize.json
      DESIGN-001/
        DESIGN-001.md
        visualize.json
    proposals/
      visualize.json
      PROP-001/
        PROP-001.md
        visualize.json
    tasks/
      visualize.json
      TASK-001/
        TASK-001.md
        visualize.json
    decisions/
      visualize.json
      ADR-001/
        ADR-001.md
        visualize.json
    archive/
      visualize.json
      specs/
        visualize.json
        AUTH-OLD-001/
          AUTH-OLD-001.md
          visualize.json
```

### Folder structure — mixed repo (spec + code)

```text
repo-root/
  src/
  packages/
  .github/
    workflows/
      openspec-init.yml
      openspec-sync.yml
  openspec/                   ← specs live alongside code
    index.json
    visualize.json
    specs/
      ...
    tasks/
      ...
```

The Visualizer always looks for `openspec/index.json` at the repo root. That is the only hard convention.

---

## File Schema Definitions

### `openspec/index.json` — root manifest

```json
{
  "meta": {
    "repo": "org/repo-name",
    "repo_type": "mixed",
    "generated_at": "2026-01-15T10:30:00Z",
    "openspec_version": "1.0.0",
    "visualizer_version": "1.0.0",
    "root": "openspec"
  },
  "folders": [
    {
      "path": "openspec/specs",
      "type": "specs",
      "archived": false,
      "item_count": 12,
      "visualize": "openspec/specs/visualize.json"
    },
    {
      "path": "openspec/designs",
      "type": "designs",
      "archived": false,
      "item_count": 4,
      "visualize": "openspec/designs/visualize.json"
    },
    {
      "path": "openspec/archive/specs",
      "type": "specs",
      "archived": true,
      "item_count": 5,
      "visualize": "openspec/archive/specs/visualize.json"
    }
  ],
  "items": [
    {
      "id": "AUTH-001",
      "title": "User login flow",
      "type": "spec",
      "status": "approved",
      "path": "openspec/specs/AUTH-001",
      "spec_file": "openspec/specs/AUTH-001/AUTH-001.md",
      "visualize": "openspec/specs/AUTH-001/visualize.json",
      "archived": false,
      "last_updated": "2026-01-15",
      "last_commit": "9f3ab21"
    }
  ]
}
```

---

### Folder-level `visualize.json`

```json
{
  "type": "folder",
  "label": "Specifications",
  "description": "Core functional and non-functional requirements",
  "icon": "file-text",
  "color": "#4F46E5",
  "archived": false,
  "default_view": "board",
  "default_group_by": "status",
  "owners": ["platform-team"],
  "tags": ["core", "requirements"],
  "item_count": 12
}
```

---

### Item-level `visualize.json`

```json
{
  "type": "item",
  "id": "AUTH-001",
  "title": "User login flow",
  "spec_type": "spec",
  "status": "approved",
  "priority": "high",
  "owner": "platform-team",
  "contributors": ["alice", "bob"],
  "version": "1.2.0",
  "tags": ["auth", "security"],
  "archived": false,
  "spec_file": "AUTH-001.md",
  "created_at": "2025-06-01",
  "last_updated": "2026-01-15",
  "last_commit": "9f3ab21",
  "card": {
    "color": "#4F46E5",
    "icon": "lock",
    "cover_image": null,
    "summary": "Defines the complete login flow including OAuth and email/password"
  },
  "relations": {
    "relates_to": ["AUTH-002"],
    "depends_on": ["COMP-AUTH-SERVICE"],
    "implements": ["PROP-007"],
    "linked_tasks": ["TASK-042", "TASK-043"],
    "linked_designs": ["DESIGN-001"],
    "supersedes": [],
    "superseded_by": null
  },
  "github": {
    "labels": ["critical", "security"],
    "linked_pr": 52,
    "linked_issue": 103,
    "milestone": "v2.0"
  },
  "board": {
    "column": "approved",
    "position": 2,
    "swimlane": "authentication"
  },
  "triggers": {
    "on_status_change": "openspec-notify",
    "on_approve": "openspec-baseline"
  }
}
```

---

## GitHub Actions — Full Configuration

### Action 1: `openspec-init.yml`
Runs once manually when a team first integrates Visualizer with an existing repo.

```yaml
name: OpenSpec Init

on:
  workflow_dispatch:
    inputs:
      root:
        description: 'OpenSpec root folder'
        required: false
        default: 'openspec'

jobs:
  init:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run OpenSpec Init
        uses: your-org/openspec-action@v1
        with:
          mode: init
          root: ${{ inputs.root }}
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit generated files
        run: |
          git config user.name "openspec-bot"
          git config user.email "bot@visualizer.app"
          git add openspec/
          git diff --staged --quiet || git commit -m "chore(openspec): initialize visualize.json files and index"
          git push
```

---

### Action 2: `openspec-sync.yml`
Runs automatically on every push that touches the openspec folder.

```yaml
name: OpenSpec Sync

on:
  push:
    branches: [main]
    paths:
      - 'openspec/**'

  pull_request:
    paths:
      - 'openspec/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Detect changed files
        id: changes
        uses: dorny/paths-filter@v3
        with:
          filters: |
            openspec:
              - 'openspec/**/*.md'
              - 'openspec/**/*.yaml'
              - 'openspec/**/*.yml'

      - name: Run OpenSpec Sync
        if: steps.changes.outputs.openspec == 'true'
        uses: your-org/openspec-action@v1
        with:
          mode: sync
          root: openspec
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit updated index
        if: github.event_name == 'push'
        run: |
          git config user.name "openspec-bot"
          git config user.email "bot@visualizer.app"
          git add openspec/index.json
          git diff --staged --quiet || git commit -m "chore(openspec): sync index after spec changes"
          git push

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: your-org/openspec-action@v1
        with:
          mode: pr-comment
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

### Action 3: `openspec-validate.yml`
Validates all spec files and `visualize.json` files on every PR.

```yaml
name: OpenSpec Validate

on:
  pull_request:
    paths:
      - 'openspec/**'

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Validate OpenSpec files
        uses: your-org/openspec-action@v1
        with:
          mode: validate
          root: openspec
          rules: |
            - required-fields: [id, title, type, status, owner]
            - unique-ids: true
            - valid-relations: true
            - valid-status-values: [draft, in-review, approved, implemented, deprecated, archived]
            - valid-type-values: [spec, impl, task, design, proposal, decision, component, domain]

      - name: Post validation report
        if: failure()
        uses: your-org/openspec-action@v1
        with:
          mode: report
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

### Action 4: `openspec-baseline.yml`
Creates a named baseline snapshot when triggered — either manually or from Visualizer.

```yaml
name: OpenSpec Baseline

on:
  workflow_dispatch:
    inputs:
      baseline_name:
        description: 'Baseline name e.g. release-2026-Q2'
        required: true
      description:
        description: 'Baseline description'
        required: false

  repository_dispatch:
    types: [openspec-create-baseline]

jobs:
  baseline:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Create baseline snapshot
        uses: your-org/openspec-action@v1
        with:
          mode: baseline
          baseline_name: ${{ inputs.baseline_name || github.event.client_payload.baseline_name }}
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Create Git tag
        run: |
          git tag "openspec-baseline-${{ inputs.baseline_name }}"
          git push origin "openspec-baseline-${{ inputs.baseline_name }}"

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: "openspec-baseline-${{ inputs.baseline_name }}"
          name: "OpenSpec Baseline — ${{ inputs.baseline_name }}"
          body: ${{ inputs.description }}
```

---

## Triggers — Visualizer to GitHub Actions

This is the two-way integration. Visualizer can **trigger GitHub Actions** directly from the UI or from Markdown files.

### Trigger from Visualizer UI
When a user performs an action in Visualizer — like approving a spec or changing a status — the app calls the GitHub API to dispatch a workflow.

```typescript
// Visualizer triggers a GitHub Action via repository_dispatch
async function triggerAction(repo: string, eventType: string, payload: object) {
  await githubClient.post(`/repos/${repo}/dispatches`, {
    event_type: eventType,
    client_payload: payload
  })
}

// Example: user clicks "Create Baseline" in Visualizer UI
triggerAction('org/repo', 'openspec-create-baseline', {
  baseline_name: 'release-2026-Q2',
  triggered_by: 'alice'
})

// Example: user approves a spec in Visualizer
triggerAction('org/repo', 'openspec-status-change', {
  item_id: 'AUTH-001',
  new_status: 'approved',
  triggered_by: 'alice'
})
```

---

### Trigger from Markdown files
This is a powerful feature. You can embed trigger directives inside spec Markdown files that the GitHub Action reads and executes.

Inside any spec Markdown file:

```markdown
---
id: AUTH-001
title: User login flow
status: approved
---

## Overview
This spec defines the login flow...

<!-- @visualizer:trigger notify-team platform-team -->
<!-- @visualizer:trigger create-task "Write unit tests for login" -->
<!-- @visualizer:trigger link-issue 103 -->
<!-- @visualizer:trigger set-milestone v2.0 -->
```

The sync Action scans for `@visualizer:trigger` comments and executes them:

```yaml
- name: Process Markdown triggers
  uses: your-org/openspec-action@v1
  with:
    mode: process-triggers
    root: openspec
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Supported Markdown triggers

| Trigger | Effect |
|---|---|
| `@visualizer:trigger notify-team <team>` | Posts a GitHub notification to the team |
| `@visualizer:trigger create-task "<title>"` | Creates a GitHub issue linked to this spec |
| `@visualizer:trigger link-issue <number>` | Links an existing issue to this spec |
| `@visualizer:trigger set-milestone <name>` | Sets milestone on linked PR/issue |
| `@visualizer:trigger create-baseline <name>` | Triggers baseline creation |
| `@visualizer:trigger request-review <user>` | Requests a GitHub review |
| `@visualizer:trigger deprecate <id>` | Marks another spec as deprecated |
| `@visualizer:trigger archive` | Moves this spec to archive |

---

## Visualizer.App — Frontend Architecture

### Views

#### 1. Board view — Jira-like cards
The primary view. Cards grouped into columns by status.

```text
DRAFT          IN REVIEW       APPROVED        IMPLEMENTED     ARCHIVED
─────────      ─────────       ─────────       ─────────       ─────────
┌─────────┐   ┌─────────┐     ┌─────────┐     ┌─────────┐
│AUTH-003 │   │AUTH-002 │     │AUTH-001 │     │PAY-001  │
│Login    │   │OAuth    │     │Email    │     │Checkout │
│         │   │         │     │login    │     │flow     │
│platform │   │auth-team│     │platform │     │payments │
│🔴 high  │   │🟡 medium│     │🟢 done  │     │🟢 done  │
└─────────┘   └─────────┘     └─────────┘     └─────────┘
```

Each card shows:
- ID badge
- title
- type icon
- status pill
- owner
- priority indicator
- tag chips
- relation count
- last updated
- quick GitHub link

Cards are **draggable** between columns. Dropping a card on a new column triggers a commit to update `status` in `visualize.json` via GitHub API.

Grouping options:
- by status *(default)*
- by owner
- by type
- by tag
- by swimlane
- by milestone

---

#### 2. Graph view — relationship map
Nodes are spec items. Edges are relationships.

Edge types:
- `relates_to` — dashed grey line
- `depends_on` — solid red arrow
- `implements` — solid green arrow
- `linked_tasks` — dotted blue line
- `linked_designs` — dotted purple line
- `supersedes` — solid orange arrow

Features:
- click node to open detail panel
- filter by type, status, owner
- highlight all dependencies of selected node
- zoom into a domain or folder
- expand/collapse clusters

---

#### 3. Tree view — folder structure
Mirrors the actual OpenSpec folder hierarchy from `index.json`.

Shows:
- folder icons with item counts
- nested folders
- archived folders clearly separated and dimmed
- click folder to open board view for that section

---

#### 4. Timeline view
Shows spec history using GitHub commit data.

- when items were created
- when they changed
- who changed them
- which PR introduced the change
- baseline markers on the timeline

---

#### 5. Detail panel
Opens as a side panel or modal when clicking any card.

Left side:
- full rendered Markdown content of the spec file

Right side:
- all `visualize.json` metadata
- relations as clickable links
- GitHub commit history for this file
- linked PR and issue links
- Markdown trigger directives editor

---

#### 6. Archive view
Separate section showing all items where `archived: true`. Keeps the main board clean.

---

#### 7. Multi-repo workspace
Users can connect multiple repos. Visualizer merges all their `index.json` files into a unified workspace.

Cross-repo relations work because item IDs are globally referenced and each index knows which repo it belongs to.

---

## Visualizer.App — Codebase Structure

```text
visualizer-app/
  apps/
    web/                          ← Next.js frontend app
      app/
        page.tsx                  ← workspace home
        board/
          page.tsx
        graph/
          page.tsx
        tree/
          page.tsx
        timeline/
          page.tsx
        item/
          [id]/
            page.tsx
        settings/
          page.tsx
      components/
        board/
          BoardView.tsx
          BoardColumn.tsx
          SpecCard.tsx
          CardDetail.tsx
        graph/
          GraphView.tsx
          GraphNode.tsx
          GraphEdge.tsx
        tree/
          TreeView.tsx
          TreeFolder.tsx
        timeline/
          TimelineView.tsx
        shared/
          StatusBadge.tsx
          PriorityIndicator.tsx
          TypeIcon.tsx
          OwnerAvatar.tsx
          TagChip.tsx

  packages/
    openspec-parser/              ← parses index.json and visualize.json
      src/
        parseIndex.ts
        parseItem.ts
        parseFolder.ts
        validateSchema.ts
        buildGraph.ts
    github-client/                ← GitHub API wrapper
      src/
        getIndex.ts
        getItem.ts
        getFileContent.ts
        getCommitHistory.ts
        triggerAction.ts
        updateVisualizeJson.ts
        githubAuth.ts
    openspec-action/              ← GitHub Action source
      src/
        init.ts
        sync.ts
        validate.ts
        baseline.ts
        processTriggers.ts
        prComment.ts
      action.yml
    ui/                           ← shared UI components
    types/                        ← shared TypeScript types

  actions/
    openspec-init.yml             ← ready to copy into user repos
    openspec-sync.yml
    openspec-validate.yml
    openspec-baseline.yml

  docs/
    getting-started.md
    repo-conventions.md
    visualize-json-schema.md
    markdown-triggers.md
    github-actions.md
```

---

## Tech Stack

### Frontend
- **Next.js 14 + TypeScript** — app framework
- **Tailwind CSS** — styling
- **shadcn/ui** — card and UI components
- **React Flow** — graph view
- **dnd-kit** — drag and drop for board
- **TanStack Query** — GitHub API caching and fetching
- **gray-matter** — frontmatter parsing
- **Zod** — schema validation for `visualize.json`
- **next-auth** — GitHub OAuth authentication

### GitHub Action
- **Node.js 20 + TypeScript**
- **@octokit/rest** — GitHub API calls
- **gray-matter** — frontmatter parsing
- **ajv** — JSON schema validation
- **glob** — file walking

### Deployment
- **Vercel** — frontend hosting
- **GitHub Marketplace** — Action publishing

---

## Implementation Plan

### Phase 1 — Foundation *(weeks 1–3)*
- Define and document `visualize.json` schema for items and folders
- Define `index.json` manifest schema
- Build `openspec-action` init mode — walks repo, generates all `visualize.json` files and `index.json`
- Build `openspec-action` sync mode — detects changes, updates affected files only
- Write `openspec-init.yml` and `openspec-sync.yml` workflow files
- Test on a real OpenSpec repo

### Phase 2 — Core Visualizer UI *(weeks 4–6)*
- Set up Next.js app with GitHub OAuth via next-auth
- Build GitHub client package — fetch index, fetch items, fetch file content
- Build OpenSpec parser package — parse and validate all JSON files
- Build tree view — mirrors folder structure from index
- Build board view — Jira-like cards from item `visualize.json` files
- Build spec detail panel — rendered Markdown + metadata side by side

### Phase 3 — Graph and History *(weeks 7–9)*
- Build graph view using React Flow
- Build relationship edges from `relations` fields
- Build timeline view using GitHub commit history
- Add commit history panel in item detail
- Add linked PR and issue display

### Phase 4 — Two-way Triggers *(weeks 10–11)*
- Build `repository_dispatch` trigger from Visualizer UI
- Build Markdown trigger parser in GitHub Action
- Implement all supported trigger types
- Build `openspec-validate.yml` action
- Build `openspec-baseline.yml` action
- Add baseline creation from Visualizer UI

### Phase 5 — Multi-repo and Polish *(weeks 12–14)*
- Build multi-repo workspace — connect multiple repos
- Merge indexes from multiple repos into unified view
- Cross-repo relationship resolution
- Add archive view
- Add search and filtering across all views
- Performance optimization — lazy loading, caching, pagination
- Write documentation

### Phase 6 — Release *(week 15)*
- Publish GitHub Action to GitHub Marketplace
- Deploy Visualizer.App to Vercel
- Write getting started guide
- Create demo repo with example OpenSpec structure

---

## User Journey — End to End

1. User visits **Visualizer.App** and signs in with GitHub
2. User adds a repo — either existing or new
3. Visualizer shows two Action files to copy into `.github/workflows/`
4. User runs `openspec-init` manually once via GitHub Actions tab
5. Action walks the repo, generates `visualize.json` for every item and folder, generates `index.json`, commits everything
6. Visualizer reads `index.json` and renders the board, graph, and tree immediately
7. User browses specs as cards, drags them between status columns, clicks into detail views
8. User edits a spec file in GitHub — push triggers `openspec-sync`, index updates, Visualizer reflects changes within seconds
9. User adds `@visualizer:trigger` directives to a Markdown spec — next sync processes them automatically
10. User clicks "Create Baseline" in Visualizer — triggers `openspec-baseline` Action, creates Git tag and GitHub Release
11. User connects a second repo — Visualizer merges both into a unified workspace with cross-repo relationship links

---

## In One Paragraph

**Visualizer.App** is a GitHub-native, frontend-only tool that brings OpenSpec to life without any backend infrastructure. It integrates with existing or new repos through four predefined GitHub Actions — init, sync, validate, and baseline — that generate and maintain distributed `visualize.json` metadata files alongside every spec item and folder. A lightweight root `index.json` acts as a manifest the Visualizer loads first, then lazily fetches only what it needs. The frontend renders specs as Jira-like cards on a drag-and-drop board, as a relationship graph, as a folder tree, and as a commit timeline — all reading directly from GitHub. Triggers flow both ways: GitHub Actions update Visualizer data on every push, and Visualizer can trigger Actions from the UI or from `@visualizer:trigger` directives embedded in Markdown spec files. The result is a clean, scalable, zero-infrastructure spec management tool that lives entirely inside GitHub.