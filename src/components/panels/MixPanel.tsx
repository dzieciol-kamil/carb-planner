import type { CSSProperties } from 'react';
import type { Content } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { NumberInput } from '../ui/NumberInput';
import { createVesselReorderHandler } from './gearDragHandler';
import { PanelShell } from './PanelShell';

const RATIO_PRESETS = [2, 1.5, 1];
const CONTENT_OPTIONS: Content[] = ['water', 'izo', 'gel'];

const sectionCardStyle: CSSProperties = { border: '1px solid #E9EBE5', borderRadius: 12, padding: '12px 14px 14px', background: '#FBFCFA', marginBottom: 10 };
const miniLabelStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, border: '1px solid var(--chip-border)', borderRadius: 10, padding: '9px 10px', background: '#fff' };
const miniInputStyle: CSSProperties = { width: 46, border: 'none', background: 'transparent', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, textAlign: 'right' };

function contentLabel(content: Content, lang: 'pl' | 'en'): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
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

export function MixPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const closePanel = useAppStore((s) => s.closePanel);
  const setRatio = useAppStore((s) => s.setRatio);
  const setConc = useAppStore((s) => s.setConc);
  const setSalt = useAppStore((s) => s.setSalt);
  const setCitric = useAppStore((s) => s.setCitric);
  const setGelConc = useAppStore((s) => s.setGelConc);
  const setGelSalt = useAppStore((s) => s.setGelSalt);
  const setGelCitric = useAppStore((s) => s.setGelCitric);
  const resetMix = useAppStore((s) => s.resetMix);
  const updateVessel = useAppStore((s) => s.updateVessel);
  const removeVessel = useAppStore((s) => s.removeVessel);
  const addVessel = useAppStore((s) => s.addVessel);
  const toggleVesselAllowed = useAppStore((s) => s.toggleVesselAllowed);
  const setVesselGelParts = useAppStore((s) => s.setVesselGelParts);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const strings = t(lang);

  const ratioIsPreset = RATIO_PRESETS.includes(mix.ratio);

  return (
    <PanelShell title={strings.gearMix} onClose={closePanel}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{strings.mixSection}</span>
        <button
          onClick={resetMix}
          style={{ border: '1px solid var(--chip-border)', background: '#fff', borderRadius: 8, padding: '5px 10px', fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', cursor: 'pointer' }}
        >
          {strings.resetDefaults}
        </button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted-2)' }}>{strings.mixHint}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.ratio}</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {RATIO_PRESETS.map((r) => (
            <button key={r} onClick={() => setRatio(r)} style={cOpt(mix.ratio === r, 'var(--ink)')}>
              {r}:1
            </button>
          ))}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 7,
              padding: '4px 8px',
              border: '1px solid ' + (ratioIsPreset ? 'var(--chip-border)' : 'var(--ink)'),
              background: '#fff',
            }}
          >
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{strings.ratioCustom}</span>
            <NumberInput
              min={0.2}
              max={10}
              step={0.1}
              value={mix.ratio}
              onChange={setRatio}
              fallback={2}
              style={{ width: 44, border: 'none', background: 'transparent', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, textAlign: 'right' }}
            />
            <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>:1</span>
          </label>
        </span>
      </div>

      <div style={sectionCardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{strings.mixIzo}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{strings.concLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.5} value={mix.conc} onChange={setConc} style={miniInputStyle} />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{strings.saltLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.05} value={mix.salt} onChange={setSalt} style={miniInputStyle} />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{strings.citricLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.05} value={mix.citric} onChange={setCitric} style={miniInputStyle} />
          </label>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{strings.mixGel}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{strings.gelConcLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={1} value={mix.gelConc} onChange={setGelConc} style={miniInputStyle} />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{strings.saltLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.05} value={mix.gelSalt} onChange={setGelSalt} style={miniInputStyle} />
          </label>
          <label style={miniLabelStyle}>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{strings.citricLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>{strings.per100}</span>
            </span>
            <NumberInput step={0.05} value={mix.gelCitric} onChange={setGelCitric} style={miniInputStyle} />
          </label>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>{strings.gear}</div>

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
                style={{ cursor: 'grab', touchAction: 'none', color: 'var(--muted-3)', fontSize: 14, lineHeight: 1, padding: '0 2px', userSelect: 'none', flex: '0 0 auto' }}
              >
                ⠿
              </span>
              <input
                type="text"
                value={vessel.name}
                onChange={(e) => updateVessel(vessel.gid, { name: e.target.value })}
                style={{ flex: 1, border: '1px solid var(--chip-border)', borderRadius: 10, padding: '9px 11px', fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 600, background: '#fff' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--chip-border)', borderRadius: 10, padding: '0 10px', width: 92, background: '#fff' }}>
                <NumberInput
                  value={vessel.vol}
                  onChange={(vol) => updateVessel(vessel.gid, { vol })}
                  style={{ width: '100%', border: 'none', padding: '9px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>ml</span>
              </span>
              <button onClick={() => removeVessel(vessel.gid)} style={{ border: 'none', background: 'transparent', color: '#B0B5B0', cursor: 'pointer', fontSize: 13, padding: 6, width: 26, flex: '0 0 26px' }}>
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.canCarry}</span>
              <span style={{ display: 'flex', gap: 5 }}>
                {CONTENT_OPTIONS.map((k) => (
                  <button key={k} onClick={() => toggleVesselAllowed(vessel.gid, k)} style={cOpt((vessel.allowed || []).includes(k), sourceColor(k))}>
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
                    padding: '0 10px',
                    background: '#fff',
                    width: 92,
                    boxSizing: 'content-box',
                    marginLeft: 'auto',
                    marginRight: 35,
                    flex: '0 0 auto',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>{strings.gelPartsLabel}</span>
                  <NumberInput
                    min={1}
                    max={12}
                    step={1}
                    parser="int"
                    fallback={1}
                    value={vessel.gelParts}
                    onChange={(gelParts) => setVesselGelParts(vessel.gid, gelParts)}
                    style={{ width: 26, border: 'none', padding: '9px 0', background: 'transparent', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, textAlign: 'right' }}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addVessel}
        style={{ marginTop: 12, border: '1px dashed #C9CEC7', background: '#F7F8F5', borderRadius: 10, padding: '11px 16px', fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer', width: '100%' }}
      >
        + {strings.addGear}
      </button>
    </PanelShell>
  );
}
