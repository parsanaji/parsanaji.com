import { describe, expect, it } from 'vitest';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';

describe('DEFAULT_FIELD', () => {
  it('deep-equals spec 4.9 as amended by 12.14 (the Blueprint dashes preset)', () => {
    expect(DEFAULT_FIELD).toEqual({
      density: 'dense',
      intensity: 'lively',
      flowSpeed: 1,
      dash: {
        k: { sparse: 0.021, medium: 0.0135, dense: 0.0092 }, minCss: 5, maxCss: 40, cap: 7000, degradeK: 1.5,
        lenMin: 0.15, lenK: 0.5, widthK: 0.08, alphaMin: 0.16, flowAmp: 0.9, flowScalePx: 171.43, repelK: 2.6, angleScalePx: 200,
        color: 'core',
        weightLight: 1.3, textWidth: 2, textLen: 1.3, textInk: 0.25,
      },
      shape: { warpScalePx: 240, mainScalePx: 141.18, warpAmp: 0, level: 0.25, gain: 1.9, shapeK: 0 },
      tiers: { t2: 0.68, t3: 0.85 },
      breath: { amp: 0.01, periodMs: 6000 },
      staticTimeS: 12,
      pointer: { radiusK: 0, radiusSp: 8, warpK: 0, boost: 0.35, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 },
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

  it('keeps the shader and instancing limits of 4.9.1 and 12.14', () => {
    expect(DEFAULT_FIELD.ripple.max).toBeLessThanOrEqual(8);
    expect(DEFAULT_FIELD.tiers.t2).toBeLessThan(DEFAULT_FIELD.tiers.t3);
    expect(DEFAULT_FIELD.dash.cap).toBeLessThanOrEqual(7000);
    expect(DEFAULT_FIELD.dash.minCss).toBeLessThan(DEFAULT_FIELD.dash.maxCss);
  });
});

describe('cloneField', () => {
  it('returns a deep copy that never aliases the defaults', () => {
    const before = JSON.stringify(DEFAULT_FIELD);
    const c = cloneField(DEFAULT_FIELD);
    expect(c).toEqual(DEFAULT_FIELD);
    expect(c).not.toBe(DEFAULT_FIELD);
    expect(c.dash).not.toBe(DEFAULT_FIELD.dash);
    expect(c.dash.k).not.toBe(DEFAULT_FIELD.dash.k);
    c.dash.k.medium = 99;
    c.pointer.radiusK = 99;
    c.density = c.density === 'dense' ? 'sparse' : 'dense';
    expect(JSON.stringify(DEFAULT_FIELD)).toBe(before);
  });
});
