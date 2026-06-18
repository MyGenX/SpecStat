import { GitHubIcon, StarIcon } from '@/components/shared/Icons'

const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'MyGenX/SpecStat'

async function getStars(repo: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { stargazers_count?: number }
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null
  } catch {
    return null
  }
}

export async function GitHubRepoBadge() {
  const stars = await getStars(REPO)
  const formatted =
    stars !== null ? new Intl.NumberFormat('en', { notation: 'compact' }).format(stars) : null

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${REPO} on GitHub${stars !== null ? `, ${stars} stars` : ''}`}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <GitHubIcon className="w-4 h-4" />
      <span className="hidden sm:inline font-mono">{REPO}</span>
      {formatted !== null && (
        <span className="inline-flex items-center gap-1 text-muted-foreground sm:border-l sm:border-border sm:pl-2">
          <StarIcon className="w-3.5 h-3.5" />
          {formatted}
        </span>
      )}
    </a>
  )
}
