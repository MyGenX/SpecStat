import { Octokit } from '@octokit/rest'

export interface InstalledRepo {
  id: number
  full_name: string
  private: boolean
  description: string | null
}

export interface AppInstallation {
  id: number
  appSlug: string
  accountLogin: string
  accountType: 'User' | 'Organization'
}

export async function getAppInstallations(
  octokit: Octokit,
  appSlug: string,
): Promise<AppInstallation[]> {
  const { data } = await octokit.apps.listInstallationsForAuthenticatedUser({ per_page: 100 })
  return data.installations
    .filter((inst) => !appSlug || inst.app_slug === appSlug)
    .map((inst) => ({
      id: inst.id,
      appSlug: inst.app_slug,
      accountLogin: (inst.account as { login?: string } | null)?.login ?? '',
      accountType: ((inst.account as { type?: string } | null)?.type === 'Organization' ? 'Organization' : 'User') as 'User' | 'Organization',
    }))
}

export async function getInstallationRepos(octokit: Octokit, installationId: number): Promise<InstalledRepo[]> {
  const { data } = await octokit.apps.listInstallationReposForAuthenticatedUser({
    installation_id: installationId,
    per_page: 100,
  })
  return data.repositories.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    private: r.private,
    description: r.description ?? null,
  }))
}
