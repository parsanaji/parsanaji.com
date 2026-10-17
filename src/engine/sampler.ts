import type { LayoutParams, RasterParams } from './types';

export interface Context2DLike {
  font: string;
  textBaseline: string;
  textAlign: string;
  fillStyle: string;
  /** present in modern browsers; absent on older Safari and on test fakes that emulate it */
  letterSpacing?: string;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
}

export interface Canvas2DLike {
  width: number;
  height: number;
  getContext(type: '2d'): Context2DLike | null;
}

export type CanvasFactory = (width: number, height: number) => Canvas2DLike;

/** Width of `text` at `fontPx`, including letter spacing between glyphs. */
export type MeasureFn = (text: string, fontPx: number, letterSpacingEm: number) => number;

export interface LayoutOptions extends LayoutParams {
  viewportW: number;
  viewportH: number;
}

export interface LineBox {
  text: string;
  width: number;
  /** centre x in block coordinates (0 = block centre) */
  cx: number;
  /** centre y in block coordinates, y down */
  cy: number;
}

export interface Layout {
  fontPx: number;
  stacked: boolean;
  lines: LineBox[];
  blockW: number;
  blockH: number;
}

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  scale: number;
}

export interface SampleResult {
  /** interleaved x, y in centred CSS px, y up, re-centred on the inked bounding box */
  candidates: Float32Array;
  inkedAreaCssPx: number;
  layout: Layout;
  /** interleaved x, y of each non-space glyph centre, same coordinates as `candidates` */
  glyphCenters: Float32Array;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/** Spec 3.2: one line at 72 % width, or stacked words at 86 % below `stackBelow`; block height capped. */
export function layoutText(text: string, opts: LayoutOptions, measure: MeasureFn): Layout {
  const words = text.split(' ').filter((w) => w.length > 0);
  const stacked = opts.viewportW < opts.stackBelow && words.length > 1;
  const lines = stacked ? words : [text];
  const targetW = Math.max(1, opts.viewportW * (stacked ? opts.widthFracStacked : opts.widthFracSingle));
  const widestAt100 = Math.max(1e-6, ...lines.map((l) => measure(l, 100, opts.letterSpacingEm)));
  let fontPx = (targetW / widestAt100) * 100;
  // tiny positive floor (not 1 px): a 1 px tall viewport must still get a block no taller than 40 % of it
  const maxBlockH = Math.max(1e-6, opts.viewportH * opts.maxHeightFrac);
  const linesFactor = opts.lineHeight * lines.length;
  if (fontPx * linesFactor > maxBlockH) fontPx = maxBlockH / linesFactor;
  const lineH = fontPx * opts.lineHeight;
  const blockH = lineH * lines.length;
  const boxes: LineBox[] = lines.map((l, i) => ({
    text: l,
    width: measure(l, fontPx, opts.letterSpacingEm),
    cx: 0,
    cy: -blockH / 2 + lineH * (i + 0.5),
  }));
  const blockW = Math.max(...boxes.map((b) => b.width));
  return { fontPx, stacked, lines: boxes, blockW, blockH };
}

/** The family plus the CSS `--font-display` fallbacks, so a font timeout still samples (spec 3.8). */
function canvasFont(raster: Pick<RasterParams, 'fontFamily' | 'fontWeight'>, fontPx: number): string {
  return `${raster.fontWeight} ${fontPx}px "${raster.fontFamily}", system-ui, -apple-system, "Segoe UI", sans-serif`;
}

/** A measure function backed by a (possibly offscreen) 2D canvas. */
export function makeMeasure(canvas: Canvas2DLike, raster: Pick<RasterParams, 'fontFamily' | 'fontWeight'>): MeasureFn {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return (text, fontPx, letterSpacingEm) => {
    ctx.font = canvasFont(raster, fontPx);
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${letterSpacingEm * fontPx}px`;
      return ctx.measureText(text).width;
    }
    return ctx.measureText(text).width + Math.max(0, text.length - 1) * letterSpacingEm * fontPx;
  };
}

/** Fallback for contexts without `letterSpacing`: draws glyph by glyph, centred on x. */
export function drawSpaced(ctx: Context2DLike, text: string, x: number, y: number, spacing: number): void {
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  ctx.textAlign = 'left';
  let cursor = x - total / 2;
  chars.forEach((c, i) => {
    if (c !== ' ') ctx.fillText(c, cursor, y);
    cursor += widths[i] + spacing;
  });
}

/** Draws the layout at `raster.scale` × CSS size with padding for overshoot and returns the pixels. */
export function rasterize(layout: Layout, raster: RasterParams, letterSpacingEm: number, createCanvas: CanvasFactory): Raster {
  const pad = Math.ceil(layout.fontPx * 0.25);
  const width = Math.max(1, Math.ceil((layout.blockW + pad * 2) * raster.scale));
  const height = Math.max(1, Math.ceil((layout.blockH + pad * 2) * raster.scale));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const fontPx = layout.fontPx * raster.scale;
  const spacing = letterSpacingEm * fontPx;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = canvasFont(raster, fontPx);
  const native = 'letterSpacing' in ctx;
  if (native) ctx.letterSpacing = `${spacing}px`;
  for (const line of layout.lines) {
    const x = width / 2 + line.cx * raster.scale;
    const y = height / 2 + line.cy * raster.scale;
    if (native) {
      ctx.textAlign = 'center';
      // native letter spacing also trails the last glyph; shift by half of it to keep optical centring
      ctx.fillText(line.text, x + spacing / 2, y);
    } else {
      drawSpaced(ctx, line.text, x, y, spacing);
    }
  }
  const img = ctx.getImageData(0, 0, width, height);
  return { data: img.data, width, height, scale: raster.scale };
}

/** Pixel centres with alpha above `threshold`, interleaved x, y in raster pixels (y down). */
export function scanAlpha(img: { data: Uint8ClampedArray; width: number; height: number }, threshold = 128): Float32Array {
  const out: number[] = [];
  const { data, width, height } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > threshold) out.push(x + 0.5, y + 0.5);
    }
  }
  return Float32Array.from(out);
}

/** Exactly n points: a seeded uniform sample without replacement, or jittered duplicates when short (spec 3.3). */
export function subsampleToN(points: Float32Array, n: number, rand: () => number, jitter = 0.3): Float32Array {
  const count = points.length / 2;
  const out = new Float32Array(n * 2);
  if (count === 0 || n === 0) return out;
  if (count >= n) {
    const idx = new Uint32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(rand() * (count - i));
      const t = idx[i];
      idx[i] = idx[j];
      idx[j] = t;
      out[i * 2] = points[idx[i] * 2];
      out[i * 2 + 1] = points[idx[i] * 2 + 1];
    }
    return out;
  }
  for (let i = 0; i < n; i++) {
    const duplicate = i >= count;
    const src = duplicate ? Math.floor(rand() * count) : i;
    const jx = duplicate ? (rand() * 2 - 1) * jitter : 0;
    const jy = duplicate ? (rand() * 2 - 1) * jitter : 0;
    out[i * 2] = points[src * 2] + jx;
    out[i * 2 + 1] = points[src * 2 + 1] + jy;
  }
  return out;
}

function glyphCenters(layout: Layout, letterSpacingEm: number, measure: MeasureFn, dx: number, dy: number): Float32Array {
  const out: number[] = [];
  const spacing = letterSpacingEm * layout.fontPx;
  for (const line of layout.lines) {
    const chars = Array.from(line.text);
    const widths = chars.map((c) => measure(c, layout.fontPx, 0));
    const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
    let cursor = line.cx - total / 2;
    chars.forEach((c, i) => {
      if (c !== ' ') out.push(cursor + widths[i] / 2 - dx, -line.cy - dy);
      cursor += widths[i] + spacing;
    });
  }
  return Float32Array.from(out);
}

/** Layout → raster → candidates in centred CSS px (y up), re-centred on the inked bounding box. */
export function sampleText(
  text: string,
  opts: LayoutOptions,
  raster: RasterParams,
  createCanvas: CanvasFactory,
  measure: MeasureFn,
): SampleResult {
  const layout = layoutText(text, opts, measure);
  const img = rasterize(layout, raster, opts.letterSpacingEm, createCanvas);
  const raw = scanAlpha(img);
  const s = img.scale;
  const candidates = new Float32Array(raw.length);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < raw.length; i += 2) {
    const x = (raw[i] - img.width / 2) / s;
    const y = (img.height / 2 - raw[i + 1]) / s;
    candidates[i] = x;
    candidates[i + 1] = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const inked = raw.length > 0;
  const dx = inked ? (minX + maxX) / 2 : 0;
  const dy = inked ? (minY + maxY) / 2 : 0;
  for (let i = 0; i < candidates.length; i += 2) {
    candidates[i] -= dx;
    candidates[i + 1] -= dy;
  }
  return {
    candidates,
    inkedAreaCssPx: raw.length / 2 / (s * s),
    layout,
    glyphCenters: glyphCenters(layout, opts.letterSpacingEm, measure, dx, dy),
    bounds: inked
      ? { minX: minX - dx, maxX: maxX - dx, minY: minY - dy, maxY: maxY - dy }
      : { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  };
}
