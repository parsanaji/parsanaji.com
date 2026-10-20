import { describe, expect, it } from 'vitest';
import { initLinks } from '../src/ui/links';

// A document that knows a few selectors; anything else is missing.
const fakeDoc = (nodes: Record<string, object>) =>
  ({ querySelector: (selector: string) => nodes[selector] ?? null }) as unknown as Document;

describe('initLinks (3.1.12, 11.22)', () => {
  it('reports no LinkedIn and leaves the overlay row hidden while the URL is empty', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-link="linkedin"]': {}, '[data-key="linkedin"]': row });
    expect(initLinks('', doc)).toEqual({ linkedin: false });
    expect(row.hidden).toBe(true);
  });

  it('reports LinkedIn and shows the overlay row when the URL and the anchor exist', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-link="linkedin"]': {}, '[data-key="linkedin"]': row });
    expect(initLinks('https://www.linkedin.com/in/example', doc)).toEqual({ linkedin: true });
    expect(row.hidden).toBe(false);
  });

  it('reports no LinkedIn when the URL exists but the anchor does not', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-key="linkedin"]': row });
    expect(initLinks('https://www.linkedin.com/in/example', doc)).toEqual({ linkedin: false });
    expect(row.hidden).toBe(true);
  });

  it('never throws on missing elements', () => {
    expect(initLinks('https://www.linkedin.com/in/example', fakeDoc({ '[data-link="linkedin"]': {} }))).toEqual({
      linkedin: true,
    });
    expect(initLinks('', fakeDoc({}))).toEqual({ linkedin: false });
  });
});
