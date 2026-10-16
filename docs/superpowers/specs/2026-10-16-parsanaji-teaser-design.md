# parsanaji.com — Teaser ("Scene 1") Design

**Date:** 2026-10-16
**Status:** Approved by Parsa 2026-10-16 ("Looks good"). Amended the same day after the dependency audit (sections 3.3, 3.7, 4.1, 7.2, 7.5, 7.6, 9, 10). Execution: Opus 5.5 subagents build, Fable 5.1 plans and reviews (Parsa's instruction).
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
- Exit line anchored bottom-left with a 24 px inset on desktop and 16 px on phones (or the device safe-area inset when that is larger).
- Clock anchored bottom-right with the same insets.
- Below 680 px of viewport width one row cannot hold both, so the chrome stacks: the tagline, then the links row, then the clock right-aligned on its own row. Nothing is ever clipped, and the LinkedIn link fits when it appears. (Ruled during the Task 3 review, 2026-10-16: the first build clipped the clock to `IRV` at 390 px.)
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
| Exit line | 12 px Geist Mono, `rgba(245,245,245,0.5)` (was 0.45; raised during planning because 12 px text at 0.45 measures about 4.2:1 against `#070707` and fails the 4.5:1 contrast requirement; 0.5 measures about 4.95:1), letter-spacing 0.08 em, text: `building something new  ·  github  ·  linkedin  ·  say hi` (two spaces around each middle dot) |
| Exit line hover | Target link goes to `rgba(245,245,245,1)` over 150 ms; a 1 px underline slides in from the left over 200 ms (`background-size` technique) |
| Clock | 12 px Geist Mono, same color as the exit line, text `IRVINE  HH:MM PDT` where the time is `America/Los_Angeles` 24-hour and the zone abbreviation comes from `Intl.DateTimeFormat` (`PDT`/`PST` switches automatically) |
| Cursor | Over the canvas the native cursor is hidden and replaced by a 6 px ring (1 px stroke, `rgba(245,245,245,0.7)`) following the raw pointer (not the lerped one). Scales to 1.5× over 150 ms while a button is held. Native cursor over links. Ring hidden entirely on `(hover: none)` devices |
| Favicon | SVG, letter `P` rendered as a 7×9 dot grid in `#f5f5f5` on `#070707` |
| Open Graph image | 1200×630 PNG, a static capture of the name in dots from the engine itself (captured once with the DevTools MCP at 2× and downscaled), stored at `public/og.png` |

### 3.3 Particle density

- The sampler renders the text to an `OffscreenCanvas` (fallback: hidden `<canvas>`) at 2× the CSS size and scans every pixel; pixels with alpha > 128 are candidates. The candidate count divided by 4 is the inked area in CSS px².
- Dot count `N` is derived from the name's inked area, not fixed: `N = min(cap, round(inkedAreaCssPx × density))` with `density = 0.30` dots per CSS px² (about one dot every 1.8 px, so individual dots stay visible and letters never read as solid white). Caps by viewport width class: >= 1024 px → 60 000; 768–1023 px → 40 000; < 768 px → 25 000. Expected `N` at 1440×900 is roughly 15 000; at 390×844 roughly 7 000. Both `density` and the caps are debug-panel tunables.
- If candidates exceed `N`, subsample uniformly with a seeded PRNG (seed fixed per page load so morphs are stable). If candidates are fewer than `N`, sample with replacement and add a sub-pixel jitter of ±0.3 px so duplicates are not visible. Every target therefore has exactly `N` points, which keeps morphs one-to-one. `N` is computed from `PARSA NAJI`; `soon.` is resampled to that same `N`.
- `N` is fixed for the session except for the degrade rule (3.6) and a resize (3.7).

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
- On resize both targets are resampled for the new viewport, `N` is recomputed by the 3.3 formula, and the geometry attributes are rebuilt. Dots snap to their new homes (no glide; a window resize is rare and an orientation change already reflows the whole screen). The current state is preserved (if showing `soon.`, it stays `soon.`); an in-flight morph cycle completes against the new targets.

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
| `github` | `https://github.com/parsanaji` (account renamed from `parsanaji9-eng` on 2026-10-16) |
| `linkedin` | Hidden (`hidden` attribute) until Parsa supplies the URL; never shown as a dead link |
| `say hi` | `mailto:info@parsanaji.com` |
| Clock city | `IRVINE` (general area; Parsa lives in Rancho Santa Margarita) |

---

## 4. Architecture

### 4.1 Stack

- Vite 8 (8.3.x, Rolldown-based), vanilla TypeScript 5.9 (strict; TypeScript 7 is deliberately not used yet), `three` 0.186 with `@types/three` 0.186, `@types/node` 22 for the test files, no UI framework. GLSL files are imported as strings with Vite's built-in `?raw` suffix; no GLSL plugin.
- `lil-gui` 0.21 as a dev-only dependency for the debug panel (loaded through a dynamic import guarded by `import.meta.env.DEV`, so it is absent from production bundles).
- Vitest 5 for unit tests (Node environment, no DOM).
- Geist Black and Geist Mono Regular source `.woff2` files vendored under `scripts/fonts-src/` (copied from the `geist` 1.7.2 npm package together with its SIL OFL 1.1 license; the package itself is not a dependency because it peer-requires Next.js, which pulled about 325 MB into node_modules — ruled during the Task 1 review on 2026-10-16) and `subset-font` 2.9 (pure-JS HarfBuzz subsetter; Python is not installed on this PC, so no fonttools) as a dev dependency; the generated subset `.woff2` files are committed under `public/fonts/`.
- `wrangler` 4 as a dev dependency for Cloudflare Pages deploys; `sharp` as a dev dependency for the OG image downscale.
- Node 24 locally (installed: v24.19.0, npm 11.17.0). GitHub Actions uses Node 22 (Vite 8 requires `^20.19.0 || >=22.12.0`). The code uses no Node-24-only APIs.
- Package manager: npm, with `package-lock.json` committed.

### 4.2 Files

```
C:\Users\parsa\parsanaji.com\
├── index.html                    canvas mount, hidden <h1>/<p>, static fallback (+ <noscript> copy), exit line, clock, cursor ring, JSON-LD
├── public/
│   ├── fonts/GeistSans-Black.subset.woff2
│   ├── fonts/GeistMono-Regular.subset.woff2
│   ├── fonts/LICENSE.txt         SIL OFL 1.1 (ships with the subsets, OFL condition 2)
│   ├── favicon.svg
│   ├── og.png
│   ├── robots.txt
│   └── _headers                  Cloudflare Pages headers (section 7)
├── scripts/
│   ├── subset-fonts.mjs          scripts/fonts-src/*.woff2 → subset woff2 files (subset-font)
│   ├── fonts-src/                vendored Geist Black + Geist Mono Regular .woff2 sources + SIL OFL 1.1 LICENSE.txt (geist is not an npm dependency)
│   ├── og-placeholder.mjs        slice-1 OG image from SVG shapes (sharp)
│   ├── og-image.mjs              slice-5 OG image: downscale the engine capture (sharp)
│   ├── cf-env.mjs                verifies the API token, writes account/zone ids into .env
│   ├── cf-api.mjs                shared fetch helper for the Cloudflare REST API
│   ├── cf-setup-pages.mjs        custom domains, DNS, www redirect, Always Use HTTPS (idempotent)
│   ├── cf-setup-email.mjs        Email Routing enable, destination, rule, catch-all off (idempotent)
│   └── cf-hsts.mjs               HSTS on (slice 5)
├── .github/workflows/deploy.yml  test + build + wrangler pages deploy on every push
├── src/
│   ├── main.ts                   boot: chrome, WebGL probe, font wait, App start, debug panel gate
│   ├── app.ts                    App: sampling, field, frame loop, pointer/morph wiring, resize, visibility
│   ├── content.ts                name, alt text, links, clock city/time zone
│   ├── styles.css                layout, fallback typography, exit line, clock, cursor ring
│   ├── boot/fonts.ts             waitForFont() with timeout
│   ├── boot/webgl.ts             hasWebGL2() probe on a scratch canvas
│   ├── engine/
│   │   ├── types.ts              PHASE ids, PointerSlot, RippleState, shared param interfaces
│   │   ├── defaults.ts           every tunable with its shipped value (Params)
│   │   ├── ParticleField.ts      Points + ShaderMaterial, uniforms, setTargets(), setMorph(), render()
│   │   ├── sampler.ts            layoutText(), rasterize(), scanAlpha(), subsampleToN(), sampleText(); imageToPoints() later
│   │   ├── pointer.ts            PointerModel: lerp, velocity, decaying trail, parking
│   │   ├── morph.ts              MorphMachine: ENTRY → IDLE → SCRAMBLE_OUT → FORM_ALT → HOLD_ALT → SCRAMBLE_BACK → FORM_NAME, auto-tease
│   │   ├── motion.ts             breathScale(), RippleScheduler
│   │   ├── quality.ts            width class caps, dotCount(), capDpr(), FpsProbe, degradedCount()
│   │   ├── time.ts               clampDt()
│   │   ├── easing.ts             easeOutExpo, easeInCubic, easeOutCubic, clamp01
│   │   └── prng.ts               mulberry32, seedFromLocation
│   ├── shaders/
│   │   ├── noise.glsl            3D simplex noise (Ashima / Ian McEwan, MIT)
│   │   ├── field.vert
│   │   └── field.frag
│   ├── ui/
│   │   ├── exitLine.ts           hidden-linkedin rule (the 2 s fade-in is a CSS animation, so it also works without JS)
│   │   ├── clock.ts              formatClock() + startClock(): Intl-based LA time, 1 s tick, visibility resync
│   │   └── cursor.ts             ring element, raw-pointer follow, press scale, hover:none guard, hidden over links
│   ├── tweaks.ts                 lil-gui panel; dev-only dynamic import behind `?debug`
│   └── vite-env.d.ts
├── tests/                        vitest: clock, env, prng, easing, time, quality, sampler (+ helpers/fakeCanvas.ts), motion, pointer, morph, fonts
├── docs/OPERATOR.md              Parsa's one-time steps (7.6) and how to verify them
├── docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md
├── docs/superpowers/plans/2026-10-16-parsanaji-teaser.md
├── README.md                     run / test / deploy recipes
├── package.json, package-lock.json, tsconfig.json, vite.config.ts, vitest.config.ts
├── .env.example                  CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_ZONE_ID
└── .gitignore                    node_modules, dist, .env, .wrangler
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
- Remote: GitHub `parsanaji/parsanaji.com`; private is fine (Pages reads through the GitHub App).
- `gh` 2.102.0 installed 2026-10-16 (`winget install GitHub.cli`) at `C:\Program Files\GitHub CLI\gh.exe`, logged in as `parsanaji` (keyring, HTTPS). Shells spawned by a VS Code process started before the install lack it on PATH: `export PATH="$PATH:/c/Program Files/GitHub CLI"` (Git Bash) or `$env:Path += ";C:\Program Files\GitHub CLI"` (PowerShell). Confirm the active account before any `gh repo create` (vault gotcha: two accounts).
- Git global identity is unset on this PC; the repo sets `user.name` / `user.email` locally.

### 7.2 Cloudflare Pages

- Project name `parsanaji-com`, created as a **Direct Upload** project with `wrangler pages project create parsanaji-com --production-branch main`. Deploys are `wrangler pages deploy dist --project-name parsanaji-com --branch <branch>`; `--branch main` is production, any other branch name yields a preview URL `<branch>.parsanaji-com.pages.dev`. (A Direct Upload project cannot be converted to Git integration later; push-to-deploy is provided by GitHub Actions instead, which is equivalent for this site and keeps every step scriptable.)
- GitHub Actions workflow `.github/workflows/deploy.yml`: on every push, `npm ci`, `npm test`, `npm run build`, then `cloudflare/wrangler-action@v3` runs the deploy with the branch name. Repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Authentication: one scoped Cloudflare API token (section 7.6) in the gitignored `.env` file as `CLOUDFLARE_API_TOKEN`, plus `CLOUDFLARE_ACCOUNT_ID`. Wrangler reads both from the environment; the REST calls below use the same token. No `wrangler login` OAuth session is needed.
- Custom domains `parsanaji.com` (apex) and `www.parsanaji.com`, added through the Pages API (`POST /accounts/{account_id}/pages/projects/parsanaji-com/domains`) with proxied CNAME records to `parsanaji-com.pages.dev` created through the DNS API (the apex uses Cloudflare CNAME flattening). A Single Redirect rule (ruleset phase `http_request_dynamic_redirect`) sends `www.parsanaji.com/*` to `https://parsanaji.com/<same path>` with 301 and preserves the query string.
- Always Use HTTPS on (zone setting `always_use_https`). HSTS enabled in slice 5 after the first successful verification (max-age 6 months, then raise).
- Cloudflare Pages redirects `*.html` with 308 to clean URLs; the site has only `/`, so no internal `.html` links exist.

### 7.3 Headers (`public/_headers`)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY

/
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

No inline scripts or styles in production, so the CSP needs no nonces or `'unsafe-inline'`. The `/` and `/index.html` entries both get `Cache-Control: no-cache` because Pages serves the page at `/`. The JSON-LD `<script type="application/ld+json">` block is a data block, not executable script, and is not subject to `script-src`. The analytics beacon (7.5) is an external script from `static.cloudflareinsights.com` with a `data-cf-beacon` attribute, so it passes this CSP without changes; with analytics off the page makes zero third-party requests.

### 7.4 Email

- Cloudflare Email Routing on the `parsanaji.com` zone: destination `private-inbox@example.com` (Cloudflare sends a verification email that Parsa must click), custom address `info@parsanaji.com` → that destination. Catch-all off.
- Cloudflare manages the MX, SPF, and DKIM records automatically on enable.
- Later, optional: iCloud+ custom email domain so Parsa can send as `@parsanaji.com`. Not part of this spec.

### 7.5 Analytics

- Cloudflare Web Analytics (free, cookieless, no consent banner needed). Enabled with the **Web Analytics** toggle on the Pages project in the Cloudflare dashboard (Workers & Pages → `parsanaji-com` → Metrics → Enable Web Analytics). Cloudflare then injects the beacon `<script>` into served HTML automatically; nothing is added to the source and no build variable exists. Parsa can turn it off with the same toggle.

### 7.6 Operator steps (Parsa, one time)

1. **GitHub CLI.** Done 2026-10-16: `winget install GitHub.cli`, `gh auth login` (GitHub.com, HTTPS, browser) signed in as `parsanaji`; `gh auth status` confirms.
2. **Cloudflare API token.** Dashboard → My Profile → API Tokens → Create Token → Create Custom Token, named `parsanaji-com-deploy`, with exactly these permissions:
   - Account · Cloudflare Pages · Edit
   - Account · Email Routing Addresses · Edit
   - Account · Account Settings · Read
   - Zone · Zone · Read
   - Zone · DNS · Edit
   - Zone · Zone Settings · Edit
   - Zone · Email Routing Rules · Edit
   - Zone · Single Redirect · Edit (older dashboards label it "Dynamic Redirect")
   Account Resources: Include → the account that holds parsanaji.com. Zone Resources: Include → Specific zone → `parsanaji.com`. Copy the token once into `C:\Users\parsa\parsanaji.com\.env` as `CLOUDFLARE_API_TOKEN=<token>` (the file is gitignored). The builder fills in `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_ZONE_ID` from the API.
3. **Email verification.** Click the Cloudflare Email Routing verification link that arrives at `private-inbox@example.com`.
4. **Analytics.** Flip the Web Analytics toggle on the Pages project (7.5). Optional.
5. **Device check.** Open the finished site in Safari on the iPhone (slice 5 checklist).

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

1. **Scaffold and go live.** Vite + TS project, subset fonts, the static typographic page (name, exit line, live clock, favicon, robots, `_headers`), GitHub repo + Actions, Pages project, custom domains, redirect, HTTPS, email routing. parsanaji.com resolves to the static page on day one. "Site not found" ends here.
2. **Engine core.** PRNG, easing, quality tables, sampler (with unit tests), shaders, `ParticleField`, boot sequence with the entry animation, idle vibration, breath, ripple, and the debug panel.
3. **Pointer.** Pointer model with trail (unit tests), repel wiring, cursor ring, touch handling.
4. **Morph and resilience.** Morph state machine (unit tests), click/tap/auto-tease, reduced motion, fps probe and degrade (unit tests), resize rules, visibility handling.
5. **Polish and proof.** OG image, JSON-LD check, Lighthouse, DevTools traces, iPhone check, `anti-ui-slop` gate, HSTS, defaults frozen from the debug panel, vault and memory updated.

Each slice ends with tests green, a commit, and a Pages URL Parsa can open (production after slice 1, previews after every later slice until it is merged).

---

## 10. Open inputs

| Input | Owner | Default until supplied |
|---|---|---|
| LinkedIn profile URL | Parsa | `linkedin` link hidden |
| GitHub account rename | Done 2026-10-16 (`parsanaji9-eng` renamed to `parsanaji`) | link points at `parsanaji` |
| Web Analytics | Parsa flips the dashboard toggle (7.5) or leaves it off | off until toggled |

---

## 11. Decisions log

| Decision | Choice | Alternatives rejected |
|---|---|---|
| Engine | Three.js GPU points, custom shaders | Canvas 2D (count ceiling, throwaway); tsParticles / Framer (generic, lock-in) |
| Pointer physics | Stateless shader repel + 8-slot decaying trail | GPGPU ping-pong (complexity not justified for one screen) |
| Exits | Quiet bottom-left text line | Dead end (strands employers); email capture form (friction) |
| Typeface | Geist Sans 900 + Geist Mono | Inter (ubiquitous, reads generic); paid faces (licensing friction) |
| Email | `info@parsanaji.com` → `private-inbox@example.com` via Cloudflare Email Routing | `hello@`; raw Gmail/iCloud address on the page |
| Hosting | Cloudflare Pages, Direct Upload project deployed by wrangler from GitHub Actions on every push | Pages Git integration (needs dashboard GitHub App auth, not scriptable, and a Direct Upload project cannot be converted later); Vercel (second vendor; DNS already at Cloudflare) |
| Dot count | Derived from inked area × density 0.30, capped per width class | Fixed 60k/40k/25k (would render letters as solid white at 1.6 px dots) |
| Analytics | Cloudflare Web Analytics, cookieless | None; Plausible (cost); GA (consent burden) |
| Framework | None (vanilla TS) | Astro / Next (not needed for one screen; the engine stays portable for either later) |
