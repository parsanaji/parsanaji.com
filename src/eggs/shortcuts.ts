/** Keyboard shortcuts (spec 3.5.4, R12a): g GitHub, l LinkedIn, e copy email, ? overlay, Escape close. */
export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  target: EventTarget | null;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** input, textarea, select and [contenteditable] targets keep their keys (3.5.4). */
function isEditable(target: EventTarget | null): boolean {
  const el = target as { tagName?: unknown; isContentEditable?: unknown } | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return EDITABLE_TAGS.has(el.tagName.toUpperCase()) || el.isContentEditable === true;
}

/**
 * Maps one keydown to an action. Ctrl, Meta and Alt chords, auto-repeat and editable targets map to
 * null; Shift is allowed (`?` needs it on US layouts, Caps Lock gives `G`). `?` is matched on
 * event.key, so any layout works. `l` maps only while the LinkedIn link exists (3.1.12).
 */
export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isEditable(e.target)) return null;
  switch (e.key) {
    case 'g':
    case 'G':
      return 'github';
    case 'l':
    case 'L':
      return opts.linkedin ? 'linkedin' : null;
    case 'e':
    case 'E':
      return 'email';
    case '?':
      return 'overlay';
    case 'Escape':
      return 'close';
    default:
      return null;
  }
}

/** One keydown listener on the document (3.5.4). Returns the function that removes it. */
export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    const action = shortcutFor(e, opts);
    if (action !== null) run(action);
  };
  doc.addEventListener('keydown', onKeyDown);
  return () => doc.removeEventListener('keydown', onKeyDown);
}
