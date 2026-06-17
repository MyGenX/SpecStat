import * as core from '@actions/core'
import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import {
  parseSpecMarkdown,
  parseTasks,
  classifyPath,
} from '@specstat/openspec-parser'
import type { IndexJson, IndexItem, IndexFolder, VisualizeItem, VisualizeFolder, VisualizeItemRelations } from '@specstat/types'

interface InitOptions {
  root: string
  token: string
  repo: string
}

function nowDate(): string {
  return new Date().toISOString().split('T')[0]!
}

function nowIso(): string {
  return new Date().toISOString()
}

function inferStatus(archived: boolean, tasks: { total: number; done: number }): string {
  if (archived) return 'archived'
  if (tasks.total === 0 || tasks.done === 0) return 'draft'
  if (tasks.done >= tasks.total) return 'approved'
  return 'in-progress'
}

function listDirs(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  } catch {
    return []
  }
}

function readFileSafe(p: string): string | null {
  try { return fs.readFileSync(p, 'utf-8') } catch { return null }
}

export async function runInit({ root }: InitOptions): Promise<void> {
  core.info(`Initializing OpenSpec (spec-driven) in: ${root}`)

  const items: IndexItem[] = []
  const folders: IndexFolder[] = []
  let generatedCount = 0

  // ── Track 1: specs/ ────────────────────────────────────────────────────────
  const specsDir = path.join(root, 'specs')
  if (fs.existsSync(specsDir)) {
    for (const name of listDirs(specsDir)) {
      const dir = path.join(specsDir, name)
      const relPath = `specs/${name}`

      const vPath = path.join(dir, 'visualize.json')
      if (fs.existsSync(vPath)) {
        core.info(`Skipping existing: ${vPath}`)
        const existing = JSON.parse(fs.readFileSync(vPath, 'utf-8')) as VisualizeItem
        items.push(buildIndexItemFromVisualizeItem(existing, dir, vPath))
        continue
      }

      const mdFile = fs.readdirSync(dir).find((f) => f.endsWith('.md'))
      if (!mdFile) continue
      const mdPath = path.join(dir, mdFile)
      const mdContent = fs.readFileSync(mdPath, 'utf-8')

      const { data: fm } = matter(mdContent)
      const parsed = parseSpecMarkdown(mdContent)

      const itemId = String(fm.id ?? name)
      const title = String(fm.title ?? parsed.title ?? name)

      const item: VisualizeItem = {
        type: 'item',
        id: itemId,
        title,
        spec_type: String(fm.spec_type ?? 'spec') as VisualizeItem['spec_type'],
        status: String(fm.status ?? 'implemented') as VisualizeItem['status'],
        owner: fm.owner ? String(fm.owner) : undefined,
        spec_file: mdFile,
        created_at: nowDate(),
        last_updated: nowDate(),
        track: 'spec',
        requirement_count: parsed.requirement_count,
        scenario_count: parsed.scenario_count,
      }

      fs.writeFileSync(vPath, JSON.stringify(item, null, 2) + '\n')
      core.info(`Created spec: ${vPath}`)
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
        track: 'spec',
        requirement_count: parsed.requirement_count,
        scenario_count: parsed.scenario_count,
      })
    }

    // specs/ folder entry
    const specsFolderVPath = path.join(specsDir, 'visualize.json')
    if (!fs.existsSync(specsFolderVPath)) {
      const folder: VisualizeFolder = { type: 'folder', label: 'specs', archived: false, item_count: listDirs(specsDir).length }
      fs.writeFileSync(specsFolderVPath, JSON.stringify(folder, null, 2) + '\n')
      generatedCount++
    }
    folders.push({ path: specsDir, type: 'specs', archived: false, item_count: listDirs(specsDir).length, visualize: specsFolderVPath })
  }

  // ── Track 2: changes/ ──────────────────────────────────────────────────────
  const changesDir = path.join(root, 'changes')
  if (fs.existsSync(changesDir)) {
    // root changes/ folder entry
    const changesFolderVPath = path.join(changesDir, 'visualize.json')
    if (!fs.existsSync(changesFolderVPath)) {
      const folder: VisualizeFolder = { type: 'folder', label: 'changes', archived: false }
      fs.writeFileSync(changesFolderVPath, JSON.stringify(folder, null, 2) + '\n')
      generatedCount++
    }
    folders.push({ path: changesDir, type: 'changes', archived: false, item_count: 0, visualize: changesFolderVPath })

    const processChange = (changeDir: string, changeName: string, isArchived: boolean) => {
      const relPath = isArchived ? `changes/archive/${changeName}` : `changes/${changeName}`
      const cls = classifyPath(relPath, root)
      if (!cls) return

      const vPath = path.join(changeDir, 'visualize.json')
      if (fs.existsSync(vPath)) {
        core.info(`Skipping existing: ${vPath}`)
        const existing = JSON.parse(fs.readFileSync(vPath, 'utf-8')) as VisualizeItem
        items.push(buildIndexItemFromVisualizeItem(existing, changeDir, vPath))
        return
      }

      const tasksMd = readFileSafe(path.join(changeDir, 'tasks.md'))
      const taskProgress = tasksMd ? parseTasks(tasksMd) : { total: 0, done: 0 }
      const inferredStatus = inferStatus(isArchived, taskProgress)

      const proposalPath = path.join(changeDir, 'proposal.md')
      const designPath = path.join(changeDir, 'design.md')
      const tasksPath = path.join(changeDir, 'tasks.md')

      // Derive title from proposal "## Why" first line or folder name
      let title = changeName
      const proposalMd = readFileSafe(proposalPath)
      if (proposalMd) {
        const firstLine = proposalMd.split('\n').find((l) => l.trim() && !l.startsWith('#'))
        if (firstLine && firstLine.trim().length > 0 && firstLine.trim().length < 80) {
          title = firstLine.trim()
        }
      }
      title = changeName // keep folder name as canonical id-based title

      // Check change→spec relations (delta specs that also exist in specs/)
      const changeSpecsDir = path.join(changeDir, 'specs')
      const relatesTo: string[] = []
      if (fs.existsSync(changeSpecsDir)) {
        for (const specName of listDirs(changeSpecsDir)) {
          const finalSpecDir = path.join(root, 'specs', specName)
          if (fs.existsSync(finalSpecDir)) {
            relatesTo.push(specName)
          }
        }
      }

      const relations: VisualizeItemRelations | undefined = relatesTo.length > 0
        ? { relates_to: relatesTo }
        : undefined

      const item: VisualizeItem = {
        type: 'item',
        id: changeName,
        title: changeName,
        spec_type: 'proposal',
        status: inferredStatus as VisualizeItem['status'],
        spec_file: 'proposal.md',
        created_at: nowDate(),
        last_updated: nowDate(),
        archived: isArchived,
        track: 'change',
        tasks: taskProgress,
        docs: {
          proposal: fs.existsSync(proposalPath) ? 'proposal.md' : undefined,
          design: fs.existsSync(designPath) ? 'design.md' : undefined,
          tasks: fs.existsSync(tasksPath) ? 'tasks.md' : undefined,
        },
        relations,
      }

      fs.writeFileSync(vPath, JSON.stringify(item, null, 2) + '\n')
      core.info(`Created change: ${vPath}`)
      generatedCount++

      items.push({
        id: changeName,
        title: changeName,
        type: 'proposal',
        status: inferredStatus as IndexItem['status'],
        path: changeDir,
        spec_file: path.join(changeDir, 'proposal.md'),
        visualize: vPath,
        archived: isArchived,
        last_updated: nowDate(),
        track: 'change',
        tasks: taskProgress,
        docs: item.docs,
        relations,
      })
    }

    // Active changes (direct children of changes/, skip 'archive')
    for (const name of listDirs(changesDir)) {
      if (name === 'archive') continue
      processChange(path.join(changesDir, name), name, false)
    }

    // Archived changes
    const archiveDir = path.join(changesDir, 'archive')
    if (fs.existsSync(archiveDir)) {
      const archiveFolderVPath = path.join(archiveDir, 'visualize.json')
      if (!fs.existsSync(archiveFolderVPath)) {
        const folder: VisualizeFolder = { type: 'folder', label: 'archive', archived: true }
        fs.writeFileSync(archiveFolderVPath, JSON.stringify(folder, null, 2) + '\n')
        generatedCount++
      }
      folders.push({ path: archiveDir, type: 'archive', archived: true, item_count: listDirs(archiveDir).length, visualize: archiveFolderVPath })

      for (const name of listDirs(archiveDir)) {
        processChange(path.join(archiveDir, name), name, true)
      }
    }
  }

  // ── Root folder entry ──────────────────────────────────────────────────────
  const rootVPath = path.join(root, 'visualize.json')
  if (!fs.existsSync(rootVPath)) {
    const folder: VisualizeFolder = { type: 'folder', label: path.basename(root), archived: false, item_count: items.length }
    fs.writeFileSync(rootVPath, JSON.stringify(folder, null, 2) + '\n')
    generatedCount++
  }
  folders.unshift({ path: root, type: path.basename(root), archived: false, item_count: items.length, visualize: rootVPath })

  // ── index.json ─────────────────────────────────────────────────────────────
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
  core.info(`Generated index.json with ${items.length} items`)

  if (generatedCount === 0) {
    core.info('Nothing to generate — all files already exist.')
  } else {
    core.info(`Generated ${generatedCount} files.`)
    core.setOutput('generated_count', String(generatedCount))
  }
}

function buildIndexItemFromVisualizeItem(v: VisualizeItem, dir: string, vPath: string): IndexItem {
  return {
    id: v.id,
    title: v.title,
    type: v.spec_type,
    status: v.status,
    path: dir,
    spec_file: path.join(dir, v.spec_file),
    visualize: vPath,
    archived: v.archived ?? false,
    last_updated: v.last_updated,
    track: v.track,
    tasks: v.tasks,
    requirement_count: v.requirement_count,
    scenario_count: v.scenario_count,
    docs: v.docs,
    relations: v.relations,
  }
}
