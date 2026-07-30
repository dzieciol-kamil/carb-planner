import type { CSSProperties } from 'react';
import { carbsFill, partsOf } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';

function mixSplit(carbs: number, ratio: number): { malto: number; fructose: number } {
  return { malto: (carbs * ratio) / (ratio + 1), fructose: carbs / (ratio + 1) };
}

const rowStyle: CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid #F0F1ED', padding: '8px 0' };

export function MobileMixSheet() {
  const open = useAppStore((s) => s.ui.mixSheet);
  const closeMixSheet = useAppStore((s) => s.closeMixSheet);
  const lang = useAppStore((s) => s.ui.lang);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const mix = useAppStore((s) => s.mix);
  const strings = t(lang);

  if (!open) return null;

  const groups = gear
    .map((vessel) => ({ vessel, vesselFills: fills.filter((f) => f.gid === vessel.gid) }))
    .filter((g) => g.vesselFills.length > 0);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 26, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px 10px', borderBottom: '1px solid var(--border-soft)' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{strings.mixSheetTitle}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.mixSheetSubtitle}</div>
        </div>
        <button
          type="button"
          onClick={closeMixSheet}
          style={{ width: 38, height: 38, border: '1px solid var(--chip-border)', borderRadius: 11, background: '#fff', cursor: 'pointer', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {groups.length === 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{strings.mixSheetEmpty}</p>}

        {groups.map(({ vessel, vesselFills }) => (
          <div key={vessel.gid}>
            {vesselFills.map((fill, i) => {
              const carbs = carbsFill(fill, gear, mix);
              const n = partsOf(fill, gear);
              const split = mixSplit(carbs, mix.ratio || 2);
              const salt = (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelSalt : mix.salt);
              const citric = (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelCitric : mix.citric);

              const lines: { k: string; v: string }[] =
                fill.content === 'water'
                  ? [{ k: strings.mixRowWater, v: vessel.vol + ' ml' }]
                  : [
                      { k: strings.mixRowSugar, v: carbs.toFixed(0) + ' g' },
                      { k: strings.mixRowMalto, v: split.malto.toFixed(1) + ' g' },
                      { k: strings.mixRowFructose, v: split.fructose.toFixed(1) + ' g' },
                      { k: strings.mixRowSalt, v: salt.toFixed(2) + ' g' },
                      { k: strings.mixRowCitric, v: citric.toFixed(2) + ' g' },
                      { k: strings.mixRowWater, v: vessel.vol + ' ml' },
                    ];

              return (
                <div key={fill.fid} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {vessel.name} · napełnienie {i + 1}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted-3)', marginBottom: 4 }}>
                    {vessel.vol} ml{fill.content === 'gel' ? ' · ' + n + '×' : ''}
                  </div>
                  {lines.map((line) => (
                    <div key={line.k} style={rowStyle}>
                      <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{line.k}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 }}>{line.v}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
