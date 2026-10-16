export interface ClockParts {
  time: string;
  zone: string;
}

export function formatClock(date: Date, timeZone = 'America/Los_Angeles', locale = 'en-US'): ClockParts {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? '';
  return { time: `${get('hour')}:${get('minute')}`, zone: get('timeZoneName') };
}

/** Writes the time every second and resyncs when the tab becomes visible. Returns a stop function. */
export function startClock(
  timeEl: HTMLElement,
  zoneEl: HTMLElement,
  timeZone: string,
  now: () => Date = () => new Date(),
): () => void {
  const render = (): void => {
    const { time, zone } = formatClock(now(), timeZone);
    timeEl.textContent = time;
    zoneEl.textContent = zone;
  };
  render();
  const id = window.setInterval(render, 1000);
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') render();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
