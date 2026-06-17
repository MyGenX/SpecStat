# github-oauth-auth Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: GitHub OAuth sign-in required
All SpecStat functionality SHALL require GitHub OAuth authentication. Unauthenticated users SHALL see only the sign-in page.

#### Scenario: Unauthenticated user redirected to sign-in
- **WHEN** an unauthenticated user visits any Visualizer route
- **THEN** they SHALL be redirected to the sign-in page

#### Scenario: Sign-in redirects to previous route
- **WHEN** user signs in after being redirected from a specific route
- **THEN** they SHALL be redirected back to that route after successful authentication

---

### Requirement: GitHub token used for all API calls
The authenticated user's GitHub OAuth access token SHALL be used for all GitHub API calls made by Visualizer. This ensures the user's repo access permissions are respected.

#### Scenario: API call uses user token
- **WHEN** Visualizer fetches `index.json` from a private repo
- **THEN** the request SHALL include the user's OAuth token in the Authorization header

#### Scenario: Unauthorized repo access returns 404
- **WHEN** user attempts to add a repo they do not have access to
- **THEN** Visualizer SHALL display "Repository not found or access denied"

---

### Requirement: Session persistence
User sessions SHALL persist across browser refreshes using secure HTTP-only cookies managed by next-auth. Sessions SHALL expire after 30 days of inactivity.

#### Scenario: Session survives page refresh
- **WHEN** authenticated user refreshes the page
- **THEN** they SHALL remain signed in without being redirected to sign-in

#### Scenario: Expired session redirects to sign-in
- **WHEN** user's session has expired
- **THEN** the next API call SHALL return a 401 and the user SHALL be redirected to sign-in

---

### Requirement: Sign-out
Users SHALL be able to sign out from the settings menu. Signing out SHALL clear the session cookie and workspace state.

#### Scenario: Sign-out clears session
- **WHEN** user clicks "Sign out"
- **THEN** the session cookie SHALL be cleared and user SHALL be redirected to the sign-in page

