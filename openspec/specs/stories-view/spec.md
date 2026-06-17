# stories-view Specification

## Purpose
TBD - created by archiving change spec-driven-visualization. Update Purpose after archive.
## Requirements
### Requirement: Implemented specs rendered as project stories
The system SHALL treat every capability under `openspec/specs/<id>/` as an implemented "project story" and render it as a first-class story item with status `implemented`, independent of any `changes/` content.

#### Scenario: Specs folder populates the Stories view
- **WHEN** a repo has `openspec/specs/board-view/spec.md` and `openspec/specs/tree-view/spec.md`
- **THEN** the Stories view SHALL list `board-view` and `tree-view` as story items each with status `implemented`

#### Scenario: Specs are shown even when no changes exist
- **WHEN** a repo has specs under `openspec/specs/` but an empty `openspec/changes/` directory
- **THEN** the Stories view SHALL still render all spec items

### Requirement: Story items expose parsed requirements and scenarios
Each story item SHALL parse its `spec.md` markdown and expose the count of `### Requirement:` blocks and `#### Scenario:` blocks, plus the requirement titles, without relying on frontmatter.

#### Scenario: Requirement and scenario counts derived from markdown
- **WHEN** a `spec.md` contains 5 `### Requirement:` headings and 10 `#### Scenario:` headings
- **THEN** the story item SHALL report `requirement_count: 5` and `scenario_count: 10`

#### Scenario: Story title derived from heading when no frontmatter
- **WHEN** a `spec.md` begins with `# board-view Specification` and has no frontmatter
- **THEN** the story item title SHALL be derived from the spec heading or folder name, not defaulted to empty

### Requirement: Story detail renders spec content
The Stories view SHALL provide a detail panel that renders the full `spec.md` markdown, including its Purpose, Requirements, and Scenarios.

#### Scenario: Opening a story shows its requirements
- **WHEN** a user opens the `graph-view` story
- **THEN** the detail panel SHALL display the rendered `spec.md` content with each requirement and its scenarios

