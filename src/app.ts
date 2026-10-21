import { waitForFont } from './boot/fonts';
import { CONTENT } from './content';
import { FpsProbe } from './core/quality';
import { konamiMaskBox } from './eggs/konami';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
import { breathScale, effectiveIntensity } from './field/flow';
import { MASK_FONT_FAMILY, maskBoxFor, rasterizeMask, type Canvas2DLike, type MaskBox } from './field/nameMask';
import type { FieldParams } from './field/params';
import { PointerModel, type PointerKind } from './field/pointer';
import { FieldRenderer, type FrameInputs } from './field/renderer';
import { RipplePool } from './field/ripples';
import { BAND_QUERY, computeGrid, dashSpacingFor, pointerRadius, type Grid } from './field/sizing';
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
  readonly renderer: FieldRenderer;
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
type MaskKind = 'entry' | 'konami';

/** A machine runs from arm() until its dissolve ends (3.4.2, 3.4.11). */
function isRunning(m: EntryMachine | null): boolean {
  return m !== null && m.phase !== 'idle' && m.phase !== 'done';
}

/** Owns the field: renderer, models, loop and lifecycle (spec 4.2, 4.4, 4.7.4). Only App.start constructs it. */
export class App implements LifecycleTarget {
  private readonly o: AppOptions;
  private readonly params: FieldParams;
  private readonly renderer: FieldRenderer;
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
  private readonly zBuf = new Float32Array(9);
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
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
  private konamiM: EntryMachine | null = null; // 3.4.11: the running (or last) Konami

  private constructor(o: AppOptions, renderer: FieldRenderer) {
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
    const renderer = FieldRenderer.create(o.canvas, o.params);
    if (!renderer) return null;
    try {
      const app = new App(o, renderer);
      app.regrid();
      renderer.clear(o.colors.f0); // 3.7.8: never a black alpha:false canvas
      app.unbinds.push(bindLifecycle(app, { win: o.win, doc: o.doc, canvas: o.canvas })); // P3
      app.bindPointer();
      app.loop.start();
      app.beginReducedMotion(); // 3.3.6.3, 3.6.4
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
    this.wakeIfIdle(); // 4.6.6: under reduced motion the loop is woken until the tween ends
  }

  /**
   * 3.4.11: the field forms "nice." with the entry pipeline. Ignored while the entry or another Konami
   * runs, when the field is not running (fallback, lost context), and when the scrim leaves no clear
   * field to write in (konamiMaskBox). The rail stays visible.
   */
  konami(): void {
    if (this.ended || this.disposed || !this.programsReady || this.renderer.lost || this.maskBusy()) return;
    const k = this.params.konami;
    const timings: EntryTimings = this.reduced
      ? { gatherMs: 0, holdMs: k.holdMs, dissolveMs: 0, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null } // P7: jump, hold, jump
      : { gatherMs: k.gatherMs, holdMs: k.holdMs, dissolveMs: k.dissolveMs, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null };
    if (!this.uploadMask('konami')) return; // no grid, a raster failure, or no clear field right of the scrim
    const m = new EntryMachine(timings, (ev) => {
      if (ev === 'done' && this.maskKind === 'konami') this.clearMask(); // 4.5.7; the FPS probe is not restarted (3.7.9)
    });
    m.arm();
    m.setReady(true);
    this.konamiM = m;
    this.wakeIfIdle();
  }

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
    this.idling = false; // the restarted loop schedules its own frame
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
    this.wakeIfIdle(); // 3.6.4: a resize renders one frame at the new size
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
    this.wakeIfIdle(); // 3.6.4: a resize renders one frame at the new size
  }

  /** 3.6.4, 11.25: turning reduced motion on freezes the current τ (no jump), skips a running entry, clears rings. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
    if (r) {
      this.skipEntry(); // 3.4.9 trigger
      this.ripples.clear(); // 3.3.8: rings are off under reduced motion
      this.probe = null; // 3.7.9: the probe never runs under reduced motion
    }
    this.wakeIfIdle(); // on: render the frozen still; off: restart the continuous loop
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
        if (!this.reduced) this.tau += (dtMs / 1000) * effectiveIntensity(this.params); // 3.3.6.3: τ frozen under reduced motion
      }
      this.pointer.tick(dtMs);
      const w = this.rect.width;
      const h = this.rect.height;
      const sp = this.gridValue ? this.gridValue.cellCss : 10; // 12.14: the dash spacing is the lattice unit of rings and the pointer
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
        breath: this.reduced ? 1 : breathScale(this.simMs, p.breath.amp, p.breath.periodMs), // 3.3.9
        center: [w / 2, h / 2],
        pointer: {
          x: this.pointer.x,
          y: this.pointer.y,
          radius: pointerRadius(w, h, sp, p.pointer) * (1 + p.pointer.velRadiusGain * this.pointer.velFactor),
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
        this.degrade = p.dash.degradeK; // 3.7.9: once per session
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
    if (this.konamiM) e = Math.max(e, this.konamiM.tick(this.pinnedDt(this.konamiM, dtMs), visible));
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

  /**
   * 3.6.4: on-demand rendering. Idle once the pointer is settled and no colour tween, Konami (or entry
   * skip) or mask re-raster is pending. Called once per frame by frame()'s return.
   */
  private idle(): boolean {
    const idle =
      this.reduced && this.programsReady && this.pointer.settled && !this.tween.active && !this.maskBusy() && this.maskTimer === null;
    this.idling = idle;
    return idle;
  }

  /** Spec 3.7.1: measure the canvas box, size the grid, resize the backing store and target, cache the rect. */
  private regrid(deviceBox?: { w: number; h: number } | null): void {
    const r = this.measure();
    const sp = dashSpacingFor(r.width, r.height, this.params.dash, this.params.density, this.degrade);
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, sp, deviceBox);
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
    if (this.reduced) return false; // 3.3.8, 3.6.4: no rings under reduced motion
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
    const box = this.maskBoxNow(kind);
    if (!box) return false; // 3.4.11: the scrim leaves no clear field, so there is nowhere to write "nice."
    try {
      const plane = rasterizeMask(
        kind === 'konami' ? CONTENT.konamiText : CONTENT.name, // 3.4.6, 3.4.11
        box,
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

  /**
   * 3.4.6: the entry box is the whole field. 3.4.11: the Konami box starts at the scrim's clear edge,
   * measured now (11.17); on the band, or without a scrim, it is the whole band. Null when the scrim
   * leaves no clear field (konamiMaskBox).
   */
  private maskBoxNow(kind: MaskKind): MaskBox | null {
    const field = { w: this.rect.width, h: this.rect.height };
    if (kind === 'entry') return maskBoxFor('entry', field, null, false);
    const band = this.o.win.matchMedia(BAND_QUERY).matches;
    const scrim = this.o.scrim;
    const scrimRight = !band && scrim ? scrim.getBoundingClientRect().right - this.rect.left : null;
    return konamiMaskBox(field, scrimRight, band || scrimRight === null);
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
      this.wakeIfIdle();
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
    if (this.probeStarted || this.reduced) return; // 3.7.9, 11.30: never under reduced motion
    this.probeStarted = true;
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }

  /** True while a mask machine runs (3.4.11: the Konami is ignored then; 3.6.4: the loop stays awake). */
  private maskBusy(): boolean {
    return isRunning(this.entry) || isRunning(this.konamiM);
  }

  /** A pinned machine advances to the pinned entry time, forward only, then holds (dt 0). */
  private pinnedDt(m: EntryMachine, dtMs: number): number {
    return this.pinnedMs === null ? dtMs : Math.max(0, this.pinnedMs - m.elapsedMs);
  }

  /** P4: __pn.setTime(ms); null releases. Takes effect on the next frame. */
  private pinEntry(ms: number | null): void {
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
    this.wakeIfIdle();
  }

  /** P4: __pn.setE(e) while a mask is uploaded; null releases. */
  private forceE(e: number | null): void {
    this.forcedE = e === null || !Number.isFinite(e) ? null : Math.min(1, Math.max(0, e));
    this.wakeIfIdle();
  }

  /** 3.3.6.3: the reduced-motion still is τ = staticTimeS (the OG still); pointer input wakes the on-demand loop (3.6.4). */
  private beginReducedMotion(): void {
    if (this.reduced) this.tau = this.params.staticTimeS;
    const win = this.o.win;
    const root = this.o.doc.documentElement;
    const wake = (): void => this.wakeIfIdle();
    const types = ['pointermove', 'pointerdown', 'pointerup', 'pointercancel'] as const;
    for (const type of types) win.addEventListener(type, wake, { passive: true });
    win.addEventListener('blur', wake);
    root.addEventListener('pointerleave', wake, { passive: true });
    this.unbinds.push(() => {
      for (const type of types) win.removeEventListener(type, wake);
      win.removeEventListener('blur', wake);
      root.removeEventListener('pointerleave', wake);
    });
  }

  /** Restarts an idle loop (one frame, then idle() decides again); a no-op while frames are running. */
  private wakeIfIdle(): void {
    if (!this.idling) return;
    this.idling = false;
    this.loop.wake();
  }
}
