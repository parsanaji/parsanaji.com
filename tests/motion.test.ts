import { describe, expect, it } from 'vitest';
import { RippleScheduler, breathScale } from '../src/engine/motion';

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

describe('RippleScheduler', () => {
  const params = { intervalMs: 10_000, jitterMs: 2000, speedPxPerS: 1200, amplitudePx: 3, durationMs: 400, bandPx: 60 };
  const midRand = () => 0.5; // zero jitter

  it('fires at interval ± jitter and picks an origin once per ripple', () => {
    let picks = 0;
    const origin = () => {
      picks += 1;
      return [10, -20] as const;
    };
    const s = new RippleScheduler(params, midRand);
    expect(s.tick(9999, origin).active).toBe(false);
    const first = s.tick(1, origin);
    expect(first.active).toBe(true);
    expect([first.ox, first.oy]).toEqual([10, -20]);
    expect(first.radius).toBe(0);
    expect(picks).toBe(1);
    s.tick(200, origin);
    expect(picks).toBe(1);
  });

  it('grows the radius at the configured speed and peaks mid-duration', () => {
    const s = new RippleScheduler(params, midRand);
    s.tick(10_000, () => [0, 0] as const);
    const mid = s.tick(200, () => [0, 0] as const);
    expect(mid.radius).toBeCloseTo(240, 6);
    expect(mid.amplitude).toBeCloseTo(3, 6);
    expect(mid.band).toBe(60);
    const late = s.tick(199, () => [0, 0] as const);
    expect(late.amplitude).toBeLessThan(0.1);
  });

  it('ends after the duration and reschedules', () => {
    const s = new RippleScheduler(params, midRand);
    s.tick(10_000, () => [0, 0] as const);
    expect(s.tick(401, () => [0, 0] as const).active).toBe(false);
    expect(s.tick(9998, () => [0, 0] as const).active).toBe(false);
    expect(s.tick(2, () => [0, 0] as const).active).toBe(true);
  });

  it('honours jitter from the PRNG', () => {
    const early = new RippleScheduler(params, () => 0); // interval - jitter = 8000
    expect(early.tick(7999, () => [0, 0] as const).active).toBe(false);
    expect(early.tick(1, () => [0, 0] as const).active).toBe(true);
  });
});
