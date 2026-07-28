import type { CSSProperties } from 'react';
import { absCap, planSummary } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore, type YMode } from '../../store/appStore';
import type { XUnit } from '../../domain/types';
import { FoodLibraryChips } from '../FoodLibraryChips';
import { LanesSection } from '../lanes/LanesSection';
import { TimelineSection } from '../timeline/TimelineSection';
import { Chart } from './Chart';

function segButton(on: boolean, small = false): CSSProperties {
  return {
    border: 'none',
    borderRadius: 6,
    padding: small ? '4px 8px' : '5px 10px',
    fontSize: small ? 10 : 11,
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    background: on ? '#fff' : 'transparent',
    color: on ? 'var(--ink)' : 'var(--muted)',
    boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
  };
}

const segGroupStyle: CSSProperties = { display: 'flex', background: 'var(--track)', borderRadius: 8, padding: 3, gap: 2 };
const legendItemStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--muted-2)' };

export function ChartCard() {
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

  const planState = { route, mix, gear, fills, foods, foodLib };
  const summary = planSummary(planState);
  const cap = absCap(mix);

  const showEaten = yMode === 'sum' && summary.totalCarbs - summary.absorbedTotal > 5;
  const showGutLane = yMode !== 'fluid';
  const showUnits = route.mode !== 'time';
  const legMain = yMode === 'fluid' ? strings.legFluid : strings.absorbed;
  const legNeed = yMode === 'fluid' ? strings.legSweat : strings.need;
  const legMainColor = yMode === 'fluid' ? 'var(--water)' : 'var(--carb)';
  const showCapLeg = yMode !== 'sum';
  const capNote = yMode === 'fluid' ? strings.capNoteFluid : strings.capNote + cap + ' g/h' + strings.capNote2;

  const yModeOptions: { value: YMode; label: string }[] = [
    { value: 'rate', label: strings.carbMode },
    { value: 'fluid', label: strings.fluidMode },
    { value: 'sum', label: strings.sumMode },
  ];
  const xUnitOptions: { value: XUnit; label: string }[] = [
    { value: 'km', label: 'km' },
    { value: 'h', label: strings.axisTime },
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{strings.curve}</div>
        <div style={{ display: 'flex', gap: 14, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={legendItemStyle}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: legMainColor }} />
            {legMain}
          </span>
          {showEaten && (
            <span style={legendItemStyle}>
              <span style={{ width: 14, height: 0, borderTop: '2px dotted var(--carb)' }} />
              {strings.intake}
            </span>
          )}
          <span style={legendItemStyle}>
            <span style={{ width: 14, height: 0, borderTop: '2px dashed #A8AEA9' }} />
            {legNeed}
          </span>
          {showCapLeg && (
            <span style={legendItemStyle}>
              <span style={{ width: 14, height: 0, borderTop: '2px dotted ' + (yMode === 'fluid' ? 'var(--water)' : 'var(--carb)') }} />
              {strings.legCap}
            </span>
          )}
          {showGutLane && (
            <span style={legendItemStyle}>
              <span style={{ width: 14, height: 8, borderRadius: 2, background: '#DCC98A' }} />
              {strings.gutLane}
            </span>
          )}
          <div style={segGroupStyle}>
            {yModeOptions.map((opt) => (
              <button key={opt.value} onClick={() => setYMode(opt.value)} style={segButton(yMode === opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          {showUnits && (
            <div style={segGroupStyle}>
              {xUnitOptions.map((opt) => (
                <button key={opt.value} onClick={() => setXUnit(opt.value)} style={segButton(xUnit === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12 }}>
        <div style={{ width: 168, flex: '0 0 168px', display: 'flex', flexDirection: 'column', gap: 44 }}>
          {yMode === 'sum' && <span style={{ fontSize: 11, lineHeight: 1.45, color: '#8A918C' }}>{strings.curveHintSum}</span>}
          {yMode === 'rate' && <span style={{ fontSize: 11, lineHeight: 1.45, color: '#8A918C' }}>{strings.curveHint}</span>}
          <span style={{ fontSize: 11, lineHeight: 1.45, color: '#8A918C' }}>{capNote}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Chart height={300} showAxis />
        </div>
        <div style={{ width: 40, flex: '0 0 40px' }} />
      </div>

      <LanesSection />
      <FoodLibraryChips />
      <TimelineSection />
    </div>
  );
}
