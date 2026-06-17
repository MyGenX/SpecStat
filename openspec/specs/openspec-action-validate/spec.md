# openspec-action-validate Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Validate required fields in visualize.json
The validate action SHALL check every `visualize.json` file in the repo for the required fields: `id`, `title`, `type`, `status`, `owner`. Missing required fields SHALL cause the action to fail with an exit code of 1.

#### Scenario: Missing required field fails action
- **WHEN** a `visualize.json` is missing the `owner` field
- **THEN** the validate action SHALL exit with code 1 and report the file path and missing field

#### Scenario: All fields present passes validation
- **WHEN** all `visualize.json` files have all required fields with valid values
- **THEN** the validate action SHALL exit with code 0

---

### Requirement: Validate unique IDs
The validate action SHALL verify that no two items in the repo share the same `id` value.

#### Scenario: Duplicate ID fails validation
- **WHEN** two items both have `id: "AUTH-001"`
- **THEN** the action SHALL fail and report both file paths and the duplicate ID

---

### Requirement: Validate relation references exist
The validate action SHALL check that all IDs referenced in `relations` fields (`relates_to`, `depends_on`, `implements`, etc.) exist as items in the same repo's `index.json`.

#### Scenario: Unknown relation reference fails validation
- **WHEN** item A has `depends_on: ["NONEXISTENT-001"]`
- **THEN** the validate action SHALL fail and report the unresolved reference

#### Scenario: Valid relation reference passes
- **WHEN** item A has `depends_on: ["AUTH-002"]` and AUTH-002 exists
- **THEN** validation passes for this relation

---

### Requirement: Validate status values
The validate action SHALL reject any `status` value not in the allowed set: `draft`, `in-review`, `approved`, `implemented`, `deprecated`, `archived`.

#### Scenario: Invalid status fails validation
- **WHEN** an item has `status: "wip"`
- **THEN** the action SHALL fail listing the invalid value and valid options

---

### Requirement: Post validation report as PR comment
When run on a pull_request event and validation fails, the action SHALL post a structured comment on the PR listing all validation errors grouped by file.

#### Scenario: Validation failures appear in PR comment
- **WHEN** validation finds 3 errors across 2 files
- **THEN** the PR comment SHALL show each error with the file path and a human-readable description

