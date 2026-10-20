/**
 * Footer clock (spec 3.5.13): America/Los_Angeles, 12-hour, written "2:36 PM PDT". Built from formatToParts,
 * never from format(), because ICU 72+ puts U+202F before AM/PM and that glyph is not in the font subset.
 */
export function formatClock(
  date: Date,
  timeZone = 'America/Los_Angeles',
  locale = 'en-US',
): { time: string; zone: string; datetime: string } {
  const get = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const twelve = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(date);
  const h23 = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return {
    time: `${get(twelve, 'hour')}:${get(twelve, 'minute')} ${get(twelve, 'dayPeriod').toUpperCase()}`,
    zone: get(twelve, 'timeZoneName'),
    datetime: `${get(h23, 'hour')}:${get(h23, 'minute')}`,
  };
}

/** Milliseconds until the next minute boundary: 60000 - (seconds * 1000 + milliseconds). */
export function msToNextMinute(date: Date): number {
  return 60_000 - (date.getUTCSeconds() * 1000 + date.getUTCMilliseconds());
}

/**
 * Writes "2:36 PM PDT" and the 24-hour datetime into the <time>, then re-arms 25 ms after each minute boundary.
 * A visibilitychange to visible rewrites at once and re-arms. Never a live region. Returns stop.
 */
export function startClock(el: HTMLTimeElement, timeZone: string, now: () => Date = () => new Date()): () => void {
  const doc = el.ownerDocument;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const write = (): void => {
    const date = now();
    const { time, zone, datetime } = formatClock(date, timeZone);
    el.textContent = `${time} ${zone}`;
    el.setAttribute('datetime', datetime);
    clearTimeout(timer);
    timer = setTimeout(write, msToNextMinute(date) + 25);
  };
  const onVisibility = (): void => {
    if (doc.visibilityState === 'visible') write();
  };
  write();
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
