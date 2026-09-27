export const TRACK = {
  startDelayS: 0.2,
  drawS: 1.6,
} as const;

export function stopDelay(index: number, total: number): number {
  if (total <= 1) {
    return TRACK.startDelayS;
  }
  return TRACK.startDelayS + (index / (total - 1)) * TRACK.drawS;
}
