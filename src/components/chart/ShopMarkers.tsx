import type { CSSProperties } from 'react';
import { createShopDragHandler, stopPointerDown } from '../lanes/dragHandlers';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS } from './theme';

const PIN_W = 16;
const PIN_H = 18;

interface ShopMarkersProps {
  distanceKm: number;
  height: number;
  bottomPadding: number;
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

function lineStyle(leftPct: number, height: number, bottomPadding: number, on: boolean): CSSProperties {
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

export function ShopMarkers({ distanceKm, height, bottomPadding }: ShopMarkersProps) {
  const shops = useAppStore((s) => s.shops);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const removeShop = useAppStore((s) => s.removeShop);

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
              <svg width={PIN_W} height={PIN_H} viewBox="0 0 16 18" style={{ display: 'block', overflow: 'visible' }}>
                <path
                  d="M8 18C8 18 1 10.5 1 7A7 7 0 1 1 15 7C15 10.5 8 18 8 18Z"
                  fill={CHART_COLORS.ink}
                  opacity={on || dragging ? 1 : 0.75}
                />
              </svg>
              <button onClick={() => removeShop(shop.id)} onPointerDown={stopPointerDown} title="Remove" style={removeButtonStyle(on && !dragging)}>
                ✕
              </button>
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
                  {Math.round(shop.at)} km
                </span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
