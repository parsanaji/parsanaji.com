import { describe, expect, it } from 'vitest';

describe('runtime environment', () => {
  it('runs on Node 22.18 or newer (type stripping for scripts/og-image.mjs, spec 4.1.3)', () => {
    const [major, minor] = process.versions.node.split('.').map(Number);
    expect(major > 22 || (major === 22 && minor >= 18)).toBe(true);
  });

  it('has full ICU time-zone data for America/Los_Angeles', () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    }).formatToParts(new Date('2026-07-01T12:00:00Z'));
    expect(parts.find((p) => p.type === 'timeZoneName')?.value).toBe('PDT');
  });

  it('exposes fetch and process.loadEnvFile for the scripts', () => {
    expect(typeof fetch).toBe('function');
    expect(typeof process.loadEnvFile).toBe('function');
  });
});
