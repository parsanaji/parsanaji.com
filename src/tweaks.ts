// Debug panel (spec 4.12). Loaded only by `await import('./tweaks')` when PN_DEBUG && ?debug, so production never carries it.
import GUI from 'lil-gui';
// lil-gui 0.21.0's package.json "exports" exposes only ".", so the bare 'lil-gui/dist/lil-gui.css' of spec 4.12.2 fails to
// resolve; the relative path reaches the same file. A same-origin stylesheet is what the CSP (style-src 'self') allows.
import '../node_modules/lil-gui/dist/lil-gui.css';
import type { App } from './app';
import type { FieldParams } from './field/params';

const STORAGE_KEY = 'pn.tweaks';

type Tree = Record<string, unknown>;

function isPlainObject(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copies saved values onto `target` only where the key exists and the type matches; objects recurse into objects. */
function deepAssign(target: Tree, source: Tree): void {
  for (const [key, value] of Object.entries(source)) {
    if (!Object.hasOwn(target, key)) continue;
    const current = target[key];
    if (isPlainObject(current)) {
      if (isPlainObject(value)) deepAssign(current, value);
    } else if (value !== null && typeof value === typeof current) {
      target[key] = value;
    }
  }
}

/** The subset of `current` that differs from `base` (same shape), or undefined when nothing differs. */
function diff(current: Tree, base: Tree): Tree | undefined {
  const out: Tree = {};
  for (const [key, value] of Object.entries(current)) {
    const before = base[key];
    if (isPlainObject(value) && isPlainObject(before)) {
      const sub = diff(value, before);
      if (sub) out[key] = sub;
    } else if (value !== before) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Spec 4.12.2: applies the saved changes (pn.tweaks) to `params` before App.start and returns mount(app). */
export function prepareTweaks(params: FieldParams): (app: App) => void {
  const baseline = structuredClone(params);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isPlainObject(parsed)) deepAssign(params as unknown as Tree, parsed);
    }
  } catch {
    // unreadable or blocked storage: start from the defaults, silently (4.12.2: no warnings on previews)
  }
  return (app: App) => {
    mount(params, baseline, app);
  };
}

function mount(params: FieldParams, baseline: FieldParams, app: App): GUI {
  const gui = new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 });
  const persist = (): void => {
    try {
      const changed = diff(params as unknown as Tree, baseline as unknown as Tree);
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage blocked: the change still applies for this session
    }
  };
  /** Every change persists and goes through App.applyParams(): uniforms on the next frame, regrid for cells. */
  const live = (): void => {
    persist();
    app.applyParams();
  };

  const dashes = gui.addFolder('dashes');
  dashes.add(params, 'density', ['sparse', 'medium', 'dense']).onChange(live);
  dashes.add(params.dash, 'minCss', 3, 20, 0.5).onChange(live);
  dashes.add(params.dash, 'maxCss', 10, 60, 1).onChange(live);
  dashes.add(params.dash, 'lenMin', 0, 0.5, 0.01).onChange(live);
  dashes.add(params.dash, 'lenK', 0, 1.5, 0.01).onChange(live);
  dashes.add(params.dash, 'widthK', 0.02, 0.3, 0.005).onChange(live);
  dashes.add(params.dash, 'alphaMin', 0, 1, 0.01).onChange(live);
  dashes.add(params.dash, 'flowAmp', 0, 2.5, 0.05).onChange(live);
  dashes.add(params.dash, 'repelK', 0, 6, 0.1).onChange(live);
  dashes.add(params.dash, 'color', ['core', 'muted']).onChange(live);
  dashes.add(params.dash, 'weightLight', 1, 2.5, 0.05).onChange(live);
  dashes.add(params.dash, 'textWidth', 1, 4, 0.1).onChange(live);
  dashes.add(params.dash, 'textLen', 1, 2, 0.05).onChange(live);
  dashes.add(params.dash, 'textInk', 0, 1, 0.05).onChange(live);

  const surface = gui.addFolder('surface');
  surface.add(params, 'intensity', ['subtle', 'medium', 'lively']).onChange(live);
  surface.add(params, 'flowSpeed', 0, 3, 0.05).onChange(live);
  surface.add(params.shape, 'warpScalePx', 80, 600, 10).onChange(live);
  surface.add(params.shape, 'mainScalePx', 60, 400, 5).onChange(live);
  surface.add(params.shape, 'warpAmp', 0, 6, 0.1).onChange(live);
  surface.add(params.shape, 'level', 0, 0.6, 0.01).onChange(live);
  surface.add(params.shape, 'gain', 0.5, 4, 0.05).onChange(live);
  surface.add(params.shape, 'shapeK', 0, 1, 0.05).onChange(live);

  const tiers = gui.addFolder('tiers');
  const keepOrder = (): void => {
    if (params.tiers.t3 <= params.tiers.t2) {
      params.tiers.t3 = Math.round((params.tiers.t2 + 0.01) * 1000) / 1000; // 4.12.3: t3 stays above t2
      t3.updateDisplay();
    }
    live();
  };
  tiers.add(params.tiers, 't2', 0.4, 0.9, 0.005).onChange(keepOrder);
  const t3 = tiers.add(params.tiers, 't3', 0.6, 1, 0.005).onChange(keepOrder);

  const pointer = gui.addFolder('pointer');
  pointer.add(params.pointer, 'radiusK', 0.1, 0.5, 0.01).onChange(live);
  pointer.add(params.pointer, 'radiusSp', 0, 6, 0.5).onChange(live);
  pointer.add(params.pointer, 'warpK', 0, 1, 0.01).onChange(live);
  pointer.add(params.pointer, 'boost', 0, 0.4, 0.01).onChange(live);
  pointer.add(params.pointer, 'lerp', 0.02, 1, 0.01).onChange(live);
  pointer.add(params.pointer, 'riseMs', 0, 1000, 10).onChange(live);
  pointer.add(params.pointer, 'fallMs', 0, 2000, 10).onChange(live);
  pointer.add(params.pointer, 'velNorm', 200, 4000, 50).onChange(live);
  pointer.add(params.pointer, 'velRadiusGain', 0, 0.5, 0.01).onChange(live);

  const ripple = gui.addFolder('ripple');
  ripple.add(params.ripple, 'max', 1, 8, 1).onChange(live);
  ripple.add(params.ripple, 'lifeS', 0.5, 6, 0.1).onChange(live);
  ripple.add(params.ripple, 'amp', 0, 2, 0.05).onChange(live);
  ripple.add(params.ripple, 'speedSp', 1, 20, 0.5).onChange(live);
  ripple.add(params.ripple, 'sigmaSp', 0.5, 4, 0.1).onChange(live);
  ripple.add(params.ripple, 'gain', 0, 2, 0.05).onChange(live);

  const breath = gui.addFolder('breath');
  breath.add(params.breath, 'amp', 0, 0.05, 0.001).onChange(live);
  breath.add(params.breath, 'periodMs', 1000, 20000, 100).onChange(live);

  const mask = gui.addFolder('mask');
  mask.add(params.mask, 'holdDim', 0, 1, 0.01).onChange(live);
  mask.add(params.mask, 'ink', 0.7, 1, 0.01).onChange(live);
  mask.add(params.mask, 'edge', 0.01, 0.3, 0.01).onChange(live);
  mask.add(params.mask, 'meltPx', 0, 150, 1).onChange(live);
  mask.add(params.mask, 'heightFrac', 0.1, 0.8, 0.01).onChange(live);
  mask.add(params.mask, 'widthFrac', 0.3, 1, 0.01).onChange(live);

  const entry = gui.addFolder('entry');
  for (const key of ['gatherMs', 'holdMs', 'dissolveMs', 'scrimAtMs', 'revealAtMs', 'cleanupAtMs'] as const) {
    entry.add(params.entry, key, 0, 6000, 10).onChange(live);
  }
  entry.add(params.entry, 'skipMs', 0, 1000, 10).onChange(live);

  const konami = gui.addFolder('konami');
  for (const key of ['gatherMs', 'holdMs', 'dissolveMs'] as const) konami.add(params.konami, key, 0, 6000, 10).onChange(live);

  let frozen = false;
  gui.add({ replay: () => app.replayEntry() }, 'replay').name('replay entry');
  gui.add({ konami: () => app.konami() }, 'konami').name('Konami');
  gui.add({ toggle: () => document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click() }, 'toggle').name('toggle theme');
  const freeze = gui
    .add(
      {
        freeze: () => {
          frozen = !frozen;
          app.debug().setFrozen(frozen);
          freeze.name(frozen ? 'unfreeze time' : 'freeze time');
        },
      },
      'freeze',
    )
    .name('freeze time');
  gui.add({ copy: () => void navigator.clipboard?.writeText(JSON.stringify(params, null, 2)).catch(() => {}) }, 'copy').name('copy JSON');
  gui
    .add(
      {
        reset: () => {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // nothing stored
          }
          location.reload();
        },
      },
      'reset',
    )
    .name('reset');
  return gui;
}
