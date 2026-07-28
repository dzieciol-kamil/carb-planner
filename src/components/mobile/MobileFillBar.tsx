import { partArray, partsOf, rangeLabel, volOf } from '../../domain/fuel';
import type { Fill, Vessel } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { createFillDragHandler, createGelPartDragHandler, stopPointerDown } from '../lanes/dragHandlers';

function contentLabel(content: Fill['content'], lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

interface MobileFillProps {
  fill: Fill;
  vessel: Vessel;
  distanceKm: number;
}

export function MobileFillBar({ fill, distanceKm }: MobileFillProps) {
  const selKey = useAppStore((s) => s.ui.selKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const setSelKey = useAppStore((s) => s.setSelKey);
  const gear = useAppStore((s) => s.gear);

  const key = 'f' + fill.fid;
  const selected = selKey === key;
  const dragging = dragKey === key;
  const color = sourceColor(fill.content);
  const n = partsOf(fill, gear);
  const short = fill.content === 'gel' ? `${n}×` : `${volOf(fill, gear)}`;
  const leftPct = (fill.from / distanceKm) * 100;
  const widthPct = Math.max(1.2, ((fill.to - fill.from) / distanceKm) * 100);
  const parts = n > 1 ? partArray(fill, gear) : [];

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div
        onPointerDown={createFillDragHandler(fill.fid, 'move')}
        onClick={() => setSelKey(selected ? null : key)}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          background: color,
          opacity: dragging ? 1 : 0.9,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 4,
          boxSizing: 'border-box',
          cursor: 'pointer',
          touchAction: 'none',
          pointerEvents: 'auto',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          outline: selected ? '2px solid var(--ink)' : 'none',
          outlineOffset: 1,
          boxShadow: dragging ? '0 3px 10px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace", pointerEvents: 'none' }}>{short}</span>
        <span onPointerDown={createFillDragHandler(fill.fid, 'left')} style={{ position: 'absolute', left: -8, top: -2, bottom: -2, width: 18, cursor: 'ew-resize', touchAction: 'none', zIndex: 5 }} />
        <span onPointerDown={createFillDragHandler(fill.fid, 'resize')} style={{ position: 'absolute', right: -8, top: -2, bottom: -2, width: 18, cursor: 'ew-resize', touchAction: 'none', zIndex: 5 }} />
        {parts.slice(1).map((_, i) => {
          const k = i + 1;
          const rel = ((parts[k] - fill.from) / Math.max(0.1, fill.to - fill.from)) * 100;
          const isLast = k === n - 1;
          return (
            <span
              key={k}
              onPointerDown={createGelPartDragHandler(fill.fid, k)}
              style={{ position: 'absolute', top: -1, bottom: -1, left: isLast ? 'calc(100% - 16px)' : `calc(${rel}% - 6px)`, width: 12, cursor: 'ew-resize', touchAction: 'none', pointerEvents: 'auto', zIndex: 2, display: 'flex', justifyContent: 'center' }}
            >
              <span style={{ width: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 2, pointerEvents: 'none', marginTop: 3, marginBottom: 3 }} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function MobileFillEditRow({ fill, vessel }: { fill: Fill; vessel: Vessel }) {
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const route = useAppStore((s) => s.route);
  const selKey = useAppStore((s) => s.ui.selKey);
  const removeFill = useAppStore((s) => s.removeFill);
  const setFillContent = useAppStore((s) => s.setFillContent);
  const strings = t(lang);
  const key = 'f' + fill.fid;

  if (selKey !== key) return null;
  const allowed = vessel.allowed || [];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '3px 0 5px 68px', padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 8, background: '#FBFCFA' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted-2)', flex: '0 0 auto' }}>{rangeLabel(fill.from, fill.to, false, route, xUnit)}</span>
      {allowed.length > 1 &&
        allowed.map((k) => (
          <button
            key={k}
            onClick={() => setFillContent(fill.fid, k)}
            onPointerDown={stopPointerDown}
            style={{
              border: '1px solid ' + (fill.content === k ? sourceColor(k) : 'var(--chip-border)'),
              background: fill.content === k ? sourceColor(k) : '#fff',
              color: fill.content === k ? '#fff' : 'var(--ink-soft)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {contentLabel(k, lang)}
          </button>
        ))}
      <button
        onClick={() => removeFill(fill.fid)}
        style={{ marginLeft: 'auto', border: '1px solid #E3D3CD', background: '#fff', color: 'var(--food)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}
      >
        {strings.removeItem}
      </button>
    </div>
  );
}
