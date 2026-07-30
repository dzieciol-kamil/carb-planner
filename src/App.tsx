import { useEffect } from 'react';
import { ChartCard } from './components/chart/ChartCard';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileApp } from './components/mobile/MobileApp';
import { MixPanel } from './components/panels/MixPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { RecipesSection } from './components/recipes/RecipesSection';
import { RoutePanel } from './components/RoutePanel';
import { SummaryCards } from './components/SummaryCards';
import { TourOverlay } from './components/tour/TourOverlay';
import { DESKTOP_BREAKPOINT, hasPlanData, isDesktopView, useAppStore } from './store/appStore';

function App() {
  const panel = useAppStore((s) => s.ui.panel);
  const tourSeen = useAppStore((s) => s.ui.tourSeen);
  const startTour = useAppStore((s) => s.startTour);
  const lang = useAppStore((s) => s.ui.lang);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const setAutoView = useAppStore((s) => s.setAutoView);

  useEffect(() => {
    if (tourSeen || hasPlanData(useAppStore.getState())) return;
    const id = setTimeout(startTour, 400);
    return () => clearTimeout(id);
  }, [tourSeen, startTour]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const update = () => setAutoView(window.innerWidth >= DESKTOP_BREAKPOINT ? 'desktop' : 'mobile');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [setAutoView]);

  if (!isDesktopView(viewMode, autoView)) {
    return (
      <>
        <MobileApp />
        <TourOverlay />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '14px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <Header />
      {panel === 'settings' && <SettingsPanel />}
      {panel === 'mix' && <MixPanel />}
      <div style={{ width: '100%', maxWidth: 1420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div data-tour="route-summary" style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <RoutePanel />
          <SummaryCards />
        </div>
        <ChartCard />
        <RecipesSection />
      </div>
      <Footer />
      <TourOverlay />
    </div>
  );
}

export default App;
