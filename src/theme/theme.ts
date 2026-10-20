/**
 * Pure theme logic (spec 3.5.10, 4.6.5-4.6.7): the stored preference, the resolved look, the toggle's word and
 * label, and the field-colour crossfade. No DOM access; themeController.ts does the DOM side.
 */
export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';
export const THEME_KEY = 'pn.theme';

/** sRGB, each channel 0..1. */
export type RGB = readonly [number, number, number];
/** The four field tier colours (P1: declared here, re-exported by src/field/renderer.ts). */
export interface FieldColors {
  f0: RGB;
  f1: RGB;
  f2: RGB;
  f3: RGB;
}

/** The stored preference; a missing, unknown or unreadable value means 'system' (3.5.10). */
export function readPref(storage: Pick<Storage, 'getItem'> | null): ThemePref {
  if (!storage) return 'system';
  try {
    const value = storage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

/** 'system' removes the key; storage that throws is ignored, so the toggle works for the session only. */
export function writePref(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePref): void {
  if (!storage) return;
  try {
    if (pref === 'system') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, pref);
  } catch {
    // private mode or blocked storage: keep the look for this page only
  }
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme {
  if (pref !== 'system') return pref;
  return systemDark ? 'dark' : 'light';
}

/** Flips the look; returns 'system' when the new look equals the OS look (smart default, 1.4). */
export function togglePref(current: Theme, systemDark: boolean): ThemePref {
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  return next === (systemDark ? 'dark' : 'light') ? 'system' : next;
}

/** The toggle names the target look (3.5.10, 5.1.4). */
export function toggleLabel(current: Theme): {
  word: 'dark' | 'light';
  label: 'Switch to dark mode' | 'Switch to light mode';
} {
  return current === 'dark'
    ? { word: 'light', label: 'Switch to light mode' }
    : { word: 'dark', label: 'Switch to dark mode' };
}

/** '#rrggbb' (surrounding whitespace allowed, as getPropertyValue returns it) to sRGB 0..1; anything else is black. */
export function parseHex(hex: string): RGB {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  return [Number.parseInt(m[1], 16) / 255, Number.parseInt(m[2], 16) / 255, Number.parseInt(m[3], 16) / 255];
}

export function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const BLACK: RGB = [0, 0, 0];

/**
 * Linear per-channel crossfade of the field colours on the wall clock (4.6.6): c = c0 + (c1 - c0) * min(1, dt / dur),
 * the same sRGB interpolation CSS applies to the registered tokens, so the page and the off cells move in step.
 */
export class ColorTween {
  private readonly durMs: number;
  private from: FieldColors = { f0: BLACK, f1: BLACK, f2: BLACK, f3: BLACK };
  private to: FieldColors = this.from;
  private t0 = 0;
  private running = false;

  constructor(durMs = 300) {
    this.durMs = durMs;
  }

  /** Jumps to `c` with no animation. */
  set(c: FieldColors): void {
    this.from = c;
    this.to = c;
    this.running = false;
  }

  /** Tweens from the value sampled at `nowMs` (so a second toggle mid-fade never jumps) to `to`. */
  start(to: FieldColors, nowMs: number): void {
    this.from = this.sample(nowMs);
    this.to = to;
    this.t0 = nowMs;
    this.running = true;
  }

  sample(nowMs: number): FieldColors {
    if (!this.running) return this.to;
    const u = this.durMs > 0 ? Math.min(1, Math.max(0, (nowMs - this.t0) / this.durMs)) : 1;
    if (u >= 1) {
      this.running = false;
      return this.to;
    }
    const { from, to } = this;
    return { f0: lerpRGB(from.f0, to.f0, u), f1: lerpRGB(from.f1, to.f1, u), f2: lerpRGB(from.f2, to.f2, u), f3: lerpRGB(from.f3, to.f3, u) };
  }

  /** True from start() until a sample at or after the end of the fade. */
  get active(): boolean {
    return this.running;
  }
}
