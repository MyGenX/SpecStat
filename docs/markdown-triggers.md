# Markdown Triggers

Spec Markdown files can embed trigger directives that the `openspec-sync` action processes automatically on every push.

## Syntax

```markdown
<!-- @visualizer:trigger <type> <args> -->
```

Directives are HTML comments — invisible in rendered Markdown, invisible to readers.

## Idempotency

Triggers are designed to be idempotent where possible. Running the same trigger multiple times will not produce duplicate effects (e.g., `create-task` checks for an existing issue before creating).

## Supported triggers

### `notify-team <team>`

Posts a GitHub @-mention comment to the named team on the associated PR.

```markdown
<!-- @visualizer:trigger notify-team platform-team -->
```

---

### `create-task "<title>"`

Creates a GitHub Issue in the same repo with the `openspec-task` label, linked to this spec item.

```markdown
<!-- @visualizer:trigger create-task "Write unit tests for login flow" -->
```

---

### `link-issue <number>`

Sets `github.linked_issue` in the item's `visualize.json` to the specified issue number.

```markdown
<!-- @visualizer:trigger link-issue 103 -->
```

---

### `set-milestone <name>`

Sets the milestone on the linked PR or issue.

```markdown
<!-- @visualizer:trigger set-milestone v2.0 -->
```

---

### `request-review <user>`

Requests a GitHub review from the specified user on the linked PR.

```markdown
<!-- @visualizer:trigger request-review alice -->
```

---

### `deprecate <id>`

Sets `status: "deprecated"` in the referenced item's `visualize.json`.

```markdown
<!-- @visualizer:trigger deprecate AUTH-OLD-001 -->
```

---

### `create-baseline <name>`

Triggers the `openspec-baseline` workflow to create a named snapshot.

```markdown
<!-- @visualizer:trigger create-baseline release-2026-Q2 -->
```

---

### `archive`

Sets `archived: true` in this item's `visualize.json`.

```markdown
<!-- @visualizer:trigger archive -->
```

---

## Unknown trigger types

Unrecognized trigger types are logged as warnings and skipped. The `openspec-sync` action never fails due to an unknown trigger type.

## Full example

```markdown
---
id: AUTH-001
title: User login flow
status: approved
---

## Overview

This spec defines the complete login flow...

<!-- @visualizer:trigger notify-team platform-team -->
<!-- @visualizer:trigger create-task "Write unit tests for login" -->
<!-- @visualizer:trigger link-issue 103 -->
<!-- @visualizer:trigger set-milestone v2.0 -->
```
