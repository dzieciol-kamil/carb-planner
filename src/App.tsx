import { useEffect } from 'react';
import { ChartCard } from './components/chart/ChartCard';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MixPanel } from './components/panels/MixPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { RecipesSection } from './components/recipes/RecipesSection';
import { RoutePanel } from './components/RoutePanel';
import { SummaryCards } from './components/SummaryCards';
import { TourOverlay } from './components/tour/TourOverlay';
import { useAppStore } from './store/appStore';

function App() {
  const panel = useAppStore((s) => s.ui.panel);
  const tourSeen = useAppStore((s) => s.ui.tourSeen);
  const startTour = useAppStore((s) => s.startTour);

  useEffect(() => {
    if (tourSeen) return;
    const id = setTimeout(startTour, 400);
    return () => clearTimeout(id);
  }, [tourSeen, startTour]);

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
