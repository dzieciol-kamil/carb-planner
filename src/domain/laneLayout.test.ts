import { describe, expect, test } from 'vitest';
import { packFoodRows } from './laneLayout';
import type { FoodItem } from './types';

function food(overrides: Partial<FoodItem>): FoodItem {
  return { id: 1, key: 'ban', name: 'Banana', carbs: 25, from: 0, to: 0, ...overrides };
}

describe('packFoodRows', () => {
  test('non-overlapping items stay on a single row', () => {
    const foods = [food({ id: 1, from: 10, to: 10 }), food({ id: 2, from: 50, to: 50 })];
    expect(packFoodRows(foods, 100)).toEqual([[foods[0], foods[1]]]);
  });

  test('overlapping items spill into a second row', () => {
    const a = food({ id: 1, from: 10, to: 10 });
    const b = food({ id: 2, from: 12, to: 12 }); // within the 5%-of-distance minimum width of `a`
    const rows = packFoodRows([a, b], 100);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual([a]);
    expect(rows[1]).toEqual([b]);
  });

  test('empty input still returns one empty row', () => {
    expect(packFoodRows([], 100)).toEqual([[]]);
  });
});
