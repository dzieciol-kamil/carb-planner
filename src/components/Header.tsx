import { useState, type CSSProperties } from 'react';
import { LANGS, t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';

export function Header() {
  const lang = useAppStore((s) => s.ui.lang);
  const setLang = useAppStore((s) => s.setLang);
  const openPanel = useAppStore((s) => s.openPanel);
  const panel = useAppStore((s) => s.ui.panel);
  const [langOpen, setLangOpen] = useState(false);
  const strings = t(lang);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>CARB PLANNER</span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          {strings.tagline}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid ' + (langOpen ? 'var(--ink)' : 'var(--chip-border)'),
              background: '#fff',
              borderRadius: 999,
              padding: '7px 13px',
              cursor: 'pointer',
              fontFamily: 'Archivo, sans-serif',
              color: 'var(--ink)',
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
              {strings.langShort}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{strings.langName}</span>
            <span style={{ fontSize: 9, color: 'var(--muted-3)' }}>▾</span>
          </button>
          <div
            style={{
              display: langOpen ? 'flex' : 'none',
              flexDirection: 'column',
              gap: 2,
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 178,
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 6,
              boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
              zIndex: 60,
            }}
          >
            {LANGS.map((code) => {
              const label = t(code);
              const on = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setLang(code);
                    setLangOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    background: on ? '#F2F5EF' : 'transparent',
                    color: 'var(--ink)',
                    fontFamily: 'Archivo, sans-serif',
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, width: 22, flex: '0 0 22px' }}>
                    {label.langShort}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{label.langName}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--carb)', visibility: on ? 'visible' : 'hidden' }}>✓</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => openPanel('settings')} style={panelBtnStyle(panel === 'settings')}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid var(--carb)', display: 'block' }} />
          <span>{strings.settings}</span>
        </button>
        <button onClick={() => openPanel('mix')} style={panelBtnStyle(panel === 'mix')}>
          <span style={{ width: 9, height: 9, borderRadius: 2, border: '2px solid var(--gel)', display: 'block' }} />
          <span>{strings.gearMix}</span>
        </button>
      </div>
    </div>
  );
}

function panelBtnStyle(on: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid ' + (on ? 'var(--ink)' : 'var(--chip-border)'),
    background: on ? '#F4F5F2' : '#fff',
    borderRadius: 999,
    padding: '7px 14px',
    fontFamily: 'Archivo, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--ink)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
