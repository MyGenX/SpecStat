'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/cn'
import { getWorkspaceRepos } from '@/lib/workspace'
import type { WorkspaceRepo } from '@specstat/types'
import {
  FileTextIcon, GitPullRequestIcon, LayersIcon, CircleDotIcon,
  CalendarIcon, ArchiveIcon, UserIcon, LogOutIcon, HomeIcon,
} from '@/components/shared/Icons'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

// ─── Nav views ────────────────────────────────────────────────────────────────

const VIEWS = [
  { href: '/stories',   label: 'Stories',   icon: FileTextIcon },
  { href: '/proposals', label: 'Proposals', icon: GitPullRequestIcon },
  { href: '/tree',      label: 'Tree',      icon: LayersIcon },
  { href: '/graph',     label: 'Graph',     icon: CircleDotIcon },
  { href: '/timeline',  label: 'Timeline',  icon: CalendarIcon },
  { href: '/archive',   label: 'Archive',   icon: ArchiveIcon },
]

const VIEW_PREFIXES = VIEWS.map((v) => v.href)
const ADD_REPO = '__add_repo__'

// ─── Repo switcher ────────────────────────────────────────────────────────────

function RepoSwitcher({ repo, pathname }: { repo: string; pathname: string }) {
  const router = useRouter()
  const [repos, setRepos] = useState<WorkspaceRepo[]>([])

  useEffect(() => {
    setRepos(getWorkspaceRepos())
  }, [])

  if (!repo && repos.length === 0) return null

  const options = repos.some((r) => r.repo === repo) || !repo ? repos : [{ repo }, ...repos]
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
      className="text-sm border border-border rounded-md px-2.5 py-1.5 bg-background text-foreground max-w-[220px] truncate cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
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

// ─── Logo ─────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 shrink-0" aria-hidden>
      <rect width="24" height="24" rx="5.5" fill="#6366F1"/>
      <line x1="12" y1="8" x2="7.5" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55"/>
      <line x1="12" y1="8" x2="16.5" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55"/>
      <circle cx="12" cy="6.5" r="2.75" fill="white"/>
      <circle cx="7.5" cy="17.5" r="2.1" fill="white" fillOpacity="0.88"/>
      <circle cx="16.5" cy="17.5" r="2.1" fill="white" fillOpacity="0.88"/>
    </svg>
  )
}

// ─── Settings gear (dropdown item) ───────────────────────────────────────────

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (status === 'unauthenticated' || !session?.user) return null

  const user = session.user

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-transparent hover:ring-primary/40 transition-all cursor-pointer focus:outline-none focus:ring-primary/60"
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? 'User'}
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
            <UserIcon className="w-4 h-4" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? 'User'}
                className="w-8 h-8 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0">
              {user.name && <p className="text-sm font-medium truncate">{user.name}</p>}
              {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <HomeIcon className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <SettingsIcon />
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOutIcon className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

export function NavBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const repo = searchParams.get('repo') ?? ''

  function navHref(base: string) {
    return repo ? `${base}?repo=${encodeURIComponent(repo)}` : base
  }

  return (
    <header className="fixed top-0 inset-x-0 h-14 border-b bg-background/80 backdrop-blur-sm z-40 flex items-center px-4 gap-6">
      <Link href="/workspace" className="flex items-center gap-2 font-semibold text-base tracking-tight shrink-0">
        <LogoIcon />
        <span>SpecStat</span>
      </Link>

      <nav className="flex items-center gap-0.5 flex-1">
        {VIEWS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={navHref(href)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/60',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </nav>

      <RepoSwitcher repo={repo} pathname={pathname} />
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}
