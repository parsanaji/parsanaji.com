import { describe, expect, it } from 'vitest';
import { clampDt } from '../src/core/time';

describe('clampDt', () => {
  it('passes normal frame deltas through', () => {
    expect(clampDt(16.7)).toBe(16.7);
    expect(clampDt(33.3)).toBe(33.3);
  });

  it('caps a huge delta after a hidden tab at 50 ms', () => {
    expect(clampDt(60_000)).toBe(50);
  });

  it('substitutes one 60 fps frame for garbage', () => {
    expect(clampDt(Number.NaN)).toBeCloseTo(16.667, 3);
    expect(clampDt(0)).toBeCloseTo(16.667, 3);
    expect(clampDt(-5)).toBeCloseTo(16.667, 3);
  });
});
