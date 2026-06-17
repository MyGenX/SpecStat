'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { getWorkspaceRepos } from '@/lib/workspace'
import type { WorkspaceRepo } from '@specstat/types'

const VIEWS = [
  { href: '/stories', label: 'Stories' },
  { href: '/changes', label: 'Changes' },
  { href: '/board', label: 'Board' },
  { href: '/tree', label: 'Tree' },
  { href: '/graph', label: 'Graph' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/archive', label: 'Archive' },
]

const VIEW_PREFIXES = VIEWS.map((v) => v.href)
const ADD_REPO = '__add_repo__'

function RepoSwitcher({ repo, pathname }: { repo: string; pathname: string }) {
  const router = useRouter()
  const [repos, setRepos] = useState<WorkspaceRepo[]>([])

  useEffect(() => {
    setRepos(getWorkspaceRepos())
  }, [])

  // Nothing to show if there's no active repo and no connected repos.
  if (!repo && repos.length === 0) return null

  // Ensure the current repo is always selectable even if not yet in the list.
  const options = repos.some((r) => r.repo === repo) || !repo ? repos : [{ repo }, ...repos]

  // Switch within a view; from a non-view page (/, /settings) land on stories.
  const targetBase = VIEW_PREFIXES.some((p) => pathname.startsWith(p)) ? pathname : '/stories'

  return (
    <select
      value={repo}
      onChange={(e) => {
        const next = e.target.value
        if (next === ADD_REPO) {
          router.push('/settings')
          return
        }
        router.push(`${targetBase}?repo=${encodeURIComponent(next)}`)
      }}
      className="text-sm border rounded-md px-2 py-1.5 bg-background max-w-[220px] truncate"
      aria-label="Active repository"
    >
      {options.map((r) => (
        <option key={r.repo} value={r.repo}>
          {r.alias ?? r.repo}
        </option>
      ))}
      <option value={ADD_REPO}>+ Add repo…</option>
    </select>
  )
}

export function NavBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const repo = searchParams.get('repo') ?? ''

  function navHref(base: string) {
    return repo ? `${base}?repo=${encodeURIComponent(repo)}` : base
  }

  return (
    <header className="fixed top-0 inset-x-0 h-14 border-b bg-card z-40 flex items-center px-4 gap-6">
      <Link href="/" className="font-bold text-lg tracking-tight">
        SpecStat
      </Link>
      <nav className="flex items-center gap-1 flex-1">
        {VIEWS.map(({ href, label }) => (
          <Link
            key={href}
            href={navHref(href)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <RepoSwitcher repo={repo} pathname={pathname} />
      <Link
        href="/settings"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Settings
      </Link>
    </header>
  )
}
