import { beforeEach, describe, expect, test } from 'vitest';
import { hasPlanData, useAppStore } from './appStore';
import type { RouteInput } from '../domain/types';

function route(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    mode: 'route',
    distance: 0,
    speed: 0,
    hours: 0,
    minutes: 0,
    weight: 78,
    preMealCarbs: 50,
    preMealMinutes: 45,
    intensity: 'mid',
    temp: 24,
    useGpx: true,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...overrides,
  };
}

describe('hasPlanData', () => {
  test('false when route, fills, foods and shops are all default/empty', () => {
    expect(hasPlanData({ route: route(), fills: [], foods: [], shops: [] })).toBe(false);
  });

  test('true once the route has a distance', () => {
    expect(hasPlanData({ route: route({ distance: 50 }), fills: [], foods: [], shops: [] })).toBe(true);
  });

  test('true once a fill exists, even with a default route', () => {
    expect(
      hasPlanData({ route: route(), fills: [{ fid: 1, gid: 'g1', content: 'izo', from: 0, to: 10 }], foods: [], shops: [] }),
    ).toBe(true);
  });

  test('true once a shop stop exists', () => {
    expect(hasPlanData({ route: route(), fills: [], foods: [], shops: [{ id: 1, at: 40, name: 'Shop' }] })).toBe(true);
  });
});

const initialState = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState(initialState, true);
});

describe('setMode reconciling existing plan items', () => {
  test('pulls a fill back onto the route when switching to time mode shrinks the domain', () => {
    useAppStore.setState({
      route: route({ mode: 'route', distance: 100, hours: 1, minutes: 0 }),
      fills: [{ fid: 1, gid: 'g1', content: 'water', from: 70, to: 90 }],
    });
    useAppStore.getState().setMode('time'); // dist() in time mode = round(hours*10) = 10
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 0, to: 10 });
  });
});

describe('setDistance (live typing) vs reconcilePlan (commit)', () => {
  test('setDistance alone does not touch existing fills, even once the new distance no longer fits them', () => {
    // This mirrors typing a new distance character by character: each keystroke calls
    // setDistance with a transient value before the field settles. Fills must not be
    // destructively clamped against those in-progress numbers.
    const fills = [{ fid: 1, gid: 'g1', content: 'water' as const, from: 70, to: 90 }];
    useAppStore.setState({ route: route({ distance: 100 }), fills });
    useAppStore.getState().setDistance(50);
    expect(useAppStore.getState().fills[0]).toEqual(fills[0]);
  });

  test('reconcilePlan pulls a fill back onto the route once the smaller distance is committed', () => {
    useAppStore.setState({
      route: route({ distance: 100 }),
      fills: [{ fid: 1, gid: 'g1', content: 'water', from: 70, to: 90 }],
    });
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    expect(useAppStore.getState().fills[0]).toMatchObject({ from: 30, to: 50 });
  });

  test('reconcilePlan pulls a food marker and a shop stop back too', () => {
    useAppStore.setState({
      route: route({ distance: 100 }),
      foods: [{ id: 1, key: 'gel', name: 'Gel', carbs: 25, from: 80, to: 80 }],
      shops: [{ id: 1, at: 95, name: 'Shop' }],
    });
    useAppStore.getState().setDistance(50);
    useAppStore.getState().reconcilePlan();
    const s = useAppStore.getState();
    expect(s.foods[0].from).toBeLessThanOrEqual(50);
    expect(s.foods[0].to).toBeLessThanOrEqual(50);
    expect(s.shops[0].at).toBeLessThanOrEqual(50);
  });

  test('reconcilePlan leaves items untouched when the distance still fits them', () => {
    const fills = [{ fid: 1, gid: 'g1', content: 'water' as const, from: 10, to: 20 }];
    useAppStore.setState({ route: route({ distance: 100 }), fills });
    useAppStore.getState().setDistance(80);
    useAppStore.getState().reconcilePlan();
    expect(useAppStore.getState().fills[0]).toEqual(fills[0]);
  });
});

describe('tour lifecycle', () => {
  test('startTour opens at step 0 and marks tourSeen', () => {
    useAppStore.getState().startTour();
    const ui = useAppStore.getState().ui;
    expect(ui.tourStep).toBe(0);
    expect(ui.tourSeen).toBe(true);
  });

  test('closeTour clears the running step', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().closeTour();
    expect(useAppStore.getState().ui.tourStep).toBeNull();
  });

  test('setTourStep clamps below zero to zero', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().setTourStep(-3);
    expect(useAppStore.getState().ui.tourStep).toBe(0);
  });

  test('setTourStep moves forward freely', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().setTourStep(2);
    expect(useAppStore.getState().ui.tourStep).toBe(2);
  });
});

describe('loadTourDemoData', () => {
  test('sets a demo route and adds one fill on the first vessel', () => {
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.route.distance).toBe(90);
    expect(s.route.speed).toBe(28);
    expect(s.fills).toHaveLength(1);
    expect(s.fills[0].gid).toBe('g1');
    expect(s.ui.tourDemoFid).toBe(s.fills[0].fid);
  });

  test('is a no-op the second time it is called', () => {
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().loadTourDemoData();
    expect(useAppStore.getState().fills).toHaveLength(1);
  });

  test('replacing the plan across separate tour runs does not accumulate fills', () => {
    useAppStore.getState().startTour();
    useAppStore.getState().loadTourDemoData();
    useAppStore.getState().startTour(); // resets tourDemoFid, simulating a footer replay
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.fills).toHaveLength(1);
    expect(s.fills[0].fid).toBe(s.ui.tourDemoFid);
  });

  test('clears pre-existing foods and shops, not just fills', () => {
    useAppStore.getState().addShop();
    useAppStore.getState().loadTourDemoData();
    const s = useAppStore.getState();
    expect(s.shops).toHaveLength(0);
    expect(s.foods).toHaveLength(0);
  });
});

describe('mobile ui state', () => {
  test('setTab switches tab and clears selKey', () => {
    useAppStore.getState().setSelKey('f1');
    useAppStore.getState().setTab('mix');
    expect(useAppStore.getState().ui.tab).toBe('mix');
    expect(useAppStore.getState().ui.selKey).toBeNull();
  });

  test('setScrubX stores and clears the scrub position', () => {
    useAppStore.getState().setScrubX(42);
    expect(useAppStore.getState().ui.scrubX).toBe(42);
    useAppStore.getState().setScrubX(null);
    expect(useAppStore.getState().ui.scrubX).toBeNull();
  });

  test('toggleGpxPeek flips the flag', () => {
    const before = useAppStore.getState().ui.gpxPeek;
    useAppStore.getState().toggleGpxPeek();
    expect(useAppStore.getState().ui.gpxPeek).toBe(!before);
  });

  test('mix/route sheets open and close', () => {
    useAppStore.getState().openMixSheet();
    expect(useAppStore.getState().ui.mixSheet).toBe(true);
    useAppStore.getState().closeMixSheet();
    expect(useAppStore.getState().ui.mixSheet).toBe(false);

    useAppStore.getState().openRouteSheet();
    expect(useAppStore.getState().ui.routeSheet).toBe(true);
    useAppStore.getState().closeRouteSheet();
    expect(useAppStore.getState().ui.routeSheet).toBe(false);
  });

  test('shop sheet opens with an edit target and closes to null', () => {
    useAppStore.getState().openShopSheet(7);
    expect(useAppStore.getState().ui.shopSheet).toEqual({ editId: 7 });
    useAppStore.getState().openShopSheet(null);
    expect(useAppStore.getState().ui.shopSheet).toEqual({ editId: null });
    useAppStore.getState().closeShopSheet();
    expect(useAppStore.getState().ui.shopSheet).toBeNull();
  });
});
