import type { CSSProperties } from 'react';
import { gaps } from '../../domain/dragMath';
import { dist } from '../../domain/fuel';
import { packFoodRows } from '../../domain/laneLayout';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { MobileFillBar, MobileFillEditRow } from './MobileFillBar';
import { MobileFoodBar, MobileFoodEditRow } from './MobileFoodBar';

const trackStyle: CSSProperties = { position: 'relative', flex: 1, minWidth: 0, height: 15, background: '#F4F5F2', borderRadius: 6 };
const foodTrackStyle: CSSProperties = { ...trackStyle, background: '#FAF3EF' };
const labelStyle: CSSProperties = { width: 60, flex: '0 0 60px', fontSize: 10, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const addButtonStyle = (can: boolean): CSSProperties => ({
  width: 22,
  height: 22,
  borderRadius: 7,
  cursor: can ? 'pointer' : 'not-allowed',
  border: '1px dashed ' + (can ? '#B9C0B7' : '#E6E8E2'),
  background: can ? '#F7F8F5' : '#FBFCFA',
  color: can ? 'var(--ink-soft)' : '#C9CEC7',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
  padding: 0,
  fontFamily: 'Archivo, sans-serif',
});

export function MobileLanesSection() {
  const route = useAppStore((s) => s.route);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const lang = useAppStore((s) => s.ui.lang);
  const addFillInGap = useAppStore((s) => s.addFillInGap);
  const distanceKm = dist(route);
  const foodRows = packFoodRows(foods, distanceKm);
  const strings = t(lang);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
      {gear.map((vessel) => {
        const vesselFills = fills.filter((f) => f.gid === vessel.gid).sort((a, b) => a.from - b.from);
        const can = gaps(vesselFills, distanceKm).length > 0;
        return (
          <div key={vessel.gid}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={labelStyle}>{vessel.name}</span>
              <div style={trackStyle}>
                {vesselFills.map((f) => (
                  <MobileFillBar key={f.fid} fill={f} vessel={vessel} distanceKm={distanceKm} />
                ))}
              </div>
              <button onClick={() => addFillInGap(vessel.gid)} disabled={!can} style={addButtonStyle(can)}>
                +
              </button>
            </div>
            {vesselFills.map((f) => (
              <MobileFillEditRow key={f.fid} fill={f} vessel={vessel} />
            ))}
          </div>
        );
      })}

      {foodRows.map((row, i) => (
        <div key={'food' + i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...labelStyle, color: i === 0 ? 'var(--ink-soft)' : 'transparent' }}>{i === 0 ? strings.foodLane : ''}</span>
            <div style={foodTrackStyle}>
              {row.map((fd) => (
                <MobileFoodBar key={fd.id} food={fd} distanceKm={distanceKm} />
              ))}
            </div>
            <span style={{ width: 22, flex: '0 0 22px' }} />
          </div>
          {row.map((fd) => (
            <MobileFoodEditRow key={fd.id} food={fd} />
          ))}
        </div>
      ))}
    </div>
  );
}
