import { CONTENT } from './content';
import { ParticleField } from './engine/ParticleField';
import { RippleScheduler, breathScale } from './engine/motion';
import { mulberry32 } from './engine/prng';
import { capDpr, dotCount } from './engine/quality';
import {
  makeMeasure,
  sampleText,
  subsampleToN,
  type Canvas2DLike,
  type CanvasFactory,
  type SampleResult,
} from './engine/sampler';
import { clampDt } from './engine/time';
import { PHASE, RIPPLE_OFF, type Params } from './engine/types';

export interface AppOptions {
  canvas: HTMLCanvasElement;
  params: Params;
  reduced: boolean;
  seed: number;
}

const createCanvas: CanvasFactory = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h) as unknown as Canvas2DLike;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c as unknown as Canvas2DLike;
};

/** Owns sampling, the GPU field and the frame loop. Pointer (Task 17) and morph (Task 20) plug in here. */
export class App {
  readonly field: ParticleField;
  readonly params: Params;
  readonly reduced: boolean;
  private readonly rand: () => number;
  private readonly ripple: RippleScheduler;
  private vw = 1;
  private vh = 1;
  private n = 0;
  private nameSample: SampleResult | null = null;
  private altSample: SampleResult | null = null;
  private running = false;
  private raf = 0;
  private lastMs = -1;
  private simMs = 0;
  private resizeTimer = 0;
  // [Task 20] replaced by MorphMachine
  private entryDone = false;

  constructor(opts: AppOptions) {
    this.params = opts.params;
    this.reduced = opts.reduced;
    this.rand = mulberry32(opts.seed);
    this.field = new ParticleField(opts.canvas, this.params, capDpr(window.devicePixelRatio));
    this.field.setReduced(this.reduced);
    this.ripple = new RippleScheduler(this.params.ripple, this.rand);
    this.applyParams();
  }

  start(): void {
    this.layout();
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('pageshow', this.onPageShow);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.resizeTimer);
    this.lastMs = -1;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('pageshow', this.onPageShow);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** Re-sample both texts for the current viewport, recompute N, upload (spec 3.3, 3.7). */
  layout(): void {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.field.setViewport(this.vw, this.vh);
    const measure = makeMeasure(createCanvas(8, 8), this.params.raster);
    const layoutOpts = { ...this.params.layout, viewportW: this.vw, viewportH: this.vh };
    this.nameSample = sampleText(CONTENT.name, layoutOpts, this.params.raster, createCanvas, measure);
    this.altSample = sampleText(CONTENT.alt, layoutOpts, this.params.raster, createCanvas, measure);
    this.n = dotCount(this.nameSample.inkedAreaCssPx, this.vw, this.params.density, this.params.caps);
    this.upload();
  }

  get count(): number {
    return this.n;
  }

  /** Used by the degrade rule (Task 21) and the debug panel. Re-subsamples the cached candidates. */
  setCount(n: number): void {
    this.n = Math.max(1, Math.round(n));
    this.upload();
  }

  /** Push every tunable to the GPU and the schedulers (debug panel calls this on change). */
  applyParams(): void {
    this.field.applyParams(this.params);
    if (this.reduced) this.field.setRepelRadius(this.params.reducedRepelRadius);
    this.ripple.setParams(this.params.ripple);
  }

  /** [Task 20] real implementation; until then clicking does nothing. */
  requestCycle(): boolean {
    return false;
  }

  private upload(): void {
    if (!this.nameSample || !this.altSample) return;
    const home = subsampleToN(this.nameSample.candidates, this.n, this.rand);
    const alt = subsampleToN(this.altSample.candidates, this.n, this.rand);
    this.field.setTargets(home, alt, this.rand, this.params);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    if (this.lastMs < 0) this.lastMs = now;
    const dt = clampDt(now - this.lastMs);
    this.lastMs = now;
    this.simMs += dt;

    // [Task 20] replaced by MorphMachine
    const entryTotal = this.reduced ? 0 : this.params.morph.entryMs + this.params.morph.entryStaggerMs;
    if (!this.entryDone && this.simMs >= entryTotal) this.entryDone = true;
    this.field.setMorph(
      this.entryDone ? PHASE.IDLE : PHASE.ENTRY,
      this.simMs,
      this.params.morph.entryMs,
      this.params.morph.entryStaggerMs,
    );

    this.field.setTime(this.simMs);
    this.field.setBreath(this.reduced ? 1 : breathScale(this.simMs, this.params.breathAmp, this.params.breathPeriodMs));
    const ripple = this.reduced || !this.entryDone ? RIPPLE_OFF : this.ripple.tick(dt, this.pickGlyphCenter);
    this.field.setRipple(ripple);
    this.field.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private pickGlyphCenter = (): readonly [number, number] => {
    const c = this.nameSample?.glyphCenters;
    if (!c || c.length < 2) return [0, 0] as const;
    const i = Math.floor(this.rand() * (c.length / 2));
    return [c[i * 2], c[i * 2 + 1]] as const;
  };

  /** Spec 3.7: the viewport follows at once so the canvas never stretches the old buffer; re-sampling waits 150 ms. */
  private onResize = (): void => {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.field.setViewport(window.innerWidth, window.innerHeight);
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.layout(), 150);
  };

  private pause(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private resume(): void {
    if (this.running) return;
    this.running = true;
    this.lastMs = -1;
    this.raf = requestAnimationFrame(this.frame);
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'hidden') this.pause();
    else this.resume();
  };

  /** Spec 4.7: stop the loop on pagehide so a bfcache restore starts clean. */
  private onPageHide = (): void => {
    this.pause();
  };

  private onPageShow = (event: PageTransitionEvent): void => {
    if (event.persisted && document.visibilityState === 'visible') this.resume();
  };
}
