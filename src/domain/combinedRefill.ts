import { carbsFill, partsOf, volOf } from './fuel';
import type { CitricSource, Content, Fill, MixSettings, Vessel } from './types';

// A vessel's "start fill" is the one it's filled with before departure — the
// earliest fill on that vessel by position. A vessel with no fills yet
// contributes nothing (returns undefined) rather than throwing.
export function startFillOf(gid: string, fills: Fill[]): Fill | undefined {
  return fills.filter((f) => f.gid === gid).sort((a, b) => a.from - b.from)[0];
}

export interface CombinedMixGroup {
  content: Content;
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
  parts: number;
}

// A shared jar only makes sense for fills of the same content — a water bottle and
// an isotonic bottle are different products, not one mix split two ways — so fills
// are grouped by content before their grams get summed. The caller decides which
// fills to pass in (e.g. the start fills of a rider-picked subset of vessels) —
// this function has no opinion on selection, only on grouping/summing.
export function combinedMixGroups(
  fills: Fill[],
  gear: Vessel[],
  mix: MixSettings,
): CombinedMixGroup[] {
  const order: Content[] = ['izo', 'gel', 'water'];

  return order
    .map((content) => fills.filter((f) => f.content === content))
    .filter((group) => group.length > 0)
    .map((group) => {
      const content = group[0].content;
      let volumeMl = 0;
      let carbsG = 0;
      let saltG = 0;
      let citricG = 0;
      let parts = 0;
      const vesselNames: string[] = [];
      const ratio = content === 'gel' ? mix.gelRatio : mix.ratio;
      const perLiterSalt = content === 'gel' ? mix.gelSalt : mix.salt;
      const perLiterCitric = content === 'gel' ? mix.gelCitric : mix.citric;
      const citricSource = content === 'gel' ? mix.gelCitricSource : mix.citricSource;

      for (const f of group) {
        const vessel = gear.find((g) => g.gid === f.gid);
        const vol = volOf(f, gear);
        volumeMl += vol;
        carbsG += carbsFill(f, gear, mix);
        saltG += (vol / 100) * perLiterSalt;
        citricG += (vol / 100) * perLiterCitric;
        parts += partsOf(f, gear);
        if (vessel) vesselNames.push(vessel.name);
      }

      const r = ratio || 2;
      return {
        content,
        fillIds: group.map((f) => f.fid),
        vesselNames,
        volumeMl,
        carbsG,
        maltoG: (carbsG * r) / (r + 1),
        fructoseG: carbsG / (r + 1),
        saltG,
        citricG,
        citricSource,
        parts,
      };
    });
}
