## ADDED Requirements

### Requirement: @visualizer:trigger directives embedded in spec Markdown
Spec Markdown files SHALL support embedding trigger directives as HTML comments in the format `<!-- @visualizer:trigger <type> <args> -->`. These directives SHALL be idempotent — running the same trigger multiple times SHALL not produce duplicate effects.

#### Scenario: Directive parsed from Markdown
- **WHEN** a spec file contains `<!-- @visualizer:trigger create-task "Write unit tests" -->`
- **THEN** the sync action SHALL extract trigger type `create-task` and argument `"Write unit tests"`

#### Scenario: Malformed directive is skipped with warning
- **WHEN** a comment matches `@visualizer:trigger` but has no type argument
- **THEN** the action SHALL skip it and log a warning without failing

---

### Requirement: notify-team trigger
`@visualizer:trigger notify-team <team>` SHALL post a GitHub notification (using the GitHub `@mention` mechanism in a PR/issue comment or team notification) to the named team.

#### Scenario: Team notified on push
- **WHEN** a spec file with `@visualizer:trigger notify-team platform-team` is pushed
- **THEN** the sync action SHALL post a comment on any associated PR mentioning `@platform-team`

---

### Requirement: create-task trigger
`@visualizer:trigger create-task "<title>"` SHALL create a new GitHub Issue in the same repo, titled with the argument, and linked to the spec item via a label or body reference. The trigger SHALL be idempotent: if an issue with the same title and the `openspec-task` label already exists for this item, no new issue SHALL be created.

#### Scenario: Task issue created
- **WHEN** trigger `create-task "Write unit tests for login"` runs for AUTH-001
- **THEN** a GitHub Issue SHALL be created with title "Write unit tests for login", label `openspec-task`, and body referencing AUTH-001

#### Scenario: Duplicate task not created
- **WHEN** the same trigger has already created an issue for this item
- **THEN** no duplicate issue SHALL be created

---

### Requirement: link-issue trigger
`@visualizer:trigger link-issue <number>` SHALL update the item's `visualize.json` to set `github.linked_issue` to the specified issue number.

#### Scenario: Issue linked in visualize.json
- **WHEN** trigger `link-issue 103` runs for AUTH-001
- **THEN** `openspec/specs/AUTH-001/visualize.json` SHALL have `github.linked_issue: 103`

---

### Requirement: archive trigger
`@visualizer:trigger archive` SHALL set `archived: true` in the item's `visualize.json` and move the item's folder to the `openspec/archive/<type>/` directory.

#### Scenario: Item archived on trigger
- **WHEN** trigger `archive` runs for AUTH-OLD-001
- **THEN** `visualize.json` for AUTH-OLD-001 SHALL have `archived: true` and the folder SHALL be moved to `openspec/archive/specs/AUTH-OLD-001/`

---

### Requirement: Supported trigger types
The sync action SHALL support and process the following trigger types: `notify-team`, `create-task`, `link-issue`, `set-milestone`, `create-baseline`, `request-review`, `deprecate`, `archive`. Unrecognized trigger types SHALL be logged as warnings and skipped.

#### Scenario: Unrecognized trigger type skipped
- **WHEN** a directive contains `@visualizer:trigger unknown-type foo`
- **THEN** the action SHALL log "Unknown trigger type: unknown-type" and continue without error
