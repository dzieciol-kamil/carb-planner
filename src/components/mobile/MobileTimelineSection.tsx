import type { CSSProperties } from 'react';
import { carbsFill, dist, rangeLabel } from '../../domain/fuel';
import { gaps } from '../../domain/dragMath';
import type { Fill, FoodItem, MixSettings, RouteInput, Vessel, XUnit } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS, sourceColor } from '../chart/theme';

function contentLabel(content: Fill['content'], lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function foodName(fd: FoodItem, foodLib: { key: string; pl: string; en: string }[], lang: Lang): string {
  const entry = foodLib.find((x) => x.key === fd.key);
  return (entry && (entry[lang] || entry.en)) || fd.name || '—';
}

const groupCardStyle: CSSProperties = { border: '1px solid #E9EBE5', borderRadius: 12, padding: '11px 12px', background: '#F9FAF7' };
const groupHeadStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 };
const itemCardStyle: CSSProperties = { border: '1px solid #E9EBE5', borderRadius: 10, padding: '9px 10px', background: '#fff' };
const metaStyle: CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' };

function chip(active: boolean, color: string): CSSProperties {
  return {
    border: '1px solid ' + (active ? color : 'var(--chip-border)'),
    background: active ? color : '#fff',
    color: active ? '#fff' : 'var(--ink-soft)',
    borderRadius: 7,
    padding: '7px 4px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
    flex: 1,
  };
}

export function MobileTimelineSection() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const addFillInGap = useAppStore((s) => s.addFillInGap);
  const strings = t(lang);
  const distanceKm = dist(route);
  const itemCountLabel = `${fills.length + foods.length} ${strings.itemsSuffix}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{strings.timeline}</span>
        <span style={metaStyle}>{itemCountLabel}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gear.map((vessel) => (
          <VesselGroup
            key={vessel.gid}
            vessel={vessel}
            fills={fills.filter((f) => f.gid === vessel.gid).sort((a, b) => a.from - b.from)}
            route={route}
            mix={mix}
            xUnit={xUnit}
            distanceKm={distanceKm}
            lang={lang}
            addFillInGap={addFillInGap}
          />
        ))}
        <FoodGroup foods={foods} foodLib={foodLib} route={route} xUnit={xUnit} lang={lang} />
      </div>
    </div>
  );
}

interface VesselGroupProps {
  vessel: Vessel;
  fills: Fill[];
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  distanceKm: number;
  lang: Lang;
  addFillInGap: (gid: string) => void;
}

function VesselGroup({ vessel, fills, route, mix, xUnit, distanceKm, lang, addFillInGap }: VesselGroupProps) {
  const strings = t(lang);
  const setFillContent = useAppStore((s) => s.setFillContent);
  const removeFill = useAppStore((s) => s.removeFill);
  const can = gaps(fills, distanceKm).length > 0;

  return (
    <div style={groupCardStyle}>
      <div style={groupHeadStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: CHART_COLORS.carb, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>{vessel.name}</span>
        </span>
        <span style={metaStyle}>
          {fills.length} × {strings.fill.toLowerCase()} · {Math.max(0, fills.length - 1)} {strings.refills}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {fills.map((f, idx) => (
          <div key={f.fid} style={itemCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: sourceColor(f.content), flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {strings.fill} {idx + 1} · {contentLabel(f.content, lang)}
                </span>
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{rangeLabel(f.from, f.to, false, route, xUnit)}</span>
            </div>
            {(vessel.allowed || []).length > 1 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {(vessel.allowed || []).map((k) => (
                  <button key={k} onClick={() => setFillContent(f.fid, k)} style={chip(f.content === k, sourceColor(k))}>
                    {contentLabel(k, lang)}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{carbsFill(f, [vessel], mix).toFixed(0)} g</span>
              <button
                onClick={() => removeFill(f.fid)}
                style={{ width: 30, height: 30, border: '1px solid var(--chip-border)', background: '#fff', borderRadius: 6, fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer', lineHeight: 1, padding: 0 }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => addFillInGap(vessel.gid)}
        disabled={!can}
        style={{
          marginTop: 8,
          width: '100%',
          border: '1px dashed ' + (can ? '#C9CEC7' : '#E6E8E2'),
          background: can ? '#fff' : '#FBFCFA',
          color: can ? 'var(--ink-soft)' : '#B7BCB6',
          borderRadius: 9,
          padding: '9px 12px',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'Archivo, sans-serif',
          cursor: can ? 'pointer' : 'not-allowed',
        }}
      >
        {can ? strings.addFill : strings.noRoom}
      </button>
    </div>
  );
}

interface FoodGroupProps {
  foods: FoodItem[];
  foodLib: { key: string; pl: string; en: string }[];
  route: RouteInput;
  xUnit: XUnit;
  lang: Lang;
}

function FoodGroup({ foods, foodLib, route, xUnit, lang }: FoodGroupProps) {
  const strings = t(lang);
  const setFoodContinuous = useAppStore((s) => s.setFoodContinuous);
  const removeFood = useAppStore((s) => s.removeFood);
  const sorted = foods.slice().sort((a, b) => a.from - b.from);
  const totalCarbs = foods.reduce((a, f) => a + f.carbs, 0);

  return (
    <div style={groupCardStyle}>
      <div style={groupHeadStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: CHART_COLORS.food, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>{strings.foodLane}</span>
        </span>
        <span style={metaStyle}>
          {foods.length}× · {totalCarbs.toFixed(0)} g
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sorted.map((fd) => {
          const point = !fd.cont;
          return (
            <div key={fd.id} style={itemCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: CHART_COLORS.food, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{foodName(fd, foodLib, lang)}</span>
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{rangeLabel(fd.from, fd.to, point, route, xUnit)}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button onClick={() => setFoodContinuous(fd.id, false)} style={chip(point, CHART_COLORS.food)}>
                  {strings.shotMode}
                </button>
                <button onClick={() => setFoodContinuous(fd.id, true)} style={chip(!point, CHART_COLORS.food)}>
                  {strings.contMode}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
                  {fd.carbs} g{fd.ml ? ` · ${fd.ml} ml` : ''}
                </span>
                <button
                  onClick={() => removeFood(fd.id)}
                  style={{ width: 30, height: 30, border: '1px solid var(--chip-border)', background: '#fff', borderRadius: 6, fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, width: '100%', color: '#9AA09B', fontSize: 11, fontFamily: 'Archivo, sans-serif', padding: '6px 0', textAlign: 'left' }}>{strings.addFoodHint}</div>
    </div>
  );
}
