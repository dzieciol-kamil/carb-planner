import { dist, totalHours } from '../../domain/fuel';
import type { RouteInput } from '../../domain/types';

export function durationLabel(hours: number): string {
  const h = Math.floor(hours);
  const m = String(Math.round((hours % 1) * 60)).padStart(2, '0');
  return `${h}h ${m}`;
}

export function routeLabel(route: RouteInput): string {
  const hours = totalHours(route);
  return `${dist(route)} km · ${durationLabel(hours)}`;
}
