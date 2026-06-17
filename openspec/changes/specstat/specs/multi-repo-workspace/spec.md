## ADDED Requirements

### Requirement: Connect multiple GitHub repos
Users SHALL be able to add multiple GitHub repos to a single Visualizer workspace. Each repo must have an `openspec/index.json` at its root. A workspace stores the list of connected repos in user settings (localStorage or server-side session).

#### Scenario: Add repo to workspace
- **WHEN** user enters a GitHub repo name (org/repo) and clicks "Add Repo"
- **THEN** Visualizer SHALL fetch `openspec/index.json` from that repo and add it to the workspace

#### Scenario: Repo without index.json rejected
- **WHEN** user adds a repo that has no `openspec/index.json`
- **THEN** Visualizer SHALL display an error: "No OpenSpec manifest found. Run openspec-init first."

---

### Requirement: Unified item list across repos
When multiple repos are connected, the board, graph, and tree views SHALL show items from all repos merged into a unified view. Each item card SHALL indicate which repo it belongs to.

#### Scenario: Items from all repos shown in board
- **WHEN** workspace has two repos connected
- **THEN** the board view SHALL show items from both repos, with a repo badge on each card

#### Scenario: Items can be filtered by repo
- **WHEN** user applies a repo filter
- **THEN** only items from the selected repo SHALL be shown

---

### Requirement: Cross-repo relation resolution
A relation reference (e.g., `depends_on: ["COMP-AUTH-SERVICE"]`) SHALL be resolved against items across all connected repos. If the referenced item is found in a different repo, the relation SHALL be marked as cross-repo.

#### Scenario: Cross-repo dependency resolved in graph
- **WHEN** item AUTH-001 in repo A depends_on COMP-AUTH-SERVICE in repo B
- **THEN** the graph view SHALL show an edge between the two nodes with a cross-repo indicator

#### Scenario: Unresolved relation shown as stub node
- **WHEN** a referenced item ID is not found in any connected repo
- **THEN** the graph view SHALL show a dimmed stub node for the unresolved reference

---

### Requirement: Per-repo settings
Each connected repo SHALL have independent settings: auth token (if different from the primary GitHub OAuth), default view, default filters.

#### Scenario: Remove repo from workspace
- **WHEN** user removes a repo from the workspace settings
- **THEN** all items from that repo SHALL disappear from all views immediately
