export interface SpecRequirement {
  title: string
  scenarios: string[]
}

export interface ParsedSpec {
  title: string
  purpose: string
  requirements: SpecRequirement[]
  requirement_count: number
  scenario_count: number
}

export function parseSpecMarkdown(md: string): ParsedSpec {
  const lines = md.split('\n')

  let title = ''
  let purpose = ''
  const requirements: SpecRequirement[] = []

  let inPurpose = false
  let currentReq: SpecRequirement | null = null

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+?)(?:\s+Specification)?\s*$/)
    if (h1 && !title) {
      title = h1[1]!.replace(/\s+Specification\s*$/i, '').trim()
      inPurpose = false
      continue
    }

    if (line.match(/^##\s+Purpose\s*$/i)) {
      inPurpose = true
      continue
    }

    if (line.match(/^#{1,2}\s+/)) {
      inPurpose = false
    }

    if (inPurpose && line.trim() && !line.startsWith('#')) {
      purpose = (purpose ? purpose + ' ' : '') + line.trim()
      continue
    }

    const reqMatch = line.match(/^###\s+Requirement:\s*(.+)$/)
    if (reqMatch) {
      currentReq = { title: reqMatch[1]!.trim(), scenarios: [] }
      requirements.push(currentReq)
      continue
    }

    const scenarioMatch = line.match(/^####\s+Scenario:\s*(.+)$/)
    if (scenarioMatch && currentReq) {
      currentReq.scenarios.push(scenarioMatch[1]!.trim())
      continue
    }
  }

  const scenario_count = requirements.reduce((sum, r) => sum + r.scenarios.length, 0)

  return {
    title,
    purpose,
    requirements,
    requirement_count: requirements.length,
    scenario_count,
  }
}
