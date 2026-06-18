import type { MergedSpec, MergedScenario, RequirementState } from '@specstat/openspec-parser'
import { cn } from '@/lib/cn'

const KEYWORD_STYLES: Record<string, string> = {
  GIVEN: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  WHEN: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  THEN: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  AND: 'bg-muted text-muted-foreground border-border',
}

const STATE_META: Record<RequirementState, { label: string; badge: string; dot: string }> = {
  implemented: {
    label: 'Implemented',
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
    dot: 'bg-violet-500',
  },
  added: {
    label: 'Added',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
  },
  modified: {
    label: 'Modified',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  removed: {
    label: 'Removed',
    badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    dot: 'bg-orange-500',
  },
}

function StateBadge({ state }: { state: RequirementState }) {
  const m = STATE_META[state]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium border shrink-0',
        m.badge,
      )}
    >
      {m.label}
    </span>
  )
}

function ScenarioBlock({ scenario }: { scenario: MergedScenario }) {
  return (
    <div className="border rounded-md overflow-hidden text-xs">
      <div className="px-3 py-2 bg-muted/50 font-medium text-foreground border-b flex items-center justify-between gap-2">
        <span>{scenario.title}</span>
        {scenario.state === 'added' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 shrink-0">
            Added
          </span>
        )}
      </div>
      {scenario.steps.length > 0 && (
        <div className="divide-y">
          {scenario.steps.map((step, i) => (
            <div
              key={i}
              className={`flex gap-2 px-3 py-1.5 items-baseline border-l-2 ${KEYWORD_STYLES[step.keyword] ?? KEYWORD_STYLES.AND}`}
            >
              <span className="font-mono font-semibold shrink-0 w-10 text-right">{step.keyword}</span>
              <span className="leading-relaxed">{step.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const SUMMARY_ORDER: RequirementState[] = ['implemented', 'added', 'modified', 'removed']

export function MergedSpecView({ spec }: { spec: MergedSpec }) {
  const showPurpose = spec.purpose && !spec.purpose.toLowerCase().startsWith('tbd')

  return (
    <div className="space-y-5">
      {showPurpose && (
        <p className="text-sm text-muted-foreground leading-relaxed">{spec.purpose}</p>
      )}

      {/* Summary of states */}
      <div className="flex flex-wrap items-center gap-2">
        {SUMMARY_ORDER.filter((s) => spec.counts[s] > 0).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('w-1.5 h-1.5 rounded-full', STATE_META[s].dot)} />
            {STATE_META[s].label}
            <span className="font-mono text-foreground">{spec.counts[s]}</span>
          </span>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Requirements
          </span>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono">
            {spec.requirement_count}
          </span>
        </div>

        {spec.requirements.map((req, ri) => {
          const removed = req.state === 'removed'
          return (
            <div key={ri} className={cn('space-y-3', removed && 'opacity-60')}>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <span className={cn('mt-1 w-1.5 h-1.5 rounded-full shrink-0', STATE_META[req.state].dot)} />
                  <span className={cn('text-sm font-medium leading-snug', removed && 'line-through')}>
                    {req.title}
                  </span>
                  <StateBadge state={req.state} />
                </div>
                {req.body && (
                  <p className={cn('text-xs text-muted-foreground leading-relaxed pl-3.5', removed && 'line-through')}>
                    {req.body}
                  </p>
                )}
              </div>

              {req.scenarios.length > 0 && (
                <div className="pl-3.5 space-y-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    Scenarios ({req.scenarios.length})
                  </span>
                  {req.scenarios.map((s, si) => (
                    <ScenarioBlock key={si} scenario={s} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
