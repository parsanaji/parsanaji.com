import { COUNT_CAP } from './quality';
import type { Params } from './types';

export const DEFAULTS: Params = {
  density: 0.3,
  caps: { ...COUNT_CAP },
  dotSize: 1.6,
  sizeVarMin: 0.75,
  sizeVarMax: 1.25,
  alphaMin: 0.6,
  alphaMax: 1.0,
  alphaScale: 1.0,
  nearScale: 1.3,
  additive: true,
  vibAmp: 0.6,
  vibFreq: 2.0,
  vibScale: 0.02,
  breathAmp: 0.01,
  breathPeriodMs: 6000,
  entryScatterMin: 300,
  entryScatterMax: 900,
  scatterMin: 120,
  scatterMax: 360,
  repelRadius: 120,
  repelStrength: 0.35,
  repelClampFrac: 0.6,
  reducedRepelRadius: 80,
  ripple: { intervalMs: 10_000, jitterMs: 2000, speedPxPerS: 1200, amplitudePx: 3, durationMs: 400, bandPx: 60 },
  morph: {
    entryMs: 1600,
    entryStaggerMs: 400,
    scrambleMs: 500,
    formMs: 900,
    formStaggerMs: 250,
    holdMs: 2500,
    autoTeaseMs: 8000,
    reducedMs: 150,
  },
  pointer: { lerp: 0.12, trailMs: 800, parkMs: 800, sampleEveryMs: 100, sampleMinDist: 16, slots: 8, velNorm: 1500 },
  layout: {
    stackBelow: 480,
    widthFracSingle: 0.72,
    widthFracStacked: 0.86,
    maxHeightFrac: 0.4,
    letterSpacingEm: 0.04,
    lineHeight: 0.95,
  },
  raster: { fontFamily: 'Geist Sans', fontWeight: 900, scale: 2 },
  probe: { frames: 60, thresholdFps: 45, degradeFactor: 0.6 },
};

export function cloneParams(p: Params): Params {
  return structuredClone(p);
}
