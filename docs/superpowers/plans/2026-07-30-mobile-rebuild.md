# Mobile layout rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the disconnected mobile sketch with a full mobile UI (read-only chart + scrub, tap-to-navigate mini-lanes, stepper-based range editing) matching the supplied high-fidelity design handoff, wired into `App.tsx` behind the existing desktop/mobile view switch.

**Architecture:** Presentation-only layer under `src/components/mobile/`. All numbers come from `src/domain/fuel.ts` and `appStore.ts` — no new math beyond three small pure layout helpers. Desktop tree in `App.tsx` is untouched; `App` picks mobile vs. desktop by `isDesktopView(viewMode, autoView)`.

**Tech Stack:** Vite + React + TypeScript, Zustand store, inline `CSSProperties` styling (no CSS modules/styled-components), vitest for unit tests.

**Reference material (read before each task that touches visuals):**
`/private/tmp/claude-501/-Users-kamil-Projects-carb-planner/19e15654-6f1d-46cf-a56f-129914b90444/scratchpad/mobile-design/design_handoff_mobile/README.md`
— screen-by-screen spec, exact colors/spacing/copy, "Screens / Views" section numbered 0–8 matching the tasks below. The `.dc.html` file in the same directory is a clickable prototype for visual comparison only (its math is simplified/wrong — never copy logic from it).
Design decisions specific to this repo: `docs/superpowers/specs/2026-07-30-mobile-rebuild-design.md`.

## Global Constraints

- Never change `src/domain/fuel.ts` or any calculation. All displayed numbers come from `samples`, `planSummary`, `rateStats`, `absCap`, `sweat`, `cph`, `prof`, `partArray`, `rangeLabel`, `fmtX`, and the store.
- Zero dragging on mobile. Do not import anything from `src/components/lanes/dragHandlers.ts` or `src/components/panels/gearDragHandler.ts` into mobile code.
- Every touch target is at least 44×44px.
- Colors only from `src/styles/tokens.css` custom properties, plus the extra literal hex values the README's "Design Tokens" section lists explicitly — never invent new colors, never duplicate a token's value as a fresh hex literal.
- All user-facing text goes through `t(lang)` from `src/i18n/strings.ts`. No `if (lang === 'pl')` branching in components — language list comes from `LANGS`.
- Style inline (`CSSProperties` objects/literals) following the convention already used in `MixPanel.tsx` / `PanelShell.tsx` — no new styling library.
- `npx tsc -b` and `npm test` must both pass with zero errors before the work is considered done.
- Do not add tests to `src/domain/`. Only the extracted pure presentation helpers (Task 2) get unit tests.

---

## File Structure

Modify:
- `src/store/appStore.ts` — extend `UiState`/`MobileTab`, add actions.
- `src/i18n/strings.ts` — add new keys to `StringTable`, `pl`, `en`.
- `src/App.tsx` — mount `MobileApp` vs. desktop tree, wire resize→`autoView`.

Delete:
- `src/components/mobile/MobileApp.tsx`, `MobileChartSection.tsx`, `MobileFillBar.tsx`, `MobileFoodBar.tsx`, `MobileFoodChips.tsx`, `MobileFooter.tsx`, `MobileLanesSection.tsx`, `MobileNotesPanel.tsx`, `MobileRecipesSection.tsx`, `MobileSummarySection.tsx`, `MobileTabBar.tsx`, `MobileTimelineSection.tsx`, `MobileTop.tsx`, `mobileFormat.ts` (all unreferenced by `App.tsx` today — confirmed in design spec).

Create (all under `src/components/mobile/` unless noted):
- `mobileMath.ts` + `mobileMath.test.ts` — pure helpers.
- `MobileStepper.tsx` — `[−−][−][value][+][++]` control, reused everywhere.
- `MobileChart.tsx` — read-only SVG chart + scrub.
- `MobileLaneStrip.tsx` — mini-lanes (map/nav, no drag).
- `MobileChartPanel.tsx` — sticky panel composing mode/eye/xUnit switches, narration, `MobileChart`, axis labels, `MobileLaneStrip`.
- `MobilePlanCard.tsx` — one expandable plan-item card.
- `MobilePlanList.tsx` — coverage cards, plan header+list, add-fill/add-food/landmark controls, "SKŁAD BIDONÓW" row.
- `MobileGear.tsx` — Sprzęt tab.
- `MobileMix.tsx` — Mieszanka tab.
- `MobileFoodLibrary.tsx` — Jedzenie tab.
- `MobileProfile.tsx` — Ja tab.
- `MobileMixSheet.tsx` — full-screen bottle recipe panel.
- `MobileRouteSheet.tsx` — route/conditions bottom sheet.
- `MobileShopSheet.tsx` — landmark bottom sheet.
- `MobileApp.tsx` — top bar, scrollable tab content, bottom tab bar, sheet mounting.

---

### Task 1: Store groundwork — `ui` fields, 5-tab type, new actions

**Files:**
- Modify: `src/store/appStore.ts`
- Test: `src/store/appStore.test.ts`

**Interfaces:**
- Produces: `MobileTab = 'plan' | 'gear' | 'mix' | 'food' | 'me'`; `UiState` gains `scrubX: number | null`, `gpxPeek: boolean`, `mixSheet: boolean`, `routeSheet: boolean`, `shopSheet: { editId: number | null } | null`; `AppState` gains actions `setScrubX(x: number | null)`, `toggleGpxPeek()`, `openMixSheet()`, `closeMixSheet()`, `openRouteSheet()`, `closeRouteSheet()`, `openShopSheet(editId: number | null)`, `closeShopSheet()`; `setTab` now also clears `selKey`.

- [ ] **Step 1: Write failing tests for the new store behavior**

Add to `src/store/appStore.test.ts` (match the file's existing `describe`/`it` + `useAppStore.getState()` reset style — read the top of the file first for its setup pattern, then append):

```ts
describe('mobile ui state', () => {
  it('setTab switches tab and clears selKey', () => {
    useAppStore.getState().setSelKey('f1');
    useAppStore.getState().setTab('mix');
    expect(useAppStore.getState().ui.tab).toBe('mix');
    expect(useAppStore.getState().ui.selKey).toBeNull();
  });

  it('setScrubX stores and clears the scrub position', () => {
    useAppStore.getState().setScrubX(42);
    expect(useAppStore.getState().ui.scrubX).toBe(42);
    useAppStore.getState().setScrubX(null);
    expect(useAppStore.getState().ui.scrubX).toBeNull();
  });

  it('toggleGpxPeek flips the flag', () => {
    const before = useAppStore.getState().ui.gpxPeek;
    useAppStore.getState().toggleGpxPeek();
    expect(useAppStore.getState().ui.gpxPeek).toBe(!before);
  });

  it('mix/route sheets open and close', () => {
    useAppStore.getState().openMixSheet();
    expect(useAppStore.getState().ui.mixSheet).toBe(true);
    useAppStore.getState().closeMixSheet();
    expect(useAppStore.getState().ui.mixSheet).toBe(false);

    useAppStore.getState().openRouteSheet();
    expect(useAppStore.getState().ui.routeSheet).toBe(true);
    useAppStore.getState().closeRouteSheet();
    expect(useAppStore.getState().ui.routeSheet).toBe(false);
  });

  it('shop sheet opens with an edit target and closes to null', () => {
    useAppStore.getState().openShopSheet(7);
    expect(useAppStore.getState().ui.shopSheet).toEqual({ editId: 7 });
    useAppStore.getState().openShopSheet(null);
    expect(useAppStore.getState().ui.shopSheet).toEqual({ editId: null });
    useAppStore.getState().closeShopSheet();
    expect(useAppStore.getState().ui.shopSheet).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests, confirm they fail**

Run: `npm test -- appStore`
Expected: FAIL — `setScrubX`/`toggleGpxPeek`/`openMixSheet`/etc. are not functions, `ui.tab` type doesn't include `'mix'`.

- [ ] **Step 3: Implement in `appStore.ts`**

In the `UiState` interface, change `tab: MobileTab;` (keep as-is, the type below changes) and add the five new fields:

```ts
export type MobileTab = 'plan' | 'gear' | 'mix' | 'food' | 'me';
```//replace the existing `export type MobileTab = 'plan' | 'gear' | 'food' | 'me';`

```ts
interface UiState {
  // ...existing fields unchanged...
  scrubX: number | null;
  gpxPeek: boolean;
  mixSheet: boolean;
  routeSheet: boolean;
  shopSheet: { editId: number | null } | null;
}
```

In `AppState`, add action signatures:

```ts
  setScrubX: (x: number | null) => void;
  toggleGpxPeek: () => void;
  openMixSheet: () => void;
  closeMixSheet: () => void;
  openRouteSheet: () => void;
  closeRouteSheet: () => void;
  openShopSheet: (editId: number | null) => void;
  closeShopSheet: () => void;
```

In the default `ui` object inside `create<AppState>()(persist(...))`, add:

```ts
      scrubX: null,
      gpxPeek: false,
      mixSheet: false,
      routeSheet: false,
      shopSheet: null,
```

Change `setTab` to also clear `selKey`:

```ts
    setTab: (tab) => set((s) => ({ ui: { ...s.ui, tab, selKey: null } })),
```

Add the new action implementations near the other `ui.*` setters (next to `setTab`):

```ts
    setScrubX: (scrubX) => set((s) => ({ ui: { ...s.ui, scrubX } })),
    toggleGpxPeek: () => set((s) => ({ ui: { ...s.ui, gpxPeek: !s.ui.gpxPeek } })),
    openMixSheet: () => set((s) => ({ ui: { ...s.ui, mixSheet: true } })),
    closeMixSheet: () => set((s) => ({ ui: { ...s.ui, mixSheet: false } })),
    openRouteSheet: () => set((s) => ({ ui: { ...s.ui, routeSheet: true } })),
    closeRouteSheet: () => set((s) => ({ ui: { ...s.ui, routeSheet: false } })),
    openShopSheet: (editId) => set((s) => ({ ui: { ...s.ui, shopSheet: { editId } } })),
    closeShopSheet: () => set((s) => ({ ui: { ...s.ui, shopSheet: null } })),
```

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `npm test -- appStore`
Expected: PASS

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc -b`
Expected: no errors (fix any other file that exhaustively switches over the old 4-value `MobileTab` — search with `grep -rn "MobileTab" src`).

```bash
git add src/store/appStore.ts src/store/appStore.test.ts
git commit -m "Add mobile UI store fields: 5-tab type, scrub/gpx-peek/sheet state"
```

---

### Task 2: Pure presentation helpers — `mobileMath.ts`

**Files:**
- Create: `src/components/mobile/mobileMath.ts`
- Test: `src/components/mobile/mobileMath.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no store/domain imports except types).
- Produces:
  - `stepperStep(distanceKm: number): number` → `5` normally, `10` when `distanceKm > 120` (the "−−/++" big-step rule; the small step is always `1` and is not a function, just the literal `1`/`5` used directly).
  - `clampStepValue(value: number, delta: number, min: number, max: number): number`
  - `clampGelPortion(candidateKm: number, k: number, n: number, from: number, to: number, existing: number[]): number` — clamps a middle gel-portion handle so it stays within `[from, to]` and at least `0.5` km from its immediate neighbors in `existing` (the other portions' positions, including the fixed `from`/`to` endpoints for k=0/k=n-1).
  - `foodTouchHitbox(centerPx: number, neighborDistancesPx: number[]): { left: number; width: number }` — 40px hitbox centered on `centerPx`, narrowed to half the smallest neighbor distance when that's less than 40, floored at 18px width.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { clampGelPortion, clampStepValue, foodTouchHitbox, stepperStep } from './mobileMath';

describe('stepperStep', () => {
  it('is 5 for distances up to 120km', () => {
    expect(stepperStep(90)).toBe(5);
    expect(stepperStep(120)).toBe(5);
  });
  it('is 10 above 120km', () => {
    expect(stepperStep(121)).toBe(10);
  });
});

describe('clampStepValue', () => {
  it('applies the delta within bounds', () => {
    expect(clampStepValue(10, 5, 0, 100)).toBe(15);
  });
  it('clamps at the min', () => {
    expect(clampStepValue(2, -5, 0, 100)).toBe(0);
  });
  it('clamps at the max', () => {
    expect(clampStepValue(98, 5, 0, 100)).toBe(100);
  });
});

describe('clampGelPortion', () => {
  // 3 portions over a 0-30km fill: k=0 is fixed at from(0), k=2 fixed at to(30), k=1 is the only draggable one.
  it('keeps a middle portion inside [from, to]', () => {
    expect(clampGelPortion(-5, 1, 3, 0, 30, [0, 15, 30])).toBe(0.5);
    expect(clampGelPortion(35, 1, 3, 0, 30, [0, 15, 30])).toBe(29.5);
  });
  it('keeps at least 0.5km from neighboring portions', () => {
    expect(clampGelPortion(0.2, 1, 3, 0, 30, [0, 15, 30])).toBe(0.5);
    expect(clampGelPortion(29.8, 1, 3, 0, 30, [0, 15, 30])).toBe(29.5);
  });
  it('passes through a valid candidate unchanged', () => {
    expect(clampGelPortion(18, 1, 3, 0, 30, [0, 15, 30])).toBe(18);
  });
});

describe('foodTouchHitbox', () => {
  it('gives a full 40px hitbox when neighbors are far away', () => {
    expect(foodTouchHitbox(100, [50, 50])).toEqual({ left: 80, width: 40 });
  });
  it('narrows to half the nearest neighbor distance', () => {
    expect(foodTouchHitbox(100, [20, 50])).toEqual({ left: 90, width: 20 });
  });
  it('floors the width at 18px', () => {
    expect(foodTouchHitbox(100, [10, 50])).toEqual({ left: 91, width: 18 });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test -- mobileMath`
Expected: FAIL — module `./mobileMath` doesn't exist.

- [ ] **Step 3: Implement `mobileMath.ts`**

```ts
export function stepperStep(distanceKm: number): number {
  return distanceKm > 120 ? 10 : 5;
}

export function clampStepValue(value: number, delta: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value + delta));
}

export function clampGelPortion(candidateKm: number, k: number, n: number, from: number, to: number, existing: number[]): number {
  if (k <= 0 || k >= n - 1) return k <= 0 ? from : to;
  const GAP = 0.5;
  const prev = existing[k - 1];
  const next = existing[k + 1];
  const lo = Math.max(from, prev + GAP);
  const hi = Math.min(to, next - GAP);
  if (lo > hi) return (lo + hi) / 2;
  return Math.max(lo, Math.min(hi, candidateKm));
}

export function foodTouchHitbox(centerPx: number, neighborDistancesPx: number[]): { left: number; width: number } {
  const nearest = neighborDistancesPx.length ? Math.min(...neighborDistancesPx) : Infinity;
  const width = Math.max(18, Math.min(40, nearest));
  return { left: centerPx - width / 2, width };
}
```

- [ ] **Step 4: Run to confirm the tests pass**

Run: `npm test -- mobileMath`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/mobile/mobileMath.ts src/components/mobile/mobileMath.test.ts
git commit -m "Add pure layout helpers for mobile steppers, gel portions, food hitboxes"
```

---

### Task 3: i18n — new string keys

**Files:**
- Modify: `src/i18n/strings.ts`

**Interfaces:**
- Produces: new `StringTable` keys consumed by every later component task. Exact key list (add to the `StringTable` interface, then to both `pl` and `en` in `STR`):

```ts
  tabMix: string;
  editRoutePrefix: string;        // "Edytuj trasę:" — pill button label; the "{km} km · {h}h{mm}" part is composed at render time from `dist(route)`/`fmtHM(totalHours(route))` in MobileApp.tsx (Task 17), not from a string-table value.
  narrationRate: string;
  narrationFluid: string;
  narrationSum: string;
  narrationProfile: string;
  scrubHint: string;
  legendGpx: string;
  bidonSection: string;
  flaskSection: string;
  foodSection2: string;
  gearHintMobile: string;
  mixHintMobile: string;
  absCapNoteMobile: string;       // "Przy tej proporcji limit to {cap} g/h — kropkowana linia na wykresie."
  gelPartsStepper: string;        // "Porcje żelu z jednego napełnienia"
  addBidonBtn: string;            // "Dodaj bidon"
  addFlaskBtn: string;            // "Dodaj flask"
  foodStepwise: string;           // "stopniowo"
  foodAddProduct: string;         // "+ Dodaj produkt"
  meWeight: string;
  meApp: string;
  meLanguage: string;
  meView: string;
  meFooterNote: string;
  mixSheetTitle: string;
  mixSheetSubtitle: string;
  mixSheetEmpty: string;          // "Brak napełnień · —"
  mixRowSugar: string;
  mixRowMalto: string;
  mixRowFructose: string;
  mixRowSalt: string;
  mixRowCitric: string;
  mixRowWater: string;
  routeSheetTitle: string;
  routeSheetPreStart: string;
  routeSheetIntensity: string;
  routeSheetTemp: string;
  routeSheetGpxSection: string;
  routeSheetGpxNote: string;
  routeSheetLoadFile: string;
  routeSheetDone: string;
  shopSheetTitle: string;
  shopSheetKm: string;
  shopSheetName: string;
  shopSheetAdd: string;
  shopDefaultName: string;        // "Sklep"
  bidonComposition: string;       // "SKŁAD BIDONÓW"
  perFillGrams: string;           // "gramatura na napełnienie ›"
  addLandmark: string;
  noGap: string;                  // "{name} · brak wolnego odcinka"
```

- [ ] **Step 1: Add the keys to the `StringTable` interface**

Insert the block above (drop the inline comments, they're guidance for this step only) right after the existing `tourConfirmStart: string;` line in `src/i18n/strings.ts`.

- [ ] **Step 2: Add Polish values to `STR.pl`**

Append inside the `pl: { ... }` object, just before its closing `},`:

```ts
    tabMix: 'Mieszanka',
    editRoutePrefix: 'Edytuj trasę:',
    narrationRate: 'Ile węgli na godzinę realnie wchłaniasz (linia) wobec zapotrzebowania (przerywana). Kropkowana to limit wchłaniania.',
    narrationFluid: 'Ile płynu pijesz na godzinę (linia) wobec tego, ile tracisz z potem (przerywana).',
    narrationSum: 'Węgle zsumowane od startu: co wchłoniesz (linia) wobec zapotrzebowania (przerywana).',
    narrationProfile: 'Profil trasy — wysokość nad poziomem morza. Podjazdy podnoszą zapotrzebowanie.',
    scrubHint: 'przesuń palcem, by odczytać',
    legendGpx: 'cel',
    bidonSection: 'Bidon',
    flaskSection: 'Flask',
    foodSection2: 'Jedzenie',
    gearHintMobile: 'Co masz na rowerze. Objętość i dozwolona zawartość decydują o tym, ile węgli wchodzi w jedno napełnienie.',
    mixHintMobile: 'Skład izo i żelu. Zmiana przelicza gramaturę dla każdego napełnienia i limit wchłaniania.',
    absCapNoteMobile: 'Przy tej proporcji limit to {cap} g/h — kropkowana linia na wykresie.',
    gelPartsStepper: 'Porcje żelu z jednego napełnienia',
    addBidonBtn: 'Dodaj bidon',
    addFlaskBtn: 'Dodaj flask',
    foodStepwise: 'stopniowo',
    foodAddProduct: '+ Dodaj produkt',
    meWeight: 'Waga',
    meApp: 'Aplikacja',
    meLanguage: 'Język',
    meView: 'Widok',
    meFooterNote: 'Plan i ustawienia zapisują się w tej przeglądarce. Bez konta, bez serwera.',
    mixSheetTitle: 'Skład bidonów',
    mixSheetSubtitle: 'Gramy do odmierzenia na każde napełnienie',
    mixSheetEmpty: 'Brak napełnień · —',
    mixRowSugar: 'Cukry',
    mixRowMalto: 'Maltodekstryna',
    mixRowFructose: 'Fruktoza',
    mixRowSalt: 'Sól',
    mixRowCitric: 'Kwasek cytrynowy',
    mixRowWater: 'Woda',
    routeSheetTitle: 'TRASA I WARUNKI',
    routeSheetPreStart: 'PRZED STARTEM',
    routeSheetIntensity: 'Intensywność',
    routeSheetTemp: 'Temperatura',
    routeSheetGpxSection: 'PROFIL GPX',
    routeSheetGpxNote: 'Włączony profil zmienia zapotrzebowanie na podjazdach. Ikona oka nad wykresem pokazuje sam profil.',
    routeSheetLoadFile: 'Wczytaj plik',
    routeSheetDone: 'Gotowe',
    shopSheetTitle: 'PUNKT ORIENTACYJNY',
    shopSheetKm: 'Kilometr',
    shopSheetName: 'Nazwa',
    shopSheetAdd: 'Dodaj',
    shopDefaultName: 'Sklep',
    bidonComposition: 'SKŁAD BIDONÓW',
    perFillGrams: 'gramatura na napełnienie ›',
    addLandmark: 'Dodaj punkt orientacyjny',
    noGap: 'brak wolnego odcinka',
```

- [ ] **Step 3: Add English values to `STR.en`**

Append inside the `en: { ... }` object, just before its closing `},`:

```ts
    tabMix: 'Mix',
    editRoutePrefix: 'Edit route:',
    narrationRate: "How many carbs per hour you're actually absorbing (line) vs. requirement (dashed). Dotted is the absorption limit.",
    narrationFluid: "How much fluid you're drinking per hour (line) vs. how much you lose to sweat (dashed).",
    narrationSum: "Carbs summed from the start: what you'll absorb (line) vs. requirement (dashed).",
    narrationProfile: 'Route profile — elevation above sea level. Climbs raise the requirement.',
    scrubHint: 'drag to read',
    legendGpx: 'target',
    bidonSection: 'Bottle',
    flaskSection: 'Flask',
    foodSection2: 'Food',
    gearHintMobile: "What's on your bike. Volume and allowed contents decide how many carbs fit in one fill.",
    mixHintMobile: 'Isotonic and gel composition. Changing it recalculates grams per fill and the absorption limit.',
    absCapNoteMobile: 'At this ratio the limit is {cap} g/h — the dotted line on the chart.',
    gelPartsStepper: 'Gel portions per fill',
    addBidonBtn: 'Add bottle',
    addFlaskBtn: 'Add flask',
    foodStepwise: 'over time',
    foodAddProduct: '+ Add product',
    meWeight: 'Weight',
    meApp: 'App',
    meLanguage: 'Language',
    meView: 'View',
    meFooterNote: 'Your plan and settings are saved in this browser. No account, no server.',
    mixSheetTitle: 'Bottle recipes',
    mixSheetSubtitle: 'Grams to measure out for each fill',
    mixSheetEmpty: 'No fills · —',
    mixRowSugar: 'Carbs',
    mixRowMalto: 'Maltodextrin',
    mixRowFructose: 'Fructose',
    mixRowSalt: 'Salt',
    mixRowCitric: 'Citric acid',
    mixRowWater: 'Water',
    routeSheetTitle: 'ROUTE & CONDITIONS',
    routeSheetPreStart: 'BEFORE THE START',
    routeSheetIntensity: 'Intensity',
    routeSheetTemp: 'Temperature',
    routeSheetGpxSection: 'GPX PROFILE',
    routeSheetGpxNote: 'An enabled profile changes the requirement on climbs. The eye icon above the chart shows the profile itself.',
    routeSheetLoadFile: 'Load file',
    routeSheetDone: 'Done',
    shopSheetTitle: 'LANDMARK',
    shopSheetKm: 'Kilometer',
    shopSheetName: 'Name',
    shopSheetAdd: 'Add',
    shopDefaultName: 'Shop',
    bidonComposition: 'BOTTLE RECIPES',
    perFillGrams: 'grams per fill ›',
    addLandmark: 'Add landmark',
    noGap: 'no free gap',
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no errors from `strings.ts` (both `pl` and `en` must satisfy `StringTable` — TS will flag any missing key).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "Add i18n strings for the mobile rebuild"
```

---

### Task 4: Delete the old mobile directory

**Files:**
- Delete: every file listed under "Delete" in File Structure above.

- [ ] **Step 1: Confirm nothing outside `src/components/mobile/` imports these files**

Run: `grep -rn "components/mobile" src --include=*.tsx --include=*.ts | grep -v "^src/components/mobile/"`
Expected: no output (already confirmed via `App.tsx` read during design, but re-verify before deleting).

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/mobile/MobileApp.tsx src/components/mobile/MobileChartSection.tsx src/components/mobile/MobileFillBar.tsx src/components/mobile/MobileFoodBar.tsx src/components/mobile/MobileFoodChips.tsx src/components/mobile/MobileFooter.tsx src/components/mobile/MobileLanesSection.tsx src/components/mobile/MobileNotesPanel.tsx src/components/mobile/MobileRecipesSection.tsx src/components/mobile/MobileSummarySection.tsx src/components/mobile/MobileTabBar.tsx src/components/mobile/MobileTimelineSection.tsx src/components/mobile/MobileTop.tsx src/components/mobile/mobileFormat.ts
```

- [ ] **Step 3: Typecheck and test**

Run: `npx tsc -b && npm test`
Expected: PASS (nothing referenced these files, per Step 1).

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove disconnected old mobile sketch (drag-based, unused by App.tsx)"
```

---

### Task 5: `MobileStepper.tsx`

**Files:**
- Create: `src/components/mobile/MobileStepper.tsx`

**Interfaces:**
- Consumes: `clampStepValue` from `./mobileMath`.
- Produces:
```ts
export interface MobileStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  smallStep: number;
  bigStep: number;
  min: number;
  max: number;
  format?: (v: number) => string; // defaults to String(Math.round(v))
}
export function MobileStepper(props: MobileStepperProps): JSX.Element
```
Consumed by every later screen task (`MobilePlanCard`, `MobileGear`, `MobileMix`, `MobileProfile`, `MobileRouteSheet`) for every `[−−][−][value][+][++]` control. `smallStep`/`bigStep` are passed by the caller (caller uses `stepperStep(distanceKm)` for range steppers per README §"Stepper zakresu"; other steppers pass literal step values from README, e.g. volume `10`/`50`).

- [ ] **Step 1: Implement the component**

Read README.md section "4. Stepper zakresu" for the exact visual spec (44×44px buttons, radius 11px, `--chip-border` outline, `−−`/`++` on `#F4F5F2`, `−`/`+` on white, mono 15px/700 value). Implement:

```tsx
import type { CSSProperties } from 'react';
import { clampStepValue } from './mobileMath';

export interface MobileStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  smallStep: number;
  bigStep: number;
  min: number;
  max: number;
  format?: (v: number) => string;
}

const btnBase: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 11,
  border: '1px solid var(--chip-border)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--ink)',
  flex: '0 0 auto',
};
const bigBtnStyle: CSSProperties = { ...btnBase, background: '#F4F5F2', fontSize: 12 };
const smallBtnStyle: CSSProperties = { ...btnBase, background: '#fff' };
const valueStyle: CSSProperties = {
  minWidth: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 700,
};

export function MobileStepper({ label, value, onChange, smallStep, bigStep, min, max, format }: MobileStepperProps) {
  const fmt = format ?? ((v: number) => String(Math.round(v)));
  const bump = (delta: number) => onChange(clampStepValue(value, delta, min, max));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {label && <span style={{ fontSize: 12, color: 'var(--muted-2)', flex: '1 1 auto' }}>{label}</span>}
      <button type="button" style={bigBtnStyle} onClick={() => bump(-bigStep)} aria-label="-- ">−−</button>
      <button type="button" style={smallBtnStyle} onClick={() => bump(-smallStep)} aria-label="-">−</button>
      <span style={valueStyle}>{fmt(value)}</span>
      <button type="button" style={smallBtnStyle} onClick={() => bump(smallStep)} aria-label="+">+</button>
      <button type="button" style={bigBtnStyle} onClick={() => bump(bigStep)} aria-label="++">++</button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS (component isn't imported anywhere yet, but must compile standalone).

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileStepper.tsx
git commit -m "Add MobileStepper control"
```

---

### Task 6: `MobileChart.tsx` — read-only chart with scrub

**Files:**
- Create: `src/components/mobile/MobileChart.tsx`

**Interfaces:**
- Consumes: `samples`, `prof`, `fmtX` from `../../domain/fuel`; `useAppStore` (`ui.yMode`, `ui.xUnit`, `ui.gpxPeek`, `ui.scrubX`, `setScrubX`); `sourceColor` from `../chart/theme.ts` (existing desktop helper — read it to reuse the same color mapping instead of re-deriving one).
- Produces: `export function MobileChart(): JSX.Element` — no props; reads everything from the store directly (matches the pattern in existing desktop `Chart.tsx` — read that file first for the SVG structure/viewBox convention to stay consistent, since README says "wykres tylko do odczytu, serie z domeny").

- [ ] **Step 1: Read the existing desktop chart for conventions**

Read `src/components/chart/Chart.tsx` and `src/components/chart/theme.ts` in full before writing this task — reuse `sourceColor(content)`, the SVG `viewBox`/`preserveAspectRatio="none"` pattern, and the layered-paths approach (grid → area → cap-limit dotted line → need dashed line → solid curve → baseline) described in README §"3. Wykres".

- [ ] **Step 2: Implement `MobileChart.tsx`**

Build the SVG exactly per README §"3. Wykres" (168px height, layers bottom-to-top: fill bands at `opacity:0.07`, horizontal grid `#EDEFEA`, area under curve `opacity:0.18`, dotted cap line `stroke-dasharray:3 5` colored `--carb`/`--water`, dashed need line `#A8AEA9` width 2 `dasharray:6 5`, solid curve split by active source color width 2.8, baseline `#DDE0DA`) and §"4. Scrub" (pointerdown on the container, pointermove/pointerup on `window`, vertical 2px `--ink` line, badge with distance/time line + value line + "cel …" line, badge flips left of the line past 62% width, idle hint "przesuń palcem, by odczytać" bottom-right in the caller's language via `t(lang).scrubHint`).

Compute series from `samples(state)` when `ui.gpxPeek` is off, or from `prof(route).pts` mapped to elevation when `ui.gpxPeek` is on (README: "zapotrzebowanie liczy się z profilu niezależnie od tego, czy profil jest widoczny" — i.e. peek only swaps what's *drawn*, not what feeds `need`). Use `ui.yMode` (`'rate'|'fluid'|'sum'`) to pick which sample fields feed the two curves (`rate`/`needRate`, `fluidRate`/`sweatRate`, `absorbed`/`need` respectively — same fields the desktop `Chart.tsx` already uses per mode, confirm by reading it).

Scrub handler shape (attach to the SVG's wrapping `div`):

```tsx
const containerRef = useRef<HTMLDivElement>(null);

function handlePointerDown(e: React.PointerEvent) {
  updateFromClientX(e.clientX);
  const move = (ev: PointerEvent) => updateFromClientX(ev.clientX);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    setScrubX(null);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function updateFromClientX(clientX: number) {
  const el = containerRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  setScrubX(frac * distanceKm);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/mobile/MobileChart.tsx
git commit -m "Add read-only mobile chart with pointer scrub"
```

---

### Task 7: `MobileLaneStrip.tsx` — tap-to-navigate mini-lanes

**Files:**
- Create: `src/components/mobile/MobileLaneStrip.tsx`

**Interfaces:**
- Consumes: `useAppStore` (`fills`, `foods`, `gear`, `route`, `ui.selKey`, `setSelKey`, `setTab`); `partArray` from `../../domain/fuel`; `foodTouchHitbox` from `./mobileMath`; `sourceColor` from `../chart/theme`.
- Produces: `export function MobileLaneStrip(): JSX.Element` — one row per vessel (from `gear`, filtered to vessels that have at least one fill, per README's "po jednym rzędzie na naczynie") plus one "Jedzenie" row. Tap on any lane segment or food marker calls `setSelKey(key)` (key format `'f'+fid` / `'x'+id`, per README's state table) — no drag handlers imported.

- [ ] **Step 1: Implement**

Follow README §"7. Mini-tory" exactly: row label 46px/10px/600 + track `height:26px, radius:7px, background:#F4F5F2` (`#FAF3EF` for the food row). Fill bars: percent-positioned button, inner rect `radius:5px` colored by content, `opacity:0.82` (`1` when `selKey` matches), selected outline `2px solid var(--ink)`, mono 9px white caption (`izo`/`woda`/`{n}×` for gel using `partArray(fill, gear).length`). Gel fills get white 2px tick marks at each `partArray` position. Food markers: 9px visible dot, actual clickable hit area computed via `foodTouchHitbox` using pixel distances to neighboring food items in the same row (compute neighbor pixel gaps from `from`/route distance same way `MobileChart`'s scrub does the km→fraction conversion). Tapping any element: `setSelKey(key)`; re-tapping the same key does not toggle here (README: tap = select + expand; the *collapse* toggle lives in `MobilePlanCard`, not here) — but switching tabs elsewhere already clears `selKey` per Task 1.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileLaneStrip.tsx
git commit -m "Add tap-to-navigate mini-lane strip"
```

---

### Task 8: `MobileChartPanel.tsx` — sticky chart panel

**Files:**
- Create: `src/components/mobile/MobileChartPanel.tsx`

**Interfaces:**
- Consumes: `MobileChart`, `MobileLaneStrip`; `useAppStore` (`ui.yMode`, `setYMode`, `ui.xUnit`, `setXUnit`, `ui.gpxPeek`, `toggleGpxPeek`, `route.gpxTrack`, `route.useGpx`, `ui.lang`); `t` from `../../i18n/strings`; `fmtX` from `../../domain/fuel`.
- Produces: `export function MobileChartPanel(): JSX.Element` — mounted at the top of the Plan tab's scroll area with `position:sticky; top:0`.

- [ ] **Step 1: Implement**

Follow README §"Panel wykresu" (1–6): mode segment (`g/h`/`ml/h`/`suma` mapping to `yMode` `'rate'|'fluid'|'sum'`), eye toggle (visible only when `route.gpxTrack && route.useGpx`, calls `toggleGpxPeek`), km/godz toggle (`xUnit`), one narration line keyed off `yMode`/`gpxPeek` using the new `narrationRate`/`narrationFluid`/`narrationSum`/`narrationProfile` i18n keys, `<MobileChart/>`, four axis labels (0/⅓/⅔/end, formatted via `fmtX`), then `<MobileLaneStrip/>`. Exact spacing/colors per README §"Panel wykresu" — `position:sticky; top:0; z-index:5`, white background, `border-bottom`, `padding:11px 14px 9px`, column flex `gap:8px`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileChartPanel.tsx
git commit -m "Add sticky mobile chart panel (mode/eye/axis switches + narration)"
```

---

### Task 9: `MobilePlanCard.tsx` — expandable plan-item card

**Files:**
- Create: `src/components/mobile/MobilePlanCard.tsx`

**Interfaces:**
- Consumes: `MobileStepper`; `stepperStep`, `clampGelPortion` from `./mobileMath`; `useAppStore` (`ui.selKey`, `setSelKey`, `updateFill`, `removeFill`, `setFillContent`, `updateFood`, `removeFood`, `setFoodContinuous`, `gear`, `route`); `partArray`, `partsOf`, `rangeLabel`, `carbsFill` from `../../domain/fuel`; `sourceColor` from `../chart/theme`.
- Produces:
```ts
export type PlanCardItem =
  | { kind: 'fill'; fid: number }
  | { kind: 'food'; id: number };
export function MobilePlanCard(props: { item: PlanCardItem }): JSX.Element
```
Consumed by `MobilePlanList` (Task 10), one instance per fill/food, sorted by `from` there.

- [ ] **Step 1: Implement**

Follow README §"3. Karty elementów" and §"4. Stepper zakresu". Collapsed row: content-colored 9px dot, title (13px/600, e.g. "Bidon · Izo" built from vessel name + content label, or the food's `name`), mono 10px subtitle (fill: `"{vol} ml · {carbs} g"`; food: `"{ml} ml · {n} porcje · {carbs} g"` when it has both ml and is continuous, per README's example strings — read the exact subtitle composition rules in README §3 again if a field is absent, e.g. no `ml`), mono 12px/600 range on the right via `rangeLabel`. Tapping the row toggles `selKey` (`setSelKey(key === current ? null : key)`).

Expanded body: content/mode chips (`vessel.allowed` for fills — click calls `setFillContent`; Strzał/Ciągłe for food — click calls `setFoodContinuous`), then steppers:
- Fill, no gel-parts (`partsOf(fill, gear) <= 1`): two stepper rows `od`/`do`, `smallStep=1`, `bigStep=stepperStep(distanceKm)`, enforcing `to - from >= 1` (clamp in the `onChange` callback here, not inside `MobileStepper`, since the constraint is cross-field).
- Fill with n gel parts: `partArray(fill, gear)` rows — first/last are `od (porcja 1)`/`do (porcja n)` and move `from`/`to` (which also rescales existing `pos` entries — reuse `rescalePositions`-style clamping already used desktop-side isn't imported here per the "no drag handler imports" rule, but `rescalePositions` itself lives in `domain/dragMath.ts`, is pure, and is *not* a drag handler — importing that one pure function is fine); middle rows write `fill.pos[k]` via `clampGelPortion`.
- Food: one `na` row (point) or `na`+`do` rows (continuous).

Footer: description line (mono 11px, e.g. `"{rate} g/h w tym odcinku"` for fills or `"zjedzone jednorazowo"` for point food — compute the rate as `carbsFill(fill, gear, mix) / (to - from)`) + "Usuń" button calling `removeFill`/`removeFood`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobilePlanCard.tsx
git commit -m "Add expandable mobile plan-item card with stepper-based editing"
```

---

### Task 10: `MobilePlanList.tsx` — coverage cards + plan list + add controls

**Files:**
- Create: `src/components/mobile/MobilePlanList.tsx`

**Interfaces:**
- Consumes: `MobilePlanCard`; `useAppStore` (`fills`, `foods`, `gear`, `foodLib`, `shops`, `addFillInGap`, `addFoodFromLibrary`, `removeShop`, `openShopSheet`, `openMixSheet`); `planSummary`, `gaps` (from `../../domain/dragMath` — pure, not a drag handler), `dist` from `../../domain/fuel`/`dragMath`.
- Produces: `export function MobilePlanList(): JSX.Element` — mounted below `MobileChartPanel` inside the Plan tab.

- [ ] **Step 1: Implement**

Two coverage cards (README §"Lista planu" item 1): węglowodany (norm 90–115%) and nawodnienie (norm ≥70%) from `planSummary(state)`, colors `#E7F2E1`/`#3D7A26` in-norm vs `#FBEAE1`/`#A3512A` out-of-norm.

"PLAN" header + item count, then `fills`+`foods` merged and sorted by `from`, each rendered as a `<MobilePlanCard item={...} />`.

Per-vessel "Dodaj napełnienie — {vessel.name}" buttons: disabled (dashed border, `not-allowed` cursor, `noGap` text) when `gaps(fills.filter(f => f.gid === vessel.gid), distanceKm)` has no span ≥ 6km; otherwise call `addFillInGap(vessel.gid)`.

Food-library pills calling `addFoodFromLibrary(entry.key)` per README §"6. Dodaj jedzenie".

Landmark pills (name + km + ✕ calling `removeShop(id)`) + "Dodaj punkt orientacyjny" dashed button calling `openShopSheet(null)`.

"SKŁAD BIDONÓW" row (background `#F9FAF7`, `bidonComposition` + `perFillGrams` labels) calling `openMixSheet()`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobilePlanList.tsx
git commit -m "Add mobile plan list: coverage cards, item cards, add controls"
```

---

### Task 11: `MobileGear.tsx` — Sprzęt tab

**Files:**
- Create: `src/components/mobile/MobileGear.tsx`

**Interfaces:**
- Consumes: `MobileStepper`; `useAppStore` (`gear`, `fills`, `updateVessel`, `removeVessel`, `addVessel`, `toggleVesselAllowed`, `setVesselGelParts`); `sourceColor` from `../chart/theme`.
- Produces: `export function MobileGear(): JSX.Element`.

- [ ] **Step 1: Implement**

Per README §"2 — Sprzęt": header + hint (`gearHintMobile`), one card per vessel (name + "{n}× w planie" from `fills.filter(f => f.gid === vessel.gid).length`), volume `MobileStepper` (step 10, big step 50, range 100–2000), three allowed-content chips (disable removing the last one — reuse the existing `toggleVesselAllowed` guard already in the store), gel-parts stepper (1–12) shown only when gel is allowed, "Usuń" (calls `removeVessel`, which already cascades to fills in the store). Bottom row: "Dodaj bidon" (750ml, water+izo) / "Dodaj flask" (250ml, izo+gel) — since `addVessel()` always creates a generic 500ml water+izo vessel, call `addVessel()` then immediately `updateVessel(newGid, {...})` with the right preset; get `newGid` by reading `useAppStore.getState().nextGid` *before* calling `addVessel()` (it becomes `'g' + previousNextGid`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileGear.tsx
git commit -m "Add mobile Sprzet (gear) tab"
```

---

### Task 12: `MobileMix.tsx` — Mieszanka tab

**Files:**
- Create: `src/components/mobile/MobileMix.tsx`

**Interfaces:**
- Consumes: `MobileStepper`; `useAppStore` (`mix`, `setRatio`, `setConc`, `setSalt`, `setCitric`, `setGelConc`, `setGelSalt`, `setGelCitric`, `openMixSheet`); `absCap` from `../../domain/fuel`.
- Produces: `export function MobileMix(): JSX.Element`.

- [ ] **Step 1: Implement**

Per README §"3 — Mieszanka": ratio preset chips (2 / 1.5 / 1 / 0.8, same `RATIO_PRESETS` values as desktop `MixPanel.tsx` — reuse that literal array) with `absCapNoteMobile` showing `absCap(mix)`; "Mieszanka izo" steppers (carbs g/100ml step 1 range 2–20, salt g/l step 0.2 range 0–4, citric g/l step 0.2 range 0–6); "Mieszanka żel" steppers (carbs step 5 range 20–90, salt 0–6, citric 0–8); bottom button "Pokaż skład bidonów" calling `openMixSheet()`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileMix.tsx
git commit -m "Add mobile Mieszanka (mix) tab"
```

---

### Task 13: `MobileFoodLibrary.tsx` — Jedzenie tab

**Files:**
- Create: `src/components/mobile/MobileFoodLibrary.tsx`

**Interfaces:**
- Consumes: `useAppStore` (`foodLib`, `updateFoodLibEntry`, `removeFoodLibEntry`, `addFoodLibEntry`, `ui.lang`); `t` from `../../i18n/strings`.
- Produces: `export function MobileFoodLibrary(): JSX.Element`.

- [ ] **Step 1: Implement**

Per README §"4 — Jedzenie": one row per `foodLib` entry — full-width name text input, then a flex row with "Cukry (g)" and "Płyn (ml)" number inputs (label above field, unit inside the field's right padding per README, `input[type=number]` spinners already disabled globally via `tokens.css`), a "stopniowo" toggle (calls `updateFoodLibEntry(key, { cont: !entry.cont })`), and a ✕ (`removeFoodLibEntry`). "+ Dodaj produkt" calls `addFoodLibEntry()` which already appends an empty-ish entry in the store.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileFoodLibrary.tsx
git commit -m "Add mobile Jedzenie (food library) tab"
```

---

### Task 14: `MobileProfile.tsx` — Ja tab

**Files:**
- Create: `src/components/mobile/MobileProfile.tsx`

**Interfaces:**
- Consumes: `MobileStepper`; `useAppStore` (`route.weight`, `setWeight`, `ui.lang`, `setLang`, `ui.viewMode`, `setViewMode`); `LANGS`, `t` from `../../i18n/strings`.
- Produces: `export function MobileProfile(): JSX.Element`.

- [ ] **Step 1: Implement**

Per README §"5 — Ja": weight stepper (step 1, range 40–130); language chips generated from `LANGS` (switch to a `<select>` if `LANGS.length >= 6`, per README — with only 2 today this renders as chips); view chips "Telefon"/"Komputer" calling `setViewMode('mobile')`/`setViewMode('desktop')`; footer note (`meFooterNote`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileProfile.tsx
git commit -m "Add mobile Ja (profile/settings) tab"
```

---

### Task 15: `MobileMixSheet.tsx` — full-screen bottle recipe panel

**Files:**
- Create: `src/components/mobile/MobileMixSheet.tsx`

**Interfaces:**
- Consumes: `useAppStore` (`ui.mixSheet`, `closeMixSheet`, `fills`, `gear`, `mix`); `volOf` from `../../domain/fuel`.
- Produces: `export function MobileMixSheet(): JSX.Element | null` — returns `null` when `ui.mixSheet` is false; mounted unconditionally inside `MobileApp` (Task 16).

- [ ] **Step 1: Implement**

Per README §"6 — Skład bidonów": `position:absolute; inset:0; z-index:26`, white background covering the tab bar. Header with title/subtitle + ✕ (38×38) calling `closeMixSheet()`. One group per fill (sorted by `from`, or grouped by vessel — README says "per naczynie" with a "napełnienie N" subtitle, so group by `gid` then number each vessel's fills in order): title `"{vessel.name} · napełnienie {n}"`, meta `"{vol} ml · {parts}×"`, then label/value rows for Cukry/Maltodekstryna/Fruktoza/Sól/Kwasek/Woda computed from `volOf(fill, gear)` and `mix` (malto/fructose split by `mix.ratio`, salt/citric from `mix.salt`/`mix.citric` for izo fills or `mix.gelSalt`/`mix.gelCitric` for gel fills — water fills show only the Woda row). Empty state: `mixSheetEmpty` when `fills.length === 0`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileMixSheet.tsx
git commit -m "Add full-screen bottle recipe sheet"
```

---

### Task 16: `MobileRouteSheet.tsx` and `MobileShopSheet.tsx` — bottom sheets

**Files:**
- Create: `src/components/mobile/MobileRouteSheet.tsx`
- Create: `src/components/mobile/MobileShopSheet.tsx`

**Interfaces:**
- `MobileRouteSheet` consumes: `MobileStepper`; `useAppStore` (`ui.routeSheet`, `closeRouteSheet`, `route`, `setDistance`, `setSpeed`, `setPreMealCarbs`, `setPreMealMinutes`, `setIntensity`, `setTemp`, `toggleGpx`, `loadGpxFromFile`, `reconcilePlan`). Produces `export function MobileRouteSheet(): JSX.Element | null`.
- `MobileShopSheet` consumes: `useAppStore` (`ui.shopSheet`, `closeShopSheet`, `shops`, `updateShop`, `addShop`, `route`); `dist` from `../../domain/fuel`. Produces `export function MobileShopSheet(): JSX.Element | null`.

- [ ] **Step 1: Implement the shared sheet shell inline in both files**

Both use the same shape from README's sheet sections (§7/§8): `border-radius:22px 22px 0 0`, `padding:8px 18px 24px`, `box-shadow:0 -12px 40px rgba(0,0,0,0.18)`, backdrop `rgba(22,25,28,0.34)` (click closes), 38×4px drag-handle bar centered, header row (title + ✕ 34×34), 220ms `translateY(101%) → 0` `cubic-bezier(0.22,0.9,0.3,1)` transition. Don't factor this into a shared component in this task (would be scope creep beyond the plan) — if writing the second sheet reveals the shell is truly identical, extracting it afterward is a fine follow-up but not required here.

- [ ] **Step 2: Implement `MobileRouteSheet.tsx`**

Per README §7, but with one deviation from the README's own visual spec, **per explicit user request**: the README shows this sheet's steppers as plain `[−][value][+]` (2-button), but the user asked for the same `[−−][−][value][+][++]` 5-button `MobileStepper` used everywhere else (gear volume, plan-card ranges) for visual consistency across the app. Use `MobileStepper` for all four fields here:
- Dystans (km): `smallStep=5`, `bigStep=25`.
- Średnia prędkość (km/h): `smallStep=1`, `bigStep=5`.
- "PRZED STARTEM" section — Węgle przed startem (g): `smallStep=10`, `bigStep=50`, range 0–200. Czas przed startem (min): `smallStep=15`, `bigStep=60`, range 0–240.

Then: intensity chips (Niska/Średnia/Wysoka → `setIntensity('low'|'mid'|'high')`), temperature label + `input[type=range]` 0–40 (reuse the global range-input styling already in `tokens.css`), "PROFIL GPX" section (file name/climb-sum display, hidden `<input type="file" accept=".gpx">` behind a "Wczytaj plik" label calling `loadGpxFromFile`, Wł./Wył. toggle calling `toggleGpx`), "Gotowe" button calling `closeRouteSheet()` then `reconcilePlan()` (matches existing desktop commit-on-close pattern noted in `appStore.ts`'s comment above `setDistance`).

- [ ] **Step 3: Implement `MobileShopSheet.tsx`**

Per README §8: km number input (`inputmode="decimal"`, mono 19px/700, placeholder `"0–{distance} km"`), name text input (default `shopDefaultName`), "Dodaj" button disabled unless `0 <= km <= dist(route)`. When `ui.shopSheet.editId` is set, prefill from the matching `shops` entry and call `updateShop` on submit; when `null`, call `addShop()` then `updateShop(newId, {...})` (mirroring the gid-lookup pattern from Task 11 — read `nextShopId` before calling `addShop()`).

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/mobile/MobileRouteSheet.tsx src/components/mobile/MobileShopSheet.tsx
git commit -m "Add route/conditions and landmark bottom sheets"
```

---

### Task 17: `MobileApp.tsx` — assembly

**Files:**
- Create: `src/components/mobile/MobileApp.tsx`

**Interfaces:**
- Consumes: every component from Tasks 5–16 (`MobileChartPanel`, `MobilePlanList`, `MobileGear`, `MobileMix`, `MobileFoodLibrary`, `MobileProfile`, `MobileMixSheet`, `MobileRouteSheet`, `MobileShopSheet`); `useAppStore` (`ui.tab`, `setTab`, `ui.lang`, `route`, `openRouteSheet`); `fmtHM`, `dist`, `totalHours` from `../../domain/fuel`; `t` from `../../i18n/strings`.
- Produces: `export function MobileApp(): JSX.Element` — consumed by `App.tsx` (Task 18).

- [ ] **Step 1: Implement**

Per README §"Ramka aplikacji": full-height flex column — top bar (`flex-shrink:0`, `padding:13px 18px 10px`, `border-bottom`) with "CARB FUELING" on the left and a pill button on the right showing `` `${t(lang).editRoutePrefix} ${Math.round(dist(route))} km · ${fmtHM(totalHours(route))}` ``, opening `openRouteSheet()`; scrollable middle (`flex:1; overflow-y:auto; overscroll-behavior:contain`) rendering, based on `ui.tab`: `plan` → `<MobileChartPanel/>` (sticky) + `<MobilePlanList/>`, `gear` → `<MobileGear/>`, `mix` → `<MobileMix/>`, `food` → `<MobileFoodLibrary/>`, `me` → `<MobileProfile/>`; bottom tab bar (`flex-shrink:0`, `padding:8px 8px 16px`, 5-column grid, `gap:2px`) with the five inline SVG icons from README §"Ramka aplikacji" → "Ikony" (copy the exact `<path>`/`<circle>` data given there verbatim, viewBox `0 0 22 22`, `stroke-width:1.9`, round caps/joins, active color `--ink` / inactive `#B0B5B0` icon + `#9AA09B` label). Mount `<MobileMixSheet/>`, `<MobileRouteSheet/>`, `<MobileShopSheet/>` at the end unconditionally (they self-return `null` when closed).

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/mobile/MobileApp.tsx
git commit -m "Assemble MobileApp: top bar, 5-tab body, sheets"
```

---

### Task 18: Wire `MobileApp` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `MobileApp` from `./components/mobile/MobileApp`; `isDesktopView` from `./store/appStore`.

- [ ] **Step 1: Add the resize listener and view branch**

In `App.tsx`, add a `useEffect` that sets `ui.autoView` from `window.innerWidth` on mount and on `resize` (breakpoint 760px, per design spec's decision to reuse existing `viewMode`/`autoView` state):

```tsx
import { useEffect } from 'react';
import { MobileApp } from './components/mobile/MobileApp';
import { isDesktopView, useAppStore } from './store/appStore';
// ...existing imports...

function App() {
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const setAutoView = useAppStore((s) => s.setAutoView);
  // ...existing hooks (panel, tourSeen, startTour, lang)...

  useEffect(() => {
    const update = () => setAutoView(window.innerWidth >= 760 ? 'desktop' : 'mobile');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [setAutoView]);

  // ...existing tour/lang effects...

  if (!isDesktopView(viewMode, autoView)) {
    return <MobileApp />;
  }

  return (
    // ...existing desktop JSX, unchanged...
  );
}
```

- [ ] **Step 2: Manually verify both views load**

Run: `npm run dev`, open the printed local URL in a browser, resize the window narrower than 760px and confirm `MobileApp` renders (5 tabs, sticky chart); widen back and confirm the desktop layout still renders unchanged. Also toggle the "Ja" tab's Telefon/Komputer chips (once Task 14 exists) to confirm `setViewMode` overrides the width-based auto-detection.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "Mount MobileApp below the 760px breakpoint, wire viewMode override"
```

---

### Task 19: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full typecheck**

Run: `npx tsc -b`
Expected: zero errors.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all tests pass, including the new `appStore.test.ts` and `mobileMath.test.ts` cases.

- [ ] **Step 3: Manual pass against the prototype**

Run: `npm run dev`. At a phone-width viewport, open the `.dc.html` prototype (`design_handoff_mobile/Carbfueling Mobile.dc.html`) side by side and click through: all 5 tabs, chart scrub, mini-lane tap→card expand, every stepper (including gel-portion rows), add bottle/flask, add food item, add/remove landmark, the full-screen mix sheet, the route sheet (including GPX file load and the Wł./Wył. toggle), language switch, and the Telefon/Komputer view toggle. This is the point at which the user takes over to click through and confirm — do not mark this step done unilaterally.

- [ ] **Step 4: Commit any fixups found during manual pass, then stop and hand back to the user**

```bash
git add -A
git commit -m "Fix issues found in manual verification pass"
```
(only if changes were needed)
