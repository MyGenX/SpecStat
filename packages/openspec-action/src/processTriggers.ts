import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { glob } from 'glob'
import { Octokit } from '@octokit/rest'

interface TriggerOptions {
  root: string
  token: string
  repo: string
  sha: string
}

interface Trigger {
  type: string
  args: string
  itemId: string
  filePath: string
}

const TRIGGER_RE = /<!--\s*@visualizer:trigger\s+(\S+)(?:\s+(.*?))?\s*-->/g

async function getChangedMdFiles(sha: string, root: string): Promise<string[]> {
  let output = ''
  try {
    await exec.exec('git', ['diff', '--name-only', `${sha}~1..${sha}`], {
      listeners: { stdout: (d: Buffer) => { output += d.toString() } },
      silent: true,
    })
  } catch {
    return []
  }
  return output.trim().split('\n').filter((f) => f.startsWith(root) && f.endsWith('.md'))
}

function extractTriggersFromFile(filePath: string, itemId: string): Trigger[] {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const triggers: Trigger[] = []
  let match
  TRIGGER_RE.lastIndex = 0
  while ((match = TRIGGER_RE.exec(content)) !== null) {
    triggers.push({ type: match[1]!, args: match[2]?.trim() ?? '', itemId, filePath })
  }
  return triggers
}

function getItemIdFromPath(filePath: string): string {
  return path.basename(path.dirname(filePath))
}

export async function runProcessTriggers({ root, token, repo, sha }: TriggerOptions): Promise<void> {
  const changedFiles = await getChangedMdFiles(sha, root)
  if (changedFiles.length === 0) return

  const octokit = new Octokit({ auth: token })
  const [owner, repoName] = repo.split('/')

  const allTriggers: Trigger[] = []
  for (const file of changedFiles) {
    const itemId = getItemIdFromPath(file)
    allTriggers.push(...extractTriggersFromFile(file, itemId))
  }

  for (const trigger of allTriggers) {
    core.info(`Processing trigger: ${trigger.type} ${trigger.args} for ${trigger.itemId}`)
    try {
      await dispatchTrigger(octokit, owner!, repoName!, trigger)
    } catch (err) {
      core.warning(`Failed to process trigger ${trigger.type}: ${String(err)}`)
    }
  }
}

async function dispatchTrigger(
  octokit: Octokit,
  owner: string,
  repo: string,
  trigger: Trigger,
): Promise<void> {
  const prNumber = process.env.GITHUB_PR_NUMBER ? parseInt(process.env.GITHUB_PR_NUMBER, 10) : undefined

  switch (trigger.type) {
    case 'notify-team': {
      if (prNumber) {
        await octokit.issues.createComment({
          owner, repo, issue_number: prNumber,
          body: `@${trigger.args} — spec item **${trigger.itemId}** has been updated.`,
        })
      }
      break
    }
    case 'create-task': {
      const title = trigger.args.replace(/^["']|["']$/g, '')
      const { data: existing } = await octokit.issues.listForRepo({
        owner, repo, labels: 'openspec-task', state: 'open',
      })
      const alreadyExists = existing.some((i) => i.title === title && i.body?.includes(trigger.itemId))
      if (!alreadyExists) {
        await octokit.issues.create({
          owner, repo, title,
          labels: ['openspec-task'],
          body: `Task created from spec item **${trigger.itemId}**`,
        })
      }
      break
    }
    case 'link-issue': {
      const issueNumber = parseInt(trigger.args, 10)
      const vPath = path.join(path.dirname(trigger.filePath), 'visualize.json')
      if (fs.existsSync(vPath)) {
        const v = JSON.parse(fs.readFileSync(vPath, 'utf-8'))
        v.github = { ...(v.github ?? {}), linked_issue: issueNumber }
        fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n')
      }
      break
    }
    case 'set-milestone': {
      if (prNumber) {
        const { data: milestones } = await octokit.issues.listMilestones({ owner, repo })
        const milestone = milestones.find((m) => m.title === trigger.args)
        if (milestone) {
          await octokit.issues.update({ owner, repo, issue_number: prNumber, milestone: milestone.number })
        }
      }
      break
    }
    case 'request-review': {
      if (prNumber) {
        await octokit.pulls.requestReviewers({
          owner, repo, pull_number: prNumber,
          reviewers: [trigger.args],
        })
      }
      break
    }
    case 'deprecate': {
      const targetId = trigger.args
      const vPath = path.join(path.dirname(trigger.filePath), '..', targetId, 'visualize.json')
      if (fs.existsSync(vPath)) {
        const v = JSON.parse(fs.readFileSync(vPath, 'utf-8'))
        v.status = 'deprecated'
        v.last_updated = new Date().toISOString().split('T')[0]
        fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n')
      }
      break
    }
    case 'archive': {
      const vPath = path.join(path.dirname(trigger.filePath), 'visualize.json')
      if (fs.existsSync(vPath)) {
        const v = JSON.parse(fs.readFileSync(vPath, 'utf-8'))
        v.archived = true
        v.last_updated = new Date().toISOString().split('T')[0]
        fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n')
      }
      break
    }
    default:
      core.warning(`Unknown trigger type: ${trigger.type}`)
  }
}
