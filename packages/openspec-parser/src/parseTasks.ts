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

export interface TaskItem {
  text: string
  done: boolean
}

export interface TaskSection {
  title: string
  tasks: TaskItem[]
  done: number
  total: number
}

export interface ParsedTasks {
  sections: TaskSection[]
  total: number
  done: number
}

export function parseTasksFull(md: string): ParsedTasks {
  const lines = md.split('\n')
  const sections: TaskSection[] = []
  let current: TaskSection | null = null
  let totalDone = 0
  let totalAll = 0

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      current = { title: h2[1]!.trim(), tasks: [], done: 0, total: 0 }
      sections.push(current)
      continue
    }

    const checkedMatch = line.match(/^- \[x\]\s*(.*)/i)
    if (checkedMatch) {
      const text = checkedMatch[1]!.replace(/^\d+\.\d+\s+/, '').trim()
      if (current) {
        current.tasks.push({ text, done: true })
        current.done++
        current.total++
      }
      totalDone++
      totalAll++
      continue
    }

    const uncheckedMatch = line.match(/^- \[ \]\s*(.*)/)
    if (uncheckedMatch) {
      const text = uncheckedMatch[1]!.replace(/^\d+\.\d+\s+/, '').trim()
      if (current) {
        current.tasks.push({ text, done: false })
        current.total++
      }
      totalAll++
      continue
    }
  }

  return { sections, total: totalAll, done: totalDone }
}
