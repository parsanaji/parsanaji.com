# parsanaji.com Teaser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship parsanaji.com as a one-screen teaser: `PARSA NAJI` drawn in vibrating GPU particles that flee the pointer and morph to `soon.` on click, with a quiet exit line and a live clock, deployed on Cloudflare Pages with `info@parsanaji.com` routed to iCloud.

**Architecture:** A Vite + vanilla TypeScript site with no UI framework. A canvas sampler turns text into exactly `N` points; a Three.js `Points` object with a custom GLSL3 vertex shader does every motion (entry convergence, simplex vibration, breath, ripple, pointer repel with a decaying trail, phase-based morph) on the GPU in one draw call, while pure, unit-tested TypeScript modules (`MorphMachine`, `PointerModel`, `RippleScheduler`, `FpsProbe`, sampler math) decide what the uniforms say each frame. Infrastructure is scripted against the Cloudflare REST API and wrangler; GitHub Actions deploys on every push.

**Tech Stack:** Vite 8.3.4, TypeScript 5.9.3, three 0.186.1 + @types/three 0.186.0, Vitest 5.0.5, lil-gui 0.21.0 (dev), subset-font 2.9.0 (dev, fonts; Geist Black and Geist Mono Regular source woff2 files vendored under scripts/fonts-src/ from geist@1.7.2, SIL OFL 1.1), sharp 0.35.5 (dev, images), wrangler 4.151.0 (dev), Cloudflare Pages + DNS + Email Routing, GitHub Actions. Node 24.19 locally, Node 22 in CI.

**Spec:** `docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md` (read it first; this plan argues from it and uses its section numbers).

## Global Constraints

- Repo: `C:\Users\parsa\parsanaji.com`, branch `main`, git identity already set locally (`Parsa Naji` / `238802691+parsanaji@users.noreply.github.com`). Shell for commands below is Git Bash (`/c/Users/parsa/parsanaji.com`). Commit after every task; end commit messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Exact dependency versions (install with `--save-exact`): `three@0.186.1`; dev: `vite@8.3.4 typescript@5.9.3 @types/three@0.186.0 @types/node@22 vitest@5.0.5 lil-gui@0.21.0 subset-font@2.9.0 sharp@0.35.5 wrangler@4.151.0`. TypeScript 7 is not used. No other runtime dependencies without a reason written in the commit.
- Copy, verbatim: name `PARSA NAJI`; alt `soon.`; exit line `building something new · github · linkedin · say hi`; clock `IRVINE HH:MM PDT` (24-hour, `America/Los_Angeles`); title `Parsa Naji`; description `Building something new.`; email `info@parsanaji.com`; GitHub `https://github.com/parsanaji`; LinkedIn hidden until a URL exists.
- Colors: background `#070707`, vignette center `#0e0e0e`, dots and text `#f5f5f5`, muted text `rgba(245,245,245,0.5)` (spec 3.2 said 0.45; raised to 0.5 so 12 px text clears the 4.5:1 contrast audit at about 4.95:1). Fonts: Geist Sans 900 (display), Geist Mono 400 (UI), self-hosted subsets under `public/fonts/`. No other colors, no gradients beyond the vignette, no icons.
- No inline `<script>` (other than the JSON-LD data block) and no inline `<style>` or `style=""` attributes anywhere in `index.html`; the production CSP in `public/_headers` has no `'unsafe-inline'`. Set element styles only through the CSSOM (`el.style.translate = …`) from TypeScript.
- Production bundle: no `lil-gui`, no source maps, total JS <= 180 KB gzip, fonts <= 40 KB total, one WebGL draw call, DPR capped at 2, `requestAnimationFrame` paused while the tab is hidden, zero console errors or warnings.
- Motion defaults are the spec's numbers (3.5) and live only in `src/engine/defaults.ts`; every module receives them as parameters. Nothing in the engine reads `DEFAULTS` directly except `main.ts`.
- Coordinates: 1 world unit = 1 CSS px, origin at the viewport center, y up (spec 3.4). Pointer events convert with `x = clientX - vw / 2`, `y = vh / 2 - clientY`.
- Unit tests run in Node with no DOM. Anything that needs a canvas, font, or WebGL is verified in the browser with the Chrome DevTools MCP tools (`mcp__plugin_ecc_chrome-devtools__*`) and recorded in the task's verification step.
- Operator steps (spec 7.6) are Parsa's: GitHub CLI login, the Cloudflare API token in `.env`, the email verification click, the analytics toggle, the iPhone check. A task that needs one and finds it missing stops and reports; it does not improvise credentials.
- GitHub CLI: `gh` 2.102.0 is installed at `C:\Program Files\GitHub CLI\gh.exe` and logged in as `parsanaji` (operator step 1 done 2026-10-16). Builder shells may not have it on PATH: start every command block that calls `gh` with `export PATH="$PATH:/c/Program Files/GitHub CLI"`. The GitHub handle is `parsanaji` (renamed from `parsanaji9-eng`).

## Review Focus

Spec-implied inputs no task's tests covered on the first pass. Each line now has its test in the owning task.

1. **Display font never loads** (offline cache miss, blocked font request): the page must still render the name from the fallback font stack after 2 s rather than hang on a black screen. Test in Task 14 (`waitForFont` resolves `'timeout'` when `fonts.load` never settles).
2. **Hidden tab for minutes, then shown**: one giant frame delta must not sprint the morph through all phases or fire the auto-tease instantly. Tests in Task 9 (`clampDt` caps a 60 000 ms delta at 50 ms) and Task 19 (a clamped sequence advances the `MorphMachine` by real frames only).
3. **Pointer leaves the window while pressed, or a touch is cancelled**: without a release the last repel position would haunt the field forever. Test in Task 16 (`release` then `parkMs` makes the model inactive with all slot strengths 0).
4. **Extreme viewports**: 320×480 phone (stacked), 2560×1080 ultrawide and 1024×200 letterbox (height cap) must all give a positive font size and a block no taller than 40 % of the viewport. Tests in Task 11.
5. **Canvas `letterSpacing` unsupported** (older Safari): the sampler must fall back to per-glyph drawing and still produce the same number of glyphs. Test in Task 11 (fake context without `letterSpacing` records one `fillText` per non-space character).

## Execution Notes (Parsa's instructions)

- Builders are **Claude Opus 5.5** subagents (`model: "opus"`); the orchestrator (Fable 5.1) dispatches, reviews and checkpoints but writes no product code. One builder at a time: the tasks share interfaces and each depends on the previous commit.
- Effort: `high` for every task, `xhigh` for Task 12 (shaders + `ParticleField`), Task 14 (boot + frame loop) and Task 23 (Lighthouse and performance), where mistakes are the most expensive to find later.
- Checkpoints: after Task 8 (slice 1, site live) and after Task 18 (slice 3) the orchestrator updates the vault note `Projects/parsanaji.com.md` and the memory file, then compacts (`/strategic-compact`) before continuing. The plan's checkboxes are the resumable state.
- Each slice ends with a deploy Parsa can open: production after slice 1 (`https://parsanaji.com`), then `npm run deploy:preview` (`https://preview.parsanaji-com.pages.dev`) after slices 2, 3 and 4, and production again after slice 5.

## File Structure

See spec 4.2 for the full tree. Responsibilities, one line each:

- `index.html` — all markup. Final in Task 3; later tasks never edit it.
- `src/styles.css` — all CSS. Final in Task 3.
- `src/content.ts` — strings and links. Final in Task 3.
- `src/main.ts` — boot sequence only (chrome, WebGL probe, font wait, `App`, debug-panel gate). Written in Task 3 (static), rewritten in Task 14, last edited in Task 22 (`?og` flag).
- `src/app.ts` — `App`: owns sampling, the field, the frame loop and wiring. Written in Task 14, extended in Tasks 17, 20, 21, 22.
- `src/engine/*` — pure logic plus the one Three.js class. Each file owns one concept; each pure file has a test file of the same name under `tests/`.
- `src/boot/*` — two tiny environment probes, testable.
- `src/ui/*` — DOM glue for chrome: clock, exit line, cursor ring.
- `src/tweaks.ts` — dev-only lil-gui panel.
- `scripts/*.mjs` — fonts, OG images, Cloudflare setup. Plain Node, run with `node scripts/<name>.mjs`.
- `tests/*` — Vitest, Node environment, `tests/helpers/fakeCanvas.ts` for the sampler.

---
