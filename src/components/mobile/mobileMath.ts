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

export function resolveFillMove(candidateFrom: number, width: number, prevFrom: number, siblings: { from: number; to: number }[], distanceKm: number): number {
  let from = Math.max(0, Math.min(distanceKm - width, candidateFrom));
  const forward = from >= prevFrom;

  // Siblings never overlap each other, so each jump clears exactly one of them — but
  // landing just past it can land inside the next one if they're adjacent. Keep
  // resolving until nothing overlaps; bounded by sibling count since each step clears
  // one and they can't reappear.
  for (let guard = siblings.length; guard >= 0; guard--) {
    const blocker = siblings.find((s) => from < s.to && from + width > s.from);
    if (!blocker) return from;
    from = forward ? blocker.to : blocker.from - width;
    if (from < 0 || from > distanceKm - width) return prevFrom;
  }
  return prevFrom;
}

export function foodTouchHitbox(centerPx: number, neighborDistancesPx: number[]): { left: number; width: number } {
  const nearest = neighborDistancesPx.length ? Math.min(...neighborDistancesPx) : Infinity;
  const width = Math.max(18, Math.min(40, nearest));
  return { left: centerPx - width / 2, width };
}
