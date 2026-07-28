import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';

export function MobileNotesPanel() {
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  return (
    <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{strings.mobileNotesTitle}</div>
      {strings.notes.map((n) => (
        <div key={n.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{n.title}</div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--muted-2)' }}>{n.body}</div>
        </div>
      ))}
    </div>
  );
}
