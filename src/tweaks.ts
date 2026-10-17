import GUI from 'lil-gui';
import type { App } from './app';
import type { Params } from './engine/types';

const STORAGE_KEY = 'parsanaji.tweaks';

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

/** Applies saved tweaks to `params` now (before sampling) and returns the mount function. */
export function prepareTweaks(params: Params): (app: App) => void {
  const baseline = structuredClone(params);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isPlainObject(parsed)) deepAssign(params as unknown as Tree, parsed);
    }
  } catch (error) {
    console.warn('[tweaks] ignoring unreadable saved tweaks', error);
  }
  return (app: App) => {
    mount(params, baseline, app);
  };
}

function mount(params: Params, baseline: Params, app: App): GUI {
  const gui = new GUI({ title: 'parsanaji tweaks', width: 320 });
  const persist = (): void => {
    const changed = diff(params as unknown as Tree, baseline as unknown as Tree);
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
    else localStorage.removeItem(STORAGE_KEY);
  };
  const live = (): void => {
    persist();
    app.applyParams();
  };
  const relayout = (): void => {
    persist();
    app.layout();
  };

  const field = gui.addFolder('field');
  field.add(app, 'count').name('N').disable().listen();
  field.add(params, 'density', 0.05, 1, 0.01).onFinishChange(relayout);
  for (const key of ['desktop', 'tablet', 'phone'] as const) {
    field.add(params.caps, key, 1000, 120_000, 1000).name(`cap ${key}`).onFinishChange(relayout);
  }
  field.add(params, 'dotSize', 0.5, 4, 0.1).onChange(live);
  field.add(params, 'alphaScale', 0.1, 1, 0.05).onChange(live);
  field.add(params, 'nearScale', 1, 2.5, 0.05).onChange(live);
  field.add(params, 'additive').onChange(live);
  field.add(params, 'sizeVarMin', 0.25, 1, 0.05).onFinishChange(relayout);
  field.add(params, 'sizeVarMax', 1, 2, 0.05).onFinishChange(relayout);

  const idle = gui.addFolder('idle');
  idle.add(params, 'vibAmp', 0, 3, 0.05).onChange(live);
  idle.add(params, 'vibFreq', 0.1, 6, 0.1).onChange(live);
  idle.add(params, 'vibScale', 0.002, 0.1, 0.001).onChange(live);
  idle.add(params, 'breathAmp', 0, 0.05, 0.001).onChange(persist);
  idle.add(params, 'breathPeriodMs', 1000, 20000, 100).onChange(persist);
  idle.add(params.ripple, 'intervalMs', 2000, 30000, 500).onChange(live);
  idle.add(params.ripple, 'jitterMs', 0, 5000, 100).onChange(live);
  idle.add(params.ripple, 'durationMs', 100, 2000, 50).onChange(live);
  idle.add(params.ripple, 'amplitudePx', 0, 12, 0.5).onChange(live);
  idle.add(params.ripple, 'speedPxPerS', 200, 4000, 50).onChange(live);
  idle.add(params.ripple, 'bandPx', 10, 200, 5).onChange(live);

  const pointer = gui.addFolder('pointer');
  pointer.add(params, 'repelRadius', 20, 400, 5).onChange(live);
  pointer.add(params, 'repelStrength', 0, 1, 0.01).onChange(live);
  pointer.add(params, 'repelClampFrac', 0.1, 1.5, 0.05).onChange(live);
  pointer.add(params.pointer, 'lerp', 0.02, 0.5, 0.01).onChange(live);
  pointer.add(params.pointer, 'trailMs', 100, 2000, 50).onChange(live);
  pointer.add(params.pointer, 'parkMs', 100, 3000, 50).onChange(live);

  const morph = gui.addFolder('morph');
  for (const key of ['entryMs', 'entryStaggerMs', 'scrambleMs', 'formMs', 'formStaggerMs', 'holdMs', 'autoTeaseMs', 'reducedMs'] as const) {
    morph.add(params.morph, key, 0, 10000, 50).onChange(live);
  }
  morph.add(params, 'scatterMin', 0, 600, 10).onChange(live);
  morph.add(params, 'scatterMax', 0, 1200, 10).onChange(live);
  morph.add({ trigger: () => void app.requestCycle() }, 'trigger').name('trigger morph');

  gui.add({ copy: () => void navigator.clipboard.writeText(JSON.stringify(params, null, 2)) }, 'copy').name('copy JSON');
  gui
    .add(
      {
        reset: () => {
          localStorage.removeItem(STORAGE_KEY);
          location.reload();
        },
      },
      'reset',
    )
    .name('reset to defaults');
  return gui;
}
