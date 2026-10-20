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
