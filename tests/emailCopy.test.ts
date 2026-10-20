import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText, initEmailCopy } from '../src/ui/emailCopy';

const EMAIL = 'info@parsanaji.com';

class FakeLink extends EventTarget {
  readonly attrs = new Map<string, string>();
  setAttribute(k: string, v: string): void {
    this.attrs.set(k, v);
  }
  removeAttribute(k: string): void {
    this.attrs.delete(k);
  }
  hasAttribute(k: string): boolean {
    return this.attrs.has(k);
  }
}

type ClickInit = Partial<Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>>;
const click = (init: ClickInit = {}): Event =>
  Object.assign(new Event('click', { cancelable: true }), {
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...init,
  });

const setup = (deps: Parameters<typeof initEmailCopy>[2] = {}) => {
  const link = new FakeLink();
  const live = { textContent: '' };
  const assign = vi.fn();
  const handle = initEmailCopy(link as unknown as HTMLAnchorElement, EMAIL, {
    assign,
    live: live as unknown as HTMLElement,
    ...deps,
  });
  return { link, live, assign, handle };
};

const ok = () => ({ writeText: vi.fn(() => Promise.resolve()) });

describe('copyText', () => {
  it('copies through writeText', async () => {
    const clipboard = ok();
    await expect(copyText(EMAIL, clipboard)).resolves.toBe('copied');
    expect(clipboard.writeText).toHaveBeenCalledWith(EMAIL);
  });

  it('falls back when the clipboard refuses, throws or is missing', async () => {
    await expect(copyText(EMAIL, { writeText: () => Promise.reject(new Error('denied')) })).resolves.toBe('fallback');
    const throwing = {
      writeText: (): Promise<void> => {
        throw new Error('sync');
      },
    };
    await expect(copyText(EMAIL, throwing)).resolves.toBe('fallback');
    await expect(copyText(EMAIL, undefined)).resolves.toBe('fallback');
    await expect(copyText(EMAIL, {} as Pick<Clipboard, 'writeText'>)).resolves.toBe('fallback');
  });
});

describe('initEmailCopy (3.5.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds aria-describedby="email-hint" at init', () => {
    const { link } = setup({ clipboard: ok() });
    expect(link.attrs.get('aria-describedby')).toBe('email-hint');
  });

  it('shows "copied" for 1200 ms and announces it on the next frame for 3000 ms', async () => {
    const { link, live, handle } = setup({ clipboard: ok() });
    live.textContent = 'stale';
    await expect(handle.trigger()).resolves.toBe('copied');
    expect(link.hasAttribute('data-copied')).toBe(true);
    expect(live.textContent).toBe('');
    vi.advanceTimersByTime(0); // Node has no requestAnimationFrame: the next frame is setTimeout(…, 0)
    expect(live.textContent).toBe('Email address copied.');
    vi.advanceTimersByTime(1199);
    expect(link.hasAttribute('data-copied')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(link.hasAttribute('data-copied')).toBe(false);
    vi.advanceTimersByTime(1799);
    expect(live.textContent).toBe('Email address copied.');
    vi.advanceTimersByTime(1);
    expect(live.textContent).toBe('');
  });

  it('restarts the 1200 ms hold on a second copy', async () => {
    const { link, handle } = setup({ clipboard: ok() });
    await handle.trigger();
    vi.advanceTimersByTime(1000);
    await handle.trigger();
    vi.advanceTimersByTime(1000);
    expect(link.hasAttribute('data-copied')).toBe(true);
    vi.advanceTimersByTime(200);
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('falls back to mailto: when writeText rejects', async () => {
    const { link, assign, handle } = setup({ clipboard: { writeText: () => Promise.reject(new Error('denied')) } });
    await expect(handle.trigger()).resolves.toBe('fallback');
    expect(assign).toHaveBeenCalledWith('mailto:info@parsanaji.com');
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('falls back to mailto: without a clipboard', async () => {
    const { assign, handle } = setup({ clipboard: undefined });
    await expect(handle.trigger()).resolves.toBe('fallback');
    expect(assign).toHaveBeenCalledWith('mailto:info@parsanaji.com');
  });

  it('honours the holdMs option', async () => {
    const { link, handle } = setup({ clipboard: ok(), holdMs: 500 });
    await handle.trigger();
    vi.advanceTimersByTime(500);
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('takes over an unmodified primary click and keeps the native mailto: otherwise', () => {
    const clipboard = ok();
    const { link } = setup({ clipboard });
    const plain = click();
    link.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const e = click(init);
      link.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
    }
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it('dispose() removes the click handler and the timers', async () => {
    const clipboard = ok();
    const { link, handle } = setup({ clipboard });
    await handle.trigger();
    handle.dispose();
    const e = click();
    link.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
