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
