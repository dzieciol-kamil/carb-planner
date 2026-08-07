import { carbsFill, partsOf, volOf } from './fuel';
import type { CitricSource, Content, Fill, MixSettings, Vessel } from './types';

// A vessel's "start fill" is the one it's filled with before departure — the
// earliest fill on that vessel by position. A vessel with no fills yet
// contributes nothing (returns undefined) rather than throwing. Kept mainly
// for the persisted-state migration from the old per-vessel-start combine
// model (see appStore's persist `migrate`) — the live UI now lets the rider
// pick any fill, not just each vessel's first one.
export function startFillOf(gid: string, fills: Fill[]): Fill | undefined {
  return fills.filter((f) => f.gid === gid).sort((a, b) => a.from - b.from)[0];
}

/**
 * Whether izo and gel currently share one recipe (ratio, salt, citric amount, citric
 * source). When they don't, combining an izo fill with a gel fill needs the rider's
 * go-ahead first (see `combineNeedsConfirm`) because the combined batch has to pick one
 * set of numbers to compute under — izo's, by convention (see `combinedGroups`).
 */
export function mixSettingsMatch(mix: MixSettings): boolean {
  return (
    mix.ratio === mix.gelRatio &&
    mix.salt === mix.gelSalt &&
    mix.citric === mix.gelCitric &&
    mix.citricSource === mix.gelCitricSource
  );
}

// Whether the given (already-selected-plus-candidate) set of fills would newly combine
// izo with gel under mismatched settings — the trigger for showing a confirmation before
// the checkbox that caused it is actually applied. Same-content combining (izo+izo,
// gel+gel) never needs this: there's only one relevant settings set already.
export function combineNeedsConfirm(fills: Fill[], mix: MixSettings): boolean {
  const contents = new Set(fills.map((f) => f.content));
  return contents.has('izo') && contents.has('gel') && !mixSettingsMatch(mix);
}

export interface ContainerPour {
  fid: number;
  gid: string;
  vesselName: string;
  /** 0-1 share of the group's total volume this container receives. */
  fraction: number;
  volumeMl: number;
  carbsG: number;
  maltoG: number;
  fructoseG: number;
  saltG: number;
  citricG: number;
}

export interface CombinedGroup {
  /** 'mixed' is an izo+gel batch combined under one shared recipe (see `mixSettingsMatch`). */
  content: Content | 'mixed';
  fillIds: number[];
  vesselNames: string[];
  volumeMl: number;
  carbsG: number;
  maltoG: number;
  fructoseG: number;
  saltG: number;
  /** Citric-acid-equivalent grams — feed this into `citricAmount()` along with `citricSource`
   *  to get the practical amount (g / ml / fraction of a fruit) for the group's actual source. */
  citricG: number;
  citricSource: CitricSource;
  /** Gel portions, summed — only meaningful for a pure 'gel' group; omitted otherwise. */
  parts?: number;
  /** True for a 'mixed' group whose izo and gel settings actually differed, i.e. one that
   *  needed (and got) rider confirmation before combining — informational, for UI copy. */
  settingsMismatched?: boolean;
  /** How to split this group's totals across the containers that make it up, proportional
   *  to each container's own volume share of the group's total volume. Omitted when the
   *  group is a single fill (nothing to split). */
  pours?: ContainerPour[];
}

interface GroupTotals {
  volumeMl: number;
  carbsG: number;
  maltoG: number;
  fructoseG: number;
  saltG: number;
  citricG: number;
}

function pourFor(fills: Fill[], gear: Vessel[], totals: GroupTotals): ContainerPour[] | undefined {
  if (fills.length < 2) return undefined;
  return fills.map((f) => {
    const vessel = gear.find((g) => g.gid === f.gid);
    const vol = volOf(f, gear);
    const fraction = totals.volumeMl > 0 ? vol / totals.volumeMl : 0;
    return {
      fid: f.fid,
      gid: f.gid,
      vesselName: vessel?.name || '',
      fraction,
      volumeMl: vol,
      carbsG: totals.carbsG * fraction,
      maltoG: totals.maltoG * fraction,
      fructoseG: totals.fructoseG * fraction,
      saltG: totals.saltG * fraction,
      citricG: totals.citricG * fraction,
    };
  });
}

function totalsOf(
  group: Fill[],
  gear: Vessel[],
  mix: MixSettings,
  ratio: number,
  perLiterSalt: number,
  perLiterCitric: number,
): GroupTotals {
  let volumeMl = 0;
  let carbsG = 0;
  for (const f of group) {
    volumeMl += volOf(f, gear);
    carbsG += carbsFill(f, gear, mix);
  }
  const r = ratio || 2;
  return {
    volumeMl,
    carbsG,
    maltoG: (carbsG * r) / (r + 1),
    fructoseG: carbsG / (r + 1),
    saltG: (volumeMl / 100) * perLiterSalt,
    citricG: (volumeMl / 100) * perLiterCitric,
  };
}

function vesselNamesOf(group: Fill[], gear: Vessel[]): string[] {
  return group
    .map((f) => gear.find((g) => g.gid === f.gid)?.name)
    .filter((n): n is string => n != null);
}

// A shared jar only makes sense for fills of the same content, EXCEPT izo and gel, which
// (per rider feedback) still get poured into one jar together despite being different
// products — you're mixing everything you're carrying into one batch regardless of what
// it started as. Water stays out of that batch: a plain water bottle isn't a "recipe", so
// it's always its own group, contributing only volume, same as a standalone water fill's
// own card. The caller decides which fills to pass in (i.e. the rider-picked selection) —
// this function has no opinion on selection, only on grouping/summing/pours.
export function combinedGroups(fills: Fill[], gear: Vessel[], mix: MixSettings): CombinedGroup[] {
  const groups: CombinedGroup[] = [];

  const water = fills.filter((f) => f.content === 'water');
  if (water.length > 0) {
    const totals = totalsOf(water, gear, mix, 1, 0, 0);
    groups.push({
      content: 'water',
      fillIds: water.map((f) => f.fid),
      vesselNames: vesselNamesOf(water, gear),
      ...totals,
      citricSource: mix.citricSource,
      pours: pourFor(water, gear, totals),
    });
  }

  const izo = fills.filter((f) => f.content === 'izo');
  const gel = fills.filter((f) => f.content === 'gel');

  if (izo.length > 0 && gel.length > 0) {
    // Izo's settings are the shared recipe's basis (ratio, salt-per-liter, citric-per-liter,
    // citric source) — concentration is NOT one of those (each fill's own carbsG below still
    // reflects its own content's concentration setting, via carbsFill); only how the batch's
    // malto:fructose split, salt, and citric are dosed gets unified. Gel's own settings aren't
    // touched globally, just not used for this particular combined calculation.
    const group = izo.concat(gel);
    const totals = totalsOf(group, gear, mix, mix.ratio, mix.salt, mix.citric);
    groups.push({
      content: 'mixed',
      fillIds: group.map((f) => f.fid),
      vesselNames: vesselNamesOf(group, gear),
      ...totals,
      citricSource: mix.citricSource,
      settingsMismatched: !mixSettingsMatch(mix),
      pours: pourFor(group, gear, totals),
    });
  } else {
    if (izo.length > 0) {
      const totals = totalsOf(izo, gear, mix, mix.ratio, mix.salt, mix.citric);
      groups.push({
        content: 'izo',
        fillIds: izo.map((f) => f.fid),
        vesselNames: vesselNamesOf(izo, gear),
        ...totals,
        citricSource: mix.citricSource,
        pours: pourFor(izo, gear, totals),
      });
    }
    if (gel.length > 0) {
      const totals = totalsOf(gel, gear, mix, mix.gelRatio, mix.gelSalt, mix.gelCitric);
      groups.push({
        content: 'gel',
        fillIds: gel.map((f) => f.fid),
        vesselNames: vesselNamesOf(gel, gear),
        ...totals,
        citricSource: mix.gelCitricSource,
        parts: gel.reduce((a, f) => a + partsOf(f, gear), 0),
        pours: pourFor(gel, gear, totals),
      });
    }
  }

  const order: (Content | 'mixed')[] = ['izo', 'gel', 'mixed', 'water'];
  return groups.sort((a, b) => order.indexOf(a.content) - order.indexOf(b.content));
}
