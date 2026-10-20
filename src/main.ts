// Boot orchestration (spec 4.7): the rail's DOM modules and the theme, then the field gate (4.7.3) and the App (4.7.4).
import { App } from './app';
import { CONTENT } from './content';
import { seedFromLocation } from './core/prng';
import { DEFAULT_FIELD, cloneField } from './field/params';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';

/** Spec 4.12.1: true on the dev server and preview builds, false (and folded away) in production. */
const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';

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

/** Spec 3.6.2: no field; the rail shows at once. One DEV warning per failure, nothing in production. */
function applyFallback(doc: Document, reason: string): void {
  devWarn(`static fallback: ${reason}`);
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/**
 * 4.7.2: when theme-boot.js set data-entry="run" and main.ts runs before 4000 ms, switch to "wait"
 * (cancelling the CSS failsafe) and plan the entry; otherwise the failsafe already showed the rail,
 * so remove data-entry and plan none (11.7).
 */
function takeEntryControl(doc: Document, nowMs: number): boolean {
  const html = doc.documentElement;
  if (html.getAttribute('data-entry') === 'run' && nowMs < 4000) {
    html.setAttribute('data-entry', 'wait');
    return true;
  }
  html.removeAttribute('data-entry');
  return false;
}

async function boot(): Promise<void> {
  const doc = document;
  const win = window;
  const query = new URLSearchParams(win.location.search);
  const params = cloneField(DEFAULT_FIELD);
  let app: App | null = null;
  initLinks(CONTENT.links.linkedin, doc);
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') });
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  const theme = initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entry = takeEntryControl(doc, win.performance.now());

  // 4.7.3 field gate
  if (query.has('nowebgl')) {
    applyFallback(doc, 'nowebgl');
    return;
  }
  if (win.matchMedia('(forced-colors: active)').matches) {
    applyFallback(doc, 'forced-colors');
    return;
  }
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  let mountTweaks: ((a: App) => void) | null = null;
  if (PN_DEBUG && query.has('debug')) {
    const { prepareTweaks } = await import('./tweaks');
    mountTweaks = prepareTweaks(params);
  }
  app = App.start({
    canvas,
    params,
    reduced,
    seed: seedFromLocation(win.location.search),
    colors: theme.colors,
    entry,
    rail: doc.querySelector<HTMLElement>('[data-rail]'),
    scrim: doc.querySelector<HTMLElement>('.scrim'),
    doc,
    win,
  });
  if (!app) {
    applyFallback(doc, 'no-webgl2');
    return;
  }
  app.onFallback(() => {
    app = null;
    applyFallback(doc, 'field');
  });
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
  if (app) mountTweaks?.(app);
}

boot().catch((error: unknown) => {
  devWarn(String(error));
  applyFallback(document, 'boot');
});
