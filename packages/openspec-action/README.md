# @specstat/openspec-action

The **SpecStat GitHub Action** runtime — a Node20 action that does all OpenSpec
parsing and indexing in CI. This is where every write happens; the
[web app](../../apps/web/README.md) only reads the files this action generates.

The published action definition lives at the repo root in
[`action.yml`](../../action.yml), which points `runs.main` at the bundled
`dist/main.js` produced from this package.

## Modes

The entry point (`src/main.ts`) dispatches on the `mode` input:

| Mode | Source | Purpose |
| --- | --- | --- |
| `init` | `init.ts` | Walk `openspec/`, generate every `visualize.json` + the root `index.json`, and commit. |
| `sync` | `sync.ts` | Re-index on push; also processes markdown triggers. |
| `validate` | `validate.ts` | Validate items against schema / custom rules. |
| `baseline` | `baseline.ts` | Create a named snapshot of the current spec state. |
| `process-triggers` | `processTriggers.ts` | Run `@visualizer:trigger` directives in spec markdown. |
| `pr-comment` | `prComment.ts` | Post a validation/summary comment on the PR. |
| `clean` | `clean.ts` | Remove generated JSON files. |

> Unknown modes fail the action via `core.setFailed`. The `report` mode is a no-op
> placeholder.

## Inputs

From [`action.yml`](../../action.yml):

| Input | Required | Default | Notes |
| --- | --- | --- | --- |
| `mode` | ✅ | — | One of the modes above. |
| `github_token` | ✅ | — | Token for repo writes / PRs. |
| `root` | | `openspec` | OpenSpec root folder. |
| `baseline_name` | | — | `baseline` mode only. |
| `description` | | — | `baseline` mode only. |
| `rules` | | — | Validation rules YAML (`validate` mode only). |

## Build

The action is compiled with `tsc` and then bundled into a single file with
esbuild (Node20 target, `--allowOverwrite`):

```bash
npm run build      # tsc && esbuild bundle → dist/main.js
```

`dist/main.js` is committed (it is allow-listed in `.gitignore`) so GitHub can run
the action without an install step.

## Usage

End users don't depend on this package directly — they reference the published
action and copy the ready-made workflow templates from [`actions/`](../../actions):

```yaml
- uses: MyGenX/SpecStat@v1
  with:
    mode: sync
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

See [Markdown Triggers](../../docs/markdown-triggers.md) for the directives the
`sync` / `process-triggers` modes act on.
