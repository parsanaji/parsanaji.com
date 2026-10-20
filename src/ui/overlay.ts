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
