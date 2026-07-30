import type { GpxTrack } from './types';

const RESAMPLE_POINTS = 400;
const EARTH_RADIUS_KM = 6371;

interface RawPoint {
  lat: number;
  lon: number;
  ele: number;
}

export interface GpxParseResult {
  ele: number[];
  distanceKm: number;
}

function extractPoints(xml: string, tag: 'trkpt' | 'rtept'): RawPoint[] {
  const points: RawPoint[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const attrs = m[1];
    const body = m[2];
    const lat = parseFloat(attrs.match(/\blat="([-0-9.eE]+)"/)?.[1] ?? '');
    const lon = parseFloat(attrs.match(/\blon="([-0-9.eE]+)"/)?.[1] ?? '');
    const eleMatch = body.match(/<ele>([^<]*)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) || 0 : 0;
    if (Number.isFinite(lat) && Number.isFinite(lon)) points.push({ lat, lon, ele });
  }
  return points;
}

export function parseGpxXml(xml: string): GpxParseResult {
  const track = extractPoints(xml, 'trkpt');
  const raw = track.length ? track : extractPoints(xml, 'rtept');
  if (raw.length < 8) throw new Error('too few points');

  const rad = Math.PI / 180;
  const cum = [0];
  for (let i = 1; i < raw.length; i++) {
    const a = raw[i - 1];
    const b = raw[i];
    const dLat = (b.lat - a.lat) * rad;
    const dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    cum[i] = cum[i - 1] + 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  const total = cum[cum.length - 1];
  if (!(total > 1)) throw new Error('no distance');

  const ele: number[] = [];
  for (let i = 0; i <= RESAMPLE_POINTS; i++) {
    const target = (total * i) / RESAMPLE_POINTS;
    let j = 1;
    while (j < cum.length - 1 && cum[j] < target) j++;
    const t0 = cum[j - 1];
    const t1 = cum[j];
    const k = t1 > t0 ? (target - t0) / (t1 - t0) : 0;
    ele.push(raw[j - 1].ele + (raw[j].ele - raw[j - 1].ele) * k);
  }

  return { ele, distanceKm: total };
}

const MAX_GPX_FILE_BYTES = 20 * 1024 * 1024;

export function loadGpxFile(file: File): Promise<{ track: GpxTrack; distanceKm: number; fileName: string }> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_GPX_FILE_BYTES) {
      reject(new Error('gpx file too large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { ele, distanceKm } = parseGpxXml(String(reader.result));
        resolve({
          track: { id: Date.now(), ele },
          distanceKm: Math.max(5, Math.round(distanceKm)),
          fileName: file.name,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('gpx parse error'));
      }
    };
    reader.onerror = () => reject(new Error('gpx read error'));
    reader.readAsText(file);
  });
}
