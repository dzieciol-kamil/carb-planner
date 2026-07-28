import { describe, expect, test } from 'vitest';
import { parseGpxXml } from './gpx';

function trkGpx(points: { lat: number; lon: number; ele: number }[]): string {
  const body = points
    .map((p) => `<trkpt lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele></trkpt>`)
    .join('\n');
  return `<?xml version="1.0"?><gpx><trk><trkseg>${body}</trkseg></trk></gpx>`;
}

function linePoints(n: number) {
  return Array.from({ length: n }, (_, i) => ({ lat: 50 + i * 0.01, lon: 19, ele: 100 + i * 10 }));
}

describe('parseGpxXml', () => {
  test('resamples elevation to 401 points spanning the track', () => {
    const result = parseGpxXml(trkGpx(linePoints(8)));
    expect(result.ele).toHaveLength(401);
    expect(result.ele[0]).toBeCloseTo(100, 6);
    expect(result.ele[400]).toBeCloseTo(170, 6);
    expect(result.distanceKm).toBeGreaterThan(1);
  });

  test('falls back to rtept when no trkpt is present', () => {
    const body = linePoints(8)
      .map((p) => `<rtept lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele></rtept>`)
      .join('\n');
    const xml = `<?xml version="1.0"?><gpx><rte>${body}</rte></gpx>`;
    const result = parseGpxXml(xml);
    expect(result.ele).toHaveLength(401);
    expect(result.ele[0]).toBeCloseTo(100, 6);
  });

  test('throws when there are too few points', () => {
    expect(() => parseGpxXml(trkGpx(linePoints(3)))).toThrow();
  });

  test('throws on malformed XML with no usable points', () => {
    expect(() => parseGpxXml('<not-gpx></not-gpx>')).toThrow();
  });
});
