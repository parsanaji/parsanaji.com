import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 12.16 (Parsa, 2026-10-21): the phone layout is one screen. The field fills the viewport behind the content under
// a flat scrim (the entry name forms at the screen's centre), rows flow inline, and the stack fits 100svh on every
// current phone. 12.17 (Parsa, 2026-10-22: "everything looks super squished … remove the projects"): the Projects
// block is hidden on phones, the type and rhythm loosen, and the one ladder step trims Misc under 600 px tall.
// Token values are pinned by tests/tokens.test.ts.
const CSS = readFileSync('src/styles.css', 'utf8').replace(/\r\n/g, '\n');
const HTML = readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const BAND_ROOT_BLOCK = '@media (max-width: 719.98px), not all and (min-aspect-ratio: 1/1) {\n  :root {';

/** Declarations of the first rule whose text starts with `opener`. */
function block(opener: string): Record<string, string> {
  const start = CSS.indexOf(opener);
  expect(start, `missing ${opener}`).toBeGreaterThanOrEqual(0);
  const body = CSS.slice(CSS.indexOf('{', start) + 1, CSS.indexOf('}', start));
  const decls: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
  return decls;
}

/** `clamp(<min>px, <k><unit>, <max>px)` evaluated at a viewport length (100 units). */
function clampAt(expr: string, unit: 'vw' | 'svh', len: number): number {
  const m = expr.match(new RegExp(`^clamp\\(([\\d.]+)px, ([\\d.]+)${unit}, ([\\d.]+)px\\)$`));
  expect(m, `not a px/${unit}/px clamp: ${expr}`).not.toBeNull();
  const [, min, k, max] = m!.map(Number);
  return Math.min(Math.max(min, (k * len) / 100), max);
}

const phoneStart = CSS.indexOf(BAND_ROOT_BLOCK);
const phone = CSS.slice(phoneStart, CSS.indexOf('\n}\n', phoneStart) + 3);

describe('phone layout (3.1.13 as amended by 12.16 and 12.17)', () => {
  it('drops the bottom band: the field keeps its rail box and the scrim is a flat 80 % veil over the whole viewport', () => {
    expect(phoneStart).toBeGreaterThan(0);
    expect(phone).not.toContain('--band-h');
    expect(phone).not.toContain('inset: auto');
    expect(phone).not.toMatch(/\.field \{[^}]*(z-index|height)/);
    expect(phone).toContain(
      '.scrim {\n    inset: 0;\n    width: auto;\n    background: var(--scrim-mid);\n    background: color-mix(in srgb, var(--scrim-solid) 80%, transparent);\n  }',
    );
    expect(CSS).not.toContain('html.no-webgl .rail');
  });

  it('overdraws the field and the veil 160 px past the viewport top and bottom, so the Safari bars show dashes (12.18)', () => {
    expect(phone).toContain('.field,\n  .scrim {\n    top: calc(-160px - env(safe-area-inset-top, 0px));\n    height: calc(100% + 320px + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px));\n  }');
    expect(phone.indexOf('.field,\n  .scrim {')).toBeGreaterThan(phone.indexOf('.scrim {\n    inset: 0;'));
  });

  it('sizes the rail to the small viewport with safe-area padding and no band padding', () => {
    expect(phone).toContain('min-height: 100vh;\n    min-height: 100svh;');
    expect(phone).toContain('calc(var(--pad-y) + env(safe-area-inset-bottom, 0px))');
    expect(phone).not.toContain('var(--fade)');
  });

  it('flows rows inline, hides the Projects block and pins the footer to the bottom edge', () => {
    expect(phone).toContain('.row { display: block; }');
    expect(phone).toContain('.when { margin-right: 0.9em; }');
    expect(phone).toContain('.rail > .block--proj { display: none; }');
    expect(phone).not.toContain('--fs-proj'); // 12.17: no project rows on phones
    expect(phone).toContain('.rail > .links { margin-top: auto; padding-top: var(--gap-foot); }');
    expect(CSS).not.toContain('@media (max-width: 519.98px)'); // 3.1.14 retired
  });

  it('keys the svh rhythm behind @supports so an older browser keeps the vh values', () => {
    const sup = phone.indexOf('@supports (height: 1svh) {');
    expect(sup).toBeGreaterThan(0);
    const supBlock = phone.slice(sup, phone.indexOf('\n  }\n', sup));
    const root = block(BAND_ROOT_BLOCK);
    for (const k of ['--pad-y', '--gap-tag', '--gap-block', '--row-pad', '--gap-foot', '--gap-meta']) {
      expect(supBlock).toMatch(new RegExp(`${k}:\\s*clamp\\([\\d.]+px, [\\d.]+svh, [\\d.]+px\\);`));
      expect(root[k]).toMatch(/^clamp\([\d.]+px, [\d.]+vh, [\d.]+px\)$/);
    }
  });

  it('trims Misc to three tags under 600 px tall and has no other phone ladder step', () => {
    expect(CSS).toContain('@media (max-width: 719.98px) and (max-height: 599.98px) {\n  .tags li:nth-child(n+4) {');
    expect(CSS).not.toContain('@media (max-width: 719.98px) and (max-height: 719.98px)');
    expect(CSS.match(/@media \(max-width: 719\.98px\) and \(max-height/g)).toHaveLength(1);
  });
});

describe('phone stack fits one screen (12.16, 12.17)', () => {
  const strip = (s: string): string =>
    s.replace(/<span class="sr-only">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const section = (cls: string): string => {
    const i = HTML.indexOf(`class="block block--${cls}"`);
    expect(i, `missing block--${cls}`).toBeGreaterThan(0);
    return HTML.slice(i, HTML.indexOf('</section>', i));
  };
  /** The rows of a block as rendered: the when text and the value text with the CSS "· " before the sub. */
  const rows = (cls: string): { when: string; what: string }[] =>
    [...section(cls).matchAll(/<li class="row">(?:<span class="when">(.*?)<\/span>)?<span class="what">(.*?)<\/span><\/li>/g)].map((m) => ({
      when: m[1] ? strip(m[1]) : '',
      what: strip(m[2].replace('<span class="sub">', '<span class="sub">· ')),
    }));
  const tagline = strip(/<p class="tagline">(.*?)<\/p>/.exec(HTML)![1]);
  const tags = [...section('misc').matchAll(/<li>(.*?)<\/li>/g)].map((m) => strip(m[1]));

  const CH = 0.6; // JetBrains Mono advance
  const root = block(BAND_ROOT_BLOCK);
  const supStart = CSS.indexOf('@supports (height: 1svh) {', phoneStart);
  const sup = block(CSS.slice(supStart, supStart + 40));

  /** Greedy word wrap of runs (each run's words at its own size, an optional trailing margin); the line count. */
  function wrapLines(runs: { text: string; fs: number; after?: number }[], avail: number): number {
    let lines = 1;
    let x = 0;
    for (const run of runs) {
      for (const w of run.text.split(' ').filter(Boolean)) {
        const ww = w.length * CH * run.fs;
        const space = x === 0 ? 0 : CH * run.fs;
        if (x > 0 && x + space + ww > avail + 0.01) {
          lines++;
          x = ww;
        } else x += space + ww;
      }
      x += run.after ?? 0;
    }
    return lines;
  }
  /** `.tags`: nowrap items of text + a 2.4ch separator in a box widened by one separator. */
  function tagLines(items: string[], fs: number, avail: number): number {
    const sep = 2.4 * CH * fs;
    let n = 1;
    let x = 0;
    for (const t of items) {
      const w = t.length * CH * fs + sep;
      if (x > 0 && x + w > avail + sep + 0.01) {
        n++;
        x = 0;
      }
      x += w;
    }
    return n;
  }

  function stackHeight(w: number, h: number): number {
    const px = (k: string) => clampAt(root[k], 'vw', w);
    const vh = (k: string) => clampAt(sup[k], 'svh', h);
    const avail = w - 2 * px('--gutter');
    const fsBody = px('--fs-body');
    const fsWhen = px('--fs-when');
    const fsMeta = px('--fs-meta');
    const fsMisc = px('--fs-misc');
    const eyebrow = px('--fs-eyebrow') * 1.2 + Number.parseFloat(root['--gap-eyebrow']);
    const rowPad = vh('--row-pad');
    const gapBlock = vh('--gap-block');
    const misc = h <= 599.98 ? tags.slice(0, 3) : tags;
    const row = (r: { when: string; what: string }): number =>
      wrapLines([{ text: r.when, fs: fsWhen, after: r.when ? 0.9 * fsBody : 0 }, { text: r.what, fs: fsBody }], avail) * fsBody * 1.45 + 2 * rowPad;
    const exp = rows('exp');
    const tl = tagLines(misc, fsMisc, avail);
    const parts = [
      vh('--pad-y'),
      px('--fs-name'),
      vh('--gap-tag') + wrapLines([{ text: tagline, fs: px('--fs-tag') }], avail) * px('--fs-tag') * 1.4,
      vh('--gap-tag') + fsMeta * 1.4, // status
      gapBlock + eyebrow + exp.reduce((s, r) => s + row(r), 0) + (exp.length - 1), // hairlines
      // Projects: hidden on phones (12.17)
      gapBlock + eyebrow + rows('edu').reduce((s, r) => s + row(r), 0),
      gapBlock + eyebrow + tl * fsMisc * 1.5 + (tl - 1) * 0.15 * fsMisc,
      vh('--gap-foot') + px('--fs-link') * 1.45,
      vh('--gap-meta') + fsMeta * 1.4,
      vh('--pad-y'),
    ];
    return parts.reduce((a, b) => a + b, 0);
  }

  it('reads the content it measures', () => {
    expect(tags).toHaveLength(7);
    expect(rows('exp')).toHaveLength(3);
    expect(rows('exp')[0]).toEqual({ when: '2025 —', what: 'Software Developer · Koreex Systems' });
  });

  // visible viewports with the browser chrome shown: iPhone SE / 14 / 15 Pro / 15 Pro Max in Safari, Galaxy S and
  // Pixel 7 in Chrome, then the full-screen (PWA) iPhone sizes and a portrait iPad
  it.each([
    [375, 553],
    [390, 664],
    [393, 672],
    [430, 746],
    [360, 724],
    [412, 791],
    [375, 667],
    [390, 844],
    [768, 1024],
  ])('fits %i x %i with 12 px to spare', (w, h) => {
    expect(stackHeight(w, h)).toBeLessThanOrEqual(h - 12);
  });

  it('shows all seven tags from 600 px tall and keeps them to four lines at 390 px wide', () => {
    const avail = 390 - 2 * clampAt(root['--gutter'], 'vw', 390);
    expect(tagLines(tags, clampAt(root['--fs-misc'], 'vw', 390), avail)).toBeLessThanOrEqual(4);
  });
});
