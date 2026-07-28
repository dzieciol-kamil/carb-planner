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
import { isDesktopView, useAppStore } from './store/appStore';

function useAutoViewDetection() {
  const setAutoView = useAppStore((s) => s.setAutoView);

  useEffect(() => {
    const detect = () => {
      const w = window.innerWidth || 1200;
      const touch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 1;
      setAutoView(w < 860 || (touch && w < 1100) ? 'mobile' : 'desktop');
    };
    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, [setAutoView]);
}

function App() {
  useAutoViewDetection();
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const autoView = useAppStore((s) => s.ui.autoView);
  const panel = useAppStore((s) => s.ui.panel);
  const isDesktop = isDesktopView(viewMode, autoView);

  return (
    <div style={{ minHeight: '100vh', padding: '14px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <Header />
      {panel === 'settings' && <SettingsPanel />}
      {panel === 'mix' && <MixPanel />}
      {isDesktop ? (
        <div style={{ width: '100%', maxWidth: 1420, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <RoutePanel />
            <SummaryCards />
          </div>
          <ChartCard />
          <RecipesSection />
        </div>
      ) : (
        <MobileApp />
      )}
      {isDesktop && <Footer />}
    </div>
  );
}

export default App;
