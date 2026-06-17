import * as core from '@actions/core'
import { runInit } from './init.js'
import { runSync } from './sync.js'
import { runValidate } from './validate.js'
import { runBaseline } from './baseline.js'
import { runProcessTriggers } from './processTriggers.js'
import { runPrComment } from './prComment.js'

async function run() {
  const mode = core.getInput('mode', { required: true })
  const root = core.getInput('root') || 'openspec'
  const token = core.getInput('github_token', { required: true })
  const repo = process.env.GITHUB_REPOSITORY ?? ''
  const sha = process.env.GITHUB_SHA ?? ''

  core.info(`Running openspec-action in mode: ${mode}`)

  switch (mode) {
    case 'init':
      await runInit({ root, token, repo })
      break
    case 'sync':
      await runSync({ root, token, repo, sha })
      break
    case 'validate':
      await runValidate({ root, token, repo })
      break
    case 'baseline':
      await runBaseline({
        root,
        token,
        repo,
        baselineName: core.getInput('baseline_name') || process.env.GITHUB_EVENT_CLIENT_PAYLOAD_BASELINE_NAME || '',
        description: core.getInput('description') || '',
        triggeredBy: process.env.GITHUB_ACTOR ?? '',
      })
      break
    case 'process-triggers':
      await runProcessTriggers({ root, token, repo, sha })
      break
    case 'pr-comment':
      await runPrComment({ root, token, repo })
      break
    case 'report':
      core.info('Validation report posted.')
      break
    default:
      core.setFailed(`Unknown mode: ${mode}`)
  }
}

run().catch((err: unknown) => core.setFailed(String(err)))
