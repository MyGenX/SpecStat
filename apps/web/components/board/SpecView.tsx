import type { ParsedSpec, SpecScenario } from '@specstat/openspec-parser'

const KEYWORD_STYLES: Record<string, string> = {
  GIVEN: 'bg-blue-50 text-blue-800 border-blue-200',
  WHEN: 'bg-amber-50 text-amber-800 border-amber-200',
  THEN: 'bg-green-50 text-green-800 border-green-200',
  AND: 'bg-muted text-muted-foreground border-border',
}

function ScenarioBlock({ scenario }: { scenario: SpecScenario }) {
  return (
    <div className="border rounded-md overflow-hidden text-xs">
      <div className="px-3 py-2 bg-muted/50 font-medium text-foreground border-b">
        {scenario.title}
      </div>
      {scenario.steps.length > 0 && (
        <div className="divide-y">
          {scenario.steps.map((step, i) => (
            <div key={i} className={`flex gap-2 px-3 py-1.5 items-baseline border-l-2 ${KEYWORD_STYLES[step.keyword] ?? KEYWORD_STYLES.AND}`}>
              <span className="font-mono font-semibold shrink-0 w-10 text-right">{step.keyword}</span>
              <span className="leading-relaxed">{step.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SpecView({ spec }: { spec: ParsedSpec }) {
  const showPurpose = spec.purpose && !spec.purpose.toLowerCase().startsWith('tbd')

  return (
    <div className="space-y-5">
      {showPurpose && (
        <p className="text-sm text-muted-foreground leading-relaxed">{spec.purpose}</p>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Requirements
          </span>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono">
            {spec.requirement_count}
          </span>
        </div>

        {spec.requirements.map((req, ri) => (
          <div key={ri} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-sm font-medium leading-snug">{req.title}</span>
              </div>
              {req.body && (
                <p className="text-xs text-muted-foreground leading-relaxed pl-3.5">{req.body}</p>
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
        ))}
      </div>
    </div>
  )
}
