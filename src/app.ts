import { FpsProbe } from './core/quality';
import { breathScale, effectiveIntensity } from './field/flow';
import type { FieldParams } from './field/params';
import { PointerModel, type PointerKind } from './field/pointer';
import { DitherRenderer, type FrameInputs } from './field/renderer';
import { RipplePool } from './field/ripples';
import { cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
import { flowZ } from './field/surface';
import { bindLifecycle, type LifecycleTarget } from './lifecycle';
import { createLoop, type Loop } from './loop';
import { ColorTween, type FieldColors } from './theme/theme';

export interface AppOptions {
  canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
  entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
}

/** P4: what the debug hooks and the panel reach; it exists in every build but only PN_DEBUG code calls it. */
export interface AppDebug {
  readonly renderer: DitherRenderer;
  readonly params: FieldParams;
  lastFrame(): FrameInputs | null; // inputs of the last render
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
}

/** Spec 3.3.8: a press on any of these never spawns a ring (11.26: nor one inside a dialog). */
const NO_RIPPLE = 'a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]';

const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');

/** Owns the field: renderer, models, loop and lifecycle (spec 4.2, 4.4, 4.7.4). Only App.start constructs it. */
export class App implements LifecycleTarget {
  private readonly o: AppOptions;
  private readonly params: FieldParams;
  private readonly renderer: DitherRenderer;
  private readonly loop: Loop;
  private readonly pointer: PointerModel;
  private readonly ripples: RipplePool;
  private readonly tween: ColorTween;
  private probe: FpsProbe | null = null;
  private gridValue: Grid | null = null;
  private rect = { left: 0, top: 0, width: 0, height: 0 };
  private simMs = 0;
  private tau = 0;
  private frozen = false;
  private reduced: boolean;
  private degrade = 1;
  private programsReady = false;
  private firstFrameMs: number | null = null;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly fallbackFns: (() => void)[] = [];
  private unbinds: (() => void)[] = [];
  private readonly zBuf = new Float32Array(6);
  private readonly rippleBuf = new Float32Array(32);
  private last: FrameInputs | null = null;
  private pendingColors: FieldColors | null = null;

  private constructor(o: AppOptions, renderer: DitherRenderer) {
    this.o = o;
    this.params = o.params;
    this.renderer = renderer;
    this.reduced = o.reduced;
    this.loop = createLoop(
      (dt, now) => this.frame(dt, now),
      (cb) => o.win.requestAnimationFrame(cb),
      (id) => o.win.cancelAnimationFrame(id),
    );
    this.pointer = new PointerModel(o.params.pointer);
    this.ripples = new RipplePool(o.params.ripple);
    this.tween = new ColorTween(o.params.theme.crossfadeMs);
    this.tween.set(o.colors);
  }

  /** Spec 4.7.4 steps 1, 2 and 7: renderer, first clear, lifecycle, pointer listeners, loop. Null = no field. */
  static start(o: AppOptions): App | null {
    const renderer = DitherRenderer.create(o.canvas, o.params);
    if (!renderer) return null;
    try {
      const app = new App(o, renderer);
      app.regrid();
      renderer.clear(o.colors.f0); // 3.7.8: never a black alpha:false canvas
      app.unbinds.push(bindLifecycle(app, { win: o.win, doc: o.doc, canvas: o.canvas })); // P3
      app.bindPointer();
      app.loop.start();
      return app;
    } catch {
      renderer.dispose();
      return null;
    }
  }

  /**
   * Spec 3.2.6, 4.6.6: a 300 ms linear ColorTween when animated, else an instant switch. The tween starts at the next
   * frame's timestamp, the moment the CSS transition of the same toggle starts, so field-0 and --bg move in step (A3).
   * A press inside a running crossfade acts like an interrupted CSS transition: the new 300 ms tween starts from the
   * colours on screen at that frame (ColorTween.start samples them), never from the previous target (A15).
   */
  setColors(c: FieldColors, animate: boolean): void {
    if (this.disposed) return;
    if (animate) this.pendingColors = c;
    else {
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
  }

  /** P11: ignored until Task 20 adds the Konami machine. */
  konami(): void {}

  /** P11: ignored until Task 18 adds the entry. */
  replayEntry(): void {}

  /** Debug panel live update: params object -> uniforms, then regrid (cell and density changes take effect). */
  applyParams(): void {
    if (this.disposed) return;
    this.renderer.setParams(this.params);
    this.regrid();
    this.loop.wake();
  }

  /** Called once if the field fails after start (compile or link error, timeout, lost context, FBO). */
  onFallback(fn: () => void): void {
    this.fallbackFns.push(fn);
  }

  get grid(): Grid | null {
    return this.gridValue;
  }

  debug(): AppDebug {
    return {
      renderer: this.renderer,
      params: this.params,
      lastFrame: () => this.last,
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.stop();
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    for (const unbind of this.unbinds.splice(0)) unbind();
    this.renderer.dispose();
  }

  // ---- LifecycleTarget (spec 3.6.3, 3.7) ----

  pause(): void {
    this.loop.stop();
  }

  resume(): void {
    if (this.disposed) return;
    if (this.renderer.lost) {
      this.armRestore(); // 3.7.5: a bfcache restore with a lost context waits for webglcontextrestored
      return;
    }
    if (this.o.doc.visibilityState === 'visible') this.loop.start();
  }

  resize(deviceBox?: { w: number; h: number } | null): void {
    if (this.disposed) return;
    this.regrid(deviceBox);
    this.loop.wake();
  }

  dprChanged(): void {
    this.resize(null);
  }

  /** Task 19 adds the reduced-motion behaviour; slice 2 only tracks the flag. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
  }

  contextLost(): void {
    if (this.disposed) return;
    this.loop.stop();
    this.armRestore();
  }

  contextRestored(): void {
    if (this.disposed) return;
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    if (!this.renderer.restore()) {
      this.fail();
      return;
    }
    this.regrid();
    this.renderer.clear(this.tween.sample(this.o.win.performance.now()).f0);
    this.resume();
  }

  // ---- internals (names binding for Tasks 18-20) ----

  /** Spec 4.4.3, in order. Returns false to idle (never in slice 2). */
  private frame(dtMs: number, nowMs: number): boolean {
    if (this.disposed) return false;
    try {
      if (this.firstFrameMs === null) {
        // 4.7.4 step 5, risk 9.6: the first status query waits for the frame after first paint (it blocks
        // on the link where KHR_parallel_shader_compile is missing); this frame only starts the 3000 ms count
        this.firstFrameMs = nowMs;
        return true;
      }
      if (this.renderer.failed) {
        this.fail();
        return false;
      }
      if (!this.programsReady) {
        if (!this.renderer.ready) {
          // 3.4.3: the 3000 ms count starts at the first animation frame, so a hidden tab never times out unseen
          if (this.renderer.failed || nowMs - this.firstFrameMs >= this.params.boot.readyTimeoutMs) this.fail();
          return !this.disposed;
        }
        this.programsReady = true;
        this.onProgramsReady();
      }
      if (!this.frozen) {
        this.simMs += dtMs;
        this.tau += (dtMs / 1000) * effectiveIntensity(this.params);
      }
      this.pointer.tick(dtMs);
      const w = this.rect.width;
      const h = this.rect.height;
      const sp = latticeSpacing(w);
      this.ripples.write(this.simMs / 1000, sp, this.rippleBuf);
      const e = this.stepMask(dtMs, this.o.doc.visibilityState === 'visible');
      if (this.pendingColors) {
        this.tween.start(this.pendingColors, nowMs);
        this.pendingColors = null;
      }
      const colors = this.tween.sample(nowMs);
      const p = this.params;
      const inputs: FrameInputs = {
        z: flowZ(this.tau, 1, this.zBuf),
        breath: breathScale(this.simMs, p.breath.amp, p.breath.periodMs),
        center: [w / 2, h / 2],
        pointer: {
          x: this.pointer.x,
          y: this.pointer.y,
          radius: pointerRadius(w, h, p.pointer) * (1 + p.pointer.velRadiusGain * this.pointer.velFactor),
          strength: this.pointer.strength,
        },
        ripples: this.rippleBuf,
        rippleSigma: p.ripple.sigmaSp * sp,
        maskE: e,
        colors,
      };
      this.renderer.render(inputs);
      this.last = inputs;
      if (this.renderer.failed) {
        this.fail();
        return false;
      }
      if (this.probe && !this.probe.done && this.probe.push(dtMs) === 'degrade') {
        this.degrade = p.cell.degradeK; // 3.7.9: once per session
        this.regrid();
      }
      return !this.idle();
    } catch {
      this.fail(); // a throwing frame never reaches the console as an uncaught error
      return false;
    }
  }

  /** Mask progress e; Task 18 drives the entry and Konami machines here. */
  private stepMask(_dtMs: number, _visible: boolean): number {
    return 0;
  }

  /** The first real frame (3.4.7.1): show the canvas and start the FPS probe (3.7.9, 11.30). */
  private onProgramsReady(): void {
    this.o.doc.documentElement.setAttribute('data-field-ready', '');
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }

  /** Spec 4.4.3 step 6: only reduced motion renders on demand; Task 19 adds the 3.6.4 settled condition. */
  private idle(): boolean {
    if (!this.reduced) return false;
    return false;
  }

  /** Spec 3.7.1: measure the canvas box, size the grid, resize the backing store and target, cache the rect. */
  private regrid(deviceBox?: { w: number; h: number } | null): void {
    const r = this.measure();
    const cellCss = cellCssFor(r.width, this.params.cell, this.params.density, this.degrade);
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
  }

  /** Caches the canvas rect (3.3.7.7). A press re-measures too: a phone's URL bar moves the fixed band without resizing it. */
  private measure(): { left: number; top: number; width: number; height: number } {
    const r = this.o.canvas.getBoundingClientRect();
    this.rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    return this.rect;
  }

  /** Spec 3.3.8: primary button, outside interactive elements and dialogs, inside the canvas rect (11.26). */
  private spawnAllowed(e: PointerEvent): boolean {
    if (!e.isPrimary || e.button !== 0) return false;
    const target = e.target as Element | null;
    if (target && typeof target.closest === 'function' && target.closest(NO_RIPPLE)) return false;
    const x = e.clientX - this.rect.left;
    const y = e.clientY - this.rect.top;
    return x >= 0 && y >= 0 && x < this.rect.width && y < this.rect.height;
  }

  /** Once: stop, unbind, dispose every GL object, then tell main.ts (3.6.2). */
  private fail(): void {
    if (this.disposed) return;
    this.dispose();
    for (const fn of this.fallbackFns) fn();
  }

  private armRestore(): void {
    if (this.restoreTimer !== null) return;
    this.restoreTimer = setTimeout(() => {
      this.restoreTimer = null;
      this.fail(); // 3.6.3: no restore within 3000 ms
    }, this.params.boot.restoreTimeoutMs);
  }

  /** Spec 3.3.7.6-3.3.7.7: passive window listeners in field space; release on touch up, cancel, leave and blur. */
  private bindPointer(): void {
    const { win, doc } = this.o;
    const opts: AddEventListenerOptions = { passive: true };
    const at = (e: PointerEvent): [number, number] => [e.clientX - this.rect.left, e.clientY - this.rect.top];
    const onMove = (e: PointerEvent): void => {
      const [x, y] = at(e);
      this.pointer.move(x, y, kindOf(e));
      this.loop.wake();
    };
    const onDown = (e: PointerEvent): void => {
      this.measure();
      const [x, y] = at(e);
      this.pointer.down(x, y, kindOf(e));
      if (this.spawnAllowed(e)) this.ripples.spawn(x, y, this.simMs / 1000);
      this.loop.wake();
    };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') this.pointer.release();
      this.loop.wake();
    };
    const onRelease = (): void => {
      this.pointer.release();
      this.loop.wake();
    };
    win.addEventListener('pointermove', onMove, opts);
    win.addEventListener('pointerdown', onDown, opts);
    win.addEventListener('pointerup', onUp, opts);
    win.addEventListener('pointercancel', onRelease, opts);
    win.addEventListener('blur', onRelease);
    doc.documentElement.addEventListener('pointerleave', onRelease, opts);
    this.unbinds.push(() => {
      win.removeEventListener('pointermove', onMove);
      win.removeEventListener('pointerdown', onDown);
      win.removeEventListener('pointerup', onUp);
      win.removeEventListener('pointercancel', onRelease);
      win.removeEventListener('blur', onRelease);
      doc.documentElement.removeEventListener('pointerleave', onRelease);
    });
  }
}
