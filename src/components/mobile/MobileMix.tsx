import { absCap } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { MobileStepper } from './MobileStepper';

const RATIO_PRESETS = [2, 1.5, 1, 0.8];

export function MobileMix() {
  const lang = useAppStore((s) => s.ui.lang);
  const mix = useAppStore((s) => s.mix);
  const setRatio = useAppStore((s) => s.setRatio);
  const setConc = useAppStore((s) => s.setConc);
  const setSalt = useAppStore((s) => s.setSalt);
  const setCitric = useAppStore((s) => s.setCitric);
  const setGelConc = useAppStore((s) => s.setGelConc);
  const setGelSalt = useAppStore((s) => s.setGelSalt);
  const setGelCitric = useAppStore((s) => s.setGelCitric);
  const openMixSheet = useAppStore((s) => s.openMixSheet);
  const strings = t(lang);

  const cap = absCap(mix);
  const presetCaption = (r: number) =>
    r === 2
      ? strings.izo
      : r === 1
        ? strings.ratioLabelSugar
        : r === 0.8
          ? strings.ratioLabelHoney
          : null;

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixSection}
        </div>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--muted-2)' }}>
          {strings.mixHintMobile} {strings.absCapNoteMobile.replace('{cap}', String(cap))}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RATIO_PRESETS.map((r) => {
            const caption = presetCaption(r);
            const active = mix.ratio === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRatio(r)}
                style={{
                  flex: '1 1 76px',
                  padding: '14px 4px',
                  borderRadius: 9,
                  border: '1px solid ' + (active ? 'var(--ink)' : 'var(--chip-border)'),
                  background: active ? 'var(--ink)' : '#fff',
                  color: active ? '#fff' : 'var(--muted-2)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {caption ? caption + ' ' : ''}
                {r}:1
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixIzo}
        </div>
        <MobileStepper
          label={strings.concLabel + ' (' + strings.per100 + ')'}
          value={mix.conc}
          min={2}
          max={20}
          smallStep={1}
          bigStep={1}
          onChange={setConc}
        />
        <MobileStepper
          label={strings.saltLabel + ' (g/l)'}
          value={mix.salt}
          min={0}
          max={4}
          smallStep={0.2}
          bigStep={0.2}
          format={(v) => v.toFixed(1)}
          onChange={setSalt}
        />
        <MobileStepper
          label={strings.citricLabel + ' (g/l)'}
          value={mix.citric}
          min={0}
          max={6}
          smallStep={0.2}
          bigStep={0.2}
          format={(v) => v.toFixed(1)}
          onChange={setCitric}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.mixGel}
        </div>
        <MobileStepper
          label={strings.gelConcLabel + ' (' + strings.per100 + ')'}
          value={mix.gelConc}
          min={20}
          max={90}
          smallStep={1}
          bigStep={5}
          onChange={setGelConc}
        />
        <MobileStepper
          label={strings.saltLabel + ' (g/l)'}
          value={mix.gelSalt}
          min={0}
          max={6}
          smallStep={0.2}
          bigStep={0.2}
          format={(v) => v.toFixed(1)}
          onChange={setGelSalt}
        />
        <MobileStepper
          label={strings.citricLabel + ' (g/l)'}
          value={mix.gelCitric}
          min={0}
          max={8}
          smallStep={0.2}
          bigStep={0.2}
          format={(v) => v.toFixed(1)}
          onChange={setGelCitric}
        />
      </div>

      <button
        type="button"
        onClick={openMixSheet}
        style={{
          border: '1px solid var(--chip-border)',
          borderRadius: 11,
          padding: '13px',
          background: '#fff',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
        }}
      >
        {strings.bidonComposition}
      </button>
    </div>
  );
}
