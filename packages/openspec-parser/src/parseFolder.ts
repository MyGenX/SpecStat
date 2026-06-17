import { VisualizeFolderSchema } from './validateSchema.js'
import type { VisualizeFolder } from '@specstat/types'

export function parseFolder(raw: unknown): VisualizeFolder {
  return VisualizeFolderSchema.parse(raw) as VisualizeFolder
}

export function safeParseFolder(raw: unknown): { success: true; data: VisualizeFolder } | { success: false; error: string } {
  const result = VisualizeFolderSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data as VisualizeFolder }
  }
  return { success: false, error: result.error.message }
}
