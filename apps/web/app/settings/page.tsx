'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { getWorkspaceRepos, addWorkspaceRepo, removeWorkspaceRepo } from '@/lib/workspace'
import { useIndex, useRepoStatus, useInstalledRepos } from '@/lib/hooks'
import { createOctokit, createWorkflowSetupPR, updateWorkflowsPR, triggerWorkflow, WorkflowDispatchNotSupportedError, SPECSTAT_WORKFLOW_VERSION } from '@specstat/github-client'
import type { RepoSetupStatus, WorkflowSetupResult } from '@specstat/github-client'
import type { WorkspaceRepo } from '@specstat/types'

// ─── Setup checklist panel ────────────────────────────────────────────────────

function SetupPanel({ repo, status }: { repo: string; status: RepoSetupStatus }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<WorkflowSetupResult | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateResult, setUpdateResult] = useState<WorkflowSetupResult | null>(null)

  const token = (session as { accessToken?: string } | null)?.accessToken
  const allWorkflowsPresent =
    status.workflows.init && status.workflows.sync && status.workflows.validate && status.workflows.baseline && status.workflows.clean

  const items = [
    { label: 'openspec/index.json', ok: status.hasIndex },
    { label: 'specstat-init.yml', ok: status.workflows.init },
    { label: 'specstat-sync.yml', ok: status.workflows.sync },
    { label: 'specstat-validate.yml', ok: status.workflows.validate },
    { label: 'specstat-baseline.yml', ok: status.workflows.baseline },
    { label: 'specstat-clean.yml', ok: status.workflows.clean },
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

  async function handleUpdateWorkflows() {
    if (!token) return
    setUpdating(true)
    setUpdateResult(null)
    try {
      const octokit = createOctokit(token)
      const res = await updateWorkflowsPR(octokit, repo)
      setUpdateResult(res)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="mt-2 border-t pt-3 space-y-3">
      {!status.isInitialized && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Repository has no commits yet — clicking &quot;Add missing workflow files&quot; will create an initial commit automatically.
        </p>
      )}
      {!status.canCreatePRs && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 space-y-1">
          <p className="font-medium">GitHub Actions cannot create pull requests in this repo.</p>
          <p>
            Go to <strong>Settings → Actions → General → Workflow permissions</strong> and enable{' '}
            <em>&quot;Allow GitHub Actions to create and approve pull requests&quot;</em>.
          </p>
          <a
            href={`https://github.com/${repo}/settings/actions`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Open repo Actions settings ↗
          </a>
        </div>
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

      <div className="pt-2 border-t space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Workflow version</p>
        <p className="text-xs text-muted-foreground">Current template: <span className="font-mono">v{SPECSTAT_WORKFLOW_VERSION}</span></p>
        <button
          onClick={handleUpdateWorkflows}
          disabled={updating || !token}
          className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-md font-medium border border-border hover:bg-muted/70 disabled:opacity-50"
        >
          {updating ? 'Opening PR…' : `Sync workflow files to v${SPECSTAT_WORKFLOW_VERSION}`}
        </button>
        {updateResult?.prUrl && (
          <p className="text-xs text-green-600">
            Opened{' '}
            <a href={updateResult.prUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
              PR #{updateResult.prNumber} ↗
            </a>{' '}
            — merge to apply v{updateResult.updatedVersion}.
          </p>
        )}
        {updateResult?.error && updateResult.error !== 'MISSING_WORKFLOWS_PERMISSION' && (
          <p className="text-xs text-red-500">{updateResult.error}</p>
        )}
        {updateResult?.error === 'MISSING_WORKFLOWS_PERMISSION' && (
          <p className="text-xs text-amber-700">Missing Workflows permission — see above.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Requires push access to this repository.</p>
    </div>
  )
}

// ─── Actions panel ────────────────────────────────────────────────────────────

type ActionState = 'idle' | 'running' | 'done' | 'error'

interface WorkflowAction {
  id: string
  label: string
  workflowFile: string
  available: boolean
  inputs?: Record<string, string>
}

function ActionsPanel({ repo, status }: { repo: string; status: RepoSetupStatus }) {
  const { data: session } = useSession()
  const token = (session as { accessToken?: string } | null)?.accessToken
  const [states, setStates] = useState<Record<string, ActionState>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const actions: WorkflowAction[] = [
    { id: 'init', label: 'Run Init', workflowFile: 'specstat-init.yml', available: status.workflows.init },
    { id: 'init-force', label: 'Force Reinit', workflowFile: 'specstat-init.yml', available: status.workflows.init, inputs: { force: 'true' } },
    { id: 'sync', label: 'Run Sync', workflowFile: 'specstat-sync.yml', available: status.workflows.sync },
    { id: 'baseline', label: 'Run Baseline', workflowFile: 'specstat-baseline.yml', available: status.workflows.baseline },
    { id: 'clean', label: 'Clean JSON Files', workflowFile: 'specstat-clean.yml', available: status.workflows.clean },
  ]

  const availableActions = actions.filter((a) => a.available)
  if (availableActions.length === 0) return null

  async function handleTrigger(action: WorkflowAction) {
    if (!token) return
    setStates((s) => ({ ...s, [action.id]: 'running' }))
    setErrors((e) => ({ ...e, [action.id]: '' }))
    try {
      const octokit = createOctokit(token)
      await triggerWorkflow(octokit, repo, action.workflowFile, 'main', action.inputs)
      setStates((s) => ({ ...s, [action.id]: 'done' }))
      setTimeout(() => setStates((s) => ({ ...s, [action.id]: 'idle' })), 4000)
    } catch (err) {
      const msg =
        err instanceof WorkflowDispatchNotSupportedError
          ? 'Workflow does not support manual dispatch. Update the workflow file via "Open setup PR" to add a workflow_dispatch trigger.'
          : err instanceof Error
            ? err.message
            : 'Unknown error'
      setStates((s) => ({ ...s, [action.id]: 'error' }))
      setErrors((e) => ({ ...e, [action.id]: msg }))
    }
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</p>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => {
          const state = states[action.id] ?? 'idle'
          return (
            <button
              key={action.id}
              onClick={() => handleTrigger(action)}
              disabled={state === 'running' || !token}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 ${
                state === 'done'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : state === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : action.id === 'clean'
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      : action.id === 'init-force'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        : 'bg-muted text-foreground hover:bg-muted/70 border border-border'
              }`}
            >
              {state === 'running' ? 'Triggering…' : state === 'done' ? `${action.label} ✓` : action.label}
            </button>
          )
        })}
      </div>
      {availableActions.map(
        (action) =>
          errors[action.id] && (
            <p key={action.id} className="text-xs text-red-500 leading-relaxed">
              <strong>{action.label}:</strong> {errors[action.id]}
            </p>
          ),
      )}
      <p className="text-xs text-muted-foreground">All actions open a PR — no direct commits to main. Merge to apply, close to cancel.</p>
      {availableActions.some((a) => a.id === 'clean') && (
        <p className="text-xs text-red-600">Clean removes all generated JSON files and opens a PR — merge after running Init to regenerate.</p>
      )}
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
    status?.workflows.baseline &&
    status?.workflows.clean

  const hasAnyWorkflow =
    status?.workflows.init || status?.workflows.sync || status?.workflows.baseline

  const showExpand = !statusLoading && status && (!fullySetup || hasAnyWorkflow)

  return (
    <div className="border rounded-md px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="font-medium text-sm">{entry.alias ?? entry.repo}</div>
            {entry.alias && <div className="text-xs text-muted-foreground">{entry.repo}</div>}
            {index && <div className="text-xs text-muted-foreground mt-0.5">{index.items.length} items</div>}
          </div>
          {showExpand && !fullySetup && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium hover:bg-yellow-200 transition-colors"
            >
              Setup required
            </button>
          )}
          {showExpand && fullySetup && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-full border font-medium transition-colors"
            >
              {expanded ? 'Hide actions' : 'Actions'}
            </button>
          )}
        </div>
        <button onClick={onRemove} className="shrink-0 text-xs text-red-500 hover:underline">
          Remove
        </button>
      </div>

      {expanded && status && (
        <>
          <SetupPanel repo={entry.repo} status={status} />
          {hasAnyWorkflow && <ActionsPanel repo={entry.repo} status={status} />}
        </>
      )}
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
