import { capDpr } from '../core/quality';
import type { Density, FieldParams } from './params';

/** Spec 3.1.1: the band layout's media query, used verbatim in src/styles.css. */
export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';

/** One frame's render-target sizing (spec 3.3.2, Appendix A §4.1). `cellCss` is the snapped `cellDev / dpr` (P6). */
export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Spec 3.3.2.1: clamp(k × w, min, max) × densityK × degrade (degrade 1, or 1.5 after the FPS probe). */
export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade = 1): number {
  return clamp(p.k * fieldCssW, p.minCss, p.maxCss) * p.densityK[density] * degrade;
}

/** Spec 3.3.2.2–3.3.2.4 and 3.7.1: whole-device-pixel cells, DPR capped at 2, the exact device box when it is trustworthy. */
export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid {
  const raw = Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1;
  const dpr = capDpr(raw);
  let cellDev = Math.max(2, Math.round(cellCss * dpr));
  if (raw > dpr && cellDev % 2 === 1) cellDev += 1; // 4.5.9: the compositor's 1.5x lands on whole device px
  // the device box is trusted only when it agrees with css x dpr to within the 1 px of edge snapping: DevTools
  // device-scale emulation reports the physical box, which would stretch every cell (8.2.10)
  const exact =
    deviceBox && raw <= 2 && Math.abs(deviceBox.w - cssW * dpr) <= 1 && Math.abs(deviceBox.h - cssH * dpr) <= 1 ? deviceBox : null;
  // a 0 x 0 box (canvas hidden mid-resize) still gives a 1 x 1 target: texStorage2D rejects zero sizes
  const widthDev = Math.max(1, exact ? Math.round(exact.w) : Math.round(cssW * dpr));
  const heightDev = Math.max(1, exact ? Math.round(exact.h) : Math.round(cssH * dpr));
  const cols = Math.ceil(widthDev / cellDev);
  const rows = Math.ceil(heightDev / cellDev);
  return { dpr, widthDev, heightDev, cellDev, cellCss: cellDev / dpr, cols, rows, maskW: 2 * cols, maskH: 2 * rows };
}

/** Spec 3.3.3: the Blueprint lattice unit sp, the unit of the pointer radius and the rings. */
export function latticeSpacing(fieldCssW: number): number {
  return clamp(fieldCssW / 48, 8, 40);
}

/** Spec 3.3.7.1 at rest: min(w, h) × radiusK + radiusSp × sp. App widens it by (1 + velRadiusGain × velFactor). */
export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number {
  return Math.min(fieldCssW, fieldCssH) * p.radiusK + p.radiusSp * latticeSpacing(fieldCssW);
}
