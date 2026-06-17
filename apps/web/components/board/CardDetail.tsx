'use client'

import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import type { IndexItem } from '@specstat/types'
import { parseSpecMarkdown } from '@specstat/openspec-parser'
import { useFileContent, useItem, useCommitHistory, useIndex } from '@/lib/hooks'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PriorityIndicator } from '@/components/shared/PriorityIndicator'
import { TagChipList } from '@/components/shared/TagChip'
import { SpecView } from './SpecView'
import { ProposalView } from './ProposalView'
import { DesignView } from './DesignView'
import { TasksView } from './TasksView'

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
}

type ChangeTab = 'proposal' | 'design' | 'tasks'

export function CardDetail({ item, repo, onClose, onNavigate, breadcrumbs = [] }: CardDetailProps) {
  const { data: visualize } = useItem(repo, item.visualize)
  const isChange = item.track === 'change' || (!item.track && item.path.includes('/changes/'))
  const specPath = visualize?.spec_file ? `${item.path}/${visualize.spec_file}` : item.spec_file
  const { data: markdown } = useFileContent(repo, specPath)
  const { data: commits } = useCommitHistory(repo, specPath)
  const [activeTab, setActiveTab] = useState<'spec' | 'history'>('spec')
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
    <div className="fixed inset-y-0 right-0 w-[720px] bg-card border-l shadow-2xl z-50 flex flex-col">
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
          className="text-muted-foreground hover:text-foreground p-1 rounded"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-4 border-r">
          {isChange ? (
            <>
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex gap-3 flex-wrap">
                  {availableChangeTabs.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setChangeTab(t); setRawChangeMode(false) }}
                      className={`text-sm font-medium pb-1 border-b-2 capitalize ${changeTab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {changeDocContent && (
                  <button
                    onClick={() => setRawChangeMode((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border font-medium transition-colors shrink-0"
                  >
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
                    className={`text-sm font-medium pb-1 border-b-2 ${activeTab === 'spec' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
                  >
                    Spec
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`text-sm font-medium pb-1 border-b-2 ${activeTab === 'history' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
                  >
                    History
                  </button>
                </div>
                {activeTab === 'spec' && parsedSpec && parsedSpec.requirements.length > 0 && (
                  <button
                    onClick={() => setRawMode((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border font-medium transition-colors"
                  >
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
                      {c.authorAvatar && (
                        <img src={c.authorAvatar} alt={c.author} className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
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
            </>
          )}
        </div>

        <div className="w-64 shrink-0 overflow-y-auto p-4 space-y-4 text-sm">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</div>
            <StatusBadge status={item.status} />
          </div>

          {item.tasks && item.tasks.total > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tasks</div>
              <div className="text-xs">{item.tasks.done}/{item.tasks.total} ({Math.round(item.tasks.done / item.tasks.total * 100)}%)</div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(item.tasks.done / item.tasks.total * 100)}%` }} />
              </div>
            </div>
          )}

          {(item.requirement_count != null || item.scenario_count != null) && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Coverage</div>
              <div className="text-xs space-y-0.5">
                {item.requirement_count != null && <div>{item.requirement_count} requirements</div>}
                {item.scenario_count != null && <div>{item.scenario_count} scenarios</div>}
              </div>
            </div>
          )}

          {visualize?.priority && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Priority</div>
              <PriorityIndicator priority={visualize.priority} />
            </div>
          )}

          {visualize?.owner && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Owner</div>
              <div>{visualize.owner}</div>
            </div>
          )}

          {visualize?.contributors && visualize.contributors.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Contributors</div>
              <div className="text-muted-foreground">{visualize.contributors.join(', ')}</div>
            </div>
          )}

          {visualize?.tags && visualize.tags.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tags</div>
              <TagChipList tags={visualize.tags} max={10} />
            </div>
          )}

          {visualize?.version && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Version</div>
              <div className="font-mono text-xs">{visualize.version}</div>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Dates</div>
            <div className="text-xs space-y-0.5">
              <div>Created: {openspecCreated ?? visualize?.created_at ?? '—'}</div>
              <div>Updated: {visualize?.last_updated ?? item.last_updated}</div>
              {visualize?.last_commit && <div className="font-mono">{visualize.last_commit.slice(0, 7)}</div>}
            </div>
          </div>

          {allRelations.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Relations</div>
              <div className="space-y-1">
                {allRelations.map(({ id, type }) => {
                  const targetItem = index?.items.find((i) => i.id === id)
                  return (
                    <div key={`${type}:${id}`} className="text-xs">
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
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">GitHub</div>
              <div className="text-xs space-y-1">
                {visualize.github.linked_pr && (
                  <div>
                    <a href={`https://github.com/${repo}/pull/${visualize.github.linked_pr}`} target="_blank" rel="noopener" className="text-primary hover:underline">
                      PR #{visualize.github.linked_pr}
                    </a>
                  </div>
                )}
                {visualize.github.linked_issue && (
                  <div>
                    <a href={`https://github.com/${repo}/issues/${visualize.github.linked_issue}`} target="_blank" rel="noopener" className="text-primary hover:underline">
                      Issue #{visualize.github.linked_issue}
                    </a>
                  </div>
                )}
                {visualize.github.milestone && <div>Milestone: {visualize.github.milestone}</div>}
              </div>
            </div>
          )}

          {triggers.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Triggers</div>
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
