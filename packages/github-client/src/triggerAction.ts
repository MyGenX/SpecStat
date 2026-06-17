import type { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { handleGitHubError } from './errors.js'

export async function triggerAction(
  octokit: Octokit,
  repo: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { owner, repo: repoName } = parseRepo(repo)
  try {
    await octokit.repos.createDispatchEvent({
      owner,
      repo: repoName,
      event_type: eventType,
      client_payload: payload,
    })
  } catch (err) {
    handleGitHubError(err)
  }
}
