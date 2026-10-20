import { describe, expect, it } from 'vitest';
import { mulberry32, seedFromLocation } from '../src/core/prng';

describe('mulberry32', () => {
  it('is deterministic for a seed and uniform in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seq = Array.from({ length: 1000 }, () => a());
    expect(Array.from({ length: 1000 }, () => b())).toEqual(seq);
    expect(Math.min(...seq)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...seq)).toBeLessThan(1);
    const mean = seq.reduce((s, v) => s + v, 0) / seq.length;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });

  it('differs between seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('seedFromLocation', () => {
  it('reads ?seed= when it is a finite number', () => {
    expect(seedFromLocation('?seed=42', () => 7)).toBe(42);
    expect(seedFromLocation('?debug&seed=9', () => 7)).toBe(9);
  });

  it('falls back otherwise', () => {
    expect(seedFromLocation('', () => 7)).toBe(7);
    expect(seedFromLocation('?seed=abc', () => 7)).toBe(7);
  });
});
