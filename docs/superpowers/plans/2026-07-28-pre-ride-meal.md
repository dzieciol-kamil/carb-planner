# Pre-ride meal (gut preload) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed the ride simulation's gut contents at the start line with whatever's left of a pre-ride meal, and add the two inputs (grams, minutes-before-start) needed to drive it.

**Architecture:** One new pure function in `src/domain/fuel.ts` computes leftover gut carbs from `preMealCarbs`/`preMealMinutes` using the existing absorption cap; `samples()` uses it as the initial `gut` value instead of `0`. Two new `RouteInput` fields carry the raw inputs through the existing store/persist/UI pattern (mirrors `weight`/`temp`).

**Tech Stack:** React + TypeScript + Zustand (existing), Vitest (existing).

## Global Constraints

- Code, comments, commits, PRs: English. UI copy: both `pl` and `en` entries in `src/i18n/strings.ts` (existing project convention).
- Defaults: `preMealCarbs: 50`, `preMealMinutes: 45` (spec: `docs/superpowers/specs/2026-07-28-pre-ride-meal-design.md`).
- `preMealCarbs`/`preMealMinutes` must NOT affect `target`, `totalCarbs`, or the kcal figure in `planSummary()` — only the initial `gut` value in `samples()`.

---

### Task 1: Domain — gut preload formula + `RouteInput` fields

**Files:**
- Modify: `src/domain/types.ts` (`RouteInput` interface)
- Modify: `src/domain/fuel.ts` (`samples()`, new export)
- Modify: `src/domain/fuel.test.ts` (`makeRoute()` helper + new tests)

**Interfaces:**
- Produces: `RouteInput.preMealCarbs: number`, `RouteInput.preMealMinutes: number`; `preRideGut(route: RouteInput, cap: number): number` exported from `fuel.ts`.
- Consumes (existing): `absCap(mix: MixSettings): number` from `fuel.ts:66`.

- [ ] **Step 1: Add the two fields to `RouteInput`**

In `src/domain/types.ts`, add to the `RouteInput` interface (after `weight: number;`):

```ts
  preMealCarbs: number;
  preMealMinutes: number;
```

- [ ] **Step 2: Add `preMealCarbs`/`preMealMinutes: 0` to the test helper**

In `src/domain/fuel.test.ts`, add to `makeRoute()`'s returned object (after `weight: 75,`):

```ts
    preMealCarbs: 0,
    preMealMinutes: 0,
```

This keeps every existing test's baseline at "nothing eaten before the ride," so no existing assertion changes.

- [ ] **Step 3: Write the failing test for `preRideGut`**

In `src/domain/fuel.test.ts`, add a new `describe` block (after the `absCap` block):

```ts
describe('preRideGut', () => {
  test('nothing eaten before start: zero gut', () => {
    const route = makeRoute({ preMealCarbs: 0, preMealMinutes: 45 });
    expect(preRideGut(route, 60)).toBe(0);
  });

  test('eaten right at the start line: full carbs still in gut', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 0 });
    expect(preRideGut(route, 60)).toBe(50);
  });

  test('fully digested by start (cap * hours >= carbs): zero gut', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 60 });
    expect(preRideGut(route, 60)).toBe(0);
  });

  test('partially digested: leftover = carbs - cap * hours', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 45 });
    expect(preRideGut(route, 60)).toBeCloseTo(5, 6); // 50 - 60*0.75
  });
});
```

Add `preRideGut` to the `import { ... } from './fuel'` block at the top of the file.

- [ ] **Step 4: Run the test file to verify the new tests fail**

Run: `npx vitest run src/domain/fuel.test.ts`
Expected: FAIL — `preRideGut` is not exported / not defined.

- [ ] **Step 5: Implement `preRideGut` and wire it into `samples()`**

In `src/domain/fuel.ts`, add the function near `absCap` (after its definition, so both live in the "rate/cap" section):

```ts
export function preRideGut(route: RouteInput, cap: number): number {
  const preRideHours = route.preMealMinutes / 60;
  return Math.max(0, route.preMealCarbs - cap * preRideHours);
}
```

In `samples()`, replace the initial gut declaration:

```ts
  let gut = 0;
```

with:

```ts
  let gut = preRideGut(route, cap);
```

(`cap` is already computed a few lines above as `const cap = absCap(mix);` — no new variable needed.)

- [ ] **Step 6: Run the test file to verify it passes**

Run: `npx vitest run src/domain/fuel.test.ts`
Expected: PASS, including the 4 new `preRideGut` tests and all pre-existing tests (they still pass because `makeRoute()` now defaults both new fields to `0`, so `preRideGut` returns `0` unless a test overrides them).

- [ ] **Step 7: Commit**

```bash
git add src/domain/types.ts src/domain/fuel.ts src/domain/fuel.test.ts
git commit -m "Seed ride simulation gut with leftover pre-ride meal carbs"
```

---

### Task 2: Store — defaults + setters

**Files:**
- Modify: `src/store/appStore.ts`

**Interfaces:**
- Consumes: `RouteInput.preMealCarbs`/`preMealMinutes` (Task 1).
- Produces: `AppState.setPreMealCarbs(n: number): void`, `AppState.setPreMealMinutes(n: number): void`.

- [ ] **Step 1: Add the two fields to `defaultRoute`**

In `src/store/appStore.ts`, add to `defaultRoute` (after `weight: 78,`):

```ts
  preMealCarbs: 50,
  preMealMinutes: 45,
```

- [ ] **Step 2: Add the two setters to the `AppState` interface**

Add after `setWeight: (n: number) => void;`:

```ts
  setPreMealCarbs: (n: number) => void;
  setPreMealMinutes: (n: number) => void;
```

- [ ] **Step 3: Implement the two setters**

Add after `setWeight: (n) => set((s) => ({ route: { ...s.route, weight: n } })),`:

```ts
    setPreMealCarbs: (n) => set((s) => ({ route: { ...s.route, preMealCarbs: n } })),
    setPreMealMinutes: (n) => set((s) => ({ route: { ...s.route, preMealMinutes: n } })),
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors (this also verifies Task 1's `RouteInput` fields are consumed correctly here).

- [ ] **Step 5: Commit**

```bash
git add src/store/appStore.ts
git commit -m "Add store defaults and setters for pre-ride meal fields"
```

---

### Task 3: i18n strings

**Files:**
- Modify: `src/i18n/strings.ts`

**Interfaces:**
- Produces: `StringTable.preMealCarbs: string`, `StringTable.preMealMinutes: string` (both `pl` and `en` tables).

- [ ] **Step 1: Add the two keys to `StringTable`**

Add after `weight: string;` (line 16):

```ts
  preMealCarbs: string;
  preMealMinutes: string;
```

- [ ] **Step 2: Add the Polish strings**

Add after `weight: 'Waga',` (line 174, in the `pl` table):

```ts
    preMealCarbs: 'Węgle przed startem',
    preMealMinutes: 'Czas przed startem',
```

- [ ] **Step 3: Add the English strings**

Add after `weight: 'Weight',` (line 342, in the `en` table):

```ts
    preMealCarbs: 'Carbs before start',
    preMealMinutes: 'Time before start',
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/strings.ts
git commit -m "Add pl/en strings for pre-ride meal fields"
```

---

### Task 4: RoutePanel layout + new fields

**Files:**
- Modify: `src/components/RoutePanel.tsx`

**Interfaces:**
- Consumes: `route.preMealCarbs`, `route.preMealMinutes` (Task 1/2), `setPreMealCarbs`, `setPreMealMinutes` (Task 2), `strings.preMealCarbs`, `strings.preMealMinutes` (Task 3), existing `inputStyle`, `labelStyle`, `numberField`, `displayValue` helpers already in this file.

- [ ] **Step 1: Read the store setters and strings**

In the `RoutePanel()` function body, add alongside the existing `useAppStore` calls (after `const setTemp = useAppStore((s) => s.setTemp);`):

```ts
  const setPreMealCarbs = useAppStore((s) => s.setPreMealCarbs);
  const setPreMealMinutes = useAppStore((s) => s.setPreMealMinutes);
```

- [ ] **Step 2: Constrain the Intensywność/Temperatura column to a fixed width**

Find the column div (currently `flex: '1 1 210px', minWidth: 200, paddingTop: 20`, the one containing the intensity chips and the temperature slider — starts around line 150). Change its style to a fixed, non-growing width matching the intensity chip row's natural width (measured at 220px in the running app):

```ts
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '0 0 220px', width: 220, paddingTop: 20 }}>
```

(This replaces `flex: '1 1 210px', minWidth: 200` — `flex: '0 0 220px'` stops it from growing to fill the row, so the temperature slider's `width: '100%'` now resolves to 220px, matching the chip row above it.)

- [ ] **Step 3: Add the new third column for the two pre-meal fields**

Immediately after that column's closing `</div>` (and before the GPX row `<div>` that starts with `flex: '1 1 100%'`), add:

```ts
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: '1 1 140px', minWidth: 120, paddingTop: 20 }}>
        <label style={labelStyle}>
          <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.preMealCarbs} (g)</span>
          <input
            type="number"
            value={displayValue(route.preMealCarbs)}
            onChange={(e) => setPreMealCarbs(numberField(e))}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.preMealMinutes} (min)</span>
          <input
            type="number"
            value={displayValue(route.preMealMinutes)}
            onChange={(e) => setPreMealMinutes(numberField(e))}
            style={inputStyle}
          />
        </label>
      </div>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 5: Visual check in the browser**

Run: `npm run dev` (if not already running), open `http://localhost:5173/carb-planner/`.
Expected: Intensywność chip row and Temperatura slider are the same (narrower) width; a new column to their right shows "Węgle przed startem (g)" on top (prefilled `50`) and "Czas przed startem (min)" below (prefilled `45`); layout still wraps sensibly at narrow widths (the existing `flexWrap: 'wrap'` on the parent container handles this — no new wrap logic needed).

- [ ] **Step 6: Commit**

```bash
git add src/components/RoutePanel.tsx
git commit -m "Add pre-ride meal fields to RoutePanel, narrow the intensity/temp column"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass, including the 4 new `preRideGut` tests.

- [ ] **Step 2: Run the full type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual browser pass**

With `npm run dev` running: set "Węgle przed startem" to `100` and "Czas przed startem" to `20`, switch chart mode to show the gut curve (`Węglowodany (g/h)`/gut fill area), confirm it starts above zero at x=0 and drains over the first few minutes. Set "Węgle przed startem" to `0` and confirm the gut curve starts at zero again (matches pre-existing behavior).
