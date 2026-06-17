import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Octokit } from '@octokit/rest'
import type { IndexJson } from '@specstat/types'

interface BaselineOptions {
  root: string
  token: string
  repo: string
  baselineName: string
  description?: string
  triggeredBy?: string
}

export async function runBaseline({ root, token, repo, baselineName, description, triggeredBy }: BaselineOptions): Promise<void> {
  if (!baselineName) {
    core.setFailed('baseline_name is required')
    return
  }

  core.info(`Creating baseline: ${baselineName}`)

  const indexPath = path.join(root, 'index.json')
  if (!fs.existsSync(indexPath)) {
    core.setFailed('index.json not found. Run openspec-init first.')
    return
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as IndexJson
  const baselinesDir = path.join(root, 'baselines')
  if (!fs.existsSync(baselinesDir)) fs.mkdirSync(baselinesDir, { recursive: true })

  const snapshot = {
    ...index,
    baseline_name: baselineName,
    created_at: new Date().toISOString(),
    description: description ?? '',
    triggered_by: triggeredBy ?? '',
  }

  const snapshotPath = path.join(baselinesDir, `${baselineName}.json`)
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n')
  core.info(`Snapshot written: ${snapshotPath}`)

  await exec.exec('git', ['config', 'user.name', 'openspec-bot'])
  await exec.exec('git', ['config', 'user.email', 'bot@specstat.app'])
  await exec.exec('git', ['add', snapshotPath])
  await exec.exec('git', ['commit', '-m', `chore(openspec): baseline ${baselineName}`])

  const tagName = `openspec-baseline-${baselineName}`
  await exec.exec('git', ['tag', tagName])
  await exec.exec('git', ['push', 'origin', 'HEAD'])
  await exec.exec('git', ['push', 'origin', tagName])
  core.info(`Tag created: ${tagName}`)

  if (token && repo) {
    const [owner, repoName] = repo.split('/')
    const octokit = new Octokit({ auth: token })
    await octokit.repos.createRelease({
      owner: owner!,
      repo: repoName!,
      tag_name: tagName,
      name: `OpenSpec Baseline — ${baselineName}`,
      body: description ?? '',
    })
    core.info(`GitHub Release created for tag: ${tagName}`)
  }
}
