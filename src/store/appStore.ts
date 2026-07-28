import { create } from 'zustand';
import { bestGapSpan, gaps } from '../domain/dragMath';
import { dist } from '../domain/fuel';
import { loadGpxFile } from '../domain/gpx';
import type { Lang } from '../i18n/strings';
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

const defaultGear: Vessel[] = [{ gid: 'g1', name: 'Bidon', vol: 650, allowed: ['water', 'izo', 'gel'], gelParts: 4 }];

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
  nextGid: 2,
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
}));

export function isDesktopView(viewMode: ViewMode, autoView: 'desktop' | 'mobile'): boolean {
  return viewMode === 'auto' ? autoView === 'desktop' : viewMode === 'desktop';
}
