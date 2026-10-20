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

  it('initShortcuts maps ?, Escape and g without an overlay', () => {
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    initShortcuts(doc as unknown as Document, (a) => ran.push(a), { linkedin: false });
    for (const k of ['g', '?', 'Escape']) {
      doc.dispatchEvent(Object.assign(new Event('keydown'), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false }));
    }
    expect(ran).toEqual(['github', 'overlay', 'close']);
  });
});
