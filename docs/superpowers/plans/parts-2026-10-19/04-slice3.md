### Task 17: Entry state machine

**Files:**
- Create: `src/field/entry.ts`
- Test: `tests/entry.test.ts`

**Interfaces:**
- Consumes: none (pure).
- Produces (`src/field/entry.ts`):
  ```ts
  export type EntryPhase = 'idle' | 'pending' | 'gather' | 'hold' | 'dissolve' | 'done';
  export type EntryEvent = 'start' | 'scrim' | 'reveal' | 'skip' | 'done' | 'cleanup';
  export interface EntryTimings { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number | null; revealAtMs: number | null; cleanupAtMs: number | null }
  export const ENTRY_TIMINGS: EntryTimings;  // { 900, 1000, 800, 1900, 2100, 3300 }
  export const KONAMI_TIMINGS: EntryTimings; // { 900, 1500, 800, null, null, null }
  export class EntryMachine {
    constructor(t: EntryTimings, emit: (e: EntryEvent) => void);
    arm(): void;                                  // idle -> pending
    setReady(ready: boolean): void;
    tick(dtMs: number, visible: boolean): number; // returns e in 0..1
    skip(fastMs?: number): void;                  // default 250; emits 'skip', then 'done' and 'cleanup' when the fast dissolve ends
    get phase(): EntryPhase; get elapsedMs(): number;
  }
  export function entryProgress(tMs: number, t: EntryTimings): number;
  ```
- Semantics: `arm()` also re-arms from `done`; `pending` leaves for `gather` (emitting `start`) on the first tick with `ready` and `visible`; a tick with `visible` false does not advance; `cleanup` is emitted only when `cleanupAtMs` is non-null; a `skip()` in `done` emits `cleanup` at once; the fast dissolve is `e = e0 × smoothstep(1 − elapsed / fastMs)`; 0 ms gather and dissolve are allowed (P7).
- Plan details pinned by the tests below (they refine the index, they do not rename anything): `arm()` is ignored while the machine runs and clears readiness (the caller uploads a fresh mask, then `setReady(true)`); the tick that leaves `pending` sets entry time 0 and does not advance by its `dt`; timed events (`scrim`, `reveal`, `done` at `gatherMs + holdMs + dissolveMs`, `cleanup`) fire in time order, ties in that order, so one long `dt` fires every event it passes; during a skip the phase reads `dissolve`, pending `scrim` / `reveal` never fire, and a 0 ms skip completes inside the call.

Golden timeline (computed by running the module below with 1 ms ticks; it is the 3.4.2 table):

| entry t (ms) | phase | e | event |
|---|---|---|---|
| 0 | gather | 0 | `start` |
| 225 | gather | 0.15625 | |
| 450 | gather | 0.5 | |
| 675 | gather | 0.84375 | |
| 900 | hold | 1 | |
| 1400 | hold | 1 | |
| 1900 | dissolve | 1 | `scrim` |
| 2100 | dissolve | 0.84375 | `reveal` |
| 2300 | dissolve | 0.5 | |
| 2500 | dissolve | 0.15625 | |
| 2700 | done | 0 | `done` |
| 3300 | done | 0 | `cleanup` |

Konami (`KONAMI_TIMINGS`): `start` at 0, hold 900–2400 (e = 1), e = 0.95703125 at 2500 and 0.68359375 at 2700, `done` at 3200, nothing else.

- [ ] **Step 1: Write the failing test**

`tests/entry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  ENTRY_TIMINGS,
  EntryMachine,
  KONAMI_TIMINGS,
  entryProgress,
  type EntryEvent,
  type EntryTimings,
} from '../src/field/entry';

/** A machine with an event log that records the entry time of every emission. */
function machine(t: EntryTimings = ENTRY_TIMINGS) {
  const log: { ev: EntryEvent; at: number }[] = [];
  const m: EntryMachine = new EntryMachine(t, (ev) => log.push({ ev, at: m.elapsedMs }));
  return { m, log, events: () => log.map((x) => x.ev) };
}

/** arm, mark ready, and run the first visible tick (entry time 0, emits 'start'). */
function started(t: EntryTimings = ENTRY_TIMINGS) {
  const s = machine(t);
  s.m.arm();
  s.m.setReady(true);
  s.m.tick(16, true);
  return s;
}

/** Advance in 1 ms ticks so every boundary is hit exactly. */
function run(m: EntryMachine, ms: number): number {
  let e = 0;
  for (let i = 0; i < ms; i++) e = m.tick(1, true);
  return e;
}

describe('timings (spec 3.4.2, 3.4.11)', () => {
  it('pins the entry and Konami timings', () => {
    expect(ENTRY_TIMINGS).toEqual({ gatherMs: 900, holdMs: 1000, dissolveMs: 800, scrimAtMs: 1900, revealAtMs: 2100, cleanupAtMs: 3300 });
    expect(KONAMI_TIMINGS).toEqual({ gatherMs: 900, holdMs: 1500, dissolveMs: 800, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null });
  });
});

describe('entryProgress (spec 3.4.2)', () => {
  it('matches the spec values e = 0, 0.5, 1, 1, 0.5, 0', () => {
    const at = [0, 450, 900, 1400, 2300, 2700].map((t) => entryProgress(t, ENTRY_TIMINGS));
    expect(at).toEqual([0, 0.5, 1, 1, 0.5, 0]);
  });

  it('is the smoothstep u²(3 − 2u) on both ramps', () => {
    expect(entryProgress(225, ENTRY_TIMINGS)).toBe(0.15625);
    expect(entryProgress(675, ENTRY_TIMINGS)).toBe(0.84375);
    expect(entryProgress(2100, ENTRY_TIMINGS)).toBe(0.84375);
    expect(entryProgress(2500, ENTRY_TIMINGS)).toBe(0.15625);
  });

  it('is 0 before the start and after the dissolve', () => {
    expect(entryProgress(-5, ENTRY_TIMINGS)).toBe(0);
    expect(entryProgress(Number.NaN, ENTRY_TIMINGS)).toBe(0);
    expect(entryProgress(9000, ENTRY_TIMINGS)).toBe(0);
  });

  it('jumps for 0 ms gather and dissolve phases (P7)', () => {
    const jump: EntryTimings = { gatherMs: 0, holdMs: 1500, dissolveMs: 0, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null };
    expect(entryProgress(0, jump)).toBe(1);
    expect(entryProgress(1499, jump)).toBe(1);
    expect(entryProgress(1500, jump)).toBe(0);
  });
});

describe('EntryMachine (spec 3.4.2, 8.1.7)', () => {
  it('starts idle and ignores ticks until armed', () => {
    const { m, events } = machine();
    expect(m.phase).toBe('idle');
    expect(m.tick(16, true)).toBe(0);
    expect(m.phase).toBe('idle');
    expect(events()).toEqual([]);
  });

  it('stays pending until it is ready and the page is visible (3.4.3, 3.4.8)', () => {
    const { m, events } = machine();
    m.arm();
    expect(m.phase).toBe('pending');
    m.tick(16, true);
    expect(m.phase).toBe('pending');
    m.setReady(true);
    m.tick(16, false);
    expect(m.phase).toBe('pending');
    expect(events()).toEqual([]);
    expect(m.tick(16, true)).toBe(0);
    expect(m.phase).toBe('gather');
    expect(m.elapsedMs).toBe(0);
    expect(events()).toEqual(['start']);
  });

  it('changes phase exactly at 900, 1900 and 2700 ms', () => {
    const { m } = started();
    run(m, 899);
    expect(m.phase).toBe('gather');
    run(m, 1);
    expect(m.phase).toBe('hold');
    run(m, 999);
    expect(m.phase).toBe('hold');
    run(m, 1);
    expect(m.phase).toBe('dissolve');
    run(m, 799);
    expect(m.phase).toBe('dissolve');
    run(m, 1);
    expect(m.phase).toBe('done');
  });

  it('returns e along the curve as it runs', () => {
    const { m } = started();
    expect(run(m, 450)).toBe(0.5);
    expect(run(m, 450)).toBe(1);
    expect(run(m, 500)).toBe(1);
    expect(run(m, 900)).toBe(0.5);
    expect(run(m, 400)).toBe(0);
  });

  it('emits start, scrim, reveal, done and cleanup in order, once each, at 0, 1900, 2100, 2700, 3300', () => {
    const { m, log } = started();
    run(m, 5000);
    expect(log).toEqual([
      { ev: 'start', at: 0 },
      { ev: 'scrim', at: 1900 },
      { ev: 'reveal', at: 2100 },
      { ev: 'done', at: 2700 },
      { ev: 'cleanup', at: 3300 },
    ]);
    expect(m.elapsedMs).toBe(3300);
  });

  it('fires every event a long dt passes, in order (the caller clamps dt)', () => {
    const { m, events } = started();
    m.tick(4000, true);
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup']);
  });

  it('does not advance on a hidden tick mid-entry (3.4.8)', () => {
    const { m } = started();
    run(m, 1000);
    expect(m.tick(500, false)).toBe(1);
    expect(m.elapsedMs).toBe(1000);
    expect(m.phase).toBe('hold');
  });

  it('runs the Konami for 3200 ms with no scrim, reveal or cleanup (3.4.11)', () => {
    const { m, log } = started(KONAMI_TIMINGS);
    run(m, 3199);
    expect(m.phase).toBe('dissolve');
    run(m, 1);
    expect(m.phase).toBe('done');
    run(m, 2000);
    expect(log).toEqual([
      { ev: 'start', at: 0 },
      { ev: 'done', at: 3200 },
    ]);
  });

  it('jumps e to 1, holds and jumps to 0 with 0 ms gather and dissolve (P7, reduced-motion Konami)', () => {
    const jump: EntryTimings = { gatherMs: 0, holdMs: 1500, dissolveMs: 0, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null };
    const { m, events } = machine(jump);
    m.arm();
    m.setReady(true);
    expect(m.tick(16, true)).toBe(1);
    expect(m.phase).toBe('hold');
    expect(run(m, 1499)).toBe(1);
    expect(run(m, 1)).toBe(0);
    expect(m.phase).toBe('done');
    expect(events()).toEqual(['start', 'done']);
  });

  it('re-arms from done and plays again', () => {
    const { m, events } = started();
    run(m, 4000);
    m.arm();
    expect(m.phase).toBe('pending');
    expect(m.elapsedMs).toBe(0);
    m.tick(16, true);
    expect(m.phase).toBe('pending'); // arm() cleared readiness: a fresh mask must be uploaded first
    m.setReady(true);
    m.tick(16, true);
    run(m, 4000);
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup', 'start', 'scrim', 'reveal', 'done', 'cleanup']);
  });

  it('ignores arm() while running', () => {
    const { m } = started();
    run(m, 1000);
    m.arm();
    expect(m.phase).toBe('hold');
    expect(m.elapsedMs).toBe(1000);
  });
});

describe('EntryMachine.skip (spec 3.4.9, 8.1.7)', () => {
  it('emits skip, dissolves from the current e over 250 ms, then done and cleanup together', () => {
    const { m, log, events } = started();
    run(m, 1000); // hold, e = 1
    m.skip();
    expect(events()).toEqual(['start', 'skip']);
    expect(m.phase).toBe('dissolve');
    expect(run(m, 125)).toBe(0.5); // 1 × smoothstep(1 − 125/250)
    run(m, 124);
    expect(events()).toEqual(['start', 'skip']);
    expect(run(m, 1)).toBe(0);
    expect(m.phase).toBe('done');
    expect(log.slice(2)).toEqual([
      { ev: 'done', at: 1000 },
      { ev: 'cleanup', at: 1000 },
    ]);
    run(m, 3000);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('scales the fast dissolve by e at the moment of the skip', () => {
    const { m } = started();
    run(m, 450); // gather, e = 0.5
    m.skip(250);
    expect(run(m, 125)).toBe(0.25);
  });

  it('honours a custom fast-dissolve length', () => {
    const { m, events } = started();
    run(m, 1000);
    m.skip(100);
    run(m, 99);
    expect(events()).toEqual(['start', 'skip']);
    run(m, 1);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('completes a 0 ms skip inside the call', () => {
    const { m, events } = started();
    run(m, 300);
    m.skip(0);
    expect(m.phase).toBe('done');
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('skips from pending (focus before the field is ready)', () => {
    const { m, events } = machine();
    m.arm();
    m.skip();
    expect(events()).toEqual(['skip']);
    expect(m.tick(16, false)).toBe(0); // a hidden tick does not advance the fast dissolve either
    run(m, 250);
    expect(events()).toEqual(['skip', 'done', 'cleanup']);
  });

  it('never emits scrim or reveal after a skip', () => {
    const { m, events } = started();
    run(m, 1800);
    m.skip();
    run(m, 4000);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('runs cleanup at once when skipped in done (between 2700 and 3300 ms)', () => {
    const { m, events } = started();
    run(m, 2800);
    expect(m.phase).toBe('done');
    m.skip();
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup']);
    run(m, 1000);
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup']);
  });

  it('ignores a second skip, a skip after cleanup, and a skip while idle', () => {
    const idle = machine();
    idle.m.skip();
    expect(idle.events()).toEqual([]);

    const { m, events } = started();
    run(m, 1000);
    m.skip();
    m.skip();
    run(m, 250);
    m.skip();
    run(m, 1000);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('emits skip and done but no cleanup for a Konami machine', () => {
    const { m, events } = started(KONAMI_TIMINGS);
    run(m, 1000);
    m.skip();
    run(m, 250);
    expect(events()).toEqual(['start', 'skip', 'done']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/entry.test.ts`
Expected: FAIL. `FAIL  tests/entry.test.ts [ tests/entry.test.ts ]` with `Error: Cannot find module '../src/field/entry' imported from C:/Users/parsa/parsanaji.com/tests/entry.test.ts`, then `Test Files  1 failed (1)` and `Tests  no tests`.

- [ ] **Step 3: Write the module**

`src/field/entry.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/entry.test.ts`
Expected: PASS, `Test Files  1 passed (1)` and `Tests  25 passed (25)`.

- [ ] **Step 5: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`:
- `npm test` → `Test Files  28 passed (28)`, `Tests  262 passed (262)` (Task 16's 27 files and 237 tests plus `tests/entry.test.ts` with 25; paste the real summary lines into the report).
- `npm run typecheck` → prints nothing (exit 0).
- `npm run build` → `tsc` prints nothing, then Vite ends with `✓ built in …` (the module is not imported yet, so the bundle is unchanged).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/field/entry.ts tests/entry.test.ts
git commit -m "feat(field): entry and Konami state machine

EntryMachine drives the 3.4.2 timeline (gather 900, hold 1000, dissolve 800;
scrim 1900, reveal 2100, done 2700, cleanup 3300), waits in pending until
ready and visible, never advances on a hidden tick, and skips with the
250 ms fast dissolve of 3.4.9. KONAMI_TIMINGS is 3200 ms with no scrim,
reveal or cleanup; 0 ms phases jump (P7).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: The entry on screen

**Files:**
- Modify: `src/app.ts` (entry machine, font wait, mask lifecycle, readiness, events → DOM, focus and context-loss skip, mask re-raster debounce, probe at `done`, `replayEntry()`)
- Modify: `src/main.ts` (4.7.2 takeover)
- Modify: `src/debugHooks.ts` (`setTime`, `setE`)
- Test: none new (the machine is pinned by `tests/entry.test.ts`); browser evidence under `evidence/task-18/`

**Interfaces:**
- Consumes: Task 17 `EntryPhase`, `EntryEvent`, `EntryTimings`, `EntryMachine`, `entryProgress(tMs: number, t: EntryTimings): number`; Task 11 `MaskBox`, `MaskGrid`, `MaskPlane`, `CanvasFactory`, `Canvas2DLike`, `MASK_FONT_FAMILY`, `rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane`, `maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox`; Task 15 `App` public API, its internals (`stepMask`, `onProgramsReady`, `regrid`, `fail`, `contextLost`, `firstFrameMs`, `programsReady`), `AppDebug`, `PnHooks`, the slice-2 `main.ts`; Task 1 `waitForFont(spec: string, timeoutMs: number, fonts?: FontFaceSetLike, schedule?: (fn: () => void, ms: number) => unknown): Promise<FontWaitResult>`; Task 5 `CONTENT.name`.
- Produces:
  - `App` behaviour: with `o.entry` true, `App.start` arms the entry (timings from `params.entry`), adds the `focusin` listener on `o.rail` and starts `waitForFont('700 10px "JetBrains Mono"', params.boot.fontTimeoutMs)`; readiness = programs ready + font settled + mask rasterised (`CONTENT.name`, `maskBoxFor('entry', …)`) and uploaded; events map to `<html>` per 4.4.5 (`start` → `data-field-ready`; `scrim` / `reveal` → `data-entry`; `skip` → `data-entry="skip"` + `data-field-ready`; `done` → `setMask(null)`, probe starts; `cleanup` → `data-entry` removed); `focusin` inside the rail while `data-entry` is present and context loss mid-entry call `skip(params.entry.skipMs)`; a resize re-rasterises an active mask 150 ms after the last resize; `replayEntry()` re-arms the full entry including `data-entry="wait"`.
  - `AppDebug` gains `pinEntry(ms: number | null): void` (advances the running entry or Konami machine to elapsed `ms`, forward only, firing the events passed, and holds it there; `null` releases) and `forceE(e: number | null): void` (overrides `maskE` while a mask is uploaded; `null` releases).
  - `PnHooks` gains `setTime(ms: number | null): void` (→ `pinEntry`) and `setE(e: number | null): void` (→ `forceE`).
  - `src/main.ts`: `function takeEntryControl(doc: Document, nowMs: number): boolean` implements 4.7.2 (`data-entry="run"` and `nowMs < 4000` → set `"wait"` and return `true`; otherwise remove `data-entry` and return `false`); `boot()` calls `takeEntryControl(doc, win.performance.now())` and passes the result as `AppOptions.entry`; a fallback after takeover removes `data-entry` (already in `applyFallback`).
- New `App` internals (private; Tasks 19 and 20 extend them by name): module-level `type MaskKind = 'entry'` and `function isRunning(m: EntryMachine | null): boolean`; fields `entry`, `maskKind`, `maskTimer`, `fontSettled`, `probeStarted`, `ended`, `pinnedMs`, `forcedE`; methods `beginEntry()`, `entryTimings()`, `onEntryEvent(ev)`, `prepareEntryMask()`, `uploadMask(kind)`, `maskBoxNow(kind)`, `maskCanvas(w, h)`, `clearMask()`, `scheduleMaskRaster()`, `cancelMaskRaster()`, `skipEntry()`, `startProbe()`, `maskBusy()`, `pinnedDt(m, dt)`, `pinEntry(ms)`, `forceE(e)`.
- Two readings recorded here so reviewers see them as plan, not drift: the `focusin` listener and the font wait are installed on every `App.start` (not only when `o.entry` is true), so a debug `replayEntry()` gets the same keyboard skip (3.4.9) and the font state is known (4.7.4 step 4 lists the font wait unconditionally); a `skip` releases a debug pin, so a Tab or a context loss during a pinned filmstrip still finishes its 250 ms dissolve.

- [ ] **Step 1: Record the RED state in the browser**

Start the dev server (Bash, `run_in_background: true`): `cd /c/Users/parsa/parsanaji.com && npm run dev`. Create the evidence folder: `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-18`.

`new_page` `http://localhost:5173/` with `isolatedContext: "t18-red"`, `emulate` `viewport: "1440x900x1"`, then `navigate_page` (`type: "url"`, same URL) with this `initScript` (ENTRY_LOG; it records every `data-entry` / `data-field-ready` change with its time and samples every `[data-reveal]` opacity 2997 ms after the canvas is shown):
```js
(() => {
  const log = (window.__entryLog = []);
  let t0 = null;
  const sample = () => ({
    t: performance.now(),
    entry: document.documentElement.getAttribute('data-entry'),
    opacities: [...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity),
  });
  new MutationObserver(() => {
    const h = document.documentElement;
    const entry = h.getAttribute('data-entry');
    const ready = h.hasAttribute('data-field-ready');
    const prev = log[log.length - 1];
    if (prev && prev.entry === entry && prev.ready === ready) return;
    log.push({ t: performance.now(), entry, ready });
    if (ready && t0 === null) {
      t0 = performance.now();
      window.__t0 = t0;
      setTimeout(() => { window.__at2997 = sample(); }, 2997);
    }
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-entry', 'data-field-ready'] });
})();
```
After 5 s, `evaluate_script` (READ_LOG, reused below):
```js
() => {
  const t0 = window.__t0;
  const rows = window.__entryLog.map((r) => ({ dt: t0 === undefined ? null : Math.round(r.t - t0), entry: r.entry, ready: r.ready }));
  const s = window.__at2997;
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    rows,
    at2997: s ? { dt: Math.round(s.t - t0), entry: s.entry, opacities: s.opacities } : null,
    t0: t0 === undefined ? null : Math.round(t0),
    fcp: fcp ? Math.round(fcp.startTime) : null,
  };
}
```
Expected before this task (P9: `takeEntryControl` removes `data-entry` at once): `rows` shows `entry: "run"` and then `entry: null` with no `"wait"`, `"scrim"` or `"reveal"` row. Record it in the report as the RED reading.

- [ ] **Step 2: Take control of the entry in `src/main.ts` (4.7.2)**

Every hunk in this task is an exact before/after pair: the "before" text occurs exactly once in the file named on its label line (as Tasks 15 and 16 left it, or as an earlier hunk of this task left it); replace it with the "after" text. Apply the hunks in the order given.

Replace Task 8's interim function (Task 15 kept it byte for byte).

`src/main.ts`, before (Tasks 8 and 15):
```ts
/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}
```
After:
```ts
/**
 * 4.7.2: when theme-boot.js set data-entry="run" and main.ts runs before 4000 ms, switch to "wait"
 * (cancelling the CSS failsafe) and plan the entry; otherwise the failsafe already showed the rail,
 * so remove data-entry and plan none (11.7).
 */
function takeEntryControl(doc: Document, nowMs: number): boolean {
  const html = doc.documentElement;
  if (html.getAttribute('data-entry') === 'run' && nowMs < 4000) {
    html.setAttribute('data-entry', 'wait');
    return true;
  }
  html.removeAttribute('data-entry');
  return false;
}
```
`src/main.ts`, before (Task 15):
```ts
  const entry = takeEntryControl(doc);
```
After:
```ts
  const entry = takeEntryControl(doc, win.performance.now());
```
Nothing else in `main.ts` changes: `entry` already flows into `App.start({ …, entry, … })`, and `applyFallback` already removes `data-entry` (3.6.2).

- [ ] **Step 3: `src/app.ts` imports, module helpers and `AppDebug`**

`src/app.ts`, before (Task 15):
```ts
import { FpsProbe } from './core/quality';
import { breathScale, effectiveIntensity } from './field/flow';
import type { FieldParams } from './field/params';
```
After (the imports stay sorted by path):
```ts
import { waitForFont } from './boot/fonts';
import { CONTENT } from './content';
import { FpsProbe } from './core/quality';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
import { breathScale, effectiveIntensity } from './field/flow';
import { MASK_FONT_FAMILY, maskBoxFor, rasterizeMask, type Canvas2DLike, type MaskBox } from './field/nameMask';
import type { FieldParams } from './field/params';
```
`src/app.ts`, before (Task 15, the end of `AppDebug`):
```ts
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
}
```
After:
```ts
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
  pinEntry(ms: number | null): void; // P4, 4.7.5: __pn.setTime
  forceE(e: number | null): void; // P4, 4.7.5: __pn.setE
}
```
`src/app.ts`, before (Task 15, the last module constant before `export class App`):
```ts
const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');
```
After:
```ts
const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');

/** Which text the uploaded mask holds (4.5.7: one mask texture, built at arm, deleted at done). */
type MaskKind = 'entry';

/** A machine runs from arm() until its dissolve ends (3.4.2, 3.4.11). */
function isRunning(m: EntryMachine | null): boolean {
  return m !== null && m.phase !== 'idle' && m.phase !== 'done';
}
```

- [ ] **Step 4: Fields, `App.start`, `replayEntry()` and `debug()`**

`src/app.ts`, before (Task 15, the last two fields):
```ts
  private last: FrameInputs | null = null;
  private pendingColors: FieldColors | null = null;
```
After:
```ts
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
```
`src/app.ts`, before (Task 15, `App.start`):
```ts
      app.loop.start();
      return app;
```
After:
```ts
      app.loop.start();
      app.beginEntry(); // 4.7.4 steps 3–4
      return app;
```
`src/app.ts`, before (Task 15, the P11 no-op):
```ts
  /** P11: ignored until Task 18 adds the entry. */
  replayEntry(): void {}
```
After:
```ts
  /** Debug panel: re-arms the full entry including data-entry="wait" (4.3). Ignored while a mask runs. */
  replayEntry(): void {
    if (this.ended || this.disposed || this.reduced || !this.programsReady || this.maskBusy()) return;
    this.entry = new EntryMachine(this.entryTimings(), (ev) => this.onEntryEvent(ev));
    this.o.doc.documentElement.setAttribute('data-entry', 'wait');
    this.entry.arm();
    this.prepareEntryMask();
  }
```
`src/app.ts`, before (Task 15, `debug()`):
```ts
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
    };
```
After:
```ts
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
      pinEntry: (ms: number | null) => this.pinEntry(ms),
      forceE: (e: number | null) => this.forceE(e),
    };
```

- [ ] **Step 5: Replace `stepMask`, `onProgramsReady`; extend `regrid` and `contextLost`**

`src/app.ts`, before (Task 15):
```ts
  /** Mask progress e; Task 18 drives the entry and Konami machines here. */
  private stepMask(_dtMs: number, _visible: boolean): number {
    return 0;
  }
```
After:
```ts
  /** 4.4.3 step 2: e from the running machine; a debug pin holds it at the pinned entry time. */
  private stepMask(dtMs: number, visible: boolean): number {
    let e = 0;
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
    if (this.forcedE !== null && this.maskKind !== null) e = this.forcedE;
    return e;
  }
```
`src/app.ts`, before (Task 15: it sets `data-field-ready` and starts the FPS probe):
```ts
  /** The first real frame (3.4.7.1): show the canvas and start the FPS probe (3.7.9, 11.30). */
  private onProgramsReady(): void {
    this.o.doc.documentElement.setAttribute('data-field-ready', '');
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }
```
After:
```ts
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
```
`src/app.ts`, before (Task 15, the end of `regrid`):
```ts
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
  }
```
After:
```ts
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
    this.scheduleMaskRaster(); // 3.7.1: an active mask is re-rasterised 150 ms after the last resize
  }
```
`src/app.ts`, before (Task 15):
```ts
  contextLost(): void {
    if (this.disposed) return;
    this.loop.stop();
```
After:
```ts
  contextLost(): void {
    if (this.disposed) return;
    this.skipEntry(); // 3.6.3, 3.4.9: context loss mid-entry makes the rail usable at once
    this.loop.stop();
```

- [ ] **Step 6: Add the entry methods**

They go after `bindPointer()`, the last method of the class. `src/app.ts`, before (Task 15, the end of `bindPointer()` and of the class):
```ts
      doc.documentElement.removeEventListener('pointerleave', onRelease);
    });
  }
}
```
After:
```ts
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
```

- [ ] **Step 7: `src/debugHooks.ts` gains `setTime` and `setE` (4.7.5)**

`src/debugHooks.ts`, before (Task 15, the end of `PnHooks`):
```ts
  grid(): Grid | null;
}
```
After:
```ts
  grid(): Grid | null;
  setTime(ms: number | null): void; // pins the running entry or Konami at entry time ms (forward only); null releases
  setE(e: number | null): void; // forces the mask progress while a mask is uploaded; null releases
}
```
`src/debugHooks.ts`, before (Task 15, the end of the hooks object that `installDebugHooks` assigns to `win.__pn`):
```ts
    grid: () => app.grid,
  };
```
After:
```ts
    grid: () => app.grid,
    setTime: (ms: number | null) => app.debug().pinEntry(ms),
    setE: (e: number | null) => app.debug().forceE(e),
  };
```

- [ ] **Step 8: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`:
- `npm test` → `Test Files  28 passed (28)`, `Tests  262 passed (262)` (Task 17's counts; no new test file).
- `npm run typecheck` → prints nothing.
- `npm run build` → `✓ built in …`. Then `grep -c "__pn" dist/assets/*.js` prints `:0` for every file (with `VITE_PN_DEBUG` unset, `debugHooks.ts` stays out of the production build, 4.12.1; `App.debug()` and its `pinEntry` / `forceE` exist in every build by P4).

- [ ] **Step 9: Entry timeline and the 6.1.8 reading (8.2.4)**

On the running dev server: `new_page` `http://localhost:5173/` (`isolatedContext: "t18-timeline"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` with the ENTRY_LOG `initScript` of Step 1. After 5 s run READ_LOG.

Expected `rows` (every `dt` may be up to one frame, 17 ms, late):
| dt | entry | ready |
|---|---|---|
| null or < 0 | `run` | false |
| null or < 0 | `wait` | false |
| 0 | `wait` | true |
| 1900–1917 | `scrim` | true |
| 2100–2117 | `reveal` | true |
| 3300–3317 | null | true |

and `at2997.opacities` is nine `"1"` strings (the eight blocks and the toggle), read at `at2997.dt` = 2997 plus a few ms of timer slack (6.1.8: the rail is fully visible by t = 2980 ms; designed 2980). Also record `t0` (navigation-relative ms of the entry's t = 0) and `fcp`: on the entry path the first contentful paint is the first visible field frame, so `fcp` lands within a frame or two after `t0` (6.1.7; the throttled budget run is Task 23). Save the result with `evaluate_script` `filePath` `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-18/entry-timeline.json` and write the six `dt` values into the report.

- [ ] **Step 10: Filmstrip with `__pn.setTime` (8.2.4)**

For each `T` in 450, 1400, 2300, 3400: `navigate_page` (`type: "url"`, `http://localhost:5173/`) with this `initScript` (PIN, with `T` replaced by the number). It pins the entry the moment `installDebugHooks` assigns `window.__pn`, which happens before the programs are ready, so the entry starts and jumps straight to `T`:
```js
(() => {
  const T = 450;
  Object.defineProperty(window, '__pn', {
    configurable: true,
    get() { return undefined; },
    set(hooks) {
      Object.defineProperty(window, '__pn', { value: hooks, writable: true, configurable: true });
      window.__pinnedBy = 'trap';
      hooks.setTime(T);
    },
  });
})();
```
Wait 1500 ms, then `evaluate_script`:
```js
() => ({ pinned: window.__pinnedBy, entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), noWebgl: document.documentElement.classList.contains('no-webgl') })
```
Expected (3.4.2): T 450 → `{ pinned: 'trap', entry: 'wait', ready: true, noWebgl: false }` (the name half formed); T 1400 → `entry: 'wait'` (name formed); T 2300 → `entry: 'reveal'` (scrim and reveal fired; the rail fades on the wall clock from the moment `reveal` fired); T 3400 → `entry: null` (cleanup fired, mask gone). (`installDebugHooks` assigns `win.__pn` with a plain assignment, so the trap's setter runs.)

The rail fade runs on the wall clock, so for T 2300 take the screenshot the moment `reveal` lands instead of after the 1500 ms wait: navigate with the PIN `initScript`, then run
```js
async () => {
  const h = document.documentElement;
  const t = performance.now();
  while (h.getAttribute('data-entry') !== 'reveal' && performance.now() - t < 5000) await new Promise((r) => setTimeout(r, 10));
  return h.getAttribute('data-entry');
}
```
(→ `reveal`) and `take_screenshot` at once (the blocks are mid-fade: each fades over 600 ms after its n × 40 ms delay); the attribute check above still reads `entry: 'reveal'` afterwards.

For T 1400 only, before the screenshot, bend the letters with the pointer over the `N` of "Naji" (about x 900, y 450 at 1440×900):
```js
async () => {
  for (let i = 0; i < 20; i++) {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 880 + i, clientY: 450, pointerType: 'mouse', isPrimary: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 16));
  }
  await new Promise((r) => setTimeout(r, 400));
  return 'moved';
}
```
`take_screenshot` each into `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-18/`: `1440x900-dark-t450.png` (the name half condensed out of the flow), `1440x900-dark-t1400.png` (the letters spread around the pointer: the 3.4.4 bend), `1440x900-dark-t2300.png` (letters melting, rail fading in), `1440x900-dark-t3400.png` (idle field under the rail). Open each with the Read tool and describe it in the report.

- [ ] **Step 11: Keyboard skip and context-loss skip (3.4.9, 3.5.11, 3.6.3)**

Tab: `navigate_page` with the PIN `initScript` at `T = 1400`, wait 1500 ms, `press_key` `Tab`, then within 100 ms `evaluate_script`:
```js
async () => {
  const h = document.documentElement;
  const now = { entry: h.getAttribute('data-entry'), focus: document.activeElement?.getAttribute('data-link'), opacity: getComputedStyle(document.querySelector('[data-reveal="5"]')).opacity };
  await new Promise((r) => setTimeout(r, 400));
  return { now, later: { entry: h.getAttribute('data-entry') } };
}
```
Expected: `now` = `{ entry: 'skip', focus: 'github', opacity: '1' }` (rail visible at once, no transition), `later.entry` = `null` (the 250 ms fast dissolve ended, `done` deleted the mask, `cleanup` removed `data-entry`). Screenshot `1440x900-dark-tab-skip.png` after `later`.

Context loss: `navigate_page` with the PIN `initScript` at `T = 1400`, wait 1500 ms, then:
```js
async () => {
  const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
  const ext = gl.getExtension('WEBGL_lose_context');
  const h = document.documentElement;
  ext.loseContext();
  await new Promise((r) => setTimeout(r, 50));
  const lost = { entry: h.getAttribute('data-entry'), ready: h.hasAttribute('data-field-ready'), noWebgl: h.classList.contains('no-webgl') };
  ext.restoreContext();
  await new Promise((r) => setTimeout(r, 800));
  return { lost, after: { entry: h.getAttribute('data-entry'), noWebgl: h.classList.contains('no-webgl') } };
}
```
Expected: `lost` = `{ entry: 'skip', ready: true, noWebgl: false }`, `after` = `{ entry: null, noWebgl: false }`.

- [ ] **Step 12: Hidden at load (8.2.9)**

`new_page` `http://localhost:5173/` with `background: true` and `isolatedContext: "t18-hidden"`. Wait 3 s, then `evaluate_script` on that page (`pageId` of the new page, `waitForStableDom: false`):
```js
() => ({ vis: document.visibilityState, entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), noWebgl: document.documentElement.classList.contains('no-webgl') })
```
Expected: `{ vis: 'hidden', entry: 'wait', ready: false, noWebgl: false }` (the machine waits in pending; no readiness timeout, 11.8). Then `select_page` with `bringToFront: true`, wait 700 ms, `take_screenshot` `1440x900-dark-hidden-start.png` (the name forming now), wait 4 s more and run the same script: `{ vis: 'visible', entry: null, ready: true, noWebgl: false }`.

- [ ] **Step 13: Slow network: `main.ts` runs after the 4 s failsafe (4.7.2, 11.7; Review Focus)**

On a slow phone connection the module script can arrive after the CSS failsafe has already shown the rail. Then `takeEntryControl` must remove `data-entry` and plan no entry, never switch to `wait` (which would hide the rail the visitor is already reading). This `initScript` (LATE) shifts `performance.now()` 5000 ms ahead, which is exactly what `takeEntryControl(doc, win.performance.now())` sees in that case; the App's frame loop runs on `requestAnimationFrame` timestamps, which it leaves alone:
```js
(() => {
  const now = performance.now.bind(performance);
  performance.now = () => now() + 5000;
})();
```
Fresh page (`isolatedContext: "t18-late"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/` with LATE followed by the ENTRY_LOG script of Step 1 (concatenate the two IIFEs; ENTRY_LOG reads the shifted clock too, so its `dt` values stay relative). After 5 s run READ_LOG, then:
```js
() => ({ entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), noWebgl: document.documentElement.classList.contains('no-webgl'), opacities: [...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity) })
```
Expected: READ_LOG `rows` are `run` with `ready: false` (theme-boot.js), then `null` with `ready: false` (main.ts released the rail at once), then `null` with `ready: true` (the no-entry path fades the field in, 3.4.7.1); no `wait`, `scrim` or `reveal` row; `at2997.opacities` is nine `"1"`. The state script returns `{ entry: null, ready: true, noWebgl: false }` and nine `"1"` opacities. `list_console_messages` `types: ["error", "warn"]` → none. `take_screenshot` `1440x900-dark-late-boot.png` (the rail over the idle field, no name mask). Record the rows in the report.

- [ ] **Step 14: Shader programs that never finish compiling (3.4.3, 3.6.2, 11.8; Review Focus)**

A stalled or very slow driver must never leave the pre-hidden rail on a blank page: the readiness timeout falls back 3000 ms after the first animation frame. This `initScript` (STALL) makes `KHR_parallel_shader_compile` answer "still compiling" forever (the fake extension object also stands in where the real one is missing), records every change of the `<html>` state, and notes the first animation frame and the state at 2500 ms:
```js
(() => {
  const COMPLETION_STATUS_KHR = 0x91b1;
  const proto = WebGL2RenderingContext.prototype;
  const getExtension = proto.getExtension;
  proto.getExtension = function (name) {
    return name === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR } : getExtension.call(this, name);
  };
  const getProgramParameter = proto.getProgramParameter;
  proto.getProgramParameter = function (program, pname) {
    return pname === COMPLETION_STATUS_KHR ? false : getProgramParameter.call(this, program, pname);
  };
  const state = () => {
    const h = document.documentElement;
    return {
      t: Math.round(performance.now()),
      entry: h.getAttribute('data-entry'),
      noWebgl: h.classList.contains('no-webgl'),
      ready: h.hasAttribute('data-field-ready'),
      opacities: [...new Set([...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity))],
    };
  };
  window.__stall = [];
  requestAnimationFrame((t) => { window.__firstRaf = Math.round(t); });
  new MutationObserver(() => window.__stall.push(state())).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-entry', 'data-field-ready'] });
  setTimeout(() => { window.__stallAt2500 = state(); }, 2500);
})();
```
Fresh page (`isolatedContext: "t18-stall"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/` with STALL; wait 5 s, then:
```js
() => {
  const fallback = window.__stall.find((s) => s.noWebgl) ?? null;
  return { firstRaf: window.__firstRaf, at2500: window.__stallAt2500, fallback, afterFirstRaf: fallback ? fallback.t - window.__firstRaf : null, now: window.__stall.at(-1) };
}
```
Expected: `at2500` = `{ entry: 'wait', noWebgl: false, ready: false, opacities: ['0'] }` (the entry waits for its programs and the canvas stays hidden); `fallback` = `{ entry: null, noWebgl: true, ready: false, opacities: ['1'] }` with `afterFirstRaf` between 3000 and 4000 (the 3000 ms readiness timeout counts from the App's first frame, which can trail the page's first frame while the dev server serves the modules); `now` equals `fallback` (nothing changes afterwards). `list_console_messages` `types: ["warn"]` → exactly one message, `[pn] static fallback: field`; `types: ["error"]` → none. `take_screenshot` `1440x900-dark-stalled.png` (the rail on `--bg`, no field).

- [ ] **Step 15: Band entry and hold screenshots in both looks**

1440×900 light: `emulate` `colorScheme: "light"`, `navigate_page` with PIN `T = 1400`, wait 1500 ms, `take_screenshot` `1440x900-light-hold.png`; the dark one is `1440x900-dark-t1400.png` from Step 10 (also save a copy as `1440x900-dark-hold.png` with a fresh PIN load and no pointer).
390×844: `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`, `navigate_page` with PIN `T = 1400`, wait 1500 ms, `take_screenshot` `390x844-dark-hold.png` and, with `colorScheme: "light"`, `390x844-light-hold.png`. Expected: "Parsa Naji" spans about 84 % of the band width (3.4.6: about 54.6 CSS px, 40 px cap height at 2 CSS px cells) and sits centred in the band.
Resize debounce (3.7.1): with the 1440×900 PIN `T = 1400` page open, `emulate` `viewport: "1280x720x1"`, wait 400 ms, `take_screenshot` `1280x720-dark-hold-resized.png`: the name is re-centred in the new field (re-rasterised 150 ms after the resize).

- [ ] **Step 16: Console check (8.2.1, 8.3.2)**

Six fresh pages (`new_page` with `isolatedContext` `t18-c1` … `t18-c6`): viewports `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, each in `colorScheme` `dark` and `light`; for each, `emulate`, then `navigate_page` `type: "reload"`, wait 4 s (the entry completes), `list_console_messages` with `types: ["error", "warn"]` → no messages. Record the six results; `close_page` each page.

- [ ] **Step 17: Finish gate and report**

Load the `frontend-design` skill (Skill tool, `frontend-design:frontend-design`, Execution Notes) and review the filmstrip and hold screenshots against it; write the verdict, every measured number of Steps 9–15 and the evidence file list into `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-18-report.md`. Stop the dev server and close every page (Global Constraints, browser procedure).

- [ ] **Step 18: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/app.ts src/main.ts src/debugHooks.ts
git commit -m "feat(entry): the field forms the name on every load

main.ts takes control before 4000 ms (data-entry wait, 4.7.2); App arms the
EntryMachine, waits for the mask font, rasterises Parsa Naji over the whole
field and starts on the first visible ready frame. Events drive <html>
(4.4.5): field-ready at start, scrim, reveal, mask deleted and the FPS probe
at done, data-entry removed at cleanup. Rail focus and context loss skip
(3.4.9); an active mask re-rasterises 150 ms after a resize (3.7.1).
__pn.setTime and __pn.setE pin the timeline for the filmstrip (4.7.5).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Reduced motion

**Files:**
- Modify: `src/app.ts`
- Test: none new; browser evidence under `evidence/task-19/`

**Interfaces:**
- Consumes: Task 13 `Loop.wake()`; Task 10 `PointerModel.settled`; Task 8 `ColorTween.active`; Task 17 `EntryMachine.skip(fastMs?: number): void`; Task 15 internals `idle`, `reduced`, `tau`, `ripples`, `probe`, `onProgramsReady`, `spawnAllowed`; Task 18 entry wiring.
- Produces (`App` behaviour): under reduced motion τ starts at `params.staticTimeS` (12) and stays frozen; turning reduced motion on mid-session freezes the current τ (11.25) and skips a running entry; breath is 1; no rings spawn and existing rings are cleared; the FPS probe never runs; `idle()` returns true once the pointer is `settled` and no colour tween, Konami or resize is pending, so the loop idles; pointer events, resizes and `setColors` wake it (the tween keeps it awake until it ends); pointer repel stays on.
- New `App` internals: field `idling` (set by `idle()`, the only place that decides the loop goes idle); methods `beginReducedMotion()` and `wakeIfIdle()`. `wakeIfIdle()` calls `loop.wake()` only after a frame returned "idle", so a wake never doubles a frame that is already scheduled.

- [ ] **Step 1: Record the RED state in the browser**

Start the dev server (`npm run dev`, `run_in_background: true`) and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-19`. The reduced-motion init script (RM; `START` is `true` here; it also counts `requestAnimationFrame` calls):
```js
(() => {
  const START = true;
  const real = window.matchMedia.bind(window);
  const mql = new EventTarget();
  Object.assign(mql, {
    matches: START,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener(fn) { mql.addEventListener('change', fn); },
    removeListener(fn) { mql.removeEventListener('change', fn); },
  });
  window.__setReduced = (on) => {
    mql.matches = on;
    const ev = new Event('change');
    Object.assign(ev, { matches: on, media: mql.media });
    mql.dispatchEvent(ev);
  };
  window.matchMedia = (q) => (q.includes('prefers-reduced-motion') ? mql : real(q));
  const raf = window.requestAnimationFrame.bind(window);
  window.__raf = 0;
  window.requestAnimationFrame = (cb) => { window.__raf += 1; return raf(cb); };
})();
```
`new_page` `http://localhost:5173/` (`isolatedContext: "t19-red"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` with RM. Wait 2 s, `take_screenshot` `red-a.png`, wait 1 s, `take_screenshot` `red-b.png` (both with `filePath` in `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-19/`; every screenshot of this task goes there). Compare the field region right of the scrim (x 1000–1440) with sharp from the repo's devDependencies:
```bash
cd /c/Users/parsa/parsanaji.com && node -e "const s=require('sharp'),d='.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-19/';const f=(p)=>s(d+p).extract({left:1000,top:0,width:440,height:900}).raw().toBuffer();Promise.all([f(process.argv[1]),f(process.argv[2])]).then(([a,b])=>console.log(a.equals(b)?'identical':'different'))" red-a.png red-b.png
```
Expected before this task: `different` (τ and breath still advance). Record it as the RED reading.

- [ ] **Step 2: Field, start hook and the wake points**

Every hunk in this task is an exact before/after pair: the "before" text occurs exactly once in `src/app.ts` as Tasks 15 and 18 left it (or as an earlier hunk of this task left it); replace it with the "after" text, in the order given.

`src/app.ts`, before (Task 18, the last field):
```ts
  private forcedE: number | null = null;                          // __pn.setE (P4)
```
After:
```ts
  private forcedE: number | null = null;                          // __pn.setE (P4)
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
```
`src/app.ts`, before (Task 18, `App.start`):
```ts
      app.loop.start();
      app.beginEntry(); // 4.7.4 steps 3–4
```
After:
```ts
      app.loop.start();
      app.beginReducedMotion(); // 3.3.6.3, 3.6.4
      app.beginEntry(); // 4.7.4 steps 3–4
```
`src/app.ts`, before (Task 15, the end of `setColors`):
```ts
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
  }
```
After:
```ts
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
    this.wakeIfIdle(); // 4.6.6: under reduced motion the loop is woken until the tween ends
  }
```
`src/app.ts`, before (Task 15):
```ts
  resume(): void {
    if (this.disposed) return;
```
After:
```ts
  resume(): void {
    this.idling = false; // the restarted loop schedules its own frame
    if (this.disposed) return;
```
`src/app.ts`, before (Task 15, `resize` and `dprChanged`):
```ts
    this.regrid(deviceBox);
    this.loop.wake();
  }

  dprChanged(): void {
    this.resize(null);
  }
```
After:
```ts
    this.regrid(deviceBox);
    this.loop.wake();
    this.wakeIfIdle(); // 3.6.4: a resize renders one frame at the new size
  }

  dprChanged(): void {
    this.resize(null);
    this.wakeIfIdle(); // 3.6.4: a resize renders one frame at the new size
  }
```

- [ ] **Step 3: Reduced-motion rules in the frame and the guards**

`src/app.ts`, before (Task 15):
```ts
  /** Task 19 adds the reduced-motion behaviour; slice 2 only tracks the flag. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
  }
```
After:
```ts
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
```
`src/app.ts`, before (Task 15, the τ statement in `frame`):
```ts
        this.tau += (dtMs / 1000) * effectiveIntensity(this.params);
```
After:
```ts
        if (!this.reduced) this.tau += (dtMs / 1000) * effectiveIntensity(this.params); // 3.3.6.3: τ frozen under reduced motion
```
`src/app.ts`, before (Task 15, the `breath` member of the frame inputs):
```ts
        breath: breathScale(this.simMs, p.breath.amp, p.breath.periodMs),
```
After:
```ts
        breath: this.reduced ? 1 : breathScale(this.simMs, p.breath.amp, p.breath.periodMs), // 3.3.9
```
`src/app.ts`, before (Task 15):
```ts
  /** Spec 4.4.3 step 6: only reduced motion renders on demand; Task 19 adds the 3.6.4 settled condition. */
  private idle(): boolean {
    if (!this.reduced) return false;
    return false;
  }
```
After:
```ts
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
```
`src/app.ts`, before (Task 15, the start of `spawnAllowed`):
```ts
  private spawnAllowed(e: PointerEvent): boolean {
    if (!e.isPrimary || e.button !== 0) return false;
```
After:
```ts
  private spawnAllowed(e: PointerEvent): boolean {
    if (this.reduced) return false; // 3.3.8, 3.6.4: no rings under reduced motion
    if (!e.isPrimary || e.button !== 0) return false;
```
`src/app.ts`, before (Task 18, `startProbe`):
```ts
    if (this.probeStarted) return;
```
After:
```ts
    if (this.probeStarted || this.reduced) return; // 3.7.9, 11.30: never under reduced motion
```

- [ ] **Step 4: Wake the loop from the mask timer and the debug hooks; add the two methods**

`src/app.ts`, before (Task 18, the timer callback of `scheduleMaskRaster`):
```ts
      if (this.maskKind !== null) this.uploadMask(this.maskKind);
    }, this.params.boot.resizeDebounceMs);
```
After:
```ts
      if (this.maskKind !== null) this.uploadMask(this.maskKind);
      this.wakeIfIdle();
    }, this.params.boot.resizeDebounceMs);
```
`src/app.ts`, before (Task 18, the end of `pinEntry`):
```ts
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
  }
```
After:
```ts
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
    this.wakeIfIdle();
  }
```
`src/app.ts`, before (Task 18, the end of `forceE`, the last method of the class):
```ts
    this.forcedE = e === null || !Number.isFinite(e) ? null : Math.min(1, Math.max(0, e));
  }
```
After (the two new private methods follow `forceE`):
```ts
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
```
These wake listeners are added next to Task 15's own pointer listeners, which keep feeding `PointerModel`; they only restart the loop.

- [ ] **Step 5: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  28 passed (28)`, `Tests  262 passed (262)`; no new test file), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`).

- [ ] **Step 6: The static field (8.2.6)**

On the dev server, `new_page` (`isolatedContext: "t19-still"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/` with RM (`START = true`). Right after the navigation returns, `evaluate_script`:
```js
() => ({ entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), rail: [...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity) })
```
Expected: `entry: null`, `ready: true`, `rail` nine `"1"` (the rail is visible in the first paint: `theme-boot.js` never set `data-entry`, 3.4.10).
Still: wait 2 s, `take_screenshot` `1440x900-dark-still-a.png`, wait 1 s, `take_screenshot` `1440x900-dark-still-b.png`, then run the Step 1 comparison with `1440x900-dark-still-a.png 1440x900-dark-still-b.png` → `identical`.
Repel: `evaluate_script` dispatching `new PointerEvent('pointermove', { clientX: 1200, clientY: 300, pointerType: 'mouse', isPrimary: true, bubbles: true })` on `window` 20 times 16 ms apart, wait 1200 ms (settled), `take_screenshot` `1440x900-dark-still-pointer.png`; comparison with `still-b` → `different` (pointer repel stays on, R13).
No rings: `take_screenshot` `1440x900-dark-ring-before.png`, then on the canvas
```js
() => {
  const c = document.querySelector('canvas[data-field]');
  const o = { clientX: 1200, clientY: 300, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true };
  c.dispatchEvent(new PointerEvent('pointerdown', o));
  c.dispatchEvent(new PointerEvent('pointerup', o));
  return 'clicked';
}
```
wait 500 ms, `take_screenshot` `1440x900-dark-ring-after.png`; comparison → `identical` (no Shockwave).
CSS side (3.6.4, 3.5.8): `grep -n -A8 "prefers-reduced-motion" src/styles.css` shows `.dot::after { animation: none; opacity: 0; }`, the `transition: none` list for `.lnk`, the toggle and `.keys`, and the `html[data-entry]` rule; paste it into the report (the CSS media block cannot be emulated by the init script).

- [ ] **Step 7: Reduced motion turning on mid-entry (3.4.9, 11.25)**

`navigate_page` with RM where `START = false` and, in the same `initScript` after it, the Task 18 PIN script with `T = 1400` (concatenate the two IIFEs). Wait 1500 ms (the name is held), then:
```js
async () => {
  const h = document.documentElement;
  window.__setReduced(true);
  const now = h.getAttribute('data-entry');
  await new Promise((r) => setTimeout(r, 500));
  return { now, later: h.getAttribute('data-entry') };
}
```
Expected: `{ now: 'skip', later: null }`. Then wait 1500 ms, `take_screenshot` `1440x900-dark-midswitch-a.png`, wait 1 s, `take_screenshot` `1440x900-dark-midswitch-b.png`, comparison → `identical` (τ frozen where it was, not jumped to 12).

- [ ] **Step 8: Crossfade under reduced motion, then idle (4.6.6, 3.6.4)**

`navigate_page` with RM (`START = true`), wait 2 s, then:
```js
async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const c0 = window.__raf;
  await wait(1000);
  const idleBefore = window.__raf - c0;
  document.querySelector('[data-theme-toggle]').click();
  await wait(1000);
  const c1 = window.__raf;
  await wait(2000);
  return { idleBefore, crossfade: c1 - c0 - idleBefore, idleAfter: window.__raf - c1, theme: document.documentElement.getAttribute('data-theme') };
}
```
Expected: `idleBefore: 0`; `crossfade` between 15 and 30 (the 300 ms tween keeps the loop awake, then one more frame); `idleAfter: 0` (no rAF callbacks for 2 s); `theme` is `light`. `take_screenshot` `1440x900-light-reduced.png`. Press the toggle once more to restore the OS look (`localStorage` key removed, 3.5.10).

- [ ] **Step 9: Console check**

`list_console_messages` with `types: ["error", "warn"]` on the Step 6–8 page → none. Then the normal-motion path still plays: a fresh page (`isolatedContext: "t19-normal"`) without RM at 1440×900 dark, wait 4 s, `evaluate_script` `() => document.documentElement.hasAttribute('data-entry')` → `false` and `list_console_messages` (`types: ["error", "warn"]`) → none. Write every comparison result into `task-19-report.md`, stop the dev server and close every page.

- [ ] **Step 10: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/app.ts
git commit -m "feat(field): reduced motion: frozen still, no rings, on-demand frames

Under prefers-reduced-motion τ starts at 12 s (the OG still) and stays
frozen, breath is 1, clicks spawn no rings and the FPS probe never runs.
The loop idles once the pointer is settled and no tween, Konami or mask
re-raster is pending; pointer input, resizes and theme changes wake it.
Turning reduced motion on mid-session freezes the current τ and skips a
running entry (3.6.4, 3.4.9, 11.25).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Konami "nice."

**Files:**
- Create: `src/eggs/konami.ts`
- Modify: `src/app.ts` (`konami()`), `src/main.ts` (the keydown listener)
- Test: `tests/konami.test.ts`

**Interfaces:**
- Consumes: Task 17 `EntryMachine`, `EntryTimings`; Task 11 `maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox`, `rasterizeMask`; Task 9 `BAND_QUERY`; Task 5 `CONTENT.konamiText`; Task 18 mask wiring; Task 19 reduced-motion flag.
- Produces:
  ```ts
  // src/eggs/konami.ts
  export const KONAMI: readonly string[]; // ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a
  export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void }; // b and a case-insensitive
  export function konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null; // maskBoxFor('konami', …), null when empty (Index amendment A11)
  ```
  `push` returns `true` only on the key that completes the code; any other key resets, and an overlapping prefix still matches. A `key` that is not a string (a synthetic keydown) is neutral like a lone Shift: it neither advances nor resets, and `push` never throws (Index amendment A12).
- Produces (`App.konami()` behaviour): ignored while the entry or another Konami runs, when the field is not running, and when `konamiMaskBox` returns null (the scrim leaves no clear field: rail windows about 720–790 px wide; Index amendment A11); mask box measured at trigger time from `o.scrim.getBoundingClientRect().right` and `o.win.matchMedia(BAND_QUERY).matches`; timings from `params.konami` with `scrimAtMs`, `revealAtMs` and `cleanupAtMs` null (3200 ms); under reduced motion `{ gatherMs: 0, holdMs: params.konami.holdMs, dissolveMs: 0 }` (P7); the rail stays visible.
- Produces (`src/main.ts`): after the scramble position of 4.7.1, `const konami = createKonami(() => app?.konami());` and `doc.addEventListener('keydown', (e) => { if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; konami.push(e.key); });`.
- New `App` internals: `MaskKind` widens to `'entry' | 'konami'`; field `konamiM`; `maskBusy()`, `stepMask()`, `uploadMask()` and `maskBoxNow()` learn the Konami; `maskBoxNow()` returns `MaskBox | null` (null from `konamiMaskBox`) and `uploadMask()` returns false on null. Until Task 22 adds `initScramble`, the listener sits directly before `const reduced = …`, which is the same position once Tasks 21 and 22 insert their calls above it.
- 3.4.11 reading pinned by a test: lone `Shift` and `CapsLock` keydowns neither advance nor reset the sequence, so `B` and `A` typed with Shift match ("either case"); every other key breaks the run.

- [ ] **Step 1: Write the failing test**

`tests/konami.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { KONAMI, createKonami, konamiMaskBox } from '../src/eggs/konami';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function detector() {
  let matches = 0;
  const k = createKonami(() => {
    matches += 1;
  });
  return { k, matches: () => matches, pushAll: (keys: readonly string[]) => keys.map((key) => k.push(key)) };
}

describe('KONAMI (spec 3.4.11)', () => {
  it('is the classic sequence', () => {
    expect(KONAMI).toEqual(CODE);
  });
});

describe('createKonami (spec 3.4.11, 8.1.15)', () => {
  it('fires once on the full sequence and push is true only on the completing key', () => {
    const d = detector();
    const results = d.pushAll(CODE);
    expect(results).toEqual([false, false, false, false, false, false, false, false, false, true]);
    expect(d.matches()).toBe(1);
  });

  it('fires again when the code is typed again', () => {
    const d = detector();
    d.pushAll(CODE);
    d.pushAll(CODE);
    expect(d.matches()).toBe(2);
  });

  it('matches after an overlapping prefix (↑ ↑ ↑ ↓ ↓ …)', () => {
    const d = detector();
    d.pushAll(['ArrowUp', ...CODE]);
    expect(d.matches()).toBe(1);
  });

  it('matches B and A in upper case (Caps Lock or Shift)', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'B', 'A']);
    expect(d.matches()).toBe(1);
  });

  it('lets Shift and CapsLock keydowns through without breaking the run', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'Shift', 'B', 'CapsLock', 'a']);
    expect(d.matches()).toBe(1);
  });

  it('ignores a keydown without a string key (a synthetic event) without throwing or breaking the run', () => {
    const d = detector();
    const odd = [undefined, null, 42] as unknown as string[]; // what a synthetic new Event('keydown') carries in e.key
    expect(() => d.pushAll([...CODE.slice(0, 4), ...odd, ...CODE.slice(4)])).not.toThrow();
    expect(d.matches()).toBe(1);
  });

  it('resets on a wrong key', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'x', 'b', 'a']);
    expect(d.matches()).toBe(0);
    d.pushAll(['ArrowUp', 'ArrowUp', 'ArrowDown', 'Enter', ...CODE.slice(3)]);
    expect(d.matches()).toBe(0);
    d.pushAll(CODE);
    expect(d.matches()).toBe(1);
  });

  it('reset() forgets a partial sequence', () => {
    const d = detector();
    d.pushAll(CODE.slice(0, 5));
    d.k.reset();
    d.pushAll(CODE.slice(5));
    expect(d.matches()).toBe(0);
  });
});

describe('konamiMaskBox (spec 3.4.11, 11.17)', () => {
  it('is the clear field right of the scrim in the rail layout', () => {
    expect(konamiMaskBox({ w: 1440, h: 900 }, 950, false)).toEqual({ x: 950, y: 0, w: 490, h: 900 });
  });

  it('is the whole field on the band, and when there is no scrim', () => {
    expect(konamiMaskBox({ w: 390, h: 236 }, null, true)).toEqual({ x: 0, y: 0, w: 390, h: 236 });
    expect(konamiMaskBox({ w: 1440, h: 900 }, null, false)).toEqual({ x: 0, y: 0, w: 1440, h: 900 });
  });

  it('is null when the scrim reaches the field edge (rail windows about 720-790 px wide), so the Konami is skipped', () => {
    expect(konamiMaskBox({ w: 760, h: 700 }, 762, false)).toBeNull();
    expect(konamiMaskBox({ w: 760, h: 700 }, 760, false)).toBeNull();
    expect(konamiMaskBox({ w: 0, h: 0 }, null, true)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/konami.test.ts`
Expected: FAIL with `Error: Cannot find module '../src/eggs/konami' imported from C:/Users/parsa/parsanaji.com/tests/konami.test.ts`, `Test Files  1 failed (1)`, `Tests  no tests`.

- [ ] **Step 3: Write the detector**

`src/eggs/konami.ts`:
```ts
import { maskBoxFor, type MaskBox } from '../field/nameMask';

/** Konami detector (spec 3.4.11, R12c): ↑ ↑ ↓ ↓ ← → ← → b a, compared by KeyboardEvent.key. */
export const KONAMI: readonly string[] = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** Lone modifier keydowns neither advance nor reset, so Shift+B and Caps Lock work (3.4.11 "either case"). */
const NEUTRAL = new Set(['Shift', 'CapsLock']);

/**
 * Keeps the last KONAMI.length keys. Any other key breaks the run (it stays in the window, so the code
 * must be typed whole again), and an overlapping prefix such as ↑ ↑ ↑ ↓ ↓ … still matches.
 * The caller filters Ctrl, Meta, Alt and auto-repeat events before push (they neither advance nor reset).
 * A keydown without a string key (a synthetic event from an extension) is neutral too, so push never throws.
 */
export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void } {
  let recent: string[] = [];
  return {
    push(key: string): boolean {
      if (typeof key !== 'string' || NEUTRAL.has(key)) return false;
      recent.push(key.length === 1 ? key.toLowerCase() : key);
      if (recent.length > KONAMI.length) recent.shift();
      if (recent.length < KONAMI.length || recent.some((k, i) => k !== KONAMI[i])) return false;
      recent = [];
      onMatch();
      return true;
    },
    reset(): void {
      recent = [];
    },
  };
}

/**
 * 3.4.11: the Konami mask box in field-space CSS px (maskBoxFor), or null when it is empty. On a rail
 * window about 720–790 px wide the scrim reaches past the field, so there is nowhere to write "nice.":
 * App.konami() then ignores the code instead of dimming the field around no text.
 */
export function konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null {
  const box = maskBoxFor('konami', field, scrimRight, band);
  return box.w > 0 && box.h > 0 ? box : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/konami.test.ts`
Expected: PASS, `Test Files  1 passed (1)`, `Tests  12 passed (12)`.

- [ ] **Step 5: `App.konami()` and the Konami mask in `src/app.ts`**

Every hunk below is an exact before/after pair in `src/app.ts` as Tasks 15, 18 and 19 left it; apply them in order.

`src/app.ts`, before (Task 15, the `./field/sizing` import):
```ts
import { cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
```
After:
```ts
import { BAND_QUERY, cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
```
`src/app.ts`, before (Task 18 imports):
```ts
import { FpsProbe } from './core/quality';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
```
After:
```ts
import { FpsProbe } from './core/quality';
import { konamiMaskBox } from './eggs/konami';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
```
`src/app.ts`, before (Task 18, the mask kind):
```ts
type MaskKind = 'entry';
```
After:
```ts
type MaskKind = 'entry' | 'konami';
```
`src/app.ts`, before (Task 19, the field `idling`):
```ts
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
```
After:
```ts
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
  private konamiM: EntryMachine | null = null; // 3.4.11: the running (or last) Konami
```
`src/app.ts`, before (Task 15, the P11 no-op):
```ts
  /** P11: ignored until Task 20 adds the Konami machine. */
  konami(): void {}
```
After:
```ts
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
```
`src/app.ts`, before (Task 18, `stepMask`):
```ts
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
```
After:
```ts
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
    if (this.konamiM) e = Math.max(e, this.konamiM.tick(this.pinnedDt(this.konamiM, dtMs), visible));
```
`src/app.ts`, before (Task 18, `maskBusy`):
```ts
    return isRunning(this.entry);
```
After:
```ts
    return isRunning(this.entry) || isRunning(this.konamiM);
```
`src/app.ts`, before (Task 18, the start of `uploadMask`):
```ts
    if (!grid || this.ended || this.disposed) return false;
    try {
      const plane = rasterizeMask(
        CONTENT.name,
        this.maskBoxNow(kind),
```
After:
```ts
    if (!grid || this.ended || this.disposed) return false;
    const box = this.maskBoxNow(kind);
    if (!box) return false; // 3.4.11: the scrim leaves no clear field, so there is nowhere to write "nice."
    try {
      const plane = rasterizeMask(
        kind === 'konami' ? CONTENT.konamiText : CONTENT.name, // 3.4.6, 3.4.11
        box,
```
`src/app.ts`, before (Task 18, the whole `maskBoxNow` method):
```ts
  /** 3.4.6: the entry mask box is the whole field box (field-space CSS px). */
  private maskBoxNow(kind: MaskKind): MaskBox {
    return maskBoxFor(kind, { w: this.rect.width, h: this.rect.height }, null, false);
  }
```
After:
```ts
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
```
The Task 18 resize debounce re-runs `uploadMask(this.maskKind)`, so a Konami mask is re-measured and re-rasterised 150 ms after a resize too (3.7.1); if the resize leaves no clear field, the old mask keeps its old extent until the Konami's `done` deletes it.

- [ ] **Step 6: The keydown listener in `src/main.ts`**

`src/main.ts`, before (Task 15 imports):
```ts
import { seedFromLocation } from './core/prng';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
After:
```ts
import { seedFromLocation } from './core/prng';
import { createKonami } from './eggs/konami';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
`src/main.ts`, before (Task 15, in `boot()`):
```ts
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
After:
```ts
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
  doc.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; // these neither advance nor reset the sequence
    konami.push(e.key);
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

- [ ] **Step 7: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  29 passed (29)`, `Tests  274 passed (274)`: Task 19's 28 files and 262 tests plus `tests/konami.test.ts` with 12), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`).

- [ ] **Step 8: Browser evidence (8.2.11)**

Start the dev server (`npm run dev`, `run_in_background: true`) and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-20`. KONAMI_SERIES (dispatches `KEYS` as keydowns on `document`, then reads the canvas back once per 100 ms for 3.6 s inside an animation frame after the app's frame, counting field-3 pixels and the leftmost one in CSS px; the idle field never reaches field-3, 3.3.10):
```js
async () => {
  const KEYS = [{ key: 'ArrowUp' }, { key: 'ArrowUp' }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'ArrowLeft' }, { key: 'ArrowRight' }, { key: 'ArrowLeft' }, { key: 'ArrowRight' }, { key: 'b' }, { key: 'a' }];
  const c = document.querySelector('canvas[data-field]');
  const gl = c.getContext('webgl2');
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--field-3').trim();
  const f3 = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const read = () => new Promise((resolve) => requestAnimationFrame(() => {
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let n = 0, minX = w;
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      if (Math.abs(px[o] - f3[0]) <= 3 && Math.abs(px[o + 1] - f3[1]) <= 3 && Math.abs(px[o + 2] - f3[2]) <= 3) { n += 1; minX = Math.min(minX, i % w); }
    }
    resolve({ n, minXCss: n ? Math.round((minX * c.getBoundingClientRect().width) / w) : null });
  }));
  for (const d of KEYS) document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...d }));
  const t0 = performance.now();
  const series = [];
  while (performance.now() - t0 < 3600) {
    const r = await read();
    series.push([Math.round(performance.now() - t0), r.n, r.minXCss]);
    await new Promise((s) => setTimeout(s, 100));
  }
  const peak = series.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { scrimRight: Math.round(document.querySelector('.scrim').getBoundingClientRect().right), peak, series };
}
```
1. Rail layout: `new_page` `http://localhost:5173/?noentry` (`isolatedContext: "t20"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, reload, wait 1 s, run KONAMI_SERIES with `filePath` `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-20/konami-1440.json`. Expected: `scrimRight` about 950; `peak[1]` > 0; `peak[2]` (leftmost field-3 x) ≥ `scrimRight` (about `scrimRight` + 40, the "nice." box is x 950–1440 and the 137 px text is centred in it); the counts rise through about 900 ms, hold to about 2400 ms and are 0 from about 3200 ms (3.4.11, 3200 ms in total). Then the real keys: reload, wait 1 s, `press_key` `ArrowUp`, `ArrowUp`, `ArrowDown`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `ArrowLeft`, `ArrowRight`, `b`, `a`, wait 1200 ms, `take_screenshot` `1440x900-dark-konami.png` ("nice." right of the scrim, rail visible); repeat with `colorScheme: "light"` → `1440x900-light-konami.png`.
2. Band: `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`, reload `/?noentry`, wait 1 s, KONAMI_SERIES → `peak[1]` > 0 and `peak[2]` well left of 100 (the box is the whole band); press the keys again and `take_screenshot` `390x844-dark-konami.png`.
3. Ignored during the entry: `emulate` `viewport: "1440x900x1"`, `navigate_page` `http://localhost:5173/` with the Task 18 PIN `initScript` at `T = 1400`, wait 1500 ms, then SEND_KEYS:
   ```js
   () => {
     const KEYS = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
     for (const key of KEYS) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
     return { entry: document.documentElement.getAttribute('data-entry'), noWebgl: document.documentElement.classList.contains('no-webgl') };
   }
   ```
   → `{ entry: 'wait', noWebgl: false }`; then `() => window.__pn.setTime(null)`, wait 4 s (the entry finishes), run KONAMI_SERIES with `KEYS = []` → every `n` is 0 (the code was ignored, not queued).
4. Static fallback: reload `/?nowebgl`, run SEND_KEYS → it returns `{ entry: null, noWebgl: true }` without an exception, and `list_console_messages` `types: ["error", "warn"]` lists exactly one message, the DEV-only `[pn] static fallback: nowebgl` warning of 4.7.6 (production prints none), and no error.
5. Modifiers and repeats: reload `/?noentry`, run KONAMI_SERIES with `KEYS` = the code with `{ key: 'x', ctrlKey: true }`, `{ key: 'ArrowUp', repeat: true }`, `{ key: 'q', metaKey: true }` and `{ key: 'z', altKey: true }` inserted after the 2nd, 4th, 6th and 8th entries → `peak[1]` > 0 (they neither advanced nor reset). Then with `{ key: 'x' }` inserted after the 8th entry → every `n` is 0 (a plain wrong key resets).
6. Reduced motion: `navigate_page` `http://localhost:5173/?noentry` with the Task 19 RM `initScript` (`START = true`), wait 2 s, KONAMI_SERIES → the first sample already has the plateau count, the count is identical in every sample until about 1500 ms, and 0 afterwards (e jumps 0 → 1, holds 1500 ms, jumps to 0; P7; once the loop idles again a read returns the cleared drawing buffer, which also counts 0).
7. Narrow rail window (3.4.11, Review Focus; Index amendment A11): a fresh page (`isolatedContext: "t20-narrow"`), `emulate` `viewport: "740x700x1"`, `colorScheme: "dark"` (the rail layout: at least 720 px wide and not portrait), `navigate_page` `http://localhost:5173/?noentry`, wait 1 s, then (LIT counts the drawing-buffer pixels that are not field-0 before the code and at 1200 ms, which is inside a Konami's hold):
   ```js
   async () => {
     const c = document.querySelector('canvas[data-field]');
     const gl = c.getContext('webgl2');
     const hex = getComputedStyle(document.documentElement).getPropertyValue('--field-0').trim();
     const f0 = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
     const lit = () => new Promise((resolve) => requestAnimationFrame(() => {
       const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
       gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
       let n = 0;
       for (let i = 0; i < px.length; i += 4) if (Math.abs(px[i] - f0[0]) > 3 || Math.abs(px[i + 1] - f0[1]) > 3 || Math.abs(px[i + 2] - f0[2]) > 3) n += 1;
       resolve(n);
     }));
     const before = await lit();
     for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
     await new Promise((r) => setTimeout(r, 1200));
     const during = await lit();
     return {
       band: matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches,
       fieldW: Math.round(c.getBoundingClientRect().width),
       scrimRight: Math.round(document.querySelector('.scrim').getBoundingClientRect().right),
       before,
       during,
       ratio: Math.round((during / before) * 100) / 100,
     };
   }
   ```
   Expected: `band: false`, `fieldW: 740`, `scrimRight` ≥ 740 (the scrim reaches past the field, so `konamiMaskBox` returns null and `App.konami()` ignores the code); `ratio` between 0.8 and 1.25 (the field keeps flowing undimmed; a Konami running on an empty mask would cut the lit pixels to roughly a third by 1200 ms, through `mask.holdDim` 0.3); `list_console_messages` `types: ["error", "warn"]` → none. Save `take_screenshot` `740x700-dark-konami-skipped.png`. If `scrimRight` is below 740, this viewport has a clear strip after all: record the value and report it, because then the Konami must form `nice.` in that strip (KONAMI_SERIES shows `peak[1]` > 0 there).
8. `list_console_messages` `types: ["error", "warn"]` on every page except the `?nowebgl` one → none.

Write the measured `scrimRight`, `peak` and the series shapes into `task-20-report.md`; stop the dev server and close every page.

- [ ] **Step 9: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/eggs/konami.ts tests/konami.test.ts src/app.ts src/main.ts
git commit -m "feat(eggs): Konami code forms \"nice.\" in the field

createKonami watches document keydowns (Ctrl, Meta, Alt and repeats
ignored; b and a in either case; overlapping prefixes match). App.konami()
measures the scrim's clear edge (or the whole band) at trigger time and
plays gather 900, hold 1500, dissolve 800 with the entry pipeline; under
reduced motion e jumps to 1 and back. Ignored during the entry, another
Konami, or the static fallback (3.4.11).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Keyboard shortcuts and the "?" overlay

**Files:**
- Create: `src/eggs/shortcuts.ts`, `src/ui/overlay.ts`
- Modify: `src/main.ts`
- Test: `tests/shortcuts.test.ts`, `tests/overlay.test.ts`

**Interfaces:**
- Consumes: Task 7 `initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }`, `initEmailCopy(…): { trigger(): Promise<CopyResult>; dispose(): void }`; Task 5 DOM contract (`dialog[data-keys]`, `[data-keys-close]`, `a[data-link]`).
- Produces:
  ```ts
  // src/eggs/shortcuts.ts
  export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';
  export interface KeyLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean; target: EventTarget | null }
  export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null;
  export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void;

  // src/ui/overlay.ts
  export function initOverlay(panel: HTMLDialogElement, doc: Document): { toggle(): void; close(): void; readonly open: boolean; dispose(): void };
  ```
- Produces (`src/main.ts`): `boot()` keeps `const { linkedin } = initLinks(…)` and the `initEmailCopy` handle; after `initTheme` it calls `initOverlay` on `dialog[data-keys]` (when present) and `initShortcuts(doc, run, { linkedin })`, where `run` ignores everything except `'overlay'` and `'close'` while the overlay is open, `'github'` / `'linkedin'` call `win.location.assign` with the matching anchor's `href`, `'email'` calls the email handle's `trigger()`, `'overlay'` toggles and `'close'` closes.
- Plan details: editable targets are `INPUT`, `TEXTAREA`, `SELECT` and any element whose `isContentEditable` is true (this covers `[contenteditable]` and its descendants); `initOverlay` returns focus to the opener on `close` only when the engine has not already done so (3.5.5); `showModal()` throwing (detached dialog) is caught (4.3.1).

- [ ] **Step 1: Write the failing tests**

`tests/shortcuts.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { initShortcuts, shortcutFor, type KeyLike, type ShortcutAction } from '../src/eggs/shortcuts';

const key = (k: string, extra: Partial<KeyLike> = {}): KeyLike => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  target: null,
  ...extra,
});
const ON = { linkedin: true };
const OFF = { linkedin: false };

/** A keydown as Node can build it: an Event carrying the KeyboardEvent fields the module reads. */
function keydown(k: string, mods: Partial<Pick<KeyLike, 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>> = {}): Event {
  return Object.assign(new Event('keydown'), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...mods });
}

describe('shortcutFor (spec 3.5.4, 8.1.15)', () => {
  it('maps g, l, e, ? and Escape', () => {
    expect(shortcutFor(key('g'), ON)).toBe('github');
    expect(shortcutFor(key('l'), ON)).toBe('linkedin');
    expect(shortcutFor(key('e'), ON)).toBe('email');
    expect(shortcutFor(key('?'), ON)).toBe('overlay');
    expect(shortcutFor(key('Escape'), ON)).toBe('close');
  });

  it('maps upper-case G, L and E like lower case (Caps Lock)', () => {
    expect(shortcutFor(key('G'), ON)).toBe('github');
    expect(shortcutFor(key('L'), ON)).toBe('linkedin');
    expect(shortcutFor(key('E'), ON)).toBe('email');
  });

  it('returns null for l while LinkedIn is absent (3.1.12)', () => {
    expect(shortcutFor(key('l'), OFF)).toBeNull();
    expect(shortcutFor(key('L'), OFF)).toBeNull();
    expect(shortcutFor(key('g'), OFF)).toBe('github');
  });

  it('ignores Ctrl, Meta and Alt chords and allows Shift', () => {
    expect(shortcutFor(key('g', { ctrlKey: true }), ON)).toBeNull();
    expect(shortcutFor(key('g', { metaKey: true }), ON)).toBeNull();
    expect(shortcutFor(key('?', { altKey: true }), ON)).toBeNull();
    const shifted = { ...key('?'), shiftKey: true };
    expect(shortcutFor(shifted, ON)).toBe('overlay');
  });

  it('ignores auto-repeat', () => {
    expect(shortcutFor(key('e', { repeat: true }), ON)).toBeNull();
  });

  it('ignores editable targets', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'input']) {
      expect(shortcutFor(key('g', { target: { tagName } as unknown as EventTarget }), ON)).toBeNull();
    }
    const editable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget;
    expect(shortcutFor(key('e', { target: editable }), ON)).toBeNull();
    const link = { tagName: 'A', isContentEditable: false } as unknown as EventTarget;
    expect(shortcutFor(key('e', { target: link }), ON)).toBe('email');
  });

  it('returns null for every other key', () => {
    for (const k of ['x', 'Enter', ' ', 'Tab', '/', 'ArrowUp', 'b', 'a']) expect(shortcutFor(key(k), ON)).toBeNull();
  });
});

describe('initShortcuts (spec 3.5.4)', () => {
  it('runs the mapped action for each document keydown and stops after dispose', () => {
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    const dispose = initShortcuts(doc as unknown as Document, (a) => ran.push(a), OFF);
    doc.dispatchEvent(keydown('g'));
    doc.dispatchEvent(keydown('l'));
    doc.dispatchEvent(keydown('E'));
    doc.dispatchEvent(keydown('?', { ctrlKey: true }));
    doc.dispatchEvent(keydown('Escape'));
    expect(ran).toEqual(['github', 'email', 'close']);
    dispose();
    doc.dispatchEvent(keydown('g'));
    expect(ran).toEqual(['github', 'email', 'close']);
  });

  it('ignores a keydown without a string key (a synthetic event) and never throws', () => {
    expect(shortcutFor(key(undefined as unknown as string), ON)).toBeNull();
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    const dispose = initShortcuts(doc as unknown as Document, (a) => ran.push(a), ON);
    expect(() => doc.dispatchEvent(new Event('keydown'))).not.toThrow();
    doc.dispatchEvent(keydown('g'));
    expect(ran).toEqual(['github']);
    dispose();
  });
});
```

`tests/overlay.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { initShortcuts, type ShortcutAction } from '../src/eggs/shortcuts';
import { initOverlay } from '../src/ui/overlay';

/** A <dialog> as far as the module uses it: open, showModal, close (fires 'close'), the close button. */
class FakeDialog extends EventTarget {
  open = false;
  showModalCalls = 0;
  closeCalls = 0;
  readonly button = new EventTarget();
  readonly inner = new EventTarget();
  showModal(): void {
    this.showModalCalls += 1;
    this.open = true;
  }
  close(): void {
    this.closeCalls += 1;
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }
  querySelector(selector: string): EventTarget | null {
    return selector === '[data-keys-close]' ? this.button : null;
  }
}

function setup() {
  const panel = new FakeDialog();
  const opener = { isConnected: true, focus: vi.fn() };
  const doc = { body: {}, activeElement: opener as unknown };
  const overlay = initOverlay(panel as unknown as HTMLDialogElement, doc as unknown as Document);
  return { panel, opener, doc, overlay };
}

/** A click whose target is `target`, dispatched on the dialog (Node has no DOM tree to bubble through). */
function clickOn(panel: FakeDialog, target: EventTarget): void {
  const ev = new Event('click');
  Object.defineProperty(ev, 'target', { value: target });
  panel.dispatchEvent(ev);
}

describe('initOverlay (spec 3.5.5)', () => {
  it('toggle() calls showModal() when closed and close() when open; open reflects the state', () => {
    const { panel, overlay } = setup();
    expect(overlay.open).toBe(false);
    overlay.toggle();
    expect(panel.showModalCalls).toBe(1);
    expect(overlay.open).toBe(true);
    overlay.toggle();
    expect(panel.closeCalls).toBe(1);
    expect(overlay.open).toBe(false);
  });

  it('closes on a backdrop click (target === dialog) and not on a click inside', () => {
    const { panel, overlay } = setup();
    overlay.toggle();
    clickOn(panel, panel.inner);
    expect(overlay.open).toBe(true);
    clickOn(panel, panel);
    expect(overlay.open).toBe(false);
  });

  it('closes from the close button', () => {
    const { panel, overlay } = setup();
    overlay.toggle();
    panel.button.dispatchEvent(new Event('click'));
    expect(overlay.open).toBe(false);
  });

  it('close() on a closed overlay does nothing', () => {
    const { panel, overlay } = setup();
    overlay.close();
    expect(panel.closeCalls).toBe(0);
  });

  it('returns focus to the opener when the dialog closes', () => {
    const { panel, doc, overlay, opener } = setup();
    overlay.toggle();
    doc.activeElement = panel.button; // showModal() moved focus to "close"
    overlay.close();
    expect(opener.focus).toHaveBeenCalledTimes(1);
  });

  it('leaves focus alone when the engine already returned it to the opener', () => {
    const { overlay, opener } = setup();
    overlay.toggle();
    overlay.close();
    expect(opener.focus).not.toHaveBeenCalled();
  });

  it('never throws when showModal() throws', () => {
    const { panel, overlay } = setup();
    panel.showModal = () => {
      throw new Error('InvalidStateError');
    };
    expect(() => overlay.toggle()).not.toThrow();
    expect(overlay.open).toBe(false);
  });

  it('dispose() removes the listeners', () => {
    const { panel, overlay } = setup();
    overlay.toggle();
    overlay.dispose();
    panel.button.dispatchEvent(new Event('click'));
    clickOn(panel, panel);
    expect(overlay.open).toBe(true);
  });

  it('leaves the shortcuts working when main.ts finds no panel (overlay null)', () => {
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    initShortcuts(doc as unknown as Document, (a) => ran.push(a), { linkedin: false });
    for (const k of ['g', '?', 'Escape']) {
      doc.dispatchEvent(Object.assign(new Event('keydown'), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false }));
    }
    expect(ran).toEqual(['github', 'overlay', 'close']);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/shortcuts.test.ts tests/overlay.test.ts`
Expected: FAIL, both suites with `Error: Cannot find module '../src/eggs/shortcuts' imported from …` (and `'../src/ui/overlay'` once the first module exists), `Test Files  2 failed (2)`, `Tests  no tests`.

- [ ] **Step 3: Write the modules**

`src/eggs/shortcuts.ts`:
```ts
/** Keyboard shortcuts (spec 3.5.4, R12a): g GitHub, l LinkedIn, e copy email, ? overlay, Escape close. */
export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  target: EventTarget | null;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** input, textarea, select and [contenteditable] targets keep their keys (3.5.4). */
function isEditable(target: EventTarget | null): boolean {
  const el = target as { tagName?: unknown; isContentEditable?: unknown } | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return EDITABLE_TAGS.has(el.tagName.toUpperCase()) || el.isContentEditable === true;
}

/**
 * Maps one keydown to an action. Ctrl, Meta and Alt chords, auto-repeat and editable targets map to
 * null; Shift is allowed (`?` needs it on US layouts, Caps Lock gives `G`). `?` is matched on
 * event.key, so any layout works. `l` maps only while the LinkedIn link exists (3.1.12).
 */
export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isEditable(e.target)) return null;
  switch (e.key) {
    case 'g':
    case 'G':
      return 'github';
    case 'l':
    case 'L':
      return opts.linkedin ? 'linkedin' : null;
    case 'e':
    case 'E':
      return 'email';
    case '?':
      return 'overlay';
    case 'Escape':
      return 'close';
    default:
      return null;
  }
}

/** One keydown listener on the document (3.5.4). Returns the function that removes it. */
export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    const action = shortcutFor(e, opts);
    if (action !== null) run(action);
  };
  doc.addEventListener('keydown', onKeyDown);
  return () => doc.removeEventListener('keydown', onKeyDown);
}
```

`src/ui/overlay.ts`:
```ts
/**
 * The "?" shortcuts overlay (spec 3.5.5): the native modal <dialog data-keys>. showModal() makes the
 * page inert, moves focus to the close button and closes natively on Escape; this module adds the
 * close button, the backdrop click for engines without `closedby`, and focus return to the opener.
 */
export function initOverlay(
  panel: HTMLDialogElement,
  doc: Document,
): { toggle(): void; close(): void; readonly open: boolean; dispose(): void } {
  const closeButton = panel.querySelector<HTMLButtonElement>('[data-keys-close]');
  let opener: HTMLElement | null = null;

  const close = (): void => {
    if (!panel.open) return;
    try {
      panel.close();
    } catch {
      // a detached dialog cannot close; nothing to undo
    }
  };
  const onCloseClick = (): void => close();
  const onPanelClick = (e: Event): void => {
    if (e.target === panel) close(); // the backdrop reports the dialog itself as the target
  };
  const onClosed = (): void => {
    const back = opener;
    opener = null;
    if (back && back.isConnected && doc.activeElement !== back) back.focus();
  };

  closeButton?.addEventListener('click', onCloseClick);
  panel.addEventListener('click', onPanelClick);
  panel.addEventListener('close', onClosed);

  return {
    toggle(): void {
      if (panel.open) {
        close();
        return;
      }
      const active = doc.activeElement;
      opener = active && active !== doc.body && typeof (active as HTMLElement).focus === 'function' ? (active as HTMLElement) : null;
      try {
        panel.showModal();
      } catch {
        opener = null; // not connected, or already open as a non-modal dialog
      }
    },
    close,
    get open(): boolean {
      return panel.open;
    },
    dispose(): void {
      closeButton?.removeEventListener('click', onCloseClick);
      panel.removeEventListener('click', onPanelClick);
      panel.removeEventListener('close', onClosed);
    },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/shortcuts.test.ts tests/overlay.test.ts`
Expected: PASS, `Test Files  2 passed (2)`, `Tests  18 passed (18)` (9 + 9).

- [ ] **Step 5: Wire them in `src/main.ts`**

Every hunk below is an exact before/after pair in `src/main.ts` as Tasks 15, 16, 18 and 20 left it; apply them in order.

`src/main.ts`, before (Task 20 imports):
```ts
import { createKonami } from './eggs/konami';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
After:
```ts
import { createKonami } from './eggs/konami';
import { initShortcuts } from './eggs/shortcuts';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
`src/main.ts`, before (Task 8 imports):
```ts
import { initLinks } from './ui/links';
```
After:
```ts
import { initLinks } from './ui/links';
import { initOverlay } from './ui/overlay';
```
Keep the LinkedIn presence. `src/main.ts`, before (Tasks 8 and 15):
```ts
  initLinks(CONTENT.links.linkedin, doc);
```
After:
```ts
  const { linkedin } = initLinks(CONTENT.links.linkedin, doc);
```
Keep the email handle (the anchor variable becomes `emailLink`, the handle `email`). `src/main.ts`, before (Task 15):
```ts
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') });
```
After:
```ts
  const emailLink = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  const email = emailLink
    ? initEmailCopy(emailLink, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') })
    : null;
```
The overlay and the shortcuts go directly after the `initTheme({ … })` statement and before the Task 20 Konami block. `src/main.ts`, before (Tasks 15 and 20):
```ts
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```
After:
```ts
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const keysPanel = doc.querySelector<HTMLDialogElement>('dialog[data-keys]');
  const overlay = keysPanel ? initOverlay(keysPanel, doc) : null; // 3.5.5; shortcuts work without it (4.3.1)
  initShortcuts(
    doc,
    (action) => {
      if (overlay?.open && action !== 'overlay' && action !== 'close') return; // 3.5.4: only ? and Escape while open
      switch (action) {
        case 'github':
        case 'linkedin': {
          const href = doc.querySelector<HTMLAnchorElement>(`a[data-link="${action}"]`)?.href;
          if (href) win.location.assign(href); // 11.28: same tab, like a click
          break;
        }
        case 'email':
          email?.trigger().catch(() => undefined); // 3.5.3: same copy, live region and mailto fallback
          break;
        case 'overlay':
          overlay?.toggle();
          break;
        case 'close':
          overlay?.close();
          break;
      }
    },
    { linkedin },
  );
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```

- [ ] **Step 6: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  31 passed (31)`, `Tests  292 passed (292)`: Task 20's counts plus these 2 files and 18 tests), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`).

- [ ] **Step 7: Browser evidence (8.2.11)**

Start the dev server and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-21`. `Location.assign` is unforgeable in Chrome (own, non-writable, non-configurable), so the evidence observes navigations through the Navigation API instead, cancelling them so the page stays (NAV `initScript`; verified in Chrome while writing this plan: `location.assign('https://github.com/parsanaji')` reports one cancelable `push` navigate event and the page stays):
```js
(() => {
  window.__navs = [];
  navigation.addEventListener('navigate', (e) => {
    window.__navs.push(e.destination.url);
    if (e.cancelable) e.preventDefault();
  });
})();
```
`new_page` (`isolatedContext: "t21"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/?noentry` with NAV. Then, reading state with `evaluate_script` after each key:
1. `press_key` `g` → `window.__navs` = `["https://github.com/parsanaji"]` and `location.pathname` = `/`.
2. `press_key` `e`, wait 150 ms → `document.querySelector('a[data-email]').hasAttribute('data-copied')` = `true` and `document.querySelector('[data-live]').textContent` = `Email address copied.`; `take_screenshot` `1440x900-dark-copied.png` (`copied` in place of `say hi`). If the clipboard refused, `__navs` gains `mailto:info@parsanaji.com` instead; record which.
3. Reload (NAV again), `press_key` `Tab` (focus on `github`), `press_key` `?` → `document.querySelector('dialog[data-keys]').open` = `true` and `document.activeElement.hasAttribute('data-keys-close')` = `true`; `take_screenshot` `1440x900-dark-overlay.png`, then with `colorScheme: "light"` `1440x900-light-overlay.png`.
4. While open: `press_key` `g` and `e` → `__navs` stays `[]` and `data-copied` stays absent (3.5.4).
5. `press_key` `Escape` → `open` = `false` and `document.activeElement.getAttribute('data-link')` = `github` (focus returned).
6. `press_key` `?` twice → open, then closed (toggle). Open it once more and `evaluate_script` `() => { const d = document.querySelector('dialog[data-keys]'); d.dispatchEvent(new MouseEvent('click', { bubbles: true })); return d.open; }` → `false` (backdrop rule).
7. Editable target: `evaluate_script` `() => { const i = document.createElement('input'); i.id = 't21-probe'; document.body.append(i); i.focus(); return document.activeElement === i; }` → `true`; `press_key` `g` → `__navs` unchanged; remove it with `() => document.getElementById('t21-probe').remove()`.
8. Tab order: reload, `press_key` `Tab` three times, recording `document.activeElement` after each with `() => document.activeElement.getAttribute('data-link') ?? (document.activeElement.hasAttribute('data-email') ? 'email' : document.activeElement.hasAttribute('data-theme-toggle') ? 'toggle' : document.activeElement.tagName)` → `github`, `email`, `toggle` (3.5.11, unchanged).
9. `list_console_messages` `types: ["error", "warn"]` → none, in both looks.

Write every reading into `task-21-report.md`; stop the dev server and close every page.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/eggs/shortcuts.ts src/ui/overlay.ts tests/shortcuts.test.ts tests/overlay.test.ts src/main.ts
git commit -m "feat(eggs): g/l/e/?/Esc shortcuts and the shortcuts overlay

One document keydown listener maps g, l (only with LinkedIn), e, ? and
Escape, ignoring Ctrl/Meta/Alt chords, repeats and editable targets; while
the native modal dialog is open only ? and Escape act. The overlay adds
the close button, the backdrop click and focus return (3.5.4, 3.5.5).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: Name scramble and console line

**Files:**
- Create: `src/eggs/scramble.ts`, `src/eggs/greeting.ts`
- Modify: `src/main.ts`
- Test: `tests/scramble.test.ts`, `tests/greeting.test.ts`

**Interfaces:**
- Consumes: Task 1 `mulberry32(seed: number): () => number`, `seedFromLocation(search: string, fallback?: () => number): number`; Task 5 `CONTENT`; Task 9 `params.scramble` (`DEFAULT_FIELD.scramble`).
- Produces:
  ```ts
  // src/eggs/scramble.ts
  export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';
  export function scrambleText(target: string, tMs: number, durMs: number, stepMs: number, rand: (step: number, i: number) => number): string;
  export function initScramble(el: HTMLElement, text: string, opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean }): () => void;

  // src/eggs/greeting.ts
  export function greet(log?: (...args: unknown[]) => void, email?: string): void; // exactly the call in 3.5.7
  ```
- Produces (`src/main.ts`, final 4.7.1 order): `greet()` is the first statement of `boot()`; after `initShortcuts`, `initScramble([data-name], CONTENT.name, { durMs: params.scramble.durMs, stepMs: params.scramble.stepMs, seed: seedFromLocation(win.location.search), reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches })`, then the Konami listener of Task 20, then `reduced`.
- Plan details: run k of a page uses `mulberry32(seed + k)` and draws a 15 × 10 table of glyph choices up front (`rand(step, i)` reads it), so a seed gives the same frames every time; frame k shows `scrambleText(text, k × stepMs, …)` and is scheduled at click time + k × stepMs, so timer lateness never accumulates; the frame at k = 15 (600 ms) writes the exact text and removes `aria-label`. Golden frames for seed 42 (computed by running this code): t = 0 `rg#wM Tt%i`, 40 `S&2WO ysAi`, 80 `9DrCT N5mB`, 200 `Pwxy= ?f?K`, 400 `Parsa QeLv`, 600 `Parsa Naji`.

- [ ] **Step 1: Write the failing tests**

`tests/scramble.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import { SCRAMBLE_GLYPHS, initScramble, scrambleText } from '../src/eggs/scramble';

const NAME = 'Parsa Naji';
const DUR = 600;
const STEP = 40;
/** scrambleText at t = 0, 40, 80, 200 and 400 ms for seed 42 (computed by running this code). */
const GOLDEN_42: readonly string[] = ['rg#wM Tt%i', 'S&2WO ysAi', '9DrCT N5mB', 'Pwxy= ?f?K', 'Parsa QeLv'];

/** rand from a seeded mulberry32 table, the way initScramble builds it. */
function seededRand(seed: number): (step: number, i: number) => number {
  const next = mulberry32(seed);
  const table = Array.from({ length: 15 }, () => Array.from({ length: NAME.length }, () => next()));
  return (step, i) => table[step]?.[i] ?? 0;
}

/** The h1 as far as the module uses it. */
class FakeName extends EventTarget {
  textContent: string = NAME;
  readonly attrs = new Map<string, string>();
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }
  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }
  click(): void {
    this.dispatchEvent(new Event('click'));
  }
}

describe('SCRAMBLE_GLYPHS (spec 3.5.6)', () => {
  it('is letters, digits and #%&*+=?@<>/, all printable ASCII inside the font subset', () => {
    expect(SCRAMBLE_GLYPHS).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/');
    expect(new Set(SCRAMBLE_GLYPHS).size).toBe(SCRAMBLE_GLYPHS.length);
    for (const ch of SCRAMBLE_GLYPHS) {
      const code = ch.charCodeAt(0);
      expect(code).toBeGreaterThanOrEqual(0x21);
      expect(code).toBeLessThanOrEqual(0x7e);
    }
  });
});

describe('scrambleText (spec 3.5.6, 8.1.15)', () => {
  const rand = seededRand(42);

  it('ends on the exact target', () => {
    expect(scrambleText(NAME, DUR, DUR, STEP, rand)).toBe(NAME);
    expect(scrambleText(NAME, 5000, DUR, STEP, rand)).toBe(NAME);
  });

  it('keeps the space and the length at every step', () => {
    for (let t = 0; t <= DUR; t += STEP) {
      const s = scrambleText(NAME, t, DUR, STEP, rand);
      expect(s).toHaveLength(NAME.length);
      expect(s[5]).toBe(' ');
    }
  });

  it('draws every unsettled glyph from SCRAMBLE_GLYPHS', () => {
    for (let t = 0; t < DUR; t += STEP) {
      const s = scrambleText(NAME, t, DUR, STEP, rand);
      for (let i = 0; i < s.length; i++) if (i !== 5 && s[i] !== NAME[i]) expect(SCRAMBLE_GLYPHS).toContain(s[i]);
    }
  });

  it('settles letter i by durMs × (0.3 + 0.7 × i / (n − 1))', () => {
    const slash = (): number => 0.9999; // always "/", which "Parsa Naji" does not contain
    for (let i = 0; i < NAME.length; i++) {
      if (i === 5) continue;
      const settle = DUR * (0.3 + (0.7 * i) / (NAME.length - 1));
      expect(scrambleText(NAME, settle, DUR, STEP, slash)[i]).toBe(NAME[i]);
      expect(scrambleText(NAME, settle - 1, DUR, STEP, slash)[i]).toBe('/');
    }
  });

  it('is deterministic for a seed', () => {
    const a = seededRand(7);
    const b = seededRand(7);
    const c = seededRand(8);
    const frames = (r: (s: number, i: number) => number) => Array.from({ length: 15 }, (_, k) => scrambleText(NAME, k * STEP, DUR, STEP, r));
    expect(frames(a)).toEqual(frames(b));
    expect(frames(a)).not.toEqual(frames(c));
  });

  it('matches the golden first frames for seed 42', () => {
    expect([0, 40, 80, 200, 400].map((t) => scrambleText(NAME, t, DUR, STEP, rand))).toEqual(GOLDEN_42);
  });
});

describe('initScramble (spec 3.5.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const opts = (reduced = false) => ({ durMs: DUR, stepMs: STEP, seed: 42, reduced: () => reduced });

  it('scrambles on click, carries aria-label while running, and settles at 600 ms', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    expect(el.attrs.get('aria-label')).toBe(NAME);
    expect(el.textContent).toBe(GOLDEN_42[0]);
    vi.advanceTimersByTime(40);
    expect(el.textContent).toBe(GOLDEN_42[1]);
    vi.advanceTimersByTime(519);
    expect(el.textContent).not.toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(true);
    vi.advanceTimersByTime(41);
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
  });

  it('ignores a click during a running scramble', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    vi.advanceTimersByTime(300);
    el.click();
    vi.advanceTimersByTime(300);
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
  });

  it('uses a new seed for the next run', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    const first = el.textContent;
    vi.advanceTimersByTime(600);
    el.click();
    expect(el.textContent).not.toBe(first);
    expect(el.textContent).toBe(scrambleText(NAME, 0, DUR, STEP, seededRand(43)));
  });

  it('does nothing under reduced motion', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts(true));
    el.click();
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dispose() stops a running scramble on the exact text and removes the listener', () => {
    const el = new FakeName();
    const dispose = initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    dispose();
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    el.click();
    expect(el.textContent).toBe(NAME);
  });
});
```

`tests/greeting.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { greet } from '../src/eggs/greeting';

describe('greet (spec 3.5.7, 8.1.15)', () => {
  it('logs exactly one styled line with the email', () => {
    const log = vi.fn();
    greet(log);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]).toEqual([
      '%cParsa Naji — say hi: info@parsanaji.com',
      'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0',
    ]);
  });

  it('defaults to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    greet();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('%cParsa Naji — say hi: info@parsanaji.com');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/scramble.test.ts tests/greeting.test.ts`
Expected: FAIL with `Error: Cannot find module '../src/eggs/scramble' imported from …` and `Error: Cannot find module '../src/eggs/greeting' imported from …`, `Test Files  2 failed (2)`, `Tests  no tests`.

- [ ] **Step 3: Write the modules**

`src/eggs/scramble.ts`:
```ts
import { mulberry32 } from '../core/prng';

/** Printable ASCII letters, digits and #%&*+=?@<>/: every glyph is inside the font subset (3.5.6, 3.5.13). */
export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';

/**
 * The text at scramble time tMs (3.5.6): letter i (0-based, n letters) settles at
 * durMs × (0.3 + 0.7 × i / (n − 1)); before that it shows the glyph rand(step, i) picks for the
 * current stepMs step. Spaces never change, so the mono advance keeps the layout still.
 */
export function scrambleText(
  target: string,
  tMs: number,
  durMs: number,
  stepMs: number,
  rand: (step: number, i: number) => number,
): string {
  const n = target.length;
  const step = stepMs > 0 ? Math.floor(tMs / stepMs) : 0;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = target[i];
    const settleMs = n > 1 ? durMs * (0.3 + (0.7 * i) / (n - 1)) : durMs;
    if (ch === ' ' || tMs >= settleMs) {
      out += ch;
      continue;
    }
    const r = rand(step, i);
    const k = Math.min(SCRAMBLE_GLYPHS.length - 1, Math.max(0, Math.floor(r * SCRAMBLE_GLYPHS.length)));
    out += SCRAMBLE_GLYPHS[k];
  }
  return out;
}

/**
 * A click on the name scrambles it and settles back over durMs, one frame every stepMs (3.5.6).
 * Glyph choices come from mulberry32, seeded per run from `seed`. A click during a run is ignored;
 * reduced() true disables it. While running the element carries aria-label = text. Returns dispose.
 */
export function initScramble(
  el: HTMLElement,
  text: string,
  opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean },
): () => void {
  const steps = opts.stepMs > 0 ? Math.ceil(opts.durMs / opts.stepMs) : 0;
  let runs = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (): void => {
    timer = null;
    el.textContent = text;
    el.removeAttribute('aria-label');
  };

  const onClick = (): void => {
    if (timer !== null || opts.reduced()) return;
    const next = mulberry32((opts.seed + runs) >>> 0);
    runs += 1;
    const table = Array.from({ length: steps }, () => Array.from({ length: text.length }, () => next()));
    const rand = (step: number, i: number): number => table[step]?.[i] ?? 0;
    const t0 = Date.now();
    let step = 0;
    el.setAttribute('aria-label', text);
    const frame = (): void => {
      if (step >= steps) {
        finish();
        return;
      }
      el.textContent = scrambleText(text, step * opts.stepMs, opts.durMs, opts.stepMs, rand);
      step += 1;
      // anchored to the click time, so timer lateness never accumulates past durMs
      timer = setTimeout(frame, Math.max(0, t0 + step * opts.stepMs - Date.now()));
    };
    frame();
  };

  el.addEventListener('click', onClick);
  return () => {
    el.removeEventListener('click', onClick);
    if (timer !== null) {
      clearTimeout(timer);
      finish();
    }
  };
}
```

`src/eggs/greeting.ts`:
```ts
import { CONTENT } from '../content';

const STYLE = 'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0';

/** 3.5.7 (R12d): the one console line, and the only production log. Defaults are read at call time. */
export function greet(log: (...args: unknown[]) => void = console.log, email: string = CONTENT.email): void {
  log(`%cParsa Naji — say hi: ${email}`, STYLE);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/scramble.test.ts tests/greeting.test.ts`
Expected: PASS, `Test Files  2 passed (2)`, `Tests  14 passed (14)` (12 + 2).

- [ ] **Step 5: Wire them in `src/main.ts` (final 4.7.1 order)**

Every hunk below is an exact before/after pair in `src/main.ts` as Tasks 15–21 left it; apply them in order.

`src/main.ts`, before (Task 15 and 20 imports):
```ts
import { seedFromLocation } from './core/prng';
import { createKonami } from './eggs/konami';
```
After:
```ts
import { seedFromLocation } from './core/prng';
import { greet } from './eggs/greeting';
import { createKonami } from './eggs/konami';
import { initScramble } from './eggs/scramble';
```
The greeting is the first statement of `boot()`. `src/main.ts`, before (Task 15):
```ts
async function boot(): Promise<void> {
  const doc = document;
```
After:
```ts
async function boot(): Promise<void> {
  greet(); // 3.5.7, 4.7.1
  const doc = document;
```
The scramble goes directly after the `initShortcuts(…);` statement of Task 21 and before the Task 20 Konami block. `src/main.ts`, before (Tasks 20 and 21):
```ts
    { linkedin },
  );
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```
After:
```ts
    { linkedin },
  );
  const nameEl = doc.querySelector<HTMLElement>('[data-name]');
  if (nameEl) {
    initScramble(nameEl, CONTENT.name, {
      durMs: params.scramble.durMs,
      stepMs: params.scramble.stepMs,
      seed: seedFromLocation(win.location.search),
      reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches, // 3.6.4: read per click
    });
  }
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```
After this step `src/main.ts` is exactly the file below (Tasks 8, 15, 16, 18, 20, 21 and 22). Save it to a scratch path and compare: `diff <(tr -d '\r' < src/main.ts) <scratch copy>` prints nothing; any difference is a wiring bug to fix before the gate.
```ts
// Boot orchestration (spec 4.7): the rail's DOM modules and the theme, then the field gate (4.7.3) and the App (4.7.4).
import { App } from './app';
import { CONTENT } from './content';
import { seedFromLocation } from './core/prng';
import { greet } from './eggs/greeting';
import { createKonami } from './eggs/konami';
import { initScramble } from './eggs/scramble';
import { initShortcuts } from './eggs/shortcuts';
import { DEFAULT_FIELD, cloneField } from './field/params';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';
import { initOverlay } from './ui/overlay';

/** Spec 4.12.1: true on the dev server and preview builds, false (and folded away) in production. */
const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';

/** One console.warn per failure on the dev server; production logs nothing at warn or error level (4.7.6). */
function devWarn(message: string): void {
  if (import.meta.env.DEV) console.warn(`[pn] ${message}`);
}

/** localStorage, or null where reading it throws (blocked storage counts as "system", 3.5.10). */
function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** Spec 3.6.2: no field; the rail shows at once. One DEV warning per failure, nothing in production. */
function applyFallback(doc: Document, reason: string): void {
  devWarn(`static fallback: ${reason}`);
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/**
 * 4.7.2: when theme-boot.js set data-entry="run" and main.ts runs before 4000 ms, switch to "wait"
 * (cancelling the CSS failsafe) and plan the entry; otherwise the failsafe already showed the rail,
 * so remove data-entry and plan none (11.7).
 */
function takeEntryControl(doc: Document, nowMs: number): boolean {
  const html = doc.documentElement;
  if (html.getAttribute('data-entry') === 'run' && nowMs < 4000) {
    html.setAttribute('data-entry', 'wait');
    return true;
  }
  html.removeAttribute('data-entry');
  return false;
}

async function boot(): Promise<void> {
  greet(); // 3.5.7, 4.7.1
  const doc = document;
  const win = window;
  const query = new URLSearchParams(win.location.search);
  const params = cloneField(DEFAULT_FIELD);
  let app: App | null = null;
  const { linkedin } = initLinks(CONTENT.links.linkedin, doc);
  const emailLink = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  const email = emailLink
    ? initEmailCopy(emailLink, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') })
    : null;
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  const theme = initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const keysPanel = doc.querySelector<HTMLDialogElement>('dialog[data-keys]');
  const overlay = keysPanel ? initOverlay(keysPanel, doc) : null; // 3.5.5; shortcuts work without it (4.3.1)
  initShortcuts(
    doc,
    (action) => {
      if (overlay?.open && action !== 'overlay' && action !== 'close') return; // 3.5.4: only ? and Escape while open
      switch (action) {
        case 'github':
        case 'linkedin': {
          const href = doc.querySelector<HTMLAnchorElement>(`a[data-link="${action}"]`)?.href;
          if (href) win.location.assign(href); // 11.28: same tab, like a click
          break;
        }
        case 'email':
          email?.trigger().catch(() => undefined); // 3.5.3: same copy, live region and mailto fallback
          break;
        case 'overlay':
          overlay?.toggle();
          break;
        case 'close':
          overlay?.close();
          break;
      }
    },
    { linkedin },
  );
  const nameEl = doc.querySelector<HTMLElement>('[data-name]');
  if (nameEl) {
    initScramble(nameEl, CONTENT.name, {
      durMs: params.scramble.durMs,
      stepMs: params.scramble.stepMs,
      seed: seedFromLocation(win.location.search),
      reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches, // 3.6.4: read per click
    });
  }
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
  doc.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; // these neither advance nor reset the sequence
    konami.push(e.key);
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entry = takeEntryControl(doc, win.performance.now());

  // 4.7.3 field gate
  if (query.has('nowebgl')) {
    applyFallback(doc, 'nowebgl');
    return;
  }
  if (win.matchMedia('(forced-colors: active)').matches) {
    applyFallback(doc, 'forced-colors');
    return;
  }
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  let mountTweaks: ((a: App) => void) | null = null;
  if (PN_DEBUG && query.has('debug')) {
    const { prepareTweaks } = await import('./tweaks');
    mountTweaks = prepareTweaks(params);
  }
  app = App.start({
    canvas,
    params,
    reduced,
    seed: seedFromLocation(win.location.search),
    colors: theme.colors,
    entry,
    rail: doc.querySelector<HTMLElement>('[data-rail]'),
    scrim: doc.querySelector<HTMLElement>('.scrim'),
    doc,
    win,
  });
  if (!app) {
    applyFallback(doc, 'no-webgl2');
    return;
  }
  app.onFallback(() => {
    app = null;
    applyFallback(doc, 'field');
  });
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
  if (app) mountTweaks?.(app);
}

boot().catch((error: unknown) => {
  devWarn(String(error));
  applyFallback(document, 'boot');
});
```

- [ ] **Step 6: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  33 passed (33)`, `Tests  306 passed (306)`: Task 21's counts plus these 2 files and 14 tests; paste the real summary), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`), then `grep -c "Parsa Naji — say hi" dist/assets/*.js` (the greeting is in the bundle: the entry chunk reports 1) and `grep -c "__pn\|parsanaji tweaks" dist/assets/*.js` (`:0` everywhere).

- [ ] **Step 7: Browser evidence (8.2.11, 8.2.6 scramble part)**

Start the dev server and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-22`. SCRAMBLE (clicks the name, clicks again at 300 ms, and records every text and `aria-label` change with its time and the h1 width):
```js
async () => {
  const h1 = document.querySelector('[data-name]');
  const range = document.createRange();
  const inkWidth = () => {
    range.selectNodeContents(h1);
    return Math.round(range.getBoundingClientRect().width * 100) / 100; // the text's own box, not the block's
  };
  const frames = [];
  const t0 = performance.now();
  const mo = new MutationObserver(() => frames.push({ dt: Math.round(performance.now() - t0), text: h1.textContent, label: h1.getAttribute('aria-label'), w: inkWidth() }));
  mo.observe(h1, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
  h1.click();
  await new Promise((r) => setTimeout(r, 300));
  h1.click();
  await new Promise((r) => setTimeout(r, 500));
  mo.disconnect();
  const settled = frames.find((f) => f.text === 'Parsa Naji' && f.label === null);
  return {
    count: frames.length,
    first: frames[0],
    settledAt: settled ? settled.dt : null,
    final: { text: h1.textContent, label: h1.getAttribute('aria-label') },
    lengths: [...new Set(frames.map((f) => f.text.length))],
    widths: [...new Set(frames.map((f) => f.w))],
    spaces: frames.every((f) => f.text[5] === ' '),
  };
}
```
1. `new_page` (`isolatedContext: "t22"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/?noentry&seed=42`, wait 1 s, run SCRAMBLE. Expected: `first.text` = `rg#wM Tt%i` and `first.label` = `Parsa Naji` (seed 42, run 0); `settledAt` between 600 and 616 (one frame of timer slack; the second click at 300 ms was ignored, otherwise it would settle near 900); `final` = `{ text: 'Parsa Naji', label: null }`; `lengths` = `[10]`; `widths` has one value (mono advances, zero layout shift); `spaces` = `true`; `count` 16. Click once more by `evaluate_script` `() => { document.querySelector('[data-name]').click(); return true; }` and `take_screenshot` at once → `1440x900-dark-scramble.png`.
2. Reduced motion: `navigate_page` `http://localhost:5173/?seed=42` with the Task 19 RM `initScript` (`START = true`), wait 1 s, SCRAMBLE → `count` 0 and `final.text` = `Parsa Naji` (3.6.4: no scramble).
3. Console on the dev server: a fresh page (`isolatedContext: "t22-dev"`) at `/`, wait 4 s, `list_console_messages` with `types: ["log", "info", "warn", "error"]` → exactly one message, the greeting `Parsa Naji — say hi: info@parsanaji.com` (Vite's own `[vite] connecting…` lines are `debug` messages and are excluded).
4. Production build: stop the dev server, run `npm run build` (with `VITE_PN_DEBUG` unset) and start `npm run preview` with `run_in_background: true` (`http://localhost:4173/`). For each of `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` in `dark` and `light`, a fresh page (`isolatedContext` `t22-p1` … `t22-p6`), `emulate`, reload, wait 4 s, `list_console_messages` (all types) → exactly one `log` message, the greeting, and nothing at warning or error level (3.5.7, 6.1.14). Stop the preview server: stop its background Bash task, then in PowerShell `Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`; close every page.

Write the readings into `task-22-report.md`.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/eggs/scramble.ts src/eggs/greeting.ts tests/scramble.test.ts tests/greeting.test.ts src/main.ts
git commit -m "feat(eggs): name scramble and the console greeting

A click on the name scrambles it through subset-safe glyphs and settles
letter by letter over 600 ms (seeded mulberry32, aria-label while it runs,
ignored while running and under reduced motion). boot() starts with the one
styled console line, the only production log (3.5.6, 3.5.7, 4.7.1).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Push and watch the slice-3 deploy (7.2.1)**

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
cd /c/Users/parsa/parsanaji.com
git push
RUN_ID=$(gh run list --branch resume-screen --commit "$(git rev-parse HEAD)" --limit 1 --json databaseId --jq '.[0].databaseId')
echo "run: $RUN_ID"
gh run watch "$RUN_ID" --exit-status
```
`echo` prints the run id; if it is empty the run has not registered yet, so run the `RUN_ID=…` line again a few seconds later before `gh run watch`. Expected: `gh run watch` exits 0 and the run (workflow `deploy`, branch `resume-screen`) completes with `success`: `npm test`, `npm run build` with `VITE_PN_DEBUG=1`, and the Pages deploy all green. A red run stops the task: fix, commit, push again.

- [ ] **Step 10: Preview checks (slice close, 8.3)**

On `https://resume-screen.parsanaji-com.pages.dev/` (a preview build: PN_DEBUG is true, so `__pn` exists; CSP applies here):
1. Console: six fresh pages (`isolatedContext` `t22-v1` … `t22-v6`) at `1440x900x1`, `1280x720x1` and `390x844x3,mobile,touch` in `dark` and `light`; each `emulate`, reload, wait 4 s, `list_console_messages` (all types) → exactly one `log` message (the greeting) and zero `warn` / `error` messages (no CSP violations).
2. Entry spot check: at 1440×900 dark, `navigate_page` with the Task 18 PIN `initScript` at `T = 1400`, wait 2 s, `evaluate_script` `() => ({ entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready') })` → `{ entry: 'wait', ready: true }`; `take_screenshot` `preview-1440x900-dark-hold.png`; then `() => window.__pn.setTime(null)`, wait 3 s → `entry: null`.
3. Eggs spot check: `/?noentry` at 1440×900 dark: the ten Konami keys with `press_key`, wait 1200 ms, `take_screenshot` `preview-1440x900-dark-konami.png`; `press_key` `?` → the overlay opens, `Escape` closes it.
4. Screenshots of the resting page (wait 4 s after load): `preview-1440x900-dark.png`, `preview-1440x900-light.png`, `preview-1280x720-dark.png`, `preview-1280x720-light.png`, `preview-390x844-dark.png`, `preview-390x844-light.png`.

Close every page. Add the run id, the preview console results and the screenshot list to `task-22-report.md`. The controller then appends the slice-3 ledger line, updates the vault note and the memory file, and compacts before slice 4 (Execution Notes).
