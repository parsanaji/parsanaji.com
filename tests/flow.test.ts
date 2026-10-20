import { describe, expect, it } from 'vitest';
import { INTENSITY_K, breathScale, effectiveIntensity } from '../src/field/flow';

describe('breathScale', () => {
  it('oscillates ±amp around 1 with the given period', () => {
    expect(breathScale(0, 0.01, 6000)).toBeCloseTo(1, 9);
    expect(breathScale(1500, 0.01, 6000)).toBeCloseTo(1.01, 9);
    expect(breathScale(3000, 0.01, 6000)).toBeCloseTo(1, 9);
    expect(breathScale(4500, 0.01, 6000)).toBeCloseTo(0.99, 9);
  });

  it('is exactly 1 when disabled', () => {
    expect(breathScale(1234, 0, 6000)).toBe(1);
    expect(breathScale(1234, 0.01, 0)).toBe(1);
  });
});

describe('INTENSITY_K (spec 3.3.6.1)', () => {
  it('maps subtle, medium and lively to 0.55, 1 and 1.7', () => {
    expect(INTENSITY_K).toEqual({ subtle: 0.55, medium: 1, lively: 1.7 });
    expect(Object.isFrozen(INTENSITY_K)).toBe(true);
  });
});

describe('effectiveIntensity (spec 3.3.6.1)', () => {
  it('multiplies the intensity factor by the flow speed', () => {
    expect(effectiveIntensity({ intensity: 'medium', flowSpeed: 1 })).toBe(1);
    expect(effectiveIntensity({ intensity: 'lively', flowSpeed: 2 })).toBeCloseTo(3.4, 9);
    expect(effectiveIntensity({ intensity: 'subtle', flowSpeed: 0 })).toBe(0);
  });
});
