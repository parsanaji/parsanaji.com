import { easeOutCubic } from '../core/easing';
import type { FieldParams } from './params';

export type PointerKind = 'mouse' | 'pen' | 'touch';

const FRAME_MS = 16.667;
const SPEED_TAU_MS = 100; // 3.3.7.5: 100 ms exponential average
const SETTLE_PX = 0.25; // 3.6.4: eased point within 0.25 px of the raw point

/**
 * The eased pointer of spec 3.3.7, in field-space CSS px. `p` is held by reference, so the debug panel's
 * live edits apply on the next tick.
 */
export class PointerModel {
  private readonly p: FieldParams['pointer'];
  private rx = 0;
  private ry = 0;
  private ex = 0;
  private ey = 0;
  private target = 0;
  private lin = 0;
  private spd = 0;

  constructor(p: FieldParams['pointer']) {
    this.p = p;
  }

  /** A move inside the window: raw point and strength target 1 (3.3.7.4). */
  move(x: number, y: number, _kind: PointerKind): void {
    this.place(x, y, false);
  }

  /** A press: like a move, and a touch snaps the eased point to the touch point (3.3.7.6). */
  down(x: number, y: number, kind: PointerKind): void {
    this.place(x, y, kind === 'touch');
  }

  /** pointerup (touch), pointercancel, pointerleave, window blur: strength target 0 (3.3.7.6). */
  release(): void {
    this.target = 0;
  }

  tick(dtMs: number): void {
    if (!(dtMs > 0) || !Number.isFinite(dtMs)) return;
    const k = 1 - (1 - this.p.lerp) ** (dtMs / FRAME_MS); // 3.3.7.3, frame-rate independent
    const nx = this.ex + (this.rx - this.ex) * k;
    const ny = this.ey + (this.ry - this.ey) * k;
    const inst = (Math.hypot(nx - this.ex, ny - this.ey) * 1000) / dtMs;
    this.spd += (inst - this.spd) * (1 - Math.exp(-dtMs / SPEED_TAU_MS));
    this.ex = nx;
    this.ey = ny;
    if (this.lin < this.target) this.lin = Math.min(this.target, this.lin + dtMs / this.p.riseMs);
    else if (this.lin > this.target) this.lin = Math.max(this.target, this.lin - dtMs / this.p.fallMs);
    if (Math.abs(this.target - this.lin) < 1e-9) this.lin = this.target; // no float residue: settled can hold exactly
  }

  get x(): number {
    return this.ex;
  }

  get y(): number {
    return this.ey;
  }

  /** Eased 0..1: linear toward the target at dt / riseMs and dt / fallMs, output through easeOutCubic (3.3.7.4). */
  get strength(): number {
    return easeOutCubic(this.lin);
  }

  /** Speed of the eased point in px/s, smoothed with a 100 ms time constant (3.3.7.5). */
  get speed(): number {
    return this.spd;
  }

  get velFactor(): number {
    return Math.min(this.spd / this.p.velNorm, 1);
  }

  /** Strength at its target and the eased point within 0.25 px of the raw point (the 3.6.4 idle check). */
  get settled(): boolean {
    return this.lin === this.target && Math.hypot(this.rx - this.ex, this.ry - this.ey) <= SETTLE_PX;
  }

  private place(x: number, y: number, snap: boolean): void {
    this.rx = x;
    this.ry = y;
    // while the strength is 0 the eased point is invisible: jump there instead of sweeping in from a stale spot
    if (snap || this.lin === 0) {
      this.ex = x;
      this.ey = y;
      this.spd = 0;
    }
    this.target = 1;
  }
}
