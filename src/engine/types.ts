export const PHASE = {
  ENTRY: 0,
  IDLE: 1,
  SCRAMBLE_OUT: 2,
  FORM_ALT: 3,
  HOLD_ALT: 4,
  SCRAMBLE_BACK: 5,
  FORM_NAME: 6,
} as const;
export type PhaseId = (typeof PHASE)[keyof typeof PHASE];

/** One repel source for the shader: live pointer or a decaying trail sample. */
export interface PointerSlot {
  x: number;
  y: number;
  /** 0 = inert, 1 = full strength */
  strength: number;
  /** 0..1 velocity factor, live pointer only */
  vel: number;
}

export interface RippleState {
  active: boolean;
  ox: number;
  oy: number;
  radius: number;
  amplitude: number;
  band: number;
}
export const RIPPLE_OFF: RippleState = Object.freeze({ active: false, ox: 0, oy: 0, radius: 0, amplitude: 0, band: 1 });

/** Dot-count caps per viewport width class (spec 3.3); debug-panel tunable. */
export interface CountCaps {
  desktop: number;
  tablet: number;
  phone: number;
}

export interface RippleParams {
  intervalMs: number;
  jitterMs: number;
  speedPxPerS: number;
  amplitudePx: number;
  durationMs: number;
  bandPx: number;
}

export interface MorphTimings {
  entryMs: number;
  entryStaggerMs: number;
  scrambleMs: number;
  formMs: number;
  formStaggerMs: number;
  holdMs: number;
  autoTeaseMs: number;
  /** per transition in reduced-motion mode (opacity crossfade halves) */
  reducedMs: number;
}

export interface PointerParams {
  lerp: number;
  trailMs: number;
  parkMs: number;
  sampleEveryMs: number;
  sampleMinDist: number;
  slots: number;
  velNorm: number;
}

export interface LayoutParams {
  stackBelow: number;
  widthFracSingle: number;
  widthFracStacked: number;
  maxHeightFrac: number;
  letterSpacingEm: number;
  lineHeight: number;
}

export interface RasterParams {
  fontFamily: string;
  fontWeight: number;
  scale: number;
}

export interface ProbeParams {
  frames: number;
  thresholdFps: number;
  degradeFactor: number;
}

export interface Params {
  density: number;
  caps: CountCaps;
  dotSize: number;
  sizeVarMin: number;
  sizeVarMax: number;
  alphaMin: number;
  alphaMax: number;
  alphaScale: number;
  nearScale: number;
  additive: boolean;
  vibAmp: number;
  vibFreq: number;
  vibScale: number;
  breathAmp: number;
  breathPeriodMs: number;
  entryScatterMin: number;
  entryScatterMax: number;
  scatterMin: number;
  scatterMax: number;
  repelRadius: number;
  repelStrength: number;
  repelClampFrac: number;
  reducedRepelRadius: number;
  ripple: RippleParams;
  morph: MorphTimings;
  pointer: PointerParams;
  layout: LayoutParams;
  raster: RasterParams;
  probe: ProbeParams;
}
