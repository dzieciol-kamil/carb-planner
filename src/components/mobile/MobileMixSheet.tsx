import type { CSSProperties } from 'react';
import { combinedMixGroups, startFillOf, type CombinedMixGroup } from '../../domain/combinedRefill';
import {
  carbsFill,
  citricAmount,
  fmtFruitFraction,
  partsOf,
  type CitricAmount,
} from '../../domain/fuel';
import type { CitricSource, Fill } from '../../domain/types';
import { fruitNoun, t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';

function mixSplit(carbs: number, ratio: number): { malto: number; fructose: number } {
  return { malto: (carbs * ratio) / (ratio + 1), fructose: carbs / (ratio + 1) };
}

function citricSourceRowLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
  switch (source) {
    case 'lemon':
      return strings.citricSourceLemon;
    case 'lemonJuice':
      return strings.citricSourceLemonJuice;
    case 'lime':
      return strings.citricSourceLime;
    case 'limeJuice':
      return strings.citricSourceLimeJuice;
    default:
      return strings.mixRowCitric;
  }
}

function citricValueLabel(citric: CitricAmount, source: CitricSource, lang: Lang): string {
  if (citric.unit === 'g') return citric.amount.toFixed(2) + ' g';
  if (citric.unit === 'ml') return citric.amount.toFixed(1) + ' ml';
  const species = source === 'lime' ? 'lime' : 'lemon';
  return fmtFruitFraction(citric.amount) + ' ' + fruitNoun(species, citric.amount, lang);
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
  borderBottom: '1px solid #F0F1ED',
  padding: '8px 0',
};

export function MobileMixSheet() {
  const open = useAppStore((s) => s.ui.mixSheet);
  const closeMixSheet = useAppStore((s) => s.closeMixSheet);
  const lang = useAppStore((s) => s.ui.lang);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const combineStartGids = useAppStore((s) => s.combineStartGids);
  const toggleCombineStart = useAppStore((s) => s.toggleCombineStart);
  const mix = useAppStore((s) => s.mix);
  const strings = t(lang);

  if (!open) return null;

  const contentLabel = (content: 'water' | 'izo' | 'gel') =>
    content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;

  const selectedStartFills = combineStartGids
    .map((gid) => startFillOf(gid, fills))
    .filter((f): f is Fill => f != null);
  const showCombined = selectedStartFills.length > 1;
  const combinedGroups = showCombined ? combinedMixGroups(selectedStartFills, gear, mix) : [];

  const groups = gear
    .map((vessel) => ({ vessel, vesselFills: fills.filter((f) => f.gid === vessel.gid) }))
    .filter((g) => g.vesselFills.length > 0);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 26,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 18px 10px',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{strings.mixSheetTitle}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.mixSheetSubtitle}</div>
        </div>
        <button
          type="button"
          onClick={closeMixSheet}
          style={{
            width: 38,
            height: 38,
            border: '1px solid var(--chip-border)',
            borderRadius: 11,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {groups.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{strings.mixSheetEmpty}</p>
        )}

        {showCombined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                {strings.combineStartSectionTitle}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
                {strings.combineStartSectionHint}
              </div>
            </div>
            {combinedGroups.map((group) => (
              <CombinedGroupRows
                key={group.content}
                group={group}
                lang={lang}
                contentLabel={contentLabel}
              />
            ))}
          </div>
        )}

        {groups.map(({ vessel, vesselFills }) => (
          <div key={vessel.gid}>
            {vesselFills.map((fill, i) => {
              const carbs = carbsFill(fill, gear, mix);
              const n = partsOf(fill, gear);
              const ratio = fill.content === 'gel' ? mix.gelRatio : mix.ratio;
              const split = mixSplit(carbs, ratio || 2);
              const salt = (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelSalt : mix.salt);
              const citricSource = fill.content === 'gel' ? mix.gelCitricSource : mix.citricSource;
              const citricGrams =
                (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelCitric : mix.citric);
              const isStart = i === 0;
              const selected = isStart && combineStartGids.includes(vessel.gid);
              const citric = citricAmount(citricGrams, citricSource);

              const lines: { k: string; v: string }[] =
                fill.content === 'water'
                  ? [{ k: strings.mixRowWater, v: vessel.vol + ' ml' }]
                  : [
                      { k: strings.mixRowSugar, v: carbs.toFixed(0) + ' g' },
                      { k: strings.mixRowMalto, v: split.malto.toFixed(1) + ' g' },
                      { k: strings.mixRowFructose, v: split.fructose.toFixed(1) + ' g' },
                      { k: strings.mixRowSalt, v: salt.toFixed(2) + ' g' },
                      {
                        k: citricSourceRowLabel(citricSource, strings),
                        v: citricValueLabel(citric, citricSource, lang),
                      },
                      { k: strings.mixRowWater, v: vessel.vol + ' ml' },
                    ];

              return (
                <div key={fill.fid} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {isStart && (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCombineStart(vessel.gid)}
                        title={strings.combineStartCheckbox}
                      />
                    )}
                    {vessel.name} · napełnienie {i + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: 'var(--muted-3)',
                      marginBottom: 4,
                    }}
                  >
                    {vessel.vol} ml{fill.content === 'gel' ? ' · ' + n + '×' : ''}
                  </div>
                  {selected && showCombined ? (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted-2)' }}>
                      {strings.combineStartNote}
                    </p>
                  ) : (
                    lines.map((line) => (
                      <div key={line.k} style={rowStyle}>
                        <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{line.k}</span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {line.v}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function CombinedGroupRows({
  group,
  lang,
  contentLabel,
}: {
  group: CombinedMixGroup;
  lang: Lang;
  contentLabel: (content: 'water' | 'izo' | 'gel') => string;
}) {
  const strings = t(lang);
  const citric = citricAmount(group.citricG, group.citricSource);
  const lines: { k: string; v: string }[] =
    group.content === 'water'
      ? [{ k: strings.mixRowWater, v: group.volumeMl + ' ml' }]
      : [
          { k: strings.mixRowSugar, v: group.carbsG.toFixed(0) + ' g' },
          { k: strings.mixRowMalto, v: group.maltoG.toFixed(1) + ' g' },
          { k: strings.mixRowFructose, v: group.fructoseG.toFixed(1) + ' g' },
          { k: strings.mixRowSalt, v: group.saltG.toFixed(2) + ' g' },
          {
            k: citricSourceRowLabel(group.citricSource, strings),
            v: citricValueLabel(citric, group.citricSource, lang),
          },
          { k: strings.mixRowWater, v: group.volumeMl + ' ml' },
        ];

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--muted-3)',
          marginBottom: 4,
        }}
      >
        {contentLabel(group.content)}
        {group.content === 'gel' ? ' · ' + group.parts + '×' : ''} · {strings.combineStartBottles}:{' '}
        {group.vesselNames.join(', ')}
      </div>
      {lines.map((line) => (
        <div key={line.k} style={rowStyle}>
          <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{line.k}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {line.v}
          </span>
        </div>
      ))}
    </div>
  );
}
