'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { getWorkspaceRepos, addWorkspaceRepo, removeWorkspaceRepo } from '@/lib/workspace'
import { useIndex, useRepoStatus, useInstalledRepos } from '@/lib/hooks'
import { createOctokit, createWorkflowSetupPR } from '@specstat/github-client'
import type { RepoSetupStatus, WorkflowSetupResult } from '@specstat/github-client'
import type { WorkspaceRepo } from '@specstat/types'

// ─── Setup checklist panel ────────────────────────────────────────────────────

function SetupPanel({ repo, status }: { repo: string; status: RepoSetupStatus }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<WorkflowSetupResult | null>(null)

  const token = (session as { accessToken?: string } | null)?.accessToken
  const allWorkflowsPresent =
    status.workflows.init && status.workflows.sync && status.workflows.validate && status.workflows.baseline

  const items = [
    { label: 'openspec/index.json', ok: status.hasIndex },
    { label: 'openspec-init.yml', ok: status.workflows.init },
    { label: 'openspec-sync.yml', ok: status.workflows.sync },
    { label: 'openspec-validate.yml', ok: status.workflows.validate },
    { label: 'openspec-baseline.yml', ok: status.workflows.baseline },
  ]

  async function handleCreateWorkflows() {
    if (!token) return
    setCreating(true)
    setResult(null)
    try {
      const octokit = createOctokit(token)
      const res = await createWorkflowSetupPR(octokit, repo, status.workflows)
      setResult(res)
      if (res.prUrl) await queryClient.invalidateQueries({ queryKey: ['repo-status', repo] })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mt-2 border-t pt-3 space-y-3">
      {!status.isInitialized && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Repository has no commits yet — clicking &quot;Add missing workflow files&quot; will create an initial commit automatically.
        </p>
      )}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setup checklist</p>
      <ul className="space-y-1.5">
        {items.map(({ label, ok }) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            <span className={ok ? 'text-green-500' : 'text-muted-foreground'}>{ok ? '✓' : '○'}</span>
            <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
          </li>
        ))}
      </ul>

      {!allWorkflowsPresent && (
        <button
          onClick={handleCreateWorkflows}
          disabled={creating || !token}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
        >
          {creating ? 'Opening PR…' : 'Open setup PR'}
        </button>
      )}

      {!status.hasIndex && (
        <p className="text-xs text-muted-foreground">
          After the PR is merged, trigger <strong>OpenSpec Init</strong> from the repo&apos;s Actions tab to generate the index.
        </p>
      )}

      {result?.prUrl && (
        <p className="text-xs text-green-600">
          Opened{' '}
          <a href={result.prUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
            PR #{result.prNumber} ↗
          </a>{' '}
          — merge it, then run OpenSpec Init.
        </p>
      )}

      {result?.error === 'MISSING_WORKFLOWS_PERMISSION' && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 space-y-1">
          <p>
            SpecStat&apos;s GitHub App needs the <strong>Workflows</strong> permission to add files under{' '}
            <code>.github/workflows/</code>. An org/repo admin must approve the updated permissions, then try again.
          </p>
          <a
            href="https://github.com/settings/installations"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Review installation permissions ↗
          </a>
        </div>
      )}

      {result?.error && result.error !== 'MISSING_WORKFLOWS_PERMISSION' && result.error !== 'NOTHING_TO_DO' && (
        <p className="text-xs text-red-500">{result.error}</p>
      )}

      <p className="text-xs text-muted-foreground">Requires push access to this repository.</p>
    </div>
  )
}

// ─── Repo row ─────────────────────────────────────────────────────────────────

function RepoRow({ entry, onRemove }: { entry: WorkspaceRepo; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const { data: index } = useIndex(entry.repo)
  const { data: status, isLoading: statusLoading } = useRepoStatus(entry.repo)

  const fullySetup =
    status?.accessible &&
    status?.hasIndex &&
    status?.workflows.init &&
    status?.workflows.sync &&
    status?.workflows.validate &&
    status?.workflows.baseline

  return (
    <div className="border rounded-md px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="font-medium text-sm">{entry.alias ?? entry.repo}</div>
            {entry.alias && <div className="text-xs text-muted-foreground">{entry.repo}</div>}
            {index && <div className="text-xs text-muted-foreground mt-0.5">{index.items.length} items</div>}
          </div>
          {!statusLoading && status && !fullySetup && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium hover:bg-yellow-200 transition-colors"
            >
              Setup required
            </button>
          )}
        </div>
        <button onClick={onRemove} className="shrink-0 text-xs text-red-500 hover:underline">
          Remove
        </button>
      </div>

      {expanded && status && <SetupPanel repo={entry.repo} status={status} />}
    </div>
  )
}

// ─── Add repo panel (GitHub App aware) ───────────────────────────────────────

function AddRepoPanel({ onAdded }: { onAdded: () => void }) {
  const queryClient = useQueryClient()
  const { data: installed, isLoading } = useInstalledRepos()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [alias, setAlias] = useState('')

  // After GitHub redirects back with ?installation_id=…, refresh the list
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('installation_id')) {
      queryClient.invalidateQueries({ queryKey: ['installed-repos'] })
      window.history.replaceState({}, '', '/settings')
    }
  }, [queryClient])

  // If GitHub App slug isn't configured, fall back to manual text input
  if (!process.env.NEXT_PUBLIC_GITHUB_APP_SLUG) {
    return <ManualAddPanel onAdded={onAdded} />
  }

  if (isLoading) {
    return (
      <div className="border rounded-md p-4">
        <p className="text-sm text-muted-foreground">Checking GitHub App installation…</p>
      </div>
    )
  }

  // App not installed yet
  if (!installed?.isInstalled) {
    return (
      <div className="border rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Connect SpecStat to your repos</p>
        <p className="text-sm text-muted-foreground">
          Install the SpecStat GitHub App to choose which repositories SpecStat can access.
        </p>
        <a
          href={installed?.installUrl}
          className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          Install GitHub App →
        </a>
      </div>
    )
  }

  const alreadyAdded = new Set(getWorkspaceRepos().map((r) => r.repo))
  const available = (installed.repos ?? []).filter((r) => !alreadyAdded.has(r.full_name))
  const filtered = search
    ? available.filter((r) => r.full_name.toLowerCase().includes(search.toLowerCase()))
    : available

  function handleAdd() {
    if (!selected) return
    addWorkspaceRepo({ repo: selected, alias: alias.trim() || undefined })
    setSelected('')
    setAlias('')
    setSearch('')
    onAdded()
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Add a repo</p>
        <a
          href={`https://github.com/settings/installations/${installed.installationId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:underline"
        >
          Manage access ↗
        </a>
      </div>

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">All accessible repos are already connected.</p>
      ) : (
        <>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Search repos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto border rounded-md divide-y text-sm">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-muted-foreground text-xs">No matches.</p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.full_name}
                  onClick={() => setSelected(r.full_name)}
                  className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${selected === r.full_name ? 'bg-muted font-medium' : ''}`}
                >
                  <span>{r.full_name}</span>
                  {r.private && (
                    <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">private</span>
                  )}
                  {r.description && (
                    <span className="block text-xs text-muted-foreground truncate">{r.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Add Repo
          </button>
        </>
      )}

      <a
        href={installed.installUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-muted-foreground hover:underline"
      >
        Grant access to more repos ↗
      </a>
    </div>
  )
}

// ─── Manual fallback (used when NEXT_PUBLIC_GITHUB_APP_SLUG is not set) ───────

function ManualAddPanel({ onAdded }: { onAdded: () => void }) {
  const { data: session } = useSession()
  const [input, setInput] = useState('')
  const [alias, setAlias] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const token = (session as { accessToken?: string } | null)?.accessToken

  async function handleAdd() {
    setError('')
    if (!input.trim()) return
    const repo = input.trim()
    setAdding(true)
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      })
      if (res.status === 404) { setError('Repository not found.'); return }
      if (res.status === 403) { setError('Access denied. Check your permissions.'); return }
      if (!res.ok) { setError('Could not reach repository.'); return }
      addWorkspaceRepo({ repo, alias: alias.trim() || undefined })
      setInput('')
      setAlias('')
      onAdded()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <p className="text-sm font-medium">Add a repo</p>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        placeholder="org/repo-name"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <input
        className="w-full border rounded-md px-3 py-2 text-sm"
        placeholder="Alias (optional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleAdd}
        disabled={adding || !input.trim()}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {adding ? 'Checking…' : 'Add Repo'}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession()
  const [repos, setRepos] = useState<WorkspaceRepo[]>([])

  useEffect(() => {
    setRepos(getWorkspaceRepos())
  }, [])

  function handleRemove(repoName: string) {
    removeWorkspaceRepo(repoName)
    setRepos(getWorkspaceRepos())
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Connected Repos</h2>
        {repos.length === 0 && <p className="text-sm text-muted-foreground">No repos connected yet.</p>}
        <div className="space-y-2">
          {repos.map((r) => (
            <RepoRow key={r.repo} entry={r} onRemove={() => handleRemove(r.repo)} />
          ))}
        </div>

        <AddRepoPanel onAdded={() => setRepos(getWorkspaceRepos())} />
      </section>

      <section className="space-y-3 pt-4 border-t">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{session?.user?.name}</span>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-red-500 hover:underline">
          Sign out
        </button>
      </section>
    </div>
  )
}
