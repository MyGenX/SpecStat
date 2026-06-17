import * as core from '@actions/core'
import * as fs from 'node:fs'
import * as path from 'node:path'

function collectGeneratedFiles(dir: string, results: string[]): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectGeneratedFiles(full, results)
    } else if (entry.name === 'visualize.json' || entry.name === 'index.json') {
      results.push(full)
    }
  }
}

export async function runClean({ root }: { root: string }): Promise<void> {
  core.info(`Cleaning SpecStat-generated JSON files under: ${root}`)

  if (!fs.existsSync(root)) {
    core.warning(`Root directory not found: ${root}`)
    return
  }

  const toDelete: string[] = []
  collectGeneratedFiles(root, toDelete)

  if (toDelete.length === 0) {
    core.info('No generated files found.')
    core.setOutput('cleaned_count', '0')
    return
  }

  for (const f of toDelete) {
    fs.unlinkSync(f)
    core.info(`Deleted: ${f}`)
  }

  core.info(`Cleaned ${toDelete.length} generated files.`)
  core.setOutput('cleaned_count', String(toDelete.length))
}
