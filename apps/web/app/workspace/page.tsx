'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkspaceRepos } from '@/lib/workspace'
import { useIndex, useRepoStatus } from '@/lib/hooks'
import {
  PackageIcon, FolderIcon, PlusIcon, AlertTriangleIcon,
  CheckCircleIcon, ArrowRightIcon, GitHubIcon, CheckIcon,
} from '@/components/shared/Icons'
import type { WorkspaceRepo } from '@specstat/types'

function RepoCard({ workspaceRepo }: { workspaceRepo: WorkspaceRepo }) {
  const { data: index, isLoading: indexLoading, isError } = useIndex(workspaceRepo.repo)
  const { data: status } = useRepoStatus(workspaceRepo.repo)
  const router = useRouter()

  const fullySetup =
    status?.accessible &&
    status?.hasIndex &&
    status?.workflows.init &&
    status?.workflows.sync &&
    status?.workflows.validate &&
    status?.workflows.baseline &&
    status?.workflows.clean

  const borderClass = status == null
    ? 'border-l-border/60'
    : fullySetup
      ? 'border-l-green-500'
      : 'border-l-yellow-400'

  return (
    <button
      onClick={() => router.push(`/stories?repo=${encodeURIComponent(workspaceRepo.repo)}`)}
      className={`group text-left bg-card border border-l-4 ${borderClass} rounded-lg p-5 hover:shadow-md transition-all duration-200 w-full cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-sm min-w-0">
          <PackageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="truncate">{workspaceRepo.alias ?? workspaceRepo.repo}</span>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {workspaceRepo.alias && (
        <div className="text-xs text-muted-foreground mt-0.5 ml-6 truncate">{workspaceRepo.repo}</div>
      )}

      {status != null && !fullySetup && (
        <div className="flex items-center gap-1 mt-2 ml-6 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertTriangleIcon className="w-3 h-3" />
          Setup required
        </div>
      )}

      {indexLoading && <div className="mt-3 ml-6 text-xs text-muted-foreground">Loading…</div>}
      {isError && <div className="mt-3 ml-6 text-xs text-red-500">Failed to load</div>}

      {index && (
        <div className="mt-3 ml-6 flex gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
          <span className="flex items-center gap-1">
            <PackageIcon className="w-3 h-3" />
            {index.items.length} items
          </span>
          <span className="flex items-center gap-1">
            <FolderIcon className="w-3 h-3" />
            {index.folders.length} folders
          </span>
        </div>
      )}
    </button>
  )
}

function AddRepoCard() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push('/settings')}
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/60 rounded-lg p-5 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer min-h-[120px] w-full"
    >
      <PlusIcon className="w-5 h-5" />
      <span className="text-sm font-medium">Connect repository</span>
    </button>
  )
}

const ONBOARDING_STEPS = [
  { icon: GitHubIcon, label: 'Install GitHub App', desc: 'Grant SpecStat access to your repos' },
  { icon: PackageIcon, label: 'Connect a repo', desc: 'Choose which repos to track' },
  { icon: CheckIcon, label: 'View your specs', desc: 'Browse stories, proposals, graphs' },
]

function EmptyState() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-8 px-4">
      <div className="text-center space-y-3">
        <svg viewBox="0 0 32 32" fill="none" className="w-16 h-16 mx-auto opacity-60" aria-hidden>
          <rect width="32" height="32" rx="7" fill="#6366F1"/>
          <line x1="16" y1="11" x2="10" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55"/>
          <line x1="16" y1="11" x2="22" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55"/>
          <circle cx="16" cy="8.5" r="3.5" fill="white"/>
          <circle cx="10" cy="23.5" r="2.75" fill="white" fillOpacity="0.88"/>
          <circle cx="22" cy="23.5" r="2.75" fill="white" fillOpacity="0.88"/>
        </svg>
        <h2 className="text-xl font-semibold">Welcome to SpecStat</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Connect your first GitHub repository to start tracking specs and proposals.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
        {ONBOARDING_STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.label} className="flex sm:flex-col items-center gap-3 sm:gap-0">
              <div className="flex sm:flex-col items-center gap-2 sm:gap-2 text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{step.desc}</div>
                </div>
              </div>
              {i < ONBOARDING_STEPS.length - 1 && (
                <ArrowRightIcon className="w-4 h-4 text-muted-foreground/30 sm:rotate-0 rotate-90 sm:my-2 mx-2 sm:mx-0 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push('/settings')}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <PlusIcon className="w-4 h-4" />
        Get started
      </button>
    </div>
  )
}

export default function WorkspacePage() {
  const router = useRouter()
  const [repos, setRepos] = useState<WorkspaceRepo[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const loaded = getWorkspaceRepos()
    if (loaded.length === 1) {
      router.replace(`/stories?repo=${encodeURIComponent(loaded[0].repo)}`)
      return
    }
    setRepos(loaded)
    setLoaded(true)
  }, [router])

  if (!loaded && repos.length === 0) return null

  if (repos.length === 0) return <EmptyState />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workspace</h1>
        <span className="text-xs text-muted-foreground">{repos.length} repo{repos.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.map((r) => (
          <RepoCard key={r.repo} workspaceRepo={r} />
        ))}
        <AddRepoCard />
      </div>
    </div>
  )
}
