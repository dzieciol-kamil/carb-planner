# Onboarding tour — design spec

Date: 2026-07-29

## Problem

New visitors land on a fully empty planner (no route, no gear, no fills) and get no
guidance. Real users have asked how to plan and, specifically, haven't discovered that
a bottle's fill segment (`FillBar`) can be **resized** (not just moved) and that its
**content type can be switched** via the hover popover. We need:

1. An automatic first-visit tour.
2. A button to replay it any time.
3. The tour content itself should explain what the app is, how to plan, and how to
   read the result — not a separate static help page.

## Scope decisions (from brainstorming)

- One interactive tour, spotlighting real, live UI elements — no separate static
  help/screenshot section, no external tour library (project has zero UI
  dependencies; hand-rolled SVG chart etc. — the tour follows that convention).
- On first visit the store is empty anyway, so the tour's demo step writes real demo
  data directly into the live store. There is nothing to "restore" on first visit.
- A manual replay (from the footer button) **is destructive** if the user already has
  real data: it must warn ("this will overwrite your current plan with demo data,
  this can't be undone") before proceeding, and it never attempts to restore the
  previous state afterward.
- Condensed to **5 steps** (not a step per component) per explicit user request.

## Step list

1. **Welcome** — centered card, no target. What the app does: plan carb + fluid
   intake against your route, effort, and heat.
2. **Route & result** — spotlight on the wrapping row that contains `RoutePanel` +
   `SummaryCards` (`App.tsx`, the flex div around both). Explains: fill in
   distance/pace or duration and conditions; the two cards show whether the plan
   covers carb need and fluid loss.
3. **Chart: empty → after adding a bottle** — spotlight on the chart area
   (`ChartCard`'s chart region). Starts empty (flat lines, nothing to show), then
   triggers demo data injection (see below) so the supply line visibly rises to meet
   demand and the gut/absorption lane appears.
4. **Bottles: move, resize, change content** — spotlight on the demo `FillBar`
   created in step 3. Explains the three interactions explicitly, since this is the
   gap users hit in practice: drag the middle to move the stretch, drag either edge
   to shorten/lengthen it, hover to reveal buttons that switch content
   (water/isotonic/gel) when the bottle allows more than one type.
5. **Closing** — centered card, no target. Brief pointer to the timeline, recipes,
   and settings/gear panels, plus: the tour can be replayed any time from the footer
   button.

Steps 3 and 4 carry the most explanatory text; the rest stay to 1–2 sentences. The
tour is purely informational — no step requires the user to perform an action to
advance; Next/Back/Skip always work regardless of interaction with the highlighted
element.

## Architecture

### Store (`src/store/appStore.ts`)

Add to `UiState`:
- `tourSeen: boolean` — persisted (same persisted store as everything else). `false`
  until the tour has been started once (auto or manual).
- `tourStep: number | null` — `null` when the tour isn't running; otherwise the
  current step index (0–4).

New actions:
- `startTour()` — sets `tourStep: 0`, `tourSeen: true`.
- `closeTour()` — sets `tourStep: null`. Does not revert any demo data already
  injected.
- `setTourStep(n: number)` — navigates Back/Next within bounds; calling past the
  last step is equivalent to `closeTour()`.
- `loadTourDemoData()` — side-effecting action invoked on entering step 3: sets a
  demo route (e.g. 90 km / 28 km/h), adds one 750 ml vessel with `allowed: ['water',
  'izo']`, and one fill covering part of the route, sufficient to visibly raise the
  chart's supply line and show the gut lane. Called directly (no snapshotting) —
  first-visit store is empty, and manual replays are already gated by the
  destructive-action confirmation below.

### Components (`src/components/tour/`)

- **`tourSteps.ts`** — ordered step data: `{ id, targetSelector?: string, titleKey,
  bodyKey, onEnter?: () => void }`. `targetSelector` matches a `data-tour="<id>"`
  attribute added to the relevant existing elements (the App-level row wrapping
  `RoutePanel`+`SummaryCards`, the chart region in `ChartCard`, and — dynamically —
  the demo `FillBar` once created).
- **`TourOverlay.tsx`** — the engine, rendered at the `App` root when `tourStep !==
  null`. For the current step:
  - No target → centered card (same visual language as the destructive-replay
    confirmation).
  - Target present → measures it via `getBoundingClientRect()`, renders a dimmed
    backdrop with a cutout around the rect (four positioned divs, not an SVG mask —
    consistent with the rest of the app's plain-div styling) and a tooltip card
    positioned adjacent to the cutout, clamped to viewport bounds so it never runs
    off-screen at narrow widths.
  - Re-measures on `scroll`/`resize` and via a `requestAnimationFrame` loop while
    active, since layout here is plain flexbox and this stays cheap.
  - Tooltip contains: title, body (i18n), step counter ("2 / 5"), Back/Next,
    Skip/X. Escape key and X close the tour immediately, without reverting any
    injected demo data.
- **Footer replay button** — new small control in `Footer.tsx`, near the existing
  GitHub/issues links. On click:
  - If the store holds only default/empty data → `startTour()` directly.
  - Otherwise → show the destructive-replay confirmation (centered card: "Uruchomienie
    touru nadpisze aktualny plan danymi demo. Nie da się tego cofnąć." / Cancel /
    Start) before calling `startTour()`.

No new npm dependency.

### i18n

All tour copy (5 step titles/bodies, Next/Back/Skip, step counter format, the
destructive-replay warning and its buttons) added as new keys to `StringTable` in
`src/i18n/strings.ts`, in both `pl` and `en`, following the existing `t(lang)`
pattern. No hardcoded language-specific text in components.

### Styling

Reuses existing design tokens (`var(--ink)`, `var(--border)`, `var(--chip-border)`,
existing border-radius/shadow values as seen in `PanelShell.tsx` and the Header
language dropdown) — no new visual language introduced.

## Testing

- `vitest` unit tests for the pure store logic: step navigation bounds
  (`setTourStep` clamping), `startTour`/`closeTour` transitions, `tourSeen` staying
  `true` after first start.
- Manual browser verification (this is UI-heavy, hand-rolled positioning, not
  meaningfully unit-testable): first visit auto-starts the tour; spotlight correctly
  tracks each target at both a wide and a narrow (mobile-width) viewport; step 3's
  demo injection visibly raises the chart line; the footer replay button's warning
  appears when real data exists and no data is restored after closing.
