import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  fallback?: number;
  parser?: 'float' | 'int';
  /** Render 0 as a blank field (for "unset" params stored as 0) instead of the literal digit. */
  zeroAsEmpty?: boolean;
  min?: number;
  max?: number;
  step?: number;
  style?: CSSProperties;
  className?: string;
  /** Fires once the value is committed (blur), after the final onChange — for work that should react to the settled value, not every keystroke. */
  onCommit?: () => void;
  /**
   * Rounds a value before it's shown as text. Applied on mount, whenever the external `value`
   * prop changes while unfocused, AND on blur once the user's raw typed/pasted text has been
   * parsed back into a number — that last path matters because blur otherwise redisplays
   * whatever the user literally typed verbatim (e.g. a long pasted decimal), regardless of
   * whether the `value` prop itself changed enough to retrigger the resync effect. Purely
   * cosmetic: `onChange`/`onCommit` still always fire with the exact parsed value, unrounded —
   * this only smooths what's rendered so long decimals don't overflow narrow inputs. Opt-in:
   * omitted, behavior is identical to before this prop existed.
   */
  round?: (value: number) => number;
}

function parse(text: string, parser: 'float' | 'int'): number {
  return parser === 'int' ? parseInt(text, 10) : parseFloat(text);
}

function display(value: number, zeroAsEmpty: boolean, round?: (value: number) => number): string {
  const v = round ? round(value) : value;
  return zeroAsEmpty && v === 0 ? '' : String(v);
}

export function NumberInput({
  value,
  onChange,
  fallback = 0,
  parser = 'float',
  zeroAsEmpty = false,
  min,
  max,
  step,
  style,
  className,
  onCommit,
  round,
}: NumberInputProps) {
  const [text, setText] = useState(display(value, zeroAsEmpty, round));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(display(value, zeroAsEmpty, round));
    // round is applied as a pure formatting step, not tracked as a dependency — same pattern
    // already used here for onChange, which isn't tracked either.
  }, [value, zeroAsEmpty]);

  return (
    <input
      type="number"
      className={className}
      style={style}
      min={min}
      max={max}
      step={step}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setText(raw);
        const n = parse(raw, parser);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onBlur={() => {
        focused.current = false;
        const n = parse(text, parser);
        const committed = Number.isNaN(n) ? fallback : n;
        setText(display(committed, zeroAsEmpty, round));
        if (committed !== value) onChange(committed);
        onCommit?.();
      }}
    />
  );
}
