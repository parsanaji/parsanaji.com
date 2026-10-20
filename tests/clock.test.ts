import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatClock, msToNextMinute, startClock } from '../src/ui/clock';

describe('formatClock (3.5.13)', () => {
  it('renders 14:36 PDT as 2:36 PM with a 24-hour datetime', () => {
    expect(formatClock(new Date('2026-07-01T21:36:00Z'))).toEqual({ time: '2:36 PM', zone: 'PDT', datetime: '14:36' });
  });

  it('renders midnight as 12:00 AM and noon as 12:00 PM', () => {
    expect(formatClock(new Date('2026-07-01T07:00:00Z'))).toEqual({ time: '12:00 AM', zone: 'PDT', datetime: '00:00' });
    expect(formatClock(new Date('2026-07-01T19:00:00Z'))).toEqual({ time: '12:00 PM', zone: 'PDT', datetime: '12:00' });
  });

  it('switches to PST in winter', () => {
    expect(formatClock(new Date('2026-01-15T20:05:00Z'))).toEqual({ time: '12:05 PM', zone: 'PST', datetime: '12:05' });
  });

  it('writes the hour without a leading zero and the minute with one', () => {
    expect(formatClock(new Date('2026-01-15T17:07:00Z')).time).toBe('9:07 AM');
  });

  it('uses ASCII spaces only, never U+202F, so every glyph is in the font subset', () => {
    for (let h = 0; h < 24; h++) {
      const { time, zone } = formatClock(new Date(Date.UTC(2026, 6, 1, h, 5)));
      const text = `${time} ${zone}`;
      expect(text).not.toContain(' ');
      expect([...text].every((c) => c >= ' ' && c <= '~')).toBe(true);
    }
  });

  it('respects an explicit time zone', () => {
    expect(formatClock(new Date('2026-07-01T12:00:00Z'), 'UTC')).toEqual({ time: '12:00 PM', zone: 'UTC', datetime: '12:00' });
  });
});

describe('msToNextMinute', () => {
  it('is 60000 minus the elapsed part of the minute', () => {
    expect(msToNextMinute(new Date('2026-07-01T21:36:30.250Z'))).toBe(29_750);
    expect(msToNextMinute(new Date('2026-07-01T21:36:00.000Z'))).toBe(60_000);
    expect(msToNextMinute(new Date('2026-07-01T21:36:59.999Z'))).toBe(1);
  });
});

describe('startClock', () => {
  class FakeDoc extends EventTarget {
    visibilityState: DocumentVisibilityState = 'visible';
  }
  const fakeTime = (doc: FakeDoc) => {
    const attrs = new Map<string, string>();
    const el = { textContent: '', ownerDocument: doc, setAttribute: (k: string, v: string) => void attrs.set(k, v) };
    return { el: el as unknown as HTMLTimeElement, attrs, text: () => el.textContent };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T21:36:30.000Z')); // 2:36:30 PM PDT
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes at once, then 25 ms after each minute boundary', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    startClock(t.el, 'America/Los_Angeles');
    expect(t.text()).toBe('2:36 PM PDT');
    expect(t.attrs.get('datetime')).toBe('14:36');
    vi.advanceTimersByTime(30_024);
    expect(t.text()).toBe('2:36 PM PDT');
    vi.advanceTimersByTime(1);
    expect(t.text()).toBe('2:37 PM PDT');
    expect(t.attrs.get('datetime')).toBe('14:37');
    vi.advanceTimersByTime(60_000);
    expect(t.text()).toBe('2:38 PM PDT');
  });

  it('rewrites when the tab becomes visible, not while hidden', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    startClock(t.el, 'America/Los_Angeles');
    vi.setSystemTime(new Date('2026-07-01T22:00:10.000Z')); // timers did not run (hidden tab)
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('2:36 PM PDT');
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('3:00 PM PDT');
  });

  it('stop() clears the timer and the listener', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    const stop = startClock(t.el, 'America/Los_Angeles');
    stop();
    vi.advanceTimersByTime(120_000);
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('2:36 PM PDT');
  });
});
