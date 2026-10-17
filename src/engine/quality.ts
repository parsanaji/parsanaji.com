export type WidthClass = 'desktop' | 'tablet' | 'phone';

export const COUNT_CAP: Record<WidthClass, number> = { desktop: 60_000, tablet: 40_000, phone: 25_000 };

export function widthClass(viewportW: number): WidthClass {
  if (viewportW >= 1024) return 'desktop';
  if (viewportW >= 768) return 'tablet';
  return 'phone';
}

/** Spec 3.3: N = min(cap by width class, inked CSS px² × density), at least 1. */
export function dotCount(
  inkedAreaCssPx: number,
  viewportW: number,
  density: number,
  caps: Record<WidthClass, number> = COUNT_CAP,
): number {
  const cap = caps[widthClass(viewportW)];
  return Math.max(1, Math.min(cap, Math.round(inkedAreaCssPx * density)));
}

export function capDpr(devicePixelRatio: number, max = 2): number {
  const d = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(max, d);
}

export function degradedCount(n: number, factor = 0.6): number {
  return Math.max(1, Math.round(n * factor));
}

/** Measures one window of frames after the entry; reports 'degrade' at most once (spec 3.6). */
export class FpsProbe {
  private frames = 0;
  private elapsedMs = 0;
  private settled = false;

  constructor(
    private readonly windowFrames = 60,
    private readonly thresholdFps = 45,
  ) {}

  push(dtMs: number): 'pending' | 'keep' | 'degrade' {
    if (this.settled) return 'keep';
    this.frames += 1;
    this.elapsedMs += dtMs;
    if (this.frames < this.windowFrames) return 'pending';
    this.settled = true;
    const fps = 1000 / (this.elapsedMs / this.frames);
    return fps < this.thresholdFps ? 'degrade' : 'keep';
  }

  get done(): boolean {
    return this.settled;
  }
}
