export interface SpecScenarioStep {
  keyword: 'GIVEN' | 'WHEN' | 'THEN' | 'AND'
  text: string
}

export interface SpecScenario {
  title: string
  steps: SpecScenarioStep[]
}

export interface SpecRequirement {
  title: string
  body: string
  scenarios: SpecScenario[]
}

export interface ParsedSpec {
  title: string
  purpose: string
  requirements: SpecRequirement[]
  requirement_count: number
  scenario_count: number
}

const STEP_RE = /^[-*]?\s*\*\*(GIVEN|WHEN|THEN|AND)\*\*\s+(.+)$/

export function parseSpecMarkdown(md: string): ParsedSpec {
  const lines = md.split('\n')

  let title = ''
  let purpose = ''
  const requirements: SpecRequirement[] = []

  let inPurpose = false
  let inRequirementBody = false
  let currentReq: SpecRequirement | null = null
  let currentScenario: SpecScenario | null = null

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
      currentReq = { title: reqMatch[1]!.trim(), body: '', scenarios: [] }
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

  const scenario_count = requirements.reduce((sum, r) => sum + r.scenarios.length, 0)

  return {
    title,
    purpose,
    requirements,
    requirement_count: requirements.length,
    scenario_count,
  }
}
