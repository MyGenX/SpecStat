import { Octokit } from '@octokit/rest'

export interface RepoSetupStatus {
  accessible: boolean
  isInitialized: boolean
  hasIndex: boolean
  workflows: {
    init: boolean
    sync: boolean
    validate: boolean
    baseline: boolean
  }
}

async function fileExists(octokit: Octokit, owner: string, repo: string, path: string): Promise<boolean> {
  try {
    await octokit.repos.getContent({ owner, repo, path })
    return true
  } catch {
    return false
  }
}

export async function checkRepoSetup(octokit: Octokit, ownerRepo: string): Promise<RepoSetupStatus> {
  const [owner, repo] = ownerRepo.split('/')

  let defaultBranch = 'main'
  try {
    const { data } = await octokit.repos.get({ owner, repo })
    defaultBranch = data.default_branch
  } catch {
    return { accessible: false, isInitialized: false, hasIndex: false, workflows: { init: false, sync: false, validate: false, baseline: false } }
  }

  let isInitialized = false
  try {
    await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
    isInitialized = true
  } catch { /* empty repo — no commits yet */ }

  if (!isInitialized) {
    return { accessible: true, isInitialized: false, hasIndex: false, workflows: { init: false, sync: false, validate: false, baseline: false } }
  }

  const [hasIndex, init, sync, validate, baseline] = await Promise.all([
    fileExists(octokit, owner, repo, 'openspec/index.json'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-init.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-sync.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-validate.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-baseline.yml'),
  ])

  return { accessible: true, isInitialized: true, hasIndex, workflows: { init, sync, validate, baseline } }
}

async function initializeRepo(octokit: Octokit, owner: string, repo: string, defaultBranch: string): Promise<void> {
  const { data: blob } = await octokit.git.createBlob({
    owner, repo,
    content: Buffer.from(`# ${repo}\n`).toString('base64'),
    encoding: 'base64',
  })
  const { data: tree } = await octokit.git.createTree({
    owner, repo,
    tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: blob.sha }],
  })
  const { data: commit } = await octokit.git.createCommit({
    owner, repo,
    message: 'Initial commit',
    tree: tree.sha,
    parents: [],
  })
  await octokit.git.createRef({
    owner, repo,
    ref: `refs/heads/${defaultBranch}`,
    sha: commit.sha,
  })
}

const INIT_YAML = `name: SpecStat Init

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
        uses: MyGenX/SpecStat@v1
        with:
          mode: init
          root: \${{ inputs.root }}
          github_token: \${{ secrets.GITHUB_TOKEN }}

      - name: Commit generated files
        run: |
          git config user.name "openspec-bot"
          git config user.email "bot@specstat.app"
          git add openspec/
          git diff --staged --quiet || git commit -m "chore(openspec): initialize visualize.json files and index"
          git push
`

const SYNC_YAML = `name: SpecStat Sync

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
        if: \${{ steps.changes.outputs.openspec == 'true' }}
        uses: MyGenX/SpecStat@v1
        with:
          mode: sync
          root: openspec
          github_token: \${{ secrets.GITHUB_TOKEN }}

      - name: Process Markdown triggers
        if: \${{ steps.changes.outputs.openspec == 'true' }}
        uses: MyGenX/SpecStat@v1
        with:
          mode: process-triggers
          root: openspec
          github_token: \${{ secrets.GITHUB_TOKEN }}

      - name: Commit updated index
        if: \${{ github.event_name == 'push' && steps.changes.outputs.openspec == 'true' }}
        run: |
          git config user.name "openspec-bot"
          git config user.email "bot@specstat.app"
          git add openspec/index.json openspec/
          git diff --staged --quiet || git commit -m "chore(openspec): sync index after spec changes"
          git push

      - name: Comment on PR
        if: \${{ github.event_name == 'pull_request' }}
        uses: MyGenX/SpecStat@v1
        with:
          mode: pr-comment
          root: openspec
          github_token: \${{ secrets.GITHUB_TOKEN }}
`

const VALIDATE_YAML = `name: SpecStat Validate

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
        uses: MyGenX/SpecStat@v1
        with:
          mode: validate
          root: openspec
          github_token: \${{ secrets.GITHUB_TOKEN }}
          rules: |
            - required-fields: [id, title, type, status, owner]
            - unique-ids: true
            - valid-relations: true
            - valid-status-values: [draft, in-review, approved, implemented, deprecated, archived]
            - valid-type-values: [spec, impl, task, design, proposal, decision, component, domain]

      - name: Post validation report
        if: failure()
        uses: MyGenX/SpecStat@v1
        with:
          mode: report
          github_token: \${{ secrets.GITHUB_TOKEN }}
`

const BASELINE_YAML = `name: SpecStat Baseline

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Create baseline snapshot
        uses: MyGenX/SpecStat@v1
        with:
          mode: baseline
          root: openspec
          baseline_name: \${{ inputs.baseline_name || github.event.client_payload.baseline_name }}
          description: \${{ inputs.description || github.event.client_payload.description }}
          github_token: \${{ secrets.GITHUB_TOKEN }}
`

const WORKFLOWS: Array<{ key: keyof RepoSetupStatus['workflows']; filename: string; content: string }> = [
  { key: 'init', filename: 'specstat-init.yml', content: INIT_YAML },
  { key: 'sync', filename: 'specstat-sync.yml', content: SYNC_YAML },
  { key: 'validate', filename: 'specstat-validate.yml', content: VALIDATE_YAML },
  { key: 'baseline', filename: 'specstat-baseline.yml', content: BASELINE_YAML },
]

export interface WorkflowSetupResult {
  prUrl: string | null
  prNumber: number | null
  branch: string | null
  created: string[]
  /** null on success, 'MISSING_WORKFLOWS_PERMISSION', 'NOTHING_TO_DO', or a raw error message */
  error: string | null
}

function isMissingWorkflowsPermission(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  const status = (e as { status?: number } | null)?.status
  return status === 403 || /resource not accessible by integration/i.test(msg)
}

/**
 * Bundles all missing workflow files into a single commit on a new branch and
 * opens a PR against the repository's default branch. Uses the caller's
 * (user) token — requires the SpecStat GitHub App to have the `workflows`
 * permission granted on the target repo.
 */
export async function createWorkflowSetupPR(
  octokit: Octokit,
  ownerRepo: string,
  existing: RepoSetupStatus['workflows'],
): Promise<WorkflowSetupResult> {
  const [owner, repo] = ownerRepo.split('/')
  const missing = WORKFLOWS.filter(({ key }) => !existing[key])

  if (missing.length === 0) {
    return { prUrl: null, prNumber: null, branch: null, created: [], error: 'NOTHING_TO_DO' }
  }

  try {
    const { data: repoMeta } = await octokit.repos.get({ owner, repo })
    const defaultBranch = repoMeta.default_branch

    // Ensure the repo has at least one commit on its default branch.
    try {
      await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
    } catch {
      await initializeRepo(octokit, owner, repo, defaultBranch)
    }

    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
    const baseSha = ref.object.sha
    const { data: baseCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: baseSha })

    const treeEntries = await Promise.all(
      missing.map(async ({ filename, content }) => {
        const { data: blob } = await octokit.git.createBlob({
          owner, repo,
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64',
        })
        return { path: `.github/workflows/${filename}`, mode: '100644' as const, type: 'blob' as const, sha: blob.sha }
      }),
    )

    const { data: tree } = await octokit.git.createTree({
      owner, repo,
      base_tree: baseCommit.tree.sha,
      tree: treeEntries,
    })

    const { data: commit } = await octokit.git.createCommit({
      owner, repo,
      message: 'chore(openspec): add SpecStat workflow files',
      tree: tree.sha,
      parents: [baseSha],
    })

    const branch = `specstat/setup-workflows-${Date.now().toString(36)}`
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: commit.sha })

    const fileList = missing.map(({ filename }) => `- \`.github/workflows/${filename}\``).join('\n')
    const { data: pr } = await octokit.pulls.create({
      owner, repo,
      head: branch,
      base: defaultBranch,
      title: 'Add SpecStat OpenSpec workflows',
      body: `This PR adds the SpecStat OpenSpec automation workflows:\n\n${fileList}\n\nAfter merging, run **OpenSpec Init** from the Actions tab to generate \`openspec/index.json\`.\n\n— opened by [SpecStat](https://specstat.app)`,
    })

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch,
      created: missing.map(({ filename }) => filename),
      error: null,
    }
  } catch (e) {
    if (isMissingWorkflowsPermission(e)) {
      return { prUrl: null, prNumber: null, branch: null, created: [], error: 'MISSING_WORKFLOWS_PERMISSION' }
    }
    return {
      prUrl: null, prNumber: null, branch: null, created: [],
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}
