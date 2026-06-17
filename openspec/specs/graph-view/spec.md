# graph-view Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Spec items rendered as graph nodes
The graph view SHALL render each spec item as a node using React Flow. Node size and color SHALL reflect item type and status respectively.

#### Scenario: Nodes appear for all items
- **WHEN** the graph view is loaded
- **THEN** every non-archived item in `index.json` SHALL appear as a node

#### Scenario: Archived items excluded by default
- **WHEN** the graph view is loaded without explicit archived filter
- **THEN** items with `archived: true` SHALL not be rendered as nodes

---

### Requirement: Relationship edges rendered per relation type
Edges SHALL be drawn between nodes based on the `relations` field of each item's `visualize.json`. Each relation type SHALL have a distinct visual style:
- `relates_to` — dashed grey line
- `depends_on` — solid red arrow
- `implements` — solid green arrow
- `linked_tasks` — dotted blue line
- `linked_designs` — dotted purple line
- `supersedes` — solid orange arrow

#### Scenario: Correct edge style per relation type
- **WHEN** item A has `depends_on: ["B"]`
- **THEN** a solid red arrow SHALL be drawn from A to B

#### Scenario: Bidirectional relations deduplicated
- **WHEN** A has `relates_to: ["B"]` and B has `relates_to: ["A"]`
- **THEN** only one edge SHALL be rendered between A and B

---

### Requirement: Click node to open detail panel
Clicking a node in the graph view SHALL open the spec detail panel for that item without navigating away from the graph.

#### Scenario: Node click opens detail panel
- **WHEN** user clicks a node
- **THEN** the spec detail panel SHALL slide in from the right showing that item's details

---

### Requirement: Graph filtering
The graph view SHALL support filtering by item type, status, and owner. Applying a filter dims unmatched nodes and their edges while keeping them in place for context.

#### Scenario: Filter by status dims non-matching nodes
- **WHEN** user filters by `status: approved`
- **THEN** nodes with other statuses SHALL be rendered at reduced opacity; approved nodes remain full opacity

---

### Requirement: Highlight dependencies of selected node
Selecting a node SHALL highlight all nodes reachable via `depends_on` and `implements` edges (direct and transitive).

#### Scenario: Dependency chain highlighted
- **WHEN** user selects node AUTH-001 which depends_on COMP-AUTH-SERVICE
- **THEN** COMP-AUTH-SERVICE node and its edge to AUTH-001 SHALL be highlighted in a distinct color

---

### Requirement: Zoom and pan navigation
The graph view SHALL support pinch-to-zoom, scroll-to-zoom, and click-drag panning. A minimap SHALL be shown in the bottom-right corner.

#### Scenario: Minimap reflects current viewport
- **WHEN** user pans to a different area of the graph
- **THEN** the minimap viewport indicator SHALL update to reflect the new position

