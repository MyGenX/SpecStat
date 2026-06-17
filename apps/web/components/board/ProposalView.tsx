import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { parseSections } from '@specstat/openspec-parser'
import type { MarkdownSection } from '@specstat/openspec-parser'

function SectionBody({ body }: { body: string }) {
  if (!body) return null
  return (
    <div className="prose prose-sm max-w-none text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {body}
      </ReactMarkdown>
    </div>
  )
}

function GenericSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
      {section.body && <SectionBody body={section.body} />}
      {section.subsections.map((sub, i) => (
        <div key={i} className="pl-3 border-l-2 border-muted space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{sub.title}</h4>
          <SectionBody body={sub.body} />
        </div>
      ))}
    </div>
  )
}

function WhySection({ section }: { section: MarkdownSection }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-md px-4 py-3 space-y-2">
      <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Why</h3>
      <SectionBody body={section.body} />
    </div>
  )
}

function CapabilitiesSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
      {section.body && <SectionBody body={section.body} />}
      {section.subsections.map((sub, i) => (
        <div key={i} className="space-y-1.5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{sub.title}</div>
          <div className="pl-3 border-l-2 border-primary/20">
            <SectionBody body={sub.body} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ImpactSection({ section }: { section: MarkdownSection }) {
  return (
    <div className="bg-muted/40 rounded-md px-4 py-3 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Impact</h3>
      <SectionBody body={section.body} />
      {section.subsections.map((sub, i) => (
        <div key={i} className="space-y-1">
          <div className="text-xs font-medium">{sub.title}</div>
          <SectionBody body={sub.body} />
        </div>
      ))}
    </div>
  )
}

export function ProposalView({ md }: { md: string }) {
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
        if (title === 'why') return <WhySection key={i} section={section} />
        if (title.includes('capabilities')) return <CapabilitiesSection key={i} section={section} />
        if (title === 'impact') return <ImpactSection key={i} section={section} />
        return <GenericSection key={i} section={section} />
      })}
    </div>
  )
}
