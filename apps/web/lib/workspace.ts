'use client'

import type { WorkspaceRepo } from '@specstat/types'

const STORAGE_KEY = 'specstat_workspace'

export function getWorkspaceRepos(): WorkspaceRepo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WorkspaceRepo[]) : []
  } catch {
    return []
  }
}

export function addWorkspaceRepo(repo: WorkspaceRepo): void {
  const repos = getWorkspaceRepos()
  if (!repos.find((r) => r.repo === repo.repo)) {
    repos.push(repo)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos))
  }
}

export function removeWorkspaceRepo(repoName: string): void {
  const repos = getWorkspaceRepos().filter((r) => r.repo !== repoName)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(repos))
}

export function clearWorkspace(): void {
  localStorage.removeItem(STORAGE_KEY)
}
