## Why

OpenSpec repos have rich spec metadata but no way to visualize or navigate it without manually reading files. SpecStat solves this by providing a GitHub-native, frontend-only UI that renders specs as Jira-like boards, relationship graphs, folder trees, and commit timelines — with zero backend infrastructure required.

## What Changes

- **New product**: SpecStat — a Next.js web application deployed on Vercel that reads OpenSpec repos directly via GitHub API
- **New file convention**: Every spec item and folder gets a `visualize.json` metadata file alongside existing OpenSpec files (OpenSpec files themselves are never modified)
- **New manifest file**: `openspec/index.json` — lightweight root manifest auto-generated and maintained by GitHub Actions
- **New GitHub Action**: `openspec-action` — a composite action supporting init, sync, validate, baseline, and process-triggers modes
- **New workflow files**: Four GitHub Actions workflows (`openspec-init.yml`, `openspec-sync.yml`, `openspec-validate.yml`, `openspec-baseline.yml`) that users copy into their repos
- **Two-way triggers**: Visualizer UI can dispatch GitHub Actions; Markdown spec files can embed `@visualizer:trigger` directives that the sync action processes

## Capabilities

### New Capabilities

- `visualize-json-schema`: Defines the schema and convention for distributed `visualize.json` files (item-level and folder-level) and the `index.json` root manifest
- `board-view`: Jira-like drag-and-drop board grouping spec cards by status, owner, type, tag, or swimlane
- `graph-view`: Interactive relationship graph (React Flow) showing all `relations` edges between spec items with filtering and highlight
- `tree-view`: Folder hierarchy view mirroring the OpenSpec directory structure from `index.json`
- `timeline-view`: Commit-based history timeline showing when items were created and changed, with baseline markers
- `spec-detail-panel`: Side panel showing rendered Markdown content alongside `visualize.json` metadata, GitHub commit history, and linked PRs/issues
- `archive-view`: Separate view for items where `archived: true`, keeping the main board clean
- `multi-repo-workspace`: Connect multiple GitHub repos, merge their `index.json` manifests, resolve cross-repo relations
- `github-oauth-auth`: GitHub OAuth sign-in via next-auth, used to authenticate all GitHub API calls
- `openspec-action-init`: GitHub Action mode that walks a repo, generates all `visualize.json` files and `index.json` on first setup
- `openspec-action-sync`: GitHub Action mode that detects changed OpenSpec files and updates only affected `visualize.json` entries and `index.json`
- `openspec-action-validate`: GitHub Action mode that validates all spec files and `visualize.json` files against schema rules on every PR
- `openspec-action-baseline`: GitHub Action mode that creates a named snapshot, Git tag, and GitHub Release
- `markdown-triggers`: `@visualizer:trigger` directive system embedded in spec Markdown files, processed by the sync action to automate GitHub operations

### Modified Capabilities

## Impact

- No existing OpenSpec files are modified — additive convention only
- Users must copy workflow files into their repos and run `openspec-init` once
- Requires GitHub OAuth app registration for SpecStat (client ID/secret)
- GitHub API rate limits apply — lazy loading and TanStack Query caching mitigate this
- Vercel deployment for the frontend; GitHub Marketplace for the Action
