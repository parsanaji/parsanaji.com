import { App } from './app';
import { waitForFont } from './boot/fonts';
import { hasWebGL2 } from './boot/webgl';
import { CONTENT } from './content';
import { DEFAULTS, cloneParams } from './engine/defaults';
import { seedFromLocation } from './engine/prng';
import { startClock } from './ui/clock';
import { initExitLine } from './ui/exitLine';

function showStatic(): void {
  document.documentElement.classList.add('no-webgl');
  const block = document.getElementById('static');
  if (block) block.hidden = false;
}

async function boot(): Promise<void> {
  initExitLine(CONTENT.links.linkedin);
  const timeEl = document.getElementById('clock-time');
  const zoneEl = document.getElementById('clock-zone');
  const clockEl = document.getElementById('clock');
  if (timeEl && zoneEl && clockEl) {
    startClock(timeEl, zoneEl, CONTENT.clock.timeZone);
    clockEl.hidden = false; // no JavaScript, no clock (spec 5)
  }

  const query = new URLSearchParams(location.search);
  const canvas = document.getElementById('field');
  if (!(canvas instanceof HTMLCanvasElement) || query.has('nowebgl') || !hasWebGL2()) {
    showStatic();
    return;
  }

  const params = cloneParams(DEFAULTS);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // [Task 15] debug panel loads here, before sampling, so saved tweaks affect N
  await waitForFont(`${params.raster.fontWeight} 10px "${params.raster.fontFamily}"`, 2000);
  const app = new App({ canvas, params, reduced, seed: seedFromLocation(location.search) });
  app.start();
}

boot().catch((error: unknown) => {
  console.error(error);
  showStatic();
});
