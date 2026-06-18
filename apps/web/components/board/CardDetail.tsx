'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import type { IndexItem } from '@specstat/types'
import { parseSpecMarkdown, parseDeltaSpec, mergeSpecWithDeltas } from '@specstat/openspec-parser'
import type { ParsedSpec, ParsedDeltaSpec } from '@specstat/openspec-parser'
import { useFileContent, useItem, useCommitHistory, useIndex } from '@/lib/hooks'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EnhancingBadge } from '@/components/shared/EnhancingBadge'
import { PriorityIndicator } from '@/components/shared/PriorityIndicator'
import { TagChipList } from '@/components/shared/TagChip'
import {
  CircleDotIcon, CheckIcon, ListIcon, ArrowUpIcon, UserIcon, UsersIcon,
  TagIcon, CalendarIcon, LinkIcon, ZapIcon, GitPullRequestIcon, GitCommitIcon,
  FileTextIcon, HistoryIcon, LayersIcon, CodeIcon, PackageIcon, GitHubIcon,
  MilestoneIcon, ArrowRightIcon, SparklesIcon,
} from '@/components/shared/Icons'
import { SpecView } from './SpecView'
import { MergedSpecView } from './MergedSpecView'
import { ProposalView } from './ProposalView'
import { DesignView } from './DesignView'
import { TasksView } from './TasksView'

// Loads + parses a single change's delta spec for a capability, lifting the result up.
function DeltaSpecLoader({ repo, change, capability, onParsed }: {
  repo: string
  change: IndexItem
  capability: string
  onParsed: (changeId: string, delta: ParsedDeltaSpec) => void
}) {
  const { data } = useFileContent(repo, `${change.path}/specs/${capability}/spec.md`)
  useEffect(() => {
    if (data) onParsed(change.id, parseDeltaSpec(data))
  }, [data, change.id, onParsed])
  return null
}

// Merges the implemented baseline with every active change's delta and renders the unified spec.
function MergedSpecTab({ repo, capability, base, changes }: {
  repo: string
  capability: string
  base: ParsedSpec | null
  changes: IndexItem[]
}) {
  const [deltas, setDeltas] = useState<Record<string, ParsedDeltaSpec>>({})
  const handleParsed = useCallback((changeId: string, delta: ParsedDeltaSpec) => {
    setDeltas((prev) => ({ ...prev, [changeId]: delta }))
  }, [])

  const ordered = useMemo(
    () => [...changes].sort((a, b) => (a.last_updated ?? '').localeCompare(b.last_updated ?? '')),
    [changes],
  )

  const merged = useMemo(() => {
    if (!base) return null
    const collected = ordered.map((c) => deltas[c.id]).filter((d): d is ParsedDeltaSpec => !!d)
    return mergeSpecWithDeltas(base, collected)
  }, [base, ordered, deltas])

  const loaded = ordered.every((c) => deltas[c.id])

  return (
    <>
      {ordered.map((c) => (
        <DeltaSpecLoader key={c.id} repo={repo} change={c} capability={capability} onParsed={handleParsed} />
      ))}
      {!merged ? (
        <p className="text-muted-foreground text-sm">Loading spec…</p>
      ) : (
        <>
          {!loaded && (
            <p className="text-xs text-muted-foreground mb-3">Loading enhancements…</p>
          )}
          <MergedSpecView spec={merged} />
        </>
      )}
    </>
  )
}

const TRIGGER_RE = /<!--\s*@visualizer:trigger\s+(\S+)(?:\s+(.*?))?\s*-->/g

function extractTriggers(markdown: string): Array<{ type: string; args: string }> {
  const results: Array<{ type: string; args: string }> = []
  let match
  TRIGGER_RE.lastIndex = 0
  while ((match = TRIGGER_RE.exec(markdown)) !== null) {
    results.push({ type: match[1], args: match[2]?.trim() ?? '' })
  }
  return results
}

function resolveRelativeLinks(markdown: string, repo: string, branch = 'main', dir: string): string {
  return markdown.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, (_, text, href) => {
    const resolved = `https://github.com/${repo}/blob/${branch}/${dir}/${href}`
    return `[${text}](${resolved})`
  })
}

interface CardDetailProps {
  item: IndexItem
  repo: string
  onClose: () => void
  onNavigate: (item: IndexItem, repo: string) => void
  breadcrumbs?: { item: IndexItem; repo: string }[]
  variant?: 'overlay' | 'inline'
}

type ChangeTab = 'proposal' | 'design' | 'tasks'

export function CardDetail({ item, repo, onClose, onNavigate, breadcrumbs = [], variant = 'overlay' }: CardDetailProps) {
  const { data: visualize } = useItem(repo, item.visualize)
  const isChange = item.track === 'change' || (!item.track && item.path.includes('/changes/'))
  const specPath = visualize?.spec_file ? `${item.path}/${visualize.spec_file}` : item.spec_file
  const { data: markdown } = useFileContent(repo, specPath)
  const { data: commits } = useCommitHistory(repo, specPath)
  const [activeTab, setActiveTab] = useState<'spec' | 'history' | 'enhanced'>('spec')
  const availableChangeTabs = isChange
    ? (['proposal', 'design', 'tasks'] as ChangeTab[]).filter((t) => item.docs?.[t])
    : []
  const [changeTab, setChangeTab] = useState<ChangeTab>('proposal')
  const changeDocPath = isChange && item.docs?.[changeTab]
    ? `${item.path}/${item.docs[changeTab]}`
    : ''
  const { data: changeDocContent } = useFileContent(repo, changeDocPath)

  const yamlPath = isChange ? `${item.path}/.openspec.yaml` : ''
  const { data: openspecYamlContent } = useFileContent(repo, yamlPath)
  const openspecCreated = openspecYamlContent?.match(/^created:\s*(.+)$/m)?.[1]?.trim()

  const { data: index } = useIndex(repo)

  // Active changes (enhancements) targeting this implemented spec.
  const activeEnhancements = useMemo(() => {
    if (isChange) return []
    return (index?.items ?? []).filter(
      (c) =>
        (c.track === 'change' || (!c.track && c.path.includes('/changes/'))) &&
        !c.archived &&
        (c.relations?.relates_to ?? []).includes(item.id),
    )
  }, [index, isChange, item.id])

  const [rawMode, setRawMode] = useState(false)
  const [rawChangeMode, setRawChangeMode] = useState(false)

  const dir = item.path
  const resolvedMd = markdown ? resolveRelativeLinks(markdown, repo, 'main', dir) : ''
  const triggers = resolvedMd ? extractTriggers(resolvedMd) : []
  const parsedSpec = useMemo(() => resolvedMd ? parseSpecMarkdown(resolvedMd) : null, [resolvedMd])

  const relations = visualize?.relations ?? {}
  const allRelations = [
    ...((relations.relates_to ?? []).map((id) => ({ id, type: 'relates_to' }))),
    ...((relations.depends_on ?? []).map((id) => ({ id, type: 'depends_on' }))),
    ...((relations.implements ?? []).map((id) => ({ id, type: 'implements' }))),
    ...((relations.linked_tasks ?? []).map((id) => ({ id, type: 'linked_tasks' }))),
    ...((relations.linked_designs ?? []).map((id) => ({ id, type: 'linked_designs' }))),
  ]

  return (
    <div
      className={
        variant === 'inline'
          ? 'h-full w-full bg-card flex flex-col'
          : 'fixed inset-y-0 right-0 w-[720px] bg-card border-l shadow-2xl z-50 flex flex-col border-t-2 border-t-primary'
      }
    >
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-2">
              <button
                onClick={() => onNavigate(bc.item, bc.repo)}
                className="hover:text-foreground truncate max-w-[120px]"
              >
                {bc.item.id}
              </button>
              <span>›</span>
            </span>
          ))}
          <span className="font-medium text-foreground">{item.id}</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted/60 transition-colors"
          aria-label="Close panel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-4 border-r">
          {isChange ? (
            <>
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex gap-3 flex-wrap">
                  {availableChangeTabs.map((t) => {
                    const TabIcon = t === 'proposal' ? FileTextIcon : t === 'design' ? LayersIcon : CheckIcon
                    return (
                      <button
                        key={t}
                        onClick={() => { setChangeTab(t); setRawChangeMode(false) }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-md capitalize transition-colors ${changeTab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        {t}
                      </button>
                    )
                  })}
                </div>
                {changeDocContent && (
                  <button
                    onClick={() => setRawChangeMode((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border font-medium transition-colors shrink-0"
                  >
                    {rawChangeMode ? <ListIcon className="w-3 h-3" /> : <CodeIcon className="w-3 h-3" />}
                    {rawChangeMode ? 'Structured' : 'Raw'}
                  </button>
                )}
              </div>
              {!changeDocContent ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : rawChangeMode ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                    {changeDocContent}
                  </ReactMarkdown>
                </div>
              ) : changeTab === 'proposal' ? (
                <ProposalView md={changeDocContent} />
              ) : changeTab === 'design' ? (
                <DesignView md={changeDocContent} />
              ) : changeTab === 'tasks' ? (
                <TasksView md={changeDocContent} />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                    {changeDocContent}
                  </ReactMarkdown>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('spec')}
                    className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-md transition-colors ${activeTab === 'spec' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                  >
                    <FileTextIcon className="w-3.5 h-3.5" />
                    Spec
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-md transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                  >
                    <HistoryIcon className="w-3.5 h-3.5" />
                    History
                  </button>
                  {activeEnhancements.length > 0 && (
                    <button
                      onClick={() => setActiveTab('enhanced')}
                      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-md transition-colors ${activeTab === 'enhanced' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      Enhanced
                    </button>
                  )}
                </div>
                {activeTab === 'spec' && parsedSpec && parsedSpec.requirements.length > 0 && (
                  <button
                    onClick={() => setRawMode((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border font-medium transition-colors"
                  >
                    {rawMode ? <ListIcon className="w-3 h-3" /> : <CodeIcon className="w-3 h-3" />}
                    {rawMode ? 'Structured' : 'Raw'}
                  </button>
                )}
              </div>

              {activeTab === 'spec' && (
                <>
                  {parsedSpec && parsedSpec.requirements.length > 0 && !rawMode ? (
                    <SpecView spec={parsedSpec} />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      {resolvedMd ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                          {resolvedMd}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-muted-foreground">Loading spec…</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {commits?.map((c) => (
                    <div key={c.sha} className="flex gap-3 text-sm border-b pb-3">
                      {c.authorAvatar ? (
                        <img src={c.authorAvatar} alt={c.author} className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                      ) : (
                        <GitCommitIcon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{c.message}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {c.author} · {c.date.slice(0, 10)}
                          {c.prNumber && (
                            <> · <a href={`https://github.com/${repo}/pull/${c.prNumber}`} target="_blank" rel="noopener" className="text-primary hover:underline">PR #{c.prNumber}</a></>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'enhanced' && (
                <MergedSpecTab
                  repo={repo}
                  capability={item.id}
                  base={parsedSpec}
                  changes={activeEnhancements}
                />
              )}
            </>
          )}
        </div>

        <div className="w-64 shrink-0 overflow-y-auto p-4 space-y-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
              <CircleDotIcon className="w-3 h-3" />Status
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={item.status} />
              {activeEnhancements.length > 0 && (
                <EnhancingBadge count={activeEnhancements.length} />
              )}
            </div>
          </div>

          {item.tasks && item.tasks.total > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <CheckIcon className="w-3 h-3" />Tasks
              </div>
              <div className="text-xs">{item.tasks.done}/{item.tasks.total} ({Math.round(item.tasks.done / item.tasks.total * 100)}%)</div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(item.tasks.done / item.tasks.total * 100)}%` }} />
              </div>
            </div>
          )}

          {(item.requirement_count != null || item.scenario_count != null) && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <ListIcon className="w-3 h-3" />Coverage
              </div>
              <div className="text-xs space-y-0.5">
                {item.requirement_count != null && <div>{item.requirement_count} requirements</div>}
                {item.scenario_count != null && <div>{item.scenario_count} scenarios</div>}
              </div>
            </div>
          )}

          {visualize?.priority && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <ArrowUpIcon className="w-3 h-3" />Priority
              </div>
              <PriorityIndicator priority={visualize.priority} />
            </div>
          )}

          {visualize?.owner && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <UserIcon className="w-3 h-3" />Owner
              </div>
              <div>{visualize.owner}</div>
            </div>
          )}

          {visualize?.contributors && visualize.contributors.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <UsersIcon className="w-3 h-3" />Contributors
              </div>
              <div className="text-muted-foreground">{visualize.contributors.join(', ')}</div>
            </div>
          )}

          {visualize?.tags && visualize.tags.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <TagIcon className="w-3 h-3" />Tags
              </div>
              <TagChipList tags={visualize.tags} max={10} />
            </div>
          )}

          {visualize?.version && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <PackageIcon className="w-3 h-3" />Version
              </div>
              <div className="font-mono text-xs text-muted-foreground">{visualize.version}</div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
              <CalendarIcon className="w-3 h-3" />Dates
            </div>
            <div className="text-xs space-y-0.5">
              <div>Created: {openspecCreated ?? visualize?.created_at ?? '—'}</div>
              <div>Updated: {visualize?.last_updated ?? item.last_updated}</div>
              {visualize?.last_commit && (
                <div className="flex items-center gap-1">
                  <GitCommitIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono">{visualize.last_commit.slice(0, 7)}</span>
                </div>
              )}
            </div>
          </div>

          {allRelations.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <LinkIcon className="w-3 h-3" />Relations
              </div>
              <div className="space-y-1">
                {allRelations.map(({ id, type }) => {
                  const targetItem = index?.items.find((i) => i.id === id)
                  return (
                    <div key={`${type}:${id}`} className="flex items-center gap-1 text-xs">
                      <ArrowRightIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{type.replace(/_/g, ' ')}: </span>
                      {targetItem ? (
                        <button
                          onClick={() => onNavigate(targetItem, repo)}
                          className="text-primary hover:underline font-mono"
                        >
                          {id}
                        </button>
                      ) : (
                        <span className="font-mono text-muted-foreground" title="Not found in this repo's index">{id}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {visualize?.github && (visualize.github.linked_pr || visualize.github.linked_issue) && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <GitHubIcon className="w-3 h-3" />GitHub
              </div>
              <div className="text-xs space-y-1">
                {visualize.github.linked_pr && (
                  <div>
                    <a href={`https://github.com/${repo}/pull/${visualize.github.linked_pr}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
                      <GitPullRequestIcon className="w-3 h-3" />
                      PR #{visualize.github.linked_pr}
                    </a>
                  </div>
                )}
                {visualize.github.linked_issue && (
                  <div>
                    <a href={`https://github.com/${repo}/issues/${visualize.github.linked_issue}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
                      <CircleDotIcon className="w-3 h-3" />
                      Issue #{visualize.github.linked_issue}
                    </a>
                  </div>
                )}
                {visualize.github.milestone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MilestoneIcon className="w-3 h-3" />
                    {visualize.github.milestone}
                  </div>
                )}
              </div>
            </div>
          )}

          {triggers.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wide border-l-2 border-primary/30 pl-2">
                <ZapIcon className="w-3 h-3" />Triggers
              </div>
              <div className="space-y-1">
                {triggers.map((t, i) => (
                  <div key={i} className="text-xs font-mono bg-muted rounded px-2 py-1">
                    <span className="text-primary">{t.type}</span>
                    {t.args && <span className="text-muted-foreground"> {t.args}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
