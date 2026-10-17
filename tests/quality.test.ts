import { describe, expect, it } from 'vitest';
import { COUNT_CAP, FpsProbe, capDpr, degradedCount, dotCount, widthClass } from '../src/engine/quality';

describe('widthClass and caps', () => {
  it('classifies at the spec boundaries', () => {
    expect(widthClass(1024)).toBe('desktop');
    expect(widthClass(1023)).toBe('tablet');
    expect(widthClass(768)).toBe('tablet');
    expect(widthClass(767)).toBe('phone');
  });

  it('caps are 60k / 40k / 25k', () => {
    expect(COUNT_CAP).toEqual({ desktop: 60_000, tablet: 40_000, phone: 25_000 });
  });
});

describe('dotCount', () => {
  it('derives N from inked area times density', () => {
    expect(dotCount(50_000, 1440, 0.3)).toBe(15_000);
  });

  it('caps by width class', () => {
    expect(dotCount(1_000_000, 1440, 0.3)).toBe(60_000);
    expect(dotCount(1_000_000, 800, 0.3)).toBe(40_000);
    expect(dotCount(1_000_000, 390, 0.3)).toBe(25_000);
  });

  it('honours injected caps (debug-panel tunable, spec 3.3)', () => {
    const caps = { desktop: 30_000, tablet: 20_000, phone: 10_000 };
    expect(dotCount(1_000_000, 1440, 0.3, caps)).toBe(30_000);
    expect(dotCount(1_000_000, 390, 0.3, caps)).toBe(10_000);
  });

  it('never returns less than 1', () => {
    expect(dotCount(0, 1440, 0.3)).toBe(1);
  });
});

describe('capDpr', () => {
  it('caps at 2 and sanitizes', () => {
    expect(capDpr(3)).toBe(2);
    expect(capDpr(1.5)).toBe(1.5);
    expect(capDpr(Number.NaN)).toBe(1);
    expect(capDpr(0)).toBe(1);
  });
});

describe('degradedCount', () => {
  it('drops 40 percent', () => {
    expect(degradedCount(15_000)).toBe(9000);
    expect(degradedCount(1)).toBe(1);
  });
});

describe('FpsProbe', () => {
  it('stays pending until the window is full', () => {
    const p = new FpsProbe(60, 45);
    for (let i = 0; i < 59; i++) expect(p.push(16.7)).toBe('pending');
    expect(p.done).toBe(false);
  });

  it('keeps at 60 fps', () => {
    const p = new FpsProbe(60, 45);
    let last: string = 'pending';
    for (let i = 0; i < 60; i++) last = p.push(16.7);
    expect(last).toBe('keep');
    expect(p.done).toBe(true);
  });

  it('degrades once at 30 fps, then keeps forever', () => {
    const p = new FpsProbe(60, 45);
    let last: string = 'pending';
    for (let i = 0; i < 60; i++) last = p.push(33.3);
    expect(last).toBe('degrade');
    expect(p.push(33.3)).toBe('keep');
    expect(p.push(100)).toBe('keep');
  });
});
