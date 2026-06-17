'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'

const VIEWS = [
  { href: '/board', label: 'Board' },
  { href: '/tree', label: 'Tree' },
  { href: '/graph', label: 'Graph' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/archive', label: 'Archive' },
]

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
      <Link
        href="/settings"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Settings
      </Link>
    </header>
  )
}
