'use client'

import { useSearchParams } from 'next/navigation'
import { useIndex } from '@/lib/hooks'
import { TimelineView } from '@/components/timeline/TimelineView'

export default function TimelinePage() {
  const searchParams = useSearchParams()
  const repo = searchParams.get('repo') ?? ''
  const { data: index, isLoading } = useIndex(repo)

  if (!repo) return <div className="p-8 text-muted-foreground">No repo selected.</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  return (
    <div className="h-[calc(100vh-56px)]">
      <TimelineView items={index.items} repo={repo} />
    </div>
  )
}
