import { Octokit } from '@octokit/rest'

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token })
}

export function parseRepo(repo: string): { owner: string; repo: string } {
  const [owner, repoName] = repo.split('/')
  if (!owner || !repoName) throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`)
  return { owner, repo: repoName }
}
