import type { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { parseIndex } from '@specstat/openspec-parser'
import { handleGitHubError } from './errors.js'
import type { IndexJson } from '@specstat/types'

export async function getIndex(octokit: Octokit, repo: string): Promise<IndexJson> {
  const { owner, repo: repoName } = parseRepo(repo)
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: 'openspec/index.json',
    })
    const file = response.data as { content?: string; encoding?: string }
    if (!file.content) throw new Error('Empty index.json')
    const decoded = Buffer.from(file.content, 'base64').toString('utf-8')
    return parseIndex(JSON.parse(decoded))
  } catch (err) {
    handleGitHubError(err)
  }
}
