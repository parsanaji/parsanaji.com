import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import {
  BAYER8,
  BLUEPRINT_SHAPE,
  NOISE_OFFSET,
  Z_PERIOD,
  bayerThreshold,
  fbm,
  flowZ,
  hash3,
  noise3,
  ringGain,
  surface,
  tierGrid,
  tierOf,
  type Ring,
} from '../src/field/surface';

// Blueprint part-c.html line 138, verbatim (no z mask): the reference hash3 must match bit for bit (spec 3.3.5).
// prettier-ignore
function blueprintHash(x: number, y: number, z: number): number { let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1013904223); h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }

// Blueprint part-c.html line 144, verbatim.
// prettier-ignore
const BLUEPRINT_BAYER8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];

const fnv1a = (bytes: Uint8Array): number => {
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const coverage = (tiers: Uint8Array): number[] => {
  const c = [0, 0, 0, 0];
  for (const t of tiers) c[t] += 1;
  return c.map((n) => (100 * n) / tiers.length);
};

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

describe('flowZ (3.3.6.2)', () => {
  const rawZ = (t: number): number[] => {
    const zA = 0.09 * t;
    const zB = zA + 2;
    const zC = 0.14 * t;
    return [zA, 1.4 * zA + 3.1, zB, 1.4 * zB + 3.1, zC, 1.4 * zC + 3.1];
  };
  const mod256 = (z: number): number => z - 256 * Math.floor(z / 256);

  it('returns six values in [0, 256) equal to the raw formula mod 256', () => {
    for (const t of [0, 1, 12, 300, 2844.5, 86_400, 1e6]) {
      const z = flowZ(t, 1);
      expect(z).toHaveLength(6);
      rawZ(t).forEach((raw, k) => {
        expect(z[k]).toBeGreaterThanOrEqual(0);
        expect(z[k]).toBeLessThan(256);
        expect(z[k]).toBe(Math.fround(mod256(raw)));
      });
    }
  });

  it('scales time by the intensity and fills the given buffer', () => {
    const out = new Float32Array(6);
    expect(flowZ(10, 1.7, out)).toBe(out);
    const ref = flowZ(17, 1);
    out.forEach((z, k) => expect(z).toBeCloseTo(ref[k], 5));
  });

  it('stores a value that float32 would round up to 256 as 0', () => {
    expect(flowZ((256 - 1e-6) / 0.09, 1)[0]).toBe(0);
  });

  it('keeps the surface continuous across the zA wrap at t = 256 / 0.09', () => {
    const t0 = 256 / 0.09;
    const before = flowZ(t0 - 1e-4, 1);
    const after = flowZ(t0 + 1e-4, 1);
    expect(before[0]).toBeGreaterThan(255.99);
    expect(after[0]).toBeLessThan(0.01);
    const r = mulberry32(5);
    for (let k = 0; k < 500; k++) {
      const x = r() * 1440;
      const y = r() * 900;
      expect(Math.abs(surface(x, y, before) - surface(x, y, after))).toBeLessThan(1e-3);
    }
  });
});

describe('surface (3.3.4, 3.3.10 reachability)', () => {
  it('never exceeds the dither-curve peak 0.703125, so the boost alone never reaches field-3', () => {
    const r = mulberry32(6);
    let max = 0;
    for (let k = 0; k < 100_000; k++) {
      const v = surface(r() * 3000, r() * 2000, flowZ(r() * 4000, 1));
      expect(v).toBeGreaterThanOrEqual(0);
      if (v > max) max = v;
    }
    expect(max).toBeLessThanOrEqual(0.703125 + 1e-12);
    expect(max + 0.12).toBeLessThan(0.9);
  });

  it('defaults to the Blueprint shape', () => {
    expect(BLUEPRINT_SHAPE).toEqual({ warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 });
    const z = flowZ(12, 1);
    expect(surface(333, 444, z)).toBe(surface(333, 444, z, BLUEPRINT_SHAPE));
  });
});

describe('Bayer tiers (3.3.10)', () => {
  it('BAYER8 is the Blueprint matrix and a permutation of 0..63', () => {
    expect([...BAYER8]).toEqual(BLUEPRINT_BAYER8);
    expect([...BAYER8].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i));
  });

  it('bayerThreshold spans [1/128, 127/128] and repeats every 8 cells', () => {
    const all: number[] = [];
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) all.push(bayerThreshold(i, j));
    expect(Math.min(...all)).toBe(1 / 128);
    expect(Math.max(...all)).toBe(127 / 128);
    expect(bayerThreshold(3 + 8, 5 + 16)).toBe(bayerThreshold(3, 5));
  });

  it('tierOf uses strict > at the Bayer threshold, 0.66 and 0.9', () => {
    // cell (0, 0) has B = 0, threshold 1/128
    expect(tierOf(1 / 128, 0, 0)).toBe(0);
    expect(tierOf(1 / 128 + 1e-9, 0, 0)).toBe(1);
    expect(tierOf(0.66, 0, 0)).toBe(1);
    expect(tierOf(0.66 + 1e-9, 0, 0)).toBe(2);
    expect(tierOf(0.9, 0, 0)).toBe(2);
    expect(tierOf(0.9 + 1e-9, 0, 0)).toBe(3);
    // cell (7, 7) has B = 21: threshold 21.5 / 64
    expect(tierOf(0.3, 7, 7)).toBe(0);
    expect(tierOf(0.34, 7, 7)).toBe(1);
    expect(tierOf(0.7, 0, 0, 0.75, 0.95)).toBe(1);
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

describe('tierGrid (3.3.10, 4.10.3)', () => {
  it('is row-major with row 0 at the top and matches tierOf(surface) per cell', () => {
    const cols = 7;
    const rows = 4;
    const g = tierGrid(cols, rows, 6, 12, 1);
    const z = flowZ(12, 1);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        expect(g[j * cols + i]).toBe(tierOf(surface((i + 0.5) * 6, (j + 0.5) * 6, z), i, j));
      }
    }
  });

  it('is deterministic: golden FNV-1a checksum of the 200 x 105 OG grid (cell 6) at t = 12', () => {
    const a = tierGrid(200, 105, 6, 12, 1);
    expect(a).toEqual(tierGrid(200, 105, 6, 12, 1));
    expect(a).toHaveLength(21_000);
    expect(fnv1a(a)).toBe(0xa3198d09);
  });

  it('covers 1440 x 900 at cell 5 (288 x 180), t = 12, inside the 3.3.10 bands', () => {
    const [off, f1, f2, f3] = coverage(tierGrid(288, 180, 5, 12, 1));
    expect(off).toBeGreaterThanOrEqual(50);
    expect(off).toBeLessThanOrEqual(70);
    expect(f1).toBeGreaterThanOrEqual(20);
    expect(f1).toBeLessThanOrEqual(35);
    expect(f2).toBeGreaterThanOrEqual(2);
    expect(f2).toBeLessThanOrEqual(20);
    expect(f3).toBe(0);
  });

  it('shows field-3 only with a ring', () => {
    const ring: Ring = { x: 720, y: 450, radius: 162, amp: 0.975, sigma: 48, gain: 0.9 };
    expect(coverage(tierGrid(288, 180, 5, 12, 1, [ring]))[3]).toBeGreaterThan(0);
  });
});

describe('surface.ts stays importable by Node type stripping (4.10.2)', () => {
  const src = readFileSync('src/field/surface.ts', 'utf8').replace(/\r\n/g, '\n');

  it('has no import statement and no non-erasable TypeScript', () => {
    expect(src).not.toMatch(/^\s*import[\s{*'"]/m);
    expect(src).not.toMatch(/^\s*export\s+[^\n]*\bfrom\s+['"]/m);
    expect(src).not.toMatch(/\benum\s|\bnamespace\s/);
  });

  it('loads in plain Node and builds a 4 x 2 grid', () => {
    const run = spawnSync(
      process.execPath,
      ['-e', "import('./src/field/surface.ts').then(m => console.log(m.tierGrid(4, 2, 6, 12, 1).length))"],
      { encoding: 'utf8' },
    );
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).toBe('8');
  });
});
