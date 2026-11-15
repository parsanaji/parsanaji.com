import {
  type FieldColors,
  type Theme,
  type ThemePref,
  parseHex,
  readPref,
  resolveTheme,
  toggleLabel,
  togglePref,
  writePref,
} from './theme';

/**
 * The DOM side of the theme (spec 3.2.6, 3.2.9, 3.5.10, 4.6.5-4.6.7): the toggle button, data-theme on <html>,
 * the theme-color metas and the field colours read from the computed --field-0..3 (CSS is their only source, 3.3.12).
 */
export interface ThemeControllerDeps {
  doc: Document;
  storage: Storage | null;
  systemDark: MediaQueryList;
  button: HTMLButtonElement | null;
  onChange: (colors: FieldColors, animate: boolean) => void;
}

/** Twelve registered tokens transition for 300 ms; the class is removed 320 ms after the last change (4.6.5 step 7). */
const ANIM_CLASS_MS = 320;

function rootStyle(doc: Document): CSSStyleDeclaration | null {
  const view = doc.defaultView;
  return view ? view.getComputedStyle(doc.documentElement) : null;
}

/** getComputedStyle(documentElement) --field-0..3, unregistered, so they are the target hex at once (4.6.4). */
export function readFieldColors(doc: Document): FieldColors {
  const cs = rootStyle(doc);
  const read = (name: string) => parseHex(cs ? cs.getPropertyValue(name) : '');
  return { f0: read('--field-0'), f1: read('--field-1'), f2: read('--field-2'), f3: read('--field-3') };
}

export function initTheme(d: ThemeControllerDeps): { readonly theme: Theme; readonly colors: FieldColors; dispose(): void } {
  const { doc, storage, systemDark, button, onChange } = d;
  const root = doc.documentElement;
  const metas = Array.from(doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  const originalMeta = metas.map((m) => m.content); // #f2f6fe (light) and #050a22 (dark), restored for 'system'

  let pref: ThemePref = readPref(storage);
  let theme: Theme = resolveTheme(pref, systemDark.matches);
  let animTimer: ReturnType<typeof setTimeout> | undefined;

  const applyAttribute = (): void => {
    if (pref === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', pref);
  };
  const applyMetas = (): void => {
    if (pref === 'system') {
      metas.forEach((m, i) => {
        m.content = originalMeta[i];
      });
      return;
    }
    const color = rootStyle(doc)?.getPropertyValue('--theme-color').trim() ?? '';
    if (color) metas.forEach((m) => (m.content = color));
  };
  const applyLabel = (): void => {
    const { word: target, label } = toggleLabel(theme);
    button?.setAttribute('data-to', target); // CSS shows the sun for 'light' and the moon for 'dark' (12.20)
    button?.setAttribute('aria-label', label);
  };
  const startAnim = (): void => {
    root.classList.add('theme-anim');
    clearTimeout(animTimer);
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), ANIM_CLASS_MS);
  };

  // 4.6.7 initial state: data-theme again (idempotent with theme-boot.js), metas when explicit, icon and label, then show
  applyAttribute();
  if (pref !== 'system') applyMetas();
  applyLabel();
  if (button) button.hidden = false;
  let colors: FieldColors = readFieldColors(doc);

  // 4.6.5: a press runs steps 1-7
  const onPress = (): void => {
    startAnim(); // 1 (step 7 is the timer it re-arms)
    pref = togglePref(theme, systemDark.matches); // 2
    theme = resolveTheme(pref, systemDark.matches);
    applyAttribute();
    writePref(storage, pref); // 3
    colors = readFieldColors(doc); // 4
    onChange(colors, true);
    applyMetas(); // 5
    applyLabel(); // 6
  };
  // an OS change while the pref is 'system' runs steps 1, 4, 5, 6 and 7
  const onSystemChange = (): void => {
    if (pref !== 'system') return;
    startAnim();
    theme = resolveTheme(pref, systemDark.matches);
    colors = readFieldColors(doc);
    onChange(colors, true);
    applyMetas();
    applyLabel();
  };

  button?.addEventListener('click', onPress);
  systemDark.addEventListener('change', onSystemChange);

  return {
    get theme(): Theme {
      return theme;
    },
    get colors(): FieldColors {
      return colors;
    },
    dispose(): void {
      button?.removeEventListener('click', onPress);
      systemDark.removeEventListener('change', onSystemChange);
      clearTimeout(animTimer);
      root.classList.remove('theme-anim');
    },
  };
}
