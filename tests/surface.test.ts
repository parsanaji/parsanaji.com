import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import {
  BLUEPRINT_DASH,
  DASH_SHAPE,
  DASH_STRIDE,
  FLOW_K,
  NOISE_OFFSET,
  Z_PERIOD,
  dashAt,
  dashGrid,
  fbm,
  flowZ,
  hash3,
  noise3,
  ringGain,
  surface,
  tierOf,
  type Ring,
} from '../src/field/surface';

// Blueprint part-c.html line 138, verbatim (no z mask): the reference hash3 must match bit for bit (spec 3.3.5).
// prettier-ignore
function blueprintHash(x: number, y: number, z: number): number { let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1013904223); h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

describe('hash3 (3.3.5)', () => {
  it('equals the verbatim Blueprint hash on 1000 seeded integer triples with z in [0, 256)', () => {
    const r = mulberry32(1);
    for (let k = 0; k < 1000; k++) {
      const x = Math.floor(r() * 4096);
      const y = Math.floor(r() * 4096);
      const z = Math.floor(r() * 256);
      expect(hash3(x, y, z)).toBe(blueprintHash(x, y, z));
    }
  });

  it('masks z to 8 bits, so z and z + 256 hash alike', () => {
    expect(hash3(300, 301, 7 + 256)).toBe(hash3(300, 301, 7));
    expect(hash3(300, 301, 256)).toBe(hash3(300, 301, 0));
  });
});

describe('noise3 and fbm (3.3.5)', () => {
  it('is periodic in z with period 256', () => {
    const r = mulberry32(2);
    for (let k = 0; k < 1000; k++) {
      const x = NOISE_OFFSET + r() * 40;
      const y = NOISE_OFFSET + r() * 40;
      const z = r() * Z_PERIOD;
      expect(Math.abs(noise3(x, y, z) - noise3(x, y, z + Z_PERIOD))).toBeLessThanOrEqual(1e-12);
    }
  });

  it('stays in [0, 1)', () => {
    const r = mulberry32(3);
    for (let k = 0; k < 10_000; k++) {
      const v = noise3(NOISE_OFFSET + r() * 100, NOISE_OFFSET + r() * 100, r() * Z_PERIOD);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is continuous across lattice faces on every axis', () => {
    const r = mulberry32(4);
    for (let k = 0; k < 200; k++) {
      const x = NOISE_OFFSET + 1 + Math.floor(r() * 50);
      const y = NOISE_OFFSET + 1 + Math.floor(r() * 50);
      const z = 1 + Math.floor(r() * 250);
      const fy = y + r();
      const fz = z + r();
      expect(Math.abs(noise3(x - 1e-9, fy, fz) - noise3(x + 1e-9, fy, fz))).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(noise3(x + 0.3, y - 1e-9, fz) - noise3(x + 0.3, y + 1e-9, fz))).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(noise3(x + 0.3, fy, z - 1e-9) - noise3(x + 0.3, fy, z + 1e-9))).toBeLessThanOrEqual(1e-9);
    }
  });

  it('is continuous across the z wrap (255.9999999 versus 0.0000001)', () => {
    expect(Math.abs(noise3(300.3, 301.7, 255.9999999) - noise3(300.3, 301.7, 1e-7))).toBeLessThan(1e-6);
  });

  it('fbm is 0.62 noise3(p, z1) + 0.38 noise3(2.1p + (7.3, 1.7), z2)', () => {
    const v = fbm(260.25, 270.5, 12.5, 20.6);
    expect(v).toBe(0.62 * noise3(260.25, 270.5, 12.5) + 0.38 * noise3(260.25 * 2.1 + 7.3, 270.5 * 2.1 + 1.7, 20.6));
  });
});

describe('flowZ (3.3.6.2 as amended by 12.14)', () => {
  const rawZ = (t: number): number[] => {
    const zA = 0.09 * t;
    const zB = zA + 2;
    const zC = 0.22 * t;
    const zD = 0.18 * t;
    const zE = 0.1 * t;
    return [zA, 1.4 * zA + 3.1, zB, 1.4 * zB + 3.1, zC, 1.4 * zC + 3.1, zD, zD + 5, zE];
  };
  const mod256 = (z: number): number => z - 256 * Math.floor(z / 256);

  it('carries the Blueprint speeds: warp 0.09, main 0.22, drift 0.18, angle 0.1', () => {
    expect(FLOW_K).toEqual({ warp: 0.09, main: 0.22, dash: 0.18, angle: 0.1 });
  });

  it('returns nine values in [0, 256) equal to the raw formula mod 256', () => {
    for (const t of [0, 1, 12, 300, 2844.5, 86_400, 1e6]) {
      const z = flowZ(t, 1);
      expect(z).toHaveLength(9);
      rawZ(t).forEach((raw, k) => {
        expect(z[k]).toBeGreaterThanOrEqual(0);
        expect(z[k]).toBeLessThan(256);
        expect(z[k]).toBe(Math.fround(mod256(raw)));
      });
    }
  });

  it('scales time by the intensity and fills the given buffer', () => {
    const out = new Float32Array(9);
    expect(flowZ(10, 1.7, out)).toBe(out);
    const ref = flowZ(17, 1);
    out.forEach((z, k) => expect(z).toBeCloseTo(ref[k], 5));
  });

  it('stores a value that float32 would round up to 256 as 0', () => {
    expect(flowZ((256 - 1e-6) / 0.09, 1)[0]).toBe(0);
  });

  it('keeps the surface continuous across the main z wrap at t = 256 / 0.22', () => {
    const t0 = 256 / 0.22;
    const before = flowZ(t0 - 1e-4, 1);
    const after = flowZ(t0 + 1e-4, 1);
    expect(before[4]).toBeGreaterThan(255.99);
    expect(after[4]).toBeLessThan(0.01);
    const r = mulberry32(5);
    for (let k = 0; k < 500; k++) {
      const x = r() * 1440;
      const y = r() * 900;
      expect(Math.abs(surface(x, y, before) - surface(x, y, after))).toBeLessThan(1e-3);
    }
  });
});

describe('surface (3.3.4 as amended by 12.14)', () => {
  it('is the plain Blueprint non-raster field: clamp((fbm(p / 141.18 + 256) - 0.25) x 1.9), no warp, no curve', () => {
    expect(DASH_SHAPE).toEqual({ warpScalePx: 240, mainScalePx: 141.18, warpAmp: 0, level: 0.25, gain: 1.9, shapeK: 0 });
    const z = flowZ(12, 1);
    const r = mulberry32(6);
    for (let k = 0; k < 500; k++) {
      const x = r() * 1440;
      const y = r() * 900;
      const expected = clamp01((fbm(x / 141.18 + NOISE_OFFSET, y / 141.18 + NOISE_OFFSET, z[4], z[5]) - 0.25) * 1.9);
      expect(surface(x, y, z)).toBe(expected);
      expect(surface(x, y, z, DASH_SHAPE)).toBe(expected);
    }
  });

  it('stays in [0, 1] and reaches both ends over the dense Blueprint distribution', () => {
    const r = mulberry32(7);
    let min = 1;
    let max = 0;
    for (let k = 0; k < 100_000; k++) {
      const v = surface(r() * 3000, r() * 2000, flowZ(r() * 4000, 1));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    expect(min).toBe(0);
    expect(max).toBeGreaterThan(0.95);
  });

  it('shapeK mixes in the dither curve min(1, 0.7 v + 0.4 (1 - |1 - 2v|) v)', () => {
    const z = flowZ(12, 1);
    const r = mulberry32(8);
    for (let k = 0; k < 200; k++) {
      const x = r() * 1440;
      const y = r() * 900;
      const v = surface(x, y, z);
      const shaped = Math.min(1, v * 0.7 + 0.4 * (1 - Math.abs(1 - 2 * v)) * v);
      expect(surface(x, y, z, { ...DASH_SHAPE, shapeK: 1 })).toBeCloseTo(shaped, 12);
      expect(surface(x, y, z, { ...DASH_SHAPE, shapeK: 0.5 })).toBeCloseTo((v + shaped) / 2, 12);
    }
  });
});

describe('tierOf (12.14, Blueprint colour core)', () => {
  it('uses strict > at 0.68 and 0.85, and custom thresholds', () => {
    expect(tierOf(0)).toBe(1);
    expect(tierOf(0.68)).toBe(1);
    expect(tierOf(0.68 + 1e-9)).toBe(2);
    expect(tierOf(0.85)).toBe(2);
    expect(tierOf(0.85 + 1e-9)).toBe(3);
    expect(tierOf(1)).toBe(3);
    expect(tierOf(0.7, 0.75, 0.95)).toBe(1);
    expect(tierOf(0.96, 0.75, 0.95)).toBe(3);
  });
});

describe('rings (3.3.8.2)', () => {
  const ring: Ring = { x: 100, y: 100, radius: 50, amp: 0.975, sigma: 40, gain: 0.9 };

  it('ringGain is gain * amp * exp(-(d - r)^2 / (2 sigma^2))', () => {
    expect(ringGain(150, 100, ring)).toBeCloseTo(0.9 * 0.975, 12);
    expect(ringGain(190, 100, ring)).toBeCloseTo(0.9 * 0.975 * Math.exp(-0.5), 12);
    expect(ringGain(100, 100, ring)).toBeCloseTo(0.9 * 0.975 * Math.exp(-(50 * 50) / (2 * 40 * 40)), 12);
  });
});

describe('dashAt (12.14, Blueprint draw() glyph dashes)', () => {
  const z = flowZ(12, 1);

  it('sizes the stroke from v: half-length sp (0.15 + 0.5 v), width max(1, 0.08 sp), alpha 0.16 + 0.84 v', () => {
    expect(BLUEPRINT_DASH).toEqual({ lenMin: 0.15, lenK: 0.5, widthK: 0.08, alphaMin: 0.16, flowAmp: 0.9, flowScalePx: 171.43, angleScalePx: 200 });
    const s = dashAt(3, 4, 14, 0.5, z, 1);
    expect(s.halfLen).toBeCloseTo(5.6, 12);
    expect(s.halfWidth).toBeCloseTo(0.56, 12);
    expect(s.alpha).toBeCloseTo(0.58, 12);
    expect(dashAt(3, 4, 10, 0.5, z, 1).halfWidth).toBe(0.5); // 0.8 px floors at 1 px
    expect(dashAt(3, 4, 10, 1, z, 1).alpha).toBe(1);
    expect(dashAt(3, 4, 10, 0, z, 1).halfLen).toBeCloseTo(1.5, 12);
  });

  it('drifts the lattice point by at most 0.45 sp x intensity on each axis, and not at all once the text has formed', () => {
    const r = mulberry32(9);
    for (let k = 0; k < 300; k++) {
      const i = Math.floor(r() * 100);
      const j = Math.floor(r() * 60);
      const sp = 5 + r() * 35;
      const I = 0.5 + r() * 1.5;
      const s = dashAt(i, j, sp, r(), z, I);
      expect(Math.abs(s.x - (i + 0.5) * sp)).toBeLessThanOrEqual(0.45 * sp * I);
      expect(Math.abs(s.y - (j + 0.5) * sp)).toBeLessThanOrEqual(0.45 * sp * I);
      const still = dashAt(i, j, sp, 0.5, z, I, 1);
      expect(still.x).toBe((i + 0.5) * sp);
      expect(still.y).toBe((j + 0.5) * sp);
    }
  });

  it('uses the Blueprint noise offsets (11, 0) / (0, 37) at x / 171.43 and the angle noise at x / 200', () => {
    const sp = 14.83776;
    const s = dashAt(7, 5, sp, 0.3, z, 1.7);
    const hx = 7.5 * sp;
    const hy = 5.5 * sp;
    const qx = hx / 171.43 + NOISE_OFFSET;
    const qy = hy / 171.43 + NOISE_OFFSET;
    const amp = sp * 0.9 * 1.7;
    expect(s.x).toBe(hx + (noise3(qx + 11, qy, z[6]) - 0.5) * amp);
    expect(s.y).toBe(hy + (noise3(qx, qy + 37, z[7]) - 0.5) * amp);
    expect(s.angle).toBe(noise3(hx / 200 + NOISE_OFFSET, hy / 200 + NOISE_OFFSET, z[8]) * 2 * Math.PI);
    expect(s.angle).toBeGreaterThanOrEqual(0);
    expect(s.angle).toBeLessThan(2 * Math.PI);
  });
});

describe('dashGrid (12.14, 4.10.3)', () => {
  const tierCounts = (g: Float32Array): number[] => {
    const c = [0, 0, 0, 0];
    for (let o = 6; o < g.length; o += DASH_STRIDE) c[g[o]] += 1;
    return c;
  };

  it('is row-major with row 0 at the top, DASH_STRIDE floats per stroke, matching dashAt(surface) per cell', () => {
    const cols = 7;
    const rows = 4;
    const sp = 6;
    const g = dashGrid(cols, rows, sp, 12, 1.7);
    expect(DASH_STRIDE).toBe(7);
    expect(g).toHaveLength(cols * rows * DASH_STRIDE);
    const z = flowZ(12, 1);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v = Math.min(1, surface((i + 0.5) * sp, (j + 0.5) * sp, z));
        const s = dashAt(i, j, sp, v, z, 1.7);
        const o = (j * cols + i) * DASH_STRIDE;
        expect([...g.subarray(o, o + DASH_STRIDE)]).toEqual([s.x, s.y, s.angle, s.halfLen, s.halfWidth, s.alpha, tierOf(v)].map(Math.fround));
      }
    }
  });

  it('is deterministic and the OG lattice (109 x 58 at sp 11.04, t = 12) has strokes in every tier', () => {
    const a = dashGrid(109, 58, 11.04, 12, 1.7);
    expect(a).toEqual(dashGrid(109, 58, 11.04, 12, 1.7));
    expect(a).toHaveLength(109 * 58 * DASH_STRIDE);
    const [, f1, f2, f3] = tierCounts(a);
    expect(f1).toBeGreaterThan(f2);
    expect(f2).toBeGreaterThan(f3);
    expect(f3).toBeGreaterThan(0);
    expect(f1 + f2 + f3).toBe(109 * 58);
  });

  it('raises more strokes to field-3 along a ring', () => {
    const ring: Ring = { x: 600, y: 315, radius: 162, amp: 0.975, sigma: 48, gain: 0.9 };
    const base = tierCounts(dashGrid(109, 58, 11.04, 12, 1.7))[3];
    expect(tierCounts(dashGrid(109, 58, 11.04, 12, 1.7, [ring]))[3]).toBeGreaterThan(base);
  });
});

describe('surface.ts stays importable by Node type stripping (4.10.2)', () => {
  const src = readFileSync('src/field/surface.ts', 'utf8').replace(/\r\n/g, '\n');

  it('has no import statement and no non-erasable TypeScript', () => {
    expect(src).not.toMatch(/^\s*import[\s{*'"]/m);
    expect(src).not.toMatch(/^\s*export\s+[^\n]*\bfrom\s+['"]/m);
    expect(src).not.toMatch(/\benum\s|\bnamespace\s/);
  });

  it('loads in plain Node and builds a 4 x 2 lattice', () => {
    const run = spawnSync(
      process.execPath,
      ['-e', "import('./src/field/surface.ts').then(m => console.log(m.dashGrid(4, 2, 6, 12, 1).length))"],
      { encoding: 'utf8' },
    );
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).toBe('56');
  });
});
