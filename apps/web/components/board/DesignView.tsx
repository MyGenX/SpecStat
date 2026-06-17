import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { parseSections } from '@specstat/openspec-parser'
import type { MarkdownSection, MarkdownSubsection } from '@specstat/openspec-parser'

function SectionBody({ body }: { body: string }) {
  if (!body) return null
  return (
    <div className="prose prose-sm max-w-none text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{body}</ReactMarkdown>
    </div>
  )
}

function parseDecisionBody(body: string): { main: string; alternatives: string; rationale: string } {
  const altIdx = body.search(/\*\*Alternatives considered:\*\*/i)
  const ratIdx = body.search(/\*\*Rationale:\*\*/i)

  if (altIdx === -1 && ratIdx === -1) return { main: body, alternatives: '', rationale: '' }

  const firstSpecial = [altIdx, ratIdx].filter((i) => i !== -1).sort((a, b) => a - b)[0]!
  const main = body.slice(0, firstSpecial).trim()

  let alternatives = ''
  let rationale = ''

  if (altIdx !== -1) {
    const altEnd = ratIdx !== -1 && ratIdx > altIdx ? ratIdx : body.length
    alternatives = body.slice(altIdx, altEnd).replace(/\*\*Alternatives considered:\*\*/i, '').trim()
  }
  if (ratIdx !== -1) {
    const ratEnd = altIdx !== -1 && altIdx > ratIdx ? altIdx : body.length
    rationale = body.slice(ratIdx, ratEnd).replace(/\*\*Rationale:\*\*/i, '').trim()
  }

  return { main, alternatives, rationale }
}

function DecisionCard({ sub }: { sub: MarkdownSubsection }) {
  const { main, alternatives, rationale } = useMemo(() => parseDecisionBody(sub.body), [sub.body])
  const isDecision = /^D\d+:/.test(sub.title)

  if (!isDecision) {
    return (
      <div className="pl-3 border-l-2 border-muted space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{sub.title}</h4>
        <SectionBody body={sub.body} />
      </div>
    )
  }

  const [decId, ...rest] = sub.title.split(':')
  const decTitle = rest.join(':').trim()

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-start gap-3 px-3 py-2 bg-muted/40 border-b">
        <span className="shrink-0 text-xs font-mono font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">{decId}</span>
        <span className="text-sm font-medium leading-snug">{decTitle}</span>
      </div>
      <div className="px-3 py-2 space-y-2">
        {main && <SectionBody body={main} />}
        {alternatives && (
          <div className="bg-muted/50 rounded px-2 py-1.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alternatives considered</span>
            <div className="text-xs text-muted-foreground leading-relaxed">{alternatives}</div>
          </div>
        )}
        {rationale && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rationale</span>
            <div className="text-xs leading-relaxed">{rationale}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContextSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="bg-muted/30 rounded-md px-4 py-3 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Context</h3>
      <SectionBody body={section.body} />
    </div>
  )
}

function GoalsSection({ section }: { section: MarkdownSection }) {
  const body = section.body
  const nonGoalsIdx = body.search(/\*\*Non-Goals:\*\*/i)
  const goals = nonGoalsIdx !== -1 ? body.slice(0, nonGoalsIdx).replace(/\*\*Goals:\*\*/i, '').trim() : body.replace(/\*\*Goals:\*\*/i, '').trim()
  const nonGoals = nonGoalsIdx !== -1 ? body.slice(nonGoalsIdx).replace(/\*\*Non-Goals:\*\*/i, '').trim() : ''

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{section.title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="bg-green-50 border border-green-100 rounded-md px-3 py-2 space-y-1">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Goals</div>
          <SectionBody body={goals} />
        </div>
        {nonGoals && (
          <div className="bg-muted/30 border rounded-md px-3 py-2 space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Non-Goals</div>
            <SectionBody body={nonGoals} />
          </div>
        )}
      </div>
    </div>
  )
}

function RisksSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{section.title}</h3>
      <div className="bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
        <SectionBody body={section.body} />
      </div>
    </div>
  )
}

function DecisionsSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{section.title}</h3>
      {section.body && <SectionBody body={section.body} />}
      {section.subsections.map((sub, i) => (
        <DecisionCard key={i} sub={sub} />
      ))}
    </div>
  )
}

function OpenQuestionsSection({ section }: { section: MarkdownSection }) {
  const questions = section.body.split('\n').filter((l) => l.trim().startsWith('-'))
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{section.title}</h3>
      <div className="space-y-1">
        {questions.length > 0 ? questions.map((q, i) => (
          <div key={i} className="flex gap-2 text-sm">
            <span className="text-muted-foreground shrink-0">?</span>
            <span>{q.replace(/^-\s*/, '')}</span>
          </div>
        )) : <SectionBody body={section.body} />}
      </div>
    </div>
  )
}

function GenericSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{section.title}</h3>
      {section.body && <SectionBody body={section.body} />}
      {section.subsections.map((sub, i) => (
        <div key={i} className="pl-3 border-l-2 border-muted space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">{sub.title}</h4>
          <SectionBody body={sub.body} />
        </div>
      ))}
    </div>
  )
}

export function DesignView({ md }: { md: string }) {
  const parsed = useMemo(() => parseSections(md), [md])

  if (parsed.sections.length === 0) {
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{md}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {parsed.sections.map((section, i) => {
        const title = section.title.toLowerCase()
        if (title === 'context') return <ContextSection key={i} section={section} />
        if (title.includes('goals')) return <GoalsSection key={i} section={section} />
        if (title === 'decisions') return <DecisionsSection key={i} section={section} />
        if (title.includes('risks') || title.includes('trade-offs')) return <RisksSection key={i} section={section} />
        if (title.includes('open questions')) return <OpenQuestionsSection key={i} section={section} />
        return <GenericSection key={i} section={section} />
      })}
    </div>
  )
}
