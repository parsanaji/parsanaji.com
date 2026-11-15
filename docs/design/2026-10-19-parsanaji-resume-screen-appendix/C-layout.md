# Layout report — parsanaji.com résumé screen (Agent C, 2026-10-19)

Scope: brief R1, R8–R13 and section 2 "Agent C". Colours come from Agent B (`reports/palette.md` 1.1) and the controller update of 2026-10-19: links `--fg` at rest, brackets and hover/focus label `--accent-2`, "copied" in plain `--accent-2`, and scrim alpha ≥ 0.86 under every text pixel. Every number below was measured in Chrome (DevTools MCP) on the throwaway prototype in my scratch folder, using the owner's real strings and JetBrains Mono 400/700.

## 0. Verdict

- **Desktop fits on one screen, no scroll, at all five required sizes.** The tightest is 1280×720, with **73 px** of spare height. No row wraps on desktop.
- **Type scale at 1440×900:** name 74.88 px, body 14.4 px, eyebrow 11.23 px (tagline 16.13, dates 12.38, misc 13.54, links 14.4, status/footer 11.52).
- **Collapse rule (short windows only, all ≥ 720 px wide):**
  - At 600 px tall or more, everything shows. 1280×600 still has 8 px spare.
  - **Below 600 px tall, Projects shows 2 rows.**
  - **Below 520 px tall, Misc also shows 3 tags (one line).**
  - Below about 476 px tall, the document scrolls. Nothing is ever clipped.
  - Collapsed items are visually hidden, not removed, so screen readers keep the full résumé.
- **Scrim:**
  - Solid (alpha 1) from x = 0 to the middle of the rail.
  - Linear to 0.86 at the rail's right edge, which is always at or right of the widest text pixel.
  - Then an eased fade to 0 over `clamp(160px, 18vw, 440px)`.
  - Measured alpha at the widest text pixel is 0.865–0.872 at every rail viewport.
  - The links, status and footer sit in the solid zone.
- **Phone (< 720 px):**
  - Content stacks and scrolls.
  - The field is a fixed band over the bottom 28 svh, drawn **above** the content: text scrolls under a 56 px fade into the scrim colour, so text is never drawn over field pixels.
  - At the end of the scroll, the footer rests 24 px above the fade.
- **Tablet 768×1024:** the desktop rail fits, so per R10 the stylesheet uses it. I recommend the band layout for portrait tablets instead; see decision D1.

## 1. Semantic HTML (body)

Rules:
- One DOM order serves both layouts. On phones, CSS `order` moves the status line up under the tagline (the Blueprint `stack` order). The status line has no focusable content, so focus order is unaffected.
- The theme toggle is the last child of `<main>` and is `position: fixed` (desktop) or `absolute` (phone). It is last in tab order on purpose: the primary actions come first. Never put `transform`, `filter`, `contain` or `will-change: transform` on `.rail`, or the fixed toggle would be positioned relative to the rail; the entry animates the rail's children only.
- Nothing in this markup needs inline style. The CSP stays `style-src 'self'`.

```html
<body>
  <canvas class="field" data-field aria-hidden="true"></canvas>
  <div class="scrim" aria-hidden="true"></div>

  <main class="rail" data-rail>
    <header class="intro" data-reveal="0">
      <h1 class="name" data-name>Parsa Naji</h1>
      <p class="tagline">I build AI agents, apps, and the systems behind them.</p>
    </header>

    <section class="block block--exp" aria-labelledby="h-exp" data-reveal="1">
      <h2 class="eyebrow" id="h-exp">Experience</h2>
      <ul class="rows" role="list">
        <li class="row"><span class="when">2025 <span aria-hidden="true">—</span><span class="sr-only">to present</span></span><span class="what">Software Developer <span class="sub">Koreex Systems</span></span></li>
        <li class="row"><span class="when">2026 <span aria-hidden="true">—</span><span class="sr-only">to present</span></span><span class="what">AI Specialist / Developer <span class="sub">Dreiton Labs</span></span></li>
        <li class="row"><span class="when">2025</span><span class="what">Calculus Tutor <span class="sub">Saddleback College</span></span></li>
      </ul>
    </section>

    <section class="block block--proj" aria-labelledby="h-proj" data-reveal="2">
      <h2 class="eyebrow" id="h-proj">Projects</h2>
      <ul class="rows rows--compact" role="list">
        <li class="row"><span class="what"><span class="pname">parsanaji.com</span> <span class="sub">This site. GPU particle field in Three.js.</span></span></li>
        <li class="row"><span class="what"><span class="pname">SolScope</span> <span class="sub">Microcap cryptocurrency tracker.</span></span></li>
        <li class="row"><span class="what"><span class="pname">Kaptur</span> <span class="sub">Business expense tracker for trades.</span></span></li>
        <li class="row"><span class="what"><span class="pname">Mafia</span> <span class="sub">Family and friends game.</span></span></li>
      </ul>
    </section>

    <section class="block block--edu" aria-labelledby="h-edu" data-reveal="3">
      <h2 class="eyebrow" id="h-edu">Education</h2>
      <ul class="rows" role="list">
        <li class="row"><span class="when">2025 <span aria-hidden="true">—</span><span class="sr-only">to</span> 2026</span><span class="what">Saddleback College <span class="sub">Business Administration</span></span></li>
      </ul>
    </section>

    <section class="block block--misc" aria-labelledby="h-misc" data-reveal="4">
      <h2 class="eyebrow" id="h-misc">Misc</h2>
      <ul class="tags" role="list">
        <li>Agentic Workflows</li>
        <li>Multi-Agent Orchestration</li>
        <li>Prompt &amp; Context Engineering</li>
        <li>LLM Cost and Token Optimization</li>
        <li>WebGL &amp; shaders</li>
        <li>iOS/macOS</li>
        <li>Swift</li>
      </ul>
    </section>

    <nav class="links" aria-label="Contact" data-reveal="5">
      <ul role="list">
        <li><a class="lnk" href="https://github.com/parsanaji" rel="me" data-link="github">github</a></li>
        <!-- emitted only when content.links.linkedin is non-empty (never a dead link):
        <li><a class="lnk" href="{links.linkedin}" rel="me" data-link="linkedin">linkedin</a></li> -->
        <li><a class="lnk" href="mailto:info@parsanaji.com" data-email="info@parsanaji.com"><span class="swap"><span class="swap-main">say hi</span><span class="swap-alt">copied</span></span></a></li>
      </ul>
      <span id="email-hint" hidden>Copies info@parsanaji.com to the clipboard.</span>
    </nav>

    <p class="status" data-reveal="6"><span class="dot" aria-hidden="true"></span>Building something new</p>

    <p class="place" data-reveal="7">Irvine, CA<span data-clock hidden> · <span data-clock-time>2:36 PM PDT</span></span></p>

    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Dark theme" aria-pressed="true" data-reveal="8" hidden><span class="theme-glyph" aria-hidden="true"></span></button>
  </main>

  <dialog class="keys" data-keys aria-labelledby="keys-title" closedby="any">
    <h2 class="eyebrow" id="keys-title">Shortcuts</h2>
    <dl class="keys-list">
      <div><dt><kbd>g</kbd></dt><dd>GitHub</dd></div>
      <div data-key="linkedin" hidden><dt><kbd>l</kbd></dt><dd>LinkedIn</dd></div>
      <div><dt><kbd>e</kbd></dt><dd>Copy email</dd></div>
      <div><dt><kbd>?</kbd></dt><dd>Show or hide this list</dd></div>
      <div><dt><kbd>esc</kbd></dt><dd>Close</dd></div>
    </dl>
    <button class="lnk keys-close" type="button" data-keys-close>close</button>
  </dialog>

  <p class="sr-only" data-live role="status" aria-live="polite" aria-atomic="true"></p>

  <script type="module" src="/src/main.ts"></script>
</body>
```

### 1.1 Hooks the scripts use

| hook | element | used by / contract |
|---|---|---|
| `data-field` | `<canvas>` | Renderer. CSS sizes it: full viewport on desktop, the bottom 28 svh band on phones. The renderer must size from `clientWidth/clientHeight` through a ResizeObserver, not from `innerWidth`. Pointer input comes from `window` listeners, because the canvas sits under the rail on desktop and above the content on phones. On phones the canvas has `touch-action: pan-y`, so a swipe that starts on the band still scrolls. |
| `html.no-webgl` | `<html>` | Set when WebGL2 fails or errors (R13). Hides the canvas and the scrim. The rail stays readable on `--bg`. |
| `data-entry` on `<html>` | entry state | Steps:<br>1. `"run"` hides every `[data-reveal]` (opacity 0, translateY 6 px). It must be set **before first paint** by the bootstrap (Agent A), or the rail flashes visible and then disappears.<br>2. `"in"` at 2.1 s fades the blocks in, staggered by `data-reveal` × 40 ms (0.6 s each).<br>3. Remove the attribute after about 3.1 s.<br>Never set it under reduced motion, when the tab is hidden, or without WebGL. No-JS never has it, so the rail shows by default (R13). |
| `data-reveal="0…8"` | 9 rail children | Stagger order (CSS-only delays; no inline style). |
| `data-name` | `<h1>` | Scramble egg (R12b). While scrambling, set `aria-label="Parsa Naji"` on the h1 and restore the text node after. Use ASCII glyphs that are in the font subset and keep the space fixed; mono advance means zero layout shift. It is not focusable (mouse egg only). |
| `data-link="github"` / `"linkedin"` | `<a>` | `g` / `l` shortcuts. `l` is active only if the linkedin anchor exists. |
| `data-email` | say hi `<a>` | The script does the following:<br>1. At boot, adds `aria-describedby="email-hint"` (the description only makes sense once copy is wired).<br>2. On click or `e`, copies the address, sets `data-copied` for 1.2 s, and writes the live region.<br>3. If the Clipboard API is missing or rejects, falls back to `location.href = mailto:`. |
| `data-clock` + `data-clock-time` | footer | The clock module removes `hidden` from `[data-clock]` and writes `2:36 PM PDT` (12 h, America/Los_Angeles, each minute). No-JS shows "Irvine, CA" only. It is never a live region. |
| `data-theme-toggle` | `<button>` | The theme module removes `hidden` and keeps `aria-pressed` = effective theme is dark. The name stays "Dark theme". |
| `data-keys`, `data-keys-close`, `data-key="linkedin"` | `<dialog>` | `?` → `showModal()` / `close()`. Esc closes natively, and focus returns to the opener natively. `closedby="any"` gives light dismiss; add a backdrop-click fallback (`e.target === dialog`) for engines without it. Un-hide the `l` row only when linkedin exists. |
| `data-live` | `<p role="status">` | Clear it, then on the next frame write `Email address copied.`; clear it again after 3 s. It is present and empty at load, which reliable announcements need. |

## 2. Stylesheet (layout + type; colour tokens only)

Paste it after Agent B's palette block (`reports/palette.md` 1.1), which owns `::selection`, `color-scheme` and every colour token. The `:where(:root)` fallbacks have zero specificity, so B's values always win.

This is the exact file tested in the browser: `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\layout.css`. The prototype loads a copy with the two `@font-face` rules stripped (`layout.proto.css`), because it uses Google Fonts. Production keeps the `@font-face` rules and preloads both woff2 files (head block in §5).

```css
/* =====================================================================
   parsanaji.com — résumé screen: LAYOUT + TYPE (Agent C)
   No colour literals. Colour tokens come from Agent B (reports/palette.md 1.1):
   --bg --scrim-solid --scrim-mid --scrim-clear --fg --fg-2 --accent --accent-2
   --accent-glow --line --focus-ring --status-dot --overlay-bg --overlay-border
   (--field-0..3 feed the WebGL uniforms; ::selection lives in the palette block)
   ===================================================================== */

/* Fonts (production paths; the prototype loads Google Fonts instead) */
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/JetBrainsMono-Regular.subset.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/JetBrainsMono-Bold.subset.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Derived tokens at zero specificity, so Agent B's :root values win. */
:where(:root) {
  --line: color-mix(in srgb, var(--fg) 14%, transparent);
  --line-strong: color-mix(in srgb, var(--fg) 28%, transparent);
  --overlay-border: var(--line-strong);
  --overlay-bg: var(--scrim-mid);
  --focus-ring: var(--accent);
  --status-dot: var(--accent);
  --accent-glow: color-mix(in srgb, var(--accent) 35%, transparent);
}

:root {
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  /* fluid driver: the smaller of 1vw and 1.6vh (1.6vh = 1vw at 16:10) */
  --k: min(1vw, 1.6vh);

  /* type scale (desktop + tablet rail) */
  --fs-name:    clamp(40px, calc(var(--k) * 5.2), 104px);
  --fs-tag:     clamp(14px, calc(var(--k) * 1.12), 21px);
  --fs-body:    clamp(13px, var(--k), 18px);
  --fs-when:    clamp(12px, calc(var(--k) * 0.86), 16px);
  --fs-eyebrow: clamp(11px, calc(var(--k) * 0.78), 14px);
  --fs-misc:    clamp(12.5px, calc(var(--k) * 0.94), 17px);
  --fs-link:    clamp(13px, var(--k), 18px);
  --fs-meta:    clamp(11px, calc(var(--k) * 0.8), 14.5px);

  /* geometry */
  --gutter:  clamp(24px, 4vw, 96px);
  --pad-y:   clamp(24px, 5.2vh, 72px);
  --rail-w:  min(calc(44 * var(--fs-body)), calc(100vw - 2 * var(--gutter)));
  --ramp:    clamp(160px, 18vw, 440px);

  /* vertical rhythm */
  --gap-tag:     clamp(6px, 1.2vh, 14px);   /* name → tagline */
  --gap-block:   clamp(14px, 3vh, 40px);    /* between top blocks */
  --gap-eyebrow: clamp(4px, 0.9vh, 12px);   /* eyebrow → rows */
  --row-pad:     clamp(3px, 0.55vh, 8px);   /* row padding, each side */
  --gap-foot:    clamp(10px, 2vh, 24px);    /* misc → links */
  --gap-meta:    clamp(6px, 1.1vh, 14px);   /* links → status → place */

  --toggle: clamp(40px, calc(var(--k) * 2.6), 52px);
  --when-w: calc(var(--fs-when) * 6.9);   /* 11.5ch of JetBrains Mono (advance 0.6em) at the when size */
}

*, *::before, *::after { box-sizing: border-box; }

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  background: var(--bg);
}
body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  line-height: 1.45;
  font-synthesis: none;
  font-variant-ligatures: none;   /* JetBrains Mono code ligatures off for prose */
  font-kerning: none;
  cursor: default;
  overflow-x: clip;
}
h1, h2, p, ul, ol, dl, dd { margin: 0; }
ul, ol { padding: 0; list-style: none; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* ---------- field + scrim ---------- */
.field {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
}
.scrim {
  --scrim-r: calc(var(--gutter) + var(--rail-w));
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: calc(var(--scrim-r) + var(--ramp));
  z-index: 1;
  pointer-events: none;
  /* alpha: 1 → (mid-rail) 1 → (rail edge, >= text edge) 0.86 → eased → 0 at rail edge + ramp */
  background: linear-gradient(90deg,
    var(--scrim-solid) 0,
    var(--scrim-solid) calc(var(--gutter) + var(--rail-w) * 0.5),
    var(--scrim-mid) var(--scrim-r),
    var(--scrim-clear) 100%);
  background: linear-gradient(90deg,
    var(--scrim-solid) 0,
    var(--scrim-solid) calc(var(--gutter) + var(--rail-w) * 0.5),
    var(--scrim-mid) var(--scrim-r),
    color-mix(in srgb, var(--scrim-solid) 70%, transparent) calc(var(--scrim-r) + var(--ramp) * 0.25),
    color-mix(in srgb, var(--scrim-solid) 42%, transparent) calc(var(--scrim-r) + var(--ramp) * 0.5),
    color-mix(in srgb, var(--scrim-solid) 16%, transparent) calc(var(--scrim-r) + var(--ramp) * 0.75),
    var(--scrim-clear) 100%);
}
html.no-webgl .field,
html.no-webgl .scrim { display: none; }

/* ---------- rail (desktop + tablet) ---------- */
.rail {
  position: relative;               /* never transform/filter/contain this: the toggle is position:fixed inside it */
  z-index: 2;
  width: calc(var(--gutter) + var(--rail-w));
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--pad-y) 0 var(--pad-y) var(--gutter);
  display: flex;
  flex-direction: column;
}
.rail > * { flex-shrink: 0; }
.rail > * + * { margin-top: var(--gap-block); }

.intro { display: flex; flex-direction: column; gap: var(--gap-tag); }
.name {
  font-size: var(--fs-name);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025em;
  margin-left: -0.045em;            /* optical: pull the P stem onto the rail edge */
  white-space: nowrap;
  cursor: default;
}
.tagline {
  font-size: var(--fs-tag);
  line-height: 1.4;
  color: var(--fg-2);
  text-wrap: pretty;
}

/* section blocks */
.block { display: flex; flex-direction: column; gap: var(--gap-eyebrow); }
.eyebrow {
  display: flex;
  align-items: center;
  gap: 1em;
  font-size: var(--fs-eyebrow);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-2);
}
.eyebrow::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--line);
}

/* rows: fixed "when" column (11.5ch of the when face = "2025 — 2026" + air) */
.row {
  display: grid;
  grid-template-columns: var(--when-w) minmax(0, 1fr);
  column-gap: 1.1em;
  align-items: baseline;
  padding-block: var(--row-pad);
  font-size: var(--fs-body);
  line-height: 1.45;
}
.row + .row { border-top: 1px solid var(--line); }
.when {
  font-size: var(--fs-when);
  color: var(--fg-2);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.what { grid-column: 2; min-width: 0; color: var(--fg); }
.sub { color: var(--fg-2); }
.sub::before {
  content: "· ";
  content: "· " / "";
}
.rows--compact .row { padding-block: calc(var(--row-pad) * 0.5); border-top: 0; }
.pname { color: var(--fg); }

/* misc: wrapping tags, dot separators clipped at line starts */
.block--misc { overflow: hidden; overflow: clip; }
.rail > .block--edu  { margin-bottom: var(--gap-block); }   /* minimum gap above the bottom group */
.rail > .block--misc { margin-top: auto; }                   /* bottom group pins to the rail bottom */
.tags {
  --sep: 2.4ch;
  display: flex;
  flex-wrap: wrap;
  row-gap: 0.15em;
  margin-left: calc(-1 * var(--sep));
  font-size: var(--fs-misc);
  line-height: 1.5;
  color: var(--fg-2);
}
.tags li {
  position: relative;
  padding-left: var(--sep);
  white-space: nowrap;
}
.tags li::before {
  content: "·";
  content: "·" / "";
  position: absolute;
  left: 0;
  width: var(--sep);
  text-align: center;
  opacity: 0.6;
}

/* bottom group rhythm */
.rail > .links  { margin-top: var(--gap-foot); }
.rail > .status { margin-top: var(--gap-meta); }
.rail > .place  { margin-top: var(--gap-meta); }

/* links row + bracket hover (brackets hang outside the box: zero layout shift) */
.links ul {
  display: flex;
  flex-wrap: wrap;
  column-gap: 4ch;                  /* ≥ 2 × "[ " so two lit links never collide */
  row-gap: 0.4em;
  font-size: var(--fs-link);
  line-height: 1.45;
}
.lnk {
  --hit: 0.3em;
  position: relative;
  display: inline-block;
  padding-block: var(--hit);
  margin-block: calc(-1 * var(--hit));   /* taller hit area, same line box */
  color: var(--fg);                 /* at rest: fg, as on the owner's card */
  background: none;
  border: 0;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
.lnk::before,
.lnk::after {
  position: absolute;
  top: var(--hit);
  color: var(--accent-2);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
.lnk::before { content: "["; content: "[" / ""; right: 100%; padding-right: 1ch; }
.lnk::after  { content: "]"; content: "]" / ""; left: 100%;  padding-left: 1ch; }
.lnk:hover,
.lnk:focus-visible { color: var(--accent-2); }
.lnk:hover::before, .lnk:hover::after,
.lnk:focus-visible::before, .lnk:focus-visible::after { opacity: 1; }
.lnk:focus { outline: none; }
.lnk:focus-visible {                /* brackets + a 1 px underline: two cues, neither colour-only */
  text-decoration: underline 1px;
  text-underline-offset: 0.35em;
  text-decoration-color: var(--focus-ring);
}

/* "say hi" ⇄ "copied": both labels share one grid cell (6ch each), nothing moves.
   Copied = plain --accent-2 text in place of the label for 1.2 s (no brackets). */
.swap { display: inline-grid; }
.swap > * { grid-area: 1 / 1; }
.swap-alt { visibility: hidden; color: var(--accent-2); }
.lnk[data-copied] .swap-main { visibility: hidden; }
.lnk[data-copied] .swap-alt  { visibility: visible; }
.lnk[data-copied]::before,
.lnk[data-copied]::after { opacity: 0; }

/* status + place */
.status,
.place {
  font-size: var(--fs-meta);
  line-height: 1.4;
  color: var(--fg-2);
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
.status {
  display: flex;
  align-items: center;
  gap: 0.75em;
  letter-spacing: 0.08em;
  color: var(--accent-2);           /* palette usage map; sits in the solid scrim zone */
}
.place { letter-spacing: 0.06em; }
.dot {
  position: relative;
  flex: none;
  width: 0.62em;
  height: 0.62em;
  border-radius: 50%;
  background: var(--status-dot);
}
.dot::after {                       /* compositor-only halo: transform + opacity */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--accent-glow);
  animation: dot-pulse 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
}
@keyframes dot-pulse {
  0%   { transform: scale(1);   opacity: 1; }
  70%  { transform: scale(2.8); opacity: 0; }
  100% { transform: scale(2.8); opacity: 0; }
}

/* ---------- theme toggle (top-right, centred on the name's line) ---------- */
.theme-toggle {
  position: fixed;
  z-index: 3;
  top: calc(var(--pad-y) + var(--fs-name) / 2 - var(--toggle) / 2);
  right: max(var(--gutter), env(safe-area-inset-right, 0px));
  width: var(--toggle);
  height: var(--toggle);
  display: grid;
  place-items: center;
  padding: 0;
  margin: 0;
  border: 1px solid var(--overlay-border);
  border-radius: 4px;
  background: var(--overlay-bg);    /* chip over the open field: alpha 0.94 */
  color: var(--fg-2);
  font: inherit;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.theme-toggle[hidden] { display: none; }
.theme-toggle:hover { color: var(--fg); border-color: var(--line-strong); }
.theme-toggle:focus { outline: none; }
.theme-toggle:focus-visible {
  color: var(--fg);
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}
.theme-glyph {                      /* ◐ drawn in CSS: no font glyph, no subset risk */
  width: calc(var(--toggle) * 0.36);
  height: calc(var(--toggle) * 0.36);
  border-radius: 50%;
  border: 1.5px solid currentColor;
  background: linear-gradient(90deg, currentColor 50%, transparent 50%);
  transition: transform 0.3s ease;
}
.theme-toggle[aria-pressed="false"] .theme-glyph { transform: rotate(180deg); }

/* ---------- "?" shortcuts overlay (native modal <dialog>) ---------- */
.keys {
  width: min(24rem, calc(100vw - 32px));
  padding: 20px 22px 18px;
  border: 1px solid var(--overlay-border);
  border-radius: 4px;
  background: var(--overlay-bg);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  line-height: 1.45;
  opacity: 1;
  transition: opacity 0.15s ease, overlay 0.15s allow-discrete, display 0.15s allow-discrete;
}
.keys:not([open]) { opacity: 0; }
@starting-style { .keys[open] { opacity: 0; } }
.keys::backdrop { background: color-mix(in srgb, var(--bg) 60%, transparent); }
.keys .eyebrow { margin-bottom: 14px; }
.keys-list { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; align-items: baseline; }
.keys-list > div { display: contents; }
.keys-list > div[hidden] { display: none; }
.keys-list dd { color: var(--fg-2); }
.keys kbd {
  display: inline-block;
  min-width: 3ch;
  padding: 0 0.6ch;
  border: 1px solid var(--line-strong);
  border-radius: 3px;
  font: inherit;
  font-size: var(--fs-when);
  line-height: 1.6;
  text-align: center;
  color: var(--fg);
}
.keys-close {
  margin-top: 16px;
  margin-left: 2ch;                 /* room for the hanging "[" */
  padding: 0.3em 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--fs-link);
}

/* ---------- entry hooks (state set on <html> by the boot code) ---------- */
html[data-entry="run"] [data-reveal] { opacity: 0; transform: translateY(6px); }
html[data-entry="in"] [data-reveal] {
  opacity: 1;
  transform: none;
  transition: opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
  transition-delay: calc(var(--i, 0) * 40ms);
}
[data-reveal="1"] { --i: 1; } [data-reveal="2"] { --i: 2; } [data-reveal="3"] { --i: 3; }
[data-reveal="4"] { --i: 4; } [data-reveal="5"] { --i: 5; } [data-reveal="6"] { --i: 6; }
[data-reveal="7"] { --i: 7; } [data-reveal="8"] { --i: 8; }

/* ---------- short desktop windows: collapse order ----------
   Everything shows at >= 600 px tall (1280x600 verified). Collapsed items are
   visually hidden, not display:none, so screen readers still get the full résumé.
   Below the last step the document simply scrolls; nothing is ever clipped. */
@media (min-width: 720px) and (max-height: 599.98px) {
  .block--proj .row:nth-child(n+3) {           /* step 1: Projects 4 → 2 rows */
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
  }
}
@media (min-width: 720px) and (max-height: 519.98px) {
  .tags li:nth-child(n+4) {                    /* step 2: Misc 7 → 3 tags (one line) */
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
  }
}

/* ---------- phone: "band" (< 720 px wide) ---------- */
@media (max-width: 719.98px) {
  :root {
    --gutter: clamp(16px, 5.2vw, 28px);
    --fs-name:    clamp(38px, 12vw, 60px);
    --fs-tag:     clamp(14.5px, 3.9vw, 17px);
    --fs-body:    clamp(13.5px, 3.6vw, 15.5px);
    --fs-when:    clamp(12px, 3.15vw, 13.5px);
    --fs-eyebrow: clamp(11px, 2.9vw, 12.5px);
    --fs-misc:    clamp(13px, 3.45vw, 15px);
    --fs-link:    clamp(15px, 4vw, 17px);
    --fs-meta:    clamp(11px, 2.95vw, 12.5px);
    --pad-y: 28px;
    --gap-tag: 10px;
    --gap-block: 30px;
    --gap-eyebrow: 8px;
    --row-pad: 7px;
    --gap-foot: 26px;
    --gap-meta: 12px;
    --band-h: 28vh;
    --fade: 56px;
  }
  @supports (height: 1svh) { :root { --band-h: 28svh; } }

  .rail {
    width: auto;
    min-height: 0;
    padding: calc(var(--pad-y) + env(safe-area-inset-top, 0px))
             max(var(--gutter), env(safe-area-inset-right, 0px))
             calc(var(--band-h) + var(--fade) + 24px + env(safe-area-inset-bottom, 0px))
             max(var(--gutter), env(safe-area-inset-left, 0px));
  }
  /* phone order (Blueprint stack branch): status moves up under the tagline */
  .rail > .intro  { order: 0; }
  .rail > .status { order: 1; margin-top: var(--gap-tag); }
  .rail > :not(.intro):not(.status) { order: 2; }
  .rail > .block--edu  { margin-bottom: 0; }
  .rail > .block--misc { margin-top: var(--gap-block); }

  .row { column-gap: 0.9em; }

  /* field band: fixed across the bottom 28 %, ABOVE the content. Text scrolls under
     a 56 px fade into --scrim-solid and is never drawn over field pixels. */
  .field {
    inset: auto 0 0 0;
    height: var(--band-h);
    z-index: 3;
    touch-action: pan-y;            /* a swipe that starts on the band still scrolls */
  }
  .scrim {
    inset: auto 0 0 0;
    width: auto;
    height: calc(var(--band-h) + var(--fade));
    z-index: 4;
    background: linear-gradient(180deg,
      var(--scrim-clear) 0,
      var(--scrim-solid) var(--fade),
      var(--scrim-mid) calc(var(--fade) + var(--band-h) * 0.12),
      var(--scrim-clear) calc(var(--fade) + var(--band-h) * 0.45));
  }
  html.no-webgl .rail { padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px)); }

  .theme-toggle {
    position: absolute;
    z-index: 5;
    top: calc(var(--pad-y) + env(safe-area-inset-top, 0px) + var(--fs-name) / 2 - var(--toggle) / 2);
    right: max(var(--gutter), env(safe-area-inset-right, 0px));
    --toggle: 44px;
  }
  .lnk { --hit: 0.65em; }           /* 15.6 px × (1.45 + 1.3) ≈ 43–47 px touch target */
  .links ul { row-gap: 1em; }
}
/* narrow phones: the value cell stacks (role / org, project / what) */
@media (max-width: 519.98px) {
  .sub { display: block; }
  .sub::before { content: none; }
  .rows--compact .what { grid-column: 1 / -1; }   /* projects have no dates: use the full width */
  .rows--compact .row { padding-block: calc(var(--row-pad) * 0.6); }
}

/* ---------- motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .dot::after { animation: none; opacity: 0; }
  .lnk, .lnk::before, .lnk::after, .theme-toggle, .theme-glyph, .keys { transition: none; }
  html[data-entry] [data-reveal] { opacity: 1; transform: none; transition: none; }
}

/* ---------- forced colours (Windows contrast themes) ---------- */
@media (forced-colors: active) {
  .field, .scrim { display: none; }
  .dot { background: CanvasText; }
  .dot::after { display: none; }
  .eyebrow::after { background: CanvasText; }
  .lnk:focus-visible { outline: 2px solid LinkText; outline-offset: 3px; }
}

/* ---------- print: a clean one-page résumé ---------- */
@media print {
  .field, .scrim, .theme-toggle, .keys, .dot { display: none !important; }
  .rail { width: auto; min-height: 0; padding: 0; }
  .lnk::before, .lnk::after { display: none; }
}
```

### 2.1 Geometry (desktop and tablet rail)

| quantity | formula | 1280×720 | 1440×900 | 1920×1080 | 2560×1440 |
|---|---|---|---|---|---|
| fluid driver `--k` | `min(1vw, 1.6vh)` | 11.52 | 14.4 | 17.28 | 23.04 |
| left gutter | `clamp(24px, 4vw, 96px)` | 51.2 | 57.6 | 76.8 | 96 |
| rail content width | `min(44 × body, 100vw − 2 × gutter)` | 572 | 633.6 | 760.3 | 792 |
| rail right edge R (= gutter + rail) | — | 623 | 691 | 837 | 888 |
| top/bottom padding | `clamp(24px, 5.2vh, 72px)` | 37.4 | 46.8 | 56.2 | 72 |
| "when" column | `6.9 × when-size` (11.5ch: "2025 — 2026" plus air) + 1.1 em gap | 82.8 + 14.3 | 85.4 + 15.8 | 102.5 + 19 | 110.4 + 19.8 |
| toggle | `clamp(40px, 2.6k, 52px)`, right inset = gutter, centred on the name line | 40 | 40 | 44.9 | 52 |

Other layout rules:
- **Bottom group.** Misc has `margin-top: auto`, so Misc, links, status and footer pin to the rail bottom. Education keeps a minimum `--gap-block` below it.
- **Mono brackets.** `[` and `]` are absolutely positioned outside the link box (`right: 100%; padding-right: 1ch` and its mirror). They hang into the gutter or into the 4ch link gap, so nothing shifts.
  - Measured: link rects are identical before and during hover (`same: true`).
  - Measured: the say hi width is 46.81 px in both the "say hi" and "copied" states.
- **"copied".** Both labels are stacked in one grid cell (both are 6ch). "copied" is plain `--accent-2` text, and the brackets are suppressed while it shows.
- **Misc separators.** The `·` sits in each tag's left padding. The list is shifted left by one separator width and clipped by `overflow: clip` on the section, so the dot at the start of each wrapped line is never visible.
- **Status dot.** The dot is `--status-dot`, and its halo is a `::after` scaled 1 → 2.8 with opacity 1 → 0 over 2.4 s (compositor-only). It is off under `prefers-reduced-motion`.
- **Toggle glyph.** ◐ is drawn in CSS (border + half gradient), so there is no font-subset dependency. It rotates 180° when `aria-pressed="false"`.

### 2.2 Scrim geometry (controller item 1)

Stops on the `.scrim` box (left 0, width R + ramp, ramp = `clamp(160px, 18vw, 440px)`):

| x | colour | alpha |
|---|---|---|
| 0 | `--scrim-solid` | 1 |
| gutter + 0.5 × rail (S) | `--scrim-solid` | 1 |
| R (rail right edge) | `--scrim-mid` | 0.86 |
| R + 0.25 ramp | `color-mix(--scrim-solid 70%, transparent)` | 0.70 |
| R + 0.50 ramp | 42 % | 0.42 |
| R + 0.75 ramp | 16 % | 0.16 |
| R + ramp | `--scrim-clear` | 0 |

Between S and R the alpha is linear 1 → 0.86, so any text pixel left of R sits at ≥ 0.86. The browser fallback (no `color-mix`) is the 4-stop version solid → solid → mid → clear.

B's `--bg-scrim` token (the Blueprint's percentage geometry) is **not used** by the layout, because the rail edge moves with the type scale. Keep it only if the OG script wants it.

Measured, with the widest text pixel taken over the name, tagline, eyebrows, rows, tags, links, status and footer:

| viewport | solid to (S) | 0.86 at (R) | clear at | widest text pixel | alpha there | links/status/footer right edge | in solid zone |
|---|---|---|---|---|---|---|---|
| 1280×720 | 337 | 623 | 854 | 612 | 0.865 | 231 | yes |
| 1366×768 | 341 | 627 | 873 | 616 | 0.865 | 234 | yes |
| 1440×900 | 374 | 691 | 950 | 665 | 0.872 | 246 | yes |
| 1920×1080 | 457 | 837 | 1183 | 806 | 0.872 | 302 | yes |
| 2560×1440 | 492 | 888 | 1328 | 859 | 0.870 | 333 | yes |
| 768×1024 (rail) | 317 | 603 | 763 | 592 | 0.865 | 210 | yes |
| 1536×730 | — | — | — | 622 | 0.865 | — | yes |
| 1024×768 | — | — | — | 602 | 0.865 | — | yes |

Hovered or focused brackets add 2ch (about 16 px at 13 px) to the right of "say hi" and stay far inside S.

- **Phone band scrim.** The scrim box is band + 56 px tall, pinned to the bottom. Stops: `--scrim-clear` at 0, `--scrim-solid` at 56 px (text is fully covered at the band's top edge), `--scrim-mid` at 56 px + 12 % of the band, and `--scrim-clear` at 56 px + 45 % of the band.
- **Toggle chip.** The toggle sits over the open field on a 0.94 `--overlay-bg` chip with an `--overlay-border` hairline.

## 3. Content budget (measured)

The prototype is `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\index.html`, with the real strings and the dark placeholder colours from the controller and B. The field is a static Bayer-dithered fbm placeholder. Fonts were confirmed loaded (`document.fonts.check` true) before every measurement.

Column definitions:
- **doc**: `scrollingElement.scrollHeight / clientHeight`. Equal means no scroll.
- **rail**: rail `scrollHeight / clientHeight`.
- **last bottom**: bottom of the footer line, which is the last rail element. **gap to viewport** is the viewport height minus that bottom, which equals the bottom padding.
- **spare**: the height the rail could still lose before it overflows (the auto gap above Misc, beyond its minimum).

### 3.1 Required viewports

| viewport | doc | rail | last bottom / gap to viewport | spare | name | body | tagline | eyebrow | when | misc | link | meta | rows that wrap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1280×720 | 720/720 | 720/720 | 682.6 / 37.4 | **73** | 59.9 | 13 | 14 | 11 | 12 | 12.5 | 13 | 11 | none (tagline 1 line, Misc 2 lines) |
| 1366×768 | 768/768 | 768/768 | 728.1 / 39.9 | 98 | 63.9 | 13 | 14 | 11 | 12 | 12.5 | 13 | 11 | none |
| 1440×900 | 900/900 | 900/900 | 853.2 / 46.8 | 142 | 74.88 | 14.4 | 16.13 | 11.23 | 12.38 | 13.54 | 14.4 | 11.52 | none |
| 1920×1080 | 1080/1080 | 1080/1080 | 1023.8 / 56.2 | 171 | 89.86 | 17.28 | 19.35 | 13.48 | 14.86 | 16.24 | 17.28 | 13.82 | none |
| 2560×1440 | 1440/1440 | 1440/1440 | 1368 / 72 | 396 | 104 (cap) | 18 (cap) | 21 | 14 | 16 | 17 | 18 | 14.5 | none |
| 768×1024 (rail, per R10) | 1024/1024 | 1024/1024 | 970.8 / 53.2 | 281 | 40 | 13 | 14 | 11 | 12 | 12.5 | 13 | 11 | none |
| 430×932 (band) | 1390/932 (scrolls by design) | — | footer rests at 591; fade starts at 615; band starts at 671 (261 px) | — | 51.6 | 15.48 | 16.77 | 12.47 | 13.5 | 14.84 | 17 | 12.5 | see note |
| 390×844 (band) | 1299/844 (scrolls by design) | — | footer rests at 528; fade starts at 552; band starts at 608 (236 px) | — | 46.8 | 14.04 | 15.21 | 11.31 | 12.29 | 13.46 | 15.6 | 11.51 | see note |

Phone wraps:
- Below 520 px, rows stack by design: role / org and project / description, so each value cell is 2 lines.
- The only real wrap is "This site. GPU particle field in Three.js.", which is 42ch against a 41.5ch line at both 390 and 430 → 3 lines. Decision D3 removes it.
- The tagline is 2 lines; Misc is 5 lines.

### 3.2 Extra desktop windows (real browser viewports) and the collapse steps

| viewport | spare | collapse state |
|---|---|---|
| 1536×730 (15" laptop at 125 %) | 78 | all |
| 1024×768 (tablet landscape) | 109 | all |
| 1366×657 (1366×768 minus browser chrome) | 39 | all |
| 1280×600 | 8 | all, the last height with everything |
| 1280×599 | 52 | step 1: Projects 2 rows |
| 1280×560 | 30 | step 1 |
| 1280×520 | 7 | step 1 |
| 1280×519 | 27 | step 2: + Misc 3 tags on one line |
| 1280×500 | 15 | step 2 |
| 1280×470 | −6 → document scrolls 6 px | step 2 + scroll fallback |

**Final rule:**
- At ≥ 720 px wide and ≥ 600 px tall, everything shows.
- Below 600 px tall, Projects shows its first 2 rows (parsanaji.com, SolScope).
- Below 520 px tall, Misc also shows its first 3 tags (Agentic Workflows, Multi-Agent Orchestration, Prompt & Context Engineering), which is exactly one line at 572 px.
- Below about 476 px tall, the page scrolls. `html` and `body` never get `overflow: hidden`.

The CSS is in §2 under "short desktop windows". This also covers zoom: 150 % on a 1280×720 screen is 853×480 CSS px, which lands at step 2 and still fits.

### 3.3 Phone and tablet behaviour

- **Phones (< 720 px):**
  - Phone type scale: name `clamp(38px, 12vw, 60px)` and body `clamp(13.5px, 3.6vw, 15.5px)`.
  - Status moves under the tagline.
  - The rail's bottom padding is band + fade + 24 px, so the footer can always rest fully above the band.
  - The toggle is absolute top-right (44×44) and scrolls away with the page.
  - Link hit areas measured 61×47 px.
- **Below 520 px:** the value cells stack. Projects take the full width, because they have no date column.
- **Tablet 768×1024:** the rail fits (281 px spare), so the stylesheet follows R10 and uses the rail. Consequences:
  - The name is at its 40 px floor.
  - The field shows only as a 165 px strip at the right (the scrim clears at x = 763 of 768).
  - With the band layout instead (decision D1), the name is 60 px, the field band is fully visible, and the page scrolls 97 px (doc 1121/1024).
  - To switch, change the phone query to `@media (max-width: 719.98px), (orientation: portrait) and (max-width: 1199.98px)`. Every other rule already works there; it was tested as `layout.band.css`.

## 4. Accessibility

- **Landmarks and headings:**
  - Landmarks: `main` (the rail) and `nav "Contact"`.
  - Headings: `h1` "Parsa Naji", then `h2` Experience / Projects / Education / Misc (each section is `aria-labelledby` its h2, so they appear as named regions), and `h2` "Shortcuts" inside the dialog.
  - The canvas and scrim are `aria-hidden="true"`.
  - Lists carry `role="list"`, because Safari/VoiceOver drops list semantics when `list-style: none`.
  - Open-ended dates read "2025 to present" (the em dash is `aria-hidden`, plus an sr-only phrase).
  - Row separators (`·`) and bracket glyphs use CSS generated content with empty alt text (`content: "·" / ""`), so screen readers skip them. Older engines fall back to the plain `content` value.
- **Uppercase is presentational.** The DOM text stays title or sentence case; `text-transform` does the visual casing. Chrome's accessibility tree exposes "EXPERIENCE" and the other eyebrows in caps (verified in the snapshot), which is normal for Chrome.
- **Focus order (verified with Tab):** github → linkedin (when set) → say hi → theme toggle.
  - The h1 is not focusable; the scramble is a mouse-only egg, and keyboard users lose nothing.
  - In the dialog, focus lands on "close"; Esc closes it and focus returns to the opener (verified: returned to github).
- **Link names:**
  - "github" (`rel="me"`), "linkedin" (`rel="me"`, rendered only when the URL exists), and "say hi" (`mailto:` fallback).
  - say hi also gets the description "Copies info@parsanaji.com to the clipboard.", added by script once copy is wired. The hint node is `hidden`, so it is not read twice (verified in the snapshot: only as the description).
  - The visible label always equals the name, which satisfies WCAG 2.5.3. During the 1.2 s copied state, the name becomes "copied".
- **Focus-visible style:**
  - Links: brackets plus a 1 px `--focus-ring` underline, two non-colour cues.
  - Toggle: a 2 px `--focus-ring` outline with 3 px offset.
  - Forced colours: links get a `LinkText` outline.
- **Theme toggle:**
  - `<button type="button" aria-label="Dark theme" aria-pressed="true|false">`. The name stays constant and the state is carried by `aria-pressed` (true = dark is in effect).
  - It is `hidden` until JS runs.
  - Hit target: 40 px on desktop, 44 px on phone.
  - Recommendation for Agent A: when a toggle lands on the OS preference, remove `pn.theme` (back to "system"). That gives users a way back without a third state.
- **`?` overlay:**
  - It is a native modal `<dialog>`, so no focus trap code is needed: `showModal()` makes the page inert and handles Esc and focus return.
  - `?` toggles it. Match on `e.key === '?'`, so non-US layouts work, and ignore Ctrl, Meta and Alt (not Shift, which `?` needs).
  - The `g`, `l` and `e` shortcuts follow the same modifier rule and are ignored while the dialog is open.
- **"copied":** the visual label swaps for 1.2 s, and the polite `role="status"` region announces "Email address copied." The region is present and empty from load.
- **Status is colour-independent:** the dot is `aria-hidden`, and the text "Building something new" carries the meaning.
- **No skip link, because nothing needs bypassing:**
  - It is a single page with no repeated navigation before the content.
  - The first Tab stop is already the first content link.
  - The content is one screen on desktop.
  - The `main` and `nav` landmarks give screen-reader users direct jumps, which satisfies WCAG 2.4.1.
- **Reduced motion:** no dot pulse, no transitions, no entry (`data-entry` never set), dialog without fade. The static field is Agent A's.
- **Zoom and reflow:**
  - At 200 % zoom a 1280-wide screen becomes 640 CSS px, which gets the phone layout (reflows, scrolls).
  - At 150 % the collapse steps apply.
  - Nothing is ever clipped.
- **Target size:** desktop links are 47×27 px with 4ch spacing (passes WCAG 2.5.8). Phone links are 61×47 px.

## 5. SEO head block

`theme-color` values come from Agent B (5.3). The favicon SVG is B's PN monogram, which carries its own `prefers-color-scheme` style (not affected by the page CSP). The PNGs are dark-variant fallbacks.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Parsa Naji</title>
  <meta name="description" content="I build AI agents, apps, and the systems behind them.">
  <meta name="author" content="Parsa Naji">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f2f6fe" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#050a22" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="https://parsanaji.com/">

  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Parsa Naji">
  <meta property="og:title" content="Parsa Naji">
  <meta property="og:description" content="I build AI agents, apps, and the systems behind them.">
  <meta property="og:url" content="https://parsanaji.com/">
  <meta property="og:image" content="https://parsanaji.com/og.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Parsa Naji">
  <meta name="twitter:description" content="I build AI agents, apps, and the systems behind them.">
  <meta name="twitter:image" content="https://parsanaji.com/og.png">
  <meta name="twitter:image:alt" content="Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.">

  <link rel="preload" href="/fonts/JetBrainsMono-Regular.subset.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/JetBrainsMono-Bold.subset.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/src/styles.css">

  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Person","name":"Parsa Naji","url":"https://parsanaji.com/","jobTitle":["Software Developer","AI Specialist / Developer"],"email":"info@parsanaji.com","sameAs":["https://github.com/parsanaji"]}
  </script>
</head>
```

Notes:
- **Favicon order.** The PNG links come first and the SVG last, so SVG-capable browsers (Chrome, Firefox, Edge) use the SVG, and Safari uses the PNG or the 180×180 apple-touch-icon.
- **Assets to create** (the OG/build script or a one-off): `/favicon-32.png`, `/favicon-192.png`, `/apple-touch-icon.png` (180×180, flattened dark variant per B 5.1), and `/og.png` (1200×630).
- **`theme-color` and the toggle.** The two metas follow the OS, not the toggle. Per B 5.3, the theme module rewrites both `content` values from `--theme-color` when the toggle forces a look.
- **JSON-LD under the CSP.** It is a data block, not script, so `script-src` does not apply (old spec 7.3).
- **Agent A's bootstrap.** If Agent A adds a render-blocking external bootstrap script (for `data-theme` / `data-entry` before first paint), it goes right after the stylesheet. That is CSP-safe as `'self'`.
- **LinkedIn in `sameAs`.** Add the LinkedIn URL to `sameAs` when it exists.
- **Not needed:** `robots.txt` stays as is, and there is no sitemap (single page).

## 6. Decisions for the controller

- **D1. Portrait tablets.**
  - R10, followed by the stylesheet: the rail at 768×1024, because it fits. The name is at its 40 px floor and the field is a 165 px strip.
  - Recommended: the band layout for `(orientation: portrait) and (max-width: 1199.98px)`. The name is 60 px and the field is fully visible, at the cost of a 97 px scroll at 768×1024. It is a one-line media-query change, already tested.
  - Screenshots: `final-768x1024-rail.png` versus `v3-768x1024-band-variant.png`.
- **D2. Email in JSON-LD.** The task asks for it, but the old spec §5 says "No email in structured data". The address is already in the page's `mailto:`, so the extra exposure is small. I included it; delete the `email` key to keep the old rule.
- **D3. Stale project string.** "This site. GPU particle field in Three.js." is now false under R5, because Three.js is retired. Ask Parsa for a replacement, for example "This site. A WebGL dither field."
  - The replacement must be ≤ 41 characters to stay on one line at 390/430.
  - Desktop fits either way.
- **D4. `jobTitle`.** I used both current roles as an array, `["Software Developer", "AI Specialist / Developer"]`. Alternatively use one string.
- **D5. Entry versus LCP (for Agent A).** The rail text is the LCP candidate (canvas pixels are not), and under the entry it first paints at about 2.1 s, which is over R14's 1.5 s. The CSS hooks work with any fix Agent A picks, and Agent A was already probing this.
- **D6. Projects first column.** I kept the Blueprint look on desktop: project rows sit in the value column, aligned under the roles, with the date column left empty. If a project later gets a URL, its host can fill that column. On phones below 520 px, projects take the full width.

## 7. Artifacts (prototype, not in the repo)

Folder: `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\`

Prototype files:
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\index.html` — the prototype, with the §1 markup and the real strings.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\layout.css` — the §2 stylesheet, the source of truth.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\layout.proto.css` — the same without `@font-face`, rebuilt by `regen.sh`.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\proto-tokens.css` — the dark placeholder tokens from B and the controller.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\proto.js` — the placeholder field, the minimal wiring, and the measurement helpers `window.__m()` and `window.__scrim()`.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\index-band.html` with `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\layout.band.css` — the D1 portrait-tablet variant.

Screenshots (Chrome DevTools MCP):

Required viewports:
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-1280x720.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-1366x768.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-1440x900.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-1920x1080.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-2560x1440.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-768x1024-rail.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-430x932-top.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-430x932-end.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-390x844-top.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-390x844-end.png`

Collapse and tablet variant:
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\final-1280x519-collapsed.png` — collapse steps 1 and 2.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\v3-768x1024-band-variant.png` — D1.

Interaction states:
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\state-hover-github-1280x720.png`
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\state-focus-github-copied-sayhi-1280x720.png` — keyboard focus `[ github ]` with underline, and say hi in the copied state.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-c\state-keys-overlay-1280x720.png` — the `?` dialog open via the keyboard.

The `v1-*` and `v2-*` files are earlier iterations (an older scale and colours), kept only for history. The DevTools page I opened was closed.
