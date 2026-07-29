# Shop (resupply) markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user drop draggable point markers ("shop stops") directly on the fuel chart to note known resupply points along the route — visual only, no effect on any fuel/hydration calculation.

**Architecture:** A new `ShopStop { id, at }` type lives outside `PlanState` (it never touches `fuel.ts`). Pure placement/clamping math goes in `dragMath.ts` (mirrors `moveFood`/`moveFill`). State lives in `appStore.ts` as a sibling array to `foods`/`fills`. A new `ShopMarkers.tsx` overlay renders directly on top of `<Chart>` (not in a lane row) — a line + a small map-pin icon per marker, a hover-to-remove button, drag-to-move, and a "+" button to add new stops.

**Tech Stack:** React + TypeScript + Zustand (existing), Vitest (existing, domain-level tests only — this codebase has no component/DOM test harness, so UI tasks are verified by type-check + manual browser check, matching the existing convention in `docs/superpowers/plans/2026-07-28-pre-ride-meal.md`).

## Global Constraints

- Code, comments, commits: English. This feature adds no user-facing copy/labels, so no `src/i18n/strings.ts` changes are needed (spec: `docs/superpowers/specs/2026-07-29-shop-markers-design.md`).
- Zero changes to `src/domain/fuel.ts` — shop stops must not affect `samples()`, `planSummary()`, or any other calculation.
- New marker default position = midpoint between the last existing marker's `at` (or `0` if there are none) and the route end (`dist(route)`).
- No name/label field, no library, no lane row, no collision/snapping logic (per spec's "Out of scope").

---

### Task 1: Domain — `ShopStop` type + pure placement math

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/dragMath.ts`
- Modify: `src/domain/dragMath.test.ts`

**Interfaces:**
- Produces: `ShopStop { id: number; at: number }` (from `types.ts`); `moveShop(shop: ShopStop, distanceKm: number, deltaKm: number): number` and `nextShopAt(shops: ShopStop[], distanceKm: number): number` (from `dragMath.ts`).

- [ ] **Step 1: Add the `ShopStop` type**

In `src/domain/types.ts`, add after the `Fill` interface (after its closing `}`, before `FoodItem`):

```ts
export interface ShopStop {
  id: number;
  at: number;
}
```

- [ ] **Step 2: Write the failing tests**

In `src/domain/dragMath.test.ts`, add `ShopStop` to the type import at the top:

```ts
import type { Fill, FoodItem, ShopStop, Vessel } from './types';
```

and add `moveShop, nextShopAt` to the `import { ... } from './dragMath'` block. Then add these two `describe` blocks (after the `moveListItem` block, at the end of the file):

```ts
describe('moveShop', () => {
  test('moves freely within [0, distanceKm]', () => {
    const shop: ShopStop = { id: 1, at: 50 };
    expect(moveShop(shop, 100, 10)).toBe(60);
  });

  test('clamps at the route start', () => {
    const shop: ShopStop = { id: 1, at: 10 };
    expect(moveShop(shop, 100, -50)).toBe(0);
  });

  test('clamps at the route end', () => {
    const shop: ShopStop = { id: 1, at: 90 };
    expect(moveShop(shop, 100, 50)).toBe(100);
  });
});

describe('nextShopAt', () => {
  test('midpoint between the start and the end when there are no markers yet', () => {
    expect(nextShopAt([], 100)).toBe(50);
  });

  test('midpoint between the last marker and the end', () => {
    const shops: ShopStop[] = [
      { id: 1, at: 20 },
      { id: 2, at: 60 },
    ];
    expect(nextShopAt(shops, 100)).toBe(80); // (60 + 100) / 2
  });
});
```

- [ ] **Step 3: Run the test file to verify it fails**

Run: `npx vitest run src/domain/dragMath.test.ts`
Expected: FAIL — `moveShop`/`nextShopAt` are not exported / not defined.

- [ ] **Step 4: Implement `moveShop` and `nextShopAt`**

In `src/domain/dragMath.ts`, add `ShopStop` to the `import type { Fill, FoodItem, Vessel } from './types';` line, then add these two functions after `moveFood`/`resizeFoodLeft`/`resizeFoodRight` (before `moveListItem`):

```ts
export function moveShop(shop: ShopStop, distanceKm: number, deltaKm: number): number {
  return Math.max(0, Math.min(distanceKm, Math.round(shop.at + deltaKm)));
}

export function nextShopAt(shops: ShopStop[], distanceKm: number): number {
  const lastAt = shops.length ? Math.max(...shops.map((s) => s.at)) : 0;
  return Math.round((lastAt + distanceKm) / 2);
}
```

- [ ] **Step 5: Run the test file to verify it passes**

Run: `npx vitest run src/domain/dragMath.test.ts`
Expected: PASS, including the 5 new tests and all pre-existing ones.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/dragMath.ts src/domain/dragMath.test.ts
git commit -m "Add ShopStop type and pure placement math for shop markers"
```

---

### Task 2: Store — state and actions

**Files:**
- Modify: `src/store/appStore.ts`

**Interfaces:**
- Consumes: `ShopStop` (Task 1, `types.ts`), `nextShopAt` (Task 1, `dragMath.ts`), existing `dist` (from `fuel.ts`, already imported in this file).
- Produces: `AppState.shops: ShopStop[]`, `AppState.nextShopId: number`, `AppState.addShop(): void`, `AppState.updateShop(id: number, patch: Partial<ShopStop>): void`, `AppState.removeShop(id: number): void`.

- [ ] **Step 1: Add imports**

In `src/store/appStore.ts`, change:

```ts
import { bestGapSpan, gaps, moveListItem } from '../domain/dragMath';
```

to:

```ts
import { bestGapSpan, gaps, moveListItem, nextShopAt } from '../domain/dragMath';
```

and change:

```ts
import type { FoodItem, FoodLibEntry, Intensity, Mode, MixSettings, RouteInput, Vessel, Fill, XUnit } from '../domain/types';
```

to:

```ts
import type { FoodItem, FoodLibEntry, Intensity, Mode, MixSettings, RouteInput, Vessel, Fill, ShopStop, XUnit } from '../domain/types';
```

- [ ] **Step 2: Add state fields to `AppState` and a `defaultShops` constant**

Add to the `AppState` interface, after `foods: FoodItem[];`:

```ts
  shops: ShopStop[];
```

Add after `nextFoodKey: number;`:

```ts
  nextShopId: number;
```

Add the three action signatures after `addFoodFromLibrary: (key: string) => void;`:

```ts

  addShop: () => void;
  updateShop: (id: number, patch: Partial<ShopStop>) => void;
  removeShop: (id: number) => void;
```

Add a `defaultShops` constant right after `const defaultFoods: FoodItem[] = [];`:

```ts
const defaultShops: ShopStop[] = [];
```

- [ ] **Step 3: Wire the default state**

Add to the store's initial state object, after `foods: defaultFoods,`:

```ts
    shops: defaultShops,
```

Add after `nextFoodKey: 1,`:

```ts
    nextShopId: 1,
```

- [ ] **Step 4: Implement the actions**

Add after the `addFoodFromLibrary` action's closing `}),`:

```ts

    addShop: () =>
      set((s) => {
        const distanceKm = dist(s.route);
        const at = nextShopAt(s.shops, distanceKm);
        return { shops: [...s.shops, { id: s.nextShopId, at }], nextShopId: s.nextShopId + 1 };
      }),
    updateShop: (id, patch) => set((s) => ({ shops: s.shops.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    removeShop: (id) =>
      set((s) => ({ shops: s.shops.filter((x) => x.id !== id), ui: { ...s.ui, hoverKey: null, dragKey: null } })),
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/store/appStore.ts
git commit -m "Add shop-stop state and actions to appStore"
```

---

### Task 3: Drag handler

**Files:**
- Modify: `src/components/lanes/dragHandlers.ts`

**Interfaces:**
- Consumes: `moveShop` (Task 1, `dragMath.ts`), `s.shops`/`s.updateShop`/`s.setDragKey` (Task 2, `appStore.ts`).
- Produces: `createShopDragHandler(id: number): (ev: ReactPointerEvent) => void`.

- [ ] **Step 1: Add the import**

In `src/components/lanes/dragHandlers.ts`, change:

```ts
import { dragGelPart, moveFill, moveFood, rescalePositions, resizeFillLeft, resizeFillRight, resizeFoodLeft, resizeFoodRight } from '../../domain/dragMath';
```

to:

```ts
import { dragGelPart, moveFill, moveFood, moveShop, rescalePositions, resizeFillLeft, resizeFillRight, resizeFoodLeft, resizeFoodRight } from '../../domain/dragMath';
```

- [ ] **Step 2: Implement `createShopDragHandler`**

Add at the end of the file, after `createFoodDragHandler` and before `stopPointerDown`:

```ts
export function createShopDragHandler(id: number) {
  return (ev: ReactPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const track = (ev.currentTarget as HTMLElement).parentElement;
    if (!track) return;

    const state = useAppStore.getState();
    const shop = state.shops.find((x) => x.id === id);
    if (!shop) return;
    const distanceKm = dist(state.route);
    const kpp = trackWidthKmPerPixel(track, distanceKm);
    const x0 = ev.clientX;
    const at0 = shop.at;

    const move = (e2: PointerEvent) => {
      const d = (e2.clientX - x0) * kpp;
      const at = moveShop({ id, at: at0 }, distanceKm, d);
      useAppStore.getState().updateShop(id, { at });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      useAppStore.getState().setDragKey(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    useAppStore.getState().setDragKey('s' + id);
  };
}
```

(This mirrors `createFoodDragHandler`'s `move` case exactly, minus the resize modes — a shop stop is a single point, not a range.)

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors (this file has no dedicated test — same as the existing `createFillDragHandler`/`createFoodDragHandler`, which are only exercised through the UI).

- [ ] **Step 4: Commit**

```bash
git add src/components/lanes/dragHandlers.ts
git commit -m "Add drag handler for shop markers"
```

---

### Task 4: `ShopMarkers` overlay + wire into `ChartCard`

**Files:**
- Create: `src/components/chart/ShopMarkers.tsx`
- Modify: `src/components/chart/ChartCard.tsx`

**Interfaces:**
- Consumes: `s.shops`, `s.ui.hoverKey`, `s.ui.dragKey`, `s.setHoverKey`, `s.addShop`, `s.removeShop` (Task 2); `createShopDragHandler`, `stopPointerDown` (Task 3, already exported from `dragHandlers.ts`); `CHART_COLORS.ink` (existing, `theme.ts`); `dist` (existing, `fuel.ts`).
- Produces: `ShopMarkers({ distanceKm, height, bottomPadding }: { distanceKm: number; height: number; bottomPadding: number })`, a React component.

- [ ] **Step 1: Create `ShopMarkers.tsx`**

```tsx
import type { CSSProperties } from 'react';
import { createShopDragHandler, stopPointerDown } from '../lanes/dragHandlers';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from './theme';

const PIN_W = 16;
const PIN_H = 18;

interface ShopMarkersProps {
  distanceKm: number;
  height: number;
  bottomPadding: number;
}

function pinButtonStyle(leftPct: number): CSSProperties {
  return {
    position: 'absolute',
    left: `calc(${leftPct}% - ${PIN_W / 2}px)`,
    top: -2,
    width: PIN_W,
    height: PIN_H,
    cursor: 'grab',
    touchAction: 'none',
    pointerEvents: 'auto',
  };
}

function lineStyle(leftPct: number, height: number, bottomPadding: number, on: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: `calc(${leftPct}% - 0.75px)`,
    top: PIN_H - 3,
    width: 1.5,
    height: height - bottomPadding - (PIN_H - 3),
    background: CHART_COLORS.ink,
    opacity: on ? 0.9 : 0.55,
    pointerEvents: 'none',
  };
}

function removeButtonStyle(show: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: 3,
    top: 1,
    width: 10,
    height: 10,
    padding: 0,
    border: 'none',
    borderRadius: 3,
    background: 'rgba(255,255,255,0.9)',
    color: CHART_COLORS.ink,
    fontSize: 7,
    lineHeight: 1,
    cursor: 'pointer',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    display: show ? 'flex' : 'none',
  };
}

const addButtonStyle: CSSProperties = {
  position: 'absolute',
  top: -2,
  right: 0,
  width: 20,
  height: 20,
  borderRadius: 6,
  cursor: 'pointer',
  border: '1px dashed #B9C0B7',
  background: '#F7F8F5',
  color: 'var(--ink-soft)',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
  padding: 0,
  fontFamily: 'Archivo, sans-serif',
  pointerEvents: 'auto',
};

export function ShopMarkers({ distanceKm, height, bottomPadding }: ShopMarkersProps) {
  const shops = useAppStore((s) => s.shops);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const removeShop = useAppStore((s) => s.removeShop);
  const addShop = useAppStore((s) => s.addShop);

  return (
    <>
      {shops.map((shop) => {
        const key = 's' + shop.id;
        const on = hoverKey === key;
        const dragging = dragKey === key;
        const leftPct = (shop.at / distanceKm) * 100;
        return (
          <div key={shop.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={lineStyle(leftPct, height, bottomPadding, on || dragging)} />
            <div
              onPointerDown={createShopDragHandler(shop.id)}
              onPointerEnter={() => setHoverKey(key)}
              onPointerLeave={() => setHoverKey(null)}
              style={pinButtonStyle(leftPct)}
            >
              <svg width={PIN_W} height={PIN_H} viewBox="0 0 16 18" style={{ display: 'block', overflow: 'visible' }}>
                <path
                  d="M8 18C8 18 1 10.5 1 7A7 7 0 1 1 15 7C15 10.5 8 18 8 18Z"
                  fill={CHART_COLORS.ink}
                  opacity={on || dragging ? 1 : 0.75}
                />
              </svg>
              <button onClick={() => removeShop(shop.id)} onPointerDown={stopPointerDown} title="Remove" style={removeButtonStyle(on)}>
                ✕
              </button>
              {dragging && (
                <span
                  style={{
                    position: 'absolute',
                    top: -16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: CHART_COLORS.ink,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '2px 5px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Math.round(shop.at)} km
                </span>
              )}
            </div>
          </div>
        );
      })}
      <button onClick={addShop} title="Add shop stop" style={addButtonStyle}>
        +
      </button>
    </>
  );
}
```

- [ ] **Step 2: Wire it into `ChartCard.tsx`**

Add `dist` to the existing fuel import:

```ts
import { dist, planSummary, prof } from '../../domain/fuel';
```

Add the new component import after the `LanesSection` import:

```ts
import { ShopMarkers } from './ShopMarkers';
```

Change the chart wrapper div (currently `<div style={{ flex: 1, minWidth: 0 }}><Chart height={CHART_HEIGHT} showAxis /></div>`) to:

```tsx
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Chart height={CHART_HEIGHT} showAxis />
          <ShopMarkers distanceKm={dist(route)} height={CHART_HEIGHT} bottomPadding={CHART_PB} />
        </div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 4: Visual check in the browser**

Run: `npm run dev` (if not already running), open the app.
Expected:
- A small dashed "+" button appears in the top-right corner of the chart, at the same height as where marker pins sit.
- Clicking it adds a dark pin + vertical line at the midpoint of the route (or, on subsequent clicks, at the midpoint between the last marker and the route end).
- Hovering the pin shows a small ✕ inside it; clicking removes the marker.
- Dragging the pin moves it horizontally, clamped to the route's start/end, and shows a small "NN km" label above it while dragging.
- The chart's own curves, legend, and axis are unaffected — no change to any number shown elsewhere on the page.

- [ ] **Step 5: Commit**

```bash
git add src/components/chart/ShopMarkers.tsx src/components/chart/ChartCard.tsx
git commit -m "Render draggable shop-stop markers on the fuel chart"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the 5 new `moveShop`/`nextShopAt` tests.

- [ ] **Step 2: Run the full type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual browser pass**

With `npm run dev` running: add three shop markers via "+", confirm each new one lands past the previous one (not stacked at the same spot); drag one marker back and forth across the full route width and confirm it clamps at both ends without jumping; remove all markers via hover + ✕; reload the page and confirm markers persist (localStorage) if any were left in place before reload.
