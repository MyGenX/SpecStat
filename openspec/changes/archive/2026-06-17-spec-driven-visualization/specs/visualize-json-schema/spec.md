## MODIFIED Requirements

### Requirement: Item-level visualize.json structure
Every spec item directory SHALL contain a `visualize.json` file with the following required fields: `type` ("item"), `id`, `title`, `spec_type`, `status`, `spec_file`, `created_at`, `last_updated`. Optional fields include `owner`, `priority`, `contributors`, `version`, `tags`, `archived`, `last_commit`, `card`, `relations`, `github`, `board`, `triggers`, and the spec-driven fields `track` ("spec" | "change"), `tasks` (`{ total, done }`), `requirement_count`, `scenario_count`, and `docs` (paths to `proposal`, `design`, `tasks` for change items). The `owner` field SHALL be optional because spec-driven markdown carries no owner by default.

#### Scenario: Valid item visualize.json is accepted
- **WHEN** a `visualize.json` file contains all required fields with valid values
- **THEN** the parser SHALL return a typed `VisualizeItem` object with no validation errors

#### Scenario: Item without owner is accepted
- **WHEN** a `visualize.json` file omits `owner`
- **THEN** the parser SHALL accept it and return a `VisualizeItem` with `owner` undefined

#### Scenario: Spec-driven fields are parsed
- **WHEN** a change item `visualize.json` contains `track: "change"` and `tasks: { total: 10, done: 4 }`
- **THEN** the parser SHALL return those fields typed on the `VisualizeItem`

#### Scenario: Unknown extra fields are stripped
- **WHEN** a `visualize.json` file contains unrecognized extra fields
- **THEN** the parser SHALL strip those fields and return the valid subset without error

### Requirement: index.json root manifest structure
The file `openspec/index.json` SHALL be present at the root of the OpenSpec directory with `meta` (containing a non-empty `repo`, `generated_at`, `openspec_version`) and two arrays: `folders` (folder summaries) and `items` (flat item summaries with `id`, `title`, `type`, `status`, `path`, `visualize`, `archived`, `last_updated`, plus the optional spec-driven fields `track`, `tasks`, `requirement_count`, and `scenario_count`). The parser SHALL tolerate older indexes that omit the spec-driven fields.

#### Scenario: Visualizer bootstraps from index.json
- **WHEN** the Visualizer fetches `openspec/index.json` from a repo
- **THEN** it SHALL have enough data to render the Stories and Changes views, including each item's `track` and task progress, without fetching individual `visualize.json` files

#### Scenario: Older index without spec-driven fields still parses
- **WHEN** an `index.json` lacks `track` and `tasks` on its items
- **THEN** the parser SHALL parse it without error, treating the missing fields as undefined

## ADDED Requirements

### Requirement: Item track classification
Each item SHALL carry a `track` field set to `"spec"` for items derived from `openspec/specs/` and `"change"` for items derived from `openspec/changes/`, so consumers can route items to the Stories or Changes views.

#### Scenario: Spec item track
- **WHEN** an item is generated from a folder under `openspec/specs/`
- **THEN** its `track` SHALL be `"spec"`

#### Scenario: Change item track
- **WHEN** an item is generated from a folder under `openspec/changes/`
- **THEN** its `track` SHALL be `"change"`
