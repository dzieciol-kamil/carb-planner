import type { CSSProperties } from 'react';
import { citricAmount, citricGramsFromAmount, type CitricAmount } from '../../domain/fuel';
import type { CitricSource, Content } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { NumberInput } from '../ui/NumberInput';
import { createVesselReorderHandler } from './gearDragHandler';
import { PanelShell } from './PanelShell';

const RATIO_PRESETS = [2, 1.5, 1, 0.8];
const CONTENT_OPTIONS: Content[] = ['water', 'izo', 'gel'];
const CITRIC_SOURCES: CitricSource[] = ['citric', 'lemon', 'lemonJuice', 'lime', 'limeJuice'];

const sectionCardStyle: CSSProperties = {
  border: '1px solid #E9EBE5',
  borderRadius: 12,
  padding: '12px 14px 14px',
  background: '#FBFCFA',
  marginBottom: 10,
};
const miniLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '9px 10px',
  background: '#fff',
};
const miniInputStyle: CSSProperties = {
  width: 46,
  border: 'none',
  background: 'transparent',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  fontWeight: 700,
  textAlign: 'right',
};
const stepBtnStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  width: 16,
  height: 22,
  padding: 0,
  lineHeight: 1,
  flex: '0 0 auto',
};

function contentLabel(content: Content, lang: 'pl' | 'en'): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function citricSourceLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
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
      return strings.citricSourceCitric;
  }
}

// The citric-amount grid field is unit-aware: plain citric-acid powder keeps its own short
// "Kwasek" label, but the whole-fruit/juice sources swap in the source's own name (e.g. "Cytryna",
// "Sok z cytryny") since the field is no longer showing grams of powder but a practical amount of
// that ingredient.
function citricFieldLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
  return source === 'citric' ? strings.citricLabel : citricSourceLabel(source, strings);
}

function citricSubLabel(unit: CitricAmount['unit'], strings: ReturnType<typeof t>): string {
  if (unit === 'ml') return strings.per100Ml;
  if (unit === 'fruit') return strings.per100Fruit;
  return strings.per100;
}

// Step size for the citric-amount input, tuned per displayed unit: fine-grained grams for powder,
// coarser ml for juice, and quarter-fruit increments for whole fruit (matching the quarter
// rounding `citricAmount`/`fmtFruitFraction` already use elsewhere).
function citricStep(unit: CitricAmount['unit']): number {
  if (unit === 'ml') return 0.5;
  if (unit === 'fruit') return 0.25;
  return 0.05;
}

// Passed as `NumberInput`'s `round` option for the citric fields below. Both `citricAmount`'s ml
// conversion (division by a yield constant like 0.06) and `citricGramsFromAmount`'s fruit->grams
// conversion (e.g. 0.25 * 30 * 0.06) can produce long floating-point tails (3.3333333333333335,
// 0.44999999999999996) that would otherwise overflow the narrow 1/3-width grid cell — including
// when the user types/pastes such a value directly, not just when it arrives via conversion.
function roundCitricDisplay(amount: number, unit: CitricAmount['unit']): number {
  if (unit === 'ml') return Math.round(amount * 10) / 10;
  if (unit === 'fruit') return Math.round(amount * 4) / 4;
  return Math.round(amount * 100) / 100;
}

// The "Izo" caption on the 2:1 preset flags it as this app's default isotonic ratio — showing
// that same caption on the gel row's identical preset would misleadingly imply the gel mix is
// somehow "isotonic" too, so the gel row skips it and shows only the bare "2:1".
function presetCaption(r: number, strings: ReturnType<typeof t>, forGel: boolean): string | null {
  if (r === 2) return forGel ? null : strings.izo;
  if (r === 1) return strings.ratioLabelSugar;
  if (r === 0.8) return strings.ratioLabelHoney;
  return null;
}

function cOpt(on: boolean, color: string): CSSProperties {
  return {
    border: '1px solid ' + (on ? color : 'var(--chip-border)'),
    background: on ? color : '#fff',
    color: on ? '#fff' : 'var(--muted)',
    borderRadius: 7,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
  };
}

interface RatioRowProps {
  value: number;
  onChange: (n: number) => void;
  strings: ReturnType<typeof t>;
  forGel: boolean;
}

function RatioRow({ value, onChange, strings, forGel }: RatioRowProps) {
  const isPreset = RATIO_PRESETS.includes(value);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 10,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.ratio}</span>
      <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {RATIO_PRESETS.map((r) => {
          const caption = presetCaption(r, strings, forGel);
          return (
            <button
              key={r}
              onClick={() => onChange(r)}
              style={{
                ...cOpt(value === r, 'var(--ink)'),
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 4,
              }}
            >
              {caption && (
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75 }}>{caption}</span>
              )}
              <span>{r}:1</span>
            </button>
          );
        })}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            borderRadius: 7,
            padding: '4px 8px',
            border: '1px solid ' + (isPreset ? 'var(--chip-border)' : 'var(--ink)'),
            background: '#fff',
          }}
        >
          <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{strings.ratioCustom}</span>
          <NumberInput
            min={0.2}
            max={10}
            step={0.1}
            value={value}
            onChange={onChange}
            fallback={2}
            style={{
              width: 44,
              border: 'none',
              background: 'transparent',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'right',
            }}
          />
          <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>:1</span>
        </label>
      </span>
    </div>
  );
}

export function MixPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const closePanel = useAppStore((s) => s.closePanel);
  const setRatio = useAppStore((s) => s.setRatio);
  const setGelRatio = useAppStore((s) => s.setGelRatio);
  const setConc = useAppStore((s) => s.setConc);
  const setSalt = useAppStore((s) => s.setSalt);
  const setCitric = useAppStore((s) => s.setCitric);
  const setCitricSource = useAppStore((s) => s.setCitricSource);
  const setGelConc = useAppStore((s) => s.setGelConc);
  const setGelSalt = useAppStore((s) => s.setGelSalt);
  const setGelCitric = useAppStore((s) => s.setGelCitric);
  const setGelCitricSource = useAppStore((s) => s.setGelCitricSource);
  const resetMix = useAppStore((s) => s.resetMix);
  const updateVessel = useAppStore((s) => s.updateVessel);
  const removeVessel = useAppStore((s) => s.removeVessel);
  const addVessel = useAppStore((s) => s.addVessel);
  const toggleVesselAllowed = useAppStore((s) => s.toggleVesselAllowed);
  const setVesselGelParts = useAppStore((s) => s.setVesselGelParts);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const strings = t(lang);
  const izoCitric = citricAmount(mix.citric, mix.citricSource);
  const gelCitricAmt = citricAmount(mix.gelCitric, mix.gelCitricSource);

  return (
    <PanelShell title={strings.gearMix} onClose={closePanel}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixSection}
        </span>
        <button
          onClick={resetMix}
          style={{
            border: '1px solid var(--chip-border)',
            background: '#fff',
            borderRadius: 8,
            padding: '5px 10px',
            fontFamily: 'Archivo, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--muted-2)',
            cursor: 'pointer',
          }}
        >
          {strings.resetDefaults}
        </button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>
        {strings.mixHint}
      </p>

      <div style={sectionCardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{strings.mixIzo}</div>
        <RatioRow value={mix.ratio} onChange={setRatio} strings={strings} forGel={false} />
        <div
          style={{
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.citricSourceLabel}</span>
          {CITRIC_SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => setCitricSource(src)}
              style={cOpt(mix.citricSource === src, 'var(--ink)')}
            >
              {citricSourceLabel(src, strings)}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {strings.concLabel}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.5} value={mix.conc} onChange={setConc} style={miniInputStyle} />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {strings.saltLabel}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.05} value={mix.salt} onChange={setSalt} style={miniInputStyle} />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {citricFieldLabel(mix.citricSource, strings)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>
                {citricSubLabel(izoCitric.unit, strings)}
              </span>
            </span>
            <NumberInput
              step={citricStep(izoCitric.unit)}
              value={izoCitric.amount}
              onChange={(v) => setCitric(citricGramsFromAmount(v, mix.citricSource))}
              round={(v) => roundCitricDisplay(v, izoCitric.unit)}
              style={miniInputStyle}
            />
          </label>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{strings.mixGel}</div>
        <RatioRow value={mix.gelRatio} onChange={setGelRatio} strings={strings} forGel={true} />
        <div
          style={{
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.citricSourceLabel}</span>
          {CITRIC_SOURCES.map((src) => (
            <button
              key={src}
              onClick={() => setGelCitricSource(src)}
              style={cOpt(mix.gelCitricSource === src, 'var(--ink)')}
            >
              {citricSourceLabel(src, strings)}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {strings.gelConcLabel}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput
              step={1}
              value={mix.gelConc}
              onChange={setGelConc}
              style={miniInputStyle}
            />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {strings.saltLabel}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput
              step={0.05}
              value={mix.gelSalt}
              onChange={setGelSalt}
              style={miniInputStyle}
            />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
                {citricFieldLabel(mix.gelCitricSource, strings)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>
                {citricSubLabel(gelCitricAmt.unit, strings)}
              </span>
            </span>
            <NumberInput
              step={citricStep(gelCitricAmt.unit)}
              value={gelCitricAmt.amount}
              onChange={(v) => setGelCitric(citricGramsFromAmount(v, mix.gelCitricSource))}
              round={(v) => roundCitricDisplay(v, gelCitricAmt.unit)}
              style={miniInputStyle}
            />
          </label>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 12,
        }}
      >
        {strings.gear}
      </div>

      <div data-gear-list style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gear.map((vessel) => (
          <div
            key={vessel.gid}
            data-gid={vessel.gid}
            style={{
              border: '1px solid #E9EBE5',
              borderRadius: 12,
              padding: 12,
              background: '#FBFCFA',
              opacity: dragKey === 'g' + vessel.gid ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                onPointerDown={createVesselReorderHandler(vessel.gid)}
                style={{
                  cursor: 'grab',
                  touchAction: 'none',
                  color: 'var(--muted-3)',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                  userSelect: 'none',
                  flex: '0 0 auto',
                }}
              >
                ⠿
              </span>
              <input
                type="text"
                value={vessel.name}
                onChange={(e) => updateVessel(vessel.gid, { name: e.target.value })}
                style={{
                  flex: 1,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 10,
                  padding: '9px 11px',
                  fontFamily: 'Archivo, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#fff',
                }}
              />
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 10,
                  padding: '0 10px',
                  width: 92,
                  background: '#fff',
                }}
              >
                <NumberInput
                  value={vessel.vol}
                  onChange={(vol) => updateVessel(vessel.gid, { vol })}
                  style={{
                    width: '100%',
                    border: 'none',
                    padding: '9px 0',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>ml</span>
              </span>
              <button
                onClick={() => removeVessel(vessel.gid)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#B0B5B0',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 6,
                  width: 26,
                  flex: '0 0 26px',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.canCarry}</span>
              <span style={{ display: 'flex', gap: 5 }}>
                {CONTENT_OPTIONS.map((k) => (
                  <button
                    key={k}
                    onClick={() => toggleVesselAllowed(vessel.gid, k)}
                    style={cOpt((vessel.allowed || []).includes(k), sourceColor(k))}
                  >
                    {contentLabel(k, lang)}
                  </button>
                ))}
              </span>
              {(vessel.allowed || []).includes('gel') && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    border: '1px solid var(--chip-border)',
                    borderRadius: 10,
                    padding: '0 4px 0 10px',
                    background: '#fff',
                    boxSizing: 'content-box',
                    marginLeft: 'auto',
                    marginRight: 35,
                    flex: '0 0 auto',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>
                    {strings.gelPartsLabel}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <button
                      type="button"
                      onClick={() => setVesselGelParts(vessel.gid, vessel.gelParts - 1)}
                      style={stepBtnStyle}
                      aria-label="-"
                    >
                      −
                    </button>
                    <NumberInput
                      min={1}
                      max={12}
                      step={1}
                      parser="int"
                      fallback={1}
                      value={vessel.gelParts}
                      onChange={(gelParts) => setVesselGelParts(vessel.gid, gelParts)}
                      style={{
                        width: 16,
                        border: 'none',
                        padding: '9px 0',
                        background: 'transparent',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setVesselGelParts(vessel.gid, vessel.gelParts + 1)}
                      style={stepBtnStyle}
                      aria-label="+"
                    >
                      +
                    </button>
                  </span>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addVessel}
        style={{
          marginTop: 12,
          border: '1px dashed #C9CEC7',
          background: '#F7F8F5',
          borderRadius: 10,
          padding: '11px 16px',
          fontFamily: 'Archivo, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        + {strings.addGear}
      </button>
    </PanelShell>
  );
}
