/** What the page lifecycle drives (spec 3.6.3, 3.7). `resize` carries devicePixelContentBoxSize when known (P2). */
export interface LifecycleTarget {
  pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void;
  reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
}

/**
 * Wires visibility, bfcache, context loss, reduced motion, DPR and size changes to `t`. Every browser API
 * comes from `env`, never from globals. Returns a function that removes every listener.
 */
export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void {
  const { win, doc, canvas } = env;
  const offs: (() => void)[] = [];
  const on = (target: EventTarget, type: string, fn: (e: Event) => void): void => {
    target.addEventListener(type, fn);
    offs.push(() => target.removeEventListener(type, fn));
  };

  // 3.7.3 visibility, 3.7.5 bfcache
  on(doc, 'visibilitychange', () => (doc.visibilityState === 'hidden' ? t.pause() : t.resume()));
  on(win, 'pagehide', () => t.pause());
  on(win, 'pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) t.resume();
  });

  // 3.6.3 context loss: preventDefault() is what allows a restore
  on(canvas, 'webglcontextlost', (e) => {
    e.preventDefault();
    t.contextLost();
  });
  on(canvas, 'webglcontextrestored', () => t.contextRestored());

  // 3.6.4 reduced motion turning on or off mid-session
  on(win.matchMedia('(prefers-reduced-motion: reduce)'), 'change', (e) => t.reducedChanged((e as MediaQueryListEvent).matches));

  // 3.7.2 DPR change without a size change: one resolution query, re-armed with the new DPR after each change
  let dprQuery: MediaQueryList | null = null;
  const onDpr = (): void => {
    arm();
    t.dprChanged();
  };
  const arm = (): void => {
    dprQuery?.removeEventListener('change', onDpr);
    dprQuery = win.matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDpr);
  };
  arm();
  offs.push(() => dprQuery?.removeEventListener('change', onDpr));

  // 3.7.1 size: a ResizeObserver on the canvas, device-pixel-content-box when the engine supports it
  const RO = (win as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  if (typeof RO === 'function') {
    const ro = new RO((entries) => {
      const box = entries[entries.length - 1]?.devicePixelContentBoxSize?.[0];
      t.resize(box ? { w: box.inlineSize, h: box.blockSize } : null);
    });
    try {
      ro.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      ro.observe(canvas);
    }
    offs.push(() => ro.disconnect());
  } else {
    on(win, 'resize', () => t.resize(null));
  }

  return () => {
    for (const off of offs.splice(0)) off();
  };
}
