import { defineConfig, type Plugin } from 'vite';

/**
 * lil-gui's stylesheet embeds its three-glyph icon font (▾ ↕ ✓) as a data: URL. The site's CSP (public/_headers,
 * `font-src 'self'`) blocks it on previews, which logs a console error on ?debug pages (spec 4.12.2 says the panel logs
 * nothing at warning or error level; amendment 12.10). Without the rule the three glyphs fall back to the system font.
 */
export function stripIconFont(code: string): string | null {
  const re = /@font-face\s*\{[^}]*font-family:\s*"lil-gui"[^}]*url\("data:[^}]*\}\n?/;
  return re.test(code) ? code.replace(re, '') : null;
}

/** Runs before Vite's CSS pipeline, only on lil-gui's stylesheet (which only the ?debug panel imports). */
export function lilGuiCss(): Plugin {
  return {
    name: 'pn-lil-gui-css',
    enforce: 'pre',
    transform(code, id) {
      if (!/lil-gui[\\/]dist[\\/]lil-gui\.css$/.test(id.split('?')[0])) return null;
      const out = stripIconFont(code);
      return out === null ? null : { code: out, map: null };
    },
  };
}

export default defineConfig({
  plugins: [lilGuiCss()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
