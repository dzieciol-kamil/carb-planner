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
}

function parse(text: string, parser: 'float' | 'int'): number {
  return parser === 'int' ? parseInt(text, 10) : parseFloat(text);
}

function display(value: number, zeroAsEmpty: boolean): string {
  return zeroAsEmpty && value === 0 ? '' : String(value);
}

export function NumberInput({ value, onChange, fallback = 0, parser = 'float', zeroAsEmpty = false, min, max, step, style, className }: NumberInputProps) {
  const [text, setText] = useState(display(value, zeroAsEmpty));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(display(value, zeroAsEmpty));
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
        setText(display(committed, zeroAsEmpty));
        if (committed !== value) onChange(committed);
      }}
    />
  );
}
