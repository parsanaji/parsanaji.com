import type { Canvas2DLike, Context2DLike } from '../../src/field/nameMask';

export interface FakeOptions {
  /** glyph advance as a fraction of the font size */
  charWidthEm?: number;
  /** glyph ink height as a fraction of the font size */
  capHeightEm?: number;
  /** expose a `letterSpacing` property like modern browsers do */
  nativeLetterSpacing?: boolean;
  /** report actualBoundingBoxAscent / actualBoundingBoxDescent from measureText (default true) */
  boundingBox?: boolean;
}

export interface FakeContext extends Context2DLike {
  fillTextCalls: { text: string; x: number; y: number; font: string }[];
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * A 2D context that "draws" every fillText as a filled rectangle and reports it from getImageData.
 * Ink spans capHeightEm × size above an 'alphabetic' baseline (descent 0), or ± half of it around a
 * 'middle' baseline.
 */
export function createFakeCanvasFactory(opts: FakeOptions = {}): {
  factory: (width: number, height: number) => Canvas2DLike;
  contexts: FakeContext[];
} {
  const charWidthEm = opts.charWidthEm ?? 0.6;
  const capHeightEm = opts.capHeightEm ?? 0.7;
  const boundingBox = opts.boundingBox ?? true;
  const contexts: FakeContext[] = [];

  const factory = (width: number, height: number): Canvas2DLike => {
    const rects: Rect[] = [];
    const fontPx = (): number => Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 10);
    const spacingPx = (): number => (ctx.letterSpacing ? Number.parseFloat(ctx.letterSpacing) : 0);
    const ctx: FakeContext = {
      font: '10px sans-serif',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      fillStyle: '#000',
      fillTextCalls: [],
      clearRect() {
        rects.length = 0;
      },
      measureText(text: string) {
        const width = text.length * charWidthEm * fontPx() + spacingPx() * text.length;
        return boundingBox ? { width, actualBoundingBoxAscent: capHeightEm * fontPx(), actualBoundingBoxDescent: 0 } : { width };
      },
      fillText(text: string, x: number, y: number) {
        ctx.fillTextCalls.push({ text, x, y, font: ctx.font });
        const w = text.length * charWidthEm * fontPx() + spacingPx() * text.length;
        const h = capHeightEm * fontPx();
        const left = ctx.textAlign === 'center' ? x - w / 2 : x;
        const [y0, y1] = ctx.textBaseline === 'alphabetic' ? [y - h, y] : [y - h / 2, y + h / 2];
        rects.push({ x0: left, x1: left + w, y0, y1 });
      },
      getImageData(_x: number, _y: number, w: number, h: number) {
        const data = new Uint8ClampedArray(w * h * 4);
        for (const r of rects) {
          for (let yy = Math.max(0, Math.ceil(r.y0)); yy < Math.min(h, Math.floor(r.y1)); yy++) {
            for (let xx = Math.max(0, Math.ceil(r.x0)); xx < Math.min(w, Math.floor(r.x1)); xx++) {
              data[(yy * w + xx) * 4 + 3] = 255;
            }
          }
        }
        return { width: w, height: h, data };
      },
    };
    if (opts.nativeLetterSpacing) ctx.letterSpacing = '0px';
    contexts.push(ctx);
    return { width, height, getContext: () => ctx };
  };

  return { factory, contexts };
}
