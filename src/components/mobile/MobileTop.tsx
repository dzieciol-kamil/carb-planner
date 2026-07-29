import { planSummary, totalHours } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { NumberInput } from '../ui/NumberInput';
import { durationLabel, routeLabel } from './mobileFormat';

export function MobileTopBar() {
  const route = useAppStore((s) => s.route);
  return (
    <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid var(--border-soft)', padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>CARB FUELING</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{routeLabel(route)}</span>
    </div>
  );
}

export function MobileHero() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);
  const summary = planSummary({ route, mix, gear, fills, foods, foodLib });

  return (
    <div style={{ background: 'var(--ink)', borderRadius: 16, padding: 16, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span>
        <span style={{ display: 'block', fontSize: 11, color: '#A8AEA9', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{strings.duration}</span>
        <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>{durationLabel(totalHours(route))}</span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span style={{ display: 'block', fontSize: 11, color: '#A8AEA9', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{strings.target}</span>
        <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
          {summary.target.toFixed(0)}
          <span style={{ fontSize: 14 }}>g</span>
        </span>
      </span>
    </div>
  );
}

export function MobileRouteInputs() {
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const setDistance = useAppStore((s) => s.setDistance);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const reconcilePlan = useAppStore((s) => s.reconcilePlan);
  const strings = t(lang);
  const inputStyle = { border: '1px solid var(--chip-border)', borderRadius: 10, padding: '11px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, width: '100%' } as const;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.distance} (km)</span>
        <NumberInput value={route.distance} onChange={setDistance} onCommit={reconcilePlan} zeroAsEmpty style={inputStyle} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.speed} (km/h)</span>
        <NumberInput value={route.speed} onChange={setSpeed} zeroAsEmpty style={inputStyle} />
      </label>
    </div>
  );
}
