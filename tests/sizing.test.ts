import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { BAND_QUERY, cellCssFor, computeGrid, latticeSpacing, pointerRadius } from '../src/field/sizing';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const cell: FieldParams['cell'] = { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 };
const pointer: FieldParams['pointer'] = { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

describe('cellCssFor (spec 3.3.2.1)', () => {
  // [field width, sparse, medium, dense]
  const table: [number, number, number, number][] = [
    [390, 2.7, 2, 1.5],
    [768, 3.31776, 2.4576, 1.8432],
    [1280, 5.5296, 4.096, 3.072],
    [1366, 5.90112, 4.3712, 3.2784],
    [1440, 6.2208, 4.608, 3.456],
    [1920, 6.75, 5, 3.75],
    [2560, 6.75, 5, 3.75],
  ];
  it.each(table)('at %i px wide gives sparse %f, medium %f, dense %f', (w, sparse, medium, dense) => {
    expect(cellCssFor(w, cell, 'sparse')).toBeCloseTo(sparse, 9);
    expect(cellCssFor(w, cell, 'medium')).toBeCloseTo(medium, 9);
    expect(cellCssFor(w, cell, 'dense')).toBeCloseTo(dense, 9);
  });

  it('multiplies by the degrade factor after the FPS probe (3.7.9)', () => {
    expect(cellCssFor(1440, cell, 'medium', cell.degradeK)).toBeCloseTo(6.912, 9);
  });
});

describe('computeGrid (spec 3.3.2.2-3.3.2.5, Appendix A §4.2)', () => {
  // [cssW, cssH, dprRaw, dpr, cellDev, cellCss, cols, rows, maskW, maskH]
  const rows: [number, number, number, number, number, number, number, number, number, number][] = [
    [1440, 900, 1, 1, 5, 5, 288, 180, 576, 360],
    [1440, 900, 2, 2, 9, 4.5, 320, 200, 640, 400],
    [1280, 720, 1, 1, 4, 4, 320, 180, 640, 360],
    [1366, 768, 1, 1, 4, 4, 342, 192, 684, 384],
    [1920, 1080, 1, 1, 5, 5, 384, 216, 768, 432],
    [2560, 1440, 1, 1, 5, 5, 512, 288, 1024, 576],
    [390, 236.32, 3, 2, 4, 2, 195, 119, 390, 238],
  ];
  it.each(rows)('%i x %f at DPR %f', (w, h, dprRaw, dpr, cellDev, cellCss, cols, rows, maskW, maskH) => {
    const g = computeGrid(w, h, dprRaw, cellCssFor(w, cell, 'medium'));
    expect(g.dpr).toBe(dpr);
    expect(g.cellDev).toBe(cellDev);
    expect(g.cellCss).toBeCloseTo(cellCss, 9);
    expect([g.cols, g.rows, g.maskW, g.maskH]).toEqual([cols, rows, maskW, maskH]);
    expect(Number.isInteger(g.cellDev)).toBe(true);
  });

  it('makes cellDev even when the raw DPR exceeds the cap (4.5.9)', () => {
    const g = computeGrid(1440, 900, 3, cellCssFor(1440, cell, 'medium')); // round(4.608 x 2) = 9, odd
    expect(g.cellDev).toBe(10);
    expect(g.cellCss).toBe(5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([2880, 1800, 288, 180]);
  });

  it('prefers devicePixelContentBoxSize at a raw DPR of 2 or less (3.7.1)', () => {
    const w = cellCssFor(1366, cell, 'medium');
    expect(computeGrid(1366, 768, 1.25, w, { w: 1707, h: 960 }).widthDev).toBe(1707);
    expect(computeGrid(1366, 768, 1.25, w, null).widthDev).toBe(1708); // round(1707.5)
    expect(computeGrid(1366, 768, 1.25, w).cellDev).toBe(5);
  });

  it('ignores a device box that disagrees with css x dpr by more than 1 px (DevTools DPR emulation)', () => {
    const g = computeGrid(1440, 900, 1.25, cellCssFor(1440, cell, 'medium'), { w: 1440, h: 900 });
    expect([g.widthDev, g.heightDev, g.cellDev, g.cols, g.rows]).toEqual([1800, 1125, 6, 300, 188]);
  });

  it('ignores the device box above a raw DPR of 2 (the backing store is capped at 2x)', () => {
    const g = computeGrid(390, 236.32, 3, 2, { w: 1170, h: 709 });
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([780, 473, 195, 119]);
  });

  it('treats a non-finite or non-positive DPR as 1 (3.3.2.4)', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -2]) {
      const g = computeGrid(1440, 900, bad, cellCssFor(1440, cell, 'medium'));
      expect([g.dpr, g.cellDev, g.cols, g.rows]).toEqual([1, 5, 288, 180]);
    }
  });

  it('never produces a zero-sized target for a zero-sized canvas', () => {
    const g = computeGrid(0, 0, 1, 5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows, g.maskW, g.maskH]).toEqual([1, 1, 1, 1, 2, 2]);
  });
});

describe('latticeSpacing (spec 3.3.3)', () => {
  it('clamps w / 48 to [8, 40]', () => {
    expect(latticeSpacing(300)).toBe(8);
    expect(latticeSpacing(390)).toBeCloseTo(8.125, 9);
    expect(latticeSpacing(1280)).toBeCloseTo(26.667, 3);
    expect(latticeSpacing(1440)).toBe(30);
    expect(latticeSpacing(2000)).toBe(40);
  });
});

describe('pointerRadius (spec 3.3.7.1, at rest)', () => {
  it('is 312 px at 1440 x 900 and 82.42 px for the 390 x 236.32 band', () => {
    expect(pointerRadius(1440, 900, pointer)).toBeCloseTo(312, 9);
    expect(pointerRadius(390, 236.32, pointer)).toBeCloseTo(82.42, 2);
  });
});

describe('BAND_QUERY (spec 3.1.1)', () => {
  it('is the ruled band media query and appears verbatim in src/styles.css', () => {
    expect(BAND_QUERY).toBe('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)');
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toContain(BAND_QUERY);
  });
});
