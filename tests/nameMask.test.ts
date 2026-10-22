import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { MASK_FONT_FAMILY, alphaPlane, entryText, fitFontPx, maskBoxFor, rasterizeMask, type MaskGrid, type MaskPlane } from '../src/field/nameMask';
import { computeGrid } from '../src/field/sizing';
import { createFakeCanvasFactory } from './helpers/fakeCanvas';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const MASK: FieldParams['mask'] = { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, fontWeight: 700 };
const FONT = { family: MASK_FONT_FAMILY, weight: MASK.fontWeight };
const DESKTOP: MaskGrid = { cols: 288, rows: 180, cellCss: 5, supersample: 2 }; // 1440 x 900 at DPR 1

/** Centre of the inked texels, in texels. */
function inkCentre(plane: MaskPlane): { x: number; y: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let y = 0; y < plane.height; y++) {
    for (let x = 0; x < plane.width; x++) {
      if (plane.data[y * plane.width + x] === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { x: (minX + maxX + 1) / 2, y: (minY + maxY + 1) / 2 };
}

describe('fitFontPx (spec 4.8.3)', () => {
  it('is 0.84 w 100 / widthAt100 when width-limited: 201.6 px at 1440 x 900 ("Parsa Naji" = 6.0 em)', () => {
    expect(fitFontPx(600, { x: 0, y: 0, w: 1440, h: 900 }, 0.4, 0.84)).toBeCloseTo(201.6, 9);
  });

  it('is 0.4 h when height-limited', () => {
    expect(fitFontPx(600, { x: 0, y: 0, w: 2000, h: 300 }, 0.4, 0.84)).toBeCloseTo(120, 9);
  });

  it('falls back to the height rule for text without width and never goes negative', () => {
    expect(fitFontPx(0, { x: 0, y: 0, w: 1440, h: 900 }, 0.4, 0.84)).toBeCloseTo(360, 9);
    expect(fitFontPx(600, { x: 0, y: 0, w: -10, h: 900 }, 0.4, 0.84)).toBe(0);
  });
});

describe('alphaPlane (spec 4.8.5)', () => {
  it('extracts byte 3 of every RGBA pixel', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 10, 255, 255, 255, 20, 1, 2, 3, 30, 0, 0, 0, 40]);
    expect(Array.from(alphaPlane({ data, width: 2, height: 2 }))).toEqual([10, 20, 30, 40]);
  });
});

describe('rasterizeMask (spec 4.8.2-4.8.4)', () => {
  it('covers the whole field at 2 texels per cell', () => {
    const { factory } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    expect([plane.width, plane.height, plane.data.length]).toEqual([576, 360, 576 * 360]);
    expect(plane.fontPx).toBeCloseTo(201.6, 9);
  });

  it('centres the ink box on the box centre within one texel', () => {
    const { factory } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 288)).toBeLessThanOrEqual(1); // 720 CSS px x 0.4 texels per CSS px
    expect(Math.abs(c.y - 180)).toBeLessThanOrEqual(1);
  });

  it('draws 700 weight in MASK_FONT_FAMILY at fontPx x 2 / cellCss texels, centred, on the alphabetic baseline', () => {
    const { factory, contexts } = createFakeCanvasFactory();
    rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    const ctx = contexts[0];
    expect(ctx.fillTextCalls).toHaveLength(1);
    const call = ctx.fillTextCalls[0];
    const m = /^700 ([\d.]+)px (.+)$/.exec(call.font);
    expect(m?.[2]).toBe('"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
    expect(Number(m?.[1])).toBeCloseTo(80.64, 6); // 201.6 x 2 / 5
    expect(ctx.textAlign).toBe('center');
    expect(ctx.textBaseline).toBe('alphabetic');
    expect(call.x).toBeCloseTo(288, 9);
    expect(call.y).toBeCloseTo(180 + (0.7 * 80.64) / 2, 6); // cy + (ascent - descent) / 2
  });

  it('uses ascent 0.73 x size and descent 0 when measureText has no actualBoundingBox* (11.31)', () => {
    const { factory, contexts } = createFakeCanvasFactory({ boundingBox: false });
    rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    expect(contexts[0].fillTextCalls[0].y).toBeCloseTo(180 + (0.73 * 80.64) / 2, 6);
  });

  it('scales a one-line name to a 390 x 236.32 box: 54.6 px, centred (4.8.3)', () => {
    const g = computeGrid(390, 236.32, 3, 2);
    const { factory } = createFakeCanvasFactory();
    const box = maskBoxFor('entry', { w: 390, h: 236.32 }, null, true);
    const plane = rasterizeMask('Parsa Naji', box, { cols: g.cols, rows: g.rows, cellCss: g.cellCss, supersample: 2 }, FONT, MASK, factory);
    expect([plane.width, plane.height]).toEqual([390, 238]);
    expect(plane.fontPx).toBeCloseTo(54.6, 9);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 195)).toBeLessThanOrEqual(1);
    expect(Math.abs(c.y - 118.16)).toBeLessThanOrEqual(1);
  });

  it('places the Konami text in the box right of the scrim: a 137.2 px "nice." centred at x = 1195', () => {
    const { factory } = createFakeCanvasFactory();
    const box = maskBoxFor('konami', { w: 1440, h: 900 }, 950, false);
    const plane = rasterizeMask('nice.', box, DESKTOP, FONT, MASK, factory);
    expect(plane.fontPx).toBeCloseTo(137.2, 9);
    expect(Math.abs(inkCentre(plane).x - 1195 * 0.4)).toBeLessThanOrEqual(1);
  });

  it('throws when the canvas has no 2D context', () => {
    expect(() =>
      rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 10, h: 10 }, DESKTOP, FONT, MASK, () => ({ width: 1, height: 1, getContext: () => null })),
    ).toThrow('2d context unavailable');
  });
});

describe('maskBoxFor (spec 3.4.6, 3.4.11)', () => {
  it('gives the entry the whole field', () => {
    expect(maskBoxFor('entry', { w: 1440, h: 900 }, 950, false)).toEqual({ x: 0, y: 0, w: 1440, h: 900 });
  });

  it('gives Konami the part right of the scrim in the rail layout', () => {
    expect(maskBoxFor('konami', { w: 1440, h: 900 }, 950, false)).toEqual({ x: 950, y: 0, w: 490, h: 900 });
  });

  it('gives Konami the whole band in the band layout', () => {
    expect(maskBoxFor('konami', { w: 390, h: 236 }, null, true)).toEqual({ x: 0, y: 0, w: 390, h: 236 });
  });

  it('clamps a scrim edge past the field to an empty box', () => {
    expect(maskBoxFor('konami', { w: 760, h: 700 }, 762, false)).toEqual({ x: 760, y: 0, w: 0, h: 700 });
  });
});

// 12.16: on a portrait box (the phone layout's whole-viewport field) the name stacks into two lines, so it forms
// at the screen's centre at about twice the size one line would allow.
describe('stacked name on portrait boxes (3.4.6 as amended by 12.16)', () => {
  const PHONE = { x: 0, y: 0, w: 390, h: 664 };

  it('entryText stacks "Parsa Naji" into two lines when the box is taller than wide, and only then', () => {
    expect(entryText('Parsa Naji', PHONE)).toBe('Parsa\nNaji');
    expect(entryText('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 })).toBe('Parsa Naji');
    expect(entryText('Parsa Naji', { x: 0, y: 0, w: 700, h: 700 })).toBe('Parsa Naji');
    expect(entryText('nice.', PHONE)).toBe('nice.'); // one word stays one line
  });

  it('fitFontPx fits n lines at a 1.1 em advance into the height rule', () => {
    expect(fitFontPx(300, { x: 0, y: 0, w: 2000, h: 300 }, 0.4, 0.84, 2)).toBeCloseTo(120 / 2.1, 9);
    expect(fitFontPx(300, { x: 0, y: 0, w: 2000, h: 300 }, 0.4, 0.84, 1)).toBeCloseTo(120, 9);
  });

  it('draws two centred lines at 109.2 px in the 390 x 664 phone field (width-limited by "Parsa" = 3.0 em)', () => {
    const g = computeGrid(390, 664, 3, 6.27);
    const { factory, contexts } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa\nNaji', PHONE, { cols: g.cols, rows: g.rows, cellCss: g.cellCss, supersample: 2 }, FONT, MASK, factory);
    expect(plane.fontPx).toBeCloseTo(109.2, 9);
    const s = 2 / g.cellCss;
    const size = 109.2 * s;
    const calls = contexts[0].fillTextCalls;
    expect(calls.map((c) => c.text)).toEqual(['Parsa', 'Naji']);
    // the block: ascent 0.7 size (fake) + one 1.1 size advance + descent 0, centred on the box centre
    const blockH = 0.7 * size + 1.1 * size;
    const cy = 332 * s;
    expect(calls[0].x).toBeCloseTo(195 * s, 9);
    expect(calls[1].x).toBeCloseTo(195 * s, 9);
    expect(calls[0].y).toBeCloseTo(cy - blockH / 2 + 0.7 * size, 6);
    expect(calls[1].y).toBeCloseTo(cy - blockH / 2 + 0.7 * size + 1.1 * size, 6);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 195 * s)).toBeLessThanOrEqual(1);
    expect(Math.abs(c.y - cy)).toBeLessThanOrEqual(1);
  });
});
