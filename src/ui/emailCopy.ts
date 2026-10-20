/**
 * "say hi" (spec 3.5.3, 11.27): an unmodified primary click copies the address instead of opening the mail app.
 * Success shows "copied" in place for holdMs (data-copied) and announces it in the live region; a missing or
 * refusing clipboard falls back to the mailto: link, so a click is never dead.
 */
export type CopyResult = 'copied' | 'fallback';

const COPIED_SENTENCE = 'Email address copied.';

export async function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined): Promise<CopyResult> {
  if (!clipboard || typeof clipboard.writeText !== 'function') return 'fallback';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'fallback';
  }
}

export function initEmailCopy(
  link: HTMLAnchorElement,
  email: string,
  deps: {
    clipboard?: Pick<Clipboard, 'writeText'>;
    assign?: (url: string) => void;
    holdMs?: number;
    live?: HTMLElement | null;
  } = {},
): { trigger(): Promise<CopyResult>; dispose(): void } {
  const holdMs = deps.holdMs ?? 1200;
  const live = deps.live ?? null;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;
  let cancelFrame: (() => void) | null = null;

  link.setAttribute('aria-describedby', 'email-hint');

  const announce = (): void => {
    if (!live) return;
    clearTimeout(liveTimer);
    live.textContent = '';
    const write = (): void => {
      live.textContent = COPIED_SENTENCE;
      liveTimer = setTimeout(() => {
        live.textContent = '';
      }, 3000);
    };
    // the region is cleared first and written on the next frame, so a repeat copy is announced again
    cancelFrame?.();
    if (typeof globalThis.requestAnimationFrame === 'function') {
      const id = globalThis.requestAnimationFrame(write);
      cancelFrame = () => globalThis.cancelAnimationFrame(id);
    } else {
      const id = setTimeout(write, 0);
      cancelFrame = () => clearTimeout(id);
    }
  };

  const trigger = async (): Promise<CopyResult> => {
    // defaults are read at call time: the clipboard and location of the live page, never captured at import
    const clipboard = 'clipboard' in deps ? deps.clipboard : globalThis.navigator?.clipboard;
    const result = await copyText(email, clipboard);
    if (result === 'copied') {
      link.setAttribute('data-copied', '');
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => link.removeAttribute('data-copied'), holdMs);
      announce();
    } else {
      const assign = deps.assign ?? ((url: string) => globalThis.location.assign(url));
      try {
        assign(`mailto:${email}`);
      } catch {
        // navigation refused: nothing else to do, and production logs nothing (4.7.6)
      }
    }
    return result;
  };

  const onClick = (event: Event): void => {
    const e = event as MouseEvent;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // keep the native mailto:
    e.preventDefault();
    void trigger();
  };
  link.addEventListener('click', onClick);

  return {
    trigger,
    dispose(): void {
      link.removeEventListener('click', onClick);
      clearTimeout(holdTimer);
      clearTimeout(liveTimer);
      cancelFrame?.();
    },
  };
}
