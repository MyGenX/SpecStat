import type { SpecRequirement, SpecScenario, SpecScenarioStep } from './parseSpecMarkdown.js'

export type DeltaOp = 'added' | 'modified' | 'removed'

export interface DeltaRequirement extends SpecRequirement {
  op: DeltaOp
}

export interface SpecRename {
  from: string
  to: string
}

export interface ParsedDeltaSpec {
  requirements: DeltaRequirement[]
  renames: SpecRename[]
}

const STEP_RE = /^[-*]?\s*\*\*(GIVEN|WHEN|THEN|AND)\*\*\s+(.+)$/

// "## ADDED Requirements" / "## MODIFIED Requirements" / "## REMOVED Requirements" / "## RENAMED Requirements"
const OP_HEADER_RE = /^##\s+(ADDED|MODIFIED|REMOVED|RENAMED)\b/i

// Strip surrounding backticks and an optional "### Requirement:" prefix from a FROM/TO value.
function cleanRequirementRef(raw: string): string {
  return raw
    .trim()
    .replace(/^`+|`+$/g, '')
    .replace(/^###\s+Requirement:\s*/i, '')
    .trim()
}

/**
 * Parse an OpenSpec *delta* spec (the file under
 * `changes/<change>/specs/<capability>/spec.md`) that uses operation headers
 * `## ADDED / MODIFIED / REMOVED / RENAMED Requirements`.
 */
export function parseDeltaSpec(md: string): ParsedDeltaSpec {
  const lines = md.split('\n')

  const requirements: DeltaRequirement[] = []
  const renames: SpecRename[] = []

  let currentOp: DeltaOp | 'renamed' | null = null
  let inRequirementBody = false
  let currentReq: DeltaRequirement | null = null
  let currentScenario: SpecScenario | null = null
  let pendingRenameFrom: string | null = null

  for (const line of lines) {
    const opMatch = line.match(OP_HEADER_RE)
    if (opMatch) {
      const word = opMatch[1]!.toUpperCase()
      currentOp =
        word === 'ADDED' ? 'added'
        : word === 'MODIFIED' ? 'modified'
        : word === 'REMOVED' ? 'removed'
        : 'renamed'
      currentReq = null
      currentScenario = null
      inRequirementBody = false
      pendingRenameFrom = null
      continue
    }

    // Any other H2 ends the current operation section.
    if (line.match(/^##\s+/)) {
      currentOp = null
      currentReq = null
      currentScenario = null
      inRequirementBody = false
      continue
    }

    if (!currentOp) continue

    if (currentOp === 'renamed') {
      const from = line.match(/^\s*[-*]\s*FROM:\s*(.+)$/i)
      if (from) {
        pendingRenameFrom = cleanRequirementRef(from[1]!)
        continue
      }
      const to = line.match(/^\s*[-*]\s*TO:\s*(.+)$/i)
      if (to && pendingRenameFrom !== null) {
        renames.push({ from: pendingRenameFrom, to: cleanRequirementRef(to[1]!) })
        pendingRenameFrom = null
      }
      continue
    }

    const reqMatch = line.match(/^###\s+Requirement:\s*(.+)$/)
    if (reqMatch) {
      currentReq = { title: reqMatch[1]!.trim(), body: '', scenarios: [], op: currentOp }
      requirements.push(currentReq)
      inRequirementBody = true
      currentScenario = null
      continue
    }

    const scenarioMatch = line.match(/^####\s+Scenario:\s*(.+)$/)
    if (scenarioMatch && currentReq) {
      currentScenario = { title: scenarioMatch[1]!.trim(), steps: [] }
      currentReq.scenarios.push(currentScenario)
      inRequirementBody = false
      continue
    }

    if (line.trim() === '---') continue

    const stepMatch = line.match(STEP_RE)
    if (stepMatch && currentScenario) {
      currentScenario.steps.push({
        keyword: stepMatch[1] as SpecScenarioStep['keyword'],
        text: stepMatch[2]!.trim(),
      })
      continue
    }

    if (inRequirementBody && currentReq && line.trim() && !line.startsWith('#')) {
      currentReq.body = (currentReq.body ? currentReq.body + ' ' : '') + line.trim()
    }
  }

  return { requirements, renames }
}
