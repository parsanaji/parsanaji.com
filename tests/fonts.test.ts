import { describe, expect, it } from 'vitest';
import { waitForFont } from '../src/boot/fonts';

const manualTimer = () => {
  const queue: (() => void)[] = [];
  return { schedule: (fn: () => void) => void queue.push(fn), fire: () => queue.splice(0).forEach((fn) => fn()) };
};

describe('waitForFont', () => {
  it('resolves loaded when the font set settles first', async () => {
    const t = manualTimer();
    const result = await waitForFont('900 10px "Geist Sans"', 2000, { load: () => Promise.resolve([]) }, t.schedule);
    expect(result).toBe('loaded');
  });

  it('resolves timeout when the font never loads', async () => {
    const t = manualTimer();
    const pending = waitForFont('900 10px "Geist Sans"', 2000, { load: () => new Promise(() => {}) }, t.schedule);
    t.fire();
    expect(await pending).toBe('timeout');
  });

  it('treats a rejected load as a timeout, not an exception', async () => {
    const t = manualTimer();
    expect(await waitForFont('900 10px "Geist Sans"', 2000, { load: () => Promise.reject(new Error('nope')) }, t.schedule)).toBe('timeout');
  });

  it('reports unavailable without a FontFaceSet', async () => {
    expect(await waitForFont('900 10px "Geist Sans"', 2000, undefined, () => {})).toBe('unavailable');
  });
});
