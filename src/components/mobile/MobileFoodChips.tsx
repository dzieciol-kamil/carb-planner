import type { CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from '../chart/theme';

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid var(--chip-border)',
  background: '#fff',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'Archivo, sans-serif',
  fontWeight: 600,
  color: 'var(--ink)',
  padding: '7px 11px',
  fontSize: 12,
};

export function MobileFoodChips() {
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const addFoodFromLibrary = useAppStore((s) => s.addFoodFromLibrary);
  const strings = t(lang);

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--muted-2)', marginBottom: 8 }}>{strings.addFuel}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {foodLib.map((entry) => (
          <button key={entry.key} onClick={() => addFoodFromLibrary(entry.key)} style={chipStyle}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: CHART_COLORS.food, flexShrink: 0, display: 'inline-block' }} />
            <span>{entry[lang] || entry.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
