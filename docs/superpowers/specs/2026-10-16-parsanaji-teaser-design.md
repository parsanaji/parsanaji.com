# parsanaji.com — Teaser ("Scene 1") Design

**Date:** 2026-10-16
**Status:** Design approved in conversation (chunks 1 and 2). Written spec pending Parsa's review.
**Owner:** Parsa Naji
**Live target:** https://parsanaji.com (domain registered at Cloudflare 2026-10-15, nothing deployed yet)

---

## 1. Purpose and context

### 1.1 The future site (not built now, but it shapes every decision here)

The eventual parsanaji.com is a particle-driven personal site and living resume:

- The visitor lands on Parsa's name rendered in thousands of tiny white dots that vibrate in place yet read perfectly.
- As the visitor scrolls, the dots scramble, travel, and re-form into new legible text (an "about me"), possibly a portrait of Parsa, and abstract shapes that orbit and accentuate the resume content without covering it.
- The resume section lists every project, app, experiment, skill, hobby, interest, major, and academic detail an employer or curious person would want.

### 1.2 The teaser (this spec)

Until the full site exists, anyone who looks Parsa up must not meet a "site not found" page. The teaser is a single, non-scrolling screen that:

1. Renders `PARSA NAJI` in vibrating white particles, dead center.
2. Reacts to the pointer (dots flee the cursor and settle back).
3. On click or tap, scrambles and re-forms into `soon.`, then returns to the name. This is a literal preview of the future scroll-morph mechanic.
4. Offers a quiet exit line (GitHub, LinkedIn, email) so an employer is never stranded.
5. Is built as **scene 1 of the future site**: the same engine and the same files, extended later rather than rewritten.

### 1.3 Success criteria

- A stranger who types parsanaji.com sees something intentional, legible, and alive within 1.5 seconds on a phone or laptop.
- The page reads as premium: restrained, monochrome, typographic, physically plausible motion, zero jank.
- Every quality gate in section 6 passes (Lighthouse >= 95 in all four categories, 60 fps desktop, >= 30 fps mid-range phone, zero console errors).
- The code is reusable as the foundation of the full site: adding a new morph target is a one-line call.

### 1.4 Behavioral design notes (ux-psychology lens)

The page has two decision moments: stay vs. bounce in the first two seconds, and whether to click an exit.

- **Reciprocity:** the delightful interaction arrives before any text or ask. Nothing is gated.
- **Smart defaults / decision fatigue:** at most three exits, no buttons, no form, no choices.
- **Labels name the payoff:** `github`, `linkedin`, `say hi` rather than generic icons.
- **Honesty:** the hint is `soon.` and `building something new`. No countdown, no fake urgency, no manufactured scarcity.

---

## 2. Scope

### 2.1 In scope

- One route: `/`. No scrolling, no navigation, no second page.
- Particle engine (sampler, GPU field, morph state machine, pointer model) built to be extended.
- Exit line, live clock, custom cursor ring.
- Static no-JS / no-WebGL fallback.
- Favicon, Open Graph image, metadata, JSON-LD.
- Security headers, caching headers.
- Cloudflare Pages deployment on `parsanaji.com` and `www.parsanaji.com`.
- Cloudflare Email Routing for `info@parsanaji.com`.
- Cloudflare Web Analytics (cookieless), on by default.
- Automated tests (Vitest) and browser verification (Chrome DevTools MCP, Lighthouse, device check).

### 2.2 Out of scope (tracked separately)

- The full resume site and its content.
- Rebuilding Parsa's resume from the vault's project notes (separate brainstorm).
- Renaming the GitHub account to something more professional, enabling "private contributions" on the profile graph, and pinning repos.
- Refreshing LinkedIn.
- iCloud+ custom email domain (send-as `@parsanaji.com`).
- Sound, WebGPU, GPGPU physics, post-processing bloom.

---

## 3. Experience specification

### 3.1 Layout

- Full-viewport canvas, `position: fixed; inset: 0`. `html, body { overflow: hidden }`. No scrollbars on any device.
- Name centered at the viewport center on both axes.
- Exit line anchored bottom-left with a 24 px inset on desktop and 16 px on phones.
- Clock anchored bottom-right with the same insets.
- Nothing else on screen.

### 3.2 Look

| Element | Value |
|---|---|
| Background | `#070707` with a radial vignette: center `#0e0e0e` fading to `#070707` at 70 % of the viewport diagonal |
| Dot color | `#f5f5f5` |
| Dot shape | Soft round disc: fragment shader `smoothstep(0.5, 0.35, dist)` alpha falloff, additive blending (`THREE.AdditiveBlending`), depth test and depth write off |
| Dot base size | 1.6 CSS px × device pixel ratio (DPR capped at 2) |
| Dot size variance | Per-dot multiplier uniformly in [0.75, 1.25], fixed per dot |
| Dot opacity | Per-dot uniformly in [0.6, 1.0], fixed per dot |
| Near-pointer emphasis | Inside the repel radius, size scales up to 1.3× and opacity up to 1.0, weighted by proximity |
| Display font | Geist Sans, weight 900 (SIL OFL, self-hosted, subset to `A–Z`, `a–z`, `.`) |
| UI font | Geist Mono, weight 400 (self-hosted, subset to printable ASCII) |
| Name text | `PARSA NAJI`, uppercase, letter-spacing +0.04 em, one line when viewport width >= 480 px, stacked `PARSA` over `NAJI` (line-height 0.95) below 480 px |
| Name width | Text block width = 72 % of viewport width (single line) or 86 % (stacked), capped so the block height never exceeds 40 % of viewport height |
| Alt text (morph target) | `soon.` in the same display font, lowercase, same width rule |
| Exit line | 12 px Geist Mono, `rgba(245,245,245,0.45)`, letter-spacing 0.08 em, text: `building something new  ·  github  ·  linkedin  ·  say hi` (two spaces around each middle dot) |
| Exit line hover | Target link goes to `rgba(245,245,245,1)` over 150 ms; a 1 px underline slides in from the left over 200 ms (`background-size` technique) |
| Clock | 12 px Geist Mono, same color as the exit line, text `IRVINE  HH:MM PDT` where the time is `America/Los_Angeles` 24-hour and the zone abbreviation comes from `Intl.DateTimeFormat` (`PDT`/`PST` switches automatically) |
| Cursor | Over the canvas the native cursor is hidden and replaced by a 6 px ring (1 px stroke, `rgba(245,245,245,0.7)`) following the raw pointer (not the lerped one). Scales to 1.5× over 150 ms while a button is held. Native cursor over links. Ring hidden entirely on `(hover: none)` devices |
| Favicon | SVG, letter `P` rendered as a 7×9 dot grid in `#f5f5f5` on `#070707` |
| Open Graph image | 1200×630 PNG, a static capture of the name in dots from the engine itself (captured once with the DevTools MCP at 2× and downscaled), stored at `public/og.png` |

### 3.3 Particle density

- The sampler renders the text to an `OffscreenCanvas` (fallback: hidden `<canvas>`) at 2× the CSS size and scans every pixel; pixels with alpha > 128 are candidates.
- Target count `N` by viewport width class: >= 1024 px → 60 000; 768–1023 px → 40 000; < 768 px → 25 000.
- If candidates exceed `N`, subsample uniformly with a seeded PRNG (seed fixed per page load so morphs are stable). If candidates are fewer than `N`, sample with replacement and add a sub-pixel jitter of ±0.3 px so duplicates are not visible. Every target therefore has exactly `N` points, which keeps morphs one-to-one.
- `N` is fixed for the session except for the degrade rule (3.6) and a width-class change on resize (3.7).

### 3.4 Coordinate system

- `THREE.OrthographicCamera` with 1 world unit = 1 CSS pixel, origin at the viewport center, `y` up. Pointer and layout math stay in CSS pixels; no projection conversions.

### 3.5 Motion states

All easing is non-linear. Default curve `easeOutExpo` for arrivals, `easeInCubic` for departures. Time values below are defaults; all are exposed in the debug panel (4.8).

**Entry (page load):**
1. Dots are initialized at `home + dir × r`, where `dir` is a unit vector from 3D simplex noise sampled at `home`, and `r` is uniform in [300, 900] px.
2. Over 1.6 s they converge on `home` with `easeOutExpo`.
3. Per-dot delay = `0.4 s × mix(aSeed, |home.x| / halfWidth, 0.6)`, so letters resolve from the center outward with noise.
4. No spinner, no black-to-content fade. The canvas is drawn on the first frame.
5. At t = 2.0 s after load the exit line and clock fade in over 600 ms.

**Idle:**
- Vibration: each dot is displaced by `0.6 px × simplex3(home × 0.02, aSeed × 10, t × 2.0)` independently on x and y. Noise, never per-frame randomness.
- Breath: the whole field scales by `1 + 0.01 × sin(2π t / 6 s)` about the center.
- Ripple: every 10 s ± 2 s (uniform), a radial wave originates at the center of a randomly chosen glyph, travels at 1200 px/s, with amplitude 3 px and a 400 ms Gaussian envelope. One ripple at a time.

**Pointer:**
- Pointer position is lerped toward the raw pointer at 0.12 per frame, frame-rate independent: `1 − (1 − 0.12)^(dt / 16.67 ms)`.
- Pointer velocity (px/s) is estimated from the lerped position.
- A trail ring buffer holds the last 8 lerped positions with timestamps. Each slot's strength decays from 1 to 0 over 0.8 s with `easeOutCubic`. The newest slot is the current pointer at strength 1.
- Displacement per slot: `dir × radius × 0.35 × smoothstep(1, 0, d / radius)² × strength × (1 + min(|v| / 1500, 1))`, with `radius = 120 px` and `d` the distance from the dot's home to the slot. The sum over slots is clamped to `radius × 0.6`.
- This stateless formulation reads as a damped spring-back because the trail decays behind the cursor. True per-dot physics (GPGPU) is an explicit later upgrade, not part of this spec.

**Morph cycle (click, tap, or auto-tease):**
1. `SCRAMBLE_OUT`: 0.5 s. Each dot departs with `easeInCubic` to `home + dir × r`, `r` in [120, 360] px.
2. `FORM_ALT`: 0.9 s. Dots arrive at the `soon.` target with `easeOutExpo`, per-dot delay `0.25 s × aSeed`.
3. `HOLD_ALT`: 2.5 s. Idle rules apply (vibration, breath, pointer) around the alt target.
4. `SCRAMBLE_BACK` and `FORM_NAME`: mirror of steps 1–2 back to the name.
5. Input during a cycle is ignored until the cycle completes; the pointer repel keeps working throughout.

**Auto-tease:**
- If 8 s pass after the entry completes with no pointer movement over the canvas and no click, one morph cycle runs automatically. Afterward morphs happen only on click or tap.

**Touch:**
- `pointerdown` from touch places the lerped pointer at the touch point instantly and triggers a morph cycle (same as click).
- `pointermove` while touching drives the repel exactly as a mouse would.
- `pointerup` lets the trail decay; the pointer position is parked off-screen after 0.8 s so no "ghost" repel remains.

**Reduced motion (`prefers-reduced-motion: reduce`):**
- Entry completes instantly (progress = 1 on the first frame).
- Vibration amplitude 0, breath 0, ripples off.
- Morph cycle: 0.3 s opacity crossfade (field fades to 0, positions swap, fades back to 1). No flying dots.
- Pointer repel still active, radius 80 px, no velocity scaling.

**Hidden tab (`document.visibilityState === 'hidden'`):**
- The `requestAnimationFrame` loop stops. On return, the clock resyncs and the loop resumes; elapsed time does not advance timers (no catch-up jumps).

### 3.6 Adaptive quality

- After the entry animation, the engine measures 60 consecutive frames. If the average is below 45 fps, `N` is reduced to `round(N × 0.6)` and the current target is resampled once. The check never runs again in that session.
- DPR is capped at 2.

### 3.7 Resize and orientation

- Resize is debounced at 150 ms.
- If the width class (3.3) is unchanged, `N` is kept and both targets are resampled; dots glide to their new homes over 400 ms.
- If the width class changes, `N` is recomputed and geometry attributes are rebuilt. The current state is preserved (if showing `soon.`, it stays `soon.`).

### 3.8 Fallbacks

- **No JavaScript:** `<noscript>` reveals a CSS-only layout: `PARSA NAJI` in Geist Sans 900 centered, the exit line, no clock. Same colors.
- **No WebGL:** the engine's feature probe fails; the same static layout is shown by adding `class="no-webgl"` to `<html>`. The page is never blank.
- **Fonts not yet loaded:** sampling waits on `document.fonts.load('900 10px "Geist Sans"')` with a 2 s timeout; on timeout the sampler proceeds with the fallback font stack so the page still renders.

### 3.9 Content and links

| Item | Value |
|---|---|
| Page title | `Parsa Naji` |
| Meta description | `Building something new.` |
| Hidden heading | `<h1>Parsa Naji</h1>` and `<p>Building something new.</p>` (visually hidden, available to assistive tech) |
| `github` | `https://github.com/parsanaji9-eng` (update when the account is renamed) |
| `linkedin` | Hidden (`hidden` attribute) until Parsa supplies the URL; never shown as a dead link |
| `say hi` | `mailto:info@parsanaji.com` |
| Clock city | `IRVINE` (general area; Parsa lives in Rancho Santa Margarita) |

---

## 4. Architecture

### 4.1 Stack

- Vite 6, vanilla TypeScript (strict), `three` (latest r17x), no UI framework.
- `lil-gui` as a dev-only dependency for the debug panel.
- Vitest for unit tests.
- Node 24 locally (installed: v24.19.0, npm 11.17.0). The Cloudflare Pages build is pinned with the `NODE_VERSION=22` environment variable (Pages' supported LTS); the code uses no Node-24-only APIs.
- Package manager: npm.

### 4.2 Files

```
C:\Users\parsa\parsanaji.com\
├── index.html                    canvas mount, hidden <h1>/<p>, <noscript>, exit line, clock, cursor ring
├── public/
│   ├── fonts/GeistSans-Black.subset.woff2
│   ├── fonts/GeistMono-Regular.subset.woff2
│   ├── favicon.svg
│   ├── og.png
│   ├── robots.txt
│   └── _headers                  Cloudflare Pages headers (section 7)
├── src/
│   ├── main.ts                   boot sequence, wiring, lifecycle
│   ├── styles.css                layout, fallback typography, exit line, clock, cursor ring
│   ├── engine/
│   │   ├── ParticleField.ts      Points + ShaderMaterial, uniforms, setTarget(), update(dt), resize()
│   │   ├── sampler.ts            textToPoints(), subsampleToN(), layoutText(); imageToPoints() later
│   │   ├── pointer.ts            unified pointer model: lerp, velocity, trail ring buffer
│   │   ├── morph.ts              state machine + timers (ENTRY, IDLE, SCRAMBLE_OUT, FORM_ALT, HOLD_ALT, SCRAMBLE_BACK, FORM_NAME)
│   │   ├── quality.ts            DPR cap, width class → N, fps probe, degrade rule
│   │   ├── defaults.ts           every tunable with its shipped value
│   │   ├── easing.ts             easeOutExpo, easeInCubic, easeOutCubic
│   │   └── prng.ts               seeded mulberry32
│   ├── shaders/
│   │   ├── noise.glsl            3D simplex noise (Ashima / Ian McEwan, MIT)
│   │   ├── field.vert
│   │   └── field.frag
│   ├── ui/
│   │   ├── exitLine.ts           fade-in timing, link wiring, hidden-linkedin rule
│   │   ├── clock.ts              Intl-based LA time, 1 s tick, visibility resync
│   │   └── cursor.ts             ring element, pointer follow, press scale, hover:none guard
│   └── tweaks.ts                 lil-gui panel; only bundled in dev (`import.meta.env.DEV && location.search.includes('debug')`)
├── tests/
│   ├── sampler.test.ts
│   ├── morph.test.ts
│   ├── pointer.test.ts
│   └── quality.test.ts
├── docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md
├── package.json, tsconfig.json, vite.config.ts, vitest.config.ts
└── .gitignore
```

### 4.3 Data flow

1. `main.ts` probes WebGL and reduced-motion, loads fonts, reads the width class, and computes `N`.
2. `sampler.textToPoints('PARSA NAJI')` and `sampler.textToPoints('soon.')` each return a `Float32Array` of length `2N` in CSS-pixel coordinates centered on the origin.
3. `ParticleField` builds one `BufferGeometry` with attributes `aHome` (vec2, name), `aAlt` (vec2, soon.), `aSeed` (float, PRNG), `aSize` (float), `aAlpha` (float).
4. Per frame, `main.ts` advances the morph state machine and the pointer model, then writes uniforms: `uTime`, `uProgress` (0..1 within the current transition), `uPhase` (which transition), `uScatter` (scramble radius), `uPointer[8]` (vec4: x, y, strength, velocityFactor), `uBreath`, `uRipple` (origin, radius, amplitude), `uReduced`.
5. The vertex shader computes the final position: base = phase-dependent `mix` of home / alt / scatter positions with per-dot delay; plus noise vibration; plus breath scale; plus ripple; plus summed pointer displacement. `gl_PointSize` derives from `aSize`, DPR, and pointer proximity.
6. The fragment shader draws the soft disc with `aAlpha` and proximity brightening.
7. One `drawArrays` call per frame.

### 4.4 Morph state machine (`morph.ts`)

Pure TypeScript, no DOM, fully unit-testable. Inputs: `tick(dt)`, `requestCycle()`, `pointerActivity()`. Outputs: `{ phase, progress, scatter, canAcceptInput }` and events for `entryComplete` and `cycleComplete`. The auto-tease timer lives here and is cancelled by `pointerActivity()`.

### 4.5 Pointer model (`pointer.ts`)

Pure TypeScript. `push(rawX, rawY, timestamp)` and `release(timestamp)` from DOM listeners; `tick(dt)` performs the frame-rate-independent lerp, velocity estimate, trail decay, and parking. `slots()` returns the 8-slot array the renderer copies into `uPointer`.

### 4.6 Sampler (`sampler.ts`)

`layoutText(text, viewportW, viewportH, font)` decides single-line vs stacked and returns font size, line positions, and canvas dimensions. `rasterize()` draws to a 2D canvas. `scanAlpha(imageData, stride)` returns candidate points. `subsampleToN(points, N, prng)` enforces exactly `N`. The 2D canvas is injected so tests can pass synthetic `ImageData` without a browser font stack.

### 4.7 Lifecycle

- `visibilitychange` pauses and resumes the loop and resyncs the clock.
- `resize` and `orientationchange` go through the 150 ms debounce in `main.ts`.
- `pagehide` stops the loop so bfcache restores cleanly.

### 4.8 Debug panel

`?debug` on the dev server (never in production bundles) opens a `lil-gui` panel exposing: `N`, dot size, size variance, vibration amplitude and frequency, breath amplitude and period, ripple interval and amplitude, repel radius and strength, trail decay, lerp factor, every morph duration, auto-tease delay, and a "trigger morph" button. Values persist to `localStorage` under `parsanaji.tweaks` so Parsa can tune across reloads; the final values are copied into `src/engine/defaults.ts` before shipping.

---

## 5. Accessibility, SEO, metadata

- Visually hidden `<h1>` and `<p>` using the standard clip pattern; `aria-hidden="true"` on the canvas.
- Exit links are real `<a>` elements with `rel="me noopener"` where appropriate, a visible 2 px focus ring (`outline: 2px solid rgba(245,245,245,0.8); outline-offset: 4px`), tab order left to right.
- `lang="en"`, `color-scheme: dark`, `theme-color #070707`.
- `<link rel="canonical" href="https://parsanaji.com/">`.
- Open Graph and Twitter card tags: title, description, `og:image` 1200×630, `twitter:card=summary_large_image`.
- JSON-LD `Person`: `name`, `url`, `sameAs` (GitHub, LinkedIn when known). No email in structured data.
- `robots.txt` allows everything. No sitemap (single page).
- Reduced-motion behavior per 3.5.

---

## 6. Performance budget and quality bar

| Metric | Target |
|---|---|
| Total JS (gzip) | <= 180 KB (three tree-shaken; no postprocessing) |
| Fonts (two subsets) | <= 40 KB total, preloaded; `font-display: block` for the display face (the sampler waits for it anyway), `swap` for mono |
| Lighthouse (mobile and desktop) | >= 95 Performance, Accessibility, Best Practices, SEO |
| LCP | < 1.2 s on simulated 4G; the LCP element is the canvas first paint |
| CLS | 0 |
| TBT | < 100 ms |
| Frame rate | 60 fps on a 2020+ laptop including Intel integrated graphics at N = 60 000; >= 30 fps on iPhone 12 / mid-range Android at N = 25 000 |
| Console | zero errors, zero warnings in production |
| Third-party requests | none, except the Cloudflare Web Analytics beacon (cookieless) |
| Draw calls | 1 |

---

## 7. Deployment and infrastructure

### 7.1 Repository

- Local: `C:\Users\parsa\parsanaji.com` (git initialized 2026-10-16, default branch `main`).
- Remote: GitHub `parsanaji9-eng/parsanaji.com`; private is fine (Pages reads through the GitHub App).
- `gh` CLI is **not installed on this PC** (absent from both Git Bash and PowerShell PATH; `winget` 1.29 is available). Install with `winget install GitHub.cli` and run `gh auth login` as `parsanaji9-eng`, or create the repo in the browser and push with a PAT. Confirm the active account before any `gh repo create` (vault gotcha: two accounts).
- Git global identity is unset on this PC; the repo sets `user.name` / `user.email` locally.

### 7.2 Cloudflare Pages

- Project name `parsanaji-com`, connected to the GitHub repo, production branch `main`, preview deployments for every other branch.
- Build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION=22`.
- Custom domains `parsanaji.com` (apex) and `www.parsanaji.com`; a Cloudflare Redirect Rule sends `www.parsanaji.com/*` to `https://parsanaji.com/$1` with 301.
- Always Use HTTPS on. HSTS enabled after the first successful verification (max-age 6 months, then raise).
- Fallback if the GitHub App authorization is blocked: `npx wrangler pages deploy dist --project-name parsanaji-com` after `npx wrangler login` (no wrangler login exists on this PC yet).
- Cloudflare Pages redirects `*.html` with 308 to clean URLs; the site has only `/`, so no internal `.html` links exist.

### 7.3 Headers (`public/_headers`)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  X-Frame-Options: DENY

/index.html
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

No inline scripts or styles in production, so the CSP needs no nonces or `'unsafe-inline'`. The analytics beacon is included only when the production build sets `VITE_CF_BEACON_TOKEN`; without it the page ships with zero third-party requests and the CSP still passes.

### 7.4 Email

- Cloudflare Email Routing on the `parsanaji.com` zone: destination `private-inbox@example.com` (Cloudflare sends a verification email that Parsa must click), custom address `info@parsanaji.com` → that destination. Catch-all off.
- Cloudflare manages the MX, SPF, and DKIM records automatically on enable.
- Later, optional: iCloud+ custom email domain so Parsa can send as `@parsanaji.com`. Not part of this spec.

### 7.5 Analytics

- Cloudflare Web Analytics (free, cookieless, no consent banner needed). The beacon token is stored as the Pages environment variable `VITE_CF_BEACON_TOKEN` and injected at build time.

### 7.6 Operator steps (Parsa, in a browser, one time)

1. Authorize the Cloudflare Pages GitHub App for the repo (or run `npx wrangler login`).
2. Click the Email Routing destination verification link in the iCloud inbox.
3. Open the finished site on the iPhone for the Safari check.

Everything else is automated from the terminal.

---

## 8. Testing and verification

### 8.1 Unit tests (Vitest, run on every commit and in the Pages build)

- `sampler.test.ts`: exact `N` output for over- and under-populated inputs; all points within the text block bounds; stacked layout chosen below 480 px and single line at or above; seeded subsampling is deterministic.
- `morph.test.ts`: phase order and durations; input ignored mid-cycle; auto-tease fires at 8 s only with zero activity and only once; reduced-motion path uses the crossfade timings.
- `pointer.test.ts`: lerp is frame-rate independent (same position after 1 s at 30 and 120 fps within 1 %); velocity estimate; trail slot decay reaches 0 at 0.8 s; parking after release.
- `quality.test.ts`: width class → `N` table; degrade rule fires once below 45 fps and never again; DPR cap.

### 8.2 Browser verification (Chrome DevTools MCP, before each slice is called done)

- Screenshots at 1440×900, 768×1024, 390×844.
- Console: zero messages at error or warning level.
- `lighthouse_audit` on the production preview URL: all four categories >= 95.
- Performance trace during 10 s of pointer movement: no long tasks over 50 ms after the entry, steady frame budget.

### 8.3 Manual checklist (Parsa plus Claude)

- Entry animation feels like dots gathering, not a fade.
- Hover repel is liquid; dots return without snapping.
- Click morph: scramble → `soon.` → scramble → name, timings per 3.5.
- Auto-tease fires once at 8 s when untouched.
- `prefers-reduced-motion` honored (toggle in the DevTools rendering panel).
- No-JS and no-WebGL fallbacks render the static name.
- Keyboard: Tab reaches each link, focus ring visible, Enter activates.
- Safari on iPhone: tap morph, drag repel, no scroll bounce, no address-bar jump, clock correct.

### 8.4 Finish gates

- `frontend-design` skill applied during the visual slices; `anti-ui-slop` finish gate run before the final slice is closed.
- Vault note `Projects/parsanaji.com.md` and the memory file updated with the live URL, deploy recipe, and any gotchas.

---

## 9. Implementation slices (detailed plan produced by writing-plans)

1. **Scaffold and go live.** Vite + TS + `three`, static fallback page with real fonts, `_headers`, Pages project, custom domains, email routing. parsanaji.com resolves to the static typographic page on day one. "Site not found" ends here.
2. **Sampler and field.** Text → points, GPU field, entry animation, idle vibration, breath, ripple. Unit tests for the sampler.
3. **Pointer and chrome.** Repel with trail, cursor ring, exit line, clock, reduced-motion branch for what exists so far. Unit tests for the pointer model.
4. **Morph.** State machine, scramble ↔ `soon.`, auto-tease, touch, adaptive quality, resize rules. Unit tests for morph and quality.
5. **Polish and proof.** OG image, favicon, JSON-LD, Lighthouse, DevTools traces, iPhone check, slop gate, defaults frozen from the debug panel, vault and memory updated.

Each slice ends with tests green, a commit, and a Pages preview URL Parsa can open.

---

## 10. Open inputs

| Input | Owner | Default until supplied |
|---|---|---|
| LinkedIn profile URL | Parsa | `linkedin` link hidden |
| GitHub account rename | Parsa (later) | link points at `parsanaji9-eng` |
| Cloudflare Web Analytics token | Claude creates during slice 1; Parsa can say "no analytics" | analytics on |

---

## 11. Decisions log

| Decision | Choice | Alternatives rejected |
|---|---|---|
| Engine | Three.js GPU points, custom shaders | Canvas 2D (count ceiling, throwaway); tsParticles / Framer (generic, lock-in) |
| Pointer physics | Stateless shader repel + 8-slot decaying trail | GPGPU ping-pong (complexity not justified for one screen) |
| Exits | Quiet bottom-left text line | Dead end (strands employers); email capture form (friction) |
| Typeface | Geist Sans 900 + Geist Mono | Inter (ubiquitous, reads generic); paid faces (licensing friction) |
| Email | `info@parsanaji.com` → `private-inbox@example.com` via Cloudflare Email Routing | `hello@`; raw Gmail/iCloud address on the page |
| Hosting | Cloudflare Pages from GitHub | Vercel (second vendor; DNS already at Cloudflare) |
| Analytics | Cloudflare Web Analytics, cookieless | None; Plausible (cost); GA (consent burden) |
| Framework | None (vanilla TS) | Astro / Next (not needed for one screen; the engine stays portable for either later) |
