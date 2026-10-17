import { describe, expect, it } from 'vitest';
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo } from '../src/engine/easing';

describe('easing', () => {
  it('pins the end points', () => {
    for (const f of [easeOutExpo, easeInCubic, easeOutCubic]) {
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBeCloseTo(1, 6);
    }
  });

  it('has the expected midpoints', () => {
    expect(easeOutExpo(0.5)).toBeCloseTo(0.96875, 6);
    expect(easeInCubic(0.5)).toBeCloseTo(0.125, 6);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 6);
  });

  it('clamps', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.3)).toBe(0.3);
  });
});
