const ONE_FRAME_MS = 1000 / 60;

/** Frame delta safe for simulation: finite, positive, and never larger than `maxMs` (hidden-tab gaps). */
export function clampDt(dtMs: number, maxMs = 50): number {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return ONE_FRAME_MS;
  return Math.min(dtMs, maxMs);
}
