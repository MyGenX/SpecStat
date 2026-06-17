import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { IndexJson, IndexItem } from '@specstat/types'

interface SyncOptions {
  root: string
  token: string
  repo: string
  sha: string
}

async function getChangedFiles(prevSha: string, currentSha: string): Promise<string[]> {
  let output = ''
  await exec.exec('git', ['diff', '--name-only', `${prevSha}..${currentSha}`], {
    listeners: { stdout: (d: Buffer) => { output += d.toString() } },
    silent: true,
  })
  return output.trim().split('\n').filter(Boolean)
}

function nowDate(): string {
  return new Date().toISOString().split('T')[0]!
}

export async function runSync({ root, sha }: SyncOptions): Promise<void> {
  core.info(`Syncing OpenSpec in: ${root}`)

  let prevSha = ''
  await exec.exec('git', ['rev-parse', 'HEAD~1'], {
    listeners: { stdout: (d: Buffer) => { prevSha += d.toString().trim() } },
    silent: true,
  })

  const changedFiles = await getChangedFiles(prevSha, sha)
  const openspecChanged = changedFiles.filter((f) => f.startsWith(root + '/'))

  if (openspecChanged.length === 0) {
    core.info('No OpenSpec files changed.')
    return
  }

  const indexPath = path.join(root, 'index.json')
  if (!fs.existsSync(indexPath)) {
    core.warning('index.json not found. Run openspec-init first.')
    return
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as IndexJson
  let dirty = false

  for (const file of openspecChanged) {
    const dir = path.dirname(file)
    const itemEntry = index.items.find((i) => i.path === dir || i.spec_file === file)
    if (!itemEntry) continue

    itemEntry.last_updated = nowDate()
    itemEntry.last_commit = sha.slice(0, 7)
    dirty = true

    const vPath = itemEntry.visualize
    if (fs.existsSync(vPath)) {
      const v = JSON.parse(fs.readFileSync(vPath, 'utf-8'))
      v.last_updated = nowDate()
      v.last_commit = sha.slice(0, 7)
      fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n')
      core.info(`Updated: ${vPath}`)
    }
  }

  const addedFolders = openspecChanged
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.dirname(f))
    .filter((dir) => !index.items.find((i) => i.path === dir))

  for (const dir of addedFolders) {
    const vPath = path.join(dir, 'visualize.json')
    if (fs.existsSync(vPath)) {
      const v = JSON.parse(fs.readFileSync(vPath, 'utf-8')) as IndexItem
      index.items.push({
        id: v.id,
        title: v.title,
        type: v.type,
        status: v.status,
        path: dir,
        spec_file: path.join(dir, String(v.spec_file ?? '')),
        visualize: vPath,
        archived: v.archived ?? false,
        last_updated: nowDate(),
        last_commit: sha.slice(0, 7),
      })
      dirty = true
    }
  }

  const deletedDirs = openspecChanged
    .filter((f) => !fs.existsSync(f) && f.endsWith('.md'))
    .map((f) => path.dirname(f))

  for (const dir of deletedDirs) {
    const before = index.items.length
    index.items = index.items.filter((i) => i.path !== dir)
    if (index.items.length !== before) dirty = true
  }

  if (dirty) {
    index.meta.generated_at = new Date().toISOString()
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n')
    core.info('Updated index.json')
  }
}
