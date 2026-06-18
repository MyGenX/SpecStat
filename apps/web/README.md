# @specstat/web

The **SpecStat** web UI — a [Next.js 14](https://nextjs.org/) (App Router)
application that reads OpenSpec data directly from GitHub and renders it as
boards, graphs, trees, and timelines.

> Part of the [SpecStat monorepo](../../README.md). This app is a **read-only
> visualizer** — all writes happen through the [GitHub Action](../../packages/openspec-action/README.md).

## Routes

| Route | View |
| --- | --- |
| `/` | Landing page. |
| `/login` | GitHub sign-in. |
| `/workspace` | All connected repositories. |
| `/stories` | Spec items with requirements, scenarios & history. |
| `/proposals` | Kanban board of change proposals. |
| `/tree` | `openspec/` folder hierarchy. |
| `/graph` | Relationship map (React Flow). |
| `/timeline` | Commit history with baseline markers. |
| `/archive` | Archived items. |
| `/settings` | Repo setup, workflow version & actions. |
| `/api/auth/[...nextauth]` | NextAuth v5 route handler. |

## Components

Components are grouped by view under `components/`:

| Directory | Responsibility |
| --- | --- |
| `board/` | Kanban board cards & columns (dnd-kit). |
| `stories/` | Story list, requirements/scenarios, history & enhanced views. |
| `graph/` | React Flow nodes, edges & controls. |
| `tree/` | Folder tree navigation. |
| `timeline/` | Commit timeline & baseline markers. |
| `layout/` | App shell, nav bar, repo switcher, theme toggle. |
| `shared/` | Reusable primitives used across views. |

## `lib/`

| File | Purpose |
| --- | --- |
| `cn.ts` | `clsx` + `tailwind-merge` class helper. |
| `hooks.ts` | TanStack Query hooks for fetching repo data. |
| `kanban.ts` | Board grouping / status helpers. |
| `queryClient.tsx` | TanStack Query client provider. |
| `workspace.ts` | Connected-repo / workspace state helpers. |

## Auth

Authentication is handled by **NextAuth v5** with the GitHub provider
(`auth.ts`, `middleware.ts`). The GitHub access token is used by
[`@specstat/github-client`](../../packages/github-client/README.md) to read repo
contents via Octokit.

## Data fetching

The app uses **TanStack Query** for caching and **TanStack Virtual** for large
lists. All GitHub access goes through `@specstat/github-client`; OpenSpec files
are parsed with `@specstat/openspec-parser`.

## Environment

Create `apps/web/.env.local`:

```bash
AUTH_GITHUB_ID=...        # GitHub OAuth app client ID
AUTH_GITHUB_SECRET=...    # GitHub OAuth app client secret
AUTH_SECRET=...           # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

## Scripts

| Script | Action |
| --- | --- |
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run `next lint`. |
| `npm run type-check` | `tsc --noEmit`. |

Run from the repo root with `npm run dev`, or from `apps/web` directly.
