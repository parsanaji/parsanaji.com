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

// Slice-1 review fixes (ledger 2026-10-20): the band name must clear the toggle chip, and print must use the light column.
const BAND_ROOT_BLOCK = '@media (max-width: 719.98px), not all and (min-aspect-ratio: 1/1) {\n  :root {';
const PRINT_BLOCK = '@media print {\n  :root, :root[data-theme] {';

/** `clamp(<min>px, <k>vw, <max>px)` evaluated at a viewport width. */
function clampAt(expr: string, vw: number): number {
  const m = expr.match(/^clamp\(([\d.]+)px, ([\d.]+)vw, ([\d.]+)px\)$/);
  expect(m, `not a px/vw/px clamp: ${expr}`).not.toBeNull();
  const [, min, k, max] = m!.map(Number);
  return Math.min(Math.max(min, (k * vw) / 100), max);
}

describe('band fit (3.1.13, 3.1.16; slice-1 review I1)', () => {
  const band = block(BAND_ROOT_BLOCK);
  const bandStart = CSS.indexOf(BAND_ROOT_BLOCK);
  const toggleStart = CSS.indexOf('.theme-toggle {', bandStart);
  const toggleRule = CSS.slice(toggleStart, CSS.indexOf('}', toggleStart));
  const baseStart = CSS.indexOf('.theme-toggle {');
  const baseRule = CSS.slice(baseStart, CSS.indexOf('}', baseStart));
  const padOf = (rule: string): number | undefined => {
    const m = rule.match(/padding: 0 ([0-9.]+)ch;/);
    return m ? Number(m[1]) : undefined;
  };
  const padCh = padOf(toggleRule) ?? padOf(baseRule) ?? NaN; // the band inherits the base chip padding unless it overrides it

  it('gives the band toggle its own, tighter padding', () => {
    expect(toggleStart).toBeGreaterThan(bandStart);
    expect(padOf(toggleRule)).toBeDefined();
    expect(padCh).toBeLessThan(2.5);
  });

  it.each([320, 360, 375, 390, 414, 430, 480, 540, 600, 719])('clears the chip by 8 px at %i px', (w) => {
    const gutter = clampAt(band['--gutter'], w);
    const fsName = clampAt(band['--fs-name'], w);
    const fsLink = clampAt(band['--fs-link'], w);
    // "Parsa Naji": 10 glyphs at JetBrains Mono's 0.6 em advance, letter-spacing -0.025 em (the -0.045 em margin is slack)
    const nameRight = gutter + (10 * 0.6 - 10 * 0.025) * fsName;
    // the chip: the 5ch word box plus the padding on both sides, 1 px border each side
    const chipLeft = w - gutter - ((5 + 2 * padCh) * 0.6 * fsLink + 2);
    expect(chipLeft - nameRight).toBeGreaterThanOrEqual(8);
  });

  it('keeps the band bracket affordance inside the tighter chip', () => {
    const bandEnd = CSS.indexOf('\n}\n', bandStart);
    const bandCss = CSS.slice(bandStart, bandEnd);
    const before = bandCss.match(/\.theme-word::before \{ padding-right: ([\d.]+)ch; \}/)?.[1];
    const after = bandCss.match(/\.theme-word::after {2}\{ padding-left: ([\d.]+)ch; \}/)?.[1];
    expect(before).toBeDefined();
    expect(after).toBe(before);
    expect(Number(before) + 1).toBeLessThanOrEqual(padCh); // bracket glyph (1ch) plus its gap fits in the padding
  });
});

describe('print (3.6.6; slice-1 review I2)', () => {
  it('forces the light column and color-scheme light for both looks', () => {
    expect(block(PRINT_BLOCK)).toEqual(LIGHT);
  });

  it('declares the print tokens after every screen token block, so the cascade cannot undo them', () => {
    const print = CSS.indexOf(PRINT_BLOCK);
    expect(print).toBeGreaterThan(CSS.indexOf(LIGHT_FORCED_BLOCK));
    expect(print).toBeGreaterThan(CSS.indexOf(BAND_ROOT_BLOCK));
    expect(CSS.match(/@media print/g)).toHaveLength(1);
  });
});
