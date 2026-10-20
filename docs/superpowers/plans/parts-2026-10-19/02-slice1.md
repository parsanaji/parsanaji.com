## Task bodies

The 24 task bodies follow in order. Slice boundaries are in the Slices section above: Tasks 8, 16, 22 and 24 close slices 1–4 and push. There are no slice headings between the bodies, so `task-brief` extracts exactly one task.

Every command below runs in Git Bash from `/c/Users/parsa/parsanaji.com` on branch `resume-screen`. Vitest runs with the `minimal` reporter here (`CLAUDECODE` is set), so a passing run prints only the summary lines quoted under **Expected**. The golden values (test counts, checksums, sizes, hashes and layout measurements) were produced by running this exact code on scratch copies of HEAD `3e64808` with Node 24.19.0, npm 11.17.0 and the pinned devDependencies (slice 1 by its writer; slices 2 and 3 by theirs; the assembler re-ran the final suite and every intermediate typecheck of Tasks 15–22).

---

### Task 1: Toolchain and teaser retirement

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm uninstall three @types/three` and `npm install --save-dev --save-exact harfbuzzjs@1.6.3 fontverter@2.0.0`; then `engines.node` → `">=22.18.0"` and the `og:placeholder` script removed), `vite.config.ts`, `src/main.ts` (interim, below), `tests/env.test.ts`, `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts`, `tests/quality.test.ts`.
- Move (`git mv`): `src/engine/prng.ts` → `src/core/prng.ts`; `src/engine/easing.ts` → `src/core/easing.ts`; `src/engine/time.ts` → `src/core/time.ts`; `src/engine/quality.ts` → `src/core/quality.ts` (then delete `WidthClass`, `COUNT_CAP`, `widthClass`, `dotCount`, `degradedCount`).
- Delete: `src/app.ts`, `src/tweaks.ts`, `src/engine/ParticleField.ts`, `src/engine/defaults.ts`, `src/shaders/field.vert`, `src/shaders/field.frag`, `src/shaders/noise.glsl`, `src/boot/webgl.ts`, `scripts/og-placeholder.mjs`, `tests/defaults.test.ts`, `tests/webgl.test.ts`, `tests/sampler.test.ts`.
- Keep untouched (P10 and later tasks): `src/engine/types.ts`, `src/engine/sampler.ts`, `src/engine/motion.ts`, `tests/motion.test.ts`, `tests/helpers/fakeCanvas.ts`, `src/ui/clock.ts`, `src/ui/exitLine.ts`, `tests/clock.test.ts`, `src/content.ts`, `index.html`, `src/styles.css`, `public/**`, `scripts/fonts-src/**`, `src/boot/fonts.ts`, `tests/fonts.test.ts`.
- Interim `src/main.ts`, exactly: `// Task 1 interim boot: the teaser engine is retired; Task 8 writes the résumé boot.` / `document.documentElement.classList.add('no-webgl');` / `export {};`

**Interfaces:**
- Consumes: none.
- Produces (moved, behaviour unchanged):
  - `src/core/prng.ts`: `mulberry32(seed: number): () => number` (uniform in [0, 1)); `seedFromLocation(search: string, fallback?: () => number): number` (`?seed=<finite>` → `n >>> 0`, else `fallback() >>> 0`, default `Date.now`).
  - `src/core/easing.ts`: `clamp01`, `easeOutExpo`, `easeInCubic`, `easeOutCubic`, each `(t: number) => number`.
  - `src/core/time.ts`: `clampDt(dtMs: number, maxMs?: number): number` (default 50; non-finite or ≤ 0 → `1000 / 60`).
  - `src/core/quality.ts`: `capDpr(devicePixelRatio: number, max?: number): number` (default 2; non-finite or ≤ 0 → 1); `class FpsProbe { constructor(windowFrames?: number, thresholdFps?: number); push(dtMs: number): 'pending' | 'keep' | 'degrade'; get done(): boolean }` (defaults 60 and 45; reports `'degrade'` at most once).
  - Kept in place: `src/boot/fonts.ts`: `type FontWaitResult = 'loaded' | 'timeout' | 'unavailable'`; `interface FontFaceSetLike { load(font: string): Promise<unknown> }`; `waitForFont(spec: string, timeoutMs: number, fonts?: FontFaceSetLike, schedule?: (fn: () => void, ms: number) => unknown): Promise<FontWaitResult>` (never rejects).

- [ ] **Step 1: Point the kept tests at `src/core/` and drop the particle-count cases (spec 4.2, 8.1.18)**

In `tests/prng.test.ts`, line 2:

```ts
// before
import { mulberry32, seedFromLocation } from '../src/engine/prng';
// after
import { mulberry32, seedFromLocation } from '../src/core/prng';
```

In `tests/easing.test.ts`, line 2:

```ts
// before
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo } from '../src/engine/easing';
// after
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo } from '../src/core/easing';
```

In `tests/time.test.ts`, line 2:

```ts
// before
import { clampDt } from '../src/engine/time';
// after
import { clampDt } from '../src/core/time';
```

Full file `tests/quality.test.ts` (the `widthClass`, `COUNT_CAP`, `dotCount` and `degradedCount` cases go; `capDpr` and `FpsProbe` stay verbatim):

```ts
import { describe, expect, it } from 'vitest';
import { FpsProbe, capDpr } from '../src/core/quality';

describe('capDpr', () => {
  it('caps at 2 and sanitizes', () => {
    expect(capDpr(3)).toBe(2);
    expect(capDpr(1.5)).toBe(1.5);
    expect(capDpr(Number.NaN)).toBe(1);
    expect(capDpr(0)).toBe(1);
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

Full file `tests/env.test.ts` (the floor rises to 22.18, spec 4.1.3 and 6.1.15; the ICU, `fetch` and `process.loadEnvFile` cases are unchanged and the test never loads `.env`):

```ts
import { describe, expect, it } from 'vitest';

describe('runtime environment', () => {
  it('runs on Node 22.18 or newer (type stripping for scripts/og-image.mjs, spec 4.1.3)', () => {
    const [major, minor] = process.versions.node.split('.').map(Number);
    expect(major > 22 || (major === 22 && minor >= 18)).toBe(true);
  });

  it('has full ICU time-zone data for America/Los_Angeles', () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    }).formatToParts(new Date('2026-07-01T12:00:00Z'));
    expect(parts.find((p) => p.type === 'timeZoneName')?.value).toBe('PDT');
  });

  it('exposes fetch and process.loadEnvFile for the scripts', () => {
    expect(typeof fetch).toBe('function');
    expect(typeof process.loadEnvFile).toBe('function');
  });
});
```

- [ ] **Step 2: Run the retargeted tests to verify they fail**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts tests/quality.test.ts`

Expected: FAIL, `Test Files  4 failed (4)`, `Tests  no tests`, one error per file:
`Error: Cannot find module '../src/core/prng' imported from …/tests/prng.test.ts` (and the same for `../src/core/easing`, `../src/core/time`, `../src/core/quality`).

- [ ] **Step 3: Move the four utilities to `src/core/` and trim `quality.ts` (spec 4.2, Appendix A §1.1)**

```bash
mkdir -p src/core
git mv src/engine/prng.ts src/core/prng.ts
git mv src/engine/easing.ts src/core/easing.ts
git mv src/engine/time.ts src/core/time.ts
git mv src/engine/quality.ts src/core/quality.ts
```

`prng.ts`, `easing.ts` and `time.ts` stay byte-for-byte as they are. Full file `src/core/quality.ts` (only `capDpr` and `FpsProbe` remain; their code is unchanged, the probe's comment now cites 3.7.9):

```ts
export function capDpr(devicePixelRatio: number, max = 2): number {
  const d = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(max, d);
}

/** Measures one window of frames; reports 'degrade' at most once (spec 3.7.9). */
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

- [ ] **Step 4: Run the kept tests to verify they pass**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts tests/quality.test.ts tests/env.test.ts`

Expected: PASS, `Test Files  5 passed (5)`, `Tests  17 passed (17)`.

- [ ] **Step 5: Retire the teaser engine (spec 2.2.1–2.2.3, 2.2.6, Appendix A §1.1–§1.3)**

```bash
git rm src/app.ts src/tweaks.ts src/engine/ParticleField.ts src/engine/defaults.ts \
  src/shaders/field.vert src/shaders/field.frag src/shaders/noise.glsl src/boot/webgl.ts \
  scripts/og-placeholder.mjs tests/defaults.test.ts tests/webgl.test.ts tests/sampler.test.ts
```

Expected: twelve `rm '…'` lines; `src/shaders/` no longer exists. `src/engine/` keeps exactly `motion.ts`, `sampler.ts` and `types.ts` (P10: they still typecheck on their own; `tests/motion.test.ts` and `tests/helpers/fakeCanvas.ts` still import them).

Full file `src/main.ts` (the interim boot: the teaser imports are gone, and the static fallback class keeps the empty canvas hidden):

```ts
// Task 1 interim boot: the teaser engine is retired; Task 8 writes the résumé boot.
document.documentElement.classList.add('no-webgl');
export {};
```

Full file `vite.config.ts` (spec 4.1.5: `chunkSizeWarningLimit: 700` and its comment go; `vitest.config.ts` and `tsconfig.json` stay unchanged):

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
```

- [ ] **Step 6: Remove Three.js, add the OG-script dependencies, raise the Node floor (spec 4.1.1–4.1.4, Appendix A §1.4)**

Edit `package.json` first, so npm writes the new floor into the lockfile's root entry when it regenerates it. Two hunks:

```diff
-  "engines": { "node": ">=22.12.0" },
+  "engines": { "node": ">=22.18.0" },
```

```diff
     "fonts": "node scripts/subset-fonts.mjs",
-    "og:placeholder": "node scripts/og-placeholder.mjs",
     "og": "node scripts/og-image.mjs",
```

Then run:

```bash
npm uninstall three @types/three
npm install --save-dev --save-exact harfbuzzjs@1.6.3 fontverter@2.0.0
```

Expected: the uninstall prints `removed 8 packages, and audited 80 packages in …` and `found 0 vulnerabilities`; the install prints `up to date, audited 80 packages in …` (both packages are already in the tree as `subset-font` dependencies) and `found 0 vulnerabilities`. Both may also print the harmless `npm warn allow-scripts … esbuild@0.28.2 … workerd@…` lines. npm reformats `engines` onto three lines and deletes the now-empty `dependencies` key.

Restore the explicit empty `dependencies` (Global Constraints: `dependencies` is `{}`). Full file `package.json`:

```json
{
  "name": "parsanaji.com",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22.18.0"
  },
  "scripts": {
    "dev": "vite --host",
    "build": "tsc --noEmit -p tsconfig.json && vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "fonts": "node scripts/subset-fonts.mjs",
    "og": "node scripts/og-image.mjs",
    "deploy": "npm run build && wrangler pages deploy dist --project-name parsanaji-com --branch main --commit-dirty=true",
    "deploy:preview": "npm run build && wrangler pages deploy dist --project-name parsanaji-com --branch preview --commit-dirty=true"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "22.20.5",
    "fontverter": "2.0.0",
    "harfbuzzjs": "1.6.3",
    "lil-gui": "0.21.0",
    "sharp": "0.35.5",
    "subset-font": "2.9.0",
    "typescript": "5.9.3",
    "vite": "8.3.4",
    "vitest": "5.0.5",
    "wrangler": "4.151.0"
  }
}
```

Verify the lockfile agrees with it exactly as CI will:

```bash
npm ci
npm ls --depth=0
sed -n '7,25p' package-lock.json
```

Expected: `npm ci` prints `added 79 packages, and audited 80 packages in …` and `found 0 vulnerabilities`. `npm ls --depth=0` prints exactly ten entries and no `three`:

```
parsanaji.com@0.1.0 C:\Users\parsa\parsanaji.com
+-- @types/node@22.20.5
+-- fontverter@2.0.0
+-- harfbuzzjs@1.6.3
+-- lil-gui@0.21.0
+-- sharp@0.35.5
+-- subset-font@2.9.0
+-- typescript@5.9.3
+-- vite@8.3.4
+-- vitest@5.0.5
`-- wrangler@4.151.0
```

The lockfile root (`packages[""]`) lists the same ten devDependencies, has no `dependencies` block and ends with `"engines": { "node": ">=22.18.0" }`. `git diff --stat package-lock.json` shows `3 insertions(+), 68 deletions(-)` (three, @types/three and their six transitive packages `@dimforge/rapier3d-compat`, `@tweenjs/tween.js`, `@types/stats.js`, `@types/webxr`, `fflate`, `meshoptimizer` leave; `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` stay for CI).

- [ ] **Step 7: Full gate**

```bash
npm test
npm run typecheck
npm run build
grep -l "WebGLRenderer" dist/assets/*.js || echo "no WebGLRenderer in dist"
```

Expected:
- `npm test`: `Test Files  8 passed (8)`, `Tests  32 passed (32)` (clock 4, easing 3, env 3, fonts 5, motion 6, prng 4, quality 4, time 3).
- `npm run typecheck`: the two npm header lines and nothing else.
- `npm run build`: `✓ 5 modules transformed.`, then `dist/index.html 3.20 kB`, `dist/assets/index-….css 3.30 kB`, `dist/assets/index-….js 0.72 kB │ gzip: 0.41 kB` and `✓ built in …ms` (the bundle shrinks from about 547 kB minified to under 1 kB).
- The grep prints `no WebGLRenderer in dist`.

Record `npm ls --depth=0`, the build output and the grep line in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-1-report.md`.

- [ ] **Step 8: Commit**

`git mv` and `git rm` already staged the moves and deletions. Stage the edited files by name:

```bash
git add package.json package-lock.json vite.config.ts src/main.ts src/core/quality.ts \
  tests/env.test.ts tests/prng.test.ts tests/easing.test.ts tests/time.test.ts tests/quality.test.ts
git status --short
```

Expected `git status --short` (untracked `docs/` lines, if any, stay unstaged; `quality.ts` shows as delete plus add because more than half of it went):

```
M  package-lock.json
M  package.json
D  scripts/og-placeholder.mjs
D  src/app.ts
D  src/boot/webgl.ts
R  src/engine/easing.ts -> src/core/easing.ts
R  src/engine/prng.ts -> src/core/prng.ts
A  src/core/quality.ts
R  src/engine/time.ts -> src/core/time.ts
D  src/engine/ParticleField.ts
D  src/engine/defaults.ts
D  src/engine/quality.ts
M  src/main.ts
D  src/shaders/field.frag
D  src/shaders/field.vert
D  src/shaders/noise.glsl
D  src/tweaks.ts
D  tests/defaults.test.ts
M  tests/easing.test.ts
M  tests/env.test.ts
M  tests/prng.test.ts
M  tests/quality.test.ts
D  tests/sampler.test.ts
M  tests/time.test.ts
D  tests/webgl.test.ts
M  vite.config.ts
```

```bash
git commit -m "refactor: retire the teaser engine and Three.js; utilities move to src/core

Removes three, @types/three, the particle field, its shaders, the teaser App and
debug panel, the WebGL probe and the placeholder OG script. prng, easing, time and
quality move to src/core (quality keeps capDpr and FpsProbe). Adds harfbuzzjs and
fontverter for the OG script and raises engines.node to >=22.18.0.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: JetBrains Mono subsets

**Files:**
- Create: `scripts/fonts-src/JetBrainsMono-Regular.woff2`, `scripts/fonts-src/JetBrainsMono-Bold.woff2`, `scripts/fonts-src/OFL.txt` — extracted from `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip` (members `fonts/webfonts/JetBrainsMono-Regular.woff2`, `fonts/webfonts/JetBrainsMono-Bold.woff2`, `OFL.txt`) after downloading the zip into its own new, empty directory outside the repo; only those three members are extracted (Windows `tar -xf` reads zip); sizes 92,164 / 94,588 / 4,399 bytes.
- Modify: `scripts/subset-fonts.mjs` (jobs Regular → `JetBrainsMono-Regular.subset.woff2`, Bold → `JetBrainsMono-Bold.subset.woff2`; text = printable ASCII U+0020–U+007E + `·—–●○…’“”é`; options `{ targetFormat: 'woff2', noLayoutClosure: true }`; copy `scripts/fonts-src/OFL.txt` to `public/fonts/LICENSE.txt`; keep the 40 KB total check with exit code 1).
- Create (generated): `public/fonts/JetBrainsMono-Regular.subset.woff2`, `public/fonts/JetBrainsMono-Bold.subset.woff2`. Modify (generated): `public/fonts/LICENSE.txt`.
- Delete: `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt`, `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2`.

**Interfaces:**
- Consumes: none.
- Produces: the served font files `/fonts/JetBrainsMono-Regular.subset.woff2` (weight 400) and `/fonts/JetBrainsMono-Bold.subset.woff2` (weight 700), family name `JetBrains Mono` (consumed by Task 5 preloads and Task 6 `@font-face`); the full source fonts `scripts/fonts-src/JetBrainsMono-Bold.woff2` and `scripts/fonts-src/JetBrainsMono-Regular.woff2` (consumed by Task 4).

- [ ] **Step 1: Download the v2.304 release into a new empty directory outside the repo (spec 4.11.1, 9.17)**

Git Bash's own `tar` is GNU tar and cannot read zip archives; call the Windows bsdtar by its full path. Shell variables do not survive between Bash tool calls: run this block as one call, and in Step 2 replace `$JBM` with the path it echoes first (for example `/tmp/tmp.NgESsHZ8nu`).

```bash
JBM=$(mktemp -d)
echo "$JBM"
ls -A "$JBM" | wc -l
curl -fL --retry 3 -s -o "$JBM/JetBrainsMono-2.304.zip" https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip
sha256sum "$JBM/JetBrainsMono-2.304.zip"
/c/Windows/System32/tar.exe -xf "$JBM/JetBrainsMono-2.304.zip" -C "$JBM" fonts/webfonts/JetBrainsMono-Regular.woff2 fonts/webfonts/JetBrainsMono-Bold.woff2 OFL.txt
find "$JBM" -type f | sort
wc -c "$JBM/fonts/webfonts/JetBrainsMono-Regular.woff2" "$JBM/fonts/webfonts/JetBrainsMono-Bold.woff2" "$JBM/OFL.txt"
```

Expected: the new directory's path, then `0` (the directory starts empty); the zip's SHA-256 is `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf` (5,622,857 bytes); `find` lists exactly the zip, `OFL.txt` and the two woff2 files; the sizes are:

```
 92164 …/fonts/webfonts/JetBrainsMono-Regular.woff2
 94588 …/fonts/webfonts/JetBrainsMono-Bold.woff2
  4399 …/OFL.txt
```

Member SHA-256s, for the report: Regular `a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2`, Bold `c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2`, `OFL.txt` `30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad`.

- [ ] **Step 2: Vendor the three files and remove Geist (spec 2.2.4)**

```bash
cp "$JBM/fonts/webfonts/JetBrainsMono-Regular.woff2" "$JBM/fonts/webfonts/JetBrainsMono-Bold.woff2" "$JBM/OFL.txt" scripts/fonts-src/
git rm scripts/fonts-src/Geist-Black.woff2 scripts/fonts-src/GeistMono-Regular.woff2 scripts/fonts-src/LICENSE.txt \
  public/fonts/GeistSans-Black.subset.woff2 public/fonts/GeistMono-Regular.subset.woff2
ls -l scripts/fonts-src
```

Expected: five `rm '…'` lines; `scripts/fonts-src/` holds exactly `JetBrainsMono-Bold.woff2` (94588), `JetBrainsMono-Regular.woff2` (92164) and `OFL.txt` (4399).

- [ ] **Step 3: Rewrite the subset script (spec 4.11.2, 4.11.3)**

Full file `scripts/subset-fonts.mjs`:

```js
// Generates the two self-hosted JetBrains Mono subsets from the vendored v2.304 sources in scripts/fonts-src/ (SIL OFL 1.1).
// Run: node scripts/subset-fonts.mjs   (also: npm run fonts). Spec 4.11.
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

const srcDir = path.resolve('scripts/fonts-src');
const outDir = path.resolve('public/fonts');

// Printable ASCII U+0020-U+007E plus the typography the page and its scripts write (spec 4.11.2, 3.5.13).
const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const TEXT = `${ASCII}·—–●○…’“”é`;
// Without noLayoutClosure the coding-ligature closure makes the pair 57.3 KB (spec 4.11.2, risk 9.2).
const OPTIONS = { targetFormat: 'woff2', noLayoutClosure: true };

const jobs = [
  { src: 'JetBrainsMono-Regular.woff2', out: 'JetBrainsMono-Regular.subset.woff2' },
  { src: 'JetBrainsMono-Bold.woff2', out: 'JetBrainsMono-Bold.subset.woff2' },
];

await mkdir(outDir, { recursive: true });
// OFL 1.1 condition 2: the license travels with every redistributed copy, subsets included.
await copyFile(path.join(srcDir, 'OFL.txt'), path.join(outDir, 'LICENSE.txt'));
let total = 0;
for (const job of jobs) {
  const input = await readFile(path.join(srcDir, job.src));
  const output = await subsetFont(input, TEXT, OPTIONS);
  const outPath = path.join(outDir, job.out);
  await writeFile(outPath, output);
  const { size } = await stat(outPath);
  total += size;
  console.log(`${job.out}: ${(size / 1024).toFixed(1)} KB (from ${(input.length / 1024).toFixed(1)} KB)`);
}
console.log(`total: ${(total / 1024).toFixed(1)} KB (budget 40 KB)`);
if (total > 40 * 1024) {
  console.error('font budget exceeded');
  process.exit(1);
}
```

- [ ] **Step 4: Generate the subsets and check the budget (spec 6.1.2)**

```bash
npm run fonts; echo "exit $?"
ls -l public/fonts
sha256sum public/fonts/*.woff2
```

Expected:

```
> parsanaji.com@0.1.0 fonts
> node scripts/subset-fonts.mjs

JetBrainsMono-Regular.subset.woff2: 12.0 KB (from 90.0 KB)
JetBrainsMono-Bold.subset.woff2: 12.1 KB (from 92.4 KB)
total: 24.1 KB (budget 40 KB)
exit 0
```

`public/fonts/` holds exactly `JetBrainsMono-Bold.subset.woff2` (12,348 bytes), `JetBrainsMono-Regular.subset.woff2` (12,320 bytes) and `LICENSE.txt` (4,399 bytes, a copy of `OFL.txt`). The output is deterministic: SHA-256 Bold `c45140cf1da3646406a7ba189d3089f363fe5efa2e2766eb3130fdb0626a7331`, Regular `18fd3f730acca10c34aef1f9873019b2e71357487b91b48ff4b5ac768acd677b`. A second `npm run fonts` reproduces the same bytes.

- [ ] **Step 5: Confirm every glyph the page and its scripts write is in both subsets (Global Constraints, 3.5.13)**

```bash
node --input-type=module -e "
import { readFile } from 'node:fs/promises';
import fontverter from 'fontverter';
import * as hb from 'harfbuzzjs';
const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const TEXT = ASCII + '·—–●○…’“”é';
for (const w of ['Regular', 'Bold']) {
  const sfnt = await fontverter.convert(await readFile('public/fonts/JetBrainsMono-' + w + '.subset.woff2'), 'sfnt');
  const have = new Set(new hb.Face(new hb.Blob(new Uint8Array(sfnt)), 0).collectUnicodes());
  console.log(w, have.size, 'code points, missing:', JSON.stringify([...TEXT].filter((c) => !have.has(c.codePointAt(0))).join('')));
}
"
```

Expected:

```
Regular 105 code points, missing: ""
Bold 105 code points, missing: ""
```

(95 printable ASCII + 10 extras; the clock, the scramble glyphs and "copied" are all inside.)

- [ ] **Step 6: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  8 passed (8)`, `Tests  32 passed (32)`; typecheck silent; the build succeeds (`✓ built in …ms`). Until Task 6 rewrites `src/styles.css`, the build also prints two notices, `/fonts/GeistSans-Black.subset.woff2 referenced in … didn't resolve at build time, it will remain unchanged to be resolved at runtime` and the same for `GeistMono-Regular`; they are expected and disappear in Task 6. Record the member sizes, hashes and the `npm run fonts` output in `task-2-report.md`.

- [ ] **Step 7: Commit**

```bash
git add scripts/subset-fonts.mjs scripts/fonts-src/JetBrainsMono-Regular.woff2 scripts/fonts-src/JetBrainsMono-Bold.woff2 \
  scripts/fonts-src/OFL.txt public/fonts/JetBrainsMono-Regular.subset.woff2 public/fonts/JetBrainsMono-Bold.subset.woff2 \
  public/fonts/LICENSE.txt
git status --short
```

Expected (git may pair the two licence files as a rename):

```
D  public/fonts/GeistMono-Regular.subset.woff2
D  public/fonts/GeistSans-Black.subset.woff2
A  public/fonts/JetBrainsMono-Bold.subset.woff2
A  public/fonts/JetBrainsMono-Regular.subset.woff2
M  public/fonts/LICENSE.txt
D  scripts/fonts-src/Geist-Black.woff2
D  scripts/fonts-src/GeistMono-Regular.woff2
A  scripts/fonts-src/JetBrainsMono-Bold.woff2
A  scripts/fonts-src/JetBrainsMono-Regular.woff2
R  scripts/fonts-src/LICENSE.txt -> scripts/fonts-src/OFL.txt
M  scripts/subset-fonts.mjs
```

```bash
git commit -m "feat(fonts): JetBrains Mono 400/700 subsets replace Geist

Vendors JetBrains Mono v2.304 (OFL 1.1) and subsets printable ASCII plus
·—–●○…’“”é with noLayoutClosure: 12.0 + 12.1 = 24.1 KB against the 40 KB budget.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Surface math twin (`src/field/surface.ts`)

**Files:** Create `src/field/surface.ts`, `tests/surface.test.ts`.

**Interfaces:**
- Consumes: none (the module has zero imports).
- Produces (`src/field/surface.ts`):
  ```ts
  export const NOISE_OFFSET = 256;
  export const Z_PERIOD = 256;
  export function hash3(x: number, y: number, z: number): number;
  export function noise3(x: number, y: number, z: number): number;
  export function fbm(x: number, y: number, z1: number, z2: number): number;
  export function flowZ(tSec: number, intensity: number, out?: Float32Array): Float32Array; // 6 values in [0, 256); App calls flowZ(tau, 1)
  export interface SurfaceShape { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number }
  export const BLUEPRINT_SHAPE: SurfaceShape; // { 240, 160, 2.6, 0.3, 2.1 }
  export function surface(xCss: number, yCss: number, z: ArrayLike<number>, s?: SurfaceShape): number;
  export interface Ring { x: number; y: number; radius: number; amp: number; sigma: number; gain: number }
  export function ringGain(xCss: number, yCss: number, ring: Ring): number; // gain * amp * exp(-(d - r)^2 / (2 sigma^2))
  export const BAYER8: readonly number[];
  export function bayerThreshold(i: number, j: number): number; // (BAYER8[(i&7)|((j&7)<<3)] + 0.5) / 64
  export function tierOf(v: number, i: number, j: number, t2?: number, t3?: number): 0 | 1 | 2 | 3; // defaults 0.66, 0.9
  export function tierGrid(cols: number, rows: number, cellCss: number, tSec: number, intensity: number, rings?: readonly Ring[]): Uint8Array;
  ```
- Semantics later tasks rely on: `hash3` is the 3.3.5 Blueprint hash in 32-bit unsigned arithmetic with `z & 255`, returning `h / 2³²`; `fbm(x, y, z1, z2) = 0.62 × noise3(x, y, z1) + 0.38 × noise3(2.1x + 7.3, 2.1y + 1.7, z2)`; `flowZ` returns `[zA, 1.4zA + 3.1, zB, 1.4zB + 3.1, zC, 1.4zC + 3.1]` with `zA = 0.09 × tSec × intensity`, `zB = zA + 2`, `zC = 0.14 × tSec × intensity`, each wrapped to [0, 256) in double precision; `surface()` is `F`, 3.3.4 steps 3–6 at breath 1 with no pointer, mask or rings (`z[0..1]` warp-x, `z[2..3]` warp-y, `z[4..5]` main; lattice offset `NOISE_OFFSET`); `tierGrid` evaluates cell centres `((i + 0.5) × cellCss, (j + 0.5) × cellCss)` with row `j = 0` at the top, `z = flowZ(tSec, intensity)`, `v = min(1, surface + Σ ringGain)`, tiers by `tierOf` with the defaults, stored row-major at `j × cols + i`.

Note on `flowZ`: a wrapped value in [255.9999924, 256) rounds up to exactly 256 when stored in the `Float32Array`; the module stores it as 0 instead, which is the same point of the z-periodic noise, so the "six values in [0, 256)" contract holds for every input (spec 9.11).

- [ ] **Step 1: Write the failing test**

Full file `tests/surface.test.ts` (spec 8.1.1, Appendix A §9.1; the Blueprint `hash` and `BAYER8` are copied verbatim from `part-c.html` lines 138 and 144; the golden checksum `0xa3198d09` and the coverage figures come from running this module):

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/surface.test.ts`

Expected: FAIL, `Test Files  1 failed (1)`, `Tests  no tests`, with `Error: Cannot find module '../src/field/surface' imported from …/tests/surface.test.ts`.

- [ ] **Step 3: Write the module (spec 3.3.4, 3.3.5, 3.3.6.2, 3.3.8.2, 3.3.10, 4.10.2; Appendix A §3.1, §3.4, §3.8)**

Full file `src/field/surface.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/surface.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  23 passed (23)` (about 1.5 s; the 10⁵-point sweep dominates). For the report, the measured values behind the asserts: max `surface` over the sweep 0.70312499988 (so max + 0.12 = 0.82312499988); 1440×900 cell 5 at t = 12: off 59.80 %, field-1 28.35 %, field-2 11.85 %, field-3 0 %; the OG grid (200×105, cell 6, t = 12): off 58.93 %, field-1 30.66 %, field-2 10.41 %, field-3 0 %, and with the 4.10.3 ring: 51.87 / 25.24 / 10.98 / 11.91 %.

- [ ] **Step 5: Confirm the OG script's import path works in plain Node (spec 4.10.2)**

Run: `node -e "import('./src/field/surface.ts').then(m => console.log(m.tierGrid(4, 2, 6, 12, 1).length))"`

Expected: `8` (Node 24.19 prints no warning; Node 22.18+ may add an `ExperimentalWarning` about type stripping on stderr, which is harmless).

- [ ] **Step 6: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  9 passed (9)`, `Tests  55 passed (55)`; typecheck silent; the build succeeds (the two Geist notices from Task 2 still print; nothing imports `surface.ts` yet, so the bundle is unchanged).

- [ ] **Step 7: Commit**

```bash
git add src/field/surface.ts tests/surface.test.ts
git commit -m "feat(field): surface.ts, the bit-exact CPU twin of the dither math

Blueprint hash/noise3/fbm with the +256 lattice offset and z periodic in 256,
flowZ wrapped in double precision, the dither curve, Shockwave ring gain, Bayer
8x8 tiers and tierGrid for the OG band. Zero imports so Node type stripping can
load it from scripts/og-image.mjs.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: OG image and favicons

**Files:** Create `scripts/og-image.mjs`, `tests/ogAsset.test.ts`, `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png`; Modify `public/favicon.svg` (exactly the 4.10.7 bytes), `public/og.png` (regenerated). All PNGs are produced by `npm run og` and committed.

**Interfaces:**
- Consumes: Task 3 `tierGrid(cols: number, rows: number, cellCss: number, tSec: number, intensity: number, rings?: readonly Ring[]): Uint8Array`, called without rings (imported by the `.mjs` from `../src/field/surface.ts`; the OG still has no Shockwave ring, Index amendment A10); Task 2 `scripts/fonts-src/JetBrainsMono-Bold.woff2`, `scripts/fonts-src/JetBrainsMono-Regular.woff2`; Task 1 devDependencies `harfbuzzjs 1.6.3`, `fontverter 2.0.0`, `sharp 0.35.5`.
- Produces: `/og.png` (1200×630 PNG, < 300 KB), `/favicon.svg`, `/favicon-32.png` (32×32), `/favicon-192.png` (192×192), `/apple-touch-icon.png` (180×180, no alpha), referenced by Task 5's head.

- [ ] **Step 1: Write the failing guard test**

Full file `tests/ogAsset.test.ts` (spec 4.10.8, 8.1.17; the last case also pins the 4.10.7 SVG):

```ts
import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

// Guard for the committed outputs of `npm run og` (spec 4.10.8, 8.1.17).
describe('OG image and favicons', () => {
  it('public/og.png is a 1200x630 PNG under 300 KB', async () => {
    const meta = await sharp('public/og.png').metadata();
    expect(meta.format).toBe('png');
    expect([meta.width, meta.height]).toEqual([1200, 630]);
    expect(statSync('public/og.png').size).toBeLessThan(300 * 1024);
  });

  it.each([
    ['public/favicon-32.png', 32],
    ['public/favicon-192.png', 192],
    ['public/apple-touch-icon.png', 180],
  ])('%s is a %i px square PNG', async (file, size) => {
    const meta = await sharp(file).metadata();
    expect(meta.format).toBe('png');
    expect([meta.width, meta.height]).toEqual([size, size]);
  });

  it('the apple touch icon has no alpha channel', async () => {
    const meta = await sharp('public/apple-touch-icon.png').metadata();
    expect(meta.hasAlpha).toBe(false);
    expect(meta.channels).toBe(3);
  });

  it('public/favicon.svg is the 16x16 PN monogram that follows the browser scheme (4.10.7)', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8').replace(/\r\n/g, '\n');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">\n')).toBe(true);
    expect(svg).toContain('.tile{fill:#f2f6fe}.glyph{fill:#071348}@media (prefers-color-scheme:dark){.edge{fill:#3b5df0}.tile{fill:#050a22}.glyph{fill:#e8eeff}}');
    expect(svg.match(/<rect /g)).toHaveLength(31);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ogAsset.test.ts`

Expected: FAIL, `Tests  5 failed | 1 passed (6)`. The teaser's placeholder `public/og.png` is already 1200×630 and passes; the three icon cases fail with `Error: Input file is missing: public/favicon-32.png` (and `-192`, `apple-touch-icon`, twice for the apple icon), and the SVG case fails with `AssertionError: expected false to be true`.

- [ ] **Step 3: Replace the favicon with the PN monogram (spec 3.2.7, 4.10.7, Appendix B §5.1)**

Full file `public/favicon.svg`, byte for byte (six lines, LF, 1,577 bytes):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
<style>.edge{fill:#3b5df0}.tile{fill:#f2f6fe}.glyph{fill:#071348}@media (prefers-color-scheme:dark){.edge{fill:#3b5df0}.tile{fill:#050a22}.glyph{fill:#e8eeff}}</style>
<rect class="edge" width="16" height="16" rx="3"/>
<rect class="tile" x="1" y="1" width="14" height="14" rx="2"/>
<g class="glyph"><rect x="2" y="4" width="4" height="1"/><rect x="2" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="2" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="2" y="8" width="4" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="2" y="10" width="1" height="1"/><rect x="2" y="11" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="9" y="5" width="2" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="9" y="6" width="2" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="12" y="9" width="2" height="1"/><rect x="9" y="10" width="1" height="1"/><rect x="12" y="10" width="2" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="13" y="11" width="1" height="1"/></g>
</svg>
```

Check it against the spec block (both sides with CR stripped, because `core.autocrlf=true` checks the spec out with CRLF):

```bash
diff <(sed 's/\r$//' docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-design.md | awk '/^```svg$/{f=1;next} f&&/^```$/{exit} f') <(sed 's/\r$//' public/favicon.svg) && echo "favicon matches spec 4.10.7"
```

Expected: `favicon matches spec 4.10.7`.

- [ ] **Step 4: Write the generator (spec 4.10.1–4.10.6, 11.10, 11.11, 11.21; Appendix A §7.2)**

Full file `scripts/og-image.mjs`:

```js
// Generates public/og.png (1200x630) and the three favicon PNGs. Run by hand: npm run og (spec 4.10).
// Outputs are committed; CI never runs this script, so the build never depends on harfbuzz or wasm (4.10.1).
// The dither band comes from src/field/surface.ts, the module the unit tests pin (Node >= 22.18 strips its types, 4.10.2).
// Text is drawn as glyph outlines (harfbuzzjs), so no system font or fontconfig is involved (4.10.5).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontverter from 'fontverter';
import * as hb from 'harfbuzzjs';
import sharp from 'sharp';
import { tierGrid } from '../src/field/surface.ts';

const W = 1200;
const H = 630;
const CELL = 6; // CSS px per dither cell: 200 x 105 cells (4.10.3)
const COLS = W / CELL;
const ROWS = H / CELL;
const TAU = 12; // flow time in s: the reduced-motion still (4.9 staticTimeS)
// No Shockwave ring: in a still any ring reads as solid white blobs, so the band is the plain field (4.10.3 as amended).
// Dark look (3.2.8, Appendix B §5.2).
const BG = '#050a22';
const TIER_HEX = ['#050a22', '#3b5df0', '#8db0ff', '#e8eeff'];
const NAME_HEX = '#e8eeff';
const TEXT2_HEX = '#7993da';
// Page scrim rule applied to the OG text column: alpha >= 0.86 at the name's end (x 696), clear by x 920 (4.10.4).
const SCRIM_W = 920;
const SCRIM_STOPS = [
  [0, 1],
  [384, 1],
  [704, 0.86],
  [758, 0.7],
  [812, 0.42],
  [866, 0.16],
  [920, 0],
];
const TAGLINE = 'I build AI agents, apps, and the systems behind them.';
const TAGLINE_WRAP_PX = 560;
const FONT_DIR = path.resolve('scripts/fonts-src');

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

async function loadFont(file) {
  const sfnt = await fontverter.convert(await readFile(path.join(FONT_DIR, file)), 'sfnt');
  const face = new hb.Face(new hb.Blob(new Uint8Array(sfnt)), 0);
  return { face, font: new hb.Font(face) };
}

/** Shapes `text` and returns its advance width in px and its glyphs as SVG paths placed at (x, baseline). */
function shapeText({ face, font }, text, sizePx, x, baseline) {
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  hb.shape(font, buf);
  const k = sizePx / face.upem;
  let pen = 0;
  const parts = [];
  for (const g of buf.getGlyphInfosAndPositions()) {
    const d = font.glyphToPath(g.codepoint);
    const gx = x + (pen + (g.xOffset ?? 0)) * k;
    if (d) parts.push(`<path transform="translate(${gx.toFixed(2)} ${baseline}) scale(${k} ${-k})" d="${d}"/>`);
    pen += g.xAdvance ?? 0;
  }
  return { svg: parts.join(''), width: pen * k };
}

/** Greedy word wrap on shaped advance width (4.10.5). */
function wrap(font, text, sizePx, maxPx) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && shapeText(font, next, sizePx, 0, 0).width > maxPx) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 1. Dither band: the shared math, upscaled exactly 6x with nearest-neighbour (4.10.3).
const tiers = tierGrid(COLS, ROWS, CELL, TAU, 1);
const palette = TIER_HEX.map(rgb);
const raster = Buffer.alloc(COLS * ROWS * 4);
for (let i = 0; i < tiers.length; i++) {
  const [r, g, b] = palette[tiers[i]];
  raster[i * 4] = r;
  raster[i * 4 + 1] = g;
  raster[i * 4 + 2] = b;
  raster[i * 4 + 3] = 255;
}
const band = await sharp(raster, { raw: { width: COLS, height: ROWS, channels: 4 } })
  .resize(COLS * CELL, ROWS * CELL, { kernel: 'nearest' })
  .extract({ left: 0, top: 0, width: W, height: H })
  .png()
  .toBuffer();

// 2. Scrim and text as outlines (4.10.4, 4.10.5).
const bold = await loadFont('JetBrainsMono-Bold.woff2');
const regular = await loadFont('JetBrainsMono-Regular.woff2');
const name = shapeText(bold, 'Parsa Naji', 104, 72, 300);
const tagLines = wrap(regular, TAGLINE, 32, TAGLINE_WRAP_PX);
const tag = tagLines.map((line, i) => shapeText(regular, line, 32, 76, 360 + 42 * i));
const domain = shapeText(regular, 'parsanaji.com', 26, 76, 560);
const stops = SCRIM_STOPS.map(
  ([x, a]) => `<stop offset="${(x / SCRIM_W).toFixed(6)}" stop-color="${BG}" stop-opacity="${a}"/>`,
).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>
<rect x="0" y="0" width="${SCRIM_W}" height="${H}" fill="url(#scrim)"/>
<g fill="${NAME_HEX}">${name.svg}</g>
<g fill="${TEXT2_HEX}">${tag.map((t) => t.svg).join('')}${domain.svg}</g>
</svg>`;
await sharp(band).composite([{ input: Buffer.from(svg) }]).png({ compressionLevel: 9 }).toFile('public/og.png');

// 3. Favicon PNGs: the dark variant of public/favicon.svg with the dark fills written directly,
//    because librsvg ignores the media query (4.10.6, 3.2.7).
const faviconSvg = await readFile('public/favicon.svg', 'utf8');
const darkSvg = Buffer.from(
  faviconSvg.replace(/<style>[\s\S]*?<\/style>/, '<style>.edge{fill:#3b5df0}.tile{fill:#050a22}.glyph{fill:#e8eeff}</style>'),
);
const icon = (size) => sharp(darkSvg, { density: (72 * size) / 16 }).resize(size, size);
await icon(32).png().toFile('public/favicon-32.png');
await icon(192).png().toFile('public/favicon-192.png');
await icon(180).flatten({ background: BG }).png().toFile('public/apple-touch-icon.png');

const kb = async (file) => `${((await readFile(file)).length / 1024).toFixed(1)} KB`;
console.log(`public/og.png: ${W}x${H}, ${await kb('public/og.png')}; name ${name.width.toFixed(1)} px wide`);
console.log(`tagline lines: ${tagLines.map((l) => JSON.stringify(l)).join(' / ')}`);
console.log(`public/favicon-32.png ${await kb('public/favicon-32.png')}, public/favicon-192.png ${await kb('public/favicon-192.png')}, public/apple-touch-icon.png ${await kb('public/apple-touch-icon.png')}`);
```

- [ ] **Step 5: Generate the images**

```bash
npm run og; echo "exit $?"
wc -c public/og.png public/favicon-32.png public/favicon-192.png public/apple-touch-icon.png
sha256sum public/og.png public/favicon-32.png public/favicon-192.png public/apple-touch-icon.png
```

Expected (about 1.3 s):

```
> parsanaji.com@0.1.0 og
> node scripts/og-image.mjs

public/og.png: 1200x630, 81.2 KB; name 624.0 px wide
tagline lines: "I build AI agents, apps, and" / "the systems behind them."
public/favicon-32.png 0.2 KB, public/favicon-192.png 1.6 KB, public/apple-touch-icon.png 1.2 KB
exit 0
```

The name is 624 px wide, so it ends at x 696, the scrim's 0.86 stop (4.10.4); the tagline wraps exactly into the two 4.10.5 lines. Sizes 83,139 / 217 / 1,670 / 1,273 bytes. With sharp 0.35.5 on this machine the output is deterministic (a second run gives identical bytes): SHA-256 `og.png` `d6580647f3e3e0d5565b24a907c83671baa8bec642946fad496bba8f76c5e847`, `favicon-32.png` `fa904f518e293abc4fa8f13ae5abb4ea4c862e70994543102ca9e0e7cb9f01e5`, `favicon-192.png` `eae12fd01b33603d7f11fbdb90d293ccf0fc7e39d7ce6ef98c79b8ea262f6901`, `apple-touch-icon.png` `b87c184dfe85bc4a2a7c35b2c3d4fe70ddba6bac0d3a2914abcadad2259e5962`. If a hash differs (another libvips build), record the new value; the dimension and size test is the gate.

- [ ] **Step 6: Visual check (report evidence)**

Open `public/og.png` and `public/favicon-192.png` with the Read tool and record in `task-4-report.md`:
- `og.png`: `Parsa Naji` in Bold near-white top-left (baseline 300), the two tagline lines in `#7993da` under it, `parsanaji.com` lower left (baseline 560), all on solid `#050a22`; right of the text the dither band (blue `#3b5df0` / `#8db0ff` cells) fades in under the scrim, and no Shockwave ring anywhere: the band is the plain field at τ 12, `#3b5df0` and `#8db0ff` cells in Bayer patterns with no field-3 cell (the idle field never reaches 0.9, 3.3.10), so the only `#e8eeff` pixels in the image are the name's glyphs (spec 4.10.3 as amended: no ring, Index amendment A10).
- `favicon-192.png`: a `#3b5df0` rounded edge, a `#050a22` tile and a pixel `PN` in `#e8eeff`.

Save the still for Parsa (he judges the card before the merge):

```bash
mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-4
cp public/og.png .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-4/og.png
sha256sum .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-4/og.png
```

Expected: the same SHA-256 as `public/og.png` in Step 5. Add the line `For Parsa: evidence/task-4/og.png (OG still: name, tagline, domain, plain field band)` to `task-4-report.md`; the controller shows it to him with the slice-1 checkpoint.

Then confirm the pixels numerically:

```bash
node --input-type=module -e "
import sharp from 'sharp';
const px = async (f, x, y) => { const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true }); const i = (y * info.width + x) * info.channels; return Array.from(data.slice(i, i + info.channels)); };
console.log('192 edge', await px('public/favicon-192.png', 2, 96), 'tile', await px('public/favicon-192.png', 96, 24), 'glyph', await px('public/favicon-192.png', 30, 120));
console.log('apple corner', await px('public/apple-touch-icon.png', 0, 0), 'og corner', await px('public/og.png', 10, 10));
"
```

Expected:

```
192 edge [ 59, 93, 240, 255 ] tile [ 5, 10, 34, 255 ] glyph [ 232, 238, 255, 255 ]
apple corner [ 5, 10, 34 ] og corner [ 5, 10, 34, 255 ]
```

- [ ] **Step 7: Run the guard to verify it passes**

Run: `npx vitest run tests/ogAsset.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  6 passed (6)`. CI runs this test on Ubuntu: `package-lock.json` already lists `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64`.

- [ ] **Step 8: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  10 passed (10)`, `Tests  61 passed (61)`; typecheck silent; the build succeeds and copies the new PNGs and SVG into `dist/` (the two Geist notices still print until Task 6).

- [ ] **Step 9: Commit**

```bash
git add scripts/og-image.mjs tests/ogAsset.test.ts public/favicon.svg public/og.png public/favicon-32.png \
  public/favicon-192.png public/apple-touch-icon.png
git commit -m "feat(og): OG image and favicon PNGs from the shared surface math

scripts/og-image.mjs draws the 1200x630 card from src/field/surface.ts (tau 12,
the plain field band), the page scrim rule and harfbuzz glyph outlines in JetBrains
Mono, and renders the dark PN monogram to 32, 192 and 180 px (flattened).
public/favicon.svg becomes the scheme-aware PN monogram.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Markup, head and theme bootstrap

**Files:** Modify `index.html` (full rewrite: head = Appendix C §5 with the two 5.2.1 changes; body = Appendix C §1 with the 3.1.4 changes), `src/content.ts` (full rewrite); Create `public/theme-boot.js` (exactly 4.6.2), `tests/content.test.ts`, `tests/themeBoot.test.ts`.

**Interfaces:**
- Consumes: Task 4 asset paths `/favicon-32.png`, `/favicon-192.png`, `/favicon.svg`, `/apple-touch-icon.png`, `https://parsanaji.com/og.png`; Task 2 font paths `/fonts/JetBrainsMono-Regular.subset.woff2`, `/fonts/JetBrainsMono-Bold.subset.woff2`.
- Produces:
  ```ts
  // src/content.ts
  export const CONTENT: {
    readonly name: 'Parsa Naji'; readonly email: 'info@parsanaji.com'; readonly konamiText: 'nice.';
    readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string }; // linkedin '' until 3.1.12
    readonly clock: { readonly timeZone: 'America/Los_Angeles' };
  };
  ```
- Produces (DOM contract, 4.3.2; every later task finds elements only through these hooks):
  - `<html lang="en">` state: `data-theme` (`light` | `dark`, absent = system) and `data-entry="run"`, both set before first paint by `/theme-boot.js` (storage key `pn.theme`); later states are owned by Tasks 8, 15 and 18.
  - `canvas.field[data-field][aria-hidden="true"]`; `div.scrim[aria-hidden="true"]`; `main.rail[data-rail]`.
  - `[data-reveal]` values 0–7: 0 `header.intro` and the toggle, 1 Experience, 2 Projects, 3 Education, 4 Misc, 5 `nav.links`, 6 `p.status`, 7 `p.place`.
  - `h1.name[data-name]`; `a.lnk[data-link="github"]`; `a.lnk[href="mailto:info@parsanaji.com"][data-email="info@parsanaji.com"]` containing `span.swap > span.swap-main` (`say hi`) and `span.swap-alt` (`copied`); `#email-hint[hidden]`.
  - `p.place[data-reveal="7"]` = `Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span>` (the `<time>` starts empty).
  - `button.theme-toggle[type="button"][data-theme-toggle][data-reveal="0"][hidden]` containing `span.theme-word[data-theme-word]` (empty); no `aria-label`, no `aria-pressed` in the HTML.
  - `dialog.keys[data-keys][aria-labelledby="keys-title"][closedby="any"]` with the `[data-key="linkedin"][hidden]` row and `button[data-keys-close]`.
  - `p.sr-only[data-live][role="status"][aria-live="polite"][aria-atomic="true"]`, present and empty.
  - `<script src="/theme-boot.js"></script>` directly after the viewport meta and before the stylesheet link; `<script type="module" src="/src/main.ts"></script>` last in `<body>`; the LinkedIn `<li>` stays an HTML comment.

- [ ] **Step 1: Write the failing tests**

Full file `tests/content.test.ts` (spec 8.1.12, 3.1.3–3.1.5, 3.1.12, 4.3.2, 5.2). It strips HTML comments before the "no LinkedIn element" checks, because the parked LinkedIn `<li>` lives in a comment, and it builds the expected `sameAs` from `CONTENT`, so the one-commit LinkedIn recipe of 3.1.12 (Task 24) keeps the suite green without touching this test:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';

// index.html is the source of every visible string (spec 3.1.3-3.1.5); CONTENT is the JS copy (4.3).
const HTML = readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const LIVE = HTML.replace(/<!--[\s\S]*?-->/g, ''); // markup without HTML comments (the parked LinkedIn <li>)
const head = LIVE.slice(LIVE.indexOf('<head>'), LIVE.indexOf('</head>'));
const body = LIVE.slice(LIVE.indexOf('<body>'), LIVE.indexOf('</body>'));

const textOf = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const all = (re: RegExp, s: string): string[] => [...s.matchAll(re)].map((m) => m[1]);

const ld = JSON.parse(all(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, LIVE)[0]) as Record<string, unknown>;

describe('index.html copy (3.1.3)', () => {
  it('has the name, tagline and eyebrows in order', () => {
    expect(body).toContain('<h1 class="name" data-name>Parsa Naji</h1>');
    expect(body).toContain('<p class="tagline">I build AI agents, apps, and the systems behind them.</p>');
    expect(all(/<h2 class="eyebrow" id="h-\w+">([^<]+)<\/h2>/g, body)).toEqual(['Experience', 'Projects', 'Education', 'Misc']);
  });

  it('has every row, in order, with the sr-only date phrases', () => {
    expect(all(/<li class="row">([\s\S]*?)<\/li>/g, body).map(textOf)).toEqual([
      '2025 — to present Software Developer Koreex Systems',
      '2026 — to present AI Specialist / Developer Expedient Labs',
      '2025 Calculus Tutor Saddleback College',
      'parsanaji.com This site. WebGL2 dither field.',
      'SolScope Microcap cryptocurrency tracker.',
      'Kaptur Business expense tracker for trades.',
      'Mafia Family and friends game.',
      '2025 — to 2026 Saddleback College Business Administration',
    ]);
  });

  it('has the seven misc tags in order, with & written &amp;', () => {
    const tags = body.slice(body.indexOf('<ul class="tags"'), body.indexOf('</ul>', body.indexOf('<ul class="tags"')));
    expect(all(/<li>([^<]+)<\/li>/g, tags)).toEqual([
      'Agentic Workflows',
      'Multi-Agent Orchestration',
      'Prompt &amp; Context Engineering',
      'LLM Cost and Token Optimization',
      'WebGL &amp; shaders',
      'iOS/macOS',
      'Swift',
    ]);
    expect(HTML).not.toMatch(/&(?!amp;|#)/);
  });

  it('has the links, status, footer, hint, live region and overlay copy', () => {
    expect(body).toContain('<a class="lnk" href="https://github.com/parsanaji" rel="me" data-link="github">github</a>');
    expect(body).toContain(
      '<a class="lnk" href="mailto:info@parsanaji.com" data-email="info@parsanaji.com"><span class="swap"><span class="swap-main">say hi</span><span class="swap-alt">copied</span></span></a>',
    );
    expect(body).toContain('<span id="email-hint" hidden>Copies info@parsanaji.com to the clipboard.</span>');
    expect(body).toContain('<p class="status" data-reveal="6"><span class="dot" aria-hidden="true"></span>Building something new</p>');
    expect(body).toContain('<p class="place" data-reveal="7">Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span></p>');
    expect(body).toContain('<p class="sr-only" data-live role="status" aria-live="polite" aria-atomic="true"></p>');
    expect(body).toContain('<dialog class="keys" data-keys aria-labelledby="keys-title" closedby="any">');
    expect(body).toContain('<h2 class="eyebrow" id="keys-title">Shortcuts</h2>');
    expect(all(/<dd>([^<]+)<\/dd>/g, body)).toEqual(['GitHub', 'LinkedIn', 'Copy email', 'Show or hide this list', 'Close']);
    expect(body).toContain('<div data-key="linkedin" hidden>');
    expect(body).toContain('<button class="lnk keys-close" type="button" data-keys-close>close</button>');
  });
});

describe('index.html DOM contract (4.3.2, 3.1.4)', () => {
  it('has the canvas, scrim and rail hooks', () => {
    expect(body).toContain('<canvas class="field" data-field aria-hidden="true"></canvas>');
    expect(body).toContain('<div class="scrim" aria-hidden="true"></div>');
    expect(body).toContain('<main class="rail" data-rail>');
  });

  it('has the toggle as the last child of main: data-reveal 0, hidden, no aria-label, no aria-pressed', () => {
    expect(body).toMatch(
      /<button class="theme-toggle" type="button" data-theme-toggle data-reveal="0" hidden><span class="theme-word" data-theme-word><\/span><\/button>\n {2}<\/main>/,
    );
    expect(HTML).not.toContain('aria-pressed');
    expect(body.slice(body.indexOf('<button class="theme-toggle"'))).not.toMatch(/^<button[^>]*aria-label/);
  });

  it('uses data-reveal values 0 to 7 exactly (0 = intro and toggle)', () => {
    const values = all(/data-reveal="(\d+)"/g, body).map(Number);
    expect(values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0]);
  });

  it('has no LinkedIn element while CONTENT.links.linkedin is empty, and the link when it is set (3.1.12)', () => {
    if (CONTENT.links.linkedin) {
      expect(body).toContain(`<a class="lnk" href="${CONTENT.links.linkedin}" rel="me" data-link="linkedin">linkedin</a>`);
    } else {
      expect(LIVE).not.toContain('data-link="linkedin"');
      expect(HTML).toContain('data-link="linkedin"'); // the parked <li> survives as an HTML comment
    }
  });

  it('keeps the HTML values equal to CONTENT', () => {
    expect(body).toContain(`<h1 class="name" data-name>${CONTENT.name}</h1>`);
    expect(body).toContain(`href="mailto:${CONTENT.email}" data-email="${CONTENT.email}"`);
    expect(body).toContain(`href="${CONTENT.links.github}" rel="me" data-link="github"`);
    expect(ld.name).toBe(CONTENT.name);
    expect(CONTENT.konamiText).toBe('nice.');
    expect(CONTENT.clock.timeZone).toBe('America/Los_Angeles');
  });
});

describe('index.html head and CSP rules (5.2, 4.6.1, 4.6.2)', () => {
  it('loads theme-boot.js as a classic script right after the viewport meta, before the stylesheet', () => {
    expect(head).toMatch(
      /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n {2}<script src="\/theme-boot.js"><\/script>\n/,
    );
    expect(head.indexOf('<script src="/theme-boot.js">')).toBeLessThan(head.indexOf('<link rel="stylesheet" href="/src/styles.css">'));
  });

  it('has exactly two script files and the module entry last in body', () => {
    expect(all(/<script[^>]*\ssrc="([^"]+)"/g, LIVE)).toEqual(['/theme-boot.js', '/src/main.ts']);
    expect(body.trimEnd().endsWith('<script type="module" src="/src/main.ts"></script>')).toBe(true);
  });

  it('has no inline script other than the JSON-LD data block, no <style> and no style attribute', () => {
    const inline = [...LIVE.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => m[2].trim() !== '');
    expect(inline.map((m) => m[1].trim())).toEqual(['type="application/ld+json"']);
    expect(LIVE).not.toMatch(/<style[\s>]/);
    expect(LIVE).not.toMatch(/\sstyle\s*=/);
  });

  it('has the JSON-LD of 5.2.1 with no email key', () => {
    expect(ld).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Parsa Naji',
      url: 'https://parsanaji.com/',
      jobTitle: ['Software Developer', 'AI Specialist / Developer'],
      sameAs: [CONTENT.links.github, ...(CONTENT.links.linkedin ? [CONTENT.links.linkedin] : [])],
    });
    expect(ld).not.toHaveProperty('email');
  });

  it('has the 5.2.2 metadata', () => {
    const tagline = 'I build AI agents, apps, and the systems behind them.';
    const alt = 'Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.';
    for (const tag of [
      '<html lang="en">',
      '<title>Parsa Naji</title>',
      `<meta name="description" content="${tagline}">`,
      '<meta name="author" content="Parsa Naji">',
      '<meta name="color-scheme" content="light dark">',
      '<meta name="theme-color" content="#f2f6fe" media="(prefers-color-scheme: light)">',
      '<meta name="theme-color" content="#050a22" media="(prefers-color-scheme: dark)">',
      '<link rel="canonical" href="https://parsanaji.com/">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="Parsa Naji">',
      '<meta property="og:title" content="Parsa Naji">',
      `<meta property="og:description" content="${tagline}">`,
      '<meta property="og:url" content="https://parsanaji.com/">',
      '<meta property="og:image" content="https://parsanaji.com/og.png">',
      '<meta property="og:image:type" content="image/png">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      `<meta property="og:image:alt" content="${alt}">`,
      '<meta property="og:locale" content="en_US">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="Parsa Naji">',
      `<meta name="twitter:description" content="${tagline}">`,
      '<meta name="twitter:image" content="https://parsanaji.com/og.png">',
      `<meta name="twitter:image:alt" content="${alt}">`,
      '<link rel="preload" href="/fonts/JetBrainsMono-Regular.subset.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="preload" href="/fonts/JetBrainsMono-Bold.subset.woff2" as="font" type="font/woff2" crossorigin>',
    ]) {
      expect(LIVE).toContain(tag);
    }
  });

  it('lists the PNG icons first and the SVG as the last rel="icon" (5.2.2)', () => {
    expect(all(/<link rel="icon" href="([^"]+)"/g, head)).toEqual(['/favicon-32.png', '/favicon-192.png', '/favicon.svg']);
  });
});
```

Full file `tests/themeBoot.test.ts` (spec 8.1.11; runs the real file in `node:vm` with fakes):

```ts
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// public/theme-boot.js runs before first paint as a classic script (spec 4.6.2, 8.1.11).
const SOURCE = readFileSync('public/theme-boot.js', 'utf8').replace(/\r\n/g, '\n');

interface BootEnv {
  stored?: string | null;
  storageThrows?: boolean;
  reduced?: boolean;
  forced?: boolean;
  matchMediaThrows?: boolean;
  search?: string;
}

function boot(env: BootEnv = {}): Map<string, string> {
  const attrs = new Map<string, string>();
  const documentElement = {
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
  };
  const localStorage = {
    getItem: (key: string): string | null => {
      if (env.storageThrows) throw new Error('SecurityError');
      return key === 'pn.theme' ? (env.stored ?? null) : null;
    },
  };
  const matchMedia = (query: string): { matches: boolean } => {
    if (env.matchMediaThrows) throw new Error('no matchMedia');
    if (query === '(prefers-reduced-motion: reduce)') return { matches: env.reduced ?? false };
    if (query === '(forced-colors: active)') return { matches: env.forced ?? false };
    throw new Error(`unexpected query ${query}`);
  };
  runInNewContext(SOURCE, {
    document: { documentElement },
    localStorage,
    window: { matchMedia },
    location: { search: env.search ?? '' },
  });
  return attrs;
}

describe('theme-boot.js', () => {
  it('applies a stored light look and arms the entry', () => {
    const attrs = boot({ stored: 'light' });
    expect(attrs.get('data-theme')).toBe('light');
    expect(attrs.get('data-entry')).toBe('run');
  });

  it('applies a stored dark look', () => {
    expect(boot({ stored: 'dark' }).get('data-theme')).toBe('dark');
  });

  it('ignores garbage and a missing key (the OS decides)', () => {
    expect(boot({ stored: 'sepia' }).has('data-theme')).toBe(false);
    expect(boot({ stored: null }).has('data-theme')).toBe(false);
    expect(boot({ stored: 'sepia' }).get('data-entry')).toBe('run');
  });

  it('never arms the entry under reduced motion (3.4.10)', () => {
    expect(boot({ reduced: true }).has('data-entry')).toBe(false);
  });

  it('never arms the entry under forced colours (11.14)', () => {
    expect(boot({ forced: true }).has('data-entry')).toBe(false);
  });

  it('never arms the entry with ?noentry', () => {
    expect(boot({ search: '?noentry' }).has('data-entry')).toBe(false);
    expect(boot({ search: '?seed=3&noentry' }).has('data-entry')).toBe(false);
    expect(boot({ search: '?noentryx' }).get('data-entry')).toBe('run');
  });

  it('survives a throwing localStorage and a throwing matchMedia', () => {
    let attrs = new Map<string, string>();
    expect(() => {
      attrs = boot({ storageThrows: true });
    }).not.toThrow();
    expect(attrs.has('data-theme')).toBe(false);
    expect(attrs.get('data-entry')).toBe('run');
    expect(() => boot({ matchMediaThrows: true, stored: 'dark' })).not.toThrow();
    expect(boot({ matchMediaThrows: true, stored: 'dark' }).get('data-theme')).toBe('dark');
  });

  it('is small, uses no innerHTML or eval, and reads only the pn.theme key', () => {
    expect(SOURCE.length).toBeLessThan(500);
    expect(SOURCE).not.toMatch(/innerHTML|eval\(/);
    expect(SOURCE).toContain("localStorage.getItem('pn.theme')");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/content.test.ts tests/themeBoot.test.ts`

Expected: FAIL, `Test Files  2 failed (2)`. `tests/themeBoot.test.ts` fails to load with `Error: ENOENT: no such file or directory, open '…\public\theme-boot.js'`; `tests/content.test.ts` reports `Tests  14 failed | 1 passed (15)` against the teaser page (for example `expected '<body>\n    <h1 class="sr-only">Parsa…' to contain '<h1 class="name" data-name>Parsa Naji…'`; only the "no inline script other than the JSON-LD" case already holds).

- [ ] **Step 3: Write the bootstrap (spec 4.6.2, 3.4.10, 11.14)**

Full file `public/theme-boot.js`, exactly 4.6.2 (ten lines, 479 bytes with LF):

```js
(function () {
  var d = document.documentElement, t = null, rm = false, fc = false;
  try { t = localStorage.getItem('pn.theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  try {
    rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fc = window.matchMedia('(forced-colors: active)').matches;
  } catch (e) {}
  if (!rm && !fc && !/[?&]noentry\b/.test(location.search)) d.setAttribute('data-entry', 'run');
})();
```

Check it against the spec block:

```bash
diff <(sed 's/\r$//' docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-design.md | awk '/^- \*\*4\.6\.2/{f=1} f&&/^```js$/{g=1;next} g&&/^```$/{exit} g') <(sed 's/\r$//' public/theme-boot.js) && echo "theme-boot matches spec 4.6.2"
```

Expected: `theme-boot matches spec 4.6.2`.

- [ ] **Step 4: Rewrite the content constants (spec 4.3)**

Full file `src/content.ts` (the explicit type keeps `linkedin` a `string`, so `if (CONTENT.links.linkedin)` stays meaningful to TypeScript):

```ts
/**
 * The JS copy of the facts the scripts need (spec 4.3). index.html stays the source of every visible string;
 * tests/content.test.ts keeps the two equal. LinkedIn stays '' until Parsa gives the URL (3.1.12).
 */
export const CONTENT: {
  readonly name: 'Parsa Naji';
  readonly email: 'info@parsanaji.com';
  readonly konamiText: 'nice.';
  readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string };
  readonly clock: { readonly timeZone: 'America/Los_Angeles' };
} = {
  name: 'Parsa Naji',
  email: 'info@parsanaji.com',
  konamiText: 'nice.',
  links: { github: 'https://github.com/parsanaji', linkedin: '' },
  clock: { timeZone: 'America/Los_Angeles' },
};
```

- [ ] **Step 5: Rewrite the page (spec 2.1.1, 2.2.5, 3.1.2–3.1.6, 3.2.9, 3.5.3, 3.5.5, 3.5.12, 4.6.2, 5.1.1, 5.1.2, 5.2.1–5.2.5, 11.13, 11.22, 11.23)**

Head = Appendix C §5 with the two 5.2.1 changes (`theme-boot.js` after the viewport meta; no `email` in the JSON-LD). Body = Appendix C §1 with the 3.1.4 changes (project row 1 text, the footer `<time>`, the word toggle with `data-reveal="0"`, the LinkedIn `<li>` kept as a comment). Full file `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script src="/theme-boot.js"></script>
  <title>Parsa Naji</title>
  <meta name="description" content="I build AI agents, apps, and the systems behind them.">
  <meta name="author" content="Parsa Naji">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f2f6fe" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#050a22" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="https://parsanaji.com/">

  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Parsa Naji">
  <meta property="og:title" content="Parsa Naji">
  <meta property="og:description" content="I build AI agents, apps, and the systems behind them.">
  <meta property="og:url" content="https://parsanaji.com/">
  <meta property="og:image" content="https://parsanaji.com/og.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Parsa Naji">
  <meta name="twitter:description" content="I build AI agents, apps, and the systems behind them.">
  <meta name="twitter:image" content="https://parsanaji.com/og.png">
  <meta name="twitter:image:alt" content="Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.">

  <link rel="preload" href="/fonts/JetBrainsMono-Regular.subset.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/JetBrainsMono-Bold.subset.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/src/styles.css">

  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Person","name":"Parsa Naji","url":"https://parsanaji.com/","jobTitle":["Software Developer","AI Specialist / Developer"],"sameAs":["https://github.com/parsanaji"]}
  </script>
</head>
<body>
  <canvas class="field" data-field aria-hidden="true"></canvas>
  <div class="scrim" aria-hidden="true"></div>

  <main class="rail" data-rail>
    <header class="intro" data-reveal="0">
      <h1 class="name" data-name>Parsa Naji</h1>
      <p class="tagline">I build AI agents, apps, and the systems behind them.</p>
    </header>

    <section class="block block--exp" aria-labelledby="h-exp" data-reveal="1">
      <h2 class="eyebrow" id="h-exp">Experience</h2>
      <ul class="rows" role="list">
        <li class="row"><span class="when">2025 <span aria-hidden="true">—</span><span class="sr-only">to present</span></span><span class="what">Software Developer <span class="sub">Koreex Systems</span></span></li>
        <li class="row"><span class="when">2026 <span aria-hidden="true">—</span><span class="sr-only">to present</span></span><span class="what">AI Specialist / Developer <span class="sub">Expedient Labs</span></span></li>
        <li class="row"><span class="when">2025</span><span class="what">Calculus Tutor <span class="sub">Saddleback College</span></span></li>
      </ul>
    </section>

    <section class="block block--proj" aria-labelledby="h-proj" data-reveal="2">
      <h2 class="eyebrow" id="h-proj">Projects</h2>
      <ul class="rows rows--compact" role="list">
        <li class="row"><span class="what"><span class="pname">parsanaji.com</span> <span class="sub">This site. WebGL2 dither field.</span></span></li>
        <li class="row"><span class="what"><span class="pname">SolScope</span> <span class="sub">Microcap cryptocurrency tracker.</span></span></li>
        <li class="row"><span class="what"><span class="pname">Kaptur</span> <span class="sub">Business expense tracker for trades.</span></span></li>
        <li class="row"><span class="what"><span class="pname">Mafia</span> <span class="sub">Family and friends game.</span></span></li>
      </ul>
    </section>

    <section class="block block--edu" aria-labelledby="h-edu" data-reveal="3">
      <h2 class="eyebrow" id="h-edu">Education</h2>
      <ul class="rows" role="list">
        <li class="row"><span class="when">2025 <span aria-hidden="true">—</span><span class="sr-only">to</span> 2026</span><span class="what">Saddleback College <span class="sub">Business Administration</span></span></li>
      </ul>
    </section>

    <section class="block block--misc" aria-labelledby="h-misc" data-reveal="4">
      <h2 class="eyebrow" id="h-misc">Misc</h2>
      <ul class="tags" role="list">
        <li>Agentic Workflows</li>
        <li>Multi-Agent Orchestration</li>
        <li>Prompt &amp; Context Engineering</li>
        <li>LLM Cost and Token Optimization</li>
        <li>WebGL &amp; shaders</li>
        <li>iOS/macOS</li>
        <li>Swift</li>
      </ul>
    </section>

    <nav class="links" aria-label="Contact" data-reveal="5">
      <ul role="list">
        <li><a class="lnk" href="https://github.com/parsanaji" rel="me" data-link="github">github</a></li>
        <!-- emitted only when content.links.linkedin is non-empty (never a dead link):
        <li><a class="lnk" href="{links.linkedin}" rel="me" data-link="linkedin">linkedin</a></li> -->
        <li><a class="lnk" href="mailto:info@parsanaji.com" data-email="info@parsanaji.com"><span class="swap"><span class="swap-main">say hi</span><span class="swap-alt">copied</span></span></a></li>
      </ul>
      <span id="email-hint" hidden>Copies info@parsanaji.com to the clipboard.</span>
    </nav>

    <p class="status" data-reveal="6"><span class="dot" aria-hidden="true"></span>Building something new</p>

    <p class="place" data-reveal="7">Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span></p>

    <button class="theme-toggle" type="button" data-theme-toggle data-reveal="0" hidden><span class="theme-word" data-theme-word></span></button>
  </main>

  <dialog class="keys" data-keys aria-labelledby="keys-title" closedby="any">
    <h2 class="eyebrow" id="keys-title">Shortcuts</h2>
    <dl class="keys-list">
      <div><dt><kbd>g</kbd></dt><dd>GitHub</dd></div>
      <div data-key="linkedin" hidden><dt><kbd>l</kbd></dt><dd>LinkedIn</dd></div>
      <div><dt><kbd>e</kbd></dt><dd>Copy email</dd></div>
      <div><dt><kbd>?</kbd></dt><dd>Show or hide this list</dd></div>
      <div><dt><kbd>esc</kbd></dt><dd>Close</dd></div>
    </dl>
    <button class="lnk keys-close" type="button" data-keys-close>close</button>
  </dialog>

  <p class="sr-only" data-live role="status" aria-live="polite" aria-atomic="true"></p>

  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/content.test.ts tests/themeBoot.test.ts`

Expected: PASS, `Test Files  2 passed (2)`, `Tests  23 passed (23)` (content 15, themeBoot 8).

- [ ] **Step 7: Full gate, and check how Vite treats the classic script**

```bash
npm test
npm run typecheck
npm run build
grep -n "<script" dist/index.html
ls dist/theme-boot.js
```

Expected: `Test Files  12 passed (12)`, `Tests  84 passed (84)`; typecheck silent; the build succeeds with no warning about `theme-boot.js` (`dist/index.html 7.24 kB │ gzip: 2.09 kB`; the two Geist notices still print until Task 6). The grep shows the classic script untouched at line 6, the JSON-LD block, and Vite's hashed module entry moved into the head (Vite's normal placement; module scripts are deferred, so the order relative to `theme-boot.js` is unchanged):

```
6:  <script src="/theme-boot.js"></script>
40:  <script type="application/ld+json">
43:  <script type="module" crossorigin src="/assets/index-….js"></script>
```

`dist/theme-boot.js` exists (copied from `public/`). No browser evidence in this task: the page is unstyled until Task 6, and `main.ts` is still the Task 1 interim.

- [ ] **Step 8: Commit**

```bash
git add index.html src/content.ts public/theme-boot.js tests/content.test.ts tests/themeBoot.test.ts
git commit -m "feat(page): résumé markup, head and the pre-paint theme bootstrap

index.html becomes the one-screen résumé (Appendix C §1 with spec 3.1.4) with the
5.2 head: theme-color pair, PNG and SVG icons, OG/Twitter, JetBrains Mono preloads
and the email-free JSON-LD. public/theme-boot.js applies the stored look and the
entry pre-hide before first paint under the strict CSP. CONTENT is the JS copy.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
