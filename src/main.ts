import { CONTENT } from './content';
import { startClock } from './ui/clock';
import { initExitLine } from './ui/exitLine';

function showStatic(): void {
  document.documentElement.classList.add('no-webgl');
  const block = document.getElementById('static');
  if (block) block.hidden = false;
}

function boot(): void {
  initExitLine(CONTENT.links.linkedin);
  const timeEl = document.getElementById('clock-time');
  const zoneEl = document.getElementById('clock-zone');
  if (timeEl && zoneEl) startClock(timeEl, zoneEl, CONTENT.clock.timeZone);
  // Slice 1: the particle engine does not exist yet; always show the typographic page.
  showStatic();
}

boot();
