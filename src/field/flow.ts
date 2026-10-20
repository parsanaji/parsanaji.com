import type { FieldParams, Intensity } from './params';

/** Spec 3.3.6.1: flow-speed multiplier per intensity. */
export const INTENSITY_K: Readonly<Record<Intensity, number>> = Object.freeze({ subtle: 0.55, medium: 1, lively: 1.7 });

/** Spec 3.3.6.1: I_eff = INTENSITY_K[intensity] × flowSpeed; flow time τ advances by dt × I_eff. */
export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number {
  return INTENSITY_K[p.intensity] * p.flowSpeed;
}

/** Spec 3.5: the whole field scales by 1 ± amp on a sine with the given period. */
export function breathScale(tMs: number, amp: number, periodMs: number): number {
  if (amp === 0 || periodMs <= 0) return 1;
  return 1 + amp * Math.sin((2 * Math.PI * tMs) / periodMs);
}
