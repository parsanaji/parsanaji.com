### Task 12: Shaders and `ParticleField`

All motion lives in the vertex shader; the TypeScript class only owns the Three.js objects and uniform setters. No unit test (needs WebGL); typecheck + build here, visual proof in Task 14.

**Files:**
- Create: `src/shaders/noise.glsl`, `src/shaders/field.vert`, `src/shaders/field.frag`, `src/engine/ParticleField.ts`

**Interfaces:**
- Consumes: `Params`, `PhaseId`, `PointerSlot`, `RippleState` (Task 10).
- Produces: `class ParticleField { constructor(canvas, params, dpr); size; setViewport(w, h); setDpr(dpr); setTargets(home, alt, rand, p); setMorph(phase, tMs, durMs, staggerMs); setTime(ms); setBreath(scale); setReduced(bool); setRepelRadius(px); setRipple(state); setPointer(slots); applyParams(params); render(); dispose() }`.
- Shader contract: attributes `position` (home, vec3), `aAlt` (vec2), `aSeed`, `aSize`, `aAlpha`; uniforms listed in `field.vert`; phase ids match `PHASE` in `types.ts`.

- [ ] **Step 1: Write `src/shaders/noise.glsl`** (Ashima Arts simplex noise, MIT — keep the header)

```glsl
// Simplex 3D noise. Ian McEwan, Ashima Arts. MIT License. https://github.com/ashima/webgl-noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
```

- [ ] **Step 2: Write `src/shaders/field.vert`** (GLSL3; Three.js declares `position`, `projectionMatrix`, `modelViewMatrix` and the precision for us. `noise.glsl` is prepended at runtime.)

```glsl
in vec2 aAlt;
in float aSeed;
in float aSize;
in float aAlpha;

uniform float uTime;         // ms, vibration clock
uniform int   uPhase;        // 0 ENTRY 1 IDLE 2 SCRAMBLE_OUT 3 FORM_ALT 4 HOLD_ALT 5 SCRAMBLE_BACK 6 FORM_NAME
uniform float uT;            // ms elapsed in the current phase
uniform float uDur;          // ms base duration of the current phase
uniform float uStagger;      // ms of per-dot stagger in the current phase
uniform vec2  uScatter;      // morph scatter radius min/max (px)
uniform vec2  uEntryScatter; // entry scatter radius min/max (px)
uniform float uHalfWidth;    // viewport half width (px)
uniform float uDpr;
uniform float uDotSize;      // CSS px
uniform float uNearScale;
uniform float uAlphaScale;
uniform float uVibAmp;       // px
uniform float uVibFreq;      // Hz
uniform float uVibScale;     // 1/px
uniform float uBreath;       // scale about the origin
uniform vec4  uPointer[8];   // x, y, strength, velocity factor
uniform float uRepelRadius;  // px
uniform float uRepelStrength;
uniform float uRepelClamp;   // fraction of the radius
uniform vec4  uRipple;       // ox, oy, radius, amplitude (0 = off)
uniform float uRippleBand;   // px
uniform float uReduced;      // 1 under prefers-reduced-motion

out float vAlpha;
out float vNear;

float easeOutExpo(float t) { return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }
float easeInCubic(float t) { return t * t * t; }

vec2 scatterDir(vec2 p, float seed) {
  float a = snoise(vec3(p * 0.004, seed * 7.0)) * 6.2831853;
  return vec2(cos(a), sin(a));
}

void main() {
  vec2 home = position.xy;
  vec2 alt = aAlt;
  vec2 dir = scatterDir(home, aSeed);
  float r = mix(uScatter.x, uScatter.y, fract(aSeed * 13.37));
  float rEntry = mix(uEntryScatter.x, uEntryScatter.y, fract(aSeed * 7.77));
  float alpha = aAlpha * uAlphaScale;
  bool reduced = uReduced > 0.5;

  float delayFac = aSeed;
  if (uPhase == 0) delayFac = mix(aSeed, abs(home.x) / max(uHalfWidth, 1.0), 0.6);
  float local = clamp((uT - delayFac * uStagger) / max(uDur, 1.0), 0.0, 1.0);

  vec2 pos = home;
  if (uPhase == 0) {
    pos = reduced ? home : mix(home + dir * rEntry, home, easeOutExpo(local));
  } else if (uPhase == 2) {
    if (reduced) { pos = home; alpha *= 1.0 - local; }
    else pos = mix(home, home + dir * r, easeInCubic(local));
  } else if (uPhase == 3) {
    if (reduced) { pos = alt; alpha *= local; }
    else pos = mix(home + dir * r, alt, easeOutExpo(local));
  } else if (uPhase == 4) {
    pos = alt;
  } else if (uPhase == 5) {
    if (reduced) { pos = alt; alpha *= 1.0 - local; }
    else pos = mix(alt, alt + dir * r, easeInCubic(local));
  } else if (uPhase == 6) {
    if (reduced) { pos = home; alpha *= local; }
    else pos = mix(alt + dir * r, home, easeOutExpo(local));
  }

  // idle life: noise vibration (never per-frame randomness) and breath
  float tt = uTime * 0.001 * uVibFreq;
  vec2 vib = vec2(
    snoise(vec3(home * uVibScale, aSeed * 10.0 + tt)),
    snoise(vec3(home * uVibScale + 31.7, aSeed * 10.0 + 17.0 + tt))
  ) * uVibAmp;
  pos = (pos + vib) * uBreath;

  // ripple: a radial band travelling outward from its origin
  if (uRipple.w > 0.0) {
    vec2 dv = pos - uRipple.xy;
    float d = length(dv);
    float k = (d - uRipple.z) / uRippleBand; // pow() with a negative base is undefined in GLSL
    float band = exp(-k * k);
    pos += (dv / max(d, 0.001)) * band * uRipple.w;
  }

  // pointer repel: the live pointer plus a decaying trail, stateless
  vec2 push = vec2(0.0);
  float near = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 P = uPointer[i];
    if (P.z <= 0.0) continue;
    vec2 dv = pos - P.xy;
    float d = length(dv);
    if (d >= uRepelRadius) continue;
    float f = 1.0 - smoothstep(0.0, 1.0, d / uRepelRadius); // GLSL leaves smoothstep undefined when edge0 >= edge1
    f *= f;
    push += (dv / max(d, 0.001)) * (uRepelRadius * uRepelStrength * f * P.z * (1.0 + P.w));
    near = max(near, f * P.z);
  }
  float pl = length(push);
  float maxPush = uRepelRadius * uRepelClamp;
  if (pl > maxPush) push *= maxPush / pl;
  pos += push;

  vNear = near;
  vAlpha = mix(alpha, 1.0, near);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
  gl_PointSize = uDotSize * uDpr * aSize * mix(1.0, uNearScale, near);
}
```

- [ ] **Step 3: Write `src/shaders/field.frag`** (GLSL3: the shader declares its own `out vec4`; three 0.186 defines `pc_fragColor` / `gl_FragColor` only for non-GLSL3 ShaderMaterials)

```glsl
in float vAlpha;
in float vNear;

out vec4 fragColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  // = smoothstep(0.5, 0.35, d) from spec 3.2, written with ascending edges (reversed edges are undefined in GLSL)
  float a = (1.0 - smoothstep(0.35, 0.5, d)) * vAlpha;
  if (a <= 0.002) discard;
  vec3 col = mix(vec3(0.961), vec3(1.0), vNear); // #f5f5f5, brighter near the pointer
  fragColor = vec4(col, a);
}
```

- [ ] **Step 4: Write `src/engine/ParticleField.ts`**

```ts
import * as THREE from 'three';
import fragGlsl from '../shaders/field.frag?raw';
import vertGlsl from '../shaders/field.vert?raw';
import noiseGlsl from '../shaders/noise.glsl?raw';
import type { Params, PhaseId, PointerSlot, RippleState } from './types';

const SLOT_COUNT = 8;

/** One Three.js Points object; every motion rule runs in the vertex shader. */
export class ParticleField {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  private readonly material: THREE.ShaderMaterial;
  private readonly points: THREE.Points;
  private geometry = new THREE.BufferGeometry();
  private count = 0;

  constructor(canvas: HTMLCanvasElement, params: Params, dpr: number) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: `${noiseGlsl}\n${vertGlsl}`,
      fragmentShader: fragGlsl,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: params.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uPhase: { value: 0 },
        uT: { value: 0 },
        uDur: { value: 1 },
        uStagger: { value: 0 },
        uScatter: { value: new THREE.Vector2(params.scatterMin, params.scatterMax) },
        uEntryScatter: { value: new THREE.Vector2(params.entryScatterMin, params.entryScatterMax) },
        uHalfWidth: { value: 1 },
        uDpr: { value: dpr },
        uDotSize: { value: params.dotSize },
        uNearScale: { value: params.nearScale },
        uAlphaScale: { value: params.alphaScale },
        uVibAmp: { value: params.vibAmp },
        uVibFreq: { value: params.vibFreq },
        uVibScale: { value: params.vibScale },
        uBreath: { value: 1 },
        uPointer: { value: Array.from({ length: SLOT_COUNT }, () => new THREE.Vector4(0, 0, 0, 0)) },
        uRepelRadius: { value: params.repelRadius },
        uRepelStrength: { value: params.repelStrength },
        uRepelClamp: { value: params.repelClampFrac },
        uRipple: { value: new THREE.Vector4(0, 0, 0, 0) },
        uRippleBand: { value: params.ripple.bandPx },
        uReduced: { value: 0 },
      },
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  get size(): number {
    return this.count;
  }

  /** 1 world unit = 1 CSS px, origin at the centre, y up (spec 3.4). */
  setViewport(w: number, h: number): void {
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.material.uniforms.uHalfWidth.value = w / 2;
  }

  setDpr(dpr: number): void {
    this.renderer.setPixelRatio(dpr);
    this.material.uniforms.uDpr.value = dpr;
  }

  /** Upload a home/alt pair (interleaved x, y, equal lengths). Rebuilds the geometry. */
  setTargets(
    home: Float32Array,
    alt: Float32Array,
    rand: () => number,
    p: Pick<Params, 'sizeVarMin' | 'sizeVarMax' | 'alphaMin' | 'alphaMax'>,
  ): void {
    if (alt.length !== home.length) throw new Error(`target length mismatch: home ${home.length} alt ${alt.length}`);
    const n = home.length / 2;
    const position = new Float32Array(n * 3);
    const aAlt = new Float32Array(n * 2);
    const aSeed = new Float32Array(n);
    const aSize = new Float32Array(n);
    const aAlpha = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      position[i * 3] = home[i * 2];
      position[i * 3 + 1] = home[i * 2 + 1];
      position[i * 3 + 2] = 0;
      aAlt[i * 2] = alt[i * 2];
      aAlt[i * 2 + 1] = alt[i * 2 + 1];
      aSeed[i] = rand();
      aSize[i] = p.sizeVarMin + (p.sizeVarMax - p.sizeVarMin) * rand();
      aAlpha[i] = p.alphaMin + (p.alphaMax - p.alphaMin) * rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('aAlt', new THREE.BufferAttribute(aAlt, 2));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1));
    this.points.geometry = geometry;
    this.geometry.dispose();
    this.geometry = geometry;
    this.count = n;
  }

  setMorph(phase: PhaseId, tMs: number, durMs: number, staggerMs: number): void {
    const u = this.material.uniforms;
    u.uPhase.value = phase;
    u.uT.value = tMs;
    u.uDur.value = Math.max(1, durMs);
    u.uStagger.value = staggerMs;
  }

  setTime(ms: number): void {
    this.material.uniforms.uTime.value = ms;
  }

  setBreath(scale: number): void {
    this.material.uniforms.uBreath.value = scale;
  }

  setReduced(reduced: boolean): void {
    this.material.uniforms.uReduced.value = reduced ? 1 : 0;
  }

  setRepelRadius(px: number): void {
    this.material.uniforms.uRepelRadius.value = px;
  }

  setRipple(state: RippleState): void {
    (this.material.uniforms.uRipple.value as THREE.Vector4).set(state.ox, state.oy, state.radius, state.active ? state.amplitude : 0);
    this.material.uniforms.uRippleBand.value = Math.max(1, state.band);
  }

  setPointer(slots: PointerSlot[]): void {
    const arr = this.material.uniforms.uPointer.value as THREE.Vector4[];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = slots[i];
      if (s) arr[i].set(s.x, s.y, s.strength, s.vel);
      else arr[i].set(0, 0, 0, 0);
    }
  }

  /** Push every tunable except counts/targets (those go through setTargets). */
  applyParams(p: Params): void {
    const u = this.material.uniforms;
    u.uDotSize.value = p.dotSize;
    u.uNearScale.value = p.nearScale;
    u.uAlphaScale.value = p.alphaScale;
    u.uVibAmp.value = p.vibAmp;
    u.uVibFreq.value = p.vibFreq;
    u.uVibScale.value = p.vibScale;
    (u.uScatter.value as THREE.Vector2).set(p.scatterMin, p.scatterMax);
    (u.uEntryScatter.value as THREE.Vector2).set(p.entryScatterMin, p.entryScatterMax);
    u.uRepelRadius.value = p.repelRadius;
    u.uRepelStrength.value = p.repelStrength;
    u.uRepelClamp.value = p.repelClampFrac;
    u.uRippleBand.value = p.ripple.bandPx;
    const blending = p.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (this.material.blending !== blending) {
      this.material.blending = blending;
      this.material.needsUpdate = true;
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
```

- [ ] **Step 5: Typecheck and build**

Run: `npm run typecheck && npx vite build`
Expected: `tsc` silent (the `?raw` imports resolve through `vite/client` types); the build succeeds. `three` is not yet imported by `main.ts`, so the chunk is still small; that changes in Task 14.

- [ ] **Step 5b: Prove the shaders compile and draw in a real browser** (nothing is committed from this step)

Start `npm run dev` in the background, open `http://localhost:5173/` in a fresh DevTools MCP page, and run with `evaluate_script` (Vite serves source modules by path in dev):

```js
async () => {
  const { ParticleField } = await import('/src/engine/ParticleField.ts');
  const { DEFAULTS } = await import('/src/engine/defaults.ts');
  const { mulberry32 } = await import('/src/engine/prng.ts');
  const run = (phase, t, dur, stagger, reduced) => {
    const errors = [];
    const canvas = document.createElement('canvas');
    const field = new ParticleField(canvas, DEFAULTS, 1);
    field.renderer.debug.onShaderError = (gl, program, vs, fs) =>
      errors.push([gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs), gl.getProgramInfoLog(program)].filter(Boolean).join(' | ') || 'shader error');
    field.setViewport(400, 200);
    const n = 2000;
    const rand = mulberry32(1);
    const home = new Float32Array(n * 2);
    const alt = new Float32Array(n * 2);
    for (let i = 0; i < n * 2; i++) {
      home[i] = (rand() - 0.5) * (i % 2 ? 180 : 360);
      alt[i] = (rand() - 0.5) * 100;
    }
    field.setTargets(home, alt, rand, DEFAULTS);
    field.setReduced(reduced);
    field.setMorph(phase, t, dur, stagger);
    field.setPointer([{ x: 0, y: 0, strength: 1, vel: 0.5 }]);
    field.setRipple({ active: true, ox: 0, oy: 0, radius: 60, amplitude: 3, band: 60 });
    field.render();
    const gl = field.renderer.getContext();
    const px = new Uint8Array(400 * 200 * 4);
    gl.readPixels(0, 0, 400, 200, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let lit = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] > 0) lit++;
    const out = { phase, reduced, errors, calls: field.renderer.info.render.calls, lit, glError: gl.getError() };
    field.dispose();
    return out;
  };
  return [run(1, 0, 1, 0, false), run(3, 450, 900, 250, false), run(3, 450, 900, 250, true)];
}
```

Expected for all three runs: `errors` empty, `calls` 1, `glError` 0, `lit` > 1000 for the idle run and > 0 for the other two; `list_console_messages` shows no shader errors or warnings. Paste the returned JSON into the report, then stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/shaders src/engine/ParticleField.ts
git commit -m "feat(engine): GLSL3 particle shaders and ParticleField renderer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Breath and ripple scheduler

**Files:**
- Create: `src/engine/motion.ts`
- Test: `tests/motion.test.ts`

**Interfaces:**
- Consumes: `RippleParams`, `RippleState`, `RIPPLE_OFF` (Task 10).
- Produces: `breathScale(tMs, amp, periodMs): number`; `class RippleScheduler { constructor(params, rand); setParams(p); tick(dtMs, pickOrigin: () => readonly [number, number]): RippleState }`.

- [ ] **Step 1: Write the failing tests** (`tests/motion.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { RippleScheduler, breathScale } from '../src/engine/motion';

describe('breathScale', () => {
  it('oscillates ±amp around 1 with the given period', () => {
    expect(breathScale(0, 0.01, 6000)).toBeCloseTo(1, 9);
    expect(breathScale(1500, 0.01, 6000)).toBeCloseTo(1.01, 9);
    expect(breathScale(3000, 0.01, 6000)).toBeCloseTo(1, 9);
    expect(breathScale(4500, 0.01, 6000)).toBeCloseTo(0.99, 9);
  });

  it('is exactly 1 when disabled', () => {
    expect(breathScale(1234, 0, 6000)).toBe(1);
    expect(breathScale(1234, 0.01, 0)).toBe(1);
  });
});

describe('RippleScheduler', () => {
  const params = { intervalMs: 10_000, jitterMs: 2000, speedPxPerS: 1200, amplitudePx: 3, durationMs: 400, bandPx: 60 };
  const midRand = () => 0.5; // zero jitter

  it('fires at interval ± jitter and picks an origin once per ripple', () => {
    let picks = 0;
    const origin = () => {
      picks += 1;
      return [10, -20] as const;
    };
    const s = new RippleScheduler(params, midRand);
    expect(s.tick(9999, origin).active).toBe(false);
    const first = s.tick(1, origin);
    expect(first.active).toBe(true);
    expect([first.ox, first.oy]).toEqual([10, -20]);
    expect(first.radius).toBe(0);
    expect(picks).toBe(1);
    s.tick(200, origin);
    expect(picks).toBe(1);
  });

  it('grows the radius at the configured speed and peaks mid-duration', () => {
    const s = new RippleScheduler(params, midRand);
    s.tick(10_000, () => [0, 0] as const);
    const mid = s.tick(200, () => [0, 0] as const);
    expect(mid.radius).toBeCloseTo(240, 6);
    expect(mid.amplitude).toBeCloseTo(3, 6);
    expect(mid.band).toBe(60);
    const late = s.tick(199, () => [0, 0] as const);
    expect(late.amplitude).toBeLessThan(0.1);
  });

  it('ends after the duration and reschedules', () => {
    const s = new RippleScheduler(params, midRand);
    s.tick(10_000, () => [0, 0] as const);
    expect(s.tick(401, () => [0, 0] as const).active).toBe(false);
    expect(s.tick(9998, () => [0, 0] as const).active).toBe(false);
    expect(s.tick(2, () => [0, 0] as const).active).toBe(true);
  });

  it('honours jitter from the PRNG', () => {
    const early = new RippleScheduler(params, () => 0); // interval - jitter = 8000
    expect(early.tick(7999, () => [0, 0] as const).active).toBe(false);
    expect(early.tick(1, () => [0, 0] as const).active).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure, then write `src/engine/motion.ts`**

Run: `npx vitest run tests/motion.test.ts` → FAIL. Then:

```ts
import { RIPPLE_OFF, type RippleParams, type RippleState } from './types';

/** Spec 3.5: the whole field scales by 1 ± amp on a sine with the given period. */
export function breathScale(tMs: number, amp: number, periodMs: number): number {
  if (amp === 0 || periodMs <= 0) return 1;
  return 1 + amp * Math.sin((2 * Math.PI * tMs) / periodMs);
}

/** One ripple at a time, every interval ± jitter, Gaussian amplitude envelope (spec 3.5). */
export class RippleScheduler {
  private clock = 0;
  private nextAt: number;
  private startedAt = -1;
  private ox = 0;
  private oy = 0;

  constructor(
    private params: RippleParams,
    private readonly rand: () => number,
  ) {
    this.nextAt = this.schedule();
  }

  setParams(p: RippleParams): void {
    this.params = p;
  }

  private schedule(): number {
    return this.clock + this.params.intervalMs + (this.rand() * 2 - 1) * this.params.jitterMs;
  }

  tick(dtMs: number, pickOrigin: () => readonly [number, number]): RippleState {
    this.clock += dtMs;
    const p = this.params;
    if (this.startedAt < 0 && this.clock >= this.nextAt) {
      const [x, y] = pickOrigin();
      this.ox = x;
      this.oy = y;
      this.startedAt = this.clock;
    }
    if (this.startedAt < 0) return RIPPLE_OFF;
    const age = this.clock - this.startedAt;
    if (age > p.durationMs) {
      this.startedAt = -1;
      this.nextAt = this.schedule();
      return RIPPLE_OFF;
    }
    const sigma = p.durationMs / 4;
    const envelope = Math.exp(-(((age - p.durationMs / 2) / sigma) ** 2));
    return {
      active: true,
      ox: this.ox,
      oy: this.oy,
      radius: (p.speedPxPerS * age) / 1000,
      amplitude: p.amplitudePx * envelope,
      band: p.bandPx,
    };
  }
}
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run tests/motion.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/engine/motion.ts tests/motion.test.ts
git commit -m "feat(engine): breath scale and ripple scheduler

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Boot probes, `App`, and the live entry animation (effort: xhigh)

After this task the real page shows the name forming from scattered dots, vibrating, breathing, with ripples. Pointer and morph come in slices 3 and 4.

**Files:**
- Create: `src/boot/fonts.ts`, `src/boot/webgl.ts`, `src/app.ts`
- Modify: `src/main.ts` (full rewrite)
- Test: `tests/fonts.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 9–13; `CONTENT`, `startClock`, `initExitLine` (Task 3).
- Produces: `waitForFont(spec, timeoutMs, fonts?, schedule?) → Promise<'loaded' | 'timeout' | 'unavailable'>`; `hasWebGL2(createCanvas?)`; `class App { constructor({ canvas, params, reduced, seed }); field; params; reduced; start(); stop(); layout(); count; setCount(n); applyParams(); requestCycle(): boolean /* stub until Task 20 */ }`.

- [ ] **Step 1: Write the failing font test** (`tests/fonts.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { waitForFont } from '../src/boot/fonts';

const manualTimer = () => {
  const queue: (() => void)[] = [];
  return { schedule: (fn: () => void) => void queue.push(fn), fire: () => queue.splice(0).forEach((fn) => fn()) };
};

describe('waitForFont', () => {
  it('resolves loaded when the font set settles first', async () => {
    const t = manualTimer();
    const result = await waitForFont('900 10px "Geist Sans"', 2000, { load: () => Promise.resolve([]) }, t.schedule);
    expect(result).toBe('loaded');
  });

  it('resolves timeout when the font never loads', async () => {
    const t = manualTimer();
    const pending = waitForFont('900 10px "Geist Sans"', 2000, { load: () => new Promise(() => {}) }, t.schedule);
    t.fire();
    expect(await pending).toBe('timeout');
  });

  it('treats a rejected load as a timeout, not an exception', async () => {
    const t = manualTimer();
    expect(await waitForFont('900 10px "Geist Sans"', 2000, { load: () => Promise.reject(new Error('nope')) }, t.schedule)).toBe('timeout');
  });

  it('reports unavailable without a FontFaceSet', async () => {
    expect(await waitForFont('900 10px "Geist Sans"', 2000, undefined, () => {})).toBe('unavailable');
  });
});
```

- [ ] **Step 2: Run to verify failure, then write the boot probes**

Run: `npx vitest run tests/fonts.test.ts` → FAIL.

`src/boot/fonts.ts`:
```ts
export interface FontFaceSetLike {
  load(font: string): Promise<unknown>;
}

export type FontWaitResult = 'loaded' | 'timeout' | 'unavailable';

/** Resolves when the font is usable or after `timeoutMs`, whichever comes first. Never rejects (spec 3.8). */
export function waitForFont(
  spec: string,
  timeoutMs: number,
  fonts: FontFaceSetLike | undefined = typeof document !== 'undefined' ? document.fonts : undefined,
  schedule: (fn: () => void, ms: number) => unknown = (fn, ms) => setTimeout(fn, ms),
): Promise<FontWaitResult> {
  if (!fonts) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: FontWaitResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    schedule(() => finish('timeout'), timeoutMs);
    fonts.load(spec).then(
      () => finish('loaded'),
      () => finish('timeout'),
    );
  });
}
```

`src/boot/webgl.ts`:
```ts
/** three r163+ needs WebGL2. Probe on a scratch canvas so the real one stays untouched. */
export function hasWebGL2(createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')): boolean {
  try {
    return createCanvas().getContext('webgl2') !== null;
  } catch {
    return false;
  }
}
```

Run: `npx vitest run tests/fonts.test.ts` → 4 pass.

- [ ] **Step 3: Write `src/app.ts`**

```ts
import { CONTENT } from './content';
import { ParticleField } from './engine/ParticleField';
import { RippleScheduler, breathScale } from './engine/motion';
import { mulberry32 } from './engine/prng';
import { capDpr, dotCount } from './engine/quality';
import {
  makeMeasure,
  sampleText,
  subsampleToN,
  type Canvas2DLike,
  type CanvasFactory,
  type SampleResult,
} from './engine/sampler';
import { clampDt } from './engine/time';
import { PHASE, RIPPLE_OFF, type Params } from './engine/types';

export interface AppOptions {
  canvas: HTMLCanvasElement;
  params: Params;
  reduced: boolean;
  seed: number;
}

const createCanvas: CanvasFactory = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h) as unknown as Canvas2DLike;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c as unknown as Canvas2DLike;
};

/** Owns sampling, the GPU field and the frame loop. Pointer (Task 17) and morph (Task 20) plug in here. */
export class App {
  readonly field: ParticleField;
  readonly params: Params;
  readonly reduced: boolean;
  private readonly rand: () => number;
  private readonly ripple: RippleScheduler;
  private vw = 1;
  private vh = 1;
  private n = 0;
  private nameSample: SampleResult | null = null;
  private altSample: SampleResult | null = null;
  private running = false;
  private raf = 0;
  private lastMs = -1;
  private simMs = 0;
  private resizeTimer = 0;
  // [Task 20] replaced by MorphMachine
  private entryDone = false;

  constructor(opts: AppOptions) {
    this.params = opts.params;
    this.reduced = opts.reduced;
    this.rand = mulberry32(opts.seed);
    this.field = new ParticleField(opts.canvas, this.params, capDpr(window.devicePixelRatio));
    this.field.setReduced(this.reduced);
    this.ripple = new RippleScheduler(this.params.ripple, this.rand);
    this.applyParams();
  }

  start(): void {
    this.layout();
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** Re-sample both texts for the current viewport, recompute N, upload (spec 3.3, 3.7). */
  layout(): void {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.field.setViewport(this.vw, this.vh);
    const measure = makeMeasure(createCanvas(8, 8), this.params.raster);
    const layoutOpts = { ...this.params.layout, viewportW: this.vw, viewportH: this.vh };
    this.nameSample = sampleText(CONTENT.name, layoutOpts, this.params.raster, createCanvas, measure);
    this.altSample = sampleText(CONTENT.alt, layoutOpts, this.params.raster, createCanvas, measure);
    this.n = dotCount(this.nameSample.inkedAreaCssPx, this.vw, this.params.density, this.params.caps);
    this.upload();
  }

  get count(): number {
    return this.n;
  }

  /** Used by the degrade rule (Task 21) and the debug panel. Re-subsamples the cached candidates. */
  setCount(n: number): void {
    this.n = Math.max(1, Math.round(n));
    this.upload();
  }

  /** Push every tunable to the GPU and the schedulers (debug panel calls this on change). */
  applyParams(): void {
    this.field.applyParams(this.params);
    if (this.reduced) this.field.setRepelRadius(this.params.reducedRepelRadius);
    this.ripple.setParams(this.params.ripple);
  }

  /** [Task 20] real implementation; until then clicking does nothing. */
  requestCycle(): boolean {
    return false;
  }

  private upload(): void {
    if (!this.nameSample || !this.altSample) return;
    const home = subsampleToN(this.nameSample.candidates, this.n, this.rand);
    const alt = subsampleToN(this.altSample.candidates, this.n, this.rand);
    this.field.setTargets(home, alt, this.rand, this.params);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    if (this.lastMs < 0) this.lastMs = now;
    const dt = clampDt(now - this.lastMs);
    this.lastMs = now;
    this.simMs += dt;

    // [Task 20] replaced by MorphMachine
    const entryTotal = this.reduced ? 0 : this.params.morph.entryMs + this.params.morph.entryStaggerMs;
    if (!this.entryDone && this.simMs >= entryTotal) this.entryDone = true;
    this.field.setMorph(
      this.entryDone ? PHASE.IDLE : PHASE.ENTRY,
      this.simMs,
      this.params.morph.entryMs,
      this.params.morph.entryStaggerMs,
    );

    this.field.setTime(this.simMs);
    this.field.setBreath(this.reduced ? 1 : breathScale(this.simMs, this.params.breathAmp, this.params.breathPeriodMs));
    const ripple = this.reduced || !this.entryDone ? RIPPLE_OFF : this.ripple.tick(dt, this.pickGlyphCenter);
    this.field.setRipple(ripple);
    this.field.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private pickGlyphCenter = (): readonly [number, number] => {
    const c = this.nameSample?.glyphCenters;
    if (!c || c.length < 2) return [0, 0] as const;
    const i = Math.floor(this.rand() * (c.length / 2));
    return [c[i * 2], c[i * 2 + 1]] as const;
  };

  private onResize = (): void => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.layout(), 150);
  };

  private onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
      this.running = false;
      cancelAnimationFrame(this.raf);
      return;
    }
    if (!this.running) {
      this.running = true;
      this.lastMs = -1;
      this.raf = requestAnimationFrame(this.frame);
    }
  };
}
```

- [ ] **Step 4: Rewrite `src/main.ts`**

```ts
import { App } from './app';
import { waitForFont } from './boot/fonts';
import { hasWebGL2 } from './boot/webgl';
import { CONTENT } from './content';
import { DEFAULTS, cloneParams } from './engine/defaults';
import { seedFromLocation } from './engine/prng';
import { startClock } from './ui/clock';
import { initExitLine } from './ui/exitLine';

function showStatic(): void {
  document.documentElement.classList.add('no-webgl');
  const block = document.getElementById('static');
  if (block) block.hidden = false;
}

async function boot(): Promise<void> {
  initExitLine(CONTENT.links.linkedin);
  const timeEl = document.getElementById('clock-time');
  const zoneEl = document.getElementById('clock-zone');
  const clockEl = document.getElementById('clock');
  if (timeEl && zoneEl && clockEl) {
    startClock(timeEl, zoneEl, CONTENT.clock.timeZone);
    clockEl.hidden = false; // no JavaScript, no clock (spec 5)
  }

  const query = new URLSearchParams(location.search);
  const canvas = document.getElementById('field');
  if (!(canvas instanceof HTMLCanvasElement) || query.has('nowebgl') || !hasWebGL2()) {
    showStatic();
    return;
  }

  const params = cloneParams(DEFAULTS);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // [Task 15] debug panel loads here, before sampling, so saved tweaks affect N
  await waitForFont(`${params.raster.fontWeight} 10px "${params.raster.fontFamily}"`, 2000);
  const app = new App({ canvas, params, reduced, seed: seedFromLocation(location.search) });
  app.start();
}

boot().catch((error: unknown) => {
  console.error(error);
  showStatic();
});
```

- [ ] **Step 5: Typecheck, test, run the dev server**

Run: `npm run typecheck && npm test && npm run dev`
Expected: `tsc` silent, all tests green, dev server on `http://localhost:5173`.

Browser verification (Chrome DevTools MCP):
1. `navigate_page` to `http://localhost:5173/?seed=7`; `take_screenshot` immediately and again after 2.5 s. First: dots scattered in a cloud; second: `PARSA NAJI` crisp, centred, letters resolved from the centre outward.
2. `list_console_messages`: nothing at warning or error level (a WebGL shader compile error prints here; fix the shader before anything else).
3. `evaluate_script` with a 1 s `requestAnimationFrame` counter → ≥ 55 fps on this PC.
4. Watch 12 s: visible vibration, a slow breath, at least one ripple passing through the letters.
5. `resize_page` to 390×844: name stacks on two lines, still centred. Back to 1440×900: single line.
6. `emulate` with `prefers-reduced-motion: reduce` and reload: name appears instantly, no vibration, no ripple.
7. `http://localhost:5173/?nowebgl` → static page.

- [ ] **Step 6: Commit**

```bash
git add src/boot src/app.ts src/main.ts tests/fonts.test.ts
git commit -m "feat: live particle name with entry animation, vibration, breath and ripple

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Debug panel (dev only) and slice-2 preview deploy

**Files:**
- Create: `src/tweaks.ts`
- Modify: `src/main.ts` (the `[Task 15]` line)

**Interfaces:**
- Produces: `prepareTweaks(params: Params): (app: App) => void` — applies `localStorage['parsanaji.tweaks']` to `params` immediately, returns the GUI mount.

- [ ] **Step 1: Write `src/tweaks.ts`**

```ts
import GUI from 'lil-gui';
import type { App } from './app';
import type { Params } from './engine/types';

const STORAGE_KEY = 'parsanaji.tweaks';

function deepAssign(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object') {
      deepAssign(current as Record<string, unknown>, value as Record<string, unknown>);
    } else if (key in target) {
      target[key] = value;
    }
  }
}

/** Applies saved tweaks to `params` now (before sampling) and returns the mount function. */
export function prepareTweaks(params: Params): (app: App) => void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) deepAssign(params as unknown as Record<string, unknown>, JSON.parse(saved) as Record<string, unknown>);
  } catch {
    // corrupt storage: ignore, defaults stay
  }
  return (app: App) => {
    mount(params, app);
  };
}

function mount(params: Params, app: App): GUI {
  const gui = new GUI({ title: 'parsanaji tweaks', width: 320 });
  const persist = (): void => localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  const live = (): void => {
    persist();
    app.applyParams();
  };
  const relayout = (): void => {
    persist();
    app.layout();
  };

  const field = gui.addFolder('field');
  field.add(params, 'density', 0.05, 1, 0.01).onFinishChange(relayout);
  for (const key of ['desktop', 'tablet', 'phone'] as const) {
    field.add(params.caps, key, 1000, 120_000, 1000).name(`cap ${key}`).onFinishChange(relayout);
  }
  field.add(params, 'dotSize', 0.5, 4, 0.1).onChange(live);
  field.add(params, 'alphaScale', 0.1, 1, 0.05).onChange(live);
  field.add(params, 'nearScale', 1, 2.5, 0.05).onChange(live);
  field.add(params, 'additive').onChange(live);
  field.add(params, 'sizeVarMin', 0.25, 1, 0.05).onFinishChange(relayout);
  field.add(params, 'sizeVarMax', 1, 2, 0.05).onFinishChange(relayout);

  const idle = gui.addFolder('idle');
  idle.add(params, 'vibAmp', 0, 3, 0.05).onChange(live);
  idle.add(params, 'vibFreq', 0.1, 6, 0.1).onChange(live);
  idle.add(params, 'vibScale', 0.002, 0.1, 0.001).onChange(live);
  idle.add(params, 'breathAmp', 0, 0.05, 0.001).onChange(persist);
  idle.add(params, 'breathPeriodMs', 1000, 20000, 100).onChange(persist);
  idle.add(params.ripple, 'intervalMs', 2000, 30000, 500).onChange(live);
  idle.add(params.ripple, 'amplitudePx', 0, 12, 0.5).onChange(live);
  idle.add(params.ripple, 'speedPxPerS', 200, 4000, 50).onChange(live);
  idle.add(params.ripple, 'bandPx', 10, 200, 5).onChange(live);

  const pointer = gui.addFolder('pointer');
  pointer.add(params, 'repelRadius', 20, 400, 5).onChange(live);
  pointer.add(params, 'repelStrength', 0, 1, 0.01).onChange(live);
  pointer.add(params, 'repelClampFrac', 0.1, 1.5, 0.05).onChange(live);
  pointer.add(params.pointer, 'lerp', 0.02, 0.5, 0.01).onChange(live);
  pointer.add(params.pointer, 'trailMs', 100, 2000, 50).onChange(live);

  const morph = gui.addFolder('morph');
  for (const key of ['entryMs', 'entryStaggerMs', 'scrambleMs', 'formMs', 'formStaggerMs', 'holdMs', 'autoTeaseMs'] as const) {
    morph.add(params.morph, key, 0, 10000, 50).onChange(live);
  }
  morph.add(params, 'scatterMin', 0, 600, 10).onChange(live);
  morph.add(params, 'scatterMax', 0, 1200, 10).onChange(live);
  morph.add({ trigger: () => void app.requestCycle() }, 'trigger').name('trigger morph');

  gui.add({ copy: () => void navigator.clipboard.writeText(JSON.stringify(params, null, 2)) }, 'copy').name('copy JSON');
  gui
    .add(
      {
        reset: () => {
          localStorage.removeItem(STORAGE_KEY);
          location.reload();
        },
      },
      'reset',
    )
    .name('reset to defaults');
  return gui;
}
```

- [ ] **Step 2: Wire it in `src/main.ts`** — replace the line `// [Task 15] debug panel loads here, before sampling, so saved tweaks affect N` with:

```ts
  let mountTweaks: ((app: App) => void) | null = null;
  if (import.meta.env.DEV && query.has('debug')) {
    const tweaks = await import('./tweaks');
    mountTweaks = tweaks.prepareTweaks(params);
  }
```

and after `app.start();` add:

```ts
  mountTweaks?.(app);
```

- [ ] **Step 3: Verify dev panel and production exclusion**

Run: `npm run typecheck && npm run dev` → open `http://localhost:5173/?debug` with the DevTools MCP: the `parsanaji tweaks` panel appears top-right; change `dotSize` and see dots grow live; change `density` and see the field re-sample; set `cap desktop` below the current N (1440 px wide) and see fewer dots; reload keeps the values; "reset to defaults" clears them.

Run: `npm run build && (grep -il "lil-gui" dist/assets/*.js && echo "FAIL: lil-gui in production" || echo "ok: lil-gui absent")` → `ok: lil-gui absent`. Budget: `gzip -c dist/assets/*.js | wc -c` → under 184320 bytes (180 KB).

- [ ] **Step 4: Commit and deploy a preview**

```bash
git add src/tweaks.ts src/main.ts
git commit -m "feat: dev-only tuning panel behind ?debug

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
npm run deploy:preview
```

Expected: `https://preview.parsanaji-com.pages.dev` shows the particle name. Report the URL to the orchestrator for Parsa. Production also updates through the Actions run on `main`; that is intended — slice 2 is strictly better than the static page.

---
