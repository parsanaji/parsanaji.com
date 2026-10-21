import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import { DEFAULT_FIELD } from '../src/field/params';
import { UNIFORMS_PASS1, UNIFORMS_PASS2 } from '../src/field/renderer';
import { NOISE_OFFSET, hash3 } from '../src/field/surface';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const VERT = read('../src/shaders/fullscreen.vert');
const NOISE = read('../src/shaders/noise.glsl');
const SURFACE = read('../src/shaders/surface.frag');
const DASH_VERT = read('../src/shaders/dash.vert');
const DASH_FRAG = read('../src/shaders/dash.frag');
const ALL = { 'fullscreen.vert': VERT, 'noise.glsl': NOISE, 'surface.frag': SURFACE, 'dash.vert': DASH_VERT, 'dash.frag': DASH_FRAG };
const MARKER = '/* noise.glsl inserted here */';

/** Uniform names in declaration order: `uniform <type> <name>[N];` */
const uniformsOf = (src: string): string[] => [...src.matchAll(/^uniform\s+\w+\s+(\w+)(?:\[\d+\])?\s*;/gm)].map((m) => m[1]);

describe('noise.glsl matches src/field/surface.ts (spec 3.3.5, Appendix A §3.4)', () => {
  it('uses the Blueprint hash constants, shifts and the 8-bit z mask', () => {
    for (const c of ['374761393u', '668265263u', '1013904223u', '1274126177u', 'h >> 13u', 'h >> 16u', 'c.z & 255u']) expect(NOISE).toContain(c);
  });

  it('the GLSL hash, evaluated with 32-bit unsigned arithmetic, is bit-exact with hash3 on 1000 seeded triples', () => {
    const body = /float hash3\(uvec3 c\) \{([\s\S]*?)\n\}/.exec(NOISE)?.[1] ?? '';
    const [kx, ky, kz, kh] = [...body.matchAll(/(\d+)u/g)].map((m) => Number(m[1])).filter((n) => n > 255);
    const [s1, s2] = [...body.matchAll(/>> (\d+)u/g)].map((m) => Number(m[1]));
    const mask = Number(/c\.z & (\d+)u/.exec(body)?.[1]);
    const glslHash = (x: number, y: number, z: number): number => {
      let h = (Math.imul(x, kx) ^ Math.imul(y, ky) ^ Math.imul(z & mask, kz)) >>> 0;
      h = Math.imul(h ^ (h >>> s1), kh) >>> 0;
      h = (h ^ (h >>> s2)) >>> 0;
      return h / 4294967296;
    };
    const rand = mulberry32(20261019);
    for (let n = 0; n < 1000; n++) {
      const x = Math.floor(rand() * 70000);
      const y = Math.floor(rand() * 70000);
      const z = Math.floor(rand() * 1000);
      expect(glslHash(x, y, z)).toBe(hash3(x, y, z));
    }
  });

  it('OFFSET = 256.0 equals NOISE_OFFSET', () => {
    expect(Number(/const float OFFSET = ([\d.]+);/.exec(NOISE)?.[1])).toBe(NOISE_OFFSET);
  });

  it('defines hash3, noise3 and fbm and declares no uniforms', () => {
    for (const fn of ['float hash3(uvec3 c)', 'float noise3(vec3 p)', 'float fbm(vec2 p, vec2 z)']) expect(NOISE).toContain(fn);
    expect(uniformsOf(NOISE)).toEqual([]);
  });
});

describe('dash.vert (spec 12.14, pass 2)', () => {
  it('declares exactly UNIFORMS_PASS2', () => {
    expect(uniformsOf(DASH_VERT)).toEqual([...UNIFORMS_PASS2]);
  });

  it('has exactly one noise.glsl insertion marker (the drift and angle noise run per instance)', () => {
    expect(DASH_VERT.split(MARKER)).toHaveLength(2);
  });

  it('builds the quad from gl_VertexID and the cell from gl_InstanceID, with no vertex attributes', () => {
    expect(DASH_VERT).toContain('gl_InstanceID');
    expect(DASH_VERT).toContain('gl_VertexID');
    expect(DASH_VERT).not.toMatch(/^\s*(layout\([^)]*\)\s*)?in\s+\w+\s+\w+\s*;/m);
  });

  it('writes the Blueprint stroke geometry: half-length sp (lenMin + lenK v), width floored at 1 CSS px', () => {
    expect(DASH_VERT).toContain('float halfLen = uCell * (uDash.x + uDash.y * v);');
    expect(DASH_VERT).toContain('float halfW = max(1.0, uCell * uDash.z) * 0.5;');
    expect(DASH_VERT).toContain('vColor = vec4(ink, uAlpha.x + (1.0 - uAlpha.x) * v);');
  });
});

describe('dash.frag (spec 12.14, pass 2)', () => {
  it('declares no uniforms and reads every varying dash.vert writes', () => {
    expect(uniformsOf(DASH_FRAG)).toEqual([]);
    const outs = [...DASH_VERT.matchAll(/^out\s+(\w+)\s+(\w+);/gm)];
    expect(outs.length).toBeGreaterThan(0);
    for (const [, type, name] of outs) expect(DASH_FRAG).toContain(`in ${type} ${name};`);
  });

  it('emits premultiplied alpha for the ONE / ONE_MINUS_SRC_ALPHA blend', () => {
    expect(DASH_FRAG).toContain('outColor = vec4(vColor.rgb * a, a);');
  });
});

describe('surface.frag (spec 3.3.4, 3.4.5, Appendix A §3.5)', () => {
  it('declares exactly UNIFORMS_PASS1', () => {
    expect(uniformsOf(SURFACE)).toEqual([...UNIFORMS_PASS1]);
  });

  it('has exactly one noise.glsl insertion marker', () => {
    expect(SURFACE.split(MARKER)).toHaveLength(2);
  });

  it('takes uLevel as (level, gain, dither-curve mix) and mixes the curve by uLevel.z (12.14)', () => {
    expect(SURFACE).toContain('uniform vec3  uLevel;');
    expect(SURFACE).toContain('v = clamp((v - uLevel.x) * uLevel.y, 0.0, 1.0);');
    expect(SURFACE).toContain('return v + (shaped - v) * uLevel.z;');
  });

  it('every smoothstep has ascending edges (theta - w, theta + w with w = mask.edge > 0)', () => {
    const all = [...SURFACE.matchAll(/smoothstep\(/g)].length;
    const ascending = [...SURFACE.matchAll(/smoothstep\(\s*(\w+)\s*-\s*(\w+)\s*,\s*\1\s*\+\s*\2\s*,/g)];
    expect(all).toBeGreaterThan(0);
    expect(ascending).toHaveLength(all);
    expect(SURFACE).toContain('float w = uMaskMix.z;');
    expect(DEFAULT_FIELD.mask.edge).toBeGreaterThan(0);
  });
});

describe('all five shader files (spec 4.5.8)', () => {
  it.each(Object.entries(ALL))('%s has no #version line (program.ts prepends the header) and no pow()', (_name, src) => {
    expect(src).not.toContain('#version');
    expect(src).not.toMatch(/\bpow\s*\(/);
  });

  it('the fullscreen vertex shader reads attribute 0 as aPos', () => {
    expect(VERT).toContain('layout(location = 0) in vec2 aPos;');
  });

  it('src/shaders/dither.frag is gone (12.14 replaced the Bayer pass)', () => {
    expect(() => read('../src/shaders/dither.frag')).toThrow();
  });
});
