// Pure TypeScript twin of the pass-1 GLSL math (spec 3.3.4, 3.3.5, 3.3.10; Appendix A §3.4, §3.8).
// Self-contained: no import statements and only erasable TypeScript (no enums, namespaces or parameter
// properties), because scripts/og-image.mjs imports this file through Node type stripping (spec 4.10.2).

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
 * The six noise z coordinates of one frame (3.3.6.2): [zA, 1.4zA + 3.1, zB, 1.4zB + 3.1, zC, 1.4zC + 3.1] with
 * zA = 0.09 t I, zB = zA + 2, zC = 0.14 t I, each wrapped to [0, 256) in double precision (spec 9.11).
 */
export function flowZ(tSec: number, intensity: number, out: Float32Array = new Float32Array(6)): Float32Array {
  const zA = 0.09 * tSec * intensity;
  const zB = zA + 2;
  const zC = 0.14 * tSec * intensity;
  storeZ(out, 0, zA);
  storeZ(out, 1, 1.4 * zA + 3.1);
  storeZ(out, 2, zB);
  storeZ(out, 3, 1.4 * zB + 3.1);
  storeZ(out, 4, zC);
  storeZ(out, 5, 1.4 * zC + 3.1);
  return out;
}

export interface SurfaceShape {
  /** CSS px per warp-noise unit (Blueprint 240) */
  warpScalePx: number;
  /** CSS px per main-noise unit (Blueprint 160) */
  mainScalePx: number;
  /** domain-warp strength in noise units (Blueprint 2.6) */
  warpAmp: number;
  /** level subtracted before the gain (Blueprint dither 0.3) */
  level: number;
  /** gain after the level (Blueprint 2.1) */
  gain: number;
}

export const BLUEPRINT_SHAPE: SurfaceShape = { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 };

/** F at a sample point in CSS px: 3.3.4 steps 3-6 at breath 1, without pointer, mask or rings. Returns [0, 1]. */
export function surface(xCss: number, yCss: number, z: ArrayLike<number>, s: SurfaceShape = BLUEPRINT_SHAPE): number {
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
  return Math.min(1, v * 0.7 + 0.4 * (1 - Math.abs(1 - 2 * v)) * v);
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

/** Blueprint BAYER8, row-major: index = (i & 7) | ((j & 7) << 3), i = cell column, j = cell row from the top. */
export const BAYER8: readonly number[] = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

/** Bayer threshold of cell (i, j): (B + 0.5) / 64, in [1/128, 127/128] (3.3.10). */
export function bayerThreshold(i: number, j: number): number {
  return (BAYER8[(i & 7) | ((j & 7) << 3)] + 0.5) / 64;
}

/** 0 = off (field-0), 1 = field-1, 2 = field-2, 3 = field-3; strict > at every edge, as the Blueprint (3.3.10). */
export function tierOf(v: number, i: number, j: number, t2 = 0.66, t3 = 0.9): 0 | 1 | 2 | 3 {
  if (!(v > bayerThreshold(i, j))) return 0;
  return v > t3 ? 3 : v > t2 ? 2 : 1;
}

/**
 * Tiers of a cols x rows cell grid at flow time tSec: cell centres ((i + 0.5) c, (j + 0.5) c), row 0 at the top,
 * v = min(1, surface + sum of ringGain), stored row-major at j * cols + i. What the OG band draws (4.10.3).
 */
export function tierGrid(
  cols: number,
  rows: number,
  cellCss: number,
  tSec: number,
  intensity: number,
  rings: readonly Ring[] = [],
): Uint8Array {
  const z = flowZ(tSec, intensity);
  const out = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * cellCss;
      const y = (j + 0.5) * cellCss;
      let v = surface(x, y, z);
      for (const ring of rings) v += ringGain(x, y, ring);
      out[j * cols + i] = tierOf(Math.min(1, v), i, j);
    }
  }
  return out;
}
