### Task 9: Field parameters, sizing and flow

- **Files:** Create `src/field/params.ts`, `src/field/sizing.ts`, `src/field/flow.ts`, `tests/params.test.ts`, `tests/sizing.test.ts`, `tests/flow.test.ts`; Delete `src/engine/motion.ts`, `tests/motion.test.ts` (`breathScale` and its two cases move verbatim).
- **Interfaces:**
  - Consumes: Task 1 `capDpr(devicePixelRatio: number, max?: number): number`; Task 6 `src/styles.css` (the sizing test reads it).
  - Produces:
    ```ts
    // src/field/params.ts
    export type Density = 'sparse' | 'medium' | 'dense';
    export type Intensity = 'subtle' | 'medium' | 'lively';
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
    export const DEFAULT_FIELD: FieldParams; // exactly spec 4.9
    export function cloneField(p: FieldParams): FieldParams; // structuredClone

    // src/field/sizing.ts
    export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';
    export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number } // P6
    export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number;
    export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid;
    export function latticeSpacing(fieldCssW: number): number; // clamp(w / 48, 8, 40)
    export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number; // min(w,h)*0.28 + 2*sp (before the speed widening)

    // src/field/flow.ts
    export const INTENSITY_K: Readonly<Record<Intensity, number>>; // { subtle: 0.55, medium: 1, lively: 1.7 }
    export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number; // INTENSITY_K[intensity] * flowSpeed
    export function breathScale(tMs: number, amp: number, periodMs: number): number; // moved verbatim from engine/motion.ts
    ```
  - Semantics: `cellCssFor` = `clamp(p.k × w, p.minCss, p.maxCss) × p.densityK[density] × (degrade ?? 1)`; `computeGrid` applies 3.3.2.2–3.3.2.4 (non-finite or ≤ 0 DPR → 1; `dpr = capDpr`; `cellDev = max(2, round(cellCss × dpr))`, +1 when odd and the raw DPR exceeds the cap; `deviceBox` used only when given, `dprRaw ≤ 2` and within 1 device px of `css × dpr` on both axes (Index amendment A2), else `round(css × dpr)`; `cols = ceil(widthDev / cellDev)`, `rows = ceil(heightDev / cellDev)`).

- [ ] **Step 1: Write the failing tests**

`tests/params.test.ts` (the one test that pins `DEFAULT_FIELD` to spec 4.9; Task 24 edits it when tuning is approved, 4.12.4):
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';

describe('DEFAULT_FIELD', () => {
  it('deep-equals spec 4.9', () => {
    expect(DEFAULT_FIELD).toEqual({
      density: 'medium',
      intensity: 'medium',
      flowSpeed: 1,
      cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
      shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
      tiers: { t2: 0.66, t3: 0.9 },
      breath: { amp: 0.01, periodMs: 6000 },
      staticTimeS: 12,
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
    });
  });

  it('keeps the shader limits of 4.9.1', () => {
    expect(DEFAULT_FIELD.ripple.max).toBeLessThanOrEqual(8);
    expect(DEFAULT_FIELD.tiers.t2).toBeLessThan(DEFAULT_FIELD.tiers.t3);
  });
});

describe('cloneField', () => {
  it('returns a deep copy that never aliases the defaults', () => {
    const before = JSON.stringify(DEFAULT_FIELD);
    const c = cloneField(DEFAULT_FIELD);
    expect(c).toEqual(DEFAULT_FIELD);
    expect(c).not.toBe(DEFAULT_FIELD);
    expect(c.cell).not.toBe(DEFAULT_FIELD.cell);
    expect(c.cell.densityK).not.toBe(DEFAULT_FIELD.cell.densityK);
    c.cell.densityK.medium = 99;
    c.pointer.radiusK = 99;
    c.density = c.density === 'dense' ? 'sparse' : 'dense';
    expect(JSON.stringify(DEFAULT_FIELD)).toBe(before);
  });
});
```

`tests/sizing.test.ts` (spec 4.9 literals passed explicitly, Index amendment A4; the table rows are spec 3.3.2.5 and Appendix A §4.2, computed by running this code):
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { BAND_QUERY, cellCssFor, computeGrid, latticeSpacing, pointerRadius } from '../src/field/sizing';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const cell: FieldParams['cell'] = { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 };
const pointer: FieldParams['pointer'] = { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

describe('cellCssFor (spec 3.3.2.1)', () => {
  // [field width, sparse, medium, dense]
  const table: [number, number, number, number][] = [
    [390, 2.7, 2, 1.5],
    [768, 3.31776, 2.4576, 1.8432],
    [1280, 5.5296, 4.096, 3.072],
    [1366, 5.90112, 4.3712, 3.2784],
    [1440, 6.2208, 4.608, 3.456],
    [1920, 6.75, 5, 3.75],
    [2560, 6.75, 5, 3.75],
  ];
  it.each(table)('at %i px wide gives sparse %f, medium %f, dense %f', (w, sparse, medium, dense) => {
    expect(cellCssFor(w, cell, 'sparse')).toBeCloseTo(sparse, 9);
    expect(cellCssFor(w, cell, 'medium')).toBeCloseTo(medium, 9);
    expect(cellCssFor(w, cell, 'dense')).toBeCloseTo(dense, 9);
  });

  it('multiplies by the degrade factor after the FPS probe (3.7.9)', () => {
    expect(cellCssFor(1440, cell, 'medium', cell.degradeK)).toBeCloseTo(6.912, 9);
  });
});

describe('computeGrid (spec 3.3.2.2-3.3.2.5, Appendix A §4.2)', () => {
  // [cssW, cssH, dprRaw, dpr, cellDev, cellCss, cols, rows, maskW, maskH]
  const rows: [number, number, number, number, number, number, number, number, number, number][] = [
    [1440, 900, 1, 1, 5, 5, 288, 180, 576, 360],
    [1440, 900, 2, 2, 9, 4.5, 320, 200, 640, 400],
    [1280, 720, 1, 1, 4, 4, 320, 180, 640, 360],
    [1366, 768, 1, 1, 4, 4, 342, 192, 684, 384],
    [1920, 1080, 1, 1, 5, 5, 384, 216, 768, 432],
    [2560, 1440, 1, 1, 5, 5, 512, 288, 1024, 576],
    [390, 236.32, 3, 2, 4, 2, 195, 119, 390, 238],
  ];
  it.each(rows)('%i x %f at DPR %f', (w, h, dprRaw, dpr, cellDev, cellCss, cols, rows, maskW, maskH) => {
    const g = computeGrid(w, h, dprRaw, cellCssFor(w, cell, 'medium'));
    expect(g.dpr).toBe(dpr);
    expect(g.cellDev).toBe(cellDev);
    expect(g.cellCss).toBeCloseTo(cellCss, 9);
    expect([g.cols, g.rows, g.maskW, g.maskH]).toEqual([cols, rows, maskW, maskH]);
    expect(Number.isInteger(g.cellDev)).toBe(true);
  });

  it('makes cellDev even when the raw DPR exceeds the cap (4.5.9)', () => {
    const g = computeGrid(1440, 900, 3, cellCssFor(1440, cell, 'medium')); // round(4.608 x 2) = 9, odd
    expect(g.cellDev).toBe(10);
    expect(g.cellCss).toBe(5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([2880, 1800, 288, 180]);
  });

  it('prefers devicePixelContentBoxSize at a raw DPR of 2 or less (3.7.1)', () => {
    const w = cellCssFor(1366, cell, 'medium');
    expect(computeGrid(1366, 768, 1.25, w, { w: 1707, h: 960 }).widthDev).toBe(1707);
    expect(computeGrid(1366, 768, 1.25, w, null).widthDev).toBe(1708); // round(1707.5)
    expect(computeGrid(1366, 768, 1.25, w).cellDev).toBe(5);
  });

  it('ignores a device box that disagrees with css x dpr by more than 1 px (DevTools DPR emulation)', () => {
    const g = computeGrid(1440, 900, 1.25, cellCssFor(1440, cell, 'medium'), { w: 1440, h: 900 });
    expect([g.widthDev, g.heightDev, g.cellDev, g.cols, g.rows]).toEqual([1800, 1125, 6, 300, 188]);
  });

  it('ignores the device box above a raw DPR of 2 (the backing store is capped at 2x)', () => {
    const g = computeGrid(390, 236.32, 3, 2, { w: 1170, h: 709 });
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([780, 473, 195, 119]);
  });

  it('treats a non-finite or non-positive DPR as 1 (3.3.2.4)', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -2]) {
      const g = computeGrid(1440, 900, bad, cellCssFor(1440, cell, 'medium'));
      expect([g.dpr, g.cellDev, g.cols, g.rows]).toEqual([1, 5, 288, 180]);
    }
  });

  it('never produces a zero-sized target for a zero-sized canvas', () => {
    const g = computeGrid(0, 0, 1, 5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows, g.maskW, g.maskH]).toEqual([1, 1, 1, 1, 2, 2]);
  });
});

describe('latticeSpacing (spec 3.3.3)', () => {
  it('clamps w / 48 to [8, 40]', () => {
    expect(latticeSpacing(300)).toBe(8);
    expect(latticeSpacing(390)).toBeCloseTo(8.125, 9);
    expect(latticeSpacing(1280)).toBeCloseTo(26.667, 3);
    expect(latticeSpacing(1440)).toBe(30);
    expect(latticeSpacing(2000)).toBe(40);
  });
});

describe('pointerRadius (spec 3.3.7.1, at rest)', () => {
  it('is 312 px at 1440 x 900 and 82.42 px for the 390 x 236.32 band', () => {
    expect(pointerRadius(1440, 900, pointer)).toBeCloseTo(312, 9);
    expect(pointerRadius(390, 236.32, pointer)).toBeCloseTo(82.42, 2);
  });
});

describe('BAND_QUERY (spec 3.1.1)', () => {
  it('is the ruled band media query and appears verbatim in src/styles.css', () => {
    expect(BAND_QUERY).toBe('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)');
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toContain(BAND_QUERY);
  });
});
```

`tests/flow.test.ts` (the two `breathScale` cases are `tests/motion.test.ts`'s, verbatim, with the new import path):
```ts
import { describe, expect, it } from 'vitest';
import { INTENSITY_K, breathScale, effectiveIntensity } from '../src/field/flow';

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

describe('INTENSITY_K (spec 3.3.6.1)', () => {
  it('maps subtle, medium and lively to 0.55, 1 and 1.7', () => {
    expect(INTENSITY_K).toEqual({ subtle: 0.55, medium: 1, lively: 1.7 });
    expect(Object.isFrozen(INTENSITY_K)).toBe(true);
  });
});

describe('effectiveIntensity (spec 3.3.6.1)', () => {
  it('multiplies the intensity factor by the flow speed', () => {
    expect(effectiveIntensity({ intensity: 'medium', flowSpeed: 1 })).toBe(1);
    expect(effectiveIntensity({ intensity: 'lively', flowSpeed: 2 })).toBeCloseTo(3.4, 9);
    expect(effectiveIntensity({ intensity: 'subtle', flowSpeed: 0 })).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/params.test.ts tests/sizing.test.ts tests/flow.test.ts`
Expected: FAIL, 3 files, no tests run:
```
 FAIL  tests/flow.test.ts [ tests/flow.test.ts ]
Error: Cannot find module '../src/field/flow' imported from …/tests/flow.test.ts
 FAIL  tests/params.test.ts [ tests/params.test.ts ]
Error: Cannot find module '../src/field/params' imported from …/tests/params.test.ts
 FAIL  tests/sizing.test.ts [ tests/sizing.test.ts ]
Error: Cannot find module '../src/field/params' imported from …/tests/sizing.test.ts
 Test Files  3 failed (3)
      Tests  no tests
```

- [ ] **Step 3: Write `src/field/params.ts` (spec 4.9, exactly)**

```ts
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
```

- [ ] **Step 4: Write `src/field/sizing.ts` (spec 3.1.1, 3.3.2, 3.3.3, 3.3.7.1, 3.7.1; Index amendment A2)**

```ts
import { capDpr } from '../core/quality';
import type { Density, FieldParams } from './params';

/** Spec 3.1.1: the band layout's media query, used verbatim in src/styles.css. */
export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';

/** One frame's render-target sizing (spec 3.3.2, Appendix A §4.1). `cellCss` is the snapped `cellDev / dpr` (P6). */
export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Spec 3.3.2.1: clamp(k × w, min, max) × densityK × degrade (degrade 1, or 1.5 after the FPS probe). */
export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade = 1): number {
  return clamp(p.k * fieldCssW, p.minCss, p.maxCss) * p.densityK[density] * degrade;
}

/** Spec 3.3.2.2–3.3.2.4 and 3.7.1: whole-device-pixel cells, DPR capped at 2, the exact device box when it is trustworthy. */
export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid {
  const raw = Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1;
  const dpr = capDpr(raw);
  let cellDev = Math.max(2, Math.round(cellCss * dpr));
  if (raw > dpr && cellDev % 2 === 1) cellDev += 1; // 4.5.9: the compositor's 1.5x lands on whole device px
  // the device box is trusted only when it agrees with css x dpr to within the 1 px of edge snapping: DevTools
  // device-scale emulation reports the physical box, which would stretch every cell (8.2.10)
  const exact =
    deviceBox && raw <= 2 && Math.abs(deviceBox.w - cssW * dpr) <= 1 && Math.abs(deviceBox.h - cssH * dpr) <= 1 ? deviceBox : null;
  // a 0 x 0 box (canvas hidden mid-resize) still gives a 1 x 1 target: texStorage2D rejects zero sizes
  const widthDev = Math.max(1, exact ? Math.round(exact.w) : Math.round(cssW * dpr));
  const heightDev = Math.max(1, exact ? Math.round(exact.h) : Math.round(cssH * dpr));
  const cols = Math.ceil(widthDev / cellDev);
  const rows = Math.ceil(heightDev / cellDev);
  return { dpr, widthDev, heightDev, cellDev, cellCss: cellDev / dpr, cols, rows, maskW: 2 * cols, maskH: 2 * rows };
}

/** Spec 3.3.3: the Blueprint lattice unit sp, the unit of the pointer radius and the rings. */
export function latticeSpacing(fieldCssW: number): number {
  return clamp(fieldCssW / 48, 8, 40);
}

/** Spec 3.3.7.1 at rest: min(w, h) × radiusK + radiusSp × sp. App widens it by (1 + velRadiusGain × velFactor). */
export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number {
  return Math.min(fieldCssW, fieldCssH) * p.radiusK + p.radiusSp * latticeSpacing(fieldCssW);
}
```

- [ ] **Step 5: Write `src/field/flow.ts` and retire `src/engine/motion.ts` (spec 2.2.2, 3.3.6.1, 3.3.9)**

`breathScale` and its doc comment move verbatim from `src/engine/motion.ts`:
```ts
import type { FieldParams, Intensity } from './params';

/** Spec 3.3.6.1: flow-speed multiplier per intensity. */
export const INTENSITY_K: Readonly<Record<Intensity, number>> = Object.freeze({ subtle: 0.55, medium: 1, lively: 1.7 });

/** Spec 3.3.6.1: I_eff = INTENSITY_K[intensity] × flowSpeed; flow time τ advances by dt × I_eff. */
export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number {
  return INTENSITY_K[p.intensity] * p.flowSpeed;
}

/** Spec 3.5: the whole field scales by 1 ± amp on a sine with the given period. */
export function breathScale(tMs: number, amp: number, periodMs: number): number {
  if (amp === 0 || periodMs <= 0) return 1;
  return 1 + amp * Math.sin((2 * Math.PI * tMs) / periodMs);
}
```
Then delete the old module and its test (its two `breathScale` cases now live in `tests/flow.test.ts`; the four `RippleScheduler` cases retire with the scheduler, spec 2.2.6):
```bash
git rm -q src/engine/motion.ts tests/motion.test.ts
grep -rnE "from '[./]+(src/)?engine/motion" src tests || echo "no importers left"
```
Expected: `no importers left`.

- [ ] **Step 6: Run the new tests to verify they pass**

Run: `npx vitest run tests/params.test.ts tests/sizing.test.ts tests/flow.test.ts`
Expected:
```
 Test Files  3 passed (3)
      Tests  31 passed (31)
```
(params 3, sizing 24, flow 4.)

- [ ] **Step 7: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  18 passed (18)` and `Tests  159 passed (159)` (Task 8's 16 files and 134 tests, minus `tests/motion.test.ts` and its 6 tests, plus these 3 files and 31 tests); typecheck prints no diagnostics; the build prints `✓ built in …` with the same `dist/assets/index-*.js` size as Task 8 (nothing imports the new modules yet). Record the counts in the task report.

- [ ] **Step 8: Commit**

```bash
git add src/field/params.ts src/field/sizing.ts src/field/flow.ts tests/params.test.ts tests/sizing.test.ts tests/flow.test.ts
git status --short
git commit -m "feat(field): field parameters, grid sizing and flow

DEFAULT_FIELD is spec 4.9; computeGrid snaps cells to whole device
pixels, caps DPR at 2 and trusts devicePixelContentBoxSize only when
it agrees with css x dpr. breathScale moves from engine/motion.ts,
which retires with the ripple scheduler.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
`git status --short` before the commit lists the six added files and `D  src/engine/motion.ts`, `D  tests/motion.test.ts` (already staged by `git rm`), nothing else.

---

### Task 10: Pointer model and Shockwave pool

- **Files:** Create `src/field/pointer.ts`, `src/field/ripples.ts`, `tests/pointer.test.ts`, `tests/ripples.test.ts`.
- **Interfaces:**
  - Consumes: Task 9 `FieldParams['pointer']`, `FieldParams['ripple']`; Task 1 `easeOutCubic: (t: number) => number`, `clamp01: (t: number) => number`.
  - Produces:
    ```ts
    // src/field/pointer.ts
    export type PointerKind = 'mouse' | 'pen' | 'touch';
    export class PointerModel {
      constructor(p: FieldParams['pointer']);
      move(x: number, y: number, kind: PointerKind): void;  // field-space CSS px (raw)
      down(x: number, y: number, kind: PointerKind): void;  // touch snaps the eased point to the raw point
      release(): void;
      tick(dtMs: number): void;
      get x(): number; get y(): number;
      get strength(): number;   // eased 0..1
      get speed(): number;      // px/s of the eased point, 100 ms exponential average
      get velFactor(): number;  // min(speed / velNorm, 1)
      get settled(): boolean;   // strength at its target and eased point within 0.25 px of raw
    }

    // src/field/ripples.ts
    export class RipplePool {
      constructor(p: FieldParams['ripple']);
      spawn(x: number, y: number, tSec: number): void;           // drops the oldest at p.max
      write(tSec: number, sp: number, out: Float32Array): number; // fills 8 x vec4 (x, y, radius, amp), zeroes unused slots, returns the active count, prunes expired
      clear(): void;
      get count(): number;
    }
    ```
  - Semantics: `move` and `down` set the strength target to 1, `release` to 0; strength moves linearly toward the target at `dt / riseMs` and `dt / fallMs` and is output through `easeOutCubic`; the ease is `p += (raw − p) × (1 − (1 − lerp)^(dt / 16.667))`. `write` packs `(x, y, speedSp × sp × age, amp × (1 − age / lifeS))` per slot into an `out` of length 32 and expires rings at `age ≥ lifeS`.

- [ ] **Step 1: Write the failing tests**

`tests/pointer.test.ts` (spec 4.9 literals, Index amendment A4; 695.986 px after 100 ms and 999.993 px after 1 s are `1000 × (1 − 0.82^(t / 16.667))`, measured identical at 30, 60 and 120 fps by running this code; 2999.19 px/s and velFactor 0.49987 are the 100 ms-averaged speeds after 1 s at 3000 and 750 px/s):
```ts
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { PointerModel } from '../src/field/pointer';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const P: FieldParams['pointer'] = { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

/** Eased x after `ms` of frames at `fps`, the raw point jumping from 0 to 1000 px at t = 0. */
function easedAfter(fps: number, ms: number): number {
  const m = new PointerModel(P);
  m.down(0, 0, 'touch'); // eased point snapped to 0
  m.tick(1000 / fps); // strength above 0, so the next move eases instead of snapping
  m.move(1000, 0, 'mouse');
  const frames = Math.round((ms * fps) / 1000);
  for (let i = 0; i < frames; i++) m.tick(1000 / fps);
  return m.x;
}

describe('PointerModel ease (spec 3.3.7.3)', () => {
  it('is frame-rate independent at 30, 60 and 120 fps', () => {
    for (const fps of [30, 60, 120]) {
      expect(easedAfter(fps, 100)).toBeCloseTo(695.986, 2); // 1000 x (1 - 0.82^(100 / 16.667))
      const at1s = easedAfter(fps, 1000);
      expect(Math.abs(at1s - easedAfter(60, 1000)) / easedAfter(60, 1000)).toBeLessThan(0.01);
      expect(at1s).toBeCloseTo(999.993, 2);
    }
  });

  it('jumps to the first point instead of sweeping in from a stale position', () => {
    const m = new PointerModel(P);
    m.move(700, 400, 'mouse');
    expect([m.x, m.y]).toEqual([700, 400]);
  });

  it('ignores a non-positive or non-finite dt', () => {
    const m = new PointerModel(P);
    m.down(0, 0, 'touch');
    m.tick(16.667);
    m.move(100, 0, 'mouse');
    const before = [m.x, m.strength];
    for (const dt of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) m.tick(dt);
    expect([m.x, m.strength]).toEqual(before);
  });
});

describe('PointerModel strength (spec 3.3.7.4)', () => {
  it('rises over 200 ms and falls over 600 ms through easeOutCubic', () => {
    const m = new PointerModel(P);
    m.move(10, 10, 'mouse');
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBeCloseTo(0.875, 9); // easeOutCubic(0.5)
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBe(1);
    m.release();
    for (let i = 0; i < 15; i++) m.tick(20);
    expect(m.strength).toBeCloseTo(0.875, 9);
    for (let i = 0; i < 15; i++) m.tick(20);
    expect(m.strength).toBe(0);
  });

  it('reads riseMs and fallMs live from the params object', () => {
    const p = { ...P };
    const m = new PointerModel(p);
    m.move(0, 0, 'mouse');
    p.riseMs = 100;
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBe(1);
  });
});

describe('PointerModel press (spec 3.3.7.6)', () => {
  it('snaps the eased point on a touch pointerdown, not on a mouse one', () => {
    const m = new PointerModel(P);
    m.move(100, 100, 'mouse');
    for (let i = 0; i < 10; i++) m.tick(16.667);
    m.down(500, 300, 'mouse');
    expect(m.x).toBeCloseTo(100, 6);
    m.down(500, 300, 'touch');
    expect([m.x, m.y]).toEqual([500, 300]);
  });
});

describe('PointerModel speed (spec 3.3.7.5)', () => {
  /** velFactor after 1 s of the raw point moving right at `pxPerS`, 60 fps. */
  function velAfter(pxPerS: number): { speed: number; vel: number } {
    const m = new PointerModel(P);
    m.move(0, 0, 'mouse');
    let x = 0;
    for (let i = 0; i < 60; i++) {
      x += pxPerS / 60;
      m.move(x, 0, 'mouse');
      m.tick(1000 / 60);
    }
    return { speed: m.speed, vel: m.velFactor };
  }

  it('tracks the eased point speed and saturates velFactor at 1500 px/s', () => {
    expect(velAfter(3000).speed).toBeCloseTo(2999.19, 1);
    expect(velAfter(3000).vel).toBe(1);
    expect(velAfter(750).vel).toBeCloseTo(0.49987, 4);
  });
});

describe('PointerModel settled (spec 3.6.4 idle check)', () => {
  it('is true only when the strength is at its target and the eased point is within 0.25 px of the raw point', () => {
    const m = new PointerModel(P);
    m.move(200, 200, 'mouse');
    expect(m.settled).toBe(false); // strength still rising
    for (let i = 0; i < 60; i++) m.tick(16.667);
    expect(m.settled).toBe(true);
    m.move(900, 600, 'mouse');
    expect(m.settled).toBe(false); // raw point far from the eased one
    m.release();
    for (let i = 0; i < 60; i++) m.tick(16.667);
    expect(m.strength).toBe(0);
    expect(m.settled).toBe(true);
  });
});
```

`tests/ripples.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { RipplePool } from '../src/field/ripples';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const R: FieldParams['ripple'] = { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 };
const slots = (out: Float32Array, k: number): number[] => Array.from(out.subarray(k * 4, k * 4 + 4));

describe('RipplePool (spec 3.3.8)', () => {
  it('counts spawned rings', () => {
    const pool = new RipplePool(R);
    expect(pool.count).toBe(0);
    pool.spawn(10, 20, 0);
    pool.spawn(30, 40, 0.5);
    expect(pool.count).toBe(2);
  });

  it('drops the oldest ring when a 9th arrives (3.3.8.3)', () => {
    const pool = new RipplePool(R);
    for (let i = 0; i < 9; i++) pool.spawn(i, 0, i * 0.01);
    expect(pool.count).toBe(8);
    const out = new Float32Array(32);
    pool.write(0.1, 30, out);
    expect(out[0]).toBe(1); // ring 0 is gone, ring 1 now fills slot 0
    expect(out[28]).toBe(8);
  });

  it('packs (x, y, 9 sp age, 1.2 (1 - age / 3.2)) and zeroes unused slots (3.3.8.1)', () => {
    const pool = new RipplePool(R);
    pool.spawn(100, 50, 1);
    const out = new Float32Array(32).fill(7);
    expect(pool.write(2, 30, out)).toBe(1);
    const [x, y, radius, amp] = slots(out, 0);
    expect([x, y]).toEqual([100, 50]);
    expect(radius).toBeCloseTo(270, 4); // 9 x 30 x 1 s
    expect(amp).toBeCloseTo(0.825, 6); // 1.2 x (1 - 1 / 3.2)
    expect(Array.from(out.subarray(4))).toEqual(new Array(28).fill(0));
  });

  it('returns the active count and prunes rings at age 3.2 s', () => {
    const pool = new RipplePool(R);
    const out = new Float32Array(32);
    pool.spawn(0, 0, 0);
    pool.spawn(5, 5, 1);
    pool.spawn(9, 9, 2);
    expect(pool.write(3.19, 30, out)).toBe(3);
    expect(pool.write(3.2, 30, out)).toBe(2); // the t0 = 0 ring expires exactly at 3.2 s
    expect(pool.count).toBe(2);
    expect(slots(out, 0)[0]).toBe(5);
    expect(slots(out, 0)[2]).toBeCloseTo(9 * 30 * 2.2, 3);
    expect(slots(out, 2)).toEqual([0, 0, 0, 0]);
    expect(pool.write(5.2, 30, out)).toBe(0);
    expect(Array.from(out)).toEqual(new Array(32).fill(0));
  });

  it('clear() removes every ring', () => {
    const pool = new RipplePool(R);
    pool.spawn(1, 1, 0);
    pool.clear();
    expect(pool.count).toBe(0);
    expect(pool.write(0.1, 30, new Float32Array(32))).toBe(0);
  });

  it('reads max and lifeS live from the params object', () => {
    const p = { ...R };
    const pool = new RipplePool(p);
    p.max = 2;
    for (let i = 0; i < 5; i++) pool.spawn(i, 0, 0);
    expect(pool.count).toBe(2);
    p.lifeS = 1;
    expect(pool.write(1, 30, new Float32Array(32))).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/pointer.test.ts tests/ripples.test.ts`
Expected:
```
 FAIL  tests/pointer.test.ts [ tests/pointer.test.ts ]
Error: Cannot find module '../src/field/pointer' imported from …/tests/pointer.test.ts
 FAIL  tests/ripples.test.ts [ tests/ripples.test.ts ]
Error: Cannot find module '../src/field/ripples' imported from …/tests/ripples.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

- [ ] **Step 3: Write `src/field/pointer.ts` (spec 3.3.7.3–3.3.7.6, 3.6.4)**

The model holds `p` by reference (the panel edits it live). One rule beyond the index: while the strength is exactly 0 the eased point is invisible, so a move or press jumps it to the raw point instead of sweeping the repel lens in from a stale position (first contact, or a return after a full release).
```ts
import { easeOutCubic } from '../core/easing';
import type { FieldParams } from './params';

export type PointerKind = 'mouse' | 'pen' | 'touch';

const FRAME_MS = 16.667;
const SPEED_TAU_MS = 100; // 3.3.7.5: 100 ms exponential average
const SETTLE_PX = 0.25; // 3.6.4: eased point within 0.25 px of the raw point

/**
 * The eased pointer of spec 3.3.7, in field-space CSS px. `p` is held by reference, so the debug panel's
 * live edits apply on the next tick.
 */
export class PointerModel {
  private readonly p: FieldParams['pointer'];
  private rx = 0;
  private ry = 0;
  private ex = 0;
  private ey = 0;
  private target = 0;
  private lin = 0;
  private spd = 0;

  constructor(p: FieldParams['pointer']) {
    this.p = p;
  }

  /** A move inside the window: raw point and strength target 1 (3.3.7.4). */
  move(x: number, y: number, _kind: PointerKind): void {
    this.place(x, y, false);
  }

  /** A press: like a move, and a touch snaps the eased point to the touch point (3.3.7.6). */
  down(x: number, y: number, kind: PointerKind): void {
    this.place(x, y, kind === 'touch');
  }

  /** pointerup (touch), pointercancel, pointerleave, window blur: strength target 0 (3.3.7.6). */
  release(): void {
    this.target = 0;
  }

  tick(dtMs: number): void {
    if (!(dtMs > 0) || !Number.isFinite(dtMs)) return;
    const k = 1 - (1 - this.p.lerp) ** (dtMs / FRAME_MS); // 3.3.7.3, frame-rate independent
    const nx = this.ex + (this.rx - this.ex) * k;
    const ny = this.ey + (this.ry - this.ey) * k;
    const inst = (Math.hypot(nx - this.ex, ny - this.ey) * 1000) / dtMs;
    this.spd += (inst - this.spd) * (1 - Math.exp(-dtMs / SPEED_TAU_MS));
    this.ex = nx;
    this.ey = ny;
    if (this.lin < this.target) this.lin = Math.min(this.target, this.lin + dtMs / this.p.riseMs);
    else if (this.lin > this.target) this.lin = Math.max(this.target, this.lin - dtMs / this.p.fallMs);
    if (Math.abs(this.target - this.lin) < 1e-9) this.lin = this.target; // no float residue: settled can hold exactly
  }

  get x(): number {
    return this.ex;
  }

  get y(): number {
    return this.ey;
  }

  /** Eased 0..1: linear toward the target at dt / riseMs and dt / fallMs, output through easeOutCubic (3.3.7.4). */
  get strength(): number {
    return easeOutCubic(this.lin);
  }

  /** Speed of the eased point in px/s, smoothed with a 100 ms time constant (3.3.7.5). */
  get speed(): number {
    return this.spd;
  }

  get velFactor(): number {
    return Math.min(this.spd / this.p.velNorm, 1);
  }

  /** Strength at its target and the eased point within 0.25 px of the raw point (the 3.6.4 idle check). */
  get settled(): boolean {
    return this.lin === this.target && Math.hypot(this.rx - this.ex, this.ry - this.ey) <= SETTLE_PX;
  }

  private place(x: number, y: number, snap: boolean): void {
    this.rx = x;
    this.ry = y;
    // while the strength is 0 the eased point is invisible: jump there instead of sweeping in from a stale spot
    if (snap || this.lin === 0) {
      this.ex = x;
      this.ey = y;
      this.spd = 0;
    }
    this.target = 1;
  }
}
```

- [ ] **Step 4: Write `src/field/ripples.ts` (spec 3.3.8.1, 3.3.8.3)**

```ts
import type { FieldParams } from './params';

interface Ripple {
  x: number;
  y: number;
  t0: number;
}

const SLOTS = 8; // uRipples[8] in pass 1

/**
 * Shockwave rings (spec 3.3.8), in field-space CSS px and sim seconds. `p` is held by reference, so the
 * debug panel's live edits apply on the next write.
 */
export class RipplePool {
  private readonly p: FieldParams['ripple'];
  private rings: Ripple[] = [];

  constructor(p: FieldParams['ripple']) {
    this.p = p;
  }

  /** One ring per accepted primary pointerdown; at p.max rings the oldest is dropped (3.3.8.3). */
  spawn(x: number, y: number, tSec: number): void {
    const max = Math.max(1, Math.min(SLOTS, Math.floor(this.p.max)));
    while (this.rings.length >= max) this.rings.shift();
    this.rings.push({ x, y, t0: tSec });
  }

  /**
   * Packs up to 8 vec4 (x, y, radius = speedSp × sp × age, amp × (1 − age / lifeS)) into `out` (length 32),
   * zeroes the unused slots, prunes rings with age ≥ lifeS (3.3.8.1) and returns the active count.
   */
  write(tSec: number, sp: number, out: Float32Array): number {
    const { lifeS, speedSp, amp } = this.p;
    this.rings = this.rings.filter((r) => tSec - r.t0 < lifeS);
    const n = Math.min(SLOTS, this.rings.length);
    for (let k = 0; k < SLOTS; k++) {
      const o = k * 4;
      if (k < n) {
        const r = this.rings[k];
        const age = Math.max(0, tSec - r.t0);
        out[o] = r.x;
        out[o + 1] = r.y;
        out[o + 2] = speedSp * sp * age;
        out[o + 3] = amp * (1 - age / lifeS);
      } else {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
      }
    }
    return n;
  }

  clear(): void {
    this.rings = [];
  }

  get count(): number {
    return this.rings.length;
  }
}
```

- [ ] **Step 5: Run the new tests to verify they pass**

Run: `npx vitest run tests/pointer.test.ts tests/ripples.test.ts`
Expected:
```
 Test Files  2 passed (2)
      Tests  14 passed (14)
```
(pointer 8, ripples 6.)

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  20 passed (20)`, `Tests  173 passed (173)` (Task 9 plus 2 files and 14 tests); typecheck prints no diagnostics; build succeeds with the Task 8 JS size.

- [ ] **Step 7: Commit**

```bash
git add src/field/pointer.ts src/field/ripples.ts tests/pointer.test.ts tests/ripples.test.ts
git commit -m "feat(field): pointer model and Shockwave ring pool

Frame-rate independent ease, linear strength through easeOutCubic,
100 ms speed average and the settled check; up to 8 rings packed as
vec4 with expiry at 3.2 s.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Name-mask rasteriser

- **Files:** Move `src/engine/sampler.ts` → `src/field/nameMask.ts` (`git mv`, then rewrite per 4.8); Modify `tests/helpers/fakeCanvas.ts`; Create `tests/nameMask.test.ts`; Delete `src/engine/types.ts` (`src/engine/` is then gone).
- **Interfaces:**
  - Consumes: Task 9 `FieldParams['mask']`.
  - Produces (`src/field/nameMask.ts`):
    ```ts
    export interface Context2DLike {
      font: string; textBaseline: string; textAlign: string; fillStyle: string;
      letterSpacing?: string;
      clearRect(x: number, y: number, w: number, h: number): void;
      fillText(text: string, x: number, y: number): void;
      measureText(text: string): { width: number; actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number };
      getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
    }
    export interface Canvas2DLike { width: number; height: number; getContext(type: '2d'): Context2DLike | null }
    export type CanvasFactory = (w: number, h: number) => Canvas2DLike;
    export const MASK_FONT_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; // P5
    export interface MaskBox { x: number; y: number; w: number; h: number } // field-space CSS px
    export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number } // supersample = 2
    export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }
    export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number;
    export function rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane;
    export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array;
    export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox;
    // entry: whole field; konami: whole field when band, else { x: scrimRight, y: 0, w: field.w - scrimRight, h: field.h }
    ```
    `rasterizeMask` returns a plane of `grid.supersample × cols` by `grid.supersample × rows` texels covering the whole field (one texel = `cellCss / supersample` CSS px); `grid.cellCss` is `Grid.cellCss` (P6). Font string `${weight} ${size}px ${family}`; text centred on the box by its ink box (4.8.4; fallback ascent `0.73 × size`, descent 0).
  - Produces (`tests/helpers/fakeCanvas.ts`): `createFakeCanvasFactory(opts?: { charWidthEm?: number; capHeightEm?: number; nativeLetterSpacing?: boolean; boundingBox?: boolean }): { factory: (width: number, height: number) => Canvas2DLike; contexts: FakeContext[] }` where `boundingBox` (default true) controls whether `measureText` reports `actualBoundingBoxAscent` / `actualBoundingBoxDescent`; each `FakeContext.fillTextCalls` entry also records the `font` string (Index amendment A13).

- [ ] **Step 1: Point the fake canvas at the new module and teach it the alphabetic baseline**

Replace `tests/helpers/fakeCanvas.ts` with exactly this file (it imports from `src/field/nameMask.ts`; `measureText` reports `actualBoundingBoxAscent` = `capHeightEm × size` and `actualBoundingBoxDescent` = 0 unless `boundingBox: false`; an `'alphabetic'` baseline inks `[y − capHeight, y]`, every other baseline `y ± capHeight / 2`; `fillTextCalls` also records the font string):
```ts
import type { Canvas2DLike, Context2DLike } from '../../src/field/nameMask';

export interface FakeOptions {
  /** glyph advance as a fraction of the font size */
  charWidthEm?: number;
  /** glyph ink height as a fraction of the font size */
  capHeightEm?: number;
  /** expose a `letterSpacing` property like modern browsers do */
  nativeLetterSpacing?: boolean;
  /** report actualBoundingBoxAscent / actualBoundingBoxDescent from measureText (default true) */
  boundingBox?: boolean;
}

export interface FakeContext extends Context2DLike {
  fillTextCalls: { text: string; x: number; y: number; font: string }[];
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * A 2D context that "draws" every fillText as a filled rectangle and reports it from getImageData.
 * Ink spans capHeightEm × size above an 'alphabetic' baseline (descent 0), or ± half of it around a
 * 'middle' baseline.
 */
export function createFakeCanvasFactory(opts: FakeOptions = {}): {
  factory: (width: number, height: number) => Canvas2DLike;
  contexts: FakeContext[];
} {
  const charWidthEm = opts.charWidthEm ?? 0.6;
  const capHeightEm = opts.capHeightEm ?? 0.7;
  const boundingBox = opts.boundingBox ?? true;
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
        const width = text.length * charWidthEm * fontPx() + spacingPx() * text.length;
        return boundingBox ? { width, actualBoundingBoxAscent: capHeightEm * fontPx(), actualBoundingBoxDescent: 0 } : { width };
      },
      fillText(text: string, x: number, y: number) {
        ctx.fillTextCalls.push({ text, x, y, font: ctx.font });
        const w = text.length * charWidthEm * fontPx() + spacingPx() * text.length;
        const h = capHeightEm * fontPx();
        const left = ctx.textAlign === 'center' ? x - w / 2 : x;
        const [y0, y1] = ctx.textBaseline === 'alphabetic' ? [y - h, y] : [y - h / 2, y + h / 2];
        rects.push({ x0: left, x1: left + w, y0, y1 });
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

- [ ] **Step 2: Write the failing test**

`tests/nameMask.test.ts` (spec 4.9 mask literals, Index amendment A4; with the fake's 0.6 em advance "Parsa Naji" measures 600 at 100 px, which reproduces the spec's 201.6 px at 1440 × 900 and 54.6 px for the band; 137.2 px is the spec's "137 px nice."):
```ts
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { MASK_FONT_FAMILY, alphaPlane, fitFontPx, maskBoxFor, rasterizeMask, type MaskGrid, type MaskPlane } from '../src/field/nameMask';
import { computeGrid } from '../src/field/sizing';
import { createFakeCanvasFactory } from './helpers/fakeCanvas';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const MASK: FieldParams['mask'] = { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, fontWeight: 700 };
const FONT = { family: MASK_FONT_FAMILY, weight: MASK.fontWeight };
const DESKTOP: MaskGrid = { cols: 288, rows: 180, cellCss: 5, supersample: 2 }; // 1440 x 900 at DPR 1

/** Centre of the inked texels, in texels. */
function inkCentre(plane: MaskPlane): { x: number; y: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let y = 0; y < plane.height; y++) {
    for (let x = 0; x < plane.width; x++) {
      if (plane.data[y * plane.width + x] === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { x: (minX + maxX + 1) / 2, y: (minY + maxY + 1) / 2 };
}

describe('fitFontPx (spec 4.8.3)', () => {
  it('is 0.84 w 100 / widthAt100 when width-limited: 201.6 px at 1440 x 900 ("Parsa Naji" = 6.0 em)', () => {
    expect(fitFontPx(600, { x: 0, y: 0, w: 1440, h: 900 }, 0.4, 0.84)).toBeCloseTo(201.6, 9);
  });

  it('is 0.4 h when height-limited', () => {
    expect(fitFontPx(600, { x: 0, y: 0, w: 2000, h: 300 }, 0.4, 0.84)).toBeCloseTo(120, 9);
  });

  it('falls back to the height rule for text without width and never goes negative', () => {
    expect(fitFontPx(0, { x: 0, y: 0, w: 1440, h: 900 }, 0.4, 0.84)).toBeCloseTo(360, 9);
    expect(fitFontPx(600, { x: 0, y: 0, w: -10, h: 900 }, 0.4, 0.84)).toBe(0);
  });
});

describe('alphaPlane (spec 4.8.5)', () => {
  it('extracts byte 3 of every RGBA pixel', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 10, 255, 255, 255, 20, 1, 2, 3, 30, 0, 0, 0, 40]);
    expect(Array.from(alphaPlane({ data, width: 2, height: 2 }))).toEqual([10, 20, 30, 40]);
  });
});

describe('rasterizeMask (spec 4.8.2-4.8.4)', () => {
  it('covers the whole field at 2 texels per cell', () => {
    const { factory } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    expect([plane.width, plane.height, plane.data.length]).toEqual([576, 360, 576 * 360]);
    expect(plane.fontPx).toBeCloseTo(201.6, 9);
  });

  it('centres the ink box on the box centre within one texel', () => {
    const { factory } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 288)).toBeLessThanOrEqual(1); // 720 CSS px x 0.4 texels per CSS px
    expect(Math.abs(c.y - 180)).toBeLessThanOrEqual(1);
  });

  it('draws 700 weight in MASK_FONT_FAMILY at fontPx x 2 / cellCss texels, centred, on the alphabetic baseline', () => {
    const { factory, contexts } = createFakeCanvasFactory();
    rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    const ctx = contexts[0];
    expect(ctx.fillTextCalls).toHaveLength(1);
    const call = ctx.fillTextCalls[0];
    const m = /^700 ([\d.]+)px (.+)$/.exec(call.font);
    expect(m?.[2]).toBe('"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
    expect(Number(m?.[1])).toBeCloseTo(80.64, 6); // 201.6 x 2 / 5
    expect(ctx.textAlign).toBe('center');
    expect(ctx.textBaseline).toBe('alphabetic');
    expect(call.x).toBeCloseTo(288, 9);
    expect(call.y).toBeCloseTo(180 + (0.7 * 80.64) / 2, 6); // cy + (ascent - descent) / 2
  });

  it('uses ascent 0.73 x size and descent 0 when measureText has no actualBoundingBox* (11.31)', () => {
    const { factory, contexts } = createFakeCanvasFactory({ boundingBox: false });
    rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    expect(contexts[0].fillTextCalls[0].y).toBeCloseTo(180 + (0.73 * 80.64) / 2, 6);
  });

  it('scales the name to the 390 x 236.32 phone band: 54.6 px, centred (3.4.6)', () => {
    const g = computeGrid(390, 236.32, 3, 2);
    const { factory } = createFakeCanvasFactory();
    const box = maskBoxFor('entry', { w: 390, h: 236.32 }, null, true);
    const plane = rasterizeMask('Parsa Naji', box, { cols: g.cols, rows: g.rows, cellCss: g.cellCss, supersample: 2 }, FONT, MASK, factory);
    expect([plane.width, plane.height]).toEqual([390, 238]);
    expect(plane.fontPx).toBeCloseTo(54.6, 9);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 195)).toBeLessThanOrEqual(1);
    expect(Math.abs(c.y - 118.16)).toBeLessThanOrEqual(1);
  });

  it('places the Konami text in the box right of the scrim: a 137.2 px "nice." centred at x = 1195', () => {
    const { factory } = createFakeCanvasFactory();
    const box = maskBoxFor('konami', { w: 1440, h: 900 }, 950, false);
    const plane = rasterizeMask('nice.', box, DESKTOP, FONT, MASK, factory);
    expect(plane.fontPx).toBeCloseTo(137.2, 9);
    expect(Math.abs(inkCentre(plane).x - 1195 * 0.4)).toBeLessThanOrEqual(1);
  });

  it('throws when the canvas has no 2D context', () => {
    expect(() =>
      rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 10, h: 10 }, DESKTOP, FONT, MASK, () => ({ width: 1, height: 1, getContext: () => null })),
    ).toThrow('2d context unavailable');
  });
});

describe('maskBoxFor (spec 3.4.6, 3.4.11)', () => {
  it('gives the entry the whole field', () => {
    expect(maskBoxFor('entry', { w: 1440, h: 900 }, 950, false)).toEqual({ x: 0, y: 0, w: 1440, h: 900 });
  });

  it('gives Konami the part right of the scrim in the rail layout', () => {
    expect(maskBoxFor('konami', { w: 1440, h: 900 }, 950, false)).toEqual({ x: 950, y: 0, w: 490, h: 900 });
  });

  it('gives Konami the whole band in the band layout', () => {
    expect(maskBoxFor('konami', { w: 390, h: 236 }, null, true)).toEqual({ x: 0, y: 0, w: 390, h: 236 });
  });

  it('clamps a scrim edge past the field to an empty box', () => {
    expect(maskBoxFor('konami', { w: 760, h: 700 }, 762, false)).toEqual({ x: 760, y: 0, w: 0, h: 700 });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/nameMask.test.ts`
Expected:
```
 FAIL  tests/nameMask.test.ts [ tests/nameMask.test.ts ]
Error: Cannot find module '../src/field/nameMask' imported from …/tests/nameMask.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```
(`tests/helpers/fakeCanvas.ts` only has a type import, which is erased at run time, so it does not fail first. Do not run `npm run typecheck` until Step 5.)

- [ ] **Step 4: Move the sampler and rewrite it as `src/field/nameMask.ts` (spec 4.8.1–4.8.5, 3.4.6, 3.4.11)**

```bash
git mv src/engine/sampler.ts src/field/nameMask.ts
```
Then replace the whole content of `src/field/nameMask.ts` with exactly this (kept from the sampler: `Context2DLike`, `Canvas2DLike`, `CanvasFactory` and the injected-canvas testability; dropped: `layoutText`, `makeMeasure`, `drawSpaced`, `rasterize`, `scanAlpha`, `subsampleToN`, `glyphCenters`, `sampleText` and their types):
```ts
import type { FieldParams } from './params';

export interface Context2DLike {
  font: string;
  textBaseline: string;
  textAlign: string;
  fillStyle: string;
  /** present in modern browsers; absent on older Safari and on test fakes that emulate it */
  letterSpacing?: string;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number; actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number };
  getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
}

export interface Canvas2DLike {
  width: number;
  height: number;
  getContext(type: '2d'): Context2DLike | null;
}

export type CanvasFactory = (w: number, h: number) => Canvas2DLike;

/** Spec 3.4.3 / 4.8.3: JetBrains Mono, then the fallback stack used when the font has not settled. */
export const MASK_FONT_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** A box in field-space CSS px (origin at the canvas's top-left, y down). */
export interface MaskBox { x: number; y: number; w: number; h: number }
/** The current grid (cols, rows, `cellCss` = Grid.cellCss = uCell) and the texels per cell (2). */
export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number }
/** R8 coverage, row 0 = the top of the field; `fontPx` is the CSS font size the text was fitted to. */
export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }

/** JetBrains Mono's cap height: the ascent used when measureText has no actualBoundingBox* (4.8.4, 11.31). */
const FALLBACK_ASCENT_EM = 0.73;

/** Spec 4.8.3: min(heightFrac × box.h, widthFrac × box.w × 100 / widthAt100), never negative. */
export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number {
  const byHeight = heightFrac * Math.max(0, box.h);
  if (!(widthAt100 > 0)) return byHeight;
  return Math.min(byHeight, (widthFrac * Math.max(0, box.w) * 100) / widthAt100);
}

/** Spec 4.8.5: byte 3 (alpha) of every RGBA pixel, as the R8 plane. */
export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array {
  const n = img.width * img.height;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = img.data[i * 4 + 3];
  return out;
}

/**
 * Spec 4.8.2–4.8.4: white text on a transparent canvas of supersample × cols by supersample × rows texels
 * covering the whole field (one texel = cellCss / supersample CSS px), centred on the box by its ink box.
 * Throws when the factory's canvas has no 2D context.
 */
export function rasterizeMask(
  text: string,
  box: MaskBox,
  grid: MaskGrid,
  font: { family: string; weight: number },
  p: FieldParams['mask'],
  create: CanvasFactory,
): MaskPlane {
  const width = Math.max(1, grid.supersample * grid.cols);
  const height = Math.max(1, grid.supersample * grid.rows);
  const canvas = create(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const s = grid.supersample / grid.cellCss; // texels per CSS px
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${font.weight} 100px ${font.family}`;
  const fontPx = fitFontPx(ctx.measureText(text).width, box, p.heightFrac, p.widthFrac);
  const size = fontPx * s;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(text);
  const ascent = typeof m.actualBoundingBoxAscent === 'number' ? m.actualBoundingBoxAscent : FALLBACK_ASCENT_EM * size;
  const descent = typeof m.actualBoundingBoxDescent === 'number' ? m.actualBoundingBoxDescent : 0;
  const cx = (box.x + box.w / 2) * s;
  const cy = (box.y + box.h / 2) * s;
  if (size > 0) ctx.fillText(text, cx, cy + (ascent - descent) / 2);
  return { data: alphaPlane(ctx.getImageData(0, 0, width, height)), width, height, fontPx };
}

/**
 * Spec 3.4.6 and 3.4.11: the entry uses the whole field; Konami uses the whole field on the band, else the
 * part right of the scrim's clear edge (clamped to the field, so a scrim wider than the field gives w = 0).
 */
export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox {
  if (kind === 'entry' || band || scrimRight === null) return { x: 0, y: 0, w: field.w, h: field.h };
  const x = Math.min(field.w, Math.max(0, scrimRight));
  return { x, y: 0, w: field.w - x, h: field.h };
}
```
Then retire the last engine file (its only importer was the sampler):
```bash
git rm -q src/engine/types.ts
ls src/engine 2>&1; grep -rnE "from '[./]+(src/)?engine/" src tests || echo "no engine imports left"
```
Expected: `ls: cannot access 'src/engine': No such file or directory` and `no engine imports left`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/nameMask.test.ts`
Expected:
```
 Test Files  1 passed (1)
      Tests  15 passed (15)
```

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  21 passed (21)`, `Tests  188 passed (188)` (Task 10 plus 1 file and 15 tests; `tests/helpers/fakeCanvas.ts` is not a test file); typecheck prints no diagnostics (the fake canvas now type-checks against `nameMask.ts`); build succeeds with the Task 8 JS size.

- [ ] **Step 7: Commit**

```bash
git add src/field/nameMask.ts tests/nameMask.test.ts tests/helpers/fakeCanvas.ts
git status --short
git commit -m "feat(field): name-mask rasteriser replaces the particle sampler

Text becomes an R8 coverage plane at 2 texels per cell over the whole
field, fitted by the Blueprint box rule and centred on its ink box;
mask boxes for the entry and Konami. src/engine/ is gone.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
`git status --short` before the commit shows `R  src/engine/sampler.ts -> src/field/nameMask.ts` (git keeps the rename when the similarity allows it; a delete plus add is acceptable), `D  src/engine/types.ts`, `M  tests/helpers/fakeCanvas.ts`, `A  tests/nameMask.test.ts`.

---

### Task 12: WebGL2 context, programs and targets

- **Files:** Create `src/gl/context.ts`, `src/gl/program.ts`, `src/gl/targets.ts`, `tests/glContext.test.ts`, `tests/program.test.ts`.
- **Interfaces:**
  - Consumes: none.
  - Produces:
    ```ts
    // src/gl/context.ts
    export const GL_ATTRIBUTES: WebGLContextAttributes = {
      alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
    };
    export function createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs?: WebGLContextAttributes): WebGL2RenderingContext | null; // never throws

    // src/gl/program.ts
    export const GLSL_HEADER_FRAG = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
    export const GLSL_HEADER_VERT = '#version 300 es\n';
    export interface ProgramHandle { program: WebGLProgram; uniforms: Readonly<Record<string, WebGLUniformLocation>> }
    export interface PendingProgram { ready(): boolean; finish(): ProgramHandle } // finish() throws ShaderError
    export class ShaderError extends Error { readonly log: string; constructor(message: string, log: string) }
    export function startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram;
    export function uniformMap(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation>; // "uRipples[0]" -> "uRipples"

    // src/gl/targets.ts
    export interface SurfaceTarget { tex: WebGLTexture; fbo: WebGLFramebuffer; cols: number; rows: number }
    export function createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget; // RGBA8, NEAREST, CLAMP; throws if incomplete
    export function createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture; // R8, LINEAR, CLAMP
    export function createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer };
    export function deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void;
    ```
    `startProgram` binds attribute 0 to `aPos` before linking; `ready()` polls `COMPLETION_STATUS_KHR` when `parallel` is given and is `true` without it; `finish()` checks compile and link status once and throws `ShaderError` with the info log. `createMaskTexture` uploads with `UNPACK_ALIGNMENT 1` and no FLIP_Y or PREMULTIPLY_ALPHA (4.5.7). The triangle is `[-1, -1, 3, -1, -1, 3]`, `STATIC_DRAW`.

- [ ] **Step 1: Write the failing tests**

`tests/glContext.test.ts` (the context cases of 8.1.15, plus the `targets.ts` contracts the renderer relies on: an incomplete FBO throws and cleans up, the mask upload never sets FLIP_Y or PREMULTIPLY):
```ts
import { describe, expect, it } from 'vitest';
import { GL_ATTRIBUTES, createContext } from '../src/gl/context';
import { createFullscreenTriangle, createMaskTexture, createSurfaceTarget, deleteSurfaceTarget } from '../src/gl/targets';

type Canvas = Pick<HTMLCanvasElement, 'getContext'>;
const canvasReturning = (getContext: (type: string, attrs: unknown) => unknown): Canvas => ({ getContext }) as unknown as Canvas;

describe('createContext (spec 3.6.2)', () => {
  it('requests webgl2 with GL_ATTRIBUTES and returns the context', () => {
    const gl = { tag: 'gl' };
    const calls: [string, unknown][] = [];
    const ctx = createContext(
      canvasReturning((type, attrs) => {
        calls.push([type, attrs]);
        return gl;
      }),
    );
    expect(ctx).toBe(gl);
    expect(calls).toEqual([['webgl2', GL_ATTRIBUTES]]);
  });

  it('returns null when getContext returns null', () => {
    expect(createContext(canvasReturning(() => null))).toBeNull();
  });

  it('returns null when getContext throws', () => {
    expect(
      createContext(
        canvasReturning(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBeNull();
  });

  it('GL_ATTRIBUTES is exactly the spec 4.3 object', () => {
    expect(GL_ATTRIBUTES).toEqual({
      alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
    });
  });
});

/** Records every call on a fake WebGL2 context; `fbStatus` is what checkFramebufferStatus returns. */
function recordingGl(fbStatus = 0x8cd5) {
  const calls: [string, ...unknown[]][] = [];
  let next = 0;
  const C = {
    TEXTURE_2D: 0x0de1, TEXTURE0: 0x84c0, TEXTURE1: 0x84c1, RGBA8: 0x8058, R8: 0x8229, RED: 0x1903, UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600, LINEAR: 0x2601, CLAMP_TO_EDGE: 0x812f, TEXTURE_MIN_FILTER: 0x2801, TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802, TEXTURE_WRAP_T: 0x2803, FRAMEBUFFER: 0x8d40, COLOR_ATTACHMENT0: 0x8ce0, FRAMEBUFFER_COMPLETE: 0x8cd5,
    UNPACK_ALIGNMENT: 0x0cf5, UNPACK_FLIP_Y_WEBGL: 0x9240, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241, ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4, FLOAT: 0x1406,
  };
  const gl = new Proxy(C as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
        if (prop.startsWith('create')) return { id: ++next, kind: prop };
        if (prop === 'checkFramebufferStatus') return fbStatus;
        return undefined;
      };
    },
  }) as unknown as WebGL2RenderingContext;
  return { gl, calls, C };
}

describe('createSurfaceTarget (spec 4.5.2)', () => {
  it('allocates an RGBA8 cols x rows texture, NEAREST and CLAMP_TO_EDGE, on unit 0, attached to an FBO', () => {
    const { gl, calls, C } = recordingGl();
    const t = createSurfaceTarget(gl, 288, 180);
    expect([t.cols, t.rows]).toEqual([288, 180]);
    expect(calls).toContainEqual(['activeTexture', C.TEXTURE0]);
    expect(calls).toContainEqual(['texStorage2D', C.TEXTURE_2D, 1, C.RGBA8, 288, 180]);
    for (const pname of [C.TEXTURE_MIN_FILTER, C.TEXTURE_MAG_FILTER]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.NEAREST]);
    for (const pname of [C.TEXTURE_WRAP_S, C.TEXTURE_WRAP_T]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.CLAMP_TO_EDGE]);
    expect(calls).toContainEqual(['framebufferTexture2D', C.FRAMEBUFFER, C.COLOR_ATTACHMENT0, C.TEXTURE_2D, t.tex, 0]);
    expect(calls.at(-1)).toEqual(['bindFramebuffer', C.FRAMEBUFFER, null]);
  });

  it('throws and deletes both objects when the framebuffer is incomplete', () => {
    const { gl, calls } = recordingGl(0x8cd6);
    expect(() => createSurfaceTarget(gl, 4, 4)).toThrow('surface framebuffer incomplete');
    expect(calls.map((c) => c[0])).toEqual(expect.arrayContaining(['deleteFramebuffer', 'deleteTexture']));
  });

  it('deleteSurfaceTarget deletes the FBO and the texture', () => {
    const { gl, calls } = recordingGl();
    const t = createSurfaceTarget(gl, 2, 2);
    deleteSurfaceTarget(gl, t);
    expect(calls.slice(-2)).toEqual([
      ['deleteFramebuffer', t.fbo],
      ['deleteTexture', t.tex],
    ]);
  });
});

describe('createMaskTexture (spec 4.5.7)', () => {
  it('uploads an R8 plane to unit 1 with UNPACK_ALIGNMENT 1, LINEAR, CLAMP_TO_EDGE and no FLIP_Y or PREMULTIPLY', () => {
    const { gl, calls, C } = recordingGl();
    const plane = new Uint8Array(6 * 4);
    createMaskTexture(gl, 6, 4, plane);
    expect(calls).toContainEqual(['activeTexture', C.TEXTURE1]);
    expect(calls).toContainEqual(['texStorage2D', C.TEXTURE_2D, 1, C.R8, 6, 4]);
    expect(calls).toContainEqual(['pixelStorei', C.UNPACK_ALIGNMENT, 1]);
    expect(calls).toContainEqual(['texSubImage2D', C.TEXTURE_2D, 0, 0, 0, 6, 4, C.RED, C.UNSIGNED_BYTE, plane]);
    for (const pname of [C.TEXTURE_MIN_FILTER, C.TEXTURE_MAG_FILTER]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.LINEAR]);
    const pixelStores = calls.filter((c) => c[0] === 'pixelStorei').map((c) => c[1]);
    expect(pixelStores).not.toContain(C.UNPACK_FLIP_Y_WEBGL);
    expect(pixelStores).not.toContain(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  });
});

describe('createFullscreenTriangle (spec 4.5.1)', () => {
  it('binds [-1, -1, 3, -1, -1, 3] as STATIC_DRAW to attribute 0', () => {
    const { gl, calls, C } = recordingGl();
    const { vao } = createFullscreenTriangle(gl);
    const data = calls.find((c) => c[0] === 'bufferData');
    expect(Array.from(data?.[2] as Float32Array)).toEqual([-1, -1, 3, -1, -1, 3]);
    expect(data?.[3]).toBe(C.STATIC_DRAW);
    expect(calls).toContainEqual(['bindVertexArray', vao]);
    expect(calls).toContainEqual(['enableVertexAttribArray', 0]);
    expect(calls).toContainEqual(['vertexAttribPointer', 0, 2, C.FLOAT, false, 0, 0]);
  });
});
```

`tests/program.test.ts` (a fake context records the call order; no status query may happen at start, risk 9.6):
```ts
import { describe, expect, it } from 'vitest';
import { GLSL_HEADER_FRAG, GLSL_HEADER_VERT, ShaderError, startProgram, uniformMap } from '../src/gl/program';

const COMPLETION_STATUS_KHR = 0x91b1;

interface FakeOptions {
  vertOk?: boolean;
  fragOk?: boolean;
  linkOk?: boolean;
  uniforms?: string[];
  /** COMPLETION_STATUS_KHR answers, consumed one per query */
  completion?: boolean[];
}

/** A fake WebGL2 context with just the program API, recording the order of calls. */
function fakeGl(o: FakeOptions = {}) {
  const log: string[] = [];
  const sources: string[] = [];
  const completion = [...(o.completion ?? [])];
  let id = 0;
  const shaders = new Map<object, number>();
  const gl = {
    VERTEX_SHADER: 0x8b31, FRAGMENT_SHADER: 0x8b30, COMPILE_STATUS: 0x8b81, LINK_STATUS: 0x8b82, ACTIVE_UNIFORMS: 0x8b86,
    createShader(type: number) {
      const s = { id: ++id };
      shaders.set(s, type);
      return s;
    },
    createProgram: () => ({ id: ++id }),
    shaderSource: (_s: object, src: string) => void sources.push(src),
    compileShader: () => void log.push('compileShader'),
    attachShader: () => void log.push('attachShader'),
    bindAttribLocation: (_p: object, index: number, name: string) => void log.push(`bindAttribLocation ${index} ${name}`),
    linkProgram: () => void log.push('linkProgram'),
    getShaderParameter(s: object) {
      log.push('getShaderParameter');
      return shaders.get(s) === 0x8b31 ? (o.vertOk ?? true) : (o.fragOk ?? true);
    },
    getShaderInfoLog: (s: object) => (shaders.get(s) === 0x8b31 ? 'vert log' : "ERROR: 0:12: 'uOops' : undeclared identifier"),
    getProgramParameter(_p: object, pname: number) {
      log.push(`getProgramParameter ${pname.toString(16)}`);
      if (pname === 0x8b82) return (o.vertOk ?? true) && (o.fragOk ?? true) && (o.linkOk ?? true);
      if (pname === 0x8b86) return (o.uniforms ?? []).length;
      if (pname === COMPLETION_STATUS_KHR) return completion.shift() ?? true;
      return null;
    },
    getProgramInfoLog: () => 'link log: varying mismatch',
    getActiveUniform: (_p: object, i: number) => ({ name: (o.uniforms ?? [])[i], size: 1, type: 0 }),
    getUniformLocation: (_p: object, name: string) => ({ name }),
    detachShader: () => void log.push('detachShader'),
    deleteShader: () => void log.push('deleteShader'),
    deleteProgram: () => void log.push('deleteProgram'),
  };
  return { gl: gl as unknown as WebGL2RenderingContext, log, sources };
}

const parallel = { COMPLETION_STATUS_KHR } as KHR_parallel_shader_compile;

describe('GLSL headers (spec 4.3)', () => {
  it('are exact', () => {
    expect(GLSL_HEADER_FRAG).toBe('#version 300 es\nprecision highp float;\nprecision highp int;\n');
    expect(GLSL_HEADER_VERT).toBe('#version 300 es\n');
  });
});

describe('startProgram', () => {
  it('prepends the headers and binds attribute 0 to aPos before linking (4.5.1)', () => {
    const { gl, log, sources } = fakeGl();
    startProgram(gl, 'VERT', 'FRAG', null);
    expect(sources).toEqual([`${GLSL_HEADER_VERT}VERT`, `${GLSL_HEADER_FRAG}FRAG`]);
    expect(log.indexOf('bindAttribLocation 0 aPos')).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('bindAttribLocation 0 aPos')).toBeLessThan(log.indexOf('linkProgram'));
    expect(log.some((l) => l.startsWith('get'))).toBe(false); // no status query at start (risk 9.6)
  });

  it('is ready at once without KHR_parallel_shader_compile', () => {
    const { gl } = fakeGl();
    expect(startProgram(gl, 'v', 'f', null).ready()).toBe(true);
  });

  it('polls COMPLETION_STATUS_KHR with the extension', () => {
    const { gl, log } = fakeGl({ completion: [false, false, true] });
    const p = startProgram(gl, 'v', 'f', parallel);
    expect([p.ready(), p.ready(), p.ready()]).toEqual([false, false, true]);
    expect(log.filter((l) => l === `getProgramParameter ${COMPLETION_STATUS_KHR.toString(16)}`)).toHaveLength(3);
  });

  it('finish() returns the program and its uniform map once linked, checking the status once', () => {
    const { gl, log } = fakeGl({ uniforms: ['uCell', 'uRipples[0]'] });
    const p = startProgram(gl, 'v', 'f', null);
    const h = p.finish();
    expect(Object.keys(h.uniforms)).toEqual(['uCell', 'uRipples']);
    expect(p.finish()).toBe(h);
    expect(log.filter((l) => l === 'getProgramParameter 8b82')).toHaveLength(1);
  });

  it('turns a compile failure into a ShaderError carrying the info log', () => {
    const { gl, log } = fakeGl({ fragOk: false });
    const p = startProgram(gl, 'v', 'f', null);
    let caught: unknown;
    try {
      p.finish();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ShaderError);
    expect((caught as ShaderError).message).toBe('fragment shader failed to compile');
    expect((caught as ShaderError).log).toContain("'uOops' : undeclared identifier");
    expect(() => p.finish()).toThrow(caught as ShaderError); // same error on every later call
    expect(log).toContain('deleteProgram');
  });

  it('turns a link failure into a ShaderError carrying the program log', () => {
    const { gl } = fakeGl({ linkOk: false });
    const p = startProgram(gl, 'v', 'f', null);
    expect(() => p.finish()).toThrow(ShaderError);
    try {
      p.finish();
    } catch (error) {
      expect((error as ShaderError).message).toBe('program failed to link');
      expect((error as ShaderError).log).toBe('link log: varying mismatch');
    }
  });

  it('reports a context that cannot create objects as a ShaderError instead of throwing at start', () => {
    const { gl } = fakeGl();
    (gl as unknown as { createShader: () => null }).createShader = () => null;
    const p = startProgram(gl, 'v', 'f', null);
    expect(p.ready()).toBe(true);
    expect(() => p.finish()).toThrow(ShaderError);
  });
});

describe('uniformMap', () => {
  it('strips the [0] suffix of array uniforms', () => {
    const { gl } = fakeGl({ uniforms: ['uCell', 'uRipples[0]', 'uMask'] });
    const map = uniformMap(gl, {} as WebGLProgram);
    expect(Object.keys(map)).toEqual(['uCell', 'uRipples', 'uMask']);
    expect(map.uRipples).toEqual({ name: 'uRipples[0]' });
  });
});

describe('ShaderError', () => {
  it('is an Error with a name and a log', () => {
    const e = new ShaderError('boom', 'details');
    expect(e).toBeInstanceOf(Error);
    expect([e.name, e.message, e.log]).toEqual(['ShaderError', 'boom', 'details']);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/glContext.test.ts tests/program.test.ts`
Expected:
```
 FAIL  tests/glContext.test.ts [ tests/glContext.test.ts ]
Error: Cannot find module '../src/gl/context' imported from …/tests/glContext.test.ts
 FAIL  tests/program.test.ts [ tests/program.test.ts ]
Error: Cannot find module '../src/gl/program' imported from …/tests/program.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

- [ ] **Step 3: Write `src/gl/context.ts` (spec 4.3, 3.6.2, risk 9.10)**

```ts
/** Spec 4.3 / 3.6.2: no alpha, no AA, no depth or stencil; software GL counts as no WebGL2. */
export const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
  preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
};

/** The page's one WebGL2 context, or null (no WebGL2, a major performance caveat, or a throwing getContext). Never throws. */
export function createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs: WebGLContextAttributes = GL_ATTRIBUTES): WebGL2RenderingContext | null {
  try {
    return canvas.getContext('webgl2', attrs) ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Write `src/gl/program.ts` (spec 4.5.1, 4.7.4 step 5, 3.6.2, risk 9.6)**

`finish()` asks for `LINK_STATUS` first and reads the compile statuses only when the link failed (the KHR_parallel_shader_compile pattern: one blocking query on success). A context that cannot create objects (lost) becomes a `ShaderError` at `finish()`, never a throw from `startProgram`.
```ts
export const GLSL_HEADER_FRAG = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
export const GLSL_HEADER_VERT = '#version 300 es\n';

export interface ProgramHandle { program: WebGLProgram; uniforms: Readonly<Record<string, WebGLUniformLocation>> }
export interface PendingProgram { ready(): boolean; finish(): ProgramHandle } // finish() throws ShaderError

/** A compile or link failure; `log` carries the driver's info log (DEV diagnostics, never logged in production). */
export class ShaderError extends Error {
  readonly log: string;
  constructor(message: string, log: string) {
    super(message);
    this.name = 'ShaderError';
    this.log = log;
  }
}

/** Active uniforms by name; array uniforms drop their "[0]" suffix ("uRipples[0]" -> "uRipples"). */
export function uniformMap(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation> {
  const out: Record<string, WebGLUniformLocation> = {};
  const n = Number(gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)) || 0;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const loc = gl.getUniformLocation(program, info.name);
    if (loc) out[info.name.replace(/\[0\]$/, '')] = loc;
  }
  return out;
}

/**
 * Starts compiling and linking without querying any status (spec 4.7.4 step 5, risk 9.6). With
 * KHR_parallel_shader_compile, ready() polls COMPLETION_STATUS_KHR; without it ready() is true and the
 * caller must call finish() inside an animation frame after first paint. finish() checks the statuses
 * once: later calls return the same handle or throw the same ShaderError.
 */
export function startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    const lost = new ShaderError('WebGL objects unavailable (context lost)', '');
    return { ready: () => true, finish: () => { throw lost; } };
  }
  gl.shaderSource(vs, GLSL_HEADER_VERT + vert);
  gl.shaderSource(fs, GLSL_HEADER_FRAG + frag);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPos'); // 4.5.1: attribute 0 before link
  gl.linkProgram(program);

  let result: ProgramHandle | ShaderError | null = null;
  const release = (): void => {
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
  const check = (): ProgramHandle | ShaderError => {
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      release();
      return { program, uniforms: uniformMap(gl, program) };
    }
    let error: ShaderError;
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) error = new ShaderError('vertex shader failed to compile', gl.getShaderInfoLog(vs) ?? '');
    else if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) error = new ShaderError('fragment shader failed to compile', gl.getShaderInfoLog(fs) ?? '');
    else error = new ShaderError('program failed to link', gl.getProgramInfoLog(program) ?? '');
    release();
    gl.deleteProgram(program);
    return error;
  };
  return {
    ready: () => result !== null || parallel === null || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR) === true,
    finish: () => {
      result ??= check();
      if (result instanceof ShaderError) throw result;
      return result;
    },
  };
}
```

- [ ] **Step 5: Write `src/gl/targets.ts` (spec 4.5.1, 4.5.2, 4.5.7, Appendix A §3.9)**

The surface target binds on unit 0 and the mask on unit 1 (pass 1 samples only unit 1, pass 2 only unit 0, so the FBO's texture is never sampled while it is the render target).
```ts
/** Pass 1's render target (spec 4.5.2, Appendix A §3.9): one RGBA8 texel per cell, .r = v. */
export interface SurfaceTarget { tex: WebGLTexture; fbo: WebGLFramebuffer; cols: number; rows: number }

/** RGBA8, NEAREST, CLAMP_TO_EDGE on texture unit 0. Throws (after cleaning up) when the FBO is incomplete. */
export function createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) throw new Error('surface target unavailable (context lost)');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, cols, rows);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!complete) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    throw new Error('surface framebuffer incomplete');
  }
  return { tex, fbo, cols, rows };
}

/** R8, LINEAR, CLAMP_TO_EDGE on texture unit 1; UNPACK_ALIGNMENT 1, no FLIP_Y or PREMULTIPLY_ALPHA (spec 4.5.7). */
export function createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('mask texture unavailable (context lost)');
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, w, h);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.UNSIGNED_BYTE, plane);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.activeTexture(gl.TEXTURE0);
  return tex;
}

/** One triangle covering clip space ([-1, -1, 3, -1, -1, 3], STATIC_DRAW) on attribute 0 (spec 4.5.1). */
export function createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer } {
  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  if (!vao || !vbo) throw new Error('fullscreen triangle unavailable (context lost)');
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { vao, vbo };
}

export function deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void {
  gl.deleteFramebuffer(t.fbo);
  gl.deleteTexture(t.tex);
}
```

- [ ] **Step 6: Run the new tests to verify they pass**

Run: `npx vitest run tests/glContext.test.ts tests/program.test.ts`
Expected:
```
 Test Files  2 passed (2)
      Tests  19 passed (19)
```
(glContext 9, program 10.)

- [ ] **Step 7: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  23 passed (23)`, `Tests  207 passed (207)` (Task 11 plus 2 files and 19 tests); typecheck prints no diagnostics; build succeeds with the Task 8 JS size.

- [ ] **Step 8: Commit**

```bash
git add src/gl/context.ts src/gl/program.ts src/gl/targets.ts tests/glContext.test.ts tests/program.test.ts
git commit -m "feat(gl): WebGL2 context, async programs and render targets

createContext never throws; programs compile and link without a status
query until ready() (KHR_parallel_shader_compile) and report failures
as ShaderError with the driver log; RGBA8 surface target, R8 mask
texture and the fullscreen triangle.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Frame loop and page lifecycle

- **Files:** Create `src/loop.ts`, `src/lifecycle.ts`, `tests/loop.test.ts`, `tests/lifecycle.test.ts`.
- **Interfaces:**
  - Consumes: Task 1 `clampDt(dtMs: number, maxMs?: number): number`.
  - Produces:
    ```ts
    // src/loop.ts
    export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }
    export function createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop;
    // onFrame returns false to idle; wake() schedules one frame; dt = clampDt(now - last); start() resets last

    // src/lifecycle.ts
    export interface LifecycleTarget {
      pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void; // P2
      reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
    }
    export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void;
    ```
  - Semantics: `running` is true from `start()` until `stop()`, including while idle; `wake()` is a no-op while stopped; the first frame after `start()` gets `dt = clampDt(0)`. `bindLifecycle` reads every browser API from `env` (`env.win.matchMedia`, `env.win.ResizeObserver`, `env.win.devicePixelRatio`, `env.doc.visibilityState`), never from globals, and tolerates a missing `ResizeObserver`. It wires: `visibilitychange` → `pause()` / `resume()`; `pagehide` → `pause()`; `pageshow` with `persisted` → `resume()`; canvas `webglcontextlost` → `preventDefault()` then `contextLost()`; `webglcontextrestored` → `contextRestored()`; `(prefers-reduced-motion: reduce)` change → `reducedChanged(matches)`; `(resolution: <dpr>dppx)` change → `dprChanged()`, re-armed with the new DPR; a `ResizeObserver` on the canvas (`{ box: 'device-pixel-content-box' }` when supported) → `resize(deviceBox)` from `devicePixelContentBoxSize[0]` (`inlineSize`, `blockSize`) or `null`. The returned function removes every listener and disconnects the observer.

- [ ] **Step 1: Write the failing tests**

`tests/loop.test.ts` (a manual rAF queue; `frame(now)` runs the callbacks queued so far):
```ts
import { describe, expect, it } from 'vitest';
import { createLoop } from '../src/loop';

/** A manual requestAnimationFrame: frame(now) runs the callbacks queued so far. */
function fakeRaf() {
  let nextId = 0;
  const queue = new Map<number, FrameRequestCallback>();
  return {
    raf: (cb: FrameRequestCallback): number => {
      queue.set(++nextId, cb);
      return nextId;
    },
    caf: (id: number): void => void queue.delete(id),
    frame(now: number): void {
      const due = [...queue.values()];
      queue.clear();
      for (const cb of due) cb(now);
    },
    get pending(): number {
      return queue.size;
    },
  };
}

describe('createLoop (spec 3.7.3, 3.7.4)', () => {
  it('passes clampDt(now - last) and the timestamp; the first frame after start() gets one 60 fps frame', () => {
    const r = fakeRaf();
    const seen: [number, number][] = [];
    const loop = createLoop((dt, now) => (seen.push([dt, now]), true), r.raf, r.caf);
    loop.start();
    r.frame(1000);
    r.frame(1016);
    r.frame(1116); // a 100 ms gap
    expect(seen[0][0]).toBeCloseTo(1000 / 60, 9);
    expect(seen[1]).toEqual([16, 1016]);
    expect(seen[2]).toEqual([50, 1116]); // clamped to 50 ms
  });

  it('start() after stop() resets the timestamp, so a hidden tab never catches up', () => {
    const r = fakeRaf();
    const dts: number[] = [];
    const loop = createLoop((dt) => (dts.push(dt), true), r.raf, r.caf);
    loop.start();
    r.frame(0);
    r.frame(16);
    loop.stop();
    loop.start();
    r.frame(60_000);
    expect(dts.at(-1)).toBeCloseTo(1000 / 60, 9);
  });

  it('idles when onFrame returns false and wake() runs exactly one more frame', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => (frames++, false), r.raf, r.caf);
    loop.start();
    r.frame(0);
    expect(r.pending).toBe(0); // idle: nothing scheduled
    expect(loop.running).toBe(true); // still running while idle
    loop.wake();
    loop.wake(); // a second wake before the frame does not double-schedule
    expect(r.pending).toBe(1);
    r.frame(16);
    r.frame(32);
    expect(frames).toBe(2);
  });

  it('wake() while stopped does nothing', () => {
    const r = fakeRaf();
    const loop = createLoop(() => true, r.raf, r.caf);
    loop.wake();
    expect(r.pending).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('stop() cancels the scheduled frame and running becomes false', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => (frames++, true), r.raf, r.caf);
    loop.start();
    expect(loop.running).toBe(true);
    loop.stop();
    expect(r.pending).toBe(0);
    r.frame(16);
    expect(frames).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('stopping from inside onFrame schedules nothing more', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => {
      frames++;
      loop.stop();
      return true;
    }, r.raf, r.caf);
    loop.start();
    r.frame(0);
    r.frame(16);
    expect(frames).toBe(1);
  });
});
```

`tests/lifecycle.test.ts` (`EventTarget` fakes for the window, document, canvas and media-query lists; a fake `ResizeObserver`; P8):
```ts
import { describe, expect, it } from 'vitest';
import { bindLifecycle, type LifecycleTarget } from '../src/lifecycle';

type Call = [keyof LifecycleTarget, ...unknown[]];

function recorder(): { t: LifecycleTarget; calls: Call[] } {
  const calls: Call[] = [];
  const t: LifecycleTarget = {
    pause: () => void calls.push(['pause']),
    resume: () => void calls.push(['resume']),
    resize: (box) => void calls.push(['resize', box]),
    dprChanged: () => void calls.push(['dprChanged']),
    reducedChanged: (r) => void calls.push(['reducedChanged', r]),
    contextLost: () => void calls.push(['contextLost']),
    contextRestored: () => void calls.push(['contextRestored']),
  };
  return { t, calls };
}

class FakeMql extends EventTarget {
  constructor(
    readonly media: string,
    public matches = false,
  ) {
    super();
  }
  listeners = 0;
  override addEventListener(type: string, cb: EventListenerOrEventListenerObject | null): void {
    this.listeners++;
    super.addEventListener(type, cb);
  }
  override removeEventListener(type: string, cb: EventListenerOrEventListenerObject | null): void {
    this.listeners--;
    super.removeEventListener(type, cb);
  }
}

class FakeResizeObserver {
  static last: FakeResizeObserver | null = null;
  static rejectBoxOption = false;
  observed: { target: unknown; options?: unknown }[] = [];
  disconnected = false;
  constructor(readonly cb: (entries: unknown[]) => void) {
    FakeResizeObserver.last = this;
  }
  observe(target: unknown, options?: { box?: string }): void {
    if (options && FakeResizeObserver.rejectBoxOption) throw new TypeError('unsupported box');
    this.observed.push({ target, options });
  }
  disconnect(): void {
    this.disconnected = true;
  }
}

function env(opts: { resizeObserver?: boolean } = {}) {
  const queries = new Map<string, FakeMql>();
  const win = Object.assign(new EventTarget(), {
    devicePixelRatio: 1,
    matchMedia: (q: string) => {
      const m = new FakeMql(q);
      queries.set(q, m);
      return m;
    },
    ResizeObserver: opts.resizeObserver === false ? undefined : FakeResizeObserver,
  });
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
  const canvas = new EventTarget();
  return {
    win,
    doc,
    canvas,
    queries,
    bound: { win: win as unknown as Window, doc: doc as unknown as Document, canvas: canvas as unknown as HTMLCanvasElement },
  };
}

const change = (matches: boolean): Event => Object.assign(new Event('change'), { matches });

describe('bindLifecycle (spec 3.6.3, 3.7)', () => {
  it('pauses when hidden and resumes when visible (3.7.3)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    e.doc.visibilityState = 'hidden';
    e.doc.dispatchEvent(new Event('visibilitychange'));
    e.doc.visibilityState = 'visible';
    e.doc.dispatchEvent(new Event('visibilitychange'));
    expect(calls).toEqual([['pause'], ['resume']]);
  });

  it('pauses on pagehide and resumes only on a persisted pageshow (3.7.5)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    e.win.dispatchEvent(new Event('pagehide'));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(calls).toEqual([['pause'], ['resume']]);
  });

  it('prevents the default of webglcontextlost and reports loss and restore (3.6.3)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const lost = new Event('webglcontextlost', { cancelable: true });
    e.canvas.dispatchEvent(lost);
    e.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(lost.defaultPrevented).toBe(true);
    expect(calls).toEqual([['contextLost'], ['contextRestored']]);
  });

  it('reports reduced-motion changes (3.6.4)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const rm = e.queries.get('(prefers-reduced-motion: reduce)');
    rm?.dispatchEvent(change(true));
    rm?.dispatchEvent(change(false));
    expect(calls).toEqual([
      ['reducedChanged', true],
      ['reducedChanged', false],
    ]);
  });

  it('reports a DPR change and re-arms the resolution query with the new DPR (3.7.2)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const first = e.queries.get('(resolution: 1dppx)');
    expect(first?.listeners).toBe(1);
    e.win.devicePixelRatio = 2;
    first?.dispatchEvent(change(false));
    expect(calls).toEqual([['dprChanged']]);
    expect(first?.listeners).toBe(0);
    const second = e.queries.get('(resolution: 2dppx)');
    expect(second?.listeners).toBe(1);
    second?.dispatchEvent(change(false));
    expect(calls).toEqual([['dprChanged'], ['dprChanged']]);
  });

  it('observes the canvas device-pixel-content-box and forwards devicePixelContentBoxSize (3.7.1)', () => {
    FakeResizeObserver.rejectBoxOption = false;
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const ro = FakeResizeObserver.last;
    expect(ro?.observed).toEqual([{ target: e.canvas, options: { box: 'device-pixel-content-box' } }]);
    ro?.cb([{ devicePixelContentBoxSize: [{ inlineSize: 1707, blockSize: 960 }] }]);
    ro?.cb([{}]); // Safari: no devicePixelContentBoxSize
    expect(calls).toEqual([
      ['resize', { w: 1707, h: 960 }],
      ['resize', null],
    ]);
  });

  it('falls back to a plain observe() when the box option is rejected', () => {
    FakeResizeObserver.rejectBoxOption = true;
    const e = env();
    bindLifecycle(recorder().t, e.bound);
    expect(FakeResizeObserver.last?.observed).toEqual([{ target: e.canvas, options: undefined }]);
    FakeResizeObserver.rejectBoxOption = false;
  });

  it('tolerates a missing ResizeObserver by listening to window resize', () => {
    const e = env({ resizeObserver: false });
    const { t, calls } = recorder();
    expect(() => bindLifecycle(t, e.bound)).not.toThrow();
    e.win.dispatchEvent(new Event('resize'));
    expect(calls).toEqual([['resize', null]]);
  });

  it('the returned function removes every listener and disconnects the observer', () => {
    const e = env();
    const { t, calls } = recorder();
    const unbind = bindLifecycle(t, e.bound);
    const ro = FakeResizeObserver.last;
    unbind();
    e.doc.dispatchEvent(new Event('visibilitychange'));
    e.win.dispatchEvent(new Event('pagehide'));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    e.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    e.canvas.dispatchEvent(new Event('webglcontextrestored'));
    e.queries.get('(prefers-reduced-motion: reduce)')?.dispatchEvent(change(true));
    expect(e.queries.get('(resolution: 1dppx)')?.listeners).toBe(0);
    expect(e.queries.get('(prefers-reduced-motion: reduce)')?.listeners).toBe(0);
    expect(ro?.disconnected).toBe(true);
    expect(calls).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/loop.test.ts tests/lifecycle.test.ts`
Expected:
```
 FAIL  tests/lifecycle.test.ts [ tests/lifecycle.test.ts ]
Error: Cannot find module '../src/lifecycle' imported from …/tests/lifecycle.test.ts
 FAIL  tests/loop.test.ts [ tests/loop.test.ts ]
Error: Cannot find module '../src/loop' imported from …/tests/loop.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

- [ ] **Step 3: Write `src/loop.ts` (spec 3.7.3, 3.7.4, 4.4.3, 6.1.5)**

```ts
import { clampDt } from './core/time';

export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }

/**
 * The rAF loop (spec 3.7.3, 3.7.4, 4.4.3). `onFrame(dt, now)` returns false to idle: no further frame is
 * requested until wake(). dt = clampDt(now - last), so a long gap costs at most 50 ms of sim time; start()
 * resets `last`, so the first frame after it gets clampDt(0) (one 60 fps frame). The rAF and cancel
 * functions default to the window's, looked up at call time.
 */
export function createLoop(
  onFrame: (dtMs: number, nowMs: number) => boolean,
  raf: (cb: FrameRequestCallback) => number = (cb) => requestAnimationFrame(cb),
  caf: (id: number) => void = (id) => cancelAnimationFrame(id),
): Loop {
  let running = false;
  let pending: number | null = null;
  let last: number | null = null;

  const tick = (now: number): void => {
    pending = null;
    if (!running) return;
    const dt = clampDt(last === null ? 0 : now - last);
    last = now;
    const more = onFrame(dt, now);
    if (more && running && pending === null) pending = raf(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = null;
      if (pending === null) pending = raf(tick);
    },
    stop() {
      running = false;
      last = null;
      if (pending !== null) caf(pending);
      pending = null;
    },
    wake() {
      if (running && pending === null) pending = raf(tick);
    },
    get running() {
      return running;
    },
  };
}
```

- [ ] **Step 4: Write `src/lifecycle.ts` (spec 3.6.3, 3.7.1, 3.7.2, 3.7.3, 3.7.5; P2)**

Without a `ResizeObserver` the window `resize` event drives `resize(null)` (tolerated, never thrown). An engine that rejects the `device-pixel-content-box` option gets a plain `observe()`.
```ts
/** What the page lifecycle drives (spec 3.6.3, 3.7). `resize` carries devicePixelContentBoxSize when known (P2). */
export interface LifecycleTarget {
  pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void;
  reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
}

/**
 * Wires visibility, bfcache, context loss, reduced motion, DPR and size changes to `t`. Every browser API
 * comes from `env`, never from globals. Returns a function that removes every listener.
 */
export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void {
  const { win, doc, canvas } = env;
  const offs: (() => void)[] = [];
  const on = (target: EventTarget, type: string, fn: (e: Event) => void): void => {
    target.addEventListener(type, fn);
    offs.push(() => target.removeEventListener(type, fn));
  };

  // 3.7.3 visibility, 3.7.5 bfcache
  on(doc, 'visibilitychange', () => (doc.visibilityState === 'hidden' ? t.pause() : t.resume()));
  on(win, 'pagehide', () => t.pause());
  on(win, 'pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) t.resume();
  });

  // 3.6.3 context loss: preventDefault() is what allows a restore
  on(canvas, 'webglcontextlost', (e) => {
    e.preventDefault();
    t.contextLost();
  });
  on(canvas, 'webglcontextrestored', () => t.contextRestored());

  // 3.6.4 reduced motion turning on or off mid-session
  on(win.matchMedia('(prefers-reduced-motion: reduce)'), 'change', (e) => t.reducedChanged((e as MediaQueryListEvent).matches));

  // 3.7.2 DPR change without a size change: one resolution query, re-armed with the new DPR after each change
  let dprQuery: MediaQueryList | null = null;
  const onDpr = (): void => {
    arm();
    t.dprChanged();
  };
  const arm = (): void => {
    dprQuery?.removeEventListener('change', onDpr);
    dprQuery = win.matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDpr);
  };
  arm();
  offs.push(() => dprQuery?.removeEventListener('change', onDpr));

  // 3.7.1 size: a ResizeObserver on the canvas, device-pixel-content-box when the engine supports it
  const RO = (win as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  if (typeof RO === 'function') {
    const ro = new RO((entries) => {
      const box = entries[entries.length - 1]?.devicePixelContentBoxSize?.[0];
      t.resize(box ? { w: box.inlineSize, h: box.blockSize } : null);
    });
    try {
      ro.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      ro.observe(canvas);
    }
    offs.push(() => ro.disconnect());
  } else {
    on(win, 'resize', () => t.resize(null));
  }

  return () => {
    for (const off of offs.splice(0)) off();
  };
}
```

- [ ] **Step 5: Run the new tests to verify they pass**

Run: `npx vitest run tests/loop.test.ts tests/lifecycle.test.ts`
Expected:
```
 Test Files  2 passed (2)
      Tests  15 passed (15)
```
(loop 6, lifecycle 9.)

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  25 passed (25)`, `Tests  222 passed (222)` (Task 12 plus 2 files and 15 tests); typecheck prints no diagnostics; build succeeds with the Task 8 JS size.

- [ ] **Step 7: Commit**

```bash
git add src/loop.ts src/lifecycle.ts tests/loop.test.ts tests/lifecycle.test.ts
git commit -m "feat(core): frame loop and page lifecycle

rAF loop with clamped dt, idle and wake; lifecycle binding for
visibility, bfcache, context loss, reduced motion, DPR changes and a
device-pixel-content-box ResizeObserver, all read from injected
browser objects.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Shaders and the two-pass renderer

- **Files:** Create `src/shaders/fullscreen.vert`, `src/shaders/noise.glsl`, `src/shaders/surface.frag`, `src/shaders/dither.frag` (exactly Appendix A §3.3–§3.6, no `#version` in the files), `src/field/renderer.ts`, `tests/shaders.test.ts`.
- **Interfaces:**
  - Consumes: Task 12 `GL_ATTRIBUTES`, `createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs?: WebGLContextAttributes): WebGL2RenderingContext | null`, `GLSL_HEADER_FRAG`, `GLSL_HEADER_VERT`, `ProgramHandle`, `PendingProgram`, `ShaderError`, `startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram`, `SurfaceTarget`, `createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget`, `createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture`, `createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer }`, `deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void`; Task 9 `FieldParams`, `Grid`; Task 11 `MaskPlane`; Task 8 `RGB`, `FieldColors`; Task 3 `NOISE_OFFSET`, `BAYER8` (test only).
  - Produces (`src/field/renderer.ts`):
    ```ts
    export const UNIFORMS_PASS1: readonly string[]; // uCell uZ uZm uCenter uBreath uPointer uWarp uRipples uRipple uMask uMaskSize uE uMaskMix uShape uLevel
    export const UNIFORMS_PASS2: readonly string[]; // uSurf uCellDev uCanvasH uField0 uField1 uField2 uField3 uTiers
    export type { FieldColors } from '../theme/theme'; // P1
    export interface FrameInputs {
      z: Float32Array; breath: number; center: [number, number];
      pointer: { x: number; y: number; radius: number; strength: number };
      ripples: Float32Array; rippleSigma: number; maskE: number; colors: FieldColors;
    }
    export class DitherRenderer {
      static create(canvas: HTMLCanvasElement, params: FieldParams): DitherRenderer | null; // never throws
      get ready(): boolean; get failed(): boolean; get lost(): boolean;
      clear(c: RGB): void;
      resize(grid: Grid): void;
      setMask(plane: MaskPlane | null): void;
      setParams(p: FieldParams): void;
      render(f: FrameInputs): void;    // exactly two drawArrays(TRIANGLES, 0, 3)
      restore(): boolean;
      dispose(): void;
      get gl(): WebGL2RenderingContext | null; // P4; null after dispose()
      readSurface(out: Uint8Array): boolean;   // P4; readPixels of the pass-1 target (cols × rows × 4 bytes, RGBA) after render(); false when not ready, lost or disposed
    }
    ```
  - Semantics: pass-1 texel `(i, j)` is `gl_FragCoord.xy` with row `j = 0` the top field row, so `readSurface` byte `(j × cols + i) × 4` is cell `(i, j)` with `.r = round(255 × v)`. `ready` polls both programs (inside an animation frame when the extension is absent), finishes them once, and on a `ShaderError` sets `failed`; `resize` sets `canvas.width/height`, recreates the target only when `cols` or `rows` change, sets the on-change uniforms, and sets `failed` when the FBO is incomplete; `setParams` writes `uWarp`, `uRipple.y`, `uMaskMix`, `uShape`, `uLevel`, `uTiers`; `setMask(null)` deletes the mask texture; `restore()` rebuilds programs, VAO, target and mask after `webglcontextrestored`.

- [ ] **Step 1: Write the failing test**

`tests/shaders.test.ts` (it reads the four shader files and checks them against `src/field/surface.ts` and the renderer's uniform lists; the hash check evaluates the GLSL `hash3` constants it parses with 32-bit unsigned arithmetic and compares bit for bit with Task 3's `hash3` on 1000 seeded triples, so it holds whatever formatting Task 3 used):
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import { DEFAULT_FIELD } from '../src/field/params';
import { UNIFORMS_PASS1, UNIFORMS_PASS2 } from '../src/field/renderer';
import { BAYER8, NOISE_OFFSET, hash3 } from '../src/field/surface';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const VERT = read('../src/shaders/fullscreen.vert');
const NOISE = read('../src/shaders/noise.glsl');
const SURFACE = read('../src/shaders/surface.frag');
const DITHER = read('../src/shaders/dither.frag');
const ALL = { 'fullscreen.vert': VERT, 'noise.glsl': NOISE, 'surface.frag': SURFACE, 'dither.frag': DITHER };

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

describe('dither.frag (spec 3.3.10, Appendix A §3.6)', () => {
  it('carries the BAYER8 matrix of surface.ts', () => {
    const literal = /int\[64\]\(([^)]*)\)/.exec(DITHER)?.[1] ?? '';
    expect(literal.split(',').map((s) => Number(s.trim()))).toEqual([...BAYER8]);
  });

  it('declares exactly UNIFORMS_PASS2', () => {
    expect(uniformsOf(DITHER)).toEqual([...UNIFORMS_PASS2]);
  });
});

describe('surface.frag (spec 3.3.4, 3.4.5, Appendix A §3.5)', () => {
  it('declares exactly UNIFORMS_PASS1', () => {
    expect(uniformsOf(SURFACE)).toEqual([...UNIFORMS_PASS1]);
  });

  it('has exactly one noise.glsl insertion marker', () => {
    expect(SURFACE.split('/* noise.glsl inserted here */')).toHaveLength(2);
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

describe('all four shader files (spec 4.5.8)', () => {
  it.each(Object.entries(ALL))('%s has no #version line (program.ts prepends the header) and no pow()', (_name, src) => {
    expect(src).not.toContain('#version');
    expect(src).not.toMatch(/\bpow\s*\(/);
  });

  it('the vertex shader reads attribute 0 as aPos', () => {
    expect(VERT).toContain('layout(location = 0) in vec2 aPos;');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/shaders.test.ts`
Expected:
```
 FAIL  tests/shaders.test.ts [ tests/shaders.test.ts ]
Error: Cannot find module '../src/field/renderer' imported from …/tests/shaders.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

- [ ] **Step 3: Write the four shader files, exactly Appendix A §3.3–§3.6 (spec 3.3.4, 3.3.5, 3.3.10, 3.4.5, 4.5.1, 4.5.3, 4.5.4, 4.5.8)**

No `#version` or `precision` lines: `startProgram` prepends `GLSL_HEADER_VERT` / `GLSL_HEADER_FRAG` (Task 12). `surface.frag` keeps Appendix A's `/* noise.glsl inserted here */` line; the renderer replaces it with `noise.glsl` (4.5.3: header + uniform block + noise + body). The files end with a newline.

`src/shaders/fullscreen.vert` (§3.3):
```glsl
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
```

`src/shaders/noise.glsl` (§3.4):
```glsl
const float OFFSET = 256.0;

// Blueprint hash (part-c.html) with z masked to 8 bits so the noise is periodic in z (period 256).
float hash3(uvec3 c) {
  uint h = (c.x * 374761393u) ^ (c.y * 668265263u) ^ ((c.z & 255u) * 1013904223u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  return float(h) * (1.0 / 4294967296.0);
}

// Blueprint noise3: trilinear value noise with a smoothstep fade. p.xy >= 0 (OFFSET), p.z in [0, 256).
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  uvec3 c = uvec3(i);
  float c000 = hash3(c);
  float c100 = hash3(c + uvec3(1u, 0u, 0u));
  float c010 = hash3(c + uvec3(0u, 1u, 0u));
  float c110 = hash3(c + uvec3(1u, 1u, 0u));
  float c001 = hash3(c + uvec3(0u, 0u, 1u));
  float c101 = hash3(c + uvec3(1u, 0u, 1u));
  float c011 = hash3(c + uvec3(0u, 1u, 1u));
  float c111 = hash3(c + uvec3(1u, 1u, 1u));
  return mix(mix(mix(c000, c100, f.x), mix(c010, c110, f.x), f.y),
             mix(mix(c001, c101, f.x), mix(c011, c111, f.x), f.y), f.z);
}

// Blueprint fbm: two octaves; z.x = z, z.y = the Blueprint's z * 1.4 + 3.1, both wrapped to [0, 256) on the CPU.
float fbm(vec2 p, vec2 z) {
  return 0.62 * noise3(vec3(p, z.x)) + 0.38 * noise3(vec3(p * 2.1 + vec2(7.3, 1.7), z.y));
}
```

`src/shaders/surface.frag` (§3.5, pass 1; the uniform values are spec 10.2 / Appendix A §3.7 and arrive from the renderer):
```glsl
uniform float uCell;        // CSS px per cell
uniform vec4  uZ;           // flowZ[0..3]: warp-x fbm (z, z2), warp-y fbm (z, z2)
uniform vec2  uZm;          // flowZ[4..5]: main fbm (z, z2)
uniform vec2  uCenter;      // field centre, CSS px (breath origin)
uniform float uBreath;      // domain scale, 1 +- breath amplitude
uniform vec4  uPointer;     // xy = eased pointer (CSS px, field space), z = radius R (CSS px), w = strength 0..1
uniform vec2  uWarp;        // x = warp factor (0.55), y = brightness boost (0.12)
uniform vec4  uRipples[8];  // xy = origin (CSS px), z = ring radius (CSS px), w = amplitude (0 = slot unused)
uniform vec2  uRipple;      // x = ring sigma (CSS px), y = gain (0.9)
uniform sampler2D uMask;    // R8 coverage of the name / egg text, LINEAR, CLAMP_TO_EDGE
uniform vec2  uMaskSize;    // CSS px covered by the mask texture
uniform float uE;           // mask progress 0..1 (0 = field only)
uniform vec4  uMaskMix;     // x = hold dim (0.3), y = ink floor (0.91), z = dissolve edge (0.08), w = melt px (48)
uniform vec3  uShape;       // x = warp scale px (240), y = main scale px (160), z = warp amplitude (2.6)
uniform vec2  uLevel;       // x = level (0.3), y = gain (2.1)

out vec4 outColor;

/* noise.glsl inserted here */

// Blueprint vAt(), raster + dither branch, at CSS-px sample s. warp returns (wx, wy) - 0.5 for the mask melt.
float surface(vec2 s, out vec2 warp) {
  vec2 a = s / uShape.x + OFFSET;
  float wx = fbm(a + vec2(3.1, 0.0), uZ.xy);
  float wy = fbm(a + vec2(0.0, 7.7), uZ.zw);
  warp = vec2(wx, wy) - 0.5;
  float v = fbm(s / uShape.y + OFFSET + warp * uShape.z, uZm);
  v = clamp((v - uLevel.x) * uLevel.y, 0.0, 1.0);
  return min(1.0, v * 0.7 + 0.4 * (1.0 - abs(1.0 - 2.0 * v)) * v);
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);                 // texel (i, j); row j = 0 is the top row of the field
  vec2 x = (vec2(cell) + 0.5) * uCell;                 // cell centre, CSS px, y down

  // pointer repel (Blueprint drawRaster): the sample point moves toward the pointer, so the surface spreads away
  vec2 xw = x;
  float f = 0.0;
  vec2 dp = x - uPointer.xy;
  float d = length(dp);
  if (uPointer.w > 0.0 && d < uPointer.z) {
    f = 1.0 - d / uPointer.z;
    f = f * f * (3.0 - 2.0 * f) * uPointer.w;
    xw = x - (dp / max(d, 1e-3)) * (f * uPointer.z * uWarp.x);
  }
  vec2 s = uCenter + (xw - uCenter) / uBreath;          // breath: slow domain zoom about the centre

  vec2 warp;
  float F = surface(s, warp);
  float v = F;

  if (uE > 0.0) {
    // dissolve: each cell flips between field and text at its own static noise threshold
    float theta = 0.6 * noise3(vec3(vec2(cell) * 0.08 + OFFSET, 17.0)) + 0.4 * hash3(uvec3(uvec2(cell), 91u));
    float w = uMaskMix.z;
    float k = smoothstep(theta - w, theta + w, uE * (1.0 + 2.0 * w) - w);
    float g = 1.0 - uE;
    float m = texture(uMask, (s + warp * (2.0 * uMaskMix.w * g * g)) / uMaskSize).r;
    float n = mix(uMaskMix.x * F, uMaskMix.y + (1.0 - uMaskMix.y) * F, m);
    v = mix(F, n, k);
  }

  v += f * uWarp.y;                                    // pointer brightness boost
  for (int r = 0; r < 8; r++) {                        // Shockwave rings
    vec4 R = uRipples[r];
    if (R.w <= 0.0) continue;
    float e = length(xw - R.xy) - R.z;
    v += exp(-(e * e) / (2.0 * uRipple.x * uRipple.x)) * R.w * uRipple.y;
  }
  outColor = vec4(min(v, 1.0), 0.0, 0.0, 1.0);
}
```

`src/shaders/dither.frag` (§3.6, pass 2):
```glsl
uniform sampler2D uSurf;    // pass-1 output, one texel per cell, .r = v
uniform float uCellDev;     // device px per cell (an integer value)
uniform float uCanvasH;     // drawing-buffer height, device px
uniform vec3  uField0;      // field-0 (off)
uniform vec3  uField1;      // field-1 (on, v <= uTiers.x)
uniform vec3  uField2;      // field-2 (on, uTiers.x < v <= uTiers.y)
uniform vec3  uField3;      // field-3 (on, v > uTiers.y)
uniform vec2  uTiers;       // 0.66, 0.9

out vec4 outColor;

const int BAYER8[64] = int[64](
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21);

void main() {
  ivec2 cell = ivec2(int(gl_FragCoord.x / uCellDev), int((uCanvasH - gl_FragCoord.y) / uCellDev));
  float v = texelFetch(uSurf, cell, 0).r;
  float th = (float(BAYER8[(cell.x & 7) | ((cell.y & 7) << 3)]) + 0.5) / 64.0;
  vec3 c = uField0;
  if (v > th) c = v > uTiers.y ? uField3 : (v > uTiers.x ? uField2 : uField1);
  outColor = vec4(c, 1.0);
}
```

- [ ] **Step 4: Write `src/field/renderer.ts` (spec 4.5, 3.3.12, 3.6.2, 3.6.3, 3.7.1, 3.7.8; P1, P4)**

What the code relies on, beyond the index: a 1 × 1 zero R8 texture stays bound on unit 1 while no mask exists, so pass 1's sampler never points at an empty unit; `uE` is uploaded as 0 while no mask is uploaded; the mask's CSS extent (`uMaskSize`) is fixed when `setMask` runs, so after a resize the old mask keeps its old extent until it is re-rasterised (3.7.1); `KHR_parallel_shader_compile` is fetched again on every (re)build, because extensions do not survive a context loss (without that, `ready` polls an unknown enum forever after `restore()`; found and fixed in the writer's browser run). The on-change uniforms (`uCell`, `uCellDev`, `uCanvasH` after a resize; `uWarp`, `uMaskMix`, `uShape`, `uLevel`, `uTiers` after `setParams`) are written in the next `render()`; `uRipple` is `(f.rippleSigma, params.ripple.gain)` every frame.
```ts
import { createContext } from '../gl/context';
import { startProgram, type PendingProgram, type ProgramHandle } from '../gl/program';
import { createFullscreenTriangle, createMaskTexture, createSurfaceTarget, deleteSurfaceTarget, type SurfaceTarget } from '../gl/targets';
import ditherFrag from '../shaders/dither.frag?raw';
import fullscreenVert from '../shaders/fullscreen.vert?raw';
import noiseGlsl from '../shaders/noise.glsl?raw';
import surfaceFrag from '../shaders/surface.frag?raw';
import type { FieldColors, RGB } from '../theme/theme';
import type { MaskPlane } from './nameMask';
import type { FieldParams } from './params';
import type { Grid } from './sizing';

export type { FieldColors } from '../theme/theme'; // P1

/** Pass-1 uniforms in declaration order (Appendix A §3.5, spec 10.2). */
export const UNIFORMS_PASS1: readonly string[] = Object.freeze([
  'uCell', 'uZ', 'uZm', 'uCenter', 'uBreath', 'uPointer', 'uWarp', 'uRipples', 'uRipple', 'uMask', 'uMaskSize', 'uE', 'uMaskMix', 'uShape', 'uLevel',
]);
/** Pass-2 uniforms in declaration order (Appendix A §3.6, spec 10.2). */
export const UNIFORMS_PASS2: readonly string[] = Object.freeze(['uSurf', 'uCellDev', 'uCanvasH', 'uField0', 'uField1', 'uField2', 'uField3', 'uTiers']);

/** Everything one frame uploads (spec 4.4.3 step 4). Field-space CSS px; `ripples` is 8 × vec4. */
export interface FrameInputs {
  z: Float32Array; breath: number; center: [number, number];
  pointer: { x: number; y: number; radius: number; strength: number };
  ripples: Float32Array; rippleSigma: number; maskE: number; colors: FieldColors;
}

const NOISE_MARKER = '/* noise.glsl inserted here */';
/** Spec 4.5.3: the uniform block, then noise.glsl, then the body; startProgram prepends GLSL_HEADER_FRAG. */
const PASS1_SOURCE = surfaceFrag.replace(NOISE_MARKER, noiseGlsl);
const EMPTY_MASK = new Uint8Array(1);

type Uniforms = Readonly<Record<string, WebGLUniformLocation>>;

/**
 * Owns every GL object of the field and draws it in two passes (spec 4.5): pass 1 evaluates one texel per cell
 * into the surface target, pass 2 dithers it to device pixels. Exactly two drawArrays(TRIANGLES, 0, 3) per render.
 */
export class DitherRenderer {
  private readonly canvas: HTMLCanvasElement;
  private glc: WebGL2RenderingContext | null;
  private params: FieldParams;
  private parallel: KHR_parallel_shader_compile | null = null;
  private pending: [PendingProgram, PendingProgram] | null = null;
  private p1: ProgramHandle | null = null;
  private p2: ProgramHandle | null = null;
  private tri: { vao: WebGLVertexArrayObject; vbo: WebGLBuffer } | null = null;
  private target: SurfaceTarget | null = null;
  private mask: WebGLTexture | null = null;
  private emptyMask: WebGLTexture | null = null;
  private maskPlane: MaskPlane | null = null;
  private maskSize: [number, number] = [1, 1];
  private gridValue: Grid | null = null;
  private gridDirty = true;
  private paramsDirty = true;
  private isReady = false;
  private isFailed = false;

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, params: FieldParams) {
    this.canvas = canvas;
    this.glc = gl;
    this.params = params;
    this.build(gl);
  }

  /** Context, triangle, empty mask and both programs started (async when the extension exists). Null on any failure. */
  static create(canvas: HTMLCanvasElement, params: FieldParams): DitherRenderer | null {
    try {
      const gl = createContext(canvas);
      return gl ? new DitherRenderer(canvas, gl, params) : null;
    } catch {
      return null;
    }
  }

  /**
   * Polls both programs and finishes them once (call it inside an animation frame: without
   * KHR_parallel_shader_compile, finish() blocks on the link). A ShaderError sets `failed`.
   */
  get ready(): boolean {
    if (this.isReady) return true;
    const gl = this.glc;
    if (this.isFailed || !gl || !this.pending || gl.isContextLost()) return false;
    const [a, b] = this.pending;
    if (!a.ready() || !b.ready()) return false;
    try {
      this.p1 = a.finish();
      this.p2 = b.finish();
    } catch {
      this.isFailed = true;
      return false;
    }
    this.pending = null;
    gl.useProgram(this.p1.program);
    gl.uniform1i(this.u1().uMask ?? null, 1); // pass 1 samples unit 1 only
    gl.useProgram(this.p2.program);
    gl.uniform1i(this.u2().uSurf ?? null, 0); // pass 2 samples unit 0 only
    this.gridDirty = true;
    this.paramsDirty = true;
    this.isReady = true;
    return true;
  }

  get failed(): boolean {
    return this.isFailed;
  }

  get lost(): boolean {
    return this.glc !== null && this.glc.isContextLost();
  }

  /** P4: the context for debug hooks; null after dispose(). */
  get gl(): WebGL2RenderingContext | null {
    return this.glc;
  }

  /** Spec 3.7.8: paints the drawing buffer one colour (field-0) before the first real frame. */
  clear(c: RGB): void {
    const gl = this.glc;
    if (!gl || gl.isContextLost()) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(c[0], c[1], c[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Spec 3.7.1: backing store = the device box; the surface target is recreated only when cols or rows change. */
  resize(grid: Grid): void {
    const gl = this.glc;
    if (!gl) return;
    if (this.canvas.width !== grid.widthDev) this.canvas.width = grid.widthDev;
    if (this.canvas.height !== grid.heightDev) this.canvas.height = grid.heightDev;
    this.gridValue = grid;
    this.gridDirty = true;
    if (gl.isContextLost() || (this.target && this.target.cols === grid.cols && this.target.rows === grid.rows)) return;
    if (this.target) deleteSurfaceTarget(gl, this.target);
    this.target = null;
    try {
      this.target = createSurfaceTarget(gl, grid.cols, grid.rows);
    } catch {
      this.isFailed = true; // 4.5.2: an incomplete FBO is the fallback
    }
  }

  /** Uploads (or with null deletes) the mask; its CSS extent is fixed to the grid it was rasterised for (3.7.1). */
  setMask(plane: MaskPlane | null): void {
    const gl = this.glc;
    this.maskPlane = plane;
    if (!gl) return;
    if (this.mask) gl.deleteTexture(this.mask);
    this.mask = null;
    if (!plane) return;
    const g = this.gridValue;
    const ss = this.params.mask.supersample;
    this.maskSize = g ? [(plane.width * g.cellCss) / ss, (plane.height * g.cellCss) / ss] : [plane.width, plane.height];
    if (gl.isContextLost()) return;
    this.mask = createMaskTexture(gl, plane.width, plane.height, plane.data);
  }

  /** Spec 4.5.5 "on change" uniforms: uWarp, uRipple.y, uMaskMix, uShape, uLevel, uTiers. */
  setParams(p: FieldParams): void {
    this.params = p;
    this.paramsDirty = true;
  }

  /** One frame: pass 1 into the surface target, pass 2 to the canvas. A no-op until ready, or while lost. */
  render(f: FrameInputs): void {
    const gl = this.glc;
    if (!gl || !this.ready || gl.isContextLost() || !this.target || !this.gridValue || !this.tri || !this.p1 || !this.p2) return;
    const g = this.gridValue;
    const u1 = this.u1();
    const u2 = this.u2();
    gl.bindVertexArray(this.tri.vao);

    // pass 1: one texel per cell (Appendix A §3.5)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.target.fbo);
    gl.viewport(0, 0, this.target.cols, this.target.rows);
    gl.useProgram(this.p1.program);
    if (this.gridDirty) {
      gl.uniform1f(u1.uCell ?? null, g.cellCss);
      gl.useProgram(this.p2.program);
      gl.uniform1f(u2.uCellDev ?? null, g.cellDev);
      gl.uniform1f(u2.uCanvasH ?? null, g.heightDev);
      gl.useProgram(this.p1.program);
      this.gridDirty = false;
    }
    if (this.paramsDirty) {
      this.writeParams(gl, u1, u2);
      this.paramsDirty = false;
    }
    gl.uniform4f(u1.uZ ?? null, f.z[0], f.z[1], f.z[2], f.z[3]);
    gl.uniform2f(u1.uZm ?? null, f.z[4], f.z[5]);
    gl.uniform2f(u1.uCenter ?? null, f.center[0], f.center[1]);
    gl.uniform1f(u1.uBreath ?? null, f.breath);
    gl.uniform4f(u1.uPointer ?? null, f.pointer.x, f.pointer.y, f.pointer.radius, f.pointer.strength);
    gl.uniform4fv(u1.uRipples ?? null, f.ripples);
    gl.uniform2f(u1.uRipple ?? null, f.rippleSigma, this.params.ripple.gain);
    gl.uniform2f(u1.uMaskSize ?? null, this.maskSize[0], this.maskSize[1]);
    gl.uniform1f(u1.uE ?? null, this.mask ? f.maskE : 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.mask ?? this.emptyMask);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // pass 2: Bayer 8 x 8 tiers to device pixels (Appendix A §3.6)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, g.widthDev, g.heightDev);
    gl.useProgram(this.p2.program);
    gl.uniform3f(u2.uField0 ?? null, f.colors.f0[0], f.colors.f0[1], f.colors.f0[2]);
    gl.uniform3f(u2.uField1 ?? null, f.colors.f1[0], f.colors.f1[1], f.colors.f1[2]);
    gl.uniform3f(u2.uField2 ?? null, f.colors.f2[0], f.colors.f2[1], f.colors.f2[2]);
    gl.uniform3f(u2.uField3 ?? null, f.colors.f3[0], f.colors.f3[1], f.colors.f3[2]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.target.tex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  /** P4: reads the pass-1 target (cols × rows × 4 bytes, row j = 0 first); false when not ready, lost or disposed. */
  readSurface(out: Uint8Array): boolean {
    const gl = this.glc;
    const t = this.target;
    if (!gl || !this.isReady || gl.isContextLost() || !t || out.length < t.cols * t.rows * 4) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.readPixels(0, 0, t.cols, t.rows, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return true;
  }

  /** After webglcontextrestored (3.6.3): rebuilds programs, triangle, target and mask. `ready` must be polled again. */
  restore(): boolean {
    const gl = this.glc;
    if (!gl || gl.isContextLost()) return false;
    this.p1 = null;
    this.p2 = null;
    this.target = null;
    this.mask = null;
    this.isReady = false;
    this.isFailed = false;
    try {
      this.build(gl);
      if (this.gridValue) this.target = createSurfaceTarget(gl, this.gridValue.cols, this.gridValue.rows);
      if (this.maskPlane) this.mask = createMaskTexture(gl, this.maskPlane.width, this.maskPlane.height, this.maskPlane.data);
    } catch {
      this.isFailed = true;
      return false;
    }
    this.gridDirty = true;
    this.paramsDirty = true;
    return true;
  }

  /** Deletes every GL object; the renderer is inert afterwards and `gl` is null. */
  dispose(): void {
    const gl = this.glc;
    if (!gl) return;
    this.glc = null;
    this.isReady = false;
    if (gl.isContextLost()) return;
    if (this.p1) gl.deleteProgram(this.p1.program);
    if (this.p2) gl.deleteProgram(this.p2.program);
    if (this.target) deleteSurfaceTarget(gl, this.target);
    if (this.mask) gl.deleteTexture(this.mask);
    if (this.emptyMask) gl.deleteTexture(this.emptyMask);
    if (this.tri) {
      gl.deleteVertexArray(this.tri.vao);
      gl.deleteBuffer(this.tri.vbo);
    }
    this.p1 = this.p2 = null;
    this.target = null;
    this.mask = this.emptyMask = null;
    this.tri = null;
  }

  private build(gl: WebGL2RenderingContext): void {
    // extensions do not survive a context loss: enable it again on every (re)build
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    this.tri = createFullscreenTriangle(gl);
    // a 1 x 1 zero mask keeps texture unit 1 bound while no name is shown (no "no texture bound" render warning)
    this.emptyMask = createMaskTexture(gl, 1, 1, EMPTY_MASK);
    this.pending = [startProgram(gl, fullscreenVert, PASS1_SOURCE, this.parallel), startProgram(gl, fullscreenVert, ditherFrag, this.parallel)];
  }

  private writeParams(gl: WebGL2RenderingContext, u1: Uniforms, u2: Uniforms): void {
    const p = this.params;
    gl.uniform2f(u1.uWarp ?? null, p.pointer.warpK, p.pointer.boost);
    gl.uniform4f(u1.uMaskMix ?? null, p.mask.holdDim, p.mask.ink, p.mask.edge, p.mask.meltPx);
    gl.uniform3f(u1.uShape ?? null, p.shape.warpScalePx, p.shape.mainScalePx, p.shape.warpAmp);
    gl.uniform2f(u1.uLevel ?? null, p.shape.level, p.shape.gain);
    if (this.p2) {
      gl.useProgram(this.p2.program);
      gl.uniform2f(u2.uTiers ?? null, p.tiers.t2, p.tiers.t3);
      if (this.p1) gl.useProgram(this.p1.program);
    }
  }

  private u1(): Uniforms {
    return this.p1?.uniforms ?? {};
  }

  private u2(): Uniforms {
    return this.p2?.uniforms ?? {};
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/shaders.test.ts`
Expected:
```
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  26 passed (26)`, `Tests  236 passed (236)` (Task 13 plus 1 file and 14 tests); typecheck prints no diagnostics (the `?raw` imports are typed by `vite/client`); build succeeds with the Task 8 JS size (the renderer is not imported by `main.ts` yet).

- [ ] **Step 7: Browser evidence: both programs compile and link in Chrome**

Start the dev server with the Bash tool's `run_in_background`: `npm run dev` (it prints `Local:   http://localhost:5173/`; use the port it prints). Load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__select_page`.

1. `new_page` `http://localhost:5173/?noentry` with `isolatedContext: "t14"`. Always pass this page's `pageId` (other agents may have pages open).
2. `evaluate_script` (waitForStableDom false):
```js
async () => {
  const { DitherRenderer } = await import('/src/field/renderer.ts');
  const { DEFAULT_FIELD, cloneField } = await import('/src/field/params.ts');
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const r = DitherRenderer.create(canvas, cloneField(DEFAULT_FIELD));
  if (!r) return { created: false };
  let frames = 0;
  while (!r.ready && !r.failed && frames < 300) { await new Promise((res) => requestAnimationFrame(res)); frames++; }
  const out = { created: true, ready: r.ready, failed: r.failed, frames };
  r.dispose();
  return out;
}
```
Expected: `{ "created": true, "ready": true, "failed": false, "frames": 3 }` (frames is small; the writer measured 3).
3. Only if `failed` is true, get the driver log and stop the task with it:
```js
async () => {
  const { startProgram, ShaderError } = await import('/src/gl/program.ts');
  const vert = (await import('/src/shaders/fullscreen.vert?raw')).default;
  const noise = (await import('/src/shaders/noise.glsl?raw')).default;
  const surface = (await import('/src/shaders/surface.frag?raw')).default;
  const dither = (await import('/src/shaders/dither.frag?raw')).default;
  const gl = document.createElement('canvas').getContext('webgl2');
  const logs = {};
  for (const [name, frag] of [['pass1', surface.replace('/* noise.glsl inserted here */', noise)], ['pass2', dither]]) {
    try { startProgram(gl, vert, frag, null).finish(); logs[name] = 'ok'; } catch (e) { logs[name] = e instanceof ShaderError ? e.log : String(e); }
  }
  return logs;
}
```
Expected on a healthy build: `{ "pass1": "ok", "pass2": "ok" }`.
4. `list_console_messages` with `types: ["error", "warn"]` → `<no console messages found>`.
5. `close_page`; stop the dev server (the background Bash task) and kill any leftover `vite` node child (PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parsanaji.com*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm:$false }`).

Record `ready`, `failed`, `frames` and the clean console in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-14-report.md`.

- [ ] **Step 8: Commit**

```bash
git add src/shaders/fullscreen.vert src/shaders/noise.glsl src/shaders/surface.frag src/shaders/dither.frag src/field/renderer.ts tests/shaders.test.ts
git commit -m "feat(field): Blueprint dither shaders and the two-pass renderer

GLSL exactly Appendix A §3.3-§3.6: pass 1 evaluates the warped fbm
surface, pointer repel, breath, rings and the name mask per cell into
an RGBA8 target; pass 2 dithers it with Bayer 8x8 into four colour
tiers. Two drawArrays per frame; restore() rebuilds after context loss.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: App: the live field

- **Files:** Create `src/app.ts`, `src/debugHooks.ts`, `tests/appColors.test.ts`; Modify `src/main.ts` (slice-2 boot, below), `src/vite-env.d.ts` (`interface ImportMetaEnv { readonly VITE_PN_DEBUG?: string }`).
- **Interfaces:**
  - Consumes: Task 14 `DitherRenderer` (all members above), `FrameInputs`, `UNIFORMS_PASS1`; Task 13 `createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop`, `Loop`, `LifecycleTarget`, `bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void`; Task 10 `PointerModel`, `PointerKind`, `RipplePool`; Task 9 `FieldParams`, `DEFAULT_FIELD`, `cloneField(p: FieldParams): FieldParams`, `Grid`, `cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number`, `computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid`, `latticeSpacing(fieldCssW: number): number`, `pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number`, `effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number`, `breathScale(tMs: number, amp: number, periodMs: number): number`; Task 8 `RGB`, `FieldColors`, `ColorTween`, `initTheme`, and the slice-1 `main.ts`; Task 3 `flowZ(tSec: number, intensity: number, out?: Float32Array): Float32Array`, `surface(xCss: number, yCss: number, z: ArrayLike<number>, s?: SurfaceShape): number`, `tierOf(v: number, i: number, j: number, t2?: number, t3?: number): 0 | 1 | 2 | 3` (debug hooks); Task 1 `FpsProbe`, `seedFromLocation(search: string, fallback?: () => number): number`.
  - Produces (`src/app.ts`, public):
    ```ts
    export interface AppOptions {
      canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
      entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
    }
    export interface AppDebug {                          // P4
      readonly renderer: DitherRenderer;
      readonly params: FieldParams;
      lastFrame(): FrameInputs | null;                   // inputs of the last render
      setFrozen(frozen: boolean): void;                  // freezes sim time and τ (panel "freeze time")
    }
    export class App implements LifecycleTarget {
      static start(o: AppOptions): App | null;
      setColors(c: FieldColors, animate: boolean): void; // 300 ms ColorTween when animate, started at the next frame's timestamp (A3) from the colours on screen (A15)
      konami(): void;                                    // P11: no-op until Task 20
      replayEntry(): void;                               // P11: no-op until Task 18
      applyParams(): void;                               // debug panel live update (regrid when cell or density changed)
      onFallback(fn: () => void): void;
      get grid(): Grid | null;                           // debug hook
      debug(): AppDebug;                                 // P4
      dispose(): void;
      pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void;
      reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
    }
    ```
  - Produces (`src/app.ts` internals at the end of slice 2; names binding for Tasks 18–20, which replace or extend them):
    - `private constructor(o: AppOptions, renderer: DitherRenderer)` (only `App.start` constructs).
    - Fields: `o: AppOptions`; `params: FieldParams` (`=== o.params`, mutated by the panel); `renderer: DitherRenderer`; `loop: Loop` (`createLoop((dt, now) => this.frame(dt, now))`); `pointer: PointerModel`; `ripples: RipplePool`; `tween: ColorTween` (`set(o.colors)` at start); `probe: FpsProbe | null`; `gridValue: Grid | null`; `rect: { left: number; top: number; width: number; height: number }`; `simMs: number`; `tau: number`; `frozen: boolean`; `reduced: boolean` (`o.reduced`, updated by `reducedChanged`; no other effect until Task 19); `degrade: number` (1, or `params.cell.degradeK`); `programsReady: boolean`; `firstFrameMs: number | null`; `restoreTimer: ReturnType<typeof setTimeout> | null`; `disposed: boolean`; `fallbackFns: (() => void)[]`; `unbinds: (() => void)[]`; `zBuf: Float32Array` (6); `rippleBuf: Float32Array` (32); `last: FrameInputs | null`; `pendingColors: FieldColors | null` (Index amendment A3: the colours a `setColors(c, true)` hands to the next frame, whose timestamp starts the tween). Private helpers no later hunk touches: `measure()` (caches `rect` from `getBoundingClientRect()`), `armRestore()` (the 3000 ms restore timer), `bindPointer()` (the window pointer listeners), and the module constants `NO_RIPPLE` (the 3.3.8 selector) and `kindOf` (`PointerEvent` → `PointerKind`).
    - `private frame(dtMs: number, nowMs: number): boolean` — 4.4.3 order: advance `simMs` and `tau` (`+= dt / 1000 × effectiveIntensity(params)`) unless frozen; `pointer.tick`; `ripples.write(simMs / 1000, sp, rippleBuf)`; `e = this.stepMask(dt, visible)`; `colors = tween.sample(nowMs)`; `renderer.render(…)` with `z: flowZ(tau, 1, zBuf)`, `breath: breathScale(simMs, …)`, `center: [w / 2, h / 2]`, `pointer.radius = pointerRadius(…) × (1 + velRadiusGain × velFactor)`, `rippleSigma: sigmaSp × sp`; probe push; returns `!this.idle()`. Before `programsReady` it polls `renderer.ready`, calls `fail()` on `renderer.failed` or 3000 ms (`params.boot.readyTimeoutMs`) after `firstFrameMs`, and calls `onProgramsReady()` once ready.
    - `private stepMask(_dtMs: number, _visible: boolean): number` — returns 0; the underscores keep `noUnusedParameters` quiet until Task 18 replaces the method (Task 18 drives the entry and Konami machines).
    - `private onProgramsReady(): void` — sets `data-field-ready` on `<html>` and starts the FPS probe (Task 18 adds the entry branch; Task 19 skips the probe under reduced motion).
    - `private idle(): boolean` — returns `false` (Task 19 implements the 3.6.4 idle condition).
    - `private regrid(deviceBox?: { w: number; h: number } | null): void` — measures the canvas box, `cellCssFor` × `degrade`, `computeGrid`, `renderer.resize`, caches `rect` (Task 18 adds the 150 ms mask re-raster debounce).
    - `private spawnAllowed(e: PointerEvent): boolean` — 3.3.8 rules: `isPrimary`, `button === 0`, target not inside `a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]`, point inside `rect` (Task 19 adds "not reduced").
    - `private fail(): void` — once: stop the loop, run `unbinds`, `renderer.dispose()`, call every `fallbackFns` entry.
  - Produces (`src/debugHooks.ts`, P4):
    ```ts
    export interface ParityReport { maxErr255: number; tierMismatchPct: number; cells: number }
    export interface GpuTimeReport { medianMs: number; p90Ms: number; frames: number }
    export interface PnHooks {
      parity(): ParityReport | null;                          // null when the renderer is not ready
      gpuTime(frames: number): Promise<GpuTimeReport | null>; // null without EXT_disjoint_timer_query_webgl2; samples until `frames` results (at most 3 × frames tries)
      grid(): Grid | null;
    }
    export function installDebugHooks(app: App, win: Window): PnHooks; // sets win.__pn and returns it
    ```
    `parity()` renders one frame from `lastFrame()` with `breath: 1`, pointer strength 0, zeroed ripples and `maskE: 0`, reads it with `readSurface`, and compares each cell with `surface((i + 0.5) × cellCss, (j + 0.5) × cellCss, z, params.shape)` and `tierOf` at `params.tiers`.
  - Produces (`src/main.ts` after Task 15, extended by Task 16; names and order binding for slice 3):
    1. Imports add `App` from `./app`, `seedFromLocation` from `./core/prng`, `DEFAULT_FIELD` and `cloneField` from `./field/params`.
    2. `const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';`
    3. `devWarn`, `safeStorage`, `takeEntryControl(doc: Document): boolean` unchanged from Task 8.
    4. `function applyFallback(doc: Document, reason: string): void` — `devWarn(`static fallback: ${reason}`)` then the Task 8 DOM changes. Reasons: `'nowebgl'`, `'forced-colors'`, `'no-canvas'`, `'no-webgl2'`, `'field'`, `'boot'`.
    5. `async function boot(): Promise<void>`, in order: `doc`, `win`, `query = new URLSearchParams(win.location.search)`, `params = cloneField(DEFAULT_FIELD)`, `let app: App | null = null` → the Task 8 links, email copy (now with `holdMs: params.copy.holdMs`) and clock statements → `const theme = initTheme({ …, onChange: (colors, animate) => app?.setColors(colors, animate) })` → `const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches` → `const entry = takeEntryControl(doc)` → field gate (4.7.3): `?nowebgl`, then `(forced-colors: active)`, then a missing `canvas[data-field]`, each → `applyFallback` and return → [Task 16: the `?debug` tweaks import] → `app = App.start({ canvas, params, reduced, seed: seedFromLocation(win.location.search), colors: theme.colors, entry, rail: doc.querySelector<HTMLElement>('[data-rail]'), scrim: doc.querySelector<HTMLElement>('.scrim'), doc, win })` → `null` → `applyFallback(doc, 'no-webgl2')` and return → `app.onFallback(() => { app = null; applyFallback(doc, 'field'); })` → `if (PN_DEBUG) { const { installDebugHooks } = await import('./debugHooks'); if (app) installDebugHooks(app, win); }` → [Task 16: `mountTweaks?.(app)`].
    6. Top level: `boot().catch((error: unknown) => { devWarn(String(error)); applyFallback(document, 'boot'); });`

One unit test pins the crossfade interruption (spec 3.2.6 as amended, Index amendment A15); the rest of `App` is browser-verified. The order is: types, the failing test, `App`, debug hooks, `main.ts`, the passing test, gate, browser evidence, commit.

- [ ] **Step 1: Declare `VITE_PN_DEBUG` (spec 4.1.6)**

Replace `src/vite-env.d.ts` with:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' on preview builds (CI on every branch except main, spec 7.3.2): debug hooks and the ?debug panel */
  readonly VITE_PN_DEBUG?: string;
}
```

- [ ] **Step 2: Write the failing crossfade test (spec 3.2.6, 4.6.6; Index amendments A3, A15)**

A press inside the 300 ms crossfade must behave like an interrupted CSS transition: `setColors(c, true)` starts a new 300 ms tween on the next frame (A3), from the colours on screen at that frame, never from the previous target. `ColorTween.start` (Task 8) samples the current colours; this test pins that `App` hands the press to it at the next frame's timestamp.

`tests/appColors.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { App, type AppOptions } from '../src/app';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';
import type { FrameInputs } from '../src/field/renderer';
import type { FieldColors, RGB } from '../src/theme/theme';

/** Four equal field colours with every channel at v, so one channel tells the whole interpolation. */
const solid = (v: number): FieldColors => {
  const c: RGB = [v, v, v];
  return { f0: c, f1: c, f2: c, f3: c };
};

/**
 * Only App.start builds an App, and it needs WebGL2, which Node lacks. The test calls the private constructor with a
 * fake renderer that records the colours of every render, and drives the private frame() with chosen timestamps.
 */
function harness(start: FieldColors) {
  const rendered: FieldColors[] = [];
  const renderer = {
    ready: true,
    failed: false,
    lost: false,
    render: (f: FrameInputs) => void rendered.push(f.colors),
    resize: () => {},
    clear: () => {},
    setMask: () => {},
    setParams: () => {},
    restore: () => true,
    dispose: () => {},
  };
  const doc = { documentElement: { setAttribute: () => {}, removeAttribute: () => {}, hasAttribute: () => false }, visibilityState: 'visible' };
  const win = { requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, devicePixelRatio: 1, performance: { now: () => 0 } };
  const o = { canvas: {}, params: cloneField(DEFAULT_FIELD), reduced: false, seed: 1, colors: start, entry: false, rail: null, scrim: null, doc, win } as unknown as AppOptions;
  const Ctor = App as unknown as new (o: AppOptions, renderer: unknown) => App;
  const app = new Ctor(o, renderer);
  const frame = (nowMs: number): void => {
    (app as unknown as { frame(dtMs: number, nowMs: number): boolean }).frame(16, nowMs);
  };
  return { app, frame, last: (): FieldColors => rendered[rendered.length - 1] };
}

describe('App.setColors crossfade (spec 3.2.6, 4.6.6; Index amendments A3, A15)', () => {
  it('starts on the next frame, and a press mid-fade restarts 300 ms from the colours on screen, like an interrupted CSS transition', () => {
    const h = harness(solid(0));
    h.frame(0); // the first frame only stamps the readiness clock
    h.frame(1000); // programs ready: the first render
    expect(h.last()).toEqual(solid(0));
    h.app.setColors(solid(1), true); // the press; the tween waits for the next frame (A3)
    h.frame(1016); // the tween starts at this frame's timestamp
    expect(h.last().f0[0]).toBeCloseTo(0, 12);
    h.frame(1166); // halfway through the first fade
    expect(h.last().f0[0]).toBeCloseTo(0.5, 12);
    h.app.setColors(solid(0), true); // a second press inside the fade
    h.frame(1196); // 180 ms into the first fade: the new tween starts from 0.6, not from the previous target 1
    expect(h.last().f0[0]).toBeCloseTo(0.6, 12);
    h.frame(1346); // 150 ms into the new 300 ms tween: halfway from 0.6 back to 0
    expect(h.last().f0[0]).toBeCloseTo(0.3, 12);
    h.frame(1496); // 300 ms after it started
    expect(h.last()).toEqual(solid(0));
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/appColors.test.ts`
Expected: FAIL, ` FAIL  tests/appColors.test.ts [ tests/appColors.test.ts ]` with `Error: Cannot find module '../src/app' imported from …/tests/appColors.test.ts`, then `Test Files  1 failed (1)` and `Tests  no tests`.

- [ ] **Step 4: Write `src/app.ts` (spec 4.4, 4.7.4 steps 1, 2, 5, 7, 3.3.7.6, 3.3.7.7, 3.3.8, 3.6.2, 3.6.3, 3.7.1–3.7.9, 4.6.6; P3, P4, P11; Index amendment A3)**

The internals carry the index names (`frame`, `stepMask`, `onProgramsReady`, `idle`, `regrid`, `spawnAllowed`, `fail` and the listed fields), so the slice-3 hunks apply. Points a reviewer checks: the first animation frame only stamps `firstFrameMs`, so the first program-status query runs in the frame after first paint (4.7.4 step 5, risk 9.6: it blocks on the link where `KHR_parallel_shader_compile` is missing), and the readiness timeout counts from that first frame (3.4.3, 11.8); a frame that throws calls `fail()` instead of surfacing an uncaught error (R14 console rule); `contextLost` arms the 3000 ms restore timer and a bfcache `resume()` with a lost context waits on it (3.7.5); a press re-measures the canvas rect, because a phone's URL bar moves the fixed band without resizing it (3.3.7.7); `idle()` returns false outside reduced motion, and Task 19 adds the settled condition.
```ts
import { FpsProbe } from './core/quality';
import { breathScale, effectiveIntensity } from './field/flow';
import type { FieldParams } from './field/params';
import { PointerModel, type PointerKind } from './field/pointer';
import { DitherRenderer, type FrameInputs } from './field/renderer';
import { RipplePool } from './field/ripples';
import { cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
import { flowZ } from './field/surface';
import { bindLifecycle, type LifecycleTarget } from './lifecycle';
import { createLoop, type Loop } from './loop';
import { ColorTween, type FieldColors } from './theme/theme';

export interface AppOptions {
  canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
  entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
}

/** P4: what the debug hooks and the panel reach; it exists in every build but only PN_DEBUG code calls it. */
export interface AppDebug {
  readonly renderer: DitherRenderer;
  readonly params: FieldParams;
  lastFrame(): FrameInputs | null; // inputs of the last render
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
}

/** Spec 3.3.8: a press on any of these never spawns a ring (11.26: nor one inside a dialog). */
const NO_RIPPLE = 'a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]';

const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');

/** Owns the field: renderer, models, loop and lifecycle (spec 4.2, 4.4, 4.7.4). Only App.start constructs it. */
export class App implements LifecycleTarget {
  private readonly o: AppOptions;
  private readonly params: FieldParams;
  private readonly renderer: DitherRenderer;
  private readonly loop: Loop;
  private readonly pointer: PointerModel;
  private readonly ripples: RipplePool;
  private readonly tween: ColorTween;
  private probe: FpsProbe | null = null;
  private gridValue: Grid | null = null;
  private rect = { left: 0, top: 0, width: 0, height: 0 };
  private simMs = 0;
  private tau = 0;
  private frozen = false;
  private reduced: boolean;
  private degrade = 1;
  private programsReady = false;
  private firstFrameMs: number | null = null;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly fallbackFns: (() => void)[] = [];
  private unbinds: (() => void)[] = [];
  private readonly zBuf = new Float32Array(6);
  private readonly rippleBuf = new Float32Array(32);
  private last: FrameInputs | null = null;
  private pendingColors: FieldColors | null = null;

  private constructor(o: AppOptions, renderer: DitherRenderer) {
    this.o = o;
    this.params = o.params;
    this.renderer = renderer;
    this.reduced = o.reduced;
    this.loop = createLoop(
      (dt, now) => this.frame(dt, now),
      (cb) => o.win.requestAnimationFrame(cb),
      (id) => o.win.cancelAnimationFrame(id),
    );
    this.pointer = new PointerModel(o.params.pointer);
    this.ripples = new RipplePool(o.params.ripple);
    this.tween = new ColorTween(o.params.theme.crossfadeMs);
    this.tween.set(o.colors);
  }

  /** Spec 4.7.4 steps 1, 2 and 7: renderer, first clear, lifecycle, pointer listeners, loop. Null = no field. */
  static start(o: AppOptions): App | null {
    const renderer = DitherRenderer.create(o.canvas, o.params);
    if (!renderer) return null;
    try {
      const app = new App(o, renderer);
      app.regrid();
      renderer.clear(o.colors.f0); // 3.7.8: never a black alpha:false canvas
      app.unbinds.push(bindLifecycle(app, { win: o.win, doc: o.doc, canvas: o.canvas })); // P3
      app.bindPointer();
      app.loop.start();
      return app;
    } catch {
      renderer.dispose();
      return null;
    }
  }

  /**
   * Spec 3.2.6, 4.6.6: a 300 ms linear ColorTween when animated, else an instant switch. The tween starts at the next
   * frame's timestamp, the moment the CSS transition of the same toggle starts, so field-0 and --bg move in step (A3).
   * A press inside a running crossfade acts like an interrupted CSS transition: the new 300 ms tween starts from the
   * colours on screen at that frame (ColorTween.start samples them), never from the previous target (A15).
   */
  setColors(c: FieldColors, animate: boolean): void {
    if (this.disposed) return;
    if (animate) this.pendingColors = c;
    else {
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
  }

  /** P11: ignored until Task 20 adds the Konami machine. */
  konami(): void {}

  /** P11: ignored until Task 18 adds the entry. */
  replayEntry(): void {}

  /** Debug panel live update: params object -> uniforms, then regrid (cell and density changes take effect). */
  applyParams(): void {
    if (this.disposed) return;
    this.renderer.setParams(this.params);
    this.regrid();
    this.loop.wake();
  }

  /** Called once if the field fails after start (compile or link error, timeout, lost context, FBO). */
  onFallback(fn: () => void): void {
    this.fallbackFns.push(fn);
  }

  get grid(): Grid | null {
    return this.gridValue;
  }

  debug(): AppDebug {
    return {
      renderer: this.renderer,
      params: this.params,
      lastFrame: () => this.last,
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.stop();
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    for (const unbind of this.unbinds.splice(0)) unbind();
    this.renderer.dispose();
  }

  // ---- LifecycleTarget (spec 3.6.3, 3.7) ----

  pause(): void {
    this.loop.stop();
  }

  resume(): void {
    if (this.disposed) return;
    if (this.renderer.lost) {
      this.armRestore(); // 3.7.5: a bfcache restore with a lost context waits for webglcontextrestored
      return;
    }
    if (this.o.doc.visibilityState === 'visible') this.loop.start();
  }

  resize(deviceBox?: { w: number; h: number } | null): void {
    if (this.disposed) return;
    this.regrid(deviceBox);
    this.loop.wake();
  }

  dprChanged(): void {
    this.resize(null);
  }

  /** Task 19 adds the reduced-motion behaviour; slice 2 only tracks the flag. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
  }

  contextLost(): void {
    if (this.disposed) return;
    this.loop.stop();
    this.armRestore();
  }

  contextRestored(): void {
    if (this.disposed) return;
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    if (!this.renderer.restore()) {
      this.fail();
      return;
    }
    this.regrid();
    this.renderer.clear(this.tween.sample(this.o.win.performance.now()).f0);
    this.resume();
  }

  // ---- internals (names binding for Tasks 18-20) ----

  /** Spec 4.4.3, in order. Returns false to idle (never in slice 2). */
  private frame(dtMs: number, nowMs: number): boolean {
    if (this.disposed) return false;
    try {
      if (this.firstFrameMs === null) {
        // 4.7.4 step 5, risk 9.6: the first status query waits for the frame after first paint (it blocks
        // on the link where KHR_parallel_shader_compile is missing); this frame only starts the 3000 ms count
        this.firstFrameMs = nowMs;
        return true;
      }
      if (this.renderer.failed) {
        this.fail();
        return false;
      }
      if (!this.programsReady) {
        if (!this.renderer.ready) {
          // 3.4.3: the 3000 ms count starts at the first animation frame, so a hidden tab never times out unseen
          if (this.renderer.failed || nowMs - this.firstFrameMs >= this.params.boot.readyTimeoutMs) this.fail();
          return !this.disposed;
        }
        this.programsReady = true;
        this.onProgramsReady();
      }
      if (!this.frozen) {
        this.simMs += dtMs;
        this.tau += (dtMs / 1000) * effectiveIntensity(this.params);
      }
      this.pointer.tick(dtMs);
      const w = this.rect.width;
      const h = this.rect.height;
      const sp = latticeSpacing(w);
      this.ripples.write(this.simMs / 1000, sp, this.rippleBuf);
      const e = this.stepMask(dtMs, this.o.doc.visibilityState === 'visible');
      if (this.pendingColors) {
        this.tween.start(this.pendingColors, nowMs);
        this.pendingColors = null;
      }
      const colors = this.tween.sample(nowMs);
      const p = this.params;
      const inputs: FrameInputs = {
        z: flowZ(this.tau, 1, this.zBuf),
        breath: breathScale(this.simMs, p.breath.amp, p.breath.periodMs),
        center: [w / 2, h / 2],
        pointer: {
          x: this.pointer.x,
          y: this.pointer.y,
          radius: pointerRadius(w, h, p.pointer) * (1 + p.pointer.velRadiusGain * this.pointer.velFactor),
          strength: this.pointer.strength,
        },
        ripples: this.rippleBuf,
        rippleSigma: p.ripple.sigmaSp * sp,
        maskE: e,
        colors,
      };
      this.renderer.render(inputs);
      this.last = inputs;
      if (this.renderer.failed) {
        this.fail();
        return false;
      }
      if (this.probe && !this.probe.done && this.probe.push(dtMs) === 'degrade') {
        this.degrade = p.cell.degradeK; // 3.7.9: once per session
        this.regrid();
      }
      return !this.idle();
    } catch {
      this.fail(); // a throwing frame never reaches the console as an uncaught error
      return false;
    }
  }

  /** Mask progress e; Task 18 drives the entry and Konami machines here. */
  private stepMask(_dtMs: number, _visible: boolean): number {
    return 0;
  }

  /** The first real frame (3.4.7.1): show the canvas and start the FPS probe (3.7.9, 11.30). */
  private onProgramsReady(): void {
    this.o.doc.documentElement.setAttribute('data-field-ready', '');
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }

  /** Spec 4.4.3 step 6: only reduced motion renders on demand; Task 19 adds the 3.6.4 settled condition. */
  private idle(): boolean {
    if (!this.reduced) return false;
    return false;
  }

  /** Spec 3.7.1: measure the canvas box, size the grid, resize the backing store and target, cache the rect. */
  private regrid(deviceBox?: { w: number; h: number } | null): void {
    const r = this.measure();
    const cellCss = cellCssFor(r.width, this.params.cell, this.params.density, this.degrade);
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
  }

  /** Caches the canvas rect (3.3.7.7). A press re-measures too: a phone's URL bar moves the fixed band without resizing it. */
  private measure(): { left: number; top: number; width: number; height: number } {
    const r = this.o.canvas.getBoundingClientRect();
    this.rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    return this.rect;
  }

  /** Spec 3.3.8: primary button, outside interactive elements and dialogs, inside the canvas rect (11.26). */
  private spawnAllowed(e: PointerEvent): boolean {
    if (!e.isPrimary || e.button !== 0) return false;
    const target = e.target as Element | null;
    if (target && typeof target.closest === 'function' && target.closest(NO_RIPPLE)) return false;
    const x = e.clientX - this.rect.left;
    const y = e.clientY - this.rect.top;
    return x >= 0 && y >= 0 && x < this.rect.width && y < this.rect.height;
  }

  /** Once: stop, unbind, dispose every GL object, then tell main.ts (3.6.2). */
  private fail(): void {
    if (this.disposed) return;
    this.dispose();
    for (const fn of this.fallbackFns) fn();
  }

  private armRestore(): void {
    if (this.restoreTimer !== null) return;
    this.restoreTimer = setTimeout(() => {
      this.restoreTimer = null;
      this.fail(); // 3.6.3: no restore within 3000 ms
    }, this.params.boot.restoreTimeoutMs);
  }

  /** Spec 3.3.7.6-3.3.7.7: passive window listeners in field space; release on touch up, cancel, leave and blur. */
  private bindPointer(): void {
    const { win, doc } = this.o;
    const opts: AddEventListenerOptions = { passive: true };
    const at = (e: PointerEvent): [number, number] => [e.clientX - this.rect.left, e.clientY - this.rect.top];
    const onMove = (e: PointerEvent): void => {
      const [x, y] = at(e);
      this.pointer.move(x, y, kindOf(e));
      this.loop.wake();
    };
    const onDown = (e: PointerEvent): void => {
      this.measure();
      const [x, y] = at(e);
      this.pointer.down(x, y, kindOf(e));
      if (this.spawnAllowed(e)) this.ripples.spawn(x, y, this.simMs / 1000);
      this.loop.wake();
    };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') this.pointer.release();
      this.loop.wake();
    };
    const onRelease = (): void => {
      this.pointer.release();
      this.loop.wake();
    };
    win.addEventListener('pointermove', onMove, opts);
    win.addEventListener('pointerdown', onDown, opts);
    win.addEventListener('pointerup', onUp, opts);
    win.addEventListener('pointercancel', onRelease, opts);
    win.addEventListener('blur', onRelease);
    doc.documentElement.addEventListener('pointerleave', onRelease, opts);
    this.unbinds.push(() => {
      win.removeEventListener('pointermove', onMove);
      win.removeEventListener('pointerdown', onDown);
      win.removeEventListener('pointerup', onUp);
      win.removeEventListener('pointercancel', onRelease);
      win.removeEventListener('blur', onRelease);
      doc.documentElement.removeEventListener('pointerleave', onRelease);
    });
  }
}
```

- [ ] **Step 5: Write `src/debugHooks.ts` (spec 4.7.5, 8.2.2, 8.2.3, 6.1.13; P4)**

`parity()` renders the bare surface (breath 1, strength 0, no rings, `maskE` 0) and compares each pass-1 texel with `surface()` at the same `z` buffer (float32, as uploaded) and with `tierOf` at the live tiers.
```ts
// P4: window.__pn (spec 4.7.5). Loaded only by a dynamic import behind PN_DEBUG, so production never carries it.
import type { App } from './app';
import type { FrameInputs } from './field/renderer';
import type { Grid } from './field/sizing';
import { surface, tierOf } from './field/surface';

export interface ParityReport { maxErr255: number; tierMismatchPct: number; cells: number }
export interface GpuTimeReport { medianMs: number; p90Ms: number; frames: number }
export interface PnHooks {
  parity(): ParityReport | null; // null when the renderer is not ready
  gpuTime(frames: number): Promise<GpuTimeReport | null>; // null without EXT_disjoint_timer_query_webgl2
  grid(): Grid | null;
}

/** EXT_disjoint_timer_query_webgl2 is not in lib.dom: the two enums this file uses. */
interface TimerQueryExt { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }

/** Spec 8.2.2 / 8.2.3 / 6.1.13: GPU-vs-TS parity, GPU time and the grid, as `window.__pn`. */
export function installDebugHooks(app: App, win: Window): PnHooks {
  const hooks: PnHooks = {
    parity() {
      const d = app.debug();
      const grid = app.grid;
      const last = d.lastFrame();
      if (!grid || !last || !d.renderer.ready) return null;
      // the bare surface F: breath 1, no pointer, no rings, no mask (what surface() computes)
      const frame: FrameInputs = { ...last, breath: 1, pointer: { ...last.pointer, strength: 0 }, ripples: new Float32Array(32), maskE: 0 };
      d.renderer.render(frame);
      const px = new Uint8Array(grid.cols * grid.rows * 4);
      if (!d.renderer.readSurface(px)) return null;
      const { t2, t3 } = d.params.tiers;
      let maxErr = 0;
      let mismatch = 0;
      for (let j = 0; j < grid.rows; j++) {
        for (let i = 0; i < grid.cols; i++) {
          const gpu = px[(j * grid.cols + i) * 4] / 255;
          const cpu = surface((i + 0.5) * grid.cellCss, (j + 0.5) * grid.cellCss, frame.z, d.params.shape);
          maxErr = Math.max(maxErr, Math.abs(gpu - cpu));
          if (tierOf(gpu, i, j, t2, t3) !== tierOf(cpu, i, j, t2, t3)) mismatch++;
        }
      }
      const cells = grid.cols * grid.rows;
      return { maxErr255: maxErr * 255, tierMismatchPct: (100 * mismatch) / cells, cells };
    },

    async gpuTime(frames) {
      const d = app.debug();
      const gl = d.renderer.gl;
      if (!gl || !d.renderer.ready) return null;
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerQueryExt | null;
      if (!ext) return null;
      const nextFrame = (): Promise<void> => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));
      const times: number[] = [];
      // a query can come back unavailable or disjoint: keep sampling until `frames` results (at most 3 x frames tries)
      for (let attempt = 0; times.length < frames && attempt < frames * 3; attempt++) {
        const inputs = d.lastFrame();
        if (!inputs || !d.renderer.ready) break;
        const query = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
        d.renderer.render(inputs);
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        await nextFrame();
        await nextFrame();
        const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) === true;
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) === true;
        if (available && !disjoint) times.push(Number(gl.getQueryParameter(query, gl.QUERY_RESULT)) / 1e6);
        gl.deleteQuery(query);
      }
      if (times.length === 0) return null;
      times.sort((a, b) => a - b);
      return { medianMs: times[times.length >> 1], p90Ms: times[Math.min(times.length - 1, Math.floor(times.length * 0.9))], frames: times.length };
    },

    grid: () => app.grid,
  };
  (win as Window & { __pn?: PnHooks }).__pn = hooks;
  return hooks;
}
```

- [ ] **Step 6: Replace `src/main.ts` with the slice-2 boot (spec 4.7.1, 4.7.3, 4.7.4, 4.7.6, 3.6.2; index "Produces (`src/main.ts` after Task 15)")**

Full file `src/main.ts`. It is the Task 8 file (Task 8 Step 6) with exactly these changes, so a reviewer can diff the two: the header comment; the imports of `App`, `seedFromLocation`, `DEFAULT_FIELD` and `cloneField`; `PN_DEBUG`; `applyFallback(doc, reason)` with its DEV warning and new doc comment; `async boot()` with `query`, `params` and `let app` first, `holdMs: params.copy.holdMs` in the email copy, `onChange` forwarding to `app?.setColors`, then `reduced`, `entry` and the field gate, `App.start`, `onFallback` and the debug hooks; Task 8's trailing `applyFallback(doc); // no field until Task 15` and its top-level `try`/`catch` are replaced by the `boot().catch(…)` line. `devWarn`, `safeStorage`, `takeEntryControl` and the clock statements keep Task 8's text and comments byte for byte (Tasks 18, 21 and 22 anchor their hunks on them).
```ts
// Boot orchestration (spec 4.7): the rail's DOM modules and the theme, then the field gate (4.7.3) and the App (4.7.4).
import { App } from './app';
import { CONTENT } from './content';
import { seedFromLocation } from './core/prng';
import { DEFAULT_FIELD, cloneField } from './field/params';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';

/** Spec 4.12.1: true on the dev server and preview builds, false (and folded away) in production. */
const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';

/** One console.warn per failure on the dev server; production logs nothing at warn or error level (4.7.6). */
function devWarn(message: string): void {
  if (import.meta.env.DEV) console.warn(`[pn] ${message}`);
}

/** localStorage, or null where reading it throws (blocked storage counts as "system", 3.5.10). */
function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** Spec 3.6.2: no field; the rail shows at once. One DEV warning per failure, nothing in production. */
function applyFallback(doc: Document, reason: string): void {
  devWarn(`static fallback: ${reason}`);
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}

async function boot(): Promise<void> {
  const doc = document;
  const win = window;
  const query = new URLSearchParams(win.location.search);
  const params = cloneField(DEFAULT_FIELD);
  let app: App | null = null;
  initLinks(CONTENT.links.linkedin, doc);
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') });
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  const theme = initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entry = takeEntryControl(doc);

  // 4.7.3 field gate
  if (query.has('nowebgl')) {
    applyFallback(doc, 'nowebgl');
    return;
  }
  if (win.matchMedia('(forced-colors: active)').matches) {
    applyFallback(doc, 'forced-colors');
    return;
  }
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  app = App.start({
    canvas,
    params,
    reduced,
    seed: seedFromLocation(win.location.search),
    colors: theme.colors,
    entry,
    rail: doc.querySelector<HTMLElement>('[data-rail]'),
    scrim: doc.querySelector<HTMLElement>('.scrim'),
    doc,
    win,
  });
  if (!app) {
    applyFallback(doc, 'no-webgl2');
    return;
  }
  app.onFallback(() => {
    app = null;
    applyFallback(doc, 'field');
  });
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
}

boot().catch((error: unknown) => {
  devWarn(String(error));
  applyFallback(document, 'boot');
});
```

- [ ] **Step 7: Run the crossfade test to verify it passes**

Run: `npx vitest run tests/appColors.test.ts`
Expected: PASS, `Test Files  1 passed (1)`, `Tests  1 passed (1)` (the assembler ran it against the App of every state from Task 15 to Task 22; it fails if `ColorTween.start` began from the previous target).

- [ ] **Step 8: Full gate and production bundle check**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  27 passed (27)`, `Tests  237 passed (237)` (Task 14's 26 files and 236 tests plus `tests/appColors.test.ts`); typecheck prints no diagnostics; the build prints one `dist/assets/index-*.js` (no `debugHooks-*.js`: `PN_DEBUG` folds to `false` with `VITE_PN_DEBUG` unset). Then:
```bash
grep -c "__pn\|parity\|gpuTime" dist/assets/*.js
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
```
Expected: `0` for every file; a gzip total far under the 60 KB budget (the assembler's scratch build of this exact Task 15 state measured 12.2 KB; record the real number). `VITE_PN_DEBUG=1 npx vite build` additionally emits `dist/assets/debugHooks-*.js` (about 1.5 kB); run `npm run build` again afterwards so `dist/` is the production build.

- [ ] **Step 9: Browser evidence (spec 8.2.2, 8.2.3, 8.2.5, 8.2.7–8.2.10, 8.3)**

Load the `frontend-design` skill first (Skill `frontend-design:frontend-design`, Execution Notes) and judge the screenshots against the Blueprint Dither look (Appendix A `shot-idle-dark.png`). Start `npm run dev` with the Bash tool's `run_in_background` (it prints `Local:   http://localhost:5173/`; use the port it prints) and load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__select_page`. Evidence directory `E` = `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-15\` (create it: `mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-15`). Use a fresh `new_page` with its own `isolatedContext` for each numbered check, pass its `pageId` on every call, and `close_page` it at the end of the check. URLs are `http://localhost:5173/` unless stated. Expected values in brackets are what the writer measured on the owner's PC (RTX 2080 SUPER, 165 Hz display) with this exact code.

1. **First frame, parity, GPU time (8.2.2, 6.1.13).** `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, then `navigate_page` `type: "reload"`. `evaluate_script`:
   ```js
   async () => { await new Promise((r) => setTimeout(r, 1000)); const h = document.documentElement; return { cls: h.className, ready: h.hasAttribute('data-field-ready'), entry: h.getAttribute('data-entry'), grid: window.__pn.grid(), parity: window.__pn.parity(), gpu: await window.__pn.gpuTime(60) }; }
   ```
   Expected: `cls` `""`, `ready` true, `entry` null (P9: no entry yet), `grid` = `{ dpr: 1, widthDev: 1440, heightDev: 900, cellDev: 5, cellCss: 5, cols: 288, rows: 180, maskW: 576, maskH: 360 }`; `parity.maxErr255` ≤ 3 [0.56–0.58] and `parity.tierMismatchPct` ≤ 0.5 [0.15–0.30], `cells` 51840; `gpu.medianMs` ≤ 2 [0.036–0.059], `gpu.frames` 60. `take_screenshot` → `E\1440x900-dark.png`.
2. **Two draws per frame (6.1.3, 8.2.3).** `navigate_page` `type: "url"`, `url: "http://localhost:5173/"` with `initScript`:
   ```js
   (() => { const proto = WebGL2RenderingContext.prototype; const draw = proto.drawArrays; let n = 0; window.__draws = []; proto.drawArrays = function (...a) { n++; return draw.apply(this, a); }; const tick = () => { window.__draws.push(n); n = 0; if (window.__draws.length < 2000) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })();
   ```
   Wait 6 s inside `evaluate_script`, then: `async () => { await new Promise((r) => setTimeout(r, 6000)); const d = window.__draws.slice(-300); const hist = {}; for (const n of d) hist[n] = (hist[n] ?? 0) + 1; return { frames: d.length, hist }; }`. Expected: `{ "frames": 300, "hist": { "2": 300 } }` (only the frames before the programs were ready have 0 draws, and they are older than the last 300).
3. **Frame interval under pointer movement (6.1.12, 8.2.3).** Same page, `evaluate_script`:
   ```js
   async () => {
     const dts = []; let last = null; const t0 = performance.now();
     await new Promise((resolve) => {
       const step = (now) => {
         if (last !== null) dts.push(now - last);
         last = now;
         const a = ((now - t0) / 1000) * 2;
         window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1000 + 250 * Math.cos(a), clientY: 450 + 250 * Math.sin(a), pointerType: 'mouse', isPrimary: true, bubbles: true }));
         if (now - t0 < 10000) requestAnimationFrame(step); else resolve();
       };
       requestAnimationFrame(step);
     });
     return { frames: dts.length, meanMs: dts.reduce((s, v) => s + v, 0) / dts.length, maxMs: Math.max(...dts) };
   }
   ```
   Expected: `meanMs` ≤ 16.7 [6.06 at 165 Hz, 1650 frames]. Record `maxMs`.
4. **Repel and Shockwave (3.3.7, 3.3.8, 11.26).** Same page. Rings render as field-3, which the idle field never reaches (3.3.10), so counting `#e8eeff` pixels proves them:
   ```js
   async () => {
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const field3 = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(1440 * 900 * 4); gl.readPixels(0, 0, 1440, 900, gl.RGBA, gl.UNSIGNED_BYTE, px); let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] === 232 && px[i + 1] === 238 && px[i + 2] === 255) n++; resolve(n); }));
     const down = (x, y, target) => target.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true }));
     const before = await field3();
     down(80, 165, document.querySelector('[data-link="github"]'));
     await new Promise((r) => setTimeout(r, 500));
     const afterLink = await field3();
     down(1100, 450, document.querySelector('canvas[data-field]'));
     await new Promise((r) => setTimeout(r, 500));
     return { before, afterLink, afterField: await field3() };
   }
   ```
   Expected: `before` 0, `afterLink` 0 (a press on a link never spawns a ring), `afterField` > 0 [116400]. Screenshots: the MCP screenshot arrives seconds after a call, longer than a ring lives, so keep rings coming while it is taken: `evaluate_script` `() => { window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1100, clientY: 450, pointerType: 'mouse', isPrimary: true, bubbles: true })); return true; }`, then `take_screenshot` → `E\1440x900-dark-repel.png` (the repel lens around (1100, 450)); then `evaluate_script` `() => { window.__rings = setInterval(() => document.querySelector('canvas[data-field]').dispatchEvent(new PointerEvent('pointerdown', { clientX: 1100, clientY: 450, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true })), 300); return true; }`, `take_screenshot` → `E\1440x900-dark-ring.png`, then `evaluate_script` `() => { clearInterval(window.__rings); return true; }`.
5. **Theme crossfade, field part (8.2.5, 4.6.6, Index amendment A3).** Fresh page, `emulate` `1440x900x1` dark, reload, then (the field's off cells are the most frequent colour of a row in the open field):
   ```js
   async () => {
     await new Promise((r) => setTimeout(r, 1000));
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const rgb = (s) => s.match(/[\d.]+/g).map(Number).slice(0, 3);
     const from = rgb(getComputedStyle(document.body).backgroundColor);
     document.querySelector('[data-theme-toggle]').click();
     const frames = await new Promise((resolve) => {
       const out = []; let f1 = null;
       const step = (now) => {
         f1 ??= now;
         const px = new Uint8Array(4 * 400);
         gl.readPixels(900, 450, 400, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
         const count = new Map();
         for (let i = 0; i < 400; i++) { const k = `${px[i * 4]},${px[i * 4 + 1]},${px[i * 4 + 2]}`; count.set(k, (count.get(k) ?? 0) + 1); }
         out.push({ t: now - f1, off: [...count.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number), bg: rgb(getComputedStyle(document.body).backgroundColor) });
         if (now - f1 < 400) requestAnimationFrame(step); else resolve(out);
       };
       requestAnimationFrame(step);
     });
     const to = frames.at(-1).bg;
     const at = frames.reduce((a, b) => (Math.abs(b.t - 150) < Math.abs(a.t - 150) ? b : a));
     const mid = from.map((c, k) => (c + to[k]) / 2);
     const dist = (a, b) => Math.max(...a.map((v, k) => Math.abs(v - b[k])));
     return { t: at.t, mid, off: at.off, bg: at.bg, offVsMid: dist(at.off, mid), bgVsMid: dist(at.bg, mid), offVsBg: dist(at.off, at.bg) };
   }
   ```
   Expected: `offVsMid` ≤ 3 and `bgVsMid` ≤ 3 [t 151.4 ms, `off` = `bg` = `122,127,143`, `mid` `123.5,128,144`, both 1.5]. `t` is measured from the first frame after the click (the frame where both the CSS transition and the tween start). On a 60 Hz display the closest frame can be 8 ms from 150, which alone is up to 6.4 of 255: then judge `offVsBg` ≤ 3 and record both. Press the toggle once more (`evaluate_script` `() => { document.querySelector('[data-theme-toggle]').click(); return localStorage.getItem('pn.theme'); }` → `null`).
6. **Fallbacks (8.2.7, 3.6.2, 3.6.5).** Three fresh pages at `1440x900x1`:
   - `navigate_page` `http://localhost:5173/?nowebgl`;
   - `navigate_page` `http://localhost:5173/` with `initScript` `(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return type === 'webgl2' ? null : get.call(this, type, ...rest); }; })();`;
   - `navigate_page` `http://localhost:5173/` with `initScript` `(() => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => (q === '(forced-colors: active)' ? mm('all') : mm(q)); })();`.
   On each: `evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 500)); const h = document.documentElement; return { cls: h.className, ready: h.hasAttribute('data-field-ready'), entry: h.getAttribute('data-entry'), canvas: getComputedStyle(document.querySelector('canvas[data-field]')).display, pn: typeof window.__pn }; }` → `{ cls: "no-webgl", ready: false, entry: null, canvas: "none", pn: "undefined" }`; `list_console_messages` `types: ["error"]` → none; `types: ["warn"]` → exactly one DEV line, `[pn] static fallback: nowebgl` / `no-webgl2` / `forced-colors` (3.6.2: one `console.warn` per failure in DEV only). `take_screenshot` of the getContext case → `E\1440x900-dark-nowebgl.png` (the rail on `--bg`, no field).
7. **Context loss (8.2.8, 3.6.3).** Fresh page at `1440x900x1`, then:
   ```js
   async () => {
     const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
     await sleep(800);
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const ext = gl.getExtension('WEBGL_lose_context');
     ext.loseContext();
     await sleep(500);
     const whileLost = { lost: gl.isContextLost(), cls: document.documentElement.className };
     ext.restoreContext();
     await sleep(800);
     const read = await new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(4); gl.readPixels(1200, 450, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); resolve(Array.from(px)); }));
     return { whileLost, after: { lost: gl.isContextLost(), cls: document.documentElement.className, parity: window.__pn.parity(), read } };
   }
   ```
   Expected: `whileLost` `{ lost: true, cls: "" }`; `after.lost` false, `after.cls` `""`, `after.parity.maxErr255` ≤ 3 and `tierMismatchPct` ≤ 0.5, `after.read` a field colour, not `[0,0,0,255]` [`[5,10,34,255]`, field-0 dark]. Then, on the same page: `async () => { const gl = document.querySelector('canvas[data-field]').getContext('webgl2'); gl.getExtension('WEBGL_lose_context').loseContext(); await new Promise((r) => setTimeout(r, 2900)); const at2900 = document.documentElement.className; await new Promise((r) => setTimeout(r, 300)); return { at2900, at3200: document.documentElement.className }; }` → `{ at2900: "", at3200: "no-webgl" }`, and the console shows only the DEV line `[pn] static fallback: field`.
8. **Hidden at load (8.2.9, 3.4.3, 11.8).** `new_page` `http://localhost:5173/` with `background: true` and a fresh `isolatedContext`, then `evaluate_script` `() => document.visibilityState`. If it reports `hidden`: wait 4 s, check `data-field-ready` is absent and `className` is `""`, `select_page` the page, wait 1 s, check `data-field-ready` is present, `className` `""`. If it reports `visible` (the writer's run on this PC did: background pages still render), exercise the same path with this `initScript` on a fresh page (hidden document, rAF held while hidden):
   ```js
   (() => { let hidden = true; const queued = []; Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') }); Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => hidden }); const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => (hidden ? (queued.push(cb), 0) : raf(cb)); window.__show = () => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); for (const cb of queued.splice(0)) raf(cb); }; })();
   ```
   and `evaluate_script` `async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); await sleep(4000); const h = document.documentElement; const before = { vis: document.visibilityState, ready: h.hasAttribute('data-field-ready'), cls: h.className }; window.__show(); await sleep(600); return { before, after: { vis: document.visibilityState, ready: h.hasAttribute('data-field-ready'), cls: h.className, parity: window.__pn.parity() } }; }` → `before` `{ vis: "hidden", ready: false, cls: "" }` (4 s hidden, no 3000 ms timeout fired), `after` `{ vis: "visible", ready: true, cls: "" }` with a passing parity. Record which method ran.
9. **DPR and moiré (8.2.10, 3.3.2, 4.5.9, Index amendment A2).** Save this script as `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-15/runs.mjs` (it measures colour runs over the rightmost 64 cells of nine rows of a screenshot; every run must be a whole number of cells):
   ```js
   // usage: node runs.mjs <screenshot.png> <cellDev> -> on-runs over the rightmost 64 cells of 9 rows, and the ones that are not whole cells
   import sharp from 'sharp';
   const [file, cellDev] = [process.argv[2], Number(process.argv[3])];
   const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
   const x0 = (Math.floor(info.width / cellDev) - 64) * cellDev;
   let runs = 0;
   const bad = [];
   for (let k = 1; k <= 9; k++) {
     const y = Math.floor((info.height * k) / 10);
     const at = (x) => { const i = (y * info.width + x) * info.channels; return `${data[i]},${data[i + 1]},${data[i + 2]}`; };
     let run = 1;
     for (let x = x0 + 1; x <= x0 + 64 * cellDev; x++) {
       if (x < x0 + 64 * cellDev && at(x) === at(x - 1)) { run++; continue; }
       runs++;
       if (run % cellDev !== 0) bad.push([y, x, run]);
       run = 1;
     }
   }
   console.log(JSON.stringify({ size: [info.width, info.height], cellDev, runs, bad }));
   ```
   For each `viewport` of `1440x900x1`, `1440x900x1.25`, `1440x900x1.5`, `1440x900x2` (one fresh page, `emulate` then reload each time): `evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 800)); const c = document.querySelector('canvas[data-field]'); return { grid: window.__pn.grid(), canvas: [c.width, c.height] }; }`, `take_screenshot` → `E\1440x900-dark-dpr<1|125|150|200>.png`, then in Bash `node .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-15/runs.mjs <that png> <grid.cellDev>`. Expected grids and runs [writer's run]:
   | DPR | grid (`cellDev`, `cellCss`, `cols` × `rows`) | canvas | runs.mjs |
   |---|---|---|---|
   | 1 | 5, 5, 288 × 180 | 1440 × 900 | `bad: []` [346 runs] |
   | 1.25 | 6, 4.8, 300 × 188 | 1800 × 1125 | `bad: []` [408 runs] |
   | 1.5 | 7, 4.667, 309 × 193 | 2160 × 1350 | `bad: []` [449 runs] |
   | 2 | 9, 4.5, 320 × 200 | 2880 × 1800 | `bad: []` [277 runs] |
   (Before Index amendment A2 the ×1.25 grid came out as a 1440 × 900 backing store with `cellDev` 6, because DevTools emulation reports the physical device box.)
10. **Phone band, touch (3.1.13, 3.3.2.5, R10).** Fresh page, `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`, reload, `evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 800)); const c = document.querySelector('canvas[data-field]'); const r = c.getBoundingClientRect(); return { grid: window.__pn.grid(), canvas: [c.width, c.height], band: [r.top, r.height], parity: window.__pn.parity() }; }` → `grid` `{ dpr: 2, widthDev: 780, heightDev: 473, cellDev: 4, cellCss: 2, cols: 195, rows: 119, maskW: 390, maskH: 238 }`, canvas `[780, 473]`, band height about 236.3, parity passing. Then `evaluate_script` `() => { const c = document.querySelector('canvas[data-field]'); const r = c.getBoundingClientRect(); window.__rings = setInterval(() => c.dispatchEvent(new PointerEvent('pointerdown', { clientX: 195, clientY: r.top + r.height / 2, pointerType: 'touch', isPrimary: true, button: 0, bubbles: true })), 300); return true; }`, `take_screenshot` → `E\390x844-dark-ring.png`, `evaluate_script` `() => { clearInterval(window.__rings); window.dispatchEvent(new PointerEvent('pointercancel', { pointerType: 'touch', bubbles: true })); return true; }`.
11. **Console and screenshots (8.2.1, 8.3.2, 8.3.3).** For each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` and each `colorScheme` `dark`, `light`: `new_page` with `isolatedContext: "t15-console-<width>-<look>"`, `emulate`, `navigate_page` reload, wait 2 s (`evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 2000)); return document.documentElement.hasAttribute('data-field-ready'); }` → true), `list_console_messages` `types: ["error", "warn"]` → `<no console messages found>`, `take_screenshot` → `E\<width>x<height>-<look>.png`, `close_page`.

12. **Back from `github` (3.7.5, 3.7.3; Review Focus).** The `github` link opens in the same tab (3.5.12), so Back from GitHub is the most common way a visitor returns, and Chrome restores the page from the back/forward cache: the field must resume where it was. The dev server's HMR WebSocket keeps pages out of that cache, so this check runs on a local preview build. Stop the dev server (the background Bash task, then PowerShell `Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`), run `VITE_PN_DEBUG=1 npm run build`, and start `npx vite preview --port 4173 --strictPort` with `run_in_background`. Fresh page (`isolatedContext: "t15-bfcache"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:4173/` with `initScript` `window.__shows = []; addEventListener('pageshow', (e) => window.__shows.push(e.persisted));`; wait 1 s (`evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 1000)); return document.documentElement.hasAttribute('data-field-ready'); }` → true). Then `navigate_page` `type: "url"`, `url: "http://localhost:4173/robots.txt"` (a same-origin page; the résumé enters the cache), wait 2 s, `navigate_page` `type: "back"`, and run:
   ```js
   async () => {
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const snap = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(400 * 400 * 4); gl.readPixels(900, 250, 400, 400, gl.RGBA, gl.UNSIGNED_BYTE, px); let h = 2166136261; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 16777619); } resolve(h >>> 0); }));
     const a = await snap();
     await new Promise((r) => setTimeout(r, 500));
     const b = await snap();
     const nav = performance.getEntriesByType('navigation')[0];
     return { shows: window.__shows, ready: document.documentElement.hasAttribute('data-field-ready'), cls: document.documentElement.className, moving: a !== b, parity: window.__pn.parity(), clock: document.querySelector('time[data-clock-time]').textContent, notRestored: nav && 'notRestoredReasons' in nav ? nav.notRestoredReasons : 'n/a' };
   }
   ```
   Expected: `shows` `[false, true]` (the first load, then the restore from the back/forward cache), `ready` true, `cls` `""` (no fallback fired), `moving` true (the loop resumed after `pageshow`), `parity.maxErr255` ≤ 3 and `tierMismatchPct` ≤ 0.5, `clock` the current `h:mm AM|PM PDT|PST`; `list_console_messages` `types: ["error", "warn"]` → none. `take_screenshot` → `E\1440x900-dark-back.png`. A `shows` of `[false]` means Chrome did not restore the page from the cache (the Back was a fresh load): record `notRestored`, which names the blocker, and report it as a finding for the controller; it is not a Task 15 failure. Stop the preview server (`Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`) and `close_page`.

Then run `npm run build` so `dist/` is the production build again, and stop any leftover `vite` node child (PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parsanaji.com*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm:$false }`). Write every measured value above into `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-15-report.md`.

- [ ] **Step 10: Commit**

```bash
git add src/app.ts src/debugHooks.ts src/main.ts src/vite-env.d.ts tests/appColors.test.ts
git commit -m "feat(app): the live dither field under the rail

App owns the renderer, pointer, rings, loop and lifecycle: pointer
repel, click Shockwave, resize and DPR regrids, visibility, bfcache,
context loss with restore, the 3 s readiness fallback, the FPS probe
and the field side of the theme crossfade. main.ts gates the field and
installs window.__pn behind PN_DEBUG.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Debug panel and preview builds

- **Files:** Create `src/tweaks.ts`; Modify `src/main.ts` (the `?debug` branch), `.github/workflows/deploy.yml` (only the 7.3.2 build step: `- run: npm run build` with `env: VITE_PN_DEBUG: ${{ github.ref_name == 'main' && '0' || '1' }}`).
- **Interfaces:**
  - Consumes: Task 15 `App` (`applyParams(): void`, `konami(): void`, `replayEntry(): void`, `get grid(): Grid | null`, `debug(): AppDebug` with `setFrozen(frozen: boolean): void`), `PN_DEBUG`, the slice-2 `main.ts`; Task 9 `FieldParams`, `DEFAULT_FIELD`, `Density`, `Intensity`.
  - Produces:
    ```ts
    // src/tweaks.ts (loaded only by `await import('./tweaks')` when PN_DEBUG && ?debug)
    export function prepareTweaks(params: FieldParams): (app: App) => void;
    ```
    `prepareTweaks` applies saved values from `localStorage['pn.tweaks']` to `params` before `App.start` (only changed keys are stored; `deepAssign` and `diff` copied verbatim from the teaser panel, `git show 3e64808:src/tweaks.ts`) and returns `mount(app)`. `mount` creates `new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 })` with `import '../node_modules/lil-gui/dist/lil-gui.css'` (Index amendment A1: lil-gui's `exports` map hides the bare `lil-gui/dist/lil-gui.css`), the 4.12.3 folders, ranges and steps (`t3 ≤ t2` sets `t3 = t2 + 0.01`), and the buttons replay entry (`app.replayEntry()`), Konami (`app.konami()`), toggle theme (clicks `[data-theme-toggle]`), freeze time (`app.debug().setFrozen(…)`), copy JSON, reset (removes `pn.tweaks` and reloads). Cell and density changes call `app.applyParams()` (regrid).
  - Produces (`src/main.ts` after Task 16): in `boot()`, just before `App.start`: `let mountTweaks: ((a: App) => void) | null = null; if (PN_DEBUG && query.has('debug')) { const { prepareTweaks } = await import('./tweaks'); mountTweaks = prepareTweaks(params); }`; after the debug hooks: `if (app) mountTweaks?.(app);`.

No new unit-test file (index). The panel's persistence helpers are the teaser's `deepAssign` and `diff`, verbatim (`git show 3e64808:src/tweaks.ts`).

- [ ] **Step 1: Write `src/tweaks.ts` (spec 4.12.2, 4.12.3; Index amendment A1)**

Every control calls `live()`: it stores only the changed keys and runs `App.applyParams()` (uniforms on the next frame, regrid for cell and density). Storage failures and parse errors are silent (4.12.2: no warnings on previews).
```ts
// Debug panel (spec 4.12). Loaded only by `await import('./tweaks')` when PN_DEBUG && ?debug, so production never carries it.
import GUI from 'lil-gui';
// lil-gui 0.21.0's package.json "exports" exposes only ".", so the bare 'lil-gui/dist/lil-gui.css' of spec 4.12.2 fails to
// resolve; the relative path reaches the same file. A same-origin stylesheet is what the CSP (style-src 'self') allows.
import '../node_modules/lil-gui/dist/lil-gui.css';
import type { App } from './app';
import type { FieldParams } from './field/params';

const STORAGE_KEY = 'pn.tweaks';

type Tree = Record<string, unknown>;

function isPlainObject(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copies saved values onto `target` only where the key exists and the type matches; objects recurse into objects. */
function deepAssign(target: Tree, source: Tree): void {
  for (const [key, value] of Object.entries(source)) {
    if (!Object.hasOwn(target, key)) continue;
    const current = target[key];
    if (isPlainObject(current)) {
      if (isPlainObject(value)) deepAssign(current, value);
    } else if (value !== null && typeof value === typeof current) {
      target[key] = value;
    }
  }
}

/** The subset of `current` that differs from `base` (same shape), or undefined when nothing differs. */
function diff(current: Tree, base: Tree): Tree | undefined {
  const out: Tree = {};
  for (const [key, value] of Object.entries(current)) {
    const before = base[key];
    if (isPlainObject(value) && isPlainObject(before)) {
      const sub = diff(value, before);
      if (sub) out[key] = sub;
    } else if (value !== before) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Spec 4.12.2: applies the saved changes (pn.tweaks) to `params` before App.start and returns mount(app). */
export function prepareTweaks(params: FieldParams): (app: App) => void {
  const baseline = structuredClone(params);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isPlainObject(parsed)) deepAssign(params as unknown as Tree, parsed);
    }
  } catch {
    // unreadable or blocked storage: start from the defaults, silently (4.12.2: no warnings on previews)
  }
  return (app: App) => {
    mount(params, baseline, app);
  };
}

function mount(params: FieldParams, baseline: FieldParams, app: App): GUI {
  const gui = new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 });
  const persist = (): void => {
    try {
      const changed = diff(params as unknown as Tree, baseline as unknown as Tree);
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage blocked: the change still applies for this session
    }
  };
  /** Every change persists and goes through App.applyParams(): uniforms on the next frame, regrid for cells. */
  const live = (): void => {
    persist();
    app.applyParams();
  };

  const cells = gui.addFolder('cells');
  cells.add(params, 'density', ['sparse', 'medium', 'dense']).onChange(live);
  cells.add(params.cell, 'k', 0.001, 0.008, 0.0001).onChange(live);
  cells.add(params.cell, 'minCss', 1, 6, 0.5).onChange(live);
  cells.add(params.cell, 'maxCss', 2, 12, 0.5).onChange(live);

  const surface = gui.addFolder('surface');
  surface.add(params, 'intensity', ['subtle', 'medium', 'lively']).onChange(live);
  surface.add(params, 'flowSpeed', 0, 3, 0.05).onChange(live);
  surface.add(params.shape, 'warpScalePx', 80, 600, 10).onChange(live);
  surface.add(params.shape, 'mainScalePx', 60, 400, 5).onChange(live);
  surface.add(params.shape, 'warpAmp', 0, 6, 0.1).onChange(live);
  surface.add(params.shape, 'level', 0, 0.6, 0.01).onChange(live);
  surface.add(params.shape, 'gain', 0.5, 4, 0.05).onChange(live);

  const tiers = gui.addFolder('tiers');
  const keepOrder = (): void => {
    if (params.tiers.t3 <= params.tiers.t2) {
      params.tiers.t3 = Math.round((params.tiers.t2 + 0.01) * 1000) / 1000; // 4.12.3: t3 stays above t2
      t3.updateDisplay();
    }
    live();
  };
  tiers.add(params.tiers, 't2', 0.4, 0.9, 0.005).onChange(keepOrder);
  const t3 = tiers.add(params.tiers, 't3', 0.6, 1, 0.005).onChange(keepOrder);

  const pointer = gui.addFolder('pointer');
  pointer.add(params.pointer, 'radiusK', 0.1, 0.5, 0.01).onChange(live);
  pointer.add(params.pointer, 'radiusSp', 0, 6, 0.5).onChange(live);
  pointer.add(params.pointer, 'warpK', 0, 1, 0.01).onChange(live);
  pointer.add(params.pointer, 'boost', 0, 0.4, 0.01).onChange(live);
  pointer.add(params.pointer, 'lerp', 0.02, 1, 0.01).onChange(live);
  pointer.add(params.pointer, 'riseMs', 0, 1000, 10).onChange(live);
  pointer.add(params.pointer, 'fallMs', 0, 2000, 10).onChange(live);
  pointer.add(params.pointer, 'velNorm', 200, 4000, 50).onChange(live);
  pointer.add(params.pointer, 'velRadiusGain', 0, 0.5, 0.01).onChange(live);

  const ripple = gui.addFolder('ripple');
  ripple.add(params.ripple, 'max', 1, 8, 1).onChange(live);
  ripple.add(params.ripple, 'lifeS', 0.5, 6, 0.1).onChange(live);
  ripple.add(params.ripple, 'amp', 0, 2, 0.05).onChange(live);
  ripple.add(params.ripple, 'speedSp', 1, 20, 0.5).onChange(live);
  ripple.add(params.ripple, 'sigmaSp', 0.5, 4, 0.1).onChange(live);
  ripple.add(params.ripple, 'gain', 0, 2, 0.05).onChange(live);

  const breath = gui.addFolder('breath');
  breath.add(params.breath, 'amp', 0, 0.05, 0.001).onChange(live);
  breath.add(params.breath, 'periodMs', 1000, 20000, 100).onChange(live);

  const mask = gui.addFolder('mask');
  mask.add(params.mask, 'holdDim', 0, 1, 0.01).onChange(live);
  mask.add(params.mask, 'ink', 0.7, 1, 0.01).onChange(live);
  mask.add(params.mask, 'edge', 0.01, 0.3, 0.01).onChange(live);
  mask.add(params.mask, 'meltPx', 0, 150, 1).onChange(live);
  mask.add(params.mask, 'heightFrac', 0.1, 0.8, 0.01).onChange(live);
  mask.add(params.mask, 'widthFrac', 0.3, 1, 0.01).onChange(live);

  const entry = gui.addFolder('entry');
  for (const key of ['gatherMs', 'holdMs', 'dissolveMs', 'scrimAtMs', 'revealAtMs', 'cleanupAtMs'] as const) {
    entry.add(params.entry, key, 0, 6000, 10).onChange(live);
  }
  entry.add(params.entry, 'skipMs', 0, 1000, 10).onChange(live);

  const konami = gui.addFolder('konami');
  for (const key of ['gatherMs', 'holdMs', 'dissolveMs'] as const) konami.add(params.konami, key, 0, 6000, 10).onChange(live);

  let frozen = false;
  gui.add({ replay: () => app.replayEntry() }, 'replay').name('replay entry');
  gui.add({ konami: () => app.konami() }, 'konami').name('Konami');
  gui.add({ toggle: () => document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click() }, 'toggle').name('toggle theme');
  const freeze = gui
    .add(
      {
        freeze: () => {
          frozen = !frozen;
          app.debug().setFrozen(frozen);
          freeze.name(frozen ? 'unfreeze time' : 'freeze time');
        },
      },
      'freeze',
    )
    .name('freeze time');
  gui.add({ copy: () => void navigator.clipboard?.writeText(JSON.stringify(params, null, 2)).catch(() => {}) }, 'copy').name('copy JSON');
  gui
    .add(
      {
        reset: () => {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // nothing stored
          }
          location.reload();
        },
      },
      'reset',
    )
    .name('reset');
  return gui;
}
```

- [ ] **Step 2: Add the `?debug` branch to `src/main.ts` (index "Produces (`src/main.ts` after Task 16)")**

Both hunks are exact before/after pairs in the Task 15 file.

`src/main.ts`, before (Task 15):
```ts
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  app = App.start({
```
After:
```ts
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  let mountTweaks: ((a: App) => void) | null = null;
  if (PN_DEBUG && query.has('debug')) {
    const { prepareTweaks } = await import('./tweaks');
    mountTweaks = prepareTweaks(params);
  }
  app = App.start({
```
`src/main.ts`, before (Task 15):
```ts
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
}
```
After:
```ts
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
  if (app) mountTweaks?.(app);
}
```

- [ ] **Step 3: Preview builds get `VITE_PN_DEBUG` (spec 7.3.2, the only workflow change)**

In `.github/workflows/deploy.yml`, before:
```yaml
      - run: npm test
      - run: npm run build
      - name: Deploy to Cloudflare Pages
```
After:
```yaml
      - run: npm test
      - run: npm run build
        env:
          VITE_PN_DEBUG: ${{ github.ref_name == 'main' && '0' || '1' }}
      - name: Deploy to Cloudflare Pages
```
Run `git diff --stat .github/workflows/deploy.yml` → `1 file changed, 2 insertions(+)`.

- [ ] **Step 4: Full gate, production build and preview build**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  27 passed (27)`, `Tests  237 passed (237)` (no new test file); typecheck prints no diagnostics; the build lists one `dist/assets/index-*.js` and one CSS file, no `tweaks-*` or `debugHooks-*` chunk. Then:
```bash
grep -c "lil-gui\|parsanaji tweaks\|__pn" dist/assets/*.js
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
VITE_PN_DEBUG=1 npx vite build
ls dist/assets
npm run build
```
Expected: `0` for every file; the 8.1.4 gzip number (record it; ≤ 60 KB; the assembler's scratch build of this exact Task 16 state measured 12.2 KB); the `VITE_PN_DEBUG=1` build lists `debugHooks-*.js` (about 1.5 kB), `tweaks-*.js` (about 34 kB, 9.3 kB gzip) and `tweaks-*.css` (about 10 kB, the lil-gui stylesheet); the final `npm run build` leaves `dist/` as the production build.

- [ ] **Step 5: Browser evidence on the dev server (spec 4.12.1–4.12.3)**

Start `npm run dev` with `run_in_background` (port 5173 or the one it prints), load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__select_page`, then `new_page` `http://localhost:5173/?debug` with `isolatedContext: "t16"`, `emulate` `1440x900x1` dark, reload.
1. Panel and regrid:
   ```js
   async () => {
     await new Promise((r) => setTimeout(r, 1000));
     const gui = document.querySelector('.lil-gui.lil-root');
     const folders = [...gui.querySelectorAll(':scope > .lil-children > .lil-gui > .lil-title')].map((t) => t.textContent);
     const buttons = [...gui.querySelectorAll(':scope > .lil-children > .lil-controller.lil-function .lil-name')].map((n) => n.textContent);
     const colsBefore = window.__pn.grid().cols;
     const select = gui.querySelector('select');
     select.value = 'dense';
     select.dispatchEvent(new Event('change'));
     await new Promise((r) => setTimeout(r, 200));
     return { title: gui.querySelector(':scope > .lil-title').textContent, folders, buttons, colsBefore, colsAfter: window.__pn.grid().cols, stored: localStorage.getItem('pn.tweaks'), position: getComputedStyle(gui).position };
   }
   ```
   Expected: `title` `parsanaji tweaks`; `folders` `["cells","surface","tiers","pointer","ripple","breath","mask","entry","konami"]`; `buttons` `["replay entry","Konami","toggle theme","freeze time","copy JSON","reset"]`; `colsBefore` 288, `colsAfter` 480 (dense: 3.456 CSS px → `cellDev` 3); `stored` `{"density":"dense"}` (only the changed key is stored); `position` `fixed` (the lil-gui stylesheet loaded, `injectStyles: false`).
2. Tiers apply on the next frame and keep their order:
   ```js
   async () => {
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const field2 = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(1440 * 900 * 4); gl.readPixels(0, 0, 1440, 900, gl.RGBA, gl.UNSIGNED_BYTE, px); let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] === 141 && px[i + 1] === 176 && px[i + 2] === 255) n++; resolve(n); }));
     const ctl = (name) => [...document.querySelectorAll('.lil-gui .lil-controller')].find((c) => c.querySelector('.lil-name')?.textContent === name);
     const setNumber = (name, value) => { const input = ctl(name).querySelector('input'); input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); };
     const before = await field2();
     setNumber('t2', 0.5);
     const after = await field2();
     setNumber('t2', 0.8);
     setNumber('t3', 0.7);
     return { before, after, t3: ctl('t3').querySelector('input').value, stored: localStorage.getItem('pn.tweaks') };
   }
   ```
   Expected: `after` clearly above `before` [190550 → 394625 field-2 pixels]; `t3` `0.81` (4.12.3: `t3 ≤ t2` sets `t3 = t2 + 0.01`); `stored` `{"density":"dense","tiers":{"t2":0.8,"t3":0.81}}`.
3. Freeze time: `async () => { const gl = document.querySelector('canvas[data-field]').getContext('webgl2'); const snap = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(400 * 400 * 4); gl.readPixels(900, 300, 400, 400, gl.RGBA, gl.UNSIGNED_BYTE, px); let h = 2166136261; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 16777619); } resolve(h >>> 0); })); const btn = (label) => [...document.querySelectorAll('.lil-gui .lil-controller.lil-function')].find((c) => c.textContent.trim() === label).querySelector('button'); const a1 = await snap(); await new Promise((r) => setTimeout(r, 300)); const a2 = await snap(); btn('freeze time').click(); const b1 = await snap(); await new Promise((r) => setTimeout(r, 300)); const b2 = await snap(); btn('unfreeze time').click(); return { running: a1 !== a2, frozen: b1 === b2 }; }` → `{ running: true, frozen: true }`.
4. Reload keeps only the changed keys: `navigate_page` `type: "reload"`, then `async () => { await new Promise((r) => setTimeout(r, 800)); const ctl = (name) => [...document.querySelectorAll('.lil-gui .lil-controller')].find((c) => c.querySelector('.lil-name')?.textContent === name); return { t2: ctl('t2').querySelector('input').value, cols: window.__pn.grid().cols, stored: localStorage.getItem('pn.tweaks') }; }` → `t2` `0.8`, `cols` 480, `stored` unchanged.
5. Reset: `() => { [...document.querySelectorAll('.lil-gui .lil-controller.lil-function')].find((c) => c.textContent.trim() === 'reset').querySelector('button').click(); return true; }`, wait for the reload, then `async () => { await new Promise((r) => setTimeout(r, 800)); return { stored: localStorage.getItem('pn.tweaks'), cols: window.__pn.grid().cols }; }` → `{ stored: null, cols: 288 }`.
6. `list_console_messages` `types: ["error", "warn"]` → `<no console messages found>` (DevTools may list an `issue` "A form field element should have an id or name attribute" for lil-gui's inputs; it is neither an error nor a warning). `take_screenshot` → `E\1440x900-dark-debug.png` with `E` = `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-16\` (`mkdir -p` it first). `close_page`; stop the dev server (the background Bash task) and any leftover `vite` node child (PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parsanaji.com*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm:$false }`).

- [ ] **Step 6: Commit**

```bash
git add src/tweaks.ts src/main.ts .github/workflows/deploy.yml
git commit -m "feat(debug): ?debug tuning panel and preview builds

lil-gui panel over FieldParams with the spec 4.12.3 folders, ranges
and buttons, saved as changed keys in pn.tweaks. CI builds every
branch except main with VITE_PN_DEBUG=1, so previews carry the panel
and window.__pn; production builds carry neither.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Push and watch the deploy (slice 2 closes)**

```bash
git push
export PATH="$PATH:/c/Program Files/GitHub CLI"
git rev-parse HEAD
gh run list --branch resume-screen --limit 1 --json databaseId,headSha,status,conclusion
gh run watch "$(gh run list --branch resume-screen --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```
Expected: the push updates `origin/resume-screen`; the newest run's `headSha` equals `git rev-parse HEAD` (if the list still shows the previous run, run the `gh run list` line again after a few seconds); `gh run watch` ends with `✓ … deploy` and exit code 0 (steps `npm ci`, `npm test`, `npm run build` with `VITE_PN_DEBUG=1`, Deploy). A red run stops the task: read `gh run view --log-failed` and report it.

- [ ] **Step 8: Preview evidence (slice-2 close, spec 8.2.1, 8.3, 7.2.1)**

`P` = `https://resume-screen.parsanaji-com.pages.dev`. Evidence directory `E` as in Step 5.
1. `curl -sI https://resume-screen.parsanaji-com.pages.dev/ | grep -i "content-security-policy"` → the unchanged CSP of `public/_headers` (`script-src 'self' https://static.cloudflareinsights.com`, `style-src 'self'`, …).
2. Console check: for each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` and `colorScheme` `dark`, `light`: `new_page` `P/` with `isolatedContext: "t16-preview-<width>-<look>"`, `emulate`, reload, wait 2 s, `evaluate_script` `() => document.documentElement.hasAttribute('data-field-ready')` → true, `list_console_messages` `types: ["error", "warn"]` → `<no console messages found>`, `take_screenshot` → `E\preview-<width>x<height>-<look>.png`, `close_page`.
3. Debug build on the preview: `new_page` `P/?debug` (`isolatedContext: "t16-preview-debug"`), `emulate` `1440x900x1` dark, reload, then `async () => { await new Promise((r) => setTimeout(r, 1500)); return { panel: !!document.querySelector('.lil-gui.lil-root'), position: getComputedStyle(document.querySelector('.lil-gui.lil-root')).position, styles: document.querySelectorAll('style').length, parity: window.__pn.parity(), grid: window.__pn.grid() }; }` → `panel` true, `position` `fixed` (the `tweaks-*.css` link loaded under the CSP), `styles` 0 (no injected `<style>`), `parity.maxErr255` ≤ 3 and `tierMismatchPct` ≤ 0.5, `grid.cols` 288. `list_console_messages` `types: ["error", "warn"]` → none (no "Refused to apply inline style" CSP report). `take_screenshot` → `E\preview-1440x900-dark-debug.png`. `close_page`.
4. Record the run id, the gzip number of Step 4, every value above and the screenshot names in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-16-report.md`. The controller then writes the slice-2 ledger line, updates the vault note and the memory file, and compacts (Execution Notes).
