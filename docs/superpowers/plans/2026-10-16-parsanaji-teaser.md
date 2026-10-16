# parsanaji.com Teaser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship parsanaji.com as a one-screen teaser: `PARSA NAJI` drawn in vibrating GPU particles that flee the pointer and morph to `soon.` on click, with a quiet exit line and a live clock, deployed on Cloudflare Pages with `info@parsanaji.com` routed to iCloud.

**Architecture:** A Vite + vanilla TypeScript site with no UI framework. A canvas sampler turns text into exactly `N` points; a Three.js `Points` object with a custom GLSL3 vertex shader does every motion (entry convergence, simplex vibration, breath, ripple, pointer repel with a decaying trail, phase-based morph) on the GPU in one draw call, while pure, unit-tested TypeScript modules (`MorphMachine`, `PointerModel`, `RippleScheduler`, `FpsProbe`, sampler math) decide what the uniforms say each frame. Infrastructure is scripted against the Cloudflare REST API and wrangler; GitHub Actions deploys on every push.

**Tech Stack:** Vite 8.3.4, TypeScript 5.9.3, three 0.186.1 + @types/three 0.186.0, Vitest 5.0.5, lil-gui 0.21.0 (dev), geist 1.7.2 + subset-font 2.9.0 (dev, fonts), sharp 0.35.5 (dev, images), wrangler 4.151.0 (dev), Cloudflare Pages + DNS + Email Routing, GitHub Actions. Node 24.19 locally, Node 22 in CI.

**Spec:** `docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md` (read it first; this plan argues from it and uses its section numbers).

## Global Constraints

- Repo: `C:\Users\parsa\parsanaji.com`, branch `main`, git identity already set locally (`Parsa Naji` / `238802691+parsanaji@users.noreply.github.com`). Shell for commands below is Git Bash (`/c/Users/parsa/parsanaji.com`). Commit after every task; end commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Exact dependency versions (install with `--save-exact`): `three@0.186.1`; dev: `vite@8.3.4 typescript@5.9.3 @types/three@0.186.0 @types/node@22 vitest@5.0.5 lil-gui@0.21.0 geist@1.7.2 subset-font@2.9.0 sharp@0.35.5 wrangler@4.151.0`. TypeScript 7 is not used. No other runtime dependencies without a reason written in the commit.
- Copy, verbatim: name `PARSA NAJI`; alt `soon.`; exit line `building something new · github · linkedin · say hi`; clock `IRVINE HH:MM PDT` (24-hour, `America/Los_Angeles`); title `Parsa Naji`; description `Building something new.`; email `info@parsanaji.com`; GitHub `https://github.com/parsanaji`; LinkedIn hidden until a URL exists.
- Colors: background `#070707`, vignette center `#0e0e0e`, dots and text `#f5f5f5`, muted text `rgba(245,245,245,0.5)` (spec 3.2 said 0.45; raised to 0.5 so 12 px text clears the 4.5:1 contrast audit at about 4.95:1). Fonts: Geist Sans 900 (display), Geist Mono 400 (UI), self-hosted subsets under `public/fonts/`. No other colors, no gradients beyond the vignette, no icons.
- No inline `<script>` (other than the JSON-LD data block) and no inline `<style>` or `style=""` attributes anywhere in `index.html`; the production CSP in `public/_headers` has no `'unsafe-inline'`. Set element styles only through the CSSOM (`el.style.translate = …`) from TypeScript.
- Production bundle: no `lil-gui`, no source maps, total JS <= 180 KB gzip, fonts <= 40 KB total, one WebGL draw call, DPR capped at 2, `requestAnimationFrame` paused while the tab is hidden, zero console errors or warnings.
- Motion defaults are the spec's numbers (3.5) and live only in `src/engine/defaults.ts`; every module receives them as parameters. Nothing in the engine reads `DEFAULTS` directly except `main.ts`.
- Coordinates: 1 world unit = 1 CSS px, origin at the viewport center, y up (spec 3.4). Pointer events convert with `x = clientX - vw / 2`, `y = vh / 2 - clientY`.
- Unit tests run in Node with no DOM. Anything that needs a canvas, font, or WebGL is verified in the browser with the Chrome DevTools MCP tools (`mcp__plugin_ecc_chrome-devtools__*`) and recorded in the task's verification step.
- Operator steps (spec 7.6) are Parsa's: GitHub CLI login, the Cloudflare API token in `.env`, the email verification click, the analytics toggle, the iPhone check. A task that needs one and finds it missing stops and reports; it does not improvise credentials.
- GitHub CLI: `gh` 2.102.0 is installed at `C:\Program Files\GitHub CLI\gh.exe` and logged in as `parsanaji` (operator step 1 done 2026-10-16). Builder shells may not have it on PATH: start every command block that calls `gh` with `export PATH="$PATH:/c/Program Files/GitHub CLI"`. The GitHub handle is `parsanaji` (renamed from `parsanaji9-eng`).

## Review Focus

Spec-implied inputs no task's tests covered on the first pass. Each line now has its test in the owning task.

1. **Display font never loads** (offline cache miss, blocked font request): the page must still render the name from the fallback font stack after 2 s rather than hang on a black screen. Test in Task 14 (`waitForFont` resolves `'timeout'` when `fonts.load` never settles).
2. **Hidden tab for minutes, then shown**: one giant frame delta must not sprint the morph through all phases or fire the auto-tease instantly. Tests in Task 9 (`clampDt` caps a 60 000 ms delta at 50 ms) and Task 19 (a clamped sequence advances the `MorphMachine` by real frames only).
3. **Pointer leaves the window while pressed, or a touch is cancelled**: without a release the last repel position would haunt the field forever. Test in Task 16 (`release` then `parkMs` makes the model inactive with all slot strengths 0).
4. **Extreme viewports**: 320×480 phone (stacked), 2560×1080 ultrawide and 1024×200 letterbox (height cap) must all give a positive font size and a block no taller than 40 % of the viewport. Tests in Task 11.
5. **Canvas `letterSpacing` unsupported** (older Safari): the sampler must fall back to per-glyph drawing and still produce the same number of glyphs. Test in Task 11 (fake context without `letterSpacing` records one `fillText` per non-space character).

## Execution Notes (Parsa's instructions)

- Builders are **Claude Opus 5.5** subagents (`model: "opus"`); the orchestrator (Fable 5.1) dispatches, reviews and checkpoints but writes no product code. One builder at a time: the tasks share interfaces and each depends on the previous commit.
- Effort: `high` for every task, `xhigh` for Task 12 (shaders + `ParticleField`), Task 14 (boot + frame loop) and Task 23 (Lighthouse and performance), where mistakes are the most expensive to find later.
- Checkpoints: after Task 8 (slice 1, site live) and after Task 18 (slice 3) the orchestrator updates the vault note `Projects/parsanaji.com.md` and the memory file, then compacts (`/strategic-compact`) before continuing. The plan's checkboxes are the resumable state.
- Each slice ends with a deploy Parsa can open: production after slice 1 (`https://parsanaji.com`), then `npm run deploy:preview` (`https://preview.parsanaji-com.pages.dev`) after slices 2, 3 and 4, and production again after slice 5.

## File Structure

See spec 4.2 for the full tree. Responsibilities, one line each:

- `index.html` — all markup. Final in Task 3; later tasks never edit it.
- `src/styles.css` — all CSS. Final in Task 3.
- `src/content.ts` — strings and links. Final in Task 3.
- `src/main.ts` — boot sequence only (chrome, WebGL probe, font wait, `App`, debug-panel gate). Written in Task 3 (static), rewritten in Task 14, last edited in Task 22 (`?og` flag).
- `src/app.ts` — `App`: owns sampling, the field, the frame loop and wiring. Written in Task 14, extended in Tasks 17, 20, 21, 22.
- `src/engine/*` — pure logic plus the one Three.js class. Each file owns one concept; each pure file has a test file of the same name under `tests/`.
- `src/boot/*` — two tiny environment probes, testable.
- `src/ui/*` — DOM glue for chrome: clock, exit line, cursor ring.
- `src/tweaks.ts` — dev-only lil-gui panel.
- `scripts/*.mjs` — fonts, OG images, Cloudflare setup. Plain Node, run with `node scripts/<name>.mjs`.
- `tests/*` — Vitest, Node environment, `tests/helpers/fakeCanvas.ts` for the sampler.

---
## Slice 1 — Scaffold and go live

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/vite-env.d.ts`
- Test: `tests/env.test.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `fonts`, `og:placeholder`, `og`, `deploy`, `deploy:preview` used by every later task.

- [ ] **Step 1: Initialize npm and install exact versions**

```bash
cd /c/Users/parsa/parsanaji.com
npm init -y >/dev/null
npm install --save-exact three@0.186.1
npm install --save-exact --save-dev vite@8.3.4 typescript@5.9.3 @types/three@0.186.0 @types/node@22 vitest@5.0.5 lil-gui@0.21.0 geist@1.7.2 subset-font@2.9.0 sharp@0.35.5 wrangler@4.151.0
```

Expected: `package-lock.json` created; `node_modules/three/package.json` shows `"version": "0.186.1"`; `@types/node` resolved to the newest 22.x (the tests reference `process`, and `tsc` needs its types).

- [ ] **Step 2: Replace `package.json` with the project manifest** (keep the `dependencies` / `devDependencies` blocks npm just wrote; replace everything else)

```json
{
  "name": "parsanaji.com",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "vite --host",
    "build": "tsc --noEmit -p tsconfig.json && vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "fonts": "node scripts/subset-fonts.mjs",
    "og:placeholder": "node scripts/og-placeholder.mjs",
    "og": "node scripts/og-image.mjs",
    "deploy": "npm run build && wrangler pages deploy dist --project-name parsanaji-com --branch main --commit-dirty=true",
    "deploy:preview": "npm run build && wrangler pages deploy dist --project-name parsanaji-com --branch preview --commit-dirty=true"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Write `vite.config.ts`, `vitest.config.ts`, `src/vite-env.d.ts`**

`vite.config.ts`:
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

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Write `.gitignore` and `.env.example`**

`.gitignore`:
```
node_modules
dist
.env
.wrangler
*.log
.DS_Store
Thumbs.db
```

`.env.example`:
```
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
```

- [ ] **Step 6: Write the environment test** (`tests/env.test.ts`) — the clock relies on full ICU and the scripts on `fetch` and `process.loadEnvFile`

```ts
import { describe, expect, it } from 'vitest';

describe('runtime environment', () => {
  it('runs on Node 22.12 or newer', () => {
    const [major, minor] = process.versions.node.split('.').map(Number);
    expect(major > 22 || (major === 22 && minor >= 12)).toBe(true);
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

- [ ] **Step 7: Run the toolchain**

Run: `npm test && npm run typecheck`
Expected: 3 tests pass; `tsc` prints nothing.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts .gitignore .env.example src/vite-env.d.ts tests/env.test.ts
git commit -m "chore: scaffold Vite + TypeScript + Vitest toolchain

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Font subsets

**Files:**
- Create: `scripts/subset-fonts.mjs`
- Create (generated, committed): `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2`

**Interfaces:**
- Produces: the two font URLs `/fonts/GeistSans-Black.subset.woff2` and `/fonts/GeistMono-Regular.subset.woff2` referenced by `src/styles.css` and `index.html` (Task 3). Display subset covers `A–Z a–z . space`; mono subset covers printable ASCII plus `·` (U+00B7).

- [ ] **Step 1: Write `scripts/subset-fonts.mjs`**

```js
// Generates the two self-hosted font subsets from the `geist` npm package.
// Run: node scripts/subset-fonts.mjs   (also: npm run fonts)
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

const geistRoot = path.resolve('node_modules/geist');
const outDir = path.resolve('public/fonts');

const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const DISPLAY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. ';
const MONO_CHARS = `${ASCII}·`;

const jobs = [
  { src: 'dist/fonts/geist-sans/Geist-Black.woff2', out: 'GeistSans-Black.subset.woff2', text: DISPLAY_CHARS },
  { src: 'dist/fonts/geist-mono/GeistMono-Regular.woff2', out: 'GeistMono-Regular.subset.woff2', text: MONO_CHARS },
];

await mkdir(outDir, { recursive: true });
let total = 0;
for (const job of jobs) {
  const input = await readFile(path.join(geistRoot, job.src));
  const output = await subsetFont(input, job.text, { targetFormat: 'woff2' });
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

- [ ] **Step 2: Run it**

Run: `npm run fonts`
Expected: two files written, each well under 20 KB, `total:` under 40 KB, exit 0. If `subset-font` rejects the `.woff2` input, switch both `src` paths to the sibling `.ttf` files (`Geist-Black.ttf`, `GeistMono-Regular.ttf`, same folders) and rerun.

- [ ] **Step 3: Confirm the files exist**

Run: `ls -la public/fonts`
Expected: both `.subset.woff2` files listed with non-zero sizes.

- [ ] **Step 4: Commit**

```bash
git add scripts/subset-fonts.mjs public/fonts
git commit -m "feat: self-hosted Geist Sans 900 and Geist Mono subsets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Static page (markup, styles, chrome, headers, favicon, placeholder OG)

This page is what parsanaji.com serves after slice 1: the name in Geist 900, the exit line, the live clock. Later slices only swap the static block for the canvas.

**Files:**
- Create: `index.html`, `src/styles.css`, `src/content.ts`, `src/main.ts`, `src/ui/clock.ts`, `src/ui/exitLine.ts`, `public/_headers`, `public/robots.txt`, `public/favicon.svg`, `scripts/og-placeholder.mjs`, `public/og.png` (generated)
- Test: `tests/clock.test.ts`

**Interfaces:**
- Produces: `CONTENT` (`src/content.ts`), `formatClock(date, timeZone?, locale?) → { time, zone }` and `startClock(timeEl, zoneEl, timeZone, now?) → stop()` (`src/ui/clock.ts`), `initExitLine(linkedinUrl)` (`src/ui/exitLine.ts`). DOM ids used by later tasks: `#field` (canvas), `#static`, `#chrome`, `#clock-time`, `#clock-zone`, `#linkedin`, `#linkedin-sep`, `#cursor`.

- [ ] **Step 1: Write the failing clock test** (`tests/clock.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { formatClock } from '../src/ui/clock';

describe('formatClock', () => {
  it('renders 24-hour Los Angeles time with the PDT abbreviation in summer', () => {
    expect(formatClock(new Date('2026-10-16T07:08:00Z'))).toEqual({ time: '00:08', zone: 'PDT' });
  });

  it('switches to PST in winter', () => {
    expect(formatClock(new Date('2026-01-15T20:05:00Z'))).toEqual({ time: '12:05', zone: 'PST' });
  });

  it('never renders midnight as 24:xx', () => {
    expect(formatClock(new Date('2026-07-01T07:00:00Z')).time).toBe('00:00');
  });

  it('respects an explicit time zone', () => {
    expect(formatClock(new Date('2026-07-01T12:00:00Z'), 'UTC').time).toBe('12:00');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/clock.test.ts`
Expected: FAIL — cannot resolve `../src/ui/clock`.

- [ ] **Step 3: Write `src/ui/clock.ts`**

```ts
export interface ClockParts {
  time: string;
  zone: string;
}

export function formatClock(date: Date, timeZone = 'America/Los_Angeles', locale = 'en-US'): ClockParts {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
  return { time: `${get('hour')}:${get('minute')}`, zone: get('timeZoneName') };
}

/** Writes the time every second and resyncs when the tab becomes visible. Returns a stop function. */
export function startClock(
  timeEl: HTMLElement,
  zoneEl: HTMLElement,
  timeZone: string,
  now: () => Date = () => new Date(),
): () => void {
  const render = (): void => {
    const { time, zone } = formatClock(now(), timeZone);
    timeEl.textContent = time;
    zoneEl.textContent = zone;
  };
  render();
  const id = window.setInterval(render, 1000);
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') render();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/clock.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Write `src/content.ts` and `src/ui/exitLine.ts`**

`src/content.ts`:
```ts
export const CONTENT = {
  name: 'PARSA NAJI',
  alt: 'soon.',
  links: {
    github: 'https://github.com/parsanaji',
    /** Leave empty until Parsa supplies the URL; the link stays hidden while empty. */
    linkedin: '',
    email: 'info@parsanaji.com',
  },
  clock: { city: 'IRVINE', timeZone: 'America/Los_Angeles' },
};
```

`src/ui/exitLine.ts`:
```ts
/** Shows the LinkedIn link (and its separator) only when a URL exists. */
export function initExitLine(linkedinUrl: string, doc: Document = document): void {
  const link = doc.getElementById('linkedin');
  const sep = doc.getElementById('linkedin-sep');
  if (!(link instanceof HTMLAnchorElement) || !sep) return;
  if (!linkedinUrl) return;
  link.href = linkedinUrl;
  link.hidden = false;
  sep.hidden = false;
}
```

- [ ] **Step 6: Write `index.html`** (final markup; no inline styles or scripts other than the JSON-LD data block)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Parsa Naji</title>
    <meta name="description" content="Building something new." />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#070707" />
    <link rel="canonical" href="https://parsanaji.com/" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Parsa Naji" />
    <meta property="og:title" content="Parsa Naji" />
    <meta property="og:description" content="Building something new." />
    <meta property="og:url" content="https://parsanaji.com/" />
    <meta property="og:image" content="https://parsanaji.com/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Parsa Naji" />
    <meta name="twitter:description" content="Building something new." />
    <meta name="twitter:image" content="https://parsanaji.com/og.png" />
    <link rel="preload" href="/fonts/GeistSans-Black.subset.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/GeistMono-Regular.subset.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/src/styles.css" />
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Person","name":"Parsa Naji","url":"https://parsanaji.com/","sameAs":["https://github.com/parsanaji"]}
    </script>
  </head>
  <body>
    <h1 class="sr-only">Parsa Naji</h1>
    <p class="sr-only">Building something new.</p>

    <canvas id="field" aria-hidden="true"></canvas>

    <div id="static" class="static" hidden aria-hidden="true">
      <span class="static-name"><span>Parsa</span> <span>Naji</span></span>
    </div>
    <noscript>
      <div class="static" aria-hidden="true">
        <span class="static-name"><span>Parsa</span> <span>Naji</span></span>
      </div>
    </noscript>

    <footer id="chrome" class="chrome">
      <p class="exit">
        <span>building something new</span>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://github.com/parsanaji" rel="me noopener">github</a>
        <span id="linkedin-sep" class="sep" aria-hidden="true" hidden>·</span>
        <a id="linkedin" href="#" rel="me noopener" hidden>linkedin</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="mailto:info@parsanaji.com">say hi</a>
      </p>
      <p class="clock" aria-label="Local time in Irvine, California">
        <span>IRVINE</span>
        <time id="clock-time">--:--</time>
        <span id="clock-zone">PT</span>
      </p>
    </footer>

    <div id="cursor" class="cursor" aria-hidden="true"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `src/styles.css`** (final; the 2 s chrome fade-in is a CSS animation so it also works without JavaScript)

```css
@font-face {
  font-family: "Geist Sans";
  src: url("/fonts/GeistSans-Black.subset.woff2") format("woff2");
  font-weight: 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: "Geist Mono";
  src: url("/fonts/GeistMono-Regular.subset.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --bg: #070707;
  --bg-center: #0e0e0e;
  --fg: #f5f5f5;
  --muted: rgba(245, 245, 245, 0.5); /* 4.95:1 on #070707; 0.45 fails the 4.5:1 audit */
  --inset: 24px;
  --font-display: "Geist Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (max-width: 767px) {
  :root { --inset: 16px; }
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--fg);
  -webkit-text-size-adjust: 100%;
}
body {
  font-family: var(--font-mono);
  background: radial-gradient(ellipse at center, var(--bg-center) 0%, var(--bg) 70%) var(--bg);
  overscroll-behavior: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

#field {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}
html.no-webgl #field { display: none; }

.static {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 0 7vw;
  text-align: center;
}
.static[hidden] { display: none; }
.static-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.75rem, 13vw, 12rem);
  line-height: 0.95;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
@media (max-width: 479px) {
  .static-name > span { display: block; }
}

.chrome {
  position: fixed;
  left: var(--inset);
  right: var(--inset);
  bottom: var(--inset);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 2ch;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted);
  z-index: 2;
  animation: chrome-in 600ms ease 2000ms both;
}
.chrome[hidden] { display: none; }
@keyframes chrome-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.exit, .clock {
  display: flex;
  gap: 1.5ch;
  margin: 0;
  white-space: nowrap;
}
.exit a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  padding-bottom: 2px;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-size: 0% 1px;
  background-position: 0 100%;
  transition: color 150ms ease, background-size 200ms ease;
}
.exit a:hover, .exit a:focus-visible {
  color: var(--fg);
  background-size: 100% 1px;
}
.exit a:focus-visible {
  outline: 2px solid rgba(245, 245, 245, 0.8);
  outline-offset: 4px;
}
.exit [hidden], .clock [hidden] { display: none; }
.clock time { font-variant-numeric: tabular-nums; }

html.has-ring body { cursor: none; }
html.has-ring .exit a { cursor: pointer; }
.cursor {
  position: fixed;
  left: 0;
  top: 0;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border: 1px solid rgba(245, 245, 245, 0.7);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  scale: 1;
  transition: opacity 150ms ease, scale 150ms ease;
  will-change: translate;
  z-index: 3;
}
.cursor.is-visible { opacity: 1; }
.cursor.is-pressed { scale: 1.5; }
@media (hover: none) {
  .cursor { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .chrome { animation-duration: 0ms; animation-delay: 0ms; }
  .exit a, .cursor { transition: none; }
}
```

- [ ] **Step 8: Write the slice-1 `src/main.ts`** (shows the static block; Task 14 replaces this file)

```ts
import { CONTENT } from './content';
import { startClock } from './ui/clock';
import { initExitLine } from './ui/exitLine';

function showStatic(): void {
  document.documentElement.classList.add('no-webgl');
  const block = document.getElementById('static');
  if (block) block.hidden = false;
}

function boot(): void {
  initExitLine(CONTENT.links.linkedin);
  const timeEl = document.getElementById('clock-time');
  const zoneEl = document.getElementById('clock-zone');
  if (timeEl && zoneEl) startClock(timeEl, zoneEl, CONTENT.clock.timeZone);
  // Slice 1: the particle engine does not exist yet; always show the typographic page.
  showStatic();
}

boot();
```

- [ ] **Step 9: Write `public/_headers`, `public/robots.txt`, `public/favicon.svg`**

`public/_headers` (exactly; Pages applies every matching block):
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  X-Frame-Options: DENY

/
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

`public/robots.txt`:
```
User-agent: *
Allow: /
```

`public/favicon.svg` (a `P` on a 5×7 dot grid, cell 8 px, grid origin 12,4):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#070707"/>
  <g fill="#f5f5f5">
    <circle cx="16" cy="8" r="2.6"/><circle cx="24" cy="8" r="2.6"/><circle cx="32" cy="8" r="2.6"/><circle cx="40" cy="8" r="2.6"/>
    <circle cx="16" cy="16" r="2.6"/><circle cx="48" cy="16" r="2.6"/>
    <circle cx="16" cy="24" r="2.6"/><circle cx="48" cy="24" r="2.6"/>
    <circle cx="16" cy="32" r="2.6"/><circle cx="24" cy="32" r="2.6"/><circle cx="32" cy="32" r="2.6"/><circle cx="40" cy="32" r="2.6"/>
    <circle cx="16" cy="40" r="2.6"/>
    <circle cx="16" cy="48" r="2.6"/>
    <circle cx="16" cy="56" r="2.6"/>
  </g>
</svg>
```

- [ ] **Step 10: Write `scripts/og-placeholder.mjs` and generate `public/og.png`** (slice 5 replaces it with the real particle capture; this keeps the OG tags valid from day one and needs no fonts)

```js
// Slice-1 Open Graph image: the favicon "P" dot grid centred on 1200×630. Run: npm run og:placeholder
import sharp from 'sharp';

const W = 1200;
const H = 630;
const cell = 26;
const r = 8.5;
const pattern = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
];
const gridW = pattern[0].length * cell;
const gridH = pattern.length * cell;
const x0 = (W - gridW) / 2;
const y0 = (H - gridH) / 2;
const circles = pattern
  .flatMap((row, ri) =>
    row.map((on, ci) => (on ? `<circle cx="${x0 + ci * cell + cell / 2}" cy="${y0 + ri * cell + cell / 2}" r="${r}"/>` : '')),
  )
  .join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#0e0e0e"/><stop offset="1" stop-color="#070707"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g fill="#f5f5f5">${circles}</g>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('public/og.png written (1200x630)');
```

Run: `npm run og:placeholder`
Expected: `public/og.png written (1200x630)`.

- [ ] **Step 11: Build and look at it**

Run: `npm run build && npm run preview`
Expected: `tsc` silent; Vite reports `dist/index.html`, one JS chunk (a few KB), one CSS file; preview on `http://localhost:4173`.

Browser verification with the Chrome DevTools MCP: `navigate_page` to `http://localhost:4173/`, `take_screenshot` at 1440×900 (desktop) and again after `resize_page` to 390×844 (phone). Check: name uppercase in Geist 900, one line on desktop, two lines on the phone; exit line bottom-left and clock bottom-right appear after about 2 s; clock shows the current Pacific time; `list_console_messages` returns nothing at error or warning level. Stop the preview server afterwards.

- [ ] **Step 12: Commit**

```bash
git add index.html src/styles.css src/content.ts src/main.ts src/ui/clock.ts src/ui/exitLine.ts public/_headers public/robots.txt public/favicon.svg public/og.png scripts/og-placeholder.mjs tests/clock.test.ts
git commit -m "feat: static typographic page with exit line, live clock, headers and favicon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Operator prerequisites and Cloudflare environment

Tasks 5–7 need two things only Parsa can create: a GitHub CLI login and a scoped Cloudflare API token. This task documents them, checks them, and records the account and zone ids. **If either check fails, stop here and report the exact missing item; do not continue to Task 5.**

**Files:**
- Create: `docs/OPERATOR.md`, `scripts/cf-env.mjs`, `scripts/cf-api.mjs`

**Interfaces:**
- Produces: `.env` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`; `scripts/cf-api.mjs` exporting `env`, `requireEnv(...keys)`, `api(method, path, body?)`, `sleep(ms)` for Tasks 6, 7 and 25.

- [ ] **Step 1: Write `docs/OPERATOR.md`**

```markdown
# Operator steps (Parsa, one time each)

Everything else in this repo runs from the terminal. These five need you.

## 1. GitHub CLI
In PowerShell:

    winget install GitHub.cli
    gh auth login

Pick GitHub.com, HTTPS, "Login with a web browser", and sign in as **parsanaji**.
Verify: `gh auth status` shows `Logged in to github.com account parsanaji`.
Shells opened by a VS Code process that predates the install lack `gh` on PATH. Run `export PATH="$PATH:/c/Program Files/GitHub CLI"` (Git Bash) or `$env:Path += ";C:\Program Files\GitHub CLI"` (PowerShell) first, or restart VS Code.

## 2. Cloudflare API token
Dashboard → My Profile → API Tokens → Create Token → Create Custom Token.
Name: `parsanaji-com-deploy`. Permissions, exactly:

- Account · Cloudflare Pages · Edit
- Account · Email Routing Addresses · Edit
- Account · Account Settings · Read
- Zone · Zone · Read
- Zone · DNS · Edit
- Zone · Zone Settings · Edit
- Zone · Email Routing Rules · Edit
- Zone · Single Redirect · Edit (older dashboards call it "Dynamic Redirect")

Account Resources: Include → your account. Zone Resources: Include → Specific zone → parsanaji.com.
Create, copy the token once, then in the repo root:

    cp .env.example .env
    # edit .env and paste:  CLOUDFLARE_API_TOKEN=<token>

`.env` is gitignored. The builder runs `node scripts/cf-env.mjs` to verify it and fill in the ids.

## 3. Email verification
After the builder runs `node scripts/cf-setup-email.mjs`, Cloudflare emails **private-inbox@example.com**. Click "Verify email address".

## 4. Web Analytics (optional)
Dashboard → Workers & Pages → parsanaji-com → Metrics → Enable Web Analytics. One toggle, cookieless.

## 5. iPhone check (slice 5)
Open https://parsanaji.com in Safari: tap to morph, drag to repel, no scroll bounce, clock correct.
```

- [ ] **Step 2: Write `scripts/cf-api.mjs`** (shared by the Cloudflare scripts)

```js
// Shared Cloudflare REST helper. Reads .env; exits with a clear message when a value is missing.
process.loadEnvFile('.env');

export const env = {
  token: process.env.CLOUDFLARE_API_TOKEN ?? '',
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
  zoneId: process.env.CLOUDFLARE_ZONE_ID ?? '',
};

export function requireEnv(...keys) {
  for (const key of keys) {
    if (!env[key]) {
      console.error(`missing ${key} in .env (run: node scripts/cf-env.mjs)`);
      process.exit(1);
    }
  }
}

export async function api(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`${method} ${path} -> HTTP ${res.status} ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

- [ ] **Step 3: Write `scripts/cf-env.mjs`**

```js
// Verifies the Cloudflare API token and records the account + zone ids for parsanaji.com in .env.
// Run: node scripts/cf-env.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { api, requireEnv } from './cf-api.mjs';

requireEnv('token');
const verify = await api('GET', '/user/tokens/verify');
console.log(`token status: ${verify.status}`);

const zones = await api('GET', '/zones?name=parsanaji.com');
if (!zones.length) {
  console.error('zone parsanaji.com is not visible to this token (check Zone Resources on the token)');
  process.exit(1);
}
const zone = zones[0];
const keep = (await readFile('.env', 'utf8'))
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('CLOUDFLARE_ACCOUNT_ID=') && !line.startsWith('CLOUDFLARE_ZONE_ID='));
keep.push(`CLOUDFLARE_ACCOUNT_ID=${zone.account.id}`, `CLOUDFLARE_ZONE_ID=${zone.id}`);
await writeFile('.env', `${keep.join('\n')}\n`);
console.log(`account ${zone.account.id}`);
console.log(`zone    ${zone.id} (${zone.name}, status ${zone.status})`);
console.log(`nameservers: ${zone.name_servers?.join(', ')}`);
console.log('written to .env');
```

- [ ] **Step 4: Check GitHub CLI**

Run: `gh auth status 2>&1 || "/c/Program Files/GitHub CLI/gh.exe" auth status 2>&1`
Expected: `Logged in to github.com account parsanaji`. If `gh` is missing or logged into another account: STOP, report "Operator step 1 (GitHub CLI) is missing", and wait.

- [ ] **Step 5: Check the Cloudflare token and record ids**

Run: `test -f .env && node scripts/cf-env.mjs`
Expected: `token status: active`, an account id, a zone id with `status active`, `written to .env`. If `.env` is missing or the token is rejected: STOP, report "Operator step 2 (Cloudflare API token) is missing or lacks Zone:Read on parsanaji.com", and wait.

- [ ] **Step 6: Commit** (never `.env`)

```bash
git status --short   # confirm .env is NOT listed
git add docs/OPERATOR.md scripts/cf-api.mjs scripts/cf-env.mjs
git commit -m "docs: operator steps and Cloudflare environment scripts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: GitHub repository and push-to-deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: remote `origin` = `https://github.com/parsanaji/parsanaji.com` (private); repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; a workflow that tests, builds and deploys every push (production for `main`, preview for other branches).

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: deploy

on:
  push:
    branches: ['**']

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=parsanaji-com --branch=${{ github.ref_name }} --commit-dirty=true
```

- [ ] **Step 2: Commit, create the repository, push**

```bash
cd /c/Users/parsa/parsanaji.com
git add .github/workflows/deploy.yml
git commit -m "ci: test, build and deploy to Cloudflare Pages on push

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
export PATH="$PATH:/c/Program Files/GitHub CLI"
gh repo create parsanaji/parsanaji.com --private --source=. --remote=origin --push
```

Expected: `✓ Created repository parsanaji/parsanaji.com on GitHub` and `main` pushed. (The first workflow run fails at the deploy step because the Pages project does not exist yet; Task 6 fixes that.)

- [ ] **Step 3: Set the repository secrets from `.env`**

```bash
set -a; . ./.env; set +a
export PATH="$PATH:/c/Program Files/GitHub CLI"
gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
gh secret list
```

Expected: both secrets listed.

---

### Task 6: Cloudflare Pages project, first deploy, custom domains, redirect, HTTPS

**Files:**
- Create: `scripts/cf-setup-pages.mjs`

**Interfaces:**
- Produces: Pages project `parsanaji-com` (Direct Upload, production branch `main`), a production deployment serving `dist/`, custom domains `parsanaji.com` + `www.parsanaji.com`, proxied CNAMEs to `parsanaji-com.pages.dev`, a 301 `www → apex` Single Redirect, Always Use HTTPS on.

- [ ] **Step 1: Create the project and deploy**

```bash
cd /c/Users/parsa/parsanaji.com
set -a; . ./.env; set +a
npx wrangler pages project create parsanaji-com --production-branch main
npm run deploy
```

Expected: `✨ Successfully created the 'parsanaji-com' project.` then `✨ Deployment complete! Take a peek over at https://<hash>.parsanaji-com.pages.dev`. Verify: `curl -sI https://parsanaji-com.pages.dev/ | head -20` shows `HTTP/2 200`, a `content-security-policy:` header starting `default-src 'self'`, and `cache-control: no-cache`.

- [ ] **Step 2: Write `scripts/cf-setup-pages.mjs`** (idempotent; safe to rerun)

```js
// Custom domains, DNS, www redirect and HTTPS for the Pages project. Run: node scripts/cf-setup-pages.mjs
import { api, env, requireEnv, sleep } from './cf-api.mjs';

requireEnv('token', 'accountId', 'zoneId');
const PROJECT = 'parsanaji-com';
const APEX = 'parsanaji.com';
const WWW = 'www.parsanaji.com';
const PAGES_HOST = `${PROJECT}.pages.dev`;

// 1. custom domains on the Pages project
const domains = await api('GET', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains`);
for (const name of [APEX, WWW]) {
  if (domains.some((d) => d.name === name)) {
    console.log(`Pages domain ${name}: already present`);
  } else {
    await api('POST', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains`, { name });
    console.log(`Pages domain ${name}: added`);
  }
}

// 2. DNS: proxied CNAMEs to the pages.dev host (Cloudflare flattens the apex CNAME)
const records = await api('GET', `/zones/${env.zoneId}/dns_records?per_page=100`);
for (const name of [APEX, WWW]) {
  const existing = records.find((r) => r.name === name && ['CNAME', 'A', 'AAAA'].includes(r.type));
  const want = { type: 'CNAME', name, content: PAGES_HOST, proxied: true, ttl: 1 };
  if (!existing) {
    await api('POST', `/zones/${env.zoneId}/dns_records`, want);
    console.log(`DNS ${name}: CNAME -> ${PAGES_HOST} created`);
  } else if (existing.type !== 'CNAME' || existing.content !== PAGES_HOST || !existing.proxied) {
    await api('PATCH', `/zones/${env.zoneId}/dns_records/${existing.id}`, want);
    console.log(`DNS ${name}: updated to CNAME -> ${PAGES_HOST}`);
  } else {
    console.log(`DNS ${name}: already correct`);
  }
}

// 3. www -> apex, 301, query string preserved (Single Redirect, zone entrypoint ruleset).
//    PUT replaces every rule in this phase; the zone has no other redirect rules.
await api('PUT', `/zones/${env.zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
  rules: [
    {
      description: 'www to apex',
      expression: `(http.host eq "${WWW}")`,
      action: 'redirect',
      action_parameters: {
        from_value: {
          status_code: 301,
          target_url: { expression: `concat("https://${APEX}", http.request.uri.path)` },
          preserve_query_string: true,
        },
      },
      enabled: true,
    },
  ],
});
console.log('redirect rule: www -> apex set');

// 4. always use HTTPS
await api('PATCH', `/zones/${env.zoneId}/settings/always_use_https`, { value: 'on' });
console.log('always_use_https: on');

// 5. wait for the Pages domains to validate (certificate issuance can take a few minutes)
for (const name of [APEX, WWW]) {
  let status = 'unknown';
  for (let i = 0; i < 30; i++) {
    const d = await api('GET', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains/${name}`);
    status = d.status;
    if (status === 'active') break;
    await sleep(10_000);
  }
  console.log(`${name}: ${status}`);
}
```

- [ ] **Step 3: Run it**

Run: `node scripts/cf-setup-pages.mjs`
Expected: both domains `added`, both CNAMEs `created`, redirect set, HTTPS on, and finally `parsanaji.com: active` and `www.parsanaji.com: active` (up to 5 minutes; rerun if the last lines still say `pending`).

- [ ] **Step 4: Verify from outside**

```bash
curl -sI https://parsanaji.com/ | head -12
curl -sI https://www.parsanaji.com/ | head -5
curl -sI http://parsanaji.com/ | head -3
curl -s https://parsanaji.com/ | grep -c "Parsa Naji"
```

Expected: first `HTTP/2 200` with the CSP header; second `HTTP/2 301` with `location: https://parsanaji.com/`; third a `301` to https; fourth a count of at least 3.

Browser verification: `navigate_page` to `https://parsanaji.com/`, `take_screenshot`; the static page renders in Geist (no fallback-font flash), `list_console_messages` shows no CSP violations.

- [ ] **Step 5: Commit, push, confirm the workflow is green**

```bash
git add scripts/cf-setup-pages.mjs
git commit -m "feat: Cloudflare Pages domains, www redirect and HTTPS setup script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
gh run watch --exit-status
```

Expected: the run completes with the deploy step green.

---

### Task 7: Email routing for info@parsanaji.com

**Files:**
- Create: `scripts/cf-setup-email.mjs`

**Interfaces:**
- Produces: Email Routing enabled on the zone, destination `private-inbox@example.com` (verified by Parsa), rule `info@parsanaji.com → private-inbox@example.com`, catch-all disabled.

- [ ] **Step 1: Write `scripts/cf-setup-email.mjs`** (idempotent; `--no-wait` exits instead of polling for the verification click)

```js
// Email Routing: info@parsanaji.com -> private-inbox@example.com. Run: node scripts/cf-setup-email.mjs [--no-wait]
import { api, env, requireEnv, sleep } from './cf-api.mjs';

requireEnv('token', 'accountId', 'zoneId');
const DEST = 'private-inbox@example.com';
const ADDRESS = 'info@parsanaji.com';
const noWait = process.argv.includes('--no-wait');

// 1. enable routing on the zone (Cloudflare adds the MX and SPF records)
const settings = await api('GET', `/zones/${env.zoneId}/email/routing`);
if (settings.enabled) {
  console.log('email routing: already enabled');
} else {
  await api('POST', `/zones/${env.zoneId}/email/routing/enable`);
  console.log('email routing: enabled');
}

// 2. destination address (Cloudflare sends the verification email)
const addresses = await api('GET', `/accounts/${env.accountId}/email/routing/addresses?per_page=50`);
let dest = addresses.find((a) => a.email === DEST);
if (!dest) {
  dest = await api('POST', `/accounts/${env.accountId}/email/routing/addresses`, { email: DEST });
  console.log(`destination ${DEST}: created, verification email sent`);
} else {
  console.log(`destination ${DEST}: ${dest.verified ? 'verified' : 'awaiting verification'}`);
}

// 3. wait for Parsa to click the link (operator step 3)
while (!dest.verified) {
  if (noWait) {
    console.log('destination not verified yet; rerun this script after Parsa clicks the link');
    process.exit(0);
  }
  console.log('waiting for the verification click in the iCloud inbox (checking every 15 s)...');
  await sleep(15_000);
  dest = await api('GET', `/accounts/${env.accountId}/email/routing/addresses/${dest.id}`);
}
console.log(`destination ${DEST}: verified at ${dest.verified}`);

// 4. forwarding rule
const rules = await api('GET', `/zones/${env.zoneId}/email/routing/rules?per_page=50`);
if (rules.some((r) => r.matchers?.some((m) => m.value === ADDRESS))) {
  console.log(`rule ${ADDRESS}: already present`);
} else {
  await api('POST', `/zones/${env.zoneId}/email/routing/rules`, {
    name: 'info',
    enabled: true,
    matchers: [{ type: 'literal', field: 'to', value: ADDRESS }],
    actions: [{ type: 'forward', value: [DEST] }],
  });
  console.log(`rule ${ADDRESS} -> ${DEST}: created`);
}

// 5. catch-all stays off
const catchAll = await api('GET', `/zones/${env.zoneId}/email/routing/rules/catch_all`);
if (catchAll.enabled) {
  await api('PUT', `/zones/${env.zoneId}/email/routing/rules/catch_all`, { ...catchAll, enabled: false });
  console.log('catch-all: disabled');
} else {
  console.log('catch-all: off');
}
```

- [ ] **Step 2: Run it**

Run: `node scripts/cf-setup-email.mjs --no-wait`
Expected: routing enabled, destination created (verification email sent). Report to the orchestrator: "Parsa: click the Cloudflare verification link in private-inbox@example.com." Rerun without `--no-wait` after the click (the rule is the only remaining step; it can also happen in a later slice).

If `POST …/email/routing/enable` is rejected, fall back to one dashboard click (Email → Email Routing → Get started on the parsanaji.com zone) and rerun the script.

- [ ] **Step 3: Verify the DNS Cloudflare added**

Run: `node -e "import('./scripts/cf-api.mjs').then(async ({api, env}) => { const r = await api('GET', '/zones/' + env.zoneId + '/dns_records?type=MX'); console.log(r.map(x => x.content)); })"`
Expected: three `route*.mx.cloudflare.net` entries.

- [ ] **Step 4: Commit and push**

```bash
git add scripts/cf-setup-email.mjs
git commit -m "feat: Email Routing setup script for info@parsanaji.com

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 8: README and slice-1 checkpoint

**Files:**
- Create: `README.md`
- Orchestrator (not the builder): update `C:\Users\parsa\Documents\Obsidian Vault\Projects\parsanaji.com.md` (real deploy recipe, status "slice 1 live"), update `C:\Users\parsa\.claude\projects\C--Users-parsa\memory\parsanaji-com.md`, then compact.

- [ ] **Step 1: Write `README.md`**

```markdown
# parsanaji.com

Personal domain. Phase 1 teaser: the name in GPU particles (Three.js), one screen, no scroll.
Spec: `docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md`. Plan: `docs/superpowers/plans/2026-10-16-parsanaji-teaser.md`.

## Run

    npm install
    npm run dev          # http://localhost:5173  (add ?debug for the tuning panel)
    npm test             # vitest
    npm run build        # dist/

## Deploy

Every push deploys through GitHub Actions (`.github/workflows/deploy.yml`): `main` → https://parsanaji.com,
any other branch → `https://<branch>.parsanaji-com.pages.dev`. From a terminal with `.env` present:

    npm run deploy            # production
    npm run deploy:preview    # https://preview.parsanaji-com.pages.dev

## Infrastructure scripts (idempotent, need `.env`, see docs/OPERATOR.md)

    node scripts/cf-env.mjs          # verify token, record account + zone ids
    node scripts/cf-setup-pages.mjs  # custom domains, DNS, www redirect, HTTPS
    node scripts/cf-setup-email.mjs  # info@parsanaji.com -> private-inbox@example.com
    npm run fonts                    # regenerate the font subsets from node_modules/geist
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: README with run, deploy and infrastructure recipes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 3: Orchestrator checkpoint**

Update the vault note and memory file with: live URL confirmed, deploy recipe, email state (verified or waiting), any API surprises. Tell Parsa slice 1 is live. Compact before slice 2.

---
## Slice 2 — Engine core

### Task 9: PRNG, easing, frame-delta clamp

**Files:**
- Create: `src/engine/prng.ts`, `src/engine/easing.ts`, `src/engine/time.ts`
- Test: `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts`

**Interfaces:**
- Produces: `mulberry32(seed: number): () => number` (uniform in [0,1)), `seedFromLocation(search: string, fallback?: () => number): number`; `easeOutExpo`, `easeInCubic`, `easeOutCubic`, `clamp01` (all `(t: number) => number`); `clampDt(dtMs: number, maxMs = 50): number`.

- [ ] **Step 1: Write the failing tests**

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

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the modules**

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/prng.ts src/engine/easing.ts src/engine/time.ts tests/prng.test.ts tests/easing.test.ts tests/time.test.ts
git commit -m "feat(engine): seeded PRNG, easing curves and frame-delta clamp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Shared types, defaults, quality rules

**Files:**
- Create: `src/engine/types.ts`, `src/engine/defaults.ts`, `src/engine/quality.ts`
- Test: `tests/quality.test.ts`

**Interfaces:**
- Produces (`types.ts`): `PHASE` ids, `PhaseId`, `PointerSlot`, `RippleState`, `RIPPLE_OFF`, and the param interfaces `RippleParams`, `MorphTimings`, `PointerParams`, `LayoutParams`, `RasterParams`, `ProbeParams`, `Params`.
- Produces (`defaults.ts`): `DEFAULTS: Params` (spec 3.2–3.7 numbers) and `cloneParams(p)`.
- Produces (`quality.ts`): `widthClass(vw) → 'desktop' | 'tablet' | 'phone'`, `COUNT_CAP`, `dotCount(inkedAreaCssPx, vw, density, caps?)`, `capDpr(dpr, max = 2)`, `degradedCount(n, factor = 0.6)`, `class FpsProbe { push(dtMs): 'pending' | 'keep' | 'degrade'; done: boolean }`.

- [ ] **Step 1: Write `src/engine/types.ts`**

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

- [ ] **Step 2: Write `src/engine/defaults.ts`** (every number traces to spec 3.2–3.7)

```ts
import type { Params } from './types';

export const DEFAULTS: Params = {
  density: 0.3,
  dotSize: 1.6,
  sizeVarMin: 0.75,
  sizeVarMax: 1.25,
  alphaMin: 0.6,
  alphaMax: 1.0,
  alphaScale: 0.9,
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

- [ ] **Step 3: Write the failing quality tests** (`tests/quality.test.ts`)

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

- [ ] **Step 4: Run to verify failure, then write `src/engine/quality.ts`**

Run: `npx vitest run tests/quality.test.ts` → FAIL (module not found). Then:

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

- [ ] **Step 5: Run the tests and typecheck**

Run: `npx vitest run tests/quality.test.ts && npm run typecheck`
Expected: all pass; `tsc` silent.

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/defaults.ts src/engine/quality.ts tests/quality.test.ts
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

- [ ] **Step 1: Write the fake canvas helper** (`tests/helpers/fakeCanvas.ts`)

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

- [ ] **Step 2: Write the failing tests** (`tests/sampler.test.ts`)

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

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/sampler.test.ts`
Expected: FAIL — `../src/engine/sampler` not found.

- [ ] **Step 4: Write `src/engine/sampler.ts`**

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
  const maxBlockH = Math.max(1, opts.viewportH * opts.maxHeightFrac);
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

- [ ] **Step 5: Run the tests and typecheck**

Run: `npx vitest run tests/sampler.test.ts && npm run typecheck`
Expected: all pass; `tsc` silent. If `noUnusedLocals` complains about anything, remove the unused symbol rather than loosening the config.

- [ ] **Step 6: Commit**

```bash
git add src/engine/sampler.ts tests/helpers/fakeCanvas.ts tests/sampler.test.ts
git commit -m "feat(engine): text sampler with layout, raster scan and seeded subsampling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
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
    float band = exp(-pow((d - uRipple.z) / uRippleBand, 2.0));
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
    float f = smoothstep(1.0, 0.0, d / uRepelRadius);
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

- [ ] **Step 3: Write `src/shaders/field.frag`** (Three.js maps `gl_FragColor` to the GLSL3 output)

```glsl
in float vAlpha;
in float vNear;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.35, d) * vAlpha;
  if (a <= 0.002) discard;
  vec3 col = mix(vec3(0.961), vec3(1.0), vNear); // #f5f5f5, brighter near the pointer
  gl_FragColor = vec4(col, a);
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
    this.n = dotCount(this.nameSample.inkedAreaCssPx, this.vw, this.params.density);
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
  if (timeEl && zoneEl) startClock(timeEl, zoneEl, CONTENT.clock.timeZone);

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

Run: `npm run typecheck && npm run dev` → open `http://localhost:5173/?debug` with the DevTools MCP: the `parsanaji tweaks` panel appears top-right; change `dotSize` and see dots grow live; change `density` and see the field re-sample; reload keeps the values; "reset to defaults" clears them.

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
## Slice 3 — Pointer

### Task 16: Pointer model

Pure TypeScript: smoothing, speed, a short decaying trail, and parking after release. The shader consumes its `slots()`.

**Files:**
- Create: `src/engine/pointer.ts`
- Test: `tests/pointer.test.ts`

**Interfaces:**
- Consumes: `PointerParams`, `PointerSlot` (Task 10), `easeOutCubic` (Task 9).
- Produces: `class PointerModel { constructor(params); setParams(p); isActive; position; move(x, y); snap(x, y, t); release(t); tick(dtMs, t); slots(t): PointerSlot[] }`. Coordinates are centred CSS px, y up. `slots()` always returns exactly `params.slots` entries, newest first, index 0 = live pointer.

- [ ] **Step 1: Write the failing tests** (`tests/pointer.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/engine/defaults';
import { PointerModel } from '../src/engine/pointer';

const P = DEFAULTS.pointer;

/** Advance `model` by `totalMs` in `stepMs` frames starting at absolute time `t0`; returns the final time. */
const run = (model: PointerModel, totalMs: number, stepMs: number, t0: number): number => {
  let t = t0;
  for (let elapsed = 0; elapsed < totalMs - 1e-9; elapsed += stepMs) {
    t += stepMs;
    model.tick(stepMs, t);
  }
  return t;
};

describe('PointerModel', () => {
  it('lerps toward the raw pointer independent of frame rate', () => {
    const a = new PointerModel(P);
    const b = new PointerModel(P);
    a.move(0, 0);
    b.move(0, 0);
    a.tick(16, 16);
    b.tick(16, 16);
    a.move(100, 0);
    b.move(100, 0);
    run(a, 1000, 1000 / 30, 16);
    run(b, 1000, 1000 / 120, 16);
    expect(a.position.x).toBeGreaterThan(99);
    expect(Math.abs(a.position.x - b.position.x)).toBeLessThan(1);
  });

  it('reports a velocity factor that saturates at 1 for fast moves', () => {
    const m = new PointerModel(P);
    m.move(0, 0);
    m.tick(16, 16);
    m.move(1000, 0);
    m.tick(16.667, 32.667); // 120 px in one frame = 7200 px/s, far above velNorm
    expect(m.slots(32.667)[0].vel).toBe(1);
  });

  it('always returns exactly 8 slots with the live pointer first', () => {
    const m = new PointerModel(P);
    expect(m.slots(0)).toHaveLength(8);
    expect(m.slots(0).every((s) => s.strength === 0)).toBe(true);
    m.snap(5, 6, 0);
    const s = m.slots(0);
    expect(s).toHaveLength(8);
    expect(s[0]).toMatchObject({ x: 5, y: 6, strength: 1 });
  });

  it('keeps a trail of decaying samples behind the live pointer', () => {
    const m = new PointerModel(P);
    m.snap(0, 0, 0);
    let t = 0;
    for (let i = 1; i <= 40; i++) {
      t += 16;
      m.move(i * 10, 0);
      m.tick(16, t);
    }
    const trail = m.slots(t).slice(1).filter((s) => s.strength > 0);
    expect(trail.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < trail.length; i++) expect(trail[i].strength).toBeLessThanOrEqual(trail[i - 1].strength);
    expect(trail[trail.length - 1].strength).toBeLessThan(trail[0].strength);
  });

  it('decays after release and parks after parkMs so no ghost repel remains', () => {
    const m = new PointerModel(P);
    m.snap(0, 0, 0);
    m.tick(16, 16);
    m.release(16);
    m.tick(400, 416);
    expect(m.slots(416)[0].strength).toBeCloseTo(0.875, 6); // easeOutCubic(0.5)
    m.tick(400, 816);
    expect(m.isActive).toBe(false);
    expect(m.slots(816).every((s) => s.strength === 0)).toBe(true);
  });

  it('re-activates cleanly after parking', () => {
    const m = new PointerModel(P);
    m.snap(0, 0, 0);
    m.release(0);
    m.tick(900, 900);
    expect(m.isActive).toBe(false);
    m.move(50, 50);
    m.tick(16, 916);
    expect(m.isActive).toBe(true);
    expect(m.position).toEqual({ x: 50, y: 50 });
  });
});
```

- [ ] **Step 2: Run to verify failure, then write `src/engine/pointer.ts`**

Run: `npx vitest run tests/pointer.test.ts` → FAIL. Then:

```ts
import { easeOutCubic } from './easing';
import type { PointerParams, PointerSlot } from './types';

interface TrailSample {
  x: number;
  y: number;
  t: number;
}

/** Smooths the raw pointer, estimates its speed, keeps a short decaying trail, parks after release (spec 3.5). */
export class PointerModel {
  private rawX = 0;
  private rawY = 0;
  private hasRaw = false;
  private x = 0;
  private y = 0;
  private speed = 0;
  private active = false;
  private releasedAt = -1;
  private trail: TrailSample[] = [];
  private lastSampleT = Number.NEGATIVE_INFINITY;

  constructor(private params: PointerParams) {}

  setParams(p: PointerParams): void {
    this.params = p;
  }

  get isActive(): boolean {
    return this.active;
  }

  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /** Pointer moved (mouse or touch). Centred CSS px, y up. */
  move(x: number, y: number): void {
    if (!this.active) {
      this.x = x;
      this.y = y;
      this.speed = 0;
      this.active = true;
    }
    this.rawX = x;
    this.rawY = y;
    this.hasRaw = true;
    this.releasedAt = -1;
  }

  /** Touch start: place the smoothed pointer instantly instead of lerping in from the last position. */
  snap(x: number, y: number, t: number): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.rawX = x;
    this.rawY = y;
    this.hasRaw = true;
    this.speed = 0;
    this.releasedAt = -1;
    this.trail = [];
    this.lastSampleT = Number.NEGATIVE_INFINITY;
    this.sample(t);
  }

  /** Pointer up, cancel, or left the window: strength decays over trailMs, then the model parks. */
  release(t: number): void {
    if (this.active && this.releasedAt < 0) this.releasedAt = t;
  }

  tick(dtMs: number, t: number): void {
    if (!this.active) return;
    const dt = Math.max(dtMs, 1e-3);
    if (this.releasedAt < 0 && this.hasRaw) {
      const k = 1 - Math.pow(1 - this.params.lerp, dt / (1000 / 60));
      const nx = this.x + (this.rawX - this.x) * k;
      const ny = this.y + (this.rawY - this.y) * k;
      this.speed = Math.hypot(nx - this.x, ny - this.y) / (dt / 1000);
      this.x = nx;
      this.y = ny;
      const last = this.trail[this.trail.length - 1];
      const far = !last || Math.hypot(this.x - last.x, this.y - last.y) >= this.params.sampleMinDist;
      if (t - this.lastSampleT >= this.params.sampleEveryMs || far) this.sample(t);
    } else {
      this.speed = 0;
    }
    this.trail = this.trail.filter((s) => t - s.t <= this.params.trailMs);
    if (this.releasedAt >= 0 && t - this.releasedAt >= this.params.parkMs) {
      this.active = false;
      this.hasRaw = false;
      this.trail = [];
      this.releasedAt = -1;
      this.speed = 0;
    }
  }

  private sample(t: number): void {
    this.trail.push({ x: this.x, y: this.y, t });
    this.lastSampleT = t;
    while (this.trail.length > this.params.slots - 1) this.trail.shift();
  }

  /** Exactly `params.slots` entries, newest first; index 0 is the live pointer. Inert slots have strength 0. */
  slots(t: number): PointerSlot[] {
    const out: PointerSlot[] = [];
    if (this.active) {
      const live = this.releasedAt < 0 ? 1 : easeOutCubic(Math.max(0, 1 - (t - this.releasedAt) / this.params.trailMs));
      out.push({ x: this.x, y: this.y, strength: live, vel: Math.min(this.speed / this.params.velNorm, 1) });
      for (let i = this.trail.length - 1; i >= 0 && out.length < this.params.slots; i--) {
        const s = this.trail[i];
        out.push({ x: s.x, y: s.y, strength: easeOutCubic(Math.max(0, 1 - (t - s.t) / this.params.trailMs)), vel: 0 });
      }
    }
    while (out.length < this.params.slots) out.push({ x: 0, y: 0, strength: 0, vel: 0 });
    return out;
  }
}
```

- [ ] **Step 3: Run the tests and typecheck**

Run: `npx vitest run tests/pointer.test.ts && npm run typecheck`
Expected: 6 pass; `tsc` silent.

- [ ] **Step 4: Commit**

```bash
git add src/engine/pointer.ts tests/pointer.test.ts
git commit -m "feat(engine): pointer model with smoothing, speed, decaying trail and parking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Wire the pointer into `App` (mouse and touch)

**Files:**
- Modify: `src/app.ts`

**Interfaces:**
- Consumes: `PointerModel` (Task 16).
- Produces: `App` listens to `pointermove/pointerdown/pointerup/pointercancel` on `window`, `pointerleave` on `<html>`, `blur` on `window`; pushes `pointer.slots()` to the field every frame; exposes a private `noteActivity()` hook that Task 20 forwards to the `MorphMachine`.

- [ ] **Step 1: Edit `src/app.ts`**

Add the import:
```ts
import { PointerModel } from './engine/pointer';
```

Add the field next to `ripple`:
```ts
  private readonly pointer: PointerModel;
```

In the constructor, after `this.ripple = …`:
```ts
    this.pointer = new PointerModel(this.params.pointer);
```

In `applyParams()`, add as the last line:
```ts
    this.pointer.setParams(this.params.pointer);
```

In `start()`, after the `visibilitychange` listener:
```ts
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerEnd);
    window.addEventListener('pointercancel', this.onPointerEnd);
    document.documentElement.addEventListener('pointerleave', this.onPointerEnd);
    window.addEventListener('blur', this.onPointerEnd);
```

In `stop()`, the matching removals:
```ts
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerEnd);
    window.removeEventListener('pointercancel', this.onPointerEnd);
    document.documentElement.removeEventListener('pointerleave', this.onPointerEnd);
    window.removeEventListener('blur', this.onPointerEnd);
```

In `frame`, directly after `this.field.setTime(this.simMs);`:
```ts
    this.pointer.tick(dt, this.simMs);
    this.field.setPointer(this.pointer.slots(this.simMs));
```

Add the handlers after `pickGlyphCenter`:
```ts
  /** Spec 3.4: x = clientX - vw/2, y = vh/2 - clientY. */
  private toWorld(e: PointerEvent): readonly [number, number] {
    return [e.clientX - this.vw / 2, this.vh / 2 - e.clientY] as const;
  }

  private onPointerMove = (e: PointerEvent): void => {
    const [x, y] = this.toWorld(e);
    this.pointer.move(x, y);
    this.noteActivity();
  };

  private onPointerDown = (e: PointerEvent): void => {
    const [x, y] = this.toWorld(e);
    if (e.pointerType === 'touch') this.pointer.snap(x, y, this.simMs);
    else this.pointer.move(x, y);
    this.noteActivity();
  };

  private onPointerEnd = (): void => {
    this.pointer.release(this.simMs);
  };

  /** [Task 20] forwards to the MorphMachine (cancels the auto-tease). */
  private noteActivity(): void {}
```

- [ ] **Step 2: Typecheck, test, verify in the browser**

Run: `npm run typecheck && npm test && npm run dev`

DevTools MCP checks on `http://localhost:5173/?seed=7` after the entry completes:
1. `hover` over the middle of the name, then `take_screenshot`: a hole opens around the pointer with brighter, slightly larger dots at its rim.
2. Drag the mouse quickly across the letters (`drag` from one side to the other): the displacement is stronger than a slow pass and a wake trails the cursor for well under a second.
3. Leave the viewport (dispatch `pointerleave` on `document.documentElement` with `evaluate_script`): within about 1 s the letters are whole again — no frozen hole.
4. Touch: `evaluate_script` dispatching `new PointerEvent('pointerdown', { pointerType: 'touch', clientX: innerWidth / 2, clientY: innerHeight / 2, bubbles: true })` then the matching `pointerup`: a pulse opens instantly at the centre and closes again.
5. `list_console_messages`: clean.
6. Toggle `prefers-reduced-motion` emulation and reload: the repel still works but with a visibly smaller radius (80 px).

- [ ] **Step 3: Commit**

```bash
git add src/app.ts
git commit -m "feat: pointer repel with velocity and decaying trail, mouse and touch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Cursor ring and slice-3 checkpoint

**Files:**
- Create: `src/ui/cursor.ts`
- Modify: `src/main.ts` (one call)

**Interfaces:**
- Produces: `initCursorRing(el: HTMLElement, root?: HTMLElement): () => void` — adds `has-ring` to `<html>` (hides the native cursor via the CSS from Task 3), follows the raw mouse with `style.translate`, `is-pressed` while a button is down, hidden over links and on `(hover: none)` devices.

- [ ] **Step 1: Write `src/ui/cursor.ts`**

```ts
/** 6 px ring that follows the raw mouse pointer; hidden over links and on touch-only devices (spec 3.2). */
export function initCursorRing(el: HTMLElement, root: HTMLElement = document.documentElement): () => void {
  if (window.matchMedia('(hover: none)').matches) return () => {};
  root.classList.add('has-ring');

  const onMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    el.style.translate = `${e.clientX}px ${e.clientY}px`;
    const overLink = e.target instanceof Element && e.target.closest('a') !== null;
    el.classList.toggle('is-visible', !overLink);
  };
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') el.classList.add('is-pressed');
  };
  const onUp = (): void => el.classList.remove('is-pressed');
  const onLeave = (): void => el.classList.remove('is-visible');

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  root.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    root.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    root.classList.remove('has-ring');
    el.classList.remove('is-visible', 'is-pressed');
  };
}
```

- [ ] **Step 2: Call it from `src/main.ts`** — add `import { initCursorRing } from './ui/cursor';` and, right after the `startClock(...)` line inside `boot()`:

```ts
  const cursorEl = document.getElementById('cursor');
  if (cursorEl) initCursorRing(cursorEl);
```

(Before the WebGL gate on purpose: the static fallback page gets the same cursor.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run dev`. DevTools MCP on `http://localhost:5173/`:
1. `hover` over the canvas: the native cursor is gone, a small ring sits under the pointer; `take_screenshot` to confirm.
2. `hover` over `github` in the exit line: the ring disappears and the native pointer hand shows (`getComputedStyle(link).cursor === 'pointer'` via `evaluate_script`).
3. Press and hold (`pointerdown` via `evaluate_script`, then screenshot): the ring scales to 1.5×; release restores it.
4. `emulate` a touch device (`hasTouch`, mobile UA) and reload: no ring visible (`getComputedStyle(cursor).display === 'none'`).
5. `list_console_messages`: clean.

- [ ] **Step 4: Commit, push, preview, checkpoint**

```bash
git add src/ui/cursor.ts src/main.ts
git commit -m "feat: custom cursor ring with press feedback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
npm run deploy:preview
```

Orchestrator: update the vault note and memory (slice 3 done, preview URL, any tuning Parsa asked for), then compact before slice 4.

---
## Slice 4 — Morph and resilience

### Task 19: Morph state machine

**Files:**
- Create: `src/engine/morph.ts`
- Test: `tests/morph.test.ts`

**Interfaces:**
- Consumes: `PHASE`, `PhaseId`, `MorphTimings` (Task 10); `clampDt` (Task 9, tests only).
- Produces: `type MorphEvent = 'entryComplete' | 'autoTease' | 'cycleComplete'`; `interface MorphSnapshot { phase; tMs; durMs; staggerMs; showingAlt }`; `class MorphMachine { constructor(timings, reduced = false); setTimings(t); acceptsInput; requestCycle(): boolean; pointerActivity(); tick(dtMs): MorphEvent[]; snapshot(): MorphSnapshot }`.

- [ ] **Step 1: Write the failing tests** (`tests/morph.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/engine/defaults';
import { MorphMachine, type MorphEvent } from '../src/engine/morph';
import { clampDt } from '../src/engine/time';
import { PHASE } from '../src/engine/types';

const T = DEFAULTS.morph;

/** Tick in 16 ms frames (last frame shorter) and collect events. */
const advance = (m: MorphMachine, ms: number, step = 16): MorphEvent[] => {
  const events: MorphEvent[] = [];
  let left = ms;
  while (left > 1e-9) {
    const d = Math.min(step, left);
    events.push(...m.tick(d));
    left -= d;
  }
  return events;
};

describe('MorphMachine', () => {
  it('runs the entry for entryMs + stagger, then idles and reports entryComplete once', () => {
    const m = new MorphMachine(T);
    expect(m.snapshot().phase).toBe(PHASE.ENTRY);
    expect(m.acceptsInput).toBe(false);
    expect(advance(m, 1999)).not.toContain('entryComplete');
    expect(m.snapshot().phase).toBe(PHASE.ENTRY);
    expect(advance(m, 2)).toContain('entryComplete');
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
    expect(advance(m, 1000)).not.toContain('entryComplete');
  });

  it('ignores requests during entry and mid-cycle, accepts them in idle', () => {
    const m = new MorphMachine(T);
    expect(m.requestCycle()).toBe(false);
    advance(m, 2000);
    expect(m.requestCycle()).toBe(true);
    expect(m.snapshot().phase).toBe(PHASE.SCRAMBLE_OUT);
    expect(m.requestCycle()).toBe(false);
  });

  it('walks the cycle with the spec durations and ends with cycleComplete', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.requestCycle();
    const expectPhaseAfter = (ms: number, phase: number): void => {
      advance(m, ms);
      expect(m.snapshot().phase).toBe(phase);
    };
    expectPhaseAfter(499, PHASE.SCRAMBLE_OUT); // scramble 500
    expectPhaseAfter(2, PHASE.FORM_ALT); // t = 501
    expectPhaseAfter(1148, PHASE.FORM_ALT); // form 900 + stagger 250 = 1150 → boundary at 1650
    expectPhaseAfter(2, PHASE.HOLD_ALT); // t = 1651
    expectPhaseAfter(2498, PHASE.HOLD_ALT); // hold 2500 → boundary at 4150
    expectPhaseAfter(2, PHASE.SCRAMBLE_BACK); // t = 4151
    expectPhaseAfter(498, PHASE.SCRAMBLE_BACK); // boundary at 4650
    expectPhaseAfter(2, PHASE.FORM_NAME); // t = 4651
    expect(advance(m, 1150)).toContain('cycleComplete'); // boundary at 5800
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
  });

  it('shows the alt target during FORM_ALT, HOLD_ALT and SCRAMBLE_BACK only', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    expect(m.snapshot().showingAlt).toBe(false);
    m.requestCycle();
    advance(m, 600);
    expect(m.snapshot().showingAlt).toBe(true);
    advance(m, 1200);
    expect(m.snapshot().showingAlt).toBe(true);
    advance(m, 2600);
    expect(m.snapshot().phase).toBe(PHASE.SCRAMBLE_BACK);
    expect(m.snapshot().showingAlt).toBe(true);
    advance(m, 400);
    expect(m.snapshot().phase).toBe(PHASE.FORM_NAME);
    expect(m.snapshot().showingAlt).toBe(false);
  });

  it('auto-teases once after 8 s idle with no activity, never again', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    expect(advance(m, 7999)).not.toContain('autoTease');
    expect(advance(m, 2)).toContain('autoTease');
    advance(m, 6000);
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
    expect(advance(m, 20_000)).not.toContain('autoTease');
  });

  it('never auto-teases once the pointer has moved', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.pointerActivity();
    expect(advance(m, 30_000)).not.toContain('autoTease');
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
  });

  it('reduced motion: starts idle, reports entryComplete on the first tick, crossfades in reducedMs with no stagger', () => {
    const m = new MorphMachine(T, true);
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
    expect(m.tick(16)).toContain('entryComplete');
    expect(m.requestCycle()).toBe(true);
    expect(m.snapshot()).toMatchObject({ phase: PHASE.SCRAMBLE_OUT, durMs: 150, staggerMs: 0 });
    advance(m, 160);
    expect(m.snapshot().phase).toBe(PHASE.FORM_ALT);
    advance(m, 160);
    expect(m.snapshot().phase).toBe(PHASE.HOLD_ALT);
  });

  it('carries overflow across several phases on one large delta', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.requestCycle();
    m.tick(3000); // 500 + 1150 + 1350 into the hold
    expect(m.snapshot().phase).toBe(PHASE.HOLD_ALT);
    expect(m.snapshot().tMs).toBeCloseTo(1350, 6);
  });

  it('a hidden-tab gap clamped by clampDt advances a single frame', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.requestCycle();
    m.tick(clampDt(60_000));
    expect(m.snapshot().phase).toBe(PHASE.SCRAMBLE_OUT);
    expect(m.snapshot().tMs).toBe(50);
  });
});
```

- [ ] **Step 2: Run to verify failure, then write `src/engine/morph.ts`**

Run: `npx vitest run tests/morph.test.ts` → FAIL. Then:

```ts
import { PHASE, type MorphTimings, type PhaseId } from './types';

export type MorphEvent = 'entryComplete' | 'autoTease' | 'cycleComplete';

export interface MorphSnapshot {
  phase: PhaseId;
  /** ms elapsed in the phase */
  tMs: number;
  /** base duration of the phase (>= 1 so the shader never divides by zero) */
  durMs: number;
  staggerMs: number;
  /** true while the dots belong to the `soon.` target */
  showingAlt: boolean;
}

const NEXT: Record<PhaseId, PhaseId> = {
  [PHASE.ENTRY]: PHASE.IDLE,
  [PHASE.IDLE]: PHASE.IDLE,
  [PHASE.SCRAMBLE_OUT]: PHASE.FORM_ALT,
  [PHASE.FORM_ALT]: PHASE.HOLD_ALT,
  [PHASE.HOLD_ALT]: PHASE.SCRAMBLE_BACK,
  [PHASE.SCRAMBLE_BACK]: PHASE.FORM_NAME,
  [PHASE.FORM_NAME]: PHASE.IDLE,
};

/** ENTRY → IDLE → (SCRAMBLE_OUT → FORM_ALT → HOLD_ALT → SCRAMBLE_BACK → FORM_NAME → IDLE)*, spec 3.5. */
export class MorphMachine {
  private phase: PhaseId;
  private tInPhase = 0;
  private idleMs = 0;
  private autoTeased = false;
  private sawActivity = false;
  private pendingEntryComplete: boolean;

  constructor(
    private timings: MorphTimings,
    private readonly reduced = false,
  ) {
    this.phase = reduced ? PHASE.IDLE : PHASE.ENTRY;
    this.pendingEntryComplete = reduced;
  }

  setTimings(t: MorphTimings): void {
    this.timings = t;
  }

  get acceptsInput(): boolean {
    return this.phase === PHASE.IDLE;
  }

  /** Click or tap. Returns false while the entry or a cycle is running. */
  requestCycle(): boolean {
    if (!this.acceptsInput) return false;
    this.enter(PHASE.SCRAMBLE_OUT);
    return true;
  }

  /** Any pointer movement or press: the visitor knows the page is alive, so the auto-tease is cancelled for good. */
  pointerActivity(): void {
    this.sawActivity = true;
  }

  tick(dtMs: number): MorphEvent[] {
    const events: MorphEvent[] = [];
    if (this.pendingEntryComplete) {
      this.pendingEntryComplete = false;
      events.push('entryComplete');
    }
    if (this.phase === PHASE.IDLE) {
      this.idleMs += dtMs;
      if (!this.autoTeased && !this.sawActivity && this.idleMs >= this.timings.autoTeaseMs) {
        this.autoTeased = true;
        this.enter(PHASE.SCRAMBLE_OUT);
        events.push('autoTease');
      }
      return events;
    }
    this.tInPhase += dtMs;
    while (this.phase !== PHASE.IDLE && this.tInPhase >= this.total(this.phase)) {
      const carry = this.tInPhase - this.total(this.phase);
      if (this.phase === PHASE.ENTRY) events.push('entryComplete');
      if (this.phase === PHASE.FORM_NAME) events.push('cycleComplete');
      this.enter(NEXT[this.phase], carry);
    }
    return events;
  }

  snapshot(): MorphSnapshot {
    const p = this.phase;
    return {
      phase: p,
      tMs: this.tInPhase,
      durMs: Math.max(1, this.dur(p)),
      staggerMs: this.stagger(p),
      showingAlt: p === PHASE.FORM_ALT || p === PHASE.HOLD_ALT || p === PHASE.SCRAMBLE_BACK,
    };
  }

  private enter(phase: PhaseId, carry = 0): void {
    this.phase = phase;
    this.tInPhase = phase === PHASE.IDLE ? 0 : carry;
    if (phase === PHASE.IDLE) this.idleMs = 0;
  }

  private dur(p: PhaseId): number {
    const T = this.timings;
    if (this.reduced) {
      switch (p) {
        case PHASE.SCRAMBLE_OUT:
        case PHASE.FORM_ALT:
        case PHASE.SCRAMBLE_BACK:
        case PHASE.FORM_NAME:
          return T.reducedMs;
        case PHASE.HOLD_ALT:
          return T.holdMs;
        default:
          return 0;
      }
    }
    switch (p) {
      case PHASE.ENTRY:
        return T.entryMs;
      case PHASE.SCRAMBLE_OUT:
      case PHASE.SCRAMBLE_BACK:
        return T.scrambleMs;
      case PHASE.FORM_ALT:
      case PHASE.FORM_NAME:
        return T.formMs;
      case PHASE.HOLD_ALT:
        return T.holdMs;
      default:
        return 0;
    }
  }

  private stagger(p: PhaseId): number {
    if (this.reduced) return 0;
    const T = this.timings;
    switch (p) {
      case PHASE.ENTRY:
        return T.entryStaggerMs;
      case PHASE.FORM_ALT:
      case PHASE.FORM_NAME:
        return T.formStaggerMs;
      default:
        return 0;
    }
  }

  private total(p: PhaseId): number {
    return this.dur(p) + this.stagger(p);
  }
}
```

- [ ] **Step 3: Run the tests and typecheck**

Run: `npx vitest run tests/morph.test.ts && npm run typecheck`
Expected: 9 pass; `tsc` silent.

- [ ] **Step 4: Commit**

```bash
git add src/engine/morph.ts tests/morph.test.ts
git commit -m "feat(engine): morph state machine with auto-tease and reduced-motion timings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Wire the morph: click, tap, auto-tease, reduced motion

**Files:**
- Modify: `src/app.ts`

**Interfaces:**
- Consumes: `MorphMachine` (Task 19).
- Produces: `App.requestCycle()` is real; `noteActivity()` forwards to the machine; canvas `click` and touch `pointerdown` start cycles; the `[Task 20]` entry block in `frame` is gone.

- [ ] **Step 1: Edit `src/app.ts`**

Add the import:
```ts
import { MorphMachine } from './engine/morph';
```

Replace the field block
```ts
  // [Task 20] replaced by MorphMachine
  private entryDone = false;
```
with
```ts
  private readonly morph: MorphMachine;
  private readonly canvas: HTMLCanvasElement;
  private entryDone = false;
```

In the constructor, after `this.pointer = …`:
```ts
    this.canvas = opts.canvas;
    this.morph = new MorphMachine(this.params.morph, this.reduced);
```

In `applyParams()`, add:
```ts
    this.morph.setTimings(this.params.morph);
```

Replace the `requestCycle` stub with:
```ts
  /** Click, tap, debug button, or auto-tease: one scramble → `soon.` → scramble → name cycle (spec 3.5). */
  requestCycle(): boolean {
    return this.morph.requestCycle();
  }
```

Replace the empty `noteActivity` with:
```ts
  private noteActivity(): void {
    this.morph.pointerActivity();
  }
```

In `start()`, add:
```ts
    this.canvas.addEventListener('click', this.onClick);
```
and in `stop()`:
```ts
    this.canvas.removeEventListener('click', this.onClick);
```

In `onPointerDown`, after the `snap`/`move` branch and before `this.noteActivity();`:
```ts
    if (e.pointerType === 'touch') this.morph.requestCycle();
```
(The browser also synthesizes a `click` after a tap; the machine ignores it because a cycle is already running.)

Add the handler next to `onPointerEnd`:
```ts
  private onClick = (): void => {
    this.morph.requestCycle();
  };
```

In `frame`, replace the block between `this.simMs += dt;` and `this.field.setTime(this.simMs);` (the `[Task 20]` entry timer and its `setMorph` call) with:
```ts
    for (const event of this.morph.tick(dt)) {
      if (event === 'entryComplete') this.entryDone = true;
    }
    const snap = this.morph.snapshot();
    this.field.setMorph(snap.phase, snap.tMs, snap.durMs, snap.staggerMs);
```

- [ ] **Step 2: Typecheck, test, verify in the browser**

Run: `npm run typecheck && npm test && npm run dev`

DevTools MCP on `http://localhost:5173/?seed=7`:
1. Wait for the entry, `click` the centre of the name, then screenshots at +0.3 s (dots flying outward), +1.2 s (`soon.` legible, lowercase with the period), +4.5 s (scrambling back), +6 s (`PARSA NAJI` restored). Timings match spec 3.5 within a frame.
2. Click again during a cycle: nothing changes (ignored).
3. Reload and do not touch anything: at about 10 s (2 s entry + 8 s idle) the cycle runs by itself; it never runs a second time (watch 30 s).
4. Reload, move the mouse once over the canvas, wait 15 s: no auto-tease.
5. Touch: dispatch a touch `pointerdown` via `evaluate_script` → a cycle starts.
6. `emulate` `prefers-reduced-motion: reduce`, reload: name appears instantly; click → the field fades out, swaps to `soon.`, fades in, holds, fades, returns; no dots fly.
7. `http://localhost:5173/?debug`: the `trigger morph` button starts a cycle.
8. `list_console_messages`: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app.ts
git commit -m "feat: click/tap morph to soon., auto-tease once, reduced-motion crossfade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Adaptive quality, DPR changes, resize mid-cycle

**Files:**
- Modify: `src/app.ts`, `src/tweaks.ts`

**Interfaces:**
- Consumes: `FpsProbe`, `degradedCount`, `capDpr` (Task 10).
- Produces: `App.degraded: boolean`; the probe runs once after the entry; `layout()` refreshes the DPR; dev builds expose `window.__app` under `?debug` for inspection.

- [ ] **Step 1: Edit `src/app.ts`**

Extend the quality import:
```ts
import { FpsProbe, capDpr, degradedCount, dotCount } from './engine/quality';
```

Add fields after `entryDone`:
```ts
  private readonly probe: FpsProbe;
  private hasDegraded = false;
```

In the constructor, after `this.morph = …`:
```ts
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
```

Add a getter after `count`:
```ts
  get degraded(): boolean {
    return this.hasDegraded;
  }
```

In `layout()`, right after `this.field.setViewport(this.vw, this.vh);`:
```ts
    this.field.setDpr(capDpr(window.devicePixelRatio));
```

In `frame`, directly after the `for (const event of this.morph.tick(dt)) …` loop:
```ts
    if (this.entryDone && !this.probe.done && this.probe.push(dt) === 'degrade') {
      this.hasDegraded = true;
      this.setCount(degradedCount(this.n, this.params.probe.degradeFactor));
    }
```

- [ ] **Step 2: Expose the app in dev** — in `src/tweaks.ts`, first line inside `mount(params, app)`:

```ts
  (window as unknown as { __app: App }).__app = app;
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm test && npm run dev`

DevTools MCP on `http://localhost:5173/?debug&seed=7`:
1. Baseline: after 4 s, `evaluate_script` → `__app.count` (record it; expected roughly 12 000–20 000 at 1440×900) and `__app.degraded === false`.
2. `emulate` with CPU throttling 6× (20× if the GPU is strong), reload, wait 5 s: `__app.degraded === true` and `__app.count` is 60 % of the baseline (±1). Remove the throttling.
3. Resize mid-cycle: click to start a morph, immediately `resize_page` to 900×700: the cycle finishes against the re-laid-out targets, `soon.` and the name both land centred, no exception in `list_console_messages`.
4. Hidden tab: open a second page with `new_page`, wait 10 s, `select_page` back: the animation resumes without a jump cut (the morph phase advanced by at most one frame; vibration continuous).
5. DPR: `emulate` with `deviceScaleFactor: 3`, reload: dots stay crisp and `__app.field.renderer.getPixelRatio() === 2`.

- [ ] **Step 4: Commit, push, preview**

```bash
git add src/app.ts src/tweaks.ts
git commit -m "feat: fps probe with one-shot degrade, DPR refresh on layout, dev app handle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
npm run deploy:preview
```

Report the preview URL. Slice 4 complete; checkpoint the vault note and memory.

---
## Slice 5 — Polish and proof

### Task 22: Open Graph image from the real engine

**Files:**
- Modify: `src/main.ts` (`?og` still mode), `.gitignore`
- Create: `scripts/og-image.mjs`
- Replace: `public/og.png`

**Interfaces:**
- Produces: `?og` renders the name fully formed, no vibration, no breath, no ripple, no chrome, no cursor ring — a still frame. `npm run og` turns a 2400×1260 capture at `scripts/.cache/og-raw.png` into `public/og.png` (1200×630).

- [ ] **Step 1: Add the still mode to `src/main.ts`**

Inside `boot()`, right after `const params = cloneParams(DEFAULTS);` add:
```ts
  const still = query.has('og');
  if (still) {
    params.vibAmp = 0;
    params.breathAmp = 0;
    params.ripple.intervalMs = Number.MAX_SAFE_INTEGER;
    document.getElementById('chrome')?.setAttribute('hidden', '');
  }
```

Change the `reduced` line to:
```ts
  const reduced = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

And guard the cursor ring: change `if (cursorEl) initCursorRing(cursorEl);` to `if (cursorEl && !new URLSearchParams(location.search).has('og')) initCursorRing(cursorEl);` (the ring is initialized before `query` exists; keep the two lines where they are).

- [ ] **Step 2: Write `scripts/og-image.mjs` and ignore the cache folder**

```js
// Downscale the DevTools capture of /?og&seed=7 (2400×1260) to the 1200×630 Open Graph image. Run: npm run og
import { access } from 'node:fs/promises';
import sharp from 'sharp';

const input = 'scripts/.cache/og-raw.png';
await access(input).catch(() => {
  console.error(`missing ${input}: capture http://localhost:5173/?og&seed=7 at 1200x630, DPR 2, and save it there`);
  process.exit(1);
});
const meta = await sharp(input).metadata();
console.log(`input ${meta.width}x${meta.height}`);
await sharp(input).resize(1200, 630, { fit: 'cover', position: 'centre' }).png({ compressionLevel: 9 }).toFile('public/og.png');
const out = await sharp('public/og.png').metadata();
console.log(`public/og.png ${out.width}x${out.height}, ${((out.size ?? 0) / 1024).toFixed(0)} KB`);
```

Append to `.gitignore`:
```
scripts/.cache
```

- [ ] **Step 3: Capture and generate**

Run `npm run dev`. With the DevTools MCP: `emulate` `{ width: 1200, height: 630, deviceScaleFactor: 2 }` (or `resize_page` 1200×630 plus a DPR-2 emulation), `navigate_page` to `http://localhost:5173/?og&seed=7`, wait 1 s, `take_screenshot` (viewport only). Copy the saved PNG to `scripts/.cache/og-raw.png`, then:

Run: `npm run og`
Expected: `public/og.png 1200x630`, under 400 KB; open it: the dotted `PARSA NAJI` on the dark vignette, no chrome.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts scripts/og-image.mjs .gitignore public/og.png
git commit -m "feat: Open Graph image rendered from the particle engine (?og still mode)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: Lighthouse, performance trace, CSP, HSTS (effort: xhigh)

**Files:**
- Create: `scripts/cf-hsts.mjs`
- Modify as findings require: `src/styles.css`, `index.html`, `public/_headers`

**Interfaces:**
- Produces: Lighthouse >= 95 in Performance, Accessibility, Best Practices and SEO on the preview URL (mobile and desktop); a performance trace with no long task over 50 ms after the entry; zero CSP violations; HSTS on.

- [ ] **Step 1: Deploy the current state to preview**

Run: `npm run build && npm run deploy:preview`
Expected: `https://preview.parsanaji-com.pages.dev` serves the latest build.

- [ ] **Step 2: Lighthouse, both form factors**

DevTools MCP: `lighthouse_audit` on `https://preview.parsanaji-com.pages.dev/` with mobile emulation, then again with desktop. Record the four scores for each.

Known likely findings and the fix for each (apply only what the audit reports, then redeploy and re-audit):
- **Color contrast of the exit line / clock**: `--muted` ships at 0.5 (about 4.95:1 on `#070707`, already above the 4.5:1 audit floor). If the audit still flags it (sub-pixel rendering of 12 px text), raise `--muted` to `rgba(245, 245, 245, 0.56)` and record the value in the spec's section 12 (Task 26).
- **Font display**: the display face uses `font-display: block` on purpose (the sampler waits for it); this is a diagnostic, not a scored item. Leave it.
- **Unused JavaScript**: `three` is tree-shaken by the build; if the audit still flags more than 30 KB, confirm the import is `import * as THREE from 'three'` only in `ParticleField.ts` and no `three/examples` module is pulled in.
- **CSP evaluated as weak**: the policy already has `object-src 'none'` and `base-uri 'self'`; if the audit mentions `script-src` and the analytics host, that is expected and acceptable.
- **`<time>` without `datetime`**: add a `datetime` attribute update in `startClock` only if the audit flags it.

Expected after fixes: all four scores >= 95 on both form factors. Put the final numbers in the commit message.

- [ ] **Step 3: Performance trace**

DevTools MCP on the preview URL: `performance_start_trace` (reload on), wait for the entry, then `hover`/`drag` across the name for about 10 s, `performance_stop_trace`, `performance_analyze_insight` for long tasks and render-blocking. Expected: no long task over 50 ms after the first 2 s; LCP under 1.2 s on the simulated profile; CLS 0.

- [ ] **Step 4: CSP and headers on the live edge**

```bash
curl -sI https://preview.parsanaji-com.pages.dev/ | grep -i -E "content-security-policy|x-content-type|referrer-policy|permissions-policy|x-frame|cache-control"
```
Expected: every header from `public/_headers`. In the browser, `list_console_messages` after 20 s of interaction: no `Refused to …` CSP messages.

- [ ] **Step 5: HSTS**

`scripts/cf-hsts.mjs`:
```js
// Enable HSTS on the zone (6 months, no subdomains, no preload). Run: node scripts/cf-hsts.mjs
import { api, env, requireEnv } from './cf-api.mjs';

requireEnv('token', 'zoneId');
const result = await api('PATCH', `/zones/${env.zoneId}/settings/security_header`, {
  value: {
    strict_transport_security: { enabled: true, max_age: 15_552_000, include_subdomains: false, preload: false, nosniff: true },
  },
});
console.log(JSON.stringify(result.value, null, 2));
```

Run: `node scripts/cf-hsts.mjs && curl -sI https://parsanaji.com/ | grep -i strict-transport-security`
Expected: `strict-transport-security: max-age=15552000`.

- [ ] **Step 6: Commit**

```bash
git add scripts/cf-hsts.mjs src/styles.css index.html public/_headers
git commit -m "perf: Lighthouse >=95 x4 (mobile <scores>, desktop <scores>), HSTS on

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 24: Accessibility and fallback pass

**Files:**
- Modify only if a check fails: `index.html`, `src/styles.css`, `src/ui/*`

- [ ] **Step 1: Keyboard and semantics** (DevTools MCP on the preview URL)

1. `take_snapshot` (accessibility tree): a level-1 heading `Parsa Naji`, the paragraph `Building something new.`, links `github` and `say hi` (no `linkedin` while the URL is empty), the clock paragraph with its `aria-label`; the canvas absent from the tree.
2. `press_key` Tab twice: focus lands on `github`, then `say hi`; `take_screenshot` after each shows the 2 px focus ring and the underline. Enter on `github` opens the profile (then navigate back).
3. Zoom approximation: `evaluate_script` → `document.documentElement.style.zoom = '2'`: the exit line and clock stay inside the viewport without overlapping the name. Reset afterwards.

- [ ] **Step 2: No-JS and no-WebGL**

```bash
curl -s https://preview.parsanaji-com.pages.dev/ | grep -c "static-name"
```
Expected: 2 (the live static block and the `<noscript>` copy). Then `navigate_page` to `https://preview.parsanaji-com.pages.dev/?nowebgl`: the typographic page renders in Geist, chrome fades in after 2 s, no console errors.

- [ ] **Step 3: Reduced motion on the deployed build**

`emulate` `prefers-reduced-motion: reduce`, reload the preview: instant name, no vibration, click gives the crossfade, chrome visible immediately (the CSS animation delay is 0 in this mode).

- [ ] **Step 4: Fix anything that failed, re-verify, commit**

```bash
git add -A
git commit -m "a11y: keyboard, semantics and fallback fixes from the slice-5 pass

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
(Skip the commit if nothing changed.)

---

### Task 25: Finish gate, frozen defaults, production

**Files:**
- Modify: `src/engine/defaults.ts` (only values Parsa tuned), anything the finish gate flags

- [ ] **Step 1: Ask Parsa for tuned values**

Parsa opens `http://localhost:5173/?debug` (the orchestrator can run the dev server for him), tunes, presses `copy JSON`, and pastes the JSON into the conversation. If he has not tuned anything, the shipped defaults stay.

- [ ] **Step 2: Freeze them**

Apply only the differing values to `src/engine/defaults.ts` (keep the file's shape and comments). Run `npm test && npm run typecheck`.

- [ ] **Step 3: Run the UI finish gate**

Invoke the `anti-ui-slop` skill's finish gate and the `frontend-design` review against the preview URL with the spec open. Address every concrete finding (spacing, contrast, motion feel, copy casing); reject anything that adds color, icons, gradients, or a second typeface. Record what changed in the commit body.

- [ ] **Step 4: iPhone check (operator step 5)**

Parsa opens `https://preview.parsanaji-com.pages.dev` in Safari: tap morph, drag repel, no scroll bounce, no address-bar jump, clock correct, text sharp. Fix anything he reports; redeploy preview; repeat.

- [ ] **Step 5: Ship**

```bash
git add -A
git commit -m "release: teaser v1 - frozen defaults, finish-gate fixes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
gh run watch --exit-status
curl -sI https://parsanaji.com/ | head -3
```

Then one more `lighthouse_audit` on `https://parsanaji.com/` (mobile): all four >= 95. Screenshot the live page at 1440×900 and 390×844 for the record.

---

### Task 26: Documentation and closing checkpoint

**Files:**
- Modify: `docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md` (append section 12), `README.md`
- Orchestrator: vault note `Projects/parsanaji.com.md`, memory `parsanaji-com.md`, dashboard line

- [ ] **Step 1: Append "12. Shipped state" to the spec**

Record: live URL and date, final Lighthouse numbers (mobile and desktop), measured `N` at 1440×900 and 390×844, any value that differs from the spec tables (with the reason, e.g. muted contrast 0.56), the preview URL pattern, and the operator steps' status (GitHub CLI, token, email verified or not).

- [ ] **Step 2: README**

Add a "Tuning" section: `?debug` panel, `copy JSON`, where defaults live; and an "OG image" section pointing at `npm run og` and the `?og&seed=7` capture.

- [ ] **Step 3: Commit and push**

```bash
git add docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md README.md
git commit -m "docs: shipped state, tuning and OG recipes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 4: Orchestrator closes the loop**

Update the vault note (status: live, deploy recipe, gotchas met during the build, side quests still open), the memory file (one paragraph: live, where things are, what is next = full-site brainstorm), and the dashboard line. Tell Parsa: live URL, what to click, the three side quests waiting (GitHub rename, resume rebuild, LinkedIn).

---

## Spec coverage map

| Spec section | Task(s) |
|---|---|
| 1 Purpose, 1.3 success criteria | 14, 20, 23, 25 |
| 2 Scope | all; out-of-scope items untouched |
| 3.1 Layout, 3.2 Look | 3 (markup, CSS, fonts, favicon, OG placeholder), 11 (name width/stacking), 12 (dot look), 22 (real OG) |
| 3.3 Density | 10 (`dotCount`), 11 (sampler), 14 (`App.layout`) |
| 3.4 Coordinates | 12 (camera), 17 (`toWorld`) |
| 3.5 Entry / Idle | 12 (shader), 13 (breath, ripple), 14 (wiring) |
| 3.5 Pointer | 12 (shader repel), 16, 17 |
| 3.5 Morph / Auto-tease / Touch | 19, 20 |
| 3.5 Reduced motion | 3 (CSS), 12 (shader), 19, 20 |
| 3.5 Hidden tab | 9 (`clampDt`), 14 (visibility), 21 |
| 3.6 Adaptive quality | 10 (`FpsProbe`), 21 |
| 3.7 Resize | 14, 21 |
| 3.8 Fallbacks | 3 (`<noscript>`, static block), 14 (`hasWebGL2`, `waitForFont`), 24 |
| 3.9 Content | 3 (`content.ts`, markup) |
| 4 Architecture | 1 (toolchain), 9–21 (modules), 15 (debug panel) |
| 5 A11y / SEO | 3 (markup, JSON-LD), 24 |
| 6 Budget | 2 (fonts), 15 (bundle), 23 (Lighthouse, trace) |
| 7.1 Repo | 1, 4, 5 |
| 7.2 Pages | 5 (Actions), 6 |
| 7.3 Headers | 3, 23 |
| 7.4 Email | 7 |
| 7.5 Analytics | operator toggle (OPERATOR.md, Task 4) |
| 7.6 Operator steps | 4, 7, 25 |
| 8 Testing | every task's test/verify steps; 23–24 |
| 9 Slices | plan structure |
| 10 Open inputs | 3 (LinkedIn hidden), 26 |
