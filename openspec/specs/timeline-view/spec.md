# timeline-view Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Commit-based timeline of spec changes
The timeline view SHALL display spec item history using GitHub commit data fetched from the GitHub API (`GET /repos/{owner}/{repo}/commits?path={file_path}`). Each item's creation commit and subsequent change commits SHALL appear as events on a chronological timeline.

#### Scenario: Item creation shown on timeline
- **WHEN** the timeline view is loaded
- **THEN** each item's first commit (creation) SHALL appear as a timeline event showing item ID, title, author, and date

#### Scenario: Item updates shown as subsequent events
- **WHEN** an item's `visualize.json` or spec Markdown file has multiple commits
- **THEN** each commit SHALL appear as a separate timeline event with the commit message and author

---

### Requirement: Baseline markers on timeline
Named baselines (created by `openspec-baseline` Action) SHALL appear as vertical markers on the timeline, labeled with the baseline name.

#### Scenario: Baseline marker shown at correct date
- **WHEN** a baseline tag `openspec-baseline-release-2026-Q2` exists in the repo
- **THEN** a labeled vertical line SHALL appear at the baseline creation date on the timeline

---

### Requirement: Filter timeline by item or folder
Users SHALL be able to filter the timeline to show only events for a specific item (by ID) or items within a specific folder.

#### Scenario: Filter by item ID
- **WHEN** user filters timeline by `AUTH-001`
- **THEN** only commits that touch files under `openspec/specs/AUTH-001/` SHALL be shown

---

### Requirement: Link commits to PRs
Timeline events that were introduced via a merged PR SHALL show the PR number as a clickable link opening GitHub.

#### Scenario: PR link shown on event
- **WHEN** a commit was part of a merged PR
- **THEN** the timeline event SHALL display the PR number that can be clicked to open GitHub

---

### Requirement: Who changed shown per event
Each timeline event SHALL display the GitHub username and avatar of the commit author.

#### Scenario: Author displayed on event
- **WHEN** commit was authored by user `alice`
- **THEN** the timeline event SHALL show alice's GitHub avatar and username

