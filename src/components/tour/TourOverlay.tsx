import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { tourGhostBtn, tourPrimaryBtn } from './tourStyles';
import { TOUR_STEPS, type TourStep } from './tourSteps';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 8;
const TOOLTIP_WIDTH = 320;
const MARGIN = 14;
const BACKDROP = 'rgba(18,20,18,0.55)';

export function TourOverlay() {
  const tourStep = useAppStore((s) => s.ui.tourStep);
  const lang = useAppStore((s) => s.ui.lang);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const closeTour = useAppStore((s) => s.closeTour);
  const strings = t(lang);
  const [rect, setRect] = useState<Rect | null>(null);

  const step: TourStep | null = tourStep !== null ? TOUR_STEPS[tourStep] : null;

  useLayoutEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const target = step.target;
    document.querySelector(`[data-tour="${target}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let raf = 0;
    const tick = () => {
      const next = measure(target);
      setRect((prev) =>
        prev && next && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height
          ? prev
          : next,
      );
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [step]);

  useEffect(() => {
    if (!step?.onEnter) return;
    const cleanup = step.onEnter();
    return () => cleanup?.();
  }, [step]);

  useEffect(() => {
    if (tourStep === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourStep, closeTour]);

  if (tourStep === null || !step) return null;

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const cutout = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {cutout ? (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, cutout.top), background: BACKDROP }} />
          <div style={{ position: 'fixed', top: cutout.top + cutout.height, left: 0, right: 0, bottom: 0, background: BACKDROP }} />
          <div style={{ position: 'fixed', top: cutout.top, left: 0, width: Math.max(0, cutout.left), height: cutout.height, background: BACKDROP }} />
          <div style={{ position: 'fixed', top: cutout.top, left: cutout.left + cutout.width, right: 0, height: cutout.height, background: BACKDROP }} />
          <div
            style={{
              position: 'fixed',
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
              borderRadius: 10,
              border: '2px solid var(--ink)',
              boxShadow: '0 0 0 4px rgba(90,163,63,0.25)',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: BACKDROP }} />
      )}

      <TourTooltip cutout={cutout}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {strings.tourStepLabel} {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <button onClick={closeTour} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', padding: 0 }}>
            ✕
          </button>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{strings[step.titleKey]}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{strings[step.bodyKey]}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
          <button onClick={closeTour} style={tourGhostBtn}>
            {strings.tourSkip}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button onClick={() => setTourStep(tourStep - 1)} style={tourGhostBtn}>
                {strings.tourBack}
              </button>
            )}
            <button onClick={() => (isLast ? closeTour() : setTourStep(tourStep + 1))} style={tourPrimaryBtn}>
              {isLast ? strings.tourFinish : strings.tourNext}
            </button>
          </div>
        </div>
      </TourTooltip>
    </div>
  );
}

interface TourTooltipProps {
  cutout: Rect | null;
  children: ReactNode;
}

function TourTooltip({ cutout, children }: TourTooltipProps) {
  const pos: CSSProperties = cutout
    ? (() => {
        const spaceBelow = window.innerHeight - (cutout.top + cutout.height);
        const placeBelow = spaceBelow > 280 || spaceBelow > cutout.top;
        const left = Math.min(Math.max(MARGIN, cutout.left), window.innerWidth - TOOLTIP_WIDTH - MARGIN);
        return placeBelow
          ? { position: 'fixed', top: cutout.top + cutout.height + 14, left }
          : { position: 'fixed', bottom: window.innerHeight - cutout.top + 14, left };
      })()
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div
      style={{
        ...pos,
        width: TOOLTIP_WIDTH,
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
        maxHeight: 'calc(100vh - 28px)',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
}
