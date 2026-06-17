import type { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { handleGitHubError } from './errors.js'
import type { VisualizeItem } from '@specstat/types'

export async function updateVisualizeJson(
  octokit: Octokit,
  repo: string,
  filePath: string,
  patch: Partial<VisualizeItem>,
): Promise<void> {
  const { owner, repo: repoName } = parseRepo(repo)
  try {
    const getResp = await octokit.repos.getContent({ owner, repo: repoName, path: filePath })
    const file = getResp.data as { content?: string; sha: string }
    if (!file.content) throw new Error('Empty file')

    const current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8')) as VisualizeItem
    const updated = { ...current, ...patch, last_updated: new Date().toISOString().split('T')[0] }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: filePath,
      message: `chore(openspec): update status for ${current.id}`,
      content: Buffer.from(JSON.stringify(updated, null, 2) + '\n').toString('base64'),
      sha: file.sha,
    })
  } catch (err) {
    handleGitHubError(err)
  }
}
