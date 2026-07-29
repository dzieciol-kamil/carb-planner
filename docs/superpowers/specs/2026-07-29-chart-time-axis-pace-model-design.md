# Design: gradient-aware time axis on the chart

Date: 2026-07-29

## Problem

The chart has a time display mode (`route.mode === 'time'` or `ui.xUnit === 'h'`), but the
time axis today is purely a linear relabeling of the distance axis: tick positions are
computed as `hh * (D / totalHours)` (`Chart.tsx`, time-tick block) and labels via
`fmtX()` dividing `km / kmh` (`fuel.ts`), where `kmh` is one constant average speed for
the whole route. Terrain (climbs, descents, flats) has zero effect on where a time tick
lands — a "2h" mark sits at the same km position whether that stretch is flat or a long
climb. This is misleading: a climb takes longer per km than a descent at the same
average speed, so time ticks should bunch closer together on climbs and spread out on
descents.

Gradient (`ProfilePoint.grad`) is already computed for every profile point in `prof()`
(`fuel.ts`), for both real GPX tracks and the synthetic demo profile. The existing
fuel-need `effort` multiplier only *applies* that gradient when `route.useGpx` is true
(`effort = route.useGpx ? ... : 1`) — and `ElevationLayer` only renders the terrain
curve at all when `route.useGpx` is true (`visible={route.useGpx}`). So whenever
`useGpx` is off, the user sees no elevation curve, and the synthetic anchor profile
(which has its own noise-driven `grad` values) is invisible scaffolding, not a route.
The new pace model must follow that same gating — apply gradient weighting only when
`route.useGpx` is true — otherwise time ticks would jitter based on synthetic noise the
user never sees or asked to be modeled, with no visible terrain to explain why.

GPX files uploaded to this app are planned routes (lat/lon/ele only — `gpx.ts` never
parses a `<time>` tag, and there is no timestamp anywhere in the data model), not
recorded rides. There is no real elapsed-time data to fall back on; time must be
estimated from the user's stated average speed plus terrain shape.

## Chosen approach

Keep the chart's X axis exactly as it is today — distance-based, points evenly spaced
by km. Only fix how time tick positions/labels are computed: instead of a constant-speed
linear relabeling, compute them from a gradient-weighted, cumulative pace estimate.

This was chosen over remapping the entire chart's X axis to a true time base (where a
climb would visually stretch and a descent compress the whole plotted curve) because:
- it's a much smaller, lower-risk change (only tick placement/labels, not the shape of
  every plotted series),
- the request is explicitly for a "good enough" hypothetical distribution, not a
  minute-precise physical simulation.

**Hard constraint (explicit from the requester):** this is a hypothetical/approximate
redistribution of time across segments — it does not need to be minute-accurate — but
the *total* estimated ride time must always exactly equal the existing
`totalHours(route)` value used everywhere else in the app. The gradient model only
redistributes that same total unevenly across segments; it must never change the total.

## Pace model

New in `src/domain/fuel.ts`, alongside the existing `effort` gradient scaling (which
uses a similar asymmetric uphill/downhill shape for a different purpose — fuel need,
not pace):

```
timeWeight(gradPercent):
  gradPercent >= 0 (uphill): 1 + gradPercent * PACE_UP_K       // PACE_UP_K = 0.10
  gradPercent <  0 (downhill): max(PACE_DOWN_FLOOR, 1 + gradPercent * PACE_DOWN_K)
                                                                 // PACE_DOWN_K = 0.07
                                                                 // PACE_DOWN_FLOOR = 0.55
```

`timeWeight` is a relative time-per-km multiplier versus flat ground (1.0 = flat pace).
A 5% climb gets weight 1.5 (50% longer per km than flat); descents get faster but are
floored at ~1.8x flat speed (`0.55` weight) to represent braking/safety limits — pace
doesn't keep increasing linearly forever on very steep descents.

These constants are not user-configurable (YAGNI — no UI control is being added). They
live in one named location in `fuel.ts` so they're easy to find and tune later if the
approximation feels off in practice.

## Data flow / implementation

In `prof()` (`fuel.ts`), alongside the existing `cum` (effort) accumulation, compute a
second raw cumulative array. Each point's pace weight is gated by `route.useGpx` exactly
like `effort` already is:

```
paceWeight[i] = route.useGpx ? timeWeight(pts[i].grad) : 1

cumTime[0] = 0
cumTime[i] = cumTime[i-1] + segmentDistanceKm * avg(paceWeight[i-1], paceWeight[i])
```

Extend `Profile` with `cumTime: number[]`.

Two new exported functions:

- `timeAtDistance(route, km): hours` — interpolates `cumTime` at `km` (same
  interpolation pattern as the existing `eff()`), then normalizes:
  `scale = totalHours(route) / cumTime[N]`, returns `interpolated * scale`. This
  guarantees `timeAtDistance(route, D) === totalHours(route)` exactly, satisfying the
  hard constraint above.
- `distanceAtTime(route, hours): km` — the inverse lookup (walk/interpolate `pts`
  against the normalized `cumTime` to find the km where cumulative time crosses
  `hours`). Needed to place chart tick gridlines at the correct km position for a given
  round-hour mark.

`fmtX()` in `fuel.ts` changes from the flat `km / kmh` division to
`fmtHM(timeAtDistance(route, km))`.

`Chart.tsx`'s time-tick generation block (currently `ticks.push(hh * kmh)`) changes to
`ticks.push(distanceAtTime(route, hh))` for each round-hour step `hh`.

## Edge cases

- `totalHours(route) === 0` (no distance/speed set yet): guard with the same
  `Math.max(0.01, ...)` pattern already used elsewhere in `fuel.ts`, avoiding
  division by zero in the normalization step.
- `route.useGpx` is false (no GPX loaded, or loaded but toggled off): `paceWeight` is 1
  everywhere (same gating as `effort`), so `cumTime` is linear in distance and
  `timeAtDistance`/`distanceAtTime` reduce to today's constant-speed behavior exactly —
  no regression for the no-elevation case.
- Flat real/synthetic profile with `useGpx` true (`grad === 0` everywhere): same result,
  `timeWeight` is 1 everywhere so `cumTime` is linear.

## Testing

The project has `vitest` with existing tests in `src/domain/fuel.test.ts`. New unit
tests will cover:
- `timeWeight` at representative gradients (flat, moderate/steep uphill, moderate/steep
  downhill, floor clamp).
- `timeAtDistance`: normalization property (`timeAtDistance(route, D) ===
  totalHours(route)` for varied gradient profiles), and that a climb segment gets a
  disproportionately large share of elapsed time versus its distance share.
- `distanceAtTime`: inverse-consistency with `timeAtDistance` (round-tripping a km
  value through both functions returns approximately the original km).
