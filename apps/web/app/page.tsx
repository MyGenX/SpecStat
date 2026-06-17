'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkspaceRepos } from '@/lib/workspace'
import { useIndex } from '@/lib/hooks'
import type { WorkspaceRepo } from '@specstat/types'

function RepoCard({ workspaceRepo }: { workspaceRepo: WorkspaceRepo }) {
  const { data: index, isLoading, isError } = useIndex(workspaceRepo.repo)
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/board?repo=${encodeURIComponent(workspaceRepo.repo)}`)}
      className="text-left bg-card border rounded-lg p-6 hover:shadow-md transition-shadow w-full"
    >
      <div className="font-semibold text-base">{workspaceRepo.alias ?? workspaceRepo.repo}</div>
      <div className="text-xs text-muted-foreground mt-1">{workspaceRepo.repo}</div>
      {isLoading && <div className="mt-2 text-xs text-muted-foreground">Loading...</div>}
      {isError && <div className="mt-2 text-xs text-red-500">Failed to load</div>}
      {index && (
        <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
          <span>{index.items.length} items</span>
          <span>{index.folders.length} folders</span>
        </div>
      )}
    </button>
  )
}

export default function WorkspacePage() {
  const router = useRouter()
  const [repos, setRepos] = useState<WorkspaceRepo[]>([])

  useEffect(() => {
    const loaded = getWorkspaceRepos()
    if (loaded.length === 1) {
      router.replace(`/board?repo=${encodeURIComponent(loaded[0].repo)}`)
      return
    }
    setRepos(loaded)
  }, [router])

  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4">
        <h2 className="text-xl font-semibold">No repos connected</h2>
        <p className="text-sm text-muted-foreground">Add a GitHub repo to get started.</p>
        <button
          onClick={() => router.push('/settings')}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          Add repo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Workspace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((r) => (
          <RepoCard key={r.repo} workspaceRepo={r} />
        ))}
      </div>
    </div>
  )
}
