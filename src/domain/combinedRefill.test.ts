import { describe, expect, test } from 'vitest';
import {
  combineNeedsConfirm,
  combinedGroups,
  mixSettingsMatch,
  startFillOf,
} from './combinedRefill';
import type { Fill, MixSettings, Vessel } from './types';

const mix: MixSettings = {
  conc: 8,
  gelConc: 60,
  ratio: 2,
  gelRatio: 2,
  ratioPreset: 'iso',
  gelRatioPreset: 'iso',
  salt: 0.4,
  citric: 0.4,
  gelSalt: 0.4,
  gelCitric: 0.4,
  citricSource: 'citric',
  gelCitricSource: 'citric',
};

const gear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
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

describe('mixSettingsMatch', () => {
  test('true when izo and gel ratio/salt/citric/citricSource are all identical', () => {
    expect(mixSettingsMatch(mix)).toBe(true);
  });

  test('false when ratio differs', () => {
    expect(mixSettingsMatch({ ...mix, gelRatio: 1 })).toBe(false);
  });

  test('false when salt differs', () => {
    expect(mixSettingsMatch({ ...mix, gelSalt: 0.1 })).toBe(false);
  });

  test('false when citric differs', () => {
    expect(mixSettingsMatch({ ...mix, gelCitric: 0.1 })).toBe(false);
  });

  test('false when citricSource differs', () => {
    expect(mixSettingsMatch({ ...mix, gelCitricSource: 'lime' })).toBe(false);
  });

  test('concentration (conc/gelConc) is not part of the comparison', () => {
    expect(mixSettingsMatch({ ...mix, gelConc: 90 })).toBe(true);
  });
});

describe('combineNeedsConfirm', () => {
  test('false for izo-only selections', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'izo', from: 0, to: 20 },
    ];
    expect(combineNeedsConfirm(fills, mix)).toBe(false);
  });

  test('false for gel-only selections', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g2', content: 'gel', from: 0, to: 10 },
      { fid: 2, gid: 'g3', content: 'gel', from: 0, to: 15 },
    ];
    expect(combineNeedsConfirm(fills, mix)).toBe(false);
  });

  test('false for izo+gel when settings already match', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 },
    ];
    expect(combineNeedsConfirm(fills, mix)).toBe(false);
  });

  test('true for izo+gel when settings differ', () => {
    const divergentMix: MixSettings = { ...mix, gelRatio: 1 };
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 },
    ];
    expect(combineNeedsConfirm(fills, divergentMix)).toBe(true);
  });

  test('false for izo+water (no gel involved)', () => {
    const divergentMix: MixSettings = { ...mix, gelRatio: 1 };
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'water', from: 0, to: 10 },
    ];
    expect(combineNeedsConfirm(fills, divergentMix)).toBe(false);
  });
});

describe('combinedGroups', () => {
  test('an empty selection produces no groups', () => {
    expect(combinedGroups([], gear, mix)).toEqual([]);
  });

  test('a single selected fill still forms a one-bottle group with no pours', () => {
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 }];
    const groups = combinedGroups(fills, gear, mix);
    expect(groups).toHaveLength(1);
    expect(groups[0].vesselNames).toEqual(['Bidon']);
    expect(groups[0].pours).toBeUndefined();
  });

  test('sums grams across same-content fills and keeps content types apart', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'izo', from: 0, to: 20 },
    ];
    const groups = combinedGroups(fills, gear, mix);
    expect(groups).toHaveLength(1);
    const [izo] = groups;
    expect(izo.content).toBe('izo');
    expect(izo.fillIds).toEqual([1, 2]);
    expect(izo.vesselNames).toEqual(['Bidon', 'Flask']);
    // 650ml + 250ml = 900ml @ 8g/100ml => 72g
    expect(izo.volumeMl).toBe(900);
    expect(izo.carbsG).toBeCloseTo(72, 5);
    expect(izo.maltoG + izo.fructoseG).toBeCloseTo(izo.carbsG, 5);
    expect(izo.maltoG).toBeCloseTo(izo.carbsG * (2 / 3), 5);
    expect(izo.saltG).toBeCloseTo((900 / 100) * 0.4, 5);
    expect(izo.citricG).toBeCloseTo((900 / 100) * 0.4, 5);
  });

  test('water stays its own group, never merged into izo/gel, contributing only volume', () => {
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
      { fid: 2, gid: 'g2', content: 'water', from: 0, to: 0 },
      { fid: 3, gid: 'g3', content: 'gel', from: 0, to: 10 },
    ];
    const groups = combinedGroups(fills, gear, mix);
    const contents = groups.map((g) => g.content);
    // izo+gel merge into 'mixed' (settings match here), water stays separate
    expect(contents.sort()).toEqual(['mixed', 'water']);
    const waterGroup = groups.find((g) => g.content === 'water')!;
    expect(waterGroup.volumeMl).toBe(250);
    expect(waterGroup.carbsG).toBe(0);
    expect(waterGroup.saltG).toBe(0);
    expect(waterGroup.citricG).toBe(0);
  });

  test('gel-only groups report a parts count, izo groups do not', () => {
    const fills: Fill[] = [{ fid: 1, gid: 'g2', content: 'gel', from: 0, to: 10 }];
    const [gel] = combinedGroups(fills, gear, mix);
    expect(gel.content).toBe('gel');
    expect(gel.parts).toBe(4);

    const [izo] = combinedGroups(
      [{ fid: 2, gid: 'g1', content: 'izo', from: 0, to: 10 }],
      gear,
      mix,
    );
    expect(izo.parts).toBeUndefined();
  });

  describe('izo+gel cross-type combining', () => {
    test('combines into a single "mixed" group when settings already match', () => {
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
        { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 },
      ];
      const groups = combinedGroups(fills, gear, mix);
      expect(groups).toHaveLength(1);
      expect(groups[0].content).toBe('mixed');
      expect(groups[0].settingsMismatched).toBe(false);
      expect(groups[0].fillIds).toEqual([1, 2]);
    });

    test("total carbs respects each fill's own concentration (izo conc vs gelConc)", () => {
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 }, // 650ml @ 8g/100ml = 52g
        { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 }, // 250ml @ 60g/100ml = 150g
      ];
      const [mixed] = combinedGroups(fills, gear, mix);
      expect(mixed.carbsG).toBeCloseTo(52 + 150, 5);
      expect(mixed.volumeMl).toBe(900);
    });

    test("malto:fructose split, salt and citric use izo's settings, not gel's, when they differ", () => {
      const divergentMix: MixSettings = {
        ...mix,
        ratio: 3, // izo: malto is 3/4 of carbs
        gelRatio: 1, // gel's own ratio would be 1/2 — must NOT be used
        salt: 0.5,
        gelSalt: 0.1,
        citric: 0.6,
        gelCitric: 0.05,
        citricSource: 'citric',
        gelCitricSource: 'lime',
      };
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
        { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 },
      ];
      const [mixed] = combinedGroups(fills, gear, divergentMix);
      expect(mixed.settingsMismatched).toBe(true);
      expect(mixed.maltoG).toBeCloseTo(mixed.carbsG * (3 / 4), 5);
      expect(mixed.saltG).toBeCloseTo((mixed.volumeMl / 100) * 0.5, 5);
      expect(mixed.citricG).toBeCloseTo((mixed.volumeMl / 100) * 0.6, 5);
      expect(mixed.citricSource).toBe('citric');
    });

    test('three or more fills across both types still merge into one mixed group', () => {
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
        { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 },
        { fid: 3, gid: 'g3', content: 'izo', from: 0, to: 20 },
      ];
      const groups = combinedGroups(fills, gear, mix);
      expect(groups).toHaveLength(1);
      expect(groups[0].fillIds).toEqual([1, 3, 2]);
    });
  });

  describe('proportional pour split per container', () => {
    test('even split across equal-volume vessels', () => {
      const equalGear: Vessel[] = [
        { gid: 'g1', name: 'Bidon A', vol: 650, allowed: ['izo'], gelParts: 4 },
        { gid: 'g4', name: 'Bidon B', vol: 650, allowed: ['izo'], gelParts: 4 },
      ];
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
        { fid: 2, gid: 'g4', content: 'izo', from: 0, to: 20 },
      ];
      const [izo] = combinedGroups(fills, equalGear, mix);
      expect(izo.pours).toHaveLength(2);
      for (const pour of izo.pours!) {
        expect(pour.fraction).toBeCloseTo(0.5, 5);
        expect(pour.volumeMl).toBe(650);
        expect(pour.carbsG).toBeCloseTo(izo.carbsG / 2, 5);
      }
    });

    test("uneven split across different-volume vessels, reconciling with each fill's own standalone numbers", () => {
      // 650ml Bidon + 250ml Flask, same content (izo) => Bidon 72.2%, Flask 27.8%
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 },
        { fid: 2, gid: 'g2', content: 'izo', from: 0, to: 20 },
      ];
      const [izo] = combinedGroups(fills, gear, mix);
      const bidonPour = izo.pours!.find((p) => p.gid === 'g1')!;
      const flaskPour = izo.pours!.find((p) => p.gid === 'g2')!;
      expect(bidonPour.fraction).toBeCloseTo(650 / 900, 5);
      expect(flaskPour.fraction).toBeCloseTo(250 / 900, 5);
      expect(bidonPour.volumeMl).toBe(650);
      expect(flaskPour.volumeMl).toBe(250);
      // Same-content combining reconciles exactly with each fill's own standalone carbsFill:
      // 650ml @ 8g/100ml = 52g, 250ml @ 8g/100ml = 20g.
      expect(bidonPour.carbsG).toBeCloseTo(52, 5);
      expect(flaskPour.carbsG).toBeCloseTo(20, 5);
      expect(bidonPour.carbsG + flaskPour.carbsG).toBeCloseTo(izo.carbsG, 5);
    });

    test("cross-type-with-override: pour amounts differ from each fill's own standalone (izo-settings) recipe", () => {
      const divergentMix: MixSettings = { ...mix, gelRatio: 1, gelSalt: 0.1 };
      const fills: Fill[] = [
        { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 }, // 650ml
        { fid: 2, gid: 'g2', content: 'gel', from: 0, to: 10 }, // 250ml
      ];
      const [mixed] = combinedGroups(fills, gear, divergentMix);
      const izoPour = mixed.pours!.find((p) => p.gid === 'g1')!;
      const gelPour = mixed.pours!.find((p) => p.gid === 'g2')!;

      // Volume split still 650/900, 250/900 regardless of content.
      expect(izoPour.fraction).toBeCloseTo(650 / 900, 5);
      expect(gelPour.fraction).toBeCloseTo(250 / 900, 5);
      expect(izoPour.volumeMl).toBe(650);
      expect(gelPour.volumeMl).toBe(250);
      expect(izoPour.carbsG + gelPour.carbsG).toBeCloseTo(mixed.carbsG, 5);

      // The gel bottle's own standalone (gel-settings) recipe would have been 250ml @
      // 60g/100ml = 150g, split 1:1 malto:fructose. Once combined, the pour is a
      // proportional slice of the whole (izo+gel) batch's total, not that standalone
      // figure — a real, expected difference, not a bug.
      const standaloneGelCarbs = (250 / 100) * mix.gelConc;
      expect(gelPour.carbsG).not.toBeCloseTo(standaloneGelCarbs, 1);
    });

    test('a single-fill group (no combining) has no pours to show', () => {
      const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 25 }];
      const [izo] = combinedGroups(fills, gear, mix);
      expect(izo.pours).toBeUndefined();
    });
  });
});
