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

  it('public/favicon.svg is the mono P and one dash on the navy tile, one look for both schemes (4.10.7)', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8').replace(/\r\n/g, '\n');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n')).toBe(true);
    expect(svg).toContain('<rect width="32" height="32" rx="7" fill="#050a22"/>');
    expect(svg).toMatch(/<g fill="#e8eeff" transform="translate\(6 23\.5\)"><path transform="scale\([\d.]+ -[\d.]+\)" d="M/);
    expect(svg).toContain('<line x1="19.5" y1="23" x2="25.5" y2="23" stroke="#3b5df0" stroke-width="4.2" stroke-opacity="1" stroke-linecap="round"/>');
    expect(svg).not.toContain('<style');
    expect(svg).not.toContain('prefers-color-scheme');
    expect(svg.match(/<path /g)).toHaveLength(1);
  });
});
