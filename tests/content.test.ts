import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content';

// index.html is the source of every visible string (spec 3.1.3-3.1.5); CONTENT is the JS copy (4.3).
const HTML = readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const LIVE = HTML.replace(/<!--[\s\S]*?-->/g, ''); // markup without HTML comments (the parked LinkedIn <li>)
const head = LIVE.slice(LIVE.indexOf('<head>'), LIVE.indexOf('</head>'));
const body = LIVE.slice(LIVE.indexOf('<body>'), LIVE.indexOf('</body>'));

const textOf = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const all = (re: RegExp, s: string): string[] => [...s.matchAll(re)].map((m) => m[1]);

const ld = JSON.parse(all(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, LIVE)[0]) as Record<string, unknown>;

describe('index.html copy (3.1.3)', () => {
  it('has the name, tagline and eyebrows in order', () => {
    expect(body).toContain('<h1 class="name" data-name>Parsa Naji</h1>');
    expect(body).toContain('<p class="tagline">I build AI agents, apps, and the systems behind them.</p>');
    expect(all(/<h2 class="eyebrow" id="h-\w+">([^<]+)<\/h2>/g, body)).toEqual(['Experience', 'Projects', 'Education', 'Misc']);
  });

  it('has every row, in order, with the sr-only date phrases', () => {
    expect(all(/<li class="row">([\s\S]*?)<\/li>/g, body).map(textOf)).toEqual([
      '2025 — to present Software Developer Koreex Systems',
      '2026 — to present AI Specialist / Developer Expedient Labs',
      '2025 Calculus Tutor Saddleback College',
      'parsanaji.com This site. WebGL2 dash field.',
      'SolScope Microcap cryptocurrency tracker.',
      'Kaptur Business expense tracker for trades.',
      'Mafia Family and friends game.',
      '2025 — to 2026 Saddleback College Business Administration',
    ]);
  });

  it('has the seven misc tags in order, with & written &amp;', () => {
    const tags = body.slice(body.indexOf('<ul class="tags"'), body.indexOf('</ul>', body.indexOf('<ul class="tags"')));
    expect(all(/<li>([^<]+)<\/li>/g, tags)).toEqual([
      'Agentic Workflows',
      'Multi-Agent Orchestration',
      'Prompt &amp; Context Engineering',
      'LLM Cost and Token Optimization',
      'WebGL &amp; shaders',
      'iOS/macOS',
      'Swift',
    ]);
    expect(HTML).not.toMatch(/&(?!amp;|#)/);
  });

  it('has the links, status, footer, hint, live region and overlay copy', () => {
    expect(body).toContain('<a class="lnk" href="https://github.com/parsanaji" rel="me" data-link="github">github</a>');
    expect(body).toContain(
      '<a class="lnk" href="mailto:info@parsanaji.com" data-email="info@parsanaji.com"><span class="swap"><span class="swap-main">say hi</span><span class="swap-alt">copied</span></span></a>',
    );
    expect(body).toContain('<span id="email-hint" hidden>Copies info@parsanaji.com to the clipboard.</span>');
    expect(body).toContain('<p class="status" data-reveal="6"><span class="dot" aria-hidden="true"></span>Building something new</p>');
    expect(body).toContain('<p class="place" data-reveal="7">Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span></p>');
    expect(body).toContain('<p class="sr-only" data-live role="status" aria-live="polite" aria-atomic="true"></p>');
    expect(body).toContain('<dialog class="keys" data-keys aria-labelledby="keys-title" closedby="any">');
    expect(body).toContain('<h2 class="eyebrow" id="keys-title">Shortcuts</h2>');
    expect(all(/<dd>([^<]+)<\/dd>/g, body)).toEqual(['GitHub', 'LinkedIn', 'Copy email', 'Show or hide this list', 'Close']);
    expect(body).toContain('<div data-key="linkedin" hidden>');
    expect(body).toContain('<button class="lnk keys-close" type="button" data-keys-close>close</button>');
  });
});

describe('index.html DOM contract (4.3.2, 3.1.4)', () => {
  it('has the canvas, scrim and rail hooks', () => {
    expect(body).toContain('<canvas class="field" data-field aria-hidden="true"></canvas>');
    expect(body).toContain('<div class="scrim" aria-hidden="true"></div>');
    expect(body).toContain('<main class="rail" data-rail>');
  });

  it('has the toggle as the last child of main: data-reveal 0, hidden, no aria-label, no aria-pressed', () => {
    expect(body).toMatch(
      /<button class="theme-toggle" type="button" data-theme-toggle data-reveal="0" hidden><span class="theme-word" data-theme-word><\/span><\/button>\n {2}<\/main>/,
    );
    expect(HTML).not.toContain('aria-pressed');
    expect(body.slice(body.indexOf('<button class="theme-toggle"'))).not.toMatch(/^<button[^>]*aria-label/);
  });

  it('uses data-reveal values 0 to 7 exactly (0 = intro and toggle)', () => {
    const values = all(/data-reveal="(\d+)"/g, body).map(Number);
    expect(values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0]);
  });

  it('has no LinkedIn element while CONTENT.links.linkedin is empty, and the link when it is set (3.1.12)', () => {
    if (CONTENT.links.linkedin) {
      expect(body).toContain(`<a class="lnk" href="${CONTENT.links.linkedin}" rel="me" data-link="linkedin">linkedin</a>`);
    } else {
      expect(LIVE).not.toContain('data-link="linkedin"');
      expect(HTML).toContain('data-link="linkedin"'); // the parked <li> survives as an HTML comment
    }
  });

  it('keeps the HTML values equal to CONTENT', () => {
    expect(body).toContain(`<h1 class="name" data-name>${CONTENT.name}</h1>`);
    expect(body).toContain(`href="mailto:${CONTENT.email}" data-email="${CONTENT.email}"`);
    expect(body).toContain(`href="${CONTENT.links.github}" rel="me" data-link="github"`);
    expect(ld.name).toBe(CONTENT.name);
    expect(CONTENT.konamiText).toBe('nice.');
    expect(CONTENT.clock.timeZone).toBe('America/Los_Angeles');
  });
});

describe('index.html head and CSP rules (5.2, 4.6.1, 4.6.2)', () => {
  it('loads theme-boot.js as a classic script right after the viewport meta, before the stylesheet', () => {
    expect(head).toMatch(
      /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n {2}<script src="\/theme-boot.js"><\/script>\n/,
    );
    expect(head.indexOf('<script src="/theme-boot.js">')).toBeLessThan(head.indexOf('<link rel="stylesheet" href="/src/styles.css">'));
  });

  it('has exactly two script files and the module entry last in body', () => {
    expect(all(/<script[^>]*\ssrc="([^"]+)"/g, LIVE)).toEqual(['/theme-boot.js', '/src/main.ts']);
    expect(body.trimEnd().endsWith('<script type="module" src="/src/main.ts"></script>')).toBe(true);
  });

  it('has no inline script other than the JSON-LD data block, no <style> and no style attribute', () => {
    const inline = [...LIVE.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter((m) => m[2].trim() !== '');
    expect(inline.map((m) => m[1].trim())).toEqual(['type="application/ld+json"']);
    expect(LIVE).not.toMatch(/<style[\s>]/);
    expect(LIVE).not.toMatch(/\sstyle\s*=/);
  });

  it('has the JSON-LD of 5.2.1 with no email key', () => {
    expect(ld).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Parsa Naji',
      url: 'https://parsanaji.com/',
      jobTitle: ['Software Developer', 'AI Specialist / Developer'],
      sameAs: [CONTENT.links.github, ...(CONTENT.links.linkedin ? [CONTENT.links.linkedin] : [])],
    });
    expect(ld).not.toHaveProperty('email');
  });

  it('has the 5.2.2 metadata', () => {
    const tagline = 'I build AI agents, apps, and the systems behind them.';
    const alt = 'Parsa Naji, I build AI agents, apps, and the systems behind them, over a field of blue dashes.';
    for (const tag of [
      '<html lang="en">',
      '<title>Parsa Naji</title>',
      `<meta name="description" content="${tagline}">`,
      '<meta name="author" content="Parsa Naji">',
      '<meta name="color-scheme" content="light dark">',
      '<meta name="theme-color" content="#f2f6fe" media="(prefers-color-scheme: light)">',
      '<meta name="theme-color" content="#050a22" media="(prefers-color-scheme: dark)">',
      '<link rel="canonical" href="https://parsanaji.com/">',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="Parsa Naji">',
      '<meta property="og:title" content="Parsa Naji">',
      `<meta property="og:description" content="${tagline}">`,
      '<meta property="og:url" content="https://parsanaji.com/">',
      '<meta property="og:image" content="https://parsanaji.com/og.png">',
      '<meta property="og:image:type" content="image/png">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      `<meta property="og:image:alt" content="${alt}">`,
      '<meta property="og:locale" content="en_US">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="Parsa Naji">',
      `<meta name="twitter:description" content="${tagline}">`,
      '<meta name="twitter:image" content="https://parsanaji.com/og.png">',
      `<meta name="twitter:image:alt" content="${alt}">`,
      '<link rel="preload" href="/fonts/JetBrainsMono-Regular.subset.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="preload" href="/fonts/JetBrainsMono-Bold.subset.woff2" as="font" type="font/woff2" crossorigin>',
    ]) {
      expect(LIVE).toContain(tag);
    }
  });

  it('lists the PNG icons first and the SVG as the last rel="icon" (5.2.2)', () => {
    expect(all(/<link rel="icon" href="([^"]+)"/g, head)).toEqual(['/favicon-32.png', '/favicon-192.png', '/favicon.svg']);
  });
});
