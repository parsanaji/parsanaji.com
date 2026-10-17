## Slice 2 — Engine core

### Task 9: PRNG, easing, frame-delta clamp

**Files:**
- Create: `src/engine/prng.ts`, `src/engine/easing.ts`, `src/engine/time.ts`
- Test: `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts`

**Interfaces:**
- Produces: `mulberry32(seed: number): () => number` (uniform in [0,1)), `seedFromLocation(search: string, fallback?: () => number): number`; `easeOutExpo`, `easeInCubic`, `easeOutCubic`, `clamp01` (all `(t: number) => number`); `clampDt(dtMs: number, maxMs = 50): number`.

- [x] **Step 1: Write the failing tests**

`tests/prng.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { mulberry32, seedFromLocation } from '../src/engine/prng';

describe('mulberry32', () => {
  it('is deterministic for a seed and uniform in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seq = Array.from({ length: 1000 }, () => a());
    expect(Array.from({ length: 1000 }, () => b())).toEqual(seq);
    expect(Math.min(...seq)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...seq)).toBeLessThan(1);
    const mean = seq.reduce((s, v) => s + v, 0) / seq.length;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });

  it('differs between seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe('seedFromLocation', () => {
  it('reads ?seed= when it is a finite number', () => {
    expect(seedFromLocation('?seed=42', () => 7)).toBe(42);
    expect(seedFromLocation('?debug&seed=9', () => 7)).toBe(9);
  });

  it('falls back otherwise', () => {
    expect(seedFromLocation('', () => 7)).toBe(7);
    expect(seedFromLocation('?seed=abc', () => 7)).toBe(7);
  });
});
```

`tests/easing.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo } from '../src/engine/easing';

describe('easing', () => {
  it('pins the end points', () => {
    for (const f of [easeOutExpo, easeInCubic, easeOutCubic]) {
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBeCloseTo(1, 6);
    }
  });

  it('has the expected midpoints', () => {
    expect(easeOutExpo(0.5)).toBeCloseTo(0.96875, 6);
    expect(easeInCubic(0.5)).toBeCloseTo(0.125, 6);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 6);
  });

  it('clamps', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.3)).toBe(0.3);
  });
});
```

`tests/time.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { clampDt } from '../src/engine/time';

describe('clampDt', () => {
  it('passes normal frame deltas through', () => {
    expect(clampDt(16.7)).toBe(16.7);
    expect(clampDt(33.3)).toBe(33.3);
  });

  it('caps a huge delta after a hidden tab at 50 ms', () => {
    expect(clampDt(60_000)).toBe(50);
  });

  it('substitutes one 60 fps frame for garbage', () => {
    expect(clampDt(Number.NaN)).toBeCloseTo(16.667, 3);
    expect(clampDt(0)).toBeCloseTo(16.667, 3);
    expect(clampDt(-5)).toBeCloseTo(16.667, 3);
  });
});
```

- [x] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts`
Expected: FAIL — modules not found.

- [x] **Step 3: Write the modules**

`src/engine/prng.ts`:
```ts
/** Small, fast, seedable PRNG (Tommy Ettinger's mulberry32). Returns uniform numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `?seed=123` pins the dot layout for screenshots; otherwise a fresh seed per page load. */
export function seedFromLocation(search: string, fallback: () => number = () => Date.now()): number {
  const raw = new URLSearchParams(search).get('seed');
  const n = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(n) ? n >>> 0 : fallback() >>> 0;
}
```

`src/engine/easing.ts`:
```ts
export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInCubic = (t: number): number => t * t * t;
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
```

`src/engine/time.ts`:
```ts
const ONE_FRAME_MS = 1000 / 60;

/** Frame delta safe for simulation: finite, positive, and never larger than `maxMs` (hidden-tab gaps). */
export function clampDt(dtMs: number, maxMs = 50): number {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return ONE_FRAME_MS;
  return Math.min(dtMs, maxMs);
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts`
Expected: all pass.

- [x] **Step 5: Commit**

```bash
git add src/engine/prng.ts src/engine/easing.ts src/engine/time.ts tests/prng.test.ts tests/easing.test.ts tests/time.test.ts
git commit -m "feat(engine): seeded PRNG, easing curves and frame-delta clamp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Shared types, defaults, quality rules

**Files:**
- Create: `src/engine/types.ts`, `src/engine/defaults.ts`, `src/engine/quality.ts`
- Test: `tests/quality.test.ts`, `tests/defaults.test.ts`

**Interfaces:**
- Produces (`types.ts`): `PHASE` ids, `PhaseId`, `PointerSlot`, `RippleState`, `RIPPLE_OFF`, and the param interfaces `CountCaps`, `RippleParams`, `MorphTimings`, `PointerParams`, `LayoutParams`, `RasterParams`, `ProbeParams`, `Params`.
- Produces (`defaults.ts`): `DEFAULTS: Params` (spec 3.2–3.7 numbers; `caps` is a copy of `COUNT_CAP`) and `cloneParams(p)`.
- Produces (`quality.ts`): `widthClass(vw) → 'desktop' | 'tablet' | 'phone'`, `COUNT_CAP`, `dotCount(inkedAreaCssPx, vw, density, caps?)`, `capDpr(dpr, max = 2)`, `degradedCount(n, factor = 0.6)`, `class FpsProbe { push(dtMs): 'pending' | 'keep' | 'degrade'; done: boolean }`.

- [x] **Step 1: Write `src/engine/types.ts`**

```ts
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
```

- [x] **Step 2: Write `src/engine/defaults.ts`** (every number traces to spec 3.2–3.7; `caps` copies `COUNT_CAP` from `quality.ts`, written in Step 4)

```ts
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
```

- [x] **Step 3: Write the failing quality and defaults tests** (`tests/quality.test.ts`, `tests/defaults.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { COUNT_CAP, FpsProbe, capDpr, degradedCount, dotCount, widthClass } from '../src/engine/quality';

describe('widthClass and caps', () => {
  it('classifies at the spec boundaries', () => {
    expect(widthClass(1024)).toBe('desktop');
    expect(widthClass(1023)).toBe('tablet');
    expect(widthClass(768)).toBe('tablet');
    expect(widthClass(767)).toBe('phone');
  });

  it('caps are 60k / 40k / 25k', () => {
    expect(COUNT_CAP).toEqual({ desktop: 60_000, tablet: 40_000, phone: 25_000 });
  });
});

describe('dotCount', () => {
  it('derives N from inked area times density', () => {
    expect(dotCount(50_000, 1440, 0.3)).toBe(15_000);
  });

  it('caps by width class', () => {
    expect(dotCount(1_000_000, 1440, 0.3)).toBe(60_000);
    expect(dotCount(1_000_000, 800, 0.3)).toBe(40_000);
    expect(dotCount(1_000_000, 390, 0.3)).toBe(25_000);
  });

  it('honours injected caps (debug-panel tunable, spec 3.3)', () => {
    const caps = { desktop: 30_000, tablet: 20_000, phone: 10_000 };
    expect(dotCount(1_000_000, 1440, 0.3, caps)).toBe(30_000);
    expect(dotCount(1_000_000, 390, 0.3, caps)).toBe(10_000);
  });

  it('never returns less than 1', () => {
    expect(dotCount(0, 1440, 0.3)).toBe(1);
  });
});

describe('capDpr', () => {
  it('caps at 2 and sanitizes', () => {
    expect(capDpr(3)).toBe(2);
    expect(capDpr(1.5)).toBe(1.5);
    expect(capDpr(Number.NaN)).toBe(1);
    expect(capDpr(0)).toBe(1);
  });
});

describe('degradedCount', () => {
  it('drops 40 percent', () => {
    expect(degradedCount(15_000)).toBe(9000);
    expect(degradedCount(1)).toBe(1);
  });
});

describe('FpsProbe', () => {
  it('stays pending until the window is full', () => {
    const p = new FpsProbe(60, 45);
    for (let i = 0; i < 59; i++) expect(p.push(16.7)).toBe('pending');
    expect(p.done).toBe(false);
  });

  it('keeps at 60 fps', () => {
    const p = new FpsProbe(60, 45);
    let last: string = 'pending';
    for (let i = 0; i < 60; i++) last = p.push(16.7);
    expect(last).toBe('keep');
    expect(p.done).toBe(true);
  });

  it('degrades once at 30 fps, then keeps forever', () => {
    const p = new FpsProbe(60, 45);
    let last: string = 'pending';
    for (let i = 0; i < 60; i++) last = p.push(33.3);
    expect(last).toBe('degrade');
    expect(p.push(33.3)).toBe('keep');
    expect(p.push(100)).toBe('keep');
  });
});
```

`tests/defaults.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULTS, cloneParams } from '../src/engine/defaults';
import { COUNT_CAP } from '../src/engine/quality';

describe('DEFAULTS', () => {
  it('ships the spec 3.3 caps as a tunable copy of COUNT_CAP', () => {
    expect(DEFAULTS.caps).toEqual(COUNT_CAP);
    expect(DEFAULTS.caps).not.toBe(COUNT_CAP);
  });
});

describe('cloneParams', () => {
  it('deep-copies, so debug-panel edits never reach DEFAULTS', () => {
    const p = cloneParams(DEFAULTS);
    p.caps.desktop = 1;
    p.ripple.intervalMs = 1;
    p.morph.holdMs = 1;
    p.pointer.lerp = 1;
    expect(DEFAULTS.caps.desktop).toBe(60_000);
    expect(DEFAULTS.ripple.intervalMs).toBe(10_000);
    expect(DEFAULTS.morph.holdMs).toBe(2500);
    expect(DEFAULTS.pointer.lerp).toBe(0.12);
  });
});
```

- [x] **Step 4: Run to verify failure, then write `src/engine/quality.ts`**

Run: `npx vitest run tests/quality.test.ts tests/defaults.test.ts` → FAIL (module not found: `quality.ts` does not exist yet, and `defaults.ts` imports it). Then:

```ts
export type WidthClass = 'desktop' | 'tablet' | 'phone';

export const COUNT_CAP: Record<WidthClass, number> = { desktop: 60_000, tablet: 40_000, phone: 25_000 };

export function widthClass(viewportW: number): WidthClass {
  if (viewportW >= 1024) return 'desktop';
  if (viewportW >= 768) return 'tablet';
  return 'phone';
}

/** Spec 3.3: N = min(cap by width class, inked CSS px² × density), at least 1. */
export function dotCount(
  inkedAreaCssPx: number,
  viewportW: number,
  density: number,
  caps: Record<WidthClass, number> = COUNT_CAP,
): number {
  const cap = caps[widthClass(viewportW)];
  return Math.max(1, Math.min(cap, Math.round(inkedAreaCssPx * density)));
}

export function capDpr(devicePixelRatio: number, max = 2): number {
  const d = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(max, d);
}

export function degradedCount(n: number, factor = 0.6): number {
  return Math.max(1, Math.round(n * factor));
}

/** Measures one window of frames after the entry; reports 'degrade' at most once (spec 3.6). */
export class FpsProbe {
  private frames = 0;
  private elapsedMs = 0;
  private settled = false;

  constructor(
    private readonly windowFrames = 60,
    private readonly thresholdFps = 45,
  ) {}

  push(dtMs: number): 'pending' | 'keep' | 'degrade' {
    if (this.settled) return 'keep';
    this.frames += 1;
    this.elapsedMs += dtMs;
    if (this.frames < this.windowFrames) return 'pending';
    this.settled = true;
    const fps = 1000 / (this.elapsedMs / this.frames);
    return fps < this.thresholdFps ? 'degrade' : 'keep';
  }

  get done(): boolean {
    return this.settled;
  }
}
```

- [x] **Step 5: Run the tests and typecheck**

Run: `npx vitest run tests/quality.test.ts tests/defaults.test.ts && npm run typecheck`
Expected: all pass; `tsc` silent.

- [x] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/defaults.ts src/engine/quality.ts tests/quality.test.ts tests/defaults.test.ts
git commit -m "feat(engine): shared types, shipped defaults and adaptive-quality rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Text sampler

Turns a string into exactly `N` centred points. Pure math over an injected 2D canvas, so it runs in Node tests with a fake canvas and in the browser with `OffscreenCanvas`.

**Files:**
- Create: `src/engine/sampler.ts`, `tests/helpers/fakeCanvas.ts`
- Test: `tests/sampler.test.ts`

**Interfaces:**
- Consumes: `LayoutParams`, `RasterParams` (Task 10); `mulberry32` (Task 9, tests only).
- Produces: types `Canvas2DLike`, `Context2DLike`, `CanvasFactory`, `MeasureFn`, `LayoutOptions`, `Layout`, `LineBox`, `Raster`, `SampleResult`; functions `layoutText(text, opts, measure)`, `makeMeasure(canvas, raster)`, `rasterize(layout, raster, letterSpacingEm, createCanvas)`, `drawSpaced(ctx, text, x, y, spacing)`, `scanAlpha(img, threshold = 128)`, `subsampleToN(points, n, rand, jitter = 0.3)`, `sampleText(text, opts, raster, createCanvas, measure)`. Points are `Float32Array` of interleaved `x, y` in centred CSS px, y up.

- [x] **Step 1: Write the fake canvas helper** (`tests/helpers/fakeCanvas.ts`)

```ts
import type { Canvas2DLike, Context2DLike } from '../../src/engine/sampler';

export interface FakeOptions {
  /** glyph advance as a fraction of the font size */
  charWidthEm?: number;
  /** glyph ink height as a fraction of the font size */
  capHeightEm?: number;
  /** expose a `letterSpacing` property like modern browsers do */
  nativeLetterSpacing?: boolean;
}

export interface FakeContext extends Context2DLike {
  fillTextCalls: { text: string; x: number; y: number }[];
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A 2D context that "draws" every fillText as a filled rectangle and reports it from getImageData. */
export function createFakeCanvasFactory(opts: FakeOptions = {}): {
  factory: (width: number, height: number) => Canvas2DLike;
  contexts: FakeContext[];
} {
  const charWidthEm = opts.charWidthEm ?? 0.6;
  const capHeightEm = opts.capHeightEm ?? 0.7;
  const contexts: FakeContext[] = [];

  const factory = (width: number, height: number): Canvas2DLike => {
    const rects: Rect[] = [];
    const fontPx = (): number => Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 10);
    const spacingPx = (): number => (ctx.letterSpacing ? Number.parseFloat(ctx.letterSpacing) : 0);
    const ctx: FakeContext = {
      font: '10px sans-serif',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      fillStyle: '#000',
      fillTextCalls: [],
      clearRect() {
        rects.length = 0;
      },
      measureText(text: string) {
        return { width: text.length * charWidthEm * fontPx() + spacingPx() * text.length };
      },
      fillText(text: string, x: number, y: number) {
        ctx.fillTextCalls.push({ text, x, y });
        const w = ctx.measureText(text).width;
        const h = capHeightEm * fontPx();
        const left = ctx.textAlign === 'center' ? x - w / 2 : x;
        rects.push({ x0: left, x1: left + w, y0: y - h / 2, y1: y + h / 2 });
      },
      getImageData(_x: number, _y: number, w: number, h: number) {
        const data = new Uint8ClampedArray(w * h * 4);
        for (const r of rects) {
          for (let yy = Math.max(0, Math.ceil(r.y0)); yy < Math.min(h, Math.floor(r.y1)); yy++) {
            for (let xx = Math.max(0, Math.ceil(r.x0)); xx < Math.min(w, Math.floor(r.x1)); xx++) {
              data[(yy * w + xx) * 4 + 3] = 255;
            }
          }
        }
        return { width: w, height: h, data };
      },
    };
    if (opts.nativeLetterSpacing) ctx.letterSpacing = '0px';
    contexts.push(ctx);
    return { width, height, getContext: () => ctx };
  };

  return { factory, contexts };
}
```

- [x] **Step 2: Write the failing tests** (`tests/sampler.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/engine/defaults';
import { mulberry32 } from '../src/engine/prng';
import { layoutText, makeMeasure, sampleText, scanAlpha, subsampleToN, type MeasureFn } from '../src/engine/sampler';
import { createFakeCanvasFactory } from './helpers/fakeCanvas';

const measure: MeasureFn = (t, f, ls) => t.length * 0.6 * f + Math.max(0, t.length - 1) * ls * f;
const opts = (w: number, h: number) => ({ ...DEFAULTS.layout, viewportW: w, viewportH: h });

describe('layoutText', () => {
  it('keeps PARSA NAJI on one line at 72 percent of the width on desktop', () => {
    const l = layoutText('PARSA NAJI', opts(1440, 900), measure);
    expect(l.stacked).toBe(false);
    expect(l.lines).toHaveLength(1);
    expect(l.blockW).toBeCloseTo(1440 * 0.72, 0);
    expect(l.blockH).toBeLessThanOrEqual(900 * 0.4);
  });

  it('stacks below 480 px at 86 percent of the width', () => {
    const l = layoutText('PARSA NAJI', opts(390, 844), measure);
    expect(l.stacked).toBe(true);
    expect(l.lines.map((x) => x.text)).toEqual(['PARSA', 'NAJI']);
    expect(l.blockW).toBeCloseTo(390 * 0.86, 0);
    expect(l.lines[0].cy).toBeCloseTo(-l.lines[1].cy, 5);
  });

  it('caps the block at 40 percent of the viewport height', () => {
    const l = layoutText('PARSA NAJI', opts(1024, 200), measure);
    expect(l.blockH).toBeCloseTo(80, 5);
    expect(l.blockW).toBeLessThan(1024 * 0.72);
  });

  it('survives extreme viewports', () => {
    for (const [w, h] of [
      [320, 480],
      [2560, 1080],
      [1024, 200],
      [1, 1],
    ] as const) {
      const l = layoutText('PARSA NAJI', opts(w, h), measure);
      expect(l.fontPx).toBeGreaterThan(0);
      expect(l.blockH).toBeLessThanOrEqual(h * 0.4 + 1e-6);
    }
  });

  it('never stacks a single word', () => {
    expect(layoutText('soon.', opts(390, 844), measure).stacked).toBe(false);
  });
});

describe('scanAlpha', () => {
  it('returns pixel centres whose alpha exceeds the threshold', () => {
    const data = new Uint8ClampedArray(3 * 2 * 4);
    data[(0 * 3 + 1) * 4 + 3] = 255;
    data[(1 * 3 + 2) * 4 + 3] = 200;
    data[(1 * 3 + 0) * 4 + 3] = 100;
    expect(Array.from(scanAlpha({ width: 3, height: 2, data }))).toEqual([1.5, 0.5, 2.5, 1.5]);
  });
});

describe('subsampleToN', () => {
  const pts = Float32Array.from({ length: 200 }, (_, i) => i); // 100 points, y = x + 1

  it('returns exactly n points drawn from the input when n < count', () => {
    const out = subsampleToN(pts, 10, mulberry32(1));
    expect(out.length).toBe(20);
    for (let i = 0; i < 20; i += 2) expect(out[i + 1]).toBe(out[i] + 1);
  });

  it('is deterministic for the same seed', () => {
    expect(subsampleToN(pts, 10, mulberry32(7))).toEqual(subsampleToN(pts, 10, mulberry32(7)));
  });

  it('pads with jittered duplicates when n > count', () => {
    const out = subsampleToN(pts, 150, mulberry32(3));
    expect(out.length).toBe(300);
    for (let i = 0; i < 200; i++) expect(out[i]).toBe(pts[i]);
    for (let i = 200; i < 300; i += 2) {
      const nearest = Math.min(
        ...Array.from({ length: 100 }, (_, k) => Math.hypot(out[i] - pts[2 * k], out[i + 1] - pts[2 * k + 1])),
      );
      expect(nearest).toBeLessThanOrEqual(0.3 * Math.SQRT2 + 1e-6);
    }
  });

  it('returns zeros for empty input', () => {
    expect(Array.from(subsampleToN(new Float32Array(0), 3, mulberry32(1)))).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe('sampleText', () => {
  it('produces centred candidates and an inked area in CSS px²', () => {
    const { factory } = createFakeCanvasFactory();
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    const r = sampleText('PARSA NAJI', opts(1440, 900), DEFAULTS.raster, factory, m);
    expect(r.candidates.length).toBeGreaterThan(1000);
    expect(Math.abs(r.bounds.minX + r.bounds.maxX)).toBeLessThan(1);
    expect(Math.abs(r.bounds.minY + r.bounds.maxY)).toBeLessThan(1);
    expect(r.inkedAreaCssPx).toBeCloseTo(r.candidates.length / 2 / 4, 5);
    expect(r.glyphCenters.length).toBe(9 * 2);
  });

  it('falls back to per-glyph drawing when the context lacks letterSpacing', () => {
    const { factory, contexts } = createFakeCanvasFactory({ nativeLetterSpacing: false });
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    sampleText('PARSA NAJI', opts(1440, 900), DEFAULTS.raster, factory, m);
    const raster = contexts[contexts.length - 1];
    expect(raster.fillTextCalls).toHaveLength(9);
    expect(raster.fillTextCalls.map((c) => c.text).join('')).toBe('PARSANAJI');
  });

  it('uses one fillText per line when letterSpacing is native', () => {
    const { factory, contexts } = createFakeCanvasFactory({ nativeLetterSpacing: true });
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    sampleText('PARSA NAJI', opts(390, 844), DEFAULTS.raster, factory, m);
    expect(contexts[contexts.length - 1].fillTextCalls.map((c) => c.text)).toEqual(['PARSA', 'NAJI']);
  });

  it('handles text that leaves no ink', () => {
    const { factory } = createFakeCanvasFactory();
    const m = makeMeasure(factory(8, 8), DEFAULTS.raster);
    const r = sampleText(' ', opts(1440, 900), DEFAULTS.raster, factory, m);
    expect(r.candidates.length).toBe(0);
    expect(r.inkedAreaCssPx).toBe(0);
    expect(r.bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  });
});
```

- [x] **Step 3: Run to verify failure**

Run: `npx vitest run tests/sampler.test.ts`
Expected: FAIL — `../src/engine/sampler` not found.

- [x] **Step 4: Write `src/engine/sampler.ts`**

```ts
import type { LayoutParams, RasterParams } from './types';

export interface Context2DLike {
  font: string;
  textBaseline: string;
  textAlign: string;
  fillStyle: string;
  /** present in modern browsers; absent on older Safari and on test fakes that emulate it */
  letterSpacing?: string;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
  getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
}

export interface Canvas2DLike {
  width: number;
  height: number;
  getContext(type: '2d'): Context2DLike | null;
}

export type CanvasFactory = (width: number, height: number) => Canvas2DLike;

/** Width of `text` at `fontPx`, including letter spacing between glyphs. */
export type MeasureFn = (text: string, fontPx: number, letterSpacingEm: number) => number;

export interface LayoutOptions extends LayoutParams {
  viewportW: number;
  viewportH: number;
}

export interface LineBox {
  text: string;
  width: number;
  /** centre x in block coordinates (0 = block centre) */
  cx: number;
  /** centre y in block coordinates, y down */
  cy: number;
}

export interface Layout {
  fontPx: number;
  stacked: boolean;
  lines: LineBox[];
  blockW: number;
  blockH: number;
}

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  scale: number;
}

export interface SampleResult {
  /** interleaved x, y in centred CSS px, y up, re-centred on the inked bounding box */
  candidates: Float32Array;
  inkedAreaCssPx: number;
  layout: Layout;
  /** interleaved x, y of each non-space glyph centre, same coordinates as `candidates` */
  glyphCenters: Float32Array;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/** Spec 3.2: one line at 72 % width, or stacked words at 86 % below `stackBelow`; block height capped. */
export function layoutText(text: string, opts: LayoutOptions, measure: MeasureFn): Layout {
  const words = text.split(' ').filter((w) => w.length > 0);
  const stacked = opts.viewportW < opts.stackBelow && words.length > 1;
  const lines = stacked ? words : [text];
  const targetW = Math.max(1, opts.viewportW * (stacked ? opts.widthFracStacked : opts.widthFracSingle));
  const widestAt100 = Math.max(1e-6, ...lines.map((l) => measure(l, 100, opts.letterSpacingEm)));
  let fontPx = (targetW / widestAt100) * 100;
  // tiny positive floor (not 1 px): a 1 px tall viewport must still get a block no taller than 40 % of it
  const maxBlockH = Math.max(1e-6, opts.viewportH * opts.maxHeightFrac);
  const linesFactor = opts.lineHeight * lines.length;
  if (fontPx * linesFactor > maxBlockH) fontPx = maxBlockH / linesFactor;
  const lineH = fontPx * opts.lineHeight;
  const blockH = lineH * lines.length;
  const boxes: LineBox[] = lines.map((l, i) => ({
    text: l,
    width: measure(l, fontPx, opts.letterSpacingEm),
    cx: 0,
    cy: -blockH / 2 + lineH * (i + 0.5),
  }));
  const blockW = Math.max(...boxes.map((b) => b.width));
  return { fontPx, stacked, lines: boxes, blockW, blockH };
}

/** A measure function backed by a (possibly offscreen) 2D canvas. */
export function makeMeasure(canvas: Canvas2DLike, raster: Pick<RasterParams, 'fontFamily' | 'fontWeight'>): MeasureFn {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return (text, fontPx, letterSpacingEm) => {
    ctx.font = `${raster.fontWeight} ${fontPx}px "${raster.fontFamily}"`;
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${letterSpacingEm * fontPx}px`;
      return ctx.measureText(text).width;
    }
    return ctx.measureText(text).width + Math.max(0, text.length - 1) * letterSpacingEm * fontPx;
  };
}

/** Fallback for contexts without `letterSpacing`: draws glyph by glyph, centred on x. */
export function drawSpaced(ctx: Context2DLike, text: string, x: number, y: number, spacing: number): void {
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  ctx.textAlign = 'left';
  let cursor = x - total / 2;
  chars.forEach((c, i) => {
    if (c !== ' ') ctx.fillText(c, cursor, y);
    cursor += widths[i] + spacing;
  });
}

/** Draws the layout at `raster.scale` × CSS size with padding for overshoot and returns the pixels. */
export function rasterize(layout: Layout, raster: RasterParams, letterSpacingEm: number, createCanvas: CanvasFactory): Raster {
  const pad = Math.ceil(layout.fontPx * 0.25);
  const width = Math.max(1, Math.ceil((layout.blockW + pad * 2) * raster.scale));
  const height = Math.max(1, Math.ceil((layout.blockH + pad * 2) * raster.scale));
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const fontPx = layout.fontPx * raster.scale;
  const spacing = letterSpacingEm * fontPx;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = `${raster.fontWeight} ${fontPx}px "${raster.fontFamily}"`;
  const native = 'letterSpacing' in ctx;
  if (native) ctx.letterSpacing = `${spacing}px`;
  for (const line of layout.lines) {
    const x = width / 2 + line.cx * raster.scale;
    const y = height / 2 + line.cy * raster.scale;
    if (native) {
      ctx.textAlign = 'center';
      // native letter spacing also trails the last glyph; shift by half of it to keep optical centring
      ctx.fillText(line.text, x + spacing / 2, y);
    } else {
      drawSpaced(ctx, line.text, x, y, spacing);
    }
  }
  const img = ctx.getImageData(0, 0, width, height);
  return { data: img.data, width, height, scale: raster.scale };
}

/** Pixel centres with alpha above `threshold`, interleaved x, y in raster pixels (y down). */
export function scanAlpha(img: { data: Uint8ClampedArray; width: number; height: number }, threshold = 128): Float32Array {
  const out: number[] = [];
  const { data, width, height } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > threshold) out.push(x + 0.5, y + 0.5);
    }
  }
  return Float32Array.from(out);
}

/** Exactly n points: a seeded uniform sample without replacement, or jittered duplicates when short (spec 3.3). */
export function subsampleToN(points: Float32Array, n: number, rand: () => number, jitter = 0.3): Float32Array {
  const count = points.length / 2;
  const out = new Float32Array(n * 2);
  if (count === 0 || n === 0) return out;
  if (count >= n) {
    const idx = new Uint32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(rand() * (count - i));
      const t = idx[i];
      idx[i] = idx[j];
      idx[j] = t;
      out[i * 2] = points[idx[i] * 2];
      out[i * 2 + 1] = points[idx[i] * 2 + 1];
    }
    return out;
  }
  for (let i = 0; i < n; i++) {
    const duplicate = i >= count;
    const src = duplicate ? Math.floor(rand() * count) : i;
    const jx = duplicate ? (rand() * 2 - 1) * jitter : 0;
    const jy = duplicate ? (rand() * 2 - 1) * jitter : 0;
    out[i * 2] = points[src * 2] + jx;
    out[i * 2 + 1] = points[src * 2 + 1] + jy;
  }
  return out;
}

function glyphCenters(layout: Layout, letterSpacingEm: number, measure: MeasureFn, dx: number, dy: number): Float32Array {
  const out: number[] = [];
  const spacing = letterSpacingEm * layout.fontPx;
  for (const line of layout.lines) {
    const chars = Array.from(line.text);
    const widths = chars.map((c) => measure(c, layout.fontPx, 0));
    const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
    let cursor = line.cx - total / 2;
    chars.forEach((c, i) => {
      if (c !== ' ') out.push(cursor + widths[i] / 2 - dx, -line.cy - dy);
      cursor += widths[i] + spacing;
    });
  }
  return Float32Array.from(out);
}

/** Layout → raster → candidates in centred CSS px (y up), re-centred on the inked bounding box. */
export function sampleText(
  text: string,
  opts: LayoutOptions,
  raster: RasterParams,
  createCanvas: CanvasFactory,
  measure: MeasureFn,
): SampleResult {
  const layout = layoutText(text, opts, measure);
  const img = rasterize(layout, raster, opts.letterSpacingEm, createCanvas);
  const raw = scanAlpha(img);
  const s = img.scale;
  const candidates = new Float32Array(raw.length);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < raw.length; i += 2) {
    const x = (raw[i] - img.width / 2) / s;
    const y = (img.height / 2 - raw[i + 1]) / s;
    candidates[i] = x;
    candidates[i + 1] = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const inked = raw.length > 0;
  const dx = inked ? (minX + maxX) / 2 : 0;
  const dy = inked ? (minY + maxY) / 2 : 0;
  for (let i = 0; i < candidates.length; i += 2) {
    candidates[i] -= dx;
    candidates[i + 1] -= dy;
  }
  return {
    candidates,
    inkedAreaCssPx: raw.length / 2 / (s * s),
    layout,
    glyphCenters: glyphCenters(layout, opts.letterSpacingEm, measure, dx, dy),
    bounds: inked
      ? { minX: minX - dx, maxX: maxX - dx, minY: minY - dy, maxY: maxY - dy }
      : { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  };
}
```

- [x] **Step 5: Run the tests and typecheck**

Run: `npx vitest run tests/sampler.test.ts && npm run typecheck`
Expected: all pass; `tsc` silent. If `noUnusedLocals` complains about anything, remove the unused symbol rather than loosening the config.

- [x] **Step 6: Commit**

```bash
git add src/engine/sampler.ts tests/helpers/fakeCanvas.ts tests/sampler.test.ts
git commit -m "feat(engine): text sampler with layout, raster scan and seeded subsampling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
