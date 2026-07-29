# Shop (resupply) markers — design

## Purpose

Let the user mark known resupply points (e.g. a shop at 50 km) directly on the fuel/route chart. Purely a visual reference note for this iteration — it does not affect any fuel/hydration calculations. Follow-up idea (deferred, see memory `project_chart-resupply-markers`) is to have a marker actually reset carried-water accounting; explicitly out of scope here.

## Data model

New type in `src/domain/types.ts`, independent of `PlanState` (it does not feed `fuel.ts`):

```ts
export interface ShopStop {
  id: number;
  at: number; // distance in km from start
}
```

`src/store/appStore.ts` additions:
- `shops: ShopStop[]` (persisted, same as `foods`/`fills`)
- `nextShopId: number`
- `addShop(): void` — see default placement below
- `moveShop(id: number, at: number): void`
- `removeShop(id: number): void`

## Default placement on add

New marker is placed at the midpoint between the **last existing marker** (by `at`, or the route start `0` if there are none) and the **route end** (`dist(route)`). This means repeated clicks on "+" keep filling in the remaining tail of the route rather than clustering at a fixed point.

```ts
const lastAt = shops.length ? Math.max(...shops.map((s) => s.at)) : 0;
const at = (lastAt + dist(route)) / 2;
```

## Visual design

Rendered directly over the chart plot (not in a lane row under it, unlike fills/foods):

- **Line**: solid, dark gray (`CHART_COLORS.ink`), ~1.5px, full plot height — from `y=0` to the chart baseline (`height - PB`), at `x = px(shop.at)`.
- **Pin**: classic map-pin/teardrop shape (circle with a point facing down, touching the top of the line), ~14–16px, same dark color, sitting at `y=0`.
- **Hover** over the pin: shows a small ✕ remove button, same visual pattern as `delButtonStyle` in `FillBar`/`FoodBar`.
- **Drag**: pointer-down on the pin starts a drag (reuse the `pointermove`/`pointerup` window-listener pattern from `dragHandlers.ts`), moving the marker horizontally, clamped to `[0, dist(route)]`. While dragging, a small floating label near the pin shows the live distance (e.g. `42 km`).
- **Add button**: top-right corner of the chart plot, vertically aligned with the pins, styled like the vessel "+" button in `LanesSection` (dashed border, `addButtonStyle`). Click calls `addShop()`.

No name/label field, no library, no lane row — just a draggable, removable point marker.

## Files touched

- `src/domain/types.ts` — add `ShopStop`.
- `src/store/appStore.ts` — state + `addShop`/`moveShop`/`removeShop`, persisted.
- `src/components/lanes/dragHandlers.ts` — add `createShopDragHandler` (simplified `createFoodDragHandler`: move only, no resize, no siblings).
- `src/components/chart/ShopMarkers.tsx` — new overlay component: renders line + pin + add button for all `shops`.
- `src/components/chart/ChartCard.tsx` — wrap the chart container in `position: relative` and render `<ShopMarkers />` alongside `<Chart />`.

## Out of scope

- Any effect on `fuel.ts` samples, hydration %, or bottle/carry accounting.
- Naming/labeling markers.
- Snapping/collision avoidance between markers or with fills/foods.
