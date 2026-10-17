import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/engine/defaults';
import { mulberry32 } from '../src/engine/prng';
import { layoutText, makeMeasure, sampleText, scanAlpha, subsampleToN, type MeasureFn } from '../src/engine/sampler';
import { createFakeCanvasFactory } from './helpers/fakeCanvas';

const measure: MeasureFn = (t, f, ls) => t.length * 0.6 * f + Math.max(0, t.length - 1) * ls * f;
const opts = (w: number, h: number) => ({ ...DEFAULTS.layout, viewportW: w, viewportH: h });

describe('layoutText', () => {
  it('keeps PARSA NAJI on one line at 72 percent of the width on desktop', () => {
    const l = layoutText('PARSA NAJI', opts(1440, 900), measure);
    expect(l.stacked).toBe(false);
    expect(l.lines).toHaveLength(1);
    expect(l.blockW).toBeCloseTo(1440 * 0.72, 0);
    expect(l.blockH).toBeLessThanOrEqual(900 * 0.4);
  });

  it('stacks below 480 px at 86 percent of the width', () => {
    const l = layoutText('PARSA NAJI', opts(390, 844), measure);
    expect(l.stacked).toBe(true);
    expect(l.lines.map((x) => x.text)).toEqual(['PARSA', 'NAJI']);
    expect(l.blockW).toBeCloseTo(390 * 0.86, 0);
    expect(l.lines[0].cy).toBeCloseTo(-l.lines[1].cy, 5);
  });

  it('caps the block at 40 percent of the viewport height', () => {
    const l = layoutText('PARSA NAJI', opts(1024, 200), measure);
    expect(l.blockH).toBeCloseTo(80, 5);
    expect(l.blockW).toBeLessThan(1024 * 0.72);
  });

  it('survives extreme viewports', () => {
    for (const [w, h] of [
      [320, 480],
      [2560, 1080],
      [1024, 200],
      [1, 1],
    ] as const) {
      const l = layoutText('PARSA NAJI', opts(w, h), measure);
      expect(l.fontPx).toBeGreaterThan(0);
      expect(l.blockH).toBeLessThanOrEqual(h * 0.4 + 1e-6);
    }
  });

  it('never stacks a single word', () => {
    expect(layoutText('soon.', opts(390, 844), measure).stacked).toBe(false);
  });
});

describe('scanAlpha', () => {
  it('returns pixel centres whose alpha exceeds the threshold', () => {
    const data = new Uint8ClampedArray(3 * 2 * 4);
    data[(0 * 3 + 1) * 4 + 3] = 255;
    data[(1 * 3 + 2) * 4 + 3] = 200;
    data[(1 * 3 + 0) * 4 + 3] = 100;
    expect(Array.from(scanAlpha({ width: 3, height: 2, data }))).toEqual([1.5, 0.5, 2.5, 1.5]);
  });
});

describe('subsampleToN', () => {
  const pts = Float32Array.from({ length: 200 }, (_, i) => i); // 100 points, y = x + 1

  it('returns exactly n points drawn from the input when n < count', () => {
    const out = subsampleToN(pts, 10, mulberry32(1));
    expect(out.length).toBe(20);
    for (let i = 0; i < 20; i += 2) expect(out[i + 1]).toBe(out[i] + 1);
  });

  it('is deterministic for the same seed', () => {
    expect(subsampleToN(pts, 10, mulberry32(7))).toEqual(subsampleToN(pts, 10, mulberry32(7)));
  });

  it('pads with jittered duplicates when n > count', () => {
    const out = subsampleToN(pts, 150, mulberry32(3));
    expect(out.length).toBe(300);
    for (let i = 0; i < 200; i++) expect(out[i]).toBe(pts[i]);
    for (let i = 200; i < 300; i += 2) {
      const nearest = Math.min(
        ...Array.from({ length: 100 }, (_, k) => Math.hypot(out[i] - pts[2 * k], out[i + 1] - pts[2 * k + 1])),
      );
      expect(nearest).toBeLessThanOrEqual(0.3 * Math.SQRT2 + 1e-6);
    }
  });

  it('returns zeros for empty input', () => {
    expect(Array.from(subsampleToN(new Float32Array(0), 3, mulberry32(1)))).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('sampleText', () => {
  it('produces centred candidates and an inked area in CSS px²', () => {
    const { factory } = createFakeCanvasFactory();
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    const r = sampleText('PARSA NAJI', opts(1440, 900), DEFAULTS.raster, factory, m);
    expect(r.candidates.length).toBeGreaterThan(1000);
    expect(Math.abs(r.bounds.minX + r.bounds.maxX)).toBeLessThan(1);
    expect(Math.abs(r.bounds.minY + r.bounds.maxY)).toBeLessThan(1);
    expect(r.inkedAreaCssPx).toBeCloseTo(r.candidates.length / 2 / 4, 5);
    expect(r.glyphCenters.length).toBe(9 * 2);
  });

  it('falls back to per-glyph drawing when the context lacks letterSpacing', () => {
    const { factory, contexts } = createFakeCanvasFactory({ nativeLetterSpacing: false });
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    sampleText('PARSA NAJI', opts(1440, 900), DEFAULTS.raster, factory, m);
    const raster = contexts[contexts.length - 1];
    expect(raster.fillTextCalls).toHaveLength(9);
    expect(raster.fillTextCalls.map((c) => c.text).join('')).toBe('PARSANAJI');
  });

  it('uses one fillText per line when letterSpacing is native', () => {
    const { factory, contexts } = createFakeCanvasFactory({ nativeLetterSpacing: true });
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    sampleText('PARSA NAJI', opts(390, 844), DEFAULTS.raster, factory, m);
    expect(contexts[contexts.length - 1].fillTextCalls.map((c) => c.text)).toEqual(['PARSA', 'NAJI']);
  });

  it('handles text that leaves no ink', () => {
    const { factory } = createFakeCanvasFactory();
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    const r = sampleText(' ', opts(1440, 900), DEFAULTS.raster, factory, m);
    expect(r.candidates.length).toBe(0);
    expect(r.inkedAreaCssPx).toBe(0);
    expect(r.bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  });
});
