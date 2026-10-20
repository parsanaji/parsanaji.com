import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { RipplePool } from '../src/field/ripples';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const R: FieldParams['ripple'] = { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 };
const slots = (out: Float32Array, k: number): number[] => Array.from(out.subarray(k * 4, k * 4 + 4));

describe('RipplePool (spec 3.3.8)', () => {
  it('counts spawned rings', () => {
    const pool = new RipplePool(R);
    expect(pool.count).toBe(0);
    pool.spawn(10, 20, 0);
    pool.spawn(30, 40, 0.5);
    expect(pool.count).toBe(2);
  });

  it('drops the oldest ring when a 9th arrives (3.3.8.3)', () => {
    const pool = new RipplePool(R);
    for (let i = 0; i < 9; i++) pool.spawn(i, 0, i * 0.01);
    expect(pool.count).toBe(8);
    const out = new Float32Array(32);
    pool.write(0.1, 30, out);
    expect(out[0]).toBe(1); // ring 0 is gone, ring 1 now fills slot 0
    expect(out[28]).toBe(8);
  });

  it('packs (x, y, 9 sp age, 1.2 (1 - age / 3.2)) and zeroes unused slots (3.3.8.1)', () => {
    const pool = new RipplePool(R);
    pool.spawn(100, 50, 1);
    const out = new Float32Array(32).fill(7);
    expect(pool.write(2, 30, out)).toBe(1);
    const [x, y, radius, amp] = slots(out, 0);
    expect([x, y]).toEqual([100, 50]);
    expect(radius).toBeCloseTo(270, 4); // 9 x 30 x 1 s
    expect(amp).toBeCloseTo(0.825, 6); // 1.2 x (1 - 1 / 3.2)
    expect(Array.from(out.subarray(4))).toEqual(new Array(28).fill(0));
  });

  it('returns the active count and prunes rings at age 3.2 s', () => {
    const pool = new RipplePool(R);
    const out = new Float32Array(32);
    pool.spawn(0, 0, 0);
    pool.spawn(5, 5, 1);
    pool.spawn(9, 9, 2);
    expect(pool.write(3.19, 30, out)).toBe(3);
    expect(pool.write(3.2, 30, out)).toBe(2); // the t0 = 0 ring expires exactly at 3.2 s
    expect(pool.count).toBe(2);
    expect(slots(out, 0)[0]).toBe(5);
    expect(slots(out, 0)[2]).toBeCloseTo(9 * 30 * 2.2, 3);
    expect(slots(out, 2)).toEqual([0, 0, 0, 0]);
    expect(pool.write(5.2, 30, out)).toBe(0);
    expect(Array.from(out)).toEqual(new Array(32).fill(0));
  });

  it('clear() removes every ring', () => {
    const pool = new RipplePool(R);
    pool.spawn(1, 1, 0);
    pool.clear();
    expect(pool.count).toBe(0);
    expect(pool.write(0.1, 30, new Float32Array(32))).toBe(0);
  });

  it('reads max and lifeS live from the params object', () => {
    const p = { ...R };
    const pool = new RipplePool(p);
    p.max = 2;
    for (let i = 0; i < 5; i++) pool.spawn(i, 0, 0);
    expect(pool.count).toBe(2);
    p.lifeS = 1;
    expect(pool.write(1, 30, new Float32Array(32))).toBe(0);
  });
});
