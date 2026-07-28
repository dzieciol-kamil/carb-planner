import type { CSSProperties } from 'react';
import { carbsFill, fmtX, partsOf, rangeLabel } from '../../domain/fuel';
import type { Fill, MixSettings, RouteInput, Vessel, XUnit } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';

function contentLabel(content: Fill['content'], lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function mixSplit(carbs: number, ratio: number): { malto: number; fructose: number } {
  return { malto: (carbs * ratio) / (ratio + 1), fructose: carbs / (ratio + 1) };
}

const cardStyle: CSSProperties = { border: '1px solid var(--border-soft)', borderRadius: 12, overflow: 'hidden' };
const cardHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 14px',
  background: '#F4F5F2',
  borderBottom: '1px solid var(--border-soft)',
};
const fillBlockStyle: CSSProperties = { padding: '10px 0', borderBottom: '1px solid #F2F3EF' };

export function RecipesSection() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const openPanel = useAppStore((s) => s.openPanel);
  const strings = t(lang);

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px 24px', flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{strings.recipes}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 4 }}>{strings.recipesHint}</div>
        </div>
        <button
          onClick={() => openPanel('mix')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--chip-border)',
            background: '#fff',
            borderRadius: 9,
            padding: '7px 12px',
            fontFamily: 'Archivo, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>{strings.editInSettings}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {gear.map((vessel) => (
          <VesselRecipeCard key={vessel.gid} vessel={vessel} fills={fills.filter((f) => f.gid === vessel.gid).sort((a, b) => a.from - b.from)} route={route} mix={mix} xUnit={xUnit} lang={lang} />
        ))}
      </div>
    </div>
  );
}

interface VesselRecipeCardProps {
  vessel: Vessel;
  fills: Fill[];
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  lang: Lang;
}

function VesselRecipeCard({ vessel, fills, route, mix, xUnit, lang }: VesselRecipeCardProps) {
  const strings = t(lang);

  return (
    <div style={cardStyle}>
      <div style={cardHeadStyle}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{vessel.name}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.85 }}>
          {vessel.vol} ml · {fills.length}× · {Math.max(0, fills.length - 1)} {strings.refills}
        </span>
      </div>
      <div style={{ padding: '4px 14px 12px' }}>
        {fills.map((f, i) => (
          <FillRecipe key={f.fid} fill={f} index={i} vessel={vessel} route={route} mix={mix} xUnit={xUnit} lang={lang} />
        ))}
      </div>
    </div>
  );
}

interface FillRecipeProps {
  fill: Fill;
  index: number;
  vessel: Vessel;
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  lang: Lang;
}

function FillRecipe({ fill, index, vessel, route, mix, xUnit, lang }: FillRecipeProps) {
  const strings = t(lang);
  const carbs = carbsFill(fill, [vessel], mix);
  const n = partsOf(fill, [vessel]);
  const split = mixSplit(carbs, mix.ratio || 2);

  const lines: { k: string; v: string }[] =
    fill.content === 'water'
      ? [{ k: strings.waterFill, v: `${vessel.vol} ml` }]
      : [
          { k: strings.carbsIn, v: `${carbs.toFixed(0)} g` },
          { k: strings.malto, v: `${split.malto.toFixed(1)} g` },
          { k: strings.fructose, v: `${split.fructose.toFixed(1)} g` },
          { k: strings.salt, v: `${((vessel.vol / 100) * (fill.content === 'gel' ? mix.gelSalt : mix.salt)).toFixed(2)} g` },
          { k: strings.citric, v: `${((vessel.vol / 100) * (fill.content === 'gel' ? mix.gelCitric : mix.citric)).toFixed(2)} g` },
          { k: strings.waterFill, v: `${vessel.vol} ml` },
        ];
  if (fill.content === 'gel' && n > 1) lines.push({ k: strings.perPortion, v: `${(carbs / n).toFixed(0)} g / ${Math.round(vessel.vol / n)} ml` });
  if (index > 0) lines.push({ k: strings.refillAt + fmtX(fill.from, true, route, xUnit), v: `#${index + 1}` });

  return (
    <div style={fillBlockStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {strings.fill} {index + 1} · {rangeLabel(fill.from, fill.to, false, route, xUnit)}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 999,
            color: '#fff',
            background: sourceColor(fill.content),
            whiteSpace: 'nowrap',
          }}
        >
          {contentLabel(fill.content, lang)}
          {fill.content === 'gel' ? ` ${n}×` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {lines.map((line) => (
          <div key={line.k} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{line.k}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>{line.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
