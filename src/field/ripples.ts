import type { FieldParams } from './params';

interface Ripple {
  x: number;
  y: number;
  t0: number;
}

const SLOTS = 8; // uRipples[8] in pass 1

/**
 * Shockwave rings (spec 3.3.8), in field-space CSS px and sim seconds. `p` is held by reference, so the
 * debug panel's live edits apply on the next write.
 */
export class RipplePool {
  private readonly p: FieldParams['ripple'];
  private rings: Ripple[] = [];

  constructor(p: FieldParams['ripple']) {
    this.p = p;
  }

  /** One ring per accepted primary pointerdown; at p.max rings the oldest is dropped (3.3.8.3). */
  spawn(x: number, y: number, tSec: number): void {
    const max = Math.max(1, Math.min(SLOTS, Math.floor(this.p.max)));
    while (this.rings.length >= max) this.rings.shift();
    this.rings.push({ x, y, t0: tSec });
  }

  /**
   * Packs up to 8 vec4 (x, y, radius = speedSp × sp × age, amp × (1 − age / lifeS)) into `out` (length 32),
   * zeroes the unused slots, prunes rings with age ≥ lifeS (3.3.8.1) and returns the active count.
   */
  write(tSec: number, sp: number, out: Float32Array): number {
    const { lifeS, speedSp, amp } = this.p;
    this.rings = this.rings.filter((r) => tSec - r.t0 < lifeS);
    const n = Math.min(SLOTS, this.rings.length);
    for (let k = 0; k < SLOTS; k++) {
      const o = k * 4;
      if (k < n) {
        const r = this.rings[k];
        const age = Math.max(0, tSec - r.t0);
        out[o] = r.x;
        out[o + 1] = r.y;
        out[o + 2] = speedSp * sp * age;
        out[o + 3] = amp * (1 - age / lifeS);
      } else {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
      }
    }
    return n;
  }

  clear(): void {
    this.rings = [];
  }

  get count(): number {
    return this.rings.length;
  }
}
