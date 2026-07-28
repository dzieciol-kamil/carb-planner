import type { Content, Fill, FoodItem, MixSettings, PlanState, RouteInput, Vessel, XUnit } from './types';

const FLUID_ABSORPTION_CAP_ML_H = 750;
const PROFILE_SAMPLES = 160;

export interface ProfilePoint {
  x: number;
  ele: number;
  grad: number;
  effort: number;
}

export interface Profile {
  pts: ProfilePoint[];
  cum: number[];
  N: number;
  D: number;
}

export type ActiveSource = Content | 'food' | null;

export interface Sample {
  x: number;
  intake: number;
  absorbed: number;
  gut: number;
  ml: number;
  need: number;
  active: ActiveSource;
  rate: number;
  needRate: number;
  fluidRate: number;
  sweatRate: number;
}

export interface RateStats {
  coverage: number;
  dryStretch: { len: number; x: number };
  samples: Sample[];
}

export function totalHours(route: RouteInput): number {
  if (route.mode === 'route') return route.speed > 0 ? route.distance / route.speed : 0;
  return (route.hours || 0) + (route.minutes || 0) / 60;
}

export function dist(route: RouteInput): number {
  if (route.mode === 'route') return Math.max(1, route.distance);
  return Math.max(1, Math.round(totalHours(route) * 10));
}

export function cph(route: RouteInput): number {
  const h = totalHours(route);
  const i = route.intensity;
  if (h < 1) return i === 'high' ? 60 : i === 'low' ? 30 : 45;
  if (h <= 2.5) return i === 'low' ? 30 : i === 'high' ? 60 : 45;
  return i === 'low' ? 60 : i === 'high' ? 90 : 75;
}

export function sweat(route: RouteInput): number {
  const base = 380 + Math.max(0, route.temp - 15) * 42;
  const iB = route.intensity === 'high' ? 220 : route.intensity === 'low' ? 0 : 110;
  return Math.round(((base + iB) * (route.weight / 75)) / 10) * 10;
}

export function absCap(mix: MixSettings): number {
  const r = mix.ratio || 2;
  const glu = r / (r + 1);
  const fru = 1 / (r + 1);
  return Math.round(Math.max(45, Math.min(95, Math.min(60 / glu, 32 / fru))));
}

const SYNTHETIC_ANCHORS: [number, number][] = [
  [0, 120],
  [0.1, 165],
  [0.16, 185],
  [0.3, 620],
  [0.38, 300],
  [0.5, 345],
  [0.56, 300],
  [0.72, 900],
  [0.8, 520],
  [0.88, 610],
  [1, 140],
];

export function prof(route: RouteInput): Profile {
  const T = route.gpxTrack;
  const D = dist(route);
  const N = PROFILE_SAMPLES;
  const pts: ProfilePoint[] = [];

  for (let i = 0; i <= N; i++) {
    const f = i / N;
    if (T) {
      const g = f * (T.ele.length - 1);
      const a = Math.floor(g);
      const b = Math.min(T.ele.length - 1, a + 1);
      pts.push({ x: D * f, ele: T.ele[a] + (T.ele[b] - T.ele[a]) * (g - a), grad: 0, effort: 1 });
      continue;
    }
    let j = 1;
    while (j < SYNTHETIC_ANCHORS.length - 1 && SYNTHETIC_ANCHORS[j][0] < f) j++;
    const [f0, e0] = SYNTHETIC_ANCHORS[j - 1];
    const [f1, e1] = SYNTHETIC_ANCHORS[j];
    const k = (f - f0) / (f1 - f0);
    const noise = Math.sin(f * 91) * 16 + Math.sin(f * 233) * 8 + Math.sin(f * 37) * 22;
    pts.push({ x: D * f, ele: Math.max(40, e0 + (e1 - e0) * k + noise), grad: 0, effort: 1 });
  }

  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(N, i + 1)];
    const dx = (b.x - a.x) * 1000;
    pts[i].grad = dx > 0 ? ((b.ele - a.ele) / dx) * 100 : 0;
    pts[i].effort = route.useGpx ? Math.max(0.32, Math.min(2.3, 1 + pts[i].grad * (pts[i].grad > 0 ? 0.19 : 0.11))) : 1;
  }

  const cum = [0];
  for (let i = 1; i <= N; i++) cum[i] = cum[i - 1] + (pts[i].effort + pts[i - 1].effort) / 2;

  return { pts, cum, N, D };
}

export function eff(route: RouteInput, x: number): number {
  const P = prof(route);
  const f = Math.max(0, Math.min(1, x / P.D)) * P.N;
  const i = Math.floor(f);
  if (i >= P.N) return P.cum[P.N];
  return P.cum[i] + (P.cum[i + 1] - P.cum[i]) * (f - i);
}

function effTotal(route: RouteInput): number {
  const P = prof(route);
  return P.cum[P.N] || 1;
}

function findVessel(gid: string, gear: Vessel[]): Vessel | undefined {
  return gear.find((g) => g.gid === gid);
}

function volOf(fill: Fill, gear: Vessel[]): number {
  const v = findVessel(fill.gid, gear);
  return v ? v.vol : 0;
}

export function carbsFill(fill: Fill, gear: Vessel[], mix: MixSettings): number {
  if (fill.content === 'water') return 0;
  return (volOf(fill, gear) / 100) * (fill.content === 'gel' ? mix.gelConc : mix.conc);
}

function partsOf(fill: Fill, gear: Vessel[]): number {
  if (fill.content !== 'gel') return 1;
  const v = findVessel(fill.gid, gear);
  return Math.max(1, Math.round((v && v.gelParts) || 1));
}

function partPos(fill: Fill, k: number, gear: Vessel[]): number {
  const n = partsOf(fill, gear);
  if (n <= 1) return fill.from;
  const even = fill.from + ((fill.to - fill.from) * k) / (n - 1);
  if (!fill.pos || fill.pos.length !== n || fill.pos[k] == null) return even;
  return Math.max(fill.from, Math.min(fill.to, fill.pos[k]));
}

export function fracFill(fill: Fill, x: number, gear: Vessel[], route: RouteInput): number {
  const n = partsOf(fill, gear);
  if (n > 1) {
    let c = 0;
    for (let k = 0; k < n; k++) if (x >= partPos(fill, k, gear)) c++;
    return c / n;
  }
  if (fill.to <= fill.from) return x >= fill.from ? 1 : 0;
  const a = eff(route, fill.from);
  const b = eff(route, fill.to);
  if (b <= a) return x >= fill.from ? 1 : 0;
  return Math.max(0, Math.min(1, (eff(route, x) - a) / (b - a)));
}

export function fracFood(food: FoodItem, x: number, route: RouteInput): number {
  if (!food.cont || food.to <= food.from) return x >= food.from ? 1 : 0;
  const a = eff(route, food.from);
  const b = eff(route, food.to);
  if (b <= a) return x >= food.from ? 1 : 0;
  return Math.max(0, Math.min(1, (eff(route, x) - a) / (b - a)));
}

export function samples(state: PlanState): Sample[] {
  const { route, mix, gear, fills, foods } = state;
  const D = dist(route);
  const hrs = totalHours(route);
  const target = hrs * cph(route);
  const N = PROFILE_SAMPLES;
  const tot = effTotal(route);
  const cap = absCap(mix);
  const dt = hrs / N;
  const sweatRate = sweat(route);

  const out: Sample[] = [];
  let gut = 0;
  let absorbed = 0;
  let prevIn = 0;

  for (let i = 0; i <= N; i++) {
    const x = (D * i) / N;
    let intake = 0;
    let ml = 0;
    let rateAtX = 0;
    let active: ActiveSource = null;

    fills.forEach((f) => {
      intake += carbsFill(f, gear, mix) * fracFill(f, x, gear, route);
      if (f.content !== 'gel') ml += volOf(f, gear) * fracFill(f, x, gear, route);
      if (x >= f.from - D * 0.004 && x <= f.to + D * 0.004) {
        const r = carbsFill(f, gear, mix) / Math.max(0.1, f.to - f.from);
        if (r > rateAtX) {
          rateAtX = r;
          active = f.content;
        }
      }
    });

    foods.forEach((fd) => {
      intake += fd.carbs * fracFood(fd, x, route);
      ml += (fd.ml || 0) * fracFood(fd, x, route);
      if (x >= fd.from - D * 0.004 && x <= fd.to + D * 0.004) {
        const r = fd.carbs / Math.max(0.1, fd.to - fd.from);
        if (r > rateAtX) {
          rateAtX = r;
          active = 'food';
        }
      }
    });

    gut += Math.max(0, intake - prevIn);
    prevIn = intake;
    if (i) {
      const take = Math.min(gut, cap * dt);
      gut -= take;
      absorbed += take;
    }

    out.push({
      x,
      intake,
      absorbed,
      gut,
      ml,
      need: target * (eff(route, x) / tot),
      active,
      rate: 0,
      needRate: 0,
      fluidRate: 0,
      sweatRate,
    });
  }

  const w = Math.max(2, Math.round((N * 0.5) / Math.max(0.5, hrs)));
  for (let i = 0; i <= N; i++) {
    const a = Math.max(0, i - w);
    const b = Math.min(N, i + w);
    const span = (b - a) * dt;
    out[i].rate = span > 0 ? (out[b].absorbed - out[a].absorbed) / span : 0;
    out[i].needRate = span > 0 ? (out[b].need - out[a].need) / span : 0;
    out[i].fluidRate = span > 0 ? (out[b].ml - out[a].ml) / span : 0;
  }

  return out;
}

export function rateStats(state: PlanState): RateStats {
  const S = samples(state);
  const hrs = totalHours(state.route);
  const dt = hrs / (S.length - 1);
  let fed = 0;
  let needSum = 0;
  let dry = { len: 0, x: 0 };
  let run = 0;

  S.forEach((p) => {
    fed += Math.min(p.rate, p.needRate) * dt;
    needSum += p.needRate * dt;
    if (p.rate < p.needRate * 0.4) {
      run += dt;
      if (run > dry.len) dry = { len: run, x: p.x };
    } else {
      run = 0;
    }
  });

  return {
    coverage: needSum > 0 ? Math.round((fed / needSum) * 100) : 0,
    dryStretch: dry,
    samples: S,
  };
}

export function fmtHM(h: number): string {
  const m = Math.round(h * 60);
  return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
}

function xu(route: RouteInput, xUnit: XUnit): XUnit | 'time' {
  return route.mode === 'time' ? 'time' : xUnit;
}

export function fmtX(km: number, withUnit: boolean, route: RouteInput, xUnit: XUnit): string {
  if (xu(route, xUnit) === 'km') return Math.round(km) + (withUnit ? ' km' : '');
  const kmh = dist(route) / Math.max(0.01, totalHours(route));
  return fmtHM(km / kmh) + (withUnit ? ' h' : '');
}

export function rangeLabel(a: number, b: number, point: boolean, route: RouteInput, xUnit: XUnit): string {
  if (point) return fmtX(a, true, route, xUnit);
  return fmtX(a, false, route, xUnit) + '–' + fmtX(b, true, route, xUnit);
}

export interface PlanSummary {
  target: number;
  izoCarbs: number;
  gelCarbs: number;
  foodCarbs: number;
  totalCarbs: number;
  fluidPlanned: number;
  sweatLoss: number;
  hydrationPct: number;
  coverage: number;
  absorbedTotal: number;
}

export function planSummary(state: PlanState): PlanSummary {
  const { route, mix, gear, fills, foods } = state;
  const hrs = totalHours(route);
  const target = hrs * cph(route);

  const izoCarbs = fills.filter((f) => f.content === 'izo').reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const gelCarbs = fills.filter((f) => f.content === 'gel').reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const foodCarbs = foods.reduce((a, f) => a + f.carbs, 0);
  const totalCarbs = izoCarbs + gelCarbs + foodCarbs;

  const fluidPlanned =
    fills.filter((f) => f.content !== 'gel').reduce((a, f) => a + volOf(f, gear), 0) +
    foods.reduce((a, f) => a + (f.ml || 0), 0);
  const sweatLoss = Math.round(sweat(route) * hrs);
  const hydrationPct = sweatLoss > 0 ? Math.round((fluidPlanned / sweatLoss) * 100) : 100;

  const { coverage, samples: S } = rateStats(state);

  return {
    target,
    izoCarbs,
    gelCarbs,
    foodCarbs,
    totalCarbs,
    fluidPlanned,
    sweatLoss,
    hydrationPct,
    coverage,
    absorbedTotal: S[S.length - 1].absorbed,
  };
}

export { FLUID_ABSORPTION_CAP_ML_H };
