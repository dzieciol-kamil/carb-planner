import type { CSSProperties } from 'react';
import { planSummary, recoveryCarbs } from '../domain/fuel';
import { t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';

function fmt(n: number): string {
  return n.toFixed(0);
}

function statusColor(pct: number, goodColor: string): string {
  if (pct >= 85) return goodColor;
  if (pct < 60) return '#B4552F';
  return '#D2703F';
}

const cardStyle: CSSProperties = {
  flex: '1 1 auto',
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 12,
};

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};
const titleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};
const trackStyle: CSSProperties = {
  height: 10,
  borderRadius: 6,
  background: 'var(--border-soft)',
  overflow: 'hidden',
};
const footerRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  fontSize: 12,
  color: 'var(--muted-2)',
  whiteSpace: 'nowrap',
};
const footerValueStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  color: 'var(--ink)',
};
const recoveryValueStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--carb)',
};
const recoveryHintStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted-2)',
};
const recoveryNoteStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--muted-3)',
};

export function SummaryCards() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  const summary = planSummary({ route, mix, gear, fills, foods, foodLib });
  const carbColor = statusColor(summary.coverage, 'var(--carb)');
  const hydColor = statusColor(summary.hydrationPct, 'var(--water)');
  const recovery = recoveryCarbs(route.weight);

  return (
    <div
      style={{
        flex: '1 1 36%',
        minWidth: 240,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={cardStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>{strings.coverage}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: carbColor,
            }}
          >
            {summary.coverage}%
          </span>
        </div>
        <div style={trackStyle}>
          <div
            style={{
              width: `${Math.min(100, summary.coverage)}%`,
              height: '100%',
              background: carbColor,
              borderRadius: 6,
            }}
          />
        </div>
        <div style={footerRowStyle}>
          <span>
            {strings.needSum} <b style={footerValueStyle}>{fmt(summary.target)} g</b>
          </span>
          <span>
            {strings.planned}{' '}
            <b style={footerValueStyle}>
              {fmt(summary.totalCarbs)} g ({fmt(summary.totalCarbs * 4)} kcal)
            </b>
          </span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>{strings.hydration}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: hydColor,
            }}
          >
            {summary.hydrationPct}%
          </span>
        </div>
        <div style={trackStyle}>
          <div
            style={{
              width: `${Math.min(100, summary.hydrationPct)}%`,
              height: '100%',
              background: hydColor,
              borderRadius: 6,
            }}
          />
        </div>
        <div style={footerRowStyle}>
          <span>
            {strings.sweatLoss} <b style={footerValueStyle}>{summary.sweatLoss} ml</b>
          </span>
          <span>
            {strings.planned} <b style={footerValueStyle}>{summary.fluidPlanned} ml</b>
          </span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>{strings.recoveryTitle}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted-2)',
            }}
          >
            1.0–1.2 g/kg
          </span>
        </div>
        <div style={recoveryValueStyle}>
          ~{recovery.min}–{recovery.max} g
        </div>
        <div style={recoveryHintStyle}>{strings.recoveryHint}</div>
        <div style={recoveryNoteStyle}>{strings.recoveryNote}</div>
      </div>
    </div>
  );
}
