import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { BAND_QUERY, computeGrid, dashSpacingFor, pointerRadius } from '../src/field/sizing';

// spec 4.9 (12.14) literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const dash: FieldParams['dash'] = {
  k: { sparse: 0.021, medium: 0.0135, dense: 0.0092 }, minCss: 5, maxCss: 40, cap: 7000, degradeK: 1.5,
  lenMin: 0.15, lenK: 0.5, widthK: 0.08, alphaMin: 0.16, flowAmp: 0.9, flowScalePx: 171.43, repelK: 2.6, angleScalePx: 200,
  color: 'core',
};
const pointer: FieldParams['pointer'] = { radiusK: 0, radiusSp: 8, warpK: 0, boost: 0.35, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

describe('dashSpacingFor (spec 12.14, Blueprint build())', () => {
  // [field width, field height, sparse, medium, dense]
  const table: [number, number, number, number, number][] = [
    [1440, 900, 30.24, 19.44, 14.83776],
    [1280, 720, 26.88, 17.28, 11.776],
    [1920, 1080, 40, 25.92, 17.664],
    [2560, 1440, 40, 34.56, 23.552],
    [390, 236.32, 8.19, 5.265, 5],
  ];
  it.each(table)('at %i x %f gives sparse %f, medium %f, dense %f', (w, h, sparse, medium, dense) => {
    expect(dashSpacingFor(w, h, dash, 'sparse')).toBeCloseTo(sparse, 9);
    expect(dashSpacingFor(w, h, dash, 'medium')).toBeCloseTo(medium, 9);
    expect(dashSpacingFor(w, h, dash, 'dense')).toBeCloseTo(dense, 9);
  });

  it('widens the spacing by 12 % steps until the lattice holds at most 7000 strokes', () => {
    // 768 x 1024 dense: 7.0656 gives 108 x 144 = 15552; four widenings land at 69 x 92 = 6348
    const sp = dashSpacingFor(768, 1024, dash, 'dense');
    expect(sp).toBeCloseTo(7.0656 * 1.12 ** 4, 9);
    expect(Math.floor(768 / sp) * Math.floor(1024 / sp)).toBeLessThanOrEqual(7000);
    expect(Math.floor(768 / (sp / 1.12)) * Math.floor(1024 / (sp / 1.12))).toBeGreaterThan(7000);
  });

  it('clamps to [minCss, maxCss] before the cap', () => {
    expect(dashSpacingFor(4000, 2000, dash, 'sparse')).toBe(40);
    expect(dashSpacingFor(390, 236.32, dash, 'dense')).toBe(5);
  });

  it('multiplies by the degrade factor after the FPS probe (3.7.9)', () => {
    expect(dashSpacingFor(1440, 900, dash, 'dense', dash.degradeK)).toBeCloseTo(19.872, 9);
  });
});

describe('computeGrid (spec 3.3.2 as amended by 12.14)', () => {
  it('keeps the spacing unsnapped and counts the partial last column and row', () => {
    const g = computeGrid(1440, 900, 1, 14.83776);
    expect(g).toEqual({ dpr: 1, widthDev: 1440, heightDev: 900, cssW: 1440, cssH: 900, cellDev: 14.83776, cellCss: 14.83776, cols: 98, rows: 61, maskW: 196, maskH: 122 });
  });

  it('caps the DPR at 2 and scales cellDev with it (4.5.9)', () => {
    const g = computeGrid(1440, 900, 3, 14.83776);
    expect([g.dpr, g.widthDev, g.heightDev]).toEqual([2, 2880, 1800]);
    expect(g.cellDev).toBeCloseTo(29.67552, 9);
    expect(g.cellCss).toBeCloseTo(14.83776, 9);
  });

  it('sizes the 390 x 236.32 band at DPR 3 as 780 x 473 with 78 x 48 strokes at sp 5', () => {
    const g = computeGrid(390, 236.32, 3, 5);
    expect([g.dpr, g.widthDev, g.heightDev, g.cellDev, g.cols, g.rows, g.maskW, g.maskH]).toEqual([2, 780, 473, 10, 78, 48, 156, 96]);
  });

  it('prefers devicePixelContentBoxSize at a raw DPR of 2 or less (3.7.1)', () => {
    expect(computeGrid(1366, 768, 1.25, 10, { w: 1707, h: 960 }).widthDev).toBe(1707);
    expect(computeGrid(1366, 768, 1.25, 10, null).widthDev).toBe(1708); // round(1707.5)
  });

  it('ignores a device box that disagrees with css x dpr by more than 1 px (DevTools DPR emulation)', () => {
    const g = computeGrid(1440, 900, 1.25, 10, { w: 1440, h: 900 });
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([1800, 1125, 144, 90]);
  });

  it('ignores the device box above a raw DPR of 2 (the backing store is capped at 2x)', () => {
    const g = computeGrid(390, 236.32, 3, 5, { w: 1170, h: 709 });
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([780, 473, 78, 48]);
  });

  it('treats a non-finite or non-positive DPR as 1 (3.3.2.4)', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -2]) {
      const g = computeGrid(1440, 900, bad, 14.83776);
      expect([g.dpr, g.widthDev, g.cols, g.rows]).toEqual([1, 1440, 98, 61]);
    }
  });

  it('never produces a zero-sized target or an empty lattice', () => {
    const g = computeGrid(0, 0, 1, 5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows, g.maskW, g.maskH]).toEqual([1, 1, 1, 1, 2, 2]);
    expect(computeGrid(100, 100, 1, Number.NaN).cellCss).toBe(1);
  });
});

describe('pointerRadius (spec 3.3.7.1 as amended by 12.14, at rest)', () => {
  it('is 8 sp: 118.70 px at 1440 x 900 dense and 40 px for the 390 x 236.32 band', () => {
    expect(pointerRadius(1440, 900, 14.83776, pointer)).toBeCloseTo(118.70208, 9);
    expect(pointerRadius(390, 236.32, 5, pointer)).toBeCloseTo(40, 9);
  });

  it('adds min(w, h) x radiusK when radiusK is set', () => {
    expect(pointerRadius(1440, 900, 10, { ...pointer, radiusK: 0.1, radiusSp: 2 })).toBeCloseTo(110, 9);
  });
});

describe('BAND_QUERY (spec 3.1.1)', () => {
  it('is the ruled band media query and appears verbatim in src/styles.css', () => {
    expect(BAND_QUERY).toBe('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)');
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toContain(BAND_QUERY);
  });
});
