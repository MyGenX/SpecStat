import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { parseTasksFull } from '@specstat/openspec-parser'
import type { TaskItem } from '@specstat/openspec-parser'

function renderTaskText(text: string) {
  // Convert backtick spans to <code> inline
  const parts = text.split(/(`[^`]+`)/)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`')
          ? <code key={i} className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{part.slice(1, -1)}</code>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <div className={`flex gap-2 items-baseline text-sm py-1 ${task.done ? 'opacity-60' : ''}`}>
      <span className={`shrink-0 text-sm ${task.done ? 'text-green-500' : 'text-muted-foreground'}`}>
        {task.done ? '✓' : '○'}
      </span>
      <span className={task.done ? 'line-through text-muted-foreground' : ''}>
        {renderTaskText(task.text)}
      </span>
    </div>
  )
}

export function TasksView({ md }: { md: string }) {
  const parsed = useMemo(() => parseTasksFull(md), [md])

  if (parsed.sections.length === 0 && parsed.total === 0) {
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{md}</ReactMarkdown>
      </div>
    )
  }

  const pct = parsed.total > 0 ? Math.round((parsed.done / parsed.total) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{parsed.done}/{parsed.total} tasks</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {parsed.sections.map((section, i) => {
          const secPct = section.total > 0 ? Math.round((section.done / section.total) * 100) : 0
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {section.title}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {section.done}/{section.total}
                </span>
              </div>
              {section.total > 0 && (
                <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary/50 rounded-full" style={{ width: `${secPct}%` }} />
                </div>
              )}
              <div className="divide-y">
                {section.tasks.map((task, j) => (
                  <TaskRow key={j} task={task} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
