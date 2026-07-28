import type { CSSProperties } from 'react';
import { planSummary } from '../../domain/fuel';
import type { XUnit } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore, type YMode } from '../../store/appStore';
import { Chart } from '../chart/Chart';
import { MobileLanesSection } from './MobileLanesSection';

function segButton(on: boolean): CSSProperties {
  return {
    border: 'none',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    background: on ? '#fff' : 'transparent',
    color: on ? 'var(--ink)' : 'var(--muted)',
    boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
  };
}

const segGroupStyle: CSSProperties = { display: 'flex', background: 'var(--track)', borderRadius: 7, padding: 2, gap: 2 };

export function MobileChartSection() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const yMode = useAppStore((s) => s.ui.yMode);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const setYMode = useAppStore((s) => s.setYMode);
  const setXUnit = useAppStore((s) => s.setXUnit);
  const strings = t(lang);

  const summary = planSummary({ route, mix, gear, fills, foods, foodLib });
  const showUnits = route.mode !== 'time';

  const yModeOptions: { value: YMode; label: string }[] = [
    { value: 'rate', label: 'g/h' },
    { value: 'fluid', label: 'ml/h' },
    { value: 'sum', label: strings.sumMode },
  ];
  const xUnitOptions: { value: XUnit; label: string }[] = [
    { value: 'km', label: 'km' },
    { value: 'h', label: strings.axisTime },
  ];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: '6px 8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{strings.curve}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {showUnits && (
            <div style={segGroupStyle}>
              {xUnitOptions.map((opt) => (
                <button key={opt.value} onClick={() => setXUnit(opt.value)} style={segButton(xUnit === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div style={segGroupStyle}>
            {yModeOptions.map((opt) => (
              <button key={opt.value} onClick={() => setYMode(opt.value)} style={segButton(yMode === opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
              background: summary.coverage >= 92 && summary.coverage <= 115 ? '#E7F2E1' : '#FBEAE1',
              color: summary.coverage >= 92 && summary.coverage <= 115 ? '#3D7A26' : '#A3512A',
            }}
          >
            {summary.coverage}%
          </span>
        </span>
      </div>
      <Chart height={120} showAxis={false} />
      <MobileLanesSection />
    </div>
  );
}
