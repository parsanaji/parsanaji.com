/**
 * The entry and Konami state machine (spec 3.4.2, 3.4.8, 3.4.9, 3.4.11; Appendix A §5).
 * Pure: time arrives through tick(dt), DOM effects leave through emit(). App owns one machine
 * for the load entry and one per Konami.
 */
export type EntryPhase = 'idle' | 'pending' | 'gather' | 'hold' | 'dissolve' | 'done';
export type EntryEvent = 'start' | 'scrim' | 'reveal' | 'skip' | 'done' | 'cleanup';

export interface EntryTimings {
  gatherMs: number;
  holdMs: number;
  dissolveMs: number;
  scrimAtMs: number | null;
  revealAtMs: number | null;
  cleanupAtMs: number | null;
}

/** 3.4.2: gather 900, hold 1000, dissolve 800; scrim at 1900, reveal at 2100, cleanup at 3300. */
export const ENTRY_TIMINGS: EntryTimings = {
  gatherMs: 900,
  holdMs: 1000,
  dissolveMs: 800,
  scrimAtMs: 1900,
  revealAtMs: 2100,
  cleanupAtMs: 3300,
};

/** 3.4.11: gather 900, hold 1500, dissolve 800 (3200 ms in total); no scrim, reveal or cleanup. */
export const KONAMI_TIMINGS: EntryTimings = {
  gatherMs: 900,
  holdMs: 1500,
  dissolveMs: 800,
  scrimAtMs: null,
  revealAtMs: null,
  cleanupAtMs: null,
};

const DEFAULT_SKIP_MS = 250; // 3.4.9

/** smoothstep(u) = u²(3 − 2u) with u clamped to [0, 1]: the Blueprint playEntry curve (3.4.2). */
function smooth(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

function finiteNonNegative(ms: number): number {
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

/**
 * Mask progress e at entry time tMs (3.4.2): smoothstep up over the gather, 1 through the hold,
 * smoothstep down over the dissolve, 0 after. A 0 ms gather or dissolve jumps (P7).
 */
export function entryProgress(tMs: number, t: EntryTimings): number {
  if (!(tMs >= 0)) return 0;
  if (tMs < t.gatherMs) return smooth(tMs / t.gatherMs);
  const holdEnd = t.gatherMs + t.holdMs;
  if (tMs < holdEnd) return 1;
  if (tMs < holdEnd + t.dissolveMs) return smooth(1 - (tMs - holdEnd) / t.dissolveMs);
  return 0;
}

function phaseAt(tMs: number, t: EntryTimings): EntryPhase {
  if (tMs < t.gatherMs) return 'gather';
  if (tMs < t.gatherMs + t.holdMs) return 'hold';
  if (tMs < t.gatherMs + t.holdMs + t.dissolveMs) return 'dissolve';
  return 'done';
}

interface TimedEvent {
  at: number;
  ev: EntryEvent;
}

/** scrim, reveal, done and cleanup in time order; ties keep this order (done before cleanup). */
function timeline(t: EntryTimings): TimedEvent[] {
  const list: TimedEvent[] = [];
  if (t.scrimAtMs !== null) list.push({ at: t.scrimAtMs, ev: 'scrim' });
  if (t.revealAtMs !== null) list.push({ at: t.revealAtMs, ev: 'reveal' });
  list.push({ at: t.gatherMs + t.holdMs + t.dissolveMs, ev: 'done' });
  if (t.cleanupAtMs !== null) list.push({ at: t.cleanupAtMs, ev: 'cleanup' });
  return list.sort((a, b) => a.at - b.at); // Array.prototype.sort is stable (ES2019)
}

export class EntryMachine {
  private readonly t: EntryTimings;
  private readonly emit: (e: EntryEvent) => void;
  private readonly events: readonly TimedEvent[];
  private phaseValue: EntryPhase = 'idle';
  private elapsed = 0;
  private next = 0; // events[0 .. next) have fired
  private ready = false;
  private skipping = false;
  private skipMs = DEFAULT_SKIP_MS;
  private skipElapsed = 0;
  private skipFrom = 0;

  constructor(t: EntryTimings, emit: (e: EntryEvent) => void) {
    this.t = { ...t };
    this.emit = emit;
    this.events = timeline(this.t);
  }

  /** idle (or done) -> pending. Clears readiness: the caller uploads a fresh mask, then calls setReady(true). */
  arm(): void {
    if (this.phaseValue !== 'idle' && this.phaseValue !== 'done') return;
    this.phaseValue = 'pending';
    this.elapsed = 0;
    this.next = 0;
    this.ready = false;
    this.skipping = false;
    this.skipElapsed = 0;
    this.skipFrom = 0;
  }

  /** 3.4.3: programs linked, font settled and mask uploaded. */
  setReady(ready: boolean): void {
    this.ready = ready;
  }

  /**
   * Advances entry time by dtMs and returns e in 0..1. pending leaves for the first phase on the first
   * tick that is ready and visible (entry time 0, emits 'start'); a tick with visible false never
   * advances (3.4.8); events fire in time order, once each.
   */
  tick(dtMs: number, visible: boolean): number {
    const p = this.phaseValue;
    if (p === 'idle') return 0;
    if (p === 'pending') {
      if (!this.ready || !visible) return 0;
      this.phaseValue = phaseAt(0, this.t);
      this.emit('start');
      this.fire();
      return this.current();
    }
    if (!visible) return this.current();
    if (this.skipping) {
      this.skipElapsed += finiteNonNegative(dtMs);
      if (this.skipElapsed >= this.skipMs) this.finishSkip();
      return this.current();
    }
    if (p !== 'done' || this.next < this.events.length) {
      this.elapsed += finiteNonNegative(dtMs);
      this.phaseValue = phaseAt(this.elapsed, this.t);
      this.fire();
    }
    return this.current();
  }

  /**
   * 3.4.9: emits 'skip' and dissolves the mask from its current e to 0 over fastMs as
   * e0 × smoothstep(1 − elapsed / fastMs); then 'done' and (when cleanupAtMs is set) 'cleanup'
   * fire together. In done, a pending 'cleanup' fires at once. A 0 ms skip completes in this call.
   */
  skip(fastMs: number = DEFAULT_SKIP_MS): void {
    const p = this.phaseValue;
    if (p === 'idle' || this.skipping) return;
    if (p === 'done') {
      this.flushCleanup();
      return;
    }
    this.skipFrom = this.current();
    this.skipping = true;
    this.skipElapsed = 0;
    this.skipMs = finiteNonNegative(fastMs);
    this.phaseValue = 'dissolve';
    this.emit('skip');
    if (this.skipMs === 0) this.finishSkip();
  }

  get phase(): EntryPhase {
    return this.phaseValue;
  }

  get elapsedMs(): number {
    return this.elapsed;
  }

  private current(): number {
    const p = this.phaseValue;
    if (p === 'idle' || p === 'pending' || p === 'done') return 0;
    if (this.skipping) return this.skipFrom * smooth(1 - this.skipElapsed / this.skipMs);
    return entryProgress(this.elapsed, this.t);
  }

  private fire(): void {
    while (this.next < this.events.length && this.events[this.next].at <= this.elapsed) {
      const { ev } = this.events[this.next];
      this.next += 1;
      this.emit(ev);
    }
  }

  private finishSkip(): void {
    const rest = this.events.slice(this.next).map((x) => x.ev);
    this.next = this.events.length;
    this.skipping = false;
    this.phaseValue = 'done';
    if (rest.includes('done')) this.emit('done');
    if (rest.includes('cleanup')) this.emit('cleanup');
  }

  private flushCleanup(): void {
    const rest = this.events.slice(this.next).map((x) => x.ev);
    this.next = this.events.length;
    if (rest.includes('cleanup')) this.emit('cleanup');
  }
}
