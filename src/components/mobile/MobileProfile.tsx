import { LANGS, t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { MobileStepper } from './MobileStepper';

export function MobileProfile() {
  const lang = useAppStore((s) => s.ui.lang);
  const weight = useAppStore((s) => s.route.weight);
  const setWeight = useAppStore((s) => s.setWeight);
  const setLang = useAppStore((s) => s.setLang);
  const viewMode = useAppStore((s) => s.ui.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const strings = t(lang);

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>{strings.profile}</div>
        <MobileStepper label={strings.meWeight + ' (kg)'} value={weight} min={40} max={130} smallStep={1} bigStep={5} onChange={setWeight} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>{strings.meApp}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.meLanguage}</span>
          {LANGS.length >= 6 ? (
            <select value={lang} onChange={(e) => setLang(e.target.value as (typeof LANGS)[number])} style={{ height: 44, borderRadius: 10, border: '1px solid var(--chip-border)', padding: '0 10px' }}>
              {LANGS.map((code) => (
                <option key={code} value={code}>
                  {t(code).langName}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  style={{
                    flex: 1,
                    padding: '11px 4px',
                    borderRadius: 9,
                    border: '1px solid ' + (lang === code ? 'var(--ink)' : 'var(--chip-border)'),
                    background: lang === code ? 'var(--ink)' : '#fff',
                    color: lang === code ? '#fff' : 'var(--muted-2)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {t(code).langShort}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{strings.meView}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['mobile', 'desktop'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                style={{
                  flex: 1,
                  padding: '11px 4px',
                  borderRadius: 9,
                  border: '1px solid ' + (viewMode === v ? 'var(--ink)' : 'var(--chip-border)'),
                  background: viewMode === v ? 'var(--ink)' : '#fff',
                  color: viewMode === v ? '#fff' : 'var(--muted-2)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {v === 'mobile' ? strings.mobile : strings.desktop}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-3)' }}>{strings.meFooterNote}</p>
    </div>
  );
}
