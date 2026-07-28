import type { CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore, type MobileTab } from '../../store/appStore';

const TABS: MobileTab[] = ['plan', 'gear', 'food', 'me'];

function iconStyle(shape: MobileTab, active: boolean): CSSProperties {
  return {
    width: 18,
    height: 18,
    borderRadius: shape === 'plan' ? 4 : shape === 'gear' ? 9 : shape === 'food' ? 2 : 9,
    border: '2px solid ' + (active ? 'var(--ink)' : '#B0B5B0'),
    display: 'block',
    marginBottom: 4,
  };
}

export function MobileTabBar() {
  const lang = useAppStore((s) => s.ui.lang);
  const tab = useAppStore((s) => s.ui.tab);
  const setTab = useAppStore((s) => s.setTab);
  const strings = t(lang);

  const labels: Record<MobileTab, string> = {
    plan: strings.tabPlan,
    gear: strings.tabGear,
    food: strings.tabFood,
    me: strings.tabMe,
  };

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-soft)', background: '#fff', padding: '9px 18px 18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
      {TABS.map((k) => (
        <button
          key={k}
          onClick={() => setTab(k)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Archivo, sans-serif', color: tab === k ? 'var(--ink)' : '#9AA09B' }}
        >
          <span style={iconStyle(k, tab === k)} />
          <span style={{ fontSize: 10, fontWeight: 600 }}>{labels[k]}</span>
        </button>
      ))}
    </div>
  );
}
