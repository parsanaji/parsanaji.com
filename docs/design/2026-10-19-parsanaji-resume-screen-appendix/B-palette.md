# Palette report — Dither Blue, dark and daylight (Agent B, 2026-10-19)

Scope: colour tokens for both looks, measured contrast, rationale, two alternative light variants, favicon / OG / theme-color colours, and a swatch sheet. Binding rules: design brief R2, R3, R4, R7, R11. Every number below was computed by `palette.mjs` / `extras.mjs` in the scratch dir (section 8). Nothing in `src/` was touched.

## 0. Verdict

- Dark = Dither Blue exactly as in the reference card (`#050a22`, `#e8eeff`, `#3b5df0`, `#8db0ff`). The card used `#3b5df0` for its small secondary text and status label, which measures 3.62–3.74:1 and fails AA. The fix splits it into two text-safe blues: `--fg-2 #7993da` (6.52:1) and `--accent-2 #5b81ff` (5.62:1). The field keeps `#3b5df0`.
- Light = "Dither Blue in daylight": paper `#f2f6fe`, navy ink `#071348`, and the same three field blues re-dealt as ink on paper. The light ordinary pixel is the dark mode's highlight `#8db0ff`, the bright cell is the brand pixel blue `#3b5df0`, and the core is a deep ink `#0832b8`. The tier-to-tier contrast steps match exactly across modes (2.44 and 1.85/1.86). The two darkest light inks come straight from the reference site's Dither panel: `#071348` matches its ground colour and `#0832b8` is its deep pixel (section 7).
- Every requirement in the contract passes in both modes, including the stress cases (a bright cell directly under text at the scrim's mid stop).
- Lowest text ratio among the contract checks (`--fg`, `--fg-2`, `--accent`, `--accent-2`):
  - dark: 4.72:1 (`--fg-2` over a solid field-3 cell at the mid stop, stress case);
  - light: 4.86:1 (`--accent-2` over a solid field-1 pixel at the mid stop).
- On plain `--bg`, the lowest text ratios are 5.62 (dark) and 5.31 (light).
- One exception: `--accent-2` drops to 4.06–4.51 if a bright cell sits under it at the mid stop. Section 2.3 explains why that is a placement rule (keep the status line and the links in the solid scrim zone), not a colour fix.
- One geometry rule makes this hold, and Agent C has to keep it: **every text pixel sits where the scrim alpha is at least 0.86**. In practice the scrim's mid stop must sit at or to the right of the rail's text edge (section 1.2).

## 1. Tokens (paste-ready)

### 1.1 CSS

Dark is the base, so no-JS on a dark OS and the default are both dark. Light applies when the OS prefers light (unless the user forced dark), or when `data-theme="light"` is set. This matches R7: system default, toggle stored in `localStorage pn.theme`, and Agent A owns the bootstrap that sets `data-theme` before first paint.

```css
/* Dither Blue tokens — Agent B, 2026-10-19 (reports/palette.md). Hex = sRGB. */
:root {
  color-scheme: dark;
  --bg: #050a22;
  --scrim-solid: rgb(5 10 34 / 1);
  --scrim-mid: rgb(5 10 34 / 0.86);
  --scrim-clear: rgb(5 10 34 / 0);
  --bg-scrim: linear-gradient(90deg, var(--scrim-solid) 0%, var(--scrim-solid) 46%, var(--scrim-mid) 73%, var(--scrim-clear) 100%);
  --fg: #e8eeff;
  --fg-2: #7993da;
  --accent: #8db0ff;
  --accent-2: #5b81ff;
  --accent-glow: rgb(141 176 255 / 0.35);
  --line: rgb(232 238 255 / 0.14);
  --field-0: #050a22;
  --field-1: #3b5df0;
  --field-2: #8db0ff;
  --field-3: #e8eeff;
  --focus-ring: var(--accent);
  --status-dot: var(--accent);
  --selection-bg: #3b5df0;
  --selection-fg: #ffffff;
  --overlay-bg: rgb(5 10 34 / 0.94);
  --overlay-border: rgb(232 238 255 / 0.18);
  --copied: #7fd3fe;
  --theme-color: #050a22;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --bg: #f2f6fe;
    --scrim-solid: rgb(242 246 254 / 1);
    --scrim-mid: rgb(242 246 254 / 0.86);
    --scrim-clear: rgb(242 246 254 / 0);
    --fg: #071348;
    --fg-2: #445789;
    --accent: #2848d7;
    --accent-2: #3656e8;
    --accent-glow: rgb(40 72 215 / 0.25);
    --line: rgb(7 19 72 / 0.14);
    --field-0: #f2f6fe;
    --field-1: #8db0ff;
    --field-2: #3b5df0;
    --field-3: #0832b8;
    --selection-bg: #3b5df0;
    --selection-fg: #ffffff;
    --overlay-bg: rgb(242 246 254 / 0.95);
    --overlay-border: rgb(7 19 72 / 0.18);
    --copied: #046392;
    --theme-color: #f2f6fe;
  }
}
:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f2f6fe;
  --scrim-solid: rgb(242 246 254 / 1);
  --scrim-mid: rgb(242 246 254 / 0.86);
  --scrim-clear: rgb(242 246 254 / 0);
  --fg: #071348;
  --fg-2: #445789;
  --accent: #2848d7;
  --accent-2: #3656e8;
  --accent-glow: rgb(40 72 215 / 0.25);
  --line: rgb(7 19 72 / 0.14);
  --field-0: #f2f6fe;
  --field-1: #8db0ff;
  --field-2: #3b5df0;
  --field-3: #0832b8;
  --selection-bg: #3b5df0;
  --selection-fg: #ffffff;
  --overlay-bg: rgb(242 246 254 / 0.95);
  --overlay-border: rgb(7 19 72 / 0.18);
  --copied: #046392;
  --theme-color: #f2f6fe;
}
::selection { background: var(--selection-bg); color: var(--selection-fg); }
```

Notes:
- The light block appears twice on purpose: once under the media query, once for the forced toggle. CSS cannot merge a media rule with a plain selector, and the duplicate costs about 0.6 KB before gzip.
- `--bg-scrim` is declared once and uses `var()`. It resolves on `:root`, where the light block also overrides `--scrim-*`, so it picks up the right colours in both looks. Do not set `data-theme` on a descendant, or the gradient will not recompute there.
- `--accent-glow`, `--line`, `--overlay-border` and `--theme-color` go beyond the contract. The Blueprint mock already used glow and line (`--s-accent-glow`, `--s-line`), and `--theme-color` lets the bootstrap script read the meta value from CSS instead of hard-coding it.
- `<meta name="color-scheme" content="light dark">` replaces today's `content="dark"` in `index.html`, so the UA canvas, scrollbars and form controls match before the CSS loads.

### 1.2 Usage map and the scrim contract

| element | token |
|---|---|
| page background, canvas clear colour, OG background | `--bg` (= `--field-0`) |
| name, role titles (bold part of rows), overlay text | `--fg` |
| tagline, eyebrows, dates (`.when`), org / project descriptions, misc tags, footer location + clock, overlay key descriptions | `--fg-2` |
| links (`github`, `linkedin`, `say hi`), overlay key glyphs | `--accent` |
| hover / focus brackets `[ ]`, status label "Building something new" | `--accent-2` |
| focus-visible outline (2 px solid, 3 px offset) | `--focus-ring` |
| status dot and its pulse halo | `--status-dot`, `--accent-glow` |
| "copied" text and its brackets | `--copied` |
| eyebrow rules, row separators | `--line` |
| `?` shortcuts overlay | `--overlay-bg` + 1 px `--overlay-border` |
| field tiers (GL uniforms) | `--field-0..3` (section 6.3) |

Scrim contract (for Agent C):
- `--bg-scrim` uses the Blueprint geometry: the scrim box is about 54 % of the viewport width, solid to 46 %, and fades to 0 at 100 %. I added a mid stop at 73 % with alpha 0.86.
- In the Blueprint geometry, 73 % of 54 vw is about 39.4 vw, which is the rail's text edge (4 vw + 36 vw).
- If Agent C changes the rail width, keep that relation: the mid stop must sit at or to the right of the right edge of the widest text row.
- Measured alpha floors (tables in 2.3) show why 0.86:
  - Dark needs 0.85 for `--fg-2` over a solid field-3 cell.
  - Light needs 0.805 for `--accent` over a solid field-3 cell.
  - With the plain Blueprint gradient, text at the rail edge sits on alpha 0.5. That still passes over the 50/50 field-1 mix (rows "Blueprint scrim edge") but fails over bright cells.
- Phone band (R10): the content's bottom padding must be at least the band height, so resting text never sits over the band. The band's own scrim runs top to bottom: `linear-gradient(180deg, var(--scrim-solid) 0%, var(--scrim-mid) 30%, var(--scrim-clear) 100%)`.

## 2. Contrast tables

Method:
- WCAG 2.x relative luminance with sRGB linearisation (threshold 0.04045; the WCAG text's 0.03928 does not change any ratio here at two decimals).
- Scrim composites use source-over in gamma-encoded sRGB, which is how browsers blend CSS colours.
- Each "scrim mid" row is computed three ways:
  - **A**: the brief's method, an sRGB 50/50 mix of field-0 and field-1, then the scrim composited over it.
  - **B**: dither-accurate. Composite the scrim over each pixel colour, then average the two in linear light.
  - **Solid field-1 pixel**: a glyph stroke lying entirely on one on-pixel. Cells are about 4 px at 1280 wide and strokes about 1.5 px, so this case is realistic.
- The A rows are the brief's literal check. The binding check is the lower of the three.
- APCA Lc (0.0.98G-4g) is listed only as a perceptual cross-check. WCAG 2.x is binding.

### 2.1 Dither Blue (dark)

| token | hex | oklch | rel. luminance |
|---|---|---|---|
| bg / field-0 | `#050a22` | oklch(15.7% 0.051 269) | 0.0036 |
| fg / field-3 | `#e8eeff` | oklch(95.0% 0.024 270) | 0.8552 |
| fg-2 | `#7993da` | oklch(67.3% 0.110 268) | 0.2999 |
| accent / field-2 | `#8db0ff` | oklch(76.3% 0.120 265) | 0.4393 |
| accent-2 | `#5b81ff` | oklch(64.1% 0.192 268) | 0.2514 |
| field-1 / selection-bg | `#3b5df0` | oklch(54.7% 0.223 268) | 0.1505 |
| copied | `#7fd3fe` | oklch(82.9% 0.102 232) | 0.5826 |

| pair | WCAG ratio | requirement | result | APCA Lc |
|---|---|---|---|---|
| fg on bg | 16.87 | >= 7 | pass | -96.5 |
| fg-2 on bg | 6.52 | >= 4.5 | pass | -44.9 |
| accent on bg (links, dot) | 9.12 | >= 4.5 | pass | -59.9 |
| accent-2 on bg (status label) | 5.62 | >= 4.5 | pass | -39.3 |
| copied on bg | 11.79 | >= 4.5 | pass | -73.6 |
| fg on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 16.05 | >= 7 | pass | -96.0 |
| fg on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 15.93 | >= 7 | pass |  |
| fg on scrim mid (a=0.86) over a solid field-1 pixel | 15.09 | >= 7 | pass | -95.3 |
| fg-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 6.21 | >= 4.5 | pass | -44.4 |
| fg-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 6.16 | >= 4.5 | pass |  |
| fg-2 on scrim mid (a=0.86) over a solid field-1 pixel | 5.83 | >= 4.5 | pass | -43.7 |
| accent on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 8.68 | >= 4.5 | pass | -59.4 |
| accent on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 8.61 | >= 4.5 | pass |  |
| accent on scrim mid (a=0.86) over a solid field-1 pixel | 8.16 | >= 4.5 | pass | -58.7 |
| accent-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 5.35 | >= 4.5 | pass | -38.9 |
| accent-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 5.31 | >= 4.5 | pass |  |
| accent-2 on scrim mid (a=0.86) over a solid field-1 pixel | 5.03 | >= 4.5 | pass | -38.2 |
| fg on Blueprint scrim edge (a=0.50) over 50/50 [A] | 13.38 | >= 7 | pass |  |
| fg-2 on Blueprint scrim edge (a=0.50) over 50/50 [A] | 5.17 | >= 4.5 | pass |  |
| accent on Blueprint scrim edge (a=0.50) over 50/50 [A] | 7.23 | >= 4.5 | pass |  |
| field-1 on field-0 | 3.74 | 2–4 | pass | -26.1 |
| field-2 on field-0 | 9.12 | between tiers | pass | -59.9 |
| field-3 on field-0 | 16.87 | >= 7 | pass | -96.5 |
| field-2 vs field-1 (tier step) | 2.44 | >= 1.3 (distinct) | pass |  |
| field-3 vs field-2 (tier step) | 1.85 | >= 1.3 (distinct) | pass |  |
| focus ring (accent) on bg | 9.12 | >= 3 (WCAG 1.4.11) | pass |  |
| focus ring on scrim mid over solid field-1 | 8.16 | >= 3 (WCAG 1.4.11) | pass |  |
| selection-fg on selection-bg | 5.24 | >= 4.5 | pass | -80.7 |
| fg on overlay (a=0.94) over solid field-3 (worst) | 15.13 | >= 7 | pass |  |
| fg-2 on overlay (a=0.94) over solid field-3 (worst) | 5.85 | >= 4.5 | pass |  |
| accent on overlay (a=0.94) over solid field-3 (worst) | 8.18 | >= 4.5 | pass |  |
| fg-2 on overlay over solid field-1 | 6.26 | >= 4.5 | pass |  |

Stress (a bright cell directly under text at the mid stop):

| pair | ratio | requirement | result |
|---|---|---|---|
| fg on scrim mid (a=0.86) over solid field-2 | 13.56 | >= 7 | pass |
| fg-2 on scrim mid (a=0.86) over solid field-2 | 5.24 | >= 4.5 | pass |
| accent on scrim mid (a=0.86) over solid field-2 | 7.33 | >= 4.5 | pass |
| fg on scrim mid (a=0.86) over solid field-3 | 12.20 | >= 7 | pass |
| fg-2 on scrim mid (a=0.86) over solid field-3 | **4.72** | >= 4.5 | pass (lowest in dark) |
| accent on scrim mid (a=0.86) over solid field-3 | 6.59 | >= 4.5 | pass |

### 2.2 Dither Blue in daylight (recommended light)

| token | hex | oklch | rel. luminance |
|---|---|---|---|
| bg / field-0 | `#f2f6fe` | oklch(97.2% 0.012 265) | 0.9194 |
| fg | `#071348` | oklch(22.1% 0.100 267) | 0.0098 |
| fg-2 | `#445789` | oklch(46.4% 0.085 267) | 0.0985 |
| accent | `#2848d7` | oklch(48.0% 0.220 267) | 0.0999 |
| accent-2 | `#3656e8` | oklch(52.5% 0.222 268) | 0.1327 |
| field-1 | `#8db0ff` | oklch(76.3% 0.120 265) | 0.4393 |
| field-2 / selection-bg | `#3b5df0` | oklch(54.7% 0.223 268) | 0.1505 |
| field-3 | `#0832b8` | oklch(40.4% 0.212 264) | 0.0579 |
| copied | `#046392` | oklch(47.6% 0.107 240) | 0.1102 |

| pair | WCAG ratio | requirement | result | APCA Lc |
|---|---|---|---|---|
| fg on bg | 16.21 | >= 7 | pass | 98.5 |
| fg-2 on bg | 6.53 | >= 4.5 | pass | 78.9 |
| accent on bg (links, dot) | 6.47 | >= 4.5 | pass | 77.8 |
| accent-2 on bg (status label) | 5.31 | >= 4.5 | pass | 72.5 |
| copied on bg | 6.05 | >= 4.5 | pass | 76.4 |
| fg on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 15.52 | >= 7 | pass | 95.5 |
| fg on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 15.53 | >= 7 | pass |  |
| fg on scrim mid (a=0.86) over a solid field-1 pixel | 14.84 | >= 7 | pass | 92.6 |
| fg-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 6.25 | >= 4.5 | pass | 76.0 |
| fg-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 6.25 | >= 4.5 | pass |  |
| fg-2 on scrim mid (a=0.86) over a solid field-1 pixel | 5.98 | >= 4.5 | pass | 73.1 |
| accent on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 6.19 | >= 4.5 | pass | 74.9 |
| accent on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 6.19 | >= 4.5 | pass |  |
| accent on scrim mid (a=0.86) over a solid field-1 pixel | 5.92 | >= 4.5 | pass | 72.0 |
| accent-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [A: sRGB mix] | 5.08 | >= 4.5 | pass | 69.6 |
| accent-2 on scrim mid (a=0.86) over 50/50 field-0/field-1 [B: linear avg] | 5.08 | >= 4.5 | pass |  |
| accent-2 on scrim mid (a=0.86) over a solid field-1 pixel | **4.86** | >= 4.5 | pass (lowest in light) | 66.7 |
| fg on Blueprint scrim edge (a=0.50) over 50/50 [A] | 13.82 | >= 7 | pass |  |
| fg-2 on Blueprint scrim edge (a=0.50) over 50/50 [A] | 5.56 | >= 4.5 | pass |  |
| accent on Blueprint scrim edge (a=0.50) over 50/50 [A] | 5.51 | >= 4.5 | pass |  |
| field-1 on field-0 | 1.98 | 1.8–3.5 | pass | 36.5 |
| field-2 on field-0 | 4.84 | between tiers | pass | 69.8 |
| field-3 on field-0 | 8.98 | >= 7 | pass | 85.7 |
| field-2 vs field-1 (tier step) | 2.44 | >= 1.3 (distinct) | pass |  |
| field-3 vs field-2 (tier step) | 1.86 | >= 1.3 (distinct) | pass |  |
| focus ring (accent) on bg | 6.47 | >= 3 (WCAG 1.4.11) | pass |  |
| focus ring on scrim mid over solid field-1 | 5.92 | >= 3 (WCAG 1.4.11) | pass |  |
| selection-fg on selection-bg | 5.24 | >= 4.5 | pass | -80.7 |
| fg on overlay (a=0.95) over solid field-3 (worst) | 14.87 | >= 7 | pass |  |
| fg-2 on overlay (a=0.95) over solid field-3 (worst) | 5.99 | >= 4.5 | pass |  |
| accent on overlay (a=0.95) over solid field-3 (worst) | 5.93 | >= 4.5 | pass |  |
| fg-2 on overlay over solid field-1 | 6.33 | >= 4.5 | pass |  |

Stress (a bright cell directly under text at the mid stop):

| pair | ratio | requirement | result |
|---|---|---|---|
| fg on scrim mid (a=0.86) over solid field-2 | 13.43 | >= 7 | pass |
| fg-2 on scrim mid (a=0.86) over solid field-2 | 5.41 | >= 4.5 | pass |
| accent on scrim mid (a=0.86) over solid field-2 | 5.36 | >= 4.5 | pass |
| fg on scrim mid (a=0.86) over solid field-3 | 12.64 | >= 7 | pass |
| fg-2 on scrim mid (a=0.86) over solid field-3 | 5.09 | >= 4.5 | pass |
| accent on scrim mid (a=0.86) over solid field-3 | 5.04 | >= 4.5 | pass |

### 2.3 Scrim alpha floors (minimum alpha of `--bg` over the field for text to pass)

| mode | under the text | fg >= 7 | fg-2 >= 4.5 | accent >= 4.5 | accent-2 >= 4.5 |
|---|---|---|---|---|---|
| dark | 50/50 field-1 mix | 0.000 | 0.285 | 0.000 | 0.520 |
| dark | solid field-1 | 0.300 | 0.645 | 0.415 | 0.760 |
| dark | solid field-2 | 0.590 | 0.795 | 0.660 | 0.860 |
| dark | solid field-3 | 0.700 | **0.850** | 0.750 | 0.895 |
| light | 50/50 field-1 mix | 0.000 | 0.000 | 0.000 | 0.485 |
| light | solid field-1 | 0.000 | 0.435 | 0.450 | 0.745 |
| light | solid field-2 | 0.435 | 0.735 | 0.740 | 0.880 |
| light | solid field-3 | 0.575 | 0.800 | **0.805** | 0.910 |

The alpha 0.86 mid stop covers every `--fg`, `--fg-2` and `--accent` case in both modes. `--accent-2` (status label, brackets) needs 0.895 / 0.91 over a field-3 cell; at the 0.86 stop it measures 4.51 / 4.06 (dark, over field-2 / field-3) and 4.40 / 4.14 (light). These are the only sub-4.5 text numbers anywhere in this report. Both elements sit in the bottom-left of the rail where the scrim is solid (alpha 1), so this is a placement rule, not a colour problem: keep the status line and the links row left-aligned in the solid zone.

## 3. Rationale per token

Hue: every blue sits at OKLCH h ≈ 264–270. That is the hue of `#3b5df0` (268) and of every cluster in the reference site's Dither panel (263–267), so no token drifts toward violet or cyan, except `--copied`, which shifts on purpose.

Dark:
- `--bg #050a22`: the reference night, unchanged (R2). Near-black navy keeps the field's electric blue luminous.
- `--bg-scrim`: the night itself at 1 → 0.86 → 0. The 0.86 mid stop is the lowest alpha that keeps `--fg-2` at 4.5 over a white core (floor 0.85), so text stays readable even when a Shockwave ring passes behind it.
- `--fg #e8eeff`: the reference's white-blue (R2), 16.87:1. A pure white would break the cool cast.
- `--fg-2 #7993da`: the reference card used `#3b5df0` for secondary text at 3.74:1 (fails). This keeps the hue and lifts lightness to OKLCH 67 %, with chroma eased to 0.11 so long lines read as a calm periwinkle instead of a neon sign. 6.52:1.
- `--accent #8db0ff`: the reference highlight. It is the status-dot colour in the card, and at 9.12:1 it is a link colour that glows without competing with the white name.
- `--accent-2 #5b81ff`: the card's electric `#3b5df0` lifted along L at the same hue until it passes as small text over the scrim (5.62 on bg, 5.03 over a field-1 pixel). The status label keeps the card's "electric blue text, lighter blue dot" look.
- `--field-0 #050a22` = `--bg`: off cells are transparent and show the page background.
- `--field-1 #3b5df0`: the reference pixel blue, 3.74:1 — visible, inside 2–4, and it never shouts.
- `--field-2 #8db0ff`: the highlight, used on bright crests (9.12:1).
- `--field-3 #e8eeff`: equal to `--fg`, so the entry name formed by the field is exactly the text colour.
- `--selection-bg #3b5df0` with `--selection-fg #ffffff`: selecting text paints it in the brand pixel (5.24:1). The same pair is used in light.
- `--overlay-bg` (night at 0.94) and `--overlay-border` (fg at 18 %): enough to keep `--fg-2` at 5.85 over a white core behind the panel, while a faint shimmer of the field still shows through.
- `--copied #7fd3fe`: a sky shift (h 232) so "copied" reads as a state change, not as another link. It stays inside the blue family, with no green. 11.79:1.

Light — the inversion rule: the field reads as blue ink dithered on paper, so on-pixels get darker as v rises.
- `--bg #f2f6fe`: paper white with a faint blue cast (OKLCH 97.2 % L, chroma 0.012). It is visibly not pure white next to `#ffffff` UI, but it is not tinted enough to look like a coloured page. Its luminance (0.92) leaves headroom for the light pixels.
- `--bg-scrim`: paper at 1 → 0.86 → 0. Same 0.86 as dark, so Agent C has one geometry rule. Light floors are lower (0.805), so light has extra margin.
- `--fg #071348`: navy ink (OKLCH 22 %, chroma 0.10), 16.21:1. It mirrors the dark contrast (16.87). It is almost exactly the reference panel's ground colour `#041448`, so the text is literally "the night as ink".
- `--fg-2 #445789`: slate-navy (46 % L, chroma 0.085). It reads as the same ink thinned, and at 6.53:1 it mirrors dark's 6.52.
- `--accent #2848d7`: the electric blue deepened to 48 % L so it works as link text on paper, over the scrim and as a focus ring (6.47:1). It stays recognisably the same blue as `#3b5df0` (chroma 0.22).
- `--accent-2 #3656e8`: `#3b5df0` deepened by 2 L-points. It is visually the brand blue (1.10:1 against it) but passes as small text over a field-1 pixel at the mid stop (4.86).
- `--field-0 #f2f6fe` = `--bg`.
- `--field-1 #8db0ff`: the dark mode's highlight becomes the daylight ordinary pixel, a pale periwinkle "light ink" at 1.98:1. That is inside 1.8–3.5 and deliberately near the quiet end: dark ink pixels on paper weigh more than light pixels on navy, and APCA confirms it (light Lc 36.5 vs dark -26.1). If Parsa wants the light field a notch stronger, `#7da1fe` gives 2.31:1.
- `--field-2 #3b5df0`: the brand pixel blue, exact, on bright crests (4.84:1). The dark mode's ordinary pixel becomes the daylight bright cell, so the field-2 vs field-1 step is 2.44 in both modes.
- `--field-3 #0832b8`: the deepest ink, which is what "brightest" becomes in daylight. It is the reference panel's own deep-pixel cluster, sampled. 8.98:1 (≥ 7), and the 1.86 step mirrors dark's 1.85.
- `--selection-bg` / `--selection-fg`: same as dark (`#3b5df0` / `#ffffff`, 5.24).
- `--overlay-bg` (paper at 0.95): keeps `--fg-2` at 5.99 even over a deep-ink core.
- `--copied #046392`: the same sky shift as dark (h 240), deepened for paper (6.05:1). It reads petrol-blue.

## 4. Alternative light variants

Both keep the same token roles and the same tier logic. The full tables are generated in the scratch `tables.md`; the key rows follow.

### 4.1 Alt A — Frost (cooler, whiter)

Tokens: `--bg #f9fbff`, `--fg #02103a`, `--fg-2 #475b80`, `--accent #184ddd`, `--accent-2 #2959e8`, `--field-1 #8fb6fc`, `--field-2 #2f67f0`, `--field-3 #0c2db7`, `--selection #3b5df0/#fff`, `--copied #01658f`, scrim and overlay as recommended. Hues shift 3–5° toward cyan (262–265).

| pair | ratio | req | result |
|---|---|---|---|
| fg on bg | 17.82 | >= 7 | pass |
| fg-2 on bg | 6.59 | >= 4.5 | pass |
| accent on bg | 6.45 | >= 4.5 | pass |
| accent-2 on bg | 5.50 | >= 4.5 | pass |
| fg on scrim mid over 50/50 [A] | 17.05 | >= 7 | pass |
| fg-2 on scrim mid over 50/50 [A] | 6.31 | >= 4.5 | pass |
| accent on scrim mid over 50/50 [A] | 6.17 | >= 4.5 | pass |
| fg-2 / accent on scrim mid over solid field-1 | 6.04 / 5.90 | >= 4.5 | pass |
| accent-2 on scrim mid over solid field-1 | 5.03 | >= 4.5 | pass |
| field-1 on field-0 | 1.97 | 1.8–3.5 | pass |
| field-2 on field-0 | 4.69 | — | — |
| field-3 on field-0 | 9.77 | >= 7 | pass |
| tier steps (2 vs 1 / 3 vs 2) | 2.38 / 2.08 | >= 1.3 | pass |
| focus ring on bg | 6.45 | >= 3 | pass |
| stress: accent over solid field-3 at mid | 4.99 | >= 4.5 | pass |
| lowest text ratio | 4.99 | | |

Read: crisper and more "screen". At 98.8 % L the paper almost disappears into white UI, and the faint blue cast R3 asks for is barely perceptible on most displays.

### 4.2 Alt B — Cream (warmer, creamier; riso blue on paper)

Tokens: `--bg #f7f2e7`, `--fg #0a1645`, `--fg-2 #495579`, `--accent #2c46ce`, `--accent-2 #3656e2`, `--field-1 #8aaaf9`, `--field-2 #3656e2`, `--field-3 #1928a4`, `--selection #3656e2/#fff`, `--copied #01608e`, scrim and overlay as recommended.

| pair | ratio | req | result |
|---|---|---|---|
| fg on bg | 15.50 | >= 7 | pass |
| fg-2 on bg | 6.58 | >= 4.5 | pass |
| accent on bg | 6.54 | >= 4.5 | pass |
| accent-2 on bg | 5.25 | >= 4.5 | pass |
| fg on scrim mid over 50/50 [A] | 14.80 | >= 7 | pass |
| fg-2 on scrim mid over 50/50 [A] | 6.28 | >= 4.5 | pass |
| accent on scrim mid over 50/50 [A] | 6.25 | >= 4.5 | pass |
| fg-2 / accent on scrim mid over solid field-1 | 6.00 / 5.96 | >= 4.5 | pass |
| accent-2 on scrim mid over solid field-1 | 4.78 | >= 4.5 | pass |
| field-1 on field-0 | 2.04 | 1.8–3.5 | pass |
| field-2 on field-0 | 5.25 | — | — |
| field-3 on field-0 | 10.00 | >= 7 | pass |
| tier steps (2 vs 1 / 3 vs 2) | 2.56 / 1.91 | >= 1.3 | pass |
| focus ring on bg | 6.54 | >= 3 | pass |
| stress: accent over solid field-3 at mid | 5.06 | >= 4.5 | pass |
| lowest text ratio | 4.78 | | |

Read: the most "printed" of the three (riso blue on cream). It is warm and friendly, but the paper is warm (h 86), which contradicts R3's "faint blue cast", and it pairs less naturally with the cold dark look when the toggle crossfades.

### 4.3 Recommendation

Ship **Dither Blue in daylight** (section 2.2):
- It is the only variant that satisfies R3 word for word: paper with a faint blue cast, navy ink, the same electric family, inverted tiers.
- Its field reuses the dark look's exact pixel colours (`#8db0ff` and `#3b5df0`, swapped), so the toggle feels like the same object under a different light.
- Its tier contrast steps equal the dark look's.

Keep Frost as the fallback if Parsa says "whiter"; keep Cream only if he asks for warmth.

## 5. Favicon, OG image, theme-color

### 5.1 Favicon (PN monogram SVG) — retired 2026-10-21 by spec 4.10.7 (mono P and one dash); kept for the contrast numbers

The sample is a 16×16 pixel grid with crisp edges: P and N as 5×8 dither-pixel glyphs inside a tile with a 1 px electric edge. It lives in the scratch dir as `favicon-pn.svg`, with a preview at 16/32/64 px on four browser-chrome colours in `favicon-preview.png`. All variants were legible at 16 px. The SVG carries its own `prefers-color-scheme` media query, which follows the browser chrome, not the site toggle.

| scheme | edge | tile | glyph | glyph / tile | edge vs chrome | glyph vs chrome |
|---|---|---|---|---|---|---|
| light (default) | `#3b5df0` | `#f2f6fe` | `#071348` | 16.21 | 5.24 (#fff), 3.99 (#dee1e6), 4.61 (#f0f0f4) | 13.4–17.6 |
| dark | `#3b5df0` | `#050a22` | `#e8eeff` | 16.87 | 3.07 (#202124), 2.30 (#35363a), 1.91 (#42414d) | 8.6–14.7 |

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
<style>.edge{fill:#3b5df0}.tile{fill:#f2f6fe}.glyph{fill:#071348}@media (prefers-color-scheme:dark){.tile{fill:#050a22}.glyph{fill:#e8eeff}}</style>
<rect class="edge" width="16" height="16" rx="3"/><rect class="tile" x="1" y="1" width="14" height="14" rx="2"/>
<g class="glyph"><!-- P at x=2..6, N at x=9..13, rows y=4..11; full rects in the scratch favicon-pn.svg --></g>
</svg>
```

- The style inside the SVG is not affected by the page CSP: a favicon renders in image context.
- Alternative for light chrome: a solid `#2848d7` tile with paper glyphs (6.47 glyph/tile, about 7.0:1 against a white tab). It reads as a stronger brand chip, but it no longer mirrors the page.
- If an `apple-touch-icon.png` (180×180) is added, use the dark variant flattened (no transparency).

### 5.2 OG image (1200×630, dark look per R11)

| element | colour |
|---|---|
| background / canvas clear | `#050a22` |
| dither band pixels: field-1 / field-2 / field-3 | `#3b5df0` / `#8db0ff` / `#e8eeff` |
| scrim between band and text | `#050a22` at 1 → 0.86 → 0 (the `--bg-scrim` stops) |
| name "Parsa Naji" (JetBrains Mono 700) | `#e8eeff` (16.87:1) |
| tagline, domain `parsanaji.com` | `#7993da` (6.52:1) |
| status dot / halo | `#8db0ff` / `rgb(141 176 255 / 0.35)` |
| status label | `#5b81ff` (5.62:1) |
| hairline (optional) | `rgb(232 238 255 / 0.14)` |

- OG cards are often shown at 600×315 or smaller. Keep `#7993da` text at 32 px or more on the 1200 canvas, and the name at 96 px or more.
- With the Blueprint math the band contains no field-3 pixels unless a Shockwave ring or mask is drawn (section 6.1). To get the white-blue sparkle into the OG, render one static ring at age about 0.6 s, as the swatch does with `ring=2`.

### 5.3 theme-color and color-scheme

```html
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f2f6fe" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#050a22" media="(prefers-color-scheme: dark)">
```

When the toggle forces a look, the media-tagged metas do not follow it. The theme module should set both metas' `content` to `getComputedStyle(document.documentElement).getPropertyValue('--theme-color')` after it sets `data-theme`, and restore the two values when the user returns to "system". This is a DOM update from the module script and needs no inline script, so it stays inside the CSP.

## 6. Notes for Agent A (engine) and Agent C (layout)

### 6.1 Tier reachability in the Blueprint math

This matters for colour.
- The dither branch's curve `v*.7 + .4*(1-|1-2v|)*v` peaks at **v ≈ 0.703** (at raw v = 0.9375).
- From the surface alone, therefore, field-2 (v > .66) appears only on the brightest crests: 1.7–16.8 % of cells across t = 0…120 in the swatch's 1280×720 frames. Field-3 (v > .9) never appears from the surface.
- Pointer repel adds at most 0.12 (max about 0.82, still not field-3).
- Field-3 comes only from:
  - the Shockwave ring (+0.9·g; 8.7–11.3 % of cells with one ring in frame),
  - the name mask (entry, Konami "nice."),
  - burst, which is not used.
- So `--field-3` is effectively the colour of the formed name and of click rings: `#e8eeff` in dark and deep ink `#0832b8` in light.
- Measured coverage at t = 20: off 49–56 %, field-1 26–30 %, field-2 14–15 %, field-3 0 % (8.7 % with a ring).

### 6.2 Entry overlap

- The rail fades in from 2.1 s while the name mask dissolves (1.9–2.7 s). Glyph cells stay at field-3 while mask mix > about 0.85, so for about 0.2 s rail text at low opacity can overlap white (dark) or ink (light) name pixels.
- This is transient and acceptable. If it bothers the reviewer, start the rail fade once mix < 0.5.

### 6.3 GLSL colour uniforms

These are sRGB-encoded values, written straight to the default (sRGB) drawing buffer:

```glsl
// dark
uBg = vec3(0.0196, 0.0392, 0.1333);  // #050a22
uF1 = vec3(0.2314, 0.3647, 0.9412);  // #3b5df0
uF2 = vec3(0.5529, 0.6902, 1.0000);  // #8db0ff
uF3 = vec3(0.9098, 0.9333, 1.0000);  // #e8eeff
// light
uBg = vec3(0.9490, 0.9647, 0.9961);  // #f2f6fe
uF1 = vec3(0.5529, 0.6902, 1.0000);  // #8db0ff
uF2 = vec3(0.2314, 0.3647, 0.9412);  // #3b5df0
uF3 = vec3(0.0314, 0.1961, 0.7216);  // #0832b8
```

### 6.4 The 300 ms crossfade

- CSS transitions between hex colours interpolate in sRGB (CSS Color 4 uses sRGB for legacy colour syntax). Lerp the uniforms linearly in these sRGB-encoded values too, so off cells (transparent, showing the CSS background) and on cells move in step.
- To transition the custom properties themselves, register them with `@property --bg { syntax: '<color>'; inherits: true; initial-value: #050a22; }` (and likewise for the others). Without registration, transition the consuming properties (`background-color`, `color`, `border-color`, `outline-color`) instead.

### 6.5 Optional extras (not required to pass)

- `@media (prefers-contrast: more) { :root { --fg-2: var(--fg); --scrim-mid: var(--scrim-solid); } }`.
- Under `forced-colors: active`, hide the canvas (`display: none`), so system colours never fight the field.

## 7. Check against the reference images

- **Card (`images/3.png`)**, sampled with sharp:
  - The swatch strip reads exactly `#050a22` / `#e8eeff` / `#3b5df0` / `#8db0ff`.
  - Status text is `#3a5bec` (3.62:1 against the card's `#050a22`, fails AA), the status dot is `#8db0ff` (9.12:1), the dot rows `#4563d4`, and the links `#e0e6f7` (fg).
  - Our dark look keeps the four colours and the roles: dot = highlight, pixels = pixel blue, name and links = white-blue in the card. Only the two small-text uses of `#3b5df0` change, to text-safe siblings.
- **Reference site Dither panel (`images/1.png`, `2.png` left third)**, 4-bit colour clusters:
  - Ground `#051446` / `#071439` (OKLCH 21–22 %, h 265); darkest 10 % `#00031d`.
  - Deep pixels `#0832b8` / `#072db4` (40 %, h 264); bright pixels `#366af7` / `#2b69fa` (57 %, h 263–265); brightest 1 % `#5287fd`.
  - Our `#3b5df0` sits 1.14:1 from the panel's bright pixel, essentially the same colour.
  - The daylight look's two darkest inks are the panel's own blues: `--fg #071348` vs ground `#041448` (OKLCH 22.1 % / 0.100 / 267 vs 22.2 % / 0.099 / 265), and `--field-3 #0832b8` = the deep-pixel cluster.
  - The reference panel's ground is bluer than R2's `#050a22`. R2 is binding, so I kept it.
- The Noise (green) and ASCII (red) panels were checked only for structure: tier logic of muted body, bright accent and white core. Their hues are not used.

## 8. Artifacts and how to reproduce

Scratch dir: `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\`. Every path below is absolute.

Scripts and generated data:
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\color.mjs` — WCAG, OKLCH and compositing helpers.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\palette.mjs` — token sets, the contrast tables (`tables.md`), `results.json`, `tokens.css` and `tokens.js`. Run with `node palette.mjs`.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\extras.mjs` — favicon-versus-chrome contrasts, GLSL vec3 values and the reference cross-check. Run with `node extras.mjs`.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\sample-ref.mjs` — samples the reference PNGs (uses the repo's `sharp`, read-only). Run with `node sample-ref.mjs <imagesDir>`.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\favicon.mjs` — writes `favicon-pn.svg` and `favicon-preview.png`.

**Swatch sheet:** `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\swatch.html`
- With no query string it shows all four looks as 1280×720 mocks at 50 %, with chips and key ratios.
- `?look=dark|light|lightCool|lightWarm` shows one look full-viewport.
- `&ring=1` puts a Shockwave ring under the rail (stress); `&ring=2` puts one in the open field.
- `&t=<sec>` freezes another time.
- The field is the Blueprint dither math ported verbatim (fbm domain warp, Bayer 8×8, the same thresholds), drawn with nearest-neighbour upscaling.
- The mock shows hover brackets on github, the focus ring on linkedin, the "copied" state on say hi, a selection on the tagline, the status line, the footer, the `?` overlay and the toggle.
- It loads JetBrains Mono from Google Fonts (scratch page only).

Screenshots (Chrome DevTools MCP, 1280×720 unless noted):
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\swatch-dark.png` — dark, ring in the open field.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\swatch-light.png` — daylight, ring in the open field.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\swatch-dark-stress.png` — dark, ring under the rail. A white haze behind "Example Co," / "Graphics"; text stays readable.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\swatch-light-stress.png` — daylight, ring under the rail. A soft lavender haze; noticeably gentler than dark.
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\swatch-sheet.png` — all four looks (1440 wide, full page).
- `C:\Users\parsa\AppData\Local\Temp\claude\C--Users-parsa\2ea92650-1b95-4b12-8441-ce8e7adaf7c7\scratchpad\agent-b\favicon-preview.png` — the favicon at 16/32/64 px on four chrome colours.

## 9. Decisions for the controller

1. **Link colour.** The contract puts links in `--accent` (dark `#8db0ff`, light `#2848d7`); that is what the tokens and the swatch do. The reference card shows links in `--fg` (white-blue), with brackets on hover only. Both pass (fg 16.87 / 16.21). Pick one. Mine is `--accent`: it gives the page its one colour moment and lets the white name stand alone.
2. **Scrim geometry.** Agent C must keep every text pixel at scrim alpha ≥ 0.86, meaning the mid stop sits at or to the right of the rail's text edge. If C's layout cannot, either raise the mid alpha (the dark floor over field-3 is 0.85; going to 0.9 costs only field visibility near the rail), or have Agent A damp v and the ripple gain under the rail.
3. **Light field-3.** I recommend deep ink `#0832b8`, sampled from the reference. The alternative is `--fg #071348`, which makes the light entry name exactly the text colour (16.21:1), but it looks near-black rather than blue.
4. **`--copied`.** The default is a sky / petrol shift (`#7fd3fe` / `#046392`). If Parsa wants strictly one hue, set `--copied: var(--accent)`; contrast is unchanged.
5. **Favicon in light chrome.** The default mirrors the page (paper tile, electric edge, navy glyph). The alternative is a solid `#2848d7` tile with paper glyph, for a louder tab.
