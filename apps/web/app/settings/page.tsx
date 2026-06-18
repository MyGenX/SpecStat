'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { getWorkspaceRepos, addWorkspaceRepo, removeWorkspaceRepo } from '@/lib/workspace'
import { useIndex, useRepoStatus, useInstalledRepos } from '@/lib/hooks'
import { createOctokit, createWorkflowSetupPR, updateWorkflowsPR, triggerWorkflow, WorkflowDispatchNotSupportedError, SPECSTAT_WORKFLOW_VERSION } from '@specstat/github-client'
import type { RepoSetupStatus, WorkflowSetupResult } from '@specstat/github-client'
import type { WorkspaceRepo } from '@specstat/types'
import {
  CheckIcon, CircleIcon, GitPullRequestIcon, RefreshCwIcon, PlayIcon, ZapIcon,
  TrashIcon, AlertTriangleIcon, ExternalLinkIcon, PackageIcon, UserIcon,
  ChevronDownIcon, ChevronUpIcon, ListIcon, SearchIcon, PlusIcon, CheckCircleIcon,
  GitHubIcon,
} from '@/components/shared/Icons'

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
    <div className="space-y-3">
      {!status.isInitialized && (
        <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
          <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Repository has no commits yet — clicking "Open setup PR" will create an initial commit automatically.</span>
        </div>
      )}
      {!status.canCreatePRs && (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 space-y-1">
          <p className="font-medium">GitHub Actions cannot create pull requests in this repo.</p>
          <p>Go to <strong>Settings → Actions → General → Workflow permissions</strong> and enable <em>"Allow GitHub Actions to create and approve pull requests"</em>.</p>
          <a href={`https://github.com/${repo}/settings/actions`} target="_blank" rel="noopener noreferrer" className="font-medium underline inline-flex items-center gap-1">
            Open repo Actions settings <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <ListIcon className="w-3.5 h-3.5" />Setup checklist
      </p>
      <ul className="space-y-1.5">
        {items.map(({ label, ok }) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            {ok
              ? <CheckIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
              : <CircleIcon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            }
            <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {!allWorkflowsPresent && (
          <button
            onClick={handleCreateWorkflows}
            disabled={creating || !token}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
          >
            <GitPullRequestIcon className="w-3.5 h-3.5" />
            {creating ? 'Opening PR…' : 'Open setup PR'}
          </button>
        )}
      </div>

      {!status.hasIndex && (
        <p className="text-xs text-muted-foreground">
          After the PR is merged, trigger <strong>OpenSpec Init</strong> from the repo's Actions tab to generate the index.
        </p>
      )}

      {result?.prUrl && (
        <p className="text-xs text-green-600">
          Opened <a href={result.prUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">PR #{result.prNumber}</a> — merge it, then run OpenSpec Init.
        </p>
      )}

      {result?.error === 'MISSING_WORKFLOWS_PERMISSION' && (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 space-y-1">
          <p>SpecStat's GitHub App needs the <strong>Workflows</strong> permission. An org/repo admin must approve the updated permissions, then try again.</p>
          <a href="https://github.com/settings/installations" target="_blank" rel="noopener noreferrer" className="font-medium underline inline-flex items-center gap-1">
            Review installation permissions <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      )}

      {result?.error && result.error !== 'MISSING_WORKFLOWS_PERMISSION' && result.error !== 'NOTHING_TO_DO' && (
        <p className="text-xs text-red-500">{result.error}</p>
      )}

      <div className="pt-2 border-t space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <RefreshCwIcon className="w-3.5 h-3.5" />Workflow version
        </p>
        <p className="text-xs text-muted-foreground">Current template: <span className="font-mono">v{SPECSTAT_WORKFLOW_VERSION}</span></p>
        <button
          onClick={handleUpdateWorkflows}
          disabled={updating || !token}
          className="flex items-center gap-1.5 text-xs bg-muted text-foreground px-3 py-1.5 rounded-md font-medium border border-border hover:bg-muted/70 disabled:opacity-50"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" />
          {updating ? 'Opening PR…' : `Sync to v${SPECSTAT_WORKFLOW_VERSION}`}
        </button>
        {updateResult?.prUrl && (
          <p className="text-xs text-green-600">
            Opened <a href={updateResult.prUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">PR #{updateResult.prNumber}</a> — merge to apply v{updateResult.updatedVersion}.
          </p>
        )}
        {updateResult?.error && updateResult.error !== 'MISSING_WORKFLOWS_PERMISSION' && (
          <p className="text-xs text-red-500">{updateResult.error}</p>
        )}
        {updateResult?.error === 'MISSING_WORKFLOWS_PERMISSION' && (
          <p className="text-xs text-amber-700 dark:text-amber-400">Missing Workflows permission — see above.</p>
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
          ? 'Workflow does not support manual dispatch. Update via "Open setup PR" to add workflow_dispatch.'
          : err instanceof Error ? err.message : 'Unknown error'
      setStates((s) => ({ ...s, [action.id]: 'error' }))
      setErrors((e) => ({ ...e, [action.id]: msg }))
    }
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <ZapIcon className="w-3.5 h-3.5" />Actions
      </p>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => {
          const state = states[action.id] ?? 'idle'
          return (
            <button
              key={action.id}
              onClick={() => handleTrigger(action)}
              disabled={state === 'running' || !token}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50 ${
                state === 'done'
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                  : state === 'error'
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                    : action.id === 'clean'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20'
                      : action.id === 'init-force'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-muted text-foreground hover:bg-muted/70 border border-border'
              }`}
            >
              {state === 'done' ? <CheckIcon className="w-3 h-3" />
                : state === 'running' ? null
                : action.id === 'clean' ? <TrashIcon className="w-3 h-3" />
                : action.id === 'init-force' ? <ZapIcon className="w-3 h-3" />
                : <PlayIcon className="w-3 h-3" />}
              {state === 'running' ? 'Triggering…' : action.label}
            </button>
          )
        })}
      </div>
      {availableActions.map((action) =>
        errors[action.id] ? (
          <p key={action.id} className="text-xs text-red-500 leading-relaxed">
            <strong>{action.label}:</strong> {errors[action.id]}
          </p>
        ) : null,
      )}
      <p className="text-xs text-muted-foreground">All actions open a PR — no direct commits to main.</p>
    </div>
  )
}

// ─── Repo row ─────────────────────────────────────────────────────────────────

function RepoRow({ entry, onRemove }: { entry: WorkspaceRepo; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const { data: index } = useIndex(entry.repo)
  const { data: status, isLoading: statusLoading } = useRepoStatus(entry.repo)

  const checkItems = [
    status?.hasIndex,
    status?.workflows.init,
    status?.workflows.sync,
    status?.workflows.validate,
    status?.workflows.baseline,
    status?.workflows.clean,
  ]
  const doneCount = checkItems.filter(Boolean).length
  const totalCount = checkItems.length

  const fullySetup = status?.accessible && checkItems.every(Boolean)
  const hasAnyWorkflow = status?.workflows.init || status?.workflows.sync || status?.workflows.baseline
  const showExpand = !statusLoading && status && (!fullySetup || hasAnyWorkflow)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{entry.alias ?? entry.repo}</span>
            {!statusLoading && status && (
              fullySetup
                ? <CheckCircleIcon className="w-3.5 h-3.5 text-green-500 shrink-0" />
                : <AlertTriangleIcon className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            )}
          </div>
          {entry.alias && <div className="text-xs text-muted-foreground mt-0.5 ml-5">{entry.repo}</div>}
          {index && <div className="text-xs text-muted-foreground mt-0.5 ml-5">{index.items.length} items</div>}
        </div>

        {/* Mini progress bar */}
        {!statusLoading && status && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{doneCount}/{totalCount}</span>
            </div>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fullySetup ? 'bg-green-500' : 'bg-yellow-400'}`}
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {showExpand && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border hover:bg-muted/60 transition-colors"
            >
              {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
              {expanded ? 'Hide' : fullySetup ? 'Actions' : 'Setup'}
            </button>
          )}
          <button onClick={onRemove} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors p-1">
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && status && (
        <div className="border-t bg-muted/20 px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SetupPanel repo={entry.repo} status={status} />
            {hasAnyWorkflow && <ActionsPanel repo={entry.repo} status={status} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add repo panel ───────────────────────────────────────────────────────────

function AddRepoPanel({ onAdded, onGoToGitHub }: { onAdded: () => void; onGoToGitHub: () => void }) {
  const queryClient = useQueryClient()
  const { data: installed, isLoading } = useInstalledRepos()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [alias, setAlias] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('installation_id')) {
      queryClient.invalidateQueries({ queryKey: ['installed-repos'] })
      window.history.replaceState({}, '', '/settings')
    }
  }, [queryClient])

  if (!process.env.NEXT_PUBLIC_GITHUB_APP_SLUG) {
    return <ManualAddPanel onAdded={onAdded} />
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Checking GitHub App installation…</p>
  }

  if (!installed?.isInstalled) {
    return (
      <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-400">GitHub App not installed</p>
          <p className="text-xs text-amber-700 dark:text-amber-500">
            Install the SpecStat GitHub App first to give access to your repositories.
          </p>
          <button
            onClick={onGoToGitHub}
            className="text-xs text-primary font-medium hover:underline"
          >
            Go to GitHub Integration →
          </button>
        </div>
      </div>
    )
  }

  const alreadyAdded = new Set(getWorkspaceRepos().map((r) => r.repo))
  const available = (installed.repos ?? []).filter((r) => !alreadyAdded.has(r.full_name))
  const filtered = search ? available.filter((r) => r.full_name.toLowerCase().includes(search.toLowerCase())) : available

  function handleAdd() {
    if (!selected) return
    addWorkspaceRepo({ repo: selected, alias: alias.trim() || undefined })
    setSelected('')
    setAlias('')
    setSearch('')
    onAdded()
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Add a repository</p>
        <a
          href={installed.manageUrl ?? installed.installUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
        >
          Manage access <ExternalLinkIcon className="w-3 h-3" />
        </a>
      </div>

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">All accessible repos are already connected.</p>
      ) : (
        <>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="w-full border rounded-md pl-8 pr-3 py-2 text-sm bg-background"
              placeholder="Search repos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-md divide-y text-sm bg-background">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-muted-foreground text-xs">No matches.</p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.full_name}
                  onClick={() => setSelected(r.full_name)}
                  className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors cursor-pointer ${selected === r.full_name ? 'bg-primary/5 font-medium text-primary' : ''}`}
                >
                  <span>{r.full_name}</span>
                  {r.private && <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">private</span>}
                  {r.description && <span className="block text-xs text-muted-foreground truncate">{r.description}</span>}
                </button>
              ))
            )}
          </div>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            placeholder="Alias (optional)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" />
            Connect Repo
          </button>
        </>
      )}
    </div>
  )
}

// ─── Manual fallback ──────────────────────────────────────────────────────────

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
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">Add a repository</p>
      <input
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        placeholder="org/repo-name"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <input
        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
        placeholder="Alias (optional)"
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleAdd}
        disabled={adding || !input.trim()}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        <PlusIcon className="w-4 h-4" />
        {adding ? 'Checking…' : 'Connect Repo'}
      </button>
    </div>
  )
}

// ─── GitHub integration tab ───────────────────────────────────────────────────

function GitHubTab() {
  const { data: installed, isLoading } = useInstalledRepos()

  if (!process.env.NEXT_PUBLIC_GITHUB_APP_SLUG) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          GitHub App integration is not configured. Set <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_GITHUB_APP_SLUG</code> to enable it.
          Repository access is managed manually via the Repositories tab.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Checking GitHub App status…</p>
  }

  return (
    <div className="space-y-6">
      {/* Installation status card */}
      <div className={`rounded-lg border p-5 space-y-3 ${installed?.isInstalled ? 'border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-950/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'}`}>
        <div className="flex items-center gap-3">
          {installed?.isInstalled
            ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            : <AlertTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          }
          <div>
            <p className={`font-medium text-sm ${installed?.isInstalled ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {installed?.isInstalled ? 'SpecStat GitHub App is installed' : 'GitHub App not installed'}
            </p>
            {installed?.isInstalled && (
              <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                {installed.repos?.length ?? 0} repositor{(installed.repos?.length ?? 0) !== 1 ? 'ies' : 'y'} accessible
              </p>
            )}
          </div>
        </div>

        {installed?.isInstalled ? (
          <div className="flex gap-2">
            <a
              href={installed.manageUrl ?? installed.installUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-background border border-border px-3 py-1.5 rounded-md font-medium hover:bg-muted/60 transition-colors"
            >
              <GitHubIcon className="w-3.5 h-3.5" />
              Manage installation <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <a
              href={installed.installUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-background border border-border px-3 py-1.5 rounded-md font-medium hover:bg-muted/60 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Grant more access
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-500">
              Install the SpecStat GitHub App to choose which repositories SpecStat can access.
            </p>
            <a
              href={installed?.installUrl}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
            >
              <GitHubIcon className="w-4 h-4" />
              Install SpecStat GitHub App
            </a>
          </div>
        )}
      </div>

      {/* Accessible repos list */}
      {installed?.isInstalled && (installed.repos?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accessible repositories</p>
          <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
            {installed.repos!.map((r) => (
              <div key={r.full_name} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <PackageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{r.full_name}</span>
                  {r.private && <span className="text-xs text-muted-foreground bg-muted px-1 rounded">private</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Account tab ──────────────────────────────────────────────────────────────

function AccountTab() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user?.image ? (
          <img src={user.image} alt={user.name ?? 'User'} className="w-14 h-14 rounded-full border-2 border-border" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="font-semibold text-base">{user?.name ?? '—'}</div>
          {user?.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <GitHubIcon className="w-3.5 h-3.5" />
            Signed in via GitHub
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SettingsTab = 'repos' | 'github' | 'account'

const TABS: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'repos',   label: 'Repositories', icon: PackageIcon },
  { id: 'github',  label: 'GitHub',       icon: GitHubIcon },
  { id: 'account', label: 'Account',      icon: UserIcon },
]

export default function SettingsPage() {
  const [repos, setRepos] = useState<WorkspaceRepo[]>([])
  const [activeTab, setActiveTab] = useState<SettingsTab>('repos')

  useEffect(() => {
    setRepos(getWorkspaceRepos())
    // Support ?tab=github deep link
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab') as SettingsTab | null
    if (tab && ['repos', 'github', 'account'].includes(tab)) setActiveTab(tab)
  }, [])

  function handleRemove(repoName: string) {
    removeWorkspaceRepo(repoName)
    setRepos(getWorkspaceRepos())
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'repos' && (
        <div className="space-y-4">
          {repos.length === 0 && (
            <p className="text-sm text-muted-foreground">No repositories connected yet.</p>
          )}
          <div className="space-y-2">
            {repos.map((r) => (
              <RepoRow key={r.repo} entry={r} onRemove={() => handleRemove(r.repo)} />
            ))}
          </div>
          <AddRepoPanel
            onAdded={() => setRepos(getWorkspaceRepos())}
            onGoToGitHub={() => setActiveTab('github')}
          />
        </div>
      )}

      {activeTab === 'github' && <GitHubTab />}

      {activeTab === 'account' && <AccountTab />}
    </div>
  )
}
