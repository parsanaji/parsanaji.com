import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ColorTween,
  type FieldColors,
  THEME_KEY,
  lerpRGB,
  parseHex,
  readPref,
  resolveTheme,
  toggleLabel,
  togglePref,
  writePref,
} from '../src/theme/theme';
import { initTheme, readFieldColors } from '../src/theme/themeController';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
};
const throwingStorage = {
  getItem: (): string | null => {
    throw new Error('SecurityError');
  },
  setItem: (): void => {
    throw new Error('QuotaExceededError');
  },
  removeItem: (): void => {
    throw new Error('SecurityError');
  },
};

describe('preference (3.5.10)', () => {
  it('readPref returns a stored look and "system" for anything else', () => {
    expect(THEME_KEY).toBe('pn.theme');
    expect(readPref(memoryStorage({ 'pn.theme': 'light' }))).toBe('light');
    expect(readPref(memoryStorage({ 'pn.theme': 'dark' }))).toBe('dark');
    expect(readPref(memoryStorage({ 'pn.theme': 'sepia' }))).toBe('system');
    expect(readPref(memoryStorage())).toBe('system');
    expect(readPref(throwingStorage)).toBe('system');
    expect(readPref(null)).toBe('system');
  });

  it('writePref stores a look, removes the key for "system" and never throws', () => {
    const s = memoryStorage();
    writePref(s, 'dark');
    expect(s.map.get('pn.theme')).toBe('dark');
    writePref(s, 'system');
    expect(s.map.has('pn.theme')).toBe(false);
    expect(() => writePref(throwingStorage, 'light')).not.toThrow();
    expect(() => writePref(throwingStorage, 'system')).not.toThrow();
    expect(() => writePref(null, 'light')).not.toThrow();
  });

  it('resolveTheme follows the OS only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('togglePref flips and collapses to "system" when the flip equals the OS look', () => {
    expect(togglePref('dark', true)).toBe('light');
    expect(togglePref('light', true)).toBe('system');
    expect(togglePref('light', false)).toBe('dark');
    expect(togglePref('dark', false)).toBe('system');
  });

  it('toggleLabel names the target look (5.1.4)', () => {
    expect(toggleLabel('dark')).toEqual({ word: 'light', label: 'Switch to light mode' });
    expect(toggleLabel('light')).toEqual({ word: 'dark', label: 'Switch to dark mode' });
  });
});

describe('colours', () => {
  it('parseHex trims and reads #rrggbb as sRGB 0..1, anything else is black', () => {
    expect(parseHex(' #050a22')).toEqual([5 / 255, 10 / 255, 34 / 255]);
    expect(parseHex('#FFFFFF')).toEqual([1, 1, 1]);
    expect(parseHex('')).toEqual([0, 0, 0]);
    expect(parseHex('rgb(5 10 34)')).toEqual([0, 0, 0]);
  });

  it('lerpRGB interpolates each channel', () => {
    expect(lerpRGB([0, 0.5, 1], [1, 0.5, 0], 0.25)).toEqual([0.25, 0.5, 0.75]);
  });
});

describe('ColorTween (4.6.6)', () => {
  const solid = (v: number): FieldColors => ({ f0: [v, v, v], f1: [v, v, v], f2: [v, v, v], f3: [v, v, v] });

  it('is linear over 300 ms on the wall clock and lands exactly on the target', () => {
    const t = new ColorTween();
    t.set(solid(0));
    expect(t.active).toBe(false);
    t.start(solid(1), 1000);
    expect(t.active).toBe(true);
    expect(t.sample(1150).f0[0]).toBeCloseTo(0.5, 12);
    expect(t.sample(1300)).toEqual(solid(1));
    expect(t.active).toBe(false);
    expect(t.sample(5000)).toEqual(solid(1));
  });

  it('starts a second tween from the value sampled at that moment (no jump)', () => {
    const t = new ColorTween(300);
    t.set(solid(0));
    t.start(solid(1), 0);
    t.start(solid(0), 150); // reverse at the midpoint
    expect(t.sample(150).f2[1]).toBeCloseTo(0.5, 12);
    expect(t.sample(300).f2[1]).toBeCloseTo(0.25, 12);
    expect(t.sample(450)).toEqual(solid(0));
  });
});

// A minimal DOM for the controller: <html> with classes and attributes, two theme-color metas, the toggle and the
// computed --field-* / --theme-color, which follow data-theme and the OS scheme the way src/styles.css does.
const DARK_CSS: Record<string, string> = {
  '--field-0': '#050a22',
  '--field-1': '#3b5df0',
  '--field-2': '#8db0ff',
  '--field-3': '#e8eeff',
  '--theme-color': '#050a22',
};
const LIGHT_CSS: Record<string, string> = {
  '--field-0': '#f2f6fe',
  '--field-1': '#8db0ff',
  '--field-2': '#3b5df0',
  '--field-3': '#0832b8',
  '--theme-color': '#f2f6fe',
};

function fakeEnv(opts: { stored?: string; osDark: boolean; button?: boolean }) {
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const root = {
    setAttribute: (k: string, v: string) => void attrs.set(k, v),
    removeAttribute: (k: string) => void attrs.delete(k),
    classList: { add: (c: string) => void classes.add(c), remove: (c: string) => void classes.delete(c) },
  };
  const systemDark = Object.assign(new EventTarget(), { matches: opts.osDark });
  const metas = [{ content: '#f2f6fe' }, { content: '#050a22' }];
  const button = Object.assign(new EventTarget(), {
    hidden: true,
    label: '',
    to: '', // data-to: the look a press leads to; CSS shows the sun for 'light' and the moon for 'dark' (12.20)
    setAttribute(k: string, v: string) {
      if (k === 'aria-label') this.label = v;
      if (k === 'data-to') this.to = v;
    },
  });
  const look = () => {
    const t = attrs.get('data-theme');
    return t === 'light' || (t === undefined && !systemDark.matches) ? LIGHT_CSS : DARK_CSS;
  };
  const doc = {
    documentElement: root,
    defaultView: { getComputedStyle: () => ({ getPropertyValue: (name: string) => ` ${look()[name] ?? ''}` }) },
    querySelectorAll: (sel: string) => (sel === 'meta[name="theme-color"]' ? metas : []),
  };
  const storage = memoryStorage(opts.stored ? { 'pn.theme': opts.stored } : {});
  const onChange = vi.fn();
  const handle = initTheme({
    doc: doc as unknown as Document,
    storage: storage as unknown as Storage,
    systemDark: systemDark as unknown as MediaQueryList,
    button: opts.button === false ? null : (button as unknown as HTMLButtonElement),
    onChange,
  });
  const press = () => button.dispatchEvent(new Event('click'));
  const osChange = (dark: boolean) => {
    systemDark.matches = dark;
    systemDark.dispatchEvent(new Event('change'));
  };
  return { attrs, classes, metas, button, storage, onChange, handle, press, osChange, doc };
}

describe('initTheme (4.6.5-4.6.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('follows the OS by default: no data-theme, original metas, the icon names the other look, button shown', () => {
    const e = fakeEnv({ osDark: true });
    expect(e.handle.theme).toBe('dark');
    expect(e.attrs.has('data-theme')).toBe(false);
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#050a22']);
    expect(e.button.to).toBe('light');
    expect(e.button.label).toBe('Switch to light mode');
    expect(e.button.hidden).toBe(false);
    expect(e.handle.colors.f3).toEqual(parseHex('#e8eeff'));
  });

  it('applies a stored look opposite the OS and points both metas at it', () => {
    const e = fakeEnv({ stored: 'light', osDark: true });
    expect(e.handle.theme).toBe('light');
    expect(e.attrs.get('data-theme')).toBe('light');
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#f2f6fe']);
    expect(e.button.to).toBe('dark');
    expect(e.handle.colors.f3).toEqual(parseHex('#0832b8'));
  });

  it('a press flips the look, stores it, crossfades and relabels; theme-anim lasts 320 ms', () => {
    const e = fakeEnv({ osDark: true });
    e.press();
    expect(e.classes.has('theme-anim')).toBe(true);
    expect(e.attrs.get('data-theme')).toBe('light');
    expect(e.storage.map.get('pn.theme')).toBe('light');
    expect(e.onChange).toHaveBeenCalledWith(readFieldColors(e.doc as unknown as Document), true);
    expect(e.onChange.mock.calls[0][0].f0).toEqual(parseHex('#f2f6fe'));
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#f2f6fe']);
    expect(e.button.to).toBe('dark');
    expect(e.button.label).toBe('Switch to dark mode');
    expect(e.handle.theme).toBe('light');
    vi.advanceTimersByTime(319);
    expect(e.classes.has('theme-anim')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(e.classes.has('theme-anim')).toBe(false);
  });

  it('pressing back to the OS look removes the key and restores both metas', () => {
    const e = fakeEnv({ osDark: true });
    e.press();
    e.press();
    expect(e.storage.map.has('pn.theme')).toBe(false);
    expect(e.attrs.has('data-theme')).toBe(false);
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#050a22']);
    expect(e.handle.theme).toBe('dark');
  });

  it('a second press within 320 ms re-arms the theme-anim timer', () => {
    const e = fakeEnv({ osDark: false });
    e.press();
    vi.advanceTimersByTime(200);
    e.press();
    vi.advanceTimersByTime(200);
    expect(e.classes.has('theme-anim')).toBe(true);
    vi.advanceTimersByTime(120);
    expect(e.classes.has('theme-anim')).toBe(false);
  });

  it('follows an OS change while on "system", and ignores it while a look is stored', () => {
    const e = fakeEnv({ osDark: true });
    e.osChange(false);
    expect(e.handle.theme).toBe('light');
    expect(e.onChange).toHaveBeenLastCalledWith(readFieldColors(e.doc as unknown as Document), true);
    expect(e.button.to).toBe('dark');
    expect(e.storage.map.has('pn.theme')).toBe(false);
    const stored = fakeEnv({ stored: 'dark', osDark: true });
    stored.osChange(false);
    expect(stored.handle.theme).toBe('dark');
    expect(stored.onChange).not.toHaveBeenCalled();
  });

  it('works without a button and stops listening on dispose()', () => {
    const e = fakeEnv({ osDark: true, button: false });
    expect(e.handle.theme).toBe('dark');
    e.handle.dispose();
    e.osChange(false);
    expect(e.onChange).not.toHaveBeenCalled();
  });
});
