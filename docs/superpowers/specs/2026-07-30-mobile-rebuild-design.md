# Mobile layout rebuild — design spec

Date: 2026-07-30

## Problem

The current mobile experience is a disconnected, unfinished sketch
(`src/components/mobile/*`, 1092 lines, not imported anywhere in `App.tsx`) built on
the same drag-to-edit gesture as desktop (`createFillDragHandler` /
`createGelPartDragHandler`). On a phone that gesture doesn't work: a finger covers
what it's adjusting, handles are 11px, and 1px of track is almost 0.5km of route.

A full design handoff package was produced externally and supplied as
`design_handoff_mobile/` (zipped, extracted to a scratch dir for this session):
`PROMPT.md` (build instructions), `README.md` (full screen-by-screen spec, high
fidelity — colors/type/spacing/copy are final), and `Carbfueling Mobile.dc.html` (an
interactive HTML prototype, reference only, not code to copy — its math is simplified
for clicking and must be ignored).

This spec does **not** restate that document's pixel-level detail (screens, tokens,
copy, interaction rules) — treat `README.md`'s "Screens / Views" and "Interactions &
Behavior" sections as authoritative for that. This spec covers only the decisions
needed to fit that design onto *this* codebase's existing store, types, and
conventions.

## Approach

Two things the desktop gesture conflated get split: **the chart is read-only**
(scrub-to-read with a pointer-tracked badge), **ranges are set with steppers** in an
expandable plan-item card. Mini-lanes under the chart become a tap-to-navigate map,
not drag handles.

Everything is rebuilt from scratch in `src/components/mobile/`; the entire existing
directory is deleted first (confirmed unreferenced by `App.tsx` — safe, no
behavior currently depends on it).

## Integration decisions

### View switching — reuse existing state, add nothing

The spec calls for auto-detecting phone vs. desktop by a ~760px breakpoint,
overridable by an explicit user choice. `appStore.ts` already has exactly this:
`ui.viewMode: 'auto'|'desktop'|'mobile'`, `ui.autoView: 'desktop'|'mobile'`, and the
`isDesktopView(viewMode, autoView)` helper. The design doc's `ui.view` /
`'phone'|'desktop'` chips in the "Ja" tab map onto `setViewMode('desktop'|'mobile')`
— no new field. The width-based auto-detection listener needs to be wired in
`App.tsx` (setting `autoView` on resize) since it doesn't exist yet today.

### `ui.tab` grows from 4 to 5 values

Current: `'plan' | 'gear' | 'food' | 'me'`. Target adds a `'mix'` tab (Mieszanka),
between Sprzęt and Jedzenie, per the design's 5-tab bottom bar. Update `MobileTab`
in `appStore.ts` and drop the old `'gear'` semantics from the deleted stub (fresh
`MobileGear.tsx` replaces it).

### New `ui` fields (added to `UiState`, not persisted beyond what already persists)

| Field | Type | Purpose |
| --- | --- | --- |
| `scrubX` | `number \| null` | chart scrub position in km, `null` when idle |
| `gpxPeek` | `boolean` | eye toggle — chart shows elevation profile instead of the normal series |
| `mixSheet` | `boolean` | full-screen bottle-recipe panel open |
| `routeSheet` | `boolean` | route/conditions bottom sheet open |
| `shopSheet` | `{ editId: number \| null } \| null` | landmark bottom sheet open (add or edit) |

`selKey` already exists and is reused as-is for plan-card expansion + lane
highlighting. Changing `ui.tab` clears `selKey` (per README's "Zmiana zakładki czyści
ui.selKey").

### Types already sufficient — no `domain/types.ts` changes needed

Verified against README's "State Management" table: `Fill.pos` (gel portion
positions), `Vessel.gelParts`, `route.preMealCarbs`/`preMealMinutes`, and `ShopStop`
all already exist. Confirmed `src/domain/fuel.ts` already exports every function the
handoff lists as the required data source (`samples`, `planSummary`, `rateStats`,
`absCap`, `sweat`, `cph`, `prof`, `partArray`, `rangeLabel`, `fmtX`) — the mobile
layer only reads these, never reimplements math, matching hard rule #1.

### Component list — as specified, one file per unit

`MobileApp.tsx`, `MobileChartPanel.tsx`, `MobileChart.tsx`, `MobileLaneStrip.tsx`,
`MobilePlanList.tsx`, `MobilePlanCard.tsx`, `MobileStepper.tsx`, `MobileGear.tsx`,
`MobileMix.tsx`, `MobileFoodLibrary.tsx`, `MobileProfile.tsx`, `MobileMixSheet.tsx`,
`MobileRouteSheet.tsx`, `MobileShopSheet.tsx` — matching the breakdown in
`PROMPT.md`. Styling is inline `CSSProperties` objects following the convention in
`MixPanel.tsx`/`PanelShell.tsx` (no CSS modules, no styled-components); colors come
only from `tokens.css` custom properties plus the handful of one-off hex values the
README lists explicitly (card backgrounds, line colors) — no new tokens invented, no
duplication of existing token values as fresh hex literals.

### Mount point (`App.tsx`)

`App` picks `MobileApp` vs. the current desktop tree based on `isDesktopView(viewMode,
autoView)`. A resize listener updates `autoView`. Desktop components/tree are
untouched.

### Pure logic that gets extracted (and tested)

Per the handoff's closing rule ("don't add domain tests; if you add presentation-layer
helper logic, extract it to a pure function and test it like the existing style"),
three bits of non-trivial layout math get pulled into a plain module
(`src/components/mobile/mobileMath.ts`) with a co-located `mobileMath.test.ts`:

- **Stepper clamping**: given step size (1/5/10km rule, or the generic
  `[min,max,step]` cases used for volume/weight/etc.), current value, and bounds,
  return the clamped next value. One function, reused by every `MobileStepper`
  instance.
- **Gel-portion stepper ordering**: middle handles write `fill.pos[k]` but must not
  cross neighboring portions (min 0.5km gap) — pure function taking `(fill, gear, k,
  candidateKm) → clampedKm`.
- **Food touch-hitbox width**: point food markers get a 40px hit target centered on a
  9px dot, narrowed to half the neighbor gap (min 18px) — pure function `(indexPx,
  neighborsPx) → { left, width }` in pixel space, independent of React/DOM.

Everything else (scrub position → value lookup, chart rendering, sheet open/close) is
either a thin read of existing `domain/fuel.ts` output or trivial store plumbing, and
stays inline in components rather than being extracted for extraction's sake.

### i18n

All new copy (5 tab labels, chart-mode narration lines, sheet titles/hints, chip
labels not already in `StringTable`, empty-state/disabled-state text) is added as new
keys to `StringTable` in `src/i18n/strings.ts` in both `pl` and `en`, reusing existing
keys wherever the desktop UI already has the same concept (e.g. `water`/`izo`/`gel`,
`shotMode`/`contMode`, `tabPlan`/`tabFood`/`tabMe` already exist; only `tabMix` plus
the mobile-specific narration/hint copy is genuinely new). Language selection already
uses `LANGS` (currently `['pl','en']`) — the design's requirement that language choice
"be ready for more than two" is already satisfied by the existing pattern; no `if
(lang === 'pl')` branches get introduced anywhere in the new components.

## Testing

- `mobileMath.test.ts` — unit tests for the three pure functions above (clamping,
  gel-portion ordering, touch-hitbox sizing), in the existing `vitest` style
  (`fuel.test.ts`, `dragMath.test.ts`).
- No changes to `domain/fuel.test.ts` or other domain tests — the math is unchanged.
- `npx tsc -b` and `npm test` must pass before considering the work done (explicit
  handoff requirement).
- Manual verification: run the dev server, resize to a phone-width viewport (or a
  device emulator), click through all 5 tabs, the 3 bottom sheets, and the full-screen
  mix panel — this is the user's own acceptance step, done after the build is running
  locally.
