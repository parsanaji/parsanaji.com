import { RIPPLE_OFF, type RippleParams, type RippleState } from './types';

/** Spec 3.5: the whole field scales by 1 ± amp on a sine with the given period. */
export function breathScale(tMs: number, amp: number, periodMs: number): number {
  if (amp === 0 || periodMs <= 0) return 1;
  return 1 + amp * Math.sin((2 * Math.PI * tMs) / periodMs);
}

/** One ripple at a time, every interval ± jitter, Gaussian amplitude envelope (spec 3.5). */
export class RippleScheduler {
  private clock = 0;
  private nextAt: number;
  private startedAt = -1;
  private ox = 0;
  private oy = 0;

  constructor(
    private params: RippleParams,
    private readonly rand: () => number,
  ) {
    this.nextAt = this.schedule();
  }

  setParams(p: RippleParams): void {
    this.params = p;
  }

  private schedule(): number {
    return this.clock + this.params.intervalMs + (this.rand() * 2 - 1) * this.params.jitterMs;
  }

  tick(dtMs: number, pickOrigin: () => readonly [number, number]): RippleState {
    this.clock += dtMs;
    const p = this.params;
    if (this.startedAt < 0 && this.clock >= this.nextAt) {
      const [x, y] = pickOrigin();
      this.ox = x;
      this.oy = y;
      this.startedAt = this.clock;
    }
    if (this.startedAt < 0) return RIPPLE_OFF;
    const age = this.clock - this.startedAt;
    if (age > p.durationMs) {
      this.startedAt = -1;
      this.nextAt = this.schedule();
      return RIPPLE_OFF;
    }
    const sigma = p.durationMs / 4;
    const envelope = Math.exp(-(((age - p.durationMs / 2) / sigma) ** 2));
    return {
      active: true,
      ox: this.ox,
      oy: this.oy,
      radius: (p.speedPxPerS * age) / 1000,
      amplitude: p.amplitudePx * envelope,
      band: p.bandPx,
    };
  }
}
