import { describe, expect, it } from 'vitest';
import { bindLifecycle, type LifecycleTarget } from '../src/lifecycle';

type Call = [keyof LifecycleTarget, ...unknown[]];

function recorder(): { t: LifecycleTarget; calls: Call[] } {
  const calls: Call[] = [];
  const t: LifecycleTarget = {
    pause: () => void calls.push(['pause']),
    resume: () => void calls.push(['resume']),
    resize: (box) => void calls.push(['resize', box]),
    dprChanged: () => void calls.push(['dprChanged']),
    reducedChanged: (r) => void calls.push(['reducedChanged', r]),
    contextLost: () => void calls.push(['contextLost']),
    contextRestored: () => void calls.push(['contextRestored']),
  };
  return { t, calls };
}

class FakeMql extends EventTarget {
  constructor(
    readonly media: string,
    public matches = false,
  ) {
    super();
  }
  listeners = 0;
  override addEventListener(type: string, cb: EventListenerOrEventListenerObject | null): void {
    this.listeners++;
    super.addEventListener(type, cb);
  }
  override removeEventListener(type: string, cb: EventListenerOrEventListenerObject | null): void {
    this.listeners--;
    super.removeEventListener(type, cb);
  }
}

class FakeResizeObserver {
  static last: FakeResizeObserver | null = null;
  static rejectBoxOption = false;
  observed: { target: unknown; options?: unknown }[] = [];
  disconnected = false;
  constructor(readonly cb: (entries: unknown[]) => void) {
    FakeResizeObserver.last = this;
  }
  observe(target: unknown, options?: { box?: string }): void {
    if (options && FakeResizeObserver.rejectBoxOption) throw new TypeError('unsupported box');
    this.observed.push({ target, options });
  }
  disconnect(): void {
    this.disconnected = true;
  }
}

function env(opts: { resizeObserver?: boolean } = {}) {
  const queries = new Map<string, FakeMql>();
  const win = Object.assign(new EventTarget(), {
    devicePixelRatio: 1,
    matchMedia: (q: string) => {
      const m = new FakeMql(q);
      queries.set(q, m);
      return m;
    },
    ResizeObserver: opts.resizeObserver === false ? undefined : FakeResizeObserver,
  });
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
  const canvas = new EventTarget();
  return {
    win,
    doc,
    canvas,
    queries,
    bound: { win: win as unknown as Window, doc: doc as unknown as Document, canvas: canvas as unknown as HTMLCanvasElement },
  };
}

const change = (matches: boolean): Event => Object.assign(new Event('change'), { matches });

describe('bindLifecycle (spec 3.6.3, 3.7)', () => {
  it('pauses when hidden and resumes when visible (3.7.3)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    e.doc.visibilityState = 'hidden';
    e.doc.dispatchEvent(new Event('visibilitychange'));
    e.doc.visibilityState = 'visible';
    e.doc.dispatchEvent(new Event('visibilitychange'));
    expect(calls).toEqual([['pause'], ['resume']]);
  });

  it('pauses on pagehide and resumes only on a persisted pageshow (3.7.5)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    e.win.dispatchEvent(new Event('pagehide'));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(calls).toEqual([['pause'], ['resume']]);
  });

  it('prevents the default of webglcontextlost and reports loss and restore (3.6.3)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const lost = new Event('webglcontextlost', { cancelable: true });
    e.canvas.dispatchEvent(lost);
    e.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(lost.defaultPrevented).toBe(true);
    expect(calls).toEqual([['contextLost'], ['contextRestored']]);
  });

  it('reports reduced-motion changes (3.6.4)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const rm = e.queries.get('(prefers-reduced-motion: reduce)');
    rm?.dispatchEvent(change(true));
    rm?.dispatchEvent(change(false));
    expect(calls).toEqual([
      ['reducedChanged', true],
      ['reducedChanged', false],
    ]);
  });

  it('reports a DPR change and re-arms the resolution query with the new DPR (3.7.2)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const first = e.queries.get('(resolution: 1dppx)');
    expect(first?.listeners).toBe(1);
    e.win.devicePixelRatio = 2;
    first?.dispatchEvent(change(false));
    expect(calls).toEqual([['dprChanged']]);
    expect(first?.listeners).toBe(0);
    const second = e.queries.get('(resolution: 2dppx)');
    expect(second?.listeners).toBe(1);
    second?.dispatchEvent(change(false));
    expect(calls).toEqual([['dprChanged'], ['dprChanged']]);
  });

  it('observes the canvas device-pixel-content-box and forwards devicePixelContentBoxSize (3.7.1)', () => {
    FakeResizeObserver.rejectBoxOption = false;
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const ro = FakeResizeObserver.last;
    expect(ro?.observed).toEqual([{ target: e.canvas, options: { box: 'device-pixel-content-box' } }]);
    ro?.cb([{ devicePixelContentBoxSize: [{ inlineSize: 1707, blockSize: 960 }] }]);
    ro?.cb([{}]); // Safari: no devicePixelContentBoxSize
    expect(calls).toEqual([
      ['resize', { w: 1707, h: 960 }],
      ['resize', null],
    ]);
  });

  it('falls back to a plain observe() when the box option is rejected', () => {
    FakeResizeObserver.rejectBoxOption = true;
    const e = env();
    bindLifecycle(recorder().t, e.bound);
    expect(FakeResizeObserver.last?.observed).toEqual([{ target: e.canvas, options: undefined }]);
    FakeResizeObserver.rejectBoxOption = false;
  });

  it('tolerates a missing ResizeObserver by listening to window resize', () => {
    const e = env({ resizeObserver: false });
    const { t, calls } = recorder();
    expect(() => bindLifecycle(t, e.bound)).not.toThrow();
    e.win.dispatchEvent(new Event('resize'));
    expect(calls).toEqual([['resize', null]]);
  });

  it('the returned function removes every listener and disconnects the observer', () => {
    const e = env();
    const { t, calls } = recorder();
    const unbind = bindLifecycle(t, e.bound);
    const ro = FakeResizeObserver.last;
    unbind();
    e.doc.dispatchEvent(new Event('visibilitychange'));
    e.win.dispatchEvent(new Event('pagehide'));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    e.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    e.canvas.dispatchEvent(new Event('webglcontextrestored'));
    e.queries.get('(prefers-reduced-motion: reduce)')?.dispatchEvent(change(true));
    expect(e.queries.get('(resolution: 1dppx)')?.listeners).toBe(0);
    expect(e.queries.get('(prefers-reduced-motion: reduce)')?.listeners).toBe(0);
    expect(ro?.disconnected).toBe(true);
    expect(calls).toEqual([]);
  });
});
