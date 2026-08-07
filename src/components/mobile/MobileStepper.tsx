import type { CSSProperties } from 'react';
import { clampStepValue } from './mobileMath';

export interface MobileStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  smallStep: number;
  bigStep: number;
  min: number;
  max: number;
  format?: (v: number) => string;
  disabled?: boolean;
}

const btnBase: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 11,
  border: '1px solid var(--chip-border)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--ink)',
  flex: '0 0 auto',
};
const bigBtnStyle: CSSProperties = { ...btnBase, background: '#F4F5F2', fontSize: 12 };
const smallBtnStyle: CSSProperties = { ...btnBase, background: '#fff' };
const valueStyle: CSSProperties = {
  minWidth: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 700,
};

export function MobileStepper({
  label,
  value,
  onChange,
  smallStep,
  bigStep,
  min,
  max,
  format,
  disabled,
}: MobileStepperProps) {
  const fmt = format ?? ((v: number) => String(Math.round(v)));
  const bump = (delta: number) => onChange(clampStepValue(value, delta, min, max));
  const dim: CSSProperties = disabled
    ? { opacity: 0.5, cursor: 'not-allowed', color: 'var(--muted-3)' }
    : {};
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.6 : 1 }}>
      {label && (
        <span style={{ fontSize: 12, color: 'var(--muted-2)', flex: '1 1 auto' }}>{label}</span>
      )}
      <button
        type="button"
        disabled={disabled}
        style={{ ...bigBtnStyle, ...dim }}
        onClick={() => bump(-bigStep)}
        aria-label={'-' + bigStep}
      >
        {'<<'}
      </button>
      <button
        type="button"
        disabled={disabled}
        style={{ ...smallBtnStyle, ...dim }}
        onClick={() => bump(-smallStep)}
        aria-label={'-' + smallStep}
      >
        {'<'}
      </button>
      <span style={valueStyle}>{fmt(value)}</span>
      <button
        type="button"
        disabled={disabled}
        style={{ ...smallBtnStyle, ...dim }}
        onClick={() => bump(smallStep)}
        aria-label={'+' + smallStep}
      >
        {'>'}
      </button>
      <button
        type="button"
        disabled={disabled}
        style={{ ...bigBtnStyle, ...dim }}
        onClick={() => bump(bigStep)}
        aria-label={'+' + bigStep}
      >
        {'>>'}
      </button>
    </div>
  );
}
