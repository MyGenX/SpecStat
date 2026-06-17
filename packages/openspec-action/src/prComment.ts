import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Octokit } from '@octokit/rest'

interface PrCommentOptions {
  root: string
  token: string
  repo: string
}

export async function runPrComment({ root, token, repo }: PrCommentOptions): Promise<void> {
  const prNumber = process.env.GITHUB_PR_NUMBER
  if (!prNumber || !token || !repo) {
    core.info('Skipping PR comment — no PR context.')
    return
  }

  let diffOutput = ''
  const sha = process.env.GITHUB_SHA ?? 'HEAD'
  try {
    await exec.exec('git', ['diff', '--name-only', `${sha}~1..${sha}`], {
      listeners: { stdout: (d: Buffer) => { diffOutput += d.toString() } },
      silent: true,
    })
  } catch {
    return
  }

  const changed = diffOutput.trim().split('\n').filter((f) => f.startsWith(root) && f.endsWith('.md'))
  if (changed.length === 0) return

  const added = changed.filter((f) => {
    try { return false } catch { return true }
  })
  const modified = changed

  let body = `## OpenSpec Changes\n\n`
  if (modified.length > 0) {
    body += `**Modified:**\n`
    for (const f of modified) body += `- \`${f}\`\n`
  }

  const [owner, repoName] = repo.split('/')
  const octokit = new Octokit({ auth: token })
  await octokit.issues.createComment({
    owner: owner!,
    repo: repoName!,
    issue_number: parseInt(prNumber, 10),
    body,
  })
  core.info('Posted PR comment with spec changes.')
}
