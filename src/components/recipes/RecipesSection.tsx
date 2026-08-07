import type { CSSProperties } from 'react';
import { combinedMixGroups, startFillOf, type CombinedMixGroup } from '../../domain/combinedRefill';
import { carbsFill, citricAmount, fmtX, partsOf, rangeLabel } from '../../domain/fuel';
import type {
  CitricSource,
  Fill,
  MixSettings,
  RouteInput,
  Vessel,
  XUnit,
} from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';

function contentLabel(content: Fill['content'], lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function citricSourceLineLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
  return source === 'lemon'
    ? strings.citricSourceLemonJuice
    : source === 'lime'
      ? strings.citricSourceLimeJuice
      : strings.citric;
}

function mixSplit(carbs: number, ratio: number): { malto: number; fructose: number } {
  return { malto: (carbs * ratio) / (ratio + 1), fructose: carbs / (ratio + 1) };
}

const cardStyle: CSSProperties = {
  border: '1px solid var(--border-soft)',
  borderRadius: 12,
  overflow: 'hidden',
};
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
  const combineStartGids = useAppStore((s) => s.combineStartGids);
  const toggleCombineStart = useAppStore((s) => s.toggleCombineStart);
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const openPanel = useAppStore((s) => s.openPanel);
  const strings = t(lang);

  const selectedStartFills = combineStartGids
    .map((gid) => startFillOf(gid, fills))
    .filter((f): f is Fill => f != null);
  const showCombined = selectedStartFills.length > 1;
  const combinedGroups = showCombined ? combinedMixGroups(selectedStartFills, gear, mix) : [];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px 24px',
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {strings.recipes}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 4 }}>
            {strings.recipesHint}
          </div>
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

      {showCombined && (
        <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {strings.combineStartSectionTitle}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 4 }}>
              {strings.combineStartSectionHint}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ padding: '10px 14px 12px' }}>
              {combinedGroups.map((group) => (
                <CombinedGroupBlock key={group.content} group={group} lang={lang} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 14,
        }}
      >
        {gear.map((vessel) => (
          <VesselRecipeCard
            key={vessel.gid}
            vessel={vessel}
            fills={fills.filter((f) => f.gid === vessel.gid).sort((a, b) => a.from - b.from)}
            route={route}
            mix={mix}
            xUnit={xUnit}
            lang={lang}
            selected={combineStartGids.includes(vessel.gid)}
            showCombined={showCombined}
            onToggleCombineStart={() => toggleCombineStart(vessel.gid)}
          />
        ))}
      </div>
    </div>
  );
}

function CombinedGroupBlock({ group, lang }: { group: CombinedMixGroup; lang: Lang }) {
  const strings = t(lang);
  const lines: { k: string; v: string }[] =
    group.content === 'water'
      ? [{ k: strings.waterFill, v: `${group.volumeMl} ml` }]
      : [
          { k: strings.carbsIn, v: `${group.carbsG.toFixed(0)} g` },
          { k: strings.malto, v: `${group.maltoG.toFixed(1)} g` },
          { k: strings.fructose, v: `${group.fructoseG.toFixed(1)} g` },
          { k: strings.salt, v: `${group.saltG.toFixed(2)} g` },
          { k: strings.citric, v: `${group.citricG.toFixed(2)} g` },
          { k: strings.waterFill, v: `${group.volumeMl} ml` },
        ];

  return (
    <div style={fillBlockStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {contentLabel(group.content, lang)}
          {group.content === 'gel' ? ` ${group.parts}×` : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>
          {strings.combineStartBottles}: {group.vesselNames.join(', ')}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {lines.map((line) => (
          <div
            key={line.k}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{line.k}</span>
            <span
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}
            >
              {line.v}
            </span>
          </div>
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
  selected: boolean;
  showCombined: boolean;
  onToggleCombineStart: () => void;
}

function VesselRecipeCard({
  vessel,
  fills,
  route,
  mix,
  xUnit,
  lang,
  selected,
  showCombined,
  onToggleCombineStart,
}: VesselRecipeCardProps) {
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
          <FillRecipe
            key={f.fid}
            fill={f}
            index={i}
            vessel={vessel}
            route={route}
            mix={mix}
            xUnit={xUnit}
            lang={lang}
            selected={i === 0 && selected}
            showCombinedNote={i === 0 && selected && showCombined}
            onToggleCombineStart={i === 0 ? onToggleCombineStart : undefined}
          />
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
  selected: boolean;
  showCombinedNote: boolean;
  onToggleCombineStart: (() => void) | undefined;
}

function FillRecipe({
  fill,
  index,
  vessel,
  route,
  mix,
  xUnit,
  lang,
  selected,
  showCombinedNote,
  onToggleCombineStart,
}: FillRecipeProps) {
  const strings = t(lang);
  const carbs = carbsFill(fill, [vessel], mix);
  const n = partsOf(fill, [vessel]);
  const split = mixSplit(carbs, mix.ratio || 2);
  const citricSource = fill.content === 'gel' ? mix.gelCitricSource : mix.citricSource;
  const citricGrams = (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelCitric : mix.citric);
  const citric = citricAmount(citricGrams, citricSource);

  const lines: { k: string; v: string }[] =
    fill.content === 'water'
      ? [{ k: strings.waterFill, v: `${vessel.vol} ml` }]
      : [
          { k: strings.carbsIn, v: `${carbs.toFixed(0)} g` },
          { k: strings.malto, v: `${split.malto.toFixed(1)} g` },
          { k: strings.fructose, v: `${split.fructose.toFixed(1)} g` },
          {
            k: strings.salt,
            v: `${((vessel.vol / 100) * (fill.content === 'gel' ? mix.gelSalt : mix.salt)).toFixed(2)} g`,
          },
          {
            k: citricSourceLineLabel(citricSource, strings),
            v: `${citric.amount.toFixed(citric.unit === 'ml' ? 1 : 2)} ${citric.unit}`,
          },
          { k: strings.waterFill, v: `${vessel.vol} ml` },
        ];
  if (fill.content === 'gel' && n > 1)
    lines.push({
      k: strings.perPortion,
      v: `${(carbs / n).toFixed(0)} g / ${Math.round(vessel.vol / n)} ml`,
    });
  if (index > 0)
    lines.push({ k: strings.refillAt + fmtX(fill.from, true, route, xUnit), v: `#${index + 1}` });

  return (
    <div style={fillBlockStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span
          style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {onToggleCombineStart && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleCombineStart}
              title={strings.combineStartCheckbox}
            />
          )}
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
      {showCombinedNote ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-2)' }}>
          {strings.combineStartNote}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {lines.map((line) => (
            <div
              key={line.k}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{line.k}</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {line.v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
