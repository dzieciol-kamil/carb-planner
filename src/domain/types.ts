export type Mode = 'route' | 'time';
export type Intensity = 'low' | 'mid' | 'high';
export type XUnit = 'km' | 'h';
export type Content = 'water' | 'izo' | 'gel';
/** Sour component of a recipe: pure citric acid powder, or fresh lemon/lime juice. */
export type CitricSource = 'citric' | 'lemon' | 'lime';

export interface RouteInput {
  mode: Mode;
  distance: number;
  speed: number;
  hours: number;
  minutes: number;
  weight: number;
  preMealCarbs: number;
  preMealMinutes: number;
  intensity: Intensity;
  temp: number;
  useGpx: boolean;
  gpxTrack: GpxTrack | null;
  gpxName: string | null;
  gpxError: string | null;
}

export interface GpxTrack {
  id: number;
  ele: number[];
}

export interface MixSettings {
  conc: number;
  gelConc: number;
  ratio: number;
  salt: number;
  citric: number;
  gelSalt: number;
  gelCitric: number;
  /** Which sour ingredient `citric` (g/100ml, citric-acid-equivalent) is delivered as. */
  citricSource: CitricSource;
  gelCitricSource: CitricSource;
}

export interface Vessel {
  gid: string;
  name: string;
  vol: number;
  allowed: Content[];
  gelParts: number;
}

export interface Fill {
  fid: number;
  gid: string;
  content: Content;
  from: number;
  to: number;
  pos?: number[];
}

export interface ShopStop {
  id: number;
  at: number;
  name: string;
}

export interface FoodItem {
  id: number;
  key: string;
  name: string;
  carbs: number;
  ml?: number;
  cont?: boolean;
  from: number;
  to: number;
}

export interface FoodLibEntry {
  key: string;
  pl: string;
  en: string;
  carbs: number;
  ml?: number;
  cont?: boolean;
  span?: number;
}

export interface PlanState {
  route: RouteInput;
  mix: MixSettings;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
}
