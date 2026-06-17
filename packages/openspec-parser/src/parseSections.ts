export interface MarkdownSubsection {
  title: string
  body: string
}

export interface MarkdownSection {
  title: string
  body: string
  subsections: MarkdownSubsection[]
}

export interface ParsedSections {
  preamble: string
  sections: MarkdownSection[]
}

export function parseSections(md: string): ParsedSections {
  const lines = md.split('\n')
  const sections: MarkdownSection[] = []
  let preamble = ''
  let currentSection: MarkdownSection | null = null
  let currentSub: MarkdownSubsection | null = null

  for (const line of lines) {
    if (line.trim() === '---') continue

    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      currentSub = null
      currentSection = { title: h2[1]!.trim(), body: '', subsections: [] }
      sections.push(currentSection)
      continue
    }

    const h3 = line.match(/^###\s+(.+)$/)
    if (h3 && currentSection) {
      currentSub = { title: h3[1]!.trim(), body: '' }
      currentSection.subsections.push(currentSub)
      continue
    }

    if (currentSub) {
      currentSub.body += (currentSub.body ? '\n' : '') + line
    } else if (currentSection) {
      currentSection.body += (currentSection.body ? '\n' : '') + line
    } else {
      preamble += (preamble ? '\n' : '') + line
    }
  }

  // Trim trailing whitespace from all bodies
  preamble = preamble.trim()
  for (const s of sections) {
    s.body = s.body.trim()
    for (const sub of s.subsections) {
      sub.body = sub.body.trim()
    }
  }

  return { preamble, sections }
}
