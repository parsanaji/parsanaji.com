import { mulberry32 } from '../core/prng';

/** Printable ASCII letters, digits and #%&*+=?@<>/: every glyph is inside the font subset (3.5.6, 3.5.13). */
export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';

/**
 * The text at scramble time tMs (3.5.6): letter i (0-based, n letters) settles at
 * durMs × (0.3 + 0.7 × i / (n − 1)); before that it shows the glyph rand(step, i) picks for the
 * current stepMs step. Spaces never change, so the mono advance keeps the layout still.
 */
export function scrambleText(
  target: string,
  tMs: number,
  durMs: number,
  stepMs: number,
  rand: (step: number, i: number) => number,
): string {
  const n = target.length;
  const step = stepMs > 0 ? Math.floor(tMs / stepMs) : 0;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = target[i];
    const settleMs = n > 1 ? durMs * (0.3 + (0.7 * i) / (n - 1)) : durMs;
    if (ch === ' ' || tMs >= settleMs) {
      out += ch;
      continue;
    }
    const r = rand(step, i);
    const k = Math.min(SCRAMBLE_GLYPHS.length - 1, Math.max(0, Math.floor(r * SCRAMBLE_GLYPHS.length)));
    out += SCRAMBLE_GLYPHS[k];
  }
  return out;
}

/**
 * A click on the name scrambles it and settles back over durMs, one frame every stepMs (3.5.6).
 * Glyph choices come from mulberry32, seeded per run from `seed`. A click during a run is ignored;
 * reduced() true disables it. While running the element carries aria-label = text. Returns dispose.
 */
export function initScramble(
  el: HTMLElement,
  text: string,
  opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean },
): () => void {
  const steps = opts.stepMs > 0 ? Math.ceil(opts.durMs / opts.stepMs) : 0;
  let runs = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (): void => {
    timer = null;
    el.textContent = text;
    el.removeAttribute('aria-label');
  };

  const onClick = (): void => {
    if (timer !== null || opts.reduced()) return;
    const next = mulberry32((opts.seed + runs) >>> 0);
    runs += 1;
    const table = Array.from({ length: steps }, () => Array.from({ length: text.length }, () => next()));
    const rand = (step: number, i: number): number => table[step]?.[i] ?? 0;
    const t0 = Date.now();
    let step = 0;
    el.setAttribute('aria-label', text);
    const frame = (): void => {
      if (step >= steps) {
        finish();
        return;
      }
      el.textContent = scrambleText(text, step * opts.stepMs, opts.durMs, opts.stepMs, rand);
      step += 1;
      // anchored to the click time, so timer lateness never accumulates past durMs
      timer = setTimeout(frame, Math.max(0, t0 + step * opts.stepMs - Date.now()));
    };
    frame();
  };

  el.addEventListener('click', onClick);
  return () => {
    el.removeEventListener('click', onClick);
    if (timer !== null) {
      clearTimeout(timer);
      finish();
    }
  };
}
