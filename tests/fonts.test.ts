import { describe, expect, it } from 'vitest';
import { waitForFont } from '../src/boot/fonts';

const manualTimer = () => {
  const queue: (() => void)[] = [];
  const delays: number[] = [];
  return {
    schedule: (fn: () => void, ms: number) => {
      queue.push(fn);
      delays.push(ms);
    },
    delays,
    fire: () => queue.splice(0).forEach((fn) => fn()),
  };
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
    expect(t.delays).toEqual([2000]);
    t.fire();
    expect(await pending).toBe('timeout');
  });

  it('treats a rejected load as a timeout, not an exception', async () => {
    const t = manualTimer();
    expect(await waitForFont('900 10px "Geist Sans"', 2000, { load: () => Promise.reject(new Error('nope')) }, t.schedule)).toBe('timeout');
  });

  it('treats a synchronous throw from load as a timeout, not an exception', async () => {
    const t = manualTimer();
    const fonts = {
      load: (): Promise<unknown> => {
        throw new SyntaxError('bad font spec');
      },
    };
    expect(await waitForFont('900 10px "Geist Sans"', 2000, fonts, t.schedule)).toBe('timeout');
  });

  it('reports unavailable without a FontFaceSet', async () => {
    expect(await waitForFont('900 10px "Geist Sans"', 2000, undefined, () => {})).toBe('unavailable');
  });
});
