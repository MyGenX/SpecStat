'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  createOctokit,
  getIndex,
  getItem,
  getFileContent,
  getCommitHistory,
  checkRepoSetup,
  getAppInstallations,
  getInstallationRepos,
} from '@specstat/github-client'
import type { InstalledRepo } from '@specstat/github-client'
import { getWorkspaceRepos } from '@/lib/workspace'

const ACTIVE_REPO_KEY = 'specstat_active_repo'

function readActiveRepo(): string | null {
  try {
    return localStorage.getItem(ACTIVE_REPO_KEY)
  } catch {
    return null
  }
}

/**
 * Resolves the active repo for a visualization view from the `?repo=` query
 * param, guarding the case where it is absent:
 * - persists the active repo so refreshes/deep-links restore context
 * - if no param: reuse the last-selected repo, or the sole workspace repo
 * - otherwise redirect (0 repos → /settings, many → / picker) instead of
 *   silently defaulting to the first repo
 *
 * `resolving` is true while there is no repo yet (a redirect is in flight) so
 * callers can render a loading state rather than flashing empty content.
 */
export function useActiveRepo(): { repo: string; resolving: boolean } {
  const repo = useSearchParams().get('repo') ?? ''
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (repo) {
      try {
        localStorage.setItem(ACTIVE_REPO_KEY, repo)
      } catch {
        /* ignore */
      }
      return
    }
    const ws = getWorkspaceRepos()
    const last = readActiveRepo()
    const pick = ws.find((r) => r.repo === last)?.repo ?? (ws.length === 1 ? ws[0]!.repo : null)
    if (pick) {
      const landingPath = pathname === '/' ? '/stories' : pathname
      router.replace(`${landingPath}?repo=${encodeURIComponent(pick)}`)
    } else {
      router.replace(ws.length === 0 ? '/settings' : '/')
    }
  }, [repo, pathname, router])

  return { repo, resolving: !repo }
}

function useOctokit() {
  const { data: session } = useSession()
  const token = (session as { accessToken?: string } | null)?.accessToken
  return token ? createOctokit(token) : null
}

export function useIndex(repo: string) {
  const octokit = useOctokit()
  return useQuery({
    queryKey: ['index', repo],
    queryFn: () => getIndex(octokit!, repo),
    enabled: !!octokit && !!repo,
  })
}

export function useItem(repo: string, filePath: string) {
  const octokit = useOctokit()
  return useQuery({
    queryKey: ['item', repo, filePath],
    queryFn: () => getItem(octokit!, repo, filePath),
    enabled: !!octokit && !!repo && !!filePath,
  })
}

export function useFileContent(repo: string, filePath: string) {
  const octokit = useOctokit()
  return useQuery({
    queryKey: ['file', repo, filePath],
    queryFn: () => getFileContent(octokit!, repo, filePath),
    enabled: !!octokit && !!repo && !!filePath,
  })
}

export function useCommitHistory(repo: string, filePath: string, limit = 10) {
  const octokit = useOctokit()
  return useQuery({
    queryKey: ['commits', repo, filePath, limit],
    queryFn: () => getCommitHistory(octokit!, repo, filePath, limit),
    enabled: !!octokit && !!repo && !!filePath,
  })
}

export function useRepoStatus(repo: string) {
  const octokit = useOctokit()
  return useQuery({
    queryKey: ['repo-status', repo],
    queryFn: () => checkRepoSetup(octokit!, repo),
    enabled: !!octokit && !!repo,
    staleTime: 2 * 60 * 1000,
  })
}

export function useInstalledRepos() {
  const octokit = useOctokit()
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? ''
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new`
    : 'https://github.com/settings/apps'

  return useQuery({
    queryKey: ['installed-repos', appSlug],
    queryFn: async (): Promise<{ repos: InstalledRepo[]; installationId: number | null }> => {
      const installations = await getAppInstallations(octokit!, appSlug)
      if (installations.length === 0) return { repos: [], installationId: null }
      const repoLists = await Promise.all(installations.map((inst) => getInstallationRepos(octokit!, inst.id)))
      const repos = repoLists.flat()
      const unique = Array.from(new Map(repos.map((r) => [r.id, r])).values())
      return { repos: unique, installationId: installations[0].id }
    },
    enabled: !!octokit,
    staleTime: 2 * 60 * 1000,
    select: (data) => ({ ...data, installUrl, isInstalled: data.installationId !== null }),
  })
}
