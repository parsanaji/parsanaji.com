## Slice 1 — Scaffold and go live

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/vite-env.d.ts`
- Test: `tests/env.test.ts`
- Create (added by the fix round 1 ruling): `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt` copied from the geist@1.7.2 package; `geist` itself is not installed (it peer-requires Next.js).

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `fonts`, `og:placeholder`, `og`, `deploy`, `deploy:preview` used by every later task.

- [ ] **Step 1: Initialize npm and install exact versions**

```bash
cd /c/Users/parsa/parsanaji.com
npm init -y >/dev/null
npm install --save-exact three@0.186.1
npm install --save-exact --save-dev vite@8.3.4 typescript@5.9.3 @types/three@0.186.0 @types/node@22 vitest@5.0.5 lil-gui@0.21.0 subset-font@2.9.0 sharp@0.35.5 wrangler@4.151.0
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
- Consumes: `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt` (vendored in Task 1 from geist@1.7.2 after a review ruling; the `geist` npm package is not a dependency because it peer-requires Next.js. Refresh later with `npm pack geist@<version>` and copy from the tarball `package/dist/fonts/`.)
- Create (generated, committed): `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2`, `public/fonts/LICENSE.txt`

**Interfaces:**
- Produces: the two font URLs `/fonts/GeistSans-Black.subset.woff2` and `/fonts/GeistMono-Regular.subset.woff2` referenced by `src/styles.css` and `index.html` (Task 3). Display subset covers `A–Z a–z . space`; mono subset covers printable ASCII plus `·` (U+00B7).

- [ ] **Step 1: Write `scripts/subset-fonts.mjs`**

```js
// Generates the two self-hosted font subsets from the vendored Geist sources in scripts/fonts-src/ (SIL OFL 1.1).
// Run: node scripts/subset-fonts.mjs   (also: npm run fonts)
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

const srcDir = path.resolve('scripts/fonts-src');
const outDir = path.resolve('public/fonts');

const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const DISPLAY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. ';
const MONO_CHARS = `${ASCII}·`;

const jobs = [
  { src: 'Geist-Black.woff2', out: 'GeistSans-Black.subset.woff2', text: DISPLAY_CHARS },
  { src: 'GeistMono-Regular.woff2', out: 'GeistMono-Regular.subset.woff2', text: MONO_CHARS },
];

await mkdir(outDir, { recursive: true });
// OFL 1.1 condition 2: the license travels with every redistributed copy, subsets included.
await copyFile(path.join(srcDir, 'LICENSE.txt'), path.join(outDir, 'LICENSE.txt'));
let total = 0;
for (const job of jobs) {
  const input = await readFile(path.join(srcDir, job.src));
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
Expected: two files written, each well under 20 KB, `total:` under 40 KB, exit 0. If `subset-font` rejects the `.woff2` input, fetch the `.ttf` siblings without installing the package: run `npm pack geist@1.7.2`, extract `package/dist/fonts/geist-sans/Geist-Black.ttf` and `package/dist/fonts/geist-mono/GeistMono-Regular.ttf` into `scripts/fonts-src/`, point both `src` names at them, delete the tarball, and rerun.

- [ ] **Step 3: Confirm the files exist**

Run: `ls -la public/fonts`
Expected: both `.subset.woff2` files listed with non-zero sizes, plus `LICENSE.txt` (the SIL OFL 1.1 text copied from `scripts/fonts-src/`, served at `/fonts/LICENSE.txt` because subset fonts are Modified Versions under OFL condition 2).

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
        <span class="tagline">building something new</span>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://github.com/parsanaji" rel="me noopener">github</a>
        <span id="linkedin-sep" class="sep" aria-hidden="true" hidden>·</span>
        <a id="linkedin" href="#" rel="me noopener" hidden>linkedin</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="mailto:info@parsanaji.com">say hi</a>
      </p>
      <p id="clock" class="clock" aria-label="Local time in Irvine, California" hidden>
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
.clock[hidden] { display: none; } /* no JavaScript, no clock (spec 5); main.ts un-hides it */
.clock time { font-variant-numeric: tabular-nums; }

/* Narrow viewports: one row cannot hold the exit line and the clock, so the chrome stacks
   (tagline, then the links, then the clock right-aligned) and nothing is clipped. */
@media (max-width: 679px) {
  .chrome { flex-direction: column; align-items: flex-start; gap: 10px; }
  .exit { flex-wrap: wrap; row-gap: 6px; }
  .exit .tagline { flex-basis: 100%; }
  .exit .tagline + .sep { display: none; }
  .clock { align-self: flex-end; }
}

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
  const clockEl = document.getElementById('clock');
  if (timeEl && zoneEl && clockEl) {
    startClock(timeEl, zoneEl, CONTENT.clock.timeZone);
    clockEl.hidden = false; // no JavaScript, no clock (spec 5)
  }
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
