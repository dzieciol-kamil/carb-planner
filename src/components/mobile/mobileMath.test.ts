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
