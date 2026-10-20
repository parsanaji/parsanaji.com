import { clampDt } from './core/time';

export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }

/**
 * The rAF loop (spec 3.7.3, 3.7.4, 4.4.3). `onFrame(dt, now)` returns false to idle: no further frame is
 * requested until wake(). dt = clampDt(now - last), so a long gap costs at most 50 ms of sim time; start()
 * resets `last`, so the first frame after it gets clampDt(0) (one 60 fps frame). The rAF and cancel
 * functions default to the window's, looked up at call time.
 */
export function createLoop(
  onFrame: (dtMs: number, nowMs: number) => boolean,
  raf: (cb: FrameRequestCallback) => number = (cb) => requestAnimationFrame(cb),
  caf: (id: number) => void = (id) => cancelAnimationFrame(id),
): Loop {
  let running = false;
  let pending: number | null = null;
  let last: number | null = null;

  const tick = (now: number): void => {
    pending = null;
    if (!running) return;
    const dt = clampDt(last === null ? 0 : now - last);
    last = now;
    const more = onFrame(dt, now);
    if (more && running && pending === null) pending = raf(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = null;
      if (pending === null) pending = raf(tick);
    },
    stop() {
      running = false;
      last = null;
      if (pending !== null) caf(pending);
      pending = null;
    },
    wake() {
      if (running && pending === null) pending = raf(tick);
    },
    get running() {
      return running;
    },
  };
}
