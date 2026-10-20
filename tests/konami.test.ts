import { describe, expect, it } from 'vitest';
import { KONAMI, createKonami, konamiMaskBox } from '../src/eggs/konami';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function detector() {
  let matches = 0;
  const k = createKonami(() => {
    matches += 1;
  });
  return { k, matches: () => matches, pushAll: (keys: readonly string[]) => keys.map((key) => k.push(key)) };
}

describe('KONAMI (spec 3.4.11)', () => {
  it('is the classic sequence', () => {
    expect(KONAMI).toEqual(CODE);
  });
});

describe('createKonami (spec 3.4.11, 8.1.15)', () => {
  it('fires once on the full sequence and push is true only on the completing key', () => {
    const d = detector();
    const results = d.pushAll(CODE);
    expect(results).toEqual([false, false, false, false, false, false, false, false, false, true]);
    expect(d.matches()).toBe(1);
  });

  it('fires again when the code is typed again', () => {
    const d = detector();
    d.pushAll(CODE);
    d.pushAll(CODE);
    expect(d.matches()).toBe(2);
  });

  it('matches after an overlapping prefix (↑ ↑ ↑ ↓ ↓ …)', () => {
    const d = detector();
    d.pushAll(['ArrowUp', ...CODE]);
    expect(d.matches()).toBe(1);
  });

  it('matches B and A in upper case (Caps Lock or Shift)', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'B', 'A']);
    expect(d.matches()).toBe(1);
  });

  it('lets Shift and CapsLock keydowns through without breaking the run', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'Shift', 'B', 'CapsLock', 'a']);
    expect(d.matches()).toBe(1);
  });

  it('ignores a keydown without a string key (a synthetic event) without throwing or breaking the run', () => {
    const d = detector();
    const odd = [undefined, null, 42] as unknown as string[]; // what a synthetic new Event('keydown') carries in e.key
    expect(() => d.pushAll([...CODE.slice(0, 4), ...odd, ...CODE.slice(4)])).not.toThrow();
    expect(d.matches()).toBe(1);
  });

  it('resets on a wrong key', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'x', 'b', 'a']);
    expect(d.matches()).toBe(0);
    d.pushAll(['ArrowUp', 'ArrowUp', 'ArrowDown', 'Enter', ...CODE.slice(3)]);
    expect(d.matches()).toBe(0);
    d.pushAll(CODE);
    expect(d.matches()).toBe(1);
  });

  it('reset() forgets a partial sequence', () => {
    const d = detector();
    d.pushAll(CODE.slice(0, 5));
    d.k.reset();
    d.pushAll(CODE.slice(5));
    expect(d.matches()).toBe(0);
  });
});

describe('konamiMaskBox (spec 3.4.11, 11.17)', () => {
  it('is the clear field right of the scrim in the rail layout', () => {
    expect(konamiMaskBox({ w: 1440, h: 900 }, 950, false)).toEqual({ x: 950, y: 0, w: 490, h: 900 });
  });

  it('is the whole field on the band, and when there is no scrim', () => {
    expect(konamiMaskBox({ w: 390, h: 236 }, null, true)).toEqual({ x: 0, y: 0, w: 390, h: 236 });
    expect(konamiMaskBox({ w: 1440, h: 900 }, null, false)).toEqual({ x: 0, y: 0, w: 1440, h: 900 });
  });

  it('is null when the scrim reaches the field edge (rail windows about 720-790 px wide), so the Konami is skipped', () => {
    expect(konamiMaskBox({ w: 760, h: 700 }, 762, false)).toBeNull();
    expect(konamiMaskBox({ w: 760, h: 700 }, 760, false)).toBeNull();
    expect(konamiMaskBox({ w: 0, h: 0 }, null, true)).toBeNull();
  });
});
