export type Track = 'spec' | 'change'

export interface ClassifyResult {
  track: Track
  archived: boolean
  changeName?: string
}

/**
 * Given a path relative to the openspec root (e.g. "specs/board-view" or
 * "changes/add-auth" or "changes/archive/2026-06-17-specstat"), return the
 * track classification, or null if the path is not a recognized top-level item.
 */
export function classifyPath(relPath: string, _root: string): ClassifyResult | null {
  const parts = relPath.replace(/\\/g, '/').split('/').filter(Boolean)
  if (parts.length === 0) return null

  const [first, second, third] = parts

  if (first === 'specs' && second) {
    return { track: 'spec', archived: false }
  }

  if (first === 'changes') {
    if (second === 'archive' && third) {
      return { track: 'change', archived: true, changeName: third }
    }
    if (second && second !== 'archive') {
      return { track: 'change', archived: false, changeName: second }
    }
  }

  return null
}
