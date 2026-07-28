# Exponential smoothing for absorption rate (replaces centered window)

## Problem

`samples()` in `src/domain/fuel.ts` computed the displayed `rate`, `needRate`,
and `fluidRate` fields as a **centered boxcar moving average** over
`absorbed`/`need`/`ml`, with a half-width `w` (~30 minutes):

```js
const w = Math.max(2, Math.round((N * 0.5) / Math.max(0.5, hrs)));
for (let i = 0; i <= N; i++) {
  const a = Math.max(0, i - w);
  const b = Math.min(N, i + w);
  const span = (b - a) * dt;
  out[i].rate = span > 0 ? (out[b].absorbed - out[a].absorbed) / span : 0;
  ...
}
```

This caused two distinct problems, both traced with live data from the app:

1. **Future leak.** Because the window looked forward as well as backward,
   dragging an intake item earlier — even while it still started after the
   current x — raised the displayed rate *before* that intake happened. The
   chart looked like it was predicting food not yet eaten.

2. **Boxcar edge artifacts ("ghost bumps").** A hard-edged window has a
   trailing edge: when a past intake spike scrolls out of the window, the
   average jumps, with no current-time cause. Confirmed numerically: at
   x≈41.4km the `gut` had been at 0 for a while with `intake` unchanged
   (nothing new consumed), yet `rate` rose from a 60.1 g/h plateau to
   73.6 g/h — exactly ~30 min (`w` samples) after a large gel bolus at
   x≈28-29km left the trailing window. Changing the window width only moves
   *where* this happens, it doesn't remove it — it's inherent to boxcar
   windows applied to a step-shaped signal.

A first attempt made the window backward-only (causal) to fix (1), but that
still exhibited (2), and additionally made the very start of the ride
(x=0) hard-collapse to a single sample, producing a 0-or-cap toggle for the
pre-ride meal (see below) that was just as jarring as the original bug.

## Change

Replace the boxcar window entirely with an **exponential moving average**
(EMA), time constant `tau = 0.5h` (30 min, matching the previously chosen
window width):

```js
const alpha = 1 - Math.exp(-dt / tau);
rateEma += alpha * (instantaneousRate - rateEma);
```

An EMA has no fixed edge — old events fade out continuously instead of
being included-then-suddenly-excluded, so it structurally cannot produce
the ghost-bump artifact. It is also causal by construction (only ever
weights the past), so the future-leak problem doesn't reappear either.

**Pre-ride meal (start-of-ride) handling:** `preRideGut()` reduces the
pre-ride meal to a single "leftover backlog" scalar at t=0. Feeding that
directly into an EMA starting from 0 would reproduce the same 0-or-cap
threshold problem the boxcar version had (a tiny leftover vs. none at all
look wildly different). Instead, the EMA is *seeded* by numerically
simulating the meal's own digestion — same `cap`, same `dt` — backward from
when it was eaten up to the start line:

```js
let gutPre = route.preMealCarbs;
const preSteps = Math.round(route.preMealMinutes / 60 / dt);
for (let k = 0; k < preSteps; k++) {
  const take = Math.min(gutPre, cap * dt);
  gutPre -= take;
  rateEma += alpha * (take / dt - rateEma);
}
```

This makes the rate shown at x=0 a continuous function of `preMealCarbs`:
if digestion was still ongoing at full tilt right up to the start, it reads
near `cap`; if it finished a while before the start, the EMA has already
decayed down by the time the ride begins — no hard threshold.

`needRate`/`fluidRate` have no pre-ride equivalent (need and fluid intake
both start at 0 at the route start) so their EMAs simply start at 0 and
accumulate through the normal per-sample loop.

## Effects

- No more forward-leak: moving an intake item never changes the displayed
  rate at points before it.
- No more ghost bumps: verified in the browser that the previous 60.1→73.6
  g/h artifact after the gel/before the Izo segment is now a single smooth
  peak-and-decay with no secondary rise.
- Smooth start-of-ride behavior: pre-ride meal carbs no longer flip the
  displayed start rate between 0 and cap across a ~2g threshold.
- `rateStats()` (coverage %, dry-stretch detection) consumes `p.rate` /
  `p.needRate` unchanged in structure.
- The `w` variable and boxcar loop are removed entirely from `samples()`.

## Scope / out of scope

- Only `samples()` in `src/domain/fuel.ts` changes; no type or UI changes.
- `tau = 0.5h` reuses the previously agreed ~30 min smoothing scale. Not
  exposed as a tunable in this change.
- One existing test (`rateStats > zero positions in the plan`) asserted a
  `dryStretch.len` value that depended on the old windowed edge behavior;
  updated to the new (cleaner) value of exactly the ride length, which is
  what "dry stretch spans the whole ride" should mean when there's no
  intake anywhere.
