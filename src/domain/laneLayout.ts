import type { FoodItem } from './types';

export function packFoodRows(foods: FoodItem[], distanceKm: number): FoodItem[][] {
  const rows: FoodItem[][] = [];
  const ends: number[] = [];
  foods
    .slice()
    .sort((a, b) => a.from - b.from)
    .forEach((fd) => {
      const width = Math.max(fd.to - fd.from, distanceKm * 0.05);
      let row = ends.findIndex((end) => fd.from >= end + distanceKm * 0.01);
      if (row === -1) {
        row = ends.length;
        rows.push([]);
      }
      ends[row] = fd.from + width;
      rows[row].push(fd);
    });
  return rows.length ? rows : [[]];
}
