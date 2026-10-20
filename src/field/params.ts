export type Density = 'sparse' | 'medium' | 'dense';
export type Intensity = 'subtle' | 'medium' | 'lively';

/** Every tunable of the field, the entry and the eggs (spec 4.9). The debug panel mutates one clone in place. */
export interface FieldParams {
  density: Density;
  intensity: Intensity;
  flowSpeed: number;
  cell: { k: number; minCss: number; maxCss: number; densityK: Record<Density, number>; degradeK: number };
  shape: { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number };
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

/** Spec 4.9, exact values. Never mutate it: callers work on `cloneField(DEFAULT_FIELD)`. */
export const DEFAULT_FIELD: FieldParams = {
  density: 'medium', // R4
  intensity: 'medium', // R4
  flowSpeed: 1, // multiplies INTENSITY_K (3.3.6)
  cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
  shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
  tiers: { t2: 0.66, t3: 0.9 },
  breath: { amp: 0.01, periodMs: 6000 },
  staticTimeS: 12, // reduced-motion still = the OG still
  pointer: { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 },
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
