# Architecture report: parsanaji.com résumé screen (Agent A, 2026-10-19)

Scope: the engine audit, the module map, the GLSL port of the Blueprint dither, sizing, the entry machine, lifecycle, the OG image, the bundle, tests and risks. This report contains no product code in `src/`. Everything below was checked against a working throwaway prototype (section 0.2).

Inputs read: `design-brief.md` (R1–R16), `picks/current.json`, Blueprint `part-c.html` (lines 138–250) and `part-d.html` (`renderSite`, `playEntry`, `clockText`), `part-b.html` (`.d-field` and related CSS), every file in `src/`, `tests/` and `scripts/`, `index.html`, `public/_headers`, the configs, `package.json`, `deploy.yml`, `docs/OPERATOR.md`, old spec sections 3.5–3.8, 4 and 5–8, the vault note, and Agent B's `reports/palette.md`. I folded in the controller's palette update: uniforms `uField0..uField3`, explicit tier thresholds, and the scrim alpha ≥ 0.86, so the renderer adds no dimming under the rail.

## 0. Decisions at a glance, and the evidence behind them

### 0.1 The ten load-bearing decisions

1. **Three.js leaves.** Remove `three` and `@types/three`. Keep `lil-gui` as a dev-only dependency for `?debug`. Add `harfbuzzjs` 1.6.3 and `fontverter` 2.0.0 as explicit devDependencies for the OG script. Both already sit in the lockfile as `subset-font` dependencies, so nothing new is downloaded.
2. **Raw WebGL2, two passes, two draws per frame.**
   - Pass 1 renders one texel per dither cell into an RGBA8 texture. It evaluates the Blueprint surface plus the pointer warp, breath, Shockwave rings and the name mask.
   - Pass 2 thresholds each cell with Bayer 8×8, maps it to 4 colour tiers, and writes device pixels with `texelFetch`, so the upscale is nearest by construction.
3. **Exact noise parity.**
   - The GLSL hash is a bit-exact port of the Blueprint `hash()` using `uint` arithmetic.
   - Two deliberate changes: x/y lattice coordinates get +256 (so the `uint` conversion never sees a negative), and z is masked to 8 bits, which makes the noise periodic in time with period 256.
   - The CPU computes the six time coordinates in double precision and wraps them mod 256, so the field never loses float precision and never jumps, however long the tab stays open.
4. **Cell size per the Blueprint `build()`:** `cellCss = clamp(0.0032 × fieldCssWidth, 2, 5) × {sparse 1.35, medium 1, dense 0.75}`.
   - It is then snapped to a whole number of device pixels: `cellDev = max(2, round(cellCss × dpr))`, made even when the DPR cap is engaged.
   - Medium at 1440 px is 5 device px per cell at DPR 1 and 9 at DPR 2. At 390 px it is 2 CSS px.
5. **Noise scale is absolute CSS px, as in the Blueprint** (main fbm 1 unit per 160 px, warp 1 per 240 px). The Blueprint's full-screen preview stage was about 1290 px wide, so the approved look already is the real-size look.
6. **Tier thresholds are explicit uniforms:** `uTiers = (0.66, 0.90)`. The surface curve peaks at 0.7031, so field-3 appears only in the name mask and in Shockwave rings. The pointer boost (+0.12, max 0.823) never reaches it. This matches Agent B's section 6.1 and the controller's instruction.
7. **Name mask = an R8 coverage texture at 2× the cell grid**, rasterised from text on a 2D canvas (Blueprint `setMask` rules: 40 % of the box height, capped at 84 % of the box width), sampled with LINEAR filtering. The dissolve is a per-cell static noise threshold plus a melt along the flow warp, not a fade.
8. **No-flash theme under the strict CSP:** an external, synchronous, same-origin classic script `public/theme-boot.js` in `<head>`. It sets `data-theme` from `localStorage['pn.theme']` and the entry pre-hide class before first paint. `script-src 'self'` already allows it, and Vite passes public-dir classic scripts through without a warning (verified in the Vite 8.3.4 source, `chunks/node.js:31855`).
9. **Shaders compile asynchronously** with `KHR_parallel_shader_compile`. Measured first compile: 206 ms on ANGLE/D3D11 (cached: 4 ms). The entry clock starts only when the programs are linked, fonts are settled and the tab is visible.
10. **OG image without a browser:**
    - harfbuzzjs shapes the text and emits glyph outlines as SVG paths, so no system fonts are involved.
    - The dither band comes from `src/field/surface.ts`, the same module the unit tests pin. Node ≥ 22.18 imports it directly through type stripping; the module is self-contained with no imports.
    - sharp upscales the band (nearest) and composites. Verified end to end.

### 0.2 Prototype evidence (scratch, not in the repo)

Prototype: `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-a\proto\` (`shaders.js` holds the exact GLSL in section 3). It ran in Chrome via DevTools MCP, renderer `ANGLE (NVIDIA GeForce RTX 2080 SUPER, Direct3D11)`.

| check | result |
|---|---|
| compile + link both programs | OK, `FRAMEBUFFER_COMPLETE` on the RGBA8 target |
| GPU pass 1 vs TS `surface()` at 1440×900, 288×180 cells | max abs error 0.0023 (0.58/255), mean 0.0009, tier mismatch 0.14–0.21 % (cells sitting on a Bayer threshold after 8-bit quantisation) |
| same at 390×844×3 (DPR capped to 2, 195×422 cells) | max error 0.0023, tier mismatch 0.14 % |
| GPU time per frame, both passes, 1440×900 DPR 1 (`EXT_disjoint_timer_query_webgl2`) | median 0.075 ms, p90 0.088 ms |
| frame rate | 165 fps (display refresh) |
| first shader compile | 206 ms async with `KHR_parallel_shader_compile` (0.9 ms on the main thread to submit); 4 ms when cached |
| console | no WebGL warnings or errors (one 404 for a missing favicon in the scratch page) |
| tier coverage at t = 20 s, 1440×900 | off 58 %, field-1 28 %, field-2 13.5 %, field-3 0 % (field-3 only with a ring or mask) |
| LCP when the rail fades in at 2.1 s (`proto/lcp.html`) | LCP entries: 48 ms (toggle button, 144 px²), then **2756 ms** (H1), then 2836 ms (paragraph). See risk 1 |
| OG pipeline (`og-proto.mjs`) | 1200×630 PNG, band raster 18 ms, harfbuzz 14.6.0 paths, no fontconfig, no system fonts |
| JetBrains Mono v2.304 subsets (`font-sizes.mjs`) | ASCII + `·—–●○…’“”é`: default 28.1 KB (400) / 29.2 KB (700); with `noLayoutClosure` 12.0 / 12.1 KB; with `noLayoutClosure` + `noHinting` 8.0 / 8.0 KB. See risk 2 |

Screenshots (all in `...\scratchpad\agent-a\`):
- `shot-idle-dark.png`: the idle field.
- `shot-hold-dark.png` and `shot-hold-light.png`: the name formed.
- `shot-dissolve-dark.png`: e = 0.5.
- `shot-light-ripple3.png`: a Shockwave at 0.8 s.
- `shot-light-pointer-ripple.png`: the repel lens.
- `shot-phone-hold.png`: 390×844×3.
- `og-proto.png`: the OG image.

---

## 1. Engine audit

KEEP = unchanged (path may move). ADAPT = same role, changed code. RETIRE = deleted on the branch (git history keeps it).

### 1.1 `src/`

| file | verdict | reason |
|---|---|---|
| `src/main.ts` | ADAPT | Boot order changes (section 2.4). The static-fallback path stays. The `console.error` in the catch goes, because R13 forbids console errors; log a `console.warn` in DEV only. |
| `src/app.ts` | ADAPT (rewrite) | Keeps the role (owns the field, the frame loop and the lifecycle hooks) and the pause/resume/pagehide/pageshow pattern. The sampling, N, morph and RippleScheduler code goes. |
| `src/content.ts` | ADAPT | Becomes the JS copy of the facts the scripts need: name, email, links, time zone, Konami text. The HTML stays the source of visible text; a test keeps the two equal. |
| `src/tweaks.ts` | ADAPT | Keep the pattern: `deepAssign`/`diff` persistence, dynamic import behind `import.meta.env.DEV && ?debug`. New key `pn.tweaks`; new folders over `FieldParams` (section 2.6). |
| `src/vite-env.d.ts` | KEEP | `vite/client` types cover `?raw` imports. |
| `src/styles.css` | ADAPT (rewrite) | New tokens (Agent B) and layout (Agent C). Keep the `.sr-only` pattern, the `@font-face` pattern and the reduced-motion block. |
| `src/boot/fonts.ts` | KEEP | `waitForFont()` gates the name mask (1200 ms timeout). |
| `src/boot/webgl.ts` | RETIRE | The scratch-canvas probe exists for three's context. The new `gl/context.ts` creates the real context once with `failIfMajorPerformanceCaveat` and returns `null` on failure, so a second probe context is pure cost. |
| `src/engine/ParticleField.ts` | RETIRE | Three.js Points renderer (R5). |
| `src/engine/defaults.ts` | RETIRE | Particle numbers. Replaced by `src/field/params.ts`. |
| `src/engine/types.ts` | RETIRE | `PHASE`, `PointerSlot`, `RippleState` and the particle `Params` have no consumer. |
| `src/engine/motion.ts` | RETIRE | `RippleScheduler` (random idle ripples) is not in R4. `breathScale()` moves to `src/field/flow.ts` with its tests. |
| `src/engine/sampler.ts` | ADAPT → `src/field/nameMask.ts` | Keep `Context2DLike`, `Canvas2DLike`, `CanvasFactory`, the injected-canvas testability and the letter-spacing fallback idea. Drop `scanAlpha`, `subsampleToN`, `glyphCenters` and `sampleText`. Layout becomes the Blueprint box fit. |
| `src/engine/easing.ts` | KEEP → `src/core/easing.ts` | Small and tested. Used by the pointer strength ease and the scramble settle. |
| `src/engine/prng.ts` | KEEP → `src/core/prng.ts` | `mulberry32` drives the scramble glyphs. `seedFromLocation` (`?seed=`) pins the dissolve threshold seed for screenshots. |
| `src/engine/time.ts` | KEEP → `src/core/time.ts` | `clampDt()` (50 ms cap, so no catch-up after a hidden tab). |
| `src/engine/quality.ts` | ADAPT → `src/core/quality.ts` | Keep `capDpr()` and `FpsProbe`. Drop `COUNT_CAP`, `widthClass`, `dotCount` and `degradedCount`, which are particle counts. |
| `src/shaders/field.vert`, `field.frag` | RETIRE | Particle shaders. |
| `src/shaders/noise.glsl` | RETIRE (replaced) | The Ashima simplex is not the approved look. A new `noise.glsl` holds the Blueprint hash value noise (section 3.4). |
| `src/ui/clock.ts` | ADAPT | 12-hour "2:36 PM PDT", aligned to minute boundaries (R9). |
| `src/ui/exitLine.ts` | ADAPT → `src/ui/links.ts` | Same rule (LinkedIn hidden until a URL exists), new markup ids. |

Moving `engine/` to `core/` is a rename (`git mv`). "engine" now means the dither field, and the four survivors are generic utilities.

### 1.2 `tests/`

| file | verdict | reason |
|---|---|---|
| `clock.test.ts` | ADAPT | 12-hour cases: `2:36 PM`, `12:05 AM`, PDT/PST, minute alignment. |
| `defaults.test.ts` | RETIRE → `params.test.ts` | `DEFAULT_FIELD` deep-copy test. |
| `easing.test.ts` | KEEP | Path update only. |
| `env.test.ts` | ADAPT | Raise the Node floor to 22.18 (type stripping for the OG script, section 7). Keep the ICU and `process.loadEnvFile` checks. |
| `fonts.test.ts` | KEEP | |
| `motion.test.ts` | ADAPT → `flow.test.ts` | Keep the `breathScale` cases. Drop the RippleScheduler cases. |
| `prng.test.ts` | KEEP | |
| `quality.test.ts` | ADAPT | Keep `capDpr` and `FpsProbe`. Drop the count tests. |
| `sampler.test.ts` | ADAPT → `nameMask.test.ts` | |
| `time.test.ts` | KEEP | |
| `webgl.test.ts` | ADAPT → `glContext.test.ts` | Same three cases (context returned, `null`, throws) against `createContext`, plus the attribute object. |
| `helpers/fakeCanvas.ts` | ADAPT | Add `actualBoundingBoxAscent/Descent` to the `measureText` result. |

### 1.3 `scripts/`, root and `public/`

| file | verdict | reason |
|---|---|---|
| `scripts/cf-api.mjs`, `cf-env.mjs`, `cf-setup-email.mjs`, `cf-setup-pages.mjs` | KEEP | Infra is unchanged. |
| `scripts/og-placeholder.mjs` | RETIRE | Replaced by `scripts/og-image.mjs` (section 7). |
| `scripts/subset-fonts.mjs` | ADAPT | Jobs become JetBrains Mono 400 + 700 with `noLayoutClosure: true` (risk 2). The 40 KB budget check stays. |
| `scripts/fonts-src/Geist-Black.woff2`, `GeistMono-Regular.woff2`, `LICENSE.txt` | RETIRE | Replace with `JetBrainsMono-Regular.woff2` (92,164 B) and `JetBrainsMono-Bold.woff2` (94,588 B) from the JetBrains Mono v2.304 release zip (`fonts/webfonts/`), plus `OFL.txt` (4,399 B). Verified downloadable from `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip`. |
| `public/fonts/GeistSans-Black.subset.woff2`, `GeistMono-Regular.subset.woff2` | RETIRE | Replaced by `JetBrainsMono-Regular.subset.woff2` and `JetBrainsMono-Bold.subset.woff2`. `LICENSE.txt` becomes the JetBrains OFL. |
| `public/_headers` | ADAPT (one block) | Add `/theme-boot.js` with `Cache-Control: no-cache`. The CSP is unchanged. |
| `public/favicon.svg` | ADAPT | Agent B's PN monogram with the internal `prefers-color-scheme` style (image context, not subject to the page CSP). |
| `public/og.png` | ADAPT | Regenerated by `npm run og` and committed. |
| `public/robots.txt` | KEEP | |
| `public/theme-boot.js` | NEW | Section 2.3. |
| `index.html` | ADAPT (rewrite body) | Head keeps meta, canonical, OG, Twitter, preload and JSON-LD. Changes: `theme-boot.js` before the stylesheet; `color-scheme: light dark`; two media-tagged `theme-color` metas; description = tagline; JetBrains preloads. The body is the real rail content (R13). |
| `vite.config.ts` | ADAPT | Delete `chunkSizeWarningLimit: 700` and its three comment. Keep `target: 'es2022'`, `assetsInlineLimit: 0`, `sourcemap: false`. |
| `vitest.config.ts` | KEEP | Node environment. |
| `tsconfig.json` | KEEP | `src/field/surface.ts` must stay erasable-only TypeScript with zero imports; a test enforces it (section 9). |
| `.github/workflows/deploy.yml` | KEEP | Node 22 is the latest 22.x (≥ 22.18). `npm ci`, `npm test`, `npm run build` and the wrangler deploy are unchanged. The branch `resume-screen` deploys to `resume-screen.parsanaji-com.pages.dev` automatically. |
| `docs/OPERATOR.md` | KEEP | Section 5 (iPhone check) gets new wording at the end; not part of this report. |
| `README.md` | ADAPT | New description and `npm run og`. |

### 1.4 `package.json`

- `dependencies`: `{}`. Remove `"three": "0.186.1"`.
- `devDependencies`:
  - remove `"@types/three": "0.186.0"`
  - keep `@types/node 22.20.5`, `lil-gui 0.21.0` (dev-only panel), `sharp 0.35.5`, `subset-font 2.9.0`, `typescript 5.9.3`, `vite 8.3.4`, `vitest 5.0.5`, `wrangler 4.151.0`
  - add `"harfbuzzjs": "1.6.3"` and `"fontverter": "2.0.0"` (exact pins, already resolved in `package-lock.json`)
- `scripts`: remove `og:placeholder`. Keep `og` (`node scripts/og-image.mjs`), `fonts`, `dev`, `build`, `test`, `typecheck`, `deploy`, `deploy:preview`.
- `engines.node`: `">=22.18.0"` (was 22.12.0). This is the first 22.x with type stripping on by default, which the OG script needs. CI's `node-version: 22` already resolves above it; local is 24.19.0.

---

## 2. Module map

Rules: one concept per file. Pure modules take their DOM or time dependencies as parameters so Vitest runs them in Node. "Callers" lists production callers; tests are in section 9.

### 2.1 Tree

```
public/theme-boot.js            pre-paint classic script (theme + entry pre-hide)
src/main.ts                     boot orchestration
src/app.ts                      App: field + models + loop + entry wiring
src/content.ts                  JS-side content constants
src/lifecycle.ts                visibility / pagehide / pageshow / resize / DPR / media queries / context loss
src/loop.ts                     rAF loop with clamped dt and sim time
src/gl/context.ts               WebGL2 context creation
src/gl/program.ts               compile/link (parallel), uniform map, GLSL header
src/gl/targets.ts               surface FBO, mask texture, fullscreen triangle VAO
src/shaders/fullscreen.vert     vertex shader (both passes)
src/shaders/noise.glsl          Blueprint hash / noise3 / fbm (pass 1 only)
src/shaders/surface.frag        pass 1
src/shaders/dither.frag         pass 2
src/field/surface.ts            pure TS twin of the GLSL math (+ flowZ); shared with scripts/og-image.mjs
src/field/params.ts             FieldParams + DEFAULT_FIELD (every tunable)
src/field/sizing.ts             cell size, grid, lattice spacing, pointer radius
src/field/flow.ts               intensity map, breathScale
src/field/pointer.ts            PointerModel
src/field/ripples.ts            RipplePool (Shockwave)
src/field/nameMask.ts           text → R8 coverage plane
src/field/entry.ts              EntryMachine (entry + Konami)
src/field/renderer.ts           DitherRenderer (owns every GL object, two passes)
src/theme/theme.ts              pure theme logic + ColorTween
src/theme/themeController.ts    DOM: toggle, matchMedia, data-theme, meta theme-color
src/ui/clock.ts                 footer clock
src/ui/links.ts                 LinkedIn visibility
src/ui/emailCopy.ts             "say hi" copy + fallback
src/ui/overlay.ts               "?" shortcuts overlay
src/eggs/shortcuts.ts           g / l / e / ? / Escape
src/eggs/scramble.ts            name scramble
src/eggs/konami.ts              Konami detector
src/eggs/greeting.ts            console greeting
src/core/prng.ts, easing.ts, time.ts, quality.ts   kept utilities
src/boot/fonts.ts               waitForFont
src/tweaks.ts                   dev-only lil-gui panel
scripts/og-image.mjs            build-time OG image
```

### 2.2 Exported APIs

```ts
// src/gl/context.ts — caller: renderer.ts
export const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
  preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
};
export function createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs?: WebGLContextAttributes): WebGL2RenderingContext | null; // never throws

// src/gl/program.ts — caller: renderer.ts
export const GLSL_HEADER_FRAG = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
export const GLSL_HEADER_VERT = '#version 300 es\n';
export interface ProgramHandle { program: WebGLProgram; uniforms: Readonly<Record<string, WebGLUniformLocation>> }
export interface PendingProgram { ready(): boolean; finish(): ProgramHandle } // finish() throws ShaderError on compile/link failure
export class ShaderError extends Error { readonly log: string; constructor(message: string, log: string) }
export function startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram;
export function uniformMap(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation>; // "uRipples[0]" -> "uRipples"

// src/gl/targets.ts — caller: renderer.ts
export interface SurfaceTarget { tex: WebGLTexture; fbo: WebGLFramebuffer; cols: number; rows: number }
export function createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget; // RGBA8, NEAREST, CLAMP; throws if incomplete
export function createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture; // R8, LINEAR, CLAMP
export function createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer };
export function deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void;

// src/field/surface.ts — callers: app.ts (flowZ only; tree-shaken otherwise), scripts/og-image.mjs, tests
export const NOISE_OFFSET = 256;
export const Z_PERIOD = 256;
export function hash3(x: number, y: number, z: number): number;
export function noise3(x: number, y: number, z: number): number;
export function fbm(x: number, y: number, z1: number, z2: number): number;
export function flowZ(tSec: number, intensity: number, out?: Float32Array): Float32Array; // 6 values in [0, 256)
export interface SurfaceShape { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number }
export const BLUEPRINT_SHAPE: SurfaceShape; // { 240, 160, 2.6, 0.3, 2.1 }
export function surface(xCss: number, yCss: number, z: ArrayLike<number>, s?: SurfaceShape): number;
export interface Ring { x: number; y: number; radius: number; amp: number; sigma: number; gain: number }
export function ringGain(xCss: number, yCss: number, ring: Ring): number; // gain * amp * exp(-(d - r)^2 / (2 sigma^2))
export const BAYER8: readonly number[];
export function bayerThreshold(i: number, j: number): number; // (BAYER8[(i&7)|((j&7)<<3)] + 0.5) / 64
export function tierOf(v: number, i: number, j: number, t2?: number, t3?: number): 0 | 1 | 2 | 3; // defaults 0.66, 0.9
export function tierGrid(cols: number, rows: number, cellCss: number, tSec: number, intensity: number, rings?: readonly Ring[]): Uint8Array;

// src/field/params.ts — callers: main.ts, app.ts, renderer.ts, tweaks.ts
export type Density = 'sparse' | 'medium' | 'dense';
export type Intensity = 'subtle' | 'medium' | 'lively';
export interface FieldParams { /* the exact tree in section 2.5 */ }
export const DEFAULT_FIELD: FieldParams;
export function cloneField(p: FieldParams): FieldParams; // structuredClone

// src/field/sizing.ts — callers: app.ts
export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number }
export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number;
export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid;
export function latticeSpacing(fieldCssW: number): number; // Blueprint sp = clamp(w / 48, 8, 40)
export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number; // min(w,h)*0.28 + 2*sp

// src/field/flow.ts — callers: app.ts
export const INTENSITY_K: Readonly<Record<Intensity, number>>; // { subtle: 0.55, medium: 1, lively: 1.7 }
export function breathScale(tMs: number, amp: number, periodMs: number): number; // moved verbatim from engine/motion.ts

// src/field/pointer.ts — callers: app.ts
export type PointerKind = 'mouse' | 'pen' | 'touch';
export class PointerModel {
  constructor(p: FieldParams['pointer']);
  move(x: number, y: number, kind: PointerKind): void;  // field-space CSS px (raw)
  down(x: number, y: number, kind: PointerKind): void;  // touch snaps the eased point to the raw point
  release(): void;                                      // pointerup (touch), pointercancel, pointerleave, window blur
  tick(dtMs: number): void;
  get x(): number; get y(): number;
  get strength(): number;   // eased 0..1
  get speed(): number;      // px/s of the eased point
  get velFactor(): number;  // min(speed / velNorm, 1)
  get settled(): boolean;   // strength is at its target and the eased point is within 0.25 px of raw (reduced-motion idle check)
}

// src/field/ripples.ts — callers: app.ts
export class RipplePool {
  constructor(p: FieldParams['ripple']);
  spawn(x: number, y: number, tSec: number): void;           // drops the oldest at p.max
  write(tSec: number, sp: number, out: Float32Array): number; // fills 8 × vec4, returns the active count, prunes expired
  clear(): void;
  get count(): number;
}

// src/field/nameMask.ts — callers: app.ts
export interface Canvas2DLike { /* as sampler.ts */ }  export type CanvasFactory = (w: number, h: number) => Canvas2DLike;
export interface MaskBox { x: number; y: number; w: number; h: number } // field-space CSS px
export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number } // supersample = 2
export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }
export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number;
export function rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane;
export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array;

// src/field/entry.ts — callers: app.ts
export type EntryPhase = 'idle' | 'pending' | 'gather' | 'hold' | 'dissolve' | 'done';
export type EntryEvent = 'start' | 'scrim' | 'reveal' | 'done' | 'cleanup';
export interface EntryTimings { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number | null; revealAtMs: number | null; cleanupAtMs: number | null }
export const ENTRY_TIMINGS: EntryTimings;  // { 900, 1000, 800, 1900, 2100, 3300 }
export const KONAMI_TIMINGS: EntryTimings; // { 900, 1500, 800, null, null, null }
export class EntryMachine {
  constructor(t: EntryTimings, emit: (e: EntryEvent) => void);
  arm(): void;                                  // idle -> pending
  setReady(ready: boolean): void;               // programs linked + mask uploaded + font settled
  tick(dtMs: number, visible: boolean): number; // returns e in 0..1 (mask progress, eased)
  skip(fastMs?: number): void;                  // focus entered the rail, reduced motion turned on, context lost; default 250 ms dissolve
  get phase(): EntryPhase; get elapsedMs(): number;
}
export function entryProgress(tMs: number, t: EntryTimings): number; // pure curve (section 5)

// src/field/renderer.ts — callers: app.ts
export interface FieldColors { f0: RGB; f1: RGB; f2: RGB; f3: RGB }
export interface FrameInputs {
  z: Float32Array; breath: number; center: [number, number];
  pointer: { x: number; y: number; radius: number; strength: number };
  ripples: Float32Array; rippleSigma: number; maskE: number; colors: FieldColors;
}
export class DitherRenderer {
  static create(canvas: HTMLCanvasElement, params: FieldParams): DitherRenderer | null; // context + programs started, never throws
  get ready(): boolean;            // polls COMPLETION_STATUS_KHR, then finish(); a ShaderError marks the renderer failed
  get failed(): boolean;
  get lost(): boolean;
  clear(c: RGB): void;             // first paint before ready (avoids the black alpha:false canvas)
  resize(grid: Grid): void;        // canvas.width/height + surface target when cols/rows change
  setMask(plane: MaskPlane | null): void;
  setParams(p: FieldParams): void; // shape, level, tiers, warp, ripple gain, mask mix
  render(f: FrameInputs): void;    // exactly two drawArrays(TRIANGLES, 0, 3)
  restore(): boolean;              // after webglcontextrestored: rebuild programs, VAO, targets, mask
  dispose(): void;
}

// src/loop.ts — callers: app.ts
export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }
export function createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop;
// onFrame returns false to go idle (reduced-motion on-demand rendering); wake() schedules one frame; dt = clampDt(now - last); start() resets last

// src/lifecycle.ts — callers: main.ts
export interface LifecycleTarget {
  pause(): void; resume(): void; resize(): void; dprChanged(): void;
  reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
}
export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void;

// src/app.ts — callers: main.ts, tweaks.ts
export interface AppOptions {
  canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
  entry: boolean; rail: HTMLElement | null; doc: Document; win: Window;
}
export class App implements LifecycleTarget {
  static start(o: AppOptions): App | null;  // null = no field (fallback already applied by caller)
  setColors(c: FieldColors, animate: boolean): void; // 300 ms ColorTween when animate
  konami(): void;                           // ignored unless the entry is done and no Konami is playing
  replayEntry(): void;                      // tweaks button
  applyParams(): void;                      // tweaks live update
  onFallback(fn: () => void): void;         // fired on compile failure / unrecoverable context loss
  dispose(): void;
  /* LifecycleTarget methods */
}

// src/theme/theme.ts — callers: themeController.ts, app.ts, main.ts
export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';
export const THEME_KEY = 'pn.theme';
export type RGB = readonly [number, number, number]; // sRGB 0..1
export function readPref(storage: Pick<Storage, 'getItem'> | null): ThemePref;          // try/catch; anything else -> 'system'
export function writePref(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePref): void; // 'system' removes the key
export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme;
export function togglePref(current: Theme, systemDark: boolean): ThemePref;             // flips; returns 'system' when the flip equals the OS look
export function parseHex(hex: string): RGB;                                              // '#rrggbb' (trimmed) -> 0..1
export function lerpRGB(a: RGB, b: RGB, t: number): RGB;
export class ColorTween {
  constructor(durMs?: number);                                     // 300
  set(c: FieldColors): void;                                       // no animation
  start(to: FieldColors, nowMs: number): void;                     // from = current value
  sample(nowMs: number): FieldColors;                              // linear, wall clock, clamps at 1
  get active(): boolean;
}

// src/theme/themeController.ts — callers: main.ts
export interface ThemeControllerDeps {
  doc: Document; storage: Storage | null; systemDark: MediaQueryList; button: HTMLButtonElement | null;
  onChange: (colors: FieldColors, animate: boolean) => void;
}
export function initTheme(d: ThemeControllerDeps): { readonly theme: Theme; readonly colors: FieldColors; dispose(): void };
export function readFieldColors(doc: Document): FieldColors; // getComputedStyle(root) --field-0..3

// src/ui/clock.ts — callers: main.ts
export function formatClock(date: Date, timeZone?: string, locale?: string): { time: string; zone: string }; // { '2:36 PM', 'PDT' } built from formatToParts
export function msToNextMinute(date: Date): number;
export function startClock(el: HTMLTimeElement, timeZone: string, now?: () => Date): () => void; // writes "2:36 PM PDT" + datetime attr

// src/ui/links.ts — callers: main.ts
export function initLinks(linkedinUrl: string, doc?: Document): void;

// src/ui/emailCopy.ts — callers: main.ts, shortcuts handler
export type CopyResult = 'copied' | 'fallback';
export function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined): Promise<CopyResult>;
export function initEmailCopy(link: HTMLAnchorElement, email: string, deps?: { clipboard?: Pick<Clipboard, 'writeText'>; assign?: (url: string) => void; holdMs?: number }): { trigger(): Promise<CopyResult>; dispose(): void };

// src/ui/overlay.ts — callers: main.ts
export function initOverlay(panel: HTMLElement, doc: Document): { toggle(): void; close(): void; readonly open: boolean; dispose(): void };

// src/eggs/shortcuts.ts — callers: main.ts
export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';
export interface KeyLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean; target: EventTarget | null }
export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null;
export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void;

// src/eggs/scramble.ts — callers: main.ts
export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';
export function scrambleText(target: string, tMs: number, durMs: number, stepMs: number, rand: (step: number, i: number) => number): string;
export function initScramble(el: HTMLElement, text: string, opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean }): () => void;

// src/eggs/konami.ts — callers: main.ts
export const KONAMI: readonly string[]; // ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a
export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void };

// src/eggs/greeting.ts — callers: main.ts
export function greet(log?: (...args: unknown[]) => void, email?: string): void;

// src/content.ts — callers: main.ts, app.ts
export const CONTENT: {
  readonly name: 'Parsa Naji'; readonly email: 'info@parsanaji.com'; readonly konamiText: 'nice.';
  readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string };
  readonly clock: { readonly timeZone: 'America/Los_Angeles' };
};
```

### 2.3 Theme bootstrap under the CSP (exact mechanism)

What the CSP allows (from `public/_headers` and old spec 7.3):
- `script-src 'self' https://static.cloudflareinsights.com` allows external same-origin scripts, classic or module. It allows no inline script.
- The JSON-LD block is a data block that is never executed, so it is outside `script-src`.
- `style-src 'self'` blocks `<style>` elements and `style=""` attributes, including `setAttribute('style', …)`.
- `style-src 'self'` does not block CSSOM writes (`el.style.setProperty(...)`), Web Animations (`el.animate`), or class and attribute changes.
- Rule for builders: state changes are classes or `data-*` attributes, never `style` attributes.

`public/theme-boot.js`, served at `/theme-boot.js` (about 380 B):

```js
(function () {
  var d = document.documentElement, t = null, rm = false;
  try { t = localStorage.getItem('pn.theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  try { rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (!rm && !/[?&]noentry\b/.test(location.search)) d.classList.add('pn-entry');
  d.classList.add('js');
})();
```

- **Placement:** `<script src="/theme-boot.js"></script>` (classic, no `async`/`defer`) as the first child of `<head>` after the charset and viewport metas, before `<link rel="stylesheet">`. The preload scanner fetches it in parallel with the CSS and the fonts. It blocks parsing only for its own run (well under 1 ms). Render is already blocked on the CSS, so it adds no round trip on a cold load.
- **Vite:** `<script src="/theme-boot.js">` without `type="module"` referencing a `public/` file is copied as-is, with no warning (`isPublicFile` branch, Vite 8.3.4).
- **CSS side:** Agent B's token blocks.
  - Dark is the base `:root`.
  - Light applies under `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) … }` and under `:root[data-theme="light"]`.
  - No JS + light OS gives light; no JS + dark OS gives dark. A stored choice is applied before first paint.
- **Entry pre-hide** (Agent C writes the rules; these are the class contract):
  - `html.pn-entry .rail > *` and `html.pn-entry .scrim` start at `opacity: 0`.
  - CSS failsafe, in case `main.ts` never runs or crashes: `html.pn-entry:not(.pn-entry-js) .rail > *, html.pn-entry:not(.pn-entry-js) .scrim { animation: pn-failsafe 1ms linear 4000ms forwards }` with `@keyframes pn-failsafe { to { opacity: 1 } }`.
  - `main.ts` adds `pn-entry-js` the moment it takes control, which cancels the failsafe.
  - Without JS the class is never added, so the content shows at once (R13).
- **Theme crossfade (R7):**
  - Register the transitioning tokens with `@property` (`--bg`, `--fg`, `--fg-2`, `--accent`, `--accent-2`, `--line`, `--focus-ring`, `--status-dot`, `--copied`, `--scrim-solid`, `--scrim-mid`, `--scrim-clear`), each `syntax: '<color>'; inherits: true; initial-value: <dark value>`.
  - `html.theme-anim { transition: <those properties> 300ms linear; }`.
  - Leave `--field-0..3` **unregistered**, so `getComputedStyle(root).getPropertyValue('--field-0')` returns the target hex the moment `data-theme` changes. CSS stays the single source of the field colours and JS never duplicates them; a test checks their format (section 9).
  - On a toggle, `themeController` runs these steps:
    1. add `theme-anim`;
    2. set or remove `data-theme` (an explicit pref sets the attribute; `'system'` removes it);
    3. `writePref`;
    4. read the `--field-*` targets and call `onChange(colors, true)`, which starts the `ColorTween` on `performance.now()`, linear in sRGB over 300 ms (CSS hex transitions interpolate in sRGB too, so the two stay in step);
    5. set both `theme-color` metas' `content` to `--theme-color`, or restore their original values for `'system'` (Agent B 5.3);
    6. update `aria-pressed`;
    7. remove `theme-anim` after 320 ms.
  - An OS change (`matchMedia('(prefers-color-scheme: dark)')` `change`) runs the same steps when the pref is `'system'`.
- **Toggle contract** for Agent C:
  - Markup: `<button id="theme-toggle" type="button" aria-label="Dark theme" aria-pressed="true|false" hidden>`. JS removes `hidden`; without JS there is no toggle, the OS decides.
  - `aria-pressed = (theme === 'dark')`.
  - Glyph: JetBrains Mono has `●` (U+25CF) and `○` (U+25CB), but **no** `◐ ☾ ☀ ☼`. Pick from the subset or use a tiny SVG.

### 2.4 Boot order (`src/main.ts`)

1. Synchronous, before any await:
   - `greet()`
   - `initLinks(CONTENT.links.linkedin)`
   - `initEmailCopy`
   - `startClock`
   - `initTheme` (returns the resolved colours)
   - `initOverlay`
   - `initShortcuts`
   - `initScramble`
   - Konami wiring (calls `app?.konami()`)
   - `const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches`
2. Field gate. Go to the fallback when any of these holds: `?nowebgl`, `matchMedia('(forced-colors: active)').matches` (Agent B 6.5: hide the canvas), the `#field` canvas is missing, or `App.start(...)` returns `null`.
   - Fallback: `html.classList.add('no-webgl')`, then remove `pn-entry` and `pn-entry-js`, so the content appears instantly with no transition.
3. `App.start` does the rest:
   - `DitherRenderer.create`, then `clear(colors.f0)` in the same task (no black flash);
   - `bindLifecycle`;
   - `loop.start()`;
   - add `pn-entry-js`, then `entry.arm()` (only when `pn-entry` is on `<html>`);
   - start `waitForFont('700 10px "JetBrains Mono"', 1200)`;
   - when the programs are ready and the font has settled: rasterise the mask, `setMask`, then `entry.setReady(true)`.
   - If the programs fail (`ShaderError`) or are not ready within 3000 ms, run `onFallback` (as in step 2) and dispose.
4. `if (import.meta.env.DEV && query.has('debug'))`: `await import('./tweaks')`, then mount. In DEV only, expose `window.__pn = { parity(), gpuTime(), setTime(), setE() }` for the browser checks in section 9.2. Both blocks are dead code in production because `import.meta.env.DEV` is replaced with `false`.
5. Errors: every promise is caught. Production logs nothing at error or warn level; DEV logs one `console.warn`.

### 2.5 `DEFAULT_FIELD` (every tunable, exact values)

```ts
export const DEFAULT_FIELD: FieldParams = {
  density: 'medium',                       // R4
  intensity: 'medium',                     // R4
  cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
  shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
  tiers: { t2: 0.66, t3: 0.9 },
  breath: { amp: 0.01, periodMs: 6000 },   // old spec 3.5 values; domain zoom about the field centre
  staticTimeS: 12,                          // reduced-motion still = the OG still
  pointer: { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 },
  ripple: { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 },
  mask: { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, thetaScale: 0.08, thetaZ: 17, fontWeight: 700 },
  entry: { gatherMs: 900, holdMs: 1000, dissolveMs: 800, scrimAtMs: 1900, scrimMs: 800, revealAtMs: 2100, staggerMs: 40, blockFadeMs: 600, fieldFadeMs: 400, cleanupAtMs: 3300, readyTimeoutMs: 3000, fontTimeoutMs: 1200 },
  konami: { gatherMs: 900, holdMs: 1500, dissolveMs: 800 },
  probe: { frames: 60, thresholdFps: 45 },
  theme: { crossfadeMs: 300 },
  scramble: { durMs: 600, stepMs: 40 },
  copy: { holdMs: 1200 },
};
```

### 2.6 Dev tweaks panel (`src/tweaks.ts`)

- Same pattern as today: `prepareTweaks(params)` applies saved values before the first frame and returns `mount(app)`.
- Storage key: `pn.tweaks`. Persistence uses the existing `deepAssign` and `diff`, so only changed keys are stored.
- Folders:
  - `cells`: density select, `cell.k`, `minCss`, `maxCss`
  - `surface`: intensity select, `warpScalePx`, `mainScalePx`, `warpAmp`, `level`, `gain`
  - `tiers`: `t2`, `t3`
  - `pointer`: all 9
  - `ripple`: all 6
  - `breath`: 2
  - `mask`: all
  - `entry`: all ms
- Buttons: replay entry, Konami, toggle theme, freeze time, copy JSON, reset (removes `pn.tweaks` and reloads).
- `lil-gui` loads only through the dynamic import behind `import.meta.env.DEV`, so it never reaches the production bundle. Today's production build already proves this pattern.

---

## 3. The GLSL port

### 3.1 Blueprint source, verbatim (`part-c.html`)

`fbm`, line 142:

```js
function fbm(x,y,z){ return .62*noise3(x,y,z)+.38*noise3(x*2.1+7.3,y*2.1+1.7,z*1.4+3.1); }
```

`vAt`, lines 173–182. The lines that apply to the dither glyph with `motion: flow` are the first, the `raster` branch, the dither line and the ripple line. The mask line is skipped for raster glyphs because `drawRaster` applies the mask instead.

```js
 vAt(x,y,o,I,t,raster){ const u=x/12, w=y/12; let v;
  if(o.motion==='waves'){ v=.5+.5*Math.sin(u*.33+t*1.5*I+.9*Math.sin(w*.31-t*.8*I)); v=v*v; }
  else if(o.motion==='ripples'){ v=.12+.1*noise3(u*.12,w*.12,t*.15); }
  else if(o.motion==='breathe'){ const d=Math.hypot(x-this.w/2,y-this.h/2); v=.5+.5*Math.sin(t*1.2*I-d/54); v*=v; }
  else if(raster){ const wx=fbm(u*.05+3.1,w*.05,t*.09*I), wy=fbm(u*.05,w*.05+7.7,t*.09*I+2); v=fbm(u*.075+(wx-.5)*2.6,w*.075+(wy-.5)*2.6,t*.14*I); v=Math.min(1,Math.max(0,(v-(o.glyph==='dither'?.3:.24))*2.1)); }
  else { v=fbm(u*.085,w*.085,t*.22*I); v=Math.min(1,Math.max(0,(v-.25)*1.9)); }
  if(raster&&o.glyph==='dither'){ v=Math.min(1,v*.7+.4*(1-Math.abs(1-2*v))*v); }
  const rips=this.ripples; if(rips.length){ const rs=this.sp*9, bw=this.sp*1.6; for(let k=0;k<rips.length;k++){ const rp=rips[k]; const age=t-rp.t0, rad=age*rs, d=Math.hypot(x-rp.x,y-rp.y); const g=Math.exp(-((d-rad)*(d-rad))/(2*bw*bw))*rp.a*Math.max(0,1-age/3.2); v=Math.min(1,v+g*.9); } }
  if(this.maskMix>0&&!raster){ const mm=this.maskMix; v=v*(1-mm)+this.maskAt(x,y)*mm; }
  return v; }
```

`drawRaster`, lines 221–248, in full:

```js
 drawRaster(o,I){
  const ctx=this.ctx, w=this.w, h=this.h, t=this.t, lat=this.lat, sp=lat.sp, cols=lat.cols, rows=lat.rows, V=lat.V;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) V[r*cols+c]=this.vAt(c*sp,r*sp,o,I,t,true);
  const img=this.img, data=img.data, bw=img.width, bh=img.height, px=this.px, fr=this.frame, mm=this.maskMix;
  const pon=this.p.on, px0=this.p.x, py0=this.p.y, R=Math.min(w,h)*.28+sp*2;
  const bu=this.burst, bAge=bu?t-bu.t0:0, bf=bu?(1-bAge/.7):0, Rb=Math.min(w,h)*.38;
  const mut=o.mutedRGB, acc=o.accentRGB, fgc=o.fgRGB, dither=o.glyph==='dither', col=o.color;
  const base=col==='accent'?acc:mut, tier2=(col==='peaks'||col==='core')?acc:base, tier3=col==='core'?fgc:tier2;
  let k=0;
  for(let j=0;j<bh;j++){ const Y=(j+.5)*px; for(let i=0;i<bw;i++,k+=4){ const X=(i+.5)*px; let sx=X, sy=Y, boost=0;
   if(pon){ const ddx=X-px0, ddy=Y-py0, d=Math.hypot(ddx,ddy); if(d<R){ let f=1-d/R; f=f*f*(3-2*f); const nx=ddx/(d||1), ny=ddy/(d||1);
    if(o.reaction==='repel'){ sx=X-nx*f*R*.55; sy=Y-ny*f*R*.55; boost=f*.12; }
    else if(o.reaction==='attract'){ sx=X+nx*f*R*.4; sy=Y+ny*f*R*.4; boost=f*.15; }
    else if(o.reaction==='brighten'){ boost=f*.6; }
    else if(o.reaction==='scatter'){ sx=X+(hash(i,j,fr>>2)-.5)*f*R*.7; sy=Y+(hash(j,i,fr>>2)-.5)*f*R*.7; }
    else boost=f*.2; } }
   if(bu){ const ddx=X-bu.x, ddy=Y-bu.y, d=Math.hypot(ddx,ddy); if(d<Rb){ let f=1-d/Rb; f=f*f*(3-2*f)*bf; sx-=ddx/(d||1)*f*Rb*.45; sy-=ddy/(d||1)*f*Rb*.45; boost+=f*.25; } }
   let gx=sx/sp, gy=sy/sp; if(gx<0) gx=0; if(gy<0) gy=0; if(gx>cols-1.001) gx=cols-1.001; if(gy>rows-1.001) gy=rows-1.001;
   const x0=gx|0, y0=gy|0, fx=gx-x0, fy=gy-y0, i0=y0*cols+x0;
   let v=(V[i0]*(1-fx)+V[i0+1]*fx)*(1-fy)+(V[i0+cols]*(1-fx)+V[i0+cols+1]*fx)*fy; v+=boost; if(mm>0) v=v*(1-mm)+this.maskAt(X,Y)*mm; if(v>1) v=1;
   let on=false, rgb=base, a=255;
   if(dither){ on=v>(BAYER8[(i&7)|((j&7)<<3)]+.5)/64; if(on) rgb=v>.9?tier3:v>.66?tier2:base; }
   else { const n=hash(i,j,fr); on=n<.03+v*v*.9; if(on){ rgb=(v>.8&&n<v*.45)?tier3:(v>.6?tier2:base); a=(36+219*v)|0; } }
   if(on){ data[k]=rgb[0]; data[k+1]=rgb[1]; data[k+2]=rgb[2]; data[k+3]=a; } else data[k+3]=0;
  } }
  this.offCtx.putImageData(img,0,0);
  ctx.setTransform(this.dpr,0,0,this.dpr,0,0); ctx.clearRect(0,0,w,h); ctx.imageSmoothingEnabled=!dither; ctx.drawImage(this.off,0,0,w,h);
 }
```

### 3.2 What the port changes, and why

| Blueprint | Port | Why |
|---|---|---|
| Surface evaluated on a coarse lattice (`sp = clamp(w/48, 8, 40)`, 30 px at 1440) and bilinearly interpolated per dither pixel | Surface evaluated exactly at every cell centre in pass 1 | The GPU can afford it (0.075 ms per frame measured). The cell-exact surface is what the lattice approximated. `sp` is kept as the unit for R and for the rings. |
| `hash(x\|0, y\|0, z\|0)` with unbounded z | `hash3` with `(z & 255)`; x/y offset +256 | Periodic z gives exact, wrap-free time forever. The positive lattice makes `uvec3(floor(p))` well defined. Statistics unchanged (section 0.2). |
| fbm z for octave 2 = `z*1.4+3.1` computed inline | The CPU passes both octaves' z, each wrapped mod 256 in double precision | Each noise3 call is independently periodic in z, so wrapping each is exact. |
| Ripples inside V (before the mask), clamped per ring | Ripples and boost added after the mask mix, one clamp at the end | Clicks during the entry and the Konami hold still show full rings ("react to clicks"). With no mask the result is identical except where `v` already exceeds 1. |
| Mask: `v = v(1-mm) + mask·mm`; at mm = 1 the field vanishes and the pointer does nothing | Noise-threshold dissolve plus melt; the field stays at 30 % behind the name; the pointer warps the letters | R6: "holds, still breathing and still reacting to the pointer", and "dissolve, not a plain fade". |
| No breath in the dither branch | Domain zoom `1 ± 0.01` over 6 s about the field centre, applied to the field and the mask | R6 "still breathing"; old spec 3.5 numbers; off under reduced motion. |
| Pointer = raw position; instant on and off | Eased position (0.18 per 16.67 ms, frame-rate independent); strength rises over 200 ms, falls over 600 ms; R grows by up to 10 % with speed | R4 "ease back". |
| No xy drift | None | "Flow" in the Blueprint is z-evolution only. A translation would change the approved look. |

### 3.3 Vertex shader and geometry

`src/shaders/fullscreen.vert`. `GLSL_HEADER_VERT` (`#version 300 es`) is prepended in `program.ts`.

```glsl
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
```

- VBO: `new Float32Array([-1, -1, 3, -1, -1, 3])`, `STATIC_DRAW`.
- VAO with attribute 0 enabled, `vertexAttribPointer(0, 2, FLOAT, false, 0, 0)`.
- `bindAttribLocation(program, 0, 'aPos')` before link.
- Both passes call `drawArrays(TRIANGLES, 0, 3)`.
- A real enabled attribute 0 avoids Firefox's "attrib 0 emulation" warning.

### 3.4 `src/shaders/noise.glsl` (included into pass 1 by string concatenation)

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

`uint` multiplication wraps mod 2³², which equals JS `Math.imul` for the low 32 bits; `>>` on `uint` equals JS `>>>`. Bit-exact.

### 3.5 Pass 1: `src/shaders/surface.frag`

The final source is `GLSL_HEADER_FRAG + uniforms + noise.glsl + body`. As compiled in the prototype:

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

Notes:
- Every `smoothstep` has ascending edges. `theta - w < theta + w` holds since `w = 0.08 > 0` (vault gotcha: reversed edges are undefined on ANGLE).
- No `pow()` is used, so there are no negative-base cases.
- `uvec2(cell)` is safe because cell coordinates are never negative.

### 3.6 Pass 2: `src/shaders/dither.frag`

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

Tier rule, exactly as the Blueprint `drawRaster` dither branch with colour "core":

| condition | result |
|---|---|
| `v ≤ (B + 0.5) / 64` | off, `uField0` |
| on and `v ≤ 0.66` | `uField1` |
| on and `0.66 < v ≤ 0.90` | `uField2` |
| on and `v > 0.90` | `uField3` |

Here `B = BAYER8[(i & 7) | ((j & 7) << 3)]`, with `i` the cell column and `j` the cell row from the top. All comparisons are strict `>`, as in the Blueprint.

Reachability (pinned by tests):
- The surface curve `v·0.7 + 0.4·(1 − |1 − 2v|)·v` peaks at **0.703125** (raw v = 0.9375). So the surface alone gives field-2 only on crests, about 2–17 % of cells over time.
- Boost adds at most 0.12 (max 0.823125, still not field-3).
- Field-3 comes only from the name mask (`ink` 0.91 to 0.97 inside letters) and from rings (+0.9·1.2·g).

### 3.7 Uniforms, types and units (all set every frame unless marked "on change")

Pass 1:

| uniform | type | unit | value or source |
|---|---|---|---|
| `uCell` | float | CSS px per cell | `grid.cellDev / grid.dpr` (on change) |
| `uZ` | vec4 | noise z, [0, 256) | `flowZ(t, I)[0..3]` |
| `uZm` | vec2 | noise z | `flowZ(t, I)[4..5]` |
| `uCenter` | vec2 | CSS px | `(fieldCssW / 2, fieldCssH / 2)` (on change) |
| `uBreath` | float | scale | `breathScale(tMs, 0.01, 6000)`; `1` under reduced motion |
| `uPointer` | vec4 | CSS px, CSS px, 0..1 | `(ptr.x, ptr.y, R·(1 + 0.1·velFactor), ptr.strength)` |
| `uWarp` | vec2 | — | `(0.55, 0.12)` (on change) |
| `uRipples[8]` | vec4[8] | CSS px, CSS px, — | from `RipplePool.write` |
| `uRipple` | vec2 | CSS px, — | `(1.6·sp, 0.9)` (on change) |
| `uMask` | sampler2D | unit 1 | R8 mask |
| `uMaskSize` | vec2 | CSS px | `(cols·uCell, rows·uCell)` (on change) |
| `uE` | float | 0..1 | `EntryMachine.tick()`; 0 when idle |
| `uMaskMix` | vec4 | —, —, —, CSS px | `(0.3, 0.91, 0.08, 48)` (on change) |
| `uShape` | vec3 | CSS px, CSS px, noise units | `(240, 160, 2.6)` (on change) |
| `uLevel` | vec2 | — | `(0.3, 2.1)` (on change) |

Pass 2:

| uniform | type | unit | value or source |
|---|---|---|---|
| `uSurf` | sampler2D | unit 0 | pass-1 texture |
| `uCellDev` | float | device px | `grid.cellDev` (on change) |
| `uCanvasH` | float | device px | `grid.heightDev` (on change) |
| `uField0..uField3` | vec3 | sRGB 0..1 | `ColorTween.sample(now)` |
| `uTiers` | vec2 | — | `(0.66, 0.90)` (on change) |

Field colours (Agent B section 6.3). Dark: `#050a22 #3b5df0 #8db0ff #e8eeff`. Light: `#f2f6fe #8db0ff #3b5df0 #0832b8`. They are read at runtime from the CSS `--field-0..3`, never hard-coded in TS.

The rail sits on Agent B's scrim (alpha ≥ 0.86 under every text row), so **the shader applies no extra dimming under the rail**.

### 3.8 Formulas in one place

- **Lattice spacing** (Blueprint `sp`): `sp = clamp(fieldCssW / 48, 8, 40)`. Examples: 30 at 1440, 26.67 at 1280, 8.125 at 390.
- **Flow speed for intensity medium:** `I = 1`.
  - `zA = 0.09·I·t`, `zB = zA + 2`, `zC = 0.14·I·t` (t in s).
  - `flowZ = [zA, 1.4zA + 3.1, zB, 1.4zB + 3.1, zC, 1.4zC + 3.1] mod 256`.
  - The main surface moves 0.14 noise units per second, where one unit is 160 CSS px of feature size; the warp moves 0.09 units per second.
  - Subtle is 0.55× and lively 1.7×.
  - Reduced motion freezes `t = staticTimeS = 12`.
- **Breath:** `uBreath = 1 + 0.01·sin(2π·tMs / 6000)`; the sample is `s = c + (xw − c) / uBreath` with `c` the field centre.
- **Pointer warp:**
  - `R = (min(fw, fh)·0.28 + 2·sp)·(1 + 0.1·velFactor)`. Examples: 312 px at 1440×900, 82 px for a 390×236 band.
  - For `d = |x − p| < R`: `f = strength·u²(3 − 2u)` with `u = 1 − d/R`.
  - `xw = x − (x − p)/d · f·R·0.55`; `boost = 0.12·f`.
  - Pointer ease: `p += (raw − p)·(1 − (1 − 0.18)^(dt/16.667))`.
  - Strength: target 1 on move inside the window, target 0 on release or leave. It moves linearly toward the target at `dt/200 ms` up and `dt/600 ms` down, and is output through `easeOutCubic`.
  - `velFactor = min(|v| / 1500, 1)`, with `|v|` the eased point's speed, exponential average with a 100 ms time constant.
- **Shockwave:** one ring per primary `pointerdown`.
  - Spawn excludes targets inside `a, button, [role="button"], input, textarea, select, [data-no-ripple]`, and it is off under reduced motion.
  - Age `a = t − t0` (sim seconds). Radius `r = 9·sp·a` (270 px/s at 1440, 73 px/s at 390).
  - Amplitude `A = 1.2·(1 − a/3.2)`. Expires at `a ≥ 3.2 s`. Max 8 rings; the 9th drops the oldest.
  - Per cell `v += 0.9·A·exp(−(|xw − o| − r)² / (2σ²))` with `σ = 1.6·sp` (48 px at 1440, 13 px at 390).
- **Mask mix and dissolve:** `e` is the progress from section 5.
  - Per cell: `θ = 0.6·noise3(cell·0.08 + 256, 17) + 0.4·hash3(cell, 91)` (static, in [0, 1)).
  - `k = smoothstep(θ − 0.08, θ + 0.08, 1.16e − 0.08)`, so `k = 0` at `e = 0` and `k = 1` at `e = 1` for every cell.
  - Melt: the mask is sampled at `s + (W − 0.5)·2·48·(1 − e)²`, with `W` the warp fbm pair, so letters condense out of the flow and melt back into it.
  - `n = mix(0.3·F, 0.91 + 0.09·F, m)` with `m` the mask coverage. Inside the letters `v` is 0.91–0.973, which renders as field-3 with a sparse, breathing Bayer hole pattern (2–6 of 64 cells off; 1 under the pointer boost). The field behind the name keeps flowing at 30 %.
  - `v = mix(F, n, k) + boost + rings`, clamped at 1.
  - The pointer warps and the breath scales the letters too, because the mask is sampled at `s`.
- **Theme lerp (300 ms):** per channel, `c(now) = c0 + (c1 − c0)·min(1, (now − t0)/300)` in sRGB 0..1, on `performance.now()`. It is uploaded every frame while active; under reduced motion the loop is woken until the tween ends.

### 3.9 Textures and framebuffers

| object | format | size | filter / wrap | lifetime |
|---|---|---|---|---|
| surface target | `texStorage2D(TEXTURE_2D, 1, RGBA8)`, `.r = v` | `cols × rows` | NEAREST / CLAMP_TO_EDGE (read with `texelFetch`) | recreated when `cols` or `rows` change |
| surface FBO | `COLOR_ATTACHMENT0` = surface target | — | — | checked `FRAMEBUFFER_COMPLETE`, otherwise fallback |
| mask | `texStorage2D(..., R8)` + `texSubImage2D(RED, UNSIGNED_BYTE)`, `UNPACK_ALIGNMENT 1`, no FLIP_Y and no PREMULTIPLY (Firefox warns when those are set on typed-array uploads) | `2·cols × 2·rows` | LINEAR / CLAMP_TO_EDGE | built when an entry or Konami arms; deleted at `done` |
| default framebuffer | context attributes in section 2.2 | `widthDev × heightDev` | — | — |

- Units: pass 1 samples unit 1 (mask) only; pass 2 samples unit 0 (surface) only. The surface texture is never bound to unit 1, so no feedback loop can form.
- No `clear` per frame (both passes cover every pixel). Blending and depth stay disabled.
- RGBA8 rather than R8 for the render target: the most widely supported colour-renderable format (ANGLE, Metal, Mali). The extra bandwidth is about 0.3 MB per frame at most.
- 8-bit `v` was measured: tier mismatch vs float is 0.14–0.21 % of cells. Invisible.

---

## 4. Render-target sizing

### 4.1 Rules

```
dprRaw  = devicePixelRatio, sanitised to 1 when not finite or <= 0
dpr     = capDpr(dprRaw) = min(2, dprRaw)                                  (R14)
cellCss = clamp(0.0032 * fieldCssW, 2, 5) * densityK[density] * degrade     (degrade = 1, or 1.5 after the FPS probe)
cellDev = max(2, round(cellCss * dpr)); if (dprRaw > dpr && cellDev is odd) cellDev += 1
widthDev, heightDev = devicePixelContentBoxSize from ResizeObserver when available and dprRaw <= 2,
                      else round(cssW * dpr), round(cssH * dpr)
cols = ceil(widthDev / cellDev); rows = ceil(heightDev / cellDev)           (partial cells at the right/bottom edge)
uCell = cellDev / dpr  (CSS px per cell, the value pass 1 uses)
mask  = 2*cols x 2*rows
```

- **Integer device-pixel cells** remove moiré at fractional DPR (1.25, 1.5, 1.75). Each cell is exactly `cellDev` device pixels wide and tall.
- **`devicePixelContentBoxSize`** gives the exact backing size, so the browser never resamples the canvas by a fraction of a pixel. That happens with `round(cssW·dpr)` when, for example, 1366 × 1.25 = 1707.5. Chrome and Firefox support it. Safari falls back to rounding, and its DPRs are integers.
- **DPR > 2 (phones at 3):** the backing store is 2× and the compositor scales it by 1.5. The canvas has `image-rendering: pixelated`, and an even `cellDev` makes `1.5·cellDev` whole device pixels.
- **Resize** (ResizeObserver on the canvas, covering window resize, orientation, the phone band and DPR moves):
  - set `canvas.width/height` in the callback, so the next frame never stretches;
  - recreate the surface target only if `cols`/`rows` changed;
  - keep the sim time, the entry phase and the rings;
  - re-rasterise an active mask after a 150 ms debounce (until then the old mask is drawn at its old extent).
- **DPR change** without a size change (window dragged to another monitor): a `matchMedia('(resolution: <dpr>dppx)')` change listener, re-armed each time, calls `dprChanged()` and then the same path.

### 4.2 Cost table (medium density)

| viewport (field) | DPR raw → used | cellCss → cellDev | grid (pass-1 texels) | pass-2 fragments | mask texels |
|---|---|---|---|---|---|
| 1440×900 | 1 → 1 | 4.608 → 5 (5 CSS) | 288×180 = **51,840** | **1,296,000** | 576×360 = 207,360 |
| 1440×900 | 2 → 2 | 4.608 → 9 (4.5 CSS) | 320×200 = 64,000 | 5,184,000 | 640×400 = 256,000 |
| 1280×720 | 1 → 1 | 4.096 → 4 | 320×180 = 57,600 | 921,600 | 640×360 |
| 1366×768 | 1 → 1 | 4.371 → 4 | 342×192 = 65,664 | 1,049,088 | 684×384 |
| 1920×1080 | 1 → 1 | 5 (clamped) → 5 | 384×216 = 82,944 | 2,073,600 | 768×432 |
| 2560×1440 | 1 → 1 | 5 → 5 | 512×288 = 147,456 | 3,686,400 | 1024×576 |
| 390×844 band (28 % = 236.3 CSS) | 3 → 2 | 2 (clamped) → 4 | 195×119 = **23,205** | 780×473 = **368,940** | 390×238 = 92,820 |
| 390×844 full canvas (measured in the prototype) | 3 → 2 | 2 → 4 | 195×422 = 82,290 | 1,316,640 | — |

- Pass-1 cost per texel: 6 noise3 calls (48 hashes, 42 mixes), up to 8 `exp`, 1 mask fetch, about 400 ALU ops. At 1440×900 that is about 21 MOPs per frame; measured GPU time for both passes is 0.075 ms on an RTX 2080 SUPER.
- Pass 2: 1 `texelFetch`, 1 const-array read and 3 compares per fragment.
- Integrated GPUs typically run 20–40× slower than this card, so about 1.5–3 ms per frame at 1440×900 DPR 2. That fits a 16.7 ms frame.
- No CPU work per cell per frame: the CPU uploads about 25 uniforms.

---

## 5. Entry timeline as a state machine (R6), reused by Konami (R12c)

```
 idle --arm()--> pending --(ready && visible)--> gather --900ms--> hold --1000ms--> dissolve --800ms--> done
   ^                                                                                                  |
   +------------------------------------- (konami: arm again) ----------------------------------------+
 any non-idle --skip()--> dissolve (fast, 250 ms) --> done
```

| t since start (ms) | phase | `e` | events and DOM |
|---|---|---|---|
| — | pending | 0 | `html.pn-entry.pn-entry-js`: rail and scrim at opacity 0; the field renders normally once programs are ready |
| 0 | gather | `smoothstep(t/900)` | `start` → the canvas fades 0 → 1 over 400 ms (`html.pn-field-on`) |
| 900 | hold | 1 | name formed; breath and pointer active; clicks make rings |
| 1900 | dissolve | `smoothstep(1 − (t − 1900)/800)` | `scrim` → `html.pn-scrim`: scrim opacity 0 → 1, 800 ms, linear |
| 2100 | dissolve | (continues) | `reveal` → `html.pn-reveal`: rail block n (0-based) fades 0 → 1 over 600 ms ease-out with `transition-delay: n·40 ms` (CSS `:nth-child` rules, no inline styles) |
| 2700 | done | 0 | mask texture deleted; `uE = 0`; the FPS probe starts |
| 3300 | done | 0 | `cleanup` → remove `pn-entry`, `pn-entry-js`, `pn-scrim`, `pn-reveal` (every element is already at its default visible state, so nothing animates) |

`smoothstep(u) = u²(3 − 2u)` with `u` clamped to [0, 1]. This is the Blueprint `playEntry` curve.

Rules:
- **Pointer during HOLD:** fully live. The warp bends the letters away from the cursor (the mask is sampled at the warped point), the boost brightens, and Shockwave rings pass through the name at full strength. Ripples are added after the mask mix.
- **Readiness:** the clock starts only when `setReady(true)` and `document.visibilityState === 'visible'`. Readiness means:
  - both programs linked (`KHR_parallel_shader_compile` poll each rAF);
  - the font settled (`waitForFont('700 10px "JetBrains Mono"', 1200)`, `loaded` or `timeout`, then the mask uses the fallback stack `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`);
  - the mask uploaded.
  - If not ready within 3000 ms, fall back (section 2.4).
- **Hidden tab:**
  - At load, it stays `pending` (rAF does not run while hidden) and starts on the first visible frame. The rail stays hidden, but nobody can see it.
  - Mid-entry, rAF stops, so `tick` stops and the sim time freezes. CSS transitions already running finish on their own, which is harmless.
  - `prerender` reports `hidden`, so it is handled the same way.
- **Keyboard:** a `focusin` inside the rail during `pending`, `gather`, `hold` or `dissolve` calls `skip()`:
  - `html.pn-entry-skip` sets `transition: none` and opacity 1 on the rail and scrim at once;
  - the mask dissolves over 250 ms.
  - A keyboard user never lands on an invisible link (carried from the old spec's `:focus-within` rule).
- **Reduced motion:** `theme-boot.js` never adds `pn-entry`, and `main.ts` never arms. The layout is instant and the field static (`t = 12 s`, breath 1, no rings, pointer repel allowed, render on demand). If reduced motion turns on mid-entry, `skip()` runs.
- **No WebGL or failure:** the entry classes are removed at once (section 2.4).
- **Konami "nice." (R12c):**
  - `EntryMachine(KONAMI_TIMINGS)`: gather 900 ms, hold 1500 ms, dissolve 800 ms, so 3.2 s in total. No scrim or reveal events; the rail stays visible.
  - Ignored while the entry or another Konami is running.
  - Mask box: desktop `{ x: railRight + 24, y: 0, w: fieldW − railRight − 24, h: fieldH }`, where `railRight = rail.getBoundingClientRect().right`; phone = the whole band.
  - Reduced motion: `e` jumps 0 → 1, holds 1500 ms, jumps to 0. No gather or dissolve animation.
- **Mask layout** (Blueprint `setMask`):
  - Canvas `2·cols × 2·rows`, white text on transparent, `fontPx = min(0.4·box.h, 0.84·box.w·100 / measure(text at 100 px))`, weight 700.
  - Centred on the box centre using the ink box: `y = cy + (ascent − descent)/2` with `textBaseline = 'alphabetic'` and `measureText().actualBoundingBox*`.
  - Desktop 1440×900: about 201.6 CSS px, width-limited ("Parsa Naji" = 6.0 em in JetBrains Mono). Phone band 390×236: about 54.6 CSS px, a 40 px cap height = 20 cells at 2 CSS px. A full-screen 390 px check is legible (`shot-phone-hold.png`).

---

## 6. Lifecycle and quality rules carried over (old spec 3.5–3.8, 4.7)

| rule (old spec) | verdict | new form |
|---|---|---|
| 4.7 `visibilitychange` pauses and resumes the loop and resyncs the clock | KEEP | `loop.stop()` / `loop.start()` (start resets the last timestamp); `startClock` re-renders on visible |
| 3.5 hidden tab: elapsed time does not advance timers, no catch-up | KEEP | sim time advances only by `clampDt(dt)` (≤ 50 ms) while running; rings, entry and breath all use sim time |
| 4.7 `pagehide` stops the loop for a clean bfcache restore | KEEP + extend | `pagehide` → `pause()`; `pageshow` with `persisted` → if `gl.isContextLost()` wait for `webglcontextrestored` (3000 ms, then fallback), else `resume()` when visible |
| 4.7 resize/orientation through a 150 ms debounce | ADAPT | backing store and targets resize synchronously in the ResizeObserver callback (no stretch); only the mask re-raster is debounced 150 ms |
| 3.7 resample targets and recompute N on resize | DROP | no particle count; the entry or Konami continues against the re-rasterised mask |
| 3.6 FPS probe: 60 frames after the entry, < 45 fps → degrade once | KEEP (adapted) | `FpsProbe(60, 45)` after `done`; on `degrade` multiply `cellCss` by 1.5 (about 56 % fewer pass-1 texels), recompute the grid, never again in the session |
| 3.6 DPR cap 2 | KEEP | `capDpr()` |
| 3.8 no-JS fallback | KEEP (adapted) | the rail is plain HTML on `--bg`, fully readable (R13); `theme-boot.js` does not run, so no pre-hide |
| 3.8 no-WebGL fallback via `html.no-webgl` | KEEP | also for compile/link failure, incomplete FBO, the ready timeout and unrecoverable context loss; zero console errors |
| 3.8 font timeout → fallback stack | KEEP | 1200 ms for the mask font (was 2 s) |
| 3.5 reduced motion: no vibration, breath or ripples; repel allowed | ADAPT (R13) | static field (`t = 12`), breath 1, no rings, no entry, no status pulse (CSS), no scramble; pointer repel allowed; render on demand (the loop idles when `pointer.settled` and no tween is active) |
| 3.5 touch: `pointerdown` snaps the pointer and the trail decays | ADAPT | `down(kind 'touch')` snaps; `pointerup`/`pointercancel` → strength falls over 600 ms; the canvas keeps `touch-action: auto` so the phone page scrolls (a `pointercancel` at scroll start releases) |
| 3.5 auto-tease, morph, trail ring buffer, vibration | DROP | not in R4–R12 |
| chrome `:focus-within` never shows invisible links | KEEP (as a rule) | `focusin` in the rail → `skip()` |
| new: WebGL context loss | ADD | `webglcontextlost` → `preventDefault()`, `pause()`, mark lost; `webglcontextrestored` → `renderer.restore()` then `resume()`; no restore in 3000 ms → fallback |
| new: `forced-colors: active` | ADD | no field at all (canvas hidden by CSS, JS does not start the renderer), Agent B 6.5 |
| new: first frame | ADD | `renderer.clear(--field-0)` right after context creation (an `alpha:false` canvas is black until drawn); canvas fade-in 400 ms on the first real frame (`pn-field-on`; instant under reduced motion) |
| new: pointer leaves the window | ADD | `document.documentElement` `pointerleave` and `window` `blur` → `release()` |

---

## 7. OG image (R11)

### 7.1 Today

- `scripts/og-placeholder.mjs` draws a dot-grid "P" from SVG circles with sharp. It is retired.
- `scripts/og-image.mjs` does not exist, although `package.json` already has `"og": "node scripts/og-image.mjs"`.

### 7.2 Approach (proven in `scratchpad\agent-a\og-proto.mjs`, output `og-proto.png`)

- **Shared math:**
  - `scripts/og-image.mjs` imports `tierGrid` and `ringGain` from `../src/field/surface.ts`. Node ≥ 22.18 strips the types on import; Node 24.19 printed no warning.
  - Requirement: `surface.ts` stays self-contained (no imports) and uses only erasable TypeScript (no enums, namespaces or parameter properties). Test `surface.test.ts` reads the file and asserts there is no `import` statement.
  - So the band is drawn by the same module the unit tests pin, and the GLSL is held to that module by the browser parity check (max error ≤ 3/255).
  - A duplicate JS copy is not needed.
- **Band:** a `cols × rows` grid with `CELL = 6` CSS px (200×105 cells; OG cards are viewed at 600×315 or smaller, so bigger cells read better).
  - Time `t = 12 s`, intensity 1.
  - Plus one static Shockwave ring at age 0.6 s, so field-3 sparkle appears (Agent B 5.2): `{ x: 900, y: 360, radius: 9·sp·0.6, amp: 1.2·(1 − 0.6/3.2), sigma: 1.6·sp, gain: 0.9 }` with `sp = clamp(1200/48, 8, 40) = 25`, so radius 135, amp 0.975, sigma 40.
  - Tiers map to `#050a22 / #3b5df0 / #8db0ff / #e8eeff`. The RGBA raw buffer goes through `sharp(raw).resize(1200·…, { kernel: 'nearest' })` (exact 6× nearest), then is cropped to 1200×630.
- **Scrim:** an SVG `linearGradient` (x1 0 → x2 1) with stops `#050a22` at 0 (alpha 1), at 0.42 (alpha 1), at 0.73 (alpha 0.86), and at 1 (alpha 0), over the left 54 % (648 px). This is Agent B's `--bg-scrim` geometry.
- **Text as outlines:**
  - `fontverter.convert(woff2, 'sfnt')`, then harfbuzzjs `new Blob → Face → Font`, `Buffer.addText`, `guessSegmentProperties`, `shape`, `getGlyphInfosAndPositions`, `font.glyphToPath(glyphId)`.
  - Each glyph becomes `<path transform="translate(x, baseline) scale(k, −k)">` with `k = size / upem` (`upem = 1000` for JetBrains Mono).
  - librsvg renders paths only, so the output does not depend on system fonts or fontconfig on any machine.
  - Content:
    - "Parsa Naji" in JetBrains Mono Bold, 104 px, `#e8eeff`, x = 72, baseline 300;
    - the tagline "I build AI agents, apps, and the systems behind them." in JetBrains Mono Regular, 32 px (Agent B's minimum), `#7993da`, x = 76, baseline 360, wrapping at 560 px wide into two lines (baseline 360 and 402) by shaping words and breaking on advance width;
    - optional "parsanaji.com" 26 px `#7993da` at baseline 560.
- **Compose:** `sharp(bandPng).composite([{ input: Buffer.from(svg) }]).png({ compressionLevel: 9 }).toFile('public/og.png')`. The prototype's 1200×630 output is 78 KB.
- **When it runs:** by hand (`npm run og`) and committed, like today's placeholder. It is not part of `npm run build`, so CI never depends on harfbuzz or wasm. It is deterministic for fixed inputs and a fixed sharp version.
- **Guard test:** `tests/ogAsset.test.ts` checks that `public/og.png` exists, is PNG, is 1200×630 (`sharp().metadata()`), and is under 300 KB.
- **Fonts used:** `scripts/fonts-src/JetBrainsMono-Bold.woff2` and `-Regular.woff2`, the full fonts (not the subsets), so any tagline text renders.

---

## 8. Bundle estimate (production JS, KB gzip)

Measured anchors:
- The prototype `shaders.js` (all three GLSL sources with comments) is 2.61 KB gz.
- The prototype `main.js` (renderer, loop, mask, pointer, rings, debug hooks) is 3.88 KB gz.
- Today's `prng` is 0.27, `easing` 0.15, `time` 0.12, `quality` 0.44, `clock` 0.41, `fonts` 0.23, `app.ts` 1.41, `main.ts` 0.64.
- Each file was esbuild-minified and gzipped at level 9. Per-file sums overstate a single-bundle gzip by about 15–25 %.

| module | KB gz |
|---|---|
| shaders: `fullscreen.vert`, `noise.glsl`, `surface.frag`, `dither.frag` (`?raw`) | 2.6 |
| `gl/context` + `gl/program` + `gl/targets` | 1.25 |
| `field/renderer` | 1.6 |
| `field/surface` (only `flowZ` is reachable; the rest is tree-shaken) | 0.15 |
| `field/params` | 0.55 |
| `field/sizing` + `field/flow` | 0.5 |
| `field/pointer` | 0.5 |
| `field/ripples` | 0.35 |
| `field/nameMask` | 0.75 |
| `field/entry` | 0.6 |
| `app` | 1.6 |
| `lifecycle` + `loop` | 0.85 |
| `main` | 0.75 |
| `theme/theme` + `theme/themeController` | 1.3 |
| `ui/clock` + `links` + `emailCopy` + `overlay` | 1.3 |
| `eggs/shortcuts` + `scramble` + `konami` + `greeting` | 1.3 |
| `core/prng` + `easing` + `time` + `quality`, `boot/fonts` | 1.1 |
| Vite/Rolldown module glue | 0.4 |
| **total (sum of parts)** | **≈ 17.5** (expected single-bundle gzip about 14) |

- Against the 60 KB budget (R14) there is about 3.4× headroom.
- `tweaks.ts` + `lil-gui` (about 12 KB gz) are DEV-only: 0 in production.
- `public/theme-boot.js` is about 0.38 KB uncompressed, a separate file.
- Fonts: 12.0 + 12.1 = **24.1 KB** with `noLayoutClosure`, against the 40 KB budget (risk 2).
- Today's three-based bundle is 546,901 B minified (137 KB gz per the vault note), so this cuts about 120 KB gz.

---

## 9. Test plan

### 9.1 Vitest in Node (pure modules)

| file | key cases |
|---|---|
| `tests/surface.test.ts` | `hash3` equals the verbatim Blueprint `hash` for z in [0, 256) on 1000 seeded integer triples (bit-exact). `noise3(x, y, z) === noise3(x, y, z + 256)` within 1e-12. Range [0, 1). Continuity across lattice faces (≤ 1e-9 jump). `flowZ` returns 6 values in [0, 256), equals the raw formula mod 256, and the noise is continuous across the wrap. `surface()` ≤ 0.703125 over a 10⁵-point sweep, and `max(surface + 0.12) < 0.9`. `BAYER8` equals the Blueprint array and is a permutation of 0..63. `bayerThreshold` in [1/128, 127/128]. `tierOf` strict-`>` edges at 0.66 and 0.9. `tierGrid` deterministic, with a golden FNV-1a checksum of the 200×105 grid at t = 12. Statistical band at 1440×900, cell 5, t = 12: off 50–70 %, field-1 20–35 %, field-2 2–20 %, field-3 0 %. With a ring, field-3 > 0. No `import` in the source file (enables Node type stripping). |
| `tests/shaders.test.ts` | Parse the `.glsl` / `.frag` sources. The hash constants (374761393, 668265263, 1013904223, 1274126177, 13, 16, `& 255u`) match `surface.ts`. The `BAYER8` literal in `dither.frag` equals `BAYER8`. `OFFSET = 256.0` equals `NOISE_OFFSET`. The uniform names declared in each shader equal the renderer's `UNIFORMS_PASS1` / `UNIFORMS_PASS2` lists. No `#version` inside the files (the header is prepended). Every `smoothstep(a, b, …)` has `b` textually `a ± w` with `w > 0`. No `pow(`. |
| `tests/sizing.test.ts` | `cellCssFor` at 390, 768, 1280, 1366, 1440, 1920, 2560 per density (table in 4.2). `computeGrid` values for every row of 4.2 (cellDev, cols, rows, mask). Even `cellDev` when `dprRaw > 2`. `devicePixelContentBoxSize` preferred when given. `latticeSpacing` clamps (8 at 300, 40 at 2000). `pointerRadius` = 312 at 1440×900 and 82.33 at 390×236.32. |
| `tests/flow.test.ts` | `breathScale` (carried from `motion.test.ts`). `INTENSITY_K` values. |
| `tests/pointer.test.ts` | Ease is frame-rate independent (position after 1 s at 30, 60 and 120 fps within 1 %). Strength reaches 1 at 200 ms and 0 at 600 ms after `release()`. Touch `down` snaps. `velFactor` saturates at 1500 px/s. `settled` semantics. |
| `tests/ripples.test.ts` | Spawn, then a 9th drops the oldest. `write()` packs `(x, y, 9·sp·age, 1.2·(1 − age/3.2))` and zeroes unused slots. Expiry at 3.2 s. `clear()`. |
| `tests/entry.test.ts` | Phase boundaries at 900, 1900 and 2700 ms. Events `start`, `scrim` at 1900, `reveal` at 2100, `done` at 2700, `cleanup` at 3300, in order, once each. `entryProgress` values at 0, 450, 900, 1400, 2300 and 2700 ms. Stays `pending` until ready and visible. A hidden tick does not advance. `skip()` reaches `done` in 250 ms. Konami timings (3200 ms, no scrim or reveal). A long `dt` is clamped by the caller. |
| `tests/nameMask.test.ts` | `fitFontPx` picks `0.4·h` when height-limited and `0.84·w` when width-limited. Plane size `2·cols × 2·rows`. Ink centre within one texel of the box centre (fake canvas). `alphaPlane` extracts byte 3 of each pixel. Phone band box. Fallback when `actualBoundingBox*` is absent. |
| `tests/theme.test.ts` | `readPref` (`'light'`, `'dark'`, garbage → system, throwing storage → system). `writePref('system')` removes the key. `resolveTheme`. `togglePref` collapses to `'system'` when the flip equals the OS look. `parseHex` / `lerpRGB`. `ColorTween` is linear: midpoint at 150 ms, exact target at 300 ms, `active` false afterwards. |
| `tests/tokens.test.ts` | Read `src/styles.css`: `--field-0..3` are 6-digit hex in the dark base and in both light blocks, and are not `@property`-registered. The registered tokens have `syntax: '<color>'`. `public/theme-boot.js` contains `pn.theme`, `data-theme` and `pn-entry`, and no `innerHTML` or `eval`. |
| `tests/content.test.ts` | `index.html` contains `href="mailto:info@parsanaji.com"`, `https://github.com/parsanaji` and `<script src="/theme-boot.js">` before the stylesheet link. No inline `<script>` other than `type="application/ld+json"`. No `style=` attributes. All values equal `CONTENT`. |
| `tests/clock.test.ts` | `formatClock`: 14:36 PDT → `{ time: '2:36 PM', zone: 'PDT' }`; midnight → `12:00 AM`; noon → `12:00 PM`; PST in winter; ASCII space only (never U+202F, which ICU 72+ inserts in `en-US` times). `msToNextMinute`. |
| `tests/emailCopy.test.ts` | `writeText` resolves → `'copied'` and the label reverts after 1200 ms (fake timers). Rejects → `'fallback'` and `assign('mailto:info@parsanaji.com')`. No clipboard → fallback. |
| `tests/shortcuts.test.ts` | `g`, `l`, `e`, `?` and `Escape` map. Ctrl, Meta and Alt are ignored; Shift is allowed (`?`). `l` returns null when LinkedIn is empty. Repeat and editable targets are ignored. Upper-case `G` maps (Caps Lock). |
| `tests/konami.test.ts` | The full sequence fires once. An overlapping prefix (`↑ ↑ ↑ ↓ ↓ …`) still matches. `B`/`A` are case-insensitive. A wrong key resets. |
| `tests/scramble.test.ts` | Ends on the exact target. Spaces stay spaces. Length is constant. Deterministic for a seed. Character i is settled by `durMs·(0.3 + 0.7·i/(n − 1))`. Glyphs come from `SCRAMBLE_GLYPHS`, all inside the font subset. |
| `tests/greeting.test.ts` | One log call, the first argument contains `%c` and `info@parsanaji.com`. |
| `tests/loop.test.ts` | Fake rAF. dt clamped to 50 ms. `start()` after `stop()` resets the timestamp (no catch-up). `onFrame` returning false idles; `wake()` runs one frame. |
| `tests/glContext.test.ts` | Context returned; `null`; `getContext` throws → `null`. `GL_ATTRIBUTES` exact object. |
| `tests/program.test.ts` | Fake gl: `uniformMap` strips `[0]`. A compile failure becomes a `ShaderError` with the info log. `ready()` without the extension is true. |
| `tests/params.test.ts` | `cloneField` deep copy. `DEFAULT_FIELD` matches section 2.5. |
| `tests/ogAsset.test.ts` | `public/og.png` is 1200×630 PNG and under 300 KB. |
| kept | `easing`, `prng`, `time`, `fonts`, `env` (Node ≥ 22.18), `quality` (`capDpr`, `FpsProbe`) |

### 9.2 Browser-only checks (Chrome DevTools MCP, per task)

Use `navigate_page` with `initScript` to override `matchMedia` for reduced motion, and `emulate` for viewports. The dev-only `window.__pn` hooks (section 2.4) do the GL readbacks.

1. Console at 1440×900, 1280×720 and 390×844 (`emulate 390x844x3,mobile,touch`), dark and light, on preview and production: **zero** error or warn messages.
2. Parity: `__pn.parity()` reads pass 1 back (`readPixels` on the FBO) and compares it with `surface()`. Pass: max error ≤ 3/255, tier mismatch ≤ 0.5 %. Prototype: 0.58/255, 0.14–0.21 %.
3. GPU time: `__pn.gpuTime(60)` (`EXT_disjoint_timer_query_webgl2`) ≤ 2 ms median at 1440×900. rAF mean dt ≤ 16.7 ms over 10 s of pointer movement. A `performance_start_trace` shows no long task over 50 ms after the entry.
4. Entry filmstrip: with `__pn.setTime` (or a performance trace), screenshots at 0.45 s (gather), 1.4 s (hold, pointer over a letter shows the bend), 2.3 s (dissolve plus rail fading) and 3.4 s (done). Check `html` classes against the section 5 table.
5. Theme:
   - The toggle flips `data-theme`, `aria-pressed`, `localStorage['pn.theme']` and both `theme-color` metas.
   - At 150 ms into a toggle, a canvas off-cell pixel (`readPixels` in rAF) and `getComputedStyle(body).backgroundColor` both sit within ±3/255 of the sRGB midpoint.
   - Reload with the stored opposite of the OS look: the first painted frame of a trace filmstrip already has the stored look.
6. Reduced motion (`initScript`: `matchMedia` override): the rail is visible on first paint; two canvas screenshots 1 s apart are identical; a pointer move changes the field; no rings; no pulse.
7. Fallbacks:
   - `?nowebgl`, and an `initScript` making `getContext('webgl2')` return `null`: content visible at once, no console errors.
   - JS disabled (no-JS emulation, or a request block on the module script): content readable; the 4 s failsafe reveals.
8. Context loss: `WEBGL_lose_context.loseContext()` then `restoreContext()`: the field resumes, no errors. Without a restore, the fallback appears after 3 s.
9. Hidden at load: `new_page` with `background: true`, wait 3 s, `select_page`. The entry starts only now (filmstrip).
10. DPR: emulate 1440×900 at ×1, ×1.25, ×1.5 and ×2. Check `__pn.grid()` for integer `cellDev`. A screenshot column-width histogram over 64 cells shows every on-run is a multiple of `cellDev` (no moiré).
11. Lighthouse (`lighthouse_audit`, mobile and desktop) on the preview URL. Record LCP (risk 1), CLS = 0, TBT < 100 ms, and Accessibility, Best Practices and SEO ≥ 95.
12. Bundle: `npm run build`, then the gzip size of `dist/assets/*.js` ≤ 60 KB and of the fonts ≤ 40 KB (scripted in the task).

---

## 10. Open risks and recommendations

1. **LCP vs the entry (R6 vs R14). Measured.**
   - Chrome reports an element that fades in from `opacity: 0` as an LCP candidate only when the fade completes. In `proto/lcp.html` the H1 revealed at 2100 ms gave LCP = 2756 ms, after only a 144 px² toggle at 48 ms. A WebGL canvas is never an LCP candidate.
   - So with R6, Lighthouse LCP is about 2.8 s unthrottled and about 3 s or more on simulated 4G. That fails "LCP ≤ 1.5 s", and on mobile Lighthouse probably pushes Performance below the old house rule of 95.
   - **Recommendation:** apply the LCP ≤ 1.5 s budget to the no-entry path (reduced motion, or `?noentry`, which `theme-boot.js` honours). For the entry path, add these budgets instead: FCP ≤ 1.0 s, first field frame ≤ 1.2 s, rail fully visible ≤ 3.0 s. Do not game LCP (hidden-text tricks).
   - The alternative, keeping the rail visible during the entry and forming the name in the open field, changes R6. That is a controller or Parsa call (question 1).
2. **Font budget.**
   - JetBrains Mono's coding ligatures make the default subset 28.1 + 29.2 = 57.3 KB, which busts the 40 KB budget.
   - **Recommendation:** in `subset-fonts.mjs` pass `{ targetFormat: 'woff2', noLayoutClosure: true }` (12.0 + 12.1 = 24.1 KB), and set `font-variant-ligatures: none` in CSS.
   - Keep hinting: Windows renders small mono text better with it. If space is ever needed, `noHinting` gives 8.0 + 8.0 KB.
   - Charset: printable ASCII plus `· — – ● ○ … ’ “ ” é`. `◐ ☾ ☀` do not exist in the font.
3. **Accent "puddles".**
   - Field-2 lives only in the 0.66–0.703 band at the top of the curve, so it appears as flat, hard-edged light patches (visible in `shot-idle-dark.png`). This is the Blueprint math Parsa approved, so ship it as is.
   - If the reviewer finds it blotchy, try `uTiers.x` 0.62 or `uLevel.x` 0.28 in `?debug`. Both are tunables, no code change.
4. **Repel fold.**
   - The Blueprint warp (0.55·R·f) overshoots the pointer for `d < ≈ 0.4R`, so a small mirrored lens appears at the cursor (`shot-light-pointer-ripple.png`). It is approved behaviour.
   - If it reads as a glitch on the large screen, add a tunable clamp `|Δ| ≤ 0.9·d` (one `min()` in pass 1) behind `pointer.noFold`, default off.
5. **Flow speed.**
   - Medium is the Blueprint I = 1 (0.14 z units per second), approved in the Blueprint overlay preview at about 1290 px wide.
   - On a 2560 px monitor the absolute-px noise scale shows about 16 features across. If it feels busy, try `shape.mainScalePx` 200 / `warpScalePx` 300 in `?debug`.
   - Do not normalise noise to the viewport. It would make phones look different from the approved phone preview.
6. **First compile hitch.**
   - 206 ms on ANGLE/D3D11 is hidden by `KHR_parallel_shader_compile`.
   - Without the extension (some Safari and Firefox builds) the link blocks the main thread on the first status query. Do that query inside a rAF after first paint, never before. The entry waits for `ready` anyway.
7. **Moiré at fractional DPR.** Solved by integer `cellDev` plus `devicePixelContentBoxSize`. Safari lacks the latter but has integer DPRs. Verify ×1.25 and ×1.5 in the browser (check 10).
8. **WebGL context loss.** Handled (section 6). A browser check with `WEBGL_lose_context` is required, because a lost context fails silently and the field just freezes.
9. **Safari and iOS formats.** R8 (LINEAR), RGBA8 render target, `texelFetch`, `uint` ops, `texStorage2D` and highp fragment float are all WebGL2 core. Low risk.
   - iOS Low Power Mode caps rAF at 30 fps, which trips `FpsProbe` (< 45) and raises cells by 1.5×. That is harmless (coarser cells) and happens once.
10. **Software GL.** `failIfMajorPerformanceCaveat: true` gives SwiftShader users the static fallback, so no 100 % CPU fans. The DevTools MCP Chrome on this PC uses the RTX 2080 SUPER through ANGLE, so browser checks still run.
11. **Precision over long sessions.** Solved by periodic z (the CPU wraps in double). Pointer and ring coordinates are bounded by the viewport.
12. **Rail and name overlap during the reveal** (Agent B 6.2). For about 0.2 s, low-opacity rail text overlaps field-3 name cells. Accept. If a reviewer objects, move `revealAtMs` so the reveal starts when `e < 0.5` (about 2.3 s).
13. **Konami placement** depends on the rail's right edge (Agent C). It is measured at trigger time from `getBoundingClientRect()`, so a layout change needs no code change.
14. **Mask legibility on phones.** In the 236 px band the name is about 54.6 CSS px (20 cells of cap height at 2 px). That is legible (`shot-phone-hold.png` at 60 px).
    - If Agent C makes the band shorter than 200 px, the name stays width-limited, so nothing changes. Below a 160 px band height it becomes height-limited (0.4·h). Then raise `mask.heightFrac` to 0.55 for the band.
15. **Clock string.** ICU 72+ formats `en-US` 12-hour time with U+202F before AM/PM (not in the subset, and a test hazard). Build the string from `formatToParts` (section 2.2).
16. **Node type stripping for the OG script.** Needs Node ≥ 22.18 (`engines` bump). CI does not run `npm run og`. If a builder must run on older Node, fall back to a JS twin `scripts/og-math.mjs` plus a parity test. Not expected.
17. **Vendoring JetBrains Mono.** The Geist sources are in the repo but JetBrains Mono is not. The builder downloads the v2.304 zip (verified reachable) and commits the two webfont woff2 files and `OFL.txt` under `scripts/fonts-src/`. The download goes in its own directory, and only the three files are extracted.

---

## 11. Questions the controller must answer before the spec

1. **LCP (risk 1):** either accept "LCP ≤ 1.5 s on the no-entry path, plus FCP ≤ 1.0 s, first field frame ≤ 1.2 s and rail visible ≤ 3.0 s on the entry path", or change R6 so the rail stays visible and the name forms beside it.
2. **Pointer velocity:** confirm `velRadiusGain = 0.1` (up to 10 % wider repel on fast moves). The Blueprint had none; `0` reproduces it exactly.
3. **Breath:** confirm the domain zoom ±1 % over 6 s, on the idle field and on the held name. The Blueprint dither branch had none; R6's "still breathing" is the only source.
