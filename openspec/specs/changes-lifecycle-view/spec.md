# changes-lifecycle-view Specification

## Purpose
TBD - created by archiving change spec-driven-visualization. Update Purpose after archive.
## Requirements
### Requirement: Change folders rendered as lifecycle items
The system SHALL treat each directory under `openspec/changes/<name>/` (and `openspec/changes/archive/<name>/`) as a single change item that aggregates its `proposal.md`, `design.md`, `tasks.md`, and delta `specs/`.

#### Scenario: Active change becomes one lifecycle item
- **WHEN** `openspec/changes/add-auth/` contains `proposal.md`, `design.md`, and `tasks.md`
- **THEN** the Changes view SHALL render a single `add-auth` change item, not one item per markdown file

#### Scenario: Archive subfolder is not treated as a change
- **WHEN** walking `openspec/changes/`
- **THEN** the literal `archive` directory SHALL be treated as a container, and each `archive/<name>/` SHALL become its own archived change item

### Requirement: Lifecycle board groups changes by status
The Changes view SHALL present changes on a board grouped into lifecycle columns: `draft`, `in-progress`, `approved`, and `archived`.

#### Scenario: Changes appear in their status column
- **WHEN** one change is `in-progress` and one is `archived`
- **THEN** each SHALL appear under its corresponding lifecycle column

### Requirement: Change items show task progress
Each change item SHALL display a task-completion indicator derived from its `tasks.md`, expressed as completed-of-total tasks and a percentage.

#### Scenario: Progress reflects checkbox completion
- **WHEN** a change's `tasks.md` has 8 of 10 checkboxes marked `- [x]`
- **THEN** the change item SHALL show `8/10` tasks complete (80%)

#### Scenario: Change with no tasks file shows no progress
- **WHEN** a change folder has no `tasks.md`
- **THEN** the change item SHALL render without a progress bar rather than erroring

### Requirement: Delta specs link to their implemented spec
A change's delta spec at `changes/<name>/specs/<id>/` SHALL be related to the implemented spec at `specs/<id>/` when one exists, so the graph can show which change introduced or modified each capability.

#### Scenario: Delta spec linked to final spec
- **WHEN** a change defines `changes/add-auth/specs/github-oauth-auth/spec.md` and `specs/github-oauth-auth/` exists
- **THEN** the change item SHALL expose a relation linking it to the `github-oauth-auth` story

### Requirement: Change detail renders proposal, design, and tasks
The Changes view SHALL provide a detail panel that renders the change's `proposal.md`, `design.md`, and `tasks.md`, plus a list of its delta specs.

#### Scenario: Opening a change shows its documents
- **WHEN** a user opens an active change
- **THEN** the detail panel SHALL render its proposal, design, and task list with checkbox state preserved

