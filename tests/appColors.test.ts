import { describe, expect, it } from 'vitest';
import { App, type AppOptions } from '../src/app';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';
import type { FrameInputs } from '../src/field/renderer';
import type { FieldColors, RGB } from '../src/theme/theme';

/** Four equal field colours with every channel at v, so one channel tells the whole interpolation. */
const solid = (v: number): FieldColors => {
  const c: RGB = [v, v, v];
  return { f0: c, f1: c, f2: c, f3: c };
};

/**
 * Only App.start builds an App, and it needs WebGL2, which Node lacks. The test calls the private constructor with a
 * fake renderer that records the colours of every render, and drives the private frame() with chosen timestamps.
 */
function harness(start: FieldColors) {
  const rendered: FieldColors[] = [];
  const renderer = {
    ready: true,
    failed: false,
    lost: false,
    render: (f: FrameInputs) => void rendered.push(f.colors),
    resize: () => {},
    clear: () => {},
    setMask: () => {},
    setParams: () => {},
    restore: () => true,
    dispose: () => {},
  };
  const doc = { documentElement: { setAttribute: () => {}, removeAttribute: () => {}, hasAttribute: () => false }, visibilityState: 'visible' };
  const win = { requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, devicePixelRatio: 1, performance: { now: () => 0 } };
  const o = { canvas: {}, params: cloneField(DEFAULT_FIELD), reduced: false, seed: 1, colors: start, entry: false, rail: null, scrim: null, doc, win } as unknown as AppOptions;
  const Ctor = App as unknown as new (o: AppOptions, renderer: unknown) => App;
  const app = new Ctor(o, renderer);
  const frame = (nowMs: number): void => {
    (app as unknown as { frame(dtMs: number, nowMs: number): boolean }).frame(16, nowMs);
  };
  return { app, frame, last: (): FieldColors => rendered[rendered.length - 1] };
}

describe('App.setColors crossfade (spec 3.2.6, 4.6.6; Index amendments A3, A15)', () => {
  it('starts on the next frame, and a press mid-fade restarts 300 ms from the colours on screen, like an interrupted CSS transition', () => {
    const h = harness(solid(0));
    h.frame(0); // the first frame only stamps the readiness clock
    h.frame(1000); // programs ready: the first render
    expect(h.last()).toEqual(solid(0));
    h.app.setColors(solid(1), true); // the press; the tween waits for the next frame (A3)
    h.frame(1016); // the tween starts at this frame's timestamp
    expect(h.last().f0[0]).toBeCloseTo(0, 12);
    h.frame(1166); // halfway through the first fade
    expect(h.last().f0[0]).toBeCloseTo(0.5, 12);
    h.app.setColors(solid(0), true); // a second press inside the fade
    h.frame(1196); // 180 ms into the first fade: the new tween starts from 0.6, not from the previous target 1
    expect(h.last().f0[0]).toBeCloseTo(0.6, 12);
    h.frame(1346); // 150 ms into the new 300 ms tween: halfway from 0.6 back to 0
    expect(h.last().f0[0]).toBeCloseTo(0.3, 12);
    h.frame(1496); // 300 ms after it started
    expect(h.last()).toEqual(solid(0));
  });
});
