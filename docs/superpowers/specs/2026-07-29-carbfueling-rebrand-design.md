# Rebrand: Carb Planner → Carb Fueling

## Context

Project is moving to a purchased domain, `carbfueling.com`, and the GitHub repo has
already been renamed from `carb-planner` to `carbfueling`
(https://github.com/dzieciol-kamil/carbfueling). App code and docs still reference
the old name and old repo path throughout.

## Goal

Rename the visible brand and the technical identifiers to match, without breaking
the app for existing users beyond an accepted, one-time reset of locally saved plans.

## Naming

- **Visible brand (UI):** `Carb Fueling`. Wordmark treatment in `Header.tsx`,
  `MobileTop.tsx`, `Footer.tsx` stays uppercase, matching current style:
  `CARB FUELING`.
- **Technical identifier (package name, Vite base path, localStorage key):**
  `carbfueling` (no dash), matching the actual renamed GitHub repo and the domain.

## Changes

| File | Change |
|---|---|
| `src/components/Header.tsx` | `CARB PLANNER` → `CARB FUELING` |
| `src/components/mobile/MobileTop.tsx` | `CARB PLANNER` → `CARB FUELING` |
| `src/components/Footer.tsx` | `CARB PLANNER` → `CARB FUELING` |
| `src/i18n/strings.ts` | Brand mentions in `ftAboutBody` (PL/EN) and any other prose referencing "Carb Planner" → "Carb Fueling" |
| `src/store/appStore.ts` | `persist` key `'carb-planner'` → `'carbfueling'` |
| `package.json` | `"name": "carb-planner"` → `"carbfueling"` |
| `vite.config.ts` | `base: '/carb-planner/'` → `'/carbfueling/'` |
| `index.html` | `<title>` and any other brand text |
| `README.md` | Project name, live-app link `.../carb-planner/` → `.../carbfueling/` |
| `git remote origin` (local) | Update to `https://github.com/dzieciol-kamil/carbfueling.git` |

## Explicitly out of scope

- `docs/superpowers/plans/*.md` — historical, dated planning docs; not rewritten
  retroactively.
- Custom-domain wiring (`CNAME` file, `vite.config.ts` `base: '/'`) — deferred until
  the `carbfueling.com` domain is actually purchased and DNS is configured. Until
  then the app keeps serving from the GitHub Pages subpath, so `base` must stay
  `/carbfueling/`.
- GitHub repo rename — already done by the user directly on GitHub before this spec
  was written.

## Data-loss note

Changing the `persist` key means any locally saved plan/gear/food data (under the
old `carb-planner` key) will not carry over — users start fresh under the new key.
This was discussed and accepted explicitly.

## Verification

- `npx tsc --noEmit`
- `npm run test`
- Manual check in browser: header, footer (PL and EN), mobile view — confirm no
  leftover "Carb Planner" / "carb-planner" text anywhere in rendered UI.
- `grep -rn "carb-planner\|CARB PLANNER\|Carb Planner\|carbplanner"` over `src/`,
  `index.html`, `README.md`, `package.json`, `vite.config.ts` after changes — should
  only match the intentionally-excluded historical docs in
  `docs/superpowers/plans/`.
