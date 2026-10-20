import { maskBoxFor, type MaskBox } from '../field/nameMask';

/** Konami detector (spec 3.4.11, R12c): ↑ ↑ ↓ ↓ ← → ← → b a, compared by KeyboardEvent.key. */
export const KONAMI: readonly string[] = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** Lone modifier keydowns neither advance nor reset, so Shift+B and Caps Lock work (3.4.11 "either case"). */
const NEUTRAL = new Set(['Shift', 'CapsLock']);

/**
 * Keeps the last KONAMI.length keys. Any other key breaks the run (it stays in the window, so the code
 * must be typed whole again), and an overlapping prefix such as ↑ ↑ ↑ ↓ ↓ … still matches.
 * The caller filters Ctrl, Meta, Alt and auto-repeat events before push (they neither advance nor reset).
 * A keydown without a string key (a synthetic event from an extension) is neutral too, so push never throws.
 */
export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void } {
  let recent: string[] = [];
  return {
    push(key: string): boolean {
      if (typeof key !== 'string' || NEUTRAL.has(key)) return false;
      recent.push(key.length === 1 ? key.toLowerCase() : key);
      if (recent.length > KONAMI.length) recent.shift();
      if (recent.length < KONAMI.length || recent.some((k, i) => k !== KONAMI[i])) return false;
      recent = [];
      onMatch();
      return true;
    },
    reset(): void {
      recent = [];
    },
  };
}

/**
 * 3.4.11: the Konami mask box in field-space CSS px (maskBoxFor), or null when it is empty. On a rail
 * window about 720–790 px wide the scrim reaches past the field, so there is nowhere to write "nice.":
 * App.konami() then ignores the code instead of dimming the field around no text.
 */
export function konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null {
  const box = maskBoxFor('konami', field, scrimRight, band);
  return box.w > 0 && box.h > 0 ? box : null;
}
