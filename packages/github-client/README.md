# @specstat/github-client

The GitHub access layer for [SpecStat](../../README.md) — a thin
[Octokit](https://github.com/octokit/rest.js) wrapper for reading OpenSpec data,
triggering Actions, and managing workflow setup. Used by the
[web app](../../apps/web/README.md).

Depends on `@octokit/rest`, [`@specstat/types`](../types/README.md), and
[`@specstat/openspec-parser`](../openspec-parser/README.md).

## Exports

### Auth

| Export | Purpose |
| --- | --- |
| `createOctokit` | Build an authenticated Octokit client from a token. |
| `parseRepo` | Split an `owner/repo` string. |

### Reads

| Export | Purpose |
| --- | --- |
| `getIndex` | Fetch & parse `openspec/index.json`. |
| `getItem` | Fetch & parse a single item's `visualize.json`. |
| `getFileContent` | Fetch raw file contents. |
| `getCommitHistory` | Fetch commit history for spec files (timeline). |

### Installations

| Export | Purpose |
| --- | --- |
| `getAppInstallations` | List GitHub App installations (`AppInstallation`). |
| `getInstallationRepos` | List repos for an installation (`InstalledRepo`). |

### Action triggers

| Export | Purpose |
| --- | --- |
| `triggerAction` | Trigger a SpecStat Action run. |
| `triggerWorkflow` | Dispatch a workflow (throws `WorkflowDispatchNotSupportedError` if unavailable). |
| `updateVisualizeJson` | Open a PR updating an item's `visualize.json`. |

### Workflow setup

| Export | Purpose |
| --- | --- |
| `checkRepoSetup` | Inspect a repo's SpecStat setup (`RepoSetupStatus`). |
| `createWorkflowSetupPR` | Open a PR installing the SpecStat workflows (`WorkflowSetupResult`). |
| `updateWorkflowsPR` | Open a PR upgrading existing workflows. |
| `SPECSTAT_WORKFLOW_VERSION` | Current bundled workflow template version. |

### Errors

`GitHubAuthError`, `GitHubForbiddenError`, `GitHubNotFoundError`, and the
`handleGitHubError` helper.

## Workflow codegen

The workflow YAML templates in [`actions/`](../../actions) are bundled into
`src/generatedWorkflows.ts` so they can be committed to a user's repo without
filesystem access. This runs via the `generate` script and automatically before
build (`prebuild`):

```bash
npm run generate   # node scripts/generate-workflows.mjs
```

Re-run it whenever an `actions/*.yml` template changes.

## Usage

```ts
import { createOctokit, getIndex, checkRepoSetup } from '@specstat/github-client'

const octokit = createOctokit(token)
const index = await getIndex(octokit, 'MyGenX/FastQL')
const setup = await checkRepoSetup(octokit, 'MyGenX/FastQL')
```
