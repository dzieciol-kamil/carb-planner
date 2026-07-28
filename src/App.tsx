import { useEffect } from 'react';
import { ChartCard } from './components/chart/ChartCard';
import { Header } from './components/Header';
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
  const isDesktop = isDesktopView(viewMode, autoView);

  return (
    <div style={{ minHeight: '100vh', padding: '26px 24px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <Header />
      {isDesktop ? (
        <div style={{ width: '100%', maxWidth: 1420, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <RoutePanel />
            <SummaryCards />
          </div>
          <ChartCard />
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', color: 'var(--muted-2)', fontSize: 13, padding: '40px 16px' }}>
          Mobile layout is coming in a future update — switch to a wider window for now.
        </div>
      )}
    </div>
  );
}

export default App;
