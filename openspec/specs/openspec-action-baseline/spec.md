# openspec-action-baseline Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Baseline creates a named snapshot
The baseline action SHALL accept a `baseline_name` input and create a snapshot of the current `index.json` saved as `openspec/baselines/<baseline_name>.json`.

#### Scenario: Baseline file created
- **WHEN** baseline action runs with `baseline_name: "release-2026-Q2"`
- **THEN** `openspec/baselines/release-2026-Q2.json` SHALL be created containing a copy of the current `index.json` plus `baseline_name`, `created_at`, and optional `description` fields

---

### Requirement: Baseline creates a Git tag
The baseline action SHALL create and push a Git tag named `openspec-baseline-<baseline_name>`.

#### Scenario: Git tag created on baseline
- **WHEN** baseline action runs with name `release-2026-Q2`
- **THEN** a tag `openspec-baseline-release-2026-Q2` SHALL exist in the repo after the action completes

---

### Requirement: Baseline creates a GitHub Release
The baseline action SHALL create a GitHub Release using the baseline tag, with the baseline name as the release title and the optional `description` input as the release body.

#### Scenario: GitHub Release created
- **WHEN** baseline action completes
- **THEN** a GitHub Release SHALL exist at the baseline tag, visible in the repo's Releases tab

---

### Requirement: Baseline triggerable from Visualizer UI
The baseline action SHALL be triggerable via `repository_dispatch` with event type `openspec-create-baseline`. The `client_payload` SHALL carry `baseline_name` and optional `triggered_by`.

#### Scenario: Visualizer triggers baseline
- **WHEN** user clicks "Create Baseline" in Visualizer UI and enters a name
- **THEN** Visualizer SHALL POST to `/repos/{owner}/{repo}/dispatches` with `event_type: "openspec-create-baseline"` and the baseline action SHALL run

#### Scenario: triggered_by recorded in baseline file
- **WHEN** baseline is triggered with `triggered_by: "alice"`
- **THEN** the `baselines/<name>.json` file SHALL include `triggered_by: "alice"`

