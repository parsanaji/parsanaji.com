import { describe, expect, it } from 'vitest';
import { formatClock } from '../src/ui/clock';

describe('formatClock', () => {
  it('renders 24-hour Los Angeles time with the PDT abbreviation in summer', () => {
    expect(formatClock(new Date('2026-10-16T07:08:00Z'))).toEqual({ time: '00:08', zone: 'PDT' });
  });

  it('switches to PST in winter', () => {
    expect(formatClock(new Date('2026-01-15T20:05:00Z'))).toEqual({ time: '12:05', zone: 'PST' });
  });

  it('never renders midnight as 24:xx', () => {
    expect(formatClock(new Date('2026-07-01T07:00:00Z')).time).toBe('00:00');
  });

  it('respects an explicit time zone', () => {
    expect(formatClock(new Date('2026-07-01T12:00:00Z'), 'UTC').time).toBe('12:00');
  });
});
