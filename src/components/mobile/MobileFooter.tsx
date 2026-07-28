import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';

export function MobileFooter() {
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  return (
    <div style={{ width: 392, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
      <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.55, color: 'var(--muted)' }}>{strings.ftLegalBody}</p>
      <a
        href="https://github.com/dzieciol-kamil/carb-planner"
        target="_blank"
        rel="noopener"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', color: 'var(--muted-2)' }}
      >
        {strings.ftRepo}
      </a>
    </div>
  );
}
