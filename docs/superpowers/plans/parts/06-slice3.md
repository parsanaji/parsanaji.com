## Slice 3 — Pointer

### Task 16: Pointer model

Pure TypeScript: smoothing, speed, a short decaying trail, and parking after release. The shader consumes its `slots()`.

**Files:**
- Create: `src/engine/pointer.ts`
- Test: `tests/pointer.test.ts`

**Interfaces:**
- Consumes: `PointerParams`, `PointerSlot` (Task 10), `easeOutCubic` (Task 9).
- Produces: `class PointerModel { constructor(params); setParams(p); isActive; position; move(x, y); snap(x, y, t); release(t); tick(dtMs, t); slots(t): PointerSlot[] }`. Coordinates are centred CSS px, y up. `slots()` always returns exactly `params.slots` entries, newest first, index 0 = live pointer.

- [ ] **Step 1: Write the failing tests** (`tests/pointer.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/engine/defaults';
import { PointerModel } from '../src/engine/pointer';

const P = DEFAULTS.pointer;

/** Advance `model` by `totalMs` in `stepMs` frames starting at absolute time `t0`; returns the final time. */
const run = (model: PointerModel, totalMs: number, stepMs: number, t0: number): number => {
  let t = t0;
  for (let elapsed = 0; elapsed < totalMs - 1e-9; elapsed += stepMs) {
    t += stepMs;
    model.tick(stepMs, t);
  }
  return t;
};

describe('PointerModel', () => {
  it('lerps toward the raw pointer independent of frame rate', () => {
    const a = new PointerModel(P);
    const b = new PointerModel(P);
    a.move(0, 0);
    b.move(0, 0);
    a.tick(16, 16);
    b.tick(16, 16);
    a.move(100, 0);
    b.move(100, 0);
    run(a, 1000, 1000 / 30, 16);
    run(b, 1000, 1000 / 120, 16);
    expect(a.position.x).toBeGreaterThan(99);
    expect(Math.abs(a.position.x - b.position.x)).toBeLessThan(1);
  });

  it('reports a velocity factor that saturates at 1 for fast moves', () => {
    const m = new PointerModel(P);
    m.move(0, 0);
    m.tick(16, 16);
    m.move(1000, 0);
    m.tick(16.667, 32.667); // 120 px in one frame = 7200 px/s, far above velNorm
    expect(m.slots(32.667)[0].vel).toBe(1);
  });

  it('always returns exactly 8 slots with the live pointer first', () => {
    const m = new PointerModel(P);
    expect(m.slots(0)).toHaveLength(8);
    expect(m.slots(0).every((s) => s.strength === 0)).toBe(true);
    m.snap(5, 6, 0);
    const s = m.slots(0);
    expect(s).toHaveLength(8);
    expect(s[0]).toMatchObject({ x: 5, y: 6, strength: 1 });
  });

  it('keeps a trail of decaying samples behind the live pointer', () => {
    const m = new PointerModel(P);
    m.snap(0, 0, 0);
    let t = 0;
    for (let i = 1; i <= 40; i++) {
      t += 16;
      m.move(i * 10, 0);
      m.tick(16, t);
    }
    const trail = m.slots(t).slice(1).filter((s) => s.strength > 0);
    expect(trail.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < trail.length; i++) expect(trail[i].strength).toBeLessThanOrEqual(trail[i - 1].strength);
    expect(trail[trail.length - 1].strength).toBeLessThan(trail[0].strength);
  });

  it('decays after release and parks after parkMs so no ghost repel remains', () => {
    const m = new PointerModel(P);
    m.snap(0, 0, 0);
    m.tick(16, 16);
    m.release(16);
    m.tick(400, 416);
    expect(m.slots(416)[0].strength).toBeCloseTo(0.875, 6); // easeOutCubic(0.5)
    m.tick(400, 816);
    expect(m.isActive).toBe(false);
    expect(m.slots(816).every((s) => s.strength === 0)).toBe(true);
  });

  it('re-activates cleanly after parking', () => {
    const m = new PointerModel(P);
    m.snap(0, 0, 0);
    m.release(0);
    m.tick(900, 900);
    expect(m.isActive).toBe(false);
    m.move(50, 50);
    m.tick(16, 916);
    expect(m.isActive).toBe(true);
    expect(m.position).toEqual({ x: 50, y: 50 });
  });
});
```

- [ ] **Step 2: Run to verify failure, then write `src/engine/pointer.ts`**

Run: `npx vitest run tests/pointer.test.ts` → FAIL. Then:

```ts
import { easeOutCubic } from './easing';
import type { PointerParams, PointerSlot } from './types';

interface TrailSample {
  x: number;
  y: number;
  t: number;
}

/** Smooths the raw pointer, estimates its speed, keeps a short decaying trail, parks after release (spec 3.5). */
export class PointerModel {
  private rawX = 0;
  private rawY = 0;
  private hasRaw = false;
  private x = 0;
  private y = 0;
  private speed = 0;
  private active = false;
  private releasedAt = -1;
  private trail: TrailSample[] = [];
  private lastSampleT = Number.NEGATIVE_INFINITY;

  constructor(private params: PointerParams) {}

  setParams(p: PointerParams): void {
    this.params = p;
  }

  get isActive(): boolean {
    return this.active;
  }

  get position(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /** Pointer moved (mouse or touch). Centred CSS px, y up. */
  move(x: number, y: number): void {
    if (!this.active) {
      this.x = x;
      this.y = y;
      this.speed = 0;
      this.active = true;
    }
    this.rawX = x;
    this.rawY = y;
    this.hasRaw = true;
    this.releasedAt = -1;
  }

  /** Touch start: place the smoothed pointer instantly instead of lerping in from the last position. */
  snap(x: number, y: number, t: number): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.rawX = x;
    this.rawY = y;
    this.hasRaw = true;
    this.speed = 0;
    this.releasedAt = -1;
    this.trail = [];
    this.lastSampleT = Number.NEGATIVE_INFINITY;
    this.sample(t);
  }

  /** Pointer up, cancel, or left the window: strength decays over trailMs, then the model parks. */
  release(t: number): void {
    if (this.active && this.releasedAt < 0) this.releasedAt = t;
  }

  tick(dtMs: number, t: number): void {
    if (!this.active) return;
    const dt = Math.max(dtMs, 1e-3);
    if (this.releasedAt < 0 && this.hasRaw) {
      const k = 1 - Math.pow(1 - this.params.lerp, dt / (1000 / 60));
      const nx = this.x + (this.rawX - this.x) * k;
      const ny = this.y + (this.rawY - this.y) * k;
      this.speed = Math.hypot(nx - this.x, ny - this.y) / (dt / 1000);
      this.x = nx;
      this.y = ny;
      const last = this.trail[this.trail.length - 1];
      const far = !last || Math.hypot(this.x - last.x, this.y - last.y) >= this.params.sampleMinDist;
      if (t - this.lastSampleT >= this.params.sampleEveryMs || far) this.sample(t);
    } else {
      this.speed = 0;
    }
    this.trail = this.trail.filter((s) => t - s.t <= this.params.trailMs);
    if (this.releasedAt >= 0 && t - this.releasedAt >= this.params.parkMs) {
      this.active = false;
      this.hasRaw = false;
      this.trail = [];
      this.releasedAt = -1;
      this.speed = 0;
    }
  }

  private sample(t: number): void {
    this.trail.push({ x: this.x, y: this.y, t });
    this.lastSampleT = t;
    while (this.trail.length > this.params.slots - 1) this.trail.shift();
  }

  /** Exactly `params.slots` entries, newest first; index 0 is the live pointer. Inert slots have strength 0. */
  slots(t: number): PointerSlot[] {
    const out: PointerSlot[] = [];
    if (this.active) {
      const live = this.releasedAt < 0 ? 1 : easeOutCubic(Math.max(0, 1 - (t - this.releasedAt) / this.params.trailMs));
      out.push({ x: this.x, y: this.y, strength: live, vel: Math.min(this.speed / this.params.velNorm, 1) });
      for (let i = this.trail.length - 1; i >= 0 && out.length < this.params.slots; i--) {
        const s = this.trail[i];
        out.push({ x: s.x, y: s.y, strength: easeOutCubic(Math.max(0, 1 - (t - s.t) / this.params.trailMs)), vel: 0 });
      }
    }
    while (out.length < this.params.slots) out.push({ x: 0, y: 0, strength: 0, vel: 0 });
    return out;
  }
}
```

- [ ] **Step 3: Run the tests and typecheck**

Run: `npx vitest run tests/pointer.test.ts && npm run typecheck`
Expected: 6 pass; `tsc` silent.

- [ ] **Step 4: Commit**

```bash
git add src/engine/pointer.ts tests/pointer.test.ts
git commit -m "feat(engine): pointer model with smoothing, speed, decaying trail and parking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Wire the pointer into `App` (mouse and touch)

**Files:**
- Modify: `src/app.ts`

**Interfaces:**
- Consumes: `PointerModel` (Task 16).
- Produces: `App` listens to `pointermove/pointerdown/pointerup/pointercancel` on `window`, `pointerleave` on `<html>`, `blur` on `window`; pushes `pointer.slots()` to the field every frame; exposes a private `noteActivity()` hook that Task 20 forwards to the `MorphMachine`.

- [ ] **Step 1: Edit `src/app.ts`**

Add the import:
```ts
import { PointerModel } from './engine/pointer';
```

Add the field next to `ripple`:
```ts
  private readonly pointer: PointerModel;
```

In the constructor, after `this.ripple = …`:
```ts
    this.pointer = new PointerModel(this.params.pointer);
```

In `applyParams()`, add as the last line:
```ts
    this.pointer.setParams(this.params.pointer);
```

In `start()`, after the `visibilitychange` listener:
```ts
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerEnd);
    window.addEventListener('pointercancel', this.onPointerEnd);
    document.documentElement.addEventListener('pointerleave', this.onPointerEnd);
    window.addEventListener('blur', this.onPointerEnd);
```

In `stop()`, the matching removals:
```ts
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerEnd);
    window.removeEventListener('pointercancel', this.onPointerEnd);
    document.documentElement.removeEventListener('pointerleave', this.onPointerEnd);
    window.removeEventListener('blur', this.onPointerEnd);
```

In `frame`, directly after `this.field.setTime(this.simMs);`:
```ts
    this.pointer.tick(dt, this.simMs);
    this.field.setPointer(this.pointer.slots(this.simMs));
```

Add the handlers after `pickGlyphCenter`:
```ts
  /** Spec 3.4: x = clientX - vw/2, y = vh/2 - clientY. */
  private toWorld(e: PointerEvent): readonly [number, number] {
    return [e.clientX - this.vw / 2, this.vh / 2 - e.clientY] as const;
  }

  private onPointerMove = (e: PointerEvent): void => {
    const [x, y] = this.toWorld(e);
    this.pointer.move(x, y);
    this.noteActivity();
  };

  private onPointerDown = (e: PointerEvent): void => {
    const [x, y] = this.toWorld(e);
    if (e.pointerType === 'touch') this.pointer.snap(x, y, this.simMs);
    else this.pointer.move(x, y);
    this.noteActivity();
  };

  private onPointerEnd = (): void => {
    this.pointer.release(this.simMs);
  };

  /** [Task 20] forwards to the MorphMachine (cancels the auto-tease). */
  private noteActivity(): void {}
```

- [ ] **Step 2: Typecheck, test, verify in the browser**

Run: `npm run typecheck && npm test && npm run dev`

DevTools MCP checks on `http://localhost:5173/?seed=7` after the entry completes:
1. `hover` over the middle of the name, then `take_screenshot`: a hole opens around the pointer with brighter, slightly larger dots at its rim.
2. Drag the mouse quickly across the letters (`drag` from one side to the other): the displacement is stronger than a slow pass and a wake trails the cursor for well under a second.
3. Leave the viewport (dispatch `pointerleave` on `document.documentElement` with `evaluate_script`): within about 1 s the letters are whole again — no frozen hole.
4. Touch: `evaluate_script` dispatching `new PointerEvent('pointerdown', { pointerType: 'touch', clientX: innerWidth / 2, clientY: innerHeight / 2, bubbles: true })` then the matching `pointerup`: a pulse opens instantly at the centre and closes again.
5. `list_console_messages`: clean.
6. Toggle `prefers-reduced-motion` emulation and reload: the repel still works but with a visibly smaller radius (80 px).

- [ ] **Step 3: Commit**

```bash
git add src/app.ts
git commit -m "feat: pointer repel with velocity and decaying trail, mouse and touch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Cursor ring and slice-3 checkpoint

**Files:**
- Create: `src/ui/cursor.ts`
- Modify: `src/main.ts` (one call)

**Interfaces:**
- Produces: `initCursorRing(el: HTMLElement, root?: HTMLElement): () => void` — adds `has-ring` to `<html>` (hides the native cursor via the CSS from Task 3), follows the raw mouse with `style.translate`, `is-pressed` while a button is down, hidden over links and on `(hover: none)` devices.

- [ ] **Step 1: Write `src/ui/cursor.ts`**

```ts
/** 6 px ring that follows the raw mouse pointer; hidden over links and on touch-only devices (spec 3.2). */
export function initCursorRing(el: HTMLElement, root: HTMLElement = document.documentElement): () => void {
  if (window.matchMedia('(hover: none)').matches) return () => {};
  root.classList.add('has-ring');

  const onMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    el.style.translate = `${e.clientX}px ${e.clientY}px`;
    const overLink = e.target instanceof Element && e.target.closest('a') !== null;
    el.classList.toggle('is-visible', !overLink);
  };
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') el.classList.add('is-pressed');
  };
  const onUp = (): void => el.classList.remove('is-pressed');
  const onLeave = (): void => el.classList.remove('is-visible');

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  root.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    root.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    root.classList.remove('has-ring');
    el.classList.remove('is-visible', 'is-pressed');
  };
}
```

- [ ] **Step 2: Call it from `src/main.ts`** — add `import { initCursorRing } from './ui/cursor';` and, right after the `startClock(...)` line inside `boot()`:

```ts
  const cursorEl = document.getElementById('cursor');
  if (cursorEl) initCursorRing(cursorEl);
```

(Before the WebGL gate on purpose: the static fallback page gets the same cursor.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run dev`. DevTools MCP on `http://localhost:5173/`:
1. `hover` over the canvas: the native cursor is gone, a small ring sits under the pointer; `take_screenshot` to confirm.
2. `hover` over `github` in the exit line: the ring disappears and the native pointer hand shows (`getComputedStyle(link).cursor === 'pointer'` via `evaluate_script`).
3. Press and hold (`pointerdown` via `evaluate_script`, then screenshot): the ring scales to 1.5×; release restores it.
4. `emulate` a touch device (`hasTouch`, mobile UA) and reload: no ring visible (`getComputedStyle(cursor).display === 'none'`).
5. `list_console_messages`: clean.

- [ ] **Step 4: Commit, push, preview, checkpoint**

```bash
git add src/ui/cursor.ts src/main.ts
git commit -m "feat: custom cursor ring with press feedback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
npm run deploy:preview
```

Orchestrator: update the vault note and memory (slice 3 done, preview URL, any tuning Parsa asked for), then compact before slice 4.

---
