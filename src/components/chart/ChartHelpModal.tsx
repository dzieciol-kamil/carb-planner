import type { CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { tourGhostBtn } from '../tour/tourStyles';
import { ChartHelpDiagram } from './ChartHelpDiagram';

interface ChartHelpModalProps {
  desktop: boolean;
}

export function ChartHelpModal({ desktop }: ChartHelpModalProps) {
  const open = useAppStore((s) => s.ui.chartHelp);
  const yMode = useAppStore((s) => s.ui.yMode);
  const lang = useAppStore((s) => s.ui.lang);
  const closeChartHelp = useAppStore((s) => s.closeChartHelp);
  const startTour = useAppStore((s) => s.startTour);
  const strings = t(lang);

  if (!open) return null;

  function openFullTour() {
    closeChartHelp();
    startTour();
  }

  const panelStyle: CSSProperties = desktop
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 460,
        maxWidth: 'calc(100vw - 28px)',
        maxHeight: 'calc(100vh - 40px)',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        boxSizing: 'border-box',
      }
    : {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '85vh',
        background: '#fff',
        borderRadius: '16px 16px 0 0',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.22)',
        padding: '16px 18px calc(16px + env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        boxSizing: 'border-box',
      };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 210 }}>
      <div onClick={closeChartHelp} style={{ position: 'absolute', inset: 0, background: 'rgba(18,20,18,0.55)' }} />
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{strings.chartHelpTitle}</span>
          <button
            onClick={closeChartHelp}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', padding: 0 }}
          >
            ✕
          </button>
        </div>
        <ChartHelpDiagram mode={yMode} strings={strings} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={openFullTour} style={tourGhostBtn}>
            {strings.chartHelpFullTour}
          </button>
        </div>
      </div>
    </div>
  );
}
