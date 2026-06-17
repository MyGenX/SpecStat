# board-view Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Spec cards displayed in status columns
The board view SHALL display spec items as cards grouped into columns matching their `status` field. Default columns are: Draft, In Review, Approved, Implemented, Archived.

#### Scenario: Cards appear in correct column
- **WHEN** an item has `status: "approved"`
- **THEN** its card SHALL appear in the Approved column

#### Scenario: Empty column is shown
- **WHEN** no items have a given status
- **THEN** the column SHALL still be rendered with a zero count header

---

### Requirement: Card content
Each card SHALL display: ID badge, title, type icon, status pill, owner, priority indicator (color-coded: high=red, medium=yellow, low=green), tag chips (max 3 visible), relation count, last updated date, and a GitHub link icon.

#### Scenario: Card renders all fields
- **WHEN** a card is rendered for an item with all fields populated
- **THEN** all listed elements SHALL be visible without overflow

#### Scenario: Card handles missing optional fields gracefully
- **WHEN** an item has no `priority` or `tags`
- **THEN** the card SHALL render without those elements and without throwing

---

### Requirement: Card drag-and-drop status change
Users SHALL be able to drag a card from one status column and drop it onto a different column to change the item's status. Dropping SHALL trigger a GitHub API commit that updates `status` in the item's `visualize.json`.

#### Scenario: Drag updates status optimistically
- **WHEN** a user drags a card to the Approved column
- **THEN** the card SHALL move immediately (optimistic), and a commit SHALL be initiated in the background

#### Scenario: Commit failure reverts card
- **WHEN** the background commit fails (e.g., branch protection blocks direct push)
- **THEN** the card SHALL revert to its original column and an error toast SHALL be displayed

---

### Requirement: Board grouping options
The board SHALL support grouping by: `status` (default), `owner`, `type`, `tag`, `swimlane`, `milestone`. Selecting a grouping option re-renders columns based on the chosen field.

#### Scenario: Group by owner
- **WHEN** user selects "Group by owner"
- **THEN** columns change to show one column per unique owner across all items

#### Scenario: Group by tag with multi-tag items
- **WHEN** an item has multiple tags
- **THEN** the item SHALL appear in the column of its first tag

---

### Requirement: Board filtering
The board SHALL support filtering items by: folder/section, type, owner, tag, priority, archived status. Filters are combinable (AND logic).

#### Scenario: Filter by type
- **WHEN** user applies filter `type: spec`
- **THEN** only spec-type items SHALL be shown; all other types are hidden

#### Scenario: Archived items hidden by default
- **WHEN** the board is loaded without explicit filter
- **THEN** items with `archived: true` SHALL be hidden unless the archived filter is enabled

