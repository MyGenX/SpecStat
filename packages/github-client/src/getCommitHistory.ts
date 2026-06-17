import type { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { handleGitHubError } from './errors.js'
import type { CommitInfo } from '@specstat/types'

const PR_PATTERN = /\(#(\d+)\)/

export async function getCommitHistory(
  octokit: Octokit,
  repo: string,
  filePath: string,
  limit = 10,
): Promise<CommitInfo[]> {
  const { owner, repo: repoName } = parseRepo(repo)
  try {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo: repoName,
      path: filePath,
      per_page: limit,
    })
    return data.map((c) => {
      const message = c.commit.message.split('\n')[0] ?? ''
      const prMatch = PR_PATTERN.exec(message)
      return {
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message,
        author: c.commit.author?.name ?? c.author?.login ?? 'unknown',
        authorAvatar: c.author?.avatar_url,
        date: c.commit.author?.date ?? '',
        prNumber: prMatch ? parseInt(prMatch[1], 10) : undefined,
      }
    })
  } catch (err) {
    handleGitHubError(err)
  }
}
