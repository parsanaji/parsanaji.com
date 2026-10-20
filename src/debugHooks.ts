// P4: window.__pn (spec 4.7.5). Loaded only by a dynamic import behind PN_DEBUG, so production never carries it.
import type { App } from './app';
import type { FrameInputs } from './field/renderer';
import type { Grid } from './field/sizing';
import { surface, tierOf } from './field/surface';

export interface ParityReport { maxErr255: number; tierMismatchPct: number; cells: number }
export interface GpuTimeReport { medianMs: number; p90Ms: number; frames: number }
export interface PnHooks {
  parity(): ParityReport | null; // null when the renderer is not ready
  gpuTime(frames: number): Promise<GpuTimeReport | null>; // null without EXT_disjoint_timer_query_webgl2
  grid(): Grid | null;
  setTime(ms: number | null): void; // pins the running entry or Konami at entry time ms (forward only); null releases
  setE(e: number | null): void; // forces the mask progress while a mask is uploaded; null releases
}

/** EXT_disjoint_timer_query_webgl2 is not in lib.dom: the two enums this file uses. */
interface TimerQueryExt { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }

/** Spec 8.2.2 / 8.2.3 / 6.1.13: GPU-vs-TS parity, GPU time and the grid, as `window.__pn`. */
export function installDebugHooks(app: App, win: Window): PnHooks {
  const hooks: PnHooks = {
    parity() {
      const d = app.debug();
      const grid = app.grid;
      const last = d.lastFrame();
      if (!grid || !last || !d.renderer.ready) return null;
      // the bare surface F: breath 1, no pointer, no rings, no mask (what surface() computes)
      const frame: FrameInputs = { ...last, breath: 1, pointer: { ...last.pointer, strength: 0 }, ripples: new Float32Array(32), maskE: 0 };
      d.renderer.render(frame);
      const px = new Uint8Array(grid.cols * grid.rows * 4);
      if (!d.renderer.readSurface(px)) return null;
      const { t2, t3 } = d.params.tiers;
      let maxErr = 0;
      let mismatch = 0;
      for (let j = 0; j < grid.rows; j++) {
        for (let i = 0; i < grid.cols; i++) {
          const gpu = px[(j * grid.cols + i) * 4] / 255;
          const cpu = surface((i + 0.5) * grid.cellCss, (j + 0.5) * grid.cellCss, frame.z, d.params.shape);
          maxErr = Math.max(maxErr, Math.abs(gpu - cpu));
          if (tierOf(gpu, i, j, t2, t3) !== tierOf(cpu, i, j, t2, t3)) mismatch++;
        }
      }
      const cells = grid.cols * grid.rows;
      return { maxErr255: maxErr * 255, tierMismatchPct: (100 * mismatch) / cells, cells };
    },

    async gpuTime(frames) {
      const d = app.debug();
      const gl = d.renderer.gl;
      if (!gl || !d.renderer.ready) return null;
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerQueryExt | null;
      if (!ext) return null;
      const nextFrame = (): Promise<void> => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));
      const times: number[] = [];
      // a query can come back unavailable or disjoint: keep sampling until `frames` results (at most 3 x frames tries)
      for (let attempt = 0; times.length < frames && attempt < frames * 3; attempt++) {
        const inputs = d.lastFrame();
        if (!inputs || !d.renderer.ready) break;
        const query = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
        d.renderer.render(inputs);
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        await nextFrame();
        await nextFrame();
        const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) === true;
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) === true;
        if (available && !disjoint) times.push(Number(gl.getQueryParameter(query, gl.QUERY_RESULT)) / 1e6);
        gl.deleteQuery(query);
      }
      if (times.length === 0) return null;
      times.sort((a, b) => a - b);
      return { medianMs: times[times.length >> 1], p90Ms: times[Math.min(times.length - 1, Math.floor(times.length * 0.9))], frames: times.length };
    },

    grid: () => app.grid,
    setTime: (ms: number | null) => app.debug().pinEntry(ms),
    setE: (e: number | null) => app.debug().forceE(e),
  };
  (win as Window & { __pn?: PnHooks }).__pn = hooks;
  return hooks;
}
