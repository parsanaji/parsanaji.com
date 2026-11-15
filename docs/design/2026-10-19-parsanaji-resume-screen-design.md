# parsanaji.com — Résumé screen design

**Date:** 2026-10-19
**Status:** Normative draft, written by Agent D for Fable's review. Plans, task briefs and reviews cite it by requirement number (for example "3.4.7").
**Owner:** Parsa Naji
**Branch:** `resume-screen` (preview `https://resume-screen.parsanaji-com.pages.dev`). Production `https://parsanaji.com` stays on the teaser until Parsa approves.

**Sources of authority, in order:**
1. Parsa's own messages (quoted in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/design-brief.md` §0).
2. The controller rulings R1–R16 (`design-brief.md` §1) and every "Ruling" line of the ledger (`progress.md`, same folder).
3. This spec. It resolves every contradiction between the reports with the rulings; section 11 lists the choices this spec made where no ruling decided.
4. The appendices, which are the three pre-spec reports copied verbatim and never edited:
   - Appendix A: `docs/design/2026-10-19-parsanaji-resume-screen-appendix/A-architecture.md` (engine audit, module map, GLSL, sizing, entry machine, lifecycle, OG image, bundle, tests, risks).
   - Appendix B: `docs/design/2026-10-19-parsanaji-resume-screen-appendix/B-palette.md` (tokens, contrast tables, favicon, OG and theme-color colours).
   - Appendix C: `docs/design/2026-10-19-parsanaji-resume-screen-appendix/C-layout.md` (markup, stylesheet, measured content budget, accessibility, head block).

**How to read it:**
- Every requirement has a number. Plain present tense ("the toggle shows") is as binding as "must".
- "Appendix A §3.5" means section 3.5 of the architecture report.
- When a requirement says "exactly as Appendix X §n, with these changes", the appendix code is normative and the listed changes are the only differences.
- Where this spec and an appendix disagree, this spec wins. Appendix text that this spec does not mention and that no ruling overrides stays normative.
- The teaser spec `docs/design/2026-10-16-parsanaji-teaser-design.md` is superseded, except for the rules this spec marks "house rule kept".

---

## 1. Purpose, context and success criteria

### 1.1 Purpose

- **1.1.1** parsanaji.com becomes a one-screen résumé. A left rail holds the name, tagline, experience, projects, education, misc tags, links, a live status line and a footer clock. It sits over a full-screen animated dither field (R1).
- **1.1.2** The field is the Blueprint "Dither" preset Parsa approved (R4): ordered Bayer 8×8 dither over a domain-warped fbm surface, flow motion, pointer repel, click Shockwave, density medium, intensity medium, colour "core".
- **1.1.3** Two looks. Dark is Dither Blue from the reference card (R2). Light is "Dither Blue in daylight": the same blues dealt as ink on paper (R3). The OS picks the look; a toggle overrides it (R7).
- **1.1.4** On every load the field gathers into "Parsa Naji", holds, and dissolves while the rail fades in (R6).
- **1.1.5** The site replaces the live teaser (particle "PARSA NAJI" and "soon."). The particle engine and Three.js leave the bundle (R5).

### 1.2 Context

- **1.2.1** Parsa's latest words (2026-10-19 14:45 PDT): "The dither blue theme is my favorite, so if you can make a light mode version of it, that's perfect." Earlier the same day: "I want two different themes for the light mode and the dark mode, and then also when you load into the page, there should be some sort of cool thing."
- **1.2.2** The pivot brief (2026-10-18): one screen, no scroll, the name on load, an animated field that spreads from the cursor, Experience and Misc blocks, "very clean, very simple", no mascot, a similar vibe to the reference site and not a carbon copy.
- **1.2.3** The approved design is the Blueprint picks document (`picks/current.json`, v2, version 164) plus the Blueprint mockup (`part-b.html` `.d-field`, `part-c.html` `class Field`, `part-d.html` `renderSite` and `playEntry`). Parsa saw the Dither look in the artifact and approved it.
- **1.2.4** Reference images: the "Dither Blue" card (`images/3.png`, Parsa's favourite) and the reference site's three render styles (`images/1.png`, `images/2.png`). Paths are in the brief §3.

### 1.3 Success criteria

- **1.3.1** On a landscape desktop window of at least 1280×720 the whole résumé fits on one screen with no scroll (R9). Verified at 1280×720, 1366×768, 1440×900, 1920×1080 and 2560×1440 (8.2.13).
- **1.3.2** The field is the approved Blueprint math. GPU pass 1 matches `src/field/surface.ts` with a max error of 3/255 or less and a tier mismatch of 0.5 % of cells or less (8.2.2).
- **1.3.3** On the entry path, First Contentful Paint is 1.0 s or less and the rail is fully visible 3.0 s or less after the entry's t = 0. On the no-entry path, Largest Contentful Paint is 1.5 s or less (6.1.6–6.1.8).
- **1.3.4** Both looks meet every contrast requirement in 3.2.5.
- **1.3.5** Zero console errors and zero console warnings at 1440×900, 1280×720 and 390×844, in both looks, on the preview and in production (R14).
- **1.3.6** The full résumé is readable without JavaScript, without WebGL2, under reduced motion, under forced colours and in print (R13).
- **1.3.7** Parsa approves the preview before anything reaches `main` (R15).

### 1.4 Behavioural design notes (ux-psychology lens)

The page has two decision moments: stay or bounce in the first three seconds, then whether to act (open GitHub, say hi).

- **Smart default: the system theme.** The visitor makes no choice. The OS look is shown before first paint. The toggle is one small word for the few who want the other look. Their choice persists, and choosing the OS look again returns them to "follow the system", so nobody manages a third state.
- **One memorable moment: the entry.** The field forms the name on every load and is gone in under three seconds. It never blocks: keyboard focus, reduced motion, a hidden tab or a failed GPU all skip or defer it, and the rail is never more than 3.0 s away once it starts.
- **Labels name the payoff.** `github` and `say hi` say what happens, not what the control is. "copied" confirms what just happened, in place, for 1.2 s, and the live region tells screen-reader users. A refused clipboard falls back to the mail app, so a click is never dead.
- **The status line is a live signal.** One softly pulsing dot and "Building something new" tell the visitor the site is current. It is honest: no counter, no countdown, no fake urgency.
- **Reciprocity.** The delight (entry, pointer repel, click rings, the eggs) is free and ungated. There is no form, no popup, no newsletter and no cookie banner; analytics are cookieless.
- **No dark patterns.** No dead links (LinkedIn is absent until it is real), no misleading affordances, nothing hidden behind the animation, nothing collected.

---

## 2. Scope

### 2.1 In scope

- **2.1.1** One route, `/`. One HTML page. No second page, no router.
- **2.1.2** The rail content (3.1), both looks (3.2), the WebGL2 field (3.3), the entry (3.4), the interactions and eggs (3.5), the fallbacks (3.6) and the lifecycle (3.7).
- **2.1.3** The theme bootstrap `public/theme-boot.js`, the theme toggle and its persistence (R7).
- **2.1.4** JetBrains Mono 400 and 700 replacing Geist, subset and self-hosted (R8).
- **2.1.5** The favicon set (SVG monogram plus three PNG fallbacks), the 1200×630 OG image, the head metadata and JSON-LD (R11).
- **2.1.6** Unit tests for every pure module, browser checks with Chrome DevTools MCP, and the preview deploy of branch `resume-screen` (R15).
- **2.1.7** Doc updates: `README.md` (new description, `npm run og`) and the wording of `docs/OPERATOR.md` §5 (7.6.2).

### 2.2 Retired (removed on the branch; git history keeps them)

- **2.2.1** `three` and `@types/three` (R5).
- **2.2.2** `src/engine/ParticleField.ts`, `src/engine/defaults.ts`, `src/engine/types.ts`, `src/engine/motion.ts` (its `breathScale` moves to `src/field/flow.ts`), `src/shaders/field.vert`, `src/shaders/field.frag`, the Ashima simplex `src/shaders/noise.glsl` (replaced by a new file of the same name), `src/boot/webgl.ts`.
- **2.2.3** `scripts/og-placeholder.mjs` and the `og:placeholder` npm script.
- **2.2.4** The Geist fonts: `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt`, `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2`.
- **2.2.5** The teaser markup: the sr-only h1 and p, `#static`, the `<noscript>` copy, `#chrome`, `#clock`, `#cursor`.
- **2.2.6** The teaser behaviours: particle sampling, morph cycle, auto-tease, idle ripples (`RippleScheduler`), vibration, the cursor ring.
- **2.2.7** The full keep / adapt / retire table per file is Appendix A §1.1–§1.4. It is normative.

### 2.3 Out of scope

- **2.3.1** Deploying to production before Parsa approves (7.5).
- **2.3.2** The picks blocks that are off: bio, "now", the résumé PDF link (`links.resume: false`), X and "other" links (empty).
- **2.3.3** The alternative light palettes Frost and Cream (Appendix B §4). They stay documented as fallbacks only.
- **2.3.4** A `prefers-contrast: more` variant (Appendix B §6.5 marks it optional).
- **2.3.5** Changes to `public/_headers`, the CSP, HSTS, DNS, email routing scripts or analytics.
- **2.3.6** Sound, WebGPU, scroll-driven scenes, a portrait, a second page.

### 2.4 Parked operator items (Parsa's; none of them blocks the branch)

- **2.4.1** Cloudflare Email Routing verification. Parsa clicks the link Cloudflare sent to `private-inbox@example.com`; the controller then runs `node scripts/cf-setup-email.mjs`. Until then mail to `info@parsanaji.com` does not route, although "say hi" still copies the address. The approval checklist asks about it (7.5.2).
- **2.4.2** CI token swap per `docs/OPERATOR.md` §6 (a Pages-only token for the Actions secret).
- **2.4.3** LinkedIn URL. The link stays absent until Parsa gives the URL; 3.1.12 is the one-commit procedure to add it.

---

## 3. Experience

### 3.1 Layout and content

- **3.1.1 Two layouts.** The "rail" layout applies when `(min-width: 720px) and (min-aspect-ratio: 1/1)` matches. Every other viewport gets the "band" layout, selected by the media query list `(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)` (ledger ruling D1: portrait tablets use the band). This string is exported as `BAND_QUERY` from `src/field/sizing.ts` and used verbatim in `src/styles.css`.
- **3.1.2 Rail order.** Top to bottom, in DOM order and visual order (R9): name, tagline, Experience (3 rows), Projects (4 compact rows), Education (1 row), then the bottom group: Misc (7 wrapping tags), the links row, the status line, the footer (location and clock). The theme toggle is the last child of `<main>` in the DOM and sits top-right on screen (3.1.16).
- **3.1.3 Exact strings.** These come from `picks/current.json` and are used verbatim. The only edit is the parsanaji.com project line, which the ledger ruling D3 rewrote because Three.js is retired.

| block | text |
|---|---|
| name (h1) | `Parsa Naji` (title case, weight 700, R8) |
| tagline | `I build AI agents, apps, and the systems behind them.` |
| eyebrows | `Experience`, `Projects`, `Education`, `Misc` (rendered uppercase by CSS, R8) |
| experience row 1 | when `2025 —` · role `Software Developer` · org `Koreex Systems` |
| experience row 2 | when `2026 —` · role `AI Specialist / Developer` · org `Expedient Labs` |
| experience row 3 | when `2025` · role `Calculus Tutor` · org `Saddleback College` |
| project row 1 | `parsanaji.com` · `This site. WebGL2 dither field.` |
| project row 2 | `SolScope` · `Microcap cryptocurrency tracker.` |
| project row 3 | `Kaptur` · `Business expense tracker for trades.` |
| project row 4 | `Mafia` · `Family and friends game.` |
| education row | when `2025 — 2026` · `Saddleback College` · `Business Administration` |
| misc tags, in order | `Agentic Workflows`, `Multi-Agent Orchestration`, `Prompt & Context Engineering`, `LLM Cost and Token Optimization`, `WebGL & shaders`, `iOS/macOS`, `Swift` |
| links row | `github` → `https://github.com/parsanaji`; `say hi` → copies `info@parsanaji.com`; `linkedin` absent while the URL is empty |
| status line | dot + `Building something new` (picks status "building") |
| footer | `Irvine, CA · 2:36 PM PDT` (the time is live; 3.5.13) |
| "copied" label | `copied` |
| toggle word | `dark` while the light look shows, `light` while the dark look shows |

- **3.1.4 Markup.** The body is exactly Appendix C §1, with these changes:
  1. Project row 1's `.sub` text is `This site. WebGL2 dither field.`.
  2. The footer is `<p class="place" data-reveal="7">Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span></p>`. The `<time>` starts empty; the clock module fills it (3.5.13).
  3. The toggle is `<button class="theme-toggle" type="button" data-theme-toggle data-reveal="0" hidden><span class="theme-word" data-theme-word></span></button>`. It has no `aria-label` and no `aria-pressed` in the HTML; the theme module sets the label (3.5.10).
  4. No other change. The LinkedIn `<li>` stays an HTML comment until 3.1.12 runs.
  5. (12.17) In Experience row 1 the org is a link: `<span class="sub"><a class="org" href="https://koreex.com/" target="_blank" rel="noopener">Koreex Systems</a></span>`. `a.org` takes the `a.pname` treatment (hairline underline at rest, accent on hover and focus, 3.5.2) in both layouts; `tests/content.test.ts` pins the markup.
- **3.1.5 No-JS content.** All visible text in 3.1.3 except the clock time and the toggle word is plain HTML in `index.html` (R13). Scripts never create content nodes beyond the clock text, the toggle word, the "copied" state, the live-region sentence and the scramble frames.
- **3.1.6 One clock.** The footer holds the only clock on the page (R9). The status line carries only the status.
- **3.1.7 Type and geometry tokens (rail layout).** Exactly Appendix C §2 `:root`:
  - fluid driver `--k: min(1vw, 1.6vh)`;
  - `--fs-name: clamp(40px, 5.2k, 104px)`, `--fs-tag: clamp(14px, 1.12k, 21px)`, `--fs-body: clamp(13px, k, 18px)`, `--fs-when: clamp(12px, 0.86k, 16px)`, `--fs-eyebrow: clamp(11px, 0.78k, 14px)`, `--fs-misc: clamp(12.5px, 0.94k, 17px)`, `--fs-link: clamp(13px, k, 18px)`, `--fs-meta: clamp(11px, 0.8k, 14.5px)`, where "1.12k" means `calc(var(--k) * 1.12)`;
  - `--gutter: clamp(24px, 4vw, 96px)`, `--pad-y: clamp(24px, 5.2vh, 72px)`, `--rail-w: min(44 × --fs-body, 100vw − 2 × --gutter)`, `--ramp: clamp(160px, 18vw, 440px)`;
  - `--gap-tag: clamp(6px, 1.2vh, 14px)`, `--gap-block: clamp(14px, 3vh, 40px)`, `--gap-eyebrow: clamp(4px, 0.9vh, 12px)`, `--row-pad: clamp(3px, 0.55vh, 8px)`, `--gap-foot: clamp(10px, 2vh, 24px)`, `--gap-meta: clamp(6px, 1.1vh, 14px)`;
  - `--toggle: clamp(40px, 2.6k, 52px)`, `--when-w: 6.9 × --fs-when`.
  - At 1440×900 these give name 74.88 px, tagline 16.13, body 14.4, when 12.38, eyebrow 11.23, misc 13.54, link 14.4, meta 11.52.
- **3.1.8 Type rules.** JetBrains Mono everywhere (R8). The name is 700 with letter-spacing −0.025em, line-height 1, `margin-left: −0.045em`, `white-space: nowrap`. Eyebrows are 400, uppercase, letter-spacing 0.14em, `--fg-2`, followed by a 1 px `--line` rule that fills the row. Status and footer are uppercase (`--fs-meta`, letter-spacing 0.08em and 0.06em), as in the Blueprint `.s-meta` and `.s-foot`. Body text has `font-variant-ligatures: none`, `font-kerning: none` and `font-synthesis: none`.
- **3.1.9 Rows.** Experience and Education rows are a two-column grid: a fixed "when" column of `--when-w` (11.5ch of the when face) and a value column, with a 1.1em column gap and a 1 px `--line` border between rows. The value is "role · org" (`.sub` prefixed with a generated `· ` that screen readers skip). Projects are compact rows: the value column only, `pname · what`, half the row padding, no borders. Open-ended dates read "2025 to present" to screen readers (sr-only phrase, Appendix C §1).
- **3.1.10 Scrim (rail layout).** The scrim is a fixed box from x = 0 with width R + ramp, where R = `--gutter + --rail-w` is the rail's right edge. Its gradient stops are exactly Appendix C §2.2: `--scrim-solid` at 0 and at S = gutter + 0.5 × rail-w; `--scrim-mid` (alpha 0.86) at R; 70 %, 42 % and 16 % `--scrim-solid` at R + 0.25, 0.5 and 0.75 ramp; `--scrim-clear` at R + ramp. Without `color-mix` support the 4-stop fallback (solid, solid, mid, clear) applies. The scrim is built only from the `--scrim-solid`, `--scrim-mid` and `--scrim-clear` tokens; Appendix B's `--bg-scrim` does not exist in the product (ledger ruling D5).
  - **3.1.10.1** Every text pixel of the rail sits where the scrim alpha is 0.86 or more (ledger ruling, Appendix B §1.2). Measured widest text pixels: 612 px at 1280×720 (alpha 0.865), 665 px at 1440×900 (0.872), 859 px at 2560×1440 (0.870).
  - **3.1.10.2** The links row, the status line and the footer sit in the solid zone (alpha 1). Measured right edges: 231 px at 1280×720 to 333 px at 2560×1440, all left of S.
  - **3.1.10.3** If a later change puts any text pixel right of R, raise the `--scrim-mid` alpha first (up to 0.9). The shader never dims the field under the rail.
- **3.1.11 Short windows (rail layout only).** Collapse order, exactly Appendix C §2 "short desktop windows":
  1. At 600 px tall or more, everything shows (1280×600 has 8 px spare).
  2. Below 600 px tall (`(min-width: 720px) and (max-height: 599.98px)`), Projects shows its first 2 rows (parsanaji.com, SolScope).
  3. Below 520 px tall (`(min-width: 720px) and (max-height: 519.98px)`), Misc also shows only its first 3 tags (Agentic Workflows, Multi-Agent Orchestration, Prompt & Context Engineering), which fit on one line.
  4. Below about 476 px tall the document scrolls. `html` and `body` never get `overflow: hidden`, and nothing is clipped.
  5. Collapsed items are visually hidden with the sr-only pattern, never `display: none`, so screen readers keep the full résumé.
- **3.1.12 Adding LinkedIn.** When Parsa gives the URL, one commit does all of this: set `CONTENT.links.linkedin` in `src/content.ts`; uncomment the LinkedIn `<li>` in `index.html` with that `href`, `rel="me"` and `data-link="linkedin"`; add the URL to the JSON-LD `sameAs` array. `tests/content.test.ts` keeps the three equal. Until then no LinkedIn element exists in the page (R9, R12a).
- **3.1.13 Phone layout (amended by 12.16, 12.17, 12.18 and 12.19; was "Band layout").** Under `BAND_QUERY` (3.1.1) the page is one screen that never scrolls:
  - the field keeps its rail-layout box (`position: fixed; inset: 0; z-index: 0`: the whole viewport, behind the content) with `touch-action: auto` (3.3.7.8), overdrawn 160 px past the viewport top and bottom plus the safe-area insets (`top: calc(-160px - env(safe-area-inset-top, 0px))`, `height: calc(100% + 320px + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))`, 12.18: Safari paints page content under its translucent status bar and toolbar only where something extends there, and the URL-bar collapse no longer flashes the bare background; a canvas is a replaced element, so the height is explicit rather than `auto`); the scrim is a flat veil over the same overdrawn box, `color-mix(in srgb, var(--scrim-solid) 80%, transparent)` (`--scrim-mid` where `color-mix` is unsupported), so the dashes stay faint under the text and the entry name forms at the screen's centre (3.4.6: the mask box is the canvas box, whose centre is the viewport's centre because the overdraw is symmetric); during the entry the scrim is hidden as in 3.4.7, so the name forms at full strength;
  - the rail is `min-height: 100svh` (`100vh` fallback) with `--pad-y` plus the safe-area insets on all four sides; the stack order is intro, status (under the tagline, CSS `order`), the blocks, then the footer: `.links` takes `margin-top: auto` with `--gap-foot` as its top padding, so the links and the place rest on the bottom edge and any slack sits above them;
  - rows stack in two lines (12.19; was an inline run "2025 — Software Developer · Koreex Systems"): `.row` is a two-column grid (`minmax(0, 1fr) auto`, 1.2 em gap), `.what` is `display: contents`, so the role sits on line one with the years at the right edge and `.sub` takes line two at `--fs-sub` with no "· " prefix; rows have no hairline between them. Misc is a set of chips (1 px `--line` border, 4 px radius, 5 px gap, no dot separators). The Projects block is hidden on phones (`.rail > .block--proj { display: none }`, 12.17: Parsa, "remove the projects"), and the Koreex link in Experience row 1 (3.1.4 item 5) stands in for the project list, which stays on the desktop rail;
  - tokens: `--gutter: clamp(16px, 4.6vw, 28px)`, `--fs-name: clamp(34px, 11vw, 60px)`, `--fs-tag: clamp(14px, 3.8vw, 16.5px)`, `--fs-body: clamp(13px, 3.5vw, 15.5px)`, `--fs-when: clamp(12px, 3.15vw, 13.5px)`, `--fs-eyebrow: clamp(11px, 2.9vw, 12.5px)`, `--fs-misc: clamp(12.5px, 3.3vw, 14.5px)`, `--fs-link: clamp(15px, 4vw, 17px)`, `--fs-meta: clamp(11px, 2.95vw, 12.5px)`, `--gap-eyebrow: 8px`; the rhythm follows the small viewport height (the height with the browser's bars shown): `--pad-y: clamp(14px, 3svh, 32px)`, `--gap-tag: clamp(6px, 1.4svh, 12px)`, `--gap-block: clamp(12px, 3.2svh, 32px)`, `--row-pad: clamp(4px, 0.9svh, 8px)`, `--gap-foot: clamp(12px, 2.6svh, 28px)`, `--gap-meta: clamp(8px, 1.4svh, 12px)`, with the same clamps in `vh` outside `@supports (height: 1svh)`;
  - one collapse step, keyed on height under `(max-width: 719.98px)`: at ≤ 599.98 px tall Misc shows 3 tags (visually hidden, still read by screen readers); a phone layout wider than 720 px is portrait and therefore taller than 720 px, so the step never applies there;
  - the theme chip and the link hit areas are unchanged (`--toggle: 44px`, `padding: 0 1.5ch`, bracket gap `0.25ch`, `--hit: 0.65em`, 1 em row gap);
  - measured on the dev build (2026-10-22): 390×664 (iPhone 14 with Safari's bars) scrollHeight 664, all 7 tags, Misc ends at 519, links at 579, place bottom 644; 375×553 (iPhone SE in Safari) scrollHeight 553 with 3 tags, links at 477; 360×724 (Galaxy in Chrome) scrollHeight 724 with all 7 tags, "Koreex Systems" wrapping to a second line. `tests/phoneLayout.test.ts` models the stack from the stylesheet and index.html (greedy word wrap at JetBrains Mono's 0.6 em advance, Projects excluded) and requires 12 px of slack at nine viewports, so a content edit that no longer fits fails the suite.
- **3.1.14 Narrow band.** Retired by 12.16: rows flow inline at every phone width (3.1.13).
- **3.1.15 Portrait tablets and landscape phones.** A portrait tablet (768×1024) gets the phone layout with everything shown and no scroll. A landscape phone (844×390) matches the rail query, so it gets the rail with 3.1.11 items 2 and 3 applied and scrolls by about 86 px (estimated from the 476 px threshold in Appendix C §3.2); this is the ruled behaviour, not a defect (a landscape-phone layout is a separate decision for Parsa).
- **3.1.16 Theme toggle (layout).** The toggle is a mono text button (ledger ruling): it shows the target mode word (`dark` in the light look, `light` in the dark look) on a chip. Placement is top-right: in the rail layout `position: fixed`, `top: calc(var(--pad-y) + var(--fs-name) / 2 - var(--toggle) / 2)`, `right: max(var(--gutter), env(safe-area-inset-right, 0px))`, `z-index: 3`. In the band layout it keeps Appendix C's phone rule (`position: absolute`, `z-index: 5`, the top adds the top safe-area inset, `--toggle: 44px`). Every rule of Appendix C §2's "theme toggle" block (from `.theme-toggle {` through `.theme-toggle[aria-pressed="false"] .theme-glyph`) is replaced by exactly this CSS; the phone block's `.theme-toggle` rule stays:

```css
.theme-toggle {
  position: fixed;
  z-index: 3;
  top: calc(var(--pad-y) + var(--fs-name) / 2 - var(--toggle) / 2);
  right: max(var(--gutter), env(safe-area-inset-right, 0px));
  min-height: var(--toggle);
  display: inline-grid;
  place-items: center;
  padding: 0 2.5ch;
  margin: 0;
  border: 1px solid var(--overlay-border);
  border-radius: 4px;
  background: var(--overlay-bg);
  color: var(--fg);
  font: inherit;
  font-size: var(--fs-link);
  line-height: 1.45;
  cursor: pointer;
}
.theme-toggle[hidden] { display: none; }
.theme-toggle:focus { outline: none; }
.theme-word {
  position: relative;
  display: inline-block;
  min-width: 5ch;                   /* "light" is 5ch: both words occupy the same box, nothing moves */
  text-align: center;
  transition: color 0.15s ease;
}
.theme-word::before,
.theme-word::after {
  position: absolute;
  top: 0;
  color: var(--accent-2);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.theme-word::before { content: "["; content: "[" / ""; right: 100%; padding-right: 1ch; }
.theme-word::after  { content: "]"; content: "]" / ""; left: 100%;  padding-left: 1ch; }
.theme-toggle:hover .theme-word,
.theme-toggle:focus-visible .theme-word { color: var(--accent-2); }
.theme-toggle:hover .theme-word::before, .theme-toggle:hover .theme-word::after,
.theme-toggle:focus-visible .theme-word::before, .theme-toggle:focus-visible .theme-word::after { opacity: 1; }
.theme-toggle:focus-visible .theme-word {
  text-decoration: underline 1px;
  text-underline-offset: 0.35em;
  text-decoration-color: var(--focus-ring);
}
```

  - **3.1.16.1** The chip is 10ch plus 2 px wide (88.4 px at 1440×900) and `--toggle` tall (40 px desktop, 44 px band). The brackets hang inside the 2.5ch padding, so hovering never changes the chip's size.
  - **3.1.16.2** Never put `transform`, `filter`, `contain` or `will-change: transform` on `.rail`; the fixed toggle is its child (Appendix C §1 rule).
- **3.1.17 Measured fit (Appendix C §3, the binding evidence).** Rail layout, no scroll, no row wraps:

| viewport | spare height | name px | body px |
|---|---|---|---|
| 1280×720 | 73 | 59.9 | 13 |
| 1366×768 | 98 | 63.9 | 13 |
| 1440×900 | 142 | 74.88 | 14.4 |
| 1920×1080 | 171 | 89.86 | 17.28 |
| 2560×1440 | 396 | 104 | 18 |
| 1366×657 (1366×768 minus browser chrome) | 39 | — | — |

  Band layout: 390×844 and 430×932 scroll by design; the tagline is 2 lines and Misc 5 lines at 390.

### 3.2 Looks

- **3.2.1 Token sets.** `src/styles.css` carries exactly Appendix B §1.1's three token blocks (dark base `:root`; light under `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }`; light again under `:root[data-theme="light"]`), with two deletions: no `--bg-scrim` (ledger ruling D5) and no `--copied` (ledger ruling: "copied" is plain `--accent-2`). The resulting normative values:

| token | dark | light | used for |
|---|---|---|---|
| `color-scheme` | `dark` | `light` | UA scrollbars and controls |
| `--bg` | `#050a22` | `#f2f6fe` | page and canvas background |
| `--scrim-solid` | `rgb(5 10 34 / 1)` | `rgb(242 246 254 / 1)` | scrim, solid stop |
| `--scrim-mid` | `rgb(5 10 34 / 0.86)` | `rgb(242 246 254 / 0.86)` | scrim, text-edge stop |
| `--scrim-clear` | `rgb(5 10 34 / 0)` | `rgb(242 246 254 / 0)` | scrim, clear stop |
| `--fg` | `#e8eeff` | `#071348` | name, roles, project names, links at rest, overlay text, toggle word |
| `--fg-2` | `#7993da` | `#445789` | tagline, eyebrows, dates, orgs and descriptions, misc tags, footer, overlay descriptions |
| `--accent` | `#8db0ff` | `#2848d7` | focus ring (via `--focus-ring`), status dot (via `--status-dot`) |
| `--accent-2` | `#5b81ff` | `#3656e8` | hover and focus brackets and label, status label, "copied" |
| `--accent-glow` | `rgb(141 176 255 / 0.35)` | `rgb(40 72 215 / 0.25)` | status-dot halo |
| `--line` | `rgb(232 238 255 / 0.14)` | `rgb(7 19 72 / 0.14)` | eyebrow rules, row separators |
| `--field-0` | `#050a22` | `#f2f6fe` | field tier 0 (off) |
| `--field-1` | `#3b5df0` | `#8db0ff` | field tier 1 |
| `--field-2` | `#8db0ff` | `#3b5df0` | field tier 2 |
| `--field-3` | `#e8eeff` | `#0832b8` | field tier 3 (core) |
| `--focus-ring` | `var(--accent)` | same alias | focus underline |
| `--status-dot` | `var(--accent)` | same alias | status dot |
| `--selection-bg` / `--selection-fg` | `#3b5df0` / `#ffffff` | `#3b5df0` / `#ffffff` | `::selection` |
| `--overlay-bg` | `rgb(5 10 34 / 0.94)` | `rgb(242 246 254 / 0.95)` | `?` overlay and toggle chip |
| `--overlay-border` | `rgb(232 238 255 / 0.18)` | `rgb(7 19 72 / 0.18)` | overlay and chip hairline |
| `--theme-color` | `#050a22` | `#f2f6fe` | read by JS for the `theme-color` metas |

  Appendix C's derived token `--line-strong: color-mix(in srgb, var(--fg) 28%, transparent)` (the overlay's `kbd` borders) stays as written there.
- **3.2.2 Dark look = Dither Blue (R2).** Background `#050a22`, text `#e8eeff`, field pixel blue `#3b5df0`, highlight `#8db0ff`, exactly the reference card. The card's small text in `#3b5df0` fails AA (3.62–3.74:1), so text uses the two text-safe siblings `--fg-2 #7993da` and `--accent-2 #5b81ff`. Dark is the look whenever the OS prefers dark and no stored choice says otherwise.
- **3.2.3 Light look = Dither Blue in daylight (R3).** Paper `#f2f6fe` with a faint blue cast, navy ink `#071348`, the same electric family for the field. The tiers are inverted so the field reads as blue ink dithered on paper: the brightest tier is the darkest ink. Light field-3 is `#0832b8` (ledger ruling). The light ordinary pixel is the dark look's highlight `#8db0ff`, and the light bright cell is the brand pixel `#3b5df0`, so the tier-to-tier steps match across looks (2.44 and 1.85 / 1.86). Parsa's earlier light pick (Bone & Oxblood) is discarded.
- **3.2.4 Usage rules.** Links are `--fg` at rest; on hover and on `:focus-visible` the label turns `--accent-2` and `--accent-2` brackets appear (ledger ruling). "copied" is plain `--accent-2` text with the brackets suppressed. The status label is `--accent-2`, its dot `--status-dot` with an `--accent-glow` halo. `::selection` uses `--selection-bg` and `--selection-fg`.
- **3.2.5 Contrast (summary of Appendix B §2; WCAG 2.x is binding).**

| check | dark | light | requirement |
|---|---|---|---|
| `--fg` on `--bg` | 16.87 | 16.21 | ≥ 7 |
| `--fg-2` on `--bg` | 6.52 | 6.53 | ≥ 4.5 |
| `--accent` on `--bg` | 9.12 | 6.47 | ≥ 4.5 |
| `--accent-2` on `--bg` | 5.62 | 5.31 | ≥ 4.5 |
| lowest contract text check at the 0.86 scrim stop | 4.72 (`--fg-2` over a solid field-3 cell) | 4.86 (`--accent-2` over a solid field-1 pixel) | ≥ 4.5 |
| field-1 on field-0 | 3.74 | 1.98 | dark 2–4, light 1.8–3.5 |
| field-2 on field-0 | 9.12 | 4.84 | between tiers |
| field-3 on field-0 | 16.87 | 8.98 | ≥ 7 |
| tier steps (2 vs 1, 3 vs 2) | 2.44, 1.85 | 2.44, 1.86 | ≥ 1.3 |
| focus ring on `--bg` | 9.12 | 6.47 | ≥ 3 (WCAG 1.4.11) |
| selection text | 5.24 | 5.24 | ≥ 4.5 |
| toggle word on its chip (alpha 0.94 dark, 0.95 light), minimum over the four tiers: `--fg` / `--accent-2` | 15.13 / 5.04 | 14.87 / 4.87 | ≥ 4.5 (computed while writing this spec, same WCAG method as Appendix B) |

  - **3.2.5.1** Placement rule: `--accent-2` measures 4.06–4.51 over a bright cell at the 0.86 stop, so the status line and the links row stay in the solid scrim zone (3.1.10.2). This is a placement rule, not a colour change.
- **3.2.6 Theme crossfade (R7).** Switching looks crossfades the CSS colour tokens and the field colour uniforms together over 300 ms, linear, in gamma-encoded sRGB (4.6.4–4.6.6). The field's colour tween starts on the frame after the toggle, so it matches the CSS transition; a press inside a running crossfade behaves like an interrupted CSS transition, starting a new 300 ms tween from the colours on screen at that frame, never from the previous target (12.4).
- **3.2.7 Favicon colours.** One look for both schemes (ruling 2026-10-21, replacing the scheme-mirroring monogram): navy tile `#050a22` (rx 7 of 32), paper `#e8eeff` glyph, one `#3b5df0` dash. A navy tile stays legible on light and dark tab bars, so no `prefers-color-scheme` style is needed; the PNG fallbacks are the same picture (4.10.6).
- **3.2.8 OG colours.** Background `#050a22`; field tiers `#3b5df0`, `#8db0ff`, `#e8eeff`; name `#e8eeff`; tagline and domain `#7993da` (Appendix B §5.2).
- **3.2.9 `theme-color` and `color-scheme`.** `<meta name="color-scheme" content="light dark">`; `<meta name="theme-color" content="#f2f6fe" media="(prefers-color-scheme: light)">`; `<meta name="theme-color" content="#050a22" media="(prefers-color-scheme: dark)">`. When the toggle forces a look, the theme module sets both metas' `content` to the computed `--theme-color`; returning to "system" restores the two original values (Appendix B §5.3).

### 3.3 The field

- **3.3.1 Canvas and field space.** One `<canvas class="field" data-field aria-hidden="true">`. In the rail layout it covers the viewport (`position: fixed; inset: 0`). In the band layout it covers the bottom band (3.1.13). Field space is CSS px with the origin at the canvas's top-left corner and y pointing down. The renderer sizes from the canvas's own box through a `ResizeObserver`, never from `innerWidth`.
- **3.3.2 Cells.** The field is a grid of square dither cells, one dither decision per cell.
  - **3.3.2.1** `cellCss = clamp(0.0032 × fieldCssW, 2, 5) × densityK × degrade`, with `densityK` = 1.35 sparse, 1 medium, 0.75 dense, and `degrade` = 1, or 1.5 after the FPS probe degrades (3.7.9).
  - **3.3.2.2** Cells snap to whole device pixels: `cellDev = max(2, round(cellCss × dpr))`. When the raw DPR exceeds the cap (3.3.2.4) and `cellDev` is odd, add 1.
  - **3.3.2.3** The CSS size pass 1 uses is `uCell = cellDev / dpr`. `cols = ceil(widthDev / cellDev)`, `rows = ceil(heightDev / cellDev)`; the right and bottom cells may be partial.
  - **3.3.2.4** `dpr = min(2, devicePixelRatio)`; a non-finite or non-positive DPR counts as 1 (R14).
  - **3.3.2.5** Resulting grids at medium density (Appendix A §4.2): 1440×900 DPR 1 → 5 device px, 288×180 cells; 1440×900 DPR 2 → 9 device px (4.5 CSS), 320×200; 1280×720 → 4, 320×180; 1366×768 → 4, 342×192; 1920×1080 → 5, 384×216; 2560×1440 → 5, 512×288; 390×844 band at DPR 3 → DPR 2, 2 CSS px, 4 device px, 195×119. So medium is 5 px at 1440 wide and 2 px on phones (ledger).
- **3.3.3 Lattice unit.** `sp = clamp(fieldCssW / 48, 8, 40)` (the Blueprint's lattice spacing, kept as the unit for the pointer radius and the rings): 30 at 1440, 26.67 at 1280, 8.125 at 390.
- **3.3.4 Surface (pass 1, per cell).** For the cell centre `x = (i + 0.5, j + 0.5) × uCell` (CSS px, row j = 0 at the top):
  1. Pointer repel moves the sample point (3.3.7), giving `xw`.
  2. Breath zooms the domain about the field centre `c`: `s = c + (xw − c) / uBreath` (3.3.9).
  3. Warp: `a = s / 240 + 256`; `wx = fbm(a + (3.1, 0), zWarpX)`, `wy = fbm(a + (0, 7.7), zWarpY)`; `W = (wx, wy) − 0.5`.
  4. Main: `v = fbm(s / 160 + 256 + 2.6 × W, zMain)`.
  5. Level and gain: `v = clamp((v − 0.3) × 2.1, 0, 1)`.
  6. Dither curve: `F = min(1, 0.7 v + 0.4 (1 − |1 − 2v|) v)`.
  7. Mask mix during the entry or Konami (3.4.5), then `+ 0.12 × f` pointer boost, then the Shockwave rings (3.3.8), then `min(v, 1)`.
  - The noise scale is absolute CSS px (1 main unit = 160 px, 1 warp unit = 240 px), as in the Blueprint; it is never normalised to the viewport.
- **3.3.5 Noise.** `fbm(p, z) = 0.62 × noise3(p, z1) + 0.38 × noise3(2.1 p + (7.3, 1.7), z2)`. `noise3` is trilinear value noise with a smoothstep fade `f²(3 − 2f)` over the Blueprint integer hash `h = (x·374761393) ^ (y·668265263) ^ ((z & 255)·1013904223); h = (h ^ (h >> 13))·1274126177; h ^= h >> 16; return h / 2³²` in 32-bit unsigned arithmetic. The +256 lattice offset keeps x and y positive; masking z to 8 bits makes the noise periodic in z with period 256. The GLSL is a bit-exact port of the TypeScript in `src/field/surface.ts`.
- **3.3.6 Flow.** Flow is evolution in z only; the field never translates.
  - **3.3.6.1** Flow time τ (seconds) advances by `dt × I_eff` every frame, with `I_eff = INTENSITY_K[intensity] × flowSpeed`, `INTENSITY_K = { subtle: 0.55, medium: 1, lively: 1.7 }` and `flowSpeed = 1` by default. At the defaults τ equals sim time.
  - **3.3.6.2** `zA = 0.09 τ`, `zB = zA + 2`, `zC = 0.14 τ`. The six coordinates are `flowZ(τ, 1) = [zA, 1.4 zA + 3.1, zB, 1.4 zB + 3.1, zC, 1.4 zC + 3.1]`, each wrapped to [0, 256) on the CPU in double precision. `uZ = flowZ[0..3]` (warp x, warp y), `uZm = flowZ[4..5]` (main).
  - **3.3.6.3** Under reduced motion τ is frozen (3.6.4).
- **3.3.7 Pointer repel (R4).**
  - **3.3.7.1** Radius `R = (min(fieldCssW, fieldCssH) × 0.28 + 2 × sp) × (1 + 0.1 × velFactor)`: 312 px at 1440×900 at rest, 82.42 px for the 390×236.32 band. The radius widens by up to 10 % with pointer speed (ledger).
  - **3.3.7.2** For a cell at distance `d < R` from the eased pointer `p`: `u = 1 − d / R`, `f = strength × u²(3 − 2u)`, `xw = x − (x − p) / d × f × R × 0.55`, boost `0.12 × f`. The sample point moves toward the pointer, so the surface spreads away from it.
  - **3.3.7.3** Ease: `p += (raw − p) × (1 − (1 − 0.18)^(dt / 16.667 ms))`, frame-rate independent.
  - **3.3.7.4** Strength moves linearly toward its target at `dt / 200 ms` rising and `dt / 600 ms` falling, and is output through `easeOutCubic`. The target is 1 after a move inside the window and 0 after a release.
  - **3.3.7.5** `velFactor = min(speed / 1500, 1)`, with `speed` the eased point's speed in px/s, smoothed by an exponential average with a 100 ms time constant.
  - **3.3.7.6** Release (target 0) on `pointerup` from touch, `pointercancel`, `pointerleave` on `document.documentElement`, and `window` `blur`. A touch `pointerdown` snaps the eased point to the touch point.
  - **3.3.7.7** Pointer listeners are on `window` (passive). Positions convert to field space with the canvas's bounding rect, cached on every resize.
  - **3.3.7.8** The canvas keeps `touch-action: auto` in both layouts (Appendix C's band rule `pan-y` is replaced), so pinch zoom and scroll always work; a scroll that starts on the band fires `pointercancel`, which releases.
  - **3.3.7.9** The approved Blueprint warp overshoots for `d < 0.4 R`, showing a small mirrored lens at the cursor. It ships as approved (risk 9.4).
- **3.3.8 Shockwave (R4).** One ring per primary `pointerdown` (`isPrimary` and `button === 0`) whose target is not inside `a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]` and whose point lies inside the canvas rect. Rings are off under reduced motion.
  - **3.3.8.1** Age `a = t − t0` in sim seconds; radius `r = 9 × sp × a` (270 px/s at 1440, 73 px/s at 390); amplitude `A = 1.2 × (1 − a / 3.2)`; a ring expires at `a ≥ 3.2 s`.
  - **3.3.8.2** Per cell: `v += 0.9 × A × exp(−(|xw − o| − r)² / (2σ²))`, with `σ = 1.6 × sp` (48 px at 1440, 13 px at 390) and `o` the ring origin.
  - **3.3.8.3** At most 8 rings; a 9th drops the oldest. Rings are added after the mask mix, so clicks during the entry and the Konami hold show full rings.
- **3.3.9 Breath.** `uBreath = 1 + 0.01 × sin(2π × tMs / 6000)`: a ±1 % domain zoom over 6 s about the field centre, on the idle field and on the held name (ledger). `uBreath = 1` under reduced motion.
- **3.3.10 Tiers (pass 2).** Each cell compares `v` with the Bayer 8×8 threshold `(B + 0.5) / 64`, `B = BAYER8[(i & 7) | ((j & 7) << 3)]` (matrix in Appendix A §3.6), with strict `>`:
  - `v ≤` threshold → off → `--field-0`;
  - on and `v ≤ 0.66` → `--field-1`;
  - on and `0.66 < v ≤ 0.90` → `--field-2`;
  - on and `v > 0.90` → `--field-3`.
  - Thresholds are the uniforms `uTiers = (0.66, 0.90)`.
  - Reachability: the dither curve peaks at 0.703125, and the boost adds at most 0.12 (0.823125), so the idle field shows tiers 0–2 only. Field-3 appears only in the name mask and the Shockwave rings.
  - Expected idle coverage at 1440×900, cell 5, τ = 12: off 50–70 %, field-1 20–35 %, field-2 2–20 %, field-3 0 % (pinned by `tests/surface.test.ts`).
- **3.3.11 Defaults.** Density medium and intensity medium (R4). Every other default is in 4.9. Density, intensity, the tier thresholds, flow speed and cell size are live tunables in the debug panel (4.12, ledger risk note).
- **3.3.12 Colours.** Pass 2 writes the four field colours as sRGB uniforms `uField0..uField3`, read at runtime from the computed CSS `--field-0..3`. TypeScript never hard-codes them. The renderer adds no dimming under the rail; the scrim does that.

### 3.4 Entry: "Field forms the name" (R6)

- **3.4.1 When it plays.** It plays on every load when all of these hold: `public/theme-boot.js` set `data-entry="run"` (so not reduced motion, not forced colours, no `?noentry` in the URL); `src/main.ts` took control before 4000 ms after navigation start (4.7.2); the field started (WebGL2 available, programs linked).
- **3.4.2 Timeline.** The entry clock starts at t = 0 on the first visible frame after readiness (3.4.3). Times are milliseconds of entry time:

| t | phase | mask progress `e` | event → DOM |
|---|---|---|---|
| before 0 | pending | 0 | `html[data-entry="wait"]`: rail blocks and scrim hidden; canvas at opacity 0 |
| 0 | gather | `smoothstep(t / 900)` | `start` → `html[data-field-ready]`: canvas fades 0 → 1 over 400 ms, linear |
| 900 | hold | 1 | the name is formed |
| 1900 | dissolve | `smoothstep(1 − (t − 1900) / 800)` | `scrim` → `data-entry="scrim"`: scrim fades 0 → 1 over 800 ms, linear |
| 2100 | dissolve | continues | `reveal` → `data-entry="reveal"`: rail block n fades in over 600 ms with a delay of n × 40 ms |
| 2700 | done | 0 | `done`: mask texture deleted, `uE = 0`, the FPS probe starts |
| 3300 | done | 0 | `cleanup`: `data-entry` removed; everything is already at its resting state, so nothing animates |

  - `smoothstep(u) = u²(3 − 2u)` with `u` clamped to [0, 1] (the Blueprint `playEntry` curve). Test values: `e` = 0, 0.5, 1, 1, 0.5, 0 at t = 0, 450, 900, 1400, 2300, 2700.
  - Rail blocks carry `data-reveal` 0–7: 0 intro and the toggle, 1 Experience, 2 Projects, 3 Education, 4 Misc, 5 links, 6 status, 7 footer. The last block finishes at 2100 + 7 × 40 + 600 = 2980 ms.
- **3.4.3 Readiness.** The machine leaves `pending` only when all of these are true and `document.visibilityState === 'visible'`:
  1. both programs are linked (`KHR_parallel_shader_compile` polled once per animation frame);
  2. the font settled: `waitForFont('700 10px "JetBrains Mono"', 1200)` resolved `loaded`, `timeout` or `unavailable` (on anything but `loaded` the mask uses the fallback stack `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`);
  3. the mask is rasterised and uploaded.
  - If the field is not ready 3000 ms after the first animation frame, the page falls back (3.6.2). The 3000 ms count starts at the first animation frame, so a tab hidden at load never times out before it is seen.
- **3.4.4 Hold behaviour.** During the hold the name keeps breathing (3.3.9) and stays fully interactive: the pointer warp bends the letters (the mask is sampled at the warped, breathed point `s`), the boost brightens them, and Shockwave rings pass through the name at full strength.
- **3.4.5 Mask mix and dissolve rule.** The name is a coverage texture `m` (3.4.6, 4.8). The dissolve is a per-cell static noise threshold plus a melt along the flow warp, never a plain fade:
  - per-cell threshold `θ = 0.6 × noise3(cell × 0.08 + 256, 17) + 0.4 × hash3(cell, 91)`, static in [0, 1);
  - `k = smoothstep(θ − 0.08, θ + 0.08, 1.16 e − 0.08)`, so every cell is field at e = 0 and text at e = 1;
  - melt: the mask is sampled at `s + W × 2 × 48 × (1 − e)²`, so letters condense out of the flow and melt back into it;
  - `n = mix(0.3 × F, 0.91 + 0.09 × F, m)`: inside letters `v` is 0.91–0.973 and renders as field-3 with a sparse breathing Bayer hole pattern; around the letters the field keeps flowing at 30 %;
  - `v = mix(F, n, k)`, then boost, rings and the clamp (3.3.4 step 7).
  - The GLSL is exactly Appendix A §3.5; `uMaskMix = (0.3, 0.91, 0.08, 48)`.
- **3.4.6 Name layout.** The entry mask box is the whole field box `{ x: 0, y: 0, w: fieldCssW, h: fieldCssH }`. The text is "Parsa Naji", JetBrains Mono 700, `fontPx = min(0.4 × box.h, 0.84 × box.w × 100 / widthAt100)`, centred on the box centre by its ink box. At 1440×900 this is about 201.6 CSS px (width-limited; the name is 6.0 em). In the 390×236 band it is about 54.6 px, a 40 px cap height of 20 two-pixel cells (R10: the name scales to the band). 12.16: on a portrait box (the phone layout's whole-viewport field, 3.1.13) the name stacks into two lines at its first space (`entryText`); `fontPx = min(0.4 × box.h / 2.1, 0.84 × box.w × 100 / widthAt100)` with `widthAt100` the longer line's ("Parsa" = 3.0 em) and a 1.1 em baseline advance (`LINE_ADVANCE_EM`), the two-line block centred on the box centre by its ink box: about 109 px at 390×664, so the name forms at the screen's centre at twice the one-line size.
- **3.4.7 DOM contract.** One attribute on `<html>`, `data-entry`, carries the entry state; one boolean attribute, `data-field-ready`, shows the canvas. No inline styles, no `style` attributes.

| `data-entry` | set by | rail blocks `[data-reveal]` | `.scrim` |
|---|---|---|---|
| `run` | `theme-boot.js`, before first paint | hidden (opacity 0, translateY 6 px); a 4000 ms CSS failsafe reveals them | hidden; same failsafe |
| `wait` | `main.ts`, the moment it takes control | hidden, `pointer-events: none` | hidden |
| `scrim` | `App` on the `scrim` event | hidden, `pointer-events: none` | fades in, 800 ms linear |
| `reveal` | `App` on the `reveal` event | fade in: opacity 600 ms ease-out, transform 600 ms `cubic-bezier(0.2, 0.7, 0.2, 1)`, delay n × 40 ms | visible |
| `skip` | `App` on `skip()` | visible at once, no transition | visible at once |
| absent | default; `App` on `cleanup`; `main.ts` on fallback | visible | visible |

  Appendix C §2's "entry hooks" block is replaced by exactly this CSS (the reduced-motion block in 3.6.4 must come after it in the file):

```css
/* field canvas: invisible until the first real frame (data-field-ready) */
.field { opacity: 0; }
html[data-field-ready] .field { opacity: 1; transition: opacity 400ms linear; }

/* entry: rail blocks and scrim hidden until the reveal */
html[data-entry="run"] [data-reveal],
html[data-entry="wait"] [data-reveal],
html[data-entry="scrim"] [data-reveal] { opacity: 0; transform: translateY(6px); }
html[data-entry="wait"] [data-reveal],
html[data-entry="scrim"] [data-reveal] { pointer-events: none; }
html[data-entry="run"] .scrim,
html[data-entry="wait"] .scrim { opacity: 0; }
html[data-entry="scrim"] .scrim,
html[data-entry="reveal"] .scrim { opacity: 1; transition: opacity 800ms linear; }
html[data-entry="reveal"] [data-reveal] {
  opacity: 1;
  transform: none;
  transition: opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 40ms);
}
html[data-entry="skip"] [data-reveal],
html[data-entry="skip"] .scrim { opacity: 1; transform: none; transition: none; }

/* failsafe: if main.ts never takes control, show everything after 4 s */
html[data-entry="run"] [data-reveal],
html[data-entry="run"] .scrim { animation: pn-failsafe 1ms linear 4000ms forwards; }
@keyframes pn-failsafe { to { opacity: 1; transform: none; } }

[data-reveal="1"] { --i: 1; } [data-reveal="2"] { --i: 2; } [data-reveal="3"] { --i: 3; }
[data-reveal="4"] { --i: 4; } [data-reveal="5"] { --i: 5; } [data-reveal="6"] { --i: 6; }
[data-reveal="7"] { --i: 7; }
```

  - **3.4.7.1** `data-field-ready` is set on the `start` event on the entry path, and on the first real frame (programs ready) on every other path. Without JS it is never set, and the blank canvas stays invisible.
  - **3.4.7.2** Without JS `data-entry` is never set, so the rail shows at once (R13).
- **3.4.8 Hidden tab.** At load the machine waits in `pending` (animation frames do not run while hidden) and starts on the first visible frame (R6). Mid-entry, frames stop, the entry clock and sim time freeze, and CSS transitions already running finish on their own. A prerendered page reports `hidden` and is handled the same way.
- **3.4.9 Skip.** `skip()` makes the rail usable at once:
  - triggers: a `focusin` inside `.rail` while `data-entry` is present; reduced motion turning on mid-entry; WebGL context loss;
  - effect: `data-entry="skip"` (rail and scrim visible, no transition), `data-field-ready` set, and the mask dissolves from its current `e` to 0 over 250 ms as `e = e0 × smoothstep(1 − u)` with `u = elapsed / 250`;
  - when that 250 ms dissolve ends, `done` and `cleanup` fire together in one tick, and `cleanup` removes `data-entry`;
  - a skip in phase `done` (between 2700 and 3300 ms) runs `cleanup` at once;
  - a keyboard user therefore never lands on an invisible link (house rule kept from the teaser's `:focus-within` rule).
- **3.4.10 Reduced motion.** `theme-boot.js` never sets `data-entry`, `main.ts` never arms, and the layout is instant with a static field (3.6.4).
- **3.4.11 Konami replay (R12c).** The Konami code (ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a) makes the field form `nice.` with the same pipeline and a different mask:
  - timings: gather 900 ms, hold 1500 ms, dissolve 800 ms (3200 ms in total); no `scrim`, `reveal` or `cleanup` events; the rail stays visible;
  - ignored while the entry or another Konami is running, when the field is not running (fallback), and when the scrim leaves no clear field (mask box width 0: rail windows about 720–790 px wide; 12.7);
  - mask box, rail layout: `{ x: scrimRight, y: 0, w: fieldCssW − scrimRight, h: fieldCssH }`, where `scrimRight = scrim.getBoundingClientRect().right` (the point where the scrim reaches alpha 0), measured at trigger time; at 1440×900 this is x 950–1440 and a 137 px "nice.";
  - mask box, band layout: the whole band; the layout is read at trigger time as `matchMedia(BAND_QUERY).matches`;
  - same font rule as 3.4.6 (text `nice.`, 700);
  - the detector listens to `keydown` on `document`; events with Ctrl, Meta or Alt held and auto-repeat events are ignored (they neither advance nor reset the sequence), and so does a keydown without a string `key` (a synthetic event; 12.7); `b` and `a` match in either case; any other key resets the sequence, and an overlapping prefix (`↑ ↑ ↑ ↓ ↓ …`) still matches;
  - under reduced motion `e` jumps 0 → 1, holds 1500 ms, and jumps back to 0, with no gather or dissolve.

### 3.5 Interactions and details

- **3.5.1 Hover brackets (R11).** Links (`.lnk`) show mono brackets `[ github ]` on hover and on `:focus-visible`, exactly Appendix C §2: the `[` and `]` are generated content positioned outside the link box (`right: 100%; padding-right: 1ch` and its mirror), opacity 0 → 1 over 150 ms, colour `--accent-2`. They hang into the gutter or the 4ch gap between links, so nothing shifts; measured link rects are identical before and during hover.
- **3.5.2 Focus-visible.** Links: the brackets plus a 1 px `--focus-ring` underline at a 0.35em offset (two cues, neither colour-only). The toggle: the same treatment on its word (3.1.16). `:focus` without `:focus-visible` shows nothing extra.
- **3.5.3 Email copy (R11).** "say hi" is `<a href="mailto:info@parsanaji.com" data-email="info@parsanaji.com">`.
  - A primary click without Ctrl, Meta, Shift or Alt calls `preventDefault()` and copies `info@parsanaji.com` with `navigator.clipboard.writeText`. A modified or middle click keeps the native `mailto:` behaviour.
  - On success the anchor gets `data-copied` for 1200 ms: "say hi" swaps to `copied` in plain `--accent-2` in the same grid cell (both labels 6ch, measured width 46.81 px in both states) and the brackets are suppressed. A second copy within 1200 ms restarts the timer.
  - On success the live region `[data-live]` (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`, present and empty from load) is cleared, receives `Email address copied.` on the next animation frame, and is cleared again 3000 ms later.
  - When `navigator.clipboard` or `writeText` is missing, or `writeText` rejects, the page navigates to `mailto:info@parsanaji.com` with `location.assign`.
  - At boot the script adds `aria-describedby="email-hint"`; the hidden hint reads `Copies info@parsanaji.com to the clipboard.`.
- **3.5.4 Shortcuts (R12a).** One `keydown` listener on `document`:
  - `g` opens GitHub (`location.assign` of the github anchor's `href`, same tab);
  - `l` opens LinkedIn, only when the LinkedIn anchor exists (3.1.12);
  - `e` runs the email copy of 3.5.3 (same success, live-region and fallback behaviour);
  - `?` toggles the shortcuts overlay (matched on `event.key === '?'`, so any keyboard layout works);
  - `Escape` closes the overlay.
  - Events with Ctrl, Meta or Alt held are ignored; Shift is allowed. Auto-repeat events and events from editable targets (`input`, `textarea`, `select`, `[contenteditable]`) are ignored. Upper-case `G`, `L` and `E` map like lower case (Caps Lock).
  - While the overlay is open only `?` and `Escape` act.
- **3.5.5 Shortcuts overlay.** A native modal `<dialog class="keys" data-keys aria-labelledby="keys-title" closedby="any">`, exactly Appendix C §1 and §2:
  - title `Shortcuts`; rows `g` GitHub, `l` LinkedIn (row hidden until LinkedIn exists), `e` Copy email, `?` Show or hide this list, `esc` Close; a `close` button;
  - `?` calls `showModal()` or `close()`; `showModal()` makes the page inert, `Escape` closes natively, focus lands on `close` and returns to the opener on close;
  - a click on the backdrop (`event.target === dialog`) closes it in engines without `closedby`;
  - 150 ms opacity fade with `@starting-style`; no fade under reduced motion.
- **3.5.6 Name scramble (R12b).** A click on the name (`[data-name]`) scrambles its letters through random glyphs from `SCRAMBLE_GLYPHS` (printable ASCII letters, digits and `#%&*+=?@<>/`, all inside the font subset) and settles back over 600 ms:
  - a step every 40 ms; letter i (0-based, n = 10) settles at `600 × (0.3 + 0.7 × i / (n − 1))` ms; the space never changes; the final text is exactly `Parsa Naji`;
  - the glyph choice uses `mulberry32` seeded from `?seed=` or the load time;
  - while scrambling the h1 carries `aria-label="Parsa Naji"`, removed at the end;
  - a click during a running scramble is ignored; reduced motion disables it;
  - the name is not focusable; the scramble is a mouse egg.
  - Mono advances mean zero layout shift.
- **3.5.7 Console line (R12d).** At boot, exactly one call: `console.log('%cParsa Naji — say hi: info@parsanaji.com', 'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0')`. Nothing else is ever logged in production.
- **3.5.8 Status line (R9).** A dot and `Building something new` in `--accent-2`, uppercase. The dot is 0.62em, `--status-dot`, with a `::after` halo in `--accent-glow` scaled 1 → 2.8 with opacity 1 → 0 over 2.4 s, `cubic-bezier(0.2, 0.6, 0.3, 1)`, infinite (transform and opacity only). No pulse under reduced motion. The dot is `aria-hidden`; the text carries the meaning.
- **3.5.9 Cursor.** `cursor: default` on the page and the name; `cursor: pointer` on links and the toggle (R11 "cursor default": no custom cursor).
- **3.5.10 Theme toggle (behaviour, R7 and the ledger ruling).**
  - The button's word is the target look: `dark` while the light look shows, `light` while the dark look shows. Its `aria-label` is `Switch to dark mode` or `Switch to light mode` to match. It has no `aria-pressed` (11.2).
  - The script removes `hidden` after it writes the word and the label. Without JS there is no toggle and the OS decides.
  - A press flips the look. When the new look equals the OS look, the stored preference is removed (back to "system"); otherwise `localStorage['pn.theme']` is `light` or `dark`.
  - While the preference is "system", an OS scheme change switches the look with the same crossfade.
  - Storage that throws or is missing counts as "system"; the toggle then works for the session only.
- **3.5.11 Keyboard rules.** Tab order is github → linkedin (when present) → say hi → theme toggle, then the browser chrome. Enter activates links and the toggle; Space activates the toggle. The h1 and the canvas are never focusable. Focus inside the rail during the entry skips it (3.4.9).
- **3.5.12 Links.** `github` is `<a class="lnk" href="https://github.com/parsanaji" rel="me" data-link="github">`. LinkedIn is absent until 3.1.12. All links open in the same tab.
- **3.5.13 Clock (R9).** The footer time is `America/Los_Angeles`, 12-hour, written as `2:36 PM PDT`: hour without a leading zero, two-digit minute, an ASCII space, `AM` or `PM`, an ASCII space, the short zone name (`PDT` or `PST`). It is built from `Intl.DateTimeFormat('en-US', …).formatToParts`, never from `format`, because ICU 72+ inserts U+202F before AM/PM, which is not in the font subset.
  - The `<time>` element's `datetime` attribute is the 24-hour local time, for example `14:36`.
  - The first write happens at boot; then `[data-clock]` loses `hidden`. Each later write is scheduled `msToNextMinute(now) + 25` ms ahead, so the footer time changes between 25 and 100 ms after the minute boundary (12.1). A `visibilitychange` to visible rewrites at once and re-arms the timer.
  - Without JS the footer reads `Irvine, CA` only. The clock is never a live region.

### 3.6 Fallbacks (R13)

- **3.6.1 No JavaScript.** The rail is plain HTML on `--bg`, fully readable. No `data-entry`, no toggle (hidden), no clock time, no field (the canvas is never drawn and stays at opacity 0), no LinkedIn. The `mailto:` link works natively. The look follows `prefers-color-scheme`.
- **3.6.2 No WebGL2, or any WebGL failure.** These all lead to the same fallback: no `webgl2` context (with `failIfMajorPerformanceCaveat: true`, so software GL counts as none); a shader compile or link error; an incomplete framebuffer; the 3000 ms readiness timeout (3.4.3); an unrecoverable context loss (3.6.3); `?nowebgl` in the URL; `(forced-colors: active)`; a missing canvas.
  - The fallback adds `class="no-webgl"` to `<html>` (CSS hides the canvas and the scrim), removes `data-entry` (the rail shows at once, no transition), stops the loop and disposes every GL object.
  - The fallback logs nothing at error or warning level in production; in DEV it logs one `console.warn`.
  - Eggs that need the field (Konami) do nothing; every other interaction works.
- **3.6.3 Context loss.** `webglcontextlost` → `preventDefault()`, `skip()` if the entry is running, pause, mark lost. `webglcontextrestored` → `renderer.restore()` (programs, VAO, targets, mask) and resume. No restore within 3000 ms → the fallback of 3.6.2.
- **3.6.4 Reduced motion.** Under `prefers-reduced-motion: reduce`:
  - no entry (3.4.10), no rings, no status pulse, no scramble, no breath (`uBreath = 1`), no CSS transitions on links, the toggle or the overlay;
  - the field is static: at load τ = 12 s (the same still as the OG image); a switch to reduced motion mid-session freezes the current τ instead of jumping;
  - pointer repel stays on (R13);
  - rendering is on demand: the loop idles once the pointer is settled (strength at its target and the eased point within 0.25 px of the raw point) and no colour tween, Konami or resize is pending; pointer events, resizes and theme changes wake it;
  - the theme crossfade still runs (a colour change, not motion);
  - Konami jumps (3.4.11).
  Appendix C §2's reduced-motion block is replaced by exactly:

```css
@media (prefers-reduced-motion: reduce) {
  .dot::after { animation: none; opacity: 0; }
  .lnk, .lnk::before, .lnk::after,
  .theme-toggle, .theme-word, .theme-word::before, .theme-word::after,
  .keys { transition: none; }
  html[data-entry] [data-reveal],
  html[data-entry] .scrim { opacity: 1; transform: none; transition: none; animation: none; pointer-events: auto; }
  html[data-field-ready] .field { transition: none; }
}
```

- **3.6.5 Forced colours.** No field (CSS hides the canvas and the scrim; `main.ts` does not start the renderer; `theme-boot.js` does not set `data-entry`). Appendix C §2's forced-colours rules apply (dot `CanvasText`, no halo, eyebrow rule `CanvasText`, links get a 2 px `LinkText` outline on focus).
- **3.6.6 Print.** Appendix C §2's print rules: no field, scrim, toggle, overlay or dot; the rail prints as a clean one-page résumé without brackets.
- **3.6.7 Fonts not loaded.** Text uses `font-display: swap`; the mask waits at most 1200 ms (3.4.3) and then uses the fallback stack.

### 3.7 Resize, orientation, visibility and bfcache (house rule kept: teaser spec 4.7, adapted per Appendix A §6)

- **3.7.1 Resize and orientation.** A `ResizeObserver` on the canvas drives every size change (window resize, orientation, the rail/band switch, the band height). Its callback, in the same task:
  - reads the CSS size and, when available, the raw DPR is 2 or less and it agrees with `cssW × dpr` and `cssH × dpr` to within 1 device px (12.5), `devicePixelContentBoxSize` for the exact device size; otherwise `round(cssW × dpr)` and `round(cssH × dpr)`;
  - sets `canvas.width` and `canvas.height`, so no frame is ever stretched;
  - recomputes the grid (3.3.2) and recreates the surface target only when `cols` or `rows` changed;
  - keeps the sim time, τ, the entry phase and the rings.
  - An active entry or Konami mask is re-rasterised 150 ms after the last resize (debounced); until then the old mask is drawn at its old extent.
- **3.7.2 DPR change without a size change** (a window dragged to another monitor): a `matchMedia('(resolution: <dpr>dppx)')` change listener, re-armed after each change, runs the same path.
- **3.7.3 Visibility.** `visibilitychange` to hidden stops the loop; to visible restarts it (the restart resets the last timestamp, so there is no catch-up) and rewrites the clock. `requestAnimationFrame` never runs while hidden (R14).
- **3.7.4 Sim time.** Sim time advances only by `clampDt(dt)` (at most 50 ms per frame) while the loop runs. Breath, rings, the entry and Konami all use sim time; τ uses sim time times `I_eff`.
- **3.7.5 bfcache.** `pagehide` pauses. `pageshow` with `persisted`: if `gl.isContextLost()`, wait for `webglcontextrestored` (3000 ms, then the fallback); otherwise resume when visible.
- **3.7.6 Context loss.** As 3.6.3.
- **3.7.7 Pointer leaving.** `pointerleave` on `document.documentElement` and `window` `blur` release the pointer (3.3.7.6).
- **3.7.8 First frame.** Right after context creation the renderer clears the canvas to `--field-0` in the same task (an `alpha: false` canvas is black until drawn). The canvas becomes visible only through `data-field-ready` (3.4.7.1).
- **3.7.9 FPS probe and degrade.** The probe measures 60 frames, starting at the entry's `done` or, without an entry, at the first real frame. If the mean rate is below 45 fps it multiplies `cellCss` by 1.5 (about 56 % fewer pass-1 cells), recomputes the grid and never runs again in the session. It never runs under reduced motion (no continuous loop). A Konami does not restart it.

---

## 4. Architecture

### 4.1 Stack

- **4.1.1** Vite 8.3.4 (Rolldown), vanilla TypeScript 5.9.3 strict, raw WebGL2 with no wrapper library, GLSL imported as strings with Vite's `?raw` suffix. No UI framework. Production `dependencies` is `{}` (R5, R14).
- **4.1.2** `devDependencies`, exact pins: `@types/node 22.20.5`, `lil-gui 0.21.0`, `sharp 0.35.5`, `subset-font 2.9.0`, `typescript 5.9.3`, `vite 8.3.4`, `vitest 5.0.5`, `wrangler 4.151.0`, plus the new `harfbuzzjs 1.6.3` and `fontverter 2.0.0` (already resolved in `package-lock.json` as `subset-font` dependencies; ledger). `@types/three` is removed.
- **4.1.3** `engines.node` is `">=22.18.0"` (the first 22.x with TypeScript type stripping on by default, which the OG script needs; ledger). CI uses Node 22 (latest 22.x); local is Node 24.19.0. `tests/env.test.ts` raises its floor to 22.18.
- **4.1.4** npm scripts: remove `og:placeholder`; keep `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `fonts`, `og` (`node scripts/og-image.mjs`), `deploy`, `deploy:preview` unchanged.
- **4.1.5** `vite.config.ts`: delete `chunkSizeWarningLimit: 700` and its comment; keep `target: 'es2022'`, `assetsInlineLimit: 0`, `sourcemap: false`. `vitest.config.ts` and `tsconfig.json` are unchanged.
- **4.1.6** `src/vite-env.d.ts` adds `interface ImportMetaEnv { readonly VITE_PN_DEBUG?: string }` (4.12.1).

### 4.2 Files and module map

Rules: one concept per file. Pure modules take DOM, time and canvas dependencies as parameters so Vitest runs them in Node. `src/engine/` survivors move to `src/core/` with `git mv`.

| file | responsibility | production callers |
|---|---|---|
| `public/theme-boot.js` | pre-paint classic script: `data-theme`, `data-entry="run"` (4.6) | `index.html` |
| `src/main.ts` | boot orchestration (4.7) | `index.html` |
| `src/app.ts` | `App`: field, models, loop, entry and Konami wiring, DOM state attributes | `main.ts`, `tweaks.ts` |
| `src/content.ts` | JS copy of the facts scripts need | `main.ts`, `app.ts` |
| `src/lifecycle.ts` | visibility, pagehide/pageshow, resize, DPR, media queries, context loss | `main.ts` |
| `src/loop.ts` | rAF loop, clamped dt, idle and wake | `app.ts` |
| `src/gl/context.ts` | WebGL2 context creation, never throws | `field/renderer.ts` |
| `src/gl/program.ts` | parallel compile and link, uniform map, GLSL headers | `field/renderer.ts` |
| `src/gl/targets.ts` | surface FBO, mask texture, fullscreen triangle | `field/renderer.ts` |
| `src/shaders/fullscreen.vert` | vertex shader for both passes | `field/renderer.ts` |
| `src/shaders/noise.glsl` | Blueprint hash, noise3, fbm | `field/renderer.ts` (pass 1 source) |
| `src/shaders/surface.frag` | pass 1 | `field/renderer.ts` |
| `src/shaders/dither.frag` | pass 2 | `field/renderer.ts` |
| `src/field/surface.ts` | pure TS twin of the GLSL math; self-contained, zero imports | `app.ts` (`flowZ`), `scripts/og-image.mjs`, tests |
| `src/field/params.ts` | `FieldParams`, `DEFAULT_FIELD` (4.9) | `main.ts`, `app.ts`, `field/renderer.ts`, `tweaks.ts` |
| `src/field/sizing.ts` | cell size, grid, lattice unit, pointer radius, `BAND_QUERY` | `app.ts`, `main.ts` |
| `src/field/flow.ts` | intensity map, effective intensity, breath | `app.ts` |
| `src/field/pointer.ts` | `PointerModel` | `app.ts` |
| `src/field/ripples.ts` | `RipplePool` (Shockwave) | `app.ts` |
| `src/field/nameMask.ts` | text → R8 coverage plane; mask boxes | `app.ts` |
| `src/field/entry.ts` | `EntryMachine` (entry and Konami) | `app.ts` |
| `src/field/renderer.ts` | `DitherRenderer`: every GL object, two passes | `app.ts` |
| `src/theme/theme.ts` | pure theme logic, `ColorTween`, toggle labels | `themeController.ts`, `app.ts`, `main.ts` |
| `src/theme/themeController.ts` | DOM: toggle, `matchMedia`, `data-theme`, metas | `main.ts` |
| `src/ui/clock.ts` | footer clock | `main.ts` |
| `src/ui/links.ts` | LinkedIn presence (adapted from `exitLine.ts`) | `main.ts` |
| `src/ui/emailCopy.ts` | "say hi" copy and fallback | `main.ts` |
| `src/ui/overlay.ts` | `?` dialog | `main.ts` |
| `src/eggs/shortcuts.ts` | `g`, `l`, `e`, `?`, `Escape` | `main.ts` |
| `src/eggs/scramble.ts` | name scramble | `main.ts` |
| `src/eggs/konami.ts` | Konami detector | `main.ts` |
| `src/eggs/greeting.ts` | console line | `main.ts` |
| `src/core/prng.ts`, `easing.ts`, `time.ts`, `quality.ts` | kept utilities (`mulberry32`, `seedFromLocation`, easing curves, `clampDt`, `capDpr`, `FpsProbe`) | various |
| `src/boot/fonts.ts` | `waitForFont` (kept) | `app.ts` |
| `src/tweaks.ts` | debug panel (4.12) | `main.ts` (debug builds only) |
| `src/styles.css` | `@property` block, tokens, layout (4.6.3) | `index.html` |
| `scripts/og-image.mjs` | OG image and favicon PNGs (4.10) | `npm run og` |
| `scripts/subset-fonts.mjs` | JetBrains Mono subsets (4.11) | `npm run fonts` |

### 4.3 Exported APIs (normative)

This block is Appendix A §2.2 with the changes of this spec applied. Where they differ, this block wins.

```ts
// src/gl/context.ts
export const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
  preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
};
export function createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs?: WebGLContextAttributes): WebGL2RenderingContext | null; // never throws

// src/gl/program.ts
export const GLSL_HEADER_FRAG = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
export const GLSL_HEADER_VERT = '#version 300 es\n';
export interface ProgramHandle { program: WebGLProgram; uniforms: Readonly<Record<string, WebGLUniformLocation>> }
export interface PendingProgram { ready(): boolean; finish(): ProgramHandle } // finish() throws ShaderError
export class ShaderError extends Error { readonly log: string; constructor(message: string, log: string) }
export function startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram;
export function uniformMap(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation>; // "uRipples[0]" -> "uRipples"

// src/gl/targets.ts
export interface SurfaceTarget { tex: WebGLTexture; fbo: WebGLFramebuffer; cols: number; rows: number }
export function createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget; // RGBA8, NEAREST, CLAMP; throws if incomplete
export function createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture; // R8, LINEAR, CLAMP
export function createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer };
export function deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void;

// src/field/surface.ts  (self-contained: no import statements, erasable TypeScript only)
export const NOISE_OFFSET = 256;
export const Z_PERIOD = 256;
export function hash3(x: number, y: number, z: number): number;
export function noise3(x: number, y: number, z: number): number;
export function fbm(x: number, y: number, z1: number, z2: number): number;
export function flowZ(tSec: number, intensity: number, out?: Float32Array): Float32Array; // 6 values in [0, 256); App calls flowZ(tau, 1)
export interface SurfaceShape { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number }
export const BLUEPRINT_SHAPE: SurfaceShape; // { 240, 160, 2.6, 0.3, 2.1 }
export function surface(xCss: number, yCss: number, z: ArrayLike<number>, s?: SurfaceShape): number;
export interface Ring { x: number; y: number; radius: number; amp: number; sigma: number; gain: number }
export function ringGain(xCss: number, yCss: number, ring: Ring): number; // gain * amp * exp(-(d - r)^2 / (2 sigma^2))
export const BAYER8: readonly number[];
export function bayerThreshold(i: number, j: number): number; // (BAYER8[(i&7)|((j&7)<<3)] + 0.5) / 64
export function tierOf(v: number, i: number, j: number, t2?: number, t3?: number): 0 | 1 | 2 | 3; // defaults 0.66, 0.9
export function tierGrid(cols: number, rows: number, cellCss: number, tSec: number, intensity: number, rings?: readonly Ring[]): Uint8Array;

// src/field/params.ts
export type Density = 'sparse' | 'medium' | 'dense';
export type Intensity = 'subtle' | 'medium' | 'lively';
export interface FieldParams { /* the exact tree of DEFAULT_FIELD in 4.9 */ }
export const DEFAULT_FIELD: FieldParams;
export function cloneField(p: FieldParams): FieldParams; // structuredClone

// src/field/sizing.ts
export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';
export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number }
export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number;
export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid;
export function latticeSpacing(fieldCssW: number): number; // clamp(w / 48, 8, 40)
export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number; // min(w,h)*0.28 + 2*sp (before the speed widening)

// src/field/flow.ts
export const INTENSITY_K: Readonly<Record<Intensity, number>>; // { subtle: 0.55, medium: 1, lively: 1.7 }
export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number; // INTENSITY_K[intensity] * flowSpeed
export function breathScale(tMs: number, amp: number, periodMs: number): number; // moved verbatim from engine/motion.ts

// src/field/pointer.ts
export type PointerKind = 'mouse' | 'pen' | 'touch';
export class PointerModel {
  constructor(p: FieldParams['pointer']);
  move(x: number, y: number, kind: PointerKind): void;  // field-space CSS px (raw)
  down(x: number, y: number, kind: PointerKind): void;  // touch snaps the eased point to the raw point
  release(): void;
  tick(dtMs: number): void;
  get x(): number; get y(): number;
  get strength(): number;   // eased 0..1
  get speed(): number;      // px/s of the eased point, 100 ms exponential average
  get velFactor(): number;  // min(speed / velNorm, 1)
  get settled(): boolean;   // strength at its target and eased point within 0.25 px of raw
}

// src/field/ripples.ts
export class RipplePool {
  constructor(p: FieldParams['ripple']);
  spawn(x: number, y: number, tSec: number): void;           // drops the oldest at p.max
  write(tSec: number, sp: number, out: Float32Array): number; // fills 8 x vec4 (x, y, radius, amp), zeroes unused slots, returns the active count, prunes expired
  clear(): void;
  get count(): number;
}

// src/field/nameMask.ts
export interface Context2DLike { /* as Appendix A: sampler.ts's interface plus actualBoundingBoxAscent/Descent in measureText */ }
export interface Canvas2DLike { /* as sampler.ts */ }
export type CanvasFactory = (w: number, h: number) => Canvas2DLike;
export interface MaskBox { x: number; y: number; w: number; h: number } // field-space CSS px
export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number } // supersample = 2
export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }
export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number;
export function rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane;
export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array;
export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox;
// entry: whole field; konami: whole field when band, else { x: scrimRight, y: 0, w: field.w - scrimRight, h: field.h }

// src/field/entry.ts
export type EntryPhase = 'idle' | 'pending' | 'gather' | 'hold' | 'dissolve' | 'done';
export type EntryEvent = 'start' | 'scrim' | 'reveal' | 'skip' | 'done' | 'cleanup';
export interface EntryTimings { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number | null; revealAtMs: number | null; cleanupAtMs: number | null }
export const ENTRY_TIMINGS: EntryTimings;  // { 900, 1000, 800, 1900, 2100, 3300 }
export const KONAMI_TIMINGS: EntryTimings; // { 900, 1500, 800, null, null, null }
export class EntryMachine {
  constructor(t: EntryTimings, emit: (e: EntryEvent) => void);
  arm(): void;                                  // idle -> pending
  setReady(ready: boolean): void;
  tick(dtMs: number, visible: boolean): number; // returns e in 0..1
  skip(fastMs?: number): void;                  // default 250; emits 'skip', then 'done' and 'cleanup' when the fast dissolve ends
  get phase(): EntryPhase; get elapsedMs(): number;
}
export function entryProgress(tMs: number, t: EntryTimings): number;

// src/field/renderer.ts
export const UNIFORMS_PASS1: readonly string[]; // uCell uZ uZm uCenter uBreath uPointer uWarp uRipples uRipple uMask uMaskSize uE uMaskMix uShape uLevel
export const UNIFORMS_PASS2: readonly string[]; // uSurf uCellDev uCanvasH uField0 uField1 uField2 uField3 uTiers
export interface FieldColors { f0: RGB; f1: RGB; f2: RGB; f3: RGB }
export interface FrameInputs {
  z: Float32Array; breath: number; center: [number, number];
  pointer: { x: number; y: number; radius: number; strength: number };
  ripples: Float32Array; rippleSigma: number; maskE: number; colors: FieldColors;
}
export class DitherRenderer {
  static create(canvas: HTMLCanvasElement, params: FieldParams): DitherRenderer | null; // never throws
  get ready(): boolean; get failed(): boolean; get lost(): boolean;
  clear(c: RGB): void;
  resize(grid: Grid): void;
  setMask(plane: MaskPlane | null): void;
  setParams(p: FieldParams): void;
  render(f: FrameInputs): void;    // exactly two drawArrays(TRIANGLES, 0, 3)
  restore(): boolean;
  dispose(): void;
}

// src/loop.ts
export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }
export function createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop;
// onFrame returns false to idle; wake() schedules one frame; dt = clampDt(now - last); start() resets last

// src/lifecycle.ts
export interface LifecycleTarget {
  pause(): void; resume(): void; resize(): void; dprChanged(): void;
  reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
}
export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void;

// src/app.ts
export interface AppOptions {
  canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
  entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
}
export class App implements LifecycleTarget {
  static start(o: AppOptions): App | null;
  setColors(c: FieldColors, animate: boolean): void; // 300 ms ColorTween when animate
  konami(): void;
  replayEntry(): void;                               // debug panel: re-arms the full entry including data-entry="wait"
  applyParams(): void;                               // debug panel live update (regrid when cell or density changed)
  onFallback(fn: () => void): void;
  get grid(): Grid | null;                           // debug hook
  dispose(): void;
  /* LifecycleTarget methods */
}

// src/theme/theme.ts
export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';
export const THEME_KEY = 'pn.theme';
export type RGB = readonly [number, number, number]; // sRGB 0..1
export function readPref(storage: Pick<Storage, 'getItem'> | null): ThemePref;      // try/catch; anything else -> 'system'
export function writePref(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePref): void; // 'system' removes the key; never throws
export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme;
export function togglePref(current: Theme, systemDark: boolean): ThemePref;         // flips; 'system' when the flip equals the OS look
export function toggleLabel(current: Theme): { word: 'dark' | 'light'; label: 'Switch to dark mode' | 'Switch to light mode' }; // the target look
export function parseHex(hex: string): RGB;
export function lerpRGB(a: RGB, b: RGB, t: number): RGB;
export class ColorTween {
  constructor(durMs?: number);          // 300
  set(c: FieldColors): void;
  start(to: FieldColors, nowMs: number): void;
  sample(nowMs: number): FieldColors;   // linear, wall clock, clamps at 1
  get active(): boolean;
}

// src/theme/themeController.ts
export interface ThemeControllerDeps {
  doc: Document; storage: Storage | null; systemDark: MediaQueryList; button: HTMLButtonElement | null;
  onChange: (colors: FieldColors, animate: boolean) => void;
}
export function initTheme(d: ThemeControllerDeps): { readonly theme: Theme; readonly colors: FieldColors; dispose(): void };
export function readFieldColors(doc: Document): FieldColors; // getComputedStyle(documentElement) --field-0..3

// src/ui/clock.ts
export function formatClock(date: Date, timeZone?: string, locale?: string): { time: string; zone: string; datetime: string }; // { '2:36 PM', 'PDT', '14:36' }
export function msToNextMinute(date: Date): number; // 60000 - (seconds * 1000 + milliseconds)
export function startClock(el: HTMLTimeElement, timeZone: string, now?: () => Date): () => void; // writes "2:36 PM PDT" + datetime; returns stop

// src/ui/links.ts
export function initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }; // true when the URL is non-empty and [data-link="linkedin"] exists; then un-hides [data-key="linkedin"]

// src/ui/emailCopy.ts
export type CopyResult = 'copied' | 'fallback';
export function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined): Promise<CopyResult>;
export function initEmailCopy(link: HTMLAnchorElement, email: string, deps?: { clipboard?: Pick<Clipboard, 'writeText'>; assign?: (url: string) => void; holdMs?: number; live?: HTMLElement | null }): { trigger(): Promise<CopyResult>; dispose(): void };

// src/ui/overlay.ts
export function initOverlay(panel: HTMLDialogElement, doc: Document): { toggle(): void; close(): void; readonly open: boolean; dispose(): void };

// src/eggs/shortcuts.ts
export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';
export interface KeyLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean; target: EventTarget | null }
export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null;
export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void;

// src/eggs/scramble.ts
export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';
export function scrambleText(target: string, tMs: number, durMs: number, stepMs: number, rand: (step: number, i: number) => number): string;
export function initScramble(el: HTMLElement, text: string, opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean }): () => void;

// src/eggs/konami.ts
export const KONAMI: readonly string[]; // ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a
export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void }; // b and a case-insensitive

// src/eggs/greeting.ts
export function greet(log?: (...args: unknown[]) => void, email?: string): void; // exactly the call in 3.5.7

// src/content.ts
export const CONTENT: {
  readonly name: 'Parsa Naji'; readonly email: 'info@parsanaji.com'; readonly konamiText: 'nice.';
  readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string }; // linkedin '' until 3.1.12
  readonly clock: { readonly timeZone: 'America/Los_Angeles' };
};

// kept: src/core/prng.ts (mulberry32, seedFromLocation), src/core/easing.ts (clamp01, easeOutExpo, easeInCubic, easeOutCubic),
// src/core/time.ts (clampDt, 50 ms cap), src/core/quality.ts (capDpr, FpsProbe; the particle-count exports are deleted),
// src/boot/fonts.ts (waitForFont, FontWaitResult 'loaded' | 'timeout' | 'unavailable')
```

- **4.3.1** Every `init*` function tolerates a missing element by returning a no-op and never throws. No module logs at error or warning level in production.
- **4.3.2** DOM hooks are data attributes from Appendix C §1.1 (`[data-field]`, `[data-rail]`, `[data-name]`, `[data-link]`, `[data-email]`, `[data-clock]`, `[data-clock-time]`, `[data-theme-toggle]`, `[data-theme-word]`, `[data-keys]`, `[data-keys-close]`, `[data-key="linkedin"]`, `[data-live]`), plus `#email-hint` and `.scrim`. Scripts change state only through classes and `data-*` attributes, never `style` attributes (CSP, 4.6.1).

### 4.4 Data flow and the frame

- **4.4.1** Boot: `main.ts` wires the DOM modules, resolves the theme colours from CSS, then starts `App` (4.7).
- **4.4.2** Input: `window` pointer listeners feed `PointerModel` (field space) and `RipplePool`; `document` keydown feeds shortcuts and Konami; the theme controller calls `App.setColors`.
- **4.4.3** Each frame (`onFrame(dt, now)`), in this order:
  1. `dt = clampDt(now − last)`; sim time `t += dt`; `τ += dt / 1000 × I_eff` unless frozen;
  2. `pointer.tick(dt)`; `ripples.write(t / 1000, sp, buf)`; `e = entry.tick(dt, visible)` (or the Konami machine's);
  3. `colors = tween.sample(now)` (wall clock);
  4. `renderer.render({ z: flowZ(τ, 1), breath, center, pointer, ripples, rippleSigma: 1.6 × sp, maskE: e, colors })`;
  5. FPS probe push when active;
  6. return `false` (idle) only under reduced motion when the idle condition of 3.6.4 holds.
- **4.4.4** The CPU uploads about 25 uniforms per frame and does no per-cell work.
- **4.4.5** Entry events map to DOM attributes in `App`: `start` → `data-field-ready`; `scrim` → `data-entry="scrim"`; `reveal` → `data-entry="reveal"`; `skip` → `data-entry="skip"` and `data-field-ready`; `done` → delete the mask, start the probe; `cleanup` → remove `data-entry`.

### 4.5 Two-pass renderer and render-target sizing (R5)

- **4.5.1** One fullscreen triangle (`[-1, -1, 3, -1, -1, 3]`, `STATIC_DRAW`, attribute 0 bound to `aPos` before link), drawn twice per frame with `drawArrays(TRIANGLES, 0, 3)`: two draws per frame, one per pass (R14). Vertex shader exactly Appendix A §3.3.
- **4.5.2** Pass 1 renders into the surface target: `texStorage2D(RGBA8)`, `cols × rows`, NEAREST, CLAMP_TO_EDGE, one texel per cell, `.r = v`; viewport `cols × rows`. Its FBO must be `FRAMEBUFFER_COMPLETE`, otherwise the fallback runs. The target is recreated only when `cols` or `rows` change.
- **4.5.3** Pass 1 source is `GLSL_HEADER_FRAG` + the uniform block + `noise.glsl` + the body, exactly Appendix A §3.4 and §3.5. Pass 1 samples only texture unit 1 (the mask).
- **4.5.4** Pass 2 renders into the default framebuffer at `widthDev × heightDev`: it computes the cell from `gl_FragCoord` (`ivec2(x / uCellDev, (uCanvasH − y) / uCellDev)`), reads it with `texelFetch` (nearest by construction, so cells stay crisp at any DPR), thresholds with Bayer 8×8 and maps tiers to colours. Exactly Appendix A §3.6. Pass 2 samples only unit 0 (the surface); the surface texture is never bound to unit 1, so no feedback loop exists.
- **4.5.5** Uniform values and units are exactly Appendix A §3.7 (summary in the glossary, 10.2). Values marked "on change" are set only when they change.
- **4.5.6** No per-frame `clear` (both passes cover every pixel); blending and depth stay off.
- **4.5.7** The mask texture is `R8`, `2·cols × 2·rows`, LINEAR, CLAMP_TO_EDGE, uploaded with `UNPACK_ALIGNMENT 1` and without FLIP_Y or PREMULTIPLY_ALPHA (Firefox warns when those are set on typed arrays). It is built when an entry or Konami arms and deleted at `done`.
- **4.5.8** Every `smoothstep` has ascending edges and no `pow()` appears in GLSL (vault gotcha: both are undefined on ANGLE otherwise).
- **4.5.9** The canvas has `image-rendering: pixelated`; at DPR 3 the even `cellDev` makes the compositor's 1.5× scale land on whole device pixels.
- **4.5.10** Sizing rules are 3.3.2 and 3.7.1; the cost table is Appendix A §4.2 (pass-1 texels 51,840 at 1440×900 DPR 1; measured GPU time for both passes 0.075 ms on the owner's RTX 2080 SUPER).

### 4.6 Theme bootstrap under the CSP (R7, ledger ruling D5)

- **4.6.1 CSP facts** (`public/_headers`, unchanged): `script-src 'self' https://static.cloudflareinsights.com` allows same-origin external scripts and no inline script; the JSON-LD data block is not executed and is outside `script-src`; `style-src 'self'` blocks `<style>` elements and `style` attributes but not CSSOM writes, Web Animations or class and attribute changes.
- **4.6.2 `public/theme-boot.js`** (served at `/theme-boot.js`, under 500 bytes), exactly:

```js
(function () {
  var d = document.documentElement, t = null, rm = false, fc = false;
  try { t = localStorage.getItem('pn.theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
  try {
    rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fc = window.matchMedia('(forced-colors: active)').matches;
  } catch (e) {}
  if (!rm && !fc && !/[?&]noentry\b/.test(location.search)) d.setAttribute('data-entry', 'run');
})();
```

  - Placement: `<script src="/theme-boot.js"></script>`, classic (no `type`, `async` or `defer`), directly after the viewport meta and before the stylesheet link. The preload scanner fetches it in parallel with the CSS and fonts; it runs in well under 1 ms. Vite copies a `public/` classic script reference as-is without a warning.
- **4.6.3 Stylesheet order.** `src/styles.css` is, in this order: (1) the `@property` block of 4.6.4; (2) Appendix B §1.1's token blocks with the deletions of 3.2.1; (3) Appendix C §2's layout with the replacements of 3.1.13, 3.1.16, 3.3.7.8, 3.4.7 and 3.6.4. Dark is the base `:root`; light applies under `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) … }` and under `:root[data-theme="light"]`. No JS plus a light OS gives light; no JS plus a dark OS gives dark; a stored choice is applied before first paint.
- **4.6.4 Registered tokens.** The twelve literal-valued colour tokens that differ between looks are registered, and `html.theme-anim` transitions them, exactly:

```css
@property --bg { syntax: '<color>'; inherits: true; initial-value: #050a22; }
@property --fg { syntax: '<color>'; inherits: true; initial-value: #e8eeff; }
@property --fg-2 { syntax: '<color>'; inherits: true; initial-value: #7993da; }
@property --accent { syntax: '<color>'; inherits: true; initial-value: #8db0ff; }
@property --accent-2 { syntax: '<color>'; inherits: true; initial-value: #5b81ff; }
@property --accent-glow { syntax: '<color>'; inherits: true; initial-value: rgb(141 176 255 / 0.35); }
@property --line { syntax: '<color>'; inherits: true; initial-value: rgb(232 238 255 / 0.14); }
@property --scrim-solid { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 1); }
@property --scrim-mid { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 0.86); }
@property --scrim-clear { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 0); }
@property --overlay-bg { syntax: '<color>'; inherits: true; initial-value: rgb(5 10 34 / 0.94); }
@property --overlay-border { syntax: '<color>'; inherits: true; initial-value: rgb(232 238 255 / 0.18); }
html.theme-anim {
  transition: --bg 300ms linear, --fg 300ms linear, --fg-2 300ms linear, --accent 300ms linear,
    --accent-2 300ms linear, --accent-glow 300ms linear, --line 300ms linear, --scrim-solid 300ms linear,
    --scrim-mid 300ms linear, --scrim-clear 300ms linear, --overlay-bg 300ms linear, --overlay-border 300ms linear;
}
```

  - The alias tokens (`--focus-ring`, `--status-dot`, `--line-strong`) stay unregistered and follow their sources. `--field-0..3` and `--theme-color` stay unregistered, so `getComputedStyle(documentElement)` returns the target hex the moment `data-theme` changes; CSS is the single source of the field colours.
- **4.6.5 Toggle steps.** On a press, `themeController` runs, in order:
  1. add class `theme-anim` to `<html>`;
  2. compute `pref = togglePref(currentTheme, systemDark.matches)`; set `data-theme` to the pref, or remove it for `'system'`;
  3. `writePref(storage, pref)`;
  4. `colors = readFieldColors(doc)`; call `onChange(colors, true)`, which starts the `ColorTween` at `performance.now()`;
  5. set both `theme-color` metas' `content` to the computed `--theme-color`, or restore `#f2f6fe` and `#050a22` for `'system'`;
  6. write `toggleLabel(newTheme)` into `[data-theme-word]` and the button's `aria-label`;
  7. remove `theme-anim` 320 ms later (a second press within that time clears and re-arms the timer).
  - An OS change while the pref is `'system'` runs steps 1, 4, 5, 6 and 7.
- **4.6.6 Crossfade parity.** The `ColorTween` is linear per channel in sRGB 0..1 over 300 ms on `performance.now()`: `c = c0 + (c1 − c0) × min(1, (now − t0) / 300)`. CSS interpolates the registered sRGB colours the same way, so off cells (field-0) and the page background move in step. Under reduced motion the loop is woken until the tween ends.
- **4.6.7 Initial state.** `initTheme` reads the pref, resolves the theme, writes the toggle word and label, re-applies `data-theme` (idempotent with `theme-boot.js`), sets the metas when the pref is explicit, removes `hidden` from the button and returns the resolved field colours.

### 4.7 Boot order and asynchronous shader compile

- **4.7.1 Synchronous part of `main.ts`** (before any `await`), in order: `greet()`; `initLinks(CONTENT.links.linkedin)`; `initEmailCopy`; `startClock` then un-hide `[data-clock]`; `initTheme`; `initOverlay`; `initShortcuts`; `initScramble`; the Konami listener (calls `app?.konami()`); `reduced = matchMedia('(prefers-reduced-motion: reduce)').matches`.
- **4.7.2 Taking control of the entry.** If `<html>` has `data-entry="run"`: when `performance.now()` is below 4000, set `data-entry="wait"` (this cancels the CSS failsafe) and plan an entry; otherwise remove `data-entry` and plan none (the failsafe already showed the rail). The entry plays only when `data-entry` is `"wait"` after this step.
- **4.7.3 Field gate.** Run the fallback of 3.6.2 when `?nowebgl` is in the URL, `matchMedia('(forced-colors: active)').matches`, `[data-field]` is missing, or `App.start(...)` returns `null`.
- **4.7.4 `App.start`:**
  1. `DitherRenderer.create` (context, both programs started with `KHR_parallel_shader_compile` when present), then `clear(colors.f0)` in the same task;
  2. `bindLifecycle`; `loop.start()`;
  3. when the entry is planned: `entry.arm()` and the `focusin` listener on the rail;
  4. `waitForFont('700 10px "JetBrains Mono"', 1200)`;
  5. on each frame while not ready: poll `COMPLETION_STATUS_KHR` (or, without the extension, query link status inside an animation frame after first paint, never before); a `ShaderError` → fallback;
  6. when programs are ready and the font has settled: rasterise the mask, `setMask`, `entry.setReady(true)`;
  7. not ready 3000 ms after the first animation frame → fallback.
  - Measured first compile on ANGLE/D3D11: 206 ms off the main thread (0.9 ms to submit), 4 ms when cached. The entry waits for `ready`, so the hitch is never visible.
- **4.7.5 Debug.** When `PN_DEBUG` (4.12.1) is true, expose `window.__pn = { parity(), gpuTime(frames), setTime(ms), setE(e), grid() }`; when `PN_DEBUG` is true and the URL has `?debug`, `await import('./tweaks')` and mount the panel.
- **4.7.6 Errors.** Every promise is caught. Production logs nothing at error or warning level; DEV logs one `console.warn` per failure.

### 4.8 Name-mask rasteriser (`src/field/nameMask.ts`)

- **4.8.1** Adapted from `src/engine/sampler.ts`: keep `Context2DLike`, `Canvas2DLike`, `CanvasFactory` and the injected-canvas testability; drop `scanAlpha`, `subsampleToN`, `glyphCenters` and `sampleText`.
- **4.8.2** The plane covers the whole field at `supersample = 2` texels per cell: `2·cols × 2·rows`, one texel = `uCell / 2` CSS px. `uMaskSize = (cols × uCell, rows × uCell)` CSS px.
- **4.8.3** Font size: measure the text at 100 px (`widthAt100`), then `fontPx = fitFontPx(widthAt100, box, 0.4, 0.84) = min(0.4 × box.h, 0.84 × box.w × 100 / widthAt100)` in CSS px; draw at `fontPx × 2 / uCell` texels with the font string `700 <size>px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
- **4.8.4** Draw white text on a transparent canvas with `textAlign = 'center'` at the box centre x and `textBaseline = 'alphabetic'` at `y = cy + (ascent − descent) / 2`, using `measureText().actualBoundingBoxAscent` and `actualBoundingBoxDescent`. When those are absent (test fakes), use ascent `0.73 × size` (JetBrains Mono's cap height) and descent 0. No letter-spacing.
- **4.8.5** `alphaPlane` extracts byte 3 of every RGBA pixel into the R8 plane.

### 4.9 `DEFAULT_FIELD` (every tunable, exact values)

This replaces Appendix A §2.5. Changes: `flowSpeed` added; the CSS-owned durations (scrim 800 ms, block fade 600 ms, stagger 40 ms, field fade 400 ms) are removed because CSS owns them (3.4.7); the boot and lifecycle timeouts move to `boot`; `skipMs` is added; `mask.thetaScale` and `mask.thetaZ` are removed because the shader hard-codes 0.08 and 17.

```ts
export const DEFAULT_FIELD: FieldParams = {
  density: 'medium',                        // R4
  intensity: 'medium',                      // R4
  flowSpeed: 1,                             // multiplies INTENSITY_K (3.3.6)
  cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
  shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
  tiers: { t2: 0.66, t3: 0.9 },
  breath: { amp: 0.01, periodMs: 6000 },
  staticTimeS: 12,                          // reduced-motion still = the OG still
  pointer: { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 },
  ripple: { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 },
  mask: { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, fontWeight: 700 },
  entry: { gatherMs: 900, holdMs: 1000, dissolveMs: 800, scrimAtMs: 1900, revealAtMs: 2100, cleanupAtMs: 3300, skipMs: 250 },
  konami: { gatherMs: 900, holdMs: 1500, dissolveMs: 800 },
  boot: { readyTimeoutMs: 3000, fontTimeoutMs: 1200, restoreTimeoutMs: 3000, resizeDebounceMs: 150 },
  probe: { frames: 60, thresholdFps: 45 },
  theme: { crossfadeMs: 300 },
  scramble: { durMs: 600, stepMs: 40 },
  copy: { holdMs: 1200 },
};
```

- **4.9.1** `ripple.max` is at most 8 (the shader has 8 slots). `tiers.t2 < tiers.t3` always.

### 4.10 OG image and favicon PNGs (`scripts/og-image.mjs`, R11)

- **4.10.1 Run.** By hand with `npm run og`; outputs are committed. It is not part of `npm run build`, so CI never depends on harfbuzz or wasm. Deterministic for fixed inputs and a fixed sharp version.
- **4.10.2 Shared math.** It imports `tierGrid` from `../src/field/surface.ts` (Node ≥ 22.18 strips the types; `surface.ts` has no imports and only erasable TypeScript). No JS twin of the math exists.
- **4.10.3 Field.** A 200 × 105 cell grid with `CELL = 6` CSS px, τ = 12 s, intensity 1, with no Shockwave ring: the still is the name, the tagline, the domain and the plain field band (12.2). Tiers map to `#050a22`, `#3b5df0`, `#8db0ff`, `#e8eeff`. The raw RGBA buffer is upscaled exactly 6× with `sharp(raw).resize(…, { kernel: 'nearest' })` and cropped to 1200 × 630.
- **4.10.4 Scrim.** An SVG `linearGradient` (x1 0 → x2 1) over x 0–920 in `#050a22` with stop opacities 1 at x 0, 1 at x 384, 0.86 at x 704, 0.70 at x 758, 0.42 at x 812, 0.16 at x 866 and 0 at x 920. This is the page rule (3.1.10) applied to the OG text column, whose widest line (the name) ends at x 696.
- **4.10.5 Text as outlines.** `fontverter.convert(woff2, 'sfnt')`, then harfbuzzjs (Blob → Face → Font, `Buffer.addText`, `guessSegmentProperties`, `shape`, positions, `font.glyphToPath`). Each glyph becomes `<path transform="translate(x, baseline) scale(k, −k)">` with `k = size / 1000`. librsvg renders paths only, so no system font or fontconfig is involved. Fonts are the full `scripts/fonts-src/JetBrainsMono-Bold.woff2` and `-Regular.woff2`. Content:
  - `Parsa Naji`, Bold, 104 px, `#e8eeff`, x 72, baseline 300;
  - `I build AI agents, apps, and the systems behind them.`, Regular, 32 px, `#7993da`, x 76, wrapped greedily at 560 px of advance width on word boundaries: line 1 `I build AI agents, apps, and` at baseline 360, line 2 `the systems behind them.` at baseline 402;
  - `parsanaji.com`, Regular, 26 px, `#7993da`, x 76, baseline 560.
  - Compose: `sharp(bandPng).composite([{ input: Buffer.from(svg) }]).png({ compressionLevel: 9 }).toFile('public/og.png')` (about 78 KB).
- **4.10.6 Favicon PNGs.** The same script rasterises `public/favicon.svg` as is (no style rewrite: the SVG has one look, 4.10.7) with `sharp(svgBuffer, { density: 72 × size / 32 }).resize(size, size).png()` to `public/favicon-32.png` (32×32) and `public/favicon-192.png` (192×192), and with an added `.flatten({ background: '#050a22' })` to `public/apple-touch-icon.png` (180×180, no alpha channel).
- **4.10.7 `public/favicon.svg`.** The mono P and one dash (ruling 2026-10-21; the 16×16 PN pixel monogram of Appendix B §5.1 is retired): `viewBox="0 0 32 32"`; `<rect width="32" height="32" rx="7" fill="#050a22"/>`; the JetBrains Mono Bold `P` outline (harfbuzz `glyphToPath`, 23 px em, `upem` 1000, so `scale(0.023 -0.023)`) filled `#e8eeff` at `translate(6 23.5)`; and one round-capped dash `<line x1="19.5" y1="23" x2="25.5" y2="23" stroke="#3b5df0" stroke-width="4.2" stroke-linecap="round"/>` on the baseline: the name's typeface plus the field's unit. No `<style>`, no media query. Candidates and the contact sheets that picked it: the favicon lab in `.superpowers/favicon-lab/`.
- **4.10.8 Guard.** `tests/ogAsset.test.ts` checks that `public/og.png` is a 1200×630 PNG under 300 KB, and that the three favicon PNGs exist as PNGs at 32×32, 192×192 and 180×180 (the apple icon without an alpha channel).

### 4.11 Fonts (R8)

- **4.11.1 Sources.** JetBrains Mono v2.304 from `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip`: `fonts/webfonts/JetBrainsMono-Regular.woff2` (92,164 B), `fonts/webfonts/JetBrainsMono-Bold.woff2` (94,588 B) and `OFL.txt` (4,399 B), committed under `scripts/fonts-src/`. The zip is downloaded into its own new, empty directory outside the repo, and only those three files are extracted.
- **4.11.2 Subsets.** `scripts/subset-fonts.mjs` jobs: Regular → `public/fonts/JetBrainsMono-Regular.subset.woff2`, Bold → `public/fonts/JetBrainsMono-Bold.subset.woff2`. Text: printable ASCII U+0020–U+007E plus `·—–●○…’“”é`. Options: `{ targetFormat: 'woff2', noLayoutClosure: true }` (without `noLayoutClosure` the coding-ligature closure makes the pair 57.3 KB). Hinting stays on. `scripts/fonts-src/OFL.txt` is copied to `public/fonts/LICENSE.txt`.
- **4.11.3 Budget.** The script keeps its 40 KB total check and exit code 1 (R8). Expected 12.0 + 12.1 = 24.1 KB.
- **4.11.4 CSS.** Two `@font-face` rules, `font-display: swap`, exactly Appendix C §2; `font-variant-ligatures: none` on `body`. Both files are preloaded (`as="font" type="font/woff2" crossorigin`).

### 4.12 Debug panel and live tunables

- **4.12.1 Availability.** `const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1'`. The CI build step sets `VITE_PN_DEBUG` to `1` on every branch except `main` and to `0` on `main` (7.3.2). So the panel exists on the dev server and on preview builds behind `?debug`, and never in the production build, where the constant folds to `false` and Rolldown drops the code.
- **4.12.2 Pattern.** `prepareTweaks(params)` applies saved values before the first frame and returns `mount(app)`. Storage key `pn.tweaks`; only changed keys are stored (`deepAssign` and `diff`, kept). `lil-gui` loads only through the dynamic import, with `new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 })` and `import '../node_modules/lil-gui/dist/lil-gui.css'` (a relative path: lil-gui's `exports` map does not export the file; 12.3), so the panel's CSS arrives as a same-origin stylesheet the CSP allows. On preview builds the panel logs nothing at warning or error level.
- **4.12.3 Live tunables** (folder: control, range, step). Changes apply on the next frame; cell and density changes regrid.
  - `cells`: density (select sparse / medium / dense); `cell.k` 0.001–0.008, 0.0001; `cell.minCss` 1–6, 0.5; `cell.maxCss` 2–12, 0.5.
  - `surface`: intensity (select subtle / medium / lively); `flowSpeed` 0–3, 0.05; `warpScalePx` 80–600, 10; `mainScalePx` 60–400, 5; `warpAmp` 0–6, 0.1; `level` 0–0.6, 0.01; `gain` 0.5–4, 0.05.
  - `tiers`: `t2` 0.4–0.9, 0.005; `t3` 0.6–1, 0.005 (when `t3 ≤ t2` the panel sets `t3 = t2 + 0.01`).
  - `pointer`: `radiusK` 0.1–0.5, 0.01; `radiusSp` 0–6, 0.5; `warpK` 0–1, 0.01; `boost` 0–0.4, 0.01; `lerp` 0.02–1, 0.01; `riseMs` 0–1000, 10; `fallMs` 0–2000, 10; `velNorm` 200–4000, 50; `velRadiusGain` 0–0.5, 0.01.
  - `ripple`: `max` 1–8, 1; `lifeS` 0.5–6, 0.1; `amp` 0–2, 0.05; `speedSp` 1–20, 0.5; `sigmaSp` 0.5–4, 0.1; `gain` 0–2, 0.05.
  - `breath`: `amp` 0–0.05, 0.001; `periodMs` 1000–20000, 100.
  - `mask`: `holdDim` 0–1, 0.01; `ink` 0.7–1, 0.01; `edge` 0.01–0.3, 0.01; `meltPx` 0–150, 1; `heightFrac` 0.1–0.8, 0.01; `widthFrac` 0.3–1, 0.01.
  - `entry`: `gatherMs`, `holdMs`, `dissolveMs`, `scrimAtMs`, `revealAtMs`, `cleanupAtMs` 0–6000, 10; `skipMs` 0–1000, 10. `konami`: `gatherMs`, `holdMs`, `dissolveMs` 0–6000, 10.
  - Buttons: replay entry, Konami, toggle theme, freeze time, copy JSON, reset (removes `pn.tweaks` and reloads).
- **4.12.4 Freezing values.** The values Parsa approves are copied into `DEFAULT_FIELD` in a polish task; the panel never ships to production.

---

## 5. Accessibility, SEO and metadata

### 5.1 Accessibility (exactly Appendix C §4, with the changes below)

- **5.1.1** Landmarks: `main` (the rail) and `nav aria-label="Contact"`. Headings: `h1` "Parsa Naji"; `h2` Experience, Projects, Education, Misc, each section `aria-labelledby` its h2; `h2` "Shortcuts" inside the dialog.
- **5.1.2** The canvas and the scrim are `aria-hidden="true"`. Lists carry `role="list"`. Generated separators and brackets use empty alt text (`content: "·" / ""`). Open-ended dates read "to present". Uppercase is presentational (`text-transform`).
- **5.1.3** Focus order as 3.5.11; focus-visible styles as 3.5.2; the dialog as 3.5.5; the live region as 3.5.3.
- **5.1.4** The toggle's accessible name is its `aria-label` (`Switch to dark mode` / `Switch to light mode`), which contains the visible word (WCAG 2.5.3). It has no `aria-pressed` (11.2). Appendix C's "Dark theme" label and `aria-pressed` contract are superseded.
- **5.1.5** "say hi" keeps its visible label as its name; during the copied state the name is "copied". The description comes from `#email-hint`, added by script.
- **5.1.6** No skip link: one page, the first Tab stop is the first content link, landmarks give direct jumps (WCAG 2.4.1).
- **5.1.7** Target sizes: desktop links 47×27 px with 4ch spacing, band links 61×47 px, the toggle 40 px and 44 px tall (WCAG 2.5.8).
- **5.1.8** Zoom: 200 % on a 1280-wide screen is 640 CSS px and gets the band (reflow, scroll); 150 % on 1280×720 is 853×480 and gets 3.1.11 item 3 (Projects 2 rows, Misc 3 tags) without scrolling; nothing is clipped.
- **5.1.9** The entry never hides content from keyboard users (3.4.9), and the rail is never `visibility: hidden`, so its links stay in the accessibility tree during the entry.
- **5.1.10** Reduced motion, forced colours and print as 3.6.4–3.6.6.

### 5.2 Head block

- **5.2.1** The head is exactly Appendix C §5, with two changes:
  1. `<script src="/theme-boot.js"></script>` sits directly after the viewport meta (4.6.2).
  2. The JSON-LD has no `email` key (ledger ruling D2; house rule kept: "No email in structured data"). It is exactly:

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Person","name":"Parsa Naji","url":"https://parsanaji.com/","jobTitle":["Software Developer","AI Specialist / Developer"],"sameAs":["https://github.com/parsanaji"]}
</script>
```

- **5.2.2** Therefore: `<html lang="en">`; `<title>Parsa Naji</title>`; meta description = the tagline `I build AI agents, apps, and the systems behind them.` (R11); `author` Parsa Naji; `color-scheme` and `theme-color` as 3.2.9; canonical `https://parsanaji.com/`; icons `/favicon-32.png`, `/favicon-192.png`, then `/favicon.svg` as the last `rel="icon"` link (so SVG-capable browsers use it), then `rel="apple-touch-icon"` `/apple-touch-icon.png`; Open Graph (`website`, site name, title, description, url, image `https://parsanaji.com/og.png`, type `image/png`, 1200×630, alt `Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.`, locale `en_US`); Twitter `summary_large_image` with the same title, description, image and alt; the two font preloads; the stylesheet; the JSON-LD.
- **5.2.3** `jobTitle` lists both current roles as an array (ledger ruling D4). LinkedIn joins `sameAs` when it exists (3.1.12).
- **5.2.4** `public/robots.txt` stays as is; no sitemap.
- **5.2.5** The only inline `<script>` in `index.html` is the JSON-LD block; no element has a `style` attribute.

---

## 6. Performance budgets and quality bar

### 6.1 Budgets (R14 and the ledger's LCP ruling)

| # | metric | budget | how it is measured |
|---|---|---|---|
| 6.1.1 | production JS | ≤ 60 KB gzip (expected about 14 KB; per-module estimate in 6.2) | `npm run build` with `VITE_PN_DEBUG` unset, then the gzip (level 9) sum of `dist/assets/*.js` (8.1.4) |
| 6.1.2 | fonts | ≤ 40 KB total (expected 24.1 KB) | `npm run fonts` budget check; sum of `public/fonts/*.woff2` |
| 6.1.3 | WebGL draws | exactly 2 per frame (one per pass) | 8.2.3: an init script wraps `WebGL2RenderingContext.prototype.drawArrays` and counts calls per animation frame |
| 6.1.4 | DPR | capped at 2 | `capDpr`; `__pn.grid()` at emulated ×3 |
| 6.1.5 | hidden tab | `requestAnimationFrame` paused while hidden | 8.2.9 |
| 6.1.6 | LCP, no-entry path (reduced motion, `?noentry`, no WebGL2) | ≤ 1.5 s | performance trace under DevTools network emulation "Fast 4G", fresh context |
| 6.1.7 | FCP, entry path | ≤ 1.0 s (the first contentful paint is the first visible field frame at the entry's t = 0) | same trace setup |
| 6.1.8 | rail fully visible, entry path | ≤ 3.0 s after the entry's t = 0 (designed: 2.98 s) | filmstrip and `html` attributes; every `[data-reveal]` at computed opacity 1 |
| 6.1.9 | CLS | 0 | Lighthouse and trace |
| 6.1.10 | TBT | < 100 ms | Lighthouse CLI `npx --yes lighthouse@13.5.0`, median of 3 runs (12.6) |
| 6.1.11 | Lighthouse | Accessibility, Best Practices, SEO ≥ 95 on both paths; Performance ≥ 95 on `?noentry`; Performance on the entry path recorded, not gated | mobile and desktop: `lighthouse_audit` for Accessibility and Best Practices on the preview URL; Performance via the Lighthouse CLI `npx --yes lighthouse@13.5.0` on the preview URL, median of 3 runs; SEO on the local production build (`npm run build` + `npm run preview`) because previews send `x-robots-tag: noindex` (12.6) |
| 6.1.12 | frame rate | 60 fps on Parsa's PC (RTX 2080 SUPER, Chrome): mean frame interval ≤ 16.7 ms over 10 s of pointer movement, no long task over 50 ms after the entry | 8.2.3 |
| 6.1.13 | GPU time | ≤ 2 ms median per frame, both passes, at 1440×900 | `__pn.gpuTime(60)` |
| 6.1.14 | console | zero errors and zero warnings in production and on the preview at 1440×900, 1280×720 and 390×844, dark and light | 8.2.1 |
| 6.1.15 | Node | `engines.node >=22.18.0` | `tests/env.test.ts` |
| 6.1.16 | third-party requests | none, except the cookieless Cloudflare Web Analytics beacon in production (zone-level, already on) | network panel |

- **6.1.17** The CSP and the security headers stay strict: no inline scripts except JSON-LD, no inline styles (R14).
- **6.1.18** LCP is never gamed (no hidden-text tricks, no fake early paints).

### 6.2 Bundle estimate (Appendix A §8, KB gzip, per-file sums overstate the single-bundle gzip by 15–25 %)

| module group | KB |
|---|---|
| shaders (`fullscreen.vert`, `noise.glsl`, `surface.frag`, `dither.frag`, `?raw`) | 2.6 |
| `gl/context` + `gl/program` + `gl/targets` | 1.25 |
| `field/renderer` | 1.6 |
| `field/surface` (only `flowZ` reachable) | 0.15 |
| `field/params` | 0.55 |
| `field/sizing` + `field/flow` | 0.5 |
| `field/pointer` | 0.5 |
| `field/ripples` | 0.35 |
| `field/nameMask` | 0.75 |
| `field/entry` | 0.6 |
| `app` | 1.6 |
| `lifecycle` + `loop` | 0.85 |
| `main` | 0.75 |
| `theme/theme` + `theme/themeController` | 1.3 |
| `ui/clock` + `links` + `emailCopy` + `overlay` | 1.3 |
| `eggs/*` | 1.3 |
| `core/*` + `boot/fonts` | 1.1 |
| module glue | 0.4 |
| **sum** | **≈ 17.5** (expected single bundle about 14) |

`tweaks.ts` and `lil-gui` (about 12 KB gzip) are 0 in production. `public/theme-boot.js` is a separate file under 500 bytes. Today's Three.js bundle is 137 KB gzip, so the site sheds about 120 KB.

---

## 7. Deployment

### 7.1 Repository and branch (R15)

- **7.1.1** All work happens on branch `resume-screen`, created from `main`. Builders commit there.
- **7.1.2** Builders are Opus 5.5 at effort xhigh; reviewers are Opus; Fable does the final whole-branch review. Each task ends with tests green, a commit and the evidence of 8.3.
- **7.1.3** `main` is untouched until Parsa approves (7.5).

### 7.2 Preview

- **7.2.1** Every push to `resume-screen` runs `.github/workflows/deploy.yml` (`npm ci`, `npm test`, `npm run build`, then `pages deploy dist --project-name=parsanaji-com --branch=resume-screen --commit-dirty=true` through `cloudflare/wrangler-action@v4`) and deploys `https://resume-screen.parsanaji-com.pages.dev`.
- **7.2.2** No task deploys from a local shell; previews go through Actions only, so no task needs `.env`.

### 7.3 Workflow and headers

- **7.3.1** `public/_headers` stays byte-for-byte unchanged (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, the cache rules). `/theme-boot.js`, the favicon PNGs and `og.png` get Pages' default `Cache-Control: public, max-age=0, must-revalidate`, which already revalidates on every load.
- **7.3.2** `deploy.yml` changes in exactly one place: the build step becomes

```yaml
      - run: npm run build
        env:
          VITE_PN_DEBUG: ${{ github.ref_name == 'main' && '0' || '1' }}
```

  Everything else in the workflow stays as it is.

### 7.4 Environment and secrets (R16, verbatim)

- **7.4.1** "SECURITY: `.env` at the repo root holds the Cloudflare token: never read, print, grep, cat or stage it. Agents verify env only by key names."
- **7.4.2** The Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are unchanged. The CI token swap stays Parsa's parked item (2.4.2).

### 7.5 Approval and production

- **7.5.1** Production changes only after Parsa says he approves the preview. Then `resume-screen` merges into `main`, and the Actions run on `main` deploys `https://parsanaji.com`.
- **7.5.2** The approval message to Parsa lists: the preview URL; the parked items (email verification, CI token, LinkedIn URL); whether the idle-field tuning (9.18) is final.

### 7.6 Docs

- **7.6.1** `README.md`: the new one-line description ("One-screen résumé over a WebGL2 dither field.") and the `npm run og` and `npm run fonts` recipes.
- **7.6.2** `docs/OPERATOR.md` §5 becomes: "## 5. iPhone check — Open https://resume-screen.parsanaji-com.pages.dev in Safari: the name forms in the band, the page scrolls, a tap makes a ring, a drag repels, the clock is correct, the toggle switches looks."
- **7.6.3** After the merge, the vault note `Projects/parsanaji.com.md` and the memory file get the live state and any new gotchas.

---

## 8. Testing and verification

### 8.1 Unit tests (Vitest, Node environment; run on every commit and in CI)

Every pure module has a test file. Cases are exactly Appendix A §9.1, with these changes and additions:

- **8.1.1** `tests/surface.test.ts`: Appendix A's cases (bit-exact `hash3` against the verbatim Blueprint hash on 1000 seeded triples; z periodicity; range; continuity; `flowZ` wrap; `surface() ≤ 0.703125` over 10⁵ points and `max(surface + 0.12) < 0.9`; `BAYER8` equals the Blueprint array and is a permutation of 0–63; strict tier edges; the golden FNV-1a checksum of the 200×105 grid at t = 12; the coverage band of 3.3.10; field-3 > 0 with a ring; no `import` in the source).
- **8.1.2** `tests/shaders.test.ts`: Appendix A's cases (constants, `BAYER8` literal, `OFFSET = 256.0`, uniform names equal `UNIFORMS_PASS1` / `UNIFORMS_PASS2`, no `#version` in the files, ascending `smoothstep` edges, no `pow(`).
- **8.1.3** `tests/sizing.test.ts`: Appendix A's cases, with `pointerRadius(390, 236.32) = 82.42` (to 2 decimals) and `pointerRadius(1440, 900) = 312`; `BAND_QUERY` equals the string in 3.1.1 and appears verbatim in `src/styles.css`.
- **8.1.4** The JS budget (6.1.1) is a measurement, not a unit test. After `npm run build` the task runs `node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"` and records the number.
- **8.1.5** `tests/flow.test.ts`: `breathScale` cases kept; `INTENSITY_K`; `effectiveIntensity({ intensity: 'lively', flowSpeed: 2 }) = 3.4`.
- **8.1.6** `tests/pointer.test.ts`, `tests/ripples.test.ts`: Appendix A's cases.
- **8.1.7** `tests/entry.test.ts`: Appendix A's cases (boundaries 900 / 1900 / 2700; events in order once each with `scrim` at 1900, `reveal` at 2100, `done` at 2700, `cleanup` at 3300; `entryProgress` values; pending until ready and visible; a hidden tick does not advance; Konami 3200 ms with no scrim, reveal or cleanup), plus: `skip()` emits `skip`, then `done` and `cleanup` 250 ms later; a skip in phase `done` emits `cleanup` at once.
- **8.1.8** `tests/nameMask.test.ts`: Appendix A's cases, plus `maskBoxFor('konami', { w: 1440, h: 900 }, 950, false)` = `{ x: 950, y: 0, w: 490, h: 900 }` and `maskBoxFor('konami', { w: 390, h: 236 }, null, true)` = the whole band; the fallback ascent 0.73 × size.
- **8.1.9** `tests/theme.test.ts`: Appendix A's cases, plus `toggleLabel('dark')` = `{ word: 'light', label: 'Switch to light mode' }` and `toggleLabel('light')` = `{ word: 'dark', label: 'Switch to dark mode' }`.
- **8.1.10** `tests/tokens.test.ts`: in `src/styles.css`, `--field-0..3` are 6-digit hex in the dark base and both light blocks, with exactly the values of 3.2.1, and are not registered; exactly the twelve `@property` rules of 4.6.4 exist, each `syntax: '<color>'`; `--bg-scrim` and `--copied` do not appear; light `--field-3` is `#0832b8`.
- **8.1.11** `tests/themeBoot.test.ts` (new): runs `public/theme-boot.js` in `node:vm` with fake `document`, `localStorage`, `matchMedia` and `location`. Cases: stored `light` → `data-theme="light"` and `data-entry="run"`; stored garbage → no `data-theme`; reduced motion → no `data-entry`; forced colours → no `data-entry`; `?noentry` → no `data-entry`; a throwing `localStorage` → no exception. The file contains no `innerHTML` or `eval`.
- **8.1.12** `tests/content.test.ts`: every string of 3.1.3 appears in `index.html` (with `&amp;` for `&`); `href="mailto:info@parsanaji.com"` and `https://github.com/parsanaji` are present; `<script src="/theme-boot.js">` comes before the stylesheet link; the only inline `<script>` is `type="application/ld+json"` and its JSON equals 5.2.1 (no `email` key); no `style=` attribute; no `aria-pressed`; the toggle has `data-reveal="0"`; the `data-reveal` values are 0–7; no element has `data-link="linkedin"` while `CONTENT.links.linkedin` is empty; all values equal `CONTENT`.
- **8.1.13** `tests/clock.test.ts`: 14:36 PDT → `{ time: '2:36 PM', zone: 'PDT', datetime: '14:36' }`; midnight → `12:00 AM`; noon → `12:00 PM`; PST in winter; ASCII spaces only (never U+202F); `msToNextMinute`.
- **8.1.14** `tests/emailCopy.test.ts`: resolve → `'copied'`, `data-copied` cleared after 1200 ms (fake timers), live region written then cleared after 3000 ms; reject → `'fallback'` and `assign('mailto:info@parsanaji.com')`; no clipboard → fallback.
- **8.1.15** `tests/shortcuts.test.ts`, `tests/konami.test.ts`, `tests/scramble.test.ts`, `tests/loop.test.ts`, `tests/glContext.test.ts`, `tests/program.test.ts`: Appendix A's cases. `tests/greeting.test.ts`: one call whose first argument equals `%cParsa Naji — say hi: info@parsanaji.com`.
- **8.1.16** `tests/params.test.ts`: `DEFAULT_FIELD` deep-equals 4.9; `cloneField` is a deep copy.
- **8.1.17** `tests/ogAsset.test.ts`: as 4.10.8.
- **8.1.18** Kept: `easing`, `prng`, `time`, `fonts`, `quality` (`capDpr`, `FpsProbe`), `env` (Node ≥ 22.18, full ICU for `America/Los_Angeles`, `fetch` and `process.loadEnvFile` exist as functions; the test never loads `.env`). Retired: `defaults.test.ts`, `motion.test.ts` (its breath cases move to `flow.test.ts`), `sampler.test.ts` (→ `nameMask.test.ts`), `webgl.test.ts` (→ `glContext.test.ts`). `tests/helpers/fakeCanvas.ts` gains `actualBoundingBoxAscent` and `actualBoundingBoxDescent`.

### 8.2 Browser checks (Chrome DevTools MCP)

Use `emulate` for viewports (it reaches 390×844×3 mobile with touch; `resize_page` cannot go below 500 px). Use `navigate_page` with an init script to override `matchMedia` for reduced motion and forced colours. The `window.__pn` hooks (4.7.5) do the GL readbacks. Test in fresh contexts (cached reloads log "preloaded but not used" font warnings that are not real).

- **8.2.1 Console.** 1440×900, 1280×720 and 390×844, dark and light: zero messages at error or warning level, on the dev server during a task and on the preview once pushed; on production after the merge.
- **8.2.2 Parity.** `__pn.parity()` reads pass 1 back and compares it with `surface()`: max error ≤ 3/255, tier mismatch ≤ 0.5 % (the prototype measured 0.58/255 and 0.14–0.21 %).
- **8.2.3 Frame rate and draws.** `__pn.gpuTime(60)` median ≤ 2 ms at 1440×900; rAF mean interval ≤ 16.7 ms over 10 s of pointer movement; a `performance_start_trace` shows no task over 50 ms after the entry; an init script that wraps `WebGL2RenderingContext.prototype.drawArrays` counts exactly 2 calls per animation frame.
- **8.2.4 Entry filmstrip.** Screenshots at entry t = 450 ms (gather), 1400 ms (hold, with the pointer over a letter showing the bend), 2300 ms (dissolve with the rail fading) and 3400 ms (done), using `__pn.setTime` or a trace filmstrip; `html` attributes match the table in 3.4.2 at each point; at 2980 ms every `[data-reveal]` has computed opacity 1.
- **8.2.5 Theme.** The toggle flips `data-theme`, `localStorage['pn.theme']`, both `theme-color` metas, the word and the `aria-label`. At 150 ms into a toggle, an off-cell canvas pixel (`readPixels` in rAF) and `getComputedStyle(body).backgroundColor` both sit within ±3/255 of the sRGB midpoint. A reload with the stored look opposite to the OS look paints the stored look in the first filmstrip frame. Pressing again to the OS look removes the key.
- **8.2.6 Reduced motion.** The rail is visible in the first paint; two canvas screenshots 1 s apart are identical; a pointer move changes the field; clicks make no rings; the dot does not pulse; a click on the name does not scramble.
- **8.2.7 Fallbacks.** `?nowebgl`, and an init script that makes `getContext('webgl2')` return `null`: content visible at once, `html.no-webgl`, no console errors. JavaScript disabled entirely: the rail is visible in the first paint and readable. Only the module script blocked (request block on `/src/main.ts` or its built chunk) while `theme-boot.js` runs: the rail appears through the 4000 ms failsafe. Forced colours (init script): no canvas, content visible.
- **8.2.8 Context loss.** `WEBGL_lose_context.loseContext()` then `restoreContext()`: the field resumes with no errors. Without the restore, the fallback appears after 3 s.
- **8.2.9 Hidden at load.** `new_page` in the background, wait 3 s, `select_page`: the entry starts only now (filmstrip), and no fallback fired.
- **8.2.10 DPR.** 1440×900 at ×1, ×1.25, ×1.5 and ×2: `__pn.grid()` reports an integer `cellDev`; a screenshot column histogram over 64 cells shows every on-run is a multiple of `cellDev` (no moiré).
- **8.2.11 Interactions.** Hover and focus brackets with unchanged link rects; "say hi" copy shows `copied` for 1.2 s and the live region text; a denied clipboard (init script making `writeText` reject) navigates to `mailto:`; `g`, `e`, `?`, `Escape` behave as 3.5.4; Tab order as 3.5.11; Tab during the entry skips it; the Konami code forms `nice.` right of the scrim; a click on the name scrambles and settles on `Parsa Naji`; the console shows exactly the line of 3.5.7.
- **8.2.12 Lighthouse.** Mobile and desktop on the preview URL and on `?noentry`: `lighthouse_audit` for Accessibility, Best Practices and SEO, and the Lighthouse CLI `npx --yes lighthouse@13.5.0` for Performance, TBT, LCP, FCP and CLS (median of 3 runs); SEO is gated on the local production build because previews send `x-robots-tag: noindex` (12.6): the scores and metrics of 6.1.9–6.1.11.
- **8.2.13 Fit.** At 1280×720, 1366×768, 1440×900, 1920×1080 and 2560×1440: `scrollingElement.scrollHeight === clientHeight`; the right edge of every text rect in the rail (Range client rects) is at or left of R; the links, status and footer right edges are left of S. At 1280×600, 1280×599, 1280×519 and 1280×470: the collapse steps of 3.1.11. At 768×1024 and 390×844: the band layout, the footer resting 24 px above the fade at the end of the scroll.
- **8.2.14 Bundle.** 6.1.1 and 6.1.2 numbers recorded.

### 8.3 Evidence before a task or slice is called done

- **8.3.1** `npm test` green (file and test counts recorded), `npm run typecheck` clean, `npm run build` succeeds; for slices that touch scripts or fonts, `npm run fonts` or `npm run og` output recorded.
- **8.3.2** The 8.2.1 console check at its three viewports and two looks.
- **8.3.3** Screenshots at 1440×900, 1280×720 and 390×844, dark and light; layout slices add 1366×768 and 768×1024. Files are saved under `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/<task-id>/` (git-ignored) as `<width>x<height>-<look>[-<state>].png`.
- **8.3.4** The slice-specific checks of 8.2 that its tasks touch, with the measured numbers written into the task report.
- **8.3.5** Finish gates (house rule kept): the `frontend-design` skill during visual slices; the `anti-ui-slop` finish gate before the last slice closes; the vault note and memory updated after the merge (7.6.3).

---

## 9. Open risks and mitigations

- **9.1 LCP versus the entry.** A fading-in element counts for LCP only when its fade completes, so the entry path measures LCP about 2.8 s or more. Mitigation (ruled): LCP ≤ 1.5 s applies to the no-entry path; the entry path is held to FCP ≤ 1.0 s and the rail fully visible ≤ 3.0 s after t = 0. LCP is never gamed.
- **9.2 Font budget.** JetBrains Mono's ligature closure makes default subsets 57.3 KB. Mitigation: `noLayoutClosure` (24.1 KB) and `font-variant-ligatures: none`; `noHinting` (8.0 + 8.0 KB) is the reserve if space is ever needed.
- **9.3 Accent "puddles".** Field-2 lives only in the 0.66–0.703 band at the crest of the curve, so it shows as flat light patches. It is the approved math and ships. Mitigation if a reviewer or Parsa finds it blotchy: try `tiers.t2` 0.62 or `shape.level` 0.28 in the panel; no code change.
- **9.4 Repel fold.** The approved warp overshoots for `d < 0.4 R`, giving a small mirrored lens at the cursor. It ships. Mitigation if it reads as a glitch at full size: a polish task adds a `pointer.noFold` clamp `|Δ| ≤ 0.9 × d` (one `min()` in pass 1), default off, enabled only with Parsa's approval.
- **9.5 Flow speed on large screens.** Absolute-px noise shows about 16 features across a 2560 px monitor. Mitigation: try `mainScalePx` 200 and `warpScalePx` 300 in the panel. Never normalise the noise to the viewport (phones would stop matching the approved preview).
- **9.6 First compile hitch.** 206 ms on ANGLE/D3D11. Mitigation: `KHR_parallel_shader_compile`; without it, the first status query happens in an animation frame after first paint; the entry waits for `ready`.
- **9.7 Moiré at fractional DPR.** Mitigation: integer `cellDev` and `devicePixelContentBoxSize` (Safari lacks it but has integer DPRs); verified by 8.2.10.
- **9.8 Silent context loss.** A lost context freezes the field without an error. Mitigation: 3.6.3 handlers and check 8.2.8.
- **9.9 Safari and iOS.** All formats used (R8 LINEAR, RGBA8 target, `texelFetch`, `uint`, `texStorage2D`, highp) are WebGL2 core. iOS Low Power Mode caps rAF at 30 fps, which trips the probe once and coarsens cells by 1.5×; harmless.
- **9.10 Software GL.** `failIfMajorPerformanceCaveat: true` gives SwiftShader users the static fallback instead of a hot CPU.
- **9.11 Precision in long sessions.** The CPU wraps the noise z coordinates mod 256 in double precision; pointer and ring coordinates are bounded by the viewport.
- **9.12 Rail and name overlap during the reveal.** For about 0.2 s, low-opacity rail text overlaps field-3 name cells. Accepted. Mitigation if a reviewer objects: move `entry.revealAtMs` to about 2300 so the reveal starts when `e < 0.5` (then 6.1.8 must be re-checked).
- **9.13 Konami placement.** It depends on the scrim's right edge, measured at trigger time, so layout changes need no code change.
- **9.14 Mask legibility on short bands.** The phone band name is 54.6 px (20 cells of cap height). Below a 160 px band the name becomes height-limited; mitigation: raise `mask.heightFrac` to 0.55 for the band.
- **9.15 Clock string.** ICU 72+ inserts U+202F; mitigation: `formatToParts` (3.5.13) and the test in 8.1.13.
- **9.16 Node type stripping.** The OG script needs Node ≥ 22.18 (engines bump). CI never runs `npm run og`. Fallback if a builder must use older Node: a JS twin `scripts/og-math.mjs` with a parity test; not expected.
- **9.17 Vendoring JetBrains Mono.** The release zip is downloaded into its own empty directory and only three files are extracted (4.11.1).
- **9.18 Idle-field busyness (ledger).** At full screen the idle dark field reads busier than Parsa's small Blueprint card (`scratchpad/agent-a/shot-idle-dark.png`). The defaults stay the approved medium / medium. Mitigation: density, intensity, the tier thresholds, flow speed and cell size are live tunables on the preview's `?debug` panel (4.12), and a polish task tunes them with Parsa before approval; the chosen values go into `DEFAULT_FIELD`.
- **9.19 `@property` support.** Without it (old engines) the CSS tokens switch instantly while the field still crossfades. Accepted; every current Chrome, Edge, Firefox and Safari supports it.
- **9.20 Debug panel on previews.** Preview builds carry the panel chunk behind `?debug`. Mitigation: `main` builds set `VITE_PN_DEBUG=0`, so production has none; 6.1.1 is measured with the flag unset.

---

## 10. Glossary

### 10.1 Terms

- **rail**: the left content column (`<main class="rail">`) of the rail layout; R is its right edge, `--gutter + --rail-w`.
- **band**: the band layout's fixed field strip over the bottom `28svh`; also the layout itself (3.1.13).
- **scrim**: the gradient box between the field and the text; S is where its solid zone ends (`gutter + 0.5 × rail-w`).
- **cell**: one dither decision; `cellCss` (CSS px), `cellDev` (device px), `uCell = cellDev / dpr`.
- **sp**: the Blueprint lattice unit `clamp(fieldCssW / 48, 8, 40)`, used for the pointer radius and the rings.
- **v / F**: the surface value of a cell, 0..1; F is the surface before the mask, pointer and rings.
- **tier**: the colour class of an on cell (field-1, field-2, field-3) or off (field-0).
- **τ (tau)**: flow time in seconds; it advances by `dt × I_eff`.
- **I_eff**: `INTENSITY_K[intensity] × flowSpeed`.
- **sim time**: time that advances only while the loop runs, by clamped dt.
- **e**: mask progress 0..1 of the entry or Konami.
- **θ, k**: the per-cell static dissolve threshold and the cell's field-to-text mix.
- **mask plane**: the R8 coverage texture of the name or `nice.`, 2 texels per cell.
- **repel**: the pointer warp that moves sample points toward the pointer so the field spreads away.
- **Shockwave**: the expanding bright ring a click spawns.
- **entry path / no-entry path**: a load where the entry plays / where it does not (reduced motion, `?noentry`, no WebGL2, forced colours, late takeover).
- **PN_DEBUG**: true on the dev server and preview builds; false in production (4.12.1).

### 10.2 Uniforms (Appendix A §3.7)

| uniform | pass | type | value |
|---|---|---|---|
| `uCell` | 1 | float | CSS px per cell, `cellDev / dpr` |
| `uZ` | 1 | vec4 | `flowZ[0..3]`: warp-x (z, z2), warp-y (z, z2) |
| `uZm` | 1 | vec2 | `flowZ[4..5]`: main (z, z2) |
| `uCenter` | 1 | vec2 | field centre, CSS px |
| `uBreath` | 1 | float | `1 + 0.01 sin(2π t / 6000)`; 1 under reduced motion |
| `uPointer` | 1 | vec4 | eased x, y (CSS px), radius R × (1 + 0.1 velFactor), strength |
| `uWarp` | 1 | vec2 | (0.55, 0.12): warp factor, boost |
| `uRipples[8]` | 1 | vec4[8] | origin x, y, ring radius, amplitude (0 = unused) |
| `uRipple` | 1 | vec2 | (1.6 sp, 0.9): sigma, gain |
| `uMask` | 1 | sampler2D | unit 1, R8 mask, LINEAR |
| `uMaskSize` | 1 | vec2 | `(cols × uCell, rows × uCell)` CSS px |
| `uE` | 1 | float | mask progress e |
| `uMaskMix` | 1 | vec4 | (0.3, 0.91, 0.08, 48): hold dim, ink floor, dissolve edge, melt px |
| `uShape` | 1 | vec3 | (240, 160, 2.6): warp scale px, main scale px, warp amplitude |
| `uLevel` | 1 | vec2 | (0.3, 2.1): level, gain |
| `uSurf` | 2 | sampler2D | unit 0, pass-1 texture |
| `uCellDev` | 2 | float | device px per cell |
| `uCanvasH` | 2 | float | drawing-buffer height, device px |
| `uField0..uField3` | 2 | vec3 | sRGB 0..1 from `--field-0..3` through the `ColorTween` |
| `uTiers` | 2 | vec2 | (0.66, 0.90) |

### 10.3 Tokens

- **Colour tokens**: `--bg`, `--scrim-solid`, `--scrim-mid`, `--scrim-clear`, `--fg`, `--fg-2`, `--accent`, `--accent-2`, `--accent-glow`, `--line`, `--line-strong`, `--field-0`, `--field-1`, `--field-2`, `--field-3`, `--focus-ring`, `--status-dot`, `--selection-bg`, `--selection-fg`, `--overlay-bg`, `--overlay-border`, `--theme-color` (values in 3.2.1).
- **Layout tokens**: `--font-mono`, `--k`, `--fs-name`, `--fs-tag`, `--fs-body`, `--fs-when`, `--fs-eyebrow`, `--fs-misc`, `--fs-link`, `--fs-meta`, `--gutter`, `--pad-y`, `--rail-w`, `--ramp`, `--gap-tag`, `--gap-block`, `--gap-eyebrow`, `--row-pad`, `--gap-foot`, `--gap-meta`, `--toggle`, `--when-w`, `--band-h`, `--fade`, `--hit`, `--sep`, `--i` (values in 3.1.7, 3.1.13 and Appendix C §2).
- **State attributes on `<html>`**: `data-theme` (`light` | `dark`, absent = system), `data-entry` (`run` | `wait` | `scrim` | `reveal` | `skip`, absent = resting), `data-field-ready` (canvas visible), class `no-webgl` (fallback), class `theme-anim` (crossfade in progress).
- **Storage keys**: `pn.theme` (`light` | `dark`, absent = system); `pn.tweaks` (debug builds only).
- **URL switches**: `?noentry` (no entry), `?nowebgl` (forced fallback), `?seed=<n>` (scramble seed), `?debug` (panel, debug builds only).

---

## 11. Decisions made while writing

Each line: what, why, cost if wrong.

- **11.1** The entry DOM contract is one `data-entry` attribute (`run`, `wait`, `scrim`, `reveal`, `skip`) plus `data-field-ready`, replacing Appendix A's `pn-*` classes and Appendix C's `run`/`in` values. Why: the ledger fixed `data-entry="run"` for `theme-boot.js` and the two reports disagreed on everything after it. Cost if wrong: renaming selectors in one CSS block and `app.ts`.
- **11.2** The toggle has no `aria-pressed`. Why: the ledger gives it a per-state `aria-label` ("Switch to dark mode" / "Switch to light mode"); a button whose name changes and also reports pressed state announces contradictory state (WAI-ARIA APG). Cost if wrong: one attribute and one test line.
- **11.3** The toggle is the text word on Appendix C's chip, with a reserved 5ch word box and the brackets inside a 2.5ch padding. Why: the word sits over the open field and needs the chip for contrast (computed 5.04 dark / 4.87 light for `--accent-2`), and the chip must not change size between `dark` and `light`. Cost if wrong: CSS only.
- **11.4** The toggle reveals with the intro (`data-reveal="0"`) instead of last (`8`). Why: with index 8 the rail is fully visible at 3.02 s, past the ruled 3.0 s; index 0 gives 2.98 s, and the toggle sits on the name's line. Cost if wrong: one attribute.
- **11.5** "Rail fully visible by 3.0 s" is measured from the entry's t = 0, not from navigation start. Why: R6's binding times put the last block at 2.98 s after t = 0, so a navigation-relative reading is unsatisfiable; FCP ≤ 1.0 s already bounds when t = 0 can happen. Cost if wrong: either the timeline or the budget must change, a ruling for Fable.
- **11.6** Hidden rail blocks get `pointer-events: none` in the `wait` and `scrim` states. Why: an opacity-0 link is still clickable, so a visitor clicking the field during the entry could navigate away by accident. Cost if wrong: one CSS rule.
- **11.7** `main.ts` plays no entry when it takes control at or after 4000 ms. Why: the CSS failsafe has already shown the rail by then, and re-hiding it would flash. Cost if wrong: one condition.
- **11.8** The readiness timeout (3000 ms) counts from the first animation frame, not from boot. Why: a tab hidden at load would otherwise time out before it is seen and lose the entry R6 promises. Cost if wrong: one timestamp.
- **11.9** `--copied` is dropped and "copied" uses `--accent-2`. Why: ledger ruling "copied = plain --accent-2 text"; Appendix B's sky shift and Appendix A's `@property --copied` would contradict it. Cost if wrong: one token.
- **11.10** The OG scrim follows the page rule (alpha ≥ 0.86 at the widest text line, eased to 0 by x 920) instead of Appendix A's 54 % box with stops at 0.42 and 0.73. Why: `--bg-scrim` is dropped (ruling D5), and Appendix A's geometry leaves the name's last letters and the tagline's line ends near alpha 0. Cost if wrong: SVG stop numbers in one script.
- **11.11** The optional `parsanaji.com` line on the OG image is included. Why: link previews then carry the domain. Cost if wrong: one text run.
- **11.12** Only the twelve literal-valued tokens are `@property`-registered; the aliases `--focus-ring` and `--status-dot` are not, and `--copied` is gone. Why: a registered alias whose source is also transitioning restarts its own transition every frame and lags. Cost if wrong: CSS only.
- **11.13** `theme-boot.js` goes directly after the viewport meta, before the stylesheet (Appendix A), not after it (Appendix C). Why: after a stylesheet a classic script waits for that stylesheet, delaying parsing; A owns the bootstrap (R7). Cost if wrong: moving one line.
- **11.14** `theme-boot.js` also skips the entry under forced colours. Why: the field never runs there, so pre-hiding the rail would only add a blank frame. Cost if wrong: one condition.
- **11.15** `public/_headers` stays byte-for-byte unchanged; Appendix A's extra `/theme-boot.js` no-cache block is not added. Why: the controller's brief for this spec says "headers unchanged" (R14 keeps them strict), and Pages' default `public, max-age=0, must-revalidate` already revalidates the file. Cost if wrong: a stale bootstrap for one load after a deploy.
- **11.16** The canvas keeps `touch-action: auto` on the band (Appendix A) instead of `pan-y` (Appendix C). Why: `pan-y` blocks pinch zoom when a gesture starts on the band; scrolling works either way. Cost if wrong: one CSS value.
- **11.17** The Konami `nice.` box starts at the scrim's clear edge, not at the rail edge + 24 px. Why: from the rail edge, the first letters would sit under the scrim fade and render dimmed. Cost if wrong: one function.
- **11.18** The debug panel and `window.__pn` exist on preview builds (`VITE_PN_DEBUG=1` on non-`main` branches, one `deploy.yml` change) as well as on the dev server. Why: the ledger requires tuning "with Parsa on the preview URL", while Appendix A made the panel dev-only; production still has none. Cost if wrong: one workflow line and one constant.
- **11.19** `flowSpeed` (default 1) is a new tunable, and the app integrates flow time τ by `dt × I_eff` and calls `flowZ(τ, 1)`. Why: the ledger lists flow speed as a live tunable separate from intensity, and integrating τ means a live change never jumps the field. Cost if wrong: one param.
- **11.20** `DEFAULT_FIELD` drops the CSS-owned durations and `mask.thetaScale` / `mask.thetaZ`, and moves timeouts to `boot`. Why: those values are fixed in CSS or as shader literals, so panel controls for them would do nothing. Cost if wrong: params shape and one test.
- **11.21** Favicon PNGs (32, 192, apple-touch 180) are generated by `scripts/og-image.mjs`. Why: Appendix C's head links them, a 404 is a console error (R14), and no report assigned their generation. Cost if wrong: moving code to another script.
- **11.22** The LinkedIn element is absent from `index.html` until the URL exists, and `initLinks` returns `{ linkedin }` for the shortcut and overlay. Why: Appendix C emits it only when set (never a dead link) and Appendix A's `initLinks` toggled visibility; this keeps one source of truth with a test. Cost if wrong: one function.
- **11.23** The footer clock is a `<time data-clock-time>` that starts empty, with a `datetime` attribute, and `formatClock` also returns `datetime`. Why: Appendix A's `startClock` takes an `HTMLTimeElement`; Appendix C's placeholder text would be a fake time. Cost if wrong: markup only.
- **11.24** The pointer-radius test value for the 390×236.32 band is 82.42, not Appendix A's 82.33 (which is the value for a 236 px band). Why: arithmetic. Cost if wrong: one test number.
- **11.25** Reduced motion turning on mid-session freezes the current τ instead of jumping to τ = 12. Why: a jump is itself motion. Cost if wrong: one line.
- **11.26** Shockwave rings spawn only for points inside the canvas rect, and never from inside a `dialog`. Why: on the band layout, taps on the text above the band would otherwise send rings in from off-canvas. Cost if wrong: one condition.
- **11.27** Email copy runs only on an unmodified primary click; modified and middle clicks keep `mailto:`. Why: it respects the platform's "open in" gestures. Cost if wrong: one condition.
- **11.28** `g` and `l` navigate in the same tab with `location.assign`. Why: the links have no `target`, and a shortcut should do what a click does. Cost if wrong: one call.
- **11.29** The console line text is `%cParsa Naji — say hi: info@parsanaji.com` in 700 weight `#3b5df0`. Why: R12d fixes only "one styled line with the email". Cost if wrong: one string.
- **11.30** The FPS probe starts at the first real frame when no entry plays, and never runs under reduced motion. Why: Appendix A only defined the entry path, and an on-demand loop cannot be measured. Cost if wrong: one condition.
- **11.31** The mask's fallback metrics (no `actualBoundingBox*`) are ascent 0.73 × size and descent 0. Why: Appendix A required a fallback without a number; 0.73 is JetBrains Mono's cap height. Cost if wrong: one constant, test-only in practice.

---

## 12. Amendments during planning

Applied while the implementation plan was assembled (plan `docs/superpowers/plans/2026-10-19-parsanaji-resume-screen.md`, "Index amendments (applied)"; ledger `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/progress.md`). One line each: section, old → new, ruling.

- **12.1** 3.5.13 (clock): "the text changes within 25 ms after each minute boundary" → "the footer time changes between 25 and 100 ms after the minute boundary". Ruling: ledger 2026-10-19 19:29 (the write is scheduled 25 ms after the minute, so the old wording was unsatisfiable; measured 39 ms); plan A9.
- **12.2** 4.10.3 (OG ring): "plus one static Shockwave ring `{ x: 900, y: 360, radius: 135, amp: 0.975, sigma: 40, gain: 0.9 }` (sp = 25, age 0.6 s) so field-3 sparkle appears" → "with no Shockwave ring: the still is the name, the tagline, the domain and the plain field band". Ruling: ledger 2026-10-19 19:29 lowered the amp to 0.6; the controller's ruling after plan assembly removed the ring (even amp 0.4 renders as solid white blobs); plan A10.
- **12.3** 4.12.2 (panel stylesheet): `import 'lil-gui/dist/lil-gui.css'` → `import '../node_modules/lil-gui/dist/lil-gui.css'`. Ruling: ledger 2026-10-19 19:36, slice-2 amendment A1 (lil-gui 0.21.0's `exports` map does not export the file, so the bare path fails the build).
- **12.4** 3.2.6 (theme crossfade): adds "The field's colour tween starts on the frame after the toggle, so it matches the CSS transition; a press inside a running crossfade behaves like an interrupted CSS transition, starting a new 300 ms tween from the colours on screen at that frame, never from the previous target." Rulings: ledger 2026-10-19 19:36, slice-2 amendment A3 (a tween started in the click handler ran one frame ahead of `--bg`, 4/255 off at 150 ms); the controller's ruling after plan assembly on a press mid-crossfade, plan A15.
- **12.5** 3.7.1 (the sizing rule 4.5.10 cites; `computeGrid` in 4.3): "when available and the raw DPR is 2 or less, `devicePixelContentBoxSize`" → "when available, the raw DPR is 2 or less and it agrees with `cssW × dpr` and `cssH × dpr` to within 1 device px, `devicePixelContentBoxSize`". Ruling: ledger 2026-10-19 19:36, slice-2 amendment A2 (DevTools device-scale emulation reports the physical box, which would stretch every cell).
- **12.6** 6.1.10, 6.1.11 and 8.2.12 (Lighthouse): "`lighthouse_audit` … on the preview URL" → `lighthouse_audit` for Accessibility, Best Practices and SEO, the Lighthouse CLI `npx --yes lighthouse@13.5.0` for Performance and TBT (median of 3 runs), and SEO measured on the local production build because Pages previews send `x-robots-tag: noindex`. Ruling: ledger 2026-10-19 18:59, slice-4 amendments A5 and A6.
- **12.7** 3.4.11 (Konami): adds "ignored when the scrim leaves no clear field (mask box width 0: rail windows about 720–790 px wide)" and "a keydown without a string `key` (a synthetic event) neither advances nor resets the sequence". Ruling: assembler, plan A11 (the slice-2 open item: an empty box would dim the field around no text) and A12 (Review Focus: such an event would otherwise throw in the listener).
- **12.8** 3.1.13 and 3.1.16.1 (band name and chip): band `--fs-name: clamp(38px, 12vw, 60px)` → `clamp(34px, 11vw, 60px)`; the band chip's padding `0 2.5ch` → `0 1.5ch` with the bracket gap `1ch` → `0.25ch` (the brackets still hang inside the padding). Ruling: ledger 2026-10-20 (slice-1 review I1: the chip covered the last letter of the name by 13–16 px on every portrait phone; the name now clears the chip by at least 8 px from 320 to 719 px, pinned by `tests/tokens.test.ts` "band fit").
- **12.9** 3.6.6 (print): adds "`@media print` sets `color-scheme: light` and the light token column on `:root, :root[data-theme]`, so both looks print dark text on paper". Ruling: ledger 2026-10-20 (slice-1 review I2: the dark look printed `--fg #e8eeff` text, which Chrome's print path leaves faint).
- **12.10** 4.12.2 (panel stylesheet): adds "the Vite plugin `lilGuiCss` (`vite.config.ts`) strips lil-gui's embedded `data:` icon font from the imported stylesheet; its three glyphs (▾ ↕ ✓) fall back to the system font". Ruling: ledger 2026-10-20 (Task 16 Step 8.3: the CSP's `font-src 'self'` blocked the data: font on the preview and logged a console error on `?debug`).
- **12.11** 6.1.3 and 3.7.1 (draws per frame; resize): "2 draws per animation frame" → "2 draws per animation frame, plus one redraw on a frame whose canvas resized: the ResizeObserver callback runs after that frame's draws and setting `canvas.width`/`height` clears the drawing buffer to black, so `App.resize()` redraws the last frame's inputs at the new size at once (or clears to field-0 before the programs are ready)". Ruling: ledger 2026-10-20 (slice-2 review I1: every resizing frame presented a black field; measured 91 of 91 frames in a simulated drag).
- **12.12** 4.6.5 step 4 and 4.6.6 (colour tween start): "`onChange` starts the `ColorTween` at `performance.now()`" → "`onChange` queues the colours; the tween starts at the timestamp of the next animation frame, so the field and the CSS transition share a start (A3)". Ruling: ledger 2026-10-19 22:19 (pre-flight V6; the line was promised with Task 15 and is written here).
- **12.13** 6.1.7 measurement (Task 23, row B07): the budget is read as the row writes it, "the first contentful paint is the first visible field frame at the entry's t = 0" (and 11.5: "FCP ≤ 1.0 s already bounds when t = 0 can happen"), so the measured value is the frame after `data-field-ready`. Chrome's `first-contentful-paint` entry is recorded beside it, not instead of it: the canvas fades 0 → 1 over 400 ms (3.4.2), and Chrome's paint-timing rule for opacity animations that start at 0 (the rule 9.1 already records for LCP) usually places FCP at the end of that fade, about t = 0 + 430 ms; in one run of five it fired at the first frame. Measured on the preview at `aa7dc19`, Fast 4G, 1440×900, fresh contexts, five runs: t = 0 at 652 / 673 / 657 / 818 / 644 ms (median 657 ms, PASS); Chrome FCP 1084 / 1116 / 1096 / 1256 / 680 ms (median 1096 ms); canvas opacity samples in one run: 0.044 at t = 0 + 18 ms, 0.26 at + 106, 0.53 at + 211, 1 at + 403. Nothing is tuned (6.1.18). If Chrome's number is to be the binding one, the 400 ms fade in 3.4.2 has to shrink, a design change for Parsa raised in the approval message. Ruling: ledger 2026-10-20 (Task 23 V10).
- **12.14** 3.3 (the field renderer), 3.3.2–3.3.3, 3.3.6.2, 3.3.7.1, 3.3.10, 4.9, 4.10.3 (Parsa, 2026-10-20 16:58 PDT: "i dont want dither, i want the dashes"; 18:34: "you will do dashes, instead of dither … finish it tonight"): the pass-2 Bayer dither is replaced by the Blueprint `glyph: 'dashes'` preset of the picks file (density dense, intensity lively, motion flow, reaction repel, click ripple) on the Dither Blue palette. Lattice: sp = clamp(k[density] × w, 5, 40) CSS px with k sparse 0.021 / medium 0.0135 / dense 0.0092, widened by 12 % until floor(w / sp) × floor(h / sp) ≤ 7000 (`dashSpacingFor`); `computeGrid` keeps sp unsnapped (`cellCss`, `cellDev = sp × dpr`), cols = ceil(w / sp), rows = ceil(h / sp), one pass-1 texel per cell. Surface: plain two-octave fbm at x / 141.18, no domain warp, v = clamp((fbm − 0.25) × 1.9); `uLevel` becomes vec3 (level, gain, dither-curve mix `shapeK`, 0 by default). Pass 2 = `dash.vert` + `dash.frag`: one instance per cell, `drawArraysInstanced(TRIANGLE_STRIP, 0, 4, cols × rows)` on an empty VAO (quad from `gl_VertexID`, cell from `gl_InstanceID`), premultiplied ONE / ONE_MINUS_SRC_ALPHA over a field-0 clear, anti-aliased capsule (round caps); still two draw calls per frame. Stroke of a cell with value v: centre = lattice point + (noise3(q + (11, 0), zD) − 0.5, noise3(q + (0, 37), zD + 5) − 0.5) × 0.9 sp I (1 − maskE), q = p / 171.43; pointer repel inside R = 8 sp slides the centre away by smoothstep(1 − d / R) × strength × 2.6 sp, brightness boost 0.35 (`uWarp.y`); angle = 2π noise3(p / 200, zE); half-length sp (0.15 + 0.5 v); width max(1, 0.08 sp); alpha 0.16 + 0.84 v; colour 'core' = field-1 / field-2 above t2 0.68 / field-3 above t3 0.85 ('muted' = field-1 only, a `?debug` toggle). flowZ carries nine values [zA, 1.4 zA + 3.1, zB, 1.4 zB + 3.1, zC, 1.4 zC + 3.1, zD, zD + 5, zE] with speeds warp 0.09, main 0.22, drift 0.18, angle 0.1 (× I τ). 4.9 defaults: density dense, intensity lively, pointer { radiusK 0, radiusSp 8, warpK 0, boost 0.35 }, tiers { 0.68, 0.85 }, shape { 141.18, warpAmp 0, level 0.25, gain 1.9, shapeK 0 }, dash block as above. 4.10.3: the OG still draws `dashGrid(109, 58, 11.04, 12, 1.7)` as round-capped SVG lines over the dark field-0. `.field` loses `image-rendering: pixelated`; `src/shaders/dither.frag`, BAYER8, `bayerThreshold`, `tierGrid`, `cellCssFor` and `latticeSpacing` are removed; `tierOf(v, t2, t3)` takes the value alone. Rulings inside the pivot (ledger 2026-10-20 16:58): 'core' colour by default although Parsa's light pick said 'muted' (muted makes the entry name faint); the angle noise advances with τ (intensity-scaled) instead of the Blueprint's wall-clock t; round caps; Task 23's measured numbers (12.13) describe the dither build and are not re-measured (Parsa: no more review).
- **12.15** 3.3 pass 2, 3.4 (the entry name), 4.9 (Parsa, 2026-10-20 22:08 PDT: the light-look name "is a bit more faint and you can't really tell … make the name more legible by making it heavier or darker … maintain the blue"; "the whole field is also a little bit thin … the slightest bit heavier"): pass 1 writes the name mix `tm = k × m` (dissolve × mask coverage) into the texel's .g beside v; pass 2 reads it as m and scales the stroke: half-length × (1 + (textLen − 1) m), width = max(1, 0.08 sp × weight) × (1 + (textWidth − 1) m), colour mix(tier colour, ink, m) with ink = clamp(field-3 + (field-3 − field-0) × textInk) (darker on the light look, brighter on the dark one, computed per frame from the tweened colours), alpha mix(0.16 + 0.84 v, 1, m). weight = 1 + (weightLight − 1) × smoothstep of field-0's luma (0.3–0.7), so the light look's strokes are 30 % wider and the change crossfades with the theme tween. New uniforms `uInk` (vec3) and `uWeight` (vec4) close UNIFORMS_PASS2. 4.9 dash defaults: weightLight 1.3, textWidth 2, textLen 1.3, textInk 0.25 (`?debug` sliders). The OG still is unchanged (no name in the field).
- **12.16** 3.1.13, 3.1.14, 3.1.15, 3.4.6 (Parsa, 2026-10-21 16:39 PDT: "optimize the site for mobile … 1. The intro name animation is on the bottom half of the screen when it should be middle center 2. i dont want the user to have to scroll at all 3. the dash background doesnt have to have a designated place, since mobile is a small screen it can just be faint in the background"): the bottom band is retired. Under `BAND_QUERY` the field fills the viewport behind the content under a flat 80 % scrim, the entry name stacks into two lines and forms at the screen's centre, rows flow inline, the rhythm follows `svh`, and a two-step height ladder (Misc 7 → 3 tags at ≤ 719.98 px tall, Projects 4 → 2 rows at ≤ 599.98 px) keeps the page to one screen on every current phone. New: `--fs-proj`, `entryText()`, `LINE_ADVANCE_EM`, `fitFontPx(…, lines)`, `tests/phoneLayout.test.ts`. Rulings (builder, no review per Parsa's standing rule): the ladder trims Misc on iPhones in Safari (664–672 px tall) rather than shrinking type below 12 px; project descriptions stay, one line each at `--fs-proj`; landscape phones keep the rail and its small scroll (3.1.15); the Konami egg on phones writes under the veil (its box is still the whole field). Measured numbers in 3.1.13.
- **12.17** 3.1.4, 3.1.13 (Parsa, 2026-10-22 13:29 PDT: "everything looks super squished, you might have to remove some stuff, i was thinking maybe remove the projects. Most of the projects were built under Koreex anyway so you should add a link to koreex that takes you to the website, same for the desktop version"): the Projects block is hidden on phones and the phone type and rhythm loosen to the 12.16-era band sizes or above (`--fs-body` 13–15.5 px, `--gap-block` up to 32 px, `--pad-y` up to 32 px); the 720 px ladder step goes, leaving Misc 7 → 3 tags at ≤ 599.98 px tall. "Koreex Systems" in Experience row 1 links to https://koreex.com/ in a new tab in both layouts (`a.org`, the `a.pname` treatment); the desktop rail keeps the Projects block. `--fs-proj` is removed. Ruling (builder): "same for the desktop version" is read as the Koreex link on the desktop too, not as removing Projects there; Parsa can drop the desktop Projects block with one CSS line if he meant that.
- **12.18** 3.1.13 (Parsa, 2026-10-22 20:54 PDT, iPhone Safari screenshot: "at the very top and the very bottom, the background sort of dash animation doesn't go there. It's sort of cut off … is there any way we can extend it to be beyond those borders?"): on phones the canvas and the veil overdraw 160 px above and below the viewport plus the safe-area insets, so Safari's translucent status bar and toolbar show dashes and the URL-bar collapse shows no bare background. Measured on the dev build at 390×664: field and scrim boxes 390×984 at top −160, canvas 780×1968 device px, 50 × 126 cells at sp 7.87 (6 300 strokes, under the 7 000 cap), scrollHeight 664 (fixed boxes add no scroll). Ruling (builder): a fixed 160 px overdraw rather than `env()` alone, because the insets read 0 while Safari's bars are shown.
- **12.19** 3.1.13 (Parsa, 2026-11-14 18:35 PST, iPhone Chrome screenshot: "The mobile website looks very congested and poorly formatted. Looks like word vomit."): on phones each row stacks in two lines (role left, years right-aligned on the same line, organisation below in `--fg-2` at the new `--fs-sub: clamp(12px, 3.2vw, 14px)`), the row hairlines and the "· " prefix go, and Misc becomes chips at `--fs-misc: clamp(11.5px, 3.05vw, 13.5px)`. `--row-pad` drops to `clamp(3px, 0.7svh, 7px)`. Under 600 px tall the ladder also pins `--gap-block: 12px` and the chip gap to 4 px. `.org { color: inherit }` in both layouts: the Koreex link no longer shows the browser link colour. Still one screen, no scroll: measured on the dev build, scrollHeight equals the viewport at 320×568, 360×640, 375×553, 390×655, 390×664, 393×672, 430×746, 360×724, 412×791, 375×667, 390×844 and 768×1024; slack above the links 12.5 px at 390×655 and 19 px at 390×664. `tests/phoneLayout.test.ts` models the new stack.
- **12.20** 3.1.16, 3.5.10 (Parsa, 2026-11-14 18:45 PST: "make the light/dark switch a subtle sun and moon"): the toggle is a `--toggle` square chip (44 px on phones, 1 px `--line` border, `--fg-2` icon) holding two inline SVG line icons, a sun and a moon, in one grid cell. `themeController` sets `data-to` on the button to the look a press leads to (`light` shows the sun, `dark` shows the moon); the icons crossfade with a small rotate over 300 ms (none under reduced motion). The word, its `[ ]` brackets and `data-theme-word` are gone; the `aria-label` ("Switch to light mode" / "Switch to dark mode") is unchanged and is the only accessible name. Hover and keyboard focus turn the icon `--accent-2` and the border `--line-strong`; focus adds a 1 px `--focus-ring` outline. Earlier text in 3.1.16 and 12.8 about the word chip, its padding and its brackets is superseded.
- **12.21** 3.1.16 (Parsa, 2026-11-14 19:28 PST: "there is still a box around it, remove it i want only the icons"): the toggle has no border and no background. The `--toggle` square stays as the invisible touch target (44 px on phones); the icon sits at its right edge (`place-items: center end`), so it hangs on the right gutter. Hover and keyboard focus turn the icon `--accent-2`; focus keeps the 1 px `--focus-ring` outline. Supersedes the chip border and background of 12.20.
