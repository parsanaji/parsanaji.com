import { describe, expect, it } from 'vitest';
import { createLoop } from '../src/loop';

/** A manual requestAnimationFrame: frame(now) runs the callbacks queued so far. */
function fakeRaf() {
  let nextId = 0;
  const queue = new Map<number, FrameRequestCallback>();
  return {
    raf: (cb: FrameRequestCallback): number => {
      queue.set(++nextId, cb);
      return nextId;
    },
    caf: (id: number): void => void queue.delete(id),
    frame(now: number): void {
      const due = [...queue.values()];
      queue.clear();
      for (const cb of due) cb(now);
    },
    get pending(): number {
      return queue.size;
    },
  };
}

describe('createLoop (spec 3.7.3, 3.7.4)', () => {
  it('passes clampDt(now - last) and the timestamp; the first frame after start() gets one 60 fps frame', () => {
    const r = fakeRaf();
    const seen: [number, number][] = [];
    const loop = createLoop((dt, now) => (seen.push([dt, now]), true), r.raf, r.caf);
    loop.start();
    r.frame(1000);
    r.frame(1016);
    r.frame(1116); // a 100 ms gap
    expect(seen[0][0]).toBeCloseTo(1000 / 60, 9);
    expect(seen[1]).toEqual([16, 1016]);
    expect(seen[2]).toEqual([50, 1116]); // clamped to 50 ms
  });

  it('start() after stop() resets the timestamp, so a hidden tab never catches up', () => {
    const r = fakeRaf();
    const dts: number[] = [];
    const loop = createLoop((dt) => (dts.push(dt), true), r.raf, r.caf);
    loop.start();
    r.frame(0);
    r.frame(16);
    loop.stop();
    loop.start();
    r.frame(60_000);
    expect(dts.at(-1)).toBeCloseTo(1000 / 60, 9);
  });

  it('idles when onFrame returns false and wake() runs exactly one more frame', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => (frames++, false), r.raf, r.caf);
    loop.start();
    r.frame(0);
    expect(r.pending).toBe(0); // idle: nothing scheduled
    expect(loop.running).toBe(true); // still running while idle
    loop.wake();
    loop.wake(); // a second wake before the frame does not double-schedule
    expect(r.pending).toBe(1);
    r.frame(16);
    r.frame(32);
    expect(frames).toBe(2);
  });

  it('wake() while stopped does nothing', () => {
    const r = fakeRaf();
    const loop = createLoop(() => true, r.raf, r.caf);
    loop.wake();
    expect(r.pending).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('stop() cancels the scheduled frame and running becomes false', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => (frames++, true), r.raf, r.caf);
    loop.start();
    expect(loop.running).toBe(true);
    loop.stop();
    expect(r.pending).toBe(0);
    r.frame(16);
    expect(frames).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('stopping from inside onFrame schedules nothing more', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => {
      frames++;
      loop.stop();
      return true;
    }, r.raf, r.caf);
    loop.start();
    r.frame(0);
    r.frame(16);
    expect(frames).toBe(1);
  });
});
