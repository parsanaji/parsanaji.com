import { describe, expect, it } from 'vitest';
import { DEFAULTS, cloneParams } from '../src/engine/defaults';
import { COUNT_CAP } from '../src/engine/quality';

describe('DEFAULTS', () => {
  it('ships the spec 3.3 caps as a tunable copy of COUNT_CAP', () => {
    expect(DEFAULTS.caps).toEqual(COUNT_CAP);
    expect(DEFAULTS.caps).not.toBe(COUNT_CAP);
  });
});

describe('cloneParams', () => {
  it('deep-copies, so debug-panel edits never reach DEFAULTS', () => {
    const p = cloneParams(DEFAULTS);
    p.caps.desktop = 1;
    p.ripple.intervalMs = 1;
    p.morph.holdMs = 1;
    p.pointer.lerp = 1;
    expect(DEFAULTS.caps.desktop).toBe(60_000);
    expect(DEFAULTS.ripple.intervalMs).toBe(10_000);
    expect(DEFAULTS.morph.holdMs).toBe(2500);
    expect(DEFAULTS.pointer.lerp).toBe(0.12);
  });
});
