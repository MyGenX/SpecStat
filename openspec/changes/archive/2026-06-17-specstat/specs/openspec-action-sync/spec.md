## ADDED Requirements

### Requirement: Sync detects changed OpenSpec files
When run in `sync` mode, the action SHALL detect which spec Markdown files and `visualize.json` files changed in the current push (using git diff against the previous commit) and update only the affected entries in `index.json`.

#### Scenario: Only changed items updated in index
- **WHEN** only `openspec/specs/AUTH-001/AUTH-001.md` was changed in the push
- **THEN** only the `AUTH-001` entry in `index.json` SHALL be updated (last_updated, last_commit)

#### Scenario: New spec file triggers index addition
- **WHEN** a new folder `openspec/specs/AUTH-005/AUTH-005.md` is added in the push
- **THEN** a new entry for AUTH-005 SHALL be added to `index.json`

---

### Requirement: Sync updates last_commit in affected items
For each changed item, the sync action SHALL update `last_commit` in the item's `visualize.json` to the current commit SHA and `last_updated` to the current date.

#### Scenario: last_commit updated after sync
- **WHEN** AUTH-001.md is modified and sync runs
- **THEN** `openspec/specs/AUTH-001/visualize.json` SHALL have `last_commit` set to the current commit SHA

---

### Requirement: Sync commits updated index.json
After updating all affected entries, sync SHALL commit the updated `index.json` (and any updated `visualize.json` files) with message: `chore(openspec): sync index after spec changes`.

#### Scenario: Index commit created on push event
- **WHEN** sync runs on a push to main
- **THEN** a follow-up commit SHALL update `index.json`

#### Scenario: No commit on PR event
- **WHEN** sync runs on a pull_request event
- **THEN** no commit SHALL be created; only PR comment mode is executed

---

### Requirement: Sync posts PR comment with diff summary
When triggered by a pull_request event, sync SHALL post a comment on the PR summarizing which spec items were added, modified, or removed.

#### Scenario: PR comment shows changed items
- **WHEN** a PR modifies AUTH-001.md and adds AUTH-005.md
- **THEN** the bot SHALL post a comment listing "Modified: AUTH-001" and "Added: AUTH-005"
