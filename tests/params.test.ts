import { describe, expect, it } from 'vitest';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';

describe('DEFAULT_FIELD', () => {
  it('deep-equals spec 4.9', () => {
    expect(DEFAULT_FIELD).toEqual({
      density: 'medium',
      intensity: 'medium',
      flowSpeed: 1,
      cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
      shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
      tiers: { t2: 0.66, t3: 0.9 },
      breath: { amp: 0.01, periodMs: 6000 },
      staticTimeS: 12,
      pointer: { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 },
      ripple: { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 },
      mask: { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, fontWeight: 700 },
      entry: { gatherMs: 900, holdMs: 1000, dissolveMs: 800, scrimAtMs: 1900, revealAtMs: 2100, cleanupAtMs: 3300, skipMs: 250 },
      konami: { gatherMs: 900, holdMs: 1500, dissolveMs: 800 },
      boot: { readyTimeoutMs: 3000, fontTimeoutMs: 1200, restoreTimeoutMs: 3000, resizeDebounceMs: 150 },
      probe: { frames: 60, thresholdFps: 45 },
      theme: { crossfadeMs: 300 },
      scramble: { durMs: 600, stepMs: 40 },
      copy: { holdMs: 1200 },
    });
  });

  it('keeps the shader limits of 4.9.1', () => {
    expect(DEFAULT_FIELD.ripple.max).toBeLessThanOrEqual(8);
    expect(DEFAULT_FIELD.tiers.t2).toBeLessThan(DEFAULT_FIELD.tiers.t3);
  });
});

describe('cloneField', () => {
  it('returns a deep copy that never aliases the defaults', () => {
    const before = JSON.stringify(DEFAULT_FIELD);
    const c = cloneField(DEFAULT_FIELD);
    expect(c).toEqual(DEFAULT_FIELD);
    expect(c).not.toBe(DEFAULT_FIELD);
    expect(c.cell).not.toBe(DEFAULT_FIELD.cell);
    expect(c.cell.densityK).not.toBe(DEFAULT_FIELD.cell.densityK);
    c.cell.densityK.medium = 99;
    c.pointer.radiusK = 99;
    c.density = c.density === 'dense' ? 'sparse' : 'dense';
    expect(JSON.stringify(DEFAULT_FIELD)).toBe(before);
  });
});
