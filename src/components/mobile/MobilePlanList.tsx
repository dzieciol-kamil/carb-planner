import type { CSSProperties } from 'react';
import { gaps } from '../../domain/dragMath';
import { dist, planSummary } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { MobilePlanCard, type PlanCardItem } from './MobilePlanCard';

const MIN_GAP_KM = 6;

function coverageCardStyle(inNorm: boolean): CSSProperties {
  return {
    flex: 1,
    borderRadius: 13,
    padding: '11px 12px',
    background: inNorm ? '#E7F2E1' : '#FBEAE1',
  };
}

export function MobilePlanList() {
  const lang = useAppStore((s) => s.ui.lang);
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const shops = useAppStore((s) => s.shops);
  const addFillInGap = useAppStore((s) => s.addFillInGap);
  const addFoodFromLibrary = useAppStore((s) => s.addFoodFromLibrary);
  const removeShop = useAppStore((s) => s.removeShop);
  const openShopSheet = useAppStore((s) => s.openShopSheet);
  const openMixSheet = useAppStore((s) => s.openMixSheet);
  const strings = t(lang);

  const summary = planSummary({ route, mix, gear, fills, foods, foodLib });
  const distanceKm = dist(route);

  const carbPct = summary.target > 0 ? Math.round((summary.absorbedTotal / summary.target) * 100) : 100;
  const carbInNorm = carbPct >= 90 && carbPct <= 115;
  const hydPct = summary.hydrationPct;
  const hydInNorm = hydPct >= 70;

  const items: PlanCardItem[] = [
    ...fills.map((f): PlanCardItem => ({ kind: 'fill', fid: f.fid })),
    ...foods.map((f): PlanCardItem => ({ kind: 'food', id: f.id })),
  ].sort((a, b) => {
    const fromOf = (item: PlanCardItem) =>
      item.kind === 'fill' ? (fills.find((f) => f.fid === item.fid)?.from ?? 0) : (foods.find((f) => f.id === item.id)?.from ?? 0);
    return fromOf(a) - fromOf(b);
  });

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <div style={coverageCardStyle(carbInNorm)}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: carbInNorm ? '#3D7A26' : '#A3512A' }}>{strings.carbCardTitle}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: carbInNorm ? '#3D7A26' : '#A3512A' }}>{carbPct}%</div>
          <div style={{ height: 4, borderRadius: 2, background: '#fff', overflow: 'hidden', margin: '6px 0' }}>
            <div style={{ width: Math.min(100, carbPct) + '%', height: '100%', background: carbInNorm ? '#3D7A26' : '#A3512A' }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: carbInNorm ? '#3D7A26' : '#A3512A' }}>
            {Math.round(summary.absorbedTotal)} / {Math.round(summary.target)} g
          </div>
        </div>
        <div style={coverageCardStyle(hydInNorm)}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: hydInNorm ? '#3D7A26' : '#A3512A' }}>{strings.hydration}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: hydInNorm ? '#3D7A26' : '#A3512A' }}>{hydPct}%</div>
          <div style={{ height: 4, borderRadius: 2, background: '#fff', overflow: 'hidden', margin: '6px 0' }}>
            <div style={{ width: Math.min(100, hydPct) + '%', height: '100%', background: hydInNorm ? '#3D7A26' : '#A3512A' }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: hydInNorm ? '#3D7A26' : '#A3512A' }}>
            {summary.fluidPlanned} / {summary.sweatLoss} ml
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>PLAN</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
          {items.length} {strings.itemsSuffix}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <MobilePlanCard key={item.kind + (item.kind === 'fill' ? item.fid : item.id)} item={item} />
        ))}
      </div>

      {gear.map((vessel) => {
        const hasGap = gaps(
          fills.filter((f) => f.gid === vessel.gid),
          distanceKm,
        ).some(([lo, hi]) => hi - lo >= MIN_GAP_KM);
        return (
          <button
            key={vessel.gid}
            type="button"
            disabled={!hasGap}
            onClick={() => addFillInGap(vessel.gid)}
            style={{
              border: '1px dashed #C9CEC7',
              borderRadius: 11,
              padding: 12,
              background: '#F7F8F5',
              fontFamily: 'Archivo, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: hasGap ? 'var(--ink-soft)' : '#B7BCB6',
              cursor: hasGap ? 'pointer' : 'not-allowed',
              width: '100%',
            }}
          >
            {hasGap ? strings.addFillTo + vessel.name : vessel.name + ' · ' + strings.noGap}
          </button>
        );
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {foodLib.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => addFoodFromLibrary(entry.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: '9px 12px',
              border: '1px solid var(--chip-border)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sourceColor('food') }} />
            <span style={{ fontSize: 12 }}>{entry[lang] || entry.en}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted-3)' }}>{entry.carbs}g</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {shops.map((shop) => (
          <span
            key={shop.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '7px 10px', border: '1px solid var(--chip-border)', fontSize: 12 }}
          >
            <button type="button" onClick={() => openShopSheet(shop.id)} style={{ border: 'none', background: 'transparent', padding: 0, font: 'inherit', cursor: 'pointer' }}>
              {shop.name} · {shop.at} km
            </button>
            <button type="button" onClick={() => removeShop(shop.id)} style={{ border: 'none', background: 'transparent', color: '#B0B5B0', cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => openShopSheet(null)}
          style={{ border: '1px dashed #C9CEC7', borderRadius: 999, padding: '7px 12px', background: '#F7F8F5', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer' }}
        >
          + {strings.addLandmark}
        </button>
      </div>

      <button
        type="button"
        onClick={openMixSheet}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F9FAF7',
          border: 'none',
          borderRadius: 12,
          padding: '15px 12px',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{strings.bidonComposition}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{strings.perFillGrams}</span>
      </button>
    </div>
  );
}
