export interface TaskProgress {
  total: number
  done: number
}

export function parseTasks(md: string): TaskProgress {
  const lines = md.split('\n')
  let total = 0
  let done = 0
  for (const line of lines) {
    if (/^- \[ \]/.test(line)) { total++; continue }
    if (/^- \[x\]/i.test(line)) { total++; done++ }
  }
  return { total, done }
}
