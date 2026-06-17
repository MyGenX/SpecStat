## ADDED Requirements

### Requirement: Dedicated archive section
The Visualizer SHALL provide a dedicated Archive view that shows only items where `archived: true` in their `visualize.json`. The main board, graph, and tree views SHALL exclude archived items by default.

#### Scenario: Archived items excluded from main board
- **WHEN** the board view is loaded without filter
- **THEN** items with `archived: true` SHALL not appear in any column

#### Scenario: Archive view shows all archived items
- **WHEN** user navigates to the Archive section
- **THEN** all items with `archived: true` SHALL be listed

---

### Requirement: Archive view read-only
The archive view SHALL be read-only. Drag-and-drop status changes SHALL be disabled. Items cannot be un-archived from Visualizer (un-archiving requires editing `visualize.json` in the repo).

#### Scenario: No drag-and-drop in archive
- **WHEN** user attempts to drag an archived card in the archive view
- **THEN** the card SHALL not move and no commit SHALL be triggered

---

### Requirement: Archive items searchable and filterable
Within the archive view, items SHALL be filterable by type, owner, original folder, and date archived.

#### Scenario: Filter archive by type
- **WHEN** user filters archive view by `type: design`
- **THEN** only archived design items SHALL be shown

---

### Requirement: Archive items link to original folder path
Each archived item SHALL display its original folder path (from the `path` field in `index.json`) so users can understand where it previously lived.

#### Scenario: Original path shown
- **WHEN** an archived item has `path: "openspec/specs/AUTH-OLD-001"`
- **THEN** the archive card SHALL display `openspec/specs/` as the original location
