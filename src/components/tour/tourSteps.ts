import { useAppStore } from '../../store/appStore';

export type TourTarget = 'route-summary' | 'chart' | 'demo-fill' | 'demo-add-fill' | 'add-shop';

export type TourCopyKey =
  | 'tourWelcomeTitle'
  | 'tourWelcomeBody'
  | 'tourRouteTitle'
  | 'tourRouteBody'
  | 'tourChartTitle'
  | 'tourChartBody'
  | 'tourChartBodyAfter'
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
  { target: null, titleKey: 'tourWelcomeTitle', bodyKey: 'tourWelcomeBody' },
  { target: 'route-summary', titleKey: 'tourRouteTitle', bodyKey: 'tourRouteBody' },
  {
    target: 'chart',
    titleKey: 'tourChartTitle',
    bodyKey: 'tourChartBody',
    onEnter: () => {
      // Deliberate delay: the point of this step is to show the chart
      // empty first, then watch the supply line rise once demo data
      // lands. loadTourDemoData() is idempotent, so revisiting this
      // step via Back/Next can't add a second demo fill.
      const timer = setTimeout(() => useAppStore.getState().loadTourDemoData(), 900);
      return () => clearTimeout(timer);
    },
  },
  {
    target: 'demo-fill',
    titleKey: 'tourFillTitle',
    bodyKey: 'tourFillBody',
    // Safety net for a user who clicks Next before the previous step's
    // 900ms delay fires — guarantees the demo fill exists by now.
    onEnter: () => {
      useAppStore.getState().loadTourDemoData();
    },
  },
  { target: 'demo-add-fill', titleKey: 'tourAddFillTitle', bodyKey: 'tourAddFillBody' },
  { target: 'add-shop', titleKey: 'tourAddShopTitle', bodyKey: 'tourAddShopBody' },
  { target: null, titleKey: 'tourClosingTitle', bodyKey: 'tourClosingBody' },
];
