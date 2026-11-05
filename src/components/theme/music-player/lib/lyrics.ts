import type { LyricLine } from '../types';

export function findActiveLyricIndex(lines: LyricLine[], timeSec: number): number {
  if (!Array.isArray(lines) || lines.length === 0) return -1;

  let active = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time <= timeSec) {
      active = index;
    } else {
      break;
    }
  }
  return active;
}

export function getLyricWindow(lines: LyricLine[], activeIndex: number) {
  const current = activeIndex >= 0 ? lines[activeIndex] ?? null : lines[0] ?? null;
  const previous = activeIndex > 0 ? lines[activeIndex - 1] ?? null : null;
  const next = activeIndex >= 0 ? lines[activeIndex + 1] ?? null : lines[1] ?? null;
  return { previous, current, next };
}
