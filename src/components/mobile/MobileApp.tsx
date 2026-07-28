import { MobileChartSection } from './MobileChartSection';
import { MobileFoodChips } from './MobileFoodChips';
import { MobileNotesPanel } from './MobileNotesPanel';
import { MobileRecipesSection } from './MobileRecipesSection';
import { MobileSummarySection } from './MobileSummarySection';
import { MobileTabBar } from './MobileTabBar';
import { MobileTimelineSection } from './MobileTimelineSection';
import { MobileHero, MobileRouteInputs, MobileTopBar } from './MobileTop';

export function MobileApp() {
  return (
    <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div
        style={{
          width: 392,
          height: 812,
          background: '#fff',
          border: '10px solid #16191C',
          borderRadius: 44,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.16)',
        }}
      >
        <MobileTopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MobileHero />
          <MobileRouteInputs />
          <MobileChartSection />
          <MobileTimelineSection />
          <MobileFoodChips />
          <MobileRecipesSection />
          <MobileSummarySection />
        </div>
        <MobileTabBar />
      </div>
      <MobileNotesPanel />
    </div>
  );
}
