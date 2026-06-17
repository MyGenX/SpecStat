import * as core from '@actions/core'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { glob } from 'glob'
import matter from 'gray-matter'
import type { IndexJson, IndexItem, IndexFolder, VisualizeItem, VisualizeFolder } from '@specstat/types'

interface InitOptions {
  root: string
  token: string
  repo: string
}

function toKebab(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function nowDate(): string {
  return new Date().toISOString().split('T')[0]!
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function runInit({ root }: InitOptions): Promise<void> {
  core.info(`Initializing OpenSpec in: ${root}`)

  const mdFiles = await glob(`${root}/**/*.md`, { ignore: [`${root}/index.md`] })
  const itemFolders = new Set<string>()
  for (const f of mdFiles) {
    const dir = path.dirname(f)
    if (dir !== root) itemFolders.add(dir)
  }

  let generatedCount = 0
  const items: IndexItem[] = []
  const folderPaths = new Set<string>()

  for (const dir of itemFolders) {
    const vPath = path.join(dir, 'visualize.json')
    if (fs.existsSync(vPath)) {
      core.info(`Skipping existing: ${vPath}`)
      const existing = JSON.parse(fs.readFileSync(vPath, 'utf-8')) as IndexItem
      items.push({ ...existing } as unknown as IndexItem)
      continue
    }

    const mdFile = fs.readdirSync(dir).find((f) => f.endsWith('.md'))
    if (!mdFile) continue

    const mdPath = path.join(dir, mdFile)
    const { data: fm } = matter(fs.readFileSync(mdPath, 'utf-8'))

    const itemId = String(fm.id ?? path.basename(dir))
    const title = String(fm.title ?? path.basename(dir))
    const status = String(fm.status ?? 'draft')
    const owner = String(fm.owner ?? '')

    const item: VisualizeItem = {
      type: 'item',
      id: itemId,
      title,
      spec_type: String(fm.spec_type ?? 'spec') as VisualizeItem['spec_type'],
      status: status as VisualizeItem['status'],
      owner,
      spec_file: mdFile,
      created_at: nowDate(),
      last_updated: nowDate(),
    }

    fs.writeFileSync(vPath, JSON.stringify(item, null, 2) + '\n')
    core.info(`Created: ${vPath}`)
    generatedCount++

    items.push({
      id: itemId,
      title,
      type: item.spec_type,
      status: item.status,
      path: dir,
      spec_file: path.join(dir, mdFile),
      visualize: vPath,
      archived: false,
      last_updated: nowDate(),
    })

    let parent = path.dirname(dir)
    while (parent !== root && parent !== '.') {
      folderPaths.add(parent)
      parent = path.dirname(parent)
    }
    folderPaths.add(root)
  }

  const folders: IndexFolder[] = []
  for (const folderPath of folderPaths) {
    const vPath = path.join(folderPath, 'visualize.json')
    if (!fs.existsSync(vPath)) {
      const folder: VisualizeFolder = {
        type: 'folder',
        label: path.basename(folderPath),
        archived: false,
        item_count: items.filter((i) => i.path.startsWith(folderPath + '/')).length,
      }
      fs.writeFileSync(vPath, JSON.stringify(folder, null, 2) + '\n')
      core.info(`Created folder: ${vPath}`)
      generatedCount++
    }
    folders.push({
      path: folderPath,
      type: path.basename(folderPath),
      archived: false,
      item_count: items.filter((i) => i.path.startsWith(folderPath + '/')).length,
      visualize: path.join(folderPath, 'visualize.json'),
    })
  }

  const index: IndexJson = {
    meta: {
      repo: process.env.GITHUB_REPOSITORY ?? '',
      generated_at: nowIso(),
      openspec_version: '1.0.0',
      visualizer_version: '1.0.0',
      root,
    },
    folders,
    items,
  }

  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify(index, null, 2) + '\n')
  core.info(`Generated index.json`)

  if (generatedCount === 0) {
    core.info('Nothing to generate — all files already exist.')
  } else {
    core.info(`Generated ${generatedCount} files.`)
    core.setOutput('generated_count', String(generatedCount))
  }
}
