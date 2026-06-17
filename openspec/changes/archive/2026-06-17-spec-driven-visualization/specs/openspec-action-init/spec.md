## MODIFIED Requirements

### Requirement: Init mode walks repo and generates visualize.json files
When run in `init` mode, the `openspec-action` SHALL walk the OpenSpec root directory and classify content by the spec-driven layout: capability folders under `specs/` become spec (story) items, change folders under `changes/<name>/` become change items, and change folders under `changes/archive/<name>/` become archived change items. It SHALL generate a `visualize.json` in each item folder and parent folder where one does not already exist.

#### Scenario: Specs and changes are classified distinctly
- **WHEN** init runs on a repo with `openspec/specs/board-view/` and `openspec/changes/add-auth/`
- **THEN** `board-view` SHALL be emitted with `track: "spec"` and `add-auth` SHALL be emitted with `track: "change"`

#### Scenario: Archived changes are flagged
- **WHEN** init encounters `openspec/changes/archive/2026-06-17-specstat/`
- **THEN** the resulting change item SHALL be emitted with `archived: true` and lifecycle status `archived`

#### Scenario: Init does not overwrite existing visualize.json
- **WHEN** a `visualize.json` already exists for an item
- **THEN** the init action SHALL skip that item and leave its `visualize.json` unchanged

### Requirement: Init populates visualize.json from frontmatter
The init action SHALL derive item fields from the spec-driven layout and markdown structure first — folder name as `id`, spec heading as `title`, parsed `### Requirement:`/`#### Scenario:` counts, and lifecycle status from folder plus `tasks.md` completion. When YAML frontmatter is present in a spec's Markdown file, its known fields (`id`, `title`, `status`, `owner`, `spec_type`) SHALL override the inferred values. Absent both, defaults apply (`status` inferred per lifecycle rules, `priority: null`).

#### Scenario: Fields inferred from markdown when no frontmatter
- **WHEN** a `spec.md` has no frontmatter and begins with `# board-view Specification`
- **THEN** the generated item SHALL have `id: "board-view"` and a non-empty `title` derived from the heading

#### Scenario: Frontmatter overrides inferred values
- **WHEN** a spec file has frontmatter `title: User login flow`
- **THEN** the generated item `title` SHALL be `"User login flow"`, overriding the heading-derived value

## ADDED Requirements

### Requirement: Init infers lifecycle status from folder and task completion
For items under `changes/`, init SHALL infer status as: `archived` when under `changes/archive/`; otherwise `draft` when zero `tasks.md` checkboxes are complete, `in-progress` when some are complete, and `approved` when all are complete. Items under `specs/` SHALL be assigned status `implemented`.

#### Scenario: Active change with partial tasks is in-progress
- **WHEN** an active change's `tasks.md` has 3 of 10 checkboxes complete
- **THEN** the change item SHALL be assigned status `in-progress`

#### Scenario: Active change with all tasks complete is approved
- **WHEN** an active change's `tasks.md` has all checkboxes complete
- **THEN** the change item SHALL be assigned status `approved`

#### Scenario: Implemented spec status
- **WHEN** init processes a folder under `openspec/specs/`
- **THEN** the resulting item SHALL be assigned status `implemented`

### Requirement: Init parses tasks.md task progress
For each change folder, init SHALL parse `tasks.md` checkbox lines (`- [ ]` and `- [x]`) and record `{ total, done }` task counts on the change item.

#### Scenario: Task counts recorded
- **WHEN** a change's `tasks.md` contains 12 checkbox lines of which 7 are `- [x]`
- **THEN** the change item SHALL record `tasks: { total: 12, done: 7 }`

#### Scenario: Non-checkbox lines are ignored
- **WHEN** `tasks.md` contains section headings and prose alongside checkboxes
- **THEN** only checkbox lines SHALL be counted toward `total`
