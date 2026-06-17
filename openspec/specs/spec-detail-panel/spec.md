# spec-detail-panel Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Detail panel opens on card or node click
Clicking any spec card (board view), graph node, or tree leaf SHALL open a detail panel. The panel SHALL open as a side panel (not a full-page navigation) so the user can return to the underlying view without losing context.

#### Scenario: Panel opens without navigation
- **WHEN** user clicks a spec card in the board view
- **THEN** the detail panel SHALL slide in from the right without changing the URL route of the board view

#### Scenario: Panel can be closed
- **WHEN** user clicks the close button or presses Escape
- **THEN** the detail panel SHALL close and focus returns to the board/graph/tree view

---

### Requirement: Rendered Markdown content
The left side of the panel SHALL display the full rendered Markdown content of the spec file, fetched from GitHub via the raw content API.

#### Scenario: Markdown rendered with syntax highlighting
- **WHEN** the spec file contains fenced code blocks
- **THEN** they SHALL be rendered with syntax highlighting

#### Scenario: Relative links resolved to GitHub URLs
- **WHEN** the spec Markdown contains relative links to other files in the repo
- **THEN** those links SHALL be resolved to absolute GitHub URLs

---

### Requirement: Metadata sidebar
The right side of the panel SHALL display all fields from the item's `visualize.json` including: status, priority, owner, contributors, version, tags, created_at, last_updated, last_commit, and all `relations` fields as clickable links to open referenced items.

#### Scenario: Relation links open referenced item panel
- **WHEN** user clicks a relation link (e.g., `AUTH-002` in `relates_to`)
- **THEN** the detail panel SHALL update to show AUTH-002's content (breadcrumb navigation retained)

#### Scenario: GitHub fields shown as links
- **WHEN** item has `github.linked_pr: 52`
- **THEN** the metadata SHALL display "PR #52" as a link that opens the GitHub PR in a new tab

---

### Requirement: Commit history in panel
The detail panel SHALL show the last N (default 10) commits that touched the spec file or its `visualize.json`, fetched from GitHub API.

#### Scenario: Commit list shown
- **WHEN** the detail panel opens
- **THEN** a "History" section SHALL show commit SHA (shortened), message, author, and date for each commit

---

### Requirement: Markdown trigger directives editor
The detail panel SHALL include a read-only display of any `@visualizer:trigger` directives found in the spec Markdown file.

#### Scenario: Trigger directives listed
- **WHEN** a spec file contains `@visualizer:trigger` comments
- **THEN** the panel SHALL list each directive with its type and arguments in a dedicated section

