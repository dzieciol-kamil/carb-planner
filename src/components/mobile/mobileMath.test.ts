import { describe, expect, it } from 'vitest';
import {
  clampGelPortion,
  clampStepValue,
  foodTouchHitbox,
  resolveFillMove,
  stepperStep,
} from './mobileMath';

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

describe('resolveFillMove', () => {
  // A 10km-wide fill moving over a route with one sibling occupying [30, 40].
  const sibling = [{ from: 30, to: 40 }];

  it('passes through when the candidate does not overlap anything', () => {
    expect(resolveFillMove(5, 10, 0, sibling, 100)).toBe(5);
  });

  it('jumps to just after the sibling when moving forward into it', () => {
    // prevFrom=10 -> candidate=25 would give [25,35], overlapping [30,40].
    expect(resolveFillMove(25, 10, 10, sibling, 100)).toBe(40);
  });

  it('jumps to just before the sibling when moving backward into it', () => {
    // prevFrom=50 -> candidate=35 would give [35,45], overlapping [30,40].
    expect(resolveFillMove(35, 10, 50, sibling, 100)).toBe(20);
  });

  it('touching edges exactly is not treated as an overlap', () => {
    expect(resolveFillMove(40, 10, 10, sibling, 100)).toBe(40);
    expect(resolveFillMove(20, 10, 50, sibling, 100)).toBe(20);
  });

  it('refuses the move (stays put) when there is no room on the jump side', () => {
    // Route ends at 45; jumping after [30,40] would need [40,50], which doesn't fit.
    expect(resolveFillMove(35, 10, 10, sibling, 45)).toBe(10);
  });

  it('keeps jumping past a second sibling immediately adjacent to the first', () => {
    // Two touching siblings [30,40] and [40,50]. Moving forward into the first must not
    // stop at a position that lands inside the second.
    const adjacent = [
      { from: 30, to: 40 },
      { from: 40, to: 50 },
    ];
    expect(resolveFillMove(35, 10, 10, adjacent, 100)).toBe(50);
  });

  it('keeps jumping backward past a second sibling immediately adjacent to the first', () => {
    const adjacent = [
      { from: 30, to: 40 },
      { from: 40, to: 50 },
    ];
    expect(resolveFillMove(45, 10, 70, adjacent, 100)).toBe(20);
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
