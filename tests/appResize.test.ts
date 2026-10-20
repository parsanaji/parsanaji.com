import { describe, expect, it } from 'vitest';
import { App, type AppOptions } from '../src/app';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';
import type { FrameInputs } from '../src/field/renderer';
import { computeGrid } from '../src/field/sizing';
import { cellCssFor } from '../src/field/sizing';
import type { FieldColors, RGB } from '../src/theme/theme';

// Slice-2 review I1 (spec 12.11): setting canvas.width/height in the ResizeObserver callback clears the drawing buffer
// to black after that frame's draws, so App.resize() must present something at the new size before the next paint.

const solid = (v: number): FieldColors => {
  const c: RGB = [v, v, v];
  return { f0: c, f1: c, f2: c, f3: c };
};

/** The appColors harness plus a measurable canvas and a renderer that records every render and clear. */
function harness(ready: boolean, size: { w: number; h: number }) {
  const renders: FrameInputs[] = [];
  const clears: RGB[] = [];
  const renderer = {
    ready,
    failed: false,
    lost: false,
    render: (f: FrameInputs) => void renders.push({ ...f, center: [...f.center] as [number, number] }),
    resize: () => {},
    clear: (c: RGB) => void clears.push(c),
    setMask: () => {},
    setParams: () => {},
    restore: () => true,
    dispose: () => {},
  };
  const doc = { documentElement: { setAttribute: () => {}, removeAttribute: () => {}, hasAttribute: () => false }, visibilityState: 'visible' };
  const win = { requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, devicePixelRatio: 1, performance: { now: () => 0 } };
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: size.w, height: size.h }) };
  const o = { canvas, params: cloneField(DEFAULT_FIELD), reduced: false, seed: 1, colors: solid(0.25), entry: false, rail: null, scrim: null, doc, win } as unknown as AppOptions;
  const Ctor = App as unknown as new (o: AppOptions, renderer: unknown) => App;
  const app = new Ctor(o, renderer);
  const frame = (nowMs: number): void => {
    (app as unknown as { frame(dtMs: number, nowMs: number): boolean }).frame(16, nowMs);
  };
  return { app, frame, renders, clears, renderer, size, params: o.params };
}

describe('App.resize redraw (slice-2 review I1; spec 3.7.1, 6.1.3, amendment 12.11)', () => {
  it('redraws the last frame at the new size at once when the programs are ready, without advancing time', () => {
    const h = harness(true, { w: 1440, h: 900 });
    h.frame(0); // stamps the readiness clock
    h.frame(1000); // programs ready: the first render
    expect(h.renders).toHaveLength(1);
    h.size.w = 1280;
    h.size.h = 720;
    h.app.resize();
    expect(h.renders).toHaveLength(2);
    const [before, after] = h.renders;
    expect(after.center).toEqual([640, 360]);
    expect(after.z).toEqual(before.z); // the flow did not advance
    expect(after.breath).toBe(before.breath);
    expect(after.maskE).toBe(before.maskE);
    expect(after.colors).toEqual(before.colors);
    const cellCss = cellCssFor(1280, h.params.cell, h.params.density, 1);
    expect(h.app.grid).toEqual(computeGrid(1280, 720, 1, cellCss, undefined));
    expect(h.clears).toHaveLength(0);
  });

  it('clears the new backing store to field-0 while the programs are not ready yet', () => {
    const h = harness(false, { w: 1440, h: 900 });
    h.frame(0);
    h.frame(500); // still compiling: no render
    expect(h.renders).toHaveLength(0);
    h.app.resize();
    expect(h.renders).toHaveLength(0);
    expect(h.clears).toEqual([[0.25, 0.25, 0.25]]);
  });

  it('presents nothing while the context is lost', () => {
    const h = harness(true, { w: 1440, h: 900 });
    h.frame(0);
    h.frame(1000);
    h.renderer.lost = true;
    h.app.resize();
    expect(h.renders).toHaveLength(1);
    expect(h.clears).toHaveLength(0);
  });
});
