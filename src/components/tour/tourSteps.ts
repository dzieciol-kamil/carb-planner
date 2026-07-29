import { useAppStore } from '../../store/appStore';

export type TourTarget = 'route-summary' | 'chart' | 'demo-fill' | 'demo-add-fill' | 'add-shop';

export type TourCopyKey =
  | 'tourWelcomeTitle'
  | 'tourWelcomeBody'
  | 'tourRouteTitle'
  | 'tourRouteBody'
  | 'tourChartTitle'
  | 'tourChartBody'
  | 'tourFillTitle'
  | 'tourFillBody'
  | 'tourAddFillTitle'
  | 'tourAddFillBody'
  | 'tourAddShopTitle'
  | 'tourAddShopBody'
  | 'tourClosingTitle'
  | 'tourClosingBody';

export interface TourStep {
  target: TourTarget | null;
  titleKey: TourCopyKey;
  bodyKey: TourCopyKey;
  onEnter?: () => (() => void) | void;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    titleKey: 'tourWelcomeTitle',
    bodyKey: 'tourWelcomeBody',
    // Loaded here, before any step ever renders the chart or lanes, so the
    // demo bottle always already exists by the time the user reaches those
    // steps — no empty-then-filled flash. Idempotent, so revisiting this
    // step via Back/Next can't add a second demo fill.
    onEnter: () => {
      useAppStore.getState().loadTourDemoData();
    },
  },
  { target: 'route-summary', titleKey: 'tourRouteTitle', bodyKey: 'tourRouteBody' },
  { target: 'chart', titleKey: 'tourChartTitle', bodyKey: 'tourChartBody' },
  { target: 'demo-fill', titleKey: 'tourFillTitle', bodyKey: 'tourFillBody' },
  { target: 'demo-add-fill', titleKey: 'tourAddFillTitle', bodyKey: 'tourAddFillBody' },
  { target: 'add-shop', titleKey: 'tourAddShopTitle', bodyKey: 'tourAddShopBody' },
  { target: null, titleKey: 'tourClosingTitle', bodyKey: 'tourClosingBody' },
];
