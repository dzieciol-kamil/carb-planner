# Gradient-Aware Chart Time Axis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chart's time-mode tick labels reflect terrain (climbs take longer per km, descents shorter) instead of a constant-speed linear relabeling, while keeping the total estimated ride time exactly unchanged.

**Architecture:** Add a small gradient-to-pace weighting function in `src/domain/fuel.ts`, accumulate a second cumulative array (`cumTime`) in `prof()` alongside the existing effort accumulation, then expose `timeAtDistance`/`distanceAtTime` lookup functions that normalize that cumulative array so it always sums to `totalHours(route)`. Wire `fmtX()` (labels) and `Chart.tsx`'s time-tick generation (gridline positions) to use them instead of the current flat `km / kmh` division. The chart's X axis itself (point positions, curve shapes) is untouched — only where time ticks land changes.

**Tech Stack:** TypeScript, Vitest (existing `src/domain/fuel.test.ts` conventions — `describe`/`test`, `makeRoute()` helper, `toBeCloseTo` for floats).

## Global Constraints

- Total estimated ride time must always equal exactly `totalHours(route)` (spec hard constraint) — the pace model only redistributes that same total unevenly across segments, never changes it.
- Pace weighting must be gated behind `route.useGpx`, exactly like the existing `effort` multiplier (`pts[i].effort = route.useGpx ? ... : 1`) — when `useGpx` is false, behavior must be bit-for-bit identical to today's constant-speed linear relabeling (no regression).
- No new UI controls for the pace-model constants (YAGNI) — they're named constants in `fuel.ts`.
- The chart's distance-based X axis layout (point spacing, curve shapes) does not change — only time-tick placement/labels.
- Full spec: `docs/superpowers/specs/2026-07-29-chart-time-axis-pace-model-design.md`.

---

### Task 1: `timeWeight` pace function

**Files:**
- Modify: `src/domain/fuel.ts` (add near the top, after the existing constants at line 3-4)
- Test: `src/domain/fuel.test.ts`

**Interfaces:**
- Produces: `export function timeWeight(gradPercent: number): number` — relative time-per-km multiplier vs. flat ground (1.0 = flat pace). Used by Task 2.

- [ ] **Step 1: Write the failing tests**

Add to `src/domain/fuel.test.ts` (new `describe` block, place after the `import` section, e.g. right before `describe('totalHours', ...)`):

```ts
describe('timeWeight', () => {
  test('flat ground: weight 1', () => {
    expect(timeWeight(0)).toBe(1);
  });

  test('moderate uphill (5%): 50% longer per km', () => {
    expect(timeWeight(5)).toBeCloseTo(1.5, 6);
  });

  test('steep uphill (15%): scales linearly, no cap', () => {
    expect(timeWeight(15)).toBeCloseTo(2.5, 6);
  });

  test('moderate downhill (-5%): faster than flat', () => {
    expect(timeWeight(-5)).toBeCloseTo(0.65, 6);
  });

  test('steep downhill (-20%): clamped at the 0.55 floor', () => {
    expect(timeWeight(-20)).toBe(0.55);
  });
});
```

Add `timeWeight` to the existing `import { ... } from './fuel';` list in `fuel.test.ts`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/domain/fuel.test.ts -t timeWeight`
Expected: FAIL — `timeWeight is not defined` / import error.

- [ ] **Step 3: Implement `timeWeight`**

In `src/domain/fuel.ts`, add after the existing top-level constants (currently `FLUID_ABSORPTION_CAP_ML_H` and `PROFILE_SAMPLES` at lines 3-4):

```ts
const PACE_UP_K = 0.1;
const PACE_DOWN_K = 0.07;
const PACE_DOWN_FLOOR = 0.55;

export function timeWeight(gradPercent: number): number {
  if (gradPercent >= 0) return 1 + gradPercent * PACE_UP_K;
  return Math.max(PACE_DOWN_FLOOR, 1 + gradPercent * PACE_DOWN_K);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/domain/fuel.test.ts -t timeWeight`
Expected: PASS (all 5 cases).

- [ ] **Step 5: Commit**

```bash
git add src/domain/fuel.ts src/domain/fuel.test.ts
git commit -m "Add gradient-to-pace weighting function"
```

---

### Task 2: `cumTime` accumulation in `Profile`/`prof()`

**Files:**
- Modify: `src/domain/fuel.ts` — `Profile` interface (lines 13-18) and `prof()` (lines 92-128)
- Test: `src/domain/fuel.test.ts`

**Interfaces:**
- Consumes: `timeWeight(gradPercent: number): number` from Task 1.
- Produces: `Profile.cumTime: number[]` — raw (unnormalized) cumulative pace-weighted distance, same length/indexing as the existing `Profile.cum`. `cumTime[0] === 0`. Consumed by Task 3.

- [ ] **Step 1: Write the failing tests**

Add to `src/domain/fuel.test.ts`, inside (or right after) the existing `describe('prof / eff', ...)` block:

```ts
test('cumTime is linear in distance when useGpx is false, regardless of a loaded gpxTrack', () => {
  const route = makeRoute({
    mode: 'route',
    distance: 100,
    useGpx: false,
    gpxTrack: { id: 1, ele: [0, 500, 500] },
  });
  const P = prof(route);
  expect(P.cumTime[0]).toBe(0);
  expect(P.cumTime[80]).toBeCloseTo(50, 6);
  expect(P.cumTime[160]).toBeCloseTo(100, 6);
});

test('cumTime gives disproportionate weight to a climb when useGpx is true', () => {
  const route = makeRoute({
    mode: 'route',
    distance: 100,
    useGpx: true,
    gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs 500m over the first half, flat second half
  });
  const P = prof(route);
  expect(P.cumTime[0]).toBe(0);
  // First half (the climb) should account for more than half of the raw cumulative time.
  expect(P.cumTime[80]).toBeGreaterThan(P.cumTime[160] / 2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/domain/fuel.test.ts -t cumTime`
Expected: FAIL — `Property 'cumTime' does not exist` (TypeScript) or `undefined` comparisons.

- [ ] **Step 3: Implement `cumTime` accumulation**

In `src/domain/fuel.ts`, extend the `Profile` interface (lines 13-18):

```ts
export interface Profile {
  pts: ProfilePoint[];
  cum: number[];
  cumTime: number[];
  N: number;
  D: number;
}
```

In `prof()`, after the existing `cum` accumulation loop (lines 124-125: `const cum = [0]; for (...) cum[i] = ...;`), add:

```ts
const cumTime = [0];
for (let i = 1; i <= N; i++) {
  const wA = route.useGpx ? timeWeight(pts[i - 1].grad) : 1;
  const wB = route.useGpx ? timeWeight(pts[i].grad) : 1;
  cumTime[i] = cumTime[i - 1] + (pts[i].x - pts[i - 1].x) * ((wA + wB) / 2);
}
```

Update the `prof()` return statement (line 127) to include it:

```ts
return { pts, cum, cumTime, N, D };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/domain/fuel.test.ts -t cumTime`
Expected: PASS.

Then run the full suite to confirm no regression: `npx vitest run src/domain/fuel.test.ts`
Expected: PASS (all existing tests still green — `Profile` gained a field but no existing test destructures `Profile` exhaustively).

- [ ] **Step 5: Commit**

```bash
git add src/domain/fuel.ts src/domain/fuel.test.ts
git commit -m "Accumulate gradient-weighted cumulative time in Profile"
```

---

### Task 3: `timeAtDistance` and `distanceAtTime` lookups

**Files:**
- Modify: `src/domain/fuel.ts` — add near `eff()` (line 130-136)
- Test: `src/domain/fuel.test.ts`

**Interfaces:**
- Consumes: `Profile.cumTime`, `Profile.pts`, `Profile.D`, `Profile.N` from Task 2; `totalHours(route)` (existing, line 42-45); `prof(route)` (existing).
- Produces:
  - `export function timeAtDistance(route: RouteInput, km: number): number` — elapsed hours estimated at distance `km`, normalized so `timeAtDistance(route, dist(route)) === totalHours(route)` exactly. Consumed by Task 4.
  - `export function distanceAtTime(route: RouteInput, hours: number): number` — inverse: the km position where cumulative elapsed time reaches `hours`. Consumed by Task 5.

- [ ] **Step 1: Write the failing tests**

Add to `src/domain/fuel.test.ts`, new `describe` block after `describe('prof / eff', ...)`:

```ts
describe('timeAtDistance / distanceAtTime', () => {
  test('useGpx false: reduces to constant-speed division (matches old km/kmh behavior)', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25, useGpx: false }); // 4h total
    expect(timeAtDistance(route, 0)).toBe(0);
    expect(timeAtDistance(route, 50)).toBeCloseTo(2, 6);
    expect(timeAtDistance(route, 100)).toBeCloseTo(4, 6);
  });

  test('useGpx true: a climb gets more than its distance share of elapsed time', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25, // 4h total
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs first half, flat second half
    });
    expect(timeAtDistance(route, 0)).toBe(0);
    expect(timeAtDistance(route, 50)).toBeGreaterThan(2); // more than half of 4h for the climb half
    expect(timeAtDistance(route, 100)).toBeCloseTo(4, 6); // total is always preserved
  });

  test('distanceAtTime is the inverse of timeAtDistance', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const t = timeAtDistance(route, 63);
    expect(distanceAtTime(route, t)).toBeCloseTo(63, 3);
  });

  test('distanceAtTime at the boundaries', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25, useGpx: false });
    expect(distanceAtTime(route, 0)).toBe(0);
    expect(distanceAtTime(route, 4)).toBeCloseTo(100, 6);
  });
});
```

Add `timeAtDistance, distanceAtTime` to the `import { ... } from './fuel';` list in `fuel.test.ts`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/domain/fuel.test.ts -t "timeAtDistance / distanceAtTime"`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement `timeAtDistance` and `distanceAtTime`**

In `src/domain/fuel.ts`, add right after `eff()` (currently lines 130-136):

```ts
export function timeAtDistance(route: RouteInput, km: number): number {
  const P = prof(route);
  const total = P.cumTime[P.N] || 1;
  const f = Math.max(0, Math.min(1, km / P.D)) * P.N;
  const i = Math.floor(f);
  const raw = i >= P.N ? P.cumTime[P.N] : P.cumTime[i] + (P.cumTime[i + 1] - P.cumTime[i]) * (f - i);
  return (raw / total) * totalHours(route);
}

export function distanceAtTime(route: RouteInput, hours: number): number {
  const P = prof(route);
  const total = P.cumTime[P.N] || 1;
  const totHrs = totalHours(route);
  const targetRaw = totHrs > 0 ? (hours / totHrs) * total : 0;
  if (targetRaw <= 0) return 0;
  if (targetRaw >= total) return P.D;
  let i = 0;
  while (i < P.N && P.cumTime[i + 1] < targetRaw) i++;
  const segSpan = P.cumTime[i + 1] - P.cumTime[i] || 1;
  const segFrac = (targetRaw - P.cumTime[i]) / segSpan;
  return P.pts[i].x + (P.pts[i + 1].x - P.pts[i].x) * segFrac;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/domain/fuel.test.ts -t "timeAtDistance / distanceAtTime"`
Expected: PASS (all 4 cases).

Then run the full suite: `npx vitest run src/domain/fuel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/fuel.ts src/domain/fuel.test.ts
git commit -m "Add timeAtDistance/distanceAtTime gradient-aware time lookups"
```

---

### Task 4: Wire `fmtX()` to `timeAtDistance`

**Files:**
- Modify: `src/domain/fuel.ts` — `fmtX()` (lines 344-348)
- Test: `src/domain/fuel.test.ts`

**Interfaces:**
- Consumes: `timeAtDistance(route, km)` from Task 3.
- Produces: no change to `fmtX`'s exported signature (`fmtX(km, withUnit, route, xUnit): string`) — only its internal computation changes. Consumed by `Chart.tsx` and `rangeLabel()` (unchanged callers).

- [ ] **Step 1: Write the failing test**

Add to the existing `describe('fmtX', ...)` block in `src/domain/fuel.test.ts`:

```ts
test('time axis reflects gradient when useGpx is true (climb gets a later label than flat division would)', () => {
  const route = makeRoute({
    mode: 'route',
    distance: 100,
    speed: 25, // flat-division would put 50km at exactly "2:00"
    useGpx: true,
    gpxTrack: { id: 1, ele: [0, 500, 500] },
  });
  const label = fmtX(50, true, route, 'h');
  expect(label).not.toBe('2:00 h');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/domain/fuel.test.ts -t "reflects gradient"`
Expected: FAIL — `fmtX` still returns `'2:00 h'` (current constant-speed behavior ignores gradient).

- [ ] **Step 3: Implement the change**

In `src/domain/fuel.ts`, replace `fmtX()` (currently):

```ts
export function fmtX(km: number, withUnit: boolean, route: RouteInput, xUnit: XUnit): string {
  if (xu(route, xUnit) === 'km') return Math.round(km) + (withUnit ? ' km' : '');
  const kmh = dist(route) / Math.max(0.01, totalHours(route));
  return fmtHM(km / kmh) + (withUnit ? ' h' : '');
}
```

with:

```ts
export function fmtX(km: number, withUnit: boolean, route: RouteInput, xUnit: XUnit): string {
  if (xu(route, xUnit) === 'km') return Math.round(km) + (withUnit ? ' km' : '');
  return fmtHM(timeAtDistance(route, km)) + (withUnit ? ' h' : '');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/domain/fuel.test.ts -t fmtX`
Expected: PASS — including the three pre-existing `fmtX` tests (they use `useGpx: false` routes, so `timeAtDistance` reduces to the identical constant-speed math and their exact expected strings, e.g. `'2:00 h'`, are unchanged).

Then run the full suite: `npx vitest run`
Expected: PASS, all files.

- [ ] **Step 5: Commit**

```bash
git add src/domain/fuel.ts src/domain/fuel.test.ts
git commit -m "Make fmtX time labels gradient-aware via timeAtDistance"
```

---

### Task 5: Wire `Chart.tsx` time-tick gridlines to `distanceAtTime`

**Files:**
- Modify: `src/components/chart/Chart.tsx` — import list (line 2) and time-tick block (lines 75-80)

**Interfaces:**
- Consumes: `distanceAtTime(route, hours)` from Task 3.
- Produces: no exported interface change — `Chart` remains a React component with the same `ChartProps`. This task has no unit test (no existing `Chart.test.tsx` in the project); verify manually via the running dev server per Step 3 below.

- [ ] **Step 1: Update the import**

In `src/components/chart/Chart.tsx`, line 2 currently reads:

```ts
import { absCap, dist, fmtX, prof, samples, totalHours, type Sample } from '../../domain/fuel';
```

Change to:

```ts
import { absCap, dist, distanceAtTime, fmtX, prof, samples, totalHours, type Sample } from '../../domain/fuel';
```

- [ ] **Step 2: Replace the time-tick generation**

Currently (lines 70-80):

```ts
const timeAxis = route.mode === 'time' || xUnit === 'h';
const ticks: number[] = [];
if (!timeAxis) {
  const step = D > 120 ? 50 : D > 40 ? 20 : 10;
  for (let k = 0; k <= D + 0.01; k += step) ticks.push(k);
} else {
  const hrs = totalHours(route);
  const kmh = D / Math.max(0.01, hrs);
  const step = hrs > 6 ? 1 : hrs > 3 ? 0.5 : 0.25;
  for (let hh = 0; hh <= hrs + 0.001; hh += step) ticks.push(hh * kmh);
}
```

Replace the `else` branch with:

```ts
const timeAxis = route.mode === 'time' || xUnit === 'h';
const ticks: number[] = [];
if (!timeAxis) {
  const step = D > 120 ? 50 : D > 40 ? 20 : 10;
  for (let k = 0; k <= D + 0.01; k += step) ticks.push(k);
} else {
  const hrs = totalHours(route);
  const step = hrs > 6 ? 1 : hrs > 3 ? 0.5 : 0.25;
  for (let hh = 0; hh <= hrs + 0.001; hh += step) ticks.push(distanceAtTime(route, hh));
}
```

- [ ] **Step 3: Verify manually in the running dev server**

The dev server should already be running (started earlier at `http://localhost:5175/carb-planner/`; if not, run `npm run dev` in the background). In the browser:

1. Set "Dystans (km)" to `100` and "Śr. prędkość (km/h)" to `25`.
2. Toggle "Wł." next to the GPX profile to turn `useGpx` on (if not already on) — the elevation silhouette must be visible in the chart.
3. Click the "godziny" toggle (top-right of the chart card) to switch to time mode.
4. Screenshot the chart. Confirm the time gridlines (0:00, 0:30, 1:00, ...) are now spaced *unevenly* — bunched closer together under the climb (the tall peak in the elevation silhouette) and spread further apart under the descent after it — instead of the perfectly even spacing seen before this change.
5. Toggle "Wł." off (useGpx false). Confirm the gridlines snap back to perfectly even spacing (regression check — matches the constant-speed behavior for the no-elevation case).
6. Run `npm run build` (or `tsc -b --noEmit`) to confirm no TypeScript errors from the `Chart.tsx` change.

- [ ] **Step 4: Commit**

```bash
git add src/components/chart/Chart.tsx
git commit -m "Place chart time-tick gridlines using gradient-aware distanceAtTime"
```

---

## Final check

- [ ] Run the full test suite once more: `npx vitest run`. Expected: PASS, all files, no regressions.
- [ ] Run `npm run build` once more to confirm the whole project still typechecks and builds.
