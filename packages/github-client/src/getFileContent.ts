import type { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { handleGitHubError } from './errors.js'

export async function getFileContent(octokit: Octokit, repo: string, filePath: string): Promise<string> {
  const { owner, repo: repoName } = parseRepo(repo)
  try {
    const response = await octokit.repos.getContent({ owner, repo: repoName, path: filePath })
    const file = response.data as { content?: string; encoding?: string }
    if (!file.content) return ''
    return Buffer.from(file.content, 'base64').toString('utf-8')
  } catch (err) {
    handleGitHubError(err)
  }
}
