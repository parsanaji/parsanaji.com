import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import { SCRAMBLE_GLYPHS, initScramble, scrambleText } from '../src/eggs/scramble';

const NAME = 'Parsa Naji';
const DUR = 600;
const STEP = 40;
/** scrambleText at t = 0, 40, 80, 200 and 400 ms for seed 42 (computed by running this code). */
const GOLDEN_42: readonly string[] = ['rg#wM Tt%i', 'S&2WO ysAi', '9DrCT N5mB', 'Pwxy= ?f?K', 'Parsa QeLv'];

/** rand from a seeded mulberry32 table, the way initScramble builds it. */
function seededRand(seed: number): (step: number, i: number) => number {
  const next = mulberry32(seed);
  const table = Array.from({ length: 15 }, () => Array.from({ length: NAME.length }, () => next()));
  return (step, i) => table[step]?.[i] ?? 0;
}

/** The h1 as far as the module uses it. */
class FakeName extends EventTarget {
  textContent: string = NAME;
  readonly attrs = new Map<string, string>();
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }
  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }
  click(): void {
    this.dispatchEvent(new Event('click'));
  }
}

describe('SCRAMBLE_GLYPHS (spec 3.5.6)', () => {
  it('is letters, digits and #%&*+=?@<>/, all printable ASCII inside the font subset', () => {
    expect(SCRAMBLE_GLYPHS).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/');
    expect(new Set(SCRAMBLE_GLYPHS).size).toBe(SCRAMBLE_GLYPHS.length);
    for (const ch of SCRAMBLE_GLYPHS) {
      const code = ch.charCodeAt(0);
      expect(code).toBeGreaterThanOrEqual(0x21);
      expect(code).toBeLessThanOrEqual(0x7e);
    }
  });
});

describe('scrambleText (spec 3.5.6, 8.1.15)', () => {
  const rand = seededRand(42);

  it('ends on the exact target', () => {
    expect(scrambleText(NAME, DUR, DUR, STEP, rand)).toBe(NAME);
    expect(scrambleText(NAME, 5000, DUR, STEP, rand)).toBe(NAME);
  });

  it('keeps the space and the length at every step', () => {
    for (let t = 0; t <= DUR; t += STEP) {
      const s = scrambleText(NAME, t, DUR, STEP, rand);
      expect(s).toHaveLength(NAME.length);
      expect(s[5]).toBe(' ');
    }
  });

  it('draws every unsettled glyph from SCRAMBLE_GLYPHS', () => {
    for (let t = 0; t < DUR; t += STEP) {
      const s = scrambleText(NAME, t, DUR, STEP, rand);
      for (let i = 0; i < s.length; i++) if (i !== 5 && s[i] !== NAME[i]) expect(SCRAMBLE_GLYPHS).toContain(s[i]);
    }
  });

  it('settles letter i by durMs × (0.3 + 0.7 × i / (n − 1))', () => {
    const slash = (): number => 0.9999; // always "/", which "Parsa Naji" does not contain
    for (let i = 0; i < NAME.length; i++) {
      if (i === 5) continue;
      const settle = DUR * (0.3 + (0.7 * i) / (NAME.length - 1));
      expect(scrambleText(NAME, settle, DUR, STEP, slash)[i]).toBe(NAME[i]);
      expect(scrambleText(NAME, settle - 1, DUR, STEP, slash)[i]).toBe('/');
    }
  });

  it('is deterministic for a seed', () => {
    const a = seededRand(7);
    const b = seededRand(7);
    const c = seededRand(8);
    const frames = (r: (s: number, i: number) => number) => Array.from({ length: 15 }, (_, k) => scrambleText(NAME, k * STEP, DUR, STEP, r));
    expect(frames(a)).toEqual(frames(b));
    expect(frames(a)).not.toEqual(frames(c));
  });

  it('matches the golden first frames for seed 42', () => {
    expect([0, 40, 80, 200, 400].map((t) => scrambleText(NAME, t, DUR, STEP, rand))).toEqual(GOLDEN_42);
  });
});

describe('initScramble (spec 3.5.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const opts = (reduced = false) => ({ durMs: DUR, stepMs: STEP, seed: 42, reduced: () => reduced });

  it('scrambles on click, carries aria-label while running, and settles at 600 ms', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    expect(el.attrs.get('aria-label')).toBe(NAME);
    expect(el.textContent).toBe(GOLDEN_42[0]);
    vi.advanceTimersByTime(40);
    expect(el.textContent).toBe(GOLDEN_42[1]);
    vi.advanceTimersByTime(519);
    expect(el.textContent).not.toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(true);
    vi.advanceTimersByTime(41);
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
  });

  it('ignores a click during a running scramble', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    vi.advanceTimersByTime(300);
    el.click();
    vi.advanceTimersByTime(300);
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
  });

  it('uses a new seed for the next run', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    const first = el.textContent;
    vi.advanceTimersByTime(600);
    el.click();
    expect(el.textContent).not.toBe(first);
    expect(el.textContent).toBe(scrambleText(NAME, 0, DUR, STEP, seededRand(43)));
  });

  it('does nothing under reduced motion', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts(true));
    el.click();
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dispose() stops a running scramble on the exact text and removes the listener', () => {
    const el = new FakeName();
    const dispose = initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    dispose();
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    el.click();
    expect(el.textContent).toBe(NAME);
  });
});
