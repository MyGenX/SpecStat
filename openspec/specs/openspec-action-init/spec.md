# openspec-action-init Specification

## Purpose
TBD - created by archiving change specstat. Update Purpose after archive.
## Requirements
### Requirement: Init mode walks repo and generates visualize.json files
When run in `init` mode, the `openspec-action` SHALL walk the OpenSpec root directory, find all spec item folders (folders containing a `.md` file), and generate a `visualize.json` file in each item folder and each parent folder if one does not already exist.

#### Scenario: First-time init on a repo with existing specs
- **WHEN** `openspec-init` runs on a repo with 20 existing spec items and no `visualize.json` files
- **THEN** 20 item-level and N folder-level `visualize.json` files SHALL be created with populated default values derived from the spec file frontmatter

#### Scenario: Init does not overwrite existing visualize.json
- **WHEN** a `visualize.json` already exists for an item
- **THEN** the init action SHALL skip that item and leave its `visualize.json` unchanged

---

### Requirement: Init generates index.json
After generating all `visualize.json` files, init SHALL generate `openspec/index.json` with a complete manifest of all folders and items.

#### Scenario: index.json created with full item list
- **WHEN** init completes
- **THEN** `openspec/index.json` SHALL exist with `folders` and `items` arrays containing all discovered items

---

### Requirement: Init populates visualize.json from frontmatter
The init action SHALL read each spec Markdown file's YAML frontmatter and use known fields (`id`, `title`, `status`, `owner`) to populate the generated `visualize.json`. Fields not present in frontmatter SHALL use defaults (`status: "draft"`, `priority: null`).

#### Scenario: Frontmatter fields used in generated file
- **WHEN** a spec file has frontmatter `id: AUTH-001` and `title: User login flow`
- **THEN** the generated `visualize.json` SHALL have `id: "AUTH-001"` and `title: "User login flow"`

#### Scenario: Missing frontmatter fields use defaults
- **WHEN** a spec file has no `status` in frontmatter
- **THEN** the generated `visualize.json` SHALL have `status: "draft"`

---

### Requirement: Init commits all generated files
After generating all files, the init action SHALL commit them to the default branch with a standard commit message: `chore(openspec): initialize visualize.json files and index`.

#### Scenario: Commit created after init
- **WHEN** init runs and generates files
- **THEN** a single commit SHALL be created containing all generated files

#### Scenario: No commit if nothing generated
- **WHEN** all items already have `visualize.json` files
- **THEN** no commit SHALL be created

