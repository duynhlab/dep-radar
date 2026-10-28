# CLAUDE.md

Agent-facing notes for this repo. `README.md` is the human-facing doc and goes
deeper on most topics; this file covers the conventions and constraints that
are easy to violate.

## Git Commit Convention

Semantic format for **both commit messages and PR titles**, same as
release-radar.

```
type(scope): subject
```

- **Types**: `feat` `fix` `chore` `ci` `docs`
- **Scopes**: `sync` `data` `ui` `domain` `ci` `deps` `readme`
- Subject in lowercase, imperative, no trailing period.
- Branches: `feat/…` `fix/…` `chore/…` `docs/…`.

Every commit is authored by `duynhne <108656040+duynhne@users.noreply.github.com>`
and carries this trailer:

```
Co-Authored-By: duynebot <bot@duynh.me>
```

**Never add Claude attribution** — no `Co-Authored-By: Claude …` trailer, no
"Generated with Claude Code" line in PR bodies.

## Project Overview

Inbox for the Renovate pull requests of `duynhlab/homelab`. A GitHub Action
in gha-workflows reviews each PR with Copilot CLI and leaves one comment whose
first line is `<!-- dep-radar:v1 {json} -->`; this repo's sync reads that
JSON plus the PR's own state, commits it under `data/`, and the site renders
an inbox grouped by what each PR needs from the owner.

No database, no runtime API calls, no client-side tokens. The site is a pure
function of the committed JSON — **if the site shows wrong data, look at
`data/`, then at the PR comment, not at the frontend.**

The bucket a PR lands in is decided in `src/domain/buckets.ts` at sync time
and stored in the data, so the UI never re-derives it.

## Design authority

The UI follows the backoffice (`duynhlab/admin-service`) product-design skill,
vendored at `.claude/skills/product-design/SKILL.md`: shadcn `base-nova`
preset on Base UI (`render` prop, never `asChild`), the neutral OKLCH token
block in `src/styles/app.css`, Geist/Geist Mono, sidebar shell, `text-sm`
body, `text-[13px]` controls, status through one `Badge`. Colour is reserved
for meaning: `destructive` tint for breaking, amber text for minor,
`secondary` for no impact; areas and update types stay `outline`.
`tests/unit/styles.test.ts` and `tests/unit/contrast.test.ts` pin the
contract. Keep `src/components/ui/*` pristine; customise in
`src/components/app/*` or at the call site.

## Setup

```bash
pnpm install
GITHUB_TOKEN=$(gh auth token) pnpm sync   # read-only against duynhlab/homelab
pnpm gen && pnpm dev
```

- Node >= 26 runs the `.ts` scripts natively.
- `pnpm dev:fixture` overlays `tests/fixtures/prs/*.json` (one PR with a full
  review, one ready, one stale) onto `data/` so the detail page can be seen
  before real reviews exist. Local only: `pnpm sync` restores the snapshot;
  never commit the overlay.
- TypeScript stays on 6.0.x: typescript-eslint 8 refuses TS 7. Vitest stays
  on 4.1.x: `@cloudflare/vitest-pool-workers` peers `vitest ^4.1`.
- pnpm 11, pinned via `packageManager`; `pnpm-workspace.yaml` holds
  `allowBuilds` (a **map**, not a list).

## Gotchas (inherited from release-radar; already bitten once there)

1. **Prerender runs in workerd, not Node.** `node:fs` fails there. Per-PR
   records are static assets under `public/pr-data/`, fetched over HTTP.
2. **`prerender.autoSubfolderIndex` must stay `false`.**
3. **`throw notFound()` alone gives a real 404.** Never set
   `assets.not_found_handling: "single-page-application"`.
4. **Start's import-protection fails the build** if route code imports
   `@tanstack/react-start/server` outside `createIsomorphicFn().server()`.
5. **Release notes are hostile input** — render only through
   `components/releases/release-notes.tsx` (raw HTML off, headings
   downgraded, remote images blocked).
6. **Hydration and time**: nothing time-relative in server render.
   `TimeAgo` renders the absolute date until hydrated.
7. **Sync commits don't trigger CI** but DO trigger Cloudflare rebuilds.
   `pnpm gen` runs in the sync workflow before the commit as the parse gate.
8. **One deploy path**: Cloudflare Workers Builds. Do NOT add a deploy step
   to GitHub Actions.
