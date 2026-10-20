import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { PointerModel } from '../src/field/pointer';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const P: FieldParams['pointer'] = { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

/** Eased x after `ms` of frames at `fps`, the raw point jumping from 0 to 1000 px at t = 0. */
function easedAfter(fps: number, ms: number): number {
  const m = new PointerModel(P);
  m.down(0, 0, 'touch'); // eased point snapped to 0
  m.tick(1000 / fps); // strength above 0, so the next move eases instead of snapping
  m.move(1000, 0, 'mouse');
  const frames = Math.round((ms * fps) / 1000);
  for (let i = 0; i < frames; i++) m.tick(1000 / fps);
  return m.x;
}

describe('PointerModel ease (spec 3.3.7.3)', () => {
  it('is frame-rate independent at 30, 60 and 120 fps', () => {
    for (const fps of [30, 60, 120]) {
      expect(easedAfter(fps, 100)).toBeCloseTo(695.986, 2); // 1000 x (1 - 0.82^(100 / 16.667))
      const at1s = easedAfter(fps, 1000);
      expect(Math.abs(at1s - easedAfter(60, 1000)) / easedAfter(60, 1000)).toBeLessThan(0.01);
      expect(at1s).toBeCloseTo(999.993, 2);
    }
  });

  it('jumps to the first point instead of sweeping in from a stale position', () => {
    const m = new PointerModel(P);
    m.move(700, 400, 'mouse');
    expect([m.x, m.y]).toEqual([700, 400]);
  });

  it('ignores a non-positive or non-finite dt', () => {
    const m = new PointerModel(P);
    m.down(0, 0, 'touch');
    m.tick(16.667);
    m.move(100, 0, 'mouse');
    const before = [m.x, m.strength];
    for (const dt of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) m.tick(dt);
    expect([m.x, m.strength]).toEqual(before);
  });
});

describe('PointerModel strength (spec 3.3.7.4)', () => {
  it('rises over 200 ms and falls over 600 ms through easeOutCubic', () => {
    const m = new PointerModel(P);
    m.move(10, 10, 'mouse');
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBeCloseTo(0.875, 9); // easeOutCubic(0.5)
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBe(1);
    m.release();
    for (let i = 0; i < 15; i++) m.tick(20);
    expect(m.strength).toBeCloseTo(0.875, 9);
    for (let i = 0; i < 15; i++) m.tick(20);
    expect(m.strength).toBe(0);
  });

  it('reads riseMs and fallMs live from the params object', () => {
    const p = { ...P };
    const m = new PointerModel(p);
    m.move(0, 0, 'mouse');
    p.riseMs = 100;
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBe(1);
  });
});

describe('PointerModel press (spec 3.3.7.6)', () => {
  it('snaps the eased point on a touch pointerdown, not on a mouse one', () => {
    const m = new PointerModel(P);
    m.move(100, 100, 'mouse');
    for (let i = 0; i < 10; i++) m.tick(16.667);
    m.down(500, 300, 'mouse');
    expect(m.x).toBeCloseTo(100, 6);
    m.down(500, 300, 'touch');
    expect([m.x, m.y]).toEqual([500, 300]);
  });
});

describe('PointerModel speed (spec 3.3.7.5)', () => {
  /** velFactor after 1 s of the raw point moving right at `pxPerS`, 60 fps. */
  function velAfter(pxPerS: number): { speed: number; vel: number } {
    const m = new PointerModel(P);
    m.move(0, 0, 'mouse');
    let x = 0;
    for (let i = 0; i < 60; i++) {
      x += pxPerS / 60;
      m.move(x, 0, 'mouse');
      m.tick(1000 / 60);
    }
    return { speed: m.speed, vel: m.velFactor };
  }

  it('tracks the eased point speed and saturates velFactor at 1500 px/s', () => {
    expect(velAfter(3000).speed).toBeCloseTo(2999.19, 1);
    expect(velAfter(3000).vel).toBe(1);
    expect(velAfter(750).vel).toBeCloseTo(0.49987, 4);
  });
});

describe('PointerModel settled (spec 3.6.4 idle check)', () => {
  it('is true only when the strength is at its target and the eased point is within 0.25 px of the raw point', () => {
    const m = new PointerModel(P);
    m.move(200, 200, 'mouse');
    expect(m.settled).toBe(false); // strength still rising
    for (let i = 0; i < 60; i++) m.tick(16.667);
    expect(m.settled).toBe(true);
    m.move(900, 600, 'mouse');
    expect(m.settled).toBe(false); // raw point far from the eased one
    m.release();
    for (let i = 0; i < 60; i++) m.tick(16.667);
    expect(m.strength).toBe(0);
    expect(m.settled).toBe(true);
  });
});
