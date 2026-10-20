import { waitForFont } from './boot/fonts';
import { CONTENT } from './content';
import { FpsProbe } from './core/quality';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
import { breathScale, effectiveIntensity } from './field/flow';
import { MASK_FONT_FAMILY, maskBoxFor, rasterizeMask, type Canvas2DLike, type MaskBox } from './field/nameMask';
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
  pinEntry(ms: number | null): void; // P4, 4.7.5: __pn.setTime
  forceE(e: number | null): void; // P4, 4.7.5: __pn.setE
}

/** Spec 3.3.8: a press on any of these never spawns a ring (11.26: nor one inside a dialog). */
const NO_RIPPLE = 'a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]';

const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');

/** Which text the uploaded mask holds (4.5.7: one mask texture, built at arm, deleted at done). */
type MaskKind = 'entry';

/** A machine runs from arm() until its dissolve ends (3.4.2, 3.4.11). */
function isRunning(m: EntryMachine | null): boolean {
  return m !== null && m.phase !== 'idle' && m.phase !== 'done';
}

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
  private entry: EntryMachine | null = null;                      // 3.4: the load entry; replayEntry() makes a new one
  private maskKind: MaskKind | null = null;                       // 4.5.7: which text the uploaded mask holds
  private maskTimer: ReturnType<typeof setTimeout> | null = null; // 3.7.1: re-raster debounce
  private fontSettled = false;                                    // 3.4.3 item 2
  private probeStarted = false;                                   // 3.7.9: the probe runs once per session
  private ended = false;                                          // set when fail() or dispose() runs the unbinds
  private pinnedMs: number | null = null;                         // __pn.setTime (P4)
  private forcedE: number | null = null;                          // __pn.setE (P4)

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
      app.beginEntry(); // 4.7.4 steps 3–4
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

  /** Debug panel: re-arms the full entry including data-entry="wait" (4.3). Ignored while a mask runs. */
  replayEntry(): void {
    if (this.ended || this.disposed || this.reduced || !this.programsReady || this.maskBusy()) return;
    this.entry = new EntryMachine(this.entryTimings(), (ev) => this.onEntryEvent(ev));
    this.o.doc.documentElement.setAttribute('data-entry', 'wait');
    this.entry.arm();
    this.prepareEntryMask();
  }

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
      pinEntry: (ms: number | null) => this.pinEntry(ms),
      forceE: (e: number | null) => this.forceE(e),
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
    this.redrawNow(); // 12.11: the resized (cleared) backing store never reaches the compositor
    this.loop.wake();
  }

  /**
   * Amendment 12.11 (slice-2 review I1): setting canvas.width/height clears the drawing buffer to black, and the
   * ResizeObserver runs after this frame's draws, so present the last frame's inputs at the new size now; before the
   * programs are ready (the canvas is still at opacity 0) a field-0 clear is enough. Time does not advance here.
   */
  private redrawNow(): void {
    if (this.disposed || this.renderer.lost) return;
    if (!this.programsReady || !this.renderer.ready || !this.last) {
      this.renderer.clear(this.tween.sample(this.o.win.performance.now()).f0);
      return;
    }
    const inputs: FrameInputs = { ...this.last, center: [this.rect.width / 2, this.rect.height / 2] };
    this.renderer.render(inputs);
    this.last = inputs;
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
    this.skipEntry(); // 3.6.3, 3.4.9: context loss mid-entry makes the rail usable at once
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

  /** 4.4.3 step 2: e from the running machine; a debug pin holds it at the pinned entry time. */
  private stepMask(dtMs: number, visible: boolean): number {
    let e = 0;
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
    if (this.forcedE !== null && this.maskKind !== null) e = this.forcedE;
    return e;
  }

  /** Programs ready (3.4.3 item 1): a planned entry now waits for its mask; without one this is the first real frame (3.4.7.1). */
  private onProgramsReady(): void {
    this.programsReady = true; // idempotent (frame() set it just before); prepareEntryMask() reads it
    if (isRunning(this.entry)) {
      this.prepareEntryMask(); // 3.4.3; 'start' or 'skip' shows the canvas, 'done' starts the probe
      return;
    }
    this.o.doc.documentElement.setAttribute('data-field-ready', ''); // 3.4.7.1: no-entry path
    this.startProbe(); // 3.7.9: first real frame without an entry
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
    this.scheduleMaskRaster(); // 3.7.1: an active mask is re-rasterised 150 ms after the last resize
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

  /** 4.7.4 steps 3–4: arm the planned entry, skip it on rail focus (3.4.9, 3.5.11), wait for the mask font (3.4.3). */
  private beginEntry(): void {
    const rail = this.o.rail;
    if (rail) {
      const onFocusIn = (): void => {
        if (this.o.doc.documentElement.hasAttribute('data-entry')) this.skipEntry();
      };
      rail.addEventListener('focusin', onFocusIn);
      this.unbinds.push(() => rail.removeEventListener('focusin', onFocusIn));
    }
    this.unbinds.push(() => {
      this.ended = true;
      this.cancelMaskRaster();
    });
    const settle = (): void => {
      this.fontSettled = true;
      this.prepareEntryMask();
    };
    // 3.4.3 item 2, 3.6.7: loaded, timeout or unavailable all settle; MASK_FONT_FAMILY carries the fallback stack
    waitForFont('700 10px "JetBrains Mono"', this.params.boot.fontTimeoutMs, this.o.doc.fonts).then(settle, settle);
    if (this.o.entry && !this.reduced) {
      this.entry = new EntryMachine(this.entryTimings(), (ev) => this.onEntryEvent(ev));
      this.entry.arm();
    }
  }

  /** 4.9: the live (panel-tunable) entry times. */
  private entryTimings(): EntryTimings {
    const t = this.params.entry;
    return {
      gatherMs: t.gatherMs,
      holdMs: t.holdMs,
      dissolveMs: t.dissolveMs,
      scrimAtMs: t.scrimAtMs,
      revealAtMs: t.revealAtMs,
      cleanupAtMs: t.cleanupAtMs,
    };
  }

  /** 4.4.5: entry events to <html> state (3.4.7); no inline styles. */
  private onEntryEvent(ev: EntryEvent): void {
    const html = this.o.doc.documentElement;
    switch (ev) {
      case 'start':
        html.setAttribute('data-field-ready', '');
        break;
      case 'scrim':
        html.setAttribute('data-entry', 'scrim');
        break;
      case 'reveal':
        html.setAttribute('data-entry', 'reveal');
        break;
      case 'skip':
        this.pinnedMs = null; // a skip releases a debug pin so its 250 ms dissolve can run
        html.setAttribute('data-entry', 'skip');
        html.setAttribute('data-field-ready', '');
        break;
      case 'done':
        if (this.maskKind === 'entry') this.clearMask();
        if (this.programsReady) this.startProbe(); // 3.7.9: the probe starts at the entry's done
        break;
      case 'cleanup':
        html.removeAttribute('data-entry');
        break;
    }
  }

  /** 3.4.3: the entry leaves pending only when programs, font and mask are all ready. */
  private prepareEntryMask(): void {
    const entry = this.entry;
    if (!entry || entry.phase !== 'pending' || !this.programsReady || !this.fontSettled || this.ended || this.disposed) return;
    if (this.maskKind !== 'entry' && !this.uploadMask('entry')) {
      entry.skip(0); // no mask, no entry: show the rail and carry on as the no-entry path
      return;
    }
    entry.setReady(true);
  }

  /** 4.8, 4.5.7: rasterise the mask text for the current grid and upload it; false when that fails. */
  private uploadMask(kind: MaskKind): boolean {
    const grid = this.gridValue;
    if (!grid || this.ended || this.disposed) return false;
    try {
      const plane = rasterizeMask(
        CONTENT.name,
        this.maskBoxNow(kind),
        { cols: grid.cols, rows: grid.rows, cellCss: grid.cellCss, supersample: this.params.mask.supersample },
        { family: MASK_FONT_FAMILY, weight: this.params.mask.fontWeight },
        this.params.mask,
        (w, h) => this.maskCanvas(w, h),
      );
      this.renderer.setMask(plane);
      this.maskKind = kind;
      return true;
    } catch {
      return false;
    }
  }

  /** 3.4.6: the entry mask box is the whole field box (field-space CSS px). */
  private maskBoxNow(kind: MaskKind): MaskBox {
    return maskBoxFor(kind, { w: this.rect.width, h: this.rect.height }, null, false);
  }

  /** An offscreen 2D canvas for the rasteriser (4.8.1); never attached to the page. */
  private maskCanvas(w: number, h: number): Canvas2DLike {
    const c = this.o.doc.createElement('canvas');
    c.width = w;
    c.height = h;
    return c as unknown as Canvas2DLike;
  }

  /** 4.5.7: the mask texture is deleted at done. */
  private clearMask(): void {
    this.cancelMaskRaster();
    this.renderer.setMask(null);
    this.maskKind = null;
  }

  /** 3.7.1: an active mask is re-rasterised 150 ms after the last resize; until then the old one is drawn. */
  private scheduleMaskRaster(): void {
    if (this.maskKind === null || this.ended || this.disposed) return;
    this.cancelMaskRaster();
    this.maskTimer = setTimeout(() => {
      this.maskTimer = null;
      if (this.maskKind !== null) this.uploadMask(this.maskKind);
    }, this.params.boot.resizeDebounceMs);
  }

  private cancelMaskRaster(): void {
    if (this.maskTimer !== null) clearTimeout(this.maskTimer);
    this.maskTimer = null;
  }

  /** 3.4.9 triggers: focus inside the rail, reduced motion turning on, context loss. */
  private skipEntry(): void {
    this.entry?.skip(this.params.entry.skipMs);
  }

  /** 3.7.9: 60 frames from the entry's done, or from the first real frame without an entry; once per session. */
  private startProbe(): void {
    if (this.probeStarted) return;
    this.probeStarted = true;
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }

  /** True while a mask machine runs (3.4.11: the Konami is ignored then; 3.6.4: the loop stays awake). */
  private maskBusy(): boolean {
    return isRunning(this.entry);
  }

  /** A pinned machine advances to the pinned entry time, forward only, then holds (dt 0). */
  private pinnedDt(m: EntryMachine, dtMs: number): number {
    return this.pinnedMs === null ? dtMs : Math.max(0, this.pinnedMs - m.elapsedMs);
  }

  /** P4: __pn.setTime(ms); null releases. Takes effect on the next frame. */
  private pinEntry(ms: number | null): void {
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
  }

  /** P4: __pn.setE(e) while a mask is uploaded; null releases. */
  private forceE(e: number | null): void {
    this.forcedE = e === null || !Number.isFinite(e) ? null : Math.min(1, Math.max(0, e));
  }
}
