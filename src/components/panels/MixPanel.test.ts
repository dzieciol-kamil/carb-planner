import { describe, expect, test } from 'vitest';
import { roundCitricDisplay } from './MixPanel';

describe('roundCitricDisplay', () => {
  test('rounds the fruit-unit percentage display to the nearest whole percent, not the nearest 25', () => {
    // Regression: this used to round to the nearest 25 (a quarter-fruit expressed as a
    // percentage), which silently zeroed out any real setting under 12.5%. The default
    // 0.2g/100ml citric setting for lemon is ~8.9%, which must display as "9", not "0".
    expect(roundCitricDisplay(8.9, 'fruit')).toBe(9);
    expect(roundCitricDisplay(0.4, 'fruit')).toBe(0);
    expect(roundCitricDisplay(12.4, 'fruit')).toBe(12);
    expect(roundCitricDisplay(12.6, 'fruit')).toBe(13);
  });

  test('ml unit still rounds to one decimal place', () => {
    expect(roundCitricDisplay(3.3333333333333335, 'ml')).toBe(3.3);
    expect(roundCitricDisplay(0.42999999999999994, 'ml')).toBe(0.4);
  });

  test('g unit still rounds to two decimal places', () => {
    expect(roundCitricDisplay(0.20199999999999999, 'g')).toBe(0.2);
  });
});
