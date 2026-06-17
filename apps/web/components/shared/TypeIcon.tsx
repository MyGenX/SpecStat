import type { SpecType } from '@specstat/types'

const TYPE_ICONS: Record<SpecType, string> = {
  spec: '📄',
  impl: '⚙️',
  task: '✅',
  design: '🎨',
  proposal: '💡',
  decision: '⚖️',
  component: '🧩',
  domain: '🏷️',
}

export function TypeIcon({ type }: { type: SpecType }) {
  return (
    <span title={type} aria-label={type} className="text-sm">
      {TYPE_ICONS[type]}
    </span>
  )
}
