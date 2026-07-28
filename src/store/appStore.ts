import { create } from 'zustand';
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
}

const defaultRoute: RouteInput = {
  mode: 'route',
  distance: 200,
  speed: 27,
  hours: 7,
  minutes: 30,
  weight: 78,
  intensity: 'low',
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
  { gid: 'g1', name: 'Bidon duży', vol: 720, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g2', name: 'Bidon mały', vol: 610, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g3', name: 'Flask', vol: 250, allowed: ['izo', 'gel'], gelParts: 4 },
];

const defaultFills: Fill[] = [
  { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 55 },
  { fid: 2, gid: 'g1', content: 'izo', from: 58, to: 115 },
  { fid: 3, gid: 'g1', content: 'water', from: 120, to: 175 },
  { fid: 4, gid: 'g2', content: 'izo', from: 0, to: 62 },
  { fid: 5, gid: 'g2', content: 'water', from: 70, to: 140 },
  { fid: 6, gid: 'g3', content: 'gel', from: 25, to: 160 },
];

const defaultFoods: FoodItem[] = [
  { id: 101, key: 'ban', name: 'Banan', carbs: 25, from: 62, to: 62 },
  { id: 102, key: 'chew', name: 'Żelki', carbs: 30, cont: true, from: 146, to: 168 },
  { id: 103, key: 'beer', name: 'Piwo zero', carbs: 20, ml: 500, from: 172, to: 172 },
];

const defaultFoodLib: FoodLibEntry[] = [
  { key: 'gel', pl: 'Żel energetyczny', en: 'Energy gel', carbs: 22 },
  { key: 'ban', pl: 'Banan', en: 'Banana', carbs: 25 },
  { key: 'chew', pl: 'Żelki', en: 'Chews', carbs: 30, cont: true, span: 18 },
  { key: 'bar', pl: 'Baton', en: 'Bar', carbs: 28 },
  { key: 'ice', pl: 'Lody', en: 'Ice cream', carbs: 30, ml: 120 },
  { key: 'cake', pl: 'Ciasto', en: 'Cake', carbs: 45 },
  { key: 'beer', pl: 'Piwo zero', en: 'Zero beer', carbs: 20, ml: 500 },
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
  nextGid: 4,
  nextFid: 7,
  nextFoodId: 104,
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
}));

export function isDesktopView(viewMode: ViewMode, autoView: 'desktop' | 'mobile'): boolean {
  return viewMode === 'auto' ? autoView === 'desktop' : viewMode === 'desktop';
}
