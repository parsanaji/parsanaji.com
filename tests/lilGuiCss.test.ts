import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lilGuiCss, stripIconFont } from '../vite.config';

// lil-gui's stylesheet embeds its icon font as a data: URL. The site's CSP (public/_headers, font-src 'self') blocks it on
// previews, which logs a console error on ?debug pages (spec 4.12.2: the panel logs nothing at warning or error level).
const SAMPLE = [
  '.lil-gui .lil-title:before {',
  '  font-family: "lil-gui";',
  '  content: "▾";',
  '}',
  '',
  '@font-face {',
  '  font-family: "lil-gui";',
  '  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAA") format("woff2");',
  '}',
  '.lil-gui .lil-controller button:active {',
  '  background: var(--focus-color);',
  '}',
  '',
].join('\n');

describe('stripIconFont', () => {
  it('removes the lil-gui data: @font-face rule and nothing else', () => {
    const out = stripIconFont(SAMPLE);
    expect(out).not.toBeNull();
    expect(out).not.toContain('@font-face');
    expect(out).not.toContain('data:');
    expect(out).toContain('.lil-gui .lil-title:before {\n  font-family: "lil-gui";\n  content: "▾";\n}');
    expect(out).toContain('.lil-gui .lil-controller button:active {\n  background: var(--focus-color);\n}');
  });

  it('returns null when there is nothing to strip', () => {
    expect(stripIconFont('.lil-gui { color: red; }')).toBeNull();
  });

  it('strips the real lil-gui 0.21.0 stylesheet', () => {
    const css = readFileSync('node_modules/lil-gui/dist/lil-gui.css', 'utf8');
    expect(css).toContain('data:application/font-woff2');
    const out = stripIconFont(css);
    expect(out).not.toBeNull();
    expect(out).not.toContain('data:');
    expect(out).not.toContain('@font-face');
    expect(out).toContain('font-family: "lil-gui"'); // the three glyph rules stay and fall back to the system font
  });
});

describe('lilGuiCss plugin', () => {
  const plugin = lilGuiCss();
  const transform = plugin.transform as (this: unknown, code: string, id: string) => { code: string } | null;

  it('runs before Vite\'s CSS pipeline and only on lil-gui\'s stylesheet', () => {
    expect(plugin.enforce).toBe('pre');
    expect(transform.call(null, SAMPLE, 'C:\\repo\\node_modules\\lil-gui\\dist\\lil-gui.css')?.code).not.toContain('data:');
    expect(transform.call(null, SAMPLE, '/repo/node_modules/lil-gui/dist/lil-gui.css?direct')?.code).not.toContain('data:');
    expect(transform.call(null, SAMPLE, '/repo/src/styles.css')).toBeNull();
  });
});
