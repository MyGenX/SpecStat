## ADDED Requirements

### Requirement: Folder hierarchy mirrors index.json
The tree view SHALL render the folder hierarchy from `index.json` `folders` array. Each folder node shows the folder label, type icon, and item count from its `visualize.json`.

#### Scenario: Folders displayed in hierarchy order
- **WHEN** the tree view is loaded
- **THEN** top-level folders (e.g., specs, designs, tasks) SHALL appear as root nodes; nested folders (e.g., archive/specs) SHALL appear indented under their parent

#### Scenario: Item count shown per folder
- **WHEN** a folder has `item_count: 12`
- **THEN** the tree node SHALL display "(12)" alongside the folder label

---

### Requirement: Archived folders visually separated
Folders with `archived: true` SHALL appear in a separate "Archive" section at the bottom of the tree, visually dimmed (reduced opacity), and collapsed by default.

#### Scenario: Archive section collapsed by default
- **WHEN** the tree view is loaded
- **THEN** the Archive section SHALL be collapsed and require a click to expand

#### Scenario: Archived folder items are dimmed
- **WHEN** the Archive section is expanded
- **THEN** all folder nodes inside SHALL render at reduced opacity to distinguish from active folders

---

### Requirement: Click folder opens board view for that section
Clicking any folder node in the tree view SHALL navigate to the board view pre-filtered to items within that folder path.

#### Scenario: Click folder navigates to filtered board
- **WHEN** user clicks the "Specifications" folder node
- **THEN** the board view SHALL open showing only items whose `path` starts with `openspec/specs/`

---

### Requirement: Tree expand/collapse
Each folder node SHALL be expandable/collapsible to show or hide its child items. Items (leaves) SHALL be shown when a folder is expanded.

#### Scenario: Expand folder shows child items
- **WHEN** user clicks the expand chevron on a folder
- **THEN** child items SHALL appear as leaf nodes with their ID and title

#### Scenario: Clicking leaf item opens detail panel
- **WHEN** user clicks an item leaf node in the tree
- **THEN** the spec detail panel SHALL open for that item
