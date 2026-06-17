## ADDED Requirements

### Requirement: Item-level visualize.json structure
Every spec item directory SHALL contain a `visualize.json` file with the following required fields: `type` ("item"), `id`, `title`, `spec_type`, `status`, `owner`, `spec_file`, `created_at`, `last_updated`. Optional fields include `priority`, `contributors`, `version`, `tags`, `archived`, `last_commit`, `card`, `relations`, `github`, `board`, and `triggers`.

#### Scenario: Valid item visualize.json is accepted
- **WHEN** a `visualize.json` file contains all required fields with valid values
- **THEN** the parser SHALL return a typed `VisualizeItem` object with no validation errors

#### Scenario: Missing required field is rejected
- **WHEN** a `visualize.json` file is missing any required field (e.g., `owner`)
- **THEN** the parser SHALL return a `ZodError` listing the missing fields

#### Scenario: Unknown extra fields are stripped
- **WHEN** a `visualize.json` file contains unrecognized extra fields
- **THEN** the parser SHALL strip those fields and return the valid subset without error

---

### Requirement: Folder-level visualize.json structure
Every folder within the `openspec/` directory SHALL contain a `visualize.json` file with `type` ("folder"), `label`, `archived`. Optional fields include `description`, `icon`, `color`, `default_view`, `default_group_by`, `owners`, `tags`, `item_count`.

#### Scenario: Folder metadata is parsed
- **WHEN** a folder `visualize.json` with `type: "folder"` is parsed
- **THEN** the parser SHALL return a typed `VisualizeFolder` object

#### Scenario: Archived folder is flagged
- **WHEN** a folder `visualize.json` has `archived: true`
- **THEN** the folder and all items under it SHALL be treated as archived throughout the UI

---

### Requirement: index.json root manifest structure
The file `openspec/index.json` SHALL be present at the root of the OpenSpec directory with `meta` (containing `repo`, `generated_at`, `openspec_version`) and two arrays: `folders` (folder summaries) and `items` (flat item summaries with `id`, `title`, `type`, `status`, `path`, `visualize`, `archived`, `last_updated`).

#### Scenario: Visualizer bootstraps from index.json
- **WHEN** the Visualizer fetches `openspec/index.json` from a repo
- **THEN** it SHALL have enough data to render the board, tree, and graph without fetching any individual `visualize.json` files

#### Scenario: index.json is regenerated after sync
- **WHEN** the `openspec-sync` Action runs after a spec file changes
- **THEN** `index.json` SHALL reflect the updated item count and `last_updated` timestamp within the same commit

---

### Requirement: Valid status values
The `status` field in item `visualize.json` files SHALL only accept the following values: `draft`, `in-review`, `approved`, `implemented`, `deprecated`, `archived`.

#### Scenario: Valid status accepted
- **WHEN** status is set to `approved`
- **THEN** the Zod schema SHALL parse without error

#### Scenario: Invalid status rejected
- **WHEN** status is set to an unlisted value such as `done`
- **THEN** the Zod schema SHALL return a validation error naming the field and listing valid values

---

### Requirement: Valid spec_type values
The `spec_type` field SHALL only accept: `spec`, `impl`, `task`, `design`, `proposal`, `decision`, `component`, `domain`.

#### Scenario: Valid spec_type accepted
- **WHEN** `spec_type` is `spec`
- **THEN** the parser returns the item without error

#### Scenario: Invalid spec_type rejected
- **WHEN** `spec_type` is `feature`
- **THEN** the Zod schema returns an error listing valid values
