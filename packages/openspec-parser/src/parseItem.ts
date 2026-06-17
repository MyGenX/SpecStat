import { VisualizeItemSchema } from './validateSchema.js'
import type { VisualizeItem } from '@specstat/types'

export function parseItem(raw: unknown): VisualizeItem {
  return VisualizeItemSchema.parse(raw) as VisualizeItem
}

export function safeParseItem(raw: unknown): { success: true; data: VisualizeItem } | { success: false; error: string } {
  const result = VisualizeItemSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data as VisualizeItem }
  }
  return { success: false, error: result.error.message }
}
