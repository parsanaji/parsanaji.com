import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// public/theme-boot.js runs before first paint as a classic script (spec 4.6.2, 8.1.11).
const SOURCE = readFileSync('public/theme-boot.js', 'utf8').replace(/\r\n/g, '\n');

interface BootEnv {
  stored?: string | null;
  storageThrows?: boolean;
  reduced?: boolean;
  forced?: boolean;
  matchMediaThrows?: boolean;
  search?: string;
}

function boot(env: BootEnv = {}): Map<string, string> {
  const attrs = new Map<string, string>();
  const documentElement = {
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
  };
  const localStorage = {
    getItem: (key: string): string | null => {
      if (env.storageThrows) throw new Error('SecurityError');
      return key === 'pn.theme' ? (env.stored ?? null) : null;
    },
  };
  const matchMedia = (query: string): { matches: boolean } => {
    if (env.matchMediaThrows) throw new Error('no matchMedia');
    if (query === '(prefers-reduced-motion: reduce)') return { matches: env.reduced ?? false };
    if (query === '(forced-colors: active)') return { matches: env.forced ?? false };
    throw new Error(`unexpected query ${query}`);
  };
  runInNewContext(SOURCE, {
    document: { documentElement },
    localStorage,
    window: { matchMedia },
    location: { search: env.search ?? '' },
  });
  return attrs;
}

describe('theme-boot.js', () => {
  it('applies a stored light look and arms the entry', () => {
    const attrs = boot({ stored: 'light' });
    expect(attrs.get('data-theme')).toBe('light');
    expect(attrs.get('data-entry')).toBe('run');
  });

  it('applies a stored dark look', () => {
    expect(boot({ stored: 'dark' }).get('data-theme')).toBe('dark');
  });

  it('ignores garbage and a missing key (the OS decides)', () => {
    expect(boot({ stored: 'sepia' }).has('data-theme')).toBe(false);
    expect(boot({ stored: null }).has('data-theme')).toBe(false);
    expect(boot({ stored: 'sepia' }).get('data-entry')).toBe('run');
  });

  it('never arms the entry under reduced motion (3.4.10)', () => {
    expect(boot({ reduced: true }).has('data-entry')).toBe(false);
  });

  it('never arms the entry under forced colours (11.14)', () => {
    expect(boot({ forced: true }).has('data-entry')).toBe(false);
  });

  it('never arms the entry with ?noentry', () => {
    expect(boot({ search: '?noentry' }).has('data-entry')).toBe(false);
    expect(boot({ search: '?seed=3&noentry' }).has('data-entry')).toBe(false);
    expect(boot({ search: '?noentryx' }).get('data-entry')).toBe('run');
  });

  it('survives a throwing localStorage and a throwing matchMedia', () => {
    let attrs = new Map<string, string>();
    expect(() => {
      attrs = boot({ storageThrows: true });
    }).not.toThrow();
    expect(attrs.has('data-theme')).toBe(false);
    expect(attrs.get('data-entry')).toBe('run');
    expect(() => boot({ matchMediaThrows: true, stored: 'dark' })).not.toThrow();
    expect(boot({ matchMediaThrows: true, stored: 'dark' }).get('data-theme')).toBe('dark');
  });

  it('is small, uses no innerHTML or eval, and reads only the pn.theme key', () => {
    expect(SOURCE.length).toBeLessThan(500);
    expect(SOURCE).not.toMatch(/innerHTML|eval\(/);
    expect(SOURCE).toContain("localStorage.getItem('pn.theme')");
  });
});
