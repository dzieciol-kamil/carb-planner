# CLAUDE.md

Project-specific context for Claude Code sessions in this repo. See `README.md` for stack/dev commands.

## Running locally

```bash
scripts/dev.sh        # starts the Vite dev server in the background on :5173, logs to /tmp/carb-planner-dev.log
scripts/dev.sh 5174   # optional: pick a different port
```

If the port is already in use, the script prints the running server's URL instead of starting a second instance.

## Release process

- Pushing to `master` deploys a **preview** build to `/preview` on carbfueling.com (noindex). It does not touch production.
- Production (carbfueling.com root) only redeploys when a new `vX.Y.Z` git tag is pushed — bump `version` in `package.json`, commit, then tag and push the tag to release.
- So: routine commits/pushes to `master` are safe and don't need a version bump; only tag when you actually want to ship.
- To cut a release:
  1. Bump `version` in `package.json` (and `package-lock.json` stays in sync via `npm install`).
  2. Commit and push to `master`.
  3. `git tag vX.Y.Z && git push origin vX.Y.Z` — this alone triggers the production deploy.
  4. `gh release create vX.Y.Z --generate-notes` — creates the GitHub Release entry (separate from the tag; the deploy doesn't need it, but skipping it leaves the Releases page showing a stale "Latest").

## Code conventions

- `src/domain/` holds pure calculation logic (no React) — e.g. `fuel.ts` (supply/demand math), `gpx.ts` (GPX parsing), `dragMath.ts`, `laneLayout.ts`. Keep this layer framework-free and unit-tested (`*.test.ts` next to each file).
- `src/store/appStore.ts` (zustand) is the single source of app state, persisted to `localStorage` via `persistStorage.ts`. No backend.
- `src/components/` is organized by area: `mobile/`, `panels/`, `timeline/`, `lanes/`, `chart/`, `recipes/`, `tour/`, `ui/`.
- `src/i18n/strings.ts` holds all user-facing copy — don't inline strings in components.
