### Task 6: Stylesheet: tokens, layouts and states

**Files:** Modify `src/styles.css` (full rewrite, in the 4.6.3 order: the 4.6.4 `@property` block and `html.theme-anim`; Appendix B §1.1 token blocks without `--bg-scrim` and `--copied`; Appendix C §2 with the replacements of 3.1.13 (band block under `BAND_QUERY`), 3.1.16 (toggle CSS), 3.3.7.8 (`touch-action: auto`), 3.4.7 (entry hooks) and 3.6.4 (reduced-motion block, after the entry hooks), plus `image-rendering: pixelated` on `.field` (4.5.9)); Create `tests/tokens.test.ts`.

**Interfaces:**
- Consumes: Task 5 DOM contract; Task 2 font files.
- Produces (CSS contract the scripts rely on):
  - `html.no-webgl` hides `.field` and `.scrim`; in the band layout the rail's bottom padding becomes `40px + env(safe-area-inset-bottom, 0px)`.
  - `html.theme-anim` transitions the twelve registered tokens over 300 ms linear.
  - `.field` is `opacity: 0` until `html[data-field-ready]`, which fades it in over 400 ms linear.
  - The 3.4.7 entry block for `html[data-entry="run" | "wait" | "scrim" | "reveal" | "skip"]`, the 4000 ms `pn-failsafe` animation on `run`, and `--i` per `[data-reveal]`.
  - `a[data-copied]` swaps `say hi` for `copied` in the same cell with the brackets suppressed; `.theme-toggle[hidden] { display: none; }`.
  - Unregistered `--field-0..3` (6-digit hex) and `--theme-color` readable through `getComputedStyle(document.documentElement)`.
  - The band layout's media query is the literal `(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)` (exported as `BAND_QUERY` by Task 9).

- [ ] **Step 1: Write the failing test**

Full file `tests/tokens.test.ts` (spec 8.1.10, 3.2.1, 4.6.4; the layout cases pin the replacements this task makes):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// src/styles.css is the single source of both looks (spec 3.2.1, 4.6.3, 4.6.4, 8.1.10).
const CSS = readFileSync('src/styles.css', 'utf8').replace(/\r\n/g, '\n');

/** Declarations of the first rule whose text starts with `opener` (custom properties and color-scheme). */
function block(opener: string): Record<string, string> {
  const start = CSS.indexOf(opener);
  expect(start, `missing ${opener}`).toBeGreaterThanOrEqual(0);
  const body = CSS.slice(CSS.indexOf('{', start) + 1, CSS.indexOf('}', start));
  const decls: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+|color-scheme):\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
  return decls;
}

const DARK_BLOCK = ':root {\n  color-scheme: dark;';
const LIGHT_MEDIA_BLOCK = '@media (prefers-color-scheme: light) {\n  :root:not([data-theme="dark"]) {';
const LIGHT_FORCED_BLOCK = ':root[data-theme="light"] {';

// 3.2.1, verbatim.
const DARK = {
  'color-scheme': 'dark',
  '--bg': '#050a22',
  '--scrim-solid': 'rgb(5 10 34 / 1)',
  '--scrim-mid': 'rgb(5 10 34 / 0.86)',
  '--scrim-clear': 'rgb(5 10 34 / 0)',
  '--fg': '#e8eeff',
  '--fg-2': '#7993da',
  '--accent': '#8db0ff',
  '--accent-2': '#5b81ff',
  '--accent-glow': 'rgb(141 176 255 / 0.35)',
  '--line': 'rgb(232 238 255 / 0.14)',
  '--field-0': '#050a22',
  '--field-1': '#3b5df0',
  '--field-2': '#8db0ff',
  '--field-3': '#e8eeff',
  '--focus-ring': 'var(--accent)',
  '--status-dot': 'var(--accent)',
  '--selection-bg': '#3b5df0',
  '--selection-fg': '#ffffff',
  '--overlay-bg': 'rgb(5 10 34 / 0.94)',
  '--overlay-border': 'rgb(232 238 255 / 0.18)',
  '--theme-color': '#050a22',
};
const LIGHT = {
  'color-scheme': 'light',
  '--bg': '#f2f6fe',
  '--scrim-solid': 'rgb(242 246 254 / 1)',
  '--scrim-mid': 'rgb(242 246 254 / 0.86)',
  '--scrim-clear': 'rgb(242 246 254 / 0)',
  '--fg': '#071348',
  '--fg-2': '#445789',
  '--accent': '#2848d7',
  '--accent-2': '#3656e8',
  '--accent-glow': 'rgb(40 72 215 / 0.25)',
  '--line': 'rgb(7 19 72 / 0.14)',
  '--field-0': '#f2f6fe',
  '--field-1': '#8db0ff',
  '--field-2': '#3b5df0',
  '--field-3': '#0832b8',
  '--selection-bg': '#3b5df0',
  '--selection-fg': '#ffffff',
  '--overlay-bg': 'rgb(242 246 254 / 0.95)',
  '--overlay-border': 'rgb(7 19 72 / 0.18)',
  '--theme-color': '#f2f6fe',
};

const REGISTERED = [
  ['--bg', '#050a22'],
  ['--fg', '#e8eeff'],
  ['--fg-2', '#7993da'],
  ['--accent', '#8db0ff'],
  ['--accent-2', '#5b81ff'],
  ['--accent-glow', 'rgb(141 176 255 / 0.35)'],
  ['--line', 'rgb(232 238 255 / 0.14)'],
  ['--scrim-solid', 'rgb(5 10 34 / 1)'],
  ['--scrim-mid', 'rgb(5 10 34 / 0.86)'],
  ['--scrim-clear', 'rgb(5 10 34 / 0)'],
  ['--overlay-bg', 'rgb(5 10 34 / 0.94)'],
  ['--overlay-border', 'rgb(232 238 255 / 0.18)'],
];

describe('colour tokens (3.2.1)', () => {
  it('the dark base carries exactly the dark column', () => {
    expect(block(DARK_BLOCK)).toEqual(DARK);
  });

  it('both light blocks carry exactly the light column', () => {
    expect(block(LIGHT_MEDIA_BLOCK)).toEqual(LIGHT);
    expect(block(LIGHT_FORCED_BLOCK)).toEqual(LIGHT);
  });

  it('--field-0..3 are 6-digit hex in all three blocks, light --field-3 is #0832b8', () => {
    for (const opener of [DARK_BLOCK, LIGHT_MEDIA_BLOCK, LIGHT_FORCED_BLOCK]) {
      const b = block(opener);
      for (const k of ['--field-0', '--field-1', '--field-2', '--field-3']) expect(b[k]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(block(LIGHT_FORCED_BLOCK)['--field-3']).toBe('#0832b8');
  });

  it('has no --bg-scrim and no --copied (ledger ruling D5; "copied" is --accent-2)', () => {
    expect(CSS).not.toContain('--bg-scrim');
    expect(CSS).not.toContain('--copied');
  });

  it('keeps --line-strong as Appendix C writes it', () => {
    expect(CSS).toContain('--line-strong: color-mix(in srgb, var(--fg) 28%, transparent);');
  });
});

describe('registered tokens and the crossfade (4.6.4)', () => {
  it('registers exactly the twelve literal-valued colour tokens with their dark initial values', () => {
    const rules = [...CSS.matchAll(/@property (--[\w-]+) \{ syntax: '([^']+)'; inherits: (\w+); initial-value: ([^;]+); \}/g)];
    expect(rules.map((m) => [m[1], m[4]])).toEqual(REGISTERED);
    for (const m of rules) {
      expect(m[2]).toBe('<color>');
      expect(m[3]).toBe('true');
    }
    expect(CSS.match(/@property /g)).toHaveLength(12);
  });

  it('leaves --field-0..3, --theme-color and the aliases unregistered', () => {
    for (const k of ['--field-0', '--field-1', '--field-2', '--field-3', '--theme-color', '--focus-ring', '--status-dot', '--line-strong']) {
      expect(CSS).not.toContain(`@property ${k} `);
    }
  });

  it('html.theme-anim transitions the twelve tokens over 300 ms linear', () => {
    const rule = CSS.slice(CSS.indexOf('html.theme-anim {'), CSS.indexOf('}', CSS.indexOf('html.theme-anim {')));
    expect([...rule.matchAll(/(--[\w-]+) 300ms linear/g)].map((m) => m[1])).toEqual(REGISTERED.map(([k]) => k));
  });
});

describe('layout contract (3.1.1, 3.4.7, 3.6.4, 3.3.7.8, 4.5.9)', () => {
  it('applies the band layout under BAND_QUERY, verbatim', () => {
    expect(CSS).toContain('@media (max-width: 719.98px), not all and (min-aspect-ratio: 1/1) {');
    expect(CSS).not.toContain('@media (max-width: 719.98px) {');
  });

  it('keeps touch-action auto on the band canvas and pixelated cells', () => {
    expect(CSS).not.toContain('pan-y');
    expect(CSS).toContain('touch-action: auto;');
    expect(CSS).toContain('image-rendering: pixelated;');
  });

  it('hides the field and scrim under html.no-webgl and the toggle while hidden', () => {
    expect(CSS).toContain('html.no-webgl .field,\nhtml.no-webgl .scrim { display: none; }');
    expect(CSS).toContain('.theme-toggle[hidden] { display: none; }');
    expect(CSS).not.toMatch(/aria-pressed|theme-glyph/);
  });

  it('has the 3.4.7 entry block with the 4 s failsafe and no stale data-entry="in" state', () => {
    expect(CSS).toContain('html[data-field-ready] .field { opacity: 1; transition: opacity 400ms linear; }');
    expect(CSS).toContain('html[data-entry="run"] .scrim { animation: pn-failsafe 1ms linear 4000ms forwards; }');
    expect(CSS).toContain('@keyframes pn-failsafe { to { opacity: 1; transform: none; } }');
    expect(CSS).toContain('[data-reveal="7"] { --i: 7; }');
    expect(CSS).not.toContain('data-entry="in"');
    expect(CSS).not.toContain('[data-reveal="8"]');
  });

  it('puts the 3.6.4 reduced-motion block after the 3.4.7 entry block', () => {
    const entry = CSS.indexOf('html[data-entry="reveal"] [data-reveal] {');
    const reduced = CSS.indexOf('@media (prefers-reduced-motion: reduce) {');
    expect(entry).toBeGreaterThan(0);
    expect(reduced).toBeGreaterThan(entry);
    expect(CSS.match(/@media \(prefers-reduced-motion: reduce\)/g)).toHaveLength(1);
    expect(CSS).toContain(
      'html[data-entry] .scrim { opacity: 1; transform: none; transition: none; animation: none; pointer-events: auto; }',
    );
  });

  it('declares JetBrains Mono 400 and 700 with font-display swap and no ligatures in prose (4.11.4, 3.1.8)', () => {
    expect(CSS).toContain('src: url("/fonts/JetBrainsMono-Regular.subset.woff2") format("woff2");');
    expect(CSS).toContain('src: url("/fonts/JetBrainsMono-Bold.subset.woff2") format("woff2");');
    expect(CSS.match(/font-display: swap;/g)).toHaveLength(2);
    expect(CSS).toContain('font-variant-ligatures: none;');
    expect(CSS).not.toMatch(/Geist/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/tokens.test.ts`

Expected: FAIL, `Tests  12 failed | 2 passed (14)` against the teaser stylesheet (for example `AssertionError: missing :root {\n  color-scheme: dark;`; only "has no --bg-scrim and no --copied" and "leaves --field-0..3 … unregistered" already hold).

- [ ] **Step 3: Rewrite the stylesheet (spec 4.6.3 order; 3.1.7–3.1.11, 3.1.13–3.1.16, 3.2.1, 3.2.4, 3.3.7.8, 3.4.7, 3.5.1, 3.5.2, 3.5.5, 3.5.8, 3.5.9, 3.6.4–3.6.6, 4.5.9, 4.6.4, 4.11.4)**

Section 1 is 4.6.4 verbatim. Section 2 is Appendix B §1.1 verbatim without the `--bg-scrim` and `--copied` lines (both light blocks too). Section 3 is Appendix C §2 verbatim with exactly these replacements: the "theme toggle" block becomes the 3.1.16 CSS; the "entry hooks" block becomes the 3.4.7 CSS; the motion block becomes the 3.6.4 CSS (after the entry hooks); the phone block's media query becomes `BAND_QUERY` (3.1.13) and its `touch-action: pan-y` becomes `touch-action: auto` (3.3.7.8); `.field` gains `image-rendering: pixelated` (4.5.9). Comments are reworded where they named the retired pieces. Full file `src/styles.css`:

```css
/* =====================================================================
   parsanaji.com — résumé screen stylesheet (spec 4.6.3 order):
   1. registered colour tokens and the theme crossfade (4.6.4)
   2. Dither Blue tokens, dark base + daylight (3.2.1, Appendix B §1.1)
   3. layout and type (Appendix C §2 with the replacements of 3.1.13,
      3.1.16, 3.3.7.8, 3.4.7 and 3.6.4, plus 4.5.9)
   State lives in classes and data-* attributes on <html>; scripts never
   write inline styles (CSP style-src 'self', 4.6.1).
   ===================================================================== */

/* ---------- 1. registered tokens: CSS interpolates them in sRGB over 300 ms (4.6.4) ---------- */
@property --bg { syntax: '<color>'; inherits: true; initial-value: #050a22; }
@property --fg { syntax: '<color>'; inherits: true; initial-value: #e8eeff; }
@property --fg-2 { syntax: '<color>'; inherits: true; initial-value: #7993da; }
@property --accent { syntax: '<color>'; inherits: true; initial-value: #8db0ff; }
@property --accent-2 { syntax: '<color>'; inherits: true; initial-value: #5b81ff; }
@property --accent-glow { syntax: '<color>'; inherits: true; initial-value: rgb(141 176 255 / 0.35); }
@property --line { syntax: '<color>'; inherits: true; initial-value: rgb(232 238 255 / 0.14); }
@property --scrim-solid { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 1); }
@property --scrim-mid { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 0.86); }
@property --scrim-clear { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 0); }
@property --overlay-bg { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 0.94); }
@property --overlay-border { syntax: '<color>'; inherits: true; initial-value: rgb(232 238 255 / 0.18); }
html.theme-anim {
  transition: --bg 300ms linear, --fg 300ms linear, --fg-2 300ms linear, --accent 300ms linear,
    --accent-2 300ms linear, --accent-glow 300ms linear, --line 300ms linear, --scrim-solid 300ms linear,
    --scrim-mid 300ms linear, --scrim-clear 300ms linear, --overlay-bg 300ms linear, --overlay-border 300ms linear;
}

/* ---------- 2. Dither Blue tokens (3.2.1). Dark is the base; light follows the OS unless the
   toggle forced dark, and again when the toggle forces light. --field-0..3 and --theme-color stay
   unregistered so getComputedStyle returns the target hex at once (4.6.4, 3.3.12). ---------- */
:root {
  color-scheme: dark;
  --bg: #050a22;
  --scrim-solid: rgb(5 10 34 / 1);
  --scrim-mid: rgb(5 10 34 / 0.86);
  --scrim-clear: rgb(5 10 34 / 0);
  --fg: #e8eeff;
  --fg-2: #7993da;
  --accent: #8db0ff;
  --accent-2: #5b81ff;
  --accent-glow: rgb(141 176 255 / 0.35);
  --line: rgb(232 238 255 / 0.14);
  --field-0: #050a22;
  --field-1: #3b5df0;
  --field-2: #8db0ff;
  --field-3: #e8eeff;
  --focus-ring: var(--accent);
  --status-dot: var(--accent);
  --selection-bg: #3b5df0;
  --selection-fg: #ffffff;
  --overlay-bg: rgb(5 10 34 / 0.94);
  --overlay-border: rgb(232 238 255 / 0.18);
  --theme-color: #050a22;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --bg: #f2f6fe;
    --scrim-solid: rgb(242 246 254 / 1);
    --scrim-mid: rgb(242 246 254 / 0.86);
    --scrim-clear: rgb(242 246 254 / 0);
    --fg: #071348;
    --fg-2: #445789;
    --accent: #2848d7;
    --accent-2: #3656e8;
    --accent-glow: rgb(40 72 215 / 0.25);
    --line: rgb(7 19 72 / 0.14);
    --field-0: #f2f6fe;
    --field-1: #8db0ff;
    --field-2: #3b5df0;
    --field-3: #0832b8;
    --selection-bg: #3b5df0;
    --selection-fg: #ffffff;
    --overlay-bg: rgb(242 246 254 / 0.95);
    --overlay-border: rgb(7 19 72 / 0.18);
    --theme-color: #f2f6fe;
  }
}
:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f2f6fe;
  --scrim-solid: rgb(242 246 254 / 1);
  --scrim-mid: rgb(242 246 254 / 0.86);
  --scrim-clear: rgb(242 246 254 / 0);
  --fg: #071348;
  --fg-2: #445789;
  --accent: #2848d7;
  --accent-2: #3656e8;
  --accent-glow: rgb(40 72 215 / 0.25);
  --line: rgb(7 19 72 / 0.14);
  --field-0: #f2f6fe;
  --field-1: #8db0ff;
  --field-2: #3b5df0;
  --field-3: #0832b8;
  --selection-bg: #3b5df0;
  --selection-fg: #ffffff;
  --overlay-bg: rgb(242 246 254 / 0.95);
  --overlay-border: rgb(7 19 72 / 0.18);
  --theme-color: #f2f6fe;
}
::selection { background: var(--selection-bg); color: var(--selection-fg); }

/* ---------- 3. layout and type (Appendix C §2) ---------- */

/* Fonts: JetBrains Mono 400 and 700, self-hosted subsets (4.11.4) */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/JetBrainsMono-Regular.subset.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/JetBrainsMono-Bold.subset.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Derived tokens at zero specificity, so the :root token values above win. */
:where(:root) {
  --line: color-mix(in srgb, var(--fg) 14%, transparent);
  --line-strong: color-mix(in srgb, var(--fg) 28%, transparent);
  --overlay-border: var(--line-strong);
  --overlay-bg: var(--scrim-mid);
  --focus-ring: var(--accent);
  --status-dot: var(--accent);
  --accent-glow: color-mix(in srgb, var(--accent) 35%, transparent);
}

:root {
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* fluid driver: the smaller of 1vw and 1.6vh (1.6vh = 1vw at 16:10) */
  --k: min(1vw, 1.6vh);

  /* type scale (desktop + tablet rail, 3.1.7) */
  --fs-name:    clamp(40px, calc(var(--k) * 5.2), 104px);
  --fs-tag:     clamp(14px, calc(var(--k) * 1.12), 21px);
  --fs-body:    clamp(13px, var(--k), 18px);
  --fs-when:    clamp(12px, calc(var(--k) * 0.86), 16px);
  --fs-eyebrow: clamp(11px, calc(var(--k) * 0.78), 14px);
  --fs-misc:    clamp(12.5px, calc(var(--k) * 0.94), 17px);
  --fs-link:    clamp(13px, var(--k), 18px);
  --fs-meta:    clamp(11px, calc(var(--k) * 0.8), 14.5px);

  /* geometry */
  --gutter:  clamp(24px, 4vw, 96px);
  --pad-y:   clamp(24px, 5.2vh, 72px);
  --rail-w:  min(calc(44 * var(--fs-body)), calc(100vw - 2 * var(--gutter)));
  --ramp:    clamp(160px, 18vw, 440px);

  /* vertical rhythm */
  --gap-tag:     clamp(6px, 1.2vh, 14px);   /* name → tagline */
  --gap-block:   clamp(14px, 3vh, 40px);    /* between top blocks */
  --gap-eyebrow: clamp(4px, 0.9vh, 12px);   /* eyebrow → rows */
  --row-pad:     clamp(3px, 0.55vh, 8px);   /* row padding, each side */
  --gap-foot:    clamp(10px, 2vh, 24px);    /* misc → links */
  --gap-meta:    clamp(6px, 1.1vh, 14px);   /* links → status → place */

  --toggle: clamp(40px, calc(var(--k) * 2.6), 52px);
  --when-w: calc(var(--fs-when) * 6.9);   /* 11.5ch of JetBrains Mono (advance 0.6em) at the when size */
}

*, *::before, *::after { box-sizing: border-box; }

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  background: var(--bg);
}
body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  line-height: 1.45;
  font-synthesis: none;
  font-variant-ligatures: none;   /* JetBrains Mono code ligatures off for prose */
  font-kerning: none;
  cursor: default;
  overflow-x: clip;
}
h1, h2, p, ul, ol, dl, dd { margin: 0; }
ul, ol { padding: 0; list-style: none; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* ---------- field + scrim ---------- */
.field {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
  image-rendering: pixelated;       /* crisp cells at DPR 3 (4.5.9) */
}
.scrim {
  --scrim-r: calc(var(--gutter) + var(--rail-w));
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(var(--scrim-r) + var(--ramp));
  z-index: 1;
  pointer-events: none;
  /* alpha: 1 → (mid-rail) 1 → (rail edge, >= text edge) 0.86 → eased → 0 at rail edge + ramp (3.1.10) */
  background: linear-gradient(90deg,
    var(--scrim-solid) 0,
    var(--scrim-solid) calc(var(--gutter) + var(--rail-w) * 0.5),
    var(--scrim-mid) var(--scrim-r),
    var(--scrim-clear) 100%);
  background: linear-gradient(90deg,
    var(--scrim-solid) 0,
    var(--scrim-solid) calc(var(--gutter) + var(--rail-w) * 0.5),
    var(--scrim-mid) var(--scrim-r),
    color-mix(in srgb, var(--scrim-solid) 70%, transparent) calc(var(--scrim-r) + var(--ramp) * 0.25),
    color-mix(in srgb, var(--scrim-solid) 42%, transparent) calc(var(--scrim-r) + var(--ramp) * 0.5),
    color-mix(in srgb, var(--scrim-solid) 16%, transparent) calc(var(--scrim-r) + var(--ramp) * 0.75),
    var(--scrim-clear) 100%);
}
html.no-webgl .field,
html.no-webgl .scrim { display: none; }

/* ---------- rail (desktop + tablet) ---------- */
.rail {
  position: relative;               /* never transform/filter/contain this: the toggle is position:fixed inside it */
  z-index: 2;
  width: calc(var(--gutter) + var(--rail-w));
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--pad-y) 0 var(--pad-y) var(--gutter);
  display: flex;
  flex-direction: column;
}
.rail > * { flex-shrink: 0; }
.rail > * + * { margin-top: var(--gap-block); }

.intro { display: flex; flex-direction: column; gap: var(--gap-tag); }
.name {
  font-size: var(--fs-name);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025em;
  margin-left: -0.045em;            /* optical: pull the P stem onto the rail edge */
  white-space: nowrap;
  cursor: default;
}
.tagline {
  font-size: var(--fs-tag);
  line-height: 1.4;
  color: var(--fg-2);
  text-wrap: pretty;
}

/* section blocks */
.block { display: flex; flex-direction: column; gap: var(--gap-eyebrow); }
.eyebrow {
  display: flex;
  align-items: center;
  gap: 1em;
  font-size: var(--fs-eyebrow);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-2);
}
.eyebrow::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--line);
}

/* rows: fixed "when" column (11.5ch of the when face = "2025 — 2026" + air) */
.row {
  display: grid;
  grid-template-columns: var(--when-w) minmax(0, 1fr);
  column-gap: 1.1em;
  align-items: baseline;
  padding-block: var(--row-pad);
  font-size: var(--fs-body);
  line-height: 1.45;
}
.row + .row { border-top: 1px solid var(--line); }
.when {
  font-size: var(--fs-when);
  color: var(--fg-2);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.what { grid-column: 2; min-width: 0; color: var(--fg); }
.sub { color: var(--fg-2); }
.sub::before {
  content: "· ";
  content: "· " / "";
}
.rows--compact .row { padding-block: calc(var(--row-pad) * 0.5); border-top: 0; }
.pname { color: var(--fg); }

/* misc: wrapping tags, dot separators clipped at line starts */
.block--misc { overflow: hidden; overflow: clip; }
.rail > .block--edu  { margin-bottom: var(--gap-block); }   /* minimum gap above the bottom group */
.rail > .block--misc { margin-top: auto; }                   /* bottom group pins to the rail bottom */
.tags {
  --sep: 2.4ch;
  display: flex;
  flex-wrap: wrap;
  row-gap: 0.15em;
  margin-left: calc(-1 * var(--sep));
  font-size: var(--fs-misc);
  line-height: 1.5;
  color: var(--fg-2);
}
.tags li {
  position: relative;
  padding-left: var(--sep);
  white-space: nowrap;
}
.tags li::before {
  content: "·";
  content: "·" / "";
  position: absolute;
  left: 0;
  width: var(--sep);
  text-align: center;
  opacity: 0.6;
}

/* bottom group rhythm */
.rail > .links  { margin-top: var(--gap-foot); }
.rail > .status { margin-top: var(--gap-meta); }
.rail > .place  { margin-top: var(--gap-meta); }

/* links row + bracket hover (brackets hang outside the box: zero layout shift, 3.5.1) */
.links ul {
  display: flex;
  flex-wrap: wrap;
  column-gap: 4ch;                  /* ≥ 2 × "[ " so two lit links never collide */
  row-gap: 0.4em;
  font-size: var(--fs-link);
  line-height: 1.45;
}
.lnk {
  --hit: 0.3em;
  position: relative;
  display: inline-block;
  padding-block: var(--hit);
  margin-block: calc(-1 * var(--hit));   /* taller hit area, same line box */
  color: var(--fg);                 /* at rest: fg, as on the owner's card */
  background: none;
  border: 0;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
.lnk::before,
.lnk::after {
  position: absolute;
  top: var(--hit);
  color: var(--accent-2);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.lnk::before { content: "["; content: "[" / ""; right: 100%; padding-right: 1ch; }
.lnk::after  { content: "]"; content: "]" / ""; left: 100%;  padding-left: 1ch; }
.lnk:hover,
.lnk:focus-visible { color: var(--accent-2); }
.lnk:hover::before, .lnk:hover::after,
.lnk:focus-visible::before, .lnk:focus-visible::after { opacity: 1; }
.lnk:focus { outline: none; }
.lnk:focus-visible {                /* brackets + a 1 px underline: two cues, neither colour-only (3.5.2) */
  text-decoration: underline 1px;
  text-underline-offset: 0.35em;
  text-decoration-color: var(--focus-ring);
}

/* "say hi" ⇄ "copied": both labels share one grid cell (6ch each), nothing moves.
   Copied = plain --accent-2 text in place of the label for 1.2 s (no brackets, 3.5.3). */
.swap { display: inline-grid; }
.swap > * { grid-area: 1 / 1; }
.swap-alt { visibility: hidden; color: var(--accent-2); }
.lnk[data-copied] .swap-main { visibility: hidden; }
.lnk[data-copied] .swap-alt  { visibility: visible; }
.lnk[data-copied]::before,
.lnk[data-copied]::after { opacity: 0; }

/* status + place (3.5.8) */
.status,
.place {
  font-size: var(--fs-meta);
  line-height: 1.4;
  color: var(--fg-2);
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
.status {
  display: flex;
  align-items: center;
  gap: 0.75em;
  letter-spacing: 0.08em;
  color: var(--accent-2);           /* palette usage map; sits in the solid scrim zone */
}
.place { letter-spacing: 0.06em; }
.dot {
  position: relative;
  flex: none;
  width: 0.62em;
  height: 0.62em;
  border-radius: 50%;
  background: var(--status-dot);
}
.dot::after {                       /* compositor-only halo: transform + opacity */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--accent-glow);
  animation: dot-pulse 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
}
@keyframes dot-pulse {
  0%   { transform: scale(1);   opacity: 1; }
  70%  { transform: scale(2.8); opacity: 0; }
  100% { transform: scale(2.8); opacity: 0; }
}

/* ---------- theme toggle: the target-look word on a chip, top-right on the name's line (3.1.16) ---------- */
.theme-toggle {
  position: fixed;
  z-index: 3;
  top: calc(var(--pad-y) + var(--fs-name) / 2 - var(--toggle) / 2);
  right: max(var(--gutter), env(safe-area-inset-right, 0px));
  min-height: var(--toggle);
  display: inline-grid;
  place-items: center;
  padding: 0 2.5ch;
  margin: 0;
  border: 1px solid var(--overlay-border);
  border-radius: 4px;
  background: var(--overlay-bg);
  color: var(--fg);
  font: inherit;
  font-size: var(--fs-link);
  line-height: 1.45;
  cursor: pointer;
}
.theme-toggle[hidden] { display: none; }
.theme-toggle:focus { outline: none; }
.theme-word {
  position: relative;
  display: inline-block;
  min-width: 5ch;                   /* "light" is 5ch: both words occupy the same box, nothing moves */
  text-align: center;
  transition: color 0.15s ease;
}
.theme-word::before,
.theme-word::after {
  position: absolute;
  top: 0;
  color: var(--accent-2);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.theme-word::before { content: "["; content: "[" / ""; right: 100%; padding-right: 1ch; }
.theme-word::after  { content: "]"; content: "]" / ""; left: 100%;  padding-left: 1ch; }
.theme-toggle:hover .theme-word,
.theme-toggle:focus-visible .theme-word { color: var(--accent-2); }
.theme-toggle:hover .theme-word::before, .theme-toggle:hover .theme-word::after,
.theme-toggle:focus-visible .theme-word::before, .theme-toggle:focus-visible .theme-word::after { opacity: 1; }
.theme-toggle:focus-visible .theme-word {
  text-decoration: underline 1px;
  text-underline-offset: 0.35em;
  text-decoration-color: var(--focus-ring);
}

/* ---------- "?" shortcuts overlay (native modal <dialog>, 3.5.5) ---------- */
.keys {
  width: min(24rem, calc(100vw - 32px));
  padding: 20px 22px 18px;
  border: 1px solid var(--overlay-border);
  border-radius: 4px;
  background: var(--overlay-bg);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  line-height: 1.45;
  opacity: 1;
  transition: opacity 0.15s ease, overlay 0.15s allow-discrete, display 0.15s allow-discrete;
}
.keys:not([open]) { opacity: 0; }
@starting-style { .keys[open] { opacity: 0; } }
.keys::backdrop { background: color-mix(in srgb, var(--bg) 60%, transparent); }
.keys .eyebrow { margin-bottom: 14px; }
.keys-list { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; align-items: baseline; }
.keys-list > div { display: contents; }
.keys-list > div[hidden] { display: none; }
.keys-list dd { color: var(--fg-2); }
.keys kbd {
  display: inline-block;
  min-width: 3ch;
  padding: 0 0.6ch;
  border: 1px solid var(--line-strong);
  border-radius: 3px;
  font: inherit;
  font-size: var(--fs-when);
  line-height: 1.6;
  text-align: center;
  color: var(--fg);
}
.keys-close {
  margin-top: 16px;
  margin-left: 2ch;                 /* room for the hanging "[" */
  padding: 0.3em 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--fs-link);
}

/* ---------- entry hooks: one data-entry attribute on <html> plus data-field-ready (3.4.7) ---------- */
/* field canvas: invisible until the first real frame (data-field-ready) */
.field { opacity: 0; }
html[data-field-ready] .field { opacity: 1; transition: opacity 400ms linear; }

/* entry: rail blocks and scrim hidden until the reveal */
html[data-entry="run"] [data-reveal],
html[data-entry="wait"] [data-reveal],
html[data-entry="scrim"] [data-reveal] { opacity: 0; transform: translateY(6px); }
html[data-entry="wait"] [data-reveal],
html[data-entry="scrim"] [data-reveal] { pointer-events: none; }
html[data-entry="run"] .scrim,
html[data-entry="wait"] .scrim { opacity: 0; }
html[data-entry="scrim"] .scrim,
html[data-entry="reveal"] .scrim { opacity: 1; transition: opacity 800ms linear; }
html[data-entry="reveal"] [data-reveal] {
  opacity: 1;
  transform: none;
  transition: opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 40ms);
}
html[data-entry="skip"] [data-reveal],
html[data-entry="skip"] .scrim { opacity: 1; transform: none; transition: none; }

/* failsafe: if main.ts never takes control, show everything after 4 s */
html[data-entry="run"] [data-reveal],
html[data-entry="run"] .scrim { animation: pn-failsafe 1ms linear 4000ms forwards; }
@keyframes pn-failsafe { to { opacity: 1; transform: none; } }

[data-reveal="1"] { --i: 1; } [data-reveal="2"] { --i: 2; } [data-reveal="3"] { --i: 3; }
[data-reveal="4"] { --i: 4; } [data-reveal="5"] { --i: 5; } [data-reveal="6"] { --i: 6; }
[data-reveal="7"] { --i: 7; }

/* ---------- short desktop windows: collapse order (3.1.11) ----------
   Everything shows at >= 600 px tall (1280x600 verified). Collapsed items are
   visually hidden, not display:none, so screen readers still get the full résumé.
   Below the last step the document simply scrolls; nothing is ever clipped. */
@media (min-width: 720px) and (max-height: 599.98px) {
  .block--proj .row:nth-child(n+3) {           /* step 1: Projects 4 → 2 rows */
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
  }
}
@media (min-width: 720px) and (max-height: 519.98px) {
  .tags li:nth-child(n+4) {                    /* step 2: Misc 7 → 3 tags (one line) */
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
  }
}

/* ---------- band layout: phones and portrait windows, BAND_QUERY (3.1.1, 3.1.13) ---------- */
@media (max-width: 719.98px), not all and (min-aspect-ratio: 1/1) {
  :root {
    --gutter: clamp(16px, 5.2vw, 28px);
    --fs-name:    clamp(38px, 12vw, 60px);
    --fs-tag:     clamp(14.5px, 3.9vw, 17px);
    --fs-body:    clamp(13.5px, 3.6vw, 15.5px);
    --fs-when:    clamp(12px, 3.15vw, 13.5px);
    --fs-eyebrow: clamp(11px, 2.9vw, 12.5px);
    --fs-misc:    clamp(13px, 3.45vw, 15px);
    --fs-link:    clamp(15px, 4vw, 17px);
    --fs-meta:    clamp(11px, 2.95vw, 12.5px);
    --pad-y: 28px;
    --gap-tag: 10px;
    --gap-block: 30px;
    --gap-eyebrow: 8px;
    --row-pad: 7px;
    --gap-foot: 26px;
    --gap-meta: 12px;
    --band-h: 28vh;
    --fade: 56px;
  }
  @supports (height: 1svh) { :root { --band-h: 28svh; } }

  .rail {
    width: auto;
    min-height: 0;
    padding: calc(var(--pad-y) + env(safe-area-inset-top, 0px))
             max(var(--gutter), env(safe-area-inset-right, 0px))
             calc(var(--band-h) + var(--fade) + 24px + env(safe-area-inset-bottom, 0px))
             max(var(--gutter), env(safe-area-inset-left, 0px));
  }
  /* band order (Blueprint stack branch): status moves up under the tagline */
  .rail > .intro  { order: 0; }
  .rail > .status { order: 1; margin-top: var(--gap-tag); }
  .rail > :not(.intro):not(.status) { order: 2; }
  .rail > .block--edu  { margin-bottom: 0; }
  .rail > .block--misc { margin-top: var(--gap-block); }

  .row { column-gap: 0.9em; }

  /* field band: fixed across the bottom 28 %, ABOVE the content. Text scrolls under
     a 56 px fade into --scrim-solid and is never drawn over field pixels. */
  .field {
    inset: auto 0 0 0;
    height: var(--band-h);
    z-index: 3;
    touch-action: auto;             /* pinch zoom keeps working on the band (3.3.7.8) */
  }
  .scrim {
    inset: auto 0 0 0;
    width: auto;
    height: calc(var(--band-h) + var(--fade));
    z-index: 4;
    background: linear-gradient(180deg,
      var(--scrim-clear) 0,
      var(--scrim-solid) var(--fade),
      var(--scrim-mid) calc(var(--fade) + var(--band-h) * 0.12),
      var(--scrim-clear) calc(var(--fade) + var(--band-h) * 0.45));
  }
  html.no-webgl .rail { padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px)); }

  .theme-toggle {
    position: absolute;
    z-index: 5;
    top: calc(var(--pad-y) + env(safe-area-inset-top, 0px) + var(--fs-name) / 2 - var(--toggle) / 2);
    right: max(var(--gutter), env(safe-area-inset-right, 0px));
    --toggle: 44px;
  }
  .lnk { --hit: 0.65em; }           /* 15.6 px × (1.45 + 1.3) ≈ 43–47 px touch target */
  .links ul { row-gap: 1em; }
}
/* narrow band: the value cell stacks (role / org, project / what), 3.1.14 */
@media (max-width: 519.98px) {
  .sub { display: block; }
  .sub::before { content: none; }
  .rows--compact .what { grid-column: 1 / -1; }   /* projects have no dates: use the full width */
  .rows--compact .row { padding-block: calc(var(--row-pad) * 0.6); }
}

/* ---------- reduced motion (3.6.4): after the entry hooks, so it wins ---------- */
@media (prefers-reduced-motion: reduce) {
  .dot::after { animation: none; opacity: 0; }
  .lnk, .lnk::before, .lnk::after,
  .theme-toggle, .theme-word, .theme-word::before, .theme-word::after,
  .keys { transition: none; }
  html[data-entry] [data-reveal],
  html[data-entry] .scrim { opacity: 1; transform: none; transition: none; animation: none; pointer-events: auto; }
  html[data-field-ready] .field { transition: none; }
}

/* ---------- forced colours (Windows contrast themes, 3.6.5) ---------- */
@media (forced-colors: active) {
  .field, .scrim { display: none; }
  .dot { background: CanvasText; }
  .dot::after { display: none; }
  .eyebrow::after { background: CanvasText; }
  .lnk:focus-visible { outline: 2px solid LinkText; outline-offset: 3px; }
}

/* ---------- print: a clean one-page résumé (3.6.6) ---------- */
@media print {
  .field, .scrim, .theme-toggle, .keys, .dot { display: none !important; }
  .rail { width: auto; min-height: 0; padding: 0; }
  .lnk::before, .lnk::after { display: none; }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/tokens.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  14 passed (14)`.

- [ ] **Step 5: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  13 passed (13)`, `Tests  98 passed (98)`; typecheck silent; the build succeeds and the two Geist notices are gone (`dist/assets/index-….css 16.19 kB │ gzip: 4.17 kB`, `dist/assets/index-….js 0.72 kB`).

- [ ] **Step 6: Load the `frontend-design` skill (Execution Notes, 8.3.5)**

Invoke the Skill tool with `frontend-design:frontend-design` and keep its checklist next to the screenshots of Step 9; record in `task-6-report.md` what it flagged and what (if anything) was changed. The binding values are the spec's: no token, size or geometry changes come from the skill.

- [ ] **Step 7: Browser evidence, part 1: the rail fit (spec 8.2.13, 3.1.10, 3.1.11, 3.1.15, 3.1.17, 5.1.8)**

`main.ts` is still the Task 1 interim (it adds `no-webgl` and never removes `data-entry`), so every load in this task uses `/?noentry`; the canvas and scrim are hidden, so the scrim alpha at the widest text pixel is computed from the 3.1.10 stops instead of being read from pixels.

```bash
mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-6
npm run dev
```

Run `npm run dev` with the Bash tool's `run_in_background`; it prints `Local: http://localhost:5173/` (use the port it prints if 5173 is taken). Load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__take_snapshot,mcp__plugin_ecc_chrome-devtools__hover,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__close_page`.

`new_page` with `url: "about:blank"`, `isolatedContext: "t6"`; then `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`. Load the page with `navigate_page` `type: "url"`, `url: "http://localhost:5173/?noentry"` and this `initScript` (the fit probe; it skips the fixed toggle, sr-only text and collapsed items):

```js
window.__fit = async () => {
  await document.fonts.ready;
  const html = document.documentElement;
  const se = document.scrollingElement;
  const rail = document.querySelector('[data-rail]');
  const rr = rail.getBoundingClientRect();
  const gutter = parseFloat(getComputedStyle(rail).paddingLeft);
  const R = rr.right;
  const S = gutter + (R - gutter) / 2;
  const ramp = Math.min(440, Math.max(160, 0.18 * innerWidth));
  const clipped = (el) => { for (let a = el; a && a !== rail.parentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.clipPath !== 'none' || a.hidden || cs.visibility === 'hidden') return true; } return false; };
  const textRight = (root) => {
    let max = 0;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('.theme-toggle') || clipped(n.parentElement)) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width > 0) max = Math.max(max, b.right);
    }
    return Math.round(max * 10) / 10;
  };
  const alphaAt = (x) => {
    if (x <= S) return 1;
    if (x <= R) return 1 - (0.14 * (x - S)) / (R - S);
    const st = [[R, 0.86], [R + 0.25 * ramp, 0.7], [R + 0.5 * ramp, 0.42], [R + 0.75 * ramp, 0.16], [R + ramp, 0]];
    for (let i = 1; i < st.length; i++) if (x <= st[i][0]) return st[i - 1][1] + ((st[i][1] - st[i - 1][1]) * (x - st[i - 1][0])) / (st[i][0] - st[i - 1][0]);
    return 0;
  };
  const widest = textRight(rail);
  const bottom = Math.max(...['.links', '.status', '.place'].map((s) => textRight(rail.querySelector(s))));
  const edu = rail.querySelector('.block--edu').getBoundingClientRect();
  const misc = rail.querySelector('.block--misc').getBoundingClientRect();
  const gapBlock = parseFloat(getComputedStyle(rail.querySelector('.block--edu')).marginBottom);
  const visible = (sel) => [...rail.querySelectorAll(sel)].filter((e) => getComputedStyle(e).clipPath === 'none').length;
  const place = rail.querySelector('.place').getBoundingClientRect();
  return {
    vp: `${innerWidth}x${innerHeight}`,
    noScroll: se.scrollHeight === se.clientHeight, scrollH: se.scrollHeight, clientH: se.clientHeight,
    R: Math.round(R * 10) / 10, S: Math.round(S * 10) / 10, widest, alphaAtWidest: Math.round(alphaAt(widest) * 1000) / 1000,
    widestLeftOfR: widest <= R, bottomGroupRight: bottom, bottomLeftOfS: bottom < S,
    spare: Math.round((misc.top - edu.bottom - gapBlock) * 10) / 10,
    lastBottom: Math.round(place.bottom * 10) / 10,
    namePx: parseFloat(getComputedStyle(rail.querySelector('.name')).fontSize), bodyPx: parseFloat(getComputedStyle(document.body).fontSize),
    projectRows: visible('.block--proj .row'), tags: visible('.tags li'),
    entry: html.getAttribute('data-entry'), noWebgl: html.classList.contains('no-webgl'),
  };
};
```

For each viewport below: `emulate` the viewport, then `navigate_page` `type: "reload"` with the same `initScript` (a mobile emulation reloads the page and would drop the probe), then `evaluate_script` `() => window.__fit()` with `waitForStableDom: false`. Every row must show `entry: null` and `noWebgl: true`. Expected values (±1 px; measured on this code):

| viewport | `noScroll` | R | S | widest text | alpha there | links/status/footer right | spare | name px | body px | project rows | tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `1280x720x1` | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 72.7 | 59.904 | 13 | 4 | 7 |
| `1366x768x1` | true | 626.6 | 340.6 | 615.6 | 0.865 | 234.3 | 98.4 | 63.8976 | 13 | 4 | 7 |
| `1440x900x1` | true | 691.2 | 374.4 | 664.8 | 0.872 | 245.7 | 142.2 | 74.88 | 14.4 | 4 | 7 |
| `1920x1080x1` | true | 837.1 | 457 | 805.7 | 0.872 | 302.5 | 170.7 | 89.856 | 17.28 | 4 | 7 |
| `2560x1440x1` | true | 888 | 492 | 859 | 0.87 | 332.8 | 395.6 | 104 | 18 | 4 | 7 |
| `1280x600x1` (3.1.11 item 1) | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 8.2 | 49.92 | 13 | 4 | 7 |
| `1280x599x1` (item 2) | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 51.9 | 49.8368 | 13 | 2 | 7 |
| `1280x519x1` (item 3) | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 26.6 | 43.1808 | 13 | 2 | 3 |
| `1280x470x1` (item 4) | **false**: `scrollH` 476, scrolls 6 px, nothing clipped | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 0 | 40 | 13 | 2 | 3 |
| `853x480x1` (150 % zoom, 5.1.8) | true | 606.1 | 320.1 | 595.1 | 0.865 | 213.7 | 1.5 | 40 | 13 | 2 | 3 |
| `844x390x3,mobile,touch,landscape` (3.1.15) | false, scrolls 84 px (`scrollH` 474) | 605.8 | 319.8 | 594.8 | 0.865 | 213.4 | 0 | 40 | 13 | 2 | 3 |

So at every rail viewport the widest text pixel sits left of R (alpha ≥ 0.865 ≥ 0.86, 3.1.10.1), and the links, status and footer end left of S (solid zone, 3.1.10.2, 3.2.5.1). The five required sizes match the 3.1.17 spare heights (73, 98, 142, 171, 396). For `640x360x1` (200 % zoom, 5.1.8) run `async () => { const r = await window.__fit(); const se = document.scrollingElement; return { ...r, band: matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches, padBottom: getComputedStyle(document.querySelector('[data-rail]')).paddingBottom, scrollW: se.scrollWidth, clientW: se.clientWidth }; }` and expect `band: true`, `padBottom: "40px"` (the `no-webgl` band padding), `scrollH` 819 (it reflows and scrolls), `scrollW === clientW` (no horizontal scroll) and all 4 project rows and 7 tags.

- [ ] **Step 8: Browser evidence, part 2: the band, hover and console (spec 3.1.13, 3.1.15, 3.5.1, 8.2.1)**

Band fit, at `emulate` `viewport: "390x844x3,mobile,touch"` and again at `"768x1024x2,mobile,touch"` (reload after each `emulate`), with this `evaluate_script` (`waitForStableDom: false`); it removes `no-webgl` so the band and its scrim take their real boxes, scrolls to the end, measures, and restores:

```js
async () => {
  await document.fonts.ready;
  document.documentElement.classList.remove('no-webgl');
  const se = document.scrollingElement;
  se.scrollTop = se.scrollHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const place = document.querySelector('.place').getBoundingClientRect();
  const scrim = document.querySelector('.scrim').getBoundingClientRect();
  const field = document.querySelector('.field').getBoundingClientRect();
  const out = {
    vp: `${innerWidth}x${innerHeight}`,
    band: matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches,
    docH: se.scrollHeight, scrollTop: se.scrollTop,
    footerBottom: Math.round(place.bottom * 10) / 10, fadeTop: Math.round(scrim.top * 10) / 10, bandTop: Math.round(field.top * 10) / 10,
    bandH: Math.round(field.height * 10) / 10, gapAboveFade: Math.round((scrim.top - place.bottom) * 10) / 10,
    namePx: parseFloat(getComputedStyle(document.querySelector('.name')).fontSize),
    statusOrder: getComputedStyle(document.querySelector('.status')).order,
    touchAction: getComputedStyle(document.querySelector('.field')).touchAction,
    scrollW: se.scrollWidth, clientW: se.clientWidth,
  };
  document.documentElement.classList.add('no-webgl');
  se.scrollTop = 0;
  return out;
}
```

Expected (±1 px):
- 390×844: `band: true`, `docH` 1279, `footerBottom` 527.6, `fadeTop` 551.7, `bandTop` 607.7, `bandH` 236.3, `gapAboveFade` 24.1 (the footer rests 24 px above the fade, 3.1.13), `namePx` 46.8, `statusOrder` "1", `touchAction` "auto", `scrollW` = `clientW` = 390.
- 768×1024 (portrait tablet gets the band, 3.1.15): `band: true`, `docH` 1121 (scrolls 97 px), `footerBottom` 657.4, `fadeTop` 681.3, `bandTop` 737.3, `bandH` 286.7, `gapAboveFade` 23.8, `namePx` 60, `statusOrder` "1", `touchAction` "auto".

Hover (3.5.1), at `emulate` `viewport: "1440x900x1"` (reload): run `() => { const r = (s) => JSON.stringify(document.querySelector(s).getBoundingClientRect()); window.__before = { gh: r('a[data-link="github"]'), hi: r('a[data-email]') }; return window.__before; }`; `take_snapshot` and `hover` the `link "github"` uid; then run `async () => { await new Promise((r) => setTimeout(r, 200)); const a = document.querySelector('a[data-link="github"]'); const r = (s) => JSON.stringify(document.querySelector(s).getBoundingClientRect()); return { same: r('a[data-link="github"]') === window.__before.gh && r('a[data-email]') === window.__before.hi, hovered: a.matches(':hover'), color: getComputedStyle(a).color, bracketOpacity: getComputedStyle(a, '::before').opacity }; }`. Expected `{ same: true, hovered: true, color: "rgb(91, 129, 255)", bracketOpacity: "1" }` (the github rect is 51.84 × 29.5 at x 57.59 in both states).

Console: open a fresh context (`new_page` `url: "about:blank"`, `isolatedContext: "t6-console"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` to `http://localhost:5173/?noentry`, run `async () => { await new Promise((r) => setTimeout(r, 4000)); return [...document.fonts].map((f) => `${f.weight} ${f.status}`); }` (expect `["400 loaded", "700 loaded"]`), then `list_console_messages` with `types: ["error", "warn"]`. Expected: `<no console messages found>`. (Reloads in the `t6` context may log "preloaded but not used" font warnings for cached fonts; that is the vault gotcha, not a defect, which is why the console check uses a fresh context.) `close_page` it.

- [ ] **Step 9: Screenshots (spec 8.3.3)**

In the `t6` page, for each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, `1366x768x1`, `768x1024x2,mobile,touch` and each look (`emulate` `colorScheme: "dark"` then `"light"`), reload `http://localhost:5173/?noentry` and `take_screenshot` with `filePath` `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-6\<w>x<h>-<look>.png`: ten files, `1440x900-dark.png` … `768x1024-light.png`. Check each by eye (Read tool): dark is `#050a22` paper with `#e8eeff` name and rows, `#7993da` secondary text and a `#5b81ff` status line; light is `#f2f6fe` with navy `#071348` ink; at 1440×900 the bottom group (Misc, links, status, `IRVINE, CA`) sits on the rail bottom with the 142 px spare gap above Misc; at 390×844 the status line sits under the tagline and the rows stack role over org; no toggle and no clock yet (Task 8 shows them). Then `close_page` the `t6` page, stop the dev server and kill its leftover node child:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }
```

Write every measured row, the band numbers, the hover result, the console result and the skill notes into `task-6-report.md`.

- [ ] **Step 10: Commit**

```bash
git add src/styles.css tests/tokens.test.ts
git commit -m "feat(style): Dither Blue tokens, rail and band layouts, entry and motion CSS

One stylesheet in the 4.6.3 order: the twelve registered colour tokens and the
300 ms theme crossfade, the dark and daylight token blocks, and the Appendix C
layout with the band under BAND_QUERY, the word toggle chip, the data-entry
contract with its 4 s failsafe, the reduced-motion block and pixelated cells.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Rail DOM modules: clock, LinkedIn presence, email copy

**Files:** Modify `src/ui/clock.ts`, `tests/clock.test.ts`; Move `src/ui/exitLine.ts` → `src/ui/links.ts` (`git mv`, then rewrite); Create `src/ui/emailCopy.ts`, `tests/links.test.ts`, `tests/emailCopy.test.ts`.

**Interfaces:**
- Consumes: Task 5 DOM contract (`[data-link="linkedin"]`, `[data-key="linkedin"]`, `[data-email]`, `.swap`, `#email-hint`, `[data-live]`, `time[data-clock-time]`).
- Produces:
  ```ts
  // src/ui/clock.ts
  export function formatClock(date: Date, timeZone?: string, locale?: string): { time: string; zone: string; datetime: string }; // { '2:36 PM', 'PDT', '14:36' }
  export function msToNextMinute(date: Date): number; // 60000 - (seconds * 1000 + milliseconds)
  export function startClock(el: HTMLTimeElement, timeZone: string, now?: () => Date): () => void; // writes "2:36 PM PDT" + datetime; returns stop

  // src/ui/links.ts
  export function initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }; // true when the URL is non-empty and [data-link="linkedin"] exists; then un-hides [data-key="linkedin"]

  // src/ui/emailCopy.ts
  export type CopyResult = 'copied' | 'fallback';
  export function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined): Promise<CopyResult>;
  export function initEmailCopy(link: HTMLAnchorElement, email: string, deps?: { clipboard?: Pick<Clipboard, 'writeText'>; assign?: (url: string) => void; holdMs?: number; live?: HTMLElement | null }): { trigger(): Promise<CopyResult>; dispose(): void };
  ```
- Semantics: `formatClock` builds from `Intl.DateTimeFormat('en-US', …).formatToParts` (hour without a leading zero, two-digit minute, ASCII spaces only, `AM`/`PM`, short zone); `startClock` writes `${time} ${zone}` into the `<time>` and `datetime`, re-arms each write at `msToNextMinute(now()) + 25` ms, rewrites and re-arms on `visibilitychange` to visible (listener on `el.ownerDocument`), and is never a live region. `initEmailCopy` adds `aria-describedby="email-hint"`; an unmodified primary click calls `preventDefault()` and `trigger()`; modified and middle clicks keep `mailto:`; success sets `data-copied` for `holdMs` (default 1200, restarted by a second copy), clears `live`, writes `Email address copied.` on the next frame (`requestAnimationFrame` when it exists, else `setTimeout(…, 0)`) and clears it 3000 ms later; `'fallback'` calls `assign('mailto:info@parsanaji.com')` (default `location.assign`). Defaults for `clipboard` and `assign` are read at call time.

Implementation notes the tests pin: an explicit `clipboard: undefined` in `deps` means "no clipboard" (the `in` check), so it never falls through to `navigator.clipboard`; a pending next-frame write is cancelled by a newer copy and by `dispose()`, so `dispose()` leaves no timers behind; `trigger()` never rejects.

- [ ] **Step 1: Write the failing tests**

Full file `tests/clock.test.ts` (spec 8.1.13, 3.5.13; replaces the teaser's 24-hour cases):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatClock, msToNextMinute, startClock } from '../src/ui/clock';

describe('formatClock (3.5.13)', () => {
  it('renders 14:36 PDT as 2:36 PM with a 24-hour datetime', () => {
    expect(formatClock(new Date('2026-07-01T21:36:00Z'))).toEqual({ time: '2:36 PM', zone: 'PDT', datetime: '14:36' });
  });

  it('renders midnight as 12:00 AM and noon as 12:00 PM', () => {
    expect(formatClock(new Date('2026-07-01T07:00:00Z'))).toEqual({ time: '12:00 AM', zone: 'PDT', datetime: '00:00' });
    expect(formatClock(new Date('2026-07-01T19:00:00Z'))).toEqual({ time: '12:00 PM', zone: 'PDT', datetime: '12:00' });
  });

  it('switches to PST in winter', () => {
    expect(formatClock(new Date('2026-01-15T20:05:00Z'))).toEqual({ time: '12:05 PM', zone: 'PST', datetime: '12:05' });
  });

  it('writes the hour without a leading zero and the minute with one', () => {
    expect(formatClock(new Date('2026-01-15T17:07:00Z')).time).toBe('9:07 AM');
  });

  it('uses ASCII spaces only, never U+202F, so every glyph is in the font subset', () => {
    for (let h = 0; h < 24; h++) {
      const { time, zone } = formatClock(new Date(Date.UTC(2026, 6, 1, h, 5)));
      const text = `${time} ${zone}`;
      expect(text).not.toContain('\u202f');
      expect([...text].every((c) => c >= ' ' && c <= '~')).toBe(true);
    }
  });

  it('respects an explicit time zone', () => {
    expect(formatClock(new Date('2026-07-01T12:00:00Z'), 'UTC')).toEqual({ time: '12:00 PM', zone: 'UTC', datetime: '12:00' });
  });
});

describe('msToNextMinute', () => {
  it('is 60000 minus the elapsed part of the minute', () => {
    expect(msToNextMinute(new Date('2026-07-01T21:36:30.250Z'))).toBe(29_750);
    expect(msToNextMinute(new Date('2026-07-01T21:36:00.000Z'))).toBe(60_000);
    expect(msToNextMinute(new Date('2026-07-01T21:36:59.999Z'))).toBe(1);
  });
});

describe('startClock', () => {
  class FakeDoc extends EventTarget {
    visibilityState: DocumentVisibilityState = 'visible';
  }
  const fakeTime = (doc: FakeDoc) => {
    const attrs = new Map<string, string>();
    const el = { textContent: '', ownerDocument: doc, setAttribute: (k: string, v: string) => void attrs.set(k, v) };
    return { el: el as unknown as HTMLTimeElement, attrs, text: () => el.textContent };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T21:36:30.000Z')); // 2:36:30 PM PDT
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes at once, then 25 ms after each minute boundary', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    startClock(t.el, 'America/Los_Angeles');
    expect(t.text()).toBe('2:36 PM PDT');
    expect(t.attrs.get('datetime')).toBe('14:36');
    vi.advanceTimersByTime(30_024);
    expect(t.text()).toBe('2:36 PM PDT');
    vi.advanceTimersByTime(1);
    expect(t.text()).toBe('2:37 PM PDT');
    expect(t.attrs.get('datetime')).toBe('14:37');
    vi.advanceTimersByTime(60_000);
    expect(t.text()).toBe('2:38 PM PDT');
  });

  it('rewrites when the tab becomes visible, not while hidden', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    startClock(t.el, 'America/Los_Angeles');
    vi.setSystemTime(new Date('2026-07-01T22:00:10.000Z')); // timers did not run (hidden tab)
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('2:36 PM PDT');
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('3:00 PM PDT');
  });

  it('stop() clears the timer and the listener', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    const stop = startClock(t.el, 'America/Los_Angeles');
    stop();
    vi.advanceTimersByTime(120_000);
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('2:36 PM PDT');
  });
});
```

Full file `tests/links.test.ts` (P8; spec 3.1.12, 11.22):

```ts
import { describe, expect, it } from 'vitest';
import { initLinks } from '../src/ui/links';

// A document that knows a few selectors; anything else is missing.
const fakeDoc = (nodes: Record<string, object>) =>
  ({ querySelector: (selector: string) => nodes[selector] ?? null }) as unknown as Document;

describe('initLinks (3.1.12, 11.22)', () => {
  it('reports no LinkedIn and leaves the overlay row hidden while the URL is empty', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-link="linkedin"]': {}, '[data-key="linkedin"]': row });
    expect(initLinks('', doc)).toEqual({ linkedin: false });
    expect(row.hidden).toBe(true);
  });

  it('reports LinkedIn and shows the overlay row when the URL and the anchor exist', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-link="linkedin"]': {}, '[data-key="linkedin"]': row });
    expect(initLinks('https://www.linkedin.com/in/example', doc)).toEqual({ linkedin: true });
    expect(row.hidden).toBe(false);
  });

  it('reports no LinkedIn when the URL exists but the anchor does not', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-key="linkedin"]': row });
    expect(initLinks('https://www.linkedin.com/in/example', doc)).toEqual({ linkedin: false });
    expect(row.hidden).toBe(true);
  });

  it('never throws on missing elements', () => {
    expect(initLinks('https://www.linkedin.com/in/example', fakeDoc({ '[data-link="linkedin"]': {} }))).toEqual({
      linkedin: true,
    });
    expect(initLinks('', fakeDoc({}))).toEqual({ linkedin: false });
  });
});
```

Full file `tests/emailCopy.test.ts` (spec 8.1.14, 3.5.3, 11.27; Node has no `requestAnimationFrame`, so the "next frame" is the `setTimeout(…, 0)` branch under fake timers):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText, initEmailCopy } from '../src/ui/emailCopy';

const EMAIL = 'info@parsanaji.com';

class FakeLink extends EventTarget {
  readonly attrs = new Map<string, string>();
  setAttribute(k: string, v: string): void {
    this.attrs.set(k, v);
  }
  removeAttribute(k: string): void {
    this.attrs.delete(k);
  }
  hasAttribute(k: string): boolean {
    return this.attrs.has(k);
  }
}

type ClickInit = Partial<Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>>;
const click = (init: ClickInit = {}): Event =>
  Object.assign(new Event('click', { cancelable: true }), {
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...init,
  });

const setup = (deps: Parameters<typeof initEmailCopy>[2] = {}) => {
  const link = new FakeLink();
  const live = { textContent: '' };
  const assign = vi.fn();
  const handle = initEmailCopy(link as unknown as HTMLAnchorElement, EMAIL, {
    assign,
    live: live as unknown as HTMLElement,
    ...deps,
  });
  return { link, live, assign, handle };
};

const ok = () => ({ writeText: vi.fn(() => Promise.resolve()) });

describe('copyText', () => {
  it('copies through writeText', async () => {
    const clipboard = ok();
    await expect(copyText(EMAIL, clipboard)).resolves.toBe('copied');
    expect(clipboard.writeText).toHaveBeenCalledWith(EMAIL);
  });

  it('falls back when the clipboard refuses, throws or is missing', async () => {
    await expect(copyText(EMAIL, { writeText: () => Promise.reject(new Error('denied')) })).resolves.toBe('fallback');
    const throwing = {
      writeText: (): Promise<void> => {
        throw new Error('sync');
      },
    };
    await expect(copyText(EMAIL, throwing)).resolves.toBe('fallback');
    await expect(copyText(EMAIL, undefined)).resolves.toBe('fallback');
    await expect(copyText(EMAIL, {} as Pick<Clipboard, 'writeText'>)).resolves.toBe('fallback');
  });
});

describe('initEmailCopy (3.5.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds aria-describedby="email-hint" at init', () => {
    const { link } = setup({ clipboard: ok() });
    expect(link.attrs.get('aria-describedby')).toBe('email-hint');
  });

  it('shows "copied" for 1200 ms and announces it on the next frame for 3000 ms', async () => {
    const { link, live, handle } = setup({ clipboard: ok() });
    live.textContent = 'stale';
    await expect(handle.trigger()).resolves.toBe('copied');
    expect(link.hasAttribute('data-copied')).toBe(true);
    expect(live.textContent).toBe('');
    vi.advanceTimersByTime(0); // Node has no requestAnimationFrame: the next frame is setTimeout(…, 0)
    expect(live.textContent).toBe('Email address copied.');
    vi.advanceTimersByTime(1199);
    expect(link.hasAttribute('data-copied')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(link.hasAttribute('data-copied')).toBe(false);
    vi.advanceTimersByTime(1799);
    expect(live.textContent).toBe('Email address copied.');
    vi.advanceTimersByTime(1);
    expect(live.textContent).toBe('');
  });

  it('restarts the 1200 ms hold on a second copy', async () => {
    const { link, handle } = setup({ clipboard: ok() });
    await handle.trigger();
    vi.advanceTimersByTime(1000);
    await handle.trigger();
    vi.advanceTimersByTime(1000);
    expect(link.hasAttribute('data-copied')).toBe(true);
    vi.advanceTimersByTime(200);
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('falls back to mailto: when writeText rejects', async () => {
    const { link, assign, handle } = setup({ clipboard: { writeText: () => Promise.reject(new Error('denied')) } });
    await expect(handle.trigger()).resolves.toBe('fallback');
    expect(assign).toHaveBeenCalledWith('mailto:info@parsanaji.com');
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('falls back to mailto: without a clipboard', async () => {
    const { assign, handle } = setup({ clipboard: undefined });
    await expect(handle.trigger()).resolves.toBe('fallback');
    expect(assign).toHaveBeenCalledWith('mailto:info@parsanaji.com');
  });

  it('honours the holdMs option', async () => {
    const { link, handle } = setup({ clipboard: ok(), holdMs: 500 });
    await handle.trigger();
    vi.advanceTimersByTime(500);
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('takes over an unmodified primary click and keeps the native mailto: otherwise', () => {
    const clipboard = ok();
    const { link } = setup({ clipboard });
    const plain = click();
    link.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const e = click(init);
      link.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
    }
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it('dispose() removes the click handler and the timers', async () => {
    const clipboard = ok();
    const { link, handle } = setup({ clipboard });
    await handle.trigger();
    handle.dispose();
    const e = click();
    link.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/clock.test.ts tests/links.test.ts tests/emailCopy.test.ts`

Expected: FAIL, `Test Files  3 failed (3)`. `links.test.ts` and `emailCopy.test.ts` fail to load (`Error: Cannot find module '../src/ui/links'` and `'../src/ui/emailCopy'`); `clock.test.ts` reports 9 failures against the teaser clock, for example `AssertionError: expected { time: '14:36', zone: 'PDT' } to deeply equal { time: '2:36 PM', zone: 'PDT', …(1) }` (only the U+202F case already passes).

- [ ] **Step 3: Move `exitLine.ts` to `links.ts` and rewrite it (spec 3.1.12, 4.3.1, 11.22)**

```bash
git mv src/ui/exitLine.ts src/ui/links.ts
```

Full file `src/ui/links.ts`:

```ts
/**
 * LinkedIn presence (spec 3.1.12, 11.22). The anchor exists in index.html only once Parsa has given the URL
 * (one commit sets CONTENT.links.linkedin, the <li> and the JSON-LD sameAs together). When both exist, the
 * overlay's `l` row is shown and the `l` shortcut is enabled through the returned flag. Never throws (4.3.1).
 */
export function initLinks(linkedinUrl: string, doc: Document = document): { linkedin: boolean } {
  const linkedin = linkedinUrl !== '' && doc.querySelector('[data-link="linkedin"]') !== null;
  if (linkedin) {
    const row = doc.querySelector<HTMLElement>('[data-key="linkedin"]');
    if (row) row.hidden = false;
  }
  return { linkedin };
}
```

- [ ] **Step 4: Rewrite the clock (spec 3.5.13, 3.1.6, 9.15)**

Full file `src/ui/clock.ts`:

```ts
/**
 * Footer clock (spec 3.5.13): America/Los_Angeles, 12-hour, written "2:36 PM PDT". Built from formatToParts,
 * never from format(), because ICU 72+ puts U+202F before AM/PM and that glyph is not in the font subset.
 */
export function formatClock(
  date: Date,
  timeZone = 'America/Los_Angeles',
  locale = 'en-US',
): { time: string; zone: string; datetime: string } {
  const get = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const twelve = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(date);
  const h23 = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return {
    time: `${get(twelve, 'hour')}:${get(twelve, 'minute')} ${get(twelve, 'dayPeriod').toUpperCase()}`,
    zone: get(twelve, 'timeZoneName'),
    datetime: `${get(h23, 'hour')}:${get(h23, 'minute')}`,
  };
}

/** Milliseconds until the next minute boundary: 60000 - (seconds * 1000 + milliseconds). */
export function msToNextMinute(date: Date): number {
  return 60_000 - (date.getUTCSeconds() * 1000 + date.getUTCMilliseconds());
}

/**
 * Writes "2:36 PM PDT" and the 24-hour datetime into the <time>, then re-arms 25 ms after each minute boundary.
 * A visibilitychange to visible rewrites at once and re-arms. Never a live region. Returns stop.
 */
export function startClock(el: HTMLTimeElement, timeZone: string, now: () => Date = () => new Date()): () => void {
  const doc = el.ownerDocument;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const write = (): void => {
    const date = now();
    const { time, zone, datetime } = formatClock(date, timeZone);
    el.textContent = `${time} ${zone}`;
    el.setAttribute('datetime', datetime);
    clearTimeout(timer);
    timer = setTimeout(write, msToNextMinute(date) + 25);
  };
  const onVisibility = (): void => {
    if (doc.visibilityState === 'visible') write();
  };
  write();
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
```

- [ ] **Step 5: Write the email copy (spec 3.5.3, 5.1.5, 11.27)**

Full file `src/ui/emailCopy.ts`:

```ts
/**
 * "say hi" (spec 3.5.3, 11.27): an unmodified primary click copies the address instead of opening the mail app.
 * Success shows "copied" in place for holdMs (data-copied) and announces it in the live region; a missing or
 * refusing clipboard falls back to the mailto: link, so a click is never dead.
 */
export type CopyResult = 'copied' | 'fallback';

const COPIED_SENTENCE = 'Email address copied.';

export async function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined): Promise<CopyResult> {
  if (!clipboard || typeof clipboard.writeText !== 'function') return 'fallback';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'fallback';
  }
}

export function initEmailCopy(
  link: HTMLAnchorElement,
  email: string,
  deps: {
    clipboard?: Pick<Clipboard, 'writeText'>;
    assign?: (url: string) => void;
    holdMs?: number;
    live?: HTMLElement | null;
  } = {},
): { trigger(): Promise<CopyResult>; dispose(): void } {
  const holdMs = deps.holdMs ?? 1200;
  const live = deps.live ?? null;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;
  let cancelFrame: (() => void) | null = null;

  link.setAttribute('aria-describedby', 'email-hint');

  const announce = (): void => {
    if (!live) return;
    clearTimeout(liveTimer);
    live.textContent = '';
    const write = (): void => {
      live.textContent = COPIED_SENTENCE;
      liveTimer = setTimeout(() => {
        live.textContent = '';
      }, 3000);
    };
    // the region is cleared first and written on the next frame, so a repeat copy is announced again
    cancelFrame?.();
    if (typeof globalThis.requestAnimationFrame === 'function') {
      const id = globalThis.requestAnimationFrame(write);
      cancelFrame = () => globalThis.cancelAnimationFrame(id);
    } else {
      const id = setTimeout(write, 0);
      cancelFrame = () => clearTimeout(id);
    }
  };

  const trigger = async (): Promise<CopyResult> => {
    // defaults are read at call time: the clipboard and location of the live page, never captured at import
    const clipboard = 'clipboard' in deps ? deps.clipboard : globalThis.navigator?.clipboard;
    const result = await copyText(email, clipboard);
    if (result === 'copied') {
      link.setAttribute('data-copied', '');
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => link.removeAttribute('data-copied'), holdMs);
      announce();
    } else {
      const assign = deps.assign ?? ((url: string) => globalThis.location.assign(url));
      try {
        assign(`mailto:${email}`);
      } catch {
        // navigation refused: nothing else to do, and production logs nothing (4.7.6)
      }
    }
    return result;
  };

  const onClick = (event: Event): void => {
    const e = event as MouseEvent;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // keep the native mailto:
    e.preventDefault();
    void trigger();
  };
  link.addEventListener('click', onClick);

  return {
    trigger,
    dispose(): void {
      link.removeEventListener('click', onClick);
      clearTimeout(holdTimer);
      clearTimeout(liveTimer);
      cancelFrame?.();
    },
  };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/clock.test.ts tests/links.test.ts tests/emailCopy.test.ts`

Expected: PASS, `Test Files  3 passed (3)`, `Tests  24 passed (24)` (clock 10, links 4, emailCopy 10).

- [ ] **Step 7: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  15 passed (15)`, `Tests  118 passed (118)`; typecheck silent; the build succeeds (nothing imports the three modules until Task 8, so the bundle is unchanged). No browser evidence: the modules are wired and verified in Task 8.

- [ ] **Step 8: Commit**

```bash
git add src/ui/clock.ts src/ui/links.ts src/ui/emailCopy.ts tests/clock.test.ts tests/links.test.ts tests/emailCopy.test.ts
git status --short
```

Expected (the rewrite leaves too little of `exitLine.ts` for git to pair it as a rename; the `git mv` still recorded the intent):

```
M  src/ui/clock.ts
A  src/ui/emailCopy.ts
D  src/ui/exitLine.ts
A  src/ui/links.ts
M  tests/clock.test.ts
A  tests/emailCopy.test.ts
A  tests/links.test.ts
```

```bash
git commit -m "feat(ui): 12-hour clock, LinkedIn presence and say-hi email copy

The footer clock writes \"2:36 PM PDT\" from formatToParts (no U+202F) and re-arms
25 ms after each minute; initLinks reports LinkedIn only when its URL and anchor
exist; initEmailCopy copies on an unmodified primary click, shows \"copied\" for
1.2 s, announces it politely and falls back to mailto:.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Theme logic, toggle and the slice-1 boot

**Files:** Create `src/theme/theme.ts`, `src/theme/themeController.ts`, `tests/theme.test.ts`; Modify `src/main.ts` (slice-1 boot, below).

**Interfaces:**
- Consumes: Task 7 `startClock(el: HTMLTimeElement, timeZone: string, now?: () => Date): () => void`, `initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }`, `initEmailCopy(link: HTMLAnchorElement, email: string, deps?: { clipboard?: Pick<Clipboard, 'writeText'>; assign?: (url: string) => void; holdMs?: number; live?: HTMLElement | null }): { trigger(): Promise<CopyResult>; dispose(): void }`; Task 5 `CONTENT` and the DOM contract; Task 6 CSS contract (`html.theme-anim`, `--field-0..3`, `--theme-color`).
- Produces:
  ```ts
  // src/theme/theme.ts
  export type Theme = 'light' | 'dark';
  export type ThemePref = Theme | 'system';
  export const THEME_KEY = 'pn.theme';
  export type RGB = readonly [number, number, number]; // sRGB 0..1
  export interface FieldColors { f0: RGB; f1: RGB; f2: RGB; f3: RGB } // P1: declared here, re-exported by src/field/renderer.ts
  export function readPref(storage: Pick<Storage, 'getItem'> | null): ThemePref;      // try/catch; anything else -> 'system'
  export function writePref(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePref): void; // 'system' removes the key; never throws
  export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme;
  export function togglePref(current: Theme, systemDark: boolean): ThemePref;         // flips; 'system' when the flip equals the OS look
  export function toggleLabel(current: Theme): { word: 'dark' | 'light'; label: 'Switch to dark mode' | 'Switch to light mode' }; // the target look
  export function parseHex(hex: string): RGB;
  export function lerpRGB(a: RGB, b: RGB, t: number): RGB;
  export class ColorTween {
    constructor(durMs?: number);          // 300
    set(c: FieldColors): void;
    start(to: FieldColors, nowMs: number): void;
    sample(nowMs: number): FieldColors;   // linear, wall clock, clamps at 1
    get active(): boolean;
  }

  // src/theme/themeController.ts
  export interface ThemeControllerDeps {
    doc: Document; storage: Storage | null; systemDark: MediaQueryList; button: HTMLButtonElement | null;
    onChange: (colors: FieldColors, animate: boolean) => void;
  }
  export function initTheme(d: ThemeControllerDeps): { readonly theme: Theme; readonly colors: FieldColors; dispose(): void };
  export function readFieldColors(doc: Document): FieldColors; // getComputedStyle(documentElement) --field-0..3
  ```
  `start(to, nowMs)` tweens from the value sampled at `nowMs`; `parseHex` trims and accepts `#rrggbb`. `initTheme`'s `theme` and `colors` are getters that always return the current look and its field colours; it runs the 4.6.7 initial state and the 4.6.5 press steps (OS change while `'system'`: steps 1, 4, 5, 6, 7).
- Produces (`src/main.ts` after Task 8; names and order binding for slice 2):
  1. Imports: `CONTENT` from `./content`; `initTheme` from `./theme/themeController`; `startClock` from `./ui/clock`; `initEmailCopy` from `./ui/emailCopy`; `initLinks` from `./ui/links`.
  2. `function devWarn(message: string): void` — `if (import.meta.env.DEV) console.warn(`[pn] ${message}`)`.
  3. `function safeStorage(win: Window): Storage | null` — `win.localStorage` inside try/catch, `null` on throw.
  4. `function applyFallback(doc: Document): void` — adds `no-webgl` to `<html>` and removes `data-entry`; logs nothing (P9).
  5. `function takeEntryControl(doc: Document): boolean` — removes `data-entry` and returns `false` (P9).
  6. `function boot(): void`, in order: `const doc = document; const win = window;` → `initLinks(CONTENT.links.linkedin, doc)` → `initEmailCopy` on `a[data-email]` (if present) with `{ live: doc.querySelector<HTMLElement>('[data-live]') }` → `startClock(time[data-clock-time], CONTENT.clock.timeZone)` then `[data-clock].hidden = false` (if both exist) → `initTheme({ doc, storage: safeStorage(win), systemDark: win.matchMedia('(prefers-color-scheme: dark)'), button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'), onChange: () => {} })` → `takeEntryControl(doc)` → `applyFallback(doc)` (no field until Task 15).
  7. Top level: `try { boot(); } catch (error) { devWarn(String(error)); applyFallback(document); }`.

Implementation notes: `parseHex` returns black `[0, 0, 0]` for anything that is not `#rrggbb` (an empty computed value when the stylesheet failed), so `initTheme` never throws; `ColorTween.active` is true from `start()` until a `sample()` at or after the end of the fade (App samples every frame, Task 19 relies on it); the controller restores the two `theme-color` metas to the `content` values it read at init (`#f2f6fe`, `#050a22` from Task 5), so no colour is hard-coded in TypeScript (3.3.12).

- [ ] **Step 1: Write the failing test**

Full file `tests/theme.test.ts` (spec 8.1.9, Appendix A §9.1, plus the 4.6.5–4.6.7 controller steps against a small fake DOM whose computed `--field-*` follow `data-theme` and the OS scheme as `src/styles.css` does):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ColorTween,
  type FieldColors,
  THEME_KEY,
  lerpRGB,
  parseHex,
  readPref,
  resolveTheme,
  toggleLabel,
  togglePref,
  writePref,
} from '../src/theme/theme';
import { initTheme, readFieldColors } from '../src/theme/themeController';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
};
const throwingStorage = {
  getItem: (): string | null => {
    throw new Error('SecurityError');
  },
  setItem: (): void => {
    throw new Error('QuotaExceededError');
  },
  removeItem: (): void => {
    throw new Error('SecurityError');
  },
};

describe('preference (3.5.10)', () => {
  it('readPref returns a stored look and "system" for anything else', () => {
    expect(THEME_KEY).toBe('pn.theme');
    expect(readPref(memoryStorage({ 'pn.theme': 'light' }))).toBe('light');
    expect(readPref(memoryStorage({ 'pn.theme': 'dark' }))).toBe('dark');
    expect(readPref(memoryStorage({ 'pn.theme': 'sepia' }))).toBe('system');
    expect(readPref(memoryStorage())).toBe('system');
    expect(readPref(throwingStorage)).toBe('system');
    expect(readPref(null)).toBe('system');
  });

  it('writePref stores a look, removes the key for "system" and never throws', () => {
    const s = memoryStorage();
    writePref(s, 'dark');
    expect(s.map.get('pn.theme')).toBe('dark');
    writePref(s, 'system');
    expect(s.map.has('pn.theme')).toBe(false);
    expect(() => writePref(throwingStorage, 'light')).not.toThrow();
    expect(() => writePref(throwingStorage, 'system')).not.toThrow();
    expect(() => writePref(null, 'light')).not.toThrow();
  });

  it('resolveTheme follows the OS only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('togglePref flips and collapses to "system" when the flip equals the OS look', () => {
    expect(togglePref('dark', true)).toBe('light');
    expect(togglePref('light', true)).toBe('system');
    expect(togglePref('light', false)).toBe('dark');
    expect(togglePref('dark', false)).toBe('system');
  });

  it('toggleLabel names the target look (5.1.4)', () => {
    expect(toggleLabel('dark')).toEqual({ word: 'light', label: 'Switch to light mode' });
    expect(toggleLabel('light')).toEqual({ word: 'dark', label: 'Switch to dark mode' });
  });
});

describe('colours', () => {
  it('parseHex trims and reads #rrggbb as sRGB 0..1, anything else is black', () => {
    expect(parseHex(' #050a22')).toEqual([5 / 255, 10 / 255, 34 / 255]);
    expect(parseHex('#FFFFFF')).toEqual([1, 1, 1]);
    expect(parseHex('')).toEqual([0, 0, 0]);
    expect(parseHex('rgb(5 10 34)')).toEqual([0, 0, 0]);
  });

  it('lerpRGB interpolates each channel', () => {
    expect(lerpRGB([0, 0.5, 1], [1, 0.5, 0], 0.25)).toEqual([0.25, 0.5, 0.75]);
  });
});

describe('ColorTween (4.6.6)', () => {
  const solid = (v: number): FieldColors => ({ f0: [v, v, v], f1: [v, v, v], f2: [v, v, v], f3: [v, v, v] });

  it('is linear over 300 ms on the wall clock and lands exactly on the target', () => {
    const t = new ColorTween();
    t.set(solid(0));
    expect(t.active).toBe(false);
    t.start(solid(1), 1000);
    expect(t.active).toBe(true);
    expect(t.sample(1150).f0[0]).toBeCloseTo(0.5, 12);
    expect(t.sample(1300)).toEqual(solid(1));
    expect(t.active).toBe(false);
    expect(t.sample(5000)).toEqual(solid(1));
  });

  it('starts a second tween from the value sampled at that moment (no jump)', () => {
    const t = new ColorTween(300);
    t.set(solid(0));
    t.start(solid(1), 0);
    t.start(solid(0), 150); // reverse at the midpoint
    expect(t.sample(150).f2[1]).toBeCloseTo(0.5, 12);
    expect(t.sample(300).f2[1]).toBeCloseTo(0.25, 12);
    expect(t.sample(450)).toEqual(solid(0));
  });
});

// A minimal DOM for the controller: <html> with classes and attributes, two theme-color metas, the toggle and the
// computed --field-* / --theme-color, which follow data-theme and the OS scheme the way src/styles.css does.
const DARK_CSS: Record<string, string> = {
  '--field-0': '#050a22',
  '--field-1': '#3b5df0',
  '--field-2': '#8db0ff',
  '--field-3': '#e8eeff',
  '--theme-color': '#050a22',
};
const LIGHT_CSS: Record<string, string> = {
  '--field-0': '#f2f6fe',
  '--field-1': '#8db0ff',
  '--field-2': '#3b5df0',
  '--field-3': '#0832b8',
  '--theme-color': '#f2f6fe',
};

function fakeEnv(opts: { stored?: string; osDark: boolean; button?: boolean }) {
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const root = {
    setAttribute: (k: string, v: string) => void attrs.set(k, v),
    removeAttribute: (k: string) => void attrs.delete(k),
    classList: { add: (c: string) => void classes.add(c), remove: (c: string) => void classes.delete(c) },
  };
  const systemDark = Object.assign(new EventTarget(), { matches: opts.osDark });
  const metas = [{ content: '#f2f6fe' }, { content: '#050a22' }];
  const word = { textContent: '' };
  const button = Object.assign(new EventTarget(), {
    hidden: true,
    label: '',
    setAttribute(k: string, v: string) {
      if (k === 'aria-label') this.label = v;
    },
    querySelector: (sel: string) => (sel === '[data-theme-word]' ? word : null),
  });
  const look = () => {
    const t = attrs.get('data-theme');
    return t === 'light' || (t === undefined && !systemDark.matches) ? LIGHT_CSS : DARK_CSS;
  };
  const doc = {
    documentElement: root,
    defaultView: { getComputedStyle: () => ({ getPropertyValue: (name: string) => ` ${look()[name] ?? ''}` }) },
    querySelectorAll: (sel: string) => (sel === 'meta[name="theme-color"]' ? metas : []),
  };
  const storage = memoryStorage(opts.stored ? { 'pn.theme': opts.stored } : {});
  const onChange = vi.fn();
  const handle = initTheme({
    doc: doc as unknown as Document,
    storage: storage as unknown as Storage,
    systemDark: systemDark as unknown as MediaQueryList,
    button: opts.button === false ? null : (button as unknown as HTMLButtonElement),
    onChange,
  });
  const press = () => button.dispatchEvent(new Event('click'));
  const osChange = (dark: boolean) => {
    systemDark.matches = dark;
    systemDark.dispatchEvent(new Event('change'));
  };
  return { attrs, classes, metas, word, button, storage, onChange, handle, press, osChange, doc };
}

describe('initTheme (4.6.5-4.6.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('follows the OS by default: no data-theme, original metas, the word names the other look, button shown', () => {
    const e = fakeEnv({ osDark: true });
    expect(e.handle.theme).toBe('dark');
    expect(e.attrs.has('data-theme')).toBe(false);
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#050a22']);
    expect(e.word.textContent).toBe('light');
    expect(e.button.label).toBe('Switch to light mode');
    expect(e.button.hidden).toBe(false);
    expect(e.handle.colors.f3).toEqual(parseHex('#e8eeff'));
  });

  it('applies a stored look opposite the OS and points both metas at it', () => {
    const e = fakeEnv({ stored: 'light', osDark: true });
    expect(e.handle.theme).toBe('light');
    expect(e.attrs.get('data-theme')).toBe('light');
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#f2f6fe']);
    expect(e.word.textContent).toBe('dark');
    expect(e.handle.colors.f3).toEqual(parseHex('#0832b8'));
  });

  it('a press flips the look, stores it, crossfades and relabels; theme-anim lasts 320 ms', () => {
    const e = fakeEnv({ osDark: true });
    e.press();
    expect(e.classes.has('theme-anim')).toBe(true);
    expect(e.attrs.get('data-theme')).toBe('light');
    expect(e.storage.map.get('pn.theme')).toBe('light');
    expect(e.onChange).toHaveBeenCalledWith(readFieldColors(e.doc as unknown as Document), true);
    expect(e.onChange.mock.calls[0][0].f0).toEqual(parseHex('#f2f6fe'));
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#f2f6fe']);
    expect(e.word.textContent).toBe('dark');
    expect(e.button.label).toBe('Switch to dark mode');
    expect(e.handle.theme).toBe('light');
    vi.advanceTimersByTime(319);
    expect(e.classes.has('theme-anim')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(e.classes.has('theme-anim')).toBe(false);
  });

  it('pressing back to the OS look removes the key and restores both metas', () => {
    const e = fakeEnv({ osDark: true });
    e.press();
    e.press();
    expect(e.storage.map.has('pn.theme')).toBe(false);
    expect(e.attrs.has('data-theme')).toBe(false);
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#050a22']);
    expect(e.handle.theme).toBe('dark');
  });

  it('a second press within 320 ms re-arms the theme-anim timer', () => {
    const e = fakeEnv({ osDark: false });
    e.press();
    vi.advanceTimersByTime(200);
    e.press();
    vi.advanceTimersByTime(200);
    expect(e.classes.has('theme-anim')).toBe(true);
    vi.advanceTimersByTime(120);
    expect(e.classes.has('theme-anim')).toBe(false);
  });

  it('follows an OS change while on "system", and ignores it while a look is stored', () => {
    const e = fakeEnv({ osDark: true });
    e.osChange(false);
    expect(e.handle.theme).toBe('light');
    expect(e.onChange).toHaveBeenLastCalledWith(readFieldColors(e.doc as unknown as Document), true);
    expect(e.word.textContent).toBe('dark');
    expect(e.storage.map.has('pn.theme')).toBe(false);
    const stored = fakeEnv({ stored: 'dark', osDark: true });
    stored.osChange(false);
    expect(stored.handle.theme).toBe('dark');
    expect(stored.onChange).not.toHaveBeenCalled();
  });

  it('works without a button and stops listening on dispose()', () => {
    const e = fakeEnv({ osDark: true, button: false });
    expect(e.handle.theme).toBe('dark');
    e.handle.dispose();
    e.osChange(false);
    expect(e.onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/theme.test.ts`

Expected: FAIL, `Test Files  1 failed (1)`, `Tests  no tests`, with `Error: Cannot find module '../src/theme/theme' imported from …/tests/theme.test.ts`.

- [ ] **Step 3: Write the pure theme module (spec 3.5.10, 4.6.6, 5.1.4, 11.2)**

Full file `src/theme/theme.ts`:

```ts
/**
 * Pure theme logic (spec 3.5.10, 4.6.5-4.6.7): the stored preference, the resolved look, the toggle's word and
 * label, and the field-colour crossfade. No DOM access; themeController.ts does the DOM side.
 */
export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';
export const THEME_KEY = 'pn.theme';

/** sRGB, each channel 0..1. */
export type RGB = readonly [number, number, number];
/** The four field tier colours (P1: declared here, re-exported by src/field/renderer.ts). */
export interface FieldColors {
  f0: RGB;
  f1: RGB;
  f2: RGB;
  f3: RGB;
}

/** The stored preference; a missing, unknown or unreadable value means 'system' (3.5.10). */
export function readPref(storage: Pick<Storage, 'getItem'> | null): ThemePref {
  if (!storage) return 'system';
  try {
    const value = storage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

/** 'system' removes the key; storage that throws is ignored, so the toggle works for the session only. */
export function writePref(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePref): void {
  if (!storage) return;
  try {
    if (pref === 'system') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, pref);
  } catch {
    // private mode or blocked storage: keep the look for this page only
  }
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme {
  if (pref !== 'system') return pref;
  return systemDark ? 'dark' : 'light';
}

/** Flips the look; returns 'system' when the new look equals the OS look (smart default, 1.4). */
export function togglePref(current: Theme, systemDark: boolean): ThemePref {
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  return next === (systemDark ? 'dark' : 'light') ? 'system' : next;
}

/** The toggle names the target look (3.5.10, 5.1.4). */
export function toggleLabel(current: Theme): {
  word: 'dark' | 'light';
  label: 'Switch to dark mode' | 'Switch to light mode';
} {
  return current === 'dark'
    ? { word: 'light', label: 'Switch to light mode' }
    : { word: 'dark', label: 'Switch to dark mode' };
}

/** '#rrggbb' (surrounding whitespace allowed, as getPropertyValue returns it) to sRGB 0..1; anything else is black. */
export function parseHex(hex: string): RGB {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  return [Number.parseInt(m[1], 16) / 255, Number.parseInt(m[2], 16) / 255, Number.parseInt(m[3], 16) / 255];
}

export function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const BLACK: RGB = [0, 0, 0];

/**
 * Linear per-channel crossfade of the field colours on the wall clock (4.6.6): c = c0 + (c1 - c0) * min(1, dt / dur),
 * the same sRGB interpolation CSS applies to the registered tokens, so the page and the off cells move in step.
 */
export class ColorTween {
  private readonly durMs: number;
  private from: FieldColors = { f0: BLACK, f1: BLACK, f2: BLACK, f3: BLACK };
  private to: FieldColors = this.from;
  private t0 = 0;
  private running = false;

  constructor(durMs = 300) {
    this.durMs = durMs;
  }

  /** Jumps to `c` with no animation. */
  set(c: FieldColors): void {
    this.from = c;
    this.to = c;
    this.running = false;
  }

  /** Tweens from the value sampled at `nowMs` (so a second toggle mid-fade never jumps) to `to`. */
  start(to: FieldColors, nowMs: number): void {
    this.from = this.sample(nowMs);
    this.to = to;
    this.t0 = nowMs;
    this.running = true;
  }

  sample(nowMs: number): FieldColors {
    if (!this.running) return this.to;
    const u = this.durMs > 0 ? Math.min(1, Math.max(0, (nowMs - this.t0) / this.durMs)) : 1;
    if (u >= 1) {
      this.running = false;
      return this.to;
    }
    const { from, to } = this;
    return { f0: lerpRGB(from.f0, to.f0, u), f1: lerpRGB(from.f1, to.f1, u), f2: lerpRGB(from.f2, to.f2, u), f3: lerpRGB(from.f3, to.f3, u) };
  }

  /** True from start() until a sample at or after the end of the fade. */
  get active(): boolean {
    return this.running;
  }
}
```

- [ ] **Step 4: Write the controller (spec 3.2.6, 3.2.9, 3.5.10, 4.6.4–4.6.7, Appendix B §5.3)**

Full file `src/theme/themeController.ts`:

```ts
import {
  type FieldColors,
  type Theme,
  type ThemePref,
  parseHex,
  readPref,
  resolveTheme,
  toggleLabel,
  togglePref,
  writePref,
} from './theme';

/**
 * The DOM side of the theme (spec 3.2.6, 3.2.9, 3.5.10, 4.6.5-4.6.7): the toggle button, data-theme on <html>,
 * the theme-color metas and the field colours read from the computed --field-0..3 (CSS is their only source, 3.3.12).
 */
export interface ThemeControllerDeps {
  doc: Document;
  storage: Storage | null;
  systemDark: MediaQueryList;
  button: HTMLButtonElement | null;
  onChange: (colors: FieldColors, animate: boolean) => void;
}

/** Twelve registered tokens transition for 300 ms; the class is removed 320 ms after the last change (4.6.5 step 7). */
const ANIM_CLASS_MS = 320;

function rootStyle(doc: Document): CSSStyleDeclaration | null {
  const view = doc.defaultView;
  return view ? view.getComputedStyle(doc.documentElement) : null;
}

/** getComputedStyle(documentElement) --field-0..3, unregistered, so they are the target hex at once (4.6.4). */
export function readFieldColors(doc: Document): FieldColors {
  const cs = rootStyle(doc);
  const read = (name: string) => parseHex(cs ? cs.getPropertyValue(name) : '');
  return { f0: read('--field-0'), f1: read('--field-1'), f2: read('--field-2'), f3: read('--field-3') };
}

export function initTheme(d: ThemeControllerDeps): { readonly theme: Theme; readonly colors: FieldColors; dispose(): void } {
  const { doc, storage, systemDark, button, onChange } = d;
  const root = doc.documentElement;
  const metas = Array.from(doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  const originalMeta = metas.map((m) => m.content); // #f2f6fe (light) and #050a22 (dark), restored for 'system'
  const word = button?.querySelector<HTMLElement>('[data-theme-word]') ?? null;

  let pref: ThemePref = readPref(storage);
  let theme: Theme = resolveTheme(pref, systemDark.matches);
  let animTimer: ReturnType<typeof setTimeout> | undefined;

  const applyAttribute = (): void => {
    if (pref === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', pref);
  };
  const applyMetas = (): void => {
    if (pref === 'system') {
      metas.forEach((m, i) => {
        m.content = originalMeta[i];
      });
      return;
    }
    const color = rootStyle(doc)?.getPropertyValue('--theme-color').trim() ?? '';
    if (color) metas.forEach((m) => (m.content = color));
  };
  const applyLabel = (): void => {
    const { word: target, label } = toggleLabel(theme);
    if (word) word.textContent = target;
    button?.setAttribute('aria-label', label);
  };
  const startAnim = (): void => {
    root.classList.add('theme-anim');
    clearTimeout(animTimer);
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), ANIM_CLASS_MS);
  };

  // 4.6.7 initial state: data-theme again (idempotent with theme-boot.js), metas when explicit, word and label, then show
  applyAttribute();
  if (pref !== 'system') applyMetas();
  applyLabel();
  if (button) button.hidden = false;
  let colors: FieldColors = readFieldColors(doc);

  // 4.6.5: a press runs steps 1-7
  const onPress = (): void => {
    startAnim(); // 1 (step 7 is the timer it re-arms)
    pref = togglePref(theme, systemDark.matches); // 2
    theme = resolveTheme(pref, systemDark.matches);
    applyAttribute();
    writePref(storage, pref); // 3
    colors = readFieldColors(doc); // 4
    onChange(colors, true);
    applyMetas(); // 5
    applyLabel(); // 6
  };
  // an OS change while the pref is 'system' runs steps 1, 4, 5, 6 and 7
  const onSystemChange = (): void => {
    if (pref !== 'system') return;
    startAnim();
    theme = resolveTheme(pref, systemDark.matches);
    colors = readFieldColors(doc);
    onChange(colors, true);
    applyMetas();
    applyLabel();
  };

  button?.addEventListener('click', onPress);
  systemDark.addEventListener('change', onSystemChange);

  return {
    get theme(): Theme {
      return theme;
    },
    get colors(): FieldColors {
      return colors;
    },
    dispose(): void {
      button?.removeEventListener('click', onPress);
      systemDark.removeEventListener('change', onSystemChange);
      clearTimeout(animTimer);
      root.classList.remove('theme-anim');
    },
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/theme.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  16 passed (16)`.

- [ ] **Step 6: Write the slice-1 boot (spec 4.7.1 slice-1 subset, 4.4.1, 4.7.6, P9)**

Full file `src/main.ts`:

```ts
// Slice-1 boot (spec 4.7.1 subset): the rail's DOM modules and the theme. There is no field until Task 15,
// so every load applies the static fallback and the rail shows at once (P9).
import { CONTENT } from './content';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';

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

/** The static fallback (3.6.2): CSS hides the canvas and the scrim, and the rail shows at once. Logs nothing (P9). */
function applyFallback(doc: Document): void {
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}

function boot(): void {
  const doc = document;
  const win = window;
  initLinks(CONTENT.links.linkedin, doc);
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { live: doc.querySelector<HTMLElement>('[data-live]') });
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: () => {},
  });
  takeEntryControl(doc);
  applyFallback(doc); // no field until Task 15
}

try {
  boot();
} catch (error) {
  devWarn(String(error));
  applyFallback(document);
}
```

- [ ] **Step 7: Full gate and the production bundle**

```bash
npm test
npm run typecheck
npm run build
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
grep -c "console.warn" dist/assets/*.js
```

Expected: `Test Files  16 passed (16)`, `Tests  134 passed (134)`; typecheck silent; the build succeeds (`dist/assets/index-….js 5.77 kB │ gzip: 2.40 kB`, CSS 16.19 kB); the 8.1.4 measurement prints `2.3 KB` (budget 60 KB, 6.1.1); the grep prints `0` (the DEV-only warning is dropped from production, 4.7.6).

- [ ] **Step 8: Load the `frontend-design` skill (Execution Notes, 8.3.5)**

Invoke the Skill tool with `frontend-design:frontend-design`; review the toggle chip and the clock line in the Step 10 screenshots against it and record the notes in `task-8-report.md`. Spec values stay binding.

- [ ] **Step 9: Browser evidence on the dev server (spec 8.2.5 DOM part, 8.2.7, 8.2.11 copy part, 3.5.11, 3.5.13)**

```bash
mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-8
npm run dev
```

Run `npm run dev` with `run_in_background` (port 5173 or the one Vite prints). Load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__take_snapshot,mcp__plugin_ecc_chrome-devtools__click,mcp__plugin_ecc_chrome-devtools__press_key,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__close_page`. Use `waitForStableDom: false` on every `evaluate_script`.

1. Initial state. `new_page` `url: "about:blank"`, `isolatedContext: "t8"`; `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`; `navigate_page` to `http://localhost:5173/` with `initScript` `window.__copied = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });` (headless Chrome refuses the real clipboard without focus, so a stub stands in). Run:
   ```js
   () => { const h = document.documentElement; const b = document.querySelector('[data-theme-toggle]'); const t = document.querySelector('time[data-clock-time]'); return { dataTheme: h.getAttribute('data-theme'), dataEntry: h.getAttribute('data-entry'), noWebgl: h.classList.contains('no-webgl'), stored: localStorage.getItem('pn.theme'), metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content), word: b.textContent, label: b.getAttribute('aria-label'), hidden: b.hidden, pressed: b.hasAttribute('aria-pressed'), clock: t.textContent, datetime: t.getAttribute('datetime'), clockShown: !document.querySelector('[data-clock]').hidden, describedby: document.querySelector('a[data-email]').getAttribute('aria-describedby'), bg: getComputedStyle(document.body).backgroundColor, toggle: [Math.round(b.getBoundingClientRect().width * 10) / 10, b.getBoundingClientRect().height] }; }
   ```
   Expected: `dataTheme: null`, `dataEntry: null` (P9: the rail shows at once), `noWebgl: true`, `stored: null`, `metas: ["#f2f6fe", "#050a22"]`, `word: "light"`, `label: "Switch to light mode"`, `hidden: false`, `pressed: false`, `clock` matching `/^(1[0-2]|[1-9]):[0-5]\d (AM|PM) (PDT|PST)$/`, `datetime` matching `/^\d\d:\d\d$/`, `clockShown: true`, `describedby: "email-hint"`, `bg: "rgb(5, 10, 34)"`, `toggle: [88.4, 40]` (3.1.16.1).
2. Toggle by pointer. `take_snapshot`; `click` the `button "Switch to light mode"` uid. Run `() => { const h = document.documentElement; const b = document.querySelector('[data-theme-toggle]'); return { dataTheme: h.getAttribute('data-theme'), stored: localStorage.getItem('pn.theme'), metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content), word: b.textContent, label: b.getAttribute('aria-label'), field3: getComputedStyle(h).getPropertyValue('--field-3').trim(), width: Math.round(b.getBoundingClientRect().width * 10) / 10 }; }`. Expected `{ dataTheme: "light", stored: "light", metas: ["#f2f6fe", "#f2f6fe"], word: "dark", label: "Switch to dark mode", field3: "#0832b8", width: 88.4 }` (the chip does not change size).
3. Crossfade and the way back to the OS look. Run `async () => { const b = document.querySelector('[data-theme-toggle]'); const t0 = performance.now(); b.click(); await new Promise((r) => setTimeout(r, 150)); const mid = getComputedStyle(document.body).backgroundColor; const at = Math.round(performance.now() - t0); await new Promise((r) => setTimeout(r, 400)); const h = document.documentElement; return { at, mid, end: getComputedStyle(document.body).backgroundColor, dataTheme: h.getAttribute('data-theme'), stored: localStorage.getItem('pn.theme'), metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content), anim: h.classList.contains('theme-anim'), word: b.textContent }; }`. Expected: `mid` within ±3/255 per channel of the sRGB midpoint `rgb(123.5, 128, 144)` of `#f2f6fe` and `#050a22` at `at` ≈ 150–160 ms (measured `rgb(122, 127, 143)` at 158 ms); `end: "rgb(5, 10, 34)"`, `dataTheme: null`, `stored: null` (the key is removed), `metas: ["#f2f6fe", "#050a22"]` (restored), `anim: false`, `word: "light"`.
4. "say hi" copy (3.5.3). Run `async () => { const a = document.querySelector('a[data-email]'); const live = document.querySelector('[data-live]'); const w0 = a.getBoundingClientRect().width; a.click(); await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))); const s1 = { copied: a.hasAttribute('data-copied'), live: live.textContent, sameWidth: a.getBoundingClientRect().width === w0, alt: getComputedStyle(a.querySelector('.swap-alt')).visibility, color: getComputedStyle(a.querySelector('.swap-alt')).color, clip: window.__copied.slice() }; await new Promise((r) => setTimeout(r, 1250)); const s2 = { copied: a.hasAttribute('data-copied'), live: live.textContent }; await new Promise((r) => setTimeout(r, 1900)); return { s1, s2, s3: live.textContent }; }`. Expected `s1: { copied: true, live: "Email address copied.", sameWidth: true, alt: "visible", color: "rgb(91, 129, 255)", clip: ["info@parsanaji.com"] }`, `s2: { copied: false, live: "Email address copied." }`, `s3: ""`. Screenshot during the copied state is optional (`1440x900-dark-copied.png`).
5. Refused clipboard (8.2.7, 8.2.11). `navigate_page` to `http://localhost:5173/?noentry` with `initScript` `Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) } });`. Run `async () => { document.querySelector('a[data-email]').click(); await new Promise((r) => setTimeout(r, 500)); return { copied: document.querySelector('a[data-email]').hasAttribute('data-copied') }; }` → `{ copied: false }`; then `list_console_messages` with `types: ["info"]` shows `Launched external handler for 'mailto:info@parsanaji.com'.` (Chrome's record of the `location.assign('mailto:…')` navigation; the page itself stays put).
6. Stored look opposite the OS look paints first (8.2.5). Run `() => { localStorage.setItem('pn.theme', 'light'); return true; }`; then `navigate_page` `type: "reload"` with `initScript` `requestAnimationFrame(() => { const h = document.documentElement; window.__firstFrame = { theme: h.getAttribute('data-theme'), htmlBg: getComputedStyle(h).backgroundColor }; });` (the first animation frame runs before the first paint, after the head's classic script and stylesheet). Run `() => window.__firstFrame` → `{ theme: "light", htmlBg: "rgb(242, 246, 254)" }` while the emulated OS is dark. Run `() => { localStorage.removeItem('pn.theme'); return true; }` to reset.
7. Tab order (3.5.11). Run `() => { document.activeElement?.blur(); window.__tabs = []; document.addEventListener('focusin', (e) => window.__tabs.push(e.target.getAttribute('data-link') || (e.target.hasAttribute('data-email') ? 'say hi' : e.target.hasAttribute('data-theme-toggle') ? 'toggle' : e.target.tagName))); return true; }`; `press_key` `Tab` three times; run `() => { const b = document.querySelector('[data-theme-toggle]'); return { tabs: window.__tabs, focusVisible: b.matches(':focus-visible'), underline: getComputedStyle(b.querySelector('.theme-word')).textDecorationLine, bracket: getComputedStyle(b.querySelector('.theme-word'), '::before').opacity }; }` → `{ tabs: ["github", "say hi", "toggle"], focusVisible: true, underline: "underline", bracket: "1" }`.
8. Clock at a minute boundary (3.5.13). Run `() => { const t = document.querySelector('time[data-clock-time]'); window.__clockLog = []; new MutationObserver(() => window.__clockLog.push({ text: t.textContent, datetime: t.getAttribute('datetime'), msIntoMinute: Date.now() % 60000 })).observe(t, { childList: true, characterData: true, subtree: true, attributes: true }); return { text: t.textContent, msToBoundary: 60000 - (Date.now() % 60000) }; }`; do steps 9 and 10 meanwhile, and once `msToBoundary` has passed run `() => window.__clockLog`. Expected: one entry whose `text` is the next minute and whose `msIntoMinute` lies between 25 and 100 (the write is scheduled 25 ms after the boundary, plus timer latency; it never fires before the boundary; measured 39 ms).
9. CSS failsafe without `main.ts` taking control (8.2.7). Run `async () => { const h = document.documentElement; h.setAttribute('data-entry', 'run'); const op = () => [...document.querySelectorAll('[data-reveal]')].map((e) => getComputedStyle(e).opacity); await new Promise((r) => setTimeout(r, 100)); const a = op(); await new Promise((r) => setTimeout(r, 3800)); const b = op(); await new Promise((r) => setTimeout(r, 250)); const c = op(); h.removeAttribute('data-entry'); return { at100: a, at3900: b, at4150: c }; }` → nine `"0"` at 100 ms and at 3900 ms, nine `"1"` at 4150 ms.
10. No JavaScript (8.2.7, 3.6.1). Build a copy of `dist/` without its script tags and serve it outside the repo:
    ```bash
    npm run build
    NOJS=$(mktemp -d) && cp -r dist/. "$NOJS/" && sed -i '/<script type="module"/d; /<script src="\/theme-boot.js"><\/script>/d' "$NOJS/index.html" && grep -n "<script" "$NOJS/index.html" && echo "$NOJS"
    ```
    The grep prints only the JSON-LD line (`<script type="application/ld+json">`), and the last line is the copy's path, for example `/tmp/tmp.AbC123`. Shell variables do not survive between Bash calls, so start the preview with that literal path, with `run_in_background`: `npx vite preview --outDir /tmp/tmp.AbC123 --port 4173 --strictPort`. `navigate_page` to `http://localhost:4173/` with `initScript` `requestAnimationFrame(() => { window.__firstFrame = { entry: document.documentElement.getAttribute('data-entry'), reveal: [...document.querySelectorAll('[data-reveal]')].map((e) => getComputedStyle(e).opacity) }; });` and run `() => ({ first: window.__firstFrame, scripts: document.scripts.length, toggle: getComputedStyle(document.querySelector('[data-theme-toggle]')).display, clockShown: !document.querySelector('[data-clock]').hidden, place: document.querySelector('.place').innerText, field: getComputedStyle(document.querySelector('.field')).opacity, mailto: document.querySelector('a[data-email]').href, describedby: document.querySelector('a[data-email]').getAttribute('aria-describedby') })`. Expected: `first: { entry: null, reveal: nine "1" }` (the full rail in the first paint), `scripts: 1`, `toggle: "none"`, `clockShown: false`, `place: "IRVINE, CA"`, `field: "0"`, `mailto: "mailto:info@parsanaji.com"`, `describedby: null`. Take `1440x900-dark-nojs.png`. Stop the preview server (`Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }` in PowerShell) and delete the copy by its literal path (`rm -rf /tmp/tmp.AbC123`).

- [ ] **Step 10: Console check and screenshots on the dev server (spec 8.2.1, 8.3.2, 8.3.3)**

Console, six fresh contexts: for each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` and each look `dark`, `light`: `new_page` `url: "about:blank"`, `isolatedContext: "t8-console-<w>-<look>"`; `emulate` the viewport and `colorScheme`; `navigate_page` to `http://localhost:5173/`; run `async () => { await new Promise((r) => setTimeout(r, 4000)); return [...document.fonts].map((f) => `${f.weight} ${f.status}`); }` (→ `["400 loaded", "700 loaded"]`); `list_console_messages` with `types: ["error", "warn"]` → `<no console messages found>`; `close_page`.

Screenshots: in the `t8` page, at `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, `1366x768x1` and `768x1024x2,mobile,touch`, in `dark` and `light` (`emulate`, then reload `http://localhost:5173/`), `take_screenshot` to `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-8\<w>x<h>-<look>.png` (ten files). Each shows the rail, the `light` / `dark` word chip top-right on the name's line, and `IRVINE, CA · h:mm AM|PM PDT` in the footer. `close_page` the `t8` page, stop the dev server and its node child (`Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }`). Write every result into `task-8-report.md`.

- [ ] **Step 11: Commit**

```bash
git add src/theme/theme.ts src/theme/themeController.ts tests/theme.test.ts src/main.ts
git commit -m "feat(theme): theme toggle with persistence and the slice-1 boot

theme.ts holds the pure preference logic and the 300 ms ColorTween;
themeController.ts drives the word toggle, data-theme, the theme-color metas and
the field colours read from CSS. main.ts wires links, email copy, clock and theme,
releases the pre-hidden rail and applies the static fallback (no field yet).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 12: Push the slice and watch the deploy (spec 7.2.1; closes slice 1)**

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
git push -u origin resume-screen
git rev-parse HEAD
gh run list --branch resume-screen --limit 1 --json databaseId,headSha,status
```

Expected: the push prints `* [new branch]      resume-screen -> resume-screen` and `branch 'resume-screen' set up to track 'origin/resume-screen'.` Re-run the `gh run list` command until its `headSha` equals `git rev-parse HEAD` (the run appears a few seconds after the push), then:

```bash
gh run watch <databaseId> --exit-status
```

Expected: the `deploy` job's steps all pass (`npm ci`, `npm test` with `Test Files  16 passed (16)` and `Tests  134 passed (134)` in the log, `npm run build`, `Deploy to Cloudflare Pages`), and the command exits 0. A red run stops the task: read `gh run view <databaseId> --log-failed`, fix in a new commit, push again.

- [ ] **Step 13: Preview checks (spec 7.3.1, 8.2.1, 8.3)**

```bash
curl -sI https://resume-screen.parsanaji-com.pages.dev/ | grep -i '^content-security-policy'
for p in / /theme-boot.js /og.png /favicon.svg /favicon-32.png /favicon-192.png /apple-touch-icon.png /fonts/JetBrainsMono-Regular.subset.woff2 /fonts/JetBrainsMono-Bold.subset.woff2 /robots.txt; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://resume-screen.parsanaji-com.pages.dev$p")" "$p"; done
```

Expected: the CSP line from the unchanged `public/_headers`, `content-security-policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`; every path prints `200`. (`og:image` points at production `https://parsanaji.com/og.png`, which stays the teaser image until the merge; the preview's own `/og.png` is the new one.)

In the browser: six fresh contexts as in Step 10 against `https://resume-screen.parsanaji-com.pages.dev/` (`isolatedContext: "t8-preview-<w>-<look>"`), each with `list_console_messages` `types: ["error", "warn", "issue"]` → `<no console messages found>`, so no CSP violation (`Refused to …`) and no 404 for any icon or font. In the 1440×900 dark one also run the Step 9 item 1 script (expect the same values) and click the toggle once (expect `data-theme="light"` and both metas `#f2f6fe`). Screenshots at `1440x900x1`, `1280x720x1` and `390x844x3,mobile,touch` in both looks to `evidence/task-8/<w>x<h>-<look>-preview.png`. Close every page opened. Record the run id, the curl output and the preview results in `task-8-report.md`; the controller then appends the slice-1 ledger line and checkpoints.
