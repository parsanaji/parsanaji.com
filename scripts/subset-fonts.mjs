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
