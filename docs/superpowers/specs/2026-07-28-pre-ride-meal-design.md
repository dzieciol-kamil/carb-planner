# Pre-ride meal (gut preload)

## Problem

The simulation in `src/domain/fuel.ts` (`samples()`) models gut contents and
absorption starting from zero at the start line (`x = 0`). In reality, riders
usually eat something (breakfast, lunch, a banana) before departure, and that
food is often still digesting when the ride starts. The app currently ignores
this, which overstates how urgently on-bike fueling is needed in the opening
minutes of a ride.

## Approach

Model the pre-ride meal as carbs already sitting in the gut at `x = 0`,
computed from how much was eaten and how long ago:

```
preRideHours = preMealMinutes / 60
gut(0) = max(0, preMealCarbs - cap * preRideHours)
```

where `cap` is the existing absorption-rate cap (`absCap(mix)`). This reuses
the existing gut → absorption pipeline unchanged: the leftover meal competes
for the same `cap` g/h absorption bandwidth as on-bike intake, exactly like
food eaten on the bike does. No new pipeline, no change to `target`
(`hrs * cph`), which stays defined as on-bike need only — consistent with the
sports-nutrition guidance it's based on (which assumes the athlete arrives
fueled).

Side effect (intentional, no extra code needed): `Chart.tsx` already renders
`gut` straight from `samples()`, so the gut curve will show a nonzero starting
level that drains over the opening minutes.

`preMealCarbs`/`preMealMinutes` do **not** feed into `totalCarbs`/`kcal` in
`planSummary()` — that figure describes what's carried and eaten on the ride,
not pre-ride food.

## Data model

`src/domain/types.ts`, `RouteInput`:
- `preMealCarbs: number` (g)
- `preMealMinutes: number` (minutes before start)

Defaults (`src/store/appStore.ts`): `preMealCarbs: 50`, `preMealMinutes: 45`.
This is a deliberate exception to the app's usual "start at zero" convention
(distance, fills, foods all start empty) — almost every rider eats something
before a ride, so a nonzero default is more honest than zero.

`fuel.ts`: `samples()` seeds `gut` at `i = 0` using the formula above instead
of `0`. One-line change plus the helper computation.

## UI

`src/components/RoutePanel.tsx`, right-hand block currently holding
Intensywność + Temperatura:

- That column currently stretches to fill all remaining card width (the temp
  slider ends up wider than the intensity chip row above it). Constrain it to
  a fixed width matching the natural width of the 3-chip intensity row
  (~220-230px) instead of flex-growing.
- Add a new third column to the right, in the space this frees up, containing
  two stacked number fields (reusing `inputStyle`/`labelStyle`, stacked
  vertically instead of side-by-side like Dystans/Prędkość):
  - "Węgle przed startem" (g) on top
  - "Czas przed startem" (min) below
- New store actions `setPreMealCarbs`, `setPreMealMinutes` analogous to
  `setTemp`/`setWeight`.
- New i18n strings (pl/en) for the two field labels.

## Testing

- `fuel.test.ts`: unit test for the `gut(0)` seed formula — zero minutes
  before start (nothing digested yet, full carbs in gut), long enough before
  start that `cap * hours >= preMealCarbs` (fully digested, gut(0) = 0), and a
  partial case in between.
- Manual check in browser: gut curve on the chart starts above zero and drains
  in the opening minutes; coverage/dry-stretch improve at the start when
  `preMealCarbs` is increased.

## Out of scope

- No change to `target`/`totalCarbs`/kcal summary figures.
- No UI for editing absorption assumptions beyond the two new fields.
- No mobile-layout-specific placement (mobile RoutePanel equivalent is
  currently hidden per commit `477cd87`).
