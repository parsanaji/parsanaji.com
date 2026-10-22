import type { FieldParams } from './params';

export interface Context2DLike {
  font: string;
  textBaseline: string;
  textAlign: string;
  fillStyle: string;
  /** present in modern browsers; absent on older Safari and on test fakes that emulate it */
  letterSpacing?: string;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number; actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number };
  getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
}

export interface Canvas2DLike {
  width: number;
  height: number;
  getContext(type: '2d'): Context2DLike | null;
}

export type CanvasFactory = (w: number, h: number) => Canvas2DLike;

/** Spec 3.4.3 / 4.8.3: JetBrains Mono, then the fallback stack used when the font has not settled. */
export const MASK_FONT_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** A box in field-space CSS px (origin at the canvas's top-left, y down). */
export interface MaskBox { x: number; y: number; w: number; h: number }
/** The current grid (cols, rows, `cellCss` = Grid.cellCss = uCell) and the texels per cell (2). */
export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number }
/** R8 coverage, row 0 = the top of the field; `fontPx` is the CSS font size the text was fitted to. */
export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }

/** JetBrains Mono's cap height: the ascent used when measureText has no actualBoundingBox* (4.8.4, 11.31). */
const FALLBACK_ASCENT_EM = 0.73;

/** 12.16: the baseline-to-baseline advance of a stacked name, in em. */
export const LINE_ADVANCE_EM = 1.1;

/**
 * Spec 4.8.3: min(heightFrac × box.h, widthFrac × box.w × 100 / widthAt100), never negative. With `lines` > 1 the
 * height rule fits the whole block, 1 + (lines − 1) × 1.1 em tall (12.16); `widthAt100` is the longest line's.
 */
export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number, lines = 1): number {
  const byHeight = (heightFrac * Math.max(0, box.h)) / (1 + (lines - 1) * LINE_ADVANCE_EM);
  if (!(widthAt100 > 0)) return byHeight;
  return Math.min(byHeight, (widthFrac * Math.max(0, box.w) * 100) / widthAt100);
}

/**
 * 3.4.6 as amended by 12.16: on a portrait box (the phone layout's whole-viewport field) a two-word name stacks
 * into two lines at its first space, so it forms at the screen's centre at about twice the one-line size.
 */
export function entryText(name: string, box: MaskBox): string {
  const i = name.indexOf(' ');
  return i > 0 && box.h > box.w ? `${name.slice(0, i)}\n${name.slice(i + 1)}` : name;
}

/** Spec 4.8.5: byte 3 (alpha) of every RGBA pixel, as the R8 plane. */
export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array {
  const n = img.width * img.height;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = img.data[i * 4 + 3];
  return out;
}

/**
 * Spec 4.8.2–4.8.4: white text on a transparent canvas of supersample × cols by supersample × rows texels
 * covering the whole field (one texel = cellCss / supersample CSS px), centred on the box by its ink box.
 * Throws when the factory's canvas has no 2D context.
 */
export function rasterizeMask(
  text: string,
  box: MaskBox,
  grid: MaskGrid,
  font: { family: string; weight: number },
  p: FieldParams['mask'],
  create: CanvasFactory,
): MaskPlane {
  const width = Math.max(1, grid.supersample * grid.cols);
  const height = Math.max(1, grid.supersample * grid.rows);
  const canvas = create(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const s = grid.supersample / grid.cellCss; // texels per CSS px
  const lines = text.split('\n'); // 12.16: a stacked name is two lines, centred as one block
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${font.weight} 100px ${font.family}`;
  const widthAt100 = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const fontPx = fitFontPx(widthAt100, box, p.heightFrac, p.widthFrac, lines.length);
  const size = fontPx * s;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const first = ctx.measureText(lines[0]);
  const last = ctx.measureText(lines[lines.length - 1]);
  const ascent = typeof first.actualBoundingBoxAscent === 'number' ? first.actualBoundingBoxAscent : FALLBACK_ASCENT_EM * size;
  const descent = typeof last.actualBoundingBoxDescent === 'number' ? last.actualBoundingBoxDescent : 0;
  const advance = LINE_ADVANCE_EM * size;
  const blockH = ascent + descent + (lines.length - 1) * advance;
  const cx = (box.x + box.w / 2) * s;
  const baseline = (box.y + box.h / 2) * s - blockH / 2 + ascent; // one line: cy + (ascent − descent) / 2
  if (size > 0) lines.forEach((line, i) => ctx.fillText(line, cx, baseline + i * advance));
  return { data: alphaPlane(ctx.getImageData(0, 0, width, height)), width, height, fontPx };
}

/**
 * Spec 3.4.6 and 3.4.11: the entry uses the whole field; Konami uses the whole field on the band, else the
 * part right of the scrim's clear edge (clamped to the field, so a scrim wider than the field gives w = 0).
 */
export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox {
  if (kind === 'entry' || band || scrimRight === null) return { x: 0, y: 0, w: field.w, h: field.h };
  const x = Math.min(field.w, Math.max(0, scrimRight));
  return { x, y: 0, w: field.w - x, h: field.h };
}
