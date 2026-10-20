// Generates the two self-hosted JetBrains Mono subsets from the vendored v2.304 sources in scripts/fonts-src/ (SIL OFL 1.1).
// Run: node scripts/subset-fonts.mjs   (also: npm run fonts). Spec 4.11.
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

const srcDir = path.resolve('scripts/fonts-src');
const outDir = path.resolve('public/fonts');

// Printable ASCII U+0020-U+007E plus the typography the page and its scripts write (spec 4.11.2, 3.5.13).
const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const TEXT = `${ASCII}·—–●○…’“”é`;
// Without noLayoutClosure the coding-ligature closure makes the pair 57.3 KB (spec 4.11.2, risk 9.2).
const OPTIONS = { targetFormat: 'woff2', noLayoutClosure: true };

const jobs = [
  { src: 'JetBrainsMono-Regular.woff2', out: 'JetBrainsMono-Regular.subset.woff2' },
  { src: 'JetBrainsMono-Bold.woff2', out: 'JetBrainsMono-Bold.subset.woff2' },
];

await mkdir(outDir, { recursive: true });
// OFL 1.1 condition 2: the license travels with every redistributed copy, subsets included.
await copyFile(path.join(srcDir, 'OFL.txt'), path.join(outDir, 'LICENSE.txt'));
let total = 0;
for (const job of jobs) {
  const input = await readFile(path.join(srcDir, job.src));
  const output = await subsetFont(input, TEXT, OPTIONS);
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
