// Slice-1 boot (spec 4.7.1 subset): the rail's DOM modules and the theme. There is no field until Task 15,
// so every load applies the static fallback and the rail shows at once (P9).
import { CONTENT } from './content';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';

/** One console.warn per failure on the dev server; production logs nothing at warn or error level (4.7.6). */
function devWarn(message: string): void {
  if (import.meta.env.DEV) console.warn(`[pn] ${message}`);
}

/** localStorage, or null where reading it throws (blocked storage counts as "system", 3.5.10). */
function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** The static fallback (3.6.2): CSS hides the canvas and the scrim, and the rail shows at once. Logs nothing (P9). */
function applyFallback(doc: Document): void {
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}

function boot(): void {
  const doc = document;
  const win = window;
  initLinks(CONTENT.links.linkedin, doc);
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { live: doc.querySelector<HTMLElement>('[data-live]') });
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: () => {},
  });
  takeEntryControl(doc);
  applyFallback(doc); // no field until Task 15
}

try {
  boot();
} catch (error) {
  devWarn(String(error));
  applyFallback(document);
}
