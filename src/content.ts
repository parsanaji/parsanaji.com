/**
 * The JS copy of the facts the scripts need (spec 4.3). index.html stays the source of every visible string;
 * tests/content.test.ts keeps the two equal. LinkedIn set 2026-10-21 (3.1.12).
 */
export const CONTENT: {
  readonly name: 'Parsa Naji';
  readonly email: 'info@parsanaji.com';
  readonly konamiText: 'nice.';
  readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string };
  readonly clock: { readonly timeZone: 'America/Los_Angeles' };
} = {
  name: 'Parsa Naji',
  email: 'info@parsanaji.com',
  konamiText: 'nice.',
  links: { github: 'https://github.com/parsanaji', linkedin: 'https://www.linkedin.com/in/parsa-naji-b349a325a/' },
  clock: { timeZone: 'America/Los_Angeles' },
};
