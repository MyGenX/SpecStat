'use client'

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
