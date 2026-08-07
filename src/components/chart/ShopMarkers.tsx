import type { CSSProperties } from 'react';
import { createShopDragHandler, stopPointerDown } from '../lanes/dragHandlers';
import { fmtX } from '../../domain/fuel';
import type { RouteInput, XUnit } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from './theme';

const PIN_W = 16;
const PIN_H = 18;

interface ShopMarkersProps {
  distanceKm: number;
  height: number;
  bottomPadding: number;
  route: RouteInput;
  xUnit: XUnit;
}

function pinButtonStyle(leftPct: number): CSSProperties {
  return {
    position: 'absolute',
    left: `calc(${leftPct}% - ${PIN_W / 2}px)`,
    top: -8,
    width: PIN_W,
    height: PIN_H,
    cursor: 'grab',
    touchAction: 'none',
    pointerEvents: 'auto',
  };
}

function lineStyle(
  leftPct: number,
  height: number,
  bottomPadding: number,
  on: boolean,
): CSSProperties {
  return {
    position: 'absolute',
    left: `calc(${leftPct}% - 0.75px)`,
    top: 9,
    width: 1.5,
    height: height - bottomPadding - 9,
    background: CHART_COLORS.ink,
    opacity: on ? 0.9 : 0.55,
    pointerEvents: 'none',
  };
}

function nameInputStyle(show: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: -38,
    transform: 'translateX(-50%)',
    width: 76,
    boxSizing: 'border-box',
    padding: '3px 5px',
    border: '1px solid rgba(0,0,0,0.18)',
    borderRadius: 5,
    background: '#fff',
    color: CHART_COLORS.ink,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: 'Archivo, sans-serif',
    textAlign: 'center',
    cursor: 'text',
    zIndex: 3,
    display: show ? 'block' : 'none',
  };
}

function removeButtonStyle(show: boolean): CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: -14,
    transform: 'translateX(-50%)',
    width: 14,
    height: 14,
    padding: 0,
    border: 'none',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 8,
    lineHeight: 1,
    cursor: 'pointer',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    display: show ? 'flex' : 'none',
  };
}

export function ShopMarkers({ distanceKm, height, bottomPadding, route, xUnit }: ShopMarkersProps) {
  const shops = useAppStore((s) => s.shops);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const lang = useAppStore((s) => s.ui.lang);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const removeShop = useAppStore((s) => s.removeShop);
  const updateShop = useAppStore((s) => s.updateShop);
  const strings = t(lang);

  return (
    <>
      {shops.map((shop) => {
        const key = 's' + shop.id;
        const on = hoverKey === key;
        const dragging = dragKey === key;
        const leftPct = (shop.at / distanceKm) * 100;
        return (
          <div key={shop.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={lineStyle(leftPct, height, bottomPadding, on || dragging)} />
            <div
              onPointerDown={createShopDragHandler(shop.id)}
              onPointerEnter={() => setHoverKey(key)}
              onPointerLeave={() => setHoverKey(null)}
              style={pinButtonStyle(leftPct)}
            >
              <svg
                width={PIN_W}
                height={PIN_H}
                viewBox="0 0 16 18"
                style={{ display: 'block', overflow: 'visible' }}
              >
                <path
                  d="M8 18C8 18 1 10.5 1 7A7 7 0 1 1 15 7C15 10.5 8 18 8 18Z"
                  fill={CHART_COLORS.ink}
                  opacity={on || dragging ? 1 : 0.75}
                />
              </svg>
              <button
                onClick={() => removeShop(shop.id)}
                onPointerDown={stopPointerDown}
                title={strings.removeItem}
                style={removeButtonStyle(on && !dragging)}
              >
                ✕
              </button>
              <input
                type="text"
                value={shop.name}
                maxLength={10}
                aria-label={strings.shopSheetName}
                placeholder={strings.shopDefaultName}
                onChange={(e) => updateShop(shop.id, { name: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                }}
                style={nameInputStyle(on && !dragging)}
              />
              {dragging && (
                <span
                  style={{
                    position: 'absolute',
                    top: -16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: CHART_COLORS.ink,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: '2px 5px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmtX(shop.at, true, route, xUnit)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
