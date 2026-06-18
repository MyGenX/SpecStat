import type { ParsedSpec, SpecRequirement, SpecScenario } from './parseSpecMarkdown.js'
import type { ParsedDeltaSpec } from './parseDeltaSpec.js'

export type RequirementState = 'implemented' | 'added' | 'modified' | 'removed'
export type ScenarioState = 'implemented' | 'added'

export interface MergedScenario extends SpecScenario {
  state: ScenarioState
}

export interface MergedRequirement {
  title: string
  body: string
  state: RequirementState
  scenarios: MergedScenario[]
}

export interface MergedSpec {
  title: string
  purpose: string
  requirements: MergedRequirement[]
  requirement_count: number
  scenario_count: number
  counts: Record<RequirementState, number>
}

function key(title: string): string {
  return title.trim().toLowerCase()
}

function toMergedScenarios(scenarios: SpecScenario[], state: ScenarioState): MergedScenario[] {
  return scenarios.map((s) => ({ ...s, state }))
}

/**
 * Project the implemented baseline spec forward through one or more change deltas,
 * tagging each requirement/scenario with its state (implemented / added / modified / removed).
 * Deltas are applied in array order (pass them oldest → newest).
 */
export function mergeSpecWithDeltas(base: ParsedSpec, deltas: ParsedDeltaSpec[]): MergedSpec {
  const merged: MergedRequirement[] = base.requirements.map((req: SpecRequirement) => ({
    title: req.title,
    body: req.body,
    state: 'implemented' as RequirementState,
    scenarios: toMergedScenarios(req.scenarios, 'implemented'),
  }))

  const indexByKey = new Map<string, MergedRequirement>()
  for (const req of merged) indexByKey.set(key(req.title), req)

  for (const delta of deltas) {
    // Renames first, so subsequent ops can match the new title.
    for (const rename of delta.renames) {
      const existing = indexByKey.get(key(rename.from))
      if (existing) {
        indexByKey.delete(key(existing.title))
        existing.title = rename.to
        if (existing.state === 'implemented') existing.state = 'modified'
        indexByKey.set(key(existing.title), existing)
      }
    }

    for (const dr of delta.requirements) {
      const existing = indexByKey.get(key(dr.title))

      if (dr.op === 'removed') {
        if (existing) existing.state = 'removed'
        else {
          const removed: MergedRequirement = {
            title: dr.title,
            body: dr.body,
            state: 'removed',
            scenarios: toMergedScenarios(dr.scenarios, 'implemented'),
          }
          merged.push(removed)
          indexByKey.set(key(removed.title), removed)
        }
        continue
      }

      if (dr.op === 'modified' && existing) {
        if (existing.state !== 'removed') existing.state = 'modified'
        if (dr.body) existing.body = dr.body
        existing.scenarios.push(...toMergedScenarios(dr.scenarios, 'added'))
        continue
      }

      // 'added', or 'modified' with no matching baseline → treat as a new requirement.
      if (existing) {
        // Same-title "added" → fold into the existing one as a modification.
        if (existing.state !== 'removed') existing.state = 'modified'
        if (dr.body) existing.body = dr.body
        existing.scenarios.push(...toMergedScenarios(dr.scenarios, 'added'))
      } else {
        const added: MergedRequirement = {
          title: dr.title,
          body: dr.body,
          state: 'added',
          scenarios: toMergedScenarios(dr.scenarios, 'added'),
        }
        merged.push(added)
        indexByKey.set(key(added.title), added)
      }
    }
  }

  const counts: Record<RequirementState, number> = {
    implemented: 0,
    added: 0,
    modified: 0,
    removed: 0,
  }
  for (const req of merged) counts[req.state] += 1

  const requirement_count = merged.filter((r) => r.state !== 'removed').length
  const scenario_count = merged.reduce(
    (sum, r) => (r.state === 'removed' ? sum : sum + r.scenarios.length),
    0,
  )

  return {
    title: base.title,
    purpose: base.purpose,
    requirements: merged,
    requirement_count,
    scenario_count,
    counts,
  }
}
