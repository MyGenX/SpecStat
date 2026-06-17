import * as core from '@actions/core'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { glob } from 'glob'
import { VisualizeItemSchema } from '@specstat/openspec-parser'
import type { IndexJson } from '@specstat/types'
import { Octokit } from '@octokit/rest'

interface ValidateOptions {
  root: string
  token: string
  repo: string
}

interface ValidationError {
  file: string
  message: string
}

export async function runValidate({ root, token, repo }: ValidateOptions): Promise<void> {
  const errors: ValidationError[] = []
  const seenIds = new Map<string, string>()

  const vFiles = await glob(`${root}/**/visualize.json`, { ignore: [`${root}/visualize.json`] })

  const indexPath = path.join(root, 'index.json')
  const knownIds = new Set<string>()
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as IndexJson
    for (const item of index.items) knownIds.add(item.id)
  }

  for (const vFile of vFiles) {
    let raw: unknown
    try {
      raw = JSON.parse(fs.readFileSync(vFile, 'utf-8'))
    } catch {
      errors.push({ file: vFile, message: 'Invalid JSON' })
      continue
    }

    const parsed = (raw as Record<string, unknown>)
    if (parsed.type !== 'item') continue

    const result = VisualizeItemSchema.safeParse(raw)
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ file: vFile, message: `${issue.path.join('.')}: ${issue.message}` })
      }
      continue
    }

    const item = result.data
    if (seenIds.has(item.id)) {
      errors.push({ file: vFile, message: `Duplicate ID "${item.id}" (also in ${seenIds.get(item.id)})` })
    } else {
      seenIds.set(item.id, vFile)
    }

    const rels = item.relations ?? {}
    const allRefs = [
      ...(rels.relates_to ?? []),
      ...(rels.depends_on ?? []),
      ...(rels.implements ?? []),
      ...(rels.linked_tasks ?? []),
      ...(rels.linked_designs ?? []),
      ...(rels.supersedes ?? []),
    ]
    if (rels.superseded_by) allRefs.push(rels.superseded_by)

    for (const ref of allRefs) {
      if (!knownIds.has(ref)) {
        errors.push({ file: vFile, message: `Unresolved relation reference: "${ref}"` })
      }
    }
  }

  if (errors.length > 0) {
    const byFile = new Map<string, string[]>()
    for (const e of errors) {
      if (!byFile.has(e.file)) byFile.set(e.file, [])
      byFile.get(e.file)!.push(e.message)
    }

    let report = `## OpenSpec Validation Failed\n\n${errors.length} error(s) found:\n\n`
    for (const [file, msgs] of byFile) {
      report += `**\`${file}\`**\n`
      for (const msg of msgs) report += `- ${msg}\n`
      report += '\n'
    }

    const prNumber = process.env.GITHUB_PR_NUMBER
    if (token && repo && prNumber) {
      const octokit = new Octokit({ auth: token })
      const [owner, repoName] = repo.split('/')
      await octokit.issues.createComment({
        owner: owner!,
        repo: repoName!,
        issue_number: parseInt(prNumber, 10),
        body: report,
      })
    }

    core.setFailed(report)
  } else {
    core.info('Validation passed — no errors found.')
  }
}
