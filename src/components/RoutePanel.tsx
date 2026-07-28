import type { ChangeEvent, CSSProperties } from 'react';
import { useRef } from 'react';
import { prof } from '../domain/fuel';
import type { Intensity, RouteInput } from '../domain/types';
import { t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 15,
  fontWeight: 600,
  background: '#fff',
};

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 0', minWidth: 0 };

function numberField(e: ChangeEvent<HTMLInputElement>): number {
  const v = e.target.value;
  return v === '' ? 0 : parseFloat(v) || 0;
}

// Unset trip parameters are stored as 0; render them as an empty field rather than a literal "0".
function displayValue(n: number): number | string {
  return n || '';
}

function seg(on: boolean): CSSProperties {
  return {
    flex: '1 1 0',
    minWidth: 0,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    border: 'none',
    borderRadius: 7,
    padding: '8px 6px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
    background: on ? '#fff' : 'transparent',
    color: on ? 'var(--ink)' : 'var(--muted)',
    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
  };
}

function chip(on: boolean): CSSProperties {
  return {
    border: '1px solid ' + (on ? 'var(--ink)' : 'var(--chip-border)'),
    borderRadius: 9,
    padding: '9px 14px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    cursor: 'pointer',
    background: on ? 'var(--ink)' : '#fff',
    color: on ? '#fff' : 'var(--ink-soft)',
  };
}

function elevationGain(routeState: RouteInput): number {
  const pts = prof(routeState).pts;
  let gain = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].ele - pts[i - 1].ele;
    if (d > 0) gain += d;
  }
  return Math.round(gain / 10) * 10;
}

export function RoutePanel() {
  const route = useAppStore((s) => s.route);
  const lang = useAppStore((s) => s.ui.lang);
  const setMode = useAppStore((s) => s.setMode);
  const setDistance = useAppStore((s) => s.setDistance);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const setHours = useAppStore((s) => s.setHours);
  const setMinutes = useAppStore((s) => s.setMinutes);
  const setIntensity = useAppStore((s) => s.setIntensity);
  const setTemp = useAppStore((s) => s.setTemp);
  const setPreMealCarbs = useAppStore((s) => s.setPreMealCarbs);
  const setPreMealMinutes = useAppStore((s) => s.setPreMealMinutes);
  const toggleGpx = useAppStore((s) => s.toggleGpx);
  const loadGpxFromFile = useAppStore((s) => s.loadGpxFromFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = t(lang);

  const intensityOptions: { value: Intensity; label: string }[] = [
    { value: 'low', label: strings.low },
    { value: 'mid', label: strings.medium },
    { value: 'high', label: strings.high },
  ];

  return (
    <div
      style={{
        flex: '1 1 58%',
        minWidth: 430,
        boxSizing: 'border-box',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        gap: '14px 44px',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '0 0 272px', width: 272 }}>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{strings.route}</span>

        <div style={{ display: 'flex', alignSelf: 'flex-start', width: 272, maxWidth: '100%', boxSizing: 'border-box', background: 'var(--track)', borderRadius: 9, padding: 3, gap: 2 }}>
          <button onClick={() => setMode('route')} style={seg(route.mode === 'route')}>
            {strings.byRoute}
          </button>
          <button onClick={() => setMode('time')} style={seg(route.mode === 'time')}>
            {strings.byTime}
          </button>
        </div>

        {route.mode === 'route' ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', width: 272, maxWidth: '100%' }}>
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.distance} (km)</span>
              <input type="number" value={displayValue(route.distance)} onChange={(e) => setDistance(numberField(e))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.speed} (km/h)</span>
              <input type="number" value={displayValue(route.speed)} onChange={(e) => setSpeed(numberField(e))} style={inputStyle} />
            </label>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', width: 272, maxWidth: '100%' }}>
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.hours}</span>
              <input type="number" value={displayValue(route.hours)} onChange={(e) => setHours(numberField(e))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.minutes}</span>
              <input type="number" value={displayValue(route.minutes)} onChange={(e) => setMinutes(numberField(e))} style={inputStyle} />
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 44px', flex: '0 0 394px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '0 0 220px', width: 220, paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.intensity}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {intensityOptions.map((opt) => (
                <button key={opt.value} onClick={() => setIntensity(opt.value)} style={chip(route.intensity === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-2)' }}>
              <span>{strings.temp}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--ink)', fontWeight: 700 }}>{route.temp} °C</span>
            </span>
            <input type="range" min={0} max={40} step={1} value={route.temp} onChange={(e) => setTemp(numberField(e))} style={{ width: '100%' }} />
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '0 0 130px', width: 130, paddingTop: 20 }}>
          <label style={{ ...labelStyle, gap: 7 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.preMealCarbs} (g)</span>
            <input
              type="number"
              value={displayValue(route.preMealCarbs)}
              onChange={(e) => setPreMealCarbs(numberField(e))}
              style={inputStyle}
            />
          </label>
          <label style={{ ...labelStyle, gap: 7 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.preMealMinutes} (min)</span>
            <input
              type="number"
              value={displayValue(route.preMealMinutes)}
              onChange={(e) => setPreMealMinutes(numberField(e))}
              style={inputStyle}
            />
          </label>
        </div>
      </div>

      <div
        style={{
          flex: '1 1 100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '9px 14px',
          border: '1px dashed var(--chip-border)',
          borderRadius: 11,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ minWidth: 140, flex: '1 1 auto' }}>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{strings.gpx}</span>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {route.gpxName || strings.gpxFile}
          </span>
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--muted-2)', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
          +{elevationGain(route)} m
        </span>
        <span style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
          <label
            style={{
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--ink-soft)',
              borderRadius: 8,
              padding: '6px 11px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
          >
            {strings.gpxPick}
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void loadGpxFromFile(file);
              }}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={toggleGpx}
            style={{
              border: '1px solid ' + (route.useGpx ? 'var(--ink)' : 'var(--chip-border)'),
              background: route.useGpx ? 'var(--ink)' : '#fff',
              color: route.useGpx ? '#fff' : 'var(--muted-2)',
              borderRadius: 8,
              padding: '6px 11px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {strings.gpxOn}
          </button>
        </span>
      </div>
      {route.gpxError && <span style={{ fontSize: 11, color: 'var(--food)', flex: '1 1 100%' }}>{strings.gpxBad}</span>}
    </div>
  );
}
