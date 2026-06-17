import { IndexJsonSchema } from './validateSchema.js'
import type { IndexJson } from '@specstat/types'

export function parseIndex(raw: unknown): IndexJson {
  return IndexJsonSchema.parse(raw) as IndexJson
}

export function safeParseIndex(raw: unknown): { success: true; data: IndexJson } | { success: false; error: string } {
  const result = IndexJsonSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data as IndexJson }
  }
  return { success: false, error: result.error.message }
}
