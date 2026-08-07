import { describe, expect, test } from 'vitest';
import { combinedMixGroups, startFillOf } from './combinedRefill';
import type { Fill, MixSettings, Vessel } from './types';

const mix: MixSettings = {
  conc: 8,
  gelConc: 60,
  ratio: 2,
  gelRatio: 2,
  salt: 0.4,
  citric: 0.4,
  gelSalt: 0.4,
  gelCitric: 0.4,
  citricSource: 'citric',
  gelCitricSource: 'citric',
};

const gear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 600, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g2', name: 'Flask', vol: 250, allowed: ['izo', 'water', 'gel'], gelParts: 4 },
  { gid: 'g3', name: 'Aero', vol: 500, allowed: ['water', 'izo'], gelParts: 4 },
];

describe('startFillOf', () => {
  test('returns the earliest fill for a vessel', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 40, to: 60 },
      { fid: 2, gid: 'g1', content: 'water', from: 0, to: 25 },
    ];
    expect(startFillOf('g1', fills)?.fid).toBe(2);
  });

  test('returns undefined for a vessel with no fills', () => {
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 }];
    expect(startFillOf('g2', fills)).toBeUndefined();
  });

  test('ignores fills belonging to other vessels', () => {
    const fills: Fill[] = [{ fid: 1, gid: 'g2', content: 'izo', from: 0, to: 25 }];
    expect(startFillOf('g1', fills)).toBeUndefined();
  });
});

describe('combinedMixGroups', () => {
  test('sums grams across a rider-picked set of start fills with the same content', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'izo', from: 0, to: 20 },
    ];
    const groups = combinedMixGroups(fills, gear, mix);
    expect(groups).toHaveLength(1);
    const [izo] = groups;
    expect(izo.content).toBe('izo');
    expect(izo.fillIds).toEqual([1, 2]);
    expect(izo.vesselNames).toEqual(['Bidon', 'Flask']);
    // 600ml + 250ml = 850ml @ 8g/100ml => 68g
    expect(izo.volumeMl).toBe(850);
    expect(izo.carbsG).toBeCloseTo(68, 5);
    expect(izo.maltoG + izo.fructoseG).toBeCloseTo(izo.carbsG, 5);
    expect(izo.maltoG).toBeCloseTo(izo.carbsG * (2 / 3), 5);
    expect(izo.saltG).toBeCloseTo((850 / 100) * 0.4, 5);
    expect(izo.citricG).toBeCloseTo((850 / 100) * 0.4, 5);
  });

  test('keeps different contents in separate groups instead of merging them', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'water', from: 0, to: 0 },
      { fid: 3, gid: 'g3', content: 'gel', from: 0, to: 10 },
    ];
    const groups = combinedMixGroups(fills, gear, mix);
    const contents = groups.map((g) => g.content);
    expect(contents).toEqual(['izo', 'gel', 'water']);
    expect(groups.find((g) => g.content === 'water')?.volumeMl).toBe(250);
    expect(groups.find((g) => g.content === 'gel')?.parts).toBe(4);
  });

  test('an empty selection produces no groups', () => {
    expect(combinedMixGroups([], gear, mix)).toEqual([]);
  });

  test('a single selected fill still forms a one-bottle group', () => {
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 }];
    const groups = combinedMixGroups(fills, gear, mix);
    expect(groups).toHaveLength(1);
    expect(groups[0].vesselNames).toEqual(['Bidon']);
  });

  test('gel groups use gelRatio and gelCitricSource, izo groups use ratio and citricSource', () => {
    const divergentMix: MixSettings = {
      ...mix,
      ratio: 2,
      gelRatio: 1,
      citricSource: 'citric',
      gelCitricSource: 'lime',
    };
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 },
    ];
    const groups = combinedMixGroups(fills, gear, divergentMix);
    const izo = groups.find((g) => g.content === 'izo')!;
    const gel = groups.find((g) => g.content === 'gel')!;

    // izo: ratio 2:1 -> malto is 2/3 of carbs
    expect(izo.maltoG).toBeCloseTo(izo.carbsG * (2 / 3), 5);
    expect(izo.citricSource).toBe('citric');

    // gel: gelRatio 1:1 -> malto is 1/2 of carbs, independent of izo's ratio
    expect(gel.maltoG).toBeCloseTo(gel.carbsG * (1 / 2), 5);
    expect(gel.citricSource).toBe('lime');
  });

  test('typical usage: caller resolves selected vessel ids to start fills first', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g1', content: 'izo', from: 40, to: 60 }, // a later refill, not the start fill
      { fid: 3, gid: 'g2', content: 'izo', from: 0, to: 20 },
    ];
    const selectedGids = ['g1', 'g2'];
    const starts = selectedGids
      .map((gid) => startFillOf(gid, fills))
      .filter((f): f is Fill => f != null);
    expect(starts.map((f) => f.fid)).toEqual([1, 3]);

    const groups = combinedMixGroups(starts, gear, mix);
    expect(groups).toHaveLength(1);
    expect(groups[0].volumeMl).toBe(850);
  });
});
