# parsanaji.com — Theme Studio (design)

Date: 2026-10-21. Status: DRAFT for Parsa's read; nothing built. Parent spec: `2026-10-19-parsanaji-resume-screen-design.md` (the site, §3.2 Looks, §4.6 theme bootstrap, §4.10 OG + favicons) and Appendix B `B-palette.md` (Dither Blue tokens, contrast tables).

## 1. Intent

Parsa (2026-10-20 23:10 PDT): "maybe in the future I want to change the theme color … with the click of a button … red or green … come up with different themes … matching for a light mode and a dark mode, and … deploy it from that editing screen, like … a dev site."

So: a page where Parsa picks a hue, sees the real site in both looks with that hue, checks it reads, and ships it. No backend, no CMS. The site stays a static build deployed by GitHub Actions on push; the studio only produces the commit.

## 2. Goals, non-goals, anti-goals

Goals
- G1 One click from "I want green" to a commit on `main` that deploys the green site, light and dark both.
- G2 Every preset is a matched pair: the same hue drives the light column and the dark column, built from Dither Blue's lightness/chroma ladder, so the contrast relationships of §3.2.5 / Appendix B §2 hold for every preset.
- G3 What the studio shows is what ships: the preview applies the exact generated token CSS and the exact field colours the build will use.
- G4 Derived assets follow the theme: favicon (SVG + 3 PNGs), OG image, `theme-color` metas, the "blue dashes" words in the alt texts.
- G5 Production stays as hardened as today: production bundle unchanged in size, production `_headers` byte-for-byte unchanged, CI keeps `contents: read`.

Non-goals
- N1 Visitors choosing a hue. Visitors keep only the light/dark toggle. The theme is Parsa's voice, not a setting.
- N2 Editing text, links or layout in the studio. Content edits stay "Parsa tells me, I edit index.html" (ruling 2026-10-20). A content editor can reuse the studio's publish path later, but it is a separate design.
- N3 Multi-user, auth, roles. One owner, one machine.
- N4 Per-token hand-painting as the primary flow. The studio is a hue picker with an escape hatch (per-token overrides in JSON), not a colour editor.

Anti-goals (would make it a failure even if it works)
- A1 A theme that passes in dark and fails in light (or vice versa). The studio must refuse to publish a preset that fails any contrast row Dither Blue passes.
- A2 A secret in the repo or in the build. The GitHub token lives only in Parsa's browser storage.
- A3 Production serving studio code, or a looser CSP, because the studio exists.

## 3. Constraints (from the parent spec and the repo)

- C1 Static site. CSP `script-src 'self'`, `style-src 'self'`, `connect-src 'self' https://cloudflareinsights.com`, `frame-ancestors 'none'` (public/_headers). Scripts never write inline `style=""`; CSSOM and constructed stylesheets are allowed under this CSP and are what the studio uses.
- C2 Deploys only via `.github/workflows/deploy.yml` on push: non-`main` branches build with `VITE_PN_DEBUG=1` (the `?debug` panel and `window.__pn`), `main` builds with `0`. The job has `contents: read`, `persist-credentials: false`.
- C3 Colour today lives in exactly these places (map 2026-10-21): the token blocks of `src/styles.css` (dark `:root` 33–56; light three identical copies 57–80, 81–102, print 707–729; `@property` registrations 12–23; `:where(:root)` fallbacks 124–132); `index.html` lines 11–12 (`theme-color` metas) and the two alt texts ("blue dashes"); `scripts/og-image.mjs` lines 21–24 (`BG`, `TIER_HEX`, `NAME_HEX`, `TEXT2_HEX`); `public/favicon.svg` (navy `#050a22`, paper `#e8eeff`, dash `#3b5df0`); `src/eggs/greeting.ts:3` (console colour). The WebGL field reads its four colours from computed `--field-0..3` at runtime (`themeController.readFieldColors`), so the field needs no code change for a new hue.
- C4 Tests pin the token blocks verbatim (`tests/tokens.test.ts` DARK / LIGHT / PRINT_BLOCK, exact key sets), the metas and alts (`tests/content.test.ts`), the favicon strings (`tests/ogAsset.test.ts`) and the OG size (< 300 KB).
- C5 `npm run og` runs by hand (harfbuzzjs + sharp); CI never runs it (parent 4.10.1). Its outputs are committed.
- C6 Blueprint rules R2/R3/R4/R7/R11 of the design brief still bind: one screen, Dither-style field, premium first impression.

## 4. The model: a preset is one hue over the Dither Blue ladder

### 4.1 Tokens

The 20 look tokens of §3.2.1, per look (dark, light): `bg`, `fg`, `fg-2`, `accent`, `accent-2`, `accent-glow`, `line`, `scrim-solid`, `scrim-mid`, `scrim-clear`, `overlay-bg`, `overlay-border`, `field-0`, `field-1`, `field-2`, `field-3`, `selection-bg`, `selection-fg`, `theme-color`, plus `color-scheme`. The alpha tokens (`scrim-*`, `overlay-*`, `line`, `accent-glow`) are derived from a base colour and a fixed alpha exactly as today (scrim = bg, overlay-bg = bg at .94/.95, line = fg at .14, overlay-border = fg at .18, accent-glow = accent at .35/.25), so the model stores 10 opaque colours per look and derives the rest:

| opaque colour | dark (Dither Blue) | light (daylight) |
|---|---|---|
| bg = field-0 = theme-color | #050a22 | #f2f6fe |
| fg | #e8eeff | #071348 |
| fg-2 | #7993da | #445789 |
| accent | #8db0ff | #2848d7 |
| accent-2 | #5b81ff | #3656e8 |
| field-1 | #3b5df0 | #8db0ff |
| field-2 | #8db0ff | #3b5df0 |
| field-3 | #e8eeff | #0832b8 |
| selection-bg | #3b5df0 | #3b5df0 |
| selection-fg | #ffffff | #ffffff |

### 4.2 Derivation

`derive(hue, chroma = 1)`: every colour above is converted to OKLCH once (the "ladder": its L, C and its hue offset from the anchor `#3b5df0`, h ≈ 264°). A preset rotates every chromatic colour (C > 0.01) so the anchor lands on `hue`, keeps L, multiplies C by `chroma`, and gamut-maps to sRGB by reducing chroma until in gamut (CSS Color 4 method, L fixed). Whites (`#ffffff`) and the paper tints keep their tiny chroma and rotate with the rest, so a red preset's paper is faintly warm, like Dither Blue's paper is faintly cool. Output is `#rrggbb`. `derive(264, 1)` must reproduce the table above byte for byte (test).

Why OKLCH: equal L means equal perceived lightness across hues, so the contrast ratios move very little between presets; gamut mapping by chroma reduction keeps lightness, which is what WCAG contrast depends on.

### 4.3 Presets file (source of truth)

`src/theme/presets.json`
```json
{
  "version": 1,
  "active": "blue",
  "presets": [
    { "id": "blue",   "name": "Dither Blue", "hue": 264, "chroma": 1,    "word": "blue" },
    { "id": "red",    "name": "Ember",       "hue": 25,  "chroma": 1,    "word": "red" },
    { "id": "green",  "name": "Moss",        "hue": 150, "chroma": 0.9,  "word": "green" },
    { "id": "violet", "name": "Iris",        "hue": 300, "chroma": 1,    "word": "violet" },
    { "id": "amber",  "name": "Amber",       "hue": 70,  "chroma": 0.85, "word": "amber" },
    { "id": "teal",   "name": "Lagoon",      "hue": 195, "chroma": 0.9,  "word": "teal" }
  ]
}
```
Optional per preset: `"overrides": { "dark": { "accent": "#…" }, "light": { … } }` for hand fixes after derivation. `word` is the colour word written into the OG/Twitter alt texts ("over a field of red dashes."). Names and hues above are my starting picks; Parsa changes them in the studio.

### 4.4 Generated artifacts (one pure function each, shared by Node, tests and the browser)

`src/theme/generate.ts` (pure, no DOM):
- `tokensCss(preset)` → the full text of `src/theme/tokens.css`: `@property` registrations (initial = dark values), the dark `:root` block, the light block in its three places (`prefers-color-scheme` guard, `[data-theme="light"]`, `@media print`), `::selection`, the `:where(:root)` fallbacks, `html.theme-anim`. Same bytes as today's styles.css lines 12–132 and 707–729 for `blue` (test).
- `faviconSvg(preset)` → today's favicon with tile = dark.bg, glyph = dark.fg, dash = dark.field-1.
- `ogColors(preset)` → `{ bg, tiers[4], name, text2 }` from the dark look, for `scripts/og-image.mjs`.
- `headPatch(preset)` → the two `theme-color` meta lines and the two alt strings.

Committed outputs (the build never derives colours at build time; it stays `tsc && vite build`):
- `src/theme/tokens.css` (generated; header `/* generated by npm run theme from src/theme/presets.json — do not edit */`). `src/styles.css` starts with `@import './theme/tokens.css';` and keeps only layout/type. Vite inlines the import.
- `public/favicon.svg`, `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png`, `public/og.png`: regenerated by `npm run og`, which now reads `ogColors`/`faviconSvg` instead of its literals.
- `index.html` metas and alts: rewritten by `npm run theme` (regex anchored on the exact lines the tests pin).

`npm run theme` = `node scripts/theme.mjs`: writes tokens.css, favicon.svg, patches index.html, then runs the OG script. Idempotent; running it on `blue` changes nothing (test on the committed tree).

## 5. The studio

### 5.1 Where it lives

`https://resume-screen.parsanaji-com.pages.dev/?studio` (any non-`main` deploy, same rule as `?debug`). It is a drawer mounted over the real page by `main.ts` when `PN_DEBUG && ?studio`, loaded with a dynamic import so production builds drop it entirely (same mechanism as lil-gui today; production JS stays 18 KB gzip). No iframe: the site is not framed (keeps `frame-ancestors 'none'`), the studio changes the page it sits on.

### 5.2 Layout (desktop; the band layout stacks it below)

```
┌───────────────────────────────────────────────┬───────────────────────────┐
│                                               │ THEME STUDIO              │
│   Parsa Naji                                  │ preset  ● Blue ○ Ember    │
│   I build AI agents, apps, and the systems…   │         ○ Moss ○ Iris     │
│                                               │         ○ Amber ○ Lagoon  │
│   (the live dash field, light or dark,        │ hue     [=====|======] 264│
│    already in the draft colours)              │ chroma  [======|=====] 1.0│
│                                               │ look    [dark][light][sys]│
│                                               │ contrast                  │
│                                               │  fg/bg        15.1 ● ●    │
│                                               │  fg-2/bg       5.2 ● ●    │
│                                               │  accent/bg     7.9 ● ●    │
│                                               │  field-3/field-0 … ● ●    │
│                                               │  name ink/field-0  … ● ●  │
│                                               │ assets                    │
│                                               │  [favicon 16/32] [og 240] │
│                                               │ publish                   │
│                                               │  branch (resume-screen ▾) │
│                                               │  token  ••••a3f2 [forget] │
│                                               │  [Publish to preview]     │
│                                               │  [Publish to parsanaji.com]│
│                                               │  last: 5392b22 · live ✓   │
└───────────────────────────────────────────────┴───────────────────────────┘
```
Drawer: 320 px, right edge, the site's own type (JetBrains Mono), the site's own tokens (so it re-themes with the draft), small eyebrows like the rail. Keyboard reachable; `Esc` collapses it to a 40 px tab; `?studio` without the drawer open still shows the tab.

### 5.3 Behaviour

- Draft = `{ presetId, hue, chroma, overrides }`, kept in `localStorage 'pn.studio.draft'`; reload restores it. "Reset" returns to the committed preset.
- Every change: `tokensCss(draft)` goes into one constructed `CSSStyleSheet` in `document.adoptedStyleSheets` (overrides the bundled tokens.css by cascade order; no inline styles, CSP-clean), then `readFieldColors()` → `app.setColors(colors, true)` so the field crossfades exactly as the real toggle does (300 ms). `theme-color` metas are set the way `themeController.applyMetas` does.
- Look switch uses the real toggle (`[data-theme-toggle].click()`), so the entry, the chip and the crossfade are the production path.
- Contrast table: the rows of Appendix B §2.1/§2.2 that Dither Blue passes, computed live for both looks (WCAG 2.x relative luminance; also APCA Lc shown greyed for information). Any row below its floor turns the Publish buttons off and names the row. Floors: body `fg/bg` ≥ 7, `fg-2/bg` ≥ 4.5, `accent/bg` ≥ 4.5, `accent-2/bg` ≥ 4.5, `field-3/field-0` ≥ 4.5, name ink (`uInk` formula of renderer.ts 229–235) over `field-0` ≥ 4.5, `fg` over `overlay-bg` ≥ 7, `fg-2` over the scrim edge ≥ 4.5.
- Assets preview: `faviconSvg(draft)` as `<img>` at 16/32/180 (data: URL, allowed by `img-src data:`) and the OG card drawn on a 1200×630 canvas scaled to 240 px: `dashGrid` from `src/field/surface.ts` with round-capped 2D lines, the name in the page's JetBrains Mono (already loaded), the same scrim stops as the script. This is also what Publish encodes.
- "Replay entry" and "?debug" keep working alongside; the studio does not touch `pn.tweaks`.

### 5.4 Publish

One commit, built in the browser, written with the GitHub REST API (CORS-enabled; the preview CSP gains `connect-src https://api.github.com` only on `VITE_PN_DEBUG=1` builds via a small Vite `closeBundle` step that rewrites `dist/_headers`; production `_headers` unchanged).

Files in the commit (all generated client-side from the draft):
- `src/theme/presets.json` (active id, and the preset's hue/chroma/overrides if edited)
- `src/theme/tokens.css` (`tokensCss`)
- `index.html` (metas + alts; the studio fetches the branch's current file, applies `headPatch`, writes it back)
- `public/favicon.svg`, `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png` (canvas: rounded tile + `Path2D` of the P outline + the dash; encoded with `upng-js` so sizes match sharp's; apple icon flattened, RGB)
- `public/og.png` (the 1200×630 canvas, `upng-js` level 9; the studio refuses to publish above 300 KB and says by how much)

Sequence (Git Data API): `GET ref` → `GET commit` (base tree) → `POST blobs` (base64 for PNGs) → `POST tree` (base_tree + 9 entries) → `POST commit` (parents = ref head, message `theme(studio): <name> hue <h> chroma <c>`) → `PATCH ref` without force. If the ref moved since the page loaded, the studio stops and asks for a reload (no merge logic in the browser).

Targets: `resume-screen` ("Publish to preview", default) and `main` ("Publish to parsanaji.com": confirm dialog that shows the hue swatch and asks to type the domain). After `PATCH ref`, the studio links the commit and the Actions page and polls `GET /repos/parsanaji/parsanaji.com/actions/runs?head_sha=` every 15 s until success/failure (needs Actions: read on the token; if missing, the link alone).

Because the committed outputs are the same bytes `npm run theme` would write, the next local run is a no-op, and the tests that pin tokens, metas, favicon and OG size pass in CI for the published commit (CI runs `npm test` before deploy; a red run deploys nothing, and the studio shows the failure).

### 5.5 Token (security, deliberate)

- Fine-grained personal access token, repository `parsanaji/parsanaji.com` only, permissions Contents: read and write, Actions: read (optional), 90-day expiry. Created by Parsa in GitHub settings; pasted once into the studio; kept in `localStorage 'pn.studio.token'` on his machine; never sent anywhere but `https://api.github.com`; never written to the repo, logs, or the vault. The studio shows only the last four characters and has "forget".
- Threat: a script injected into the preview site could read it. Mitigations already in place: CSP without inline scripts, no third-party script but Cloudflare Insights, `connect-src` closed except GitHub on preview. Optional hardening (not in scope): put the preview host behind Cloudflare Access (Parsa's Google login) so the studio page needs a login before any JS runs.
- Nothing in CI changes: `contents: read`, no bot commits, no new secrets in Actions.

## 6. Build and repo changes (summary for the plan)

| area | change |
|---|---|
| `src/theme/presets.json` | new, source of truth (4.3) |
| `src/theme/generate.ts` | new, pure: `derive`, `tokensCss`, `faviconSvg`, `ogColors`, `headPatch`, `contrastTable` |
| `src/theme/tokens.css` | new, generated; `src/styles.css` imports it and loses its token blocks |
| `scripts/theme.mjs` | new, `npm run theme`; `scripts/og-image.mjs` reads `ogColors`/`faviconSvg` |
| `src/studio/` | new, drawer + publish client, dynamic import under `PN_DEBUG && ?studio` |
| `vite.config.ts` | `closeBundle` step: preview `_headers` adds `https://api.github.com` to `connect-src` |
| `package.json` | devDependency `upng-js` (studio bundle only); `"theme"` script |
| tests | `tokens.test.ts` reads tokens.css and asserts `tokensCss(active)` equals it, blue byte-identical to today's blocks; new `generate.test.ts` (derive round-trip, gamut mapping, contrast floors for every shipped preset, `faviconSvg`/`headPatch` strings); `content.test.ts` metas/alts from `headPatch`; `ogAsset.test.ts` unchanged; studio publish client tested against a fake `fetch` (tree/commit/ref sequence, no-force, moved-ref stop) |
| parent spec | §3.2 gains "3.2.10 Presets": tokens are generated from presets.json; §4.10 OG script reads the preset; §7.3.1 production `_headers` unchanged, preview differs by one origin |

Slices (each green and shippable on its own):
1. **Model.** presets.json, generate.ts, tokens.css extraction, `npm run theme`, OG/favicon script reading the preset, tests rewired. The built site is byte-identical for `blue`. (Lets Parsa switch hue today by editing one JSON line and running two scripts; the studio only adds the button.)
2. **Studio drawer.** `?studio` on preview builds: presets, hue/chroma, look, contrast table, assets preview, draft persistence. No publish yet.
3. **Publish.** Token UI, client-side assets, Git Data API commit, preview and production targets, run status. First real run publishes `blue` to `resume-screen` (a no-op commit proves the bytes match).

## 7. Rulings in this design (mine; Parsa can overturn any)

- R-1 One hue per preset, light and dark derived together. Different hues per look is a non-goal.
- R-2 OKLCH rotation of the Dither Blue ladder, with per-token overrides as the escape hatch, instead of a free colour editor.
- R-3 Studio = a drawer on the real page under `?studio`, preview builds only; no iframe, no separate HTML entry.
- R-4 Publish from the browser with a fine-grained token, Git Data API, one commit. CI stays read-only; no bot commits; derived PNGs are encoded client-side.
- R-5 Visitors never get a hue control.
- R-6 The 300 KB OG ceiling stays; the studio enforces it before publishing.
- R-7 The favicon keeps its shape (mono P + dash) and takes the preset's dark colours.

## 8. Open questions for Parsa (answer any time; defaults in brackets)

1. Which presets ship in the chip row? [blue, red, green, violet, amber, teal as in 4.3; the hue slider covers the rest]
2. Should "Publish to parsanaji.com" also be allowed straight from a never-previewed draft? [no: production publish is enabled only after the same draft was published to preview and its run went green]
3. Lock the preview host behind Cloudflare Access before the token UI ships? [not now; revisit if the preview URL is ever shared]

## 9. What is left to the builder

OKLCH ↔ sRGB math (implement from CSS Color 4; no dependency), the exact drawer CSS, the `upng-js` wiring, the fake-fetch test harness for the publish client, and the wording of the confirm dialog.
