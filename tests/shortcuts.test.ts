import { describe, expect, it } from 'vitest';
import { initShortcuts, shortcutFor, type KeyLike, type ShortcutAction } from '../src/eggs/shortcuts';

const key = (k: string, extra: Partial<KeyLike> = {}): KeyLike => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  target: null,
  ...extra,
});
const ON = { linkedin: true };
const OFF = { linkedin: false };

/** A keydown as Node can build it: an Event carrying the KeyboardEvent fields the module reads. */
function keydown(k: string, mods: Partial<Pick<KeyLike, 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>> = {}): Event {
  return Object.assign(new Event('keydown'), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...mods });
}

describe('shortcutFor (spec 3.5.4, 8.1.15)', () => {
  it('maps g, l, e, ? and Escape', () => {
    expect(shortcutFor(key('g'), ON)).toBe('github');
    expect(shortcutFor(key('l'), ON)).toBe('linkedin');
    expect(shortcutFor(key('e'), ON)).toBe('email');
    expect(shortcutFor(key('?'), ON)).toBe('overlay');
    expect(shortcutFor(key('Escape'), ON)).toBe('close');
  });

  it('maps upper-case G, L and E like lower case (Caps Lock)', () => {
    expect(shortcutFor(key('G'), ON)).toBe('github');
    expect(shortcutFor(key('L'), ON)).toBe('linkedin');
    expect(shortcutFor(key('E'), ON)).toBe('email');
  });

  it('returns null for l while LinkedIn is absent (3.1.12)', () => {
    expect(shortcutFor(key('l'), OFF)).toBeNull();
    expect(shortcutFor(key('L'), OFF)).toBeNull();
    expect(shortcutFor(key('g'), OFF)).toBe('github');
  });

  it('ignores Ctrl, Meta and Alt chords and allows Shift', () => {
    expect(shortcutFor(key('g', { ctrlKey: true }), ON)).toBeNull();
    expect(shortcutFor(key('g', { metaKey: true }), ON)).toBeNull();
    expect(shortcutFor(key('?', { altKey: true }), ON)).toBeNull();
    const shifted = { ...key('?'), shiftKey: true };
    expect(shortcutFor(shifted, ON)).toBe('overlay');
  });

  it('ignores auto-repeat', () => {
    expect(shortcutFor(key('e', { repeat: true }), ON)).toBeNull();
  });

  it('ignores editable targets', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'input']) {
      expect(shortcutFor(key('g', { target: { tagName } as unknown as EventTarget }), ON)).toBeNull();
    }
    const editable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget;
    expect(shortcutFor(key('e', { target: editable }), ON)).toBeNull();
    const link = { tagName: 'A', isContentEditable: false } as unknown as EventTarget;
    expect(shortcutFor(key('e', { target: link }), ON)).toBe('email');
  });

  it('returns null for every other key', () => {
    for (const k of ['x', 'Enter', ' ', 'Tab', '/', 'ArrowUp', 'b', 'a']) expect(shortcutFor(key(k), ON)).toBeNull();
  });
});

describe('initShortcuts (spec 3.5.4)', () => {
  it('runs the mapped action for each document keydown and stops after dispose', () => {
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    const dispose = initShortcuts(doc as unknown as Document, (a) => ran.push(a), OFF);
    doc.dispatchEvent(keydown('g'));
    doc.dispatchEvent(keydown('l'));
    doc.dispatchEvent(keydown('E'));
    doc.dispatchEvent(keydown('?', { ctrlKey: true }));
    doc.dispatchEvent(keydown('Escape'));
    expect(ran).toEqual(['github', 'email', 'close']);
    dispose();
    doc.dispatchEvent(keydown('g'));
    expect(ran).toEqual(['github', 'email', 'close']);
  });

  it('ignores a keydown without a string key (a synthetic event) and never throws', () => {
    expect(shortcutFor(key(undefined as unknown as string), ON)).toBeNull();
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    const dispose = initShortcuts(doc as unknown as Document, (a) => ran.push(a), ON);
    expect(() => doc.dispatchEvent(new Event('keydown'))).not.toThrow();
    doc.dispatchEvent(keydown('g'));
    expect(ran).toEqual(['github']);
    dispose();
  });
});
