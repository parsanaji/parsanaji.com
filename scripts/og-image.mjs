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
