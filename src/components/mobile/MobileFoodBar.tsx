import type { CSSProperties } from 'react';
import { rangeLabel } from '../../domain/fuel';
import type { FoodItem, FoodLibEntry } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from '../chart/theme';
import { createFoodDragHandler, stopPointerDown } from '../lanes/dragHandlers';

function foodName(fd: FoodItem, foodLib: FoodLibEntry[], lang: 'pl' | 'en'): string {
  const entry = foodLib.find((x) => x.key === fd.key);
  return (entry && (entry[lang] || entry.en)) || fd.name || '—';
}

interface MobileFoodProps {
  food: FoodItem;
  distanceKm: number;
}

export function MobileFoodBar({ food, distanceKm }: MobileFoodProps) {
  const lang = useAppStore((s) => s.ui.lang);
  const foodLib = useAppStore((s) => s.foodLib);
  const selKey = useAppStore((s) => s.ui.selKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const setSelKey = useAppStore((s) => s.setSelKey);

  const key = 'x' + food.id;
  const selected = selKey === key;
  const dragging = dragKey === key;
  const point = !food.cont;
  const leftPct = (food.from / distanceKm) * 100;

  const base: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: `${leftPct}%`,
    background: CHART_COLORS.food,
    pointerEvents: 'auto',
    opacity: dragging ? 1 : 0.9,
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    cursor: 'pointer',
    touchAction: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    outline: selected ? '2px solid var(--ink)' : 'none',
    outlineOffset: 1,
    boxShadow: dragging ? '0 3px 10px rgba(0,0,0,0.25)' : 'none',
  };
  const barStyle: CSSProperties = point
    ? { ...base, paddingLeft: 3, paddingRight: 3, borderRadius: '0 4px 4px 0', borderLeft: '3px solid var(--ink)' }
    : { ...base, width: `${Math.max(1.2, ((food.to - food.from) / distanceKm) * 100)}%`, paddingLeft: 4, borderRadius: 4 };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div onPointerDown={createFoodDragHandler(food.id, 'move')} onClick={() => setSelKey(selected ? null : key)} style={barStyle}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace", pointerEvents: 'none' }}>{foodName(food, foodLib, lang).slice(0, 6)}</span>
        {!point && (
          <>
            <span onPointerDown={createFoodDragHandler(food.id, 'left')} style={{ position: 'absolute', left: -9, top: -2, bottom: -2, width: 18, cursor: 'ew-resize', touchAction: 'none', zIndex: 5 }} />
            <span onPointerDown={createFoodDragHandler(food.id, 'resize')} style={{ position: 'absolute', right: -9, top: -2, bottom: -2, width: 18, cursor: 'ew-resize', touchAction: 'none', zIndex: 5 }} />
          </>
        )}
      </div>
    </div>
  );
}

export function MobileFoodEditRow({ food }: { food: FoodItem }) {
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const route = useAppStore((s) => s.route);
  const selKey = useAppStore((s) => s.ui.selKey);
  const removeFood = useAppStore((s) => s.removeFood);
  const setFoodContinuous = useAppStore((s) => s.setFoodContinuous);
  const strings = t(lang);
  const key = 'x' + food.id;

  if (selKey !== key) return null;
  const point = !food.cont;

  function chip(active: boolean): CSSProperties {
    return {
      border: '1px solid ' + (active ? CHART_COLORS.food : 'var(--chip-border)'),
      background: active ? CHART_COLORS.food : '#fff',
      color: active ? '#fff' : 'var(--ink-soft)',
      borderRadius: 6,
      padding: '3px 8px',
      fontSize: 10,
      fontWeight: 700,
      fontFamily: 'Archivo, sans-serif',
      cursor: 'pointer',
    };
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '3px 0 5px 68px', padding: '5px 6px', border: '1px solid var(--border)', borderRadius: 8, background: '#FBFCFA' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted-2)', flex: '0 0 auto' }}>{rangeLabel(food.from, food.to, point, route, xUnit)}</span>
      <button onClick={() => setFoodContinuous(food.id, false)} onPointerDown={stopPointerDown} style={chip(point)}>
        {strings.shotMode}
      </button>
      <button onClick={() => setFoodContinuous(food.id, true)} onPointerDown={stopPointerDown} style={chip(!point)}>
        {strings.contMode}
      </button>
      <button
        onClick={() => removeFood(food.id)}
        style={{ marginLeft: 'auto', border: '1px solid #E3D3CD', background: '#fff', color: 'var(--food)', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'Archivo, sans-serif', cursor: 'pointer' }}
      >
        {strings.removeItem}
      </button>
    </div>
  );
}
