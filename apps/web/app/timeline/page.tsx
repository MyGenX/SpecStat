'use client'

import { useActiveRepo, useIndex } from '@/lib/hooks'
import { TimelineView } from '@/components/timeline/TimelineView'

export default function TimelinePage() {
  const { repo, resolving } = useActiveRepo()
  const { data: index, isLoading } = useIndex(repo)

  if (resolving) return <div className="p-8 text-muted-foreground">Selecting repo…</div>
  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!index) return <div className="p-8 text-muted-foreground">Could not load repo.</div>

  return (
    <div className="h-[calc(100vh-56px)]">
      <TimelineView items={index.items} repo={repo} />
    </div>
  )
}
