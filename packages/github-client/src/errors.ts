export class GitHubAuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'GitHubAuthError'
  }
}

export class GitHubForbiddenError extends Error {
  constructor(message = 'Permission denied') {
    super(message)
    this.name = 'GitHubForbiddenError'
  }
}

export class GitHubNotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'GitHubNotFoundError'
  }
}

export function handleGitHubError(err: unknown): never {
  const status = (err as { status?: number }).status
  if (status === 401) throw new GitHubAuthError()
  if (status === 403) throw new GitHubForbiddenError()
  if (status === 404) throw new GitHubNotFoundError()
  throw err
}
