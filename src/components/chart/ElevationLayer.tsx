import type { ProfilePoint } from '../../domain/fuel';
import { CHART_COLORS } from './theme';

interface ElevationLayerProps {
  pts: ProfilePoint[];
  distanceKm: number;
  width: number;
  height: number;
  bottomPadding: number;
  share: number;
  visible: boolean;
}

export function ElevationLayer({ pts, distanceKm, width, height, bottomPadding, share, visible }: ElevationLayerProps) {
  if (!visible) return null;

  const maxEle = Math.max(...pts.map((p) => p.ele)) * 1.1;
  const top = (height - bottomPadding) * (1 - share);
  const px = (x: number) => (x / distanceKm) * width;
  const py = (ele: number) => height - bottomPadding - (ele / maxEle) * (height - bottomPadding - top);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p.ele).toFixed(1)).join(' ');

  const bands = pts
    .map((p, i) => {
      if (!i) return null;
      const color = p.grad > 2.5 ? CHART_COLORS.climb : p.grad < -2.5 ? CHART_COLORS.water : null;
      if (!color) return null;
      return (
        <rect
          key={'eb' + i}
          x={px(pts[i - 1].x)}
          y={0}
          width={px(p.x) - px(pts[i - 1].x) + 1}
          height={height - bottomPadding}
          fill={color}
          opacity={0.075}
        />
      );
    })
    .filter(Boolean);

  return (
    <>
      {bands}
      <path d={path + ' L' + width + ' ' + (height - bottomPadding) + ' L0 ' + (height - bottomPadding) + ' Z'} fill="#C6CEC8" opacity={0.5} />
      <path d={path} fill="none" stroke="#9AA39C" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
    </>
  );
}
