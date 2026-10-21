// Pure TypeScript twin of the pass-1 GLSL math and of the dash lattice of pass 2 (spec 3.3.4–3.3.6, 12.14;
// Appendix A §3.4, §3.8). Self-contained: no import statements and only erasable TypeScript (no enums,
// namespaces or parameter properties), because scripts/og-image.mjs imports this file through Node type
// stripping (spec 4.10.2).

/** Added to every lattice x/y coordinate so the GLSL uint conversion never sees a negative value (3.3.5). */
export const NOISE_OFFSET = 256;
/** The hash masks z with 255, so the noise is periodic in z with this period and the CPU can wrap time (3.3.5). */
export const Z_PERIOD = 256;

/** Blueprint hash (part-c.html) in 32-bit unsigned arithmetic with z masked to 8 bits. Returns h / 2^32 in [0, 1). */
export function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((z | 0) & 255, 1013904223);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Blueprint noise3: trilinear value noise with the smoothstep fade f^2 (3 - 2f). x, y >= 0; z in [0, 256). */
export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let fx = x - xi;
  let fy = y - yi;
  let fz = z - zi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number): number => a + (b - a) * t;
  const c000 = hash3(xi, yi, zi);
  const c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi);
  const c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1);
  const c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1);
  const c111 = hash3(xi + 1, yi + 1, zi + 1);
  return l(l(l(c000, c100, fx), l(c010, c110, fx), fy), l(l(c001, c101, fx), l(c011, c111, fx), fy), fz);
}

/** Blueprint two-octave fbm (3.3.5); z2 is the Blueprint's z * 1.4 + 3.1, passed in already wrapped. */
export function fbm(x: number, y: number, z1: number, z2: number): number {
  return 0.62 * noise3(x, y, z1) + 0.38 * noise3(x * 2.1 + 7.3, y * 2.1 + 1.7, z2);
}

const wrapZ = (z: number): number => z - Z_PERIOD * Math.floor(z / Z_PERIOD);

/** Writes z wrapped to [0, 256); a value that float32 storage rounds up to 256 becomes 0, the same noise point. */
function storeZ(out: Float32Array, k: number, z: number): void {
  out[k] = wrapZ(z);
  if (out[k] >= Z_PERIOD) out[k] = 0;
}

/**
 * Noise z speeds per second of flow time (Blueprint part-c.html, non-raster branch; 12.14): the domain-warp fbm
 * (t × 0.09 × I, unused while warpAmp is 0), the main fbm (t × 0.22 × I), the dash drift (t × 0.18 × I) and the
 * stroke angle (t × 0.1).
 */
export const FLOW_K = { warp: 0.09, main: 0.22, dash: 0.18, angle: 0.1 };

/**
 * The nine noise z coordinates of one frame (3.3.6.2 as amended by 12.14): [zA, 1.4zA + 3.1, zB, 1.4zB + 3.1,
 * zC, 1.4zC + 3.1, zD, zD + 5, zE] with zA = 0.09 t I, zB = zA + 2, zC = 0.22 t I, zD = 0.18 t I, zE = 0.1 t I,
 * each wrapped to [0, 256) in double precision (spec 9.11).
 */
export function flowZ(tSec: number, intensity: number, out: Float32Array = new Float32Array(9)): Float32Array {
  const zA = FLOW_K.warp * tSec * intensity;
  const zB = zA + 2;
  const zC = FLOW_K.main * tSec * intensity;
  const zD = FLOW_K.dash * tSec * intensity;
  const zE = FLOW_K.angle * tSec * intensity;
  storeZ(out, 0, zA);
  storeZ(out, 1, 1.4 * zA + 3.1);
  storeZ(out, 2, zB);
  storeZ(out, 3, 1.4 * zB + 3.1);
  storeZ(out, 4, zC);
  storeZ(out, 5, 1.4 * zC + 3.1);
  storeZ(out, 6, zD);
  storeZ(out, 7, zD + 5);
  storeZ(out, 8, zE);
  return out;
}

export interface SurfaceShape {
  /** CSS px per warp-noise unit (Blueprint 240) */
  warpScalePx: number;
  /** CSS px per main-noise unit (Blueprint non-raster: 12 / 0.085 = 141.18) */
  mainScalePx: number;
  /** domain-warp strength in noise units (0: the non-raster branch has no warp) */
  warpAmp: number;
  /** level subtracted before the gain (Blueprint non-raster 0.25) */
  level: number;
  /** gain after the level (Blueprint non-raster 1.9) */
  gain: number;
  /** how much of the Blueprint dither curve min(1, 0.7 v + 0.4 (1 - |1 - 2v|) v) applies (0 = none, 1 = the raster look) */
  shapeK: number;
}

/** The Blueprint dashes surface (12.14): plain two-octave fbm, no warp, no dither curve. */
export const DASH_SHAPE: SurfaceShape = { warpScalePx: 240, mainScalePx: 141.18, warpAmp: 0, level: 0.25, gain: 1.9, shapeK: 0 };

/** F at a sample point in CSS px: 3.3.4 steps 3-6 at breath 1, without pointer, mask or rings. Returns [0, 1]. */
export function surface(xCss: number, yCss: number, z: ArrayLike<number>, s: SurfaceShape = DASH_SHAPE): number {
  const ax = xCss / s.warpScalePx + NOISE_OFFSET;
  const ay = yCss / s.warpScalePx + NOISE_OFFSET;
  const wx = fbm(ax + 3.1, ay, z[0], z[1]);
  const wy = fbm(ax, ay + 7.7, z[2], z[3]);
  let v = fbm(
    xCss / s.mainScalePx + NOISE_OFFSET + (wx - 0.5) * s.warpAmp,
    yCss / s.mainScalePx + NOISE_OFFSET + (wy - 0.5) * s.warpAmp,
    z[4],
    z[5],
  );
  v = Math.min(1, Math.max(0, (v - s.level) * s.gain));
  const shaped = Math.min(1, v * 0.7 + 0.4 * (1 - Math.abs(1 - 2 * v)) * v);
  return v + (shaped - v) * s.shapeK;
}

/** One Shockwave ring at a fixed age (3.3.8.2): origin, radius and sigma in CSS px. */
export interface Ring {
  x: number;
  y: number;
  radius: number;
  amp: number;
  sigma: number;
  gain: number;
}

/** gain * amp * exp(-(d - r)^2 / (2 sigma^2)), d = distance from the ring origin (3.3.8.2). */
export function ringGain(xCss: number, yCss: number, ring: Ring): number {
  const dx = xCss - ring.x;
  const dy = yCss - ring.y;
  const e = Math.sqrt(dx * dx + dy * dy) - ring.radius;
  return ring.gain * ring.amp * Math.exp(-(e * e) / (2 * ring.sigma * ring.sigma));
}

/** Stroke colour tier of a cell (12.14, Blueprint colour 'core'): 1 = field-1, 2 = field-2 above t2, 3 = field-3 above t3; strict >. */
export function tierOf(v: number, t2 = 0.68, t3 = 0.85): 1 | 2 | 3 {
  return v > t3 ? 3 : v > t2 ? 2 : 1;
}

/** The stroke geometry constants of dash.vert (12.14, Blueprint draw(), glyph 'dashes'). */
export interface DashShape {
  /** half-length at v = 0, in sp (0.15) */
  lenMin: number;
  /** half-length gain per unit v, in sp (0.5) */
  lenK: number;
  /** stroke width in sp, floored at 1 CSS px (0.08) */
  widthK: number;
  /** stroke alpha at v = 0; 1 at v = 1 (0.16) */
  alphaMin: number;
  /** flow drift amplitude in sp per unit intensity (0.9) */
  flowAmp: number;
  /** CSS px per drift-noise unit (12 / 0.07 = 171.43) */
  flowScalePx: number;
  /** CSS px per angle-noise unit (1 / 0.005 = 200) */
  angleScalePx: number;
}

export const BLUEPRINT_DASH: DashShape = { lenMin: 0.15, lenK: 0.5, widthK: 0.08, alphaMin: 0.16, flowAmp: 0.9, flowScalePx: 171.43, angleScalePx: 200 };

/** One stroke as dash.vert places it at rest (no pointer): centre after the flow drift, angle, half sizes and alpha, all in CSS px. */
export interface Dash {
  x: number;
  y: number;
  angle: number;
  halfLen: number;
  halfWidth: number;
  alpha: number;
}

/**
 * The stroke of lattice cell (i, j) with value v at flow z (12.14): the lattice point ((i + 0.5) sp, (j + 0.5) sp)
 * drifts by (noise - 0.5) × 0.9 sp I (1 - maskE) on each axis; the angle is 2π × noise at the lattice point.
 */
export function dashAt(i: number, j: number, sp: number, v: number, z: ArrayLike<number>, intensity: number, maskE = 0, d: DashShape = BLUEPRINT_DASH): Dash {
  const hx = (i + 0.5) * sp;
  const hy = (j + 0.5) * sp;
  const amp = sp * d.flowAmp * intensity * (1 - maskE);
  const qx = hx / d.flowScalePx + NOISE_OFFSET;
  const qy = hy / d.flowScalePx + NOISE_OFFSET;
  return {
    x: hx + (noise3(qx + 11, qy, z[6]) - 0.5) * amp,
    y: hy + (noise3(qx, qy + 37, z[7]) - 0.5) * amp,
    angle: noise3(hx / d.angleScalePx + NOISE_OFFSET, hy / d.angleScalePx + NOISE_OFFSET, z[8]) * 2 * Math.PI,
    halfLen: sp * (d.lenMin + d.lenK * v),
    halfWidth: Math.max(1, sp * d.widthK) / 2,
    alpha: d.alphaMin + (1 - d.alphaMin) * v,
  };
}

/** Floats per stroke in a dashGrid: x, y, angle, halfLen, halfWidth, alpha, tier. */
export const DASH_STRIDE = 7;

/**
 * Every stroke of a cols × rows lattice at flow time tSec (row 0 at the top, row-major, DASH_STRIDE floats each):
 * z = flowZ(tSec, 1) as the App samples it, v = min(1, surface + rings), the drift scaled by `intensity`
 * (INTENSITY_K). What the OG still draws (4.10.3 as amended by 12.14).
 */
export function dashGrid(
  cols: number,
  rows: number,
  sp: number,
  tSec: number,
  intensity: number,
  rings: readonly Ring[] = [],
  shape: SurfaceShape = DASH_SHAPE,
  d: DashShape = BLUEPRINT_DASH,
  t2 = 0.68,
  t3 = 0.85,
): Float32Array {
  const z = flowZ(tSec, 1);
  const out = new Float32Array(cols * rows * DASH_STRIDE);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * sp;
      const y = (j + 0.5) * sp;
      let v = surface(x, y, z, shape);
      for (const ring of rings) v += ringGain(x, y, ring);
      v = Math.min(1, v);
      const s = dashAt(i, j, sp, v, z, intensity, 0, d);
      const o = (j * cols + i) * DASH_STRIDE;
      out[o] = s.x;
      out[o + 1] = s.y;
      out[o + 2] = s.angle;
      out[o + 3] = s.halfLen;
      out[o + 4] = s.halfWidth;
      out[o + 5] = s.alpha;
      out[o + 6] = tierOf(v, t2, t3);
    }
  }
  return out;
}
