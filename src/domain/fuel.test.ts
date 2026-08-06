import { describe, expect, test } from 'vitest';
import {
  absCap,
  carbsFill,
  citricAmount,
  cph,
  dist,
  distanceAtTime,
  eff,
  fmtHM,
  fmtX,
  fracFill,
  fracFood,
  planExtras,
  planSummary,
  preRideGut,
  prof,
  rangeLabel,
  rateStats,
  samples,
  sweat,
  timeAtDistance,
  timeWeight,
  totalHours,
} from './fuel';
import type { Fill, FoodItem, MixSettings, PlanState, RouteInput, Vessel } from './types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    mode: 'route',
    distance: 100,
    speed: 25,
    hours: 0,
    minutes: 0,
    weight: 75,
    preMealCarbs: 0,
    preMealMinutes: 0,
    intensity: 'mid',
    temp: 20,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...overrides,
  };
}

function makeMix(overrides: Partial<MixSettings> = {}): MixSettings {
  return {
    conc: 11,
    gelConc: 60,
    ratio: 2,
    salt: 0.16,
    citric: 0.2,
    gelSalt: 0.4,
    gelCitric: 0.5,
    citricSource: 'citric',
    gelCitricSource: 'citric',
    ...overrides,
  };
}

function makePlan(overrides: Partial<PlanState> = {}): PlanState {
  return {
    route: makeRoute(),
    mix: makeMix(),
    gear: [],
    fills: [],
    foods: [],
    foodLib: [],
    ...overrides,
  };
}

describe('timeWeight', () => {
  test('flat ground: weight 1', () => {
    expect(timeWeight(0)).toBe(1);
  });

  test('moderate uphill (5%): 50% longer per km', () => {
    expect(timeWeight(5)).toBeCloseTo(1.5, 6);
  });

  test('steep uphill (15%): scales linearly, no cap', () => {
    expect(timeWeight(15)).toBeCloseTo(2.5, 6);
  });

  test('moderate downhill (-5%): faster than flat', () => {
    expect(timeWeight(-5)).toBeCloseTo(0.65, 6);
  });

  test('steep downhill (-20%): clamped at the 0.55 floor', () => {
    expect(timeWeight(-20)).toBe(0.55);
  });
});

describe('totalHours', () => {
  test('route mode: distance / speed', () => {
    expect(totalHours(makeRoute({ mode: 'route', distance: 200, speed: 25 }))).toBe(8);
  });

  test('route mode with speed 0 avoids division by zero', () => {
    expect(totalHours(makeRoute({ mode: 'route', distance: 200, speed: 0 }))).toBe(0);
  });

  test('time mode: hours + minutes/60', () => {
    expect(totalHours(makeRoute({ mode: 'time', hours: 1, minutes: 30 }))).toBe(1.5);
  });
});

describe('dist', () => {
  test('route mode: distance clamped to at least 1', () => {
    expect(dist(makeRoute({ mode: 'route', distance: 5 }))).toBe(5);
    expect(dist(makeRoute({ mode: 'route', distance: 0 }))).toBe(1);
  });

  test('time mode: virtual km = round(totalHours * 10)', () => {
    expect(dist(makeRoute({ mode: 'time', hours: 1, minutes: 0 }))).toBe(10);
    expect(dist(makeRoute({ mode: 'time', hours: 0, minutes: 6 }))).toBe(1);
  });
});

describe('cph', () => {
  test('under 1 hour', () => {
    const h = makeRoute({ mode: 'route', distance: 10, speed: 20 }); // 0.5h
    expect(cph({ ...h, intensity: 'low' })).toBe(30);
    expect(cph({ ...h, intensity: 'mid' })).toBe(45);
    expect(cph({ ...h, intensity: 'high' })).toBe(60);
  });

  test('between 1 and 2.5 hours inclusive', () => {
    const h = makeRoute({ mode: 'route', distance: 50, speed: 25 }); // 2h
    expect(cph({ ...h, intensity: 'low' })).toBe(30);
    expect(cph({ ...h, intensity: 'mid' })).toBe(45);
    expect(cph({ ...h, intensity: 'high' })).toBe(60);

    const boundary = makeRoute({ mode: 'route', distance: 25, speed: 25 }); // exactly 1h
    expect(cph({ ...boundary, intensity: 'mid' })).toBe(45);
  });

  test('over 2.5 hours', () => {
    const h = makeRoute({ mode: 'route', distance: 300, speed: 25 }); // 12h
    expect(cph({ ...h, intensity: 'low' })).toBe(60);
    expect(cph({ ...h, intensity: 'mid' })).toBe(75);
    expect(cph({ ...h, intensity: 'high' })).toBe(90);
  });
});

describe('sweat', () => {
  test('baseline: weight 75, temp <= 15, mid intensity', () => {
    expect(sweat(makeRoute({ weight: 75, temp: 15, intensity: 'mid' }))).toBe(490);
  });

  test('high intensity, no heat penalty', () => {
    expect(sweat(makeRoute({ weight: 75, temp: 10, intensity: 'high' }))).toBe(600);
  });

  test('default profile-like values (weight 78, low, temp 24)', () => {
    expect(sweat(makeRoute({ weight: 78, temp: 24, intensity: 'low' }))).toBe(790);
  });
});

describe('absCap', () => {
  test('default ratio 2:1', () => {
    expect(absCap(makeMix({ ratio: 2 }))).toBe(90);
  });

  test('ratio 1:1 favors fructose limit', () => {
    expect(absCap(makeMix({ ratio: 1 }))).toBe(64);
  });

  test('very low ratio clamps to the 45 g/h floor', () => {
    expect(absCap(makeMix({ ratio: 0.2 }))).toBe(45);
  });
});

describe('preRideGut', () => {
  test('nothing eaten before start: zero gut', () => {
    const route = makeRoute({ preMealCarbs: 0, preMealMinutes: 45 });
    expect(preRideGut(route, 60)).toBe(0);
  });

  test('eaten right at the start line: full carbs still in gut', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 0 });
    expect(preRideGut(route, 60)).toBe(50);
  });

  test('fully digested by start (cap * hours >= carbs): zero gut', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 60 });
    expect(preRideGut(route, 60)).toBe(0);
  });

  test('partially digested: leftover = carbs - cap * hours', () => {
    const route = makeRoute({ preMealCarbs: 50, preMealMinutes: 45 });
    expect(preRideGut(route, 60)).toBeCloseTo(5, 6); // 50 - 60*0.75
  });
});

describe('prof / eff', () => {
  test('useGpx disabled flattens effort to 1 and cum is linear', () => {
    const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });
    const P = prof(route);
    expect(P.pts).toHaveLength(161);
    expect(P.pts.every((p) => p.effort === 1)).toBe(true);
    expect(P.cum[0]).toBe(0);
    expect(P.cum[160]).toBe(160);
    expect(P.cum[80]).toBe(80);
  });

  test('eff interpolates cumulative effort along distance', () => {
    const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });
    expect(eff(route, 0)).toBe(0);
    expect(eff(route, 50)).toBe(80);
    expect(eff(route, 100)).toBe(160);
  });

  test('synthetic profile (useGpx on, no track) stays within physical bounds', () => {
    const route = makeRoute({ mode: 'route', distance: 100, useGpx: true, gpxTrack: null });
    const P = prof(route);
    expect(P.pts.every((p) => p.ele >= 40)).toBe(true);
    expect(P.pts.every((p) => p.effort >= 0.32 && p.effort <= 2.3)).toBe(true);
  });

  test('GPX track elevation is interpolated across samples', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      useGpx: true,
      gpxTrack: { id: 1, ele: [100, 200, 300] },
    });
    const P = prof(route);
    expect(P.pts[0].ele).toBe(100);
    expect(P.pts[80].ele).toBe(200);
    expect(P.pts[160].ele).toBe(300);
  });

  test('cumTime is linear in distance when useGpx is false, regardless of a loaded gpxTrack', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      useGpx: false,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const P = prof(route);
    expect(P.cumTime[0]).toBe(0);
    expect(P.cumTime[80]).toBeCloseTo(50, 6);
    expect(P.cumTime[160]).toBeCloseTo(100, 6);
  });

  test('cumTime gives disproportionate weight to a climb when useGpx is true', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs 500m over the first half, flat second half
    });
    const P = prof(route);
    expect(P.cumTime[0]).toBe(0);
    // First half (the climb) should account for more than half of the raw cumulative time.
    expect(P.cumTime[80]).toBeGreaterThan(P.cumTime[160] / 2);
  });
});

describe('timeAtDistance / distanceAtTime', () => {
  test('useGpx false: reduces to constant-speed division (matches old km/kmh behavior)', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25, useGpx: false }); // 4h total
    expect(timeAtDistance(route, 0)).toBe(0);
    expect(timeAtDistance(route, 50)).toBeCloseTo(2, 6);
    expect(timeAtDistance(route, 100)).toBeCloseTo(4, 6);
  });

  test('useGpx true: a climb gets more than its distance share of elapsed time', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25, // 4h total
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] }, // climbs first half, flat second half
    });
    expect(timeAtDistance(route, 0)).toBe(0);
    expect(timeAtDistance(route, 50)).toBeGreaterThan(2); // more than half of 4h for the climb half
    expect(timeAtDistance(route, 100)).toBeCloseTo(4, 6); // total is always preserved
  });

  test('distanceAtTime is the inverse of timeAtDistance', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const t = timeAtDistance(route, 63);
    expect(distanceAtTime(route, t)).toBeCloseTo(63, 3);
  });

  test('distanceAtTime at the boundaries', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25, useGpx: false });
    expect(distanceAtTime(route, 0)).toBe(0);
    expect(distanceAtTime(route, 4)).toBeCloseTo(100, 6);
  });

  test('chart ticks and their labels agree (distanceAtTime -> fmtX round-trip)', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25,
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    for (const hh of [0, 0.5, 1, 2, 3, 4]) {
      expect(fmtX(distanceAtTime(route, hh), false, route, 'h')).toBe(fmtHM(hh));
    }
  });
});

describe('carbsFill', () => {
  const gear: Vessel[] = [
    { gid: 'g1', name: 'Bidon', vol: 720, allowed: ['water', 'izo'], gelParts: 4 },
    { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 },
  ];
  const mix = makeMix({ conc: 11, gelConc: 60 });

  test('water carries no carbs', () => {
    const f: Fill = { fid: 1, gid: 'g1', content: 'water', from: 0, to: 50 };
    expect(carbsFill(f, gear, mix)).toBe(0);
  });

  test('izo scales with vessel volume and mix concentration', () => {
    const f: Fill = { fid: 2, gid: 'g1', content: 'izo', from: 0, to: 50 };
    expect(carbsFill(f, gear, mix)).toBeCloseTo(79.2, 6);
  });

  test('gel scales with vessel volume and gel concentration', () => {
    const f: Fill = { fid: 3, gid: 'g2', content: 'gel', from: 0, to: 50 };
    expect(carbsFill(f, gear, mix)).toBe(150);
  });
});

describe('citricAmount', () => {
  test('citric source passes the gram amount through unchanged', () => {
    expect(citricAmount(1.2, 'citric')).toEqual({ amount: 1.2, unit: 'g' });
  });

  test('lemon converts citric-acid grams into juice ml using ~5% w/v yield', () => {
    const result = citricAmount(1, 'lemon');
    expect(result.unit).toBe('ml');
    expect(result.amount).toBeCloseTo(20, 6);
  });

  test('lime converts citric-acid grams into juice ml using ~6% w/v yield', () => {
    const result = citricAmount(1, 'lime');
    expect(result.unit).toBe('ml');
    expect(result.amount).toBeCloseTo(16.6667, 3);
  });

  test('lime yields less ml than lemon for the same citric-acid target (lime is more concentrated)', () => {
    expect(citricAmount(1, 'lime').amount).toBeLessThan(citricAmount(1, 'lemon').amount);
  });

  test('zero grams converts to zero regardless of source', () => {
    expect(citricAmount(0, 'citric').amount).toBe(0);
    expect(citricAmount(0, 'lemon').amount).toBe(0);
    expect(citricAmount(0, 'lime').amount).toBe(0);
  });
});

describe('fracFill', () => {
  const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });
  const gear: Vessel[] = [
    { gid: 'g1', name: 'Bidon', vol: 720, allowed: ['water', 'izo'], gelParts: 4 },
  ];

  test('continuous fill ramps from 0 to 1 between from and to', () => {
    const f: Fill = { fid: 1, gid: 'g1', content: 'izo', from: 20, to: 80 };
    expect(fracFill(f, 10, gear, route)).toBe(0);
    expect(fracFill(f, 20, gear, route)).toBe(0);
    expect(fracFill(f, 50, gear, route)).toBeCloseTo(0.5, 6);
    expect(fracFill(f, 80, gear, route)).toBe(1);
    expect(fracFill(f, 90, gear, route)).toBe(1);
  });

  test('point fill (from === to) is a step function', () => {
    const f: Fill = { fid: 2, gid: 'g1', content: 'izo', from: 50, to: 50 };
    expect(fracFill(f, 49, gear, route)).toBe(0);
    expect(fracFill(f, 50, gear, route)).toBe(1);
    expect(fracFill(f, 60, gear, route)).toBe(1);
  });

  test('gel split into parts steps at each portion position', () => {
    const gelGear: Vessel[] = [
      { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 },
    ];
    const f: Fill = { fid: 3, gid: 'g2', content: 'gel', from: 0, to: 90 };
    const gelRoute = makeRoute({ mode: 'route', distance: 90, useGpx: false });
    expect(fracFill(f, 0, gelGear, gelRoute)).toBeCloseTo(1 / 3, 6);
    expect(fracFill(f, 44.9, gelGear, gelRoute)).toBeCloseTo(1 / 3, 6);
    expect(fracFill(f, 45, gelGear, gelRoute)).toBeCloseTo(2 / 3, 6);
    expect(fracFill(f, 89.9, gelGear, gelRoute)).toBeCloseTo(2 / 3, 6);
    expect(fracFill(f, 90, gelGear, gelRoute)).toBe(1);
  });
});

describe('fracFood', () => {
  const route = makeRoute({ mode: 'route', distance: 100, useGpx: false });

  test('one-off food is a step function at "from"', () => {
    const fd: FoodItem = { id: 1, key: 'ban', name: 'Banan', carbs: 25, from: 62, to: 62 };
    expect(fracFood(fd, 61, route)).toBe(0);
    expect(fracFood(fd, 62, route)).toBe(1);
  });

  test('continuous food ramps like a fill', () => {
    const fd: FoodItem = {
      id: 2,
      key: 'chew',
      name: 'Zelki',
      carbs: 30,
      cont: true,
      from: 20,
      to: 80,
    };
    expect(fracFood(fd, 20, route)).toBe(0);
    expect(fracFood(fd, 50, route)).toBeCloseTo(0.5, 6);
    expect(fracFood(fd, 80, route)).toBe(1);
  });
});

describe('samples', () => {
  test('zero positions in the plan: no intake anywhere, need still ramps up', () => {
    const plan = makePlan({
      route: makeRoute({
        mode: 'route',
        distance: 100,
        speed: 25,
        weight: 75,
        intensity: 'mid',
        useGpx: false,
      }),
      fills: [],
      foods: [],
    });
    const S = samples(plan);
    expect(S).toHaveLength(161);
    for (const p of [S[0], S[80], S[160]]) {
      expect(p.intake).toBe(0);
      expect(p.absorbed).toBe(0);
      expect(p.gut).toBe(0);
      expect(p.ml).toBe(0);
    }
    expect(S[0].need).toBe(0);
    expect(S[80].need).toBeCloseTo(150, 6); // target=4h*75g/h=300, half distance -> half need
    expect(S[160].need).toBeCloseTo(300, 6);
  });

  test('time mode drives duration and virtual distance', () => {
    const plan = makePlan({
      route: makeRoute({ mode: 'time', hours: 2, minutes: 30, intensity: 'mid', useGpx: false }),
    });
    const S = samples(plan);
    expect(dist(plan.route)).toBe(25);
    expect(S[0].need).toBe(0);
    expect(S[160].need).toBeCloseTo(2.5 * 45, 6); // totalHours=2.5 -> cph mid=45
  });

  test('gel split into portions steps up intake at each portion boundary', () => {
    const gear: Vessel[] = [{ gid: 'g1', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'gel', from: 0, to: 90 }];
    const plan = makePlan({
      route: makeRoute({ mode: 'route', distance: 90, speed: 30, useGpx: false }),
      gear,
      fills,
    });
    const S = samples(plan);
    expect(S[0].intake).toBeCloseTo(50, 6);
    expect(S[79].intake).toBeCloseTo(50, 6);
    expect(S[80].intake).toBeCloseTo(100, 6);
    expect(S[159].intake).toBeCloseTo(100, 6);
    expect(S[160].intake).toBeCloseTo(150, 6);
  });
});

describe('rateStats', () => {
  test('zero positions in the plan: coverage 0%, dry stretch spans the whole ride', () => {
    const plan = makePlan({
      route: makeRoute({ mode: 'time', hours: 0, minutes: 30, intensity: 'mid', useGpx: false }),
    });
    const { coverage, dryStretch } = rateStats(plan);
    expect(coverage).toBe(0);
    expect(dryStretch.len).toBeCloseTo(0.5, 6);
    expect(dryStretch.x).toBe(5); // dist() for 0.5h in time mode
  });
});

describe('fmtHM', () => {
  test('formats fractional hours as H:MM', () => {
    expect(fmtHM(1.5)).toBe('1:30');
    expect(fmtHM(2)).toBe('2:00');
    expect(fmtHM(5 / 60)).toBe('0:05');
  });
});

describe('fmtX', () => {
  test('km axis rounds to whole kilometers', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25 });
    expect(fmtX(45.4, true, route, 'km')).toBe('45 km');
    expect(fmtX(45.4, false, route, 'km')).toBe('45');
  });

  test('time axis converts km to elapsed H:MM using average speed', () => {
    const route = makeRoute({ mode: 'route', distance: 100, speed: 25 }); // 4h, 25 km/h
    expect(fmtX(50, true, route, 'h')).toBe('2:00 h');
  });

  test('time mode always uses the time axis regardless of xUnit', () => {
    const route = makeRoute({ mode: 'time', hours: 2, minutes: 0 }); // dist=20, 10 km/h
    expect(fmtX(10, true, route, 'km')).toBe('1:00 h');
  });

  test('time axis reflects gradient when useGpx is true (climb gets a later label than flat division would)', () => {
    const route = makeRoute({
      mode: 'route',
      distance: 100,
      speed: 25, // flat-division would put 50km at exactly "2:00"
      useGpx: true,
      gpxTrack: { id: 1, ele: [0, 500, 500] },
    });
    const label = fmtX(50, true, route, 'h');
    expect(label).not.toBe('2:00 h');
  });
});

describe('rangeLabel', () => {
  const route = makeRoute({ mode: 'route', distance: 100, speed: 25 });

  test('range renders "from–to unit"', () => {
    expect(rangeLabel(20, 80, false, route, 'km')).toBe('20–80 km');
  });

  test('point renders a single labeled value', () => {
    expect(rangeLabel(20, 80, true, route, 'km')).toBe('20 km');
  });
});

describe('planSummary', () => {
  test('aggregates target, carbs, hydration and delegates coverage/absorbed to rateStats/samples', () => {
    const gear: Vessel[] = [{ gid: 'g1', name: 'Bidon', vol: 500, allowed: ['izo'], gelParts: 4 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 100 }];
    const foods: FoodItem[] = [{ id: 1, key: 'ban', name: 'Banana', carbs: 25, from: 50, to: 50 }];
    const plan = makePlan({
      route: makeRoute({
        mode: 'route',
        distance: 100,
        speed: 25,
        weight: 75,
        intensity: 'mid',
        temp: 20,
        useGpx: false,
      }),
      gear,
      fills,
      foods,
    });

    const summary = planSummary(plan);

    expect(summary.target).toBeCloseTo(300, 6); // 4h * 75 g/h (mid, >2.5h)
    expect(summary.izoCarbs).toBeCloseTo(55, 6); // 500ml/100 * 11 g/100ml
    expect(summary.gelCarbs).toBe(0);
    expect(summary.foodCarbs).toBe(25);
    expect(summary.totalCarbs).toBeCloseTo(80, 6);
    expect(summary.fluidPlanned).toBe(500); // izo volume, no gel, no food ml
    expect(summary.sweatLoss).toBe(2800); // round(sweat=700 * 4h)
    expect(summary.hydrationPct).toBe(18); // round(500/2800*100)
    expect(summary.coverage).toBe(rateStats(plan).coverage);
    expect(summary.absorbedTotal).toBe(samples(plan).at(-1)!.absorbed);
  });

  test('zero-duration plan has zero sweat loss and reports full hydration coverage', () => {
    const zeroHrsPlan = makePlan({
      route: makeRoute({
        mode: 'time',
        hours: 0,
        minutes: 0,
        weight: 75,
        intensity: 'low',
        temp: 0,
      }),
    });
    expect(planSummary(zeroHrsPlan).sweatLoss).toBe(0);
    expect(planSummary(zeroHrsPlan).hydrationPct).toBe(100);
  });
});

describe('planExtras', () => {
  test('with no fills/foods, gut never accumulates', () => {
    const plan = makePlan({
      route: makeRoute({
        mode: 'route',
        distance: 100,
        speed: 25,
        weight: 75,
        intensity: 'mid',
        temp: 20,
        useGpx: false,
      }),
    });

    const extras = planExtras(plan);

    expect(extras.gutPeak).toEqual({ g: 0, x: 0 });
    expect(extras.refillTotal).toBe(0);
    expect(extras.gelPortions).toBe(0);
  });

  test('gutPeak tracks the largest un-absorbed backlog, reached right at the first gel step', () => {
    // Reuses the "gel split into portions" samples() fixture: intake steps 0 -> 50 -> 100 g.
    // The very first step dumps 50g into the gut before any absorption has happened (i=0 skips
    // the absorption pass), which is a bigger backlog than the second 50g step produces once
    // absorption has already been draining the gut for 80 samples.
    const gear: Vessel[] = [{ gid: 'g1', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 }];
    const fills: Fill[] = [{ fid: 1, gid: 'g1', content: 'gel', from: 0, to: 90 }];
    const plan = makePlan({
      route: makeRoute({ mode: 'route', distance: 90, speed: 30, useGpx: false }),
      gear,
      fills,
    });

    const extras = planExtras(plan);

    expect(extras.gutPeak).toEqual({ g: 50, x: 0 });
    expect(extras.refillTotal).toBe(0);
    expect(extras.gelPortions).toBe(3);
  });

  test('counts refills per vessel beyond the first fill and sums gel portions across gel fills only', () => {
    const gear: Vessel[] = [
      { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['izo'], gelParts: 4 },
      { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel'], gelParts: 3 },
    ];
    const fills: Fill[] = [
      { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 30 },
      { fid: 2, gid: 'g1', content: 'izo', from: 30, to: 60 },
      { fid: 3, gid: 'g1', content: 'izo', from: 60, to: 90 },
      { fid: 4, gid: 'g2', content: 'gel', from: 0, to: 100 },
    ];
    const plan = makePlan({ gear, fills });

    const extras = planExtras(plan);

    expect(extras.refillTotal).toBe(2); // g1: 3 fills -> 2 refills, g2: 1 fill -> 0 refills
    expect(extras.gelPortions).toBe(3); // single gel fill on g2, gelParts: 3
  });
});
