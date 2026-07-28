import { create } from 'zustand';
import { bestGapSpan, gaps } from '../domain/dragMath';
import { dist } from '../domain/fuel';
import { loadGpxFile } from '../domain/gpx';
import { t, type Lang } from '../i18n/strings';
import type { FoodItem, FoodLibEntry, Intensity, Mode, MixSettings, RouteInput, Vessel, Fill, XUnit } from '../domain/types';

export type ViewMode = 'auto' | 'desktop' | 'mobile';
export type YMode = 'rate' | 'fluid' | 'sum';
export type PanelId = 'settings' | 'mix' | null;

interface UiState {
  lang: Lang;
  viewMode: ViewMode;
  autoView: 'desktop' | 'mobile';
  panel: PanelId;
  xUnit: XUnit;
  yMode: YMode;
  selKey: string | null;
  hoverKey: string | null;
  dragKey: string | null;
  timelineOpen: boolean;
}

interface AppState {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
  ui: UiState;
  nextGid: number;
  nextFid: number;
  nextFoodId: number;
  nextFoodKey: number;

  setMode: (mode: Mode) => void;
  setDistance: (n: number) => void;
  setSpeed: (n: number) => void;
  setHours: (n: number) => void;
  setMinutes: (n: number) => void;
  setWeight: (n: number) => void;
  setIntensity: (i: Intensity) => void;
  setTemp: (n: number) => void;
  toggleGpx: () => void;
  loadGpxFromFile: (file: File) => Promise<void>;

  setLang: (lang: Lang) => void;
  setViewMode: (mode: ViewMode) => void;
  setAutoView: (view: 'desktop' | 'mobile') => void;
  openPanel: (panel: PanelId) => void;
  closePanel: () => void;
  setXUnit: (u: XUnit) => void;
  setYMode: (m: YMode) => void;
  toggleTimelineOpen: () => void;

  setHoverKey: (key: string | null) => void;
  setDragKey: (key: string | null) => void;
  setSelKey: (key: string | null) => void;

  updateFill: (fid: number, patch: Partial<Fill>) => void;
  removeFill: (fid: number) => void;
  addFillInGap: (gid: string) => void;
  setFillContent: (fid: number, content: Fill['content']) => void;

  updateFood: (id: number, patch: Partial<FoodItem>) => void;
  removeFood: (id: number) => void;
  setFoodContinuous: (id: number, cont: boolean) => void;
  addFoodFromLibrary: (key: string) => void;

  setRatio: (n: number) => void;
  setConc: (n: number) => void;
  setSalt: (n: number) => void;
  setCitric: (n: number) => void;
  setGelConc: (n: number) => void;
  setGelSalt: (n: number) => void;
  setGelCitric: (n: number) => void;
  resetMix: () => void;

  updateVessel: (gid: string, patch: Partial<Vessel>) => void;
  removeVessel: (gid: string) => void;
  addVessel: () => void;
  toggleVesselAllowed: (gid: string, content: Fill['content']) => void;
  setVesselGelParts: (gid: string, n: number) => void;

  updateFoodLibEntry: (key: string, patch: Partial<FoodLibEntry>) => void;
  removeFoodLibEntry: (key: string) => void;
  addFoodLibEntry: () => void;
}

const defaultRoute: RouteInput = {
  mode: 'route',
  distance: 0,
  speed: 0,
  hours: 0,
  minutes: 0,
  weight: 78,
  intensity: 'mid',
  temp: 24,
  useGpx: true,
  gpxTrack: null,
  gpxName: null,
  gpxError: null,
};

const defaultMix: MixSettings = {
  conc: 11,
  gelConc: 60,
  ratio: 2,
  salt: 0.16,
  citric: 0.2,
  gelSalt: 0.4,
  gelCitric: 0.5,
};

const defaultGear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g2', name: 'Flask', vol: 250, allowed: ['izo', 'water', 'gel'], gelParts: 4 },
];

const defaultFills: Fill[] = [];

const defaultFoods: FoodItem[] = [];

const defaultFoodLib: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'cola', pl: 'Cola', en: 'Cola', carbs: 35, ml: 330 },
];

export const useAppStore = create<AppState>((set) => ({
  route: defaultRoute,
  mix: defaultMix,
  gear: defaultGear,
  fills: defaultFills,
  foods: defaultFoods,
  foodLib: defaultFoodLib,
  ui: {
    lang: 'pl',
    viewMode: 'auto',
    autoView: 'desktop',
    panel: null,
    xUnit: 'km',
    yMode: 'rate',
    selKey: null,
    hoverKey: null,
    dragKey: null,
    timelineOpen: false,
  },
  nextGid: 3,
  nextFid: 1,
  nextFoodId: 101,
  nextFoodKey: 1,

  setMode: (mode) => set((s) => ({ route: { ...s.route, mode } })),
  setDistance: (n) => set((s) => ({ route: { ...s.route, distance: n } })),
  setSpeed: (n) => set((s) => ({ route: { ...s.route, speed: n } })),
  setHours: (n) => set((s) => ({ route: { ...s.route, hours: n } })),
  setMinutes: (n) => set((s) => ({ route: { ...s.route, minutes: n } })),
  setWeight: (n) => set((s) => ({ route: { ...s.route, weight: n } })),
  setIntensity: (i) => set((s) => ({ route: { ...s.route, intensity: i } })),
  setTemp: (n) => set((s) => ({ route: { ...s.route, temp: n } })),
  toggleGpx: () => set((s) => ({ route: { ...s.route, useGpx: !s.route.useGpx } })),
  loadGpxFromFile: async (file) => {
    try {
      const { track, distanceKm, fileName } = await loadGpxFile(file);
      set((s) => ({
        route: { ...s.route, gpxTrack: track, gpxName: fileName, gpxError: null, useGpx: true, distance: distanceKm },
      }));
    } catch {
      set((s) => ({ route: { ...s.route, gpxError: 'gpxBad' } }));
    }
  },

  setLang: (lang) => set((s) => ({ ui: { ...s.ui, lang } })),
  setViewMode: (viewMode) => set((s) => ({ ui: { ...s.ui, viewMode } })),
  setAutoView: (autoView) => set((s) => ({ ui: { ...s.ui, autoView } })),
  openPanel: (panel) => set((s) => ({ ui: { ...s.ui, panel } })),
  closePanel: () => set((s) => ({ ui: { ...s.ui, panel: null } })),
  setXUnit: (xUnit) => set((s) => ({ ui: { ...s.ui, xUnit } })),
  setYMode: (yMode) => set((s) => ({ ui: { ...s.ui, yMode } })),
  toggleTimelineOpen: () => set((s) => ({ ui: { ...s.ui, timelineOpen: !s.ui.timelineOpen } })),

  setHoverKey: (hoverKey) => set((s) => ({ ui: { ...s.ui, hoverKey } })),
  setDragKey: (dragKey) => set((s) => ({ ui: { ...s.ui, dragKey } })),
  setSelKey: (selKey) => set((s) => ({ ui: { ...s.ui, selKey } })),

  updateFill: (fid, patch) => set((s) => ({ fills: s.fills.map((f) => (f.fid === fid ? { ...f, ...patch } : f)) })),
  removeFill: (fid) =>
    set((s) => ({ fills: s.fills.filter((f) => f.fid !== fid), ui: { ...s.ui, hoverKey: null, selKey: null } })),
  addFillInGap: (gid) =>
    set((s) => {
      const vessel = s.gear.find((g) => g.gid === gid);
      if (!vessel) return {};
      const distanceKm = dist(s.route);
      const span = bestGapSpan(
        gaps(
          s.fills.filter((f) => f.gid === gid),
          distanceKm,
        ),
        distanceKm,
      );
      if (!span) return {};
      const allowed: Fill['content'][] = vessel.allowed?.length ? vessel.allowed : ['izo'];
      const content: Fill['content'] = allowed.includes('izo') ? 'izo' : allowed[0];
      return {
        fills: [...s.fills, { fid: s.nextFid, gid, content, from: span.from, to: span.to }],
        nextFid: s.nextFid + 1,
      };
    }),
  setFillContent: (fid, content) => set((s) => ({ fills: s.fills.map((f) => (f.fid === fid ? { ...f, content } : f)) })),

  updateFood: (id, patch) => set((s) => ({ foods: s.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  removeFood: (id) =>
    set((s) => ({ foods: s.foods.filter((f) => f.id !== id), ui: { ...s.ui, hoverKey: null, selKey: null } })),
  setFoodContinuous: (id, cont) =>
    set((s) => {
      const distanceKm = dist(s.route);
      return {
        foods: s.foods.map((f) => (f.id === id ? { ...f, cont, to: cont ? Math.min(distanceKm, f.from + 18) : f.from } : f)),
      };
    }),
  addFoodFromLibrary: (key) =>
    set((s) => {
      const entry = s.foodLib.find((f) => f.key === key);
      if (!entry) return {};
      const distanceKm = dist(s.route);
      const start = Math.round(distanceKm * 0.5);
      const to = entry.cont ? Math.min(distanceKm, start + (entry.span || 18)) : start;
      const name = entry[s.ui.lang] || entry.en;
      return {
        foods: [...s.foods, { id: s.nextFoodId, key: entry.key, name, carbs: entry.carbs, ml: entry.ml, cont: !!entry.cont, from: start, to }],
        nextFoodId: s.nextFoodId + 1,
      };
    }),

  setRatio: (n) => set((s) => ({ mix: { ...s.mix, ratio: Math.min(10, Math.max(0.2, n)) } })),
  setConc: (n) => set((s) => ({ mix: { ...s.mix, conc: n } })),
  setSalt: (n) => set((s) => ({ mix: { ...s.mix, salt: n } })),
  setCitric: (n) => set((s) => ({ mix: { ...s.mix, citric: n } })),
  setGelConc: (n) => set((s) => ({ mix: { ...s.mix, gelConc: n } })),
  setGelSalt: (n) => set((s) => ({ mix: { ...s.mix, gelSalt: n } })),
  setGelCitric: (n) => set((s) => ({ mix: { ...s.mix, gelCitric: n } })),
  resetMix: () => set({ mix: { ...defaultMix } }),

  updateVessel: (gid, patch) => set((s) => ({ gear: s.gear.map((g) => (g.gid === gid ? { ...g, ...patch } : g)) })),
  removeVessel: (gid) => set((s) => ({ gear: s.gear.filter((g) => g.gid !== gid), fills: s.fills.filter((f) => f.gid !== gid) })),
  addVessel: () =>
    set((s) => ({
      gear: [...s.gear, { gid: 'g' + s.nextGid, name: t(s.ui.lang).newVessel, vol: 500, allowed: ['water', 'izo'], gelParts: 4 }],
      nextGid: s.nextGid + 1,
    })),
  toggleVesselAllowed: (gid, content) =>
    set((s) => ({
      gear: s.gear.map((g) => {
        if (g.gid !== gid) return g;
        const cur = g.allowed || [];
        const on = cur.includes(content);
        const next = on ? cur.filter((v) => v !== content) : [...cur, content];
        return { ...g, allowed: next.length ? next : cur };
      }),
      fills: s.gear.find((g) => g.gid === gid)?.allowed.includes(content)
        ? s.fills.filter((f) => !(f.gid === gid && f.content === content))
        : s.fills,
    })),
  setVesselGelParts: (gid, n) =>
    set((s) => ({
      gear: s.gear.map((g) => (g.gid === gid ? { ...g, gelParts: Math.max(1, Math.min(12, n)) } : g)),
      fills: s.fills.map((f) => (f.gid === gid ? { ...f, pos: undefined } : f)),
    })),

  updateFoodLibEntry: (key, patch) => set((s) => ({ foodLib: s.foodLib.map((f) => (f.key === key ? { ...f, ...patch } : f)) })),
  removeFoodLibEntry: (key) => set((s) => ({ foodLib: s.foodLib.filter((f) => f.key !== key) })),
  addFoodLibEntry: () =>
    set((s) => {
      const name = t(s.ui.lang).newFood;
      return {
        foodLib: [...s.foodLib, { key: 'u' + s.nextFoodKey, pl: name, en: name, carbs: 25 }],
        nextFoodKey: s.nextFoodKey + 1,
      };
    }),
}));

export function isDesktopView(viewMode: ViewMode, autoView: 'desktop' | 'mobile'): boolean {
  return viewMode === 'auto' ? autoView === 'desktop' : viewMode === 'desktop';
}
