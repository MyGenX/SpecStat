import { Octokit } from '@octokit/rest'
import { parseRepo } from './githubAuth.js'
import { handleGitHubError } from './errors.js'

export class WorkflowDispatchNotSupportedError extends Error {
  constructor(workflowId: string) {
    super(`Workflow "${workflowId}" does not have a workflow_dispatch trigger. Update the workflow file to add one.`)
    this.name = 'WorkflowDispatchNotSupportedError'
  }
}

export async function triggerWorkflow(
  octokit: Octokit,
  ownerRepo: string,
  workflowId: string,
  ref: string,
  inputs?: Record<string, string>,
): Promise<void> {
  const { owner, repo } = parseRepo(ownerRepo)
  try {
    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs: inputs ?? {},
    })
  } catch (err) {
    const status = (err as { status?: number }).status
    const msg = err instanceof Error ? err.message : String(err)
    if (status === 422 || /workflow does not have a workflow_dispatch trigger/i.test(msg)) {
      throw new WorkflowDispatchNotSupportedError(workflowId)
    }
    handleGitHubError(err)
  }
}
