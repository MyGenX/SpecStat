import type { SpecType } from '@specstat/types'
import { cn } from '@/lib/cn'

const TYPE_PATHS: Record<SpecType, JSX.Element> = {
  spec: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
  ),
  impl: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
  ),
  task: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M16 21H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.586a1 1 0 0 1 .707.293l.707.707H16a2 2 0 0 1 2 2v1" />
  ),
  design: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l-1.5 3h-4l3.5 2.5-1.5 3.5L12 9l3.5 2 -1.5-3.5L17.5 5h-4L12 2zM5 15h14M7 19h10" />
  ),
  proposal: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m1.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  ),
  decision: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v12m0 0 4-4m-4 4-4-4m16-4v4a4 4 0 0 1-4 4H6" />
  ),
  component: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  ),
  domain: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0 0c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 18c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m-9 9h18" />
  ),
}

export function TypeIcon({ type, className }: { type: SpecType; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-label={type}
      className={cn('w-4 h-4 text-muted-foreground shrink-0', className)}
    >
      {TYPE_PATHS[type]}
    </svg>
  )
}
