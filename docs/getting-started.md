# Getting Started with SpecStat

## 1. Sign in

Visit **SpecStat** and click **Sign in with GitHub**. Grant the `repo` and `read:user` scopes when prompted.

## 2. Add your repo

Go to **Settings** and enter your GitHub repo in the format `org/repo-name`. SpecStat will check for an `openspec/index.json` at the repo root.

If your repo does not have one yet, proceed to step 3.

## 3. Initialize OpenSpec (first time only)

Copy `actions/openspec-init.yml` from this repo into your repo at `.github/workflows/openspec-init.yml`.

Then go to your repo's **Actions** tab → **OpenSpec Init** → **Run workflow**.

The action will:
- Walk the `openspec/` directory
- Generate `visualize.json` alongside every spec item and folder
- Generate `openspec/index.json` as the root manifest
- Commit all generated files

## 4. Add the sync workflow

Copy `actions/openspec-sync.yml` into `.github/workflows/openspec-sync.yml`. This runs automatically on every push that touches the `openspec/` directory.

## 5. View your specs

Go back to SpecStat and add your repo. You should now see the board view with all your spec items as cards.

## 6. Explore the views

- **Board** — Jira-like cards grouped by status. Drag cards between columns to update their status.
- **Tree** — Folder hierarchy. Click a folder to open its items in the board.
- **Graph** — Relationship map showing all `relations` between items.
- **Timeline** — Commit history for all spec files, with baseline markers.
- **Archive** — Items marked `archived: true`.

## 7. Trigger actions from the UI

In the detail panel for any item, you can view embedded `@visualizer:trigger` directives. To trigger a GitHub Action from the UI (e.g., create a baseline), use the Settings → Actions panel (coming in a future release).
