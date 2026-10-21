import { capDpr } from '../core/quality';
import type { Density, FieldParams } from './params';

/** Spec 3.1.1: the band layout's media query, used verbatim in src/styles.css. */
export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';

/**
 * One frame's render-target sizing (spec 3.3.2 as amended by 12.14). `cellCss` is the dash lattice spacing sp in
 * CSS px and `cellDev` the same in device px; neither is snapped, because the strokes are anti-aliased geometry,
 * not pixel cells. `cssW` / `cssH` are the field box the strokes are positioned in.
 */
export interface Grid {
  dpr: number; widthDev: number; heightDev: number; cssW: number; cssH: number;
  cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * The Blueprint dashes lattice (part-c.html build(), non-raster branch; 12.14): sp = clamp(k[density] × w, min, max)
 * × degrade (1, or degradeK after the FPS probe), widened by 12 % until floor(w / sp) × floor(h / sp) ≤ cap.
 */
export function dashSpacingFor(fieldCssW: number, fieldCssH: number, p: FieldParams['dash'], density: Density, degrade = 1): number {
  let sp = clamp(p.k[density] * fieldCssW, p.minCss, p.maxCss) * degrade;
  const count = (s: number): number => Math.max(1, Math.floor(fieldCssW / s)) * Math.max(1, Math.floor(fieldCssH / s));
  while (count(sp) > p.cap) sp *= 1.12;
  return sp;
}

/** Spec 3.3.2.2–3.3.2.4 and 3.7.1: DPR capped at 2, the exact device box when it is trustworthy, one lattice cell per texel. */
export function computeGrid(cssW: number, cssH: number, dprRaw: number, spCss: number, deviceBox?: { w: number; h: number } | null): Grid {
  const raw = Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1;
  const dpr = capDpr(raw);
  // the device box is trusted only when it agrees with css x dpr to within the 1 px of edge snapping: DevTools
  // device-scale emulation reports the physical box, which would stretch the field (8.2.10)
  const exact =
    deviceBox && raw <= 2 && Math.abs(deviceBox.w - cssW * dpr) <= 1 && Math.abs(deviceBox.h - cssH * dpr) <= 1 ? deviceBox : null;
  // a 0 x 0 box (canvas hidden mid-resize) still gives a 1 x 1 target: texStorage2D rejects zero sizes
  const widthDev = Math.max(1, exact ? Math.round(exact.w) : Math.round(cssW * dpr));
  const heightDev = Math.max(1, exact ? Math.round(exact.h) : Math.round(cssH * dpr));
  const sp = Number.isFinite(spCss) && spCss > 0 ? spCss : 1;
  const cols = Math.max(1, Math.ceil(cssW / sp)); // the last partial column and row still carry strokes
  const rows = Math.max(1, Math.ceil(cssH / sp));
  return { dpr, widthDev, heightDev, cssW, cssH, cellDev: sp * dpr, cellCss: sp, cols, rows, maskW: 2 * cols, maskH: 2 * rows };
}

/** Spec 3.3.7.1 at rest (12.14): min(w, h) × radiusK + radiusSp × sp, sp = the dash spacing. App widens it by (1 + velRadiusGain × velFactor). */
export function pointerRadius(fieldCssW: number, fieldCssH: number, sp: number, p: FieldParams['pointer']): number {
  return Math.min(fieldCssW, fieldCssH) * p.radiusK + p.radiusSp * sp;
}
