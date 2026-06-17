import type { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { parseItem } from '@specstat/openspec-parser'
import { handleGitHubError } from './errors.js'
import type { VisualizeItem } from '@specstat/types'

export async function getItem(octokit: Octokit, repo: string, filePath: string): Promise<VisualizeItem> {
  const { owner, repo: repoName } = parseRepo(repo)
  try {
    const response = await octokit.repos.getContent({ owner, repo: repoName, path: filePath })
    const file = response.data as { content?: string }
    if (!file.content) throw new Error('Empty visualize.json')
    const decoded = Buffer.from(file.content, 'base64').toString('utf-8')
    return parseItem(JSON.parse(decoded))
  } catch (err) {
    handleGitHubError(err)
  }
}
