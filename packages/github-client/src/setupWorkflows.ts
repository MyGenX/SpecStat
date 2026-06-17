import { Octokit } from '@octokit/rest'
import { INIT_YAML, SYNC_YAML, VALIDATE_YAML, BASELINE_YAML, CLEAN_YAML } from './generatedWorkflows.js'

export const SPECSTAT_WORKFLOW_VERSION = '1.1.0'

export interface RepoSetupStatus {
  accessible: boolean
  isInitialized: boolean
  hasIndex: boolean
  /** false when the repo setting "Allow GitHub Actions to create and approve pull requests" is off */
  canCreatePRs: boolean
  workflows: {
    init: boolean
    sync: boolean
    validate: boolean
    baseline: boolean
    clean: boolean
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
    return { accessible: false, isInitialized: false, hasIndex: false, canCreatePRs: true, workflows: { init: false, sync: false, validate: false, baseline: false, clean: false } }
  }

  let isInitialized = false
  try {
    await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
    isInitialized = true
  } catch { /* empty repo — no commits yet */ }

  if (!isInitialized) {
    return { accessible: true, isInitialized: false, hasIndex: false, canCreatePRs: true, workflows: { init: false, sync: false, validate: false, baseline: false, clean: false } }
  }

  const checkPRPerms = async (): Promise<boolean> => {
    try {
      const { data } = await octokit.actions.getGithubActionsDefaultWorkflowPermissionsRepository({ owner, repo })
      return data.can_approve_pull_request_reviews
    } catch {
      return true
    }
  }

  const [hasIndex, init, sync, validate, baseline, clean, canCreatePRs] = await Promise.all([
    fileExists(octokit, owner, repo, 'openspec/index.json'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-init.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-sync.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-validate.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-baseline.yml'),
    fileExists(octokit, owner, repo, '.github/workflows/specstat-clean.yml'),
    checkPRPerms(),
  ])

  return { accessible: true, isInitialized: true, hasIndex, canCreatePRs, workflows: { init, sync, validate, baseline, clean } }
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

const WORKFLOWS: Array<{ key: keyof RepoSetupStatus['workflows']; filename: string; content: string }> = [
  { key: 'init', filename: 'specstat-init.yml', content: INIT_YAML },
  { key: 'sync', filename: 'specstat-sync.yml', content: SYNC_YAML },
  { key: 'validate', filename: 'specstat-validate.yml', content: VALIDATE_YAML },
  { key: 'baseline', filename: 'specstat-baseline.yml', content: BASELINE_YAML },
  { key: 'clean', filename: 'specstat-clean.yml', content: CLEAN_YAML },
]

export interface WorkflowSetupResult {
  prUrl: string | null
  prNumber: number | null
  branch: string | null
  created: string[]
  /** null on success, 'MISSING_WORKFLOWS_PERMISSION', 'NOTHING_TO_DO', or a raw error message */
  error: string | null
  /** set to SPECSTAT_WORKFLOW_VERSION when updateWorkflowsPR succeeds */
  updatedVersion?: string
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

/**
 * Replaces ALL workflow files (including existing ones) with the current
 * templates and opens a PR. Calling this from the SpecStat Settings UI lets
 * users pull in workflow changes without having to delete files manually.
 */
export async function updateWorkflowsPR(
  octokit: Octokit,
  ownerRepo: string,
): Promise<WorkflowSetupResult> {
  const [owner, repo] = ownerRepo.split('/')

  try {
    const { data: repoMeta } = await octokit.repos.get({ owner, repo })
    const defaultBranch = repoMeta.default_branch

    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` })
    const baseSha = ref.object.sha
    const { data: baseCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: baseSha })

    const treeEntries = await Promise.all(
      WORKFLOWS.map(async ({ filename, content }) => {
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
      message: `chore(openspec): update SpecStat workflow files to v${SPECSTAT_WORKFLOW_VERSION}`,
      tree: tree.sha,
      parents: [baseSha],
    })

    const branch = `specstat/update-workflows-${Date.now().toString(36)}`
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: commit.sha })

    const fileList = WORKFLOWS.map(({ filename }) => `- \`.github/workflows/${filename}\``).join('\n')
    const { data: pr } = await octokit.pulls.create({
      owner, repo,
      head: branch,
      base: defaultBranch,
      title: `chore: update SpecStat workflow files to v${SPECSTAT_WORKFLOW_VERSION}`,
      body: `This PR updates all SpecStat OpenSpec workflow files to **v${SPECSTAT_WORKFLOW_VERSION}**:\n\n${fileList}\n\n**What changed in this version:**\n- All actions now open a PR instead of committing directly to the default branch\n- New \`specstat-clean.yml\` workflow for removing generated JSON files\n- New \`force\` input on \`specstat-init.yml\` to regenerate existing files\n\nMerge to apply the updates.\n\n— opened by [SpecStat](https://specstat.app)`,
    })

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
      branch,
      created: WORKFLOWS.map(({ filename }) => filename),
      error: null,
      updatedVersion: SPECSTAT_WORKFLOW_VERSION,
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
