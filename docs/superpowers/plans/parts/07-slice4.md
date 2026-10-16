## Slice 4 — Morph and resilience

### Task 19: Morph state machine

**Files:**
- Create: `src/engine/morph.ts`
- Test: `tests/morph.test.ts`

**Interfaces:**
- Consumes: `PHASE`, `PhaseId`, `MorphTimings` (Task 10); `clampDt` (Task 9, tests only).
- Produces: `type MorphEvent = 'entryComplete' | 'autoTease' | 'cycleComplete'`; `interface MorphSnapshot { phase; tMs; durMs; staggerMs; showingAlt }`; `class MorphMachine { constructor(timings, reduced = false); setTimings(t); acceptsInput; requestCycle(): boolean; pointerActivity(); tick(dtMs): MorphEvent[]; snapshot(): MorphSnapshot }`.

- [ ] **Step 1: Write the failing tests** (`tests/morph.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/engine/defaults';
import { MorphMachine, type MorphEvent } from '../src/engine/morph';
import { clampDt } from '../src/engine/time';
import { PHASE } from '../src/engine/types';

const T = DEFAULTS.morph;

/** Tick in 16 ms frames (last frame shorter) and collect events. */
const advance = (m: MorphMachine, ms: number, step = 16): MorphEvent[] => {
  const events: MorphEvent[] = [];
  let left = ms;
  while (left > 1e-9) {
    const d = Math.min(step, left);
    events.push(...m.tick(d));
    left -= d;
  }
  return events;
};

describe('MorphMachine', () => {
  it('runs the entry for entryMs + stagger, then idles and reports entryComplete once', () => {
    const m = new MorphMachine(T);
    expect(m.snapshot().phase).toBe(PHASE.ENTRY);
    expect(m.acceptsInput).toBe(false);
    expect(advance(m, 1999)).not.toContain('entryComplete');
    expect(m.snapshot().phase).toBe(PHASE.ENTRY);
    expect(advance(m, 2)).toContain('entryComplete');
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
    expect(advance(m, 1000)).not.toContain('entryComplete');
  });

  it('ignores requests during entry and mid-cycle, accepts them in idle', () => {
    const m = new MorphMachine(T);
    expect(m.requestCycle()).toBe(false);
    advance(m, 2000);
    expect(m.requestCycle()).toBe(true);
    expect(m.snapshot().phase).toBe(PHASE.SCRAMBLE_OUT);
    expect(m.requestCycle()).toBe(false);
  });

  it('walks the cycle with the spec durations and ends with cycleComplete', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.requestCycle();
    const expectPhaseAfter = (ms: number, phase: number): void => {
      advance(m, ms);
      expect(m.snapshot().phase).toBe(phase);
    };
    expectPhaseAfter(499, PHASE.SCRAMBLE_OUT); // scramble 500
    expectPhaseAfter(2, PHASE.FORM_ALT); // t = 501
    expectPhaseAfter(1148, PHASE.FORM_ALT); // form 900 + stagger 250 = 1150 → boundary at 1650
    expectPhaseAfter(2, PHASE.HOLD_ALT); // t = 1651
    expectPhaseAfter(2498, PHASE.HOLD_ALT); // hold 2500 → boundary at 4150
    expectPhaseAfter(2, PHASE.SCRAMBLE_BACK); // t = 4151
    expectPhaseAfter(498, PHASE.SCRAMBLE_BACK); // boundary at 4650
    expectPhaseAfter(2, PHASE.FORM_NAME); // t = 4651
    expect(advance(m, 1150)).toContain('cycleComplete'); // boundary at 5800
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
  });

  it('shows the alt target during FORM_ALT, HOLD_ALT and SCRAMBLE_BACK only', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    expect(m.snapshot().showingAlt).toBe(false);
    m.requestCycle();
    advance(m, 600);
    expect(m.snapshot().showingAlt).toBe(true);
    advance(m, 1200);
    expect(m.snapshot().showingAlt).toBe(true);
    advance(m, 2600);
    expect(m.snapshot().phase).toBe(PHASE.SCRAMBLE_BACK);
    expect(m.snapshot().showingAlt).toBe(true);
    advance(m, 400);
    expect(m.snapshot().phase).toBe(PHASE.FORM_NAME);
    expect(m.snapshot().showingAlt).toBe(false);
  });

  it('auto-teases once after 8 s idle with no activity, never again', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    expect(advance(m, 7999)).not.toContain('autoTease');
    expect(advance(m, 2)).toContain('autoTease');
    advance(m, 6000);
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
    expect(advance(m, 20_000)).not.toContain('autoTease');
  });

  it('never auto-teases once the pointer has moved', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.pointerActivity();
    expect(advance(m, 30_000)).not.toContain('autoTease');
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
  });

  it('reduced motion: starts idle, reports entryComplete on the first tick, crossfades in reducedMs with no stagger', () => {
    const m = new MorphMachine(T, true);
    expect(m.snapshot().phase).toBe(PHASE.IDLE);
    expect(m.tick(16)).toContain('entryComplete');
    expect(m.requestCycle()).toBe(true);
    expect(m.snapshot()).toMatchObject({ phase: PHASE.SCRAMBLE_OUT, durMs: 150, staggerMs: 0 });
    advance(m, 160);
    expect(m.snapshot().phase).toBe(PHASE.FORM_ALT);
    advance(m, 160);
    expect(m.snapshot().phase).toBe(PHASE.HOLD_ALT);
  });

  it('carries overflow across several phases on one large delta', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.requestCycle();
    m.tick(3000); // 500 + 1150 + 1350 into the hold
    expect(m.snapshot().phase).toBe(PHASE.HOLD_ALT);
    expect(m.snapshot().tMs).toBeCloseTo(1350, 6);
  });

  it('a hidden-tab gap clamped by clampDt advances a single frame', () => {
    const m = new MorphMachine(T);
    advance(m, 2000);
    m.requestCycle();
    m.tick(clampDt(60_000));
    expect(m.snapshot().phase).toBe(PHASE.SCRAMBLE_OUT);
    expect(m.snapshot().tMs).toBe(50);
  });
});
```

- [ ] **Step 2: Run to verify failure, then write `src/engine/morph.ts`**

Run: `npx vitest run tests/morph.test.ts` → FAIL. Then:

```ts
import { PHASE, type MorphTimings, type PhaseId } from './types';

export type MorphEvent = 'entryComplete' | 'autoTease' | 'cycleComplete';

export interface MorphSnapshot {
  phase: PhaseId;
  /** ms elapsed in the phase */
  tMs: number;
  /** base duration of the phase (>= 1 so the shader never divides by zero) */
  durMs: number;
  staggerMs: number;
  /** true while the dots belong to the `soon.` target */
  showingAlt: boolean;
}

const NEXT: Record<PhaseId, PhaseId> = {
  [PHASE.ENTRY]: PHASE.IDLE,
  [PHASE.IDLE]: PHASE.IDLE,
  [PHASE.SCRAMBLE_OUT]: PHASE.FORM_ALT,
  [PHASE.FORM_ALT]: PHASE.HOLD_ALT,
  [PHASE.HOLD_ALT]: PHASE.SCRAMBLE_BACK,
  [PHASE.SCRAMBLE_BACK]: PHASE.FORM_NAME,
  [PHASE.FORM_NAME]: PHASE.IDLE,
};

/** ENTRY → IDLE → (SCRAMBLE_OUT → FORM_ALT → HOLD_ALT → SCRAMBLE_BACK → FORM_NAME → IDLE)*, spec 3.5. */
export class MorphMachine {
  private phase: PhaseId;
  private tInPhase = 0;
  private idleMs = 0;
  private autoTeased = false;
  private sawActivity = false;
  private pendingEntryComplete: boolean;

  constructor(
    private timings: MorphTimings,
    private readonly reduced = false,
  ) {
    this.phase = reduced ? PHASE.IDLE : PHASE.ENTRY;
    this.pendingEntryComplete = reduced;
  }

  setTimings(t: MorphTimings): void {
    this.timings = t;
  }

  get acceptsInput(): boolean {
    return this.phase === PHASE.IDLE;
  }

  /** Click or tap. Returns false while the entry or a cycle is running. */
  requestCycle(): boolean {
    if (!this.acceptsInput) return false;
    this.enter(PHASE.SCRAMBLE_OUT);
    return true;
  }

  /** Any pointer movement or press: the visitor knows the page is alive, so the auto-tease is cancelled for good. */
  pointerActivity(): void {
    this.sawActivity = true;
  }

  tick(dtMs: number): MorphEvent[] {
    const events: MorphEvent[] = [];
    if (this.pendingEntryComplete) {
      this.pendingEntryComplete = false;
      events.push('entryComplete');
    }
    if (this.phase === PHASE.IDLE) {
      this.idleMs += dtMs;
      if (!this.autoTeased && !this.sawActivity && this.idleMs >= this.timings.autoTeaseMs) {
        this.autoTeased = true;
        this.enter(PHASE.SCRAMBLE_OUT);
        events.push('autoTease');
      }
      return events;
    }
    this.tInPhase += dtMs;
    while (this.phase !== PHASE.IDLE && this.tInPhase >= this.total(this.phase)) {
      const carry = this.tInPhase - this.total(this.phase);
      if (this.phase === PHASE.ENTRY) events.push('entryComplete');
      if (this.phase === PHASE.FORM_NAME) events.push('cycleComplete');
      this.enter(NEXT[this.phase], carry);
    }
    return events;
  }

  snapshot(): MorphSnapshot {
    const p = this.phase;
    return {
      phase: p,
      tMs: this.tInPhase,
      durMs: Math.max(1, this.dur(p)),
      staggerMs: this.stagger(p),
      showingAlt: p === PHASE.FORM_ALT || p === PHASE.HOLD_ALT || p === PHASE.SCRAMBLE_BACK,
    };
  }

  private enter(phase: PhaseId, carry = 0): void {
    this.phase = phase;
    this.tInPhase = phase === PHASE.IDLE ? 0 : carry;
    if (phase === PHASE.IDLE) this.idleMs = 0;
  }

  private dur(p: PhaseId): number {
    const T = this.timings;
    if (this.reduced) {
      switch (p) {
        case PHASE.SCRAMBLE_OUT:
        case PHASE.FORM_ALT:
        case PHASE.SCRAMBLE_BACK:
        case PHASE.FORM_NAME:
          return T.reducedMs;
        case PHASE.HOLD_ALT:
          return T.holdMs;
        default:
          return 0;
      }
    }
    switch (p) {
      case PHASE.ENTRY:
        return T.entryMs;
      case PHASE.SCRAMBLE_OUT:
      case PHASE.SCRAMBLE_BACK:
        return T.scrambleMs;
      case PHASE.FORM_ALT:
      case PHASE.FORM_NAME:
        return T.formMs;
      case PHASE.HOLD_ALT:
        return T.holdMs;
      default:
        return 0;
    }
  }

  private stagger(p: PhaseId): number {
    if (this.reduced) return 0;
    const T = this.timings;
    switch (p) {
      case PHASE.ENTRY:
        return T.entryStaggerMs;
      case PHASE.FORM_ALT:
      case PHASE.FORM_NAME:
        return T.formStaggerMs;
      default:
        return 0;
    }
  }

  private total(p: PhaseId): number {
    return this.dur(p) + this.stagger(p);
  }
}
```

- [ ] **Step 3: Run the tests and typecheck**

Run: `npx vitest run tests/morph.test.ts && npm run typecheck`
Expected: 9 pass; `tsc` silent.

- [ ] **Step 4: Commit**

```bash
git add src/engine/morph.ts tests/morph.test.ts
git commit -m "feat(engine): morph state machine with auto-tease and reduced-motion timings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Wire the morph: click, tap, auto-tease, reduced motion

**Files:**
- Modify: `src/app.ts`

**Interfaces:**
- Consumes: `MorphMachine` (Task 19).
- Produces: `App.requestCycle()` is real; `noteActivity()` forwards to the machine; canvas `click` and touch `pointerdown` start cycles; the `[Task 20]` entry block in `frame` is gone.

- [ ] **Step 1: Edit `src/app.ts`**

Add the import:
```ts
import { MorphMachine } from './engine/morph';
```

Replace the field block
```ts
  // [Task 20] replaced by MorphMachine
  private entryDone = false;
```
with
```ts
  private readonly morph: MorphMachine;
  private readonly canvas: HTMLCanvasElement;
  private entryDone = false;
```

In the constructor, after `this.pointer = …`:
```ts
    this.canvas = opts.canvas;
    this.morph = new MorphMachine(this.params.morph, this.reduced);
```

In `applyParams()`, add:
```ts
    this.morph.setTimings(this.params.morph);
```

Replace the `requestCycle` stub with:
```ts
  /** Click, tap, debug button, or auto-tease: one scramble → `soon.` → scramble → name cycle (spec 3.5). */
  requestCycle(): boolean {
    return this.morph.requestCycle();
  }
```

Replace the empty `noteActivity` with:
```ts
  private noteActivity(): void {
    this.morph.pointerActivity();
  }
```

In `start()`, add:
```ts
    this.canvas.addEventListener('click', this.onClick);
```
and in `stop()`:
```ts
    this.canvas.removeEventListener('click', this.onClick);
```

In `onPointerDown`, after the `snap`/`move` branch and before `this.noteActivity();`:
```ts
    if (e.pointerType === 'touch') this.morph.requestCycle();
```
(The browser also synthesizes a `click` after a tap; the machine ignores it because a cycle is already running.)

Add the handler next to `onPointerEnd`:
```ts
  private onClick = (): void => {
    this.morph.requestCycle();
  };
```

In `frame`, replace the block between `this.simMs += dt;` and `this.field.setTime(this.simMs);` (the `[Task 20]` entry timer and its `setMorph` call) with:
```ts
    for (const event of this.morph.tick(dt)) {
      if (event === 'entryComplete') this.entryDone = true;
    }
    const snap = this.morph.snapshot();
    this.field.setMorph(snap.phase, snap.tMs, snap.durMs, snap.staggerMs);
```

- [ ] **Step 2: Typecheck, test, verify in the browser**

Run: `npm run typecheck && npm test && npm run dev`

DevTools MCP on `http://localhost:5173/?seed=7`:
1. Wait for the entry, `click` the centre of the name, then screenshots at +0.3 s (dots flying outward), +1.2 s (`soon.` legible, lowercase with the period), +4.5 s (scrambling back), +6 s (`PARSA NAJI` restored). Timings match spec 3.5 within a frame.
2. Click again during a cycle: nothing changes (ignored).
3. Reload and do not touch anything: at about 10 s (2 s entry + 8 s idle) the cycle runs by itself; it never runs a second time (watch 30 s).
4. Reload, move the mouse once over the canvas, wait 15 s: no auto-tease.
5. Touch: dispatch a touch `pointerdown` via `evaluate_script` → a cycle starts.
6. `emulate` `prefers-reduced-motion: reduce`, reload: name appears instantly; click → the field fades out, swaps to `soon.`, fades in, holds, fades, returns; no dots fly.
7. `http://localhost:5173/?debug`: the `trigger morph` button starts a cycle.
8. `list_console_messages`: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app.ts
git commit -m "feat: click/tap morph to soon., auto-tease once, reduced-motion crossfade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Adaptive quality, DPR changes, resize mid-cycle

**Files:**
- Modify: `src/app.ts`, `src/tweaks.ts`

**Interfaces:**
- Consumes: `FpsProbe`, `degradedCount`, `capDpr` (Task 10).
- Produces: `App.degraded: boolean`; the probe runs once after the entry; `layout()` refreshes the DPR; dev builds expose `window.__app` under `?debug` for inspection.

- [ ] **Step 1: Edit `src/app.ts`**

Extend the quality import:
```ts
import { FpsProbe, capDpr, degradedCount, dotCount } from './engine/quality';
```

Add fields after `entryDone`:
```ts
  private readonly probe: FpsProbe;
  private hasDegraded = false;
```

In the constructor, after `this.morph = …`:
```ts
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
```

Add a getter after `count`:
```ts
  get degraded(): boolean {
    return this.hasDegraded;
  }
```

In `layout()`, right after `this.field.setViewport(this.vw, this.vh);`:
```ts
    this.field.setDpr(capDpr(window.devicePixelRatio));
```

In `frame`, directly after the `for (const event of this.morph.tick(dt)) …` loop:
```ts
    if (this.entryDone && !this.probe.done && this.probe.push(dt) === 'degrade') {
      this.hasDegraded = true;
      this.setCount(degradedCount(this.n, this.params.probe.degradeFactor));
    }
```

- [ ] **Step 2: Expose the app in dev** — in `src/tweaks.ts`, first line inside `mount(params, app)`:

```ts
  (window as unknown as { __app: App }).__app = app;
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm test && npm run dev`

DevTools MCP on `http://localhost:5173/?debug&seed=7`:
1. Baseline: after 4 s, `evaluate_script` → `__app.count` (record it; expected roughly 12 000–20 000 at 1440×900) and `__app.degraded === false`.
2. `emulate` with CPU throttling 6× (20× if the GPU is strong), reload, wait 5 s: `__app.degraded === true` and `__app.count` is 60 % of the baseline (±1). Remove the throttling.
3. Resize mid-cycle: click to start a morph, immediately `resize_page` to 900×700: the cycle finishes against the re-laid-out targets, `soon.` and the name both land centred, no exception in `list_console_messages`.
4. Hidden tab: open a second page with `new_page`, wait 10 s, `select_page` back: the animation resumes without a jump cut (the morph phase advanced by at most one frame; vibration continuous).
5. DPR: `emulate` with `deviceScaleFactor: 3`, reload: dots stay crisp and `__app.field.renderer.getPixelRatio() === 2`.

- [ ] **Step 4: Commit, push, preview**

```bash
git add src/app.ts src/tweaks.ts
git commit -m "feat: fps probe with one-shot degrade, DPR refresh on layout, dev app handle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
npm run deploy:preview
```

Report the preview URL. Slice 4 complete; checkpoint the vault note and memory.

---
