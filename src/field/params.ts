export type Density = 'sparse' | 'medium' | 'dense';
export type Intensity = 'subtle' | 'medium' | 'lively';
/** 12.14: `core` colours strokes by tier (field-1 / field-2 / field-3); `muted` draws every stroke in field-1. */
export type DashColor = 'core' | 'muted';

/** Every tunable of the field, the entry and the eggs (spec 4.9 as amended by 12.14). The debug panel mutates one clone in place. */
export interface FieldParams {
  density: Density;
  intensity: Intensity;
  flowSpeed: number;
  dash: {
    k: Record<Density, number>; minCss: number; maxCss: number; cap: number; degradeK: number;
    lenMin: number; lenK: number; widthK: number; alphaMin: number; flowAmp: number; flowScalePx: number; repelK: number; angleScalePx: number;
    color: DashColor;
  };
  shape: { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number; shapeK: number };
  tiers: { t2: number; t3: number };
  breath: { amp: number; periodMs: number };
  staticTimeS: number;
  pointer: { radiusK: number; radiusSp: number; warpK: number; boost: number; lerp: number; riseMs: number; fallMs: number; velNorm: number; velRadiusGain: number };
  ripple: { max: number; lifeS: number; amp: number; speedSp: number; sigmaSp: number; gain: number };
  mask: { holdDim: number; ink: number; edge: number; meltPx: number; heightFrac: number; widthFrac: number; supersample: number; fontWeight: number };
  entry: { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number; revealAtMs: number; cleanupAtMs: number; skipMs: number };
  konami: { gatherMs: number; holdMs: number; dissolveMs: number };
  boot: { readyTimeoutMs: number; fontTimeoutMs: number; restoreTimeoutMs: number; resizeDebounceMs: number };
  probe: { frames: number; thresholdFps: number };
  theme: { crossfadeMs: number };
  scramble: { durMs: number; stepMs: number };
  copy: { holdMs: number };
}

/**
 * Spec 4.9 as amended by 12.14 (Parsa, 2026-10-20: "I want the dashes"): the Blueprint `glyph: 'dashes'` preset of
 * the picks file, density dense, intensity lively, motion flow, reaction repel, click ripple. Never mutate it:
 * callers work on `cloneField(DEFAULT_FIELD)`.
 */
export const DEFAULT_FIELD: FieldParams = {
  density: 'dense',
  intensity: 'lively',
  flowSpeed: 1, // multiplies INTENSITY_K (3.3.6)
  // Blueprint build() non-raster: sp = clamp(k w, 5, 40), at most 7000 strokes; draw(): len sp (0.15 + 0.5 v),
  // lineWidth max(1, 0.08 sp), alpha 0.16 + 0.84 v, flow drift 0.9 sp I on noise at (x / 12) × 0.07 = x / 171.43,
  // pointer repel 2.6 sp inside R = 8 sp, angle from noise at x × 0.005 = x / 200
  dash: {
    k: { sparse: 0.021, medium: 0.0135, dense: 0.0092 }, minCss: 5, maxCss: 40, cap: 7000, degradeK: 1.5,
    lenMin: 0.15, lenK: 0.5, widthK: 0.08, alphaMin: 0.16, flowAmp: 0.9, flowScalePx: 171.43, repelK: 2.6, angleScalePx: 200,
    color: 'core',
  },
  // Blueprint vAt() non-raster: fbm at (x / 12) × 0.085 = x / 141.18, no domain warp, (v - 0.25) × 1.9, no dither curve
  shape: { warpScalePx: 240, mainScalePx: 141.18, warpAmp: 0, level: 0.25, gain: 1.9, shapeK: 0 },
  tiers: { t2: 0.68, t3: 0.85 }, // Blueprint colour 'core': accent above 0.68, fg above 0.85
  breath: { amp: 0.01, periodMs: 6000 },
  staticTimeS: 12, // reduced-motion still = the OG still
  pointer: { radiusK: 0, radiusSp: 8, warpK: 0, boost: 0.35, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 },
  ripple: { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 },
  mask: { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, fontWeight: 700 },
  entry: { gatherMs: 900, holdMs: 1000, dissolveMs: 800, scrimAtMs: 1900, revealAtMs: 2100, cleanupAtMs: 3300, skipMs: 250 },
  konami: { gatherMs: 900, holdMs: 1500, dissolveMs: 800 },
  boot: { readyTimeoutMs: 3000, fontTimeoutMs: 1200, restoreTimeoutMs: 3000, resizeDebounceMs: 150 },
  probe: { frames: 60, thresholdFps: 45 },
  theme: { crossfadeMs: 300 },
  scramble: { durMs: 600, stepMs: 40 },
  copy: { holdMs: 1200 },
};

/** A deep copy (structuredClone), so the panel and the app never write into DEFAULT_FIELD. */
export function cloneField(p: FieldParams): FieldParams {
  return structuredClone(p);
}
