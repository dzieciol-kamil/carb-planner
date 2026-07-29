# Onboarding Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 5-step, spotlight-style onboarding tour that auto-starts on first visit, explains the app end-to-end (route → chart → the bottle-resize/content-switch gap real users hit → where else to look), and can be replayed any time from a footer button.

**Architecture:** A new `ui.tourStep`/`ui.tourSeen` pair in the existing Zustand store drives a single always-mounted `TourOverlay` component that spotlights real DOM elements (marked with `data-tour="..."` attributes) behind a dimmed backdrop. One step injects real demo data into the live store so the chart visibly changes from empty to populated. No new dependency — plain positioned `div`s, matching the project's hand-rolled style.

**Tech Stack:** Vite + React 19 + TypeScript, Zustand (existing store/persist setup), Vitest for pure-logic tests.

## Global Constraints

- No new npm dependency for the tour UI — custom components only, consistent with the project's zero-UI-dependency convention (spec §1).
- All user-facing copy goes through `StringTable` / `t(lang)` in `src/i18n/strings.ts`, in both `pl` and `en` — no hardcoded language text in components (spec §4).
- The tour is purely informational: no step requires the user to perform an action on the highlighted element to advance (spec, step list intro).
- Manual replay from the footer is destructive when real plan data exists: it must warn before overwriting and never restores prior state afterward (spec §3).
- Styling reuses existing tokens (`var(--ink)`, `var(--border)`, `var(--chip-border)`, radii/shadows as seen in `PanelShell.tsx` and `Header.tsx`) — no new visual language (spec §4).
- Design spec of record: `docs/superpowers/specs/2026-07-29-onboarding-tour-design.md`. Follow it for anything this plan doesn't spell out explicitly.

---

### Task 1: Store — tour state, actions, and `hasPlanData`

**Files:**
- Modify: `src/store/appStore.ts`
- Test: `src/store/appStore.test.ts` (new)

**Interfaces:**
- Produces (used by later tasks):
  - `useAppStore` gains `ui.tourStep: number | null`, `ui.tourSeen: boolean`, `ui.tourDemoFid: number | null`.
  - `startTour(): void` — sets `tourStep: 0`, `tourSeen: true`, `tourDemoFid: null`.
  - `closeTour(): void` — sets `tourStep: null`.
  - `setTourStep(n: number): void` — sets `tourStep` to `Math.max(0, n)`.
  - `loadTourDemoData(): void` — idempotent per tour run (no-op if `ui.tourDemoFid !== null`); sets `route.mode`/`distance`/`speed` to a demo route and appends one `Fill` to `gear[0]`, recording its `fid` in `ui.tourDemoFid`.
  - `hasPlanData(state: Pick<AppState, 'route' | 'fills' | 'foods' | 'shops'>): boolean` — exported standalone function (not a store action).

- [ ] **Step 1: Write the failing tests**

Create `src/store/appStore.test.ts`:

```ts
import { beforeEach, describe, expect, test } from 'vitest';
import { hasPlanData, useAppStore } from './appStore';
import type { RouteInput } from '../domain/types';

function route(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    mode: 'route',
    distance: 0,
    speed: 0,
    hours: 0,
    minutes: 0,
    weight: 78,
    preMealCarbs: 50,
    preMealMinutes: 45,
    intensity: 'mid',
    temp: 24,
    useGpx: true,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...overrides,
  };
}

describe('hasPlanData', () => {
  test('false when route, fills, foods and shops are all default/empty', () => {
    expect(hasPlanData({ route: route(), fills: [], foods: [], shops: [] })).toBe(false);
  });

  test('true once the route has a distance', () => {
    expect(hasPlanData({ route: route({ distance: 50 }), fills: [], foods: [], shops: [] })).toBe(true);
  });

  test('true once a fill exists, even with a default route', () => {
    expect(
      hasPlanData({ route: route(), fills: [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 10 }], foods: [], shops: [] }),
    ).toBe(true);
  });

  test('true once a shop stop exists', () => {
    expect(hasPlanData({ route: route(), fills: [], foods: [], shops: [{ id: 1, at: 40 }] })).toBe(true);
  });
});

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('tour lifecycle', () => {
  test('startTour opens at step 0 and marks tourSeen', () => {
    useAppStore.getState().startTour();
    const ui = useAppStore.getState().ui;
    expect(ui.tourStep).toBe(0);
    expect(ui.tourSeen).toBe(true);
  });

  test('closeTour clears the running step', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().closeTour();
    expect(useAppStore.getState().ui.tourStep).toBeNull();
  });

  test('setTourStep clamps below zero to zero', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().setTourStep(-3);
    expect(useAppStore.getState().ui.tourStep).toBe(0);
  });

  test('setTourStep moves forward freely', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().setTourStep(2);
    expect(useAppStore.getState().ui.tourStep).toBe(2);
  });
});

describe('loadTourDemoData', () => {
  test('sets a demo route and adds one fill on the first vessel', () => {
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.route.distance).toBe(90);
    expect(s.route.speed).toBe(28);
    expect(s.fills).toHaveLength(1);
    expect(s.fills[0].gid).toBe('g1');
    expect(s.ui.tourDemoFid).toBe(s.fills[0].fid);
  });

  test('is a no-op the second time it is called', () => {
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().loadTourDemoData();
    expect(useAppStore.getState().fills).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/store/appStore.test.ts`
Expected: FAIL — `hasPlanData`, `startTour`, `closeTour`, `setTourStep`, `loadTourDemoData` are not exported / not defined.

- [ ] **Step 3: Add the tour fields and actions to the store**

In `src/store/appStore.ts`, extend `UiState` (after `tab: MobileTab;`):

```ts
interface UiState {
  lang: Lang;
  viewMode: ViewMode;
  autoView: 'desktop' | 'mobile';
  panel: PanelId;
  xUnit: XUnit;
  yMode: YMode;
  selKey: string | null;
  hoverKey: string | null;
  dragKey: string | null;
  timelineOpen: boolean;
  tab: MobileTab;
  tourStep: number | null;
  tourSeen: boolean;
  tourDemoFid: number | null;
}
```

Add to the `AppState` interface (near the other `ui.*` actions, after `setTab`):

```ts
  startTour: () => void;
  closeTour: () => void;
  setTourStep: (n: number) => void;
  loadTourDemoData: () => void;
```

Add the three new fields to the default `ui` object in the store initializer:

```ts
    ui: {
      lang: 'pl',
      viewMode: 'auto',
      autoView: 'desktop',
      panel: null,
      xUnit: 'km',
      yMode: 'rate',
      selKey: null,
      hoverKey: null,
      dragKey: null,
      timelineOpen: false,
      tab: 'plan',
      tourStep: null,
      tourSeen: false,
      tourDemoFid: null,
    },
```

Add the action implementations right after `setTab: (tab) => set((s) => ({ ui: { ...s.ui, tab } })),`:

```ts
    startTour: () => set((s) => ({ ui: { ...s.ui, tourStep: 0, tourSeen: true, tourDemoFid: null } })),
    closeTour: () => set((s) => ({ ui: { ...s.ui, tourStep: null } })),
    setTourStep: (n) => set((s) => ({ ui: { ...s.ui, tourStep: Math.max(0, n) } })),
    loadTourDemoData: () =>
      set((s) => {
        if (s.ui.tourDemoFid !== null) return {};
        const route: RouteInput = { ...s.route, mode: 'route', distance: 90, speed: 28 };
        const distanceKm = dist(route);
        const vessel = s.gear[0];
        if (!vessel) return { route };
        const span = bestGapSpan(
          gaps(
            s.fills.filter((f) => f.gid === vessel.gid),
            distanceKm,
          ),
          distanceKm,
        );
        if (!span) return { route };
        const allowed: Fill['content'][] = vessel.allowed?.length ? vessel.allowed : ['izo'];
        const content: Fill['content'] = allowed.includes('izo') ? 'izo' : allowed[0];
        const fid = s.nextFid;
        return {
          route,
          fills: [...s.fills, { fid, gid: vessel.gid, content, from: span.from, to: span.to }],
          nextFid: fid + 1,
          ui: { ...s.ui, tourDemoFid: fid },
        };
      }),
```

Finally, add `hasPlanData` next to `isDesktopView` at the bottom of the file:

```ts
export function hasPlanData(state: Pick<AppState, 'route' | 'fills' | 'foods' | 'shops'>): boolean {
  const r = state.route;
  return (
    r.distance > 0 ||
    r.speed > 0 ||
    r.hours > 0 ||
    r.minutes > 0 ||
    r.gpxTrack !== null ||
    state.fills.length > 0 ||
    state.foods.length > 0 ||
    state.shops.length > 0
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/store/appStore.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/store/appStore.ts src/store/appStore.test.ts
git commit -m "$(cat <<'EOF'
Add tour state, actions and hasPlanData to the app store

Lays the store-level groundwork for the onboarding tour: step
navigation, the first-visit flag, and the idempotent demo-data
loader the chart step uses to show supply/demand before vs. after
adding a bottle.
EOF
)"
```

---

### Task 2: i18n — tour copy strings

**Files:**
- Modify: `src/i18n/strings.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: new `StringTable` keys used by Tasks 4 and 5 — `tourWelcomeTitle`, `tourWelcomeBody`, `tourRouteTitle`, `tourRouteBody`, `tourChartTitle`, `tourChartBody`, `tourFillTitle`, `tourFillBody`, `tourClosingTitle`, `tourClosingBody`, `tourNext`, `tourBack`, `tourSkip`, `tourFinish`, `tourStepLabel`, `tourReplayButton`, `tourConfirmTitle`, `tourConfirmBody`, `tourConfirmCancel`, `tourConfirmStart` (all `string`).

- [ ] **Step 1: Add the new keys to the `StringTable` interface**

In `src/i18n/strings.ts`, add before the closing `}` of `StringTable` (after `ftCopyright: string;`):

```ts
  tourWelcomeTitle: string;
  tourWelcomeBody: string;
  tourRouteTitle: string;
  tourRouteBody: string;
  tourChartTitle: string;
  tourChartBody: string;
  tourFillTitle: string;
  tourFillBody: string;
  tourClosingTitle: string;
  tourClosingBody: string;
  tourNext: string;
  tourBack: string;
  tourSkip: string;
  tourFinish: string;
  tourStepLabel: string;
  tourReplayButton: string;
  tourConfirmTitle: string;
  tourConfirmBody: string;
  tourConfirmCancel: string;
  tourConfirmStart: string;
```

- [ ] **Step 2: Typecheck to see the two object-literal errors**

Run: `npx tsc -b`
Expected: FAIL — `STR.pl` and `STR.en` are each missing the 19 new properties (TS2739 or similar).

- [ ] **Step 3: Add the Polish copy**

In `src/i18n/strings.ts`, inside `STR.pl`, add right after `ftCopyright: '© 2026 Carb Planner · open source',` (still inside the `pl` object, before its closing `},`):

```ts
    tourWelcomeTitle: 'Witaj w Carb Plannerze',
    tourWelcomeBody: 'W kilku krokach pokażemy, jak zaplanować węglowodany i płyny na trasę oraz jak czytać wynik. Zajmie to około minuty.',
    tourRouteTitle: 'Trasa i wynik',
    tourRouteBody:
      'Tu opisujesz przejazd — dystansem i tempem albo czasem trwania — oraz warunki (intensywność, temperatura, posiłek przed startem). Karty obok pokazują, czy Twój plan pokrywa zapotrzebowanie na węglowodany i płyny.',
    tourChartTitle: 'Wykres: podaż kontra zapotrzebowanie',
    tourChartBody:
      'Górna linia to ile węglowodanów realnie dostarczasz, dolna przerywana — ile potrzebujesz. Teraz jest pusto, bo nie masz jeszcze żadnego bidonu ani jedzenia w planie. Zaraz dodamy przykładowy bidon, żebyś zobaczył, jak linia się zmienia.',
    tourFillTitle: 'Bidon: przesuwanie, zwężanie, zmiana zawartości',
    tourFillBody:
      'Ten pasek to właśnie dodany bidon. Chwyć środek, żeby przesunąć go po trasie. Chwyć lewą lub prawą krawędź, żeby skrócić lub wydłużyć odcinek, na którym z niego pijesz. Najedź kursorem, a pojawią się przyciski zmiany zawartości (woda / izotonik / żel), jeśli bidon obsługuje więcej niż jeden rodzaj.',
    tourClosingTitle: 'To wszystko na start',
    tourClosingBody:
      'Oś czasu, przepisy na mieszankę i ustawienia (waga, limit wchłaniania, proporcje) znajdziesz niżej i w przyciskach w nagłówku. Ten tour możesz odpalić ponownie w każdej chwili przyciskiem w stopce.',
    tourNext: 'Dalej',
    tourBack: 'Wstecz',
    tourSkip: 'Pomiń',
    tourFinish: 'Zakończ',
    tourStepLabel: 'Krok',
    tourReplayButton: 'Pokaż tour ponownie',
    tourConfirmTitle: 'Uruchomić tour ponownie?',
    tourConfirmBody: 'Tour wczyta przykładowe dane (trasa i jeden bidon) w miejsce Twojego aktualnego planu. Tej zmiany nie da się cofnąć.',
    tourConfirmCancel: 'Anuluj',
    tourConfirmStart: 'Uruchom tour',
```

- [ ] **Step 4: Add the English copy**

In `src/i18n/strings.ts`, inside `STR.en`, add right after `ftCopyright: '© 2026 Carb Planner · open source',` (still inside the `en` object, before its closing `},`):

```ts
    tourWelcomeTitle: 'Welcome to Carb Planner',
    tourWelcomeBody: "A few steps to show you how to plan carbs and fluids for your ride, and how to read the result. Takes about a minute.",
    tourRouteTitle: 'Route & result',
    tourRouteBody:
      "Describe your ride here — distance and pace, or a duration — plus conditions (intensity, temperature, pre-ride meal). The cards next to it show whether your plan covers your carb and fluid needs.",
    tourChartTitle: 'The chart: supply vs. requirement',
    tourChartBody:
      "The top line is how many carbs you're actually delivering, the dashed line below is how many you need. It's empty right now because there's no bottle or food in the plan yet. We'll add a sample bottle next so you can see the line change.",
    tourFillTitle: 'A bottle: move it, resize it, change its contents',
    tourFillBody:
      "This bar is the bottle we just added. Drag the middle to move it along the route. Drag either edge to shorten or lengthen the stretch you drink it over. Hover it and buttons appear to switch its contents (water / isotonic / gel) if the bottle allows more than one.",
    tourClosingTitle: "That's the essentials",
    tourClosingBody:
      "The timeline, the mix recipe and settings (weight, absorption limit, ratios) are further down and in the header buttons. Replay this tour any time from the button in the footer.",
    tourNext: 'Next',
    tourBack: 'Back',
    tourSkip: 'Skip',
    tourFinish: 'Finish',
    tourStepLabel: 'Step',
    tourReplayButton: 'Replay tour',
    tourConfirmTitle: 'Replay the tour?',
    tourConfirmBody: "The tour will load sample data (a route and one bottle) over your current plan. This can't be undone.",
    tourConfirmCancel: 'Cancel',
    tourConfirmStart: 'Start tour',
```

- [ ] **Step 5: Typecheck to confirm both objects satisfy `StringTable`**

Run: `npx tsc -b`
Expected: PASS, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "$(cat <<'EOF'
Add PL/EN copy for the onboarding tour

19 new StringTable keys covering the 5 tour steps, nav buttons and
the destructive-replay confirmation, following the existing t(lang)
pattern.
EOF
)"
```

---

### Task 3: Tour step data and `data-tour` wiring

**Files:**
- Create: `src/components/tour/tourSteps.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/chart/ChartCard.tsx`
- Modify: `src/components/lanes/FillBar.tsx`

**Interfaces:**
- Consumes: `useAppStore`, `loadTourDemoData` (Task 1); `TourCopyKey`-shaped string keys added in Task 2 (referenced by name only, no import needed here beyond the literal key strings matching `StringTable`).
- Produces: `TOUR_STEPS: TourStep[]`, `TourStep`, `TourTarget`, `TourCopyKey` types from `tourSteps.ts`, consumed by Task 4's `TourOverlay`. `data-tour="route-summary"` on the App-level route+summary row, `data-tour="chart"` on `ChartCard`'s chart wrapper, and a dynamic `data-tour="demo-fill"` on the `FillBar` matching `ui.tourDemoFid`.

- [ ] **Step 1: Create the step data file**

Create `src/components/tour/tourSteps.ts`:

```ts
import { useAppStore } from '../../store/appStore';

export type TourTarget = 'route-summary' | 'chart' | 'demo-fill';

export type TourCopyKey =
  | 'tourWelcomeTitle'
  | 'tourWelcomeBody'
  | 'tourRouteTitle'
  | 'tourRouteBody'
  | 'tourChartTitle'
  | 'tourChartBody'
  | 'tourFillTitle'
  | 'tourFillBody'
  | 'tourClosingTitle'
  | 'tourClosingBody';

export interface TourStep {
  target: TourTarget | null;
  titleKey: TourCopyKey;
  bodyKey: TourCopyKey;
  onEnter?: () => (() => void) | void;
}

export const TOUR_STEPS: TourStep[] = [
  { target: null, titleKey: 'tourWelcomeTitle', bodyKey: 'tourWelcomeBody' },
  { target: 'route-summary', titleKey: 'tourRouteTitle', bodyKey: 'tourRouteBody' },
  {
    target: 'chart',
    titleKey: 'tourChartTitle',
    bodyKey: 'tourChartBody',
    onEnter: () => {
      // Deliberate delay: the point of this step is to show the chart
      // empty first, then watch the supply line rise once demo data
      // lands. loadTourDemoData() is idempotent, so revisiting this
      // step via Back/Next can't add a second demo fill.
      const timer = setTimeout(() => useAppStore.getState().loadTourDemoData(), 900);
      return () => clearTimeout(timer);
    },
  },
  {
    target: 'demo-fill',
    titleKey: 'tourFillTitle',
    bodyKey: 'tourFillBody',
    // Safety net for a user who clicks Next before the previous step's
    // 900ms delay fires — guarantees the demo fill exists by now.
    onEnter: () => {
      useAppStore.getState().loadTourDemoData();
    },
  },
  { target: null, titleKey: 'tourClosingTitle', bodyKey: 'tourClosingBody' },
];
```

- [ ] **Step 2: Add `data-tour="route-summary"` in `App.tsx`**

In `src/App.tsx`, change:

```tsx
        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <RoutePanel />
          <SummaryCards />
        </div>
```

to:

```tsx
        <div data-tour="route-summary" style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <RoutePanel />
          <SummaryCards />
        </div>
```

- [ ] **Step 3: Add `data-tour="chart"` in `ChartCard.tsx`**

In `src/components/chart/ChartCard.tsx`, change:

```tsx
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Chart height={CHART_HEIGHT} showAxis />
          <ShopMarkers distanceKm={dist(route)} height={CHART_HEIGHT} bottomPadding={CHART_PB} route={route} xUnit={xUnit} />
        </div>
```

to:

```tsx
        <div data-tour="chart" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Chart height={CHART_HEIGHT} showAxis />
          <ShopMarkers distanceKm={dist(route)} height={CHART_HEIGHT} bottomPadding={CHART_PB} route={route} xUnit={xUnit} />
        </div>
```

- [ ] **Step 4: Add the dynamic `data-tour="demo-fill"` in `FillBar.tsx`**

In `src/components/lanes/FillBar.tsx`, add a store selector next to the existing ones (after `const gear = useAppStore((s) => s.gear);`):

```tsx
  const tourDemoFid = useAppStore((s) => s.ui.tourDemoFid);
```

Then add the attribute to the outer draggable div. Change:

```tsx
      <div
        onPointerDown={createFillDragHandler(fill.fid, 'move')}
        onPointerEnter={() => setHoverKey(key)}
        onPointerLeave={() => setHoverKey(null)}
        style={{
```

to:

```tsx
      <div
        data-tour={fill.fid === tourDemoFid ? 'demo-fill' : undefined}
        onPointerDown={createFillDragHandler(fill.fid, 'move')}
        onPointerEnter={() => setHoverKey(key)}
        onPointerLeave={() => setHoverKey(null)}
        style={{
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/tour/tourSteps.ts src/App.tsx src/components/chart/ChartCard.tsx src/components/lanes/FillBar.tsx
git commit -m "$(cat <<'EOF'
Add tour step data and data-tour spotlight targets

Declares the 5-step tour content and tags the three live elements
the tour points at: the route+result row, the chart area, and
(dynamically, by fid) the demo bottle fill created for step 3.
EOF
)"
```

---

### Task 4: `TourOverlay` engine and wiring into `App`

**Files:**
- Create: `src/components/tour/tourStyles.ts`
- Create: `src/components/tour/TourOverlay.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `TOUR_STEPS`, `TourStep` (Task 3); `useAppStore` fields `ui.tourStep`, `ui.lang`, actions `setTourStep`, `closeTour` (Task 1); `StringTable` keys from Task 2.
- Produces: `tourGhostBtn`, `tourPrimaryBtn: CSSProperties` from `tourStyles.ts`, reused by Task 5. `<TourOverlay />` component, mounted once at the root of `App`.

- [ ] **Step 1: Create the shared button styles**

Create `src/components/tour/tourStyles.ts`:

```ts
import type { CSSProperties } from 'react';

export const tourGhostBtn: CSSProperties = {
  border: '1px solid var(--chip-border)',
  background: '#fff',
  color: 'var(--ink-soft)',
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'Archivo, sans-serif',
  cursor: 'pointer',
};

export const tourPrimaryBtn: CSSProperties = {
  border: '1px solid var(--ink)',
  background: 'var(--ink)',
  color: '#fff',
  borderRadius: 8,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'Archivo, sans-serif',
  cursor: 'pointer',
};
```

- [ ] **Step 2: Create `TourOverlay.tsx`**

Create `src/components/tour/TourOverlay.tsx`:

```tsx
import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { tourGhostBtn, tourPrimaryBtn } from './tourStyles';
import { TOUR_STEPS, type TourStep } from './tourSteps';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 8;
const TOOLTIP_WIDTH = 320;
const MARGIN = 14;
const BACKDROP = 'rgba(18,20,18,0.55)';

export function TourOverlay() {
  const tourStep = useAppStore((s) => s.ui.tourStep);
  const lang = useAppStore((s) => s.ui.lang);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const closeTour = useAppStore((s) => s.closeTour);
  const strings = t(lang);
  const [rect, setRect] = useState<Rect | null>(null);

  const step: TourStep | null = tourStep !== null ? TOUR_STEPS[tourStep] : null;

  useLayoutEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const target = step.target;
    document.querySelector(`[data-tour="${target}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let raf = 0;
    const tick = () => {
      const next = measure(target);
      setRect((prev) =>
        prev && next && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height
          ? prev
          : next,
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step]);

  useEffect(() => {
    if (!step?.onEnter) return;
    const cleanup = step.onEnter();
    return () => cleanup?.();
  }, [step]);

  useEffect(() => {
    if (tourStep === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourStep, closeTour]);

  if (tourStep === null || !step) return null;

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const cutout = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {cutout ? (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, cutout.top), background: BACKDROP }} />
          <div style={{ position: 'fixed', top: cutout.top + cutout.height, left: 0, right: 0, bottom: 0, background: BACKDROP }} />
          <div style={{ position: 'fixed', top: cutout.top, left: 0, width: Math.max(0, cutout.left), height: cutout.height, background: BACKDROP }} />
          <div style={{ position: 'fixed', top: cutout.top, left: cutout.left + cutout.width, right: 0, height: cutout.height, background: BACKDROP }} />
          <div
            style={{
              position: 'fixed',
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
              borderRadius: 10,
              border: '2px solid var(--ink)',
              boxShadow: '0 0 0 4px rgba(90,163,63,0.25)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: BACKDROP }} />
      )}

      <TourTooltip cutout={cutout}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {strings.tourStepLabel} {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <button onClick={closeTour} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', padding: 0 }}>
            ✕
          </button>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{strings[step.titleKey]}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{strings[step.bodyKey]}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
          <button onClick={closeTour} style={tourGhostBtn}>
            {strings.tourSkip}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={() => setTourStep(tourStep - 1)} style={tourGhostBtn}>
                {strings.tourBack}
              </button>
            )}
            <button onClick={() => (isLast ? closeTour() : setTourStep(tourStep + 1))} style={tourPrimaryBtn}>
              {isLast ? strings.tourFinish : strings.tourNext}
            </button>
          </div>
        </div>
      </TourTooltip>
    </div>
  );
}

interface TourTooltipProps {
  cutout: Rect | null;
  children: ReactNode;
}

function TourTooltip({ cutout, children }: TourTooltipProps) {
  const pos: CSSProperties = cutout
    ? (() => {
        const spaceBelow = window.innerHeight - (cutout.top + cutout.height);
        const placeBelow = spaceBelow > 180 || spaceBelow > cutout.top;
        const left = Math.min(Math.max(MARGIN, cutout.left), window.innerWidth - TOOLTIP_WIDTH - MARGIN);
        return placeBelow
          ? { position: 'fixed', top: cutout.top + cutout.height + 14, left }
          : { position: 'fixed', bottom: window.innerHeight - cutout.top + 14, left };
      })()
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div
      style={{
        ...pos,
        width: TOOLTIP_WIDTH,
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Wire `TourOverlay` and auto-start into `App.tsx`**

In `src/App.tsx`, change the imports and component body:

```tsx
import { useEffect } from 'react';
import { ChartCard } from './components/chart/ChartCard';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MixPanel } from './components/panels/MixPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { RecipesSection } from './components/recipes/RecipesSection';
import { RoutePanel } from './components/RoutePanel';
import { SummaryCards } from './components/SummaryCards';
import { TourOverlay } from './components/tour/TourOverlay';
import { useAppStore } from './store/appStore';

function App() {
  const panel = useAppStore((s) => s.ui.panel);
  const tourSeen = useAppStore((s) => s.ui.tourSeen);
  const startTour = useAppStore((s) => s.startTour);

  useEffect(() => {
    if (tourSeen) return;
    const id = setTimeout(startTour, 400);
    return () => clearTimeout(id);
  }, [tourSeen, startTour]);

  return (
    <div style={{ minHeight: '100vh', padding: '14px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <Header />
      {panel === 'settings' && <SettingsPanel />}
      {panel === 'mix' && <MixPanel />}
      <div style={{ width: '100%', maxWidth: 1420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div data-tour="route-summary" style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <RoutePanel />
          <SummaryCards />
        </div>
        <ChartCard />
        <RecipesSection />
      </div>
      <Footer />
      <TourOverlay />
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS, all existing + new tests green (this task adds no new pure-logic tests — `TourOverlay` is DOM-measurement-driven and covered by manual browser verification in Task 6).

- [ ] **Step 6: Commit**

```bash
git add src/components/tour/tourStyles.ts src/components/tour/TourOverlay.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Add TourOverlay spotlight engine and mount it in App

Renders a dimmed backdrop with a cutout around the current step's
data-tour target plus a positioned tooltip (Back/Next/Skip, Escape
to close), and auto-starts the tour 400ms after first mount when
ui.tourSeen is false.
EOF
)"
```

---

### Task 5: Footer replay button and destructive-replay confirmation

**Files:**
- Create: `src/components/tour/TourReplayConfirm.tsx`
- Modify: `src/components/Footer.tsx`

**Interfaces:**
- Consumes: `hasPlanData`, `startTour` (Task 1); `tourGhostBtn`, `tourPrimaryBtn` (Task 4); `StringTable` keys `tourReplayButton`, `tourConfirmTitle`, `tourConfirmBody`, `tourConfirmCancel`, `tourConfirmStart` (Task 2).
- Produces: `<TourReplayConfirm strings onCancel onConfirm />` component, used only by `Footer.tsx`.

- [ ] **Step 1: Create the confirmation dialog**

Create `src/components/tour/TourReplayConfirm.tsx`:

```tsx
import type { StringTable } from '../../i18n/strings';
import { tourGhostBtn, tourPrimaryBtn } from './tourStyles';

interface TourReplayConfirmProps {
  strings: StringTable;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TourReplayConfirm({ strings, onCancel, onConfirm }: TourReplayConfirmProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(18,20,18,0.55)' }} />
      <div
        style={{
          position: 'relative',
          width: 340,
          maxWidth: 'calc(100vw - 28px)',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700 }}>{strings.tourConfirmTitle}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{strings.tourConfirmBody}</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={tourGhostBtn}>
            {strings.tourConfirmCancel}
          </button>
          <button onClick={onConfirm} style={tourPrimaryBtn}>
            {strings.tourConfirmStart}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the replay button and dialog to `Footer.tsx`**

Replace the full contents of `src/components/Footer.tsx` with:

```tsx
import { useState, type CSSProperties } from 'react';
import { absCap } from '../domain/fuel';
import { t } from '../i18n/strings';
import { hasPlanData, useAppStore } from '../store/appStore';
import { TourReplayConfirm } from './tour/TourReplayConfirm';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const replayButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid var(--chip-border)',
  background: '#fff',
  borderRadius: 999,
  padding: '7px 13px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink)',
  cursor: 'pointer',
  fontFamily: 'Archivo, sans-serif',
};

export function Footer() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const startTour = useAppStore((s) => s.startTour);
  const strings = t(lang);
  const cap = absCap(mix);
  const absorptionNote = strings.capNote + cap + ' g/h' + strings.capNote2;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReplay = () => {
    if (hasPlanData(useAppStore.getState())) {
      setConfirmOpen(true);
    } else {
      startTour();
    }
  };

  return (
    <footer style={{ width: '100%', maxWidth: 1420, boxSizing: 'border-box', marginTop: 14, borderTop: '1px solid #DFE2DB', padding: '22px 18px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 64, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>CARB PLANNER</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>{strings.ftVersion}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--muted-2)' }}>{strings.ftAboutBody}</p>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: 'var(--muted-3)' }}>
            {absorptionNote} {strings.ftSources2}
          </p>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted-3)' }}>{strings.ftPrivacy}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{strings.ftLinks}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <a
                href="https://github.com/dzieciol-kamil/carb-planner/issues/new"
                target="_blank"
                rel="noopener"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--chip-border)', background: '#fff', borderRadius: 999, padding: '7px 13px', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--carb)', flex: '0 0 8px' }} />
                <span>{strings.ftIssues}</span>
              </a>
              <a
                href="https://github.com/dzieciol-kamil/carb-planner"
                target="_blank"
                rel="noopener"
                title={strings.ftRepo}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, boxSizing: 'border-box', border: '1px solid var(--chip-border)', background: '#fff', borderRadius: 999, color: 'var(--ink-soft)' }}
              >
                <GitHubIcon />
              </a>
              <button onClick={handleReplay} style={replayButtonStyle}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--water)', flex: '0 0 8px' }} />
                <span>{strings.tourReplayButton}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{strings.ftLegal}</span>
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.65, color: 'var(--muted)' }}>{strings.ftLegalBody}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderTop: '1px solid #E6E8E2', paddingTop: 14 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: 'var(--muted-3)' }}>{strings.ftCopyright}</span>
      </div>

      {confirmOpen && (
        <TourReplayConfirm
          strings={strings}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            startTour();
          }}
        />
      )}
    </footer>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/tour/TourReplayConfirm.tsx src/components/Footer.tsx
git commit -m "$(cat <<'EOF'
Add footer button to replay the tour, with a destructive-action warning

Replaying with existing plan data now requires confirming an
explicit warning first, since loadTourDemoData overwrites the route
and is never reverted afterward.
EOF
)"
```

---

### Task 6: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Typecheck the whole project**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the new `src/store/appStore.test.ts` cases from Task 1.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: builds successfully into `dist/` with no errors or warnings about the new files.

- [ ] **Step 4: Note remaining manual checks for the human reviewer**

No commit for this task — it's verification-only. Leave the following for interactive browser verification (per the design spec's testing section, this is not automatable in this project's Node-only Vitest setup):
- First visit (cleared `localStorage`) auto-starts the tour after ~400ms.
- Spotlight correctly tracks each target at both a wide and a narrow (mobile-width) viewport, including scrolling the target into view.
- Step 3 (chart) visibly goes from empty to showing a raised supply line ~900ms after becoming active.
- Step 4 correctly highlights the newly created demo fill and its drag/resize/content-switch affordances all still work normally during the tour.
- Footer's replay button starts the tour directly when the plan is empty, and shows the confirmation dialog (which does not restore prior data afterward) when it isn't.
- Escape key and the ✕ button close the tour from any step without crashing.
