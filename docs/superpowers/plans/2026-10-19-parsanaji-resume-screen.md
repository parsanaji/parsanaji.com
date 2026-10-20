# parsanaji.com Résumé Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the live particle teaser with a one-screen résumé: a plain-HTML left rail over a full-screen WebGL2 Bayer-dither field (pointer repel, click Shockwave) in the Dither Blue dark and daylight looks with a stored toggle, a "field forms the name" entry on every load and the R12 eggs, shipped as previews of branch `resume-screen` until Parsa approves.

**Architecture:** Vite + vanilla TypeScript with no UI framework and production `dependencies: {}`. The résumé is static HTML (readable without JavaScript, WebGL2, motion or colour) dressed by one stylesheet whose tokens are the single source of both looks; a pre-paint classic script `public/theme-boot.js` applies the stored look and the entry pre-hide under the strict CSP. The field is a raw WebGL2 two-pass renderer (pass 1: one texel per dither cell evaluating the Blueprint fbm surface plus pointer warp, breath, rings and the name mask; pass 2: Bayer 8×8 tiers to device pixels), driven by small pure TypeScript models (`PointerModel`, `RipplePool`, `EntryMachine`, sizing, flow, `ColorTween`) that Vitest pins in Node, with `src/field/surface.ts` as the bit-exact CPU twin shared by the tests, the browser parity check and the OG image script.

**Tech Stack:** Vite 8.3.4 (Rolldown), TypeScript 5.9.3 (strict), raw WebGL2 + GLSL ES 3.00 imported with `?raw`, Vitest 5.0.5 (Node environment), lil-gui 0.21.0 (debug builds only), subset-font 2.9.0 with JetBrains Mono v2.304 (SIL OFL 1.1, vendored), sharp 0.35.5, harfbuzzjs 1.6.3 and fontverter 2.0.0 (new, OG script only), wrangler 4.151.0 (dev; deploys run in GitHub Actions), @types/node 22.20.5. Removed: three 0.186.1, @types/three 0.186.0. Hosting: Cloudflare Pages through `.github/workflows/deploy.yml`. Node 24.19.0 locally, Node 22 in CI, `engines.node >=22.18.0`.

**Spec:** `docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-design.md` (binding; tasks, briefs and reviews cite it by requirement number), with its appendices `docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-appendix/A-architecture.md` (engine audit §1, module map §2, GLSL §3, tests §9), `B-palette.md` (tokens §1.1, favicon §5.1) and `C-layout.md` (HTML §1, CSS §2, head §5). Where the spec and an appendix disagree the spec wins; "exactly Appendix X §n, with these changes" makes the appendix code normative apart from the listed changes.

## Global Constraints

Every task's requirements implicitly include this section.

**Repository and git**
- Repo `C:\Users\parsa\parsanaji.com` (Git Bash: `/c/Users/parsa/parsanaji.com`). Branch `resume-screen`, created from `main`; its first commit is `3e64808` (the spec). It has no upstream until Task 8 runs `git push -u origin resume-screen`. Git identity is set locally (`Parsa Naji` / `238802691+parsanaji@users.noreply.github.com`).
- Never commit to, push to or merge into `main`. Production `https://parsanaji.com` stays on the teaser until Parsa approves the preview (7.1.3, 7.5.1).
- Commit at the end of every task and stage only the files the task lists (never `git add -A` or `git add .`). Every commit message ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `core.autocrlf=true`: "LF will be replaced by CRLF" warnings are harmless. Any test that reads a repo text file (`index.html`, `src/styles.css`, `public/theme-boot.js`, shaders, `src/field/surface.ts`) replaces `\r\n` with `\n` before matching or measuring.

**Dependencies and toolchain**
- `dependencies` is `{}`. `devDependencies`, exact pins (`--save-exact`): `@types/node 22.20.5`, `fontverter 2.0.0`, `harfbuzzjs 1.6.3`, `lil-gui 0.21.0`, `sharp 0.35.5`, `subset-font 2.9.0`, `typescript 5.9.3`, `vite 8.3.4`, `vitest 5.0.5`, `wrangler 4.151.0`. `three` and `@types/three` are removed. No other package (no jsdom, no DOM test library) (4.1.1, 4.1.2, R5).
- `engines.node` is `">=22.18.0"`; local Node 24.19.0, CI Node 22 latest (4.1.3, 6.1.15).
- npm scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `fonts`, `og` (`node scripts/og-image.mjs`), `deploy`, `deploy:preview` unchanged; `og:placeholder` removed (4.1.4). No task runs `deploy` or `deploy:preview`: they need `.env`, and previews go through Actions only (7.2.2).
- `vite.config.ts` keeps `target: 'es2022'`, `assetsInlineLimit: 0`, `sourcemap: false` and drops `chunkSizeWarningLimit`; `vitest.config.ts` and `tsconfig.json` stay unchanged (4.1.5).
- TypeScript 5.9.3 strict: `verbatimModuleSyntax` (type-only imports use `import type`), `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, `types: ["vite/client", "node"]`, target ES2022; `noUncheckedIndexedAccess` is not set; `include` is `src tests vite.config.ts vitest.config.ts`.
- `src/field/surface.ts` has zero `import` statements and only erasable TypeScript (no enums, namespaces or parameter properties), because `scripts/og-image.mjs` imports it through Node type stripping (4.10.2).
- No module touches `window`, `document`, `navigator` or `localStorage` at import time (only `src/main.ts`, the entry, runs code on load). Browser objects arrive as parameters or as defaults evaluated at call time, so Vitest can import every module in Node.

**Copy (spec 3.1.3; used verbatim; `&` is written `&amp;` in HTML)**
- Name (h1) `Parsa Naji` (title case, weight 700). Tagline `I build AI agents, apps, and the systems behind them.` Eyebrows `Experience`, `Projects`, `Education`, `Misc` (uppercase by CSS only).
- Experience rows (when · role · org): `2025 —` · `Software Developer` · `Koreex Systems`; `2026 —` · `AI Specialist / Developer` · `Expedient Labs`; `2025` · `Calculus Tutor` · `Saddleback College`. Open-ended dates carry the sr-only `to present`; the education range carries the sr-only `to` (Appendix C §1).
- Projects (name · what): `parsanaji.com` · `This site. WebGL2 dither field.`; `SolScope` · `Microcap cryptocurrency tracker.`; `Kaptur` · `Business expense tracker for trades.`; `Mafia` · `Family and friends game.`
- Education: `2025 — 2026` · `Saddleback College` · `Business Administration`.
- Misc tags, in order: `Agentic Workflows`, `Multi-Agent Orchestration`, `Prompt & Context Engineering`, `LLM Cost and Token Optimization`, `WebGL & shaders`, `iOS/macOS`, `Swift`.
- Links: `github` → `https://github.com/parsanaji` (`rel="me"`, `data-link="github"`); `say hi` → `mailto:info@parsanaji.com` with `data-email="info@parsanaji.com"` (a primary click copies the address); `linkedin` absent (an HTML comment) while `CONTENT.links.linkedin` is `''` (3.1.12). All links open in the same tab.
- Status: dot + `Building something new` (uppercase by CSS). Footer: `Irvine, CA` + ` · ` + the live time, written `2:36 PM PDT` (without JS: `Irvine, CA` only). "Copied" label: `copied`.
- Toggle: the word is the target look, `dark` while the light look shows and `light` while the dark look shows; `aria-label` `Switch to dark mode` / `Switch to light mode`; no `aria-pressed` (3.5.10, 5.1.4, 11.2).
- Live-region sentence `Email address copied.`; hint `#email-hint`: `Copies info@parsanaji.com to the clipboard.` (3.5.3).
- Overlay: title `Shortcuts`; rows `g` `GitHub`, `l` `LinkedIn` (hidden until LinkedIn exists), `e` `Copy email`, `?` `Show or hide this list`, `esc` `Close`; button `close` (3.5.5).
- Mask texts: entry `Parsa Naji`, Konami `nice.` (3.4.6, 3.4.11).
- Console line, the only production log, exactly: `console.log('%cParsa Naji — say hi: info@parsanaji.com', 'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0')` (3.5.7).
- Head: `<title>Parsa Naji</title>`; description = the tagline; `author` `Parsa Naji`; OG and Twitter image alt `Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.`; JSON-LD exactly `{"@context":"https://schema.org","@type":"Person","name":"Parsa Naji","url":"https://parsanaji.com/","jobTitle":["Software Developer","AI Specialist / Developer"],"sameAs":["https://github.com/parsanaji"]}` with no `email` key (5.2.1–5.2.3).
- OG image text: `Parsa Naji` (Bold 104 px, `#e8eeff`), the tagline wrapped as `I build AI agents, apps, and` / `the systems behind them.` (Regular 32 px, `#7993da`), `parsanaji.com` (Regular 26 px, `#7993da`) (4.10.5).

**Looks (spec 3.2.1).** Dark is the base `:root`; light applies under `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) … }` and again under `:root[data-theme="light"]`. No `--bg-scrim`, no `--copied`. `--line-strong: color-mix(in srgb, var(--fg) 28%, transparent)` stays as Appendix C writes it. Field colours are read at runtime from the computed CSS `--field-0..3`; TypeScript never hard-codes them (3.3.12).

| token | dark | light |
|---|---|---|
| `color-scheme` | `dark` | `light` |
| `--bg` | `#050a22` | `#f2f6fe` |
| `--scrim-solid` / `--scrim-mid` / `--scrim-clear` | `rgb(5 10 34 / 1)` / `rgb(5 10 34 / 0.86)` / `rgb(5 10 34 / 0)` | `rgb(242 246 254 / 1)` / `rgb(242 246 254 / 0.86)` / `rgb(242 246 254 / 0)` |
| `--fg` / `--fg-2` | `#e8eeff` / `#7993da` | `#071348` / `#445789` |
| `--accent` / `--accent-2` | `#8db0ff` / `#5b81ff` | `#2848d7` / `#3656e8` |
| `--accent-glow` | `rgb(141 176 255 / 0.35)` | `rgb(40 72 215 / 0.25)` |
| `--line` | `rgb(232 238 255 / 0.14)` | `rgb(7 19 72 / 0.14)` |
| `--field-0` / `--field-1` / `--field-2` / `--field-3` | `#050a22` / `#3b5df0` / `#8db0ff` / `#e8eeff` | `#f2f6fe` / `#8db0ff` / `#3b5df0` / `#0832b8` |
| `--focus-ring`, `--status-dot` | `var(--accent)` | same aliases |
| `--selection-bg` / `--selection-fg` | `#3b5df0` / `#ffffff` | `#3b5df0` / `#ffffff` |
| `--overlay-bg` / `--overlay-border` | `rgb(5 10 34 / 0.94)` / `rgb(232 238 255 / 0.18)` | `rgb(242 246 254 / 0.95)` / `rgb(7 19 72 / 0.18)` |
| `--theme-color` | `#050a22` | `#f2f6fe` |

- Exactly twelve `@property` registrations (`--bg`, `--fg`, `--fg-2`, `--accent`, `--accent-2`, `--accent-glow`, `--line`, `--scrim-solid`, `--scrim-mid`, `--scrim-clear`, `--overlay-bg`, `--overlay-border`), each `syntax: '<color>'; inherits: true; initial-value: <dark value>`; `html.theme-anim` transitions them 300 ms linear. `--field-0..3`, `--theme-color` and the aliases stay unregistered (4.6.4, 11.12).
- `theme-color` metas: `#f2f6fe` under `(prefers-color-scheme: light)`, `#050a22` under `(prefers-color-scheme: dark)`; `<meta name="color-scheme" content="light dark">` (3.2.9).

**Security, CSP and markup**
- SECURITY (spec 7.4.1, verbatim): "SECURITY: `.env` at the repo root holds the Cloudflare token: never read, print, grep, cat or stage it. Agents verify env only by key names." The Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` stay unchanged (7.4.2).
- `public/_headers` and `public/robots.txt` stay byte-for-byte unchanged (7.3.1, 5.2.4, 11.15). The CSP is `script-src 'self' https://static.cloudflareinsights.com`, `style-src 'self'`, `font-src 'self'`, `img-src 'self' data:` (4.6.1).
- No inline `<script>` except the JSON-LD data block; no `<style>` elements; no `style` attributes; scripts never write `el.style`, `setAttribute('style', …)` or inline styles. State changes go through classes and `data-*` attributes only (4.3.2, 5.2.5, 6.1.17).
- Scripts create no content nodes beyond the clock text, the toggle word, the "copied" state, the live-region sentence and the scramble frames (3.1.5). Every `init*` function tolerates a missing element by returning a no-op and never throws (4.3.1).
- Logging: production logs exactly the console line above and nothing at error or warning level; DEV logs at most one `console.warn` per failure (3.6.2, 4.7.6). Every promise is caught.

**Budgets (spec 6.1)**
- 6.1.1 production JS ≤ 60 KB gzip: `npm run build` with `VITE_PN_DEBUG` unset, then the level-9 gzip sum of `dist/assets/*.js` measured with the 8.1.4 command; 6.1.2 fonts ≤ 40 KB total; 6.1.3 exactly 2 WebGL draws per frame (one per pass); 6.1.4 DPR capped at 2; 6.1.5 `requestAnimationFrame` paused while the tab is hidden.
- 6.1.6 LCP ≤ 1.5 s on the no-entry path (reduced motion, `?noentry`, no WebGL2); 6.1.7 FCP ≤ 1.0 s on the entry path; 6.1.8 rail fully visible ≤ 3.0 s after the entry's t = 0 (designed 2.98 s); measured under DevTools "Fast 4G" in a fresh context.
- 6.1.9 CLS 0; 6.1.10 TBT < 100 ms; 6.1.11 Lighthouse Accessibility, Best Practices and SEO ≥ 95 on both paths, Performance ≥ 95 on `?noentry` (entry-path Performance recorded, not gated). Performance, TBT, LCP, FCP and CLS come from the Lighthouse CLI `npx --yes lighthouse@13.5.0`, three runs per configuration gated on the median (A5); Accessibility and Best Practices from `lighthouse_audit` on the preview; SEO ≥ 95 is gated on the local production build (`npm run build` + `npm run preview`) because Pages previews send `x-robots-tag: noindex`, and on the preview every SEO audit except `is-crawlable` passes (A6).
- 6.1.12 60 fps on Parsa's PC (mean frame interval ≤ 16.7 ms over 10 s of pointer movement, no task over 50 ms after the entry); 6.1.13 GPU time ≤ 2 ms median per frame at 1440×900 (`__pn.gpuTime(60)`); 6.1.14 zero console errors and warnings at 1440×900, 1280×720 and 390×844 in both looks; 6.1.16 no third-party requests except the cookieless Cloudflare beacon in production; LCP is never gamed (6.1.18).

**Fonts (R8)**
- JetBrains Mono 400 and 700 only (Geist is retired), self-hosted as `public/fonts/JetBrainsMono-Regular.subset.woff2` and `public/fonts/JetBrainsMono-Bold.subset.woff2`: printable ASCII U+0020–U+007E plus `·—–●○…’“”é`, `{ targetFormat: 'woff2', noLayoutClosure: true }`, hinting on; `font-display: swap`; both preloaded `as="font" type="font/woff2" crossorigin`; body text `font-variant-ligatures: none`, `font-kerning: none`, `font-synthesis: none` (3.1.8, 4.11).
- Every glyph a script writes (clock, scramble, "copied") is inside the subset; ICU's U+202F never reaches the page (3.5.13).

**Preview and debug builds**
- Preview `https://resume-screen.parsanaji-com.pages.dev`. Every push to `resume-screen` runs `deploy.yml` (`npm ci`, `npm test`, `npm run build`, `pages deploy dist --project-name=parsanaji-com --branch=resume-screen --commit-dirty=true`) (7.2.1). Only the slice-closing Tasks 8, 16, 22 and 24 push.
- `const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1'` lives in `src/main.ts` (4.12.1). From Task 16, CI sets `VITE_PN_DEBUG` to `1` on every ref except `main` and to `0` on `main` (7.3.2). PN_DEBUG is true on the dev server and on preview builds, false in production; a production build (`npm run build` with the variable unset) contains no `__pn`, no `src/debugHooks.ts` code, no `src/tweaks.ts` code and no `lil-gui`. `VITE_PN_DEBUG=1 npm run build && npm run preview` reproduces a preview build locally.
- `vite preview` ignores `public/_headers`: CSP and headers are checked on the Pages preview only (vault gotcha).

**Tests and evidence**
- Vitest runs in Node (`environment: 'node'`, `tests/**/*.test.ts`); there is no DOM. DOM-touching modules take their browser objects as parameters, so tests pass small fakes (Node 22 has `EventTarget`, `Event`, `structuredClone`, `performance`); timers use `vi.useFakeTimers()`; GL modules use fake `gl` objects. Anything needing real layout, canvas, fonts or WebGL is verified in the browser and recorded as evidence.
- Gate before every commit: `npm test` (record file and test counts), `npm run typecheck` (prints nothing), `npm run build` (succeeds). Vitest uses the `minimal` reporter when `CLAUDECODE` is set (no per-file ✓ lines): paste the real summary.
- Golden values in tests (checksums, coverage bands, grid tables, sizes) are literals taken from the spec or computed by running the task's own code before the plan text is final; never "paste the output later".
- Expected test counts are derived from the plan's test code; a different count alone is not a failure, a failing or missing test is.
- Cumulative `npm test` totals that the plan's test code gives (test files / tests): Tasks 1–2 8 / 32; Task 3 9 / 55; Task 4 10 / 61; Task 5 12 / 84; Task 6 13 / 98; Task 7 15 / 118; Task 8 16 / 134; Task 9 18 / 159 (`tests/motion.test.ts` and its 6 tests go); Task 10 20 / 173; Task 11 21 / 188; Task 12 23 / 207; Task 13 25 / 222; Task 14 26 / 236; Tasks 15–16 27 / 237 (`tests/appColors.test.ts`); Tasks 17–19 28 / 262; Task 20 29 / 274; Task 21 31 / 292; Tasks 22–24 33 / 306 (308 tests if Task 24 Step 5 runs).
- Output shapes: `npm run typecheck` prints only npm's two header lines (`> parsanaji.com@0.1.0 typecheck` and `> tsc --noEmit -p tsconfig.json`) and no diagnostics. With the `minimal` reporter a RED run prints ` FAIL  tests/<file> [ tests/<file> ]` and the error per file, then ` Test Files  N failed (N)` and `      Tests  no tests`; a GREEN run prints only ` Test Files  N passed (N)` and `      Tests  M passed (M)`.
- Evidence lives under `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-<N>/` (git-ignored by `.superpowers/sdd/.gitignore`); screenshots are named `<width>x<height>-<look>[-<state>].png` (8.3.3). Measured numbers go into the task report `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-<N>-report.md`.
- Screenshot set for user-visible tasks: 1440×900, 1280×720 and 390×844 in dark and light; layout tasks add 1366×768 and 768×1024 (8.3.3). Console check (8.2.1): 1440×900, 1280×720 and 390×844 in both looks, a fresh page each, zero error and warning messages.
- Browser procedure. Chrome DevTools MCP tools are deferred (`mcp__plugin_ecc_chrome-devtools__*`; load the ones a step names with ToolSearch `select:<names>` before the first call). Run `npm run dev` with the Bash tool's `run_in_background` (it prints `Local:   http://localhost:5173/`; use the port it prints); `vite preview` servers use 4173 or 4174. Use a fresh `new_page` with its own `isolatedContext` per check, set viewports only through `emulate` (`"1440x900x1"`, `"1280x720x1"`, `"390x844x3,mobile,touch"`), pass init scripts as the `navigate_page` `initScript`, and write DevTools `filePath` values in the absolute form `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-<N>/…`. Afterwards stop the background Bash task, then in PowerShell `Get-NetTCPConnection -LocalPort 5173,4173,4174 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }` (it also ends the leftover vite node child), and `close_page` every page you opened.

**DevTools gotchas (vault note `Projects/parsanaji.com.md`)**
- `resize_page` cannot go below 500 px wide: set every viewport with `emulate` (`viewport: "390x844x3,mobile,touch"`, `"1440x900x1"`).
- `emulate` has no prefers-reduced-motion or forced-colours option: override `window.matchMedia` in a `navigate_page` `initScript` before boot (this exercises the JS paths only); the CSS media blocks (`prefers-reduced-motion`, `forced-colors`, `print`) are checked by reading the stylesheet. Looks: `emulate` `colorScheme: "dark" | "light"`, or set `data-theme` from `evaluate_script`.
- `vite preview` ignores `_headers`.
- Chrome logs "preloaded but not used" font warnings on cached reloads only: run console checks in fresh contexts (`new_page` with a new `isolatedContext`).
- No request-blocking or JS-disable tool: exercise the 4 s CSS failsafe by setting `data-entry="run"` on `<html>` from `evaluate_script` and watching `[data-reveal]` reach computed opacity 1 after 4000 ms; check no-JS by serving a copy of `dist/` whose `index.html` has its `<script>` tags removed (`npx vite preview --outDir <copy>`).
- Hidden at load: `new_page` with `background: true`, wait, then `select_page`. Traces: `emulate` `networkConditions: "Fast 4G"`.
- WebGL readbacks: queue a `requestAnimationFrame` callback from `evaluate_script`; it runs after the app's frame and before compositing, so `readPixels` sees the frame without `preserveDrawingBuffer`. The dev server serves modules by path (`await import('/src/field/renderer.ts')`).

**Operator and environment**
- A GateGuard hook may deny the first Bash command, the first write to each new file, or a command containing destructive-looking text. State the facts it asks for (what the task asked, what the command or file does) and retry the same operation unchanged.
- `gh` 2.102.0 is installed at `C:\Program Files\GitHub CLI\gh.exe` and logged in as `parsanaji`. Start every Bash command that calls `gh` with `export PATH="$PATH:/c/Program Files/GitHub CLI"`.
- Parsa's parked operator items (2.4): the Cloudflare Email Routing verification click (then the controller runs `node scripts/cf-setup-email.mjs`), the CI token swap (`docs/OPERATOR.md` §6) and the LinkedIn URL. None blocks the branch. A step that needs one and does not have it stops at that step and reports it as parked; no task invents a URL, a token or a click.

## Review Focus

Most likely first. Each line names the input or condition, what a visitor should get, and the test that now pins it.

1. **Back from `github` (the back/forward cache restore).** The `github` link opens in the same tab, so Back is the usual way a visitor returns: the page comes back from the cache with the field resuming where it was, no fallback, no replayed entry and the clock current (3.7.3, 3.7.5). Pinned by Task 15 Step 9 item 12 on a local preview build.
2. **A slow connection where `main.ts` runs after the 4 s CSS failsafe has shown the rail.** The rail the visitor is already reading stays visible (never `data-entry="wait"`), no entry plays, and the field fades in under it (4.7.2, 11.7). Pinned by Task 18 Step 13.
3. **Shader programs that never finish compiling (a stalled or very slow driver) on the entry path.** About 3 s after the first frame the static fallback shows the rail; the pre-hidden rail never stays on a blank page (3.4.3, 3.6.2, 11.8). Pinned by Task 18 Step 14.
4. **Keydown events without a string `key` (synthetic events from extensions or autofill).** The Konami detector and the shortcuts ignore them and nothing reaches the console as an uncaught error (6.1.14, 4.3.1). Pinned by `tests/konami.test.ts` (Task 20 Step 1, with the guard of Index amendment A12) and `tests/shortcuts.test.ts` (Task 21 Step 1).
5. **A rail window about 720–790 px wide, where the scrim covers the whole field.** The Konami code is ignored instead of dimming the field around no text (3.4.11). Pinned by the `konamiMaskBox` cases of `tests/konami.test.ts` (Task 20 Step 1, Index amendment A11) and Task 20 Step 8 item 7.

## Execution Notes (Parsa's instructions)

- Builders are **Claude Opus 5.5** subagents (`model: "opus"`) at effort **`xhigh` for every task** (spec 7.1.2). One builder at a time, in task order; each task starts from the previous task's commit, because tasks share interfaces and files (`src/main.ts`, `src/app.ts`).
- An **Opus task reviewer** gates every task (spec compliance and code quality, with `reviewer-facts.md`). Important findings go back to the same builder as a fix round; the next task is dispatched only after the reviewer approves.
- The **controller is Fable 5.1**. It writes each task brief from this plan, dispatches builders and reviewers, reads their reports, ticks the checkboxes, appends the ledger `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/progress.md` and checkpoints. It writes no product code.
- Facts files for this run live in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/` (`builder-facts.md`, `reviewer-facts.md`). The controller derives them from the teaser's with these changes: branch `resume-screen`; this spec and plan; the teaser's `src/engine/defaults.ts` and Three.js budget lines replaced by this plan's Global Constraints; briefs at `task-<N>-brief.md`, reports at `task-<N>-report.md`, review diffs at `review-<base>..<head>.diff`.
- A slice ends when its closing task (8, 16, 22, 24) has committed and pushed, the Actions run on `resume-screen` is green and the preview evidence of 8.3 is recorded. The controller then appends the slice's ledger line, updates the vault note `Projects/parsanaji.com.md` and the memory file `parsanaji-com.md` with resumable state, and compacts (`/strategic-compact`) before dispatching the next slice. The checkboxes are the resumable state.
- Pushes go to `resume-screen` only and deploy previews. Production waits for Parsa: after Task 24 the **final whole-branch review runs on Fable**, then the controller sends Parsa the approval message of 7.5.2; only after his approval does the controller merge `resume-screen` into `main` and make the post-merge vault and memory update (7.6.3).
- Finish gates (8.3.5): the builders of Tasks 6, 8, 15 and 18 load the `frontend-design` skill; Task 23 runs the `anti-ui-slop` finish gate before slice 4 closes.
- Parsa is not watching the run. A ruling needed mid-run is recorded in the ledger as what / why / cost if wrong and never blocks on him, except the parked operator items and the 4.12.4 tuning values.
- Briefs: `bash "C:/Users/parsa/.claude/plugins/cache/claude-plugins-official/superpowers/6.4.1/skills/subagent-driven-development/scripts/task-brief" docs/superpowers/plans/2026-10-19-parsanaji-resume-screen.md N` (from the repo root) extracts exactly the body of Task N (the index entries are `#### Index entry — Task N` headings, which the extractor skips, and no slice heading sits between bodies). Global Constraints and the Index amendments reach builders through `builder-facts.md`, `reviewer-facts.md` and the dispatch (the facts-files bullet above); slice 4 repeats its browser conventions inside Tasks 23 and 24.

## File Structure

Every file the plan creates, modifies, moves or deletes. "Keep" files are listed only when a task depends on them staying untouched.

**Root and CI**
- `package.json` — Modify (Task 1): remove `three` and `@types/three`, add `harfbuzzjs 1.6.3` and `fontverter 2.0.0`, `engines.node >=22.18.0`, drop the `og:placeholder` script.
- `package-lock.json` — Modify (Task 1): regenerated by npm for those changes.
- `vite.config.ts` — Modify (Task 1): delete `chunkSizeWarningLimit: 700` and its comment.
- `vitest.config.ts`, `tsconfig.json` — Keep.
- `index.html` — Modify (Task 5: full rewrite, the résumé page and head); Task 24 adds the LinkedIn `<li>` and `sameAs` only if Parsa has given the URL.
- `README.md` — Modify (Task 23): one-line description, `npm run og` / `npm run fonts` recipes, measured budgets; Task 24 updates a Budgets row only when approved tuning changed it (A8).
- `.github/workflows/deploy.yml` — Modify (Task 16): the build step gets `VITE_PN_DEBUG` (7.3.2); nothing else changes.
- `docs/OPERATOR.md` — Modify (Task 24): §5 wording (7.6.2) and a new §7, the LinkedIn one-commit procedure (3.1.12).
- `.env`, `.env.example` — never touched.

**public/**
- `public/theme-boot.js` — Create (Task 5): pre-paint classic script; `data-theme` and `data-entry="run"` (4.6.2).
- `public/favicon.svg` — Modify (Task 4): PN monogram with its own `prefers-color-scheme` style (4.10.7).
- `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png` — Create (Task 4, generated by `npm run og`): dark-variant fallbacks (4.10.6).
- `public/og.png` — Modify (Task 4, regenerated): 1200×630 dither band, scrim and outlined text (4.10).
- `public/fonts/JetBrainsMono-Regular.subset.woff2`, `public/fonts/JetBrainsMono-Bold.subset.woff2` — Create (Task 2, generated by `npm run fonts`).
- `public/fonts/LICENSE.txt` — Modify (Task 2): becomes the JetBrains Mono OFL.
- `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2` — Delete (Task 2).
- `public/_headers`, `public/robots.txt` — Keep byte-for-byte.

**scripts/**
- `scripts/subset-fonts.mjs` — Modify (Task 2): JetBrains Mono jobs, charset, `noLayoutClosure`, OFL copy, the 40 KB check.
- `scripts/og-image.mjs` — Create (Task 4): OG image and the three favicon PNGs from `src/field/surface.ts`, harfbuzzjs outlines and sharp.
- `scripts/og-placeholder.mjs` — Delete (Task 1).
- `scripts/fonts-src/JetBrainsMono-Regular.woff2` (92,164 B), `scripts/fonts-src/JetBrainsMono-Bold.woff2` (94,588 B), `scripts/fonts-src/OFL.txt` (4,399 B) — Create (Task 2, from the v2.304 release zip).
- `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt` — Delete (Task 2).
- `scripts/cf-api.mjs`, `cf-env.mjs`, `cf-setup-email.mjs`, `cf-setup-pages.mjs` — Keep.

**src/ (entry and orchestration)**
- `src/main.ts` — Modify: Task 1 (interim), Task 8 (slice-1 boot), Task 15 (field gate, `App.start`, debug hooks), Task 16 (`?debug` panel), Tasks 18, 20, 21, 22 (entry takeover, Konami, shortcuts and overlay, greeting and scramble). Boot orchestration only (4.7).
- `src/app.ts` — Delete (Task 1, the teaser App); Create (Task 15); Modify (Tasks 18, 19, 20). `App`: field, models, loop, entry and Konami wiring, DOM state attributes.
- `src/content.ts` — Modify (Task 5): `CONTENT`, the JS copy of the facts scripts need.
- `src/loop.ts` — Create (Task 13): rAF loop, clamped dt, idle and wake.
- `src/lifecycle.ts` — Create (Task 13): visibility, pagehide/pageshow, resize, DPR, reduced-motion query, context loss.
- `src/debugHooks.ts` — Create (Task 15), Modify (Task 18): `window.__pn` (4.7.5), loaded only through a dynamic import behind PN_DEBUG.
- `src/tweaks.ts` — Delete (Task 1, the teaser panel); Create (Task 16): the debug panel (4.12).
- `src/vite-env.d.ts` — Modify (Task 15): `interface ImportMetaEnv { readonly VITE_PN_DEBUG?: string }` (4.1.6).
- `src/styles.css` — Modify (Task 6, full rewrite): `@property` block, tokens, fonts, layout, states (4.6.3).

**src/gl/** — Create (Task 12)
- `src/gl/context.ts` — WebGL2 context creation, never throws.
- `src/gl/program.ts` — parallel compile and link, uniform map, GLSL headers, `ShaderError`.
- `src/gl/targets.ts` — surface FBO, mask texture, fullscreen triangle.

**src/shaders/**
- `src/shaders/field.vert`, `src/shaders/field.frag`, `src/shaders/noise.glsl` (Ashima simplex) — Delete (Task 1).
- `src/shaders/fullscreen.vert`, `src/shaders/noise.glsl` (Blueprint hash, noise3, fbm), `src/shaders/surface.frag` (pass 1), `src/shaders/dither.frag` (pass 2) — Create (Task 14), exactly Appendix A §3.3–§3.6.

**src/field/**
- `src/field/surface.ts` — Create (Task 3): pure TS twin of the GLSL math; zero imports.
- `src/field/params.ts`, `src/field/sizing.ts`, `src/field/flow.ts` — Create (Task 9): `FieldParams` / `DEFAULT_FIELD`; cell size, grid, lattice unit, pointer radius, `BAND_QUERY`; intensity map and breath.
- `src/field/pointer.ts`, `src/field/ripples.ts` — Create (Task 10): `PointerModel`; `RipplePool` (Shockwave).
- `src/field/nameMask.ts` — Create by `git mv src/engine/sampler.ts src/field/nameMask.ts` then rewrite (Task 11): text → R8 coverage plane, mask boxes.
- `src/field/renderer.ts` — Create (Task 14): `DitherRenderer`, every GL object, two passes.
- `src/field/entry.ts` — Create (Task 17): `EntryMachine` (entry and Konami).

**src/theme/** — Create (Task 8)
- `src/theme/theme.ts` — pure theme logic, `ColorTween`, toggle labels, `RGB`, `FieldColors`.
- `src/theme/themeController.ts` — DOM: toggle, `matchMedia`, `data-theme`, `theme-color` metas, field colours from CSS.

**src/ui/**
- `src/ui/clock.ts` — Modify (Task 7): 12-hour `2:36 PM PDT`, minute-aligned.
- `src/ui/links.ts` — Create by `git mv src/ui/exitLine.ts src/ui/links.ts` then rewrite (Task 7): LinkedIn presence.
- `src/ui/emailCopy.ts` — Create (Task 7): "say hi" copy, live region, `mailto:` fallback.
- `src/ui/overlay.ts` — Create (Task 21): the `?` dialog.

**src/eggs/**
- `src/eggs/konami.ts` — Create (Task 20): the detector and `konamiMaskBox` (A11).
- `src/eggs/shortcuts.ts` — Create (Task 21).
- `src/eggs/scramble.ts`, `src/eggs/greeting.ts` — Create (Task 22).

**src/core/ and src/boot/**
- `src/core/prng.ts`, `src/core/easing.ts`, `src/core/time.ts` — Move (Task 1, `git mv` from `src/engine/`), unchanged.
- `src/core/quality.ts` — Move (Task 1, `git mv` from `src/engine/quality.ts`) and adapt: keep `capDpr` and `FpsProbe`, delete `WidthClass`, `COUNT_CAP`, `widthClass`, `dotCount`, `degradedCount`.
- `src/boot/fonts.ts` — Keep (`waitForFont`).
- `src/boot/webgl.ts` — Delete (Task 1).

**src/engine/** (gone after Task 11)
- `src/engine/ParticleField.ts`, `src/engine/defaults.ts` — Delete (Task 1).
- `src/engine/motion.ts` — Delete (Task 9; `breathScale` moves verbatim to `src/field/flow.ts`).
- `src/engine/sampler.ts` — Move to `src/field/nameMask.ts` (Task 11).
- `src/engine/types.ts` — Delete (Task 11, when its last importer `sampler.ts` moves).

**tests/**
- `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts` — Modify (Task 1): import paths `../src/core/…` only.
- `tests/quality.test.ts` — Modify (Task 1): path; drop the count cases; keep `capDpr` and `FpsProbe`.
- `tests/env.test.ts` — Modify (Task 1): Node floor 22.18; ICU, `fetch` and `process.loadEnvFile` cases kept (never loads `.env`).
- `tests/fonts.test.ts` — Keep.
- `tests/defaults.test.ts`, `tests/webgl.test.ts`, `tests/sampler.test.ts` — Delete (Task 1; successors `params.test.ts`, `glContext.test.ts`, `nameMask.test.ts`).
- `tests/motion.test.ts` — Delete (Task 9; the `breathScale` cases move to `flow.test.ts`).
- `tests/helpers/fakeCanvas.ts` — Modify (Task 11): imports from `src/field/nameMask.ts`; `measureText` gains `actualBoundingBoxAscent` / `actualBoundingBoxDescent` (with an option to omit them).
- `tests/surface.test.ts` — Create (Task 3).
- `tests/ogAsset.test.ts` — Create (Task 4).
- `tests/appColors.test.ts` — Create (Task 15): the crossfade interruption (A15).
- `tests/content.test.ts`, `tests/themeBoot.test.ts` — Create (Task 5); Task 24 modifies `tests/content.test.ts` only if its LinkedIn dry run fails the suite (A7).
- `tests/tokens.test.ts` — Create (Task 6).
- `tests/clock.test.ts` — Modify (Task 7); `tests/links.test.ts`, `tests/emailCopy.test.ts` — Create (Task 7).
- `tests/theme.test.ts` — Create (Task 8).
- `tests/params.test.ts`, `tests/sizing.test.ts`, `tests/flow.test.ts` — Create (Task 9).
- `tests/pointer.test.ts`, `tests/ripples.test.ts` — Create (Task 10).
- `tests/nameMask.test.ts` — Create (Task 11).
- `tests/glContext.test.ts`, `tests/program.test.ts` — Create (Task 12).
- `tests/loop.test.ts`, `tests/lifecycle.test.ts` — Create (Task 13).
- `tests/shaders.test.ts` — Create (Task 14).
- `tests/entry.test.ts` — Create (Task 17).
- `tests/konami.test.ts` — Create (Task 20).
- `tests/shortcuts.test.ts`, `tests/overlay.test.ts` — Create (Task 21).
- `tests/scramble.test.ts`, `tests/greeting.test.ts` — Create (Task 22).

**Outside the repo (not committed)**
- `C:/Users/parsa/Documents/Obsidian Vault/Projects/parsanaji.com.md` — Modify (Task 24: preview state, recipes, gotchas; the controller adds the post-merge state).
- Evidence and reports under `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/` (git-ignored).

## Slices

Each slice ends with: the full suite green, `npm run typecheck` clean, `npm run build` OK, the closing task's commit, a push to `resume-screen` that produces a green Actions run and a preview at `https://resume-screen.parsanaji-com.pages.dev`, a ledger line (controller), and, because every slice changes what a visitor sees, the browser evidence of 8.3 on the dev server and on the preview. Then the controller checkpoints and compacts (Execution Notes).

**Slice 1 — The static résumé (Tasks 1–8).** Retires the teaser engine and Three.js, ships JetBrains Mono, the surface math the OG script needs, the OG image and favicons, the résumé markup and head, the full stylesheet (both looks, rail and band layouts, entry and reduced-motion CSS), the clock, the LinkedIn presence rule, the email copy, the theme toggle and the boot. At the end the preview is a complete, deployable static site: rail content, both looks, toggle with persistence, live clock, links, "say hi" copy, head/SEO/JSON-LD, fonts, OG and favicons. There is no field yet: `main.ts` applies `html.no-webgl` on every load (canvas and scrim hidden) and removes `data-entry` at once.
- Task 1: Toolchain and teaser retirement
- Task 2: JetBrains Mono subsets
- Task 3: Surface math twin (`src/field/surface.ts`)
- Task 4: OG image and favicons
- Task 5: Markup, head and theme bootstrap
- Task 6: Stylesheet: tokens, layouts and states
- Task 7: Rail DOM modules: clock, LinkedIn presence, email copy
- Task 8: Theme logic, toggle and the slice-1 boot (closes the slice; first push)

**Slice 2 — The field (Tasks 9–16).** The pure field models, the name-mask rasteriser (the renderer's mask type and texture need it), the GL helpers, the loop and lifecycle, the shaders and two-pass renderer, the `App` that puts the field on screen with pointer repel and click Shockwave, resize, DPR, visibility, bfcache, context loss, fallbacks, FPS probe and the theme crossfade of the field, `window.__pn`, and the `?debug` panel with preview builds. At the end the preview shows the live field under the rail (no entry yet: the rail shows at once), and `?debug` tunes it.
- Task 9: Field parameters, sizing and flow
- Task 10: Pointer model and Shockwave pool
- Task 11: Name-mask rasteriser
- Task 12: WebGL2 context, programs and targets
- Task 13: Frame loop and page lifecycle
- Task 14: Shaders and the two-pass renderer
- Task 15: App: the live field
- Task 16: Debug panel and preview builds (closes the slice)

**Slice 3 — The entry and the eggs (Tasks 17–22).** The entry machine and the "field forms the name" entry with its DOM contract, skip and hidden-tab rules; every reduced-motion path; the Konami `nice.`; the `g`/`l`/`e`/`?`/`Escape` shortcuts and the overlay; the name scramble and the console line. At the end the preview is feature-complete.
- Task 17: Entry state machine
- Task 18: The entry on screen
- Task 19: Reduced motion
- Task 20: Konami "nice."
- Task 21: Keyboard shortcuts and the "?" overlay
- Task 22: Name scramble and console line (closes the slice)

**Slice 4 — Quality bar and handoff (Tasks 23–24).** Performance, Lighthouse, bundle and font numbers, the full cross-viewport fit and console pass on the preview, the `anti-ui-slop` gate, README; then OPERATOR.md, the LinkedIn procedure (applied only if Parsa has given the URL), the idle-field tuning values (only if Parsa has approved some), the vault note and the approval message.
- Task 23: Quality bar: budgets, Lighthouse, fit and README
- Task 24: Handoff: OPERATOR, LinkedIn, tuning, vault and the approval message (closes the slice)

## Task Index

The index is the contract the parallel body writers obey. Every type, constant and function that crosses a task boundary is defined in exactly one **Produces** entry; **Consumes** entries repeat the signature unchanged. Signatures are spec 4.3 verbatim unless marked with a plan note (P1–P11 below).

**Plan notes (additions and clarifications to spec 4.3; reviewers treat them as part of the plan, not as drift)**
- **P1** `FieldColors` is declared in `src/theme/theme.ts` (Task 8) and re-exported by `src/field/renderer.ts` (`export type { FieldColors } from '../theme/theme';`), because slice 1 ships the theme controller before the renderer exists. The shape is 4.3's.
- **P2** `LifecycleTarget.resize` takes an optional `deviceBox?: { w: number; h: number } | null`, which carries `devicePixelContentBoxSize` from the `ResizeObserver` entry to `App` (3.7.1). Spec 4.3 writes `resize(): void`.
- **P3** `App.start` calls `bindLifecycle(this, { win, doc, canvas })` (4.7.4 step 2); spec 4.2's "callers: main.ts" for `lifecycle.ts` is read as "reached from `main.ts` through `App.start`".
- **P4** Debug support that exists in every build but is used only by PN_DEBUG code: `DitherRenderer.gl`, `DitherRenderer.readSurface(out)`, `App.debug(): AppDebug`. `window.__pn` (4.7.5) is implemented in `src/debugHooks.ts`, loaded only by a dynamic import behind PN_DEBUG, so production carries none of it.
- **P5** `src/field/nameMask.ts` exports `MASK_FONT_FAMILY`, the 4.8.3 stack, so the app and the tests use one string.
- **P6** `Grid.cellCss` is the snapped CSS cell size `cellDev / dpr` (= `uCell`, 3.3.2.3); the requested size is `computeGrid`'s `cellCss` argument. `Grid.maskW = 2 × cols`, `Grid.maskH = 2 × rows`.
- **P7** `EntryMachine` and `entryProgress` accept 0 ms gather and dissolve phases (0 ms gather → `e = 1` at once; 0 ms dissolve → `e = 0` at once). The reduced-motion Konami jump (3.4.11) is a machine with `{ gatherMs: 0, holdMs: params.konami.holdMs, dissolveMs: 0 }`.
- **P8** Tests beyond spec 8.1: `tests/links.test.ts` (Task 7), `tests/lifecycle.test.ts` (Task 13), `tests/overlay.test.ts` (Task 21).
- **P9** Until Task 18, `takeEntryControl` removes `data-entry` at once and returns `false` (there is no entry machine yet), so the rail shows immediately. Until Task 15, `main.ts` applies the static fallback on every load without a DEV warning (the missing field is by design in slice 1).
- **P10** Old-engine files stay until their successor task so `git mv` history and the "moved verbatim" rules hold: `src/engine/motion.ts` and `tests/motion.test.ts` until Task 9; `src/engine/sampler.ts`, `src/engine/types.ts` and `tests/helpers/fakeCanvas.ts` until Task 11. Each still typechecks on its own after Task 1.
- **P11** `App.konami()` and `App.replayEntry()` exist from Task 15 as documented no-ops ("ignored until Task 20 / Task 18"), so the debug panel of Task 16 is final with all its buttons.

---

#### Index entry — Task 1: Toolchain and teaser retirement
- **Slice:** 1
- **Files:**
  - Modify: `package.json`, `package-lock.json` (via `npm uninstall three @types/three` and `npm install --save-dev --save-exact harfbuzzjs@1.6.3 fontverter@2.0.0`; then `engines.node` → `">=22.18.0"` and the `og:placeholder` script removed), `vite.config.ts`, `src/main.ts` (interim, below), `tests/env.test.ts`, `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts`, `tests/quality.test.ts`.
  - Move (`git mv`): `src/engine/prng.ts` → `src/core/prng.ts`; `src/engine/easing.ts` → `src/core/easing.ts`; `src/engine/time.ts` → `src/core/time.ts`; `src/engine/quality.ts` → `src/core/quality.ts` (then delete `WidthClass`, `COUNT_CAP`, `widthClass`, `dotCount`, `degradedCount`).
  - Delete: `src/app.ts`, `src/tweaks.ts`, `src/engine/ParticleField.ts`, `src/engine/defaults.ts`, `src/shaders/field.vert`, `src/shaders/field.frag`, `src/shaders/noise.glsl`, `src/boot/webgl.ts`, `scripts/og-placeholder.mjs`, `tests/defaults.test.ts`, `tests/webgl.test.ts`, `tests/sampler.test.ts`.
  - Keep untouched (P10 and later tasks): `src/engine/types.ts`, `src/engine/sampler.ts`, `src/engine/motion.ts`, `tests/motion.test.ts`, `tests/helpers/fakeCanvas.ts`, `src/ui/clock.ts`, `src/ui/exitLine.ts`, `tests/clock.test.ts`, `src/content.ts`, `index.html`, `src/styles.css`, `public/**`, `scripts/fonts-src/**`, `src/boot/fonts.ts`, `tests/fonts.test.ts`.
  - Interim `src/main.ts`, exactly: `// Task 1 interim boot: the teaser engine is retired; Task 8 writes the résumé boot.` / `document.documentElement.classList.add('no-webgl');` / `export {};`
- **Interfaces:**
  - Consumes: none.
  - Produces (moved, behaviour unchanged):
    - `src/core/prng.ts`: `mulberry32(seed: number): () => number` (uniform in [0, 1)); `seedFromLocation(search: string, fallback?: () => number): number` (`?seed=<finite>` → `n >>> 0`, else `fallback() >>> 0`, default `Date.now`).
    - `src/core/easing.ts`: `clamp01`, `easeOutExpo`, `easeInCubic`, `easeOutCubic`, each `(t: number) => number`.
    - `src/core/time.ts`: `clampDt(dtMs: number, maxMs?: number): number` (default 50; non-finite or ≤ 0 → `1000 / 60`).
    - `src/core/quality.ts`: `capDpr(devicePixelRatio: number, max?: number): number` (default 2; non-finite or ≤ 0 → 1); `class FpsProbe { constructor(windowFrames?: number, thresholdFps?: number); push(dtMs: number): 'pending' | 'keep' | 'degrade'; get done(): boolean }` (defaults 60 and 45; reports `'degrade'` at most once).
    - Kept in place: `src/boot/fonts.ts`: `type FontWaitResult = 'loaded' | 'timeout' | 'unavailable'`; `interface FontFaceSetLike { load(font: string): Promise<unknown> }`; `waitForFont(spec: string, timeoutMs: number, fonts?: FontFaceSetLike, schedule?: (fn: () => void, ms: number) => unknown): Promise<FontWaitResult>` (never rejects).
- **Spec:** 2.2.1, 2.2.2 (ParticleField, defaults, field shaders, simplex noise, boot/webgl), 2.2.3, 2.2.6, 2.2.7, 4.1.1–4.1.5, 4.2 (engine → core), 6.1.15, 8.1.18 (env floor, quality kept cases, retired test files); Appendix A §1.1–§1.4.
- **Tests:** `tests/env.test.ts` — runs on Node 22.18 or newer; full ICU for `America/Los_Angeles`; `fetch` and `process.loadEnvFile` exist. `tests/quality.test.ts` — `capDpr` caps at 2 and sanitises; `FpsProbe` pending until 60 frames, keeps at 60 fps, degrades once at 30 fps then keeps. `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts` — existing cases, new paths.
- **Evidence:** none (toolchain). Report: `npm ls --depth=0` (no `three`), the `npm run build` output, and a grep showing no `WebGLRenderer` in `dist/assets/*.js`.
- **Done when:** Three.js and the particle engine are gone from `package.json`, the lockfile and `dist/`, the four utilities live in `src/core/`, the suite is green, typecheck clean, the build succeeds, and the commit exists.

#### Index entry — Task 2: JetBrains Mono subsets
- **Slice:** 1
- **Files:**
  - Create: `scripts/fonts-src/JetBrainsMono-Regular.woff2`, `scripts/fonts-src/JetBrainsMono-Bold.woff2`, `scripts/fonts-src/OFL.txt` — extracted from `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip` (members `fonts/webfonts/JetBrainsMono-Regular.woff2`, `fonts/webfonts/JetBrainsMono-Bold.woff2`, `OFL.txt`) after downloading the zip into its own new, empty directory outside the repo; only those three members are extracted (Windows `tar -xf` reads zip); sizes 92,164 / 94,588 / 4,399 bytes.
  - Modify: `scripts/subset-fonts.mjs` (jobs Regular → `JetBrainsMono-Regular.subset.woff2`, Bold → `JetBrainsMono-Bold.subset.woff2`; text = printable ASCII U+0020–U+007E + `·—–●○…’“”é`; options `{ targetFormat: 'woff2', noLayoutClosure: true }`; copy `scripts/fonts-src/OFL.txt` to `public/fonts/LICENSE.txt`; keep the 40 KB total check with exit code 1).
  - Create (generated): `public/fonts/JetBrainsMono-Regular.subset.woff2`, `public/fonts/JetBrainsMono-Bold.subset.woff2`. Modify (generated): `public/fonts/LICENSE.txt`.
  - Delete: `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt`, `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2`.
- **Interfaces:**
  - Consumes: none.
  - Produces: the served font files `/fonts/JetBrainsMono-Regular.subset.woff2` (weight 400) and `/fonts/JetBrainsMono-Bold.subset.woff2` (weight 700), family name `JetBrains Mono` (consumed by Task 5 preloads and Task 6 `@font-face`); the full source fonts `scripts/fonts-src/JetBrainsMono-Bold.woff2` and `scripts/fonts-src/JetBrainsMono-Regular.woff2` (consumed by Task 4).
- **Spec:** 2.1.4, 2.2.4, 4.11.1–4.11.3, 6.1.2, 9.2, 9.17.
- **Tests:** none new (the script's budget check is the gate); full suite still green.
- **Evidence:** none in the browser. Report: the downloaded member sizes, and the `npm run fonts` output (about 12.0 KB + 12.1 KB, total ≤ 40 KB, exit code 0).
- **Done when:** both subsets and the OFL licence are in `public/fonts/`, Geist is gone from the repo, `npm run fonts` passes its budget, and the commit exists.

#### Index entry — Task 3: Surface math twin (`src/field/surface.ts`)
- **Slice:** 1
- **Files:** Create `src/field/surface.ts`, `tests/surface.test.ts`.
- **Interfaces:**
  - Consumes: none (the module has zero imports).
  - Produces (`src/field/surface.ts`):
    ```ts
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
    ```
  - Semantics later tasks rely on: `hash3` is the 3.3.5 Blueprint hash in 32-bit unsigned arithmetic with `z & 255`, returning `h / 2³²`; `fbm(x, y, z1, z2) = 0.62 × noise3(x, y, z1) + 0.38 × noise3(2.1x + 7.3, 2.1y + 1.7, z2)`; `flowZ` returns `[zA, 1.4zA + 3.1, zB, 1.4zB + 3.1, zC, 1.4zC + 3.1]` with `zA = 0.09 × tSec × intensity`, `zB = zA + 2`, `zC = 0.14 × tSec × intensity`, each wrapped to [0, 256) in double precision; `surface()` is `F`, 3.3.4 steps 3–6 at breath 1 with no pointer, mask or rings (`z[0..1]` warp-x, `z[2..3]` warp-y, `z[4..5]` main; lattice offset `NOISE_OFFSET`); `tierGrid` evaluates cell centres `((i + 0.5) × cellCss, (j + 0.5) × cellCss)` with row `j = 0` at the top, `z = flowZ(tSec, intensity)`, `v = min(1, surface + Σ ringGain)`, tiers by `tierOf` with the defaults, stored row-major at `j × cols + i`.
- **Spec:** 3.3.4, 3.3.5, 3.3.6.2, 3.3.8.2, 3.3.10, 4.10.2, 8.1.1, 9.11; Appendix A §3.1, §3.8, §9.1.
- **Tests:** `tests/surface.test.ts` — `hash3` bit-exact against the verbatim Blueprint hash on 1000 seeded integer triples; `noise3` periodic in z with period 256; range [0, 1); continuity across lattice faces; `flowZ` six values in [0, 256), equal to the raw formula mod 256, continuous across the wrap; `surface() ≤ 0.703125` over 10⁵ points and `max(surface + 0.12) < 0.9`; `BAYER8` equals the Blueprint array and is a permutation of 0–63; `bayerThreshold` in [1/128, 127/128]; `tierOf` strict `>` at 0.66 and 0.9; `tierGrid` deterministic with a golden FNV-1a checksum of the 200×105 grid (cell 6) at t = 12; coverage at 1440×900, cell 5 (288×180), t = 12: off 50–70 %, field-1 20–35 %, field-2 2–20 %, field-3 0 %; field-3 > 0 with a ring; the source file has no `import` statement.
- **Evidence:** none (pure module).
- **Done when:** the module matches every test above, Node can import it with type stripping (`node -e "import('./src/field/surface.ts').then(m => console.log(m.tierGrid(4, 2, 6, 12, 1).length))"` prints `8`), suite green, typecheck clean, committed.

#### Index entry — Task 4: OG image and favicons
- **Slice:** 1
- **Files:** Create `scripts/og-image.mjs`, `tests/ogAsset.test.ts`, `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png`; Modify `public/favicon.svg` (exactly the 4.10.7 bytes), `public/og.png` (regenerated). All PNGs are produced by `npm run og` and committed.
- **Interfaces:**
  - Consumes: Task 3 `tierGrid(cols: number, rows: number, cellCss: number, tSec: number, intensity: number, rings?: readonly Ring[]): Uint8Array`, called without rings (imported by the `.mjs` from `../src/field/surface.ts`; the OG still has no Shockwave ring, Index amendment A10); Task 2 `scripts/fonts-src/JetBrainsMono-Bold.woff2`, `scripts/fonts-src/JetBrainsMono-Regular.woff2`; Task 1 devDependencies `harfbuzzjs 1.6.3`, `fontverter 2.0.0`, `sharp 0.35.5`.
  - Produces: `/og.png` (1200×630 PNG, < 300 KB), `/favicon.svg`, `/favicon-32.png` (32×32), `/favicon-192.png` (192×192), `/apple-touch-icon.png` (180×180, no alpha), referenced by Task 5's head.
- **Spec:** 2.1.5, 3.2.7, 3.2.8, 4.10.1–4.10.8 (4.10.3 as amended: no ring, A10), 8.1.17, 11.10, 11.11, 11.21; Appendix A §7.2, Appendix B §5.1–§5.2.
- **Tests:** `tests/ogAsset.test.ts` — `public/og.png` is a 1200×630 PNG under 300 KB; `favicon-32.png` 32×32, `favicon-192.png` 192×192 and `apple-touch-icon.png` 180×180 are PNGs; the apple icon has no alpha channel (sharp metadata).
- **Evidence:** none in the browser. Report: the `npm run og` output and a visual check of `public/og.png` and the three PNGs (open them with the Read tool): name, two tagline lines and the domain over the dark dither band, the plain field band with no Shockwave ring (no field-3 cell; the only `#e8eeff` pixels are the name; A10), and the dark favicon tile; a copy of `public/og.png` saved as `evidence/task-4/og.png` for Parsa (A10). CI runs `ogAsset.test.ts` on Ubuntu: `package-lock.json` already lists `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64`.
- **Done when:** the four images and the SVG exist at the sizes above, the test passes, and the commit exists.

#### Index entry — Task 5: Markup, head and theme bootstrap
- **Slice:** 1
- **Files:** Modify `index.html` (full rewrite: head = Appendix C §5 with the two 5.2.1 changes; body = Appendix C §1 with the 3.1.4 changes), `src/content.ts` (full rewrite); Create `public/theme-boot.js` (exactly 4.6.2), `tests/content.test.ts`, `tests/themeBoot.test.ts`.
- **Interfaces:**
  - Consumes: Task 4 asset paths `/favicon-32.png`, `/favicon-192.png`, `/favicon.svg`, `/apple-touch-icon.png`, `https://parsanaji.com/og.png`; Task 2 font paths `/fonts/JetBrainsMono-Regular.subset.woff2`, `/fonts/JetBrainsMono-Bold.subset.woff2`.
  - Produces:
    ```ts
    // src/content.ts
    export const CONTENT: {
      readonly name: 'Parsa Naji'; readonly email: 'info@parsanaji.com'; readonly konamiText: 'nice.';
      readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string }; // linkedin '' until 3.1.12
      readonly clock: { readonly timeZone: 'America/Los_Angeles' };
    };
    ```
  - Produces (DOM contract, 4.3.2; every later task finds elements only through these hooks):
    - `<html lang="en">` state: `data-theme` (`light` | `dark`, absent = system) and `data-entry="run"`, both set before first paint by `/theme-boot.js` (storage key `pn.theme`); later states are owned by Tasks 8, 15 and 18.
    - `canvas.field[data-field][aria-hidden="true"]`; `div.scrim[aria-hidden="true"]`; `main.rail[data-rail]`.
    - `[data-reveal]` values 0–7: 0 `header.intro` and the toggle, 1 Experience, 2 Projects, 3 Education, 4 Misc, 5 `nav.links`, 6 `p.status`, 7 `p.place`.
    - `h1.name[data-name]`; `a.lnk[data-link="github"]`; `a.lnk[href="mailto:info@parsanaji.com"][data-email="info@parsanaji.com"]` containing `span.swap > span.swap-main` (`say hi`) and `span.swap-alt` (`copied`); `#email-hint[hidden]`.
    - `p.place[data-reveal="7"]` = `Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span>` (the `<time>` starts empty).
    - `button.theme-toggle[type="button"][data-theme-toggle][data-reveal="0"][hidden]` containing `span.theme-word[data-theme-word]` (empty); no `aria-label`, no `aria-pressed` in the HTML.
    - `dialog.keys[data-keys][aria-labelledby="keys-title"][closedby="any"]` with the `[data-key="linkedin"][hidden]` row and `button[data-keys-close]`.
    - `p.sr-only[data-live][role="status"][aria-live="polite"][aria-atomic="true"]`, present and empty.
    - `<script src="/theme-boot.js"></script>` directly after the viewport meta and before the stylesheet link; `<script type="module" src="/src/main.ts"></script>` last in `<body>`; the LinkedIn `<li>` stays an HTML comment.
- **Spec:** 2.1.1, 2.1.3, 2.2.5, 3.1.2–3.1.6, 3.1.12 (absence), 3.2.9 (metas), 3.4.7.2, 3.4.10 and 3.6.5 (bootstrap part), 3.5.3 and 3.5.5 (markup), 3.5.12, 3.6.1, 4.3.2, 4.6.1, 4.6.2, 5.1.1, 5.1.2, 5.1.6, 5.2.1–5.2.5, 8.1.11, 8.1.12, 11.13, 11.14, 11.22, 11.23.
- **Tests:** `tests/content.test.ts` — every 3.1.3 string appears in `index.html` (with `&amp;` for `&`); `href="mailto:info@parsanaji.com"` and `https://github.com/parsanaji` present; `<script src="/theme-boot.js">` before the stylesheet link; the only inline `<script>` is `type="application/ld+json"` and its JSON deep-equals 5.2.1 (no `email` key); no `style=` attribute; no `aria-pressed`; the toggle has `data-reveal="0"`; the `data-reveal` values are exactly 0–7; no `data-link="linkedin"` while `CONTENT.links.linkedin` is `''`; the HTML values equal `CONTENT`. `tests/themeBoot.test.ts` — runs `public/theme-boot.js` in `node:vm` with fake `document`, `localStorage`, `matchMedia` and `location`: stored `light` → `data-theme="light"` and `data-entry="run"`; stored garbage → no `data-theme`; reduced motion → no `data-entry`; forced colours → no `data-entry`; `?noentry` → no `data-entry`; a throwing `localStorage` → no exception; the file contains no `innerHTML` or `eval` and is under 500 bytes.
- **Evidence:** none (the page is styled and checked in Task 6; `main.ts` is still the Task 1 interim).
- **Done when:** `index.html` is the résumé page with the exact head, `CONTENT` matches 4.3, both tests pass, and the commit exists.

#### Index entry — Task 6: Stylesheet: tokens, layouts and states
- **Slice:** 1
- **Files:** Modify `src/styles.css` (full rewrite, in the 4.6.3 order: the 4.6.4 `@property` block and `html.theme-anim`; Appendix B §1.1 token blocks without `--bg-scrim` and `--copied`; Appendix C §2 with the replacements of 3.1.13 (band block under `BAND_QUERY`), 3.1.16 (toggle CSS), 3.3.7.8 (`touch-action: auto`), 3.4.7 (entry hooks) and 3.6.4 (reduced-motion block, after the entry hooks), plus `image-rendering: pixelated` on `.field` (4.5.9)); Create `tests/tokens.test.ts`.
- **Interfaces:**
  - Consumes: Task 5 DOM contract; Task 2 font files.
  - Produces (CSS contract the scripts rely on):
    - `html.no-webgl` hides `.field` and `.scrim`; in the band layout the rail's bottom padding becomes `40px + env(safe-area-inset-bottom, 0px)`.
    - `html.theme-anim` transitions the twelve registered tokens over 300 ms linear.
    - `.field` is `opacity: 0` until `html[data-field-ready]`, which fades it in over 400 ms linear.
    - The 3.4.7 entry block for `html[data-entry="run" | "wait" | "scrim" | "reveal" | "skip"]`, the 4000 ms `pn-failsafe` animation on `run`, and `--i` per `[data-reveal]`.
    - `a[data-copied]` swaps `say hi` for `copied` in the same cell with the brackets suppressed; `.theme-toggle[hidden] { display: none; }`.
    - Unregistered `--field-0..3` (6-digit hex) and `--theme-color` readable through `getComputedStyle(document.documentElement)`.
    - The band layout's media query is the literal `(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)` (exported as `BAND_QUERY` by Task 9).
- **Spec:** 3.1.1, 3.1.7–3.1.11, 3.1.13–3.1.17, 3.2.1–3.2.5, 3.2.6 (CSS side), 3.3.1 (canvas box), 3.3.7.8, 3.4.7 (CSS), 3.5.1, 3.5.2, 3.5.5 (CSS), 3.5.8, 3.5.9, 3.6.4 (CSS block), 3.6.5, 3.6.6, 3.6.7, 4.5.9, 4.6.3, 4.6.4, 4.11.4, 5.1.7–5.1.9, 8.1.10, 11.3, 11.4, 11.6, 11.9, 11.12, 11.16.
- **Tests:** `tests/tokens.test.ts` — `--field-0..3` are 6-digit hex in the dark base and in both light blocks with exactly the 3.2.1 values, and are not `@property`-registered; exactly the twelve `@property` rules of 4.6.4 exist, each `syntax: '<color>'`; `--bg-scrim` and `--copied` do not appear; light `--field-3` is `#0832b8`; the 3.6.4 reduced-motion block comes after the 3.4.7 entry block.
- **Evidence (8.2.13, 8.3.3, partial 8.2.11):** every page load uses `/?noentry` (the interim `main.ts` never removes `data-entry`). Rail fit at 1280×720, 1366×768, 1440×900, 1920×1080 and 2560×1440: `scrollingElement.scrollHeight === clientHeight`; every rail text rect (Range client rects) ends at or left of R; links, status and footer end left of S; the scrim alpha at the widest text pixel is ≥ 0.86 (3.1.10.1). Collapse steps at 1280×600, 1280×599, 1280×519 and 1280×470 (3.1.11); zoom equivalents 853×480 and 640×360 (5.1.8); 844×390 rail with both collapses (3.1.15). Band at 768×1024 and 390×844 with `no-webgl` removed by `evaluate_script`: the footer rests 24 px above the fade at the end of the scroll. Hover on `github`: link rects identical before and during hover (3.5.1). Screenshots at 1440×900, 1280×720, 390×844, 1366×768 and 768×1024 in dark and light (`emulate colorScheme`). Console clean. `frontend-design` skill loaded.
- **Done when:** the page renders both looks and both layouts with the measured fit of 3.1.17, the tokens test passes, the evidence is saved, and the commit exists.

#### Index entry — Task 7: Rail DOM modules: clock, LinkedIn presence, email copy
- **Slice:** 1
- **Files:** Modify `src/ui/clock.ts`, `tests/clock.test.ts`; Move `src/ui/exitLine.ts` → `src/ui/links.ts` (`git mv`, then rewrite); Create `src/ui/emailCopy.ts`, `tests/links.test.ts`, `tests/emailCopy.test.ts`.
- **Interfaces:**
  - Consumes: Task 5 DOM contract (`[data-link="linkedin"]`, `[data-key="linkedin"]`, `[data-email]`, `.swap`, `#email-hint`, `[data-live]`, `time[data-clock-time]`).
  - Produces:
    ```ts
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
    ```
  - Semantics: `formatClock` builds from `Intl.DateTimeFormat('en-US', …).formatToParts` (hour without a leading zero, two-digit minute, ASCII spaces only, `AM`/`PM`, short zone); `startClock` writes `${time} ${zone}` into the `<time>` and `datetime`, re-arms each write at `msToNextMinute(now()) + 25` ms, rewrites and re-arms on `visibilitychange` to visible (listener on `el.ownerDocument`), and is never a live region. `initEmailCopy` adds `aria-describedby="email-hint"`; an unmodified primary click calls `preventDefault()` and `trigger()`; modified and middle clicks keep `mailto:`; success sets `data-copied` for `holdMs` (default 1200, restarted by a second copy), clears `live`, writes `Email address copied.` on the next frame (`requestAnimationFrame` when it exists, else `setTimeout(…, 0)`) and clears it 3000 ms later; `'fallback'` calls `assign('mailto:info@parsanaji.com')` (default `location.assign`). Defaults for `clipboard` and `assign` are read at call time.
- **Spec:** 3.1.6, 3.1.12 (presence flag), 3.5.3, 3.5.13, 4.3.1, 5.1.5, 8.1.13, 8.1.14, 9.15, 11.22, 11.23, 11.27.
- **Tests:** `tests/clock.test.ts` — 14:36 PDT → `{ time: '2:36 PM', zone: 'PDT', datetime: '14:36' }`; midnight → `12:00 AM`; noon → `12:00 PM`; PST in winter; ASCII spaces only (never U+202F); `msToNextMinute`; `startClock` first write and re-arm at the next minute + 25 ms (fake timers, fake element). `tests/links.test.ts` — empty URL → `{ linkedin: false }` and nothing un-hidden; URL plus anchor → `true` and `[data-key="linkedin"]` un-hidden; URL without anchor → `false`; missing elements never throw. `tests/emailCopy.test.ts` — resolve → `'copied'`, `data-copied` cleared after 1200 ms, live region written then cleared after 3000 ms; a second copy within 1200 ms restarts the timer; reject → `'fallback'` and `assign('mailto:info@parsanaji.com')`; no clipboard → fallback; modified click keeps the native action; `aria-describedby` added.
- **Evidence:** none (pure modules; wired and verified in Task 8).
- **Done when:** the three modules pass their tests, `src/ui/exitLine.ts` is gone (moved), and the commit exists.

#### Index entry — Task 8: Theme logic, toggle and the slice-1 boot
- **Slice:** 1 (closes the slice; first push)
- **Files:** Create `src/theme/theme.ts`, `src/theme/themeController.ts`, `tests/theme.test.ts`; Modify `src/main.ts` (slice-1 boot, below).
- **Interfaces:**
  - Consumes: Task 7 `startClock(el: HTMLTimeElement, timeZone: string, now?: () => Date): () => void`, `initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }`, `initEmailCopy(link: HTMLAnchorElement, email: string, deps?: { clipboard?: Pick<Clipboard, 'writeText'>; assign?: (url: string) => void; holdMs?: number; live?: HTMLElement | null }): { trigger(): Promise<CopyResult>; dispose(): void }`; Task 5 `CONTENT` and the DOM contract; Task 6 CSS contract (`html.theme-anim`, `--field-0..3`, `--theme-color`).
  - Produces:
    ```ts
    // src/theme/theme.ts
    export type Theme = 'light' | 'dark';
    export type ThemePref = Theme | 'system';
    export const THEME_KEY = 'pn.theme';
    export type RGB = readonly [number, number, number]; // sRGB 0..1
    export interface FieldColors { f0: RGB; f1: RGB; f2: RGB; f3: RGB } // P1: declared here, re-exported by src/field/renderer.ts
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
    ```
    `start(to, nowMs)` tweens from the value sampled at `nowMs`; `parseHex` trims and accepts `#rrggbb`. `initTheme`'s `theme` and `colors` are getters that always return the current look and its field colours; it runs the 4.6.7 initial state and the 4.6.5 press steps (OS change while `'system'`: steps 1, 4, 5, 6, 7).
  - Produces (`src/main.ts` after Task 8; names and order binding for slice 2):
    1. Imports: `CONTENT` from `./content`; `initTheme` from `./theme/themeController`; `startClock` from `./ui/clock`; `initEmailCopy` from `./ui/emailCopy`; `initLinks` from `./ui/links`.
    2. `function devWarn(message: string): void` — `if (import.meta.env.DEV) console.warn(`[pn] ${message}`)`.
    3. `function safeStorage(win: Window): Storage | null` — `win.localStorage` inside try/catch, `null` on throw.
    4. `function applyFallback(doc: Document): void` — adds `no-webgl` to `<html>` and removes `data-entry`; logs nothing (P9).
    5. `function takeEntryControl(doc: Document): boolean` — removes `data-entry` and returns `false` (P9).
    6. `function boot(): void`, in order: `const doc = document; const win = window;` → `initLinks(CONTENT.links.linkedin, doc)` → `initEmailCopy` on `a[data-email]` (if present) with `{ live: doc.querySelector<HTMLElement>('[data-live]') }` → `startClock(time[data-clock-time], CONTENT.clock.timeZone)` then `[data-clock].hidden = false` (if both exist) → `initTheme({ doc, storage: safeStorage(win), systemDark: win.matchMedia('(prefers-color-scheme: dark)'), button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'), onChange: () => {} })` → `takeEntryControl(doc)` → `applyFallback(doc)` (no field until Task 15).
    7. Top level: `try { boot(); } catch (error) { devWarn(String(error)); applyFallback(document); }`.
- **Spec:** 1.4 (smart default), 2.1.3, 3.2.6, 3.2.9, 3.5.10, 3.5.11, 3.6.1, 3.6.2 (DOM part), 4.4.1, 4.6.5–4.6.7, 4.7.1 (slice-1 subset), 4.7.6, 5.1.4, 8.1.9, 11.2.
- **Tests:** `tests/theme.test.ts` — `readPref` (`'light'`, `'dark'`, garbage → `'system'`, throwing storage → `'system'`, `null` → `'system'`); `writePref('system')` removes the key; `writePref` never throws on a throwing storage; `resolveTheme`; `togglePref` collapses to `'system'` when the flip equals the OS look; `toggleLabel('dark')` = `{ word: 'light', label: 'Switch to light mode' }` and `toggleLabel('light')` = `{ word: 'dark', label: 'Switch to dark mode' }`; `parseHex` / `lerpRGB`; `ColorTween` midpoint at 150 ms, exact target at 300 ms, `active` false afterwards.
- **Evidence (slice-1 close; 8.2.1, 8.2.5 DOM part, 8.2.7, 8.2.11 copy part, 8.3):** on the dev server: the toggle flips `data-theme`, `localStorage['pn.theme']`, both `theme-color` metas, the word and the `aria-label`; pressing back to the OS look removes the key and restores `#f2f6fe` / `#050a22`; a reload with the stored look opposite the OS look paints the stored look in the first frame; "say hi" shows `copied` for 1.2 s and the live-region sentence; an init script making `writeText` reject navigates to `mailto:info@parsanaji.com`; Tab order github → say hi → toggle; the clock shows `h:mm AM|PM PDT|PST` and changes between 25 and 100 ms after a minute boundary (A9; spec 3.5.13 as amended); the no-JS copy of `dist/` shows the full rail in the first paint; setting `data-entry="run"` reveals the rail after 4000 ms. Console check at the three viewports in both looks; screenshots at the five layout viewports in both looks. Then `git push -u origin resume-screen`, `gh run watch` until green, and on the preview: console check at the three viewports in both looks, `curl -sI https://resume-screen.parsanaji-com.pages.dev/` shows the CSP header, no CSP violations, OG and favicon URLs return 200. `frontend-design` skill loaded.
- **Done when:** the preview serves the complete static résumé in both looks with a working toggle, clock, links and email copy, the console is clean on dev and preview, and the slice-1 commit is pushed.

#### Index entry — Task 9: Field parameters, sizing and flow
- **Slice:** 2
- **Files:** Create `src/field/params.ts`, `src/field/sizing.ts`, `src/field/flow.ts`, `tests/params.test.ts`, `tests/sizing.test.ts`, `tests/flow.test.ts`; Delete `src/engine/motion.ts`, `tests/motion.test.ts` (`breathScale` and its two cases move verbatim).
- **Interfaces:**
  - Consumes: Task 1 `capDpr(devicePixelRatio: number, max?: number): number`; Task 6 `src/styles.css` (the sizing test reads it).
  - Produces:
    ```ts
    // src/field/params.ts
    export type Density = 'sparse' | 'medium' | 'dense';
    export type Intensity = 'subtle' | 'medium' | 'lively';
    export interface FieldParams {
      density: Density;
      intensity: Intensity;
      flowSpeed: number;
      cell: { k: number; minCss: number; maxCss: number; densityK: Record<Density, number>; degradeK: number };
      shape: { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number };
      tiers: { t2: number; t3: number };
      breath: { amp: number; periodMs: number };
      staticTimeS: number;
      pointer: { radiusK: number; radiusSp: number; warpK: number; boost: number; lerp: number; riseMs: number; fallMs: number; velNorm: number; velRadiusGain: number };
      ripple: { max: number; lifeS: number; amp: number; speedSp: number; sigmaSp: number; gain: number };
      mask: { holdDim: number; ink: number; edge: number; meltPx: number; heightFrac: number; widthFrac: number; supersample: number; fontWeight: number };
      entry: { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number; revealAtMs: number; cleanupAtMs: number; skipMs: number };
      konami: { gatherMs: number; holdMs: number; dissolveMs: number };
      boot: { readyTimeoutMs: number; fontTimeoutMs: number; restoreTimeoutMs: number; resizeDebounceMs: number };
      probe: { frames: number; thresholdFps: number };
      theme: { crossfadeMs: number };
      scramble: { durMs: number; stepMs: number };
      copy: { holdMs: number };
    }
    export const DEFAULT_FIELD: FieldParams; // exactly spec 4.9
    export function cloneField(p: FieldParams): FieldParams; // structuredClone

    // src/field/sizing.ts
    export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';
    export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number } // P6
    export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number;
    export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid;
    export function latticeSpacing(fieldCssW: number): number; // clamp(w / 48, 8, 40)
    export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number; // min(w,h)*0.28 + 2*sp (before the speed widening)

    // src/field/flow.ts
    export const INTENSITY_K: Readonly<Record<Intensity, number>>; // { subtle: 0.55, medium: 1, lively: 1.7 }
    export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number; // INTENSITY_K[intensity] * flowSpeed
    export function breathScale(tMs: number, amp: number, periodMs: number): number; // moved verbatim from engine/motion.ts
    ```
  - Semantics: `cellCssFor` = `clamp(p.k × w, p.minCss, p.maxCss) × p.densityK[density] × (degrade ?? 1)`; `computeGrid` applies 3.3.2.2–3.3.2.4 (non-finite or ≤ 0 DPR → 1; `dpr = capDpr`; `cellDev = max(2, round(cellCss × dpr))`, +1 when odd and the raw DPR exceeds the cap; `deviceBox` used only when given, `dprRaw ≤ 2` and within 1 device px of `css × dpr` on both axes (A2), else `round(css × dpr)`; `cols = ceil(widthDev / cellDev)`, `rows = ceil(heightDev / cellDev)`).
- **Spec:** 3.1.1 (export), 3.3.2.1–3.3.2.5, 3.3.3, 3.3.6.1, 3.3.7.1 (base radius), 3.3.9, 3.3.11, 4.9, 4.9.1, 6.1.4, 8.1.3, 8.1.5, 8.1.16, 11.19, 11.20, 11.24; Appendix A §4.
- **Tests:** `tests/params.test.ts` — `DEFAULT_FIELD` deep-equals 4.9; `cloneField` is a deep copy; `ripple.max ≤ 8` and `tiers.t2 < tiers.t3`. `tests/sizing.test.ts` — `cellCssFor` at 390, 768, 1280, 1366, 1440, 1920 and 2560 per density; `computeGrid` for every row of Appendix A §4.2 and 3.3.2.5 (cellDev, cellCss, cols, rows, maskW, maskH); even `cellDev` when `dprRaw > 2`; `deviceBox` preferred at `dprRaw ≤ 2`, ignored when it disagrees with `css × dpr` by more than 1 px (DevTools DPR emulation, A2) and ignored above `dprRaw` 2; a 0 × 0 canvas gives a 1 × 1 grid; non-finite DPR → 1; `latticeSpacing` 8 at 300, 30 at 1440, 40 at 2000; `pointerRadius(1440, 900)` = 312 and `pointerRadius(390, 236.32)` = 82.42 (2 decimals); `BAND_QUERY` equals the 3.1.1 string and appears verbatim in `src/styles.css`. `tests/flow.test.ts` — the two `breathScale` cases kept from `motion.test.ts`; `INTENSITY_K`; `effectiveIntensity({ intensity: 'lively', flowSpeed: 2 })` = 3.4.
- **Evidence:** none (pure modules).
- **Done when:** the three modules pass their tests, `src/engine/motion.ts` and its test are gone, and the commit exists.

#### Index entry — Task 10: Pointer model and Shockwave pool
- **Slice:** 2
- **Files:** Create `src/field/pointer.ts`, `src/field/ripples.ts`, `tests/pointer.test.ts`, `tests/ripples.test.ts`.
- **Interfaces:**
  - Consumes: Task 9 `FieldParams['pointer']`, `FieldParams['ripple']`; Task 1 `easeOutCubic: (t: number) => number`, `clamp01: (t: number) => number`.
  - Produces:
    ```ts
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
    ```
  - Semantics: `move` and `down` set the strength target to 1, `release` to 0; strength moves linearly toward the target at `dt / riseMs` and `dt / fallMs` and is output through `easeOutCubic`; the ease is `p += (raw − p) × (1 − (1 − lerp)^(dt / 16.667))`. `write` packs `(x, y, speedSp × sp × age, amp × (1 − age / lifeS))` per slot into an `out` of length 32 and expires rings at `age ≥ lifeS`.
- **Spec:** 3.3.7.3–3.3.7.6, 3.3.8.1, 3.3.8.3, 8.1.6.
- **Tests:** `tests/pointer.test.ts` — ease frame-rate independent (position after 1 s at 30, 60 and 120 fps within 1 %); strength reaches 1 at 200 ms and 0 at 600 ms after `release()`; touch `down` snaps; `velFactor` saturates at 1500 px/s; `settled` semantics. `tests/ripples.test.ts` — spawn; a 9th ring drops the oldest; `write` packs `(x, y, 9·sp·age, 1.2·(1 − age/3.2))` and zeroes unused slots; returns the active count; expiry at 3.2 s; `clear()`; `count`.
- **Evidence:** none (pure modules).
- **Done when:** both modules pass their tests and the commit exists.

#### Index entry — Task 11: Name-mask rasteriser
- **Slice:** 2
- **Files:** Move `src/engine/sampler.ts` → `src/field/nameMask.ts` (`git mv`, then rewrite per 4.8); Modify `tests/helpers/fakeCanvas.ts`; Create `tests/nameMask.test.ts`; Delete `src/engine/types.ts` (`src/engine/` is then gone).
- **Interfaces:**
  - Consumes: Task 9 `FieldParams['mask']`.
  - Produces (`src/field/nameMask.ts`):
    ```ts
    export interface Context2DLike {
      font: string; textBaseline: string; textAlign: string; fillStyle: string;
      letterSpacing?: string;
      clearRect(x: number, y: number, w: number, h: number): void;
      fillText(text: string, x: number, y: number): void;
      measureText(text: string): { width: number; actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number };
      getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
    }
    export interface Canvas2DLike { width: number; height: number; getContext(type: '2d'): Context2DLike | null }
    export type CanvasFactory = (w: number, h: number) => Canvas2DLike;
    export const MASK_FONT_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; // P5
    export interface MaskBox { x: number; y: number; w: number; h: number } // field-space CSS px
    export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number } // supersample = 2
    export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }
    export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number;
    export function rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane;
    export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array;
    export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox;
    // entry: whole field; konami: whole field when band, else { x: scrimRight, y: 0, w: field.w - scrimRight, h: field.h }
    ```
    `rasterizeMask` returns a plane of `grid.supersample × cols` by `grid.supersample × rows` texels covering the whole field (one texel = `cellCss / supersample` CSS px); `grid.cellCss` is `Grid.cellCss` (P6). Font string `${weight} ${size}px ${family}`; text centred on the box by its ink box (4.8.4; fallback ascent `0.73 × size`, descent 0).
  - Produces (`tests/helpers/fakeCanvas.ts`): `createFakeCanvasFactory(opts?: { charWidthEm?: number; capHeightEm?: number; nativeLetterSpacing?: boolean; boundingBox?: boolean }): { factory: (width: number, height: number) => Canvas2DLike; contexts: FakeContext[] }` where `boundingBox` (default true) controls whether `measureText` reports `actualBoundingBoxAscent` / `actualBoundingBoxDescent`; each `FakeContext.fillTextCalls` entry also records the `font` string (A13).
- **Spec:** 3.4.6, 3.4.11 (mask boxes), 4.8.1–4.8.5, 8.1.8, 8.1.18 (fakeCanvas), 9.14, 11.17, 11.31.
- **Tests:** `tests/nameMask.test.ts` — `fitFontPx` picks `0.4·h` when height-limited and `0.84·w·100/widthAt100` when width-limited; plane size `2·cols × 2·rows`; ink centre within one texel of the box centre (fake canvas); `alphaPlane` extracts byte 3 of each pixel; the phone band box; fallback ascent `0.73 × size` when `actualBoundingBox*` is absent; the font string uses `MASK_FONT_FAMILY` at weight 700; `maskBoxFor('entry', …)` is the whole field; `maskBoxFor('konami', { w: 1440, h: 900 }, 950, false)` = `{ x: 950, y: 0, w: 490, h: 900 }`; `maskBoxFor('konami', { w: 390, h: 236 }, null, true)` = the whole band.
- **Evidence:** none (pure module).
- **Done when:** `nameMask.ts` replaces `sampler.ts` in history, `src/engine/` no longer exists, the tests pass, and the commit exists.

#### Index entry — Task 12: WebGL2 context, programs and targets
- **Slice:** 2
- **Files:** Create `src/gl/context.ts`, `src/gl/program.ts`, `src/gl/targets.ts`, `tests/glContext.test.ts`, `tests/program.test.ts`.
- **Interfaces:**
  - Consumes: none.
  - Produces:
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
    ```
    `startProgram` binds attribute 0 to `aPos` before linking; `ready()` polls `COMPLETION_STATUS_KHR` when `parallel` is given and is `true` without it; `finish()` checks compile and link status once and throws `ShaderError` with the info log. `createMaskTexture` uploads with `UNPACK_ALIGNMENT 1` and no FLIP_Y or PREMULTIPLY_ALPHA (4.5.7). The triangle is `[-1, -1, 3, -1, -1, 3]`, `STATIC_DRAW`.
- **Spec:** 3.6.2 (context attributes, compile and link errors), 4.5.1, 4.5.2, 4.5.7, 4.7.4 step 5, 8.1.15 (glContext, program), 9.6, 9.10; Appendix A §3.3, §3.9.
- **Tests:** `tests/glContext.test.ts` — a context is returned; `null` is returned as `null`; a throwing `getContext` gives `null`; it requests `'webgl2'` with `GL_ATTRIBUTES`; `GL_ATTRIBUTES` is the exact object; the four `targets.ts` cases the renderer relies on (an incomplete FBO throws and cleans up, `deleteSurfaceTarget`, the R8 mask upload without FLIP_Y or PREMULTIPLY, the fullscreen triangle) also live here (A13). `tests/program.test.ts` (fake gl) — `uniformMap` strips `[0]`; a compile failure becomes a `ShaderError` carrying the info log on `finish()`; a link failure likewise; `ready()` is true without the extension and polls `COMPLETION_STATUS_KHR` with it; the header constants are exact.
- **Evidence:** none (pure modules with fake gl).
- **Done when:** the three modules pass their tests and the commit exists.

#### Index entry — Task 13: Frame loop and page lifecycle
- **Slice:** 2
- **Files:** Create `src/loop.ts`, `src/lifecycle.ts`, `tests/loop.test.ts`, `tests/lifecycle.test.ts`.
- **Interfaces:**
  - Consumes: Task 1 `clampDt(dtMs: number, maxMs?: number): number`.
  - Produces:
    ```ts
    // src/loop.ts
    export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }
    export function createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop;
    // onFrame returns false to idle; wake() schedules one frame; dt = clampDt(now - last); start() resets last

    // src/lifecycle.ts
    export interface LifecycleTarget {
      pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void; // P2
      reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
    }
    export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void;
    ```
  - Semantics: `running` is true from `start()` until `stop()`, including while idle; `wake()` is a no-op while stopped; the first frame after `start()` gets `dt = clampDt(0)`. `bindLifecycle` reads every browser API from `env` (`env.win.matchMedia`, `env.win.ResizeObserver`, `env.win.devicePixelRatio`, `env.doc.visibilityState`), never from globals, and tolerates a missing `ResizeObserver`. It wires: `visibilitychange` → `pause()` / `resume()`; `pagehide` → `pause()`; `pageshow` with `persisted` → `resume()`; canvas `webglcontextlost` → `preventDefault()` then `contextLost()`; `webglcontextrestored` → `contextRestored()`; `(prefers-reduced-motion: reduce)` change → `reducedChanged(matches)`; `(resolution: <dpr>dppx)` change → `dprChanged()`, re-armed with the new DPR; a `ResizeObserver` on the canvas (`{ box: 'device-pixel-content-box' }` when supported) → `resize(deviceBox)` from `devicePixelContentBoxSize[0]` (`inlineSize`, `blockSize`) or `null`. The returned function removes every listener and disconnects the observer.
- **Spec:** 3.6.3 (event plumbing), 3.7.1 (observer), 3.7.2, 3.7.3, 3.7.4, 3.7.5, 6.1.5, 8.1.15 (loop).
- **Tests:** `tests/loop.test.ts` (fake rAF) — dt clamped to 50 ms; `start()` after `stop()` resets the timestamp (no catch-up); `onFrame` returning `false` idles (no further rAF); `wake()` runs exactly one frame; `wake()` while stopped does nothing; `stop()` cancels; `running`. `tests/lifecycle.test.ts` (EventTarget fakes) — hidden → `pause`, visible → `resume`; `pagehide` → `pause`; `pageshow` persisted → `resume`, not persisted → nothing; context lost → `preventDefault` + `contextLost`; restored → `contextRestored`; reduced-motion change → `reducedChanged(true/false)`; resolution change → `dprChanged` and re-armed; observer callback → `resize(deviceBox)`; missing `ResizeObserver` tolerated; unbind removes every listener.
- **Evidence:** none (pure modules with fakes).
- **Done when:** both modules pass their tests and the commit exists.

#### Index entry — Task 14: Shaders and the two-pass renderer
- **Slice:** 2
- **Files:** Create `src/shaders/fullscreen.vert`, `src/shaders/noise.glsl`, `src/shaders/surface.frag`, `src/shaders/dither.frag` (exactly Appendix A §3.3–§3.6, no `#version` in the files), `src/field/renderer.ts`, `tests/shaders.test.ts`.
- **Interfaces:**
  - Consumes: Task 12 `GL_ATTRIBUTES`, `createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs?: WebGLContextAttributes): WebGL2RenderingContext | null`, `GLSL_HEADER_FRAG`, `GLSL_HEADER_VERT`, `ProgramHandle`, `PendingProgram`, `ShaderError`, `startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram`, `SurfaceTarget`, `createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget`, `createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture`, `createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer }`, `deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void`; Task 9 `FieldParams`, `Grid`; Task 11 `MaskPlane`; Task 8 `RGB`, `FieldColors`; Task 3 `NOISE_OFFSET`, `BAYER8` (test only).
  - Produces (`src/field/renderer.ts`):
    ```ts
    export const UNIFORMS_PASS1: readonly string[]; // uCell uZ uZm uCenter uBreath uPointer uWarp uRipples uRipple uMask uMaskSize uE uMaskMix uShape uLevel
    export const UNIFORMS_PASS2: readonly string[]; // uSurf uCellDev uCanvasH uField0 uField1 uField2 uField3 uTiers
    export type { FieldColors } from '../theme/theme'; // P1
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
      get gl(): WebGL2RenderingContext | null; // P4; null after dispose()
      readSurface(out: Uint8Array): boolean;   // P4; readPixels of the pass-1 target (cols × rows × 4 bytes, RGBA) after render(); false when not ready, lost or disposed
    }
    ```
  - Semantics: pass-1 texel `(i, j)` is `gl_FragCoord.xy` with row `j = 0` the top field row, so `readSurface` byte `(j × cols + i) × 4` is cell `(i, j)` with `.r = round(255 × v)`. `ready` polls both programs (inside an animation frame when the extension is absent), finishes them once, and on a `ShaderError` sets `failed`; `resize` sets `canvas.width/height`, recreates the target only when `cols` or `rows` change, sets the on-change uniforms, and sets `failed` when the FBO is incomplete; `setParams` writes `uWarp`, `uRipple.y`, `uMaskMix`, `uShape`, `uLevel`, `uTiers`; `setMask(null)` deletes the mask texture; `restore()` rebuilds programs, VAO, target and mask after `webglcontextrestored`.
- **Spec:** 3.3.4 and 3.3.5 (GLSL), 3.3.7.2, 3.3.8.2, 3.3.10, 3.3.12, 3.4.4, 3.4.5 (GLSL), 3.7.8 (`clear`), 4.5.1–4.5.8, 4.5.10, 8.1.2, 9.9, 10.2; Appendix A §3.2–§3.9.
- **Tests:** `tests/shaders.test.ts` — hash constants (374761393, 668265263, 1013904223, 1274126177, 13, 16, `& 255u`) match `surface.ts`; the `BAYER8` literal in `dither.frag` equals `BAYER8`; `OFFSET = 256.0` equals `NOISE_OFFSET`; the uniforms declared in each pass equal `UNIFORMS_PASS1` / `UNIFORMS_PASS2`; no `#version` in the files; every `smoothstep` has ascending edges; no `pow(`.
- **Evidence:** compile and link check on the dev server: `evaluate_script` imports `/src/field/renderer.ts` and `/src/field/params.ts`, creates a renderer on a fresh 64×64 canvas with `DEFAULT_FIELD`, polls `ready` once per animation frame until it is true or `failed`; record `ready === true`, `failed === false`, and a clean console.
- **Done when:** the shaders compile and link in Chrome, the test passes, and the commit exists.

#### Index entry — Task 15: App: the live field
- **Slice:** 2
- **Files:** Create `src/app.ts`, `src/debugHooks.ts`, `tests/appColors.test.ts`; Modify `src/main.ts` (slice-2 boot, below), `src/vite-env.d.ts` (`interface ImportMetaEnv { readonly VITE_PN_DEBUG?: string }`).
- **Interfaces:**
  - Consumes: Task 14 `DitherRenderer` (all members above), `FrameInputs`, `UNIFORMS_PASS1`; Task 13 `createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop`, `Loop`, `LifecycleTarget`, `bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void`; Task 10 `PointerModel`, `PointerKind`, `RipplePool`; Task 9 `FieldParams`, `DEFAULT_FIELD`, `cloneField(p: FieldParams): FieldParams`, `Grid`, `cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number`, `computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid`, `latticeSpacing(fieldCssW: number): number`, `pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number`, `effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number`, `breathScale(tMs: number, amp: number, periodMs: number): number`; Task 8 `RGB`, `FieldColors`, `ColorTween`, `initTheme`, and the slice-1 `main.ts`; Task 3 `flowZ(tSec: number, intensity: number, out?: Float32Array): Float32Array`, `surface(xCss: number, yCss: number, z: ArrayLike<number>, s?: SurfaceShape): number`, `tierOf(v: number, i: number, j: number, t2?: number, t3?: number): 0 | 1 | 2 | 3` (debug hooks); Task 1 `FpsProbe`, `seedFromLocation(search: string, fallback?: () => number): number`.
  - Produces (`src/app.ts`, public):
    ```ts
    export interface AppOptions {
      canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
      entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
    }
    export interface AppDebug {                          // P4
      readonly renderer: DitherRenderer;
      readonly params: FieldParams;
      lastFrame(): FrameInputs | null;                   // inputs of the last render
      setFrozen(frozen: boolean): void;                  // freezes sim time and τ (panel "freeze time")
    }
    export class App implements LifecycleTarget {
      static start(o: AppOptions): App | null;
      setColors(c: FieldColors, animate: boolean): void; // 300 ms ColorTween when animate, started at the next frame's timestamp (A3) from the colours on screen (A15)
      konami(): void;                                    // P11: no-op until Task 20
      replayEntry(): void;                               // P11: no-op until Task 18
      applyParams(): void;                               // debug panel live update (regrid when cell or density changed)
      onFallback(fn: () => void): void;
      get grid(): Grid | null;                           // debug hook
      debug(): AppDebug;                                 // P4
      dispose(): void;
      pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void;
      reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
    }
    ```
  - Produces (`src/app.ts` internals at the end of slice 2; names binding for Tasks 18–20, which replace or extend them):
    - `private constructor(o: AppOptions, renderer: DitherRenderer)` (only `App.start` constructs).
    - Fields: `o: AppOptions`; `params: FieldParams` (`=== o.params`, mutated by the panel); `renderer: DitherRenderer`; `loop: Loop` (`createLoop((dt, now) => this.frame(dt, now))`); `pointer: PointerModel`; `ripples: RipplePool`; `tween: ColorTween` (`set(o.colors)` at start); `probe: FpsProbe | null`; `gridValue: Grid | null`; `rect: { left: number; top: number; width: number; height: number }`; `simMs: number`; `tau: number`; `frozen: boolean`; `reduced: boolean` (`o.reduced`, updated by `reducedChanged`; no other effect until Task 19); `degrade: number` (1, or `params.cell.degradeK`); `programsReady: boolean`; `firstFrameMs: number | null`; `restoreTimer: ReturnType<typeof setTimeout> | null`; `disposed: boolean`; `fallbackFns: (() => void)[]`; `unbinds: (() => void)[]`; `zBuf: Float32Array` (6); `rippleBuf: Float32Array` (32); `last: FrameInputs | null`; `pendingColors: FieldColors | null` (Index amendment A3: the colours a `setColors(c, true)` hands to the next frame, whose timestamp starts the tween). Private helpers no later hunk touches: `measure()` (caches `rect` from `getBoundingClientRect()`), `armRestore()` (the 3000 ms restore timer), `bindPointer()` (the window pointer listeners), and the module constants `NO_RIPPLE` (the 3.3.8 selector) and `kindOf` (`PointerEvent` → `PointerKind`).
    - `private frame(dtMs: number, nowMs: number): boolean` — 4.4.3 order: advance `simMs` and `tau` (`+= dt / 1000 × effectiveIntensity(params)`) unless frozen; `pointer.tick`; `ripples.write(simMs / 1000, sp, rippleBuf)`; `e = this.stepMask(dt, visible)`; `colors = tween.sample(nowMs)`; `renderer.render(…)` with `z: flowZ(tau, 1, zBuf)`, `breath: breathScale(simMs, …)`, `center: [w / 2, h / 2]`, `pointer.radius = pointerRadius(…) × (1 + velRadiusGain × velFactor)`, `rippleSigma: sigmaSp × sp`; probe push; returns `!this.idle()`. Before `programsReady` it polls `renderer.ready`, calls `fail()` on `renderer.failed` or 3000 ms (`params.boot.readyTimeoutMs`) after `firstFrameMs`, and calls `onProgramsReady()` once ready.
    - `private stepMask(_dtMs: number, _visible: boolean): number` — returns 0; the underscores keep `noUnusedParameters` quiet until Task 18 replaces the method (Task 18 drives the entry and Konami machines).
    - `private onProgramsReady(): void` — sets `data-field-ready` on `<html>` and starts the FPS probe (Task 18 adds the entry branch; Task 19 skips the probe under reduced motion).
    - `private idle(): boolean` — returns `false` (Task 19 implements the 3.6.4 idle condition).
    - `private regrid(deviceBox?: { w: number; h: number } | null): void` — measures the canvas box, `cellCssFor` × `degrade`, `computeGrid`, `renderer.resize`, caches `rect` (Task 18 adds the 150 ms mask re-raster debounce).
    - `private spawnAllowed(e: PointerEvent): boolean` — 3.3.8 rules: `isPrimary`, `button === 0`, target not inside `a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]`, point inside `rect` (Task 19 adds "not reduced").
    - `private fail(): void` — once: stop the loop, run `unbinds`, `renderer.dispose()`, call every `fallbackFns` entry.
  - Produces (`src/debugHooks.ts`, P4):
    ```ts
    export interface ParityReport { maxErr255: number; tierMismatchPct: number; cells: number }
    export interface GpuTimeReport { medianMs: number; p90Ms: number; frames: number }
    export interface PnHooks {
      parity(): ParityReport | null;                          // null when the renderer is not ready
      gpuTime(frames: number): Promise<GpuTimeReport | null>; // null without EXT_disjoint_timer_query_webgl2; samples until `frames` results (at most 3 × frames tries)
      grid(): Grid | null;
    }
    export function installDebugHooks(app: App, win: Window): PnHooks; // sets win.__pn and returns it
    ```
    `parity()` renders one frame from `lastFrame()` with `breath: 1`, pointer strength 0, zeroed ripples and `maskE: 0`, reads it with `readSurface`, and compares each cell with `surface((i + 0.5) × cellCss, (j + 0.5) × cellCss, z, params.shape)` and `tierOf` at `params.tiers`.
  - Produces (`src/main.ts` after Task 15, extended by Task 16; names and order binding for slice 3):
    1. Imports add `App` from `./app`, `seedFromLocation` from `./core/prng`, `DEFAULT_FIELD` and `cloneField` from `./field/params`.
    2. `const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';`
    3. `devWarn`, `safeStorage`, `takeEntryControl(doc: Document): boolean` unchanged from Task 8.
    4. `function applyFallback(doc: Document, reason: string): void` — `devWarn(`static fallback: ${reason}`)` then the Task 8 DOM changes. Reasons: `'nowebgl'`, `'forced-colors'`, `'no-canvas'`, `'no-webgl2'`, `'field'`, `'boot'`.
    5. `async function boot(): Promise<void>`, in order: `doc`, `win`, `query = new URLSearchParams(win.location.search)`, `params = cloneField(DEFAULT_FIELD)`, `let app: App | null = null` → the Task 8 links, email copy (now with `holdMs: params.copy.holdMs`) and clock statements → `const theme = initTheme({ …, onChange: (colors, animate) => app?.setColors(colors, animate) })` → `const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches` → `const entry = takeEntryControl(doc)` → field gate (4.7.3): `?nowebgl`, then `(forced-colors: active)`, then a missing `canvas[data-field]`, each → `applyFallback` and return → [Task 16: the `?debug` tweaks import] → `app = App.start({ canvas, params, reduced, seed: seedFromLocation(win.location.search), colors: theme.colors, entry, rail: doc.querySelector<HTMLElement>('[data-rail]'), scrim: doc.querySelector<HTMLElement>('.scrim'), doc, win })` → `null` → `applyFallback(doc, 'no-webgl2')` and return → `app.onFallback(() => { app = null; applyFallback(doc, 'field'); })` → `if (PN_DEBUG) { const { installDebugHooks } = await import('./debugHooks'); if (app) installDebugHooks(app, win); }` → [Task 16: `mountTweaks?.(app)`].
    6. Top level: `boot().catch((error: unknown) => { devWarn(String(error)); applyFallback(document, 'boot'); });`
- **Spec:** 1.1.2, 3.3.1, 3.3.6.1, 3.3.6.2, 3.3.7.1 (speed widening), 3.3.7.6, 3.3.7.7, 3.3.8 (spawn rules), 3.3.9, 3.3.12, 3.4.7.1 (no-entry path), 3.6.2, 3.6.3, 3.6.5 (field gate), 3.7.1–3.7.9 (3.7.9 no-entry start), 4.1.6, 4.4.1–4.4.4, 4.6.6 (field side), 4.7.3, 4.7.4 (steps 1, 2, 5, 7), 4.7.5 (`__pn`), 4.7.6, 6.1.3–6.1.5, 6.1.12, 6.1.13, 9.7, 9.8, 11.26, 11.30.
- **Tests:** `tests/appColors.test.ts` (A15) — `App` built around a fake renderer, its private `frame()` driven with chosen timestamps: `setColors(c, true)` starts its 300 ms tween at the next frame's timestamp, and a press inside a running crossfade restarts a full 300 ms tween from the colours on screen at that frame, not from the previous target; the rest of `App` is browser-verified; full suite, typecheck and build.
- **Evidence:** 8.2.2 `__pn.parity()` max error ≤ 3/255 and tier mismatch ≤ 0.5 %; 8.2.3 an init script wrapping `WebGL2RenderingContext.prototype.drawArrays` counts exactly 2 calls per animation frame, `__pn.gpuTime(60)` median ≤ 2 ms at 1440×900, rAF mean interval ≤ 16.7 ms over 10 s of pointer movement; 8.2.5 field part: at 150 ms into a toggle an off-cell canvas pixel and `getComputedStyle(body).backgroundColor` are within ±3/255 of the sRGB midpoint; 8.2.7 `?nowebgl`, an init script making `getContext('webgl2')` return `null`, and a forced-colours `matchMedia` init script: content visible at once, `html.no-webgl`, no console errors; 8.2.8 `WEBGL_lose_context` lose then restore resumes the field, lose without restore falls back after 3 s; 8.2.9 a background page shows the field only after `select_page` and no fallback fired; 8.2.10 at 1440×900 ×1, ×1.25, ×1.5 and ×2 `__pn.grid()` reports an integer `cellDev` and a 64-cell column histogram shows every on-run is a multiple of `cellDev`; pointer repel and Shockwave screenshots in the rail layout and in the 390×844 touch band; console check and screenshots (8.3.3); Review Focus 1 (Step 9 item 12): on a `VITE_PN_DEBUG=1` local preview build, Back from a same-origin page restores the page from the back/forward cache (`pageshow` persisted) with the field moving, parity passing, no fallback and the clock current. `frontend-design` skill loaded.
- **Done when:** the field runs under the rail with repel and rings, every listed check passes with its number recorded, and the commit exists.

#### Index entry — Task 16: Debug panel and preview builds
- **Slice:** 2 (closes the slice)
- **Files:** Create `src/tweaks.ts`; Modify `src/main.ts` (the `?debug` branch), `.github/workflows/deploy.yml` (only the 7.3.2 build step: `- run: npm run build` with `env: VITE_PN_DEBUG: ${{ github.ref_name == 'main' && '0' || '1' }}`).
- **Interfaces:**
  - Consumes: Task 15 `App` (`applyParams(): void`, `konami(): void`, `replayEntry(): void`, `get grid(): Grid | null`, `debug(): AppDebug` with `setFrozen(frozen: boolean): void`), `PN_DEBUG`, the slice-2 `main.ts`; Task 9 `FieldParams`, `DEFAULT_FIELD`, `Density`, `Intensity`.
  - Produces:
    ```ts
    // src/tweaks.ts (loaded only by `await import('./tweaks')` when PN_DEBUG && ?debug)
    export function prepareTweaks(params: FieldParams): (app: App) => void;
    ```
    `prepareTweaks` applies saved values from `localStorage['pn.tweaks']` to `params` before `App.start` (only changed keys are stored; `deepAssign` and `diff` copied verbatim from the teaser panel, `git show 3e64808:src/tweaks.ts`) and returns `mount(app)`. `mount` creates `new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 })` with `import '../node_modules/lil-gui/dist/lil-gui.css'` (Index amendment A1: lil-gui's `exports` map hides the bare `lil-gui/dist/lil-gui.css`), the 4.12.3 folders, ranges and steps (`t3 ≤ t2` sets `t3 = t2 + 0.01`), and the buttons replay entry (`app.replayEntry()`), Konami (`app.konami()`), toggle theme (clicks `[data-theme-toggle]`), freeze time (`app.debug().setFrozen(…)`), copy JSON, reset (removes `pn.tweaks` and reloads). Cell and density changes call `app.applyParams()` (regrid).
  - Produces (`src/main.ts` after Task 16): in `boot()`, just before `App.start`: `let mountTweaks: ((a: App) => void) | null = null; if (PN_DEBUG && query.has('debug')) { const { prepareTweaks } = await import('./tweaks'); mountTweaks = prepareTweaks(params); }`; after the debug hooks: `if (app) mountTweaks?.(app);`.
- **Spec:** 3.3.11, 4.7.5 (panel), 4.12.1–4.12.3 (4.12.2 as amended, A1), 7.3.2, 9.18, 9.20, 11.18.
- **Tests:** no new unit file; full suite, typecheck and build.
- **Evidence:** dev `/?debug`: the panel mounts with every folder; a density change regrids (`__pn.grid().cols` changes); a tier change applies on the next frame; reload keeps only changed keys in `pn.tweaks`; reset clears them; console clean. `npm run build` with the variable unset: no `lil-gui`, `parsanaji tweaks` or `__pn` string in `dist/assets/*.js`, and the 8.1.4 gzip number recorded; `VITE_PN_DEBUG=1 npm run build` emits the tweaks chunk. Slice-2 close: push, `gh run watch` green, then on the preview: console check at the three viewports in both looks, `?debug` panel present, `__pn.parity()` passes, screenshots of the live field in both looks.
- **Done when:** the preview shows the live field, `?debug` tunes it, production builds carry no debug code, and the slice-2 commit is pushed.

#### Index entry — Task 17: Entry state machine
- **Slice:** 3
- **Files:** Create `src/field/entry.ts`, `tests/entry.test.ts`.
- **Interfaces:**
  - Consumes: none (pure).
  - Produces (`src/field/entry.ts`):
    ```ts
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
    ```
  - Semantics: `arm()` also re-arms from `done`; `pending` leaves for `gather` (emitting `start`) on the first tick with `ready` and `visible`; a tick with `visible` false does not advance; `cleanup` is emitted only when `cleanupAtMs` is non-null; a `skip()` in `done` emits `cleanup` at once; the fast dissolve is `e = e0 × smoothstep(1 − elapsed / fastMs)`; 0 ms gather and dissolve are allowed (P7).
- **Spec:** 3.4.2, 3.4.8 (machine side), 3.4.9 (machine side), 3.4.11 (timings), 8.1.7; Appendix A §5.
- **Tests:** `tests/entry.test.ts` — phase boundaries at 900, 1900 and 2700 ms; events in order once each (`start` at 0, `scrim` at 1900, `reveal` at 2100, `done` at 2700, `cleanup` at 3300); `entryProgress` = 0, 0.5, 1, 1, 0.5, 0 at 0, 450, 900, 1400, 2300, 2700 ms; stays `pending` until ready and visible; a hidden tick does not advance; Konami runs 3200 ms with no `scrim`, `reveal` or `cleanup`; `skip()` emits `skip`, then `done` and `cleanup` 250 ms later; a skip in `done` emits `cleanup` at once; zero-length gather and dissolve (P7); `arm()` after `done` restarts.
- **Evidence:** none (pure module).
- **Done when:** the machine passes its tests and the commit exists.

#### Index entry — Task 18: The entry on screen
- **Slice:** 3
- **Files:** Modify `src/app.ts` (entry machine, font wait, mask lifecycle, readiness, events → DOM, focus and context-loss skip, mask re-raster debounce, probe at `done`, `replayEntry()`), `src/main.ts` (4.7.2 takeover), `src/debugHooks.ts` (`setTime`, `setE`).
- **Interfaces:**
  - Consumes: Task 17 `EntryPhase`, `EntryEvent`, `EntryTimings`, `EntryMachine`, `entryProgress(tMs: number, t: EntryTimings): number`; Task 11 `MaskBox`, `MaskGrid`, `MaskPlane`, `CanvasFactory`, `Canvas2DLike`, `MASK_FONT_FAMILY`, `rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane`, `maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox`; Task 15 `App` public API, its internals (`stepMask`, `onProgramsReady`, `regrid`, `fail`, `contextLost`, `firstFrameMs`, `programsReady`), `AppDebug`, `PnHooks`, the slice-2 `main.ts`; Task 1 `waitForFont(spec: string, timeoutMs: number, fonts?: FontFaceSetLike, schedule?: (fn: () => void, ms: number) => unknown): Promise<FontWaitResult>`; Task 5 `CONTENT.name`.
  - Produces:
    - `App` behaviour: with `o.entry` true, `App.start` arms the entry (timings from `params.entry`), adds the `focusin` listener on `o.rail` and starts `waitForFont('700 10px "JetBrains Mono"', params.boot.fontTimeoutMs)`; readiness = programs ready + font settled + mask rasterised (`CONTENT.name`, `maskBoxFor('entry', …)`) and uploaded; events map to `<html>` per 4.4.5 (`start` → `data-field-ready`; `scrim` / `reveal` → `data-entry`; `skip` → `data-entry="skip"` + `data-field-ready`; `done` → `setMask(null)`, probe starts; `cleanup` → `data-entry` removed); `focusin` inside the rail while `data-entry` is present and context loss mid-entry call `skip(params.entry.skipMs)`; a resize re-rasterises an active mask 150 ms after the last resize; `replayEntry()` re-arms the full entry including `data-entry="wait"`.
    - `AppDebug` gains `pinEntry(ms: number | null): void` (advances the running entry or Konami machine to elapsed `ms`, forward only, firing the events passed, and holds it there; `null` releases) and `forceE(e: number | null): void` (overrides `maskE` while a mask is uploaded; `null` releases).
    - `PnHooks` gains `setTime(ms: number | null): void` (→ `pinEntry`) and `setE(e: number | null): void` (→ `forceE`).
    - `src/main.ts`: `function takeEntryControl(doc: Document, nowMs: number): boolean` implements 4.7.2 (`data-entry="run"` and `nowMs < 4000` → set `"wait"` and return `true`; otherwise remove `data-entry` and return `false`); `boot()` calls `takeEntryControl(doc, win.performance.now())` and passes the result as `AppOptions.entry`; a fallback after takeover removes `data-entry` (already in `applyFallback`).
- **Spec:** 1.1.4, 3.4.1–3.4.9, 3.4.7.1, 3.5.11 (focus skip), 3.6.3 (skip), 3.6.7 (mask fallback stack), 3.7.1 (mask debounce), 3.7.9 (probe at `done`), 4.4.5, 4.7.2, 4.7.4 (steps 3, 4, 6, 7), 5.1.9, 6.1.7, 6.1.8, 9.12, 11.5, 11.7, 11.8.
- **Tests:** no new unit file (machine pinned in Task 17); full suite, typecheck and build.
- **Evidence:** 8.2.4 filmstrip via `__pn.setTime` at 450 (gather), 1400 (hold, with the pointer over a letter showing the bend), 2300 (dissolve, rail fading) and 3400 ms (done), `<html>` attributes matching 3.4.2 at each point, and every `[data-reveal]` at computed opacity 1 at 2980 ms; 8.2.9 a background page starts the entry only after `select_page` and no fallback fires; Tab during the entry skips it (`data-entry="skip"`, rail visible, mask gone 250 ms later); entry in the 390×844 band (name scaled to the band); Review Focus 2: with `performance.now()` shifted 5000 ms ahead (main.ts after the failsafe) no `wait` state appears, the rail stays visible and the field fades in; Review Focus 3: with `KHR_parallel_shader_compile` stuck at "compiling" the static fallback shows the rail 3000–4000 ms after the first frame and one DEV warning `[pn] static fallback: field` is logged; console check; screenshots of the hold state in both looks. `frontend-design` skill loaded.
- **Done when:** every load plays the 2.98 s entry with the 3.4.7 DOM contract, skip and hidden-tab rules hold, the evidence is recorded, and the commit exists.

#### Index entry — Task 19: Reduced motion
- **Slice:** 3
- **Files:** Modify `src/app.ts`.
- **Interfaces:**
  - Consumes: Task 13 `Loop.wake()`; Task 10 `PointerModel.settled`; Task 8 `ColorTween.active`; Task 17 `EntryMachine.skip(fastMs?: number): void`; Task 15 internals `idle`, `reduced`, `tau`, `ripples`, `probe`, `onProgramsReady`, `spawnAllowed`; Task 18 entry wiring.
  - Produces (`App` behaviour): under reduced motion τ starts at `params.staticTimeS` (12) and stays frozen; turning reduced motion on mid-session freezes the current τ (11.25) and skips a running entry; breath is 1; no rings spawn and existing rings are cleared; the FPS probe never runs; `idle()` returns true once the pointer is `settled` and no colour tween, Konami or resize is pending, so the loop idles; pointer events, resizes and `setColors` wake it (the tween keeps it awake until it ends); pointer repel stays on.
- **Spec:** 1.3.6 (reduced motion), 3.3.6.3, 3.3.8 (rings off), 3.3.9 (breath 1), 3.4.9 (reduced trigger), 3.4.10, 3.6.4, 3.7.9 (never under reduced motion), 4.6.6 (wake until the tween ends), 11.25.
- **Tests:** no new unit file; full suite, typecheck and build.
- **Evidence:** 8.2.6 with a `matchMedia` init script reporting reduced motion: the rail is visible in the first paint; two canvas screenshots 1 s apart are identical; a pointer move changes the field; clicks make no rings; the rail CSS rules for the dot and transitions are confirmed in the stylesheet; with a controllable fake `MediaQueryList`, switching to reduced motion mid-entry skips the entry and freezes τ; the theme crossfade still runs and the loop idles afterwards (no rAF callbacks for 2 s); console clean.
- **Done when:** every 3.6.4 field rule holds under reduced motion, the loop idles when settled, and the commit exists.

#### Index entry — Task 20: Konami "nice."
- **Slice:** 3
- **Files:** Create `src/eggs/konami.ts`, `tests/konami.test.ts`; Modify `src/app.ts` (`konami()`), `src/main.ts` (the keydown listener).
- **Interfaces:**
  - Consumes: Task 17 `EntryMachine`, `EntryTimings`; Task 11 `maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox`, `rasterizeMask`; Task 9 `BAND_QUERY`; Task 5 `CONTENT.konamiText`; Task 18 mask wiring; Task 19 reduced-motion flag.
  - Produces:
    ```ts
    // src/eggs/konami.ts
    export const KONAMI: readonly string[]; // ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a
    export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void }; // b and a case-insensitive
    export function konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null; // maskBoxFor('konami', …), null when empty (A11)
    ```
    `push` returns `true` only on the key that completes the code; any other key resets, and an overlapping prefix still matches. A lone `Shift` or `CapsLock` keydown, and a `key` that is not a string (a synthetic keydown), is neutral: it neither advances nor resets, and `push` never throws (A12).
  - Produces (`App.konami()` behaviour): ignored while the entry or another Konami runs, when the field is not running, and when `konamiMaskBox` returns null (the scrim leaves no clear field: rail windows about 720–790 px wide; A11); mask box measured at trigger time from `o.scrim.getBoundingClientRect().right` and `o.win.matchMedia(BAND_QUERY).matches`; timings from `params.konami` with `scrimAtMs`, `revealAtMs` and `cleanupAtMs` null (3200 ms); under reduced motion `{ gatherMs: 0, holdMs: params.konami.holdMs, dissolveMs: 0 }` (P7); the rail stays visible.
  - Produces (`src/main.ts`): after the scramble position of 4.7.1, `const konami = createKonami(() => app?.konami());` and `doc.addEventListener('keydown', (e) => { if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; konami.push(e.key); });`.
- **Spec:** 3.4.11, 8.1.15 (konami), 9.13, 11.17.
- **Tests:** `tests/konami.test.ts` — the full sequence fires once; an overlapping prefix (`↑ ↑ ↑ ↓ ↓ …`) still matches; `B` / `A` are case-insensitive; Shift and CapsLock keydowns and keys that are not strings neither advance nor reset (A12); a wrong key resets; `push` returns true only on completion; `reset()`; `konamiMaskBox` is the clear field right of the scrim, the whole band without a scrim, and null when the scrim reaches the field edge (A11).
- **Evidence:** 8.2.11 Konami at 1440×900 forms `nice.` right of the scrim (mask box x ≥ the scrim's right edge, about 950) and in the 390×844 band; ignored during the entry and under `?nowebgl`; Ctrl, Meta, Alt and auto-repeat keys neither advance nor reset; under the reduced-motion init script `e` jumps to 1, holds 1500 ms and jumps to 0; Review Focus 5: at `740x700x1` (rail layout, the scrim past the field) the code is ignored and the field is not dimmed; console clean.
- **Done when:** the code forms `nice.` with the same pipeline in both layouts, the test passes, and the commit exists.

#### Index entry — Task 21: Keyboard shortcuts and the "?" overlay
- **Slice:** 3
- **Files:** Create `src/eggs/shortcuts.ts`, `src/ui/overlay.ts`, `tests/shortcuts.test.ts`, `tests/overlay.test.ts`; Modify `src/main.ts`.
- **Interfaces:**
  - Consumes: Task 7 `initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }`, `initEmailCopy(…): { trigger(): Promise<CopyResult>; dispose(): void }`; Task 5 DOM contract (`dialog[data-keys]`, `[data-keys-close]`, `a[data-link]`).
  - Produces:
    ```ts
    // src/eggs/shortcuts.ts
    export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';
    export interface KeyLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean; target: EventTarget | null }
    export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null;
    export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void;

    // src/ui/overlay.ts
    export function initOverlay(panel: HTMLDialogElement, doc: Document): { toggle(): void; close(): void; readonly open: boolean; dispose(): void };
    ```
  - Produces (`src/main.ts`): `boot()` keeps `const { linkedin } = initLinks(…)` and the `initEmailCopy` handle; after `initTheme` it calls `initOverlay` on `dialog[data-keys]` (when present) and `initShortcuts(doc, run, { linkedin })`, where `run` ignores everything except `'overlay'` and `'close'` while the overlay is open, `'github'` / `'linkedin'` call `win.location.assign` with the matching anchor's `href`, `'email'` calls the email handle's `trigger()`, `'overlay'` toggles and `'close'` closes.
- **Spec:** 3.5.4, 3.5.5, 3.5.11, 4.3.1, 5.1.3, 8.1.15 (shortcuts), 11.28.
- **Tests:** `tests/shortcuts.test.ts` — `g`, `l`, `e`, `?` and `Escape` map; Ctrl, Meta and Alt are ignored and Shift is allowed (`?`); `l` returns null when LinkedIn is absent; repeat and editable targets (`input`, `textarea`, `select`, `[contenteditable]`) are ignored; upper-case `G`, `L`, `E` map (Caps Lock); a keydown without a string `key` maps to null and never throws (Review Focus 4). `tests/overlay.test.ts` — `toggle()` calls `showModal()` when closed and `close()` when open; `open` reflects the state; a backdrop click (`event.target === dialog`) closes; the close button closes; a missing panel in `main.ts` leaves shortcuts working; `dispose()` removes the listeners.
- **Evidence:** 8.2.11 `g` calls `location.assign('https://github.com/parsanaji')` (spied with an init script); `e` shows `copied` and the live sentence; `?` opens the overlay with focus on `close`; `Escape` closes it and focus returns; only `?` and `Escape` act while it is open; keys in an editable target are ignored; Tab order unchanged; console clean.
- **Done when:** the shortcuts and the overlay behave as 3.5.4–3.5.5, the tests pass, and the commit exists.

#### Index entry — Task 22: Name scramble and console line
- **Slice:** 3 (closes the slice)
- **Files:** Create `src/eggs/scramble.ts`, `src/eggs/greeting.ts`, `tests/scramble.test.ts`, `tests/greeting.test.ts`; Modify `src/main.ts`.
- **Interfaces:**
  - Consumes: Task 1 `mulberry32(seed: number): () => number`, `seedFromLocation(search: string, fallback?: () => number): number`; Task 5 `CONTENT`; Task 9 `params.scramble` (`DEFAULT_FIELD.scramble`).
  - Produces:
    ```ts
    // src/eggs/scramble.ts
    export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';
    export function scrambleText(target: string, tMs: number, durMs: number, stepMs: number, rand: (step: number, i: number) => number): string;
    export function initScramble(el: HTMLElement, text: string, opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean }): () => void;

    // src/eggs/greeting.ts
    export function greet(log?: (...args: unknown[]) => void, email?: string): void; // exactly the call in 3.5.7
    ```
  - Produces (`src/main.ts`, final 4.7.1 order): `greet()` is the first statement of `boot()`; after `initShortcuts`, `initScramble([data-name], CONTENT.name, { durMs: params.scramble.durMs, stepMs: params.scramble.stepMs, seed: seedFromLocation(win.location.search), reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches })`, then the Konami listener of Task 20, then `reduced`.
- **Spec:** 3.5.6, 3.5.7, 4.7.1 (final order), 8.1.15 (scramble, greeting), 11.29.
- **Tests:** `tests/scramble.test.ts` — ends on the exact target; spaces stay spaces; constant length; deterministic for a seed; letter i settles by `durMs × (0.3 + 0.7 × i / (n − 1))`; glyphs come from `SCRAMBLE_GLYPHS`, all printable ASCII inside the font subset. `tests/greeting.test.ts` — one call whose first argument equals `%cParsa Naji — say hi: info@parsanaji.com` and whose second is the 3.5.7 style string.
- **Evidence:** 8.2.11 a click on the name scrambles and settles on `Parsa Naji` within 600 ms, with `aria-label="Parsa Naji"` during and removed after; a click during a running scramble is ignored; no scramble under the reduced-motion init script; `list_console_messages` shows exactly the one styled line and no warnings or errors. Slice-3 close: push, `gh run watch` green, then on the preview: console check at the three viewports in both looks, an entry filmstrip spot check, screenshots.
- **Done when:** the preview is feature-complete (entry, eggs, reduced motion), the console carries only the greeting, and the slice-3 commit is pushed.

#### Index entry — Task 23: Quality bar: budgets, Lighthouse, fit and README
- **Slice:** 4
- **Files:** Modify `README.md` (one-line description `One-screen résumé over a WebGL2 dither field.`, run recipes including `npm run og` and `npm run fonts`, the deploy rules for `resume-screen` previews, spec and plan paths, and a "Budgets" table with the numbers measured here).
- **Interfaces:**
  - Consumes: the whole product of Tasks 1–22; `window.__pn` (`parity()`, `gpuTime(frames)`, `grid()`, `setTime(ms)`, `setE(e)`) on the dev server and the preview.
  - Produces: the measured numbers (README table and task report) that the approval message of Task 24 quotes.
- **Spec:** 1.3.1–1.3.6, 3.1.17, 3.2.5, 6.1.1–6.1.18 (6.1.10 and 6.1.11 as amended, A5, A6), 6.2, 7.3.1 (verify unchanged), 7.6.1, 8.2.1, 8.2.3, 8.2.12–8.2.14, 8.3.5 (`anti-ui-slop`).
- **Tests:** no new unit file; full suite, typecheck and build.
- **Evidence:** 8.2.12 Lighthouse mobile and desktop on the preview URL and on `?noentry`: `lighthouse_audit` for Accessibility and Best Practices (gated on the preview) and SEO (gated ≥ 95 on the local production build because previews send `x-robots-tag: noindex`; on the preview only `is-crawlable` may fail and it names that header, A6), and the Lighthouse CLI `npx --yes lighthouse@13.5.0` for Performance, TBT, LCP, FCP and CLS, three runs per configuration gated on the median (A5); 6.1.6–6.1.8 performance traces under "Fast 4G" in fresh contexts (no-entry LCP, entry FCP, rail fully visible after t = 0); 6.1.12 rAF interval and long tasks after the entry; 6.1.13 `__pn.gpuTime(60)`; 8.2.14 the 8.1.4 JS gzip number with `VITE_PN_DEBUG` unset and the font sum; 6.1.16 network panel (no third-party requests on the preview); 8.2.13 the full fit pass at every listed viewport in both looks on the preview; 8.2.1 console at the three viewports in both looks on the preview; `git diff --stat main -- public/_headers public/robots.txt` is empty; the `anti-ui-slop` finish gate. Any failed budget stops the task with status BLOCKED and the measured number (the controller adds a fix task); nothing is tuned to pass a metric.
- **Done when:** every budget of 6.1 is measured and passes, the README carries the numbers and recipes, and the commit exists.

#### Index entry — Task 24: Handoff: OPERATOR, LinkedIn, tuning, vault and the approval message
- **Slice:** 4 (closes the slice)
- **Files:** Modify `docs/OPERATOR.md` (§5 becomes exactly the 7.6.2 text; new "## 7. LinkedIn link" with the 3.1.12 one-commit procedure). Only when the dispatch carries the LinkedIn URL from Parsa: Modify `src/content.ts`, `index.html` (uncomment the `<li>` with `href`, `rel="me"`, `data-link="linkedin"`; add the URL to the JSON-LD `sameAs`). Only when the dispatch carries tuned values Parsa approved in the `?debug` panel: Modify `src/field/params.ts` and `tests/params.test.ts` (4.12.4). Only when the Step 4 dry run of the LinkedIn procedure fails the suite: Modify `tests/content.test.ts` (A7). Only when approved tuning changes a README "Budgets" row: Modify `README.md` after re-measuring that row (A8). Outside the repo: the vault note `C:/Users/parsa/Documents/Obsidian Vault/Projects/parsanaji.com.md` (preview state, recipes, gotchas found).
- **Interfaces:**
  - Consumes: Task 5 `CONTENT` and the commented LinkedIn `<li>`; Task 7 `initLinks` (un-hides the overlay row); Task 21 the `l` shortcut; Task 9 `DEFAULT_FIELD`; Task 23 measured numbers.
  - Produces: the approval message text of 7.5.2 (preview URL; the parked items: email verification, CI token, LinkedIn URL; whether the idle-field tuning of 9.18 is final), written into the task report for the controller.
- **Spec:** 1.3.7, 2.1.7, 2.4.1–2.4.3, 3.1.12, 4.12.4, 7.5.1, 7.5.2, 7.6.2, 7.6.3 (preview-state part), 9.18.
- **Tests:** `tests/content.test.ts` keeps `CONTENT.links.linkedin`, the `<li>` and `sameAs` equal (and passes unchanged when no URL was given); `tests/params.test.ts` pins any approved values; full suite, typecheck and build.
- **Evidence:** if LinkedIn was applied: `l` opens it, the overlay row shows, the link has the hover brackets, console clean. Push, `gh run watch` green, preview console check at the three viewports in both looks. Missing URL or tuning values are reported as parked, not as failures.
- **Done when:** OPERATOR.md documents the iPhone check and the LinkedIn procedure, any supplied operator input is applied in one commit, the vault note carries the preview state, the approval message is ready for the controller, and the final commit is pushed.

## Index amendments (applied)

The body writers and the assembler found facts the index did not know. Each amendment below is already applied to the index entries above, to the File Structure and Global Constraints where it touches them, and to the task bodies; reviewers treat them as plan, not drift. Spec changes they forced are listed in spec section 12.

**From the slice-2 writer** (verified 2026-10-19 by running the exact code of slice 2: scratch build on Vite 8.3.4, Vitest 5.0.5, TypeScript 5.9.3, Chrome via DevTools MCP on the owner's RTX 2080 SUPER):
- **A1 — Task 16, the lil-gui stylesheet import (spec 4.12.2).** `import 'lil-gui/dist/lil-gui.css'` does not resolve: lil-gui 0.21.0's `package.json` has `"exports": { "import": …, "require": … }`, so Rolldown stops a `VITE_PN_DEBUG=1` build with `"./dist/lil-gui.css" is not exported under the conditions ["module", "browser", "production", "import"]`. `src/tweaks.ts` imports `'../node_modules/lil-gui/dist/lil-gui.css'` (a relative file path bypasses the exports map; Vite emits it as the same-origin `dist/assets/tweaks-*.css` the CSP allows; `vite.config.ts` stays untouched, 4.1.5).
- **A2 — Task 9, `computeGrid` and `deviceBox` (spec 3.7.1, 8.2.10).** `deviceBox` is used only when given, `dprRaw ≤ 2`, and it agrees with `css × dpr` to within 1 device px on both axes (the 1 px is edge snapping: 1366 × 1.25 = 1707.5 against a real box of 1707). DevTools device-scale emulation, which 8.2.10 uses, reports the physical box (1440 × 900 at an emulated ×1.25), and trusting it would stretch every cell by 1.25 and fail the moiré check; on real hardware the two agree. Signature unchanged.
- **A3 — Task 15, `App.setColors(c, true)` (spec 4.6.6, 8.2.5).** The `ColorTween` starts at the timestamp of the next animation frame, not at `performance.now()` inside the call: the CSS transition of the same toggle starts at that frame's style update, so starting in the click handler put field-0 one frame ahead of `--bg` (4 of 255 off at 150 ms on a 165 Hz display, outside 8.2.5's ±3). Measured after the change: canvas off-cell and `body` background identical in every frame of the fade. The private field `pendingColors: FieldColors | null` carries the colours to the next frame. Signature unchanged.
- **A4 — Tests take spec 4.9 literals (Tasks 9–11, 24).** `tests/sizing.test.ts`, `tests/pointer.test.ts`, `tests/ripples.test.ts` and `tests/nameMask.test.ts` pass the 4.9 values as explicit literals typed `FieldParams['cell' | 'pointer' | 'ripple' | 'mask']`; only `tests/params.test.ts` pins `DEFAULT_FIELD` to the 4.9 table (the test Task 24 edits when tuning is approved), and its `cloneField` case compares against a snapshot.

**From the slice-4 writer** (verified 2026-10-19):
- **A5 — Task 23, Lighthouse Performance and TBT (spec 6.1.10, 6.1.11, 8.2.12).** The DevTools MCP tool `lighthouse_audit` covers Accessibility, Best Practices, SEO and agentic browsing only (its description says "This excludes performance"). Task 23 keeps `lighthouse_audit` for those categories and takes Performance, TBT, LCP, FCP and CLS from the Lighthouse CLI `npx --yes lighthouse@13.5.0` (published 2026-09-18, needs Node ≥ 22.19; it launches a headed Chrome in which WebGL runs on the GPU). Three runs per configuration, gated on the median.
- **A6 — Task 23, SEO on the preview (spec 6.1.11, 8.2.12, 7.2.1).** Cloudflare Pages answers every `*.pages.dev` preview with `x-robots-tag: noindex` (`https://parsanaji.com/` sends none), so Lighthouse's `is-crawlable` audit fails on the preview whatever the page does. Task 23 gates SEO ≥ 95 on the local production build (`npm run build` + `npm run preview`, which sends no `x-robots-tag`); on the preview every SEO audit except `is-crawlable` must pass and that failure must name the header. Accessibility and Best Practices stay gated on the preview. The controller's post-merge check (7.6.3) runs SEO on `https://parsanaji.com`.
- **A7 — Task 24 Files: `tests/content.test.ts`, conditional (spec 3.1.12, 5.2.1, 5.2.3).** 3.1.12 makes the content test keep `CONTENT.links.linkedin`, the `<li>` and `sameAs` equal. Task 5 already derives the expected `sameAs` from `CONTENT` (GitHub, plus LinkedIn when non-empty); Task 24 dry-runs the LinkedIn procedure and modifies the test only if the suite then fails (Task 24 Step 5).
- **A8 — Task 24 Files: `README.md`, conditional (spec 4.12.4, 6.1).** When approved tuning values change a number in the README "Budgets" table written by Task 23 (frame interval, GPU time, rail-visible time), Task 24 re-measures those rows and updates `README.md` in the operator-input commit. Without tuning, `README.md` is untouched.

**Ledger rulings of 2026-10-19 19:29 (slice-1 questions):**
- **A9 — Task 8 Evidence, the clock write (spec 3.5.13 as amended).** The write is scheduled `msToNextMinute(now) + 25` ms ahead, so the footer time changes between 25 and 100 ms after the minute boundary (measured 39 ms); the evidence accepts 25–100 ms.
- **A10 — Task 4, no OG ring (spec 4.10.3 as amended).** The ledger ruling of 19:29 lowered the static Shockwave ring from the live amp 0.975 to 0.6; the controller then ruled after assembly that the OG image has no ring at all, because even amp 0.4 renders as solid white blobs. `scripts/og-image.mjs` calls `tierGrid(COLS, ROWS, CELL, TAU, 1)` with no rings; the still is the name, the tagline, the domain and the plain field band (83,139 bytes, SHA-256 `d6580647…c5e847`). Task 4's visual check describes it and saves a copy as `evidence/task-4/og.png` for Parsa.

**From the assembler** (verified by applying every `src/` hunk of Tasks 16 and 18–22 to the Task 15 files, typechecking the state after each task, and running the full final suite: 33 files, 306 tests, typecheck clean, production JS 16.3 KB gzip):
- **A11 — Task 20, `konamiMaskBox` (spec 3.4.11; slice-2 open item).** On a rail-layout window about 720–790 px wide the scrim reaches past the field, so `maskBoxFor('konami', …)` returns `w = 0` and a Konami would dim the whole field around no text. `src/eggs/konami.ts` also exports `konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null` (`maskBoxFor('konami', …)`, null when `w` or `h` is 0); `App.maskBoxNow` returns `MaskBox | null`, `uploadMask` returns false on null, and `App.konami()` ignores the code then. Pinned by `tests/konami.test.ts` and Task 20's narrow-window evidence.
- **A12 — Task 20, keydowns without a string `key` (Review Focus).** `createKonami().push` treats a `key` that is not a string (a synthetic `new Event('keydown')` from an extension) as neutral, like a lone Shift: it neither advances nor resets and never throws, so the `document` keydown listener can never log an uncaught `TypeError`. `shortcutFor` already maps such an event to null; Task 21's test pins it.
- **A13 — index detail from the slice-2 writer (no behaviour change).** Task 12's four `targets.ts` cases live in `tests/glContext.test.ts` (no extra file); each `FakeContext.fillTextCalls` entry of `tests/helpers/fakeCanvas.ts` also records the `font` string; Task 15's `App` has private helpers beyond the index list that no later hunk touches (`pendingColors`, `measure()`, `armRestore()`, `bindPointer()`, the module constants `NO_RIPPLE` and `kindOf`), and its `stepMask` parameters are named `_dtMs`, `_visible` until Task 18 replaces the method; `PnHooks.gpuTime(frames)` keeps sampling until it has `frames` results (at most `3 × frames` tries).
- **A14 — the slice-3 hunks are exact.** Every `src/app.ts`, `src/main.ts` and `src/debugHooks.ts` change in Tasks 16 and 18–22 is a before/after pair whose "before" text occurs exactly once in the file as the previous tasks leave it; Task 15's `src/main.ts` keeps Task 8's text and comments byte for byte where it does not change them, and Task 22 prints the resulting final `src/main.ts`.
- **A15 — Task 15, a press inside the crossfade (controller ruling after assembly; spec 3.2.6 as amended).** A toggle inside the 300 ms crossfade behaves like an interrupted CSS transition: `setColors(c, true)` starts a new 300 ms tween from the colours on screen at the next frame (A3), never from the previous target. `ColorTween.start` (Task 8) already samples the current colours and `App.frame` starts the pending tween at the frame's timestamp, so no logic changes; Task 15's `setColors` doc comment states the rule and the new `tests/appColors.test.ts` (one case) pins it on the real `App` with a fake renderer (it fails if the tween restarts from the previous target). Counts from Task 15 on rise by one file and one test.

## Writer handoff

Kept for provenance: the bodies below were written to this contract in parallel; the assembler joined them, reconciled the seams between slices, applied the Index amendments above, and folded the slice headings and slice preambles into the Slices section, the Global Constraints and (for slice 4) the bodies of Tasks 23 and 24, so that every `task-brief` extract is exactly one task.

One writer per slice, in parallel. Each writer reads this header, the spec sections its tasks cite, the appendix code those sections make normative, and the current repo files its tasks modify (`git show 3e64808:<path>` for files Task 1 deletes, for example `src/tweaks.ts` for `deepAssign` / `diff`).

| part file | slice | tasks |
|---|---|---|
| `docs/superpowers/plans/parts-2026-10-19/02-slice1.md` | Slice 1 — The static résumé | Tasks 1–8 |
| `docs/superpowers/plans/parts-2026-10-19/03-slice2.md` | Slice 2 — The field | Tasks 9–16 |
| `docs/superpowers/plans/parts-2026-10-19/04-slice3.md` | Slice 3 — The entry and the eggs | Tasks 17–22 |
| `docs/superpowers/plans/parts-2026-10-19/05-slice4.md` | Slice 4 — Quality bar and handoff | Tasks 23–24 |

Rules every body obeys:
1. **Complete code in every step.** New files appear in full; modified files appear in full or as exact before/after hunks a builder can apply without guessing. Never "similar to Task N", "as above", "TBD", "add error handling" or "write tests for this". Where the spec says "exactly Appendix X §n", copy the appendix code verbatim with only the listed changes.
2. **Commands with expected output.** Every run step gives the exact Git Bash command from `/c/Users/parsa/parsanaji.com` and what it prints: RED (the failing test names and the reason), GREEN (pass counts), `npm run typecheck` (no output), `npm run build` (success), script output, and for browser steps the DevTools tool calls, init scripts, expected values and the evidence file names under `evidence/task-<N>/`.
3. **A commit step with the exact message and the trailer.** `git add <exact paths>` followed by `git commit -m "<type(scope): subject>` + blank line + optional body + blank line + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`, as in `docs/superpowers/plans/parts/04-slice2-a.md`. Slice-closing tasks add the push, `gh run watch` (with the `gh` PATH line) and the preview checks after the commit.

Format and contract:
- Slice heading `## Slice K — <name>`; task heading `### Task N: <name>`; then **Files:** and **Interfaces:** copied from this index without renaming anything; then checkbox steps `- [ ] **Step n: …**` in TDD order (failing test → run RED → implement → run GREEN → full gate → evidence → commit).
- Names, signatures, constants and the `main.ts` / `App` contracts in this index are binding. If the spec forces a change to one, the writer lists it under "Index amendments" at the top of the part file, with the spec number, for the assembler; it never diverges silently.
- Golden values (checksums, coverage bands, grid tables, measured sizes) are computed by the writer running the exact code in a scratch directory and written as literals.
- Each body cites the spec numbers it implements next to the code they govern.

## Coverage gaps

None. Every numbered requirement of spec sections 3–8 maps to at least one task. Re-verified by script against the assembled plan (2026-10-19): the 252 numbered requirements and sub-requirements of sections 3–8, ranges in Spec lines expanded in spec order; 233 are cited by a task's **Spec** line, and the other 19 (7.1.1–7.1.3, 7.4.1, 7.4.2, 8.1.4, 8.2.2, 8.2.4–8.2.11, 8.3.1–8.3.4) by Global Constraints, Execution Notes or a task's **Evidence** line; none is uncited. No task moved, so the table stands:

| spec | tasks |
|---|---|
| 3.1.1–3.1.17 | 5 (markup, 3.1.2–3.1.6, 3.1.12 absence), 6 (layout, 3.1.1, 3.1.7–3.1.11, 3.1.13–3.1.17), 9 (`BAND_QUERY`), 24 (3.1.12 procedure) |
| 3.2.1–3.2.9 | 6 (tokens, contrast placement), 4 (3.2.7, 3.2.8), 5 and 8 (3.2.9), 8 and 15 (3.2.6), 23 (3.2.5 audit) |
| 3.3.1–3.3.12 | 3 (math), 9 (cells, lattice, flow, breath, defaults), 10 (pointer, rings), 14 (GLSL, tiers, colours), 15 (wiring), 16 (3.3.11 tunables), 19 (3.3.6.3) |
| 3.4.1–3.4.11 | 5 (bootstrap), 6 (3.4.7 CSS), 11 (3.4.6 layout), 17 (machine), 18 (entry), 19 (3.4.10), 20 (3.4.11) |
| 3.5.1–3.5.13 | 6 (3.5.1, 3.5.2, 3.5.8, 3.5.9), 7 (3.5.3, 3.5.13), 8 (3.5.10, 3.5.11), 21 (3.5.4, 3.5.5), 22 (3.5.6, 3.5.7), 5 (3.5.12) |
| 3.6.1–3.6.7 | 5 and 8 (3.6.1), 8 and 15 (3.6.2), 15 (3.6.3), 6 and 19 (3.6.4), 5, 6 and 15 (3.6.5), 6 (3.6.6), 6 and 18 (3.6.7) |
| 3.7.1–3.7.9 | 13 (plumbing), 15 (resize, DPR, visibility, sim time, bfcache, context loss, pointer leave, first frame, probe), 18 (mask debounce, probe at `done`), 19 (no probe under reduced motion) |
| 4.1.1–4.1.6 | 1, 15 (4.1.6) |
| 4.2, 4.3, 4.3.1–4.3.2 | every task per the File Structure; 5 (4.3.2) |
| 4.4.1–4.4.5 | 8 (4.4.1), 15, 18 (4.4.5) |
| 4.5.1–4.5.10 | 12, 14, 6 (4.5.9) |
| 4.6.1–4.6.7 | 5 (4.6.1, 4.6.2), 6 (4.6.3, 4.6.4), 8 (4.6.5–4.6.7), 15 and 19 (4.6.6 field side) |
| 4.7.1–4.7.6 | 8, 15, 16, 18, 20, 21, 22 |
| 4.8.1–4.8.5 | 11 |
| 4.9, 4.9.1 | 9, 24 (4.12.4 values) |
| 4.10.1–4.10.8 | 3 (shared math), 4 |
| 4.11.1–4.11.4 | 2, 5 (preloads), 6 (`@font-face`) |
| 4.12.1–4.12.4 | 15 (PN_DEBUG), 16, 24 |
| 5.1.1–5.1.10 | 5, 6, 8, 18 (5.1.9), 19, 21 (5.1.3), 23 (audit) |
| 5.2.1–5.2.5 | 5 |
| 6.1.1–6.1.18, 6.2 | 2 (6.1.2), 9 and 15 (6.1.4), 15 (6.1.3, 6.1.5, 6.1.12, 6.1.13), 16 (early 6.1.1), 18 (6.1.7, 6.1.8), 23 (all, measured) |
| 7.1.1–7.1.3 | Global Constraints, Execution Notes |
| 7.2.1–7.2.2 | Global Constraints; pushes in 8, 16, 22, 24 |
| 7.3.1–7.3.2 | Global Constraints, 23 (verify), 16 (7.3.2) |
| 7.4.1–7.4.2 | Global Constraints |
| 7.5.1–7.5.2 | Execution Notes, 24 |
| 7.6.1–7.6.3 | 23 (7.6.1), 24 (7.6.2, 7.6.3 preview state), controller after the merge (7.6.3) |
| 8.1.1–8.1.18 | 1 (8.1.18 kept and retired), 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 20, 21, 22, 16 and 23 (8.1.4) |
| 8.2.1–8.2.14 | 6 (8.2.13), 8 (8.2.1, 8.2.5, 8.2.7, 8.2.11), 14 (compile), 15 (8.2.2, 8.2.3, 8.2.5, 8.2.7–8.2.10), 16, 18 (8.2.4, 8.2.9), 19 (8.2.6), 20, 21 and 22 (8.2.11), 23 (8.2.1, 8.2.12–8.2.14) |
| 8.3.1–8.3.5 | Global Constraints; every task's gate and evidence; 6, 8, 15, 18 (`frontend-design`), 23 (`anti-ui-slop`) |

## Task bodies

The 24 task bodies follow in order. Slice boundaries are in the Slices section above: Tasks 8, 16, 22 and 24 close slices 1–4 and push. There are no slice headings between the bodies, so `task-brief` extracts exactly one task.

Every command below runs in Git Bash from `/c/Users/parsa/parsanaji.com` on branch `resume-screen`. Vitest runs with the `minimal` reporter here (`CLAUDECODE` is set), so a passing run prints only the summary lines quoted under **Expected**. The golden values (test counts, checksums, sizes, hashes and layout measurements) were produced by running this exact code on scratch copies of HEAD `3e64808` with Node 24.19.0, npm 11.17.0 and the pinned devDependencies (slice 1 by its writer; slices 2 and 3 by theirs; the assembler re-ran the final suite and every intermediate typecheck of Tasks 15–22).

---

### Task 1: Toolchain and teaser retirement

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm uninstall three @types/three` and `npm install --save-dev --save-exact harfbuzzjs@1.6.3 fontverter@2.0.0`; then `engines.node` → `">=22.18.0"` and the `og:placeholder` script removed), `vite.config.ts`, `src/main.ts` (interim, below), `tests/env.test.ts`, `tests/prng.test.ts`, `tests/easing.test.ts`, `tests/time.test.ts`, `tests/quality.test.ts`.
- Move (`git mv`): `src/engine/prng.ts` → `src/core/prng.ts`; `src/engine/easing.ts` → `src/core/easing.ts`; `src/engine/time.ts` → `src/core/time.ts`; `src/engine/quality.ts` → `src/core/quality.ts` (then delete `WidthClass`, `COUNT_CAP`, `widthClass`, `dotCount`, `degradedCount`).
- Delete: `src/app.ts`, `src/tweaks.ts`, `src/engine/ParticleField.ts`, `src/engine/defaults.ts`, `src/shaders/field.vert`, `src/shaders/field.frag`, `src/shaders/noise.glsl`, `src/boot/webgl.ts`, `scripts/og-placeholder.mjs`, `tests/defaults.test.ts`, `tests/webgl.test.ts`, `tests/sampler.test.ts`.
- Keep untouched (P10 and later tasks): `src/engine/types.ts`, `src/engine/sampler.ts`, `src/engine/motion.ts`, `tests/motion.test.ts`, `tests/helpers/fakeCanvas.ts`, `src/ui/clock.ts`, `src/ui/exitLine.ts`, `tests/clock.test.ts`, `src/content.ts`, `index.html`, `src/styles.css`, `public/**`, `scripts/fonts-src/**`, `src/boot/fonts.ts`, `tests/fonts.test.ts`.
- Interim `src/main.ts`, exactly: `// Task 1 interim boot: the teaser engine is retired; Task 8 writes the résumé boot.` / `document.documentElement.classList.add('no-webgl');` / `export {};`

**Interfaces:**
- Consumes: none.
- Produces (moved, behaviour unchanged):
  - `src/core/prng.ts`: `mulberry32(seed: number): () => number` (uniform in [0, 1)); `seedFromLocation(search: string, fallback?: () => number): number` (`?seed=<finite>` → `n >>> 0`, else `fallback() >>> 0`, default `Date.now`).
  - `src/core/easing.ts`: `clamp01`, `easeOutExpo`, `easeInCubic`, `easeOutCubic`, each `(t: number) => number`.
  - `src/core/time.ts`: `clampDt(dtMs: number, maxMs?: number): number` (default 50; non-finite or ≤ 0 → `1000 / 60`).
  - `src/core/quality.ts`: `capDpr(devicePixelRatio: number, max?: number): number` (default 2; non-finite or ≤ 0 → 1); `class FpsProbe { constructor(windowFrames?: number, thresholdFps?: number); push(dtMs: number): 'pending' | 'keep' | 'degrade'; get done(): boolean }` (defaults 60 and 45; reports `'degrade'` at most once).
  - Kept in place: `src/boot/fonts.ts`: `type FontWaitResult = 'loaded' | 'timeout' | 'unavailable'`; `interface FontFaceSetLike { load(font: string): Promise<unknown> }`; `waitForFont(spec: string, timeoutMs: number, fonts?: FontFaceSetLike, schedule?: (fn: () => void, ms: number) => unknown): Promise<FontWaitResult>` (never rejects).

- [ ] **Step 1: Point the kept tests at `src/core/` and drop the particle-count cases (spec 4.2, 8.1.18)**

In `tests/prng.test.ts`, line 2:

```ts
// before
import { mulberry32, seedFromLocation } from '../src/engine/prng';
// after
import { mulberry32, seedFromLocation } from '../src/core/prng';
```

In `tests/easing.test.ts`, line 2:

```ts
// before
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo } from '../src/engine/easing';
// after
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo } from '../src/core/easing';
```

In `tests/time.test.ts`, line 2:

```ts
// before
import { clampDt } from '../src/engine/time';
// after
import { clampDt } from '../src/core/time';
```

Full file `tests/quality.test.ts` (the `widthClass`, `COUNT_CAP`, `dotCount` and `degradedCount` cases go; `capDpr` and `FpsProbe` stay verbatim):

```ts
import { describe, expect, it } from 'vitest';
import { FpsProbe, capDpr } from '../src/core/quality';

describe('capDpr', () => {
  it('caps at 2 and sanitizes', () => {
    expect(capDpr(3)).toBe(2);
    expect(capDpr(1.5)).toBe(1.5);
    expect(capDpr(Number.NaN)).toBe(1);
    expect(capDpr(0)).toBe(1);
  });
});

describe('FpsProbe', () => {
  it('stays pending until the window is full', () => {
    const p = new FpsProbe(60, 45);
    for (let i = 0; i < 59; i++) expect(p.push(16.7)).toBe('pending');
    expect(p.done).toBe(false);
  });

  it('keeps at 60 fps', () => {
    const p = new FpsProbe(60, 45);
    let last: string = 'pending';
    for (let i = 0; i < 60; i++) last = p.push(16.7);
    expect(last).toBe('keep');
    expect(p.done).toBe(true);
  });

  it('degrades once at 30 fps, then keeps forever', () => {
    const p = new FpsProbe(60, 45);
    let last: string = 'pending';
    for (let i = 0; i < 60; i++) last = p.push(33.3);
    expect(last).toBe('degrade');
    expect(p.push(33.3)).toBe('keep');
    expect(p.push(100)).toBe('keep');
  });
});
```

Full file `tests/env.test.ts` (the floor rises to 22.18, spec 4.1.3 and 6.1.15; the ICU, `fetch` and `process.loadEnvFile` cases are unchanged and the test never loads `.env`):

```ts
import { describe, expect, it } from 'vitest';

describe('runtime environment', () => {
  it('runs on Node 22.18 or newer (type stripping for scripts/og-image.mjs, spec 4.1.3)', () => {
    const [major, minor] = process.versions.node.split('.').map(Number);
    expect(major > 22 || (major === 22 && minor >= 18)).toBe(true);
  });

  it('has full ICU time-zone data for America/Los_Angeles', () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    }).formatToParts(new Date('2026-07-01T12:00:00Z'));
    expect(parts.find((p) => p.type === 'timeZoneName')?.value).toBe('PDT');
  });

  it('exposes fetch and process.loadEnvFile for the scripts', () => {
    expect(typeof fetch).toBe('function');
    expect(typeof process.loadEnvFile).toBe('function');
  });
});
```

- [ ] **Step 2: Run the retargeted tests to verify they fail**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts tests/quality.test.ts`

Expected: FAIL, `Test Files  4 failed (4)`, `Tests  no tests`, one error per file:
`Error: Cannot find module '../src/core/prng' imported from …/tests/prng.test.ts` (and the same for `../src/core/easing`, `../src/core/time`, `../src/core/quality`).

- [ ] **Step 3: Move the four utilities to `src/core/` and trim `quality.ts` (spec 4.2, Appendix A §1.1)**

```bash
mkdir -p src/core
git mv src/engine/prng.ts src/core/prng.ts
git mv src/engine/easing.ts src/core/easing.ts
git mv src/engine/time.ts src/core/time.ts
git mv src/engine/quality.ts src/core/quality.ts
```

`prng.ts`, `easing.ts` and `time.ts` stay byte-for-byte as they are. Full file `src/core/quality.ts` (only `capDpr` and `FpsProbe` remain; their code is unchanged, the probe's comment now cites 3.7.9):

```ts
export function capDpr(devicePixelRatio: number, max = 2): number {
  const d = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(max, d);
}

/** Measures one window of frames; reports 'degrade' at most once (spec 3.7.9). */
export class FpsProbe {
  private frames = 0;
  private elapsedMs = 0;
  private settled = false;

  constructor(
    private readonly windowFrames = 60,
    private readonly thresholdFps = 45,
  ) {}

  push(dtMs: number): 'pending' | 'keep' | 'degrade' {
    if (this.settled) return 'keep';
    this.frames += 1;
    this.elapsedMs += dtMs;
    if (this.frames < this.windowFrames) return 'pending';
    this.settled = true;
    const fps = 1000 / (this.elapsedMs / this.frames);
    return fps < this.thresholdFps ? 'degrade' : 'keep';
  }

  get done(): boolean {
    return this.settled;
  }
}
```

- [ ] **Step 4: Run the kept tests to verify they pass**

Run: `npx vitest run tests/prng.test.ts tests/easing.test.ts tests/time.test.ts tests/quality.test.ts tests/env.test.ts`

Expected: PASS, `Test Files  5 passed (5)`, `Tests  17 passed (17)`.

- [ ] **Step 5: Retire the teaser engine (spec 2.2.1–2.2.3, 2.2.6, Appendix A §1.1–§1.3)**

```bash
git rm src/app.ts src/tweaks.ts src/engine/ParticleField.ts src/engine/defaults.ts \
  src/shaders/field.vert src/shaders/field.frag src/shaders/noise.glsl src/boot/webgl.ts \
  scripts/og-placeholder.mjs tests/defaults.test.ts tests/webgl.test.ts tests/sampler.test.ts
```

Expected: twelve `rm '…'` lines; `src/shaders/` no longer exists. `src/engine/` keeps exactly `motion.ts`, `sampler.ts` and `types.ts` (P10: they still typecheck on their own; `tests/motion.test.ts` and `tests/helpers/fakeCanvas.ts` still import them).

Full file `src/main.ts` (the interim boot: the teaser imports are gone, and the static fallback class keeps the empty canvas hidden):

```ts
// Task 1 interim boot: the teaser engine is retired; Task 8 writes the résumé boot.
document.documentElement.classList.add('no-webgl');
export {};
```

Full file `vite.config.ts` (spec 4.1.5: `chunkSizeWarningLimit: 700` and its comment go; `vitest.config.ts` and `tsconfig.json` stay unchanged):

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
```

- [ ] **Step 6: Remove Three.js, add the OG-script dependencies, raise the Node floor (spec 4.1.1–4.1.4, Appendix A §1.4)**

Edit `package.json` first, so npm writes the new floor into the lockfile's root entry when it regenerates it. Two hunks:

```diff
-  "engines": { "node": ">=22.12.0" },
+  "engines": { "node": ">=22.18.0" },
```

```diff
     "fonts": "node scripts/subset-fonts.mjs",
-    "og:placeholder": "node scripts/og-placeholder.mjs",
     "og": "node scripts/og-image.mjs",
```

Then run:

```bash
npm uninstall three @types/three
npm install --save-dev --save-exact harfbuzzjs@1.6.3 fontverter@2.0.0
```

Expected: the uninstall prints `removed 8 packages, and audited 80 packages in …` and `found 0 vulnerabilities`; the install prints `up to date, audited 80 packages in …` (both packages are already in the tree as `subset-font` dependencies) and `found 0 vulnerabilities`. Both may also print the harmless `npm warn allow-scripts … esbuild@0.28.2 … workerd@…` lines. npm reformats `engines` onto three lines and deletes the now-empty `dependencies` key.

Restore the explicit empty `dependencies` (Global Constraints: `dependencies` is `{}`). Full file `package.json`:

```json
{
  "name": "parsanaji.com",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22.18.0"
  },
  "scripts": {
    "dev": "vite --host",
    "build": "tsc --noEmit -p tsconfig.json && vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "fonts": "node scripts/subset-fonts.mjs",
    "og": "node scripts/og-image.mjs",
    "deploy": "npm run build && wrangler pages deploy dist --project-name parsanaji-com --branch main --commit-dirty=true",
    "deploy:preview": "npm run build && wrangler pages deploy dist --project-name parsanaji-com --branch preview --commit-dirty=true"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "22.20.5",
    "fontverter": "2.0.0",
    "harfbuzzjs": "1.6.3",
    "lil-gui": "0.21.0",
    "sharp": "0.35.5",
    "subset-font": "2.9.0",
    "typescript": "5.9.3",
    "vite": "8.3.4",
    "vitest": "5.0.5",
    "wrangler": "4.151.0"
  }
}
```

Verify the lockfile agrees with it exactly as CI will:

```bash
npm ci
npm ls --depth=0
sed -n '7,25p' package-lock.json
```

Expected: `npm ci` prints `added 79 packages, and audited 80 packages in …` and `found 0 vulnerabilities`. `npm ls --depth=0` prints exactly ten entries and no `three`:

```
parsanaji.com@0.1.0 C:\Users\parsa\parsanaji.com
+-- @types/node@22.20.5
+-- fontverter@2.0.0
+-- harfbuzzjs@1.6.3
+-- lil-gui@0.21.0
+-- sharp@0.35.5
+-- subset-font@2.9.0
+-- typescript@5.9.3
+-- vite@8.3.4
+-- vitest@5.0.5
`-- wrangler@4.151.0
```

The lockfile root (`packages[""]`) lists the same ten devDependencies, has no `dependencies` block and ends with `"engines": { "node": ">=22.18.0" }`. `git diff --stat package-lock.json` shows `3 insertions(+), 68 deletions(-)` (three, @types/three and their six transitive packages `@dimforge/rapier3d-compat`, `@tweenjs/tween.js`, `@types/stats.js`, `@types/webxr`, `fflate`, `meshoptimizer` leave; `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` stay for CI).

- [ ] **Step 7: Full gate**

```bash
npm test
npm run typecheck
npm run build
grep -l "WebGLRenderer" dist/assets/*.js || echo "no WebGLRenderer in dist"
```

Expected:
- `npm test`: `Test Files  8 passed (8)`, `Tests  32 passed (32)` (clock 4, easing 3, env 3, fonts 5, motion 6, prng 4, quality 4, time 3).
- `npm run typecheck`: the two npm header lines and nothing else.
- `npm run build`: `✓ 5 modules transformed.`, then `dist/index.html 3.20 kB`, `dist/assets/index-….css 3.30 kB`, `dist/assets/index-….js 0.72 kB │ gzip: 0.41 kB` and `✓ built in …ms` (the bundle shrinks from about 547 kB minified to under 1 kB).
- The grep prints `no WebGLRenderer in dist`.

Record `npm ls --depth=0`, the build output and the grep line in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-1-report.md`.

- [ ] **Step 8: Commit**

`git mv` and `git rm` already staged the moves and deletions. Stage the edited files by name:

```bash
git add package.json package-lock.json vite.config.ts src/main.ts src/core/quality.ts \
  tests/env.test.ts tests/prng.test.ts tests/easing.test.ts tests/time.test.ts tests/quality.test.ts
git status --short
```

Expected `git status --short` (untracked `docs/` lines, if any, stay unstaged; `quality.ts` shows as delete plus add because more than half of it went):

```
M  package-lock.json
M  package.json
D  scripts/og-placeholder.mjs
D  src/app.ts
D  src/boot/webgl.ts
R  src/engine/easing.ts -> src/core/easing.ts
R  src/engine/prng.ts -> src/core/prng.ts
A  src/core/quality.ts
R  src/engine/time.ts -> src/core/time.ts
D  src/engine/ParticleField.ts
D  src/engine/defaults.ts
D  src/engine/quality.ts
M  src/main.ts
D  src/shaders/field.frag
D  src/shaders/field.vert
D  src/shaders/noise.glsl
D  src/tweaks.ts
D  tests/defaults.test.ts
M  tests/easing.test.ts
M  tests/env.test.ts
M  tests/prng.test.ts
M  tests/quality.test.ts
D  tests/sampler.test.ts
M  tests/time.test.ts
D  tests/webgl.test.ts
M  vite.config.ts
```

```bash
git commit -m "refactor: retire the teaser engine and Three.js; utilities move to src/core

Removes three, @types/three, the particle field, its shaders, the teaser App and
debug panel, the WebGL probe and the placeholder OG script. prng, easing, time and
quality move to src/core (quality keeps capDpr and FpsProbe). Adds harfbuzzjs and
fontverter for the OG script and raises engines.node to >=22.18.0.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: JetBrains Mono subsets

**Files:**
- Create: `scripts/fonts-src/JetBrainsMono-Regular.woff2`, `scripts/fonts-src/JetBrainsMono-Bold.woff2`, `scripts/fonts-src/OFL.txt` — extracted from `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip` (members `fonts/webfonts/JetBrainsMono-Regular.woff2`, `fonts/webfonts/JetBrainsMono-Bold.woff2`, `OFL.txt`) after downloading the zip into its own new, empty directory outside the repo; only those three members are extracted (Windows `tar -xf` reads zip); sizes 92,164 / 94,588 / 4,399 bytes.
- Modify: `scripts/subset-fonts.mjs` (jobs Regular → `JetBrainsMono-Regular.subset.woff2`, Bold → `JetBrainsMono-Bold.subset.woff2`; text = printable ASCII U+0020–U+007E + `·—–●○…’“”é`; options `{ targetFormat: 'woff2', noLayoutClosure: true }`; copy `scripts/fonts-src/OFL.txt` to `public/fonts/LICENSE.txt`; keep the 40 KB total check with exit code 1).
- Create (generated): `public/fonts/JetBrainsMono-Regular.subset.woff2`, `public/fonts/JetBrainsMono-Bold.subset.woff2`. Modify (generated): `public/fonts/LICENSE.txt`.
- Delete: `scripts/fonts-src/Geist-Black.woff2`, `scripts/fonts-src/GeistMono-Regular.woff2`, `scripts/fonts-src/LICENSE.txt`, `public/fonts/GeistSans-Black.subset.woff2`, `public/fonts/GeistMono-Regular.subset.woff2`.

**Interfaces:**
- Consumes: none.
- Produces: the served font files `/fonts/JetBrainsMono-Regular.subset.woff2` (weight 400) and `/fonts/JetBrainsMono-Bold.subset.woff2` (weight 700), family name `JetBrains Mono` (consumed by Task 5 preloads and Task 6 `@font-face`); the full source fonts `scripts/fonts-src/JetBrainsMono-Bold.woff2` and `scripts/fonts-src/JetBrainsMono-Regular.woff2` (consumed by Task 4).

- [ ] **Step 1: Download the v2.304 release into a new empty directory outside the repo (spec 4.11.1, 9.17)**

Git Bash's own `tar` is GNU tar and cannot read zip archives; call the Windows bsdtar by its full path. Shell variables do not survive between Bash tool calls: run this block as one call, and in Step 2 replace `$JBM` with the path it echoes first (for example `/tmp/tmp.NgESsHZ8nu`).

```bash
JBM=$(mktemp -d)
echo "$JBM"
ls -A "$JBM" | wc -l
curl -fL --retry 3 -s -o "$JBM/JetBrainsMono-2.304.zip" https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip
sha256sum "$JBM/JetBrainsMono-2.304.zip"
/c/Windows/System32/tar.exe -xf "$JBM/JetBrainsMono-2.304.zip" -C "$JBM" fonts/webfonts/JetBrainsMono-Regular.woff2 fonts/webfonts/JetBrainsMono-Bold.woff2 OFL.txt
find "$JBM" -type f | sort
wc -c "$JBM/fonts/webfonts/JetBrainsMono-Regular.woff2" "$JBM/fonts/webfonts/JetBrainsMono-Bold.woff2" "$JBM/OFL.txt"
```

Expected: the new directory's path, then `0` (the directory starts empty); the zip's SHA-256 is `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf` (5,622,857 bytes); `find` lists exactly the zip, `OFL.txt` and the two woff2 files; the sizes are:

```
 92164 …/fonts/webfonts/JetBrainsMono-Regular.woff2
 94588 …/fonts/webfonts/JetBrainsMono-Bold.woff2
  4399 …/OFL.txt
```

Member SHA-256s, for the report: Regular `a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2`, Bold `c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2`, `OFL.txt` `30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad`.

- [ ] **Step 2: Vendor the three files and remove Geist (spec 2.2.4)**

```bash
cp "$JBM/fonts/webfonts/JetBrainsMono-Regular.woff2" "$JBM/fonts/webfonts/JetBrainsMono-Bold.woff2" "$JBM/OFL.txt" scripts/fonts-src/
git rm scripts/fonts-src/Geist-Black.woff2 scripts/fonts-src/GeistMono-Regular.woff2 scripts/fonts-src/LICENSE.txt \
  public/fonts/GeistSans-Black.subset.woff2 public/fonts/GeistMono-Regular.subset.woff2
ls -l scripts/fonts-src
```

Expected: five `rm '…'` lines; `scripts/fonts-src/` holds exactly `JetBrainsMono-Bold.woff2` (94588), `JetBrainsMono-Regular.woff2` (92164) and `OFL.txt` (4399).

- [ ] **Step 3: Rewrite the subset script (spec 4.11.2, 4.11.3)**

Full file `scripts/subset-fonts.mjs`:

```js
// Generates the two self-hosted JetBrains Mono subsets from the vendored v2.304 sources in scripts/fonts-src/ (SIL OFL 1.1).
// Run: node scripts/subset-fonts.mjs   (also: npm run fonts). Spec 4.11.
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import subsetFont from 'subset-font';

const srcDir = path.resolve('scripts/fonts-src');
const outDir = path.resolve('public/fonts');

// Printable ASCII U+0020-U+007E plus the typography the page and its scripts write (spec 4.11.2, 3.5.13).
const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const TEXT = `${ASCII}·—–●○…’“”é`;
// Without noLayoutClosure the coding-ligature closure makes the pair 57.3 KB (spec 4.11.2, risk 9.2).
const OPTIONS = { targetFormat: 'woff2', noLayoutClosure: true };

const jobs = [
  { src: 'JetBrainsMono-Regular.woff2', out: 'JetBrainsMono-Regular.subset.woff2' },
  { src: 'JetBrainsMono-Bold.woff2', out: 'JetBrainsMono-Bold.subset.woff2' },
];

await mkdir(outDir, { recursive: true });
// OFL 1.1 condition 2: the license travels with every redistributed copy, subsets included.
await copyFile(path.join(srcDir, 'OFL.txt'), path.join(outDir, 'LICENSE.txt'));
let total = 0;
for (const job of jobs) {
  const input = await readFile(path.join(srcDir, job.src));
  const output = await subsetFont(input, TEXT, OPTIONS);
  const outPath = path.join(outDir, job.out);
  await writeFile(outPath, output);
  const { size } = await stat(outPath);
  total += size;
  console.log(`${job.out}: ${(size / 1024).toFixed(1)} KB (from ${(input.length / 1024).toFixed(1)} KB)`);
}
console.log(`total: ${(total / 1024).toFixed(1)} KB (budget 40 KB)`);
if (total > 40 * 1024) {
  console.error('font budget exceeded');
  process.exit(1);
}
```

- [ ] **Step 4: Generate the subsets and check the budget (spec 6.1.2)**

```bash
npm run fonts; echo "exit $?"
ls -l public/fonts
sha256sum public/fonts/*.woff2
```

Expected:

```
> parsanaji.com@0.1.0 fonts
> node scripts/subset-fonts.mjs

JetBrainsMono-Regular.subset.woff2: 12.0 KB (from 90.0 KB)
JetBrainsMono-Bold.subset.woff2: 12.1 KB (from 92.4 KB)
total: 24.1 KB (budget 40 KB)
exit 0
```

`public/fonts/` holds exactly `JetBrainsMono-Bold.subset.woff2` (12,348 bytes), `JetBrainsMono-Regular.subset.woff2` (12,320 bytes) and `LICENSE.txt` (4,399 bytes, a copy of `OFL.txt`). The output is deterministic: SHA-256 Bold `c45140cf1da3646406a7ba189d3089f363fe5efa2e2766eb3130fdb0626a7331`, Regular `18fd3f730acca10c34aef1f9873019b2e71357487b91b48ff4b5ac768acd677b`. A second `npm run fonts` reproduces the same bytes.

- [ ] **Step 5: Confirm every glyph the page and its scripts write is in both subsets (Global Constraints, 3.5.13)**

```bash
node --input-type=module -e "
import { readFile } from 'node:fs/promises';
import fontverter from 'fontverter';
import * as hb from 'harfbuzzjs';
const ASCII = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)).join('');
const TEXT = ASCII + '·—–●○…’“”é';
for (const w of ['Regular', 'Bold']) {
  const sfnt = await fontverter.convert(await readFile('public/fonts/JetBrainsMono-' + w + '.subset.woff2'), 'sfnt');
  const have = new Set(new hb.Face(new hb.Blob(new Uint8Array(sfnt)), 0).collectUnicodes());
  console.log(w, have.size, 'code points, missing:', JSON.stringify([...TEXT].filter((c) => !have.has(c.codePointAt(0))).join('')));
}
"
```

Expected:

```
Regular 105 code points, missing: ""
Bold 105 code points, missing: ""
```

(95 printable ASCII + 10 extras; the clock, the scramble glyphs and "copied" are all inside.)

- [ ] **Step 6: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  8 passed (8)`, `Tests  32 passed (32)`; typecheck silent; the build succeeds (`✓ built in …ms`). Until Task 6 rewrites `src/styles.css`, the build also prints two notices, `/fonts/GeistSans-Black.subset.woff2 referenced in … didn't resolve at build time, it will remain unchanged to be resolved at runtime` and the same for `GeistMono-Regular`; they are expected and disappear in Task 6. Record the member sizes, hashes and the `npm run fonts` output in `task-2-report.md`.

- [ ] **Step 7: Commit**

```bash
git add scripts/subset-fonts.mjs scripts/fonts-src/JetBrainsMono-Regular.woff2 scripts/fonts-src/JetBrainsMono-Bold.woff2 \
  scripts/fonts-src/OFL.txt public/fonts/JetBrainsMono-Regular.subset.woff2 public/fonts/JetBrainsMono-Bold.subset.woff2 \
  public/fonts/LICENSE.txt
git status --short
```

Expected (git may pair the two licence files as a rename):

```
D  public/fonts/GeistMono-Regular.subset.woff2
D  public/fonts/GeistSans-Black.subset.woff2
A  public/fonts/JetBrainsMono-Bold.subset.woff2
A  public/fonts/JetBrainsMono-Regular.subset.woff2
M  public/fonts/LICENSE.txt
D  scripts/fonts-src/Geist-Black.woff2
D  scripts/fonts-src/GeistMono-Regular.woff2
A  scripts/fonts-src/JetBrainsMono-Bold.woff2
A  scripts/fonts-src/JetBrainsMono-Regular.woff2
R  scripts/fonts-src/LICENSE.txt -> scripts/fonts-src/OFL.txt
M  scripts/subset-fonts.mjs
```

```bash
git commit -m "feat(fonts): JetBrains Mono 400/700 subsets replace Geist

Vendors JetBrains Mono v2.304 (OFL 1.1) and subsets printable ASCII plus
·—–●○…’“”é with noLayoutClosure: 12.0 + 12.1 = 24.1 KB against the 40 KB budget.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Surface math twin (`src/field/surface.ts`)

**Files:** Create `src/field/surface.ts`, `tests/surface.test.ts`.

**Interfaces:**
- Consumes: none (the module has zero imports).
- Produces (`src/field/surface.ts`):
  ```ts
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
  ```
- Semantics later tasks rely on: `hash3` is the 3.3.5 Blueprint hash in 32-bit unsigned arithmetic with `z & 255`, returning `h / 2³²`; `fbm(x, y, z1, z2) = 0.62 × noise3(x, y, z1) + 0.38 × noise3(2.1x + 7.3, 2.1y + 1.7, z2)`; `flowZ` returns `[zA, 1.4zA + 3.1, zB, 1.4zB + 3.1, zC, 1.4zC + 3.1]` with `zA = 0.09 × tSec × intensity`, `zB = zA + 2`, `zC = 0.14 × tSec × intensity`, each wrapped to [0, 256) in double precision; `surface()` is `F`, 3.3.4 steps 3–6 at breath 1 with no pointer, mask or rings (`z[0..1]` warp-x, `z[2..3]` warp-y, `z[4..5]` main; lattice offset `NOISE_OFFSET`); `tierGrid` evaluates cell centres `((i + 0.5) × cellCss, (j + 0.5) × cellCss)` with row `j = 0` at the top, `z = flowZ(tSec, intensity)`, `v = min(1, surface + Σ ringGain)`, tiers by `tierOf` with the defaults, stored row-major at `j × cols + i`.

Note on `flowZ`: a wrapped value in [255.9999924, 256) rounds up to exactly 256 when stored in the `Float32Array`; the module stores it as 0 instead, which is the same point of the z-periodic noise, so the "six values in [0, 256)" contract holds for every input (spec 9.11).

- [ ] **Step 1: Write the failing test**

Full file `tests/surface.test.ts` (spec 8.1.1, Appendix A §9.1; the Blueprint `hash` and `BAYER8` are copied verbatim from `part-c.html` lines 138 and 144; the golden checksum `0xa3198d09` and the coverage figures come from running this module):

```ts
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import {
  BAYER8,
  BLUEPRINT_SHAPE,
  NOISE_OFFSET,
  Z_PERIOD,
  bayerThreshold,
  fbm,
  flowZ,
  hash3,
  noise3,
  ringGain,
  surface,
  tierGrid,
  tierOf,
  type Ring,
} from '../src/field/surface';

// Blueprint part-c.html line 138, verbatim (no z mask): the reference hash3 must match bit for bit (spec 3.3.5).
// prettier-ignore
function blueprintHash(x: number, y: number, z: number): number { let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1013904223); h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }

// Blueprint part-c.html line 144, verbatim.
// prettier-ignore
const BLUEPRINT_BAYER8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];

const fnv1a = (bytes: Uint8Array): number => {
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

const coverage = (tiers: Uint8Array): number[] => {
  const c = [0, 0, 0, 0];
  for (const t of tiers) c[t] += 1;
  return c.map((n) => (100 * n) / tiers.length);
};

describe('hash3 (3.3.5)', () => {
  it('equals the verbatim Blueprint hash on 1000 seeded integer triples with z in [0, 256)', () => {
    const r = mulberry32(1);
    for (let k = 0; k < 1000; k++) {
      const x = Math.floor(r() * 4096);
      const y = Math.floor(r() * 4096);
      const z = Math.floor(r() * 256);
      expect(hash3(x, y, z)).toBe(blueprintHash(x, y, z));
    }
  });

  it('masks z to 8 bits, so z and z + 256 hash alike', () => {
    expect(hash3(300, 301, 7 + 256)).toBe(hash3(300, 301, 7));
    expect(hash3(300, 301, 256)).toBe(hash3(300, 301, 0));
  });
});

describe('noise3 and fbm (3.3.5)', () => {
  it('is periodic in z with period 256', () => {
    const r = mulberry32(2);
    for (let k = 0; k < 1000; k++) {
      const x = NOISE_OFFSET + r() * 40;
      const y = NOISE_OFFSET + r() * 40;
      const z = r() * Z_PERIOD;
      expect(Math.abs(noise3(x, y, z) - noise3(x, y, z + Z_PERIOD))).toBeLessThanOrEqual(1e-12);
    }
  });

  it('stays in [0, 1)', () => {
    const r = mulberry32(3);
    for (let k = 0; k < 10_000; k++) {
      const v = noise3(NOISE_OFFSET + r() * 100, NOISE_OFFSET + r() * 100, r() * Z_PERIOD);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is continuous across lattice faces on every axis', () => {
    const r = mulberry32(4);
    for (let k = 0; k < 200; k++) {
      const x = NOISE_OFFSET + 1 + Math.floor(r() * 50);
      const y = NOISE_OFFSET + 1 + Math.floor(r() * 50);
      const z = 1 + Math.floor(r() * 250);
      const fy = y + r();
      const fz = z + r();
      expect(Math.abs(noise3(x - 1e-9, fy, fz) - noise3(x + 1e-9, fy, fz))).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(noise3(x + 0.3, y - 1e-9, fz) - noise3(x + 0.3, y + 1e-9, fz))).toBeLessThanOrEqual(1e-9);
      expect(Math.abs(noise3(x + 0.3, fy, z - 1e-9) - noise3(x + 0.3, fy, z + 1e-9))).toBeLessThanOrEqual(1e-9);
    }
  });

  it('is continuous across the z wrap (255.9999999 versus 0.0000001)', () => {
    expect(Math.abs(noise3(300.3, 301.7, 255.9999999) - noise3(300.3, 301.7, 1e-7))).toBeLessThan(1e-6);
  });

  it('fbm is 0.62 noise3(p, z1) + 0.38 noise3(2.1p + (7.3, 1.7), z2)', () => {
    const v = fbm(260.25, 270.5, 12.5, 20.6);
    expect(v).toBe(0.62 * noise3(260.25, 270.5, 12.5) + 0.38 * noise3(260.25 * 2.1 + 7.3, 270.5 * 2.1 + 1.7, 20.6));
  });
});

describe('flowZ (3.3.6.2)', () => {
  const rawZ = (t: number): number[] => {
    const zA = 0.09 * t;
    const zB = zA + 2;
    const zC = 0.14 * t;
    return [zA, 1.4 * zA + 3.1, zB, 1.4 * zB + 3.1, zC, 1.4 * zC + 3.1];
  };
  const mod256 = (z: number): number => z - 256 * Math.floor(z / 256);

  it('returns six values in [0, 256) equal to the raw formula mod 256', () => {
    for (const t of [0, 1, 12, 300, 2844.5, 86_400, 1e6]) {
      const z = flowZ(t, 1);
      expect(z).toHaveLength(6);
      rawZ(t).forEach((raw, k) => {
        expect(z[k]).toBeGreaterThanOrEqual(0);
        expect(z[k]).toBeLessThan(256);
        expect(z[k]).toBe(Math.fround(mod256(raw)));
      });
    }
  });

  it('scales time by the intensity and fills the given buffer', () => {
    const out = new Float32Array(6);
    expect(flowZ(10, 1.7, out)).toBe(out);
    const ref = flowZ(17, 1);
    out.forEach((z, k) => expect(z).toBeCloseTo(ref[k], 5));
  });

  it('stores a value that float32 would round up to 256 as 0', () => {
    expect(flowZ((256 - 1e-6) / 0.09, 1)[0]).toBe(0);
  });

  it('keeps the surface continuous across the zA wrap at t = 256 / 0.09', () => {
    const t0 = 256 / 0.09;
    const before = flowZ(t0 - 1e-4, 1);
    const after = flowZ(t0 + 1e-4, 1);
    expect(before[0]).toBeGreaterThan(255.99);
    expect(after[0]).toBeLessThan(0.01);
    const r = mulberry32(5);
    for (let k = 0; k < 500; k++) {
      const x = r() * 1440;
      const y = r() * 900;
      expect(Math.abs(surface(x, y, before) - surface(x, y, after))).toBeLessThan(1e-3);
    }
  });
});

describe('surface (3.3.4, 3.3.10 reachability)', () => {
  it('never exceeds the dither-curve peak 0.703125, so the boost alone never reaches field-3', () => {
    const r = mulberry32(6);
    let max = 0;
    for (let k = 0; k < 100_000; k++) {
      const v = surface(r() * 3000, r() * 2000, flowZ(r() * 4000, 1));
      expect(v).toBeGreaterThanOrEqual(0);
      if (v > max) max = v;
    }
    expect(max).toBeLessThanOrEqual(0.703125 + 1e-12);
    expect(max + 0.12).toBeLessThan(0.9);
  });

  it('defaults to the Blueprint shape', () => {
    expect(BLUEPRINT_SHAPE).toEqual({ warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 });
    const z = flowZ(12, 1);
    expect(surface(333, 444, z)).toBe(surface(333, 444, z, BLUEPRINT_SHAPE));
  });
});

describe('Bayer tiers (3.3.10)', () => {
  it('BAYER8 is the Blueprint matrix and a permutation of 0..63', () => {
    expect([...BAYER8]).toEqual(BLUEPRINT_BAYER8);
    expect([...BAYER8].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i));
  });

  it('bayerThreshold spans [1/128, 127/128] and repeats every 8 cells', () => {
    const all: number[] = [];
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) all.push(bayerThreshold(i, j));
    expect(Math.min(...all)).toBe(1 / 128);
    expect(Math.max(...all)).toBe(127 / 128);
    expect(bayerThreshold(3 + 8, 5 + 16)).toBe(bayerThreshold(3, 5));
  });

  it('tierOf uses strict > at the Bayer threshold, 0.66 and 0.9', () => {
    // cell (0, 0) has B = 0, threshold 1/128
    expect(tierOf(1 / 128, 0, 0)).toBe(0);
    expect(tierOf(1 / 128 + 1e-9, 0, 0)).toBe(1);
    expect(tierOf(0.66, 0, 0)).toBe(1);
    expect(tierOf(0.66 + 1e-9, 0, 0)).toBe(2);
    expect(tierOf(0.9, 0, 0)).toBe(2);
    expect(tierOf(0.9 + 1e-9, 0, 0)).toBe(3);
    // cell (7, 7) has B = 21: threshold 21.5 / 64
    expect(tierOf(0.3, 7, 7)).toBe(0);
    expect(tierOf(0.34, 7, 7)).toBe(1);
    expect(tierOf(0.7, 0, 0, 0.75, 0.95)).toBe(1);
  });
});

describe('rings (3.3.8.2)', () => {
  const ring: Ring = { x: 100, y: 100, radius: 50, amp: 0.975, sigma: 40, gain: 0.9 };

  it('ringGain is gain * amp * exp(-(d - r)^2 / (2 sigma^2))', () => {
    expect(ringGain(150, 100, ring)).toBeCloseTo(0.9 * 0.975, 12);
    expect(ringGain(190, 100, ring)).toBeCloseTo(0.9 * 0.975 * Math.exp(-0.5), 12);
    expect(ringGain(100, 100, ring)).toBeCloseTo(0.9 * 0.975 * Math.exp(-(50 * 50) / (2 * 40 * 40)), 12);
  });
});

describe('tierGrid (3.3.10, 4.10.3)', () => {
  it('is row-major with row 0 at the top and matches tierOf(surface) per cell', () => {
    const cols = 7;
    const rows = 4;
    const g = tierGrid(cols, rows, 6, 12, 1);
    const z = flowZ(12, 1);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        expect(g[j * cols + i]).toBe(tierOf(surface((i + 0.5) * 6, (j + 0.5) * 6, z), i, j));
      }
    }
  });

  it('is deterministic: golden FNV-1a checksum of the 200 x 105 OG grid (cell 6) at t = 12', () => {
    const a = tierGrid(200, 105, 6, 12, 1);
    expect(a).toEqual(tierGrid(200, 105, 6, 12, 1));
    expect(a).toHaveLength(21_000);
    expect(fnv1a(a)).toBe(0xa3198d09);
  });

  it('covers 1440 x 900 at cell 5 (288 x 180), t = 12, inside the 3.3.10 bands', () => {
    const [off, f1, f2, f3] = coverage(tierGrid(288, 180, 5, 12, 1));
    expect(off).toBeGreaterThanOrEqual(50);
    expect(off).toBeLessThanOrEqual(70);
    expect(f1).toBeGreaterThanOrEqual(20);
    expect(f1).toBeLessThanOrEqual(35);
    expect(f2).toBeGreaterThanOrEqual(2);
    expect(f2).toBeLessThanOrEqual(20);
    expect(f3).toBe(0);
  });

  it('shows field-3 only with a ring', () => {
    const ring: Ring = { x: 720, y: 450, radius: 162, amp: 0.975, sigma: 48, gain: 0.9 };
    expect(coverage(tierGrid(288, 180, 5, 12, 1, [ring]))[3]).toBeGreaterThan(0);
  });
});

describe('surface.ts stays importable by Node type stripping (4.10.2)', () => {
  const src = readFileSync('src/field/surface.ts', 'utf8').replace(/\r\n/g, '\n');

  it('has no import statement and no non-erasable TypeScript', () => {
    expect(src).not.toMatch(/^\s*import[\s{*'"]/m);
    expect(src).not.toMatch(/^\s*export\s+[^\n]*\bfrom\s+['"]/m);
    expect(src).not.toMatch(/\benum\s|\bnamespace\s/);
  });

  it('loads in plain Node and builds a 4 x 2 grid', () => {
    const run = spawnSync(
      process.execPath,
      ['-e', "import('./src/field/surface.ts').then(m => console.log(m.tierGrid(4, 2, 6, 12, 1).length))"],
      { encoding: 'utf8' },
    );
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).toBe('8');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/surface.test.ts`

Expected: FAIL, `Test Files  1 failed (1)`, `Tests  no tests`, with `Error: Cannot find module '../src/field/surface' imported from …/tests/surface.test.ts`.

- [ ] **Step 3: Write the module (spec 3.3.4, 3.3.5, 3.3.6.2, 3.3.8.2, 3.3.10, 4.10.2; Appendix A §3.1, §3.4, §3.8)**

Full file `src/field/surface.ts`:

```ts
// Pure TypeScript twin of the pass-1 GLSL math (spec 3.3.4, 3.3.5, 3.3.10; Appendix A §3.4, §3.8).
// Self-contained: no import statements and only erasable TypeScript (no enums, namespaces or parameter
// properties), because scripts/og-image.mjs imports this file through Node type stripping (spec 4.10.2).

/** Added to every lattice x/y coordinate so the GLSL uint conversion never sees a negative value (3.3.5). */
export const NOISE_OFFSET = 256;
/** The hash masks z with 255, so the noise is periodic in z with this period and the CPU can wrap time (3.3.5). */
export const Z_PERIOD = 256;

/** Blueprint hash (part-c.html) in 32-bit unsigned arithmetic with z masked to 8 bits. Returns h / 2^32 in [0, 1). */
export function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((z | 0) & 255, 1013904223);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Blueprint noise3: trilinear value noise with the smoothstep fade f^2 (3 - 2f). x, y >= 0; z in [0, 256). */
export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let fx = x - xi;
  let fy = y - yi;
  let fz = z - zi;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number): number => a + (b - a) * t;
  const c000 = hash3(xi, yi, zi);
  const c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi);
  const c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1);
  const c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1);
  const c111 = hash3(xi + 1, yi + 1, zi + 1);
  return l(l(l(c000, c100, fx), l(c010, c110, fx), fy), l(l(c001, c101, fx), l(c011, c111, fx), fy), fz);
}

/** Blueprint two-octave fbm (3.3.5); z2 is the Blueprint's z * 1.4 + 3.1, passed in already wrapped. */
export function fbm(x: number, y: number, z1: number, z2: number): number {
  return 0.62 * noise3(x, y, z1) + 0.38 * noise3(x * 2.1 + 7.3, y * 2.1 + 1.7, z2);
}

const wrapZ = (z: number): number => z - Z_PERIOD * Math.floor(z / Z_PERIOD);

/** Writes z wrapped to [0, 256); a value that float32 storage rounds up to 256 becomes 0, the same noise point. */
function storeZ(out: Float32Array, k: number, z: number): void {
  out[k] = wrapZ(z);
  if (out[k] >= Z_PERIOD) out[k] = 0;
}

/**
 * The six noise z coordinates of one frame (3.3.6.2): [zA, 1.4zA + 3.1, zB, 1.4zB + 3.1, zC, 1.4zC + 3.1] with
 * zA = 0.09 t I, zB = zA + 2, zC = 0.14 t I, each wrapped to [0, 256) in double precision (spec 9.11).
 */
export function flowZ(tSec: number, intensity: number, out: Float32Array = new Float32Array(6)): Float32Array {
  const zA = 0.09 * tSec * intensity;
  const zB = zA + 2;
  const zC = 0.14 * tSec * intensity;
  storeZ(out, 0, zA);
  storeZ(out, 1, 1.4 * zA + 3.1);
  storeZ(out, 2, zB);
  storeZ(out, 3, 1.4 * zB + 3.1);
  storeZ(out, 4, zC);
  storeZ(out, 5, 1.4 * zC + 3.1);
  return out;
}

export interface SurfaceShape {
  /** CSS px per warp-noise unit (Blueprint 240) */
  warpScalePx: number;
  /** CSS px per main-noise unit (Blueprint 160) */
  mainScalePx: number;
  /** domain-warp strength in noise units (Blueprint 2.6) */
  warpAmp: number;
  /** level subtracted before the gain (Blueprint dither 0.3) */
  level: number;
  /** gain after the level (Blueprint 2.1) */
  gain: number;
}

export const BLUEPRINT_SHAPE: SurfaceShape = { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 };

/** F at a sample point in CSS px: 3.3.4 steps 3-6 at breath 1, without pointer, mask or rings. Returns [0, 1]. */
export function surface(xCss: number, yCss: number, z: ArrayLike<number>, s: SurfaceShape = BLUEPRINT_SHAPE): number {
  const ax = xCss / s.warpScalePx + NOISE_OFFSET;
  const ay = yCss / s.warpScalePx + NOISE_OFFSET;
  const wx = fbm(ax + 3.1, ay, z[0], z[1]);
  const wy = fbm(ax, ay + 7.7, z[2], z[3]);
  let v = fbm(
    xCss / s.mainScalePx + NOISE_OFFSET + (wx - 0.5) * s.warpAmp,
    yCss / s.mainScalePx + NOISE_OFFSET + (wy - 0.5) * s.warpAmp,
    z[4],
    z[5],
  );
  v = Math.min(1, Math.max(0, (v - s.level) * s.gain));
  return Math.min(1, v * 0.7 + 0.4 * (1 - Math.abs(1 - 2 * v)) * v);
}

/** One Shockwave ring at a fixed age (3.3.8.2): origin, radius and sigma in CSS px. */
export interface Ring {
  x: number;
  y: number;
  radius: number;
  amp: number;
  sigma: number;
  gain: number;
}

/** gain * amp * exp(-(d - r)^2 / (2 sigma^2)), d = distance from the ring origin (3.3.8.2). */
export function ringGain(xCss: number, yCss: number, ring: Ring): number {
  const dx = xCss - ring.x;
  const dy = yCss - ring.y;
  const e = Math.sqrt(dx * dx + dy * dy) - ring.radius;
  return ring.gain * ring.amp * Math.exp(-(e * e) / (2 * ring.sigma * ring.sigma));
}

/** Blueprint BAYER8, row-major: index = (i & 7) | ((j & 7) << 3), i = cell column, j = cell row from the top. */
export const BAYER8: readonly number[] = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

/** Bayer threshold of cell (i, j): (B + 0.5) / 64, in [1/128, 127/128] (3.3.10). */
export function bayerThreshold(i: number, j: number): number {
  return (BAYER8[(i & 7) | ((j & 7) << 3)] + 0.5) / 64;
}

/** 0 = off (field-0), 1 = field-1, 2 = field-2, 3 = field-3; strict > at every edge, as the Blueprint (3.3.10). */
export function tierOf(v: number, i: number, j: number, t2 = 0.66, t3 = 0.9): 0 | 1 | 2 | 3 {
  if (!(v > bayerThreshold(i, j))) return 0;
  return v > t3 ? 3 : v > t2 ? 2 : 1;
}

/**
 * Tiers of a cols x rows cell grid at flow time tSec: cell centres ((i + 0.5) c, (j + 0.5) c), row 0 at the top,
 * v = min(1, surface + sum of ringGain), stored row-major at j * cols + i. What the OG band draws (4.10.3).
 */
export function tierGrid(
  cols: number,
  rows: number,
  cellCss: number,
  tSec: number,
  intensity: number,
  rings: readonly Ring[] = [],
): Uint8Array {
  const z = flowZ(tSec, intensity);
  const out = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * cellCss;
      const y = (j + 0.5) * cellCss;
      let v = surface(x, y, z);
      for (const ring of rings) v += ringGain(x, y, ring);
      out[j * cols + i] = tierOf(Math.min(1, v), i, j);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/surface.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  23 passed (23)` (about 1.5 s; the 10⁵-point sweep dominates). For the report, the measured values behind the asserts: max `surface` over the sweep 0.70312499988 (so max + 0.12 = 0.82312499988); 1440×900 cell 5 at t = 12: off 59.80 %, field-1 28.35 %, field-2 11.85 %, field-3 0 %; the OG grid (200×105, cell 6, t = 12): off 58.93 %, field-1 30.66 %, field-2 10.41 %, field-3 0 %, and with the 4.10.3 ring: 51.87 / 25.24 / 10.98 / 11.91 %.

- [ ] **Step 5: Confirm the OG script's import path works in plain Node (spec 4.10.2)**

Run: `node -e "import('./src/field/surface.ts').then(m => console.log(m.tierGrid(4, 2, 6, 12, 1).length))"`

Expected: `8` (Node 24.19 prints no warning; Node 22.18+ may add an `ExperimentalWarning` about type stripping on stderr, which is harmless).

- [ ] **Step 6: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  9 passed (9)`, `Tests  55 passed (55)`; typecheck silent; the build succeeds (the two Geist notices from Task 2 still print; nothing imports `surface.ts` yet, so the bundle is unchanged).

- [ ] **Step 7: Commit**

```bash
git add src/field/surface.ts tests/surface.test.ts
git commit -m "feat(field): surface.ts, the bit-exact CPU twin of the dither math

Blueprint hash/noise3/fbm with the +256 lattice offset and z periodic in 256,
flowZ wrapped in double precision, the dither curve, Shockwave ring gain, Bayer
8x8 tiers and tierGrid for the OG band. Zero imports so Node type stripping can
load it from scripts/og-image.mjs.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: OG image and favicons

**Files:** Create `scripts/og-image.mjs`, `tests/ogAsset.test.ts`, `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png`; Modify `public/favicon.svg` (exactly the 4.10.7 bytes), `public/og.png` (regenerated). All PNGs are produced by `npm run og` and committed.

**Interfaces:**
- Consumes: Task 3 `tierGrid(cols: number, rows: number, cellCss: number, tSec: number, intensity: number, rings?: readonly Ring[]): Uint8Array`, called without rings (imported by the `.mjs` from `../src/field/surface.ts`; the OG still has no Shockwave ring, Index amendment A10); Task 2 `scripts/fonts-src/JetBrainsMono-Bold.woff2`, `scripts/fonts-src/JetBrainsMono-Regular.woff2`; Task 1 devDependencies `harfbuzzjs 1.6.3`, `fontverter 2.0.0`, `sharp 0.35.5`.
- Produces: `/og.png` (1200×630 PNG, < 300 KB), `/favicon.svg`, `/favicon-32.png` (32×32), `/favicon-192.png` (192×192), `/apple-touch-icon.png` (180×180, no alpha), referenced by Task 5's head.

- [ ] **Step 1: Write the failing guard test**

Full file `tests/ogAsset.test.ts` (spec 4.10.8, 8.1.17; the last case also pins the 4.10.7 SVG):

```ts
import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

// Guard for the committed outputs of `npm run og` (spec 4.10.8, 8.1.17).
describe('OG image and favicons', () => {
  it('public/og.png is a 1200x630 PNG under 300 KB', async () => {
    const meta = await sharp('public/og.png').metadata();
    expect(meta.format).toBe('png');
    expect([meta.width, meta.height]).toEqual([1200, 630]);
    expect(statSync('public/og.png').size).toBeLessThan(300 * 1024);
  });

  it.each([
    ['public/favicon-32.png', 32],
    ['public/favicon-192.png', 192],
    ['public/apple-touch-icon.png', 180],
  ])('%s is a %i px square PNG', async (file, size) => {
    const meta = await sharp(file).metadata();
    expect(meta.format).toBe('png');
    expect([meta.width, meta.height]).toEqual([size, size]);
  });

  it('the apple touch icon has no alpha channel', async () => {
    const meta = await sharp('public/apple-touch-icon.png').metadata();
    expect(meta.hasAlpha).toBe(false);
    expect(meta.channels).toBe(3);
  });

  it('public/favicon.svg is the 16x16 PN monogram that follows the browser scheme (4.10.7)', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8').replace(/\r\n/g, '\n');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">\n')).toBe(true);
    expect(svg).toContain('.tile{fill:#f2f6fe}.glyph{fill:#071348}@media (prefers-color-scheme:dark){.edge{fill:#3b5df0}.tile{fill:#050a22}.glyph{fill:#e8eeff}}');
    expect(svg.match(/<rect /g)).toHaveLength(31);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/ogAsset.test.ts`

Expected: FAIL, `Tests  5 failed | 1 passed (6)`. The teaser's placeholder `public/og.png` is already 1200×630 and passes; the three icon cases fail with `Error: Input file is missing: public/favicon-32.png` (and `-192`, `apple-touch-icon`, twice for the apple icon), and the SVG case fails with `AssertionError: expected false to be true`.

- [ ] **Step 3: Replace the favicon with the PN monogram (spec 3.2.7, 4.10.7, Appendix B §5.1)**

Full file `public/favicon.svg`, byte for byte (six lines, LF, 1,577 bytes):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
<style>.edge{fill:#3b5df0}.tile{fill:#f2f6fe}.glyph{fill:#071348}@media (prefers-color-scheme:dark){.edge{fill:#3b5df0}.tile{fill:#050a22}.glyph{fill:#e8eeff}}</style>
<rect class="edge" width="16" height="16" rx="3"/>
<rect class="tile" x="1" y="1" width="14" height="14" rx="2"/>
<g class="glyph"><rect x="2" y="4" width="4" height="1"/><rect x="2" y="5" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="2" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="2" y="8" width="4" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="2" y="10" width="1" height="1"/><rect x="2" y="11" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="9" y="5" width="2" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="9" y="6" width="2" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="12" y="9" width="2" height="1"/><rect x="9" y="10" width="1" height="1"/><rect x="12" y="10" width="2" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="13" y="11" width="1" height="1"/></g>
</svg>
```

Check it against the spec block (both sides with CR stripped, because `core.autocrlf=true` checks the spec out with CRLF):

```bash
diff <(sed 's/\r$//' docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-design.md | awk '/^```svg$/{f=1;next} f&&/^```$/{exit} f') <(sed 's/\r$//' public/favicon.svg) && echo "favicon matches spec 4.10.7"
```

Expected: `favicon matches spec 4.10.7`.

- [ ] **Step 4: Write the generator (spec 4.10.1–4.10.6, 11.10, 11.11, 11.21; Appendix A §7.2)**

Full file `scripts/og-image.mjs`:

```js
// Generates public/og.png (1200x630) and the three favicon PNGs. Run by hand: npm run og (spec 4.10).
// Outputs are committed; CI never runs this script, so the build never depends on harfbuzz or wasm (4.10.1).
// The dither band comes from src/field/surface.ts, the module the unit tests pin (Node >= 22.18 strips its types, 4.10.2).
// Text is drawn as glyph outlines (harfbuzzjs), so no system font or fontconfig is involved (4.10.5).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontverter from 'fontverter';
import * as hb from 'harfbuzzjs';
import sharp from 'sharp';
import { tierGrid } from '../src/field/surface.ts';

const W = 1200;
const H = 630;
const CELL = 6; // CSS px per dither cell: 200 x 105 cells (4.10.3)
const COLS = W / CELL;
const ROWS = H / CELL;
const TAU = 12; // flow time in s: the reduced-motion still (4.9 staticTimeS)
// No Shockwave ring: in a still any ring reads as solid white blobs, so the band is the plain field (4.10.3 as amended).
// Dark look (3.2.8, Appendix B §5.2).
const BG = '#050a22';
const TIER_HEX = ['#050a22', '#3b5df0', '#8db0ff', '#e8eeff'];
const NAME_HEX = '#e8eeff';
const TEXT2_HEX = '#7993da';
// Page scrim rule applied to the OG text column: alpha >= 0.86 at the name's end (x 696), clear by x 920 (4.10.4).
const SCRIM_W = 920;
const SCRIM_STOPS = [
  [0, 1],
  [384, 1],
  [704, 0.86],
  [758, 0.7],
  [812, 0.42],
  [866, 0.16],
  [920, 0],
];
const TAGLINE = 'I build AI agents, apps, and the systems behind them.';
const TAGLINE_WRAP_PX = 560;
const FONT_DIR = path.resolve('scripts/fonts-src');

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

async function loadFont(file) {
  const sfnt = await fontverter.convert(await readFile(path.join(FONT_DIR, file)), 'sfnt');
  const face = new hb.Face(new hb.Blob(new Uint8Array(sfnt)), 0);
  return { face, font: new hb.Font(face) };
}

/** Shapes `text` and returns its advance width in px and its glyphs as SVG paths placed at (x, baseline). */
function shapeText({ face, font }, text, sizePx, x, baseline) {
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  hb.shape(font, buf);
  const k = sizePx / face.upem;
  let pen = 0;
  const parts = [];
  for (const g of buf.getGlyphInfosAndPositions()) {
    const d = font.glyphToPath(g.codepoint);
    const gx = x + (pen + (g.xOffset ?? 0)) * k;
    if (d) parts.push(`<path transform="translate(${gx.toFixed(2)} ${baseline}) scale(${k} ${-k})" d="${d}"/>`);
    pen += g.xAdvance ?? 0;
  }
  return { svg: parts.join(''), width: pen * k };
}

/** Greedy word wrap on shaped advance width (4.10.5). */
function wrap(font, text, sizePx, maxPx) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && shapeText(font, next, sizePx, 0, 0).width > maxPx) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 1. Dither band: the shared math, upscaled exactly 6x with nearest-neighbour (4.10.3).
const tiers = tierGrid(COLS, ROWS, CELL, TAU, 1);
const palette = TIER_HEX.map(rgb);
const raster = Buffer.alloc(COLS * ROWS * 4);
for (let i = 0; i < tiers.length; i++) {
  const [r, g, b] = palette[tiers[i]];
  raster[i * 4] = r;
  raster[i * 4 + 1] = g;
  raster[i * 4 + 2] = b;
  raster[i * 4 + 3] = 255;
}
const band = await sharp(raster, { raw: { width: COLS, height: ROWS, channels: 4 } })
  .resize(COLS * CELL, ROWS * CELL, { kernel: 'nearest' })
  .extract({ left: 0, top: 0, width: W, height: H })
  .png()
  .toBuffer();

// 2. Scrim and text as outlines (4.10.4, 4.10.5).
const bold = await loadFont('JetBrainsMono-Bold.woff2');
const regular = await loadFont('JetBrainsMono-Regular.woff2');
const name = shapeText(bold, 'Parsa Naji', 104, 72, 300);
const tagLines = wrap(regular, TAGLINE, 32, TAGLINE_WRAP_PX);
const tag = tagLines.map((line, i) => shapeText(regular, line, 32, 76, 360 + 42 * i));
const domain = shapeText(regular, 'parsanaji.com', 26, 76, 560);
const stops = SCRIM_STOPS.map(
  ([x, a]) => `<stop offset="${(x / SCRIM_W).toFixed(6)}" stop-color="${BG}" stop-opacity="${a}"/>`,
).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>
<rect x="0" y="0" width="${SCRIM_W}" height="${H}" fill="url(#scrim)"/>
<g fill="${NAME_HEX}">${name.svg}</g>
<g fill="${TEXT2_HEX}">${tag.map((t) => t.svg).join('')}${domain.svg}</g>
</svg>`;
await sharp(band).composite([{ input: Buffer.from(svg) }]).png({ compressionLevel: 9 }).toFile('public/og.png');

// 3. Favicon PNGs: the dark variant of public/favicon.svg with the dark fills written directly,
//    because librsvg ignores the media query (4.10.6, 3.2.7).
const faviconSvg = await readFile('public/favicon.svg', 'utf8');
const darkSvg = Buffer.from(
  faviconSvg.replace(/<style>[\s\S]*?<\/style>/, '<style>.edge{fill:#3b5df0}.tile{fill:#050a22}.glyph{fill:#e8eeff}</style>'),
);
const icon = (size) => sharp(darkSvg, { density: (72 * size) / 16 }).resize(size, size);
await icon(32).png().toFile('public/favicon-32.png');
await icon(192).png().toFile('public/favicon-192.png');
await icon(180).flatten({ background: BG }).png().toFile('public/apple-touch-icon.png');

const kb = async (file) => `${((await readFile(file)).length / 1024).toFixed(1)} KB`;
console.log(`public/og.png: ${W}x${H}, ${await kb('public/og.png')}; name ${name.width.toFixed(1)} px wide`);
console.log(`tagline lines: ${tagLines.map((l) => JSON.stringify(l)).join(' / ')}`);
console.log(`public/favicon-32.png ${await kb('public/favicon-32.png')}, public/favicon-192.png ${await kb('public/favicon-192.png')}, public/apple-touch-icon.png ${await kb('public/apple-touch-icon.png')}`);
```

- [ ] **Step 5: Generate the images**

```bash
npm run og; echo "exit $?"
wc -c public/og.png public/favicon-32.png public/favicon-192.png public/apple-touch-icon.png
sha256sum public/og.png public/favicon-32.png public/favicon-192.png public/apple-touch-icon.png
```

Expected (about 1.3 s):

```
> parsanaji.com@0.1.0 og
> node scripts/og-image.mjs

public/og.png: 1200x630, 81.2 KB; name 624.0 px wide
tagline lines: "I build AI agents, apps, and" / "the systems behind them."
public/favicon-32.png 0.2 KB, public/favicon-192.png 1.6 KB, public/apple-touch-icon.png 1.2 KB
exit 0
```

The name is 624 px wide, so it ends at x 696, the scrim's 0.86 stop (4.10.4); the tagline wraps exactly into the two 4.10.5 lines. Sizes 83,139 / 217 / 1,670 / 1,273 bytes. With sharp 0.35.5 on this machine the output is deterministic (a second run gives identical bytes): SHA-256 `og.png` `d6580647f3e3e0d5565b24a907c83671baa8bec642946fad496bba8f76c5e847`, `favicon-32.png` `fa904f518e293abc4fa8f13ae5abb4ea4c862e70994543102ca9e0e7cb9f01e5`, `favicon-192.png` `eae12fd01b33603d7f11fbdb90d293ccf0fc7e39d7ce6ef98c79b8ea262f6901`, `apple-touch-icon.png` `b87c184dfe85bc4a2a7c35b2c3d4fe70ddba6bac0d3a2914abcadad2259e5962`. If a hash differs (another libvips build), record the new value; the dimension and size test is the gate.

- [ ] **Step 6: Visual check (report evidence)**

Open `public/og.png` and `public/favicon-192.png` with the Read tool and record in `task-4-report.md`:
- `og.png`: `Parsa Naji` in Bold near-white top-left (baseline 300), the two tagline lines in `#7993da` under it, `parsanaji.com` lower left (baseline 560), all on solid `#050a22`; right of the text the dither band (blue `#3b5df0` / `#8db0ff` cells) fades in under the scrim, and no Shockwave ring anywhere: the band is the plain field at τ 12, `#3b5df0` and `#8db0ff` cells in Bayer patterns with no field-3 cell (the idle field never reaches 0.9, 3.3.10), so the only `#e8eeff` pixels in the image are the name's glyphs (spec 4.10.3 as amended: no ring, Index amendment A10).
- `favicon-192.png`: a `#3b5df0` rounded edge, a `#050a22` tile and a pixel `PN` in `#e8eeff`.

Save the still for Parsa (he judges the card before the merge):

```bash
mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-4
cp public/og.png .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-4/og.png
sha256sum .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-4/og.png
```

Expected: the same SHA-256 as `public/og.png` in Step 5. Add the line `For Parsa: evidence/task-4/og.png (OG still: name, tagline, domain, plain field band)` to `task-4-report.md`; the controller shows it to him with the slice-1 checkpoint.

Then confirm the pixels numerically:

```bash
node --input-type=module -e "
import sharp from 'sharp';
const px = async (f, x, y) => { const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true }); const i = (y * info.width + x) * info.channels; return Array.from(data.slice(i, i + info.channels)); };
console.log('192 edge', await px('public/favicon-192.png', 2, 96), 'tile', await px('public/favicon-192.png', 96, 24), 'glyph', await px('public/favicon-192.png', 30, 120));
console.log('apple corner', await px('public/apple-touch-icon.png', 0, 0), 'og corner', await px('public/og.png', 10, 10));
"
```

Expected:

```
192 edge [ 59, 93, 240, 255 ] tile [ 5, 10, 34, 255 ] glyph [ 232, 238, 255, 255 ]
apple corner [ 5, 10, 34 ] og corner [ 5, 10, 34, 255 ]
```

- [ ] **Step 7: Run the guard to verify it passes**

Run: `npx vitest run tests/ogAsset.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  6 passed (6)`. CI runs this test on Ubuntu: `package-lock.json` already lists `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64`.

- [ ] **Step 8: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  10 passed (10)`, `Tests  61 passed (61)`; typecheck silent; the build succeeds and copies the new PNGs and SVG into `dist/` (the two Geist notices still print until Task 6).

- [ ] **Step 9: Commit**

```bash
git add scripts/og-image.mjs tests/ogAsset.test.ts public/favicon.svg public/og.png public/favicon-32.png \
  public/favicon-192.png public/apple-touch-icon.png
git commit -m "feat(og): OG image and favicon PNGs from the shared surface math

scripts/og-image.mjs draws the 1200x630 card from src/field/surface.ts (tau 12,
the plain field band), the page scrim rule and harfbuzz glyph outlines in JetBrains
Mono, and renders the dark PN monogram to 32, 192 and 180 px (flattened).
public/favicon.svg becomes the scheme-aware PN monogram.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Markup, head and theme bootstrap

**Files:** Modify `index.html` (full rewrite: head = Appendix C §5 with the two 5.2.1 changes; body = Appendix C §1 with the 3.1.4 changes), `src/content.ts` (full rewrite); Create `public/theme-boot.js` (exactly 4.6.2), `tests/content.test.ts`, `tests/themeBoot.test.ts`.

**Interfaces:**
- Consumes: Task 4 asset paths `/favicon-32.png`, `/favicon-192.png`, `/favicon.svg`, `/apple-touch-icon.png`, `https://parsanaji.com/og.png`; Task 2 font paths `/fonts/JetBrainsMono-Regular.subset.woff2`, `/fonts/JetBrainsMono-Bold.subset.woff2`.
- Produces:
  ```ts
  // src/content.ts
  export const CONTENT: {
    readonly name: 'Parsa Naji'; readonly email: 'info@parsanaji.com'; readonly konamiText: 'nice.';
    readonly links: { readonly github: 'https://github.com/parsanaji'; readonly linkedin: string }; // linkedin '' until 3.1.12
    readonly clock: { readonly timeZone: 'America/Los_Angeles' };
  };
  ```
- Produces (DOM contract, 4.3.2; every later task finds elements only through these hooks):
  - `<html lang="en">` state: `data-theme` (`light` | `dark`, absent = system) and `data-entry="run"`, both set before first paint by `/theme-boot.js` (storage key `pn.theme`); later states are owned by Tasks 8, 15 and 18.
  - `canvas.field[data-field][aria-hidden="true"]`; `div.scrim[aria-hidden="true"]`; `main.rail[data-rail]`.
  - `[data-reveal]` values 0–7: 0 `header.intro` and the toggle, 1 Experience, 2 Projects, 3 Education, 4 Misc, 5 `nav.links`, 6 `p.status`, 7 `p.place`.
  - `h1.name[data-name]`; `a.lnk[data-link="github"]`; `a.lnk[href="mailto:info@parsanaji.com"][data-email="info@parsanaji.com"]` containing `span.swap > span.swap-main` (`say hi`) and `span.swap-alt` (`copied`); `#email-hint[hidden]`.
  - `p.place[data-reveal="7"]` = `Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span>` (the `<time>` starts empty).
  - `button.theme-toggle[type="button"][data-theme-toggle][data-reveal="0"][hidden]` containing `span.theme-word[data-theme-word]` (empty); no `aria-label`, no `aria-pressed` in the HTML.
  - `dialog.keys[data-keys][aria-labelledby="keys-title"][closedby="any"]` with the `[data-key="linkedin"][hidden]` row and `button[data-keys-close]`.
  - `p.sr-only[data-live][role="status"][aria-live="polite"][aria-atomic="true"]`, present and empty.
  - `<script src="/theme-boot.js"></script>` directly after the viewport meta and before the stylesheet link; `<script type="module" src="/src/main.ts"></script>` last in `<body>`; the LinkedIn `<li>` stays an HTML comment.

- [ ] **Step 1: Write the failing tests**

Full file `tests/content.test.ts` (spec 8.1.12, 3.1.3–3.1.5, 3.1.12, 4.3.2, 5.2). It strips HTML comments before the "no LinkedIn element" checks, because the parked LinkedIn `<li>` lives in a comment, and it builds the expected `sameAs` from `CONTENT`, so the one-commit LinkedIn recipe of 3.1.12 (Task 24) keeps the suite green without touching this test:

```ts
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
      'parsanaji.com This site. WebGL2 dither field.',
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
    const alt = 'Parsa Naji, I build AI agents, apps, and the systems behind them, over a blue dither field.';
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
```

Full file `tests/themeBoot.test.ts` (spec 8.1.11; runs the real file in `node:vm` with fakes):

```ts
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

// public/theme-boot.js runs before first paint as a classic script (spec 4.6.2, 8.1.11).
const SOURCE = readFileSync('public/theme-boot.js', 'utf8').replace(/\r\n/g, '\n');

interface BootEnv {
  stored?: string | null;
  storageThrows?: boolean;
  reduced?: boolean;
  forced?: boolean;
  matchMediaThrows?: boolean;
  search?: string;
}

function boot(env: BootEnv = {}): Map<string, string> {
  const attrs = new Map<string, string>();
  const documentElement = {
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
  };
  const localStorage = {
    getItem: (key: string): string | null => {
      if (env.storageThrows) throw new Error('SecurityError');
      return key === 'pn.theme' ? (env.stored ?? null) : null;
    },
  };
  const matchMedia = (query: string): { matches: boolean } => {
    if (env.matchMediaThrows) throw new Error('no matchMedia');
    if (query === '(prefers-reduced-motion: reduce)') return { matches: env.reduced ?? false };
    if (query === '(forced-colors: active)') return { matches: env.forced ?? false };
    throw new Error(`unexpected query ${query}`);
  };
  runInNewContext(SOURCE, {
    document: { documentElement },
    localStorage,
    window: { matchMedia },
    location: { search: env.search ?? '' },
  });
  return attrs;
}

describe('theme-boot.js', () => {
  it('applies a stored light look and arms the entry', () => {
    const attrs = boot({ stored: 'light' });
    expect(attrs.get('data-theme')).toBe('light');
    expect(attrs.get('data-entry')).toBe('run');
  });

  it('applies a stored dark look', () => {
    expect(boot({ stored: 'dark' }).get('data-theme')).toBe('dark');
  });

  it('ignores garbage and a missing key (the OS decides)', () => {
    expect(boot({ stored: 'sepia' }).has('data-theme')).toBe(false);
    expect(boot({ stored: null }).has('data-theme')).toBe(false);
    expect(boot({ stored: 'sepia' }).get('data-entry')).toBe('run');
  });

  it('never arms the entry under reduced motion (3.4.10)', () => {
    expect(boot({ reduced: true }).has('data-entry')).toBe(false);
  });

  it('never arms the entry under forced colours (11.14)', () => {
    expect(boot({ forced: true }).has('data-entry')).toBe(false);
  });

  it('never arms the entry with ?noentry', () => {
    expect(boot({ search: '?noentry' }).has('data-entry')).toBe(false);
    expect(boot({ search: '?seed=3&noentry' }).has('data-entry')).toBe(false);
    expect(boot({ search: '?noentryx' }).get('data-entry')).toBe('run');
  });

  it('survives a throwing localStorage and a throwing matchMedia', () => {
    let attrs = new Map<string, string>();
    expect(() => {
      attrs = boot({ storageThrows: true });
    }).not.toThrow();
    expect(attrs.has('data-theme')).toBe(false);
    expect(attrs.get('data-entry')).toBe('run');
    expect(() => boot({ matchMediaThrows: true, stored: 'dark' })).not.toThrow();
    expect(boot({ matchMediaThrows: true, stored: 'dark' }).get('data-theme')).toBe('dark');
  });

  it('is small, uses no innerHTML or eval, and reads only the pn.theme key', () => {
    expect(SOURCE.length).toBeLessThan(500);
    expect(SOURCE).not.toMatch(/innerHTML|eval\(/);
    expect(SOURCE).toContain("localStorage.getItem('pn.theme')");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/content.test.ts tests/themeBoot.test.ts`

Expected: FAIL, `Test Files  2 failed (2)`. `tests/themeBoot.test.ts` fails to load with `Error: ENOENT: no such file or directory, open '…\public\theme-boot.js'`; `tests/content.test.ts` reports `Tests  14 failed | 1 passed (15)` against the teaser page (for example `expected '<body>\n    <h1 class="sr-only">Parsa…' to contain '<h1 class="name" data-name>Parsa Naji…'`; only the "no inline script other than the JSON-LD" case already holds).

- [ ] **Step 3: Write the bootstrap (spec 4.6.2, 3.4.10, 11.14)**

Full file `public/theme-boot.js`, exactly 4.6.2 (ten lines, 479 bytes with LF):

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

Check it against the spec block:

```bash
diff <(sed 's/\r$//' docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-design.md | awk '/^- \*\*4\.6\.2/{f=1} f&&/^```js$/{g=1;next} g&&/^```$/{exit} g') <(sed 's/\r$//' public/theme-boot.js) && echo "theme-boot matches spec 4.6.2"
```

Expected: `theme-boot matches spec 4.6.2`.

- [ ] **Step 4: Rewrite the content constants (spec 4.3)**

Full file `src/content.ts` (the explicit type keeps `linkedin` a `string`, so `if (CONTENT.links.linkedin)` stays meaningful to TypeScript):

```ts
/**
 * The JS copy of the facts the scripts need (spec 4.3). index.html stays the source of every visible string;
 * tests/content.test.ts keeps the two equal. LinkedIn stays '' until Parsa gives the URL (3.1.12).
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
  links: { github: 'https://github.com/parsanaji', linkedin: '' },
  clock: { timeZone: 'America/Los_Angeles' },
};
```

- [ ] **Step 5: Rewrite the page (spec 2.1.1, 2.2.5, 3.1.2–3.1.6, 3.2.9, 3.5.3, 3.5.5, 3.5.12, 4.6.2, 5.1.1, 5.1.2, 5.2.1–5.2.5, 11.13, 11.22, 11.23)**

Head = Appendix C §5 with the two 5.2.1 changes (`theme-boot.js` after the viewport meta; no `email` in the JSON-LD). Body = Appendix C §1 with the 3.1.4 changes (project row 1 text, the footer `<time>`, the word toggle with `data-reveal="0"`, the LinkedIn `<li>` kept as a comment). Full file `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script src="/theme-boot.js"></script>
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
  {"@context":"https://schema.org","@type":"Person","name":"Parsa Naji","url":"https://parsanaji.com/","jobTitle":["Software Developer","AI Specialist / Developer"],"sameAs":["https://github.com/parsanaji"]}
  </script>
</head>
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
        <li class="row"><span class="when">2026 <span aria-hidden="true">—</span><span class="sr-only">to present</span></span><span class="what">AI Specialist / Developer <span class="sub">Expedient Labs</span></span></li>
        <li class="row"><span class="when">2025</span><span class="what">Calculus Tutor <span class="sub">Saddleback College</span></span></li>
      </ul>
    </section>

    <section class="block block--proj" aria-labelledby="h-proj" data-reveal="2">
      <h2 class="eyebrow" id="h-proj">Projects</h2>
      <ul class="rows rows--compact" role="list">
        <li class="row"><span class="what"><span class="pname">parsanaji.com</span> <span class="sub">This site. WebGL2 dither field.</span></span></li>
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

    <p class="place" data-reveal="7">Irvine, CA<span data-clock hidden> · <time data-clock-time></time></span></p>

    <button class="theme-toggle" type="button" data-theme-toggle data-reveal="0" hidden><span class="theme-word" data-theme-word></span></button>
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
</html>
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/content.test.ts tests/themeBoot.test.ts`

Expected: PASS, `Test Files  2 passed (2)`, `Tests  23 passed (23)` (content 15, themeBoot 8).

- [ ] **Step 7: Full gate, and check how Vite treats the classic script**

```bash
npm test
npm run typecheck
npm run build
grep -n "<script" dist/index.html
ls dist/theme-boot.js
```

Expected: `Test Files  12 passed (12)`, `Tests  84 passed (84)`; typecheck silent; the build succeeds with no warning about `theme-boot.js` (`dist/index.html 7.24 kB │ gzip: 2.09 kB`; the two Geist notices still print until Task 6). The grep shows the classic script untouched at line 6, the JSON-LD block, and Vite's hashed module entry moved into the head (Vite's normal placement; module scripts are deferred, so the order relative to `theme-boot.js` is unchanged):

```
6:  <script src="/theme-boot.js"></script>
40:  <script type="application/ld+json">
43:  <script type="module" crossorigin src="/assets/index-….js"></script>
```

`dist/theme-boot.js` exists (copied from `public/`). No browser evidence in this task: the page is unstyled until Task 6, and `main.ts` is still the Task 1 interim.

- [ ] **Step 8: Commit**

```bash
git add index.html src/content.ts public/theme-boot.js tests/content.test.ts tests/themeBoot.test.ts
git commit -m "feat(page): résumé markup, head and the pre-paint theme bootstrap

index.html becomes the one-screen résumé (Appendix C §1 with spec 3.1.4) with the
5.2 head: theme-color pair, PNG and SVG icons, OG/Twitter, JetBrains Mono preloads
and the email-free JSON-LD. public/theme-boot.js applies the stored look and the
entry pre-hide before first paint under the strict CSP. CONTENT is the JS copy.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Stylesheet: tokens, layouts and states

**Files:** Modify `src/styles.css` (full rewrite, in the 4.6.3 order: the 4.6.4 `@property` block and `html.theme-anim`; Appendix B §1.1 token blocks without `--bg-scrim` and `--copied`; Appendix C §2 with the replacements of 3.1.13 (band block under `BAND_QUERY`), 3.1.16 (toggle CSS), 3.3.7.8 (`touch-action: auto`), 3.4.7 (entry hooks) and 3.6.4 (reduced-motion block, after the entry hooks), plus `image-rendering: pixelated` on `.field` (4.5.9)); Create `tests/tokens.test.ts`.

**Interfaces:**
- Consumes: Task 5 DOM contract; Task 2 font files.
- Produces (CSS contract the scripts rely on):
  - `html.no-webgl` hides `.field` and `.scrim`; in the band layout the rail's bottom padding becomes `40px + env(safe-area-inset-bottom, 0px)`.
  - `html.theme-anim` transitions the twelve registered tokens over 300 ms linear.
  - `.field` is `opacity: 0` until `html[data-field-ready]`, which fades it in over 400 ms linear.
  - The 3.4.7 entry block for `html[data-entry="run" | "wait" | "scrim" | "reveal" | "skip"]`, the 4000 ms `pn-failsafe` animation on `run`, and `--i` per `[data-reveal]`.
  - `a[data-copied]` swaps `say hi` for `copied` in the same cell with the brackets suppressed; `.theme-toggle[hidden] { display: none; }`.
  - Unregistered `--field-0..3` (6-digit hex) and `--theme-color` readable through `getComputedStyle(document.documentElement)`.
  - The band layout's media query is the literal `(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)` (exported as `BAND_QUERY` by Task 9).

- [ ] **Step 1: Write the failing test**

Full file `tests/tokens.test.ts` (spec 8.1.10, 3.2.1, 4.6.4; the layout cases pin the replacements this task makes):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// src/styles.css is the single source of both looks (spec 3.2.1, 4.6.3, 4.6.4, 8.1.10).
const CSS = readFileSync('src/styles.css', 'utf8').replace(/\r\n/g, '\n');

/** Declarations of the first rule whose text starts with `opener` (custom properties and color-scheme). */
function block(opener: string): Record<string, string> {
  const start = CSS.indexOf(opener);
  expect(start, `missing ${opener}`).toBeGreaterThanOrEqual(0);
  const body = CSS.slice(CSS.indexOf('{', start) + 1, CSS.indexOf('}', start));
  const decls: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+|color-scheme):\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
  return decls;
}

const DARK_BLOCK = ':root {\n  color-scheme: dark;';
const LIGHT_MEDIA_BLOCK = '@media (prefers-color-scheme: light) {\n  :root:not([data-theme="dark"]) {';
const LIGHT_FORCED_BLOCK = ':root[data-theme="light"] {';

// 3.2.1, verbatim.
const DARK = {
  'color-scheme': 'dark',
  '--bg': '#050a22',
  '--scrim-solid': 'rgb(5 10 34 / 1)',
  '--scrim-mid': 'rgb(5 10 34 / 0.86)',
  '--scrim-clear': 'rgb(5 10 34 / 0)',
  '--fg': '#e8eeff',
  '--fg-2': '#7993da',
  '--accent': '#8db0ff',
  '--accent-2': '#5b81ff',
  '--accent-glow': 'rgb(141 176 255 / 0.35)',
  '--line': 'rgb(232 238 255 / 0.14)',
  '--field-0': '#050a22',
  '--field-1': '#3b5df0',
  '--field-2': '#8db0ff',
  '--field-3': '#e8eeff',
  '--focus-ring': 'var(--accent)',
  '--status-dot': 'var(--accent)',
  '--selection-bg': '#3b5df0',
  '--selection-fg': '#ffffff',
  '--overlay-bg': 'rgb(5 10 34 / 0.94)',
  '--overlay-border': 'rgb(232 238 255 / 0.18)',
  '--theme-color': '#050a22',
};
const LIGHT = {
  'color-scheme': 'light',
  '--bg': '#f2f6fe',
  '--scrim-solid': 'rgb(242 246 254 / 1)',
  '--scrim-mid': 'rgb(242 246 254 / 0.86)',
  '--scrim-clear': 'rgb(242 246 254 / 0)',
  '--fg': '#071348',
  '--fg-2': '#445789',
  '--accent': '#2848d7',
  '--accent-2': '#3656e8',
  '--accent-glow': 'rgb(40 72 215 / 0.25)',
  '--line': 'rgb(7 19 72 / 0.14)',
  '--field-0': '#f2f6fe',
  '--field-1': '#8db0ff',
  '--field-2': '#3b5df0',
  '--field-3': '#0832b8',
  '--selection-bg': '#3b5df0',
  '--selection-fg': '#ffffff',
  '--overlay-bg': 'rgb(242 246 254 / 0.95)',
  '--overlay-border': 'rgb(7 19 72 / 0.18)',
  '--theme-color': '#f2f6fe',
};

const REGISTERED = [
  ['--bg', '#050a22'],
  ['--fg', '#e8eeff'],
  ['--fg-2', '#7993da'],
  ['--accent', '#8db0ff'],
  ['--accent-2', '#5b81ff'],
  ['--accent-glow', 'rgb(141 176 255 / 0.35)'],
  ['--line', 'rgb(232 238 255 / 0.14)'],
  ['--scrim-solid', 'rgb(5 10 34 / 1)'],
  ['--scrim-mid', 'rgb(5 10 34 / 0.86)'],
  ['--scrim-clear', 'rgb(5 10 34 / 0)'],
  ['--overlay-bg', 'rgb(5 10 34 / 0.94)'],
  ['--overlay-border', 'rgb(232 238 255 / 0.18)'],
];

describe('colour tokens (3.2.1)', () => {
  it('the dark base carries exactly the dark column', () => {
    expect(block(DARK_BLOCK)).toEqual(DARK);
  });

  it('both light blocks carry exactly the light column', () => {
    expect(block(LIGHT_MEDIA_BLOCK)).toEqual(LIGHT);
    expect(block(LIGHT_FORCED_BLOCK)).toEqual(LIGHT);
  });

  it('--field-0..3 are 6-digit hex in all three blocks, light --field-3 is #0832b8', () => {
    for (const opener of [DARK_BLOCK, LIGHT_MEDIA_BLOCK, LIGHT_FORCED_BLOCK]) {
      const b = block(opener);
      for (const k of ['--field-0', '--field-1', '--field-2', '--field-3']) expect(b[k]).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(block(LIGHT_FORCED_BLOCK)['--field-3']).toBe('#0832b8');
  });

  it('has no --bg-scrim and no --copied (ledger ruling D5; "copied" is --accent-2)', () => {
    expect(CSS).not.toContain('--bg-scrim');
    expect(CSS).not.toContain('--copied');
  });

  it('keeps --line-strong as Appendix C writes it', () => {
    expect(CSS).toContain('--line-strong: color-mix(in srgb, var(--fg) 28%, transparent);');
  });
});

describe('registered tokens and the crossfade (4.6.4)', () => {
  it('registers exactly the twelve literal-valued colour tokens with their dark initial values', () => {
    const rules = [...CSS.matchAll(/@property (--[\w-]+) \{ syntax: '([^']+)'; inherits: (\w+); initial-value: ([^;]+); \}/g)];
    expect(rules.map((m) => [m[1], m[4]])).toEqual(REGISTERED);
    for (const m of rules) {
      expect(m[2]).toBe('<color>');
      expect(m[3]).toBe('true');
    }
    expect(CSS.match(/@property /g)).toHaveLength(12);
  });

  it('leaves --field-0..3, --theme-color and the aliases unregistered', () => {
    for (const k of ['--field-0', '--field-1', '--field-2', '--field-3', '--theme-color', '--focus-ring', '--status-dot', '--line-strong']) {
      expect(CSS).not.toContain(`@property ${k} `);
    }
  });

  it('html.theme-anim transitions the twelve tokens over 300 ms linear', () => {
    const rule = CSS.slice(CSS.indexOf('html.theme-anim {'), CSS.indexOf('}', CSS.indexOf('html.theme-anim {')));
    expect([...rule.matchAll(/(--[\w-]+) 300ms linear/g)].map((m) => m[1])).toEqual(REGISTERED.map(([k]) => k));
  });
});

describe('layout contract (3.1.1, 3.4.7, 3.6.4, 3.3.7.8, 4.5.9)', () => {
  it('applies the band layout under BAND_QUERY, verbatim', () => {
    expect(CSS).toContain('@media (max-width: 719.98px), not all and (min-aspect-ratio: 1/1) {');
    expect(CSS).not.toContain('@media (max-width: 719.98px) {');
  });

  it('keeps touch-action auto on the band canvas and pixelated cells', () => {
    expect(CSS).not.toContain('pan-y');
    expect(CSS).toContain('touch-action: auto;');
    expect(CSS).toContain('image-rendering: pixelated;');
  });

  it('hides the field and scrim under html.no-webgl and the toggle while hidden', () => {
    expect(CSS).toContain('html.no-webgl .field,\nhtml.no-webgl .scrim { display: none; }');
    expect(CSS).toContain('.theme-toggle[hidden] { display: none; }');
    expect(CSS).not.toMatch(/aria-pressed|theme-glyph/);
  });

  it('has the 3.4.7 entry block with the 4 s failsafe and no stale data-entry="in" state', () => {
    expect(CSS).toContain('html[data-field-ready] .field { opacity: 1; transition: opacity 400ms linear; }');
    expect(CSS).toContain('html[data-entry="run"] .scrim { animation: pn-failsafe 1ms linear 4000ms forwards; }');
    expect(CSS).toContain('@keyframes pn-failsafe { to { opacity: 1; transform: none; } }');
    expect(CSS).toContain('[data-reveal="7"] { --i: 7; }');
    expect(CSS).not.toContain('data-entry="in"');
    expect(CSS).not.toContain('[data-reveal="8"]');
  });

  it('puts the 3.6.4 reduced-motion block after the 3.4.7 entry block', () => {
    const entry = CSS.indexOf('html[data-entry="reveal"] [data-reveal] {');
    const reduced = CSS.indexOf('@media (prefers-reduced-motion: reduce) {');
    expect(entry).toBeGreaterThan(0);
    expect(reduced).toBeGreaterThan(entry);
    expect(CSS.match(/@media \(prefers-reduced-motion: reduce\)/g)).toHaveLength(1);
    expect(CSS).toContain(
      'html[data-entry] .scrim { opacity: 1; transform: none; transition: none; animation: none; pointer-events: auto; }',
    );
  });

  it('declares JetBrains Mono 400 and 700 with font-display swap and no ligatures in prose (4.11.4, 3.1.8)', () => {
    expect(CSS).toContain('src: url("/fonts/JetBrainsMono-Regular.subset.woff2") format("woff2");');
    expect(CSS).toContain('src: url("/fonts/JetBrainsMono-Bold.subset.woff2") format("woff2");');
    expect(CSS.match(/font-display: swap;/g)).toHaveLength(2);
    expect(CSS).toContain('font-variant-ligatures: none;');
    expect(CSS).not.toMatch(/Geist/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/tokens.test.ts`

Expected: FAIL, `Tests  12 failed | 2 passed (14)` against the teaser stylesheet (for example `AssertionError: missing :root {\n  color-scheme: dark;`; only "has no --bg-scrim and no --copied" and "leaves --field-0..3 … unregistered" already hold).

- [ ] **Step 3: Rewrite the stylesheet (spec 4.6.3 order; 3.1.7–3.1.11, 3.1.13–3.1.16, 3.2.1, 3.2.4, 3.3.7.8, 3.4.7, 3.5.1, 3.5.2, 3.5.5, 3.5.8, 3.5.9, 3.6.4–3.6.6, 4.5.9, 4.6.4, 4.11.4)**

Section 1 is 4.6.4 verbatim. Section 2 is Appendix B §1.1 verbatim without the `--bg-scrim` and `--copied` lines (both light blocks too). Section 3 is Appendix C §2 verbatim with exactly these replacements: the "theme toggle" block becomes the 3.1.16 CSS; the "entry hooks" block becomes the 3.4.7 CSS; the motion block becomes the 3.6.4 CSS (after the entry hooks); the phone block's media query becomes `BAND_QUERY` (3.1.13) and its `touch-action: pan-y` becomes `touch-action: auto` (3.3.7.8); `.field` gains `image-rendering: pixelated` (4.5.9). Comments are reworded where they named the retired pieces. Full file `src/styles.css`:

```css
/* =====================================================================
   parsanaji.com — résumé screen stylesheet (spec 4.6.3 order):
   1. registered colour tokens and the theme crossfade (4.6.4)
   2. Dither Blue tokens, dark base + daylight (3.2.1, Appendix B §1.1)
   3. layout and type (Appendix C §2 with the replacements of 3.1.13,
      3.1.16, 3.3.7.8, 3.4.7 and 3.6.4, plus 4.5.9)
   State lives in classes and data-* attributes on <html>; scripts never
   write inline styles (CSP style-src 'self', 4.6.1).
   ===================================================================== */

/* ---------- 1. registered tokens: CSS interpolates them in sRGB over 300 ms (4.6.4) ---------- */
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

/* ---------- 2. Dither Blue tokens (3.2.1). Dark is the base; light follows the OS unless the
   toggle forced dark, and again when the toggle forces light. --field-0..3 and --theme-color stay
   unregistered so getComputedStyle returns the target hex at once (4.6.4, 3.3.12). ---------- */
:root {
  color-scheme: dark;
  --bg: #050a22;
  --scrim-solid: rgb(5 10 34 / 1);
  --scrim-mid: rgb(5 10 34 / 0.86);
  --scrim-clear: rgb(5 10 34 / 0);
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
  --theme-color: #f2f6fe;
}
::selection { background: var(--selection-bg); color: var(--selection-fg); }

/* ---------- 3. layout and type (Appendix C §2) ---------- */

/* Fonts: JetBrains Mono 400 and 700, self-hosted subsets (4.11.4) */
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

/* Derived tokens at zero specificity, so the :root token values above win. */
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

  /* type scale (desktop + tablet rail, 3.1.7) */
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
  image-rendering: pixelated;       /* crisp cells at DPR 3 (4.5.9) */
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
  /* alpha: 1 → (mid-rail) 1 → (rail edge, >= text edge) 0.86 → eased → 0 at rail edge + ramp (3.1.10) */
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

/* links row + bracket hover (brackets hang outside the box: zero layout shift, 3.5.1) */
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
.lnk:focus-visible {                /* brackets + a 1 px underline: two cues, neither colour-only (3.5.2) */
  text-decoration: underline 1px;
  text-underline-offset: 0.35em;
  text-decoration-color: var(--focus-ring);
}

/* "say hi" ⇄ "copied": both labels share one grid cell (6ch each), nothing moves.
   Copied = plain --accent-2 text in place of the label for 1.2 s (no brackets, 3.5.3). */
.swap { display: inline-grid; }
.swap > * { grid-area: 1 / 1; }
.swap-alt { visibility: hidden; color: var(--accent-2); }
.lnk[data-copied] .swap-main { visibility: hidden; }
.lnk[data-copied] .swap-alt  { visibility: visible; }
.lnk[data-copied]::before,
.lnk[data-copied]::after { opacity: 0; }

/* status + place (3.5.8) */
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

/* ---------- theme toggle: the target-look word on a chip, top-right on the name's line (3.1.16) ---------- */
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

/* ---------- "?" shortcuts overlay (native modal <dialog>, 3.5.5) ---------- */
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

/* ---------- entry hooks: one data-entry attribute on <html> plus data-field-ready (3.4.7) ---------- */
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

/* ---------- short desktop windows: collapse order (3.1.11) ----------
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

/* ---------- band layout: phones and portrait windows, BAND_QUERY (3.1.1, 3.1.13) ---------- */
@media (max-width: 719.98px), not all and (min-aspect-ratio: 1/1) {
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
  /* band order (Blueprint stack branch): status moves up under the tagline */
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
    touch-action: auto;             /* pinch zoom keeps working on the band (3.3.7.8) */
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
/* narrow band: the value cell stacks (role / org, project / what), 3.1.14 */
@media (max-width: 519.98px) {
  .sub { display: block; }
  .sub::before { content: none; }
  .rows--compact .what { grid-column: 1 / -1; }   /* projects have no dates: use the full width */
  .rows--compact .row { padding-block: calc(var(--row-pad) * 0.6); }
}

/* ---------- reduced motion (3.6.4): after the entry hooks, so it wins ---------- */
@media (prefers-reduced-motion: reduce) {
  .dot::after { animation: none; opacity: 0; }
  .lnk, .lnk::before, .lnk::after,
  .theme-toggle, .theme-word, .theme-word::before, .theme-word::after,
  .keys { transition: none; }
  html[data-entry] [data-reveal],
  html[data-entry] .scrim { opacity: 1; transform: none; transition: none; animation: none; pointer-events: auto; }
  html[data-field-ready] .field { transition: none; }
}

/* ---------- forced colours (Windows contrast themes, 3.6.5) ---------- */
@media (forced-colors: active) {
  .field, .scrim { display: none; }
  .dot { background: CanvasText; }
  .dot::after { display: none; }
  .eyebrow::after { background: CanvasText; }
  .lnk:focus-visible { outline: 2px solid LinkText; outline-offset: 3px; }
}

/* ---------- print: a clean one-page résumé (3.6.6) ---------- */
@media print {
  .field, .scrim, .theme-toggle, .keys, .dot { display: none !important; }
  .rail { width: auto; min-height: 0; padding: 0; }
  .lnk::before, .lnk::after { display: none; }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/tokens.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  14 passed (14)`.

- [ ] **Step 5: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  13 passed (13)`, `Tests  98 passed (98)`; typecheck silent; the build succeeds and the two Geist notices are gone (`dist/assets/index-….css 16.19 kB │ gzip: 4.17 kB`, `dist/assets/index-….js 0.72 kB`).

- [ ] **Step 6: Load the `frontend-design` skill (Execution Notes, 8.3.5)**

Invoke the Skill tool with `frontend-design:frontend-design` and keep its checklist next to the screenshots of Step 9; record in `task-6-report.md` what it flagged and what (if anything) was changed. The binding values are the spec's: no token, size or geometry changes come from the skill.

- [ ] **Step 7: Browser evidence, part 1: the rail fit (spec 8.2.13, 3.1.10, 3.1.11, 3.1.15, 3.1.17, 5.1.8)**

`main.ts` is still the Task 1 interim (it adds `no-webgl` and never removes `data-entry`), so every load in this task uses `/?noentry`; the canvas and scrim are hidden, so the scrim alpha at the widest text pixel is computed from the 3.1.10 stops instead of being read from pixels.

```bash
mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-6
npm run dev
```

Run `npm run dev` with the Bash tool's `run_in_background`; it prints `Local: http://localhost:5173/` (use the port it prints if 5173 is taken). Load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__take_snapshot,mcp__plugin_ecc_chrome-devtools__hover,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__close_page`.

`new_page` with `url: "about:blank"`, `isolatedContext: "t6"`; then `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`. Load the page with `navigate_page` `type: "url"`, `url: "http://localhost:5173/?noentry"` and this `initScript` (the fit probe; it skips the fixed toggle, sr-only text and collapsed items):

```js
window.__fit = async () => {
  await document.fonts.ready;
  const html = document.documentElement;
  const se = document.scrollingElement;
  const rail = document.querySelector('[data-rail]');
  const rr = rail.getBoundingClientRect();
  const gutter = parseFloat(getComputedStyle(rail).paddingLeft);
  const R = rr.right;
  const S = gutter + (R - gutter) / 2;
  const ramp = Math.min(440, Math.max(160, 0.18 * innerWidth));
  const clipped = (el) => { for (let a = el; a && a !== rail.parentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.clipPath !== 'none' || a.hidden || cs.visibility === 'hidden') return true; } return false; };
  const textRight = (root) => {
    let max = 0;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('.theme-toggle') || clipped(n.parentElement)) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width > 0) max = Math.max(max, b.right);
    }
    return Math.round(max * 10) / 10;
  };
  const alphaAt = (x) => {
    if (x <= S) return 1;
    if (x <= R) return 1 - (0.14 * (x - S)) / (R - S);
    const st = [[R, 0.86], [R + 0.25 * ramp, 0.7], [R + 0.5 * ramp, 0.42], [R + 0.75 * ramp, 0.16], [R + ramp, 0]];
    for (let i = 1; i < st.length; i++) if (x <= st[i][0]) return st[i - 1][1] + ((st[i][1] - st[i - 1][1]) * (x - st[i - 1][0])) / (st[i][0] - st[i - 1][0]);
    return 0;
  };
  const widest = textRight(rail);
  const bottom = Math.max(...['.links', '.status', '.place'].map((s) => textRight(rail.querySelector(s))));
  const edu = rail.querySelector('.block--edu').getBoundingClientRect();
  const misc = rail.querySelector('.block--misc').getBoundingClientRect();
  const gapBlock = parseFloat(getComputedStyle(rail.querySelector('.block--edu')).marginBottom);
  const visible = (sel) => [...rail.querySelectorAll(sel)].filter((e) => getComputedStyle(e).clipPath === 'none').length;
  const place = rail.querySelector('.place').getBoundingClientRect();
  return {
    vp: `${innerWidth}x${innerHeight}`,
    noScroll: se.scrollHeight === se.clientHeight, scrollH: se.scrollHeight, clientH: se.clientHeight,
    R: Math.round(R * 10) / 10, S: Math.round(S * 10) / 10, widest, alphaAtWidest: Math.round(alphaAt(widest) * 1000) / 1000,
    widestLeftOfR: widest <= R, bottomGroupRight: bottom, bottomLeftOfS: bottom < S,
    spare: Math.round((misc.top - edu.bottom - gapBlock) * 10) / 10,
    lastBottom: Math.round(place.bottom * 10) / 10,
    namePx: parseFloat(getComputedStyle(rail.querySelector('.name')).fontSize), bodyPx: parseFloat(getComputedStyle(document.body).fontSize),
    projectRows: visible('.block--proj .row'), tags: visible('.tags li'),
    entry: html.getAttribute('data-entry'), noWebgl: html.classList.contains('no-webgl'),
  };
};
```

For each viewport below: `emulate` the viewport, then `navigate_page` `type: "reload"` with the same `initScript` (a mobile emulation reloads the page and would drop the probe), then `evaluate_script` `() => window.__fit()` with `waitForStableDom: false`. Every row must show `entry: null` and `noWebgl: true`. Expected values (±1 px; measured on this code):

| viewport | `noScroll` | R | S | widest text | alpha there | links/status/footer right | spare | name px | body px | project rows | tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `1280x720x1` | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 72.7 | 59.904 | 13 | 4 | 7 |
| `1366x768x1` | true | 626.6 | 340.6 | 615.6 | 0.865 | 234.3 | 98.4 | 63.8976 | 13 | 4 | 7 |
| `1440x900x1` | true | 691.2 | 374.4 | 664.8 | 0.872 | 245.7 | 142.2 | 74.88 | 14.4 | 4 | 7 |
| `1920x1080x1` | true | 837.1 | 457 | 805.7 | 0.872 | 302.5 | 170.7 | 89.856 | 17.28 | 4 | 7 |
| `2560x1440x1` | true | 888 | 492 | 859 | 0.87 | 332.8 | 395.6 | 104 | 18 | 4 | 7 |
| `1280x600x1` (3.1.11 item 1) | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 8.2 | 49.92 | 13 | 4 | 7 |
| `1280x599x1` (item 2) | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 51.9 | 49.8368 | 13 | 2 | 7 |
| `1280x519x1` (item 3) | true | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 26.6 | 43.1808 | 13 | 2 | 3 |
| `1280x470x1` (item 4) | **false**: `scrollH` 476, scrolls 6 px, nothing clipped | 623.2 | 337.2 | 612.2 | 0.865 | 230.8 | 0 | 40 | 13 | 2 | 3 |
| `853x480x1` (150 % zoom, 5.1.8) | true | 606.1 | 320.1 | 595.1 | 0.865 | 213.7 | 1.5 | 40 | 13 | 2 | 3 |
| `844x390x3,mobile,touch,landscape` (3.1.15) | false, scrolls 84 px (`scrollH` 474) | 605.8 | 319.8 | 594.8 | 0.865 | 213.4 | 0 | 40 | 13 | 2 | 3 |

So at every rail viewport the widest text pixel sits left of R (alpha ≥ 0.865 ≥ 0.86, 3.1.10.1), and the links, status and footer end left of S (solid zone, 3.1.10.2, 3.2.5.1). The five required sizes match the 3.1.17 spare heights (73, 98, 142, 171, 396). For `640x360x1` (200 % zoom, 5.1.8) run `async () => { const r = await window.__fit(); const se = document.scrollingElement; return { ...r, band: matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches, padBottom: getComputedStyle(document.querySelector('[data-rail]')).paddingBottom, scrollW: se.scrollWidth, clientW: se.clientWidth }; }` and expect `band: true`, `padBottom: "40px"` (the `no-webgl` band padding), `scrollH` 819 (it reflows and scrolls), `scrollW === clientW` (no horizontal scroll) and all 4 project rows and 7 tags.

- [ ] **Step 8: Browser evidence, part 2: the band, hover and console (spec 3.1.13, 3.1.15, 3.5.1, 8.2.1)**

Band fit, at `emulate` `viewport: "390x844x3,mobile,touch"` and again at `"768x1024x2,mobile,touch"` (reload after each `emulate`), with this `evaluate_script` (`waitForStableDom: false`); it removes `no-webgl` so the band and its scrim take their real boxes, scrolls to the end, measures, and restores:

```js
async () => {
  await document.fonts.ready;
  document.documentElement.classList.remove('no-webgl');
  const se = document.scrollingElement;
  se.scrollTop = se.scrollHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const place = document.querySelector('.place').getBoundingClientRect();
  const scrim = document.querySelector('.scrim').getBoundingClientRect();
  const field = document.querySelector('.field').getBoundingClientRect();
  const out = {
    vp: `${innerWidth}x${innerHeight}`,
    band: matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches,
    docH: se.scrollHeight, scrollTop: se.scrollTop,
    footerBottom: Math.round(place.bottom * 10) / 10, fadeTop: Math.round(scrim.top * 10) / 10, bandTop: Math.round(field.top * 10) / 10,
    bandH: Math.round(field.height * 10) / 10, gapAboveFade: Math.round((scrim.top - place.bottom) * 10) / 10,
    namePx: parseFloat(getComputedStyle(document.querySelector('.name')).fontSize),
    statusOrder: getComputedStyle(document.querySelector('.status')).order,
    touchAction: getComputedStyle(document.querySelector('.field')).touchAction,
    scrollW: se.scrollWidth, clientW: se.clientWidth,
  };
  document.documentElement.classList.add('no-webgl');
  se.scrollTop = 0;
  return out;
}
```

Expected (±1 px):
- 390×844: `band: true`, `docH` 1279, `footerBottom` 527.6, `fadeTop` 551.7, `bandTop` 607.7, `bandH` 236.3, `gapAboveFade` 24.1 (the footer rests 24 px above the fade, 3.1.13), `namePx` 46.8, `statusOrder` "1", `touchAction` "auto", `scrollW` = `clientW` = 390.
- 768×1024 (portrait tablet gets the band, 3.1.15): `band: true`, `docH` 1121 (scrolls 97 px), `footerBottom` 657.4, `fadeTop` 681.3, `bandTop` 737.3, `bandH` 286.7, `gapAboveFade` 23.8, `namePx` 60, `statusOrder` "1", `touchAction` "auto".

Hover (3.5.1), at `emulate` `viewport: "1440x900x1"` (reload): run `() => { const r = (s) => JSON.stringify(document.querySelector(s).getBoundingClientRect()); window.__before = { gh: r('a[data-link="github"]'), hi: r('a[data-email]') }; return window.__before; }`; `take_snapshot` and `hover` the `link "github"` uid; then run `async () => { await new Promise((r) => setTimeout(r, 200)); const a = document.querySelector('a[data-link="github"]'); const r = (s) => JSON.stringify(document.querySelector(s).getBoundingClientRect()); return { same: r('a[data-link="github"]') === window.__before.gh && r('a[data-email]') === window.__before.hi, hovered: a.matches(':hover'), color: getComputedStyle(a).color, bracketOpacity: getComputedStyle(a, '::before').opacity }; }`. Expected `{ same: true, hovered: true, color: "rgb(91, 129, 255)", bracketOpacity: "1" }` (the github rect is 51.84 × 29.5 at x 57.59 in both states).

Console: open a fresh context (`new_page` `url: "about:blank"`, `isolatedContext: "t6-console"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` to `http://localhost:5173/?noentry`, run `async () => { await new Promise((r) => setTimeout(r, 4000)); return [...document.fonts].map((f) => `${f.weight} ${f.status}`); }` (expect `["400 loaded", "700 loaded"]`), then `list_console_messages` with `types: ["error", "warn"]`. Expected: `<no console messages found>`. (Reloads in the `t6` context may log "preloaded but not used" font warnings for cached fonts; that is the vault gotcha, not a defect, which is why the console check uses a fresh context.) `close_page` it.

- [ ] **Step 9: Screenshots (spec 8.3.3)**

In the `t6` page, for each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, `1366x768x1`, `768x1024x2,mobile,touch` and each look (`emulate` `colorScheme: "dark"` then `"light"`), reload `http://localhost:5173/?noentry` and `take_screenshot` with `filePath` `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-6\<w>x<h>-<look>.png`: ten files, `1440x900-dark.png` … `768x1024-light.png`. Check each by eye (Read tool): dark is `#050a22` paper with `#e8eeff` name and rows, `#7993da` secondary text and a `#5b81ff` status line; light is `#f2f6fe` with navy `#071348` ink; at 1440×900 the bottom group (Misc, links, status, `IRVINE, CA`) sits on the rail bottom with the 142 px spare gap above Misc; at 390×844 the status line sits under the tagline and the rows stack role over org; no toggle and no clock yet (Task 8 shows them). Then `close_page` the `t6` page, stop the dev server and kill its leftover node child:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }
```

Write every measured row, the band numbers, the hover result, the console result and the skill notes into `task-6-report.md`.

- [ ] **Step 10: Commit**

```bash
git add src/styles.css tests/tokens.test.ts
git commit -m "feat(style): Dither Blue tokens, rail and band layouts, entry and motion CSS

One stylesheet in the 4.6.3 order: the twelve registered colour tokens and the
300 ms theme crossfade, the dark and daylight token blocks, and the Appendix C
layout with the band under BAND_QUERY, the word toggle chip, the data-entry
contract with its 4 s failsafe, the reduced-motion block and pixelated cells.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Rail DOM modules: clock, LinkedIn presence, email copy

**Files:** Modify `src/ui/clock.ts`, `tests/clock.test.ts`; Move `src/ui/exitLine.ts` → `src/ui/links.ts` (`git mv`, then rewrite); Create `src/ui/emailCopy.ts`, `tests/links.test.ts`, `tests/emailCopy.test.ts`.

**Interfaces:**
- Consumes: Task 5 DOM contract (`[data-link="linkedin"]`, `[data-key="linkedin"]`, `[data-email]`, `.swap`, `#email-hint`, `[data-live]`, `time[data-clock-time]`).
- Produces:
  ```ts
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
  ```
- Semantics: `formatClock` builds from `Intl.DateTimeFormat('en-US', …).formatToParts` (hour without a leading zero, two-digit minute, ASCII spaces only, `AM`/`PM`, short zone); `startClock` writes `${time} ${zone}` into the `<time>` and `datetime`, re-arms each write at `msToNextMinute(now()) + 25` ms, rewrites and re-arms on `visibilitychange` to visible (listener on `el.ownerDocument`), and is never a live region. `initEmailCopy` adds `aria-describedby="email-hint"`; an unmodified primary click calls `preventDefault()` and `trigger()`; modified and middle clicks keep `mailto:`; success sets `data-copied` for `holdMs` (default 1200, restarted by a second copy), clears `live`, writes `Email address copied.` on the next frame (`requestAnimationFrame` when it exists, else `setTimeout(…, 0)`) and clears it 3000 ms later; `'fallback'` calls `assign('mailto:info@parsanaji.com')` (default `location.assign`). Defaults for `clipboard` and `assign` are read at call time.

Implementation notes the tests pin: an explicit `clipboard: undefined` in `deps` means "no clipboard" (the `in` check), so it never falls through to `navigator.clipboard`; a pending next-frame write is cancelled by a newer copy and by `dispose()`, so `dispose()` leaves no timers behind; `trigger()` never rejects.

- [ ] **Step 1: Write the failing tests**

Full file `tests/clock.test.ts` (spec 8.1.13, 3.5.13; replaces the teaser's 24-hour cases):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatClock, msToNextMinute, startClock } from '../src/ui/clock';

describe('formatClock (3.5.13)', () => {
  it('renders 14:36 PDT as 2:36 PM with a 24-hour datetime', () => {
    expect(formatClock(new Date('2026-07-01T21:36:00Z'))).toEqual({ time: '2:36 PM', zone: 'PDT', datetime: '14:36' });
  });

  it('renders midnight as 12:00 AM and noon as 12:00 PM', () => {
    expect(formatClock(new Date('2026-07-01T07:00:00Z'))).toEqual({ time: '12:00 AM', zone: 'PDT', datetime: '00:00' });
    expect(formatClock(new Date('2026-07-01T19:00:00Z'))).toEqual({ time: '12:00 PM', zone: 'PDT', datetime: '12:00' });
  });

  it('switches to PST in winter', () => {
    expect(formatClock(new Date('2026-01-15T20:05:00Z'))).toEqual({ time: '12:05 PM', zone: 'PST', datetime: '12:05' });
  });

  it('writes the hour without a leading zero and the minute with one', () => {
    expect(formatClock(new Date('2026-01-15T17:07:00Z')).time).toBe('9:07 AM');
  });

  it('uses ASCII spaces only, never U+202F, so every glyph is in the font subset', () => {
    for (let h = 0; h < 24; h++) {
      const { time, zone } = formatClock(new Date(Date.UTC(2026, 6, 1, h, 5)));
      const text = `${time} ${zone}`;
      expect(text).not.toContain('\u202f');
      expect([...text].every((c) => c >= ' ' && c <= '~')).toBe(true);
    }
  });

  it('respects an explicit time zone', () => {
    expect(formatClock(new Date('2026-07-01T12:00:00Z'), 'UTC')).toEqual({ time: '12:00 PM', zone: 'UTC', datetime: '12:00' });
  });
});

describe('msToNextMinute', () => {
  it('is 60000 minus the elapsed part of the minute', () => {
    expect(msToNextMinute(new Date('2026-07-01T21:36:30.250Z'))).toBe(29_750);
    expect(msToNextMinute(new Date('2026-07-01T21:36:00.000Z'))).toBe(60_000);
    expect(msToNextMinute(new Date('2026-07-01T21:36:59.999Z'))).toBe(1);
  });
});

describe('startClock', () => {
  class FakeDoc extends EventTarget {
    visibilityState: DocumentVisibilityState = 'visible';
  }
  const fakeTime = (doc: FakeDoc) => {
    const attrs = new Map<string, string>();
    const el = { textContent: '', ownerDocument: doc, setAttribute: (k: string, v: string) => void attrs.set(k, v) };
    return { el: el as unknown as HTMLTimeElement, attrs, text: () => el.textContent };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T21:36:30.000Z')); // 2:36:30 PM PDT
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes at once, then 25 ms after each minute boundary', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    startClock(t.el, 'America/Los_Angeles');
    expect(t.text()).toBe('2:36 PM PDT');
    expect(t.attrs.get('datetime')).toBe('14:36');
    vi.advanceTimersByTime(30_024);
    expect(t.text()).toBe('2:36 PM PDT');
    vi.advanceTimersByTime(1);
    expect(t.text()).toBe('2:37 PM PDT');
    expect(t.attrs.get('datetime')).toBe('14:37');
    vi.advanceTimersByTime(60_000);
    expect(t.text()).toBe('2:38 PM PDT');
  });

  it('rewrites when the tab becomes visible, not while hidden', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    startClock(t.el, 'America/Los_Angeles');
    vi.setSystemTime(new Date('2026-07-01T22:00:10.000Z')); // timers did not run (hidden tab)
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('2:36 PM PDT');
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('3:00 PM PDT');
  });

  it('stop() clears the timer and the listener', () => {
    const doc = new FakeDoc();
    const t = fakeTime(doc);
    const stop = startClock(t.el, 'America/Los_Angeles');
    stop();
    vi.advanceTimersByTime(120_000);
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(t.text()).toBe('2:36 PM PDT');
  });
});
```

Full file `tests/links.test.ts` (P8; spec 3.1.12, 11.22):

```ts
import { describe, expect, it } from 'vitest';
import { initLinks } from '../src/ui/links';

// A document that knows a few selectors; anything else is missing.
const fakeDoc = (nodes: Record<string, object>) =>
  ({ querySelector: (selector: string) => nodes[selector] ?? null }) as unknown as Document;

describe('initLinks (3.1.12, 11.22)', () => {
  it('reports no LinkedIn and leaves the overlay row hidden while the URL is empty', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-link="linkedin"]': {}, '[data-key="linkedin"]': row });
    expect(initLinks('', doc)).toEqual({ linkedin: false });
    expect(row.hidden).toBe(true);
  });

  it('reports LinkedIn and shows the overlay row when the URL and the anchor exist', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-link="linkedin"]': {}, '[data-key="linkedin"]': row });
    expect(initLinks('https://www.linkedin.com/in/example', doc)).toEqual({ linkedin: true });
    expect(row.hidden).toBe(false);
  });

  it('reports no LinkedIn when the URL exists but the anchor does not', () => {
    const row = { hidden: true };
    const doc = fakeDoc({ '[data-key="linkedin"]': row });
    expect(initLinks('https://www.linkedin.com/in/example', doc)).toEqual({ linkedin: false });
    expect(row.hidden).toBe(true);
  });

  it('never throws on missing elements', () => {
    expect(initLinks('https://www.linkedin.com/in/example', fakeDoc({ '[data-link="linkedin"]': {} }))).toEqual({
      linkedin: true,
    });
    expect(initLinks('', fakeDoc({}))).toEqual({ linkedin: false });
  });
});
```

Full file `tests/emailCopy.test.ts` (spec 8.1.14, 3.5.3, 11.27; Node has no `requestAnimationFrame`, so the "next frame" is the `setTimeout(…, 0)` branch under fake timers):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText, initEmailCopy } from '../src/ui/emailCopy';

const EMAIL = 'info@parsanaji.com';

class FakeLink extends EventTarget {
  readonly attrs = new Map<string, string>();
  setAttribute(k: string, v: string): void {
    this.attrs.set(k, v);
  }
  removeAttribute(k: string): void {
    this.attrs.delete(k);
  }
  hasAttribute(k: string): boolean {
    return this.attrs.has(k);
  }
}

type ClickInit = Partial<Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>>;
const click = (init: ClickInit = {}): Event =>
  Object.assign(new Event('click', { cancelable: true }), {
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...init,
  });

const setup = (deps: Parameters<typeof initEmailCopy>[2] = {}) => {
  const link = new FakeLink();
  const live = { textContent: '' };
  const assign = vi.fn();
  const handle = initEmailCopy(link as unknown as HTMLAnchorElement, EMAIL, {
    assign,
    live: live as unknown as HTMLElement,
    ...deps,
  });
  return { link, live, assign, handle };
};

const ok = () => ({ writeText: vi.fn(() => Promise.resolve()) });

describe('copyText', () => {
  it('copies through writeText', async () => {
    const clipboard = ok();
    await expect(copyText(EMAIL, clipboard)).resolves.toBe('copied');
    expect(clipboard.writeText).toHaveBeenCalledWith(EMAIL);
  });

  it('falls back when the clipboard refuses, throws or is missing', async () => {
    await expect(copyText(EMAIL, { writeText: () => Promise.reject(new Error('denied')) })).resolves.toBe('fallback');
    const throwing = {
      writeText: (): Promise<void> => {
        throw new Error('sync');
      },
    };
    await expect(copyText(EMAIL, throwing)).resolves.toBe('fallback');
    await expect(copyText(EMAIL, undefined)).resolves.toBe('fallback');
    await expect(copyText(EMAIL, {} as Pick<Clipboard, 'writeText'>)).resolves.toBe('fallback');
  });
});

describe('initEmailCopy (3.5.3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds aria-describedby="email-hint" at init', () => {
    const { link } = setup({ clipboard: ok() });
    expect(link.attrs.get('aria-describedby')).toBe('email-hint');
  });

  it('shows "copied" for 1200 ms and announces it on the next frame for 3000 ms', async () => {
    const { link, live, handle } = setup({ clipboard: ok() });
    live.textContent = 'stale';
    await expect(handle.trigger()).resolves.toBe('copied');
    expect(link.hasAttribute('data-copied')).toBe(true);
    expect(live.textContent).toBe('');
    vi.advanceTimersByTime(0); // Node has no requestAnimationFrame: the next frame is setTimeout(…, 0)
    expect(live.textContent).toBe('Email address copied.');
    vi.advanceTimersByTime(1199);
    expect(link.hasAttribute('data-copied')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(link.hasAttribute('data-copied')).toBe(false);
    vi.advanceTimersByTime(1799);
    expect(live.textContent).toBe('Email address copied.');
    vi.advanceTimersByTime(1);
    expect(live.textContent).toBe('');
  });

  it('restarts the 1200 ms hold on a second copy', async () => {
    const { link, handle } = setup({ clipboard: ok() });
    await handle.trigger();
    vi.advanceTimersByTime(1000);
    await handle.trigger();
    vi.advanceTimersByTime(1000);
    expect(link.hasAttribute('data-copied')).toBe(true);
    vi.advanceTimersByTime(200);
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('falls back to mailto: when writeText rejects', async () => {
    const { link, assign, handle } = setup({ clipboard: { writeText: () => Promise.reject(new Error('denied')) } });
    await expect(handle.trigger()).resolves.toBe('fallback');
    expect(assign).toHaveBeenCalledWith('mailto:info@parsanaji.com');
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('falls back to mailto: without a clipboard', async () => {
    const { assign, handle } = setup({ clipboard: undefined });
    await expect(handle.trigger()).resolves.toBe('fallback');
    expect(assign).toHaveBeenCalledWith('mailto:info@parsanaji.com');
  });

  it('honours the holdMs option', async () => {
    const { link, handle } = setup({ clipboard: ok(), holdMs: 500 });
    await handle.trigger();
    vi.advanceTimersByTime(500);
    expect(link.hasAttribute('data-copied')).toBe(false);
  });

  it('takes over an unmodified primary click and keeps the native mailto: otherwise', () => {
    const clipboard = ok();
    const { link } = setup({ clipboard });
    const plain = click();
    link.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(true);
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const e = click(init);
      link.dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
    }
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it('dispose() removes the click handler and the timers', async () => {
    const clipboard = ok();
    const { link, handle } = setup({ clipboard });
    await handle.trigger();
    handle.dispose();
    const e = click();
    link.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/clock.test.ts tests/links.test.ts tests/emailCopy.test.ts`

Expected: FAIL, `Test Files  3 failed (3)`. `links.test.ts` and `emailCopy.test.ts` fail to load (`Error: Cannot find module '../src/ui/links'` and `'../src/ui/emailCopy'`); `clock.test.ts` reports 9 failures against the teaser clock, for example `AssertionError: expected { time: '14:36', zone: 'PDT' } to deeply equal { time: '2:36 PM', zone: 'PDT', …(1) }` (only the U+202F case already passes).

- [ ] **Step 3: Move `exitLine.ts` to `links.ts` and rewrite it (spec 3.1.12, 4.3.1, 11.22)**

```bash
git mv src/ui/exitLine.ts src/ui/links.ts
```

Full file `src/ui/links.ts`:

```ts
/**
 * LinkedIn presence (spec 3.1.12, 11.22). The anchor exists in index.html only once Parsa has given the URL
 * (one commit sets CONTENT.links.linkedin, the <li> and the JSON-LD sameAs together). When both exist, the
 * overlay's `l` row is shown and the `l` shortcut is enabled through the returned flag. Never throws (4.3.1).
 */
export function initLinks(linkedinUrl: string, doc: Document = document): { linkedin: boolean } {
  const linkedin = linkedinUrl !== '' && doc.querySelector('[data-link="linkedin"]') !== null;
  if (linkedin) {
    const row = doc.querySelector<HTMLElement>('[data-key="linkedin"]');
    if (row) row.hidden = false;
  }
  return { linkedin };
}
```

- [ ] **Step 4: Rewrite the clock (spec 3.5.13, 3.1.6, 9.15)**

Full file `src/ui/clock.ts`:

```ts
/**
 * Footer clock (spec 3.5.13): America/Los_Angeles, 12-hour, written "2:36 PM PDT". Built from formatToParts,
 * never from format(), because ICU 72+ puts U+202F before AM/PM and that glyph is not in the font subset.
 */
export function formatClock(
  date: Date,
  timeZone = 'America/Los_Angeles',
  locale = 'en-US',
): { time: string; zone: string; datetime: string } {
  const get = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const twelve = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(date);
  const h23 = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return {
    time: `${get(twelve, 'hour')}:${get(twelve, 'minute')} ${get(twelve, 'dayPeriod').toUpperCase()}`,
    zone: get(twelve, 'timeZoneName'),
    datetime: `${get(h23, 'hour')}:${get(h23, 'minute')}`,
  };
}

/** Milliseconds until the next minute boundary: 60000 - (seconds * 1000 + milliseconds). */
export function msToNextMinute(date: Date): number {
  return 60_000 - (date.getUTCSeconds() * 1000 + date.getUTCMilliseconds());
}

/**
 * Writes "2:36 PM PDT" and the 24-hour datetime into the <time>, then re-arms 25 ms after each minute boundary.
 * A visibilitychange to visible rewrites at once and re-arms. Never a live region. Returns stop.
 */
export function startClock(el: HTMLTimeElement, timeZone: string, now: () => Date = () => new Date()): () => void {
  const doc = el.ownerDocument;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const write = (): void => {
    const date = now();
    const { time, zone, datetime } = formatClock(date, timeZone);
    el.textContent = `${time} ${zone}`;
    el.setAttribute('datetime', datetime);
    clearTimeout(timer);
    timer = setTimeout(write, msToNextMinute(date) + 25);
  };
  const onVisibility = (): void => {
    if (doc.visibilityState === 'visible') write();
  };
  write();
  doc.addEventListener('visibilitychange', onVisibility);
  return () => {
    clearTimeout(timer);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
```

- [ ] **Step 5: Write the email copy (spec 3.5.3, 5.1.5, 11.27)**

Full file `src/ui/emailCopy.ts`:

```ts
/**
 * "say hi" (spec 3.5.3, 11.27): an unmodified primary click copies the address instead of opening the mail app.
 * Success shows "copied" in place for holdMs (data-copied) and announces it in the live region; a missing or
 * refusing clipboard falls back to the mailto: link, so a click is never dead.
 */
export type CopyResult = 'copied' | 'fallback';

const COPIED_SENTENCE = 'Email address copied.';

export async function copyText(text: string, clipboard: Pick<Clipboard, 'writeText'> | undefined): Promise<CopyResult> {
  if (!clipboard || typeof clipboard.writeText !== 'function') return 'fallback';
  try {
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'fallback';
  }
}

export function initEmailCopy(
  link: HTMLAnchorElement,
  email: string,
  deps: {
    clipboard?: Pick<Clipboard, 'writeText'>;
    assign?: (url: string) => void;
    holdMs?: number;
    live?: HTMLElement | null;
  } = {},
): { trigger(): Promise<CopyResult>; dispose(): void } {
  const holdMs = deps.holdMs ?? 1200;
  const live = deps.live ?? null;
  let holdTimer: ReturnType<typeof setTimeout> | undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;
  let cancelFrame: (() => void) | null = null;

  link.setAttribute('aria-describedby', 'email-hint');

  const announce = (): void => {
    if (!live) return;
    clearTimeout(liveTimer);
    live.textContent = '';
    const write = (): void => {
      live.textContent = COPIED_SENTENCE;
      liveTimer = setTimeout(() => {
        live.textContent = '';
      }, 3000);
    };
    // the region is cleared first and written on the next frame, so a repeat copy is announced again
    cancelFrame?.();
    if (typeof globalThis.requestAnimationFrame === 'function') {
      const id = globalThis.requestAnimationFrame(write);
      cancelFrame = () => globalThis.cancelAnimationFrame(id);
    } else {
      const id = setTimeout(write, 0);
      cancelFrame = () => clearTimeout(id);
    }
  };

  const trigger = async (): Promise<CopyResult> => {
    // defaults are read at call time: the clipboard and location of the live page, never captured at import
    const clipboard = 'clipboard' in deps ? deps.clipboard : globalThis.navigator?.clipboard;
    const result = await copyText(email, clipboard);
    if (result === 'copied') {
      link.setAttribute('data-copied', '');
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => link.removeAttribute('data-copied'), holdMs);
      announce();
    } else {
      const assign = deps.assign ?? ((url: string) => globalThis.location.assign(url));
      try {
        assign(`mailto:${email}`);
      } catch {
        // navigation refused: nothing else to do, and production logs nothing (4.7.6)
      }
    }
    return result;
  };

  const onClick = (event: Event): void => {
    const e = event as MouseEvent;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // keep the native mailto:
    e.preventDefault();
    void trigger();
  };
  link.addEventListener('click', onClick);

  return {
    trigger,
    dispose(): void {
      link.removeEventListener('click', onClick);
      clearTimeout(holdTimer);
      clearTimeout(liveTimer);
      cancelFrame?.();
    },
  };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/clock.test.ts tests/links.test.ts tests/emailCopy.test.ts`

Expected: PASS, `Test Files  3 passed (3)`, `Tests  24 passed (24)` (clock 10, links 4, emailCopy 10).

- [ ] **Step 7: Full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: `Test Files  15 passed (15)`, `Tests  118 passed (118)`; typecheck silent; the build succeeds (nothing imports the three modules until Task 8, so the bundle is unchanged). No browser evidence: the modules are wired and verified in Task 8.

- [ ] **Step 8: Commit**

```bash
git add src/ui/clock.ts src/ui/links.ts src/ui/emailCopy.ts tests/clock.test.ts tests/links.test.ts tests/emailCopy.test.ts
git status --short
```

Expected (the rewrite leaves too little of `exitLine.ts` for git to pair it as a rename; the `git mv` still recorded the intent):

```
M  src/ui/clock.ts
A  src/ui/emailCopy.ts
D  src/ui/exitLine.ts
A  src/ui/links.ts
M  tests/clock.test.ts
A  tests/emailCopy.test.ts
A  tests/links.test.ts
```

```bash
git commit -m "feat(ui): 12-hour clock, LinkedIn presence and say-hi email copy

The footer clock writes \"2:36 PM PDT\" from formatToParts (no U+202F) and re-arms
25 ms after each minute; initLinks reports LinkedIn only when its URL and anchor
exist; initEmailCopy copies on an unmodified primary click, shows \"copied\" for
1.2 s, announces it politely and falls back to mailto:.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Theme logic, toggle and the slice-1 boot

**Files:** Create `src/theme/theme.ts`, `src/theme/themeController.ts`, `tests/theme.test.ts`; Modify `src/main.ts` (slice-1 boot, below).

**Interfaces:**
- Consumes: Task 7 `startClock(el: HTMLTimeElement, timeZone: string, now?: () => Date): () => void`, `initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }`, `initEmailCopy(link: HTMLAnchorElement, email: string, deps?: { clipboard?: Pick<Clipboard, 'writeText'>; assign?: (url: string) => void; holdMs?: number; live?: HTMLElement | null }): { trigger(): Promise<CopyResult>; dispose(): void }`; Task 5 `CONTENT` and the DOM contract; Task 6 CSS contract (`html.theme-anim`, `--field-0..3`, `--theme-color`).
- Produces:
  ```ts
  // src/theme/theme.ts
  export type Theme = 'light' | 'dark';
  export type ThemePref = Theme | 'system';
  export const THEME_KEY = 'pn.theme';
  export type RGB = readonly [number, number, number]; // sRGB 0..1
  export interface FieldColors { f0: RGB; f1: RGB; f2: RGB; f3: RGB } // P1: declared here, re-exported by src/field/renderer.ts
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
  ```
  `start(to, nowMs)` tweens from the value sampled at `nowMs`; `parseHex` trims and accepts `#rrggbb`. `initTheme`'s `theme` and `colors` are getters that always return the current look and its field colours; it runs the 4.6.7 initial state and the 4.6.5 press steps (OS change while `'system'`: steps 1, 4, 5, 6, 7).
- Produces (`src/main.ts` after Task 8; names and order binding for slice 2):
  1. Imports: `CONTENT` from `./content`; `initTheme` from `./theme/themeController`; `startClock` from `./ui/clock`; `initEmailCopy` from `./ui/emailCopy`; `initLinks` from `./ui/links`.
  2. `function devWarn(message: string): void` — `if (import.meta.env.DEV) console.warn(`[pn] ${message}`)`.
  3. `function safeStorage(win: Window): Storage | null` — `win.localStorage` inside try/catch, `null` on throw.
  4. `function applyFallback(doc: Document): void` — adds `no-webgl` to `<html>` and removes `data-entry`; logs nothing (P9).
  5. `function takeEntryControl(doc: Document): boolean` — removes `data-entry` and returns `false` (P9).
  6. `function boot(): void`, in order: `const doc = document; const win = window;` → `initLinks(CONTENT.links.linkedin, doc)` → `initEmailCopy` on `a[data-email]` (if present) with `{ live: doc.querySelector<HTMLElement>('[data-live]') }` → `startClock(time[data-clock-time], CONTENT.clock.timeZone)` then `[data-clock].hidden = false` (if both exist) → `initTheme({ doc, storage: safeStorage(win), systemDark: win.matchMedia('(prefers-color-scheme: dark)'), button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'), onChange: () => {} })` → `takeEntryControl(doc)` → `applyFallback(doc)` (no field until Task 15).
  7. Top level: `try { boot(); } catch (error) { devWarn(String(error)); applyFallback(document); }`.

Implementation notes: `parseHex` returns black `[0, 0, 0]` for anything that is not `#rrggbb` (an empty computed value when the stylesheet failed), so `initTheme` never throws; `ColorTween.active` is true from `start()` until a `sample()` at or after the end of the fade (App samples every frame, Task 19 relies on it); the controller restores the two `theme-color` metas to the `content` values it read at init (`#f2f6fe`, `#050a22` from Task 5), so no colour is hard-coded in TypeScript (3.3.12).

- [ ] **Step 1: Write the failing test**

Full file `tests/theme.test.ts` (spec 8.1.9, Appendix A §9.1, plus the 4.6.5–4.6.7 controller steps against a small fake DOM whose computed `--field-*` follow `data-theme` and the OS scheme as `src/styles.css` does):

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ColorTween,
  type FieldColors,
  THEME_KEY,
  lerpRGB,
  parseHex,
  readPref,
  resolveTheme,
  toggleLabel,
  togglePref,
  writePref,
} from '../src/theme/theme';
import { initTheme, readFieldColors } from '../src/theme/themeController';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
};
const throwingStorage = {
  getItem: (): string | null => {
    throw new Error('SecurityError');
  },
  setItem: (): void => {
    throw new Error('QuotaExceededError');
  },
  removeItem: (): void => {
    throw new Error('SecurityError');
  },
};

describe('preference (3.5.10)', () => {
  it('readPref returns a stored look and "system" for anything else', () => {
    expect(THEME_KEY).toBe('pn.theme');
    expect(readPref(memoryStorage({ 'pn.theme': 'light' }))).toBe('light');
    expect(readPref(memoryStorage({ 'pn.theme': 'dark' }))).toBe('dark');
    expect(readPref(memoryStorage({ 'pn.theme': 'sepia' }))).toBe('system');
    expect(readPref(memoryStorage())).toBe('system');
    expect(readPref(throwingStorage)).toBe('system');
    expect(readPref(null)).toBe('system');
  });

  it('writePref stores a look, removes the key for "system" and never throws', () => {
    const s = memoryStorage();
    writePref(s, 'dark');
    expect(s.map.get('pn.theme')).toBe('dark');
    writePref(s, 'system');
    expect(s.map.has('pn.theme')).toBe(false);
    expect(() => writePref(throwingStorage, 'light')).not.toThrow();
    expect(() => writePref(throwingStorage, 'system')).not.toThrow();
    expect(() => writePref(null, 'light')).not.toThrow();
  });

  it('resolveTheme follows the OS only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('togglePref flips and collapses to "system" when the flip equals the OS look', () => {
    expect(togglePref('dark', true)).toBe('light');
    expect(togglePref('light', true)).toBe('system');
    expect(togglePref('light', false)).toBe('dark');
    expect(togglePref('dark', false)).toBe('system');
  });

  it('toggleLabel names the target look (5.1.4)', () => {
    expect(toggleLabel('dark')).toEqual({ word: 'light', label: 'Switch to light mode' });
    expect(toggleLabel('light')).toEqual({ word: 'dark', label: 'Switch to dark mode' });
  });
});

describe('colours', () => {
  it('parseHex trims and reads #rrggbb as sRGB 0..1, anything else is black', () => {
    expect(parseHex(' #050a22')).toEqual([5 / 255, 10 / 255, 34 / 255]);
    expect(parseHex('#FFFFFF')).toEqual([1, 1, 1]);
    expect(parseHex('')).toEqual([0, 0, 0]);
    expect(parseHex('rgb(5 10 34)')).toEqual([0, 0, 0]);
  });

  it('lerpRGB interpolates each channel', () => {
    expect(lerpRGB([0, 0.5, 1], [1, 0.5, 0], 0.25)).toEqual([0.25, 0.5, 0.75]);
  });
});

describe('ColorTween (4.6.6)', () => {
  const solid = (v: number): FieldColors => ({ f0: [v, v, v], f1: [v, v, v], f2: [v, v, v], f3: [v, v, v] });

  it('is linear over 300 ms on the wall clock and lands exactly on the target', () => {
    const t = new ColorTween();
    t.set(solid(0));
    expect(t.active).toBe(false);
    t.start(solid(1), 1000);
    expect(t.active).toBe(true);
    expect(t.sample(1150).f0[0]).toBeCloseTo(0.5, 12);
    expect(t.sample(1300)).toEqual(solid(1));
    expect(t.active).toBe(false);
    expect(t.sample(5000)).toEqual(solid(1));
  });

  it('starts a second tween from the value sampled at that moment (no jump)', () => {
    const t = new ColorTween(300);
    t.set(solid(0));
    t.start(solid(1), 0);
    t.start(solid(0), 150); // reverse at the midpoint
    expect(t.sample(150).f2[1]).toBeCloseTo(0.5, 12);
    expect(t.sample(300).f2[1]).toBeCloseTo(0.25, 12);
    expect(t.sample(450)).toEqual(solid(0));
  });
});

// A minimal DOM for the controller: <html> with classes and attributes, two theme-color metas, the toggle and the
// computed --field-* / --theme-color, which follow data-theme and the OS scheme the way src/styles.css does.
const DARK_CSS: Record<string, string> = {
  '--field-0': '#050a22',
  '--field-1': '#3b5df0',
  '--field-2': '#8db0ff',
  '--field-3': '#e8eeff',
  '--theme-color': '#050a22',
};
const LIGHT_CSS: Record<string, string> = {
  '--field-0': '#f2f6fe',
  '--field-1': '#8db0ff',
  '--field-2': '#3b5df0',
  '--field-3': '#0832b8',
  '--theme-color': '#f2f6fe',
};

function fakeEnv(opts: { stored?: string; osDark: boolean; button?: boolean }) {
  const attrs = new Map<string, string>();
  const classes = new Set<string>();
  const root = {
    setAttribute: (k: string, v: string) => void attrs.set(k, v),
    removeAttribute: (k: string) => void attrs.delete(k),
    classList: { add: (c: string) => void classes.add(c), remove: (c: string) => void classes.delete(c) },
  };
  const systemDark = Object.assign(new EventTarget(), { matches: opts.osDark });
  const metas = [{ content: '#f2f6fe' }, { content: '#050a22' }];
  const word = { textContent: '' };
  const button = Object.assign(new EventTarget(), {
    hidden: true,
    label: '',
    setAttribute(k: string, v: string) {
      if (k === 'aria-label') this.label = v;
    },
    querySelector: (sel: string) => (sel === '[data-theme-word]' ? word : null),
  });
  const look = () => {
    const t = attrs.get('data-theme');
    return t === 'light' || (t === undefined && !systemDark.matches) ? LIGHT_CSS : DARK_CSS;
  };
  const doc = {
    documentElement: root,
    defaultView: { getComputedStyle: () => ({ getPropertyValue: (name: string) => ` ${look()[name] ?? ''}` }) },
    querySelectorAll: (sel: string) => (sel === 'meta[name="theme-color"]' ? metas : []),
  };
  const storage = memoryStorage(opts.stored ? { 'pn.theme': opts.stored } : {});
  const onChange = vi.fn();
  const handle = initTheme({
    doc: doc as unknown as Document,
    storage: storage as unknown as Storage,
    systemDark: systemDark as unknown as MediaQueryList,
    button: opts.button === false ? null : (button as unknown as HTMLButtonElement),
    onChange,
  });
  const press = () => button.dispatchEvent(new Event('click'));
  const osChange = (dark: boolean) => {
    systemDark.matches = dark;
    systemDark.dispatchEvent(new Event('change'));
  };
  return { attrs, classes, metas, word, button, storage, onChange, handle, press, osChange, doc };
}

describe('initTheme (4.6.5-4.6.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('follows the OS by default: no data-theme, original metas, the word names the other look, button shown', () => {
    const e = fakeEnv({ osDark: true });
    expect(e.handle.theme).toBe('dark');
    expect(e.attrs.has('data-theme')).toBe(false);
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#050a22']);
    expect(e.word.textContent).toBe('light');
    expect(e.button.label).toBe('Switch to light mode');
    expect(e.button.hidden).toBe(false);
    expect(e.handle.colors.f3).toEqual(parseHex('#e8eeff'));
  });

  it('applies a stored look opposite the OS and points both metas at it', () => {
    const e = fakeEnv({ stored: 'light', osDark: true });
    expect(e.handle.theme).toBe('light');
    expect(e.attrs.get('data-theme')).toBe('light');
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#f2f6fe']);
    expect(e.word.textContent).toBe('dark');
    expect(e.handle.colors.f3).toEqual(parseHex('#0832b8'));
  });

  it('a press flips the look, stores it, crossfades and relabels; theme-anim lasts 320 ms', () => {
    const e = fakeEnv({ osDark: true });
    e.press();
    expect(e.classes.has('theme-anim')).toBe(true);
    expect(e.attrs.get('data-theme')).toBe('light');
    expect(e.storage.map.get('pn.theme')).toBe('light');
    expect(e.onChange).toHaveBeenCalledWith(readFieldColors(e.doc as unknown as Document), true);
    expect(e.onChange.mock.calls[0][0].f0).toEqual(parseHex('#f2f6fe'));
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#f2f6fe']);
    expect(e.word.textContent).toBe('dark');
    expect(e.button.label).toBe('Switch to dark mode');
    expect(e.handle.theme).toBe('light');
    vi.advanceTimersByTime(319);
    expect(e.classes.has('theme-anim')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(e.classes.has('theme-anim')).toBe(false);
  });

  it('pressing back to the OS look removes the key and restores both metas', () => {
    const e = fakeEnv({ osDark: true });
    e.press();
    e.press();
    expect(e.storage.map.has('pn.theme')).toBe(false);
    expect(e.attrs.has('data-theme')).toBe(false);
    expect(e.metas.map((m) => m.content)).toEqual(['#f2f6fe', '#050a22']);
    expect(e.handle.theme).toBe('dark');
  });

  it('a second press within 320 ms re-arms the theme-anim timer', () => {
    const e = fakeEnv({ osDark: false });
    e.press();
    vi.advanceTimersByTime(200);
    e.press();
    vi.advanceTimersByTime(200);
    expect(e.classes.has('theme-anim')).toBe(true);
    vi.advanceTimersByTime(120);
    expect(e.classes.has('theme-anim')).toBe(false);
  });

  it('follows an OS change while on "system", and ignores it while a look is stored', () => {
    const e = fakeEnv({ osDark: true });
    e.osChange(false);
    expect(e.handle.theme).toBe('light');
    expect(e.onChange).toHaveBeenLastCalledWith(readFieldColors(e.doc as unknown as Document), true);
    expect(e.word.textContent).toBe('dark');
    expect(e.storage.map.has('pn.theme')).toBe(false);
    const stored = fakeEnv({ stored: 'dark', osDark: true });
    stored.osChange(false);
    expect(stored.handle.theme).toBe('dark');
    expect(stored.onChange).not.toHaveBeenCalled();
  });

  it('works without a button and stops listening on dispose()', () => {
    const e = fakeEnv({ osDark: true, button: false });
    expect(e.handle.theme).toBe('dark');
    e.handle.dispose();
    e.osChange(false);
    expect(e.onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/theme.test.ts`

Expected: FAIL, `Test Files  1 failed (1)`, `Tests  no tests`, with `Error: Cannot find module '../src/theme/theme' imported from …/tests/theme.test.ts`.

- [ ] **Step 3: Write the pure theme module (spec 3.5.10, 4.6.6, 5.1.4, 11.2)**

Full file `src/theme/theme.ts`:

```ts
/**
 * Pure theme logic (spec 3.5.10, 4.6.5-4.6.7): the stored preference, the resolved look, the toggle's word and
 * label, and the field-colour crossfade. No DOM access; themeController.ts does the DOM side.
 */
export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';
export const THEME_KEY = 'pn.theme';

/** sRGB, each channel 0..1. */
export type RGB = readonly [number, number, number];
/** The four field tier colours (P1: declared here, re-exported by src/field/renderer.ts). */
export interface FieldColors {
  f0: RGB;
  f1: RGB;
  f2: RGB;
  f3: RGB;
}

/** The stored preference; a missing, unknown or unreadable value means 'system' (3.5.10). */
export function readPref(storage: Pick<Storage, 'getItem'> | null): ThemePref {
  if (!storage) return 'system';
  try {
    const value = storage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

/** 'system' removes the key; storage that throws is ignored, so the toggle works for the session only. */
export function writePref(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePref): void {
  if (!storage) return;
  try {
    if (pref === 'system') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, pref);
  } catch {
    // private mode or blocked storage: keep the look for this page only
  }
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): Theme {
  if (pref !== 'system') return pref;
  return systemDark ? 'dark' : 'light';
}

/** Flips the look; returns 'system' when the new look equals the OS look (smart default, 1.4). */
export function togglePref(current: Theme, systemDark: boolean): ThemePref {
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  return next === (systemDark ? 'dark' : 'light') ? 'system' : next;
}

/** The toggle names the target look (3.5.10, 5.1.4). */
export function toggleLabel(current: Theme): {
  word: 'dark' | 'light';
  label: 'Switch to dark mode' | 'Switch to light mode';
} {
  return current === 'dark'
    ? { word: 'light', label: 'Switch to light mode' }
    : { word: 'dark', label: 'Switch to dark mode' };
}

/** '#rrggbb' (surrounding whitespace allowed, as getPropertyValue returns it) to sRGB 0..1; anything else is black. */
export function parseHex(hex: string): RGB {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  return [Number.parseInt(m[1], 16) / 255, Number.parseInt(m[2], 16) / 255, Number.parseInt(m[3], 16) / 255];
}

export function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const BLACK: RGB = [0, 0, 0];

/**
 * Linear per-channel crossfade of the field colours on the wall clock (4.6.6): c = c0 + (c1 - c0) * min(1, dt / dur),
 * the same sRGB interpolation CSS applies to the registered tokens, so the page and the off cells move in step.
 */
export class ColorTween {
  private readonly durMs: number;
  private from: FieldColors = { f0: BLACK, f1: BLACK, f2: BLACK, f3: BLACK };
  private to: FieldColors = this.from;
  private t0 = 0;
  private running = false;

  constructor(durMs = 300) {
    this.durMs = durMs;
  }

  /** Jumps to `c` with no animation. */
  set(c: FieldColors): void {
    this.from = c;
    this.to = c;
    this.running = false;
  }

  /** Tweens from the value sampled at `nowMs` (so a second toggle mid-fade never jumps) to `to`. */
  start(to: FieldColors, nowMs: number): void {
    this.from = this.sample(nowMs);
    this.to = to;
    this.t0 = nowMs;
    this.running = true;
  }

  sample(nowMs: number): FieldColors {
    if (!this.running) return this.to;
    const u = this.durMs > 0 ? Math.min(1, Math.max(0, (nowMs - this.t0) / this.durMs)) : 1;
    if (u >= 1) {
      this.running = false;
      return this.to;
    }
    const { from, to } = this;
    return { f0: lerpRGB(from.f0, to.f0, u), f1: lerpRGB(from.f1, to.f1, u), f2: lerpRGB(from.f2, to.f2, u), f3: lerpRGB(from.f3, to.f3, u) };
  }

  /** True from start() until a sample at or after the end of the fade. */
  get active(): boolean {
    return this.running;
  }
}
```

- [ ] **Step 4: Write the controller (spec 3.2.6, 3.2.9, 3.5.10, 4.6.4–4.6.7, Appendix B §5.3)**

Full file `src/theme/themeController.ts`:

```ts
import {
  type FieldColors,
  type Theme,
  type ThemePref,
  parseHex,
  readPref,
  resolveTheme,
  toggleLabel,
  togglePref,
  writePref,
} from './theme';

/**
 * The DOM side of the theme (spec 3.2.6, 3.2.9, 3.5.10, 4.6.5-4.6.7): the toggle button, data-theme on <html>,
 * the theme-color metas and the field colours read from the computed --field-0..3 (CSS is their only source, 3.3.12).
 */
export interface ThemeControllerDeps {
  doc: Document;
  storage: Storage | null;
  systemDark: MediaQueryList;
  button: HTMLButtonElement | null;
  onChange: (colors: FieldColors, animate: boolean) => void;
}

/** Twelve registered tokens transition for 300 ms; the class is removed 320 ms after the last change (4.6.5 step 7). */
const ANIM_CLASS_MS = 320;

function rootStyle(doc: Document): CSSStyleDeclaration | null {
  const view = doc.defaultView;
  return view ? view.getComputedStyle(doc.documentElement) : null;
}

/** getComputedStyle(documentElement) --field-0..3, unregistered, so they are the target hex at once (4.6.4). */
export function readFieldColors(doc: Document): FieldColors {
  const cs = rootStyle(doc);
  const read = (name: string) => parseHex(cs ? cs.getPropertyValue(name) : '');
  return { f0: read('--field-0'), f1: read('--field-1'), f2: read('--field-2'), f3: read('--field-3') };
}

export function initTheme(d: ThemeControllerDeps): { readonly theme: Theme; readonly colors: FieldColors; dispose(): void } {
  const { doc, storage, systemDark, button, onChange } = d;
  const root = doc.documentElement;
  const metas = Array.from(doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  const originalMeta = metas.map((m) => m.content); // #f2f6fe (light) and #050a22 (dark), restored for 'system'
  const word = button?.querySelector<HTMLElement>('[data-theme-word]') ?? null;

  let pref: ThemePref = readPref(storage);
  let theme: Theme = resolveTheme(pref, systemDark.matches);
  let animTimer: ReturnType<typeof setTimeout> | undefined;

  const applyAttribute = (): void => {
    if (pref === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', pref);
  };
  const applyMetas = (): void => {
    if (pref === 'system') {
      metas.forEach((m, i) => {
        m.content = originalMeta[i];
      });
      return;
    }
    const color = rootStyle(doc)?.getPropertyValue('--theme-color').trim() ?? '';
    if (color) metas.forEach((m) => (m.content = color));
  };
  const applyLabel = (): void => {
    const { word: target, label } = toggleLabel(theme);
    if (word) word.textContent = target;
    button?.setAttribute('aria-label', label);
  };
  const startAnim = (): void => {
    root.classList.add('theme-anim');
    clearTimeout(animTimer);
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), ANIM_CLASS_MS);
  };

  // 4.6.7 initial state: data-theme again (idempotent with theme-boot.js), metas when explicit, word and label, then show
  applyAttribute();
  if (pref !== 'system') applyMetas();
  applyLabel();
  if (button) button.hidden = false;
  let colors: FieldColors = readFieldColors(doc);

  // 4.6.5: a press runs steps 1-7
  const onPress = (): void => {
    startAnim(); // 1 (step 7 is the timer it re-arms)
    pref = togglePref(theme, systemDark.matches); // 2
    theme = resolveTheme(pref, systemDark.matches);
    applyAttribute();
    writePref(storage, pref); // 3
    colors = readFieldColors(doc); // 4
    onChange(colors, true);
    applyMetas(); // 5
    applyLabel(); // 6
  };
  // an OS change while the pref is 'system' runs steps 1, 4, 5, 6 and 7
  const onSystemChange = (): void => {
    if (pref !== 'system') return;
    startAnim();
    theme = resolveTheme(pref, systemDark.matches);
    colors = readFieldColors(doc);
    onChange(colors, true);
    applyMetas();
    applyLabel();
  };

  button?.addEventListener('click', onPress);
  systemDark.addEventListener('change', onSystemChange);

  return {
    get theme(): Theme {
      return theme;
    },
    get colors(): FieldColors {
      return colors;
    },
    dispose(): void {
      button?.removeEventListener('click', onPress);
      systemDark.removeEventListener('change', onSystemChange);
      clearTimeout(animTimer);
      root.classList.remove('theme-anim');
    },
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/theme.test.ts`

Expected: PASS, `Test Files  1 passed (1)`, `Tests  16 passed (16)`.

- [ ] **Step 6: Write the slice-1 boot (spec 4.7.1 slice-1 subset, 4.4.1, 4.7.6, P9)**

Full file `src/main.ts`:

```ts
// Slice-1 boot (spec 4.7.1 subset): the rail's DOM modules and the theme. There is no field until Task 15,
// so every load applies the static fallback and the rail shows at once (P9).
import { CONTENT } from './content';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';

/** One console.warn per failure on the dev server; production logs nothing at warn or error level (4.7.6). */
function devWarn(message: string): void {
  if (import.meta.env.DEV) console.warn(`[pn] ${message}`);
}

/** localStorage, or null where reading it throws (blocked storage counts as "system", 3.5.10). */
function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** The static fallback (3.6.2): CSS hides the canvas and the scrim, and the rail shows at once. Logs nothing (P9). */
function applyFallback(doc: Document): void {
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}

function boot(): void {
  const doc = document;
  const win = window;
  initLinks(CONTENT.links.linkedin, doc);
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { live: doc.querySelector<HTMLElement>('[data-live]') });
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: () => {},
  });
  takeEntryControl(doc);
  applyFallback(doc); // no field until Task 15
}

try {
  boot();
} catch (error) {
  devWarn(String(error));
  applyFallback(document);
}
```

- [ ] **Step 7: Full gate and the production bundle**

```bash
npm test
npm run typecheck
npm run build
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
grep -c "console.warn" dist/assets/*.js
```

Expected: `Test Files  16 passed (16)`, `Tests  134 passed (134)`; typecheck silent; the build succeeds (`dist/assets/index-….js 5.77 kB │ gzip: 2.40 kB`, CSS 16.19 kB); the 8.1.4 measurement prints `2.3 KB` (budget 60 KB, 6.1.1); the grep prints `0` (the DEV-only warning is dropped from production, 4.7.6).

- [ ] **Step 8: Load the `frontend-design` skill (Execution Notes, 8.3.5)**

Invoke the Skill tool with `frontend-design:frontend-design`; review the toggle chip and the clock line in the Step 10 screenshots against it and record the notes in `task-8-report.md`. Spec values stay binding.

- [ ] **Step 9: Browser evidence on the dev server (spec 8.2.5 DOM part, 8.2.7, 8.2.11 copy part, 3.5.11, 3.5.13)**

```bash
mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-8
npm run dev
```

Run `npm run dev` with `run_in_background` (port 5173 or the one Vite prints). Load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__take_snapshot,mcp__plugin_ecc_chrome-devtools__click,mcp__plugin_ecc_chrome-devtools__press_key,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__close_page`. Use `waitForStableDom: false` on every `evaluate_script`.

1. Initial state. `new_page` `url: "about:blank"`, `isolatedContext: "t8"`; `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`; `navigate_page` to `http://localhost:5173/` with `initScript` `window.__copied = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });` (headless Chrome refuses the real clipboard without focus, so a stub stands in). Run:
   ```js
   () => { const h = document.documentElement; const b = document.querySelector('[data-theme-toggle]'); const t = document.querySelector('time[data-clock-time]'); return { dataTheme: h.getAttribute('data-theme'), dataEntry: h.getAttribute('data-entry'), noWebgl: h.classList.contains('no-webgl'), stored: localStorage.getItem('pn.theme'), metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content), word: b.textContent, label: b.getAttribute('aria-label'), hidden: b.hidden, pressed: b.hasAttribute('aria-pressed'), clock: t.textContent, datetime: t.getAttribute('datetime'), clockShown: !document.querySelector('[data-clock]').hidden, describedby: document.querySelector('a[data-email]').getAttribute('aria-describedby'), bg: getComputedStyle(document.body).backgroundColor, toggle: [Math.round(b.getBoundingClientRect().width * 10) / 10, b.getBoundingClientRect().height] }; }
   ```
   Expected: `dataTheme: null`, `dataEntry: null` (P9: the rail shows at once), `noWebgl: true`, `stored: null`, `metas: ["#f2f6fe", "#050a22"]`, `word: "light"`, `label: "Switch to light mode"`, `hidden: false`, `pressed: false`, `clock` matching `/^(1[0-2]|[1-9]):[0-5]\d (AM|PM) (PDT|PST)$/`, `datetime` matching `/^\d\d:\d\d$/`, `clockShown: true`, `describedby: "email-hint"`, `bg: "rgb(5, 10, 34)"`, `toggle: [88.4, 40]` (3.1.16.1).
2. Toggle by pointer. `take_snapshot`; `click` the `button "Switch to light mode"` uid. Run `() => { const h = document.documentElement; const b = document.querySelector('[data-theme-toggle]'); return { dataTheme: h.getAttribute('data-theme'), stored: localStorage.getItem('pn.theme'), metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content), word: b.textContent, label: b.getAttribute('aria-label'), field3: getComputedStyle(h).getPropertyValue('--field-3').trim(), width: Math.round(b.getBoundingClientRect().width * 10) / 10 }; }`. Expected `{ dataTheme: "light", stored: "light", metas: ["#f2f6fe", "#f2f6fe"], word: "dark", label: "Switch to dark mode", field3: "#0832b8", width: 88.4 }` (the chip does not change size).
3. Crossfade and the way back to the OS look. Run `async () => { const b = document.querySelector('[data-theme-toggle]'); const t0 = performance.now(); b.click(); await new Promise((r) => setTimeout(r, 150)); const mid = getComputedStyle(document.body).backgroundColor; const at = Math.round(performance.now() - t0); await new Promise((r) => setTimeout(r, 400)); const h = document.documentElement; return { at, mid, end: getComputedStyle(document.body).backgroundColor, dataTheme: h.getAttribute('data-theme'), stored: localStorage.getItem('pn.theme'), metas: [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.content), anim: h.classList.contains('theme-anim'), word: b.textContent }; }`. Expected: `mid` within ±3/255 per channel of the sRGB midpoint `rgb(123.5, 128, 144)` of `#f2f6fe` and `#050a22` at `at` ≈ 150–160 ms (measured `rgb(122, 127, 143)` at 158 ms); `end: "rgb(5, 10, 34)"`, `dataTheme: null`, `stored: null` (the key is removed), `metas: ["#f2f6fe", "#050a22"]` (restored), `anim: false`, `word: "light"`.
4. "say hi" copy (3.5.3). Run `async () => { const a = document.querySelector('a[data-email]'); const live = document.querySelector('[data-live]'); const w0 = a.getBoundingClientRect().width; a.click(); await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))); const s1 = { copied: a.hasAttribute('data-copied'), live: live.textContent, sameWidth: a.getBoundingClientRect().width === w0, alt: getComputedStyle(a.querySelector('.swap-alt')).visibility, color: getComputedStyle(a.querySelector('.swap-alt')).color, clip: window.__copied.slice() }; await new Promise((r) => setTimeout(r, 1250)); const s2 = { copied: a.hasAttribute('data-copied'), live: live.textContent }; await new Promise((r) => setTimeout(r, 1900)); return { s1, s2, s3: live.textContent }; }`. Expected `s1: { copied: true, live: "Email address copied.", sameWidth: true, alt: "visible", color: "rgb(91, 129, 255)", clip: ["info@parsanaji.com"] }`, `s2: { copied: false, live: "Email address copied." }`, `s3: ""`. Screenshot during the copied state is optional (`1440x900-dark-copied.png`).
5. Refused clipboard (8.2.7, 8.2.11). `navigate_page` to `http://localhost:5173/?noentry` with `initScript` `Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) } });`. Run `async () => { document.querySelector('a[data-email]').click(); await new Promise((r) => setTimeout(r, 500)); return { copied: document.querySelector('a[data-email]').hasAttribute('data-copied') }; }` → `{ copied: false }`; then `list_console_messages` with `types: ["info"]` shows `Launched external handler for 'mailto:info@parsanaji.com'.` (Chrome's record of the `location.assign('mailto:…')` navigation; the page itself stays put).
6. Stored look opposite the OS look paints first (8.2.5). Run `() => { localStorage.setItem('pn.theme', 'light'); return true; }`; then `navigate_page` `type: "reload"` with `initScript` `requestAnimationFrame(() => { const h = document.documentElement; window.__firstFrame = { theme: h.getAttribute('data-theme'), htmlBg: getComputedStyle(h).backgroundColor }; });` (the first animation frame runs before the first paint, after the head's classic script and stylesheet). Run `() => window.__firstFrame` → `{ theme: "light", htmlBg: "rgb(242, 246, 254)" }` while the emulated OS is dark. Run `() => { localStorage.removeItem('pn.theme'); return true; }` to reset.
7. Tab order (3.5.11). Run `() => { document.activeElement?.blur(); window.__tabs = []; document.addEventListener('focusin', (e) => window.__tabs.push(e.target.getAttribute('data-link') || (e.target.hasAttribute('data-email') ? 'say hi' : e.target.hasAttribute('data-theme-toggle') ? 'toggle' : e.target.tagName))); return true; }`; `press_key` `Tab` three times; run `() => { const b = document.querySelector('[data-theme-toggle]'); return { tabs: window.__tabs, focusVisible: b.matches(':focus-visible'), underline: getComputedStyle(b.querySelector('.theme-word')).textDecorationLine, bracket: getComputedStyle(b.querySelector('.theme-word'), '::before').opacity }; }` → `{ tabs: ["github", "say hi", "toggle"], focusVisible: true, underline: "underline", bracket: "1" }`.
8. Clock at a minute boundary (3.5.13). Run `() => { const t = document.querySelector('time[data-clock-time]'); window.__clockLog = []; new MutationObserver(() => window.__clockLog.push({ text: t.textContent, datetime: t.getAttribute('datetime'), msIntoMinute: Date.now() % 60000 })).observe(t, { childList: true, characterData: true, subtree: true, attributes: true }); return { text: t.textContent, msToBoundary: 60000 - (Date.now() % 60000) }; }`; do steps 9 and 10 meanwhile, and once `msToBoundary` has passed run `() => window.__clockLog`. Expected: one entry whose `text` is the next minute and whose `msIntoMinute` lies between 25 and 100 (the write is scheduled 25 ms after the boundary, plus timer latency; it never fires before the boundary; measured 39 ms).
9. CSS failsafe without `main.ts` taking control (8.2.7). Run `async () => { const h = document.documentElement; h.setAttribute('data-entry', 'run'); const op = () => [...document.querySelectorAll('[data-reveal]')].map((e) => getComputedStyle(e).opacity); await new Promise((r) => setTimeout(r, 100)); const a = op(); await new Promise((r) => setTimeout(r, 3800)); const b = op(); await new Promise((r) => setTimeout(r, 250)); const c = op(); h.removeAttribute('data-entry'); return { at100: a, at3900: b, at4150: c }; }` → nine `"0"` at 100 ms and at 3900 ms, nine `"1"` at 4150 ms.
10. No JavaScript (8.2.7, 3.6.1). Build a copy of `dist/` without its script tags and serve it outside the repo:
    ```bash
    npm run build
    NOJS=$(mktemp -d) && cp -r dist/. "$NOJS/" && sed -i '/<script type="module"/d; /<script src="\/theme-boot.js"><\/script>/d' "$NOJS/index.html" && grep -n "<script" "$NOJS/index.html" && echo "$NOJS"
    ```
    The grep prints only the JSON-LD line (`<script type="application/ld+json">`), and the last line is the copy's path, for example `/tmp/tmp.AbC123`. Shell variables do not survive between Bash calls, so start the preview with that literal path, with `run_in_background`: `npx vite preview --outDir /tmp/tmp.AbC123 --port 4173 --strictPort`. `navigate_page` to `http://localhost:4173/` with `initScript` `requestAnimationFrame(() => { window.__firstFrame = { entry: document.documentElement.getAttribute('data-entry'), reveal: [...document.querySelectorAll('[data-reveal]')].map((e) => getComputedStyle(e).opacity) }; });` and run `() => ({ first: window.__firstFrame, scripts: document.scripts.length, toggle: getComputedStyle(document.querySelector('[data-theme-toggle]')).display, clockShown: !document.querySelector('[data-clock]').hidden, place: document.querySelector('.place').innerText, field: getComputedStyle(document.querySelector('.field')).opacity, mailto: document.querySelector('a[data-email]').href, describedby: document.querySelector('a[data-email]').getAttribute('aria-describedby') })`. Expected: `first: { entry: null, reveal: nine "1" }` (the full rail in the first paint), `scripts: 1`, `toggle: "none"`, `clockShown: false`, `place: "IRVINE, CA"`, `field: "0"`, `mailto: "mailto:info@parsanaji.com"`, `describedby: null`. Take `1440x900-dark-nojs.png`. Stop the preview server (`Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }` in PowerShell) and delete the copy by its literal path (`rm -rf /tmp/tmp.AbC123`).

- [ ] **Step 10: Console check and screenshots on the dev server (spec 8.2.1, 8.3.2, 8.3.3)**

Console, six fresh contexts: for each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` and each look `dark`, `light`: `new_page` `url: "about:blank"`, `isolatedContext: "t8-console-<w>-<look>"`; `emulate` the viewport and `colorScheme`; `navigate_page` to `http://localhost:5173/`; run `async () => { await new Promise((r) => setTimeout(r, 4000)); return [...document.fonts].map((f) => `${f.weight} ${f.status}`); }` (→ `["400 loaded", "700 loaded"]`); `list_console_messages` with `types: ["error", "warn"]` → `<no console messages found>`; `close_page`.

Screenshots: in the `t8` page, at `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, `1366x768x1` and `768x1024x2,mobile,touch`, in `dark` and `light` (`emulate`, then reload `http://localhost:5173/`), `take_screenshot` to `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-8\<w>x<h>-<look>.png` (ten files). Each shows the rail, the `light` / `dark` word chip top-right on the name's line, and `IRVINE, CA · h:mm AM|PM PDT` in the footer. `close_page` the `t8` page, stop the dev server and its node child (`Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Confirm:$false }`). Write every result into `task-8-report.md`.

- [ ] **Step 11: Commit**

```bash
git add src/theme/theme.ts src/theme/themeController.ts tests/theme.test.ts src/main.ts
git commit -m "feat(theme): theme toggle with persistence and the slice-1 boot

theme.ts holds the pure preference logic and the 300 ms ColorTween;
themeController.ts drives the word toggle, data-theme, the theme-color metas and
the field colours read from CSS. main.ts wires links, email copy, clock and theme,
releases the pre-hidden rail and applies the static fallback (no field yet).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 12: Push the slice and watch the deploy (spec 7.2.1; closes slice 1)**

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
git push -u origin resume-screen
git rev-parse HEAD
gh run list --branch resume-screen --limit 1 --json databaseId,headSha,status
```

Expected: the push prints `* [new branch]      resume-screen -> resume-screen` and `branch 'resume-screen' set up to track 'origin/resume-screen'.` Re-run the `gh run list` command until its `headSha` equals `git rev-parse HEAD` (the run appears a few seconds after the push), then:

```bash
gh run watch <databaseId> --exit-status
```

Expected: the `deploy` job's steps all pass (`npm ci`, `npm test` with `Test Files  16 passed (16)` and `Tests  134 passed (134)` in the log, `npm run build`, `Deploy to Cloudflare Pages`), and the command exits 0. A red run stops the task: read `gh run view <databaseId> --log-failed`, fix in a new commit, push again.

- [ ] **Step 13: Preview checks (spec 7.3.1, 8.2.1, 8.3)**

```bash
curl -sI https://resume-screen.parsanaji-com.pages.dev/ | grep -i '^content-security-policy'
for p in / /theme-boot.js /og.png /favicon.svg /favicon-32.png /favicon-192.png /apple-touch-icon.png /fonts/JetBrainsMono-Regular.subset.woff2 /fonts/JetBrainsMono-Bold.subset.woff2 /robots.txt; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://resume-screen.parsanaji-com.pages.dev$p")" "$p"; done
```

Expected: the CSP line from the unchanged `public/_headers`, `content-security-policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`; every path prints `200`. (`og:image` points at production `https://parsanaji.com/og.png`, which stays the teaser image until the merge; the preview's own `/og.png` is the new one.)

In the browser: six fresh contexts as in Step 10 against `https://resume-screen.parsanaji-com.pages.dev/` (`isolatedContext: "t8-preview-<w>-<look>"`), each with `list_console_messages` `types: ["error", "warn", "issue"]` → `<no console messages found>`, so no CSP violation (`Refused to …`) and no 404 for any icon or font. In the 1440×900 dark one also run the Step 9 item 1 script (expect the same values) and click the toggle once (expect `data-theme="light"` and both metas `#f2f6fe`). Screenshots at `1440x900x1`, `1280x720x1` and `390x844x3,mobile,touch` in both looks to `evidence/task-8/<w>x<h>-<look>-preview.png`. Close every page opened. Record the run id, the curl output and the preview results in `task-8-report.md`; the controller then appends the slice-1 ledger line and checkpoints.

### Task 9: Field parameters, sizing and flow

- **Files:** Create `src/field/params.ts`, `src/field/sizing.ts`, `src/field/flow.ts`, `tests/params.test.ts`, `tests/sizing.test.ts`, `tests/flow.test.ts`; Delete `src/engine/motion.ts`, `tests/motion.test.ts` (`breathScale` and its two cases move verbatim).
- **Interfaces:**
  - Consumes: Task 1 `capDpr(devicePixelRatio: number, max?: number): number`; Task 6 `src/styles.css` (the sizing test reads it).
  - Produces:
    ```ts
    // src/field/params.ts
    export type Density = 'sparse' | 'medium' | 'dense';
    export type Intensity = 'subtle' | 'medium' | 'lively';
    export interface FieldParams {
      density: Density;
      intensity: Intensity;
      flowSpeed: number;
      cell: { k: number; minCss: number; maxCss: number; densityK: Record<Density, number>; degradeK: number };
      shape: { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number };
      tiers: { t2: number; t3: number };
      breath: { amp: number; periodMs: number };
      staticTimeS: number;
      pointer: { radiusK: number; radiusSp: number; warpK: number; boost: number; lerp: number; riseMs: number; fallMs: number; velNorm: number; velRadiusGain: number };
      ripple: { max: number; lifeS: number; amp: number; speedSp: number; sigmaSp: number; gain: number };
      mask: { holdDim: number; ink: number; edge: number; meltPx: number; heightFrac: number; widthFrac: number; supersample: number; fontWeight: number };
      entry: { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number; revealAtMs: number; cleanupAtMs: number; skipMs: number };
      konami: { gatherMs: number; holdMs: number; dissolveMs: number };
      boot: { readyTimeoutMs: number; fontTimeoutMs: number; restoreTimeoutMs: number; resizeDebounceMs: number };
      probe: { frames: number; thresholdFps: number };
      theme: { crossfadeMs: number };
      scramble: { durMs: number; stepMs: number };
      copy: { holdMs: number };
    }
    export const DEFAULT_FIELD: FieldParams; // exactly spec 4.9
    export function cloneField(p: FieldParams): FieldParams; // structuredClone

    // src/field/sizing.ts
    export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';
    export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number } // P6
    export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number;
    export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid;
    export function latticeSpacing(fieldCssW: number): number; // clamp(w / 48, 8, 40)
    export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number; // min(w,h)*0.28 + 2*sp (before the speed widening)

    // src/field/flow.ts
    export const INTENSITY_K: Readonly<Record<Intensity, number>>; // { subtle: 0.55, medium: 1, lively: 1.7 }
    export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number; // INTENSITY_K[intensity] * flowSpeed
    export function breathScale(tMs: number, amp: number, periodMs: number): number; // moved verbatim from engine/motion.ts
    ```
  - Semantics: `cellCssFor` = `clamp(p.k × w, p.minCss, p.maxCss) × p.densityK[density] × (degrade ?? 1)`; `computeGrid` applies 3.3.2.2–3.3.2.4 (non-finite or ≤ 0 DPR → 1; `dpr = capDpr`; `cellDev = max(2, round(cellCss × dpr))`, +1 when odd and the raw DPR exceeds the cap; `deviceBox` used only when given, `dprRaw ≤ 2` and within 1 device px of `css × dpr` on both axes (Index amendment A2), else `round(css × dpr)`; `cols = ceil(widthDev / cellDev)`, `rows = ceil(heightDev / cellDev)`).

- [ ] **Step 1: Write the failing tests**

`tests/params.test.ts` (the one test that pins `DEFAULT_FIELD` to spec 4.9; Task 24 edits it when tuning is approved, 4.12.4):
```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';

describe('DEFAULT_FIELD', () => {
  it('deep-equals spec 4.9', () => {
    expect(DEFAULT_FIELD).toEqual({
      density: 'medium',
      intensity: 'medium',
      flowSpeed: 1,
      cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
      shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
      tiers: { t2: 0.66, t3: 0.9 },
      breath: { amp: 0.01, periodMs: 6000 },
      staticTimeS: 12,
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
    });
  });

  it('keeps the shader limits of 4.9.1', () => {
    expect(DEFAULT_FIELD.ripple.max).toBeLessThanOrEqual(8);
    expect(DEFAULT_FIELD.tiers.t2).toBeLessThan(DEFAULT_FIELD.tiers.t3);
  });
});

describe('cloneField', () => {
  it('returns a deep copy that never aliases the defaults', () => {
    const before = JSON.stringify(DEFAULT_FIELD);
    const c = cloneField(DEFAULT_FIELD);
    expect(c).toEqual(DEFAULT_FIELD);
    expect(c).not.toBe(DEFAULT_FIELD);
    expect(c.cell).not.toBe(DEFAULT_FIELD.cell);
    expect(c.cell.densityK).not.toBe(DEFAULT_FIELD.cell.densityK);
    c.cell.densityK.medium = 99;
    c.pointer.radiusK = 99;
    c.density = c.density === 'dense' ? 'sparse' : 'dense';
    expect(JSON.stringify(DEFAULT_FIELD)).toBe(before);
  });
});
```

`tests/sizing.test.ts` (spec 4.9 literals passed explicitly, Index amendment A4; the table rows are spec 3.3.2.5 and Appendix A §4.2, computed by running this code):
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { BAND_QUERY, cellCssFor, computeGrid, latticeSpacing, pointerRadius } from '../src/field/sizing';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const cell: FieldParams['cell'] = { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 };
const pointer: FieldParams['pointer'] = { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

describe('cellCssFor (spec 3.3.2.1)', () => {
  // [field width, sparse, medium, dense]
  const table: [number, number, number, number][] = [
    [390, 2.7, 2, 1.5],
    [768, 3.31776, 2.4576, 1.8432],
    [1280, 5.5296, 4.096, 3.072],
    [1366, 5.90112, 4.3712, 3.2784],
    [1440, 6.2208, 4.608, 3.456],
    [1920, 6.75, 5, 3.75],
    [2560, 6.75, 5, 3.75],
  ];
  it.each(table)('at %i px wide gives sparse %f, medium %f, dense %f', (w, sparse, medium, dense) => {
    expect(cellCssFor(w, cell, 'sparse')).toBeCloseTo(sparse, 9);
    expect(cellCssFor(w, cell, 'medium')).toBeCloseTo(medium, 9);
    expect(cellCssFor(w, cell, 'dense')).toBeCloseTo(dense, 9);
  });

  it('multiplies by the degrade factor after the FPS probe (3.7.9)', () => {
    expect(cellCssFor(1440, cell, 'medium', cell.degradeK)).toBeCloseTo(6.912, 9);
  });
});

describe('computeGrid (spec 3.3.2.2-3.3.2.5, Appendix A §4.2)', () => {
  // [cssW, cssH, dprRaw, dpr, cellDev, cellCss, cols, rows, maskW, maskH]
  const rows: [number, number, number, number, number, number, number, number, number, number][] = [
    [1440, 900, 1, 1, 5, 5, 288, 180, 576, 360],
    [1440, 900, 2, 2, 9, 4.5, 320, 200, 640, 400],
    [1280, 720, 1, 1, 4, 4, 320, 180, 640, 360],
    [1366, 768, 1, 1, 4, 4, 342, 192, 684, 384],
    [1920, 1080, 1, 1, 5, 5, 384, 216, 768, 432],
    [2560, 1440, 1, 1, 5, 5, 512, 288, 1024, 576],
    [390, 236.32, 3, 2, 4, 2, 195, 119, 390, 238],
  ];
  it.each(rows)('%i x %f at DPR %f', (w, h, dprRaw, dpr, cellDev, cellCss, cols, rows, maskW, maskH) => {
    const g = computeGrid(w, h, dprRaw, cellCssFor(w, cell, 'medium'));
    expect(g.dpr).toBe(dpr);
    expect(g.cellDev).toBe(cellDev);
    expect(g.cellCss).toBeCloseTo(cellCss, 9);
    expect([g.cols, g.rows, g.maskW, g.maskH]).toEqual([cols, rows, maskW, maskH]);
    expect(Number.isInteger(g.cellDev)).toBe(true);
  });

  it('makes cellDev even when the raw DPR exceeds the cap (4.5.9)', () => {
    const g = computeGrid(1440, 900, 3, cellCssFor(1440, cell, 'medium')); // round(4.608 x 2) = 9, odd
    expect(g.cellDev).toBe(10);
    expect(g.cellCss).toBe(5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([2880, 1800, 288, 180]);
  });

  it('prefers devicePixelContentBoxSize at a raw DPR of 2 or less (3.7.1)', () => {
    const w = cellCssFor(1366, cell, 'medium');
    expect(computeGrid(1366, 768, 1.25, w, { w: 1707, h: 960 }).widthDev).toBe(1707);
    expect(computeGrid(1366, 768, 1.25, w, null).widthDev).toBe(1708); // round(1707.5)
    expect(computeGrid(1366, 768, 1.25, w).cellDev).toBe(5);
  });

  it('ignores a device box that disagrees with css x dpr by more than 1 px (DevTools DPR emulation)', () => {
    const g = computeGrid(1440, 900, 1.25, cellCssFor(1440, cell, 'medium'), { w: 1440, h: 900 });
    expect([g.widthDev, g.heightDev, g.cellDev, g.cols, g.rows]).toEqual([1800, 1125, 6, 300, 188]);
  });

  it('ignores the device box above a raw DPR of 2 (the backing store is capped at 2x)', () => {
    const g = computeGrid(390, 236.32, 3, 2, { w: 1170, h: 709 });
    expect([g.widthDev, g.heightDev, g.cols, g.rows]).toEqual([780, 473, 195, 119]);
  });

  it('treats a non-finite or non-positive DPR as 1 (3.3.2.4)', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -2]) {
      const g = computeGrid(1440, 900, bad, cellCssFor(1440, cell, 'medium'));
      expect([g.dpr, g.cellDev, g.cols, g.rows]).toEqual([1, 5, 288, 180]);
    }
  });

  it('never produces a zero-sized target for a zero-sized canvas', () => {
    const g = computeGrid(0, 0, 1, 5);
    expect([g.widthDev, g.heightDev, g.cols, g.rows, g.maskW, g.maskH]).toEqual([1, 1, 1, 1, 2, 2]);
  });
});

describe('latticeSpacing (spec 3.3.3)', () => {
  it('clamps w / 48 to [8, 40]', () => {
    expect(latticeSpacing(300)).toBe(8);
    expect(latticeSpacing(390)).toBeCloseTo(8.125, 9);
    expect(latticeSpacing(1280)).toBeCloseTo(26.667, 3);
    expect(latticeSpacing(1440)).toBe(30);
    expect(latticeSpacing(2000)).toBe(40);
  });
});

describe('pointerRadius (spec 3.3.7.1, at rest)', () => {
  it('is 312 px at 1440 x 900 and 82.42 px for the 390 x 236.32 band', () => {
    expect(pointerRadius(1440, 900, pointer)).toBeCloseTo(312, 9);
    expect(pointerRadius(390, 236.32, pointer)).toBeCloseTo(82.42, 2);
  });
});

describe('BAND_QUERY (spec 3.1.1)', () => {
  it('is the ruled band media query and appears verbatim in src/styles.css', () => {
    expect(BAND_QUERY).toBe('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)');
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    expect(css).toContain(BAND_QUERY);
  });
});
```

`tests/flow.test.ts` (the two `breathScale` cases are `tests/motion.test.ts`'s, verbatim, with the new import path):
```ts
import { describe, expect, it } from 'vitest';
import { INTENSITY_K, breathScale, effectiveIntensity } from '../src/field/flow';

describe('breathScale', () => {
  it('oscillates ±amp around 1 with the given period', () => {
    expect(breathScale(0, 0.01, 6000)).toBeCloseTo(1, 9);
    expect(breathScale(1500, 0.01, 6000)).toBeCloseTo(1.01, 9);
    expect(breathScale(3000, 0.01, 6000)).toBeCloseTo(1, 9);
    expect(breathScale(4500, 0.01, 6000)).toBeCloseTo(0.99, 9);
  });

  it('is exactly 1 when disabled', () => {
    expect(breathScale(1234, 0, 6000)).toBe(1);
    expect(breathScale(1234, 0.01, 0)).toBe(1);
  });
});

describe('INTENSITY_K (spec 3.3.6.1)', () => {
  it('maps subtle, medium and lively to 0.55, 1 and 1.7', () => {
    expect(INTENSITY_K).toEqual({ subtle: 0.55, medium: 1, lively: 1.7 });
    expect(Object.isFrozen(INTENSITY_K)).toBe(true);
  });
});

describe('effectiveIntensity (spec 3.3.6.1)', () => {
  it('multiplies the intensity factor by the flow speed', () => {
    expect(effectiveIntensity({ intensity: 'medium', flowSpeed: 1 })).toBe(1);
    expect(effectiveIntensity({ intensity: 'lively', flowSpeed: 2 })).toBeCloseTo(3.4, 9);
    expect(effectiveIntensity({ intensity: 'subtle', flowSpeed: 0 })).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/params.test.ts tests/sizing.test.ts tests/flow.test.ts`
Expected: FAIL, 3 files, no tests run:
```
 FAIL  tests/flow.test.ts [ tests/flow.test.ts ]
Error: Cannot find module '../src/field/flow' imported from …/tests/flow.test.ts
 FAIL  tests/params.test.ts [ tests/params.test.ts ]
Error: Cannot find module '../src/field/params' imported from …/tests/params.test.ts
 FAIL  tests/sizing.test.ts [ tests/sizing.test.ts ]
Error: Cannot find module '../src/field/params' imported from …/tests/sizing.test.ts
 Test Files  3 failed (3)
      Tests  no tests
```

- [ ] **Step 3: Write `src/field/params.ts` (spec 4.9, exactly)**

```ts
export type Density = 'sparse' | 'medium' | 'dense';
export type Intensity = 'subtle' | 'medium' | 'lively';

/** Every tunable of the field, the entry and the eggs (spec 4.9). The debug panel mutates one clone in place. */
export interface FieldParams {
  density: Density;
  intensity: Intensity;
  flowSpeed: number;
  cell: { k: number; minCss: number; maxCss: number; densityK: Record<Density, number>; degradeK: number };
  shape: { warpScalePx: number; mainScalePx: number; warpAmp: number; level: number; gain: number };
  tiers: { t2: number; t3: number };
  breath: { amp: number; periodMs: number };
  staticTimeS: number;
  pointer: { radiusK: number; radiusSp: number; warpK: number; boost: number; lerp: number; riseMs: number; fallMs: number; velNorm: number; velRadiusGain: number };
  ripple: { max: number; lifeS: number; amp: number; speedSp: number; sigmaSp: number; gain: number };
  mask: { holdDim: number; ink: number; edge: number; meltPx: number; heightFrac: number; widthFrac: number; supersample: number; fontWeight: number };
  entry: { gatherMs: number; holdMs: number; dissolveMs: number; scrimAtMs: number; revealAtMs: number; cleanupAtMs: number; skipMs: number };
  konami: { gatherMs: number; holdMs: number; dissolveMs: number };
  boot: { readyTimeoutMs: number; fontTimeoutMs: number; restoreTimeoutMs: number; resizeDebounceMs: number };
  probe: { frames: number; thresholdFps: number };
  theme: { crossfadeMs: number };
  scramble: { durMs: number; stepMs: number };
  copy: { holdMs: number };
}

/** Spec 4.9, exact values. Never mutate it: callers work on `cloneField(DEFAULT_FIELD)`. */
export const DEFAULT_FIELD: FieldParams = {
  density: 'medium', // R4
  intensity: 'medium', // R4
  flowSpeed: 1, // multiplies INTENSITY_K (3.3.6)
  cell: { k: 0.0032, minCss: 2, maxCss: 5, densityK: { sparse: 1.35, medium: 1, dense: 0.75 }, degradeK: 1.5 },
  shape: { warpScalePx: 240, mainScalePx: 160, warpAmp: 2.6, level: 0.3, gain: 2.1 },
  tiers: { t2: 0.66, t3: 0.9 },
  breath: { amp: 0.01, periodMs: 6000 },
  staticTimeS: 12, // reduced-motion still = the OG still
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

/** A deep copy (structuredClone), so the panel and the app never write into DEFAULT_FIELD. */
export function cloneField(p: FieldParams): FieldParams {
  return structuredClone(p);
}
```

- [ ] **Step 4: Write `src/field/sizing.ts` (spec 3.1.1, 3.3.2, 3.3.3, 3.3.7.1, 3.7.1; Index amendment A2)**

```ts
import { capDpr } from '../core/quality';
import type { Density, FieldParams } from './params';

/** Spec 3.1.1: the band layout's media query, used verbatim in src/styles.css. */
export const BAND_QUERY = '(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)';

/** One frame's render-target sizing (spec 3.3.2, Appendix A §4.1). `cellCss` is the snapped `cellDev / dpr` (P6). */
export interface Grid { dpr: number; widthDev: number; heightDev: number; cellDev: number; cellCss: number; cols: number; rows: number; maskW: number; maskH: number }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Spec 3.3.2.1: clamp(k × w, min, max) × densityK × degrade (degrade 1, or 1.5 after the FPS probe). */
export function cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade = 1): number {
  return clamp(p.k * fieldCssW, p.minCss, p.maxCss) * p.densityK[density] * degrade;
}

/** Spec 3.3.2.2–3.3.2.4 and 3.7.1: whole-device-pixel cells, DPR capped at 2, the exact device box when it is trustworthy. */
export function computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid {
  const raw = Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1;
  const dpr = capDpr(raw);
  let cellDev = Math.max(2, Math.round(cellCss * dpr));
  if (raw > dpr && cellDev % 2 === 1) cellDev += 1; // 4.5.9: the compositor's 1.5x lands on whole device px
  // the device box is trusted only when it agrees with css x dpr to within the 1 px of edge snapping: DevTools
  // device-scale emulation reports the physical box, which would stretch every cell (8.2.10)
  const exact =
    deviceBox && raw <= 2 && Math.abs(deviceBox.w - cssW * dpr) <= 1 && Math.abs(deviceBox.h - cssH * dpr) <= 1 ? deviceBox : null;
  // a 0 x 0 box (canvas hidden mid-resize) still gives a 1 x 1 target: texStorage2D rejects zero sizes
  const widthDev = Math.max(1, exact ? Math.round(exact.w) : Math.round(cssW * dpr));
  const heightDev = Math.max(1, exact ? Math.round(exact.h) : Math.round(cssH * dpr));
  const cols = Math.ceil(widthDev / cellDev);
  const rows = Math.ceil(heightDev / cellDev);
  return { dpr, widthDev, heightDev, cellDev, cellCss: cellDev / dpr, cols, rows, maskW: 2 * cols, maskH: 2 * rows };
}

/** Spec 3.3.3: the Blueprint lattice unit sp, the unit of the pointer radius and the rings. */
export function latticeSpacing(fieldCssW: number): number {
  return clamp(fieldCssW / 48, 8, 40);
}

/** Spec 3.3.7.1 at rest: min(w, h) × radiusK + radiusSp × sp. App widens it by (1 + velRadiusGain × velFactor). */
export function pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number {
  return Math.min(fieldCssW, fieldCssH) * p.radiusK + p.radiusSp * latticeSpacing(fieldCssW);
}
```

- [ ] **Step 5: Write `src/field/flow.ts` and retire `src/engine/motion.ts` (spec 2.2.2, 3.3.6.1, 3.3.9)**

`breathScale` and its doc comment move verbatim from `src/engine/motion.ts`:
```ts
import type { FieldParams, Intensity } from './params';

/** Spec 3.3.6.1: flow-speed multiplier per intensity. */
export const INTENSITY_K: Readonly<Record<Intensity, number>> = Object.freeze({ subtle: 0.55, medium: 1, lively: 1.7 });

/** Spec 3.3.6.1: I_eff = INTENSITY_K[intensity] × flowSpeed; flow time τ advances by dt × I_eff. */
export function effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number {
  return INTENSITY_K[p.intensity] * p.flowSpeed;
}

/** Spec 3.5: the whole field scales by 1 ± amp on a sine with the given period. */
export function breathScale(tMs: number, amp: number, periodMs: number): number {
  if (amp === 0 || periodMs <= 0) return 1;
  return 1 + amp * Math.sin((2 * Math.PI * tMs) / periodMs);
}
```
Then delete the old module and its test (its two `breathScale` cases now live in `tests/flow.test.ts`; the four `RippleScheduler` cases retire with the scheduler, spec 2.2.6):
```bash
git rm -q src/engine/motion.ts tests/motion.test.ts
grep -rnE "from '[./]+(src/)?engine/motion" src tests || echo "no importers left"
```
Expected: `no importers left`.

- [ ] **Step 6: Run the new tests to verify they pass**

Run: `npx vitest run tests/params.test.ts tests/sizing.test.ts tests/flow.test.ts`
Expected:
```
 Test Files  3 passed (3)
      Tests  31 passed (31)
```
(params 3, sizing 24, flow 4.)

- [ ] **Step 7: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  18 passed (18)` and `Tests  159 passed (159)` (Task 8's 16 files and 134 tests, minus `tests/motion.test.ts` and its 6 tests, plus these 3 files and 31 tests); typecheck prints no diagnostics; the build prints `✓ built in …` with the same `dist/assets/index-*.js` size as Task 8 (nothing imports the new modules yet). Record the counts in the task report.

- [ ] **Step 8: Commit**

```bash
git add src/field/params.ts src/field/sizing.ts src/field/flow.ts tests/params.test.ts tests/sizing.test.ts tests/flow.test.ts
git status --short
git commit -m "feat(field): field parameters, grid sizing and flow

DEFAULT_FIELD is spec 4.9; computeGrid snaps cells to whole device
pixels, caps DPR at 2 and trusts devicePixelContentBoxSize only when
it agrees with css x dpr. breathScale moves from engine/motion.ts,
which retires with the ripple scheduler.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
`git status --short` before the commit lists the six added files and `D  src/engine/motion.ts`, `D  tests/motion.test.ts` (already staged by `git rm`), nothing else.

---

### Task 10: Pointer model and Shockwave pool

- **Files:** Create `src/field/pointer.ts`, `src/field/ripples.ts`, `tests/pointer.test.ts`, `tests/ripples.test.ts`.
- **Interfaces:**
  - Consumes: Task 9 `FieldParams['pointer']`, `FieldParams['ripple']`; Task 1 `easeOutCubic: (t: number) => number`, `clamp01: (t: number) => number`.
  - Produces:
    ```ts
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
    ```
  - Semantics: `move` and `down` set the strength target to 1, `release` to 0; strength moves linearly toward the target at `dt / riseMs` and `dt / fallMs` and is output through `easeOutCubic`; the ease is `p += (raw − p) × (1 − (1 − lerp)^(dt / 16.667))`. `write` packs `(x, y, speedSp × sp × age, amp × (1 − age / lifeS))` per slot into an `out` of length 32 and expires rings at `age ≥ lifeS`.

- [ ] **Step 1: Write the failing tests**

`tests/pointer.test.ts` (spec 4.9 literals, Index amendment A4; 695.986 px after 100 ms and 999.993 px after 1 s are `1000 × (1 − 0.82^(t / 16.667))`, measured identical at 30, 60 and 120 fps by running this code; 2999.19 px/s and velFactor 0.49987 are the 100 ms-averaged speeds after 1 s at 3000 and 750 px/s):
```ts
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { PointerModel } from '../src/field/pointer';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const P: FieldParams['pointer'] = { radiusK: 0.28, radiusSp: 2, warpK: 0.55, boost: 0.12, lerp: 0.18, riseMs: 200, fallMs: 600, velNorm: 1500, velRadiusGain: 0.1 };

/** Eased x after `ms` of frames at `fps`, the raw point jumping from 0 to 1000 px at t = 0. */
function easedAfter(fps: number, ms: number): number {
  const m = new PointerModel(P);
  m.down(0, 0, 'touch'); // eased point snapped to 0
  m.tick(1000 / fps); // strength above 0, so the next move eases instead of snapping
  m.move(1000, 0, 'mouse');
  const frames = Math.round((ms * fps) / 1000);
  for (let i = 0; i < frames; i++) m.tick(1000 / fps);
  return m.x;
}

describe('PointerModel ease (spec 3.3.7.3)', () => {
  it('is frame-rate independent at 30, 60 and 120 fps', () => {
    for (const fps of [30, 60, 120]) {
      expect(easedAfter(fps, 100)).toBeCloseTo(695.986, 2); // 1000 x (1 - 0.82^(100 / 16.667))
      const at1s = easedAfter(fps, 1000);
      expect(Math.abs(at1s - easedAfter(60, 1000)) / easedAfter(60, 1000)).toBeLessThan(0.01);
      expect(at1s).toBeCloseTo(999.993, 2);
    }
  });

  it('jumps to the first point instead of sweeping in from a stale position', () => {
    const m = new PointerModel(P);
    m.move(700, 400, 'mouse');
    expect([m.x, m.y]).toEqual([700, 400]);
  });

  it('ignores a non-positive or non-finite dt', () => {
    const m = new PointerModel(P);
    m.down(0, 0, 'touch');
    m.tick(16.667);
    m.move(100, 0, 'mouse');
    const before = [m.x, m.strength];
    for (const dt of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) m.tick(dt);
    expect([m.x, m.strength]).toEqual(before);
  });
});

describe('PointerModel strength (spec 3.3.7.4)', () => {
  it('rises over 200 ms and falls over 600 ms through easeOutCubic', () => {
    const m = new PointerModel(P);
    m.move(10, 10, 'mouse');
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBeCloseTo(0.875, 9); // easeOutCubic(0.5)
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBe(1);
    m.release();
    for (let i = 0; i < 15; i++) m.tick(20);
    expect(m.strength).toBeCloseTo(0.875, 9);
    for (let i = 0; i < 15; i++) m.tick(20);
    expect(m.strength).toBe(0);
  });

  it('reads riseMs and fallMs live from the params object', () => {
    const p = { ...P };
    const m = new PointerModel(p);
    m.move(0, 0, 'mouse');
    p.riseMs = 100;
    for (let i = 0; i < 5; i++) m.tick(20);
    expect(m.strength).toBe(1);
  });
});

describe('PointerModel press (spec 3.3.7.6)', () => {
  it('snaps the eased point on a touch pointerdown, not on a mouse one', () => {
    const m = new PointerModel(P);
    m.move(100, 100, 'mouse');
    for (let i = 0; i < 10; i++) m.tick(16.667);
    m.down(500, 300, 'mouse');
    expect(m.x).toBeCloseTo(100, 6);
    m.down(500, 300, 'touch');
    expect([m.x, m.y]).toEqual([500, 300]);
  });
});

describe('PointerModel speed (spec 3.3.7.5)', () => {
  /** velFactor after 1 s of the raw point moving right at `pxPerS`, 60 fps. */
  function velAfter(pxPerS: number): { speed: number; vel: number } {
    const m = new PointerModel(P);
    m.move(0, 0, 'mouse');
    let x = 0;
    for (let i = 0; i < 60; i++) {
      x += pxPerS / 60;
      m.move(x, 0, 'mouse');
      m.tick(1000 / 60);
    }
    return { speed: m.speed, vel: m.velFactor };
  }

  it('tracks the eased point speed and saturates velFactor at 1500 px/s', () => {
    expect(velAfter(3000).speed).toBeCloseTo(2999.19, 1);
    expect(velAfter(3000).vel).toBe(1);
    expect(velAfter(750).vel).toBeCloseTo(0.49987, 4);
  });
});

describe('PointerModel settled (spec 3.6.4 idle check)', () => {
  it('is true only when the strength is at its target and the eased point is within 0.25 px of the raw point', () => {
    const m = new PointerModel(P);
    m.move(200, 200, 'mouse');
    expect(m.settled).toBe(false); // strength still rising
    for (let i = 0; i < 60; i++) m.tick(16.667);
    expect(m.settled).toBe(true);
    m.move(900, 600, 'mouse');
    expect(m.settled).toBe(false); // raw point far from the eased one
    m.release();
    for (let i = 0; i < 60; i++) m.tick(16.667);
    expect(m.strength).toBe(0);
    expect(m.settled).toBe(true);
  });
});
```

`tests/ripples.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { RipplePool } from '../src/field/ripples';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const R: FieldParams['ripple'] = { max: 8, lifeS: 3.2, amp: 1.2, speedSp: 9, sigmaSp: 1.6, gain: 0.9 };
const slots = (out: Float32Array, k: number): number[] => Array.from(out.subarray(k * 4, k * 4 + 4));

describe('RipplePool (spec 3.3.8)', () => {
  it('counts spawned rings', () => {
    const pool = new RipplePool(R);
    expect(pool.count).toBe(0);
    pool.spawn(10, 20, 0);
    pool.spawn(30, 40, 0.5);
    expect(pool.count).toBe(2);
  });

  it('drops the oldest ring when a 9th arrives (3.3.8.3)', () => {
    const pool = new RipplePool(R);
    for (let i = 0; i < 9; i++) pool.spawn(i, 0, i * 0.01);
    expect(pool.count).toBe(8);
    const out = new Float32Array(32);
    pool.write(0.1, 30, out);
    expect(out[0]).toBe(1); // ring 0 is gone, ring 1 now fills slot 0
    expect(out[28]).toBe(8);
  });

  it('packs (x, y, 9 sp age, 1.2 (1 - age / 3.2)) and zeroes unused slots (3.3.8.1)', () => {
    const pool = new RipplePool(R);
    pool.spawn(100, 50, 1);
    const out = new Float32Array(32).fill(7);
    expect(pool.write(2, 30, out)).toBe(1);
    const [x, y, radius, amp] = slots(out, 0);
    expect([x, y]).toEqual([100, 50]);
    expect(radius).toBeCloseTo(270, 4); // 9 x 30 x 1 s
    expect(amp).toBeCloseTo(0.825, 6); // 1.2 x (1 - 1 / 3.2)
    expect(Array.from(out.subarray(4))).toEqual(new Array(28).fill(0));
  });

  it('returns the active count and prunes rings at age 3.2 s', () => {
    const pool = new RipplePool(R);
    const out = new Float32Array(32);
    pool.spawn(0, 0, 0);
    pool.spawn(5, 5, 1);
    pool.spawn(9, 9, 2);
    expect(pool.write(3.19, 30, out)).toBe(3);
    expect(pool.write(3.2, 30, out)).toBe(2); // the t0 = 0 ring expires exactly at 3.2 s
    expect(pool.count).toBe(2);
    expect(slots(out, 0)[0]).toBe(5);
    expect(slots(out, 0)[2]).toBeCloseTo(9 * 30 * 2.2, 3);
    expect(slots(out, 2)).toEqual([0, 0, 0, 0]);
    expect(pool.write(5.2, 30, out)).toBe(0);
    expect(Array.from(out)).toEqual(new Array(32).fill(0));
  });

  it('clear() removes every ring', () => {
    const pool = new RipplePool(R);
    pool.spawn(1, 1, 0);
    pool.clear();
    expect(pool.count).toBe(0);
    expect(pool.write(0.1, 30, new Float32Array(32))).toBe(0);
  });

  it('reads max and lifeS live from the params object', () => {
    const p = { ...R };
    const pool = new RipplePool(p);
    p.max = 2;
    for (let i = 0; i < 5; i++) pool.spawn(i, 0, 0);
    expect(pool.count).toBe(2);
    p.lifeS = 1;
    expect(pool.write(1, 30, new Float32Array(32))).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/pointer.test.ts tests/ripples.test.ts`
Expected:
```
 FAIL  tests/pointer.test.ts [ tests/pointer.test.ts ]
Error: Cannot find module '../src/field/pointer' imported from …/tests/pointer.test.ts
 FAIL  tests/ripples.test.ts [ tests/ripples.test.ts ]
Error: Cannot find module '../src/field/ripples' imported from …/tests/ripples.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

- [ ] **Step 3: Write `src/field/pointer.ts` (spec 3.3.7.3–3.3.7.6, 3.6.4)**

The model holds `p` by reference (the panel edits it live). One rule beyond the index: while the strength is exactly 0 the eased point is invisible, so a move or press jumps it to the raw point instead of sweeping the repel lens in from a stale position (first contact, or a return after a full release).
```ts
import { easeOutCubic } from '../core/easing';
import type { FieldParams } from './params';

export type PointerKind = 'mouse' | 'pen' | 'touch';

const FRAME_MS = 16.667;
const SPEED_TAU_MS = 100; // 3.3.7.5: 100 ms exponential average
const SETTLE_PX = 0.25; // 3.6.4: eased point within 0.25 px of the raw point

/**
 * The eased pointer of spec 3.3.7, in field-space CSS px. `p` is held by reference, so the debug panel's
 * live edits apply on the next tick.
 */
export class PointerModel {
  private readonly p: FieldParams['pointer'];
  private rx = 0;
  private ry = 0;
  private ex = 0;
  private ey = 0;
  private target = 0;
  private lin = 0;
  private spd = 0;

  constructor(p: FieldParams['pointer']) {
    this.p = p;
  }

  /** A move inside the window: raw point and strength target 1 (3.3.7.4). */
  move(x: number, y: number, _kind: PointerKind): void {
    this.place(x, y, false);
  }

  /** A press: like a move, and a touch snaps the eased point to the touch point (3.3.7.6). */
  down(x: number, y: number, kind: PointerKind): void {
    this.place(x, y, kind === 'touch');
  }

  /** pointerup (touch), pointercancel, pointerleave, window blur: strength target 0 (3.3.7.6). */
  release(): void {
    this.target = 0;
  }

  tick(dtMs: number): void {
    if (!(dtMs > 0) || !Number.isFinite(dtMs)) return;
    const k = 1 - (1 - this.p.lerp) ** (dtMs / FRAME_MS); // 3.3.7.3, frame-rate independent
    const nx = this.ex + (this.rx - this.ex) * k;
    const ny = this.ey + (this.ry - this.ey) * k;
    const inst = (Math.hypot(nx - this.ex, ny - this.ey) * 1000) / dtMs;
    this.spd += (inst - this.spd) * (1 - Math.exp(-dtMs / SPEED_TAU_MS));
    this.ex = nx;
    this.ey = ny;
    if (this.lin < this.target) this.lin = Math.min(this.target, this.lin + dtMs / this.p.riseMs);
    else if (this.lin > this.target) this.lin = Math.max(this.target, this.lin - dtMs / this.p.fallMs);
    if (Math.abs(this.target - this.lin) < 1e-9) this.lin = this.target; // no float residue: settled can hold exactly
  }

  get x(): number {
    return this.ex;
  }

  get y(): number {
    return this.ey;
  }

  /** Eased 0..1: linear toward the target at dt / riseMs and dt / fallMs, output through easeOutCubic (3.3.7.4). */
  get strength(): number {
    return easeOutCubic(this.lin);
  }

  /** Speed of the eased point in px/s, smoothed with a 100 ms time constant (3.3.7.5). */
  get speed(): number {
    return this.spd;
  }

  get velFactor(): number {
    return Math.min(this.spd / this.p.velNorm, 1);
  }

  /** Strength at its target and the eased point within 0.25 px of the raw point (the 3.6.4 idle check). */
  get settled(): boolean {
    return this.lin === this.target && Math.hypot(this.rx - this.ex, this.ry - this.ey) <= SETTLE_PX;
  }

  private place(x: number, y: number, snap: boolean): void {
    this.rx = x;
    this.ry = y;
    // while the strength is 0 the eased point is invisible: jump there instead of sweeping in from a stale spot
    if (snap || this.lin === 0) {
      this.ex = x;
      this.ey = y;
      this.spd = 0;
    }
    this.target = 1;
  }
}
```

- [ ] **Step 4: Write `src/field/ripples.ts` (spec 3.3.8.1, 3.3.8.3)**

```ts
import type { FieldParams } from './params';

interface Ripple {
  x: number;
  y: number;
  t0: number;
}

const SLOTS = 8; // uRipples[8] in pass 1

/**
 * Shockwave rings (spec 3.3.8), in field-space CSS px and sim seconds. `p` is held by reference, so the
 * debug panel's live edits apply on the next write.
 */
export class RipplePool {
  private readonly p: FieldParams['ripple'];
  private rings: Ripple[] = [];

  constructor(p: FieldParams['ripple']) {
    this.p = p;
  }

  /** One ring per accepted primary pointerdown; at p.max rings the oldest is dropped (3.3.8.3). */
  spawn(x: number, y: number, tSec: number): void {
    const max = Math.max(1, Math.min(SLOTS, Math.floor(this.p.max)));
    while (this.rings.length >= max) this.rings.shift();
    this.rings.push({ x, y, t0: tSec });
  }

  /**
   * Packs up to 8 vec4 (x, y, radius = speedSp × sp × age, amp × (1 − age / lifeS)) into `out` (length 32),
   * zeroes the unused slots, prunes rings with age ≥ lifeS (3.3.8.1) and returns the active count.
   */
  write(tSec: number, sp: number, out: Float32Array): number {
    const { lifeS, speedSp, amp } = this.p;
    this.rings = this.rings.filter((r) => tSec - r.t0 < lifeS);
    const n = Math.min(SLOTS, this.rings.length);
    for (let k = 0; k < SLOTS; k++) {
      const o = k * 4;
      if (k < n) {
        const r = this.rings[k];
        const age = Math.max(0, tSec - r.t0);
        out[o] = r.x;
        out[o + 1] = r.y;
        out[o + 2] = speedSp * sp * age;
        out[o + 3] = amp * (1 - age / lifeS);
      } else {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
      }
    }
    return n;
  }

  clear(): void {
    this.rings = [];
  }

  get count(): number {
    return this.rings.length;
  }
}
```

- [ ] **Step 5: Run the new tests to verify they pass**

Run: `npx vitest run tests/pointer.test.ts tests/ripples.test.ts`
Expected:
```
 Test Files  2 passed (2)
      Tests  14 passed (14)
```
(pointer 8, ripples 6.)

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  20 passed (20)`, `Tests  173 passed (173)` (Task 9 plus 2 files and 14 tests); typecheck prints no diagnostics; build succeeds with the Task 8 JS size.

- [ ] **Step 7: Commit**

```bash
git add src/field/pointer.ts src/field/ripples.ts tests/pointer.test.ts tests/ripples.test.ts
git commit -m "feat(field): pointer model and Shockwave ring pool

Frame-rate independent ease, linear strength through easeOutCubic,
100 ms speed average and the settled check; up to 8 rings packed as
vec4 with expiry at 3.2 s.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Name-mask rasteriser

- **Files:** Move `src/engine/sampler.ts` → `src/field/nameMask.ts` (`git mv`, then rewrite per 4.8); Modify `tests/helpers/fakeCanvas.ts`; Create `tests/nameMask.test.ts`; Delete `src/engine/types.ts` (`src/engine/` is then gone).
- **Interfaces:**
  - Consumes: Task 9 `FieldParams['mask']`.
  - Produces (`src/field/nameMask.ts`):
    ```ts
    export interface Context2DLike {
      font: string; textBaseline: string; textAlign: string; fillStyle: string;
      letterSpacing?: string;
      clearRect(x: number, y: number, w: number, h: number): void;
      fillText(text: string, x: number, y: number): void;
      measureText(text: string): { width: number; actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number };
      getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
    }
    export interface Canvas2DLike { width: number; height: number; getContext(type: '2d'): Context2DLike | null }
    export type CanvasFactory = (w: number, h: number) => Canvas2DLike;
    export const MASK_FONT_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; // P5
    export interface MaskBox { x: number; y: number; w: number; h: number } // field-space CSS px
    export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number } // supersample = 2
    export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }
    export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number;
    export function rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane;
    export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array;
    export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox;
    // entry: whole field; konami: whole field when band, else { x: scrimRight, y: 0, w: field.w - scrimRight, h: field.h }
    ```
    `rasterizeMask` returns a plane of `grid.supersample × cols` by `grid.supersample × rows` texels covering the whole field (one texel = `cellCss / supersample` CSS px); `grid.cellCss` is `Grid.cellCss` (P6). Font string `${weight} ${size}px ${family}`; text centred on the box by its ink box (4.8.4; fallback ascent `0.73 × size`, descent 0).
  - Produces (`tests/helpers/fakeCanvas.ts`): `createFakeCanvasFactory(opts?: { charWidthEm?: number; capHeightEm?: number; nativeLetterSpacing?: boolean; boundingBox?: boolean }): { factory: (width: number, height: number) => Canvas2DLike; contexts: FakeContext[] }` where `boundingBox` (default true) controls whether `measureText` reports `actualBoundingBoxAscent` / `actualBoundingBoxDescent`; each `FakeContext.fillTextCalls` entry also records the `font` string (Index amendment A13).

- [ ] **Step 1: Point the fake canvas at the new module and teach it the alphabetic baseline**

Replace `tests/helpers/fakeCanvas.ts` with exactly this file (it imports from `src/field/nameMask.ts`; `measureText` reports `actualBoundingBoxAscent` = `capHeightEm × size` and `actualBoundingBoxDescent` = 0 unless `boundingBox: false`; an `'alphabetic'` baseline inks `[y − capHeight, y]`, every other baseline `y ± capHeight / 2`; `fillTextCalls` also records the font string):
```ts
import type { Canvas2DLike, Context2DLike } from '../../src/field/nameMask';

export interface FakeOptions {
  /** glyph advance as a fraction of the font size */
  charWidthEm?: number;
  /** glyph ink height as a fraction of the font size */
  capHeightEm?: number;
  /** expose a `letterSpacing` property like modern browsers do */
  nativeLetterSpacing?: boolean;
  /** report actualBoundingBoxAscent / actualBoundingBoxDescent from measureText (default true) */
  boundingBox?: boolean;
}

export interface FakeContext extends Context2DLike {
  fillTextCalls: { text: string; x: number; y: number; font: string }[];
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * A 2D context that "draws" every fillText as a filled rectangle and reports it from getImageData.
 * Ink spans capHeightEm × size above an 'alphabetic' baseline (descent 0), or ± half of it around a
 * 'middle' baseline.
 */
export function createFakeCanvasFactory(opts: FakeOptions = {}): {
  factory: (width: number, height: number) => Canvas2DLike;
  contexts: FakeContext[];
} {
  const charWidthEm = opts.charWidthEm ?? 0.6;
  const capHeightEm = opts.capHeightEm ?? 0.7;
  const boundingBox = opts.boundingBox ?? true;
  const contexts: FakeContext[] = [];

  const factory = (width: number, height: number): Canvas2DLike => {
    const rects: Rect[] = [];
    const fontPx = (): number => Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 10);
    const spacingPx = (): number => (ctx.letterSpacing ? Number.parseFloat(ctx.letterSpacing) : 0);
    const ctx: FakeContext = {
      font: '10px sans-serif',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      fillStyle: '#000',
      fillTextCalls: [],
      clearRect() {
        rects.length = 0;
      },
      measureText(text: string) {
        const width = text.length * charWidthEm * fontPx() + spacingPx() * text.length;
        return boundingBox ? { width, actualBoundingBoxAscent: capHeightEm * fontPx(), actualBoundingBoxDescent: 0 } : { width };
      },
      fillText(text: string, x: number, y: number) {
        ctx.fillTextCalls.push({ text, x, y, font: ctx.font });
        const w = text.length * charWidthEm * fontPx() + spacingPx() * text.length;
        const h = capHeightEm * fontPx();
        const left = ctx.textAlign === 'center' ? x - w / 2 : x;
        const [y0, y1] = ctx.textBaseline === 'alphabetic' ? [y - h, y] : [y - h / 2, y + h / 2];
        rects.push({ x0: left, x1: left + w, y0, y1 });
      },
      getImageData(_x: number, _y: number, w: number, h: number) {
        const data = new Uint8ClampedArray(w * h * 4);
        for (const r of rects) {
          for (let yy = Math.max(0, Math.ceil(r.y0)); yy < Math.min(h, Math.floor(r.y1)); yy++) {
            for (let xx = Math.max(0, Math.ceil(r.x0)); xx < Math.min(w, Math.floor(r.x1)); xx++) {
              data[(yy * w + xx) * 4 + 3] = 255;
            }
          }
        }
        return { width: w, height: h, data };
      },
    };
    if (opts.nativeLetterSpacing) ctx.letterSpacing = '0px';
    contexts.push(ctx);
    return { width, height, getContext: () => ctx };
  };

  return { factory, contexts };
}
```

- [ ] **Step 2: Write the failing test**

`tests/nameMask.test.ts` (spec 4.9 mask literals, Index amendment A4; with the fake's 0.6 em advance "Parsa Naji" measures 600 at 100 px, which reproduces the spec's 201.6 px at 1440 × 900 and 54.6 px for the band; 137.2 px is the spec's "137 px nice."):
```ts
import { describe, expect, it } from 'vitest';
import type { FieldParams } from '../src/field/params';
import { MASK_FONT_FAMILY, alphaPlane, fitFontPx, maskBoxFor, rasterizeMask, type MaskGrid, type MaskPlane } from '../src/field/nameMask';
import { computeGrid } from '../src/field/sizing';
import { createFakeCanvasFactory } from './helpers/fakeCanvas';

// spec 4.9 literals, passed explicitly so a later tuning of DEFAULT_FIELD (4.12.4) never changes these cases
const MASK: FieldParams['mask'] = { holdDim: 0.3, ink: 0.91, edge: 0.08, meltPx: 48, heightFrac: 0.4, widthFrac: 0.84, supersample: 2, fontWeight: 700 };
const FONT = { family: MASK_FONT_FAMILY, weight: MASK.fontWeight };
const DESKTOP: MaskGrid = { cols: 288, rows: 180, cellCss: 5, supersample: 2 }; // 1440 x 900 at DPR 1

/** Centre of the inked texels, in texels. */
function inkCentre(plane: MaskPlane): { x: number; y: number } {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let y = 0; y < plane.height; y++) {
    for (let x = 0; x < plane.width; x++) {
      if (plane.data[y * plane.width + x] === 0) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { x: (minX + maxX + 1) / 2, y: (minY + maxY + 1) / 2 };
}

describe('fitFontPx (spec 4.8.3)', () => {
  it('is 0.84 w 100 / widthAt100 when width-limited: 201.6 px at 1440 x 900 ("Parsa Naji" = 6.0 em)', () => {
    expect(fitFontPx(600, { x: 0, y: 0, w: 1440, h: 900 }, 0.4, 0.84)).toBeCloseTo(201.6, 9);
  });

  it('is 0.4 h when height-limited', () => {
    expect(fitFontPx(600, { x: 0, y: 0, w: 2000, h: 300 }, 0.4, 0.84)).toBeCloseTo(120, 9);
  });

  it('falls back to the height rule for text without width and never goes negative', () => {
    expect(fitFontPx(0, { x: 0, y: 0, w: 1440, h: 900 }, 0.4, 0.84)).toBeCloseTo(360, 9);
    expect(fitFontPx(600, { x: 0, y: 0, w: -10, h: 900 }, 0.4, 0.84)).toBe(0);
  });
});

describe('alphaPlane (spec 4.8.5)', () => {
  it('extracts byte 3 of every RGBA pixel', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 10, 255, 255, 255, 20, 1, 2, 3, 30, 0, 0, 0, 40]);
    expect(Array.from(alphaPlane({ data, width: 2, height: 2 }))).toEqual([10, 20, 30, 40]);
  });
});

describe('rasterizeMask (spec 4.8.2-4.8.4)', () => {
  it('covers the whole field at 2 texels per cell', () => {
    const { factory } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    expect([plane.width, plane.height, plane.data.length]).toEqual([576, 360, 576 * 360]);
    expect(plane.fontPx).toBeCloseTo(201.6, 9);
  });

  it('centres the ink box on the box centre within one texel', () => {
    const { factory } = createFakeCanvasFactory();
    const plane = rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 288)).toBeLessThanOrEqual(1); // 720 CSS px x 0.4 texels per CSS px
    expect(Math.abs(c.y - 180)).toBeLessThanOrEqual(1);
  });

  it('draws 700 weight in MASK_FONT_FAMILY at fontPx x 2 / cellCss texels, centred, on the alphabetic baseline', () => {
    const { factory, contexts } = createFakeCanvasFactory();
    rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    const ctx = contexts[0];
    expect(ctx.fillTextCalls).toHaveLength(1);
    const call = ctx.fillTextCalls[0];
    const m = /^700 ([\d.]+)px (.+)$/.exec(call.font);
    expect(m?.[2]).toBe('"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
    expect(Number(m?.[1])).toBeCloseTo(80.64, 6); // 201.6 x 2 / 5
    expect(ctx.textAlign).toBe('center');
    expect(ctx.textBaseline).toBe('alphabetic');
    expect(call.x).toBeCloseTo(288, 9);
    expect(call.y).toBeCloseTo(180 + (0.7 * 80.64) / 2, 6); // cy + (ascent - descent) / 2
  });

  it('uses ascent 0.73 x size and descent 0 when measureText has no actualBoundingBox* (11.31)', () => {
    const { factory, contexts } = createFakeCanvasFactory({ boundingBox: false });
    rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 1440, h: 900 }, DESKTOP, FONT, MASK, factory);
    expect(contexts[0].fillTextCalls[0].y).toBeCloseTo(180 + (0.73 * 80.64) / 2, 6);
  });

  it('scales the name to the 390 x 236.32 phone band: 54.6 px, centred (3.4.6)', () => {
    const g = computeGrid(390, 236.32, 3, 2);
    const { factory } = createFakeCanvasFactory();
    const box = maskBoxFor('entry', { w: 390, h: 236.32 }, null, true);
    const plane = rasterizeMask('Parsa Naji', box, { cols: g.cols, rows: g.rows, cellCss: g.cellCss, supersample: 2 }, FONT, MASK, factory);
    expect([plane.width, plane.height]).toEqual([390, 238]);
    expect(plane.fontPx).toBeCloseTo(54.6, 9);
    const c = inkCentre(plane);
    expect(Math.abs(c.x - 195)).toBeLessThanOrEqual(1);
    expect(Math.abs(c.y - 118.16)).toBeLessThanOrEqual(1);
  });

  it('places the Konami text in the box right of the scrim: a 137.2 px "nice." centred at x = 1195', () => {
    const { factory } = createFakeCanvasFactory();
    const box = maskBoxFor('konami', { w: 1440, h: 900 }, 950, false);
    const plane = rasterizeMask('nice.', box, DESKTOP, FONT, MASK, factory);
    expect(plane.fontPx).toBeCloseTo(137.2, 9);
    expect(Math.abs(inkCentre(plane).x - 1195 * 0.4)).toBeLessThanOrEqual(1);
  });

  it('throws when the canvas has no 2D context', () => {
    expect(() =>
      rasterizeMask('Parsa Naji', { x: 0, y: 0, w: 10, h: 10 }, DESKTOP, FONT, MASK, () => ({ width: 1, height: 1, getContext: () => null })),
    ).toThrow('2d context unavailable');
  });
});

describe('maskBoxFor (spec 3.4.6, 3.4.11)', () => {
  it('gives the entry the whole field', () => {
    expect(maskBoxFor('entry', { w: 1440, h: 900 }, 950, false)).toEqual({ x: 0, y: 0, w: 1440, h: 900 });
  });

  it('gives Konami the part right of the scrim in the rail layout', () => {
    expect(maskBoxFor('konami', { w: 1440, h: 900 }, 950, false)).toEqual({ x: 950, y: 0, w: 490, h: 900 });
  });

  it('gives Konami the whole band in the band layout', () => {
    expect(maskBoxFor('konami', { w: 390, h: 236 }, null, true)).toEqual({ x: 0, y: 0, w: 390, h: 236 });
  });

  it('clamps a scrim edge past the field to an empty box', () => {
    expect(maskBoxFor('konami', { w: 760, h: 700 }, 762, false)).toEqual({ x: 760, y: 0, w: 0, h: 700 });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/nameMask.test.ts`
Expected:
```
 FAIL  tests/nameMask.test.ts [ tests/nameMask.test.ts ]
Error: Cannot find module '../src/field/nameMask' imported from …/tests/nameMask.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```
(`tests/helpers/fakeCanvas.ts` only has a type import, which is erased at run time, so it does not fail first. Do not run `npm run typecheck` until Step 5.)

- [ ] **Step 4: Move the sampler and rewrite it as `src/field/nameMask.ts` (spec 4.8.1–4.8.5, 3.4.6, 3.4.11)**

```bash
git mv src/engine/sampler.ts src/field/nameMask.ts
```
Then replace the whole content of `src/field/nameMask.ts` with exactly this (kept from the sampler: `Context2DLike`, `Canvas2DLike`, `CanvasFactory` and the injected-canvas testability; dropped: `layoutText`, `makeMeasure`, `drawSpaced`, `rasterize`, `scanAlpha`, `subsampleToN`, `glyphCenters`, `sampleText` and their types):
```ts
import type { FieldParams } from './params';

export interface Context2DLike {
  font: string;
  textBaseline: string;
  textAlign: string;
  fillStyle: string;
  /** present in modern browsers; absent on older Safari and on test fakes that emulate it */
  letterSpacing?: string;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number; actualBoundingBoxAscent?: number; actualBoundingBoxDescent?: number };
  getImageData(x: number, y: number, w: number, h: number): { width: number; height: number; data: Uint8ClampedArray };
}

export interface Canvas2DLike {
  width: number;
  height: number;
  getContext(type: '2d'): Context2DLike | null;
}

export type CanvasFactory = (w: number, h: number) => Canvas2DLike;

/** Spec 3.4.3 / 4.8.3: JetBrains Mono, then the fallback stack used when the font has not settled. */
export const MASK_FONT_FAMILY = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** A box in field-space CSS px (origin at the canvas's top-left, y down). */
export interface MaskBox { x: number; y: number; w: number; h: number }
/** The current grid (cols, rows, `cellCss` = Grid.cellCss = uCell) and the texels per cell (2). */
export interface MaskGrid { cols: number; rows: number; cellCss: number; supersample: number }
/** R8 coverage, row 0 = the top of the field; `fontPx` is the CSS font size the text was fitted to. */
export interface MaskPlane { data: Uint8Array; width: number; height: number; fontPx: number }

/** JetBrains Mono's cap height: the ascent used when measureText has no actualBoundingBox* (4.8.4, 11.31). */
const FALLBACK_ASCENT_EM = 0.73;

/** Spec 4.8.3: min(heightFrac × box.h, widthFrac × box.w × 100 / widthAt100), never negative. */
export function fitFontPx(widthAt100: number, box: MaskBox, heightFrac: number, widthFrac: number): number {
  const byHeight = heightFrac * Math.max(0, box.h);
  if (!(widthAt100 > 0)) return byHeight;
  return Math.min(byHeight, (widthFrac * Math.max(0, box.w) * 100) / widthAt100);
}

/** Spec 4.8.5: byte 3 (alpha) of every RGBA pixel, as the R8 plane. */
export function alphaPlane(img: { data: Uint8ClampedArray; width: number; height: number }): Uint8Array {
  const n = img.width * img.height;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = img.data[i * 4 + 3];
  return out;
}

/**
 * Spec 4.8.2–4.8.4: white text on a transparent canvas of supersample × cols by supersample × rows texels
 * covering the whole field (one texel = cellCss / supersample CSS px), centred on the box by its ink box.
 * Throws when the factory's canvas has no 2D context.
 */
export function rasterizeMask(
  text: string,
  box: MaskBox,
  grid: MaskGrid,
  font: { family: string; weight: number },
  p: FieldParams['mask'],
  create: CanvasFactory,
): MaskPlane {
  const width = Math.max(1, grid.supersample * grid.cols);
  const height = Math.max(1, grid.supersample * grid.rows);
  const canvas = create(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const s = grid.supersample / grid.cellCss; // texels per CSS px
  ctx.clearRect(0, 0, width, height);
  ctx.font = `${font.weight} 100px ${font.family}`;
  const fontPx = fitFontPx(ctx.measureText(text).width, box, p.heightFrac, p.widthFrac);
  const size = fontPx * s;
  ctx.font = `${font.weight} ${size}px ${font.family}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(text);
  const ascent = typeof m.actualBoundingBoxAscent === 'number' ? m.actualBoundingBoxAscent : FALLBACK_ASCENT_EM * size;
  const descent = typeof m.actualBoundingBoxDescent === 'number' ? m.actualBoundingBoxDescent : 0;
  const cx = (box.x + box.w / 2) * s;
  const cy = (box.y + box.h / 2) * s;
  if (size > 0) ctx.fillText(text, cx, cy + (ascent - descent) / 2);
  return { data: alphaPlane(ctx.getImageData(0, 0, width, height)), width, height, fontPx };
}

/**
 * Spec 3.4.6 and 3.4.11: the entry uses the whole field; Konami uses the whole field on the band, else the
 * part right of the scrim's clear edge (clamped to the field, so a scrim wider than the field gives w = 0).
 */
export function maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox {
  if (kind === 'entry' || band || scrimRight === null) return { x: 0, y: 0, w: field.w, h: field.h };
  const x = Math.min(field.w, Math.max(0, scrimRight));
  return { x, y: 0, w: field.w - x, h: field.h };
}
```
Then retire the last engine file (its only importer was the sampler):
```bash
git rm -q src/engine/types.ts
ls src/engine 2>&1; grep -rnE "from '[./]+(src/)?engine/" src tests || echo "no engine imports left"
```
Expected: `ls: cannot access 'src/engine': No such file or directory` and `no engine imports left`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/nameMask.test.ts`
Expected:
```
 Test Files  1 passed (1)
      Tests  15 passed (15)
```

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  21 passed (21)`, `Tests  188 passed (188)` (Task 10 plus 1 file and 15 tests; `tests/helpers/fakeCanvas.ts` is not a test file); typecheck prints no diagnostics (the fake canvas now type-checks against `nameMask.ts`); build succeeds with the Task 8 JS size.

- [ ] **Step 7: Commit**

```bash
git add src/field/nameMask.ts tests/nameMask.test.ts tests/helpers/fakeCanvas.ts
git status --short
git commit -m "feat(field): name-mask rasteriser replaces the particle sampler

Text becomes an R8 coverage plane at 2 texels per cell over the whole
field, fitted by the Blueprint box rule and centred on its ink box;
mask boxes for the entry and Konami. src/engine/ is gone.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
`git status --short` before the commit shows `R  src/engine/sampler.ts -> src/field/nameMask.ts` (git keeps the rename when the similarity allows it; a delete plus add is acceptable), `D  src/engine/types.ts`, `M  tests/helpers/fakeCanvas.ts`, `A  tests/nameMask.test.ts`.

---

### Task 12: WebGL2 context, programs and targets

- **Files:** Create `src/gl/context.ts`, `src/gl/program.ts`, `src/gl/targets.ts`, `tests/glContext.test.ts`, `tests/program.test.ts`.
- **Interfaces:**
  - Consumes: none.
  - Produces:
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
    ```
    `startProgram` binds attribute 0 to `aPos` before linking; `ready()` polls `COMPLETION_STATUS_KHR` when `parallel` is given and is `true` without it; `finish()` checks compile and link status once and throws `ShaderError` with the info log. `createMaskTexture` uploads with `UNPACK_ALIGNMENT 1` and no FLIP_Y or PREMULTIPLY_ALPHA (4.5.7). The triangle is `[-1, -1, 3, -1, -1, 3]`, `STATIC_DRAW`.

- [ ] **Step 1: Write the failing tests**

`tests/glContext.test.ts` (the context cases of 8.1.15, plus the `targets.ts` contracts the renderer relies on: an incomplete FBO throws and cleans up, the mask upload never sets FLIP_Y or PREMULTIPLY):
```ts
import { describe, expect, it } from 'vitest';
import { GL_ATTRIBUTES, createContext } from '../src/gl/context';
import { createFullscreenTriangle, createMaskTexture, createSurfaceTarget, deleteSurfaceTarget } from '../src/gl/targets';

type Canvas = Pick<HTMLCanvasElement, 'getContext'>;
const canvasReturning = (getContext: (type: string, attrs: unknown) => unknown): Canvas => ({ getContext }) as unknown as Canvas;

describe('createContext (spec 3.6.2)', () => {
  it('requests webgl2 with GL_ATTRIBUTES and returns the context', () => {
    const gl = { tag: 'gl' };
    const calls: [string, unknown][] = [];
    const ctx = createContext(
      canvasReturning((type, attrs) => {
        calls.push([type, attrs]);
        return gl;
      }),
    );
    expect(ctx).toBe(gl);
    expect(calls).toEqual([['webgl2', GL_ATTRIBUTES]]);
  });

  it('returns null when getContext returns null', () => {
    expect(createContext(canvasReturning(() => null))).toBeNull();
  });

  it('returns null when getContext throws', () => {
    expect(
      createContext(
        canvasReturning(() => {
          throw new Error('blocked');
        }),
      ),
    ).toBeNull();
  });

  it('GL_ATTRIBUTES is exactly the spec 4.3 object', () => {
    expect(GL_ATTRIBUTES).toEqual({
      alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
    });
  });
});

/** Records every call on a fake WebGL2 context; `fbStatus` is what checkFramebufferStatus returns. */
function recordingGl(fbStatus = 0x8cd5) {
  const calls: [string, ...unknown[]][] = [];
  let next = 0;
  const C = {
    TEXTURE_2D: 0x0de1, TEXTURE0: 0x84c0, TEXTURE1: 0x84c1, RGBA8: 0x8058, R8: 0x8229, RED: 0x1903, UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600, LINEAR: 0x2601, CLAMP_TO_EDGE: 0x812f, TEXTURE_MIN_FILTER: 0x2801, TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802, TEXTURE_WRAP_T: 0x2803, FRAMEBUFFER: 0x8d40, COLOR_ATTACHMENT0: 0x8ce0, FRAMEBUFFER_COMPLETE: 0x8cd5,
    UNPACK_ALIGNMENT: 0x0cf5, UNPACK_FLIP_Y_WEBGL: 0x9240, UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241, ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4, FLOAT: 0x1406,
  };
  const gl = new Proxy(C as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
        if (prop.startsWith('create')) return { id: ++next, kind: prop };
        if (prop === 'checkFramebufferStatus') return fbStatus;
        return undefined;
      };
    },
  }) as unknown as WebGL2RenderingContext;
  return { gl, calls, C };
}

describe('createSurfaceTarget (spec 4.5.2)', () => {
  it('allocates an RGBA8 cols x rows texture, NEAREST and CLAMP_TO_EDGE, on unit 0, attached to an FBO', () => {
    const { gl, calls, C } = recordingGl();
    const t = createSurfaceTarget(gl, 288, 180);
    expect([t.cols, t.rows]).toEqual([288, 180]);
    expect(calls).toContainEqual(['activeTexture', C.TEXTURE0]);
    expect(calls).toContainEqual(['texStorage2D', C.TEXTURE_2D, 1, C.RGBA8, 288, 180]);
    for (const pname of [C.TEXTURE_MIN_FILTER, C.TEXTURE_MAG_FILTER]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.NEAREST]);
    for (const pname of [C.TEXTURE_WRAP_S, C.TEXTURE_WRAP_T]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.CLAMP_TO_EDGE]);
    expect(calls).toContainEqual(['framebufferTexture2D', C.FRAMEBUFFER, C.COLOR_ATTACHMENT0, C.TEXTURE_2D, t.tex, 0]);
    expect(calls.at(-1)).toEqual(['bindFramebuffer', C.FRAMEBUFFER, null]);
  });

  it('throws and deletes both objects when the framebuffer is incomplete', () => {
    const { gl, calls } = recordingGl(0x8cd6);
    expect(() => createSurfaceTarget(gl, 4, 4)).toThrow('surface framebuffer incomplete');
    expect(calls.map((c) => c[0])).toEqual(expect.arrayContaining(['deleteFramebuffer', 'deleteTexture']));
  });

  it('deleteSurfaceTarget deletes the FBO and the texture', () => {
    const { gl, calls } = recordingGl();
    const t = createSurfaceTarget(gl, 2, 2);
    deleteSurfaceTarget(gl, t);
    expect(calls.slice(-2)).toEqual([
      ['deleteFramebuffer', t.fbo],
      ['deleteTexture', t.tex],
    ]);
  });
});

describe('createMaskTexture (spec 4.5.7)', () => {
  it('uploads an R8 plane to unit 1 with UNPACK_ALIGNMENT 1, LINEAR, CLAMP_TO_EDGE and no FLIP_Y or PREMULTIPLY', () => {
    const { gl, calls, C } = recordingGl();
    const plane = new Uint8Array(6 * 4);
    createMaskTexture(gl, 6, 4, plane);
    expect(calls).toContainEqual(['activeTexture', C.TEXTURE1]);
    expect(calls).toContainEqual(['texStorage2D', C.TEXTURE_2D, 1, C.R8, 6, 4]);
    expect(calls).toContainEqual(['pixelStorei', C.UNPACK_ALIGNMENT, 1]);
    expect(calls).toContainEqual(['texSubImage2D', C.TEXTURE_2D, 0, 0, 0, 6, 4, C.RED, C.UNSIGNED_BYTE, plane]);
    for (const pname of [C.TEXTURE_MIN_FILTER, C.TEXTURE_MAG_FILTER]) expect(calls).toContainEqual(['texParameteri', C.TEXTURE_2D, pname, C.LINEAR]);
    const pixelStores = calls.filter((c) => c[0] === 'pixelStorei').map((c) => c[1]);
    expect(pixelStores).not.toContain(C.UNPACK_FLIP_Y_WEBGL);
    expect(pixelStores).not.toContain(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  });
});

describe('createFullscreenTriangle (spec 4.5.1)', () => {
  it('binds [-1, -1, 3, -1, -1, 3] as STATIC_DRAW to attribute 0', () => {
    const { gl, calls, C } = recordingGl();
    const { vao } = createFullscreenTriangle(gl);
    const data = calls.find((c) => c[0] === 'bufferData');
    expect(Array.from(data?.[2] as Float32Array)).toEqual([-1, -1, 3, -1, -1, 3]);
    expect(data?.[3]).toBe(C.STATIC_DRAW);
    expect(calls).toContainEqual(['bindVertexArray', vao]);
    expect(calls).toContainEqual(['enableVertexAttribArray', 0]);
    expect(calls).toContainEqual(['vertexAttribPointer', 0, 2, C.FLOAT, false, 0, 0]);
  });
});
```

`tests/program.test.ts` (a fake context records the call order; no status query may happen at start, risk 9.6):
```ts
import { describe, expect, it } from 'vitest';
import { GLSL_HEADER_FRAG, GLSL_HEADER_VERT, ShaderError, startProgram, uniformMap } from '../src/gl/program';

const COMPLETION_STATUS_KHR = 0x91b1;

interface FakeOptions {
  vertOk?: boolean;
  fragOk?: boolean;
  linkOk?: boolean;
  uniforms?: string[];
  /** COMPLETION_STATUS_KHR answers, consumed one per query */
  completion?: boolean[];
}

/** A fake WebGL2 context with just the program API, recording the order of calls. */
function fakeGl(o: FakeOptions = {}) {
  const log: string[] = [];
  const sources: string[] = [];
  const completion = [...(o.completion ?? [])];
  let id = 0;
  const shaders = new Map<object, number>();
  const gl = {
    VERTEX_SHADER: 0x8b31, FRAGMENT_SHADER: 0x8b30, COMPILE_STATUS: 0x8b81, LINK_STATUS: 0x8b82, ACTIVE_UNIFORMS: 0x8b86,
    createShader(type: number) {
      const s = { id: ++id };
      shaders.set(s, type);
      return s;
    },
    createProgram: () => ({ id: ++id }),
    shaderSource: (_s: object, src: string) => void sources.push(src),
    compileShader: () => void log.push('compileShader'),
    attachShader: () => void log.push('attachShader'),
    bindAttribLocation: (_p: object, index: number, name: string) => void log.push(`bindAttribLocation ${index} ${name}`),
    linkProgram: () => void log.push('linkProgram'),
    getShaderParameter(s: object) {
      log.push('getShaderParameter');
      return shaders.get(s) === 0x8b31 ? (o.vertOk ?? true) : (o.fragOk ?? true);
    },
    getShaderInfoLog: (s: object) => (shaders.get(s) === 0x8b31 ? 'vert log' : "ERROR: 0:12: 'uOops' : undeclared identifier"),
    getProgramParameter(_p: object, pname: number) {
      log.push(`getProgramParameter ${pname.toString(16)}`);
      if (pname === 0x8b82) return (o.vertOk ?? true) && (o.fragOk ?? true) && (o.linkOk ?? true);
      if (pname === 0x8b86) return (o.uniforms ?? []).length;
      if (pname === COMPLETION_STATUS_KHR) return completion.shift() ?? true;
      return null;
    },
    getProgramInfoLog: () => 'link log: varying mismatch',
    getActiveUniform: (_p: object, i: number) => ({ name: (o.uniforms ?? [])[i], size: 1, type: 0 }),
    getUniformLocation: (_p: object, name: string) => ({ name }),
    detachShader: () => void log.push('detachShader'),
    deleteShader: () => void log.push('deleteShader'),
    deleteProgram: () => void log.push('deleteProgram'),
  };
  return { gl: gl as unknown as WebGL2RenderingContext, log, sources };
}

const parallel = { COMPLETION_STATUS_KHR } as KHR_parallel_shader_compile;

describe('GLSL headers (spec 4.3)', () => {
  it('are exact', () => {
    expect(GLSL_HEADER_FRAG).toBe('#version 300 es\nprecision highp float;\nprecision highp int;\n');
    expect(GLSL_HEADER_VERT).toBe('#version 300 es\n');
  });
});

describe('startProgram', () => {
  it('prepends the headers and binds attribute 0 to aPos before linking (4.5.1)', () => {
    const { gl, log, sources } = fakeGl();
    startProgram(gl, 'VERT', 'FRAG', null);
    expect(sources).toEqual([`${GLSL_HEADER_VERT}VERT`, `${GLSL_HEADER_FRAG}FRAG`]);
    expect(log.indexOf('bindAttribLocation 0 aPos')).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('bindAttribLocation 0 aPos')).toBeLessThan(log.indexOf('linkProgram'));
    expect(log.some((l) => l.startsWith('get'))).toBe(false); // no status query at start (risk 9.6)
  });

  it('is ready at once without KHR_parallel_shader_compile', () => {
    const { gl } = fakeGl();
    expect(startProgram(gl, 'v', 'f', null).ready()).toBe(true);
  });

  it('polls COMPLETION_STATUS_KHR with the extension', () => {
    const { gl, log } = fakeGl({ completion: [false, false, true] });
    const p = startProgram(gl, 'v', 'f', parallel);
    expect([p.ready(), p.ready(), p.ready()]).toEqual([false, false, true]);
    expect(log.filter((l) => l === `getProgramParameter ${COMPLETION_STATUS_KHR.toString(16)}`)).toHaveLength(3);
  });

  it('finish() returns the program and its uniform map once linked, checking the status once', () => {
    const { gl, log } = fakeGl({ uniforms: ['uCell', 'uRipples[0]'] });
    const p = startProgram(gl, 'v', 'f', null);
    const h = p.finish();
    expect(Object.keys(h.uniforms)).toEqual(['uCell', 'uRipples']);
    expect(p.finish()).toBe(h);
    expect(log.filter((l) => l === 'getProgramParameter 8b82')).toHaveLength(1);
  });

  it('turns a compile failure into a ShaderError carrying the info log', () => {
    const { gl, log } = fakeGl({ fragOk: false });
    const p = startProgram(gl, 'v', 'f', null);
    let caught: unknown;
    try {
      p.finish();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ShaderError);
    expect((caught as ShaderError).message).toBe('fragment shader failed to compile');
    expect((caught as ShaderError).log).toContain("'uOops' : undeclared identifier");
    expect(() => p.finish()).toThrow(caught as ShaderError); // same error on every later call
    expect(log).toContain('deleteProgram');
  });

  it('turns a link failure into a ShaderError carrying the program log', () => {
    const { gl } = fakeGl({ linkOk: false });
    const p = startProgram(gl, 'v', 'f', null);
    expect(() => p.finish()).toThrow(ShaderError);
    try {
      p.finish();
    } catch (error) {
      expect((error as ShaderError).message).toBe('program failed to link');
      expect((error as ShaderError).log).toBe('link log: varying mismatch');
    }
  });

  it('reports a context that cannot create objects as a ShaderError instead of throwing at start', () => {
    const { gl } = fakeGl();
    (gl as unknown as { createShader: () => null }).createShader = () => null;
    const p = startProgram(gl, 'v', 'f', null);
    expect(p.ready()).toBe(true);
    expect(() => p.finish()).toThrow(ShaderError);
  });
});

describe('uniformMap', () => {
  it('strips the [0] suffix of array uniforms', () => {
    const { gl } = fakeGl({ uniforms: ['uCell', 'uRipples[0]', 'uMask'] });
    const map = uniformMap(gl, {} as WebGLProgram);
    expect(Object.keys(map)).toEqual(['uCell', 'uRipples', 'uMask']);
    expect(map.uRipples).toEqual({ name: 'uRipples[0]' });
  });
});

describe('ShaderError', () => {
  it('is an Error with a name and a log', () => {
    const e = new ShaderError('boom', 'details');
    expect(e).toBeInstanceOf(Error);
    expect([e.name, e.message, e.log]).toEqual(['ShaderError', 'boom', 'details']);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/glContext.test.ts tests/program.test.ts`
Expected:
```
 FAIL  tests/glContext.test.ts [ tests/glContext.test.ts ]
Error: Cannot find module '../src/gl/context' imported from …/tests/glContext.test.ts
 FAIL  tests/program.test.ts [ tests/program.test.ts ]
Error: Cannot find module '../src/gl/program' imported from …/tests/program.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

- [ ] **Step 3: Write `src/gl/context.ts` (spec 4.3, 3.6.2, risk 9.10)**

```ts
/** Spec 4.3 / 3.6.2: no alpha, no AA, no depth or stencil; software GL counts as no WebGL2. */
export const GL_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
  preserveDrawingBuffer: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, desynchronized: false,
};

/** The page's one WebGL2 context, or null (no WebGL2, a major performance caveat, or a throwing getContext). Never throws. */
export function createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs: WebGLContextAttributes = GL_ATTRIBUTES): WebGL2RenderingContext | null {
  try {
    return canvas.getContext('webgl2', attrs) ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Write `src/gl/program.ts` (spec 4.5.1, 4.7.4 step 5, 3.6.2, risk 9.6)**

`finish()` asks for `LINK_STATUS` first and reads the compile statuses only when the link failed (the KHR_parallel_shader_compile pattern: one blocking query on success). A context that cannot create objects (lost) becomes a `ShaderError` at `finish()`, never a throw from `startProgram`.
```ts
export const GLSL_HEADER_FRAG = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
export const GLSL_HEADER_VERT = '#version 300 es\n';

export interface ProgramHandle { program: WebGLProgram; uniforms: Readonly<Record<string, WebGLUniformLocation>> }
export interface PendingProgram { ready(): boolean; finish(): ProgramHandle } // finish() throws ShaderError

/** A compile or link failure; `log` carries the driver's info log (DEV diagnostics, never logged in production). */
export class ShaderError extends Error {
  readonly log: string;
  constructor(message: string, log: string) {
    super(message);
    this.name = 'ShaderError';
    this.log = log;
  }
}

/** Active uniforms by name; array uniforms drop their "[0]" suffix ("uRipples[0]" -> "uRipples"). */
export function uniformMap(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation> {
  const out: Record<string, WebGLUniformLocation> = {};
  const n = Number(gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)) || 0;
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    const loc = gl.getUniformLocation(program, info.name);
    if (loc) out[info.name.replace(/\[0\]$/, '')] = loc;
  }
  return out;
}

/**
 * Starts compiling and linking without querying any status (spec 4.7.4 step 5, risk 9.6). With
 * KHR_parallel_shader_compile, ready() polls COMPLETION_STATUS_KHR; without it ready() is true and the
 * caller must call finish() inside an animation frame after first paint. finish() checks the statuses
 * once: later calls return the same handle or throw the same ShaderError.
 */
export function startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    const lost = new ShaderError('WebGL objects unavailable (context lost)', '');
    return { ready: () => true, finish: () => { throw lost; } };
  }
  gl.shaderSource(vs, GLSL_HEADER_VERT + vert);
  gl.shaderSource(fs, GLSL_HEADER_FRAG + frag);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'aPos'); // 4.5.1: attribute 0 before link
  gl.linkProgram(program);

  let result: ProgramHandle | ShaderError | null = null;
  const release = (): void => {
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
  const check = (): ProgramHandle | ShaderError => {
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      release();
      return { program, uniforms: uniformMap(gl, program) };
    }
    let error: ShaderError;
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) error = new ShaderError('vertex shader failed to compile', gl.getShaderInfoLog(vs) ?? '');
    else if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) error = new ShaderError('fragment shader failed to compile', gl.getShaderInfoLog(fs) ?? '');
    else error = new ShaderError('program failed to link', gl.getProgramInfoLog(program) ?? '');
    release();
    gl.deleteProgram(program);
    return error;
  };
  return {
    ready: () => result !== null || parallel === null || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR) === true,
    finish: () => {
      result ??= check();
      if (result instanceof ShaderError) throw result;
      return result;
    },
  };
}
```

- [ ] **Step 5: Write `src/gl/targets.ts` (spec 4.5.1, 4.5.2, 4.5.7, Appendix A §3.9)**

The surface target binds on unit 0 and the mask on unit 1 (pass 1 samples only unit 1, pass 2 only unit 0, so the FBO's texture is never sampled while it is the render target).
```ts
/** Pass 1's render target (spec 4.5.2, Appendix A §3.9): one RGBA8 texel per cell, .r = v. */
export interface SurfaceTarget { tex: WebGLTexture; fbo: WebGLFramebuffer; cols: number; rows: number }

/** RGBA8, NEAREST, CLAMP_TO_EDGE on texture unit 0. Throws (after cleaning up) when the FBO is incomplete. */
export function createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) throw new Error('surface target unavailable (context lost)');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, cols, rows);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!complete) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    throw new Error('surface framebuffer incomplete');
  }
  return { tex, fbo, cols, rows };
}

/** R8, LINEAR, CLAMP_TO_EDGE on texture unit 1; UNPACK_ALIGNMENT 1, no FLIP_Y or PREMULTIPLY_ALPHA (spec 4.5.7). */
export function createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error('mask texture unavailable (context lost)');
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, w, h);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.UNSIGNED_BYTE, plane);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.activeTexture(gl.TEXTURE0);
  return tex;
}

/** One triangle covering clip space ([-1, -1, 3, -1, -1, 3], STATIC_DRAW) on attribute 0 (spec 4.5.1). */
export function createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer } {
  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  if (!vao || !vbo) throw new Error('fullscreen triangle unavailable (context lost)');
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { vao, vbo };
}

export function deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void {
  gl.deleteFramebuffer(t.fbo);
  gl.deleteTexture(t.tex);
}
```

- [ ] **Step 6: Run the new tests to verify they pass**

Run: `npx vitest run tests/glContext.test.ts tests/program.test.ts`
Expected:
```
 Test Files  2 passed (2)
      Tests  19 passed (19)
```
(glContext 9, program 10.)

- [ ] **Step 7: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  23 passed (23)`, `Tests  207 passed (207)` (Task 11 plus 2 files and 19 tests); typecheck prints no diagnostics; build succeeds with the Task 8 JS size.

- [ ] **Step 8: Commit**

```bash
git add src/gl/context.ts src/gl/program.ts src/gl/targets.ts tests/glContext.test.ts tests/program.test.ts
git commit -m "feat(gl): WebGL2 context, async programs and render targets

createContext never throws; programs compile and link without a status
query until ready() (KHR_parallel_shader_compile) and report failures
as ShaderError with the driver log; RGBA8 surface target, R8 mask
texture and the fullscreen triangle.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Frame loop and page lifecycle

- **Files:** Create `src/loop.ts`, `src/lifecycle.ts`, `tests/loop.test.ts`, `tests/lifecycle.test.ts`.
- **Interfaces:**
  - Consumes: Task 1 `clampDt(dtMs: number, maxMs?: number): number`.
  - Produces:
    ```ts
    // src/loop.ts
    export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }
    export function createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop;
    // onFrame returns false to idle; wake() schedules one frame; dt = clampDt(now - last); start() resets last

    // src/lifecycle.ts
    export interface LifecycleTarget {
      pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void; // P2
      reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
    }
    export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void;
    ```
  - Semantics: `running` is true from `start()` until `stop()`, including while idle; `wake()` is a no-op while stopped; the first frame after `start()` gets `dt = clampDt(0)`. `bindLifecycle` reads every browser API from `env` (`env.win.matchMedia`, `env.win.ResizeObserver`, `env.win.devicePixelRatio`, `env.doc.visibilityState`), never from globals, and tolerates a missing `ResizeObserver`. It wires: `visibilitychange` → `pause()` / `resume()`; `pagehide` → `pause()`; `pageshow` with `persisted` → `resume()`; canvas `webglcontextlost` → `preventDefault()` then `contextLost()`; `webglcontextrestored` → `contextRestored()`; `(prefers-reduced-motion: reduce)` change → `reducedChanged(matches)`; `(resolution: <dpr>dppx)` change → `dprChanged()`, re-armed with the new DPR; a `ResizeObserver` on the canvas (`{ box: 'device-pixel-content-box' }` when supported) → `resize(deviceBox)` from `devicePixelContentBoxSize[0]` (`inlineSize`, `blockSize`) or `null`. The returned function removes every listener and disconnects the observer.

- [ ] **Step 1: Write the failing tests**

`tests/loop.test.ts` (a manual rAF queue; `frame(now)` runs the callbacks queued so far):
```ts
import { describe, expect, it } from 'vitest';
import { createLoop } from '../src/loop';

/** A manual requestAnimationFrame: frame(now) runs the callbacks queued so far. */
function fakeRaf() {
  let nextId = 0;
  const queue = new Map<number, FrameRequestCallback>();
  return {
    raf: (cb: FrameRequestCallback): number => {
      queue.set(++nextId, cb);
      return nextId;
    },
    caf: (id: number): void => void queue.delete(id),
    frame(now: number): void {
      const due = [...queue.values()];
      queue.clear();
      for (const cb of due) cb(now);
    },
    get pending(): number {
      return queue.size;
    },
  };
}

describe('createLoop (spec 3.7.3, 3.7.4)', () => {
  it('passes clampDt(now - last) and the timestamp; the first frame after start() gets one 60 fps frame', () => {
    const r = fakeRaf();
    const seen: [number, number][] = [];
    const loop = createLoop((dt, now) => (seen.push([dt, now]), true), r.raf, r.caf);
    loop.start();
    r.frame(1000);
    r.frame(1016);
    r.frame(1116); // a 100 ms gap
    expect(seen[0][0]).toBeCloseTo(1000 / 60, 9);
    expect(seen[1]).toEqual([16, 1016]);
    expect(seen[2]).toEqual([50, 1116]); // clamped to 50 ms
  });

  it('start() after stop() resets the timestamp, so a hidden tab never catches up', () => {
    const r = fakeRaf();
    const dts: number[] = [];
    const loop = createLoop((dt) => (dts.push(dt), true), r.raf, r.caf);
    loop.start();
    r.frame(0);
    r.frame(16);
    loop.stop();
    loop.start();
    r.frame(60_000);
    expect(dts.at(-1)).toBeCloseTo(1000 / 60, 9);
  });

  it('idles when onFrame returns false and wake() runs exactly one more frame', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => (frames++, false), r.raf, r.caf);
    loop.start();
    r.frame(0);
    expect(r.pending).toBe(0); // idle: nothing scheduled
    expect(loop.running).toBe(true); // still running while idle
    loop.wake();
    loop.wake(); // a second wake before the frame does not double-schedule
    expect(r.pending).toBe(1);
    r.frame(16);
    r.frame(32);
    expect(frames).toBe(2);
  });

  it('wake() while stopped does nothing', () => {
    const r = fakeRaf();
    const loop = createLoop(() => true, r.raf, r.caf);
    loop.wake();
    expect(r.pending).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('stop() cancels the scheduled frame and running becomes false', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => (frames++, true), r.raf, r.caf);
    loop.start();
    expect(loop.running).toBe(true);
    loop.stop();
    expect(r.pending).toBe(0);
    r.frame(16);
    expect(frames).toBe(0);
    expect(loop.running).toBe(false);
  });

  it('stopping from inside onFrame schedules nothing more', () => {
    const r = fakeRaf();
    let frames = 0;
    const loop = createLoop(() => {
      frames++;
      loop.stop();
      return true;
    }, r.raf, r.caf);
    loop.start();
    r.frame(0);
    r.frame(16);
    expect(frames).toBe(1);
  });
});
```

`tests/lifecycle.test.ts` (`EventTarget` fakes for the window, document, canvas and media-query lists; a fake `ResizeObserver`; P8):
```ts
import { describe, expect, it } from 'vitest';
import { bindLifecycle, type LifecycleTarget } from '../src/lifecycle';

type Call = [keyof LifecycleTarget, ...unknown[]];

function recorder(): { t: LifecycleTarget; calls: Call[] } {
  const calls: Call[] = [];
  const t: LifecycleTarget = {
    pause: () => void calls.push(['pause']),
    resume: () => void calls.push(['resume']),
    resize: (box) => void calls.push(['resize', box]),
    dprChanged: () => void calls.push(['dprChanged']),
    reducedChanged: (r) => void calls.push(['reducedChanged', r]),
    contextLost: () => void calls.push(['contextLost']),
    contextRestored: () => void calls.push(['contextRestored']),
  };
  return { t, calls };
}

class FakeMql extends EventTarget {
  constructor(
    readonly media: string,
    public matches = false,
  ) {
    super();
  }
  listeners = 0;
  override addEventListener(type: string, cb: EventListenerOrEventListenerObject | null): void {
    this.listeners++;
    super.addEventListener(type, cb);
  }
  override removeEventListener(type: string, cb: EventListenerOrEventListenerObject | null): void {
    this.listeners--;
    super.removeEventListener(type, cb);
  }
}

class FakeResizeObserver {
  static last: FakeResizeObserver | null = null;
  static rejectBoxOption = false;
  observed: { target: unknown; options?: unknown }[] = [];
  disconnected = false;
  constructor(readonly cb: (entries: unknown[]) => void) {
    FakeResizeObserver.last = this;
  }
  observe(target: unknown, options?: { box?: string }): void {
    if (options && FakeResizeObserver.rejectBoxOption) throw new TypeError('unsupported box');
    this.observed.push({ target, options });
  }
  disconnect(): void {
    this.disconnected = true;
  }
}

function env(opts: { resizeObserver?: boolean } = {}) {
  const queries = new Map<string, FakeMql>();
  const win = Object.assign(new EventTarget(), {
    devicePixelRatio: 1,
    matchMedia: (q: string) => {
      const m = new FakeMql(q);
      queries.set(q, m);
      return m;
    },
    ResizeObserver: opts.resizeObserver === false ? undefined : FakeResizeObserver,
  });
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
  const canvas = new EventTarget();
  return {
    win,
    doc,
    canvas,
    queries,
    bound: { win: win as unknown as Window, doc: doc as unknown as Document, canvas: canvas as unknown as HTMLCanvasElement },
  };
}

const change = (matches: boolean): Event => Object.assign(new Event('change'), { matches });

describe('bindLifecycle (spec 3.6.3, 3.7)', () => {
  it('pauses when hidden and resumes when visible (3.7.3)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    e.doc.visibilityState = 'hidden';
    e.doc.dispatchEvent(new Event('visibilitychange'));
    e.doc.visibilityState = 'visible';
    e.doc.dispatchEvent(new Event('visibilitychange'));
    expect(calls).toEqual([['pause'], ['resume']]);
  });

  it('pauses on pagehide and resumes only on a persisted pageshow (3.7.5)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    e.win.dispatchEvent(new Event('pagehide'));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    expect(calls).toEqual([['pause'], ['resume']]);
  });

  it('prevents the default of webglcontextlost and reports loss and restore (3.6.3)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const lost = new Event('webglcontextlost', { cancelable: true });
    e.canvas.dispatchEvent(lost);
    e.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(lost.defaultPrevented).toBe(true);
    expect(calls).toEqual([['contextLost'], ['contextRestored']]);
  });

  it('reports reduced-motion changes (3.6.4)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const rm = e.queries.get('(prefers-reduced-motion: reduce)');
    rm?.dispatchEvent(change(true));
    rm?.dispatchEvent(change(false));
    expect(calls).toEqual([
      ['reducedChanged', true],
      ['reducedChanged', false],
    ]);
  });

  it('reports a DPR change and re-arms the resolution query with the new DPR (3.7.2)', () => {
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const first = e.queries.get('(resolution: 1dppx)');
    expect(first?.listeners).toBe(1);
    e.win.devicePixelRatio = 2;
    first?.dispatchEvent(change(false));
    expect(calls).toEqual([['dprChanged']]);
    expect(first?.listeners).toBe(0);
    const second = e.queries.get('(resolution: 2dppx)');
    expect(second?.listeners).toBe(1);
    second?.dispatchEvent(change(false));
    expect(calls).toEqual([['dprChanged'], ['dprChanged']]);
  });

  it('observes the canvas device-pixel-content-box and forwards devicePixelContentBoxSize (3.7.1)', () => {
    FakeResizeObserver.rejectBoxOption = false;
    const e = env();
    const { t, calls } = recorder();
    bindLifecycle(t, e.bound);
    const ro = FakeResizeObserver.last;
    expect(ro?.observed).toEqual([{ target: e.canvas, options: { box: 'device-pixel-content-box' } }]);
    ro?.cb([{ devicePixelContentBoxSize: [{ inlineSize: 1707, blockSize: 960 }] }]);
    ro?.cb([{}]); // Safari: no devicePixelContentBoxSize
    expect(calls).toEqual([
      ['resize', { w: 1707, h: 960 }],
      ['resize', null],
    ]);
  });

  it('falls back to a plain observe() when the box option is rejected', () => {
    FakeResizeObserver.rejectBoxOption = true;
    const e = env();
    bindLifecycle(recorder().t, e.bound);
    expect(FakeResizeObserver.last?.observed).toEqual([{ target: e.canvas, options: undefined }]);
    FakeResizeObserver.rejectBoxOption = false;
  });

  it('tolerates a missing ResizeObserver by listening to window resize', () => {
    const e = env({ resizeObserver: false });
    const { t, calls } = recorder();
    expect(() => bindLifecycle(t, e.bound)).not.toThrow();
    e.win.dispatchEvent(new Event('resize'));
    expect(calls).toEqual([['resize', null]]);
  });

  it('the returned function removes every listener and disconnects the observer', () => {
    const e = env();
    const { t, calls } = recorder();
    const unbind = bindLifecycle(t, e.bound);
    const ro = FakeResizeObserver.last;
    unbind();
    e.doc.dispatchEvent(new Event('visibilitychange'));
    e.win.dispatchEvent(new Event('pagehide'));
    e.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    e.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    e.canvas.dispatchEvent(new Event('webglcontextrestored'));
    e.queries.get('(prefers-reduced-motion: reduce)')?.dispatchEvent(change(true));
    expect(e.queries.get('(resolution: 1dppx)')?.listeners).toBe(0);
    expect(e.queries.get('(prefers-reduced-motion: reduce)')?.listeners).toBe(0);
    expect(ro?.disconnected).toBe(true);
    expect(calls).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/loop.test.ts tests/lifecycle.test.ts`
Expected:
```
 FAIL  tests/lifecycle.test.ts [ tests/lifecycle.test.ts ]
Error: Cannot find module '../src/lifecycle' imported from …/tests/lifecycle.test.ts
 FAIL  tests/loop.test.ts [ tests/loop.test.ts ]
Error: Cannot find module '../src/loop' imported from …/tests/loop.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

- [ ] **Step 3: Write `src/loop.ts` (spec 3.7.3, 3.7.4, 4.4.3, 6.1.5)**

```ts
import { clampDt } from './core/time';

export interface Loop { start(): void; stop(): void; wake(): void; readonly running: boolean }

/**
 * The rAF loop (spec 3.7.3, 3.7.4, 4.4.3). `onFrame(dt, now)` returns false to idle: no further frame is
 * requested until wake(). dt = clampDt(now - last), so a long gap costs at most 50 ms of sim time; start()
 * resets `last`, so the first frame after it gets clampDt(0) (one 60 fps frame). The rAF and cancel
 * functions default to the window's, looked up at call time.
 */
export function createLoop(
  onFrame: (dtMs: number, nowMs: number) => boolean,
  raf: (cb: FrameRequestCallback) => number = (cb) => requestAnimationFrame(cb),
  caf: (id: number) => void = (id) => cancelAnimationFrame(id),
): Loop {
  let running = false;
  let pending: number | null = null;
  let last: number | null = null;

  const tick = (now: number): void => {
    pending = null;
    if (!running) return;
    const dt = clampDt(last === null ? 0 : now - last);
    last = now;
    const more = onFrame(dt, now);
    if (more && running && pending === null) pending = raf(tick);
  };

  return {
    start() {
      if (running) return;
      running = true;
      last = null;
      if (pending === null) pending = raf(tick);
    },
    stop() {
      running = false;
      last = null;
      if (pending !== null) caf(pending);
      pending = null;
    },
    wake() {
      if (running && pending === null) pending = raf(tick);
    },
    get running() {
      return running;
    },
  };
}
```

- [ ] **Step 4: Write `src/lifecycle.ts` (spec 3.6.3, 3.7.1, 3.7.2, 3.7.3, 3.7.5; P2)**

Without a `ResizeObserver` the window `resize` event drives `resize(null)` (tolerated, never thrown). An engine that rejects the `device-pixel-content-box` option gets a plain `observe()`.
```ts
/** What the page lifecycle drives (spec 3.6.3, 3.7). `resize` carries devicePixelContentBoxSize when known (P2). */
export interface LifecycleTarget {
  pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void;
  reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
}

/**
 * Wires visibility, bfcache, context loss, reduced motion, DPR and size changes to `t`. Every browser API
 * comes from `env`, never from globals. Returns a function that removes every listener.
 */
export function bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void {
  const { win, doc, canvas } = env;
  const offs: (() => void)[] = [];
  const on = (target: EventTarget, type: string, fn: (e: Event) => void): void => {
    target.addEventListener(type, fn);
    offs.push(() => target.removeEventListener(type, fn));
  };

  // 3.7.3 visibility, 3.7.5 bfcache
  on(doc, 'visibilitychange', () => (doc.visibilityState === 'hidden' ? t.pause() : t.resume()));
  on(win, 'pagehide', () => t.pause());
  on(win, 'pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) t.resume();
  });

  // 3.6.3 context loss: preventDefault() is what allows a restore
  on(canvas, 'webglcontextlost', (e) => {
    e.preventDefault();
    t.contextLost();
  });
  on(canvas, 'webglcontextrestored', () => t.contextRestored());

  // 3.6.4 reduced motion turning on or off mid-session
  on(win.matchMedia('(prefers-reduced-motion: reduce)'), 'change', (e) => t.reducedChanged((e as MediaQueryListEvent).matches));

  // 3.7.2 DPR change without a size change: one resolution query, re-armed with the new DPR after each change
  let dprQuery: MediaQueryList | null = null;
  const onDpr = (): void => {
    arm();
    t.dprChanged();
  };
  const arm = (): void => {
    dprQuery?.removeEventListener('change', onDpr);
    dprQuery = win.matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDpr);
  };
  arm();
  offs.push(() => dprQuery?.removeEventListener('change', onDpr));

  // 3.7.1 size: a ResizeObserver on the canvas, device-pixel-content-box when the engine supports it
  const RO = (win as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  if (typeof RO === 'function') {
    const ro = new RO((entries) => {
      const box = entries[entries.length - 1]?.devicePixelContentBoxSize?.[0];
      t.resize(box ? { w: box.inlineSize, h: box.blockSize } : null);
    });
    try {
      ro.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      ro.observe(canvas);
    }
    offs.push(() => ro.disconnect());
  } else {
    on(win, 'resize', () => t.resize(null));
  }

  return () => {
    for (const off of offs.splice(0)) off();
  };
}
```

- [ ] **Step 5: Run the new tests to verify they pass**

Run: `npx vitest run tests/loop.test.ts tests/lifecycle.test.ts`
Expected:
```
 Test Files  2 passed (2)
      Tests  15 passed (15)
```
(loop 6, lifecycle 9.)

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  25 passed (25)`, `Tests  222 passed (222)` (Task 12 plus 2 files and 15 tests); typecheck prints no diagnostics; build succeeds with the Task 8 JS size.

- [ ] **Step 7: Commit**

```bash
git add src/loop.ts src/lifecycle.ts tests/loop.test.ts tests/lifecycle.test.ts
git commit -m "feat(core): frame loop and page lifecycle

rAF loop with clamped dt, idle and wake; lifecycle binding for
visibility, bfcache, context loss, reduced motion, DPR changes and a
device-pixel-content-box ResizeObserver, all read from injected
browser objects.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Shaders and the two-pass renderer

- **Files:** Create `src/shaders/fullscreen.vert`, `src/shaders/noise.glsl`, `src/shaders/surface.frag`, `src/shaders/dither.frag` (exactly Appendix A §3.3–§3.6, no `#version` in the files), `src/field/renderer.ts`, `tests/shaders.test.ts`.
- **Interfaces:**
  - Consumes: Task 12 `GL_ATTRIBUTES`, `createContext(canvas: Pick<HTMLCanvasElement, 'getContext'>, attrs?: WebGLContextAttributes): WebGL2RenderingContext | null`, `GLSL_HEADER_FRAG`, `GLSL_HEADER_VERT`, `ProgramHandle`, `PendingProgram`, `ShaderError`, `startProgram(gl: WebGL2RenderingContext, vert: string, frag: string, parallel: KHR_parallel_shader_compile | null): PendingProgram`, `SurfaceTarget`, `createSurfaceTarget(gl: WebGL2RenderingContext, cols: number, rows: number): SurfaceTarget`, `createMaskTexture(gl: WebGL2RenderingContext, w: number, h: number, plane: Uint8Array): WebGLTexture`, `createFullscreenTriangle(gl: WebGL2RenderingContext): { vao: WebGLVertexArrayObject; vbo: WebGLBuffer }`, `deleteSurfaceTarget(gl: WebGL2RenderingContext, t: SurfaceTarget): void`; Task 9 `FieldParams`, `Grid`; Task 11 `MaskPlane`; Task 8 `RGB`, `FieldColors`; Task 3 `NOISE_OFFSET`, `BAYER8` (test only).
  - Produces (`src/field/renderer.ts`):
    ```ts
    export const UNIFORMS_PASS1: readonly string[]; // uCell uZ uZm uCenter uBreath uPointer uWarp uRipples uRipple uMask uMaskSize uE uMaskMix uShape uLevel
    export const UNIFORMS_PASS2: readonly string[]; // uSurf uCellDev uCanvasH uField0 uField1 uField2 uField3 uTiers
    export type { FieldColors } from '../theme/theme'; // P1
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
      get gl(): WebGL2RenderingContext | null; // P4; null after dispose()
      readSurface(out: Uint8Array): boolean;   // P4; readPixels of the pass-1 target (cols × rows × 4 bytes, RGBA) after render(); false when not ready, lost or disposed
    }
    ```
  - Semantics: pass-1 texel `(i, j)` is `gl_FragCoord.xy` with row `j = 0` the top field row, so `readSurface` byte `(j × cols + i) × 4` is cell `(i, j)` with `.r = round(255 × v)`. `ready` polls both programs (inside an animation frame when the extension is absent), finishes them once, and on a `ShaderError` sets `failed`; `resize` sets `canvas.width/height`, recreates the target only when `cols` or `rows` change, sets the on-change uniforms, and sets `failed` when the FBO is incomplete; `setParams` writes `uWarp`, `uRipple.y`, `uMaskMix`, `uShape`, `uLevel`, `uTiers`; `setMask(null)` deletes the mask texture; `restore()` rebuilds programs, VAO, target and mask after `webglcontextrestored`.

- [ ] **Step 1: Write the failing test**

`tests/shaders.test.ts` (it reads the four shader files and checks them against `src/field/surface.ts` and the renderer's uniform lists; the hash check evaluates the GLSL `hash3` constants it parses with 32-bit unsigned arithmetic and compares bit for bit with Task 3's `hash3` on 1000 seeded triples, so it holds whatever formatting Task 3 used):
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import { DEFAULT_FIELD } from '../src/field/params';
import { UNIFORMS_PASS1, UNIFORMS_PASS2 } from '../src/field/renderer';
import { BAYER8, NOISE_OFFSET, hash3 } from '../src/field/surface';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const VERT = read('../src/shaders/fullscreen.vert');
const NOISE = read('../src/shaders/noise.glsl');
const SURFACE = read('../src/shaders/surface.frag');
const DITHER = read('../src/shaders/dither.frag');
const ALL = { 'fullscreen.vert': VERT, 'noise.glsl': NOISE, 'surface.frag': SURFACE, 'dither.frag': DITHER };

/** Uniform names in declaration order: `uniform <type> <name>[N];` */
const uniformsOf = (src: string): string[] => [...src.matchAll(/^uniform\s+\w+\s+(\w+)(?:\[\d+\])?\s*;/gm)].map((m) => m[1]);

describe('noise.glsl matches src/field/surface.ts (spec 3.3.5, Appendix A §3.4)', () => {
  it('uses the Blueprint hash constants, shifts and the 8-bit z mask', () => {
    for (const c of ['374761393u', '668265263u', '1013904223u', '1274126177u', 'h >> 13u', 'h >> 16u', 'c.z & 255u']) expect(NOISE).toContain(c);
  });

  it('the GLSL hash, evaluated with 32-bit unsigned arithmetic, is bit-exact with hash3 on 1000 seeded triples', () => {
    const body = /float hash3\(uvec3 c\) \{([\s\S]*?)\n\}/.exec(NOISE)?.[1] ?? '';
    const [kx, ky, kz, kh] = [...body.matchAll(/(\d+)u/g)].map((m) => Number(m[1])).filter((n) => n > 255);
    const [s1, s2] = [...body.matchAll(/>> (\d+)u/g)].map((m) => Number(m[1]));
    const mask = Number(/c\.z & (\d+)u/.exec(body)?.[1]);
    const glslHash = (x: number, y: number, z: number): number => {
      let h = (Math.imul(x, kx) ^ Math.imul(y, ky) ^ Math.imul(z & mask, kz)) >>> 0;
      h = Math.imul(h ^ (h >>> s1), kh) >>> 0;
      h = (h ^ (h >>> s2)) >>> 0;
      return h / 4294967296;
    };
    const rand = mulberry32(20261019);
    for (let n = 0; n < 1000; n++) {
      const x = Math.floor(rand() * 70000);
      const y = Math.floor(rand() * 70000);
      const z = Math.floor(rand() * 1000);
      expect(glslHash(x, y, z)).toBe(hash3(x, y, z));
    }
  });

  it('OFFSET = 256.0 equals NOISE_OFFSET', () => {
    expect(Number(/const float OFFSET = ([\d.]+);/.exec(NOISE)?.[1])).toBe(NOISE_OFFSET);
  });

  it('defines hash3, noise3 and fbm and declares no uniforms', () => {
    for (const fn of ['float hash3(uvec3 c)', 'float noise3(vec3 p)', 'float fbm(vec2 p, vec2 z)']) expect(NOISE).toContain(fn);
    expect(uniformsOf(NOISE)).toEqual([]);
  });
});

describe('dither.frag (spec 3.3.10, Appendix A §3.6)', () => {
  it('carries the BAYER8 matrix of surface.ts', () => {
    const literal = /int\[64\]\(([^)]*)\)/.exec(DITHER)?.[1] ?? '';
    expect(literal.split(',').map((s) => Number(s.trim()))).toEqual([...BAYER8]);
  });

  it('declares exactly UNIFORMS_PASS2', () => {
    expect(uniformsOf(DITHER)).toEqual([...UNIFORMS_PASS2]);
  });
});

describe('surface.frag (spec 3.3.4, 3.4.5, Appendix A §3.5)', () => {
  it('declares exactly UNIFORMS_PASS1', () => {
    expect(uniformsOf(SURFACE)).toEqual([...UNIFORMS_PASS1]);
  });

  it('has exactly one noise.glsl insertion marker', () => {
    expect(SURFACE.split('/* noise.glsl inserted here */')).toHaveLength(2);
  });

  it('every smoothstep has ascending edges (theta - w, theta + w with w = mask.edge > 0)', () => {
    const all = [...SURFACE.matchAll(/smoothstep\(/g)].length;
    const ascending = [...SURFACE.matchAll(/smoothstep\(\s*(\w+)\s*-\s*(\w+)\s*,\s*\1\s*\+\s*\2\s*,/g)];
    expect(all).toBeGreaterThan(0);
    expect(ascending).toHaveLength(all);
    expect(SURFACE).toContain('float w = uMaskMix.z;');
    expect(DEFAULT_FIELD.mask.edge).toBeGreaterThan(0);
  });
});

describe('all four shader files (spec 4.5.8)', () => {
  it.each(Object.entries(ALL))('%s has no #version line (program.ts prepends the header) and no pow()', (_name, src) => {
    expect(src).not.toContain('#version');
    expect(src).not.toMatch(/\bpow\s*\(/);
  });

  it('the vertex shader reads attribute 0 as aPos', () => {
    expect(VERT).toContain('layout(location = 0) in vec2 aPos;');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/shaders.test.ts`
Expected:
```
 FAIL  tests/shaders.test.ts [ tests/shaders.test.ts ]
Error: Cannot find module '../src/field/renderer' imported from …/tests/shaders.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

- [ ] **Step 3: Write the four shader files, exactly Appendix A §3.3–§3.6 (spec 3.3.4, 3.3.5, 3.3.10, 3.4.5, 4.5.1, 4.5.3, 4.5.4, 4.5.8)**

No `#version` or `precision` lines: `startProgram` prepends `GLSL_HEADER_VERT` / `GLSL_HEADER_FRAG` (Task 12). `surface.frag` keeps Appendix A's `/* noise.glsl inserted here */` line; the renderer replaces it with `noise.glsl` (4.5.3: header + uniform block + noise + body). The files end with a newline.

`src/shaders/fullscreen.vert` (§3.3):
```glsl
layout(location = 0) in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
```

`src/shaders/noise.glsl` (§3.4):
```glsl
const float OFFSET = 256.0;

// Blueprint hash (part-c.html) with z masked to 8 bits so the noise is periodic in z (period 256).
float hash3(uvec3 c) {
  uint h = (c.x * 374761393u) ^ (c.y * 668265263u) ^ ((c.z & 255u) * 1013904223u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  return float(h) * (1.0 / 4294967296.0);
}

// Blueprint noise3: trilinear value noise with a smoothstep fade. p.xy >= 0 (OFFSET), p.z in [0, 256).
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  f = f * f * (3.0 - 2.0 * f);
  uvec3 c = uvec3(i);
  float c000 = hash3(c);
  float c100 = hash3(c + uvec3(1u, 0u, 0u));
  float c010 = hash3(c + uvec3(0u, 1u, 0u));
  float c110 = hash3(c + uvec3(1u, 1u, 0u));
  float c001 = hash3(c + uvec3(0u, 0u, 1u));
  float c101 = hash3(c + uvec3(1u, 0u, 1u));
  float c011 = hash3(c + uvec3(0u, 1u, 1u));
  float c111 = hash3(c + uvec3(1u, 1u, 1u));
  return mix(mix(mix(c000, c100, f.x), mix(c010, c110, f.x), f.y),
             mix(mix(c001, c101, f.x), mix(c011, c111, f.x), f.y), f.z);
}

// Blueprint fbm: two octaves; z.x = z, z.y = the Blueprint's z * 1.4 + 3.1, both wrapped to [0, 256) on the CPU.
float fbm(vec2 p, vec2 z) {
  return 0.62 * noise3(vec3(p, z.x)) + 0.38 * noise3(vec3(p * 2.1 + vec2(7.3, 1.7), z.y));
}
```

`src/shaders/surface.frag` (§3.5, pass 1; the uniform values are spec 10.2 / Appendix A §3.7 and arrive from the renderer):
```glsl
uniform float uCell;        // CSS px per cell
uniform vec4  uZ;           // flowZ[0..3]: warp-x fbm (z, z2), warp-y fbm (z, z2)
uniform vec2  uZm;          // flowZ[4..5]: main fbm (z, z2)
uniform vec2  uCenter;      // field centre, CSS px (breath origin)
uniform float uBreath;      // domain scale, 1 +- breath amplitude
uniform vec4  uPointer;     // xy = eased pointer (CSS px, field space), z = radius R (CSS px), w = strength 0..1
uniform vec2  uWarp;        // x = warp factor (0.55), y = brightness boost (0.12)
uniform vec4  uRipples[8];  // xy = origin (CSS px), z = ring radius (CSS px), w = amplitude (0 = slot unused)
uniform vec2  uRipple;      // x = ring sigma (CSS px), y = gain (0.9)
uniform sampler2D uMask;    // R8 coverage of the name / egg text, LINEAR, CLAMP_TO_EDGE
uniform vec2  uMaskSize;    // CSS px covered by the mask texture
uniform float uE;           // mask progress 0..1 (0 = field only)
uniform vec4  uMaskMix;     // x = hold dim (0.3), y = ink floor (0.91), z = dissolve edge (0.08), w = melt px (48)
uniform vec3  uShape;       // x = warp scale px (240), y = main scale px (160), z = warp amplitude (2.6)
uniform vec2  uLevel;       // x = level (0.3), y = gain (2.1)

out vec4 outColor;

/* noise.glsl inserted here */

// Blueprint vAt(), raster + dither branch, at CSS-px sample s. warp returns (wx, wy) - 0.5 for the mask melt.
float surface(vec2 s, out vec2 warp) {
  vec2 a = s / uShape.x + OFFSET;
  float wx = fbm(a + vec2(3.1, 0.0), uZ.xy);
  float wy = fbm(a + vec2(0.0, 7.7), uZ.zw);
  warp = vec2(wx, wy) - 0.5;
  float v = fbm(s / uShape.y + OFFSET + warp * uShape.z, uZm);
  v = clamp((v - uLevel.x) * uLevel.y, 0.0, 1.0);
  return min(1.0, v * 0.7 + 0.4 * (1.0 - abs(1.0 - 2.0 * v)) * v);
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);                 // texel (i, j); row j = 0 is the top row of the field
  vec2 x = (vec2(cell) + 0.5) * uCell;                 // cell centre, CSS px, y down

  // pointer repel (Blueprint drawRaster): the sample point moves toward the pointer, so the surface spreads away
  vec2 xw = x;
  float f = 0.0;
  vec2 dp = x - uPointer.xy;
  float d = length(dp);
  if (uPointer.w > 0.0 && d < uPointer.z) {
    f = 1.0 - d / uPointer.z;
    f = f * f * (3.0 - 2.0 * f) * uPointer.w;
    xw = x - (dp / max(d, 1e-3)) * (f * uPointer.z * uWarp.x);
  }
  vec2 s = uCenter + (xw - uCenter) / uBreath;          // breath: slow domain zoom about the centre

  vec2 warp;
  float F = surface(s, warp);
  float v = F;

  if (uE > 0.0) {
    // dissolve: each cell flips between field and text at its own static noise threshold
    float theta = 0.6 * noise3(vec3(vec2(cell) * 0.08 + OFFSET, 17.0)) + 0.4 * hash3(uvec3(uvec2(cell), 91u));
    float w = uMaskMix.z;
    float k = smoothstep(theta - w, theta + w, uE * (1.0 + 2.0 * w) - w);
    float g = 1.0 - uE;
    float m = texture(uMask, (s + warp * (2.0 * uMaskMix.w * g * g)) / uMaskSize).r;
    float n = mix(uMaskMix.x * F, uMaskMix.y + (1.0 - uMaskMix.y) * F, m);
    v = mix(F, n, k);
  }

  v += f * uWarp.y;                                    // pointer brightness boost
  for (int r = 0; r < 8; r++) {                        // Shockwave rings
    vec4 R = uRipples[r];
    if (R.w <= 0.0) continue;
    float e = length(xw - R.xy) - R.z;
    v += exp(-(e * e) / (2.0 * uRipple.x * uRipple.x)) * R.w * uRipple.y;
  }
  outColor = vec4(min(v, 1.0), 0.0, 0.0, 1.0);
}
```

`src/shaders/dither.frag` (§3.6, pass 2):
```glsl
uniform sampler2D uSurf;    // pass-1 output, one texel per cell, .r = v
uniform float uCellDev;     // device px per cell (an integer value)
uniform float uCanvasH;     // drawing-buffer height, device px
uniform vec3  uField0;      // field-0 (off)
uniform vec3  uField1;      // field-1 (on, v <= uTiers.x)
uniform vec3  uField2;      // field-2 (on, uTiers.x < v <= uTiers.y)
uniform vec3  uField3;      // field-3 (on, v > uTiers.y)
uniform vec2  uTiers;       // 0.66, 0.9

out vec4 outColor;

const int BAYER8[64] = int[64](
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21);

void main() {
  ivec2 cell = ivec2(int(gl_FragCoord.x / uCellDev), int((uCanvasH - gl_FragCoord.y) / uCellDev));
  float v = texelFetch(uSurf, cell, 0).r;
  float th = (float(BAYER8[(cell.x & 7) | ((cell.y & 7) << 3)]) + 0.5) / 64.0;
  vec3 c = uField0;
  if (v > th) c = v > uTiers.y ? uField3 : (v > uTiers.x ? uField2 : uField1);
  outColor = vec4(c, 1.0);
}
```

- [ ] **Step 4: Write `src/field/renderer.ts` (spec 4.5, 3.3.12, 3.6.2, 3.6.3, 3.7.1, 3.7.8; P1, P4)**

What the code relies on, beyond the index: a 1 × 1 zero R8 texture stays bound on unit 1 while no mask exists, so pass 1's sampler never points at an empty unit; `uE` is uploaded as 0 while no mask is uploaded; the mask's CSS extent (`uMaskSize`) is fixed when `setMask` runs, so after a resize the old mask keeps its old extent until it is re-rasterised (3.7.1); `KHR_parallel_shader_compile` is fetched again on every (re)build, because extensions do not survive a context loss (without that, `ready` polls an unknown enum forever after `restore()`; found and fixed in the writer's browser run). The on-change uniforms (`uCell`, `uCellDev`, `uCanvasH` after a resize; `uWarp`, `uMaskMix`, `uShape`, `uLevel`, `uTiers` after `setParams`) are written in the next `render()`; `uRipple` is `(f.rippleSigma, params.ripple.gain)` every frame.
```ts
import { createContext } from '../gl/context';
import { startProgram, type PendingProgram, type ProgramHandle } from '../gl/program';
import { createFullscreenTriangle, createMaskTexture, createSurfaceTarget, deleteSurfaceTarget, type SurfaceTarget } from '../gl/targets';
import ditherFrag from '../shaders/dither.frag?raw';
import fullscreenVert from '../shaders/fullscreen.vert?raw';
import noiseGlsl from '../shaders/noise.glsl?raw';
import surfaceFrag from '../shaders/surface.frag?raw';
import type { FieldColors, RGB } from '../theme/theme';
import type { MaskPlane } from './nameMask';
import type { FieldParams } from './params';
import type { Grid } from './sizing';

export type { FieldColors } from '../theme/theme'; // P1

/** Pass-1 uniforms in declaration order (Appendix A §3.5, spec 10.2). */
export const UNIFORMS_PASS1: readonly string[] = Object.freeze([
  'uCell', 'uZ', 'uZm', 'uCenter', 'uBreath', 'uPointer', 'uWarp', 'uRipples', 'uRipple', 'uMask', 'uMaskSize', 'uE', 'uMaskMix', 'uShape', 'uLevel',
]);
/** Pass-2 uniforms in declaration order (Appendix A §3.6, spec 10.2). */
export const UNIFORMS_PASS2: readonly string[] = Object.freeze(['uSurf', 'uCellDev', 'uCanvasH', 'uField0', 'uField1', 'uField2', 'uField3', 'uTiers']);

/** Everything one frame uploads (spec 4.4.3 step 4). Field-space CSS px; `ripples` is 8 × vec4. */
export interface FrameInputs {
  z: Float32Array; breath: number; center: [number, number];
  pointer: { x: number; y: number; radius: number; strength: number };
  ripples: Float32Array; rippleSigma: number; maskE: number; colors: FieldColors;
}

const NOISE_MARKER = '/* noise.glsl inserted here */';
/** Spec 4.5.3: the uniform block, then noise.glsl, then the body; startProgram prepends GLSL_HEADER_FRAG. */
const PASS1_SOURCE = surfaceFrag.replace(NOISE_MARKER, noiseGlsl);
const EMPTY_MASK = new Uint8Array(1);

type Uniforms = Readonly<Record<string, WebGLUniformLocation>>;

/**
 * Owns every GL object of the field and draws it in two passes (spec 4.5): pass 1 evaluates one texel per cell
 * into the surface target, pass 2 dithers it to device pixels. Exactly two drawArrays(TRIANGLES, 0, 3) per render.
 */
export class DitherRenderer {
  private readonly canvas: HTMLCanvasElement;
  private glc: WebGL2RenderingContext | null;
  private params: FieldParams;
  private parallel: KHR_parallel_shader_compile | null = null;
  private pending: [PendingProgram, PendingProgram] | null = null;
  private p1: ProgramHandle | null = null;
  private p2: ProgramHandle | null = null;
  private tri: { vao: WebGLVertexArrayObject; vbo: WebGLBuffer } | null = null;
  private target: SurfaceTarget | null = null;
  private mask: WebGLTexture | null = null;
  private emptyMask: WebGLTexture | null = null;
  private maskPlane: MaskPlane | null = null;
  private maskSize: [number, number] = [1, 1];
  private gridValue: Grid | null = null;
  private gridDirty = true;
  private paramsDirty = true;
  private isReady = false;
  private isFailed = false;

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, params: FieldParams) {
    this.canvas = canvas;
    this.glc = gl;
    this.params = params;
    this.build(gl);
  }

  /** Context, triangle, empty mask and both programs started (async when the extension exists). Null on any failure. */
  static create(canvas: HTMLCanvasElement, params: FieldParams): DitherRenderer | null {
    try {
      const gl = createContext(canvas);
      return gl ? new DitherRenderer(canvas, gl, params) : null;
    } catch {
      return null;
    }
  }

  /**
   * Polls both programs and finishes them once (call it inside an animation frame: without
   * KHR_parallel_shader_compile, finish() blocks on the link). A ShaderError sets `failed`.
   */
  get ready(): boolean {
    if (this.isReady) return true;
    const gl = this.glc;
    if (this.isFailed || !gl || !this.pending || gl.isContextLost()) return false;
    const [a, b] = this.pending;
    if (!a.ready() || !b.ready()) return false;
    try {
      this.p1 = a.finish();
      this.p2 = b.finish();
    } catch {
      this.isFailed = true;
      return false;
    }
    this.pending = null;
    gl.useProgram(this.p1.program);
    gl.uniform1i(this.u1().uMask ?? null, 1); // pass 1 samples unit 1 only
    gl.useProgram(this.p2.program);
    gl.uniform1i(this.u2().uSurf ?? null, 0); // pass 2 samples unit 0 only
    this.gridDirty = true;
    this.paramsDirty = true;
    this.isReady = true;
    return true;
  }

  get failed(): boolean {
    return this.isFailed;
  }

  get lost(): boolean {
    return this.glc !== null && this.glc.isContextLost();
  }

  /** P4: the context for debug hooks; null after dispose(). */
  get gl(): WebGL2RenderingContext | null {
    return this.glc;
  }

  /** Spec 3.7.8: paints the drawing buffer one colour (field-0) before the first real frame. */
  clear(c: RGB): void {
    const gl = this.glc;
    if (!gl || gl.isContextLost()) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(c[0], c[1], c[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Spec 3.7.1: backing store = the device box; the surface target is recreated only when cols or rows change. */
  resize(grid: Grid): void {
    const gl = this.glc;
    if (!gl) return;
    if (this.canvas.width !== grid.widthDev) this.canvas.width = grid.widthDev;
    if (this.canvas.height !== grid.heightDev) this.canvas.height = grid.heightDev;
    this.gridValue = grid;
    this.gridDirty = true;
    if (gl.isContextLost() || (this.target && this.target.cols === grid.cols && this.target.rows === grid.rows)) return;
    if (this.target) deleteSurfaceTarget(gl, this.target);
    this.target = null;
    try {
      this.target = createSurfaceTarget(gl, grid.cols, grid.rows);
    } catch {
      this.isFailed = true; // 4.5.2: an incomplete FBO is the fallback
    }
  }

  /** Uploads (or with null deletes) the mask; its CSS extent is fixed to the grid it was rasterised for (3.7.1). */
  setMask(plane: MaskPlane | null): void {
    const gl = this.glc;
    this.maskPlane = plane;
    if (!gl) return;
    if (this.mask) gl.deleteTexture(this.mask);
    this.mask = null;
    if (!plane) return;
    const g = this.gridValue;
    const ss = this.params.mask.supersample;
    this.maskSize = g ? [(plane.width * g.cellCss) / ss, (plane.height * g.cellCss) / ss] : [plane.width, plane.height];
    if (gl.isContextLost()) return;
    this.mask = createMaskTexture(gl, plane.width, plane.height, plane.data);
  }

  /** Spec 4.5.5 "on change" uniforms: uWarp, uRipple.y, uMaskMix, uShape, uLevel, uTiers. */
  setParams(p: FieldParams): void {
    this.params = p;
    this.paramsDirty = true;
  }

  /** One frame: pass 1 into the surface target, pass 2 to the canvas. A no-op until ready, or while lost. */
  render(f: FrameInputs): void {
    const gl = this.glc;
    if (!gl || !this.ready || gl.isContextLost() || !this.target || !this.gridValue || !this.tri || !this.p1 || !this.p2) return;
    const g = this.gridValue;
    const u1 = this.u1();
    const u2 = this.u2();
    gl.bindVertexArray(this.tri.vao);

    // pass 1: one texel per cell (Appendix A §3.5)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.target.fbo);
    gl.viewport(0, 0, this.target.cols, this.target.rows);
    gl.useProgram(this.p1.program);
    if (this.gridDirty) {
      gl.uniform1f(u1.uCell ?? null, g.cellCss);
      gl.useProgram(this.p2.program);
      gl.uniform1f(u2.uCellDev ?? null, g.cellDev);
      gl.uniform1f(u2.uCanvasH ?? null, g.heightDev);
      gl.useProgram(this.p1.program);
      this.gridDirty = false;
    }
    if (this.paramsDirty) {
      this.writeParams(gl, u1, u2);
      this.paramsDirty = false;
    }
    gl.uniform4f(u1.uZ ?? null, f.z[0], f.z[1], f.z[2], f.z[3]);
    gl.uniform2f(u1.uZm ?? null, f.z[4], f.z[5]);
    gl.uniform2f(u1.uCenter ?? null, f.center[0], f.center[1]);
    gl.uniform1f(u1.uBreath ?? null, f.breath);
    gl.uniform4f(u1.uPointer ?? null, f.pointer.x, f.pointer.y, f.pointer.radius, f.pointer.strength);
    gl.uniform4fv(u1.uRipples ?? null, f.ripples);
    gl.uniform2f(u1.uRipple ?? null, f.rippleSigma, this.params.ripple.gain);
    gl.uniform2f(u1.uMaskSize ?? null, this.maskSize[0], this.maskSize[1]);
    gl.uniform1f(u1.uE ?? null, this.mask ? f.maskE : 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.mask ?? this.emptyMask);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // pass 2: Bayer 8 x 8 tiers to device pixels (Appendix A §3.6)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, g.widthDev, g.heightDev);
    gl.useProgram(this.p2.program);
    gl.uniform3f(u2.uField0 ?? null, f.colors.f0[0], f.colors.f0[1], f.colors.f0[2]);
    gl.uniform3f(u2.uField1 ?? null, f.colors.f1[0], f.colors.f1[1], f.colors.f1[2]);
    gl.uniform3f(u2.uField2 ?? null, f.colors.f2[0], f.colors.f2[1], f.colors.f2[2]);
    gl.uniform3f(u2.uField3 ?? null, f.colors.f3[0], f.colors.f3[1], f.colors.f3[2]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.target.tex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  /** P4: reads the pass-1 target (cols × rows × 4 bytes, row j = 0 first); false when not ready, lost or disposed. */
  readSurface(out: Uint8Array): boolean {
    const gl = this.glc;
    const t = this.target;
    if (!gl || !this.isReady || gl.isContextLost() || !t || out.length < t.cols * t.rows * 4) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    gl.readPixels(0, 0, t.cols, t.rows, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return true;
  }

  /** After webglcontextrestored (3.6.3): rebuilds programs, triangle, target and mask. `ready` must be polled again. */
  restore(): boolean {
    const gl = this.glc;
    if (!gl || gl.isContextLost()) return false;
    this.p1 = null;
    this.p2 = null;
    this.target = null;
    this.mask = null;
    this.isReady = false;
    this.isFailed = false;
    try {
      this.build(gl);
      if (this.gridValue) this.target = createSurfaceTarget(gl, this.gridValue.cols, this.gridValue.rows);
      if (this.maskPlane) this.mask = createMaskTexture(gl, this.maskPlane.width, this.maskPlane.height, this.maskPlane.data);
    } catch {
      this.isFailed = true;
      return false;
    }
    this.gridDirty = true;
    this.paramsDirty = true;
    return true;
  }

  /** Deletes every GL object; the renderer is inert afterwards and `gl` is null. */
  dispose(): void {
    const gl = this.glc;
    if (!gl) return;
    this.glc = null;
    this.isReady = false;
    if (gl.isContextLost()) return;
    if (this.p1) gl.deleteProgram(this.p1.program);
    if (this.p2) gl.deleteProgram(this.p2.program);
    if (this.target) deleteSurfaceTarget(gl, this.target);
    if (this.mask) gl.deleteTexture(this.mask);
    if (this.emptyMask) gl.deleteTexture(this.emptyMask);
    if (this.tri) {
      gl.deleteVertexArray(this.tri.vao);
      gl.deleteBuffer(this.tri.vbo);
    }
    this.p1 = this.p2 = null;
    this.target = null;
    this.mask = this.emptyMask = null;
    this.tri = null;
  }

  private build(gl: WebGL2RenderingContext): void {
    // extensions do not survive a context loss: enable it again on every (re)build
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    this.tri = createFullscreenTriangle(gl);
    // a 1 x 1 zero mask keeps texture unit 1 bound while no name is shown (no "no texture bound" render warning)
    this.emptyMask = createMaskTexture(gl, 1, 1, EMPTY_MASK);
    this.pending = [startProgram(gl, fullscreenVert, PASS1_SOURCE, this.parallel), startProgram(gl, fullscreenVert, ditherFrag, this.parallel)];
  }

  private writeParams(gl: WebGL2RenderingContext, u1: Uniforms, u2: Uniforms): void {
    const p = this.params;
    gl.uniform2f(u1.uWarp ?? null, p.pointer.warpK, p.pointer.boost);
    gl.uniform4f(u1.uMaskMix ?? null, p.mask.holdDim, p.mask.ink, p.mask.edge, p.mask.meltPx);
    gl.uniform3f(u1.uShape ?? null, p.shape.warpScalePx, p.shape.mainScalePx, p.shape.warpAmp);
    gl.uniform2f(u1.uLevel ?? null, p.shape.level, p.shape.gain);
    if (this.p2) {
      gl.useProgram(this.p2.program);
      gl.uniform2f(u2.uTiers ?? null, p.tiers.t2, p.tiers.t3);
      if (this.p1) gl.useProgram(this.p1.program);
    }
  }

  private u1(): Uniforms {
    return this.p1?.uniforms ?? {};
  }

  private u2(): Uniforms {
    return this.p2?.uniforms ?? {};
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/shaders.test.ts`
Expected:
```
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  26 passed (26)`, `Tests  236 passed (236)` (Task 13 plus 1 file and 14 tests); typecheck prints no diagnostics (the `?raw` imports are typed by `vite/client`); build succeeds with the Task 8 JS size (the renderer is not imported by `main.ts` yet).

- [ ] **Step 7: Browser evidence: both programs compile and link in Chrome**

Start the dev server with the Bash tool's `run_in_background`: `npm run dev` (it prints `Local:   http://localhost:5173/`; use the port it prints). Load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__select_page`.

1. `new_page` `http://localhost:5173/?noentry` with `isolatedContext: "t14"`. Always pass this page's `pageId` (other agents may have pages open).
2. `evaluate_script` (waitForStableDom false):
```js
async () => {
  const { DitherRenderer } = await import('/src/field/renderer.ts');
  const { DEFAULT_FIELD, cloneField } = await import('/src/field/params.ts');
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const r = DitherRenderer.create(canvas, cloneField(DEFAULT_FIELD));
  if (!r) return { created: false };
  let frames = 0;
  while (!r.ready && !r.failed && frames < 300) { await new Promise((res) => requestAnimationFrame(res)); frames++; }
  const out = { created: true, ready: r.ready, failed: r.failed, frames };
  r.dispose();
  return out;
}
```
Expected: `{ "created": true, "ready": true, "failed": false, "frames": 3 }` (frames is small; the writer measured 3).
3. Only if `failed` is true, get the driver log and stop the task with it:
```js
async () => {
  const { startProgram, ShaderError } = await import('/src/gl/program.ts');
  const vert = (await import('/src/shaders/fullscreen.vert?raw')).default;
  const noise = (await import('/src/shaders/noise.glsl?raw')).default;
  const surface = (await import('/src/shaders/surface.frag?raw')).default;
  const dither = (await import('/src/shaders/dither.frag?raw')).default;
  const gl = document.createElement('canvas').getContext('webgl2');
  const logs = {};
  for (const [name, frag] of [['pass1', surface.replace('/* noise.glsl inserted here */', noise)], ['pass2', dither]]) {
    try { startProgram(gl, vert, frag, null).finish(); logs[name] = 'ok'; } catch (e) { logs[name] = e instanceof ShaderError ? e.log : String(e); }
  }
  return logs;
}
```
Expected on a healthy build: `{ "pass1": "ok", "pass2": "ok" }`.
4. `list_console_messages` with `types: ["error", "warn"]` → `<no console messages found>`.
5. `close_page`; stop the dev server (the background Bash task) and kill any leftover `vite` node child (PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parsanaji.com*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm:$false }`).

Record `ready`, `failed`, `frames` and the clean console in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-14-report.md`.

- [ ] **Step 8: Commit**

```bash
git add src/shaders/fullscreen.vert src/shaders/noise.glsl src/shaders/surface.frag src/shaders/dither.frag src/field/renderer.ts tests/shaders.test.ts
git commit -m "feat(field): Blueprint dither shaders and the two-pass renderer

GLSL exactly Appendix A §3.3-§3.6: pass 1 evaluates the warped fbm
surface, pointer repel, breath, rings and the name mask per cell into
an RGBA8 target; pass 2 dithers it with Bayer 8x8 into four colour
tiers. Two drawArrays per frame; restore() rebuilds after context loss.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: App: the live field

- **Files:** Create `src/app.ts`, `src/debugHooks.ts`, `tests/appColors.test.ts`; Modify `src/main.ts` (slice-2 boot, below), `src/vite-env.d.ts` (`interface ImportMetaEnv { readonly VITE_PN_DEBUG?: string }`).
- **Interfaces:**
  - Consumes: Task 14 `DitherRenderer` (all members above), `FrameInputs`, `UNIFORMS_PASS1`; Task 13 `createLoop(onFrame: (dtMs: number, nowMs: number) => boolean, raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void): Loop`, `Loop`, `LifecycleTarget`, `bindLifecycle(t: LifecycleTarget, env: { win: Window; doc: Document; canvas: HTMLCanvasElement }): () => void`; Task 10 `PointerModel`, `PointerKind`, `RipplePool`; Task 9 `FieldParams`, `DEFAULT_FIELD`, `cloneField(p: FieldParams): FieldParams`, `Grid`, `cellCssFor(fieldCssW: number, p: FieldParams['cell'], density: Density, degrade?: number): number`, `computeGrid(cssW: number, cssH: number, dprRaw: number, cellCss: number, deviceBox?: { w: number; h: number } | null): Grid`, `latticeSpacing(fieldCssW: number): number`, `pointerRadius(fieldCssW: number, fieldCssH: number, p: FieldParams['pointer']): number`, `effectiveIntensity(p: Pick<FieldParams, 'intensity' | 'flowSpeed'>): number`, `breathScale(tMs: number, amp: number, periodMs: number): number`; Task 8 `RGB`, `FieldColors`, `ColorTween`, `initTheme`, and the slice-1 `main.ts`; Task 3 `flowZ(tSec: number, intensity: number, out?: Float32Array): Float32Array`, `surface(xCss: number, yCss: number, z: ArrayLike<number>, s?: SurfaceShape): number`, `tierOf(v: number, i: number, j: number, t2?: number, t3?: number): 0 | 1 | 2 | 3` (debug hooks); Task 1 `FpsProbe`, `seedFromLocation(search: string, fallback?: () => number): number`.
  - Produces (`src/app.ts`, public):
    ```ts
    export interface AppOptions {
      canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
      entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
    }
    export interface AppDebug {                          // P4
      readonly renderer: DitherRenderer;
      readonly params: FieldParams;
      lastFrame(): FrameInputs | null;                   // inputs of the last render
      setFrozen(frozen: boolean): void;                  // freezes sim time and τ (panel "freeze time")
    }
    export class App implements LifecycleTarget {
      static start(o: AppOptions): App | null;
      setColors(c: FieldColors, animate: boolean): void; // 300 ms ColorTween when animate, started at the next frame's timestamp (A3) from the colours on screen (A15)
      konami(): void;                                    // P11: no-op until Task 20
      replayEntry(): void;                               // P11: no-op until Task 18
      applyParams(): void;                               // debug panel live update (regrid when cell or density changed)
      onFallback(fn: () => void): void;
      get grid(): Grid | null;                           // debug hook
      debug(): AppDebug;                                 // P4
      dispose(): void;
      pause(): void; resume(): void; resize(deviceBox?: { w: number; h: number } | null): void; dprChanged(): void;
      reducedChanged(r: boolean): void; contextLost(): void; contextRestored(): void;
    }
    ```
  - Produces (`src/app.ts` internals at the end of slice 2; names binding for Tasks 18–20, which replace or extend them):
    - `private constructor(o: AppOptions, renderer: DitherRenderer)` (only `App.start` constructs).
    - Fields: `o: AppOptions`; `params: FieldParams` (`=== o.params`, mutated by the panel); `renderer: DitherRenderer`; `loop: Loop` (`createLoop((dt, now) => this.frame(dt, now))`); `pointer: PointerModel`; `ripples: RipplePool`; `tween: ColorTween` (`set(o.colors)` at start); `probe: FpsProbe | null`; `gridValue: Grid | null`; `rect: { left: number; top: number; width: number; height: number }`; `simMs: number`; `tau: number`; `frozen: boolean`; `reduced: boolean` (`o.reduced`, updated by `reducedChanged`; no other effect until Task 19); `degrade: number` (1, or `params.cell.degradeK`); `programsReady: boolean`; `firstFrameMs: number | null`; `restoreTimer: ReturnType<typeof setTimeout> | null`; `disposed: boolean`; `fallbackFns: (() => void)[]`; `unbinds: (() => void)[]`; `zBuf: Float32Array` (6); `rippleBuf: Float32Array` (32); `last: FrameInputs | null`; `pendingColors: FieldColors | null` (Index amendment A3: the colours a `setColors(c, true)` hands to the next frame, whose timestamp starts the tween). Private helpers no later hunk touches: `measure()` (caches `rect` from `getBoundingClientRect()`), `armRestore()` (the 3000 ms restore timer), `bindPointer()` (the window pointer listeners), and the module constants `NO_RIPPLE` (the 3.3.8 selector) and `kindOf` (`PointerEvent` → `PointerKind`).
    - `private frame(dtMs: number, nowMs: number): boolean` — 4.4.3 order: advance `simMs` and `tau` (`+= dt / 1000 × effectiveIntensity(params)`) unless frozen; `pointer.tick`; `ripples.write(simMs / 1000, sp, rippleBuf)`; `e = this.stepMask(dt, visible)`; `colors = tween.sample(nowMs)`; `renderer.render(…)` with `z: flowZ(tau, 1, zBuf)`, `breath: breathScale(simMs, …)`, `center: [w / 2, h / 2]`, `pointer.radius = pointerRadius(…) × (1 + velRadiusGain × velFactor)`, `rippleSigma: sigmaSp × sp`; probe push; returns `!this.idle()`. Before `programsReady` it polls `renderer.ready`, calls `fail()` on `renderer.failed` or 3000 ms (`params.boot.readyTimeoutMs`) after `firstFrameMs`, and calls `onProgramsReady()` once ready.
    - `private stepMask(_dtMs: number, _visible: boolean): number` — returns 0; the underscores keep `noUnusedParameters` quiet until Task 18 replaces the method (Task 18 drives the entry and Konami machines).
    - `private onProgramsReady(): void` — sets `data-field-ready` on `<html>` and starts the FPS probe (Task 18 adds the entry branch; Task 19 skips the probe under reduced motion).
    - `private idle(): boolean` — returns `false` (Task 19 implements the 3.6.4 idle condition).
    - `private regrid(deviceBox?: { w: number; h: number } | null): void` — measures the canvas box, `cellCssFor` × `degrade`, `computeGrid`, `renderer.resize`, caches `rect` (Task 18 adds the 150 ms mask re-raster debounce).
    - `private spawnAllowed(e: PointerEvent): boolean` — 3.3.8 rules: `isPrimary`, `button === 0`, target not inside `a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]`, point inside `rect` (Task 19 adds "not reduced").
    - `private fail(): void` — once: stop the loop, run `unbinds`, `renderer.dispose()`, call every `fallbackFns` entry.
  - Produces (`src/debugHooks.ts`, P4):
    ```ts
    export interface ParityReport { maxErr255: number; tierMismatchPct: number; cells: number }
    export interface GpuTimeReport { medianMs: number; p90Ms: number; frames: number }
    export interface PnHooks {
      parity(): ParityReport | null;                          // null when the renderer is not ready
      gpuTime(frames: number): Promise<GpuTimeReport | null>; // null without EXT_disjoint_timer_query_webgl2; samples until `frames` results (at most 3 × frames tries)
      grid(): Grid | null;
    }
    export function installDebugHooks(app: App, win: Window): PnHooks; // sets win.__pn and returns it
    ```
    `parity()` renders one frame from `lastFrame()` with `breath: 1`, pointer strength 0, zeroed ripples and `maskE: 0`, reads it with `readSurface`, and compares each cell with `surface((i + 0.5) × cellCss, (j + 0.5) × cellCss, z, params.shape)` and `tierOf` at `params.tiers`.
  - Produces (`src/main.ts` after Task 15, extended by Task 16; names and order binding for slice 3):
    1. Imports add `App` from `./app`, `seedFromLocation` from `./core/prng`, `DEFAULT_FIELD` and `cloneField` from `./field/params`.
    2. `const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';`
    3. `devWarn`, `safeStorage`, `takeEntryControl(doc: Document): boolean` unchanged from Task 8.
    4. `function applyFallback(doc: Document, reason: string): void` — `devWarn(`static fallback: ${reason}`)` then the Task 8 DOM changes. Reasons: `'nowebgl'`, `'forced-colors'`, `'no-canvas'`, `'no-webgl2'`, `'field'`, `'boot'`.
    5. `async function boot(): Promise<void>`, in order: `doc`, `win`, `query = new URLSearchParams(win.location.search)`, `params = cloneField(DEFAULT_FIELD)`, `let app: App | null = null` → the Task 8 links, email copy (now with `holdMs: params.copy.holdMs`) and clock statements → `const theme = initTheme({ …, onChange: (colors, animate) => app?.setColors(colors, animate) })` → `const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches` → `const entry = takeEntryControl(doc)` → field gate (4.7.3): `?nowebgl`, then `(forced-colors: active)`, then a missing `canvas[data-field]`, each → `applyFallback` and return → [Task 16: the `?debug` tweaks import] → `app = App.start({ canvas, params, reduced, seed: seedFromLocation(win.location.search), colors: theme.colors, entry, rail: doc.querySelector<HTMLElement>('[data-rail]'), scrim: doc.querySelector<HTMLElement>('.scrim'), doc, win })` → `null` → `applyFallback(doc, 'no-webgl2')` and return → `app.onFallback(() => { app = null; applyFallback(doc, 'field'); })` → `if (PN_DEBUG) { const { installDebugHooks } = await import('./debugHooks'); if (app) installDebugHooks(app, win); }` → [Task 16: `mountTweaks?.(app)`].
    6. Top level: `boot().catch((error: unknown) => { devWarn(String(error)); applyFallback(document, 'boot'); });`

One unit test pins the crossfade interruption (spec 3.2.6 as amended, Index amendment A15); the rest of `App` is browser-verified. The order is: types, the failing test, `App`, debug hooks, `main.ts`, the passing test, gate, browser evidence, commit.

- [ ] **Step 1: Declare `VITE_PN_DEBUG` (spec 4.1.6)**

Replace `src/vite-env.d.ts` with:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** '1' on preview builds (CI on every branch except main, spec 7.3.2): debug hooks and the ?debug panel */
  readonly VITE_PN_DEBUG?: string;
}
```

- [ ] **Step 2: Write the failing crossfade test (spec 3.2.6, 4.6.6; Index amendments A3, A15)**

A press inside the 300 ms crossfade must behave like an interrupted CSS transition: `setColors(c, true)` starts a new 300 ms tween on the next frame (A3), from the colours on screen at that frame, never from the previous target. `ColorTween.start` (Task 8) samples the current colours; this test pins that `App` hands the press to it at the next frame's timestamp.

`tests/appColors.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { App, type AppOptions } from '../src/app';
import { DEFAULT_FIELD, cloneField } from '../src/field/params';
import type { FrameInputs } from '../src/field/renderer';
import type { FieldColors, RGB } from '../src/theme/theme';

/** Four equal field colours with every channel at v, so one channel tells the whole interpolation. */
const solid = (v: number): FieldColors => {
  const c: RGB = [v, v, v];
  return { f0: c, f1: c, f2: c, f3: c };
};

/**
 * Only App.start builds an App, and it needs WebGL2, which Node lacks. The test calls the private constructor with a
 * fake renderer that records the colours of every render, and drives the private frame() with chosen timestamps.
 */
function harness(start: FieldColors) {
  const rendered: FieldColors[] = [];
  const renderer = {
    ready: true,
    failed: false,
    lost: false,
    render: (f: FrameInputs) => void rendered.push(f.colors),
    resize: () => {},
    clear: () => {},
    setMask: () => {},
    setParams: () => {},
    restore: () => true,
    dispose: () => {},
  };
  const doc = { documentElement: { setAttribute: () => {}, removeAttribute: () => {}, hasAttribute: () => false }, visibilityState: 'visible' };
  const win = { requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, devicePixelRatio: 1, performance: { now: () => 0 } };
  const o = { canvas: {}, params: cloneField(DEFAULT_FIELD), reduced: false, seed: 1, colors: start, entry: false, rail: null, scrim: null, doc, win } as unknown as AppOptions;
  const Ctor = App as unknown as new (o: AppOptions, renderer: unknown) => App;
  const app = new Ctor(o, renderer);
  const frame = (nowMs: number): void => {
    (app as unknown as { frame(dtMs: number, nowMs: number): boolean }).frame(16, nowMs);
  };
  return { app, frame, last: (): FieldColors => rendered[rendered.length - 1] };
}

describe('App.setColors crossfade (spec 3.2.6, 4.6.6; Index amendments A3, A15)', () => {
  it('starts on the next frame, and a press mid-fade restarts 300 ms from the colours on screen, like an interrupted CSS transition', () => {
    const h = harness(solid(0));
    h.frame(0); // the first frame only stamps the readiness clock
    h.frame(1000); // programs ready: the first render
    expect(h.last()).toEqual(solid(0));
    h.app.setColors(solid(1), true); // the press; the tween waits for the next frame (A3)
    h.frame(1016); // the tween starts at this frame's timestamp
    expect(h.last().f0[0]).toBeCloseTo(0, 12);
    h.frame(1166); // halfway through the first fade
    expect(h.last().f0[0]).toBeCloseTo(0.5, 12);
    h.app.setColors(solid(0), true); // a second press inside the fade
    h.frame(1196); // 180 ms into the first fade: the new tween starts from 0.6, not from the previous target 1
    expect(h.last().f0[0]).toBeCloseTo(0.6, 12);
    h.frame(1346); // 150 ms into the new 300 ms tween: halfway from 0.6 back to 0
    expect(h.last().f0[0]).toBeCloseTo(0.3, 12);
    h.frame(1496); // 300 ms after it started
    expect(h.last()).toEqual(solid(0));
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/appColors.test.ts`
Expected: FAIL, ` FAIL  tests/appColors.test.ts [ tests/appColors.test.ts ]` with `Error: Cannot find module '../src/app' imported from …/tests/appColors.test.ts`, then `Test Files  1 failed (1)` and `Tests  no tests`.

- [ ] **Step 4: Write `src/app.ts` (spec 4.4, 4.7.4 steps 1, 2, 5, 7, 3.3.7.6, 3.3.7.7, 3.3.8, 3.6.2, 3.6.3, 3.7.1–3.7.9, 4.6.6; P3, P4, P11; Index amendment A3)**

The internals carry the index names (`frame`, `stepMask`, `onProgramsReady`, `idle`, `regrid`, `spawnAllowed`, `fail` and the listed fields), so the slice-3 hunks apply. Points a reviewer checks: the first animation frame only stamps `firstFrameMs`, so the first program-status query runs in the frame after first paint (4.7.4 step 5, risk 9.6: it blocks on the link where `KHR_parallel_shader_compile` is missing), and the readiness timeout counts from that first frame (3.4.3, 11.8); a frame that throws calls `fail()` instead of surfacing an uncaught error (R14 console rule); `contextLost` arms the 3000 ms restore timer and a bfcache `resume()` with a lost context waits on it (3.7.5); a press re-measures the canvas rect, because a phone's URL bar moves the fixed band without resizing it (3.3.7.7); `idle()` returns false outside reduced motion, and Task 19 adds the settled condition.
```ts
import { FpsProbe } from './core/quality';
import { breathScale, effectiveIntensity } from './field/flow';
import type { FieldParams } from './field/params';
import { PointerModel, type PointerKind } from './field/pointer';
import { DitherRenderer, type FrameInputs } from './field/renderer';
import { RipplePool } from './field/ripples';
import { cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
import { flowZ } from './field/surface';
import { bindLifecycle, type LifecycleTarget } from './lifecycle';
import { createLoop, type Loop } from './loop';
import { ColorTween, type FieldColors } from './theme/theme';

export interface AppOptions {
  canvas: HTMLCanvasElement; params: FieldParams; reduced: boolean; seed: number; colors: FieldColors;
  entry: boolean; rail: HTMLElement | null; scrim: HTMLElement | null; doc: Document; win: Window;
}

/** P4: what the debug hooks and the panel reach; it exists in every build but only PN_DEBUG code calls it. */
export interface AppDebug {
  readonly renderer: DitherRenderer;
  readonly params: FieldParams;
  lastFrame(): FrameInputs | null; // inputs of the last render
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
}

/** Spec 3.3.8: a press on any of these never spawns a ring (11.26: nor one inside a dialog). */
const NO_RIPPLE = 'a, button, [role="button"], input, textarea, select, dialog, [data-no-ripple]';

const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');

/** Owns the field: renderer, models, loop and lifecycle (spec 4.2, 4.4, 4.7.4). Only App.start constructs it. */
export class App implements LifecycleTarget {
  private readonly o: AppOptions;
  private readonly params: FieldParams;
  private readonly renderer: DitherRenderer;
  private readonly loop: Loop;
  private readonly pointer: PointerModel;
  private readonly ripples: RipplePool;
  private readonly tween: ColorTween;
  private probe: FpsProbe | null = null;
  private gridValue: Grid | null = null;
  private rect = { left: 0, top: 0, width: 0, height: 0 };
  private simMs = 0;
  private tau = 0;
  private frozen = false;
  private reduced: boolean;
  private degrade = 1;
  private programsReady = false;
  private firstFrameMs: number | null = null;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly fallbackFns: (() => void)[] = [];
  private unbinds: (() => void)[] = [];
  private readonly zBuf = new Float32Array(6);
  private readonly rippleBuf = new Float32Array(32);
  private last: FrameInputs | null = null;
  private pendingColors: FieldColors | null = null;

  private constructor(o: AppOptions, renderer: DitherRenderer) {
    this.o = o;
    this.params = o.params;
    this.renderer = renderer;
    this.reduced = o.reduced;
    this.loop = createLoop(
      (dt, now) => this.frame(dt, now),
      (cb) => o.win.requestAnimationFrame(cb),
      (id) => o.win.cancelAnimationFrame(id),
    );
    this.pointer = new PointerModel(o.params.pointer);
    this.ripples = new RipplePool(o.params.ripple);
    this.tween = new ColorTween(o.params.theme.crossfadeMs);
    this.tween.set(o.colors);
  }

  /** Spec 4.7.4 steps 1, 2 and 7: renderer, first clear, lifecycle, pointer listeners, loop. Null = no field. */
  static start(o: AppOptions): App | null {
    const renderer = DitherRenderer.create(o.canvas, o.params);
    if (!renderer) return null;
    try {
      const app = new App(o, renderer);
      app.regrid();
      renderer.clear(o.colors.f0); // 3.7.8: never a black alpha:false canvas
      app.unbinds.push(bindLifecycle(app, { win: o.win, doc: o.doc, canvas: o.canvas })); // P3
      app.bindPointer();
      app.loop.start();
      return app;
    } catch {
      renderer.dispose();
      return null;
    }
  }

  /**
   * Spec 3.2.6, 4.6.6: a 300 ms linear ColorTween when animated, else an instant switch. The tween starts at the next
   * frame's timestamp, the moment the CSS transition of the same toggle starts, so field-0 and --bg move in step (A3).
   * A press inside a running crossfade acts like an interrupted CSS transition: the new 300 ms tween starts from the
   * colours on screen at that frame (ColorTween.start samples them), never from the previous target (A15).
   */
  setColors(c: FieldColors, animate: boolean): void {
    if (this.disposed) return;
    if (animate) this.pendingColors = c;
    else {
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
  }

  /** P11: ignored until Task 20 adds the Konami machine. */
  konami(): void {}

  /** P11: ignored until Task 18 adds the entry. */
  replayEntry(): void {}

  /** Debug panel live update: params object -> uniforms, then regrid (cell and density changes take effect). */
  applyParams(): void {
    if (this.disposed) return;
    this.renderer.setParams(this.params);
    this.regrid();
    this.loop.wake();
  }

  /** Called once if the field fails after start (compile or link error, timeout, lost context, FBO). */
  onFallback(fn: () => void): void {
    this.fallbackFns.push(fn);
  }

  get grid(): Grid | null {
    return this.gridValue;
  }

  debug(): AppDebug {
    return {
      renderer: this.renderer,
      params: this.params,
      lastFrame: () => this.last,
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.loop.stop();
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    for (const unbind of this.unbinds.splice(0)) unbind();
    this.renderer.dispose();
  }

  // ---- LifecycleTarget (spec 3.6.3, 3.7) ----

  pause(): void {
    this.loop.stop();
  }

  resume(): void {
    if (this.disposed) return;
    if (this.renderer.lost) {
      this.armRestore(); // 3.7.5: a bfcache restore with a lost context waits for webglcontextrestored
      return;
    }
    if (this.o.doc.visibilityState === 'visible') this.loop.start();
  }

  resize(deviceBox?: { w: number; h: number } | null): void {
    if (this.disposed) return;
    this.regrid(deviceBox);
    this.loop.wake();
  }

  dprChanged(): void {
    this.resize(null);
  }

  /** Task 19 adds the reduced-motion behaviour; slice 2 only tracks the flag. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
  }

  contextLost(): void {
    if (this.disposed) return;
    this.loop.stop();
    this.armRestore();
  }

  contextRestored(): void {
    if (this.disposed) return;
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    if (!this.renderer.restore()) {
      this.fail();
      return;
    }
    this.regrid();
    this.renderer.clear(this.tween.sample(this.o.win.performance.now()).f0);
    this.resume();
  }

  // ---- internals (names binding for Tasks 18-20) ----

  /** Spec 4.4.3, in order. Returns false to idle (never in slice 2). */
  private frame(dtMs: number, nowMs: number): boolean {
    if (this.disposed) return false;
    try {
      if (this.firstFrameMs === null) {
        // 4.7.4 step 5, risk 9.6: the first status query waits for the frame after first paint (it blocks
        // on the link where KHR_parallel_shader_compile is missing); this frame only starts the 3000 ms count
        this.firstFrameMs = nowMs;
        return true;
      }
      if (this.renderer.failed) {
        this.fail();
        return false;
      }
      if (!this.programsReady) {
        if (!this.renderer.ready) {
          // 3.4.3: the 3000 ms count starts at the first animation frame, so a hidden tab never times out unseen
          if (this.renderer.failed || nowMs - this.firstFrameMs >= this.params.boot.readyTimeoutMs) this.fail();
          return !this.disposed;
        }
        this.programsReady = true;
        this.onProgramsReady();
      }
      if (!this.frozen) {
        this.simMs += dtMs;
        this.tau += (dtMs / 1000) * effectiveIntensity(this.params);
      }
      this.pointer.tick(dtMs);
      const w = this.rect.width;
      const h = this.rect.height;
      const sp = latticeSpacing(w);
      this.ripples.write(this.simMs / 1000, sp, this.rippleBuf);
      const e = this.stepMask(dtMs, this.o.doc.visibilityState === 'visible');
      if (this.pendingColors) {
        this.tween.start(this.pendingColors, nowMs);
        this.pendingColors = null;
      }
      const colors = this.tween.sample(nowMs);
      const p = this.params;
      const inputs: FrameInputs = {
        z: flowZ(this.tau, 1, this.zBuf),
        breath: breathScale(this.simMs, p.breath.amp, p.breath.periodMs),
        center: [w / 2, h / 2],
        pointer: {
          x: this.pointer.x,
          y: this.pointer.y,
          radius: pointerRadius(w, h, p.pointer) * (1 + p.pointer.velRadiusGain * this.pointer.velFactor),
          strength: this.pointer.strength,
        },
        ripples: this.rippleBuf,
        rippleSigma: p.ripple.sigmaSp * sp,
        maskE: e,
        colors,
      };
      this.renderer.render(inputs);
      this.last = inputs;
      if (this.renderer.failed) {
        this.fail();
        return false;
      }
      if (this.probe && !this.probe.done && this.probe.push(dtMs) === 'degrade') {
        this.degrade = p.cell.degradeK; // 3.7.9: once per session
        this.regrid();
      }
      return !this.idle();
    } catch {
      this.fail(); // a throwing frame never reaches the console as an uncaught error
      return false;
    }
  }

  /** Mask progress e; Task 18 drives the entry and Konami machines here. */
  private stepMask(_dtMs: number, _visible: boolean): number {
    return 0;
  }

  /** The first real frame (3.4.7.1): show the canvas and start the FPS probe (3.7.9, 11.30). */
  private onProgramsReady(): void {
    this.o.doc.documentElement.setAttribute('data-field-ready', '');
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }

  /** Spec 4.4.3 step 6: only reduced motion renders on demand; Task 19 adds the 3.6.4 settled condition. */
  private idle(): boolean {
    if (!this.reduced) return false;
    return false;
  }

  /** Spec 3.7.1: measure the canvas box, size the grid, resize the backing store and target, cache the rect. */
  private regrid(deviceBox?: { w: number; h: number } | null): void {
    const r = this.measure();
    const cellCss = cellCssFor(r.width, this.params.cell, this.params.density, this.degrade);
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
  }

  /** Caches the canvas rect (3.3.7.7). A press re-measures too: a phone's URL bar moves the fixed band without resizing it. */
  private measure(): { left: number; top: number; width: number; height: number } {
    const r = this.o.canvas.getBoundingClientRect();
    this.rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    return this.rect;
  }

  /** Spec 3.3.8: primary button, outside interactive elements and dialogs, inside the canvas rect (11.26). */
  private spawnAllowed(e: PointerEvent): boolean {
    if (!e.isPrimary || e.button !== 0) return false;
    const target = e.target as Element | null;
    if (target && typeof target.closest === 'function' && target.closest(NO_RIPPLE)) return false;
    const x = e.clientX - this.rect.left;
    const y = e.clientY - this.rect.top;
    return x >= 0 && y >= 0 && x < this.rect.width && y < this.rect.height;
  }

  /** Once: stop, unbind, dispose every GL object, then tell main.ts (3.6.2). */
  private fail(): void {
    if (this.disposed) return;
    this.dispose();
    for (const fn of this.fallbackFns) fn();
  }

  private armRestore(): void {
    if (this.restoreTimer !== null) return;
    this.restoreTimer = setTimeout(() => {
      this.restoreTimer = null;
      this.fail(); // 3.6.3: no restore within 3000 ms
    }, this.params.boot.restoreTimeoutMs);
  }

  /** Spec 3.3.7.6-3.3.7.7: passive window listeners in field space; release on touch up, cancel, leave and blur. */
  private bindPointer(): void {
    const { win, doc } = this.o;
    const opts: AddEventListenerOptions = { passive: true };
    const at = (e: PointerEvent): [number, number] => [e.clientX - this.rect.left, e.clientY - this.rect.top];
    const onMove = (e: PointerEvent): void => {
      const [x, y] = at(e);
      this.pointer.move(x, y, kindOf(e));
      this.loop.wake();
    };
    const onDown = (e: PointerEvent): void => {
      this.measure();
      const [x, y] = at(e);
      this.pointer.down(x, y, kindOf(e));
      if (this.spawnAllowed(e)) this.ripples.spawn(x, y, this.simMs / 1000);
      this.loop.wake();
    };
    const onUp = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') this.pointer.release();
      this.loop.wake();
    };
    const onRelease = (): void => {
      this.pointer.release();
      this.loop.wake();
    };
    win.addEventListener('pointermove', onMove, opts);
    win.addEventListener('pointerdown', onDown, opts);
    win.addEventListener('pointerup', onUp, opts);
    win.addEventListener('pointercancel', onRelease, opts);
    win.addEventListener('blur', onRelease);
    doc.documentElement.addEventListener('pointerleave', onRelease, opts);
    this.unbinds.push(() => {
      win.removeEventListener('pointermove', onMove);
      win.removeEventListener('pointerdown', onDown);
      win.removeEventListener('pointerup', onUp);
      win.removeEventListener('pointercancel', onRelease);
      win.removeEventListener('blur', onRelease);
      doc.documentElement.removeEventListener('pointerleave', onRelease);
    });
  }
}
```

- [ ] **Step 5: Write `src/debugHooks.ts` (spec 4.7.5, 8.2.2, 8.2.3, 6.1.13; P4)**

`parity()` renders the bare surface (breath 1, strength 0, no rings, `maskE` 0) and compares each pass-1 texel with `surface()` at the same `z` buffer (float32, as uploaded) and with `tierOf` at the live tiers.
```ts
// P4: window.__pn (spec 4.7.5). Loaded only by a dynamic import behind PN_DEBUG, so production never carries it.
import type { App } from './app';
import type { FrameInputs } from './field/renderer';
import type { Grid } from './field/sizing';
import { surface, tierOf } from './field/surface';

export interface ParityReport { maxErr255: number; tierMismatchPct: number; cells: number }
export interface GpuTimeReport { medianMs: number; p90Ms: number; frames: number }
export interface PnHooks {
  parity(): ParityReport | null; // null when the renderer is not ready
  gpuTime(frames: number): Promise<GpuTimeReport | null>; // null without EXT_disjoint_timer_query_webgl2
  grid(): Grid | null;
}

/** EXT_disjoint_timer_query_webgl2 is not in lib.dom: the two enums this file uses. */
interface TimerQueryExt { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }

/** Spec 8.2.2 / 8.2.3 / 6.1.13: GPU-vs-TS parity, GPU time and the grid, as `window.__pn`. */
export function installDebugHooks(app: App, win: Window): PnHooks {
  const hooks: PnHooks = {
    parity() {
      const d = app.debug();
      const grid = app.grid;
      const last = d.lastFrame();
      if (!grid || !last || !d.renderer.ready) return null;
      // the bare surface F: breath 1, no pointer, no rings, no mask (what surface() computes)
      const frame: FrameInputs = { ...last, breath: 1, pointer: { ...last.pointer, strength: 0 }, ripples: new Float32Array(32), maskE: 0 };
      d.renderer.render(frame);
      const px = new Uint8Array(grid.cols * grid.rows * 4);
      if (!d.renderer.readSurface(px)) return null;
      const { t2, t3 } = d.params.tiers;
      let maxErr = 0;
      let mismatch = 0;
      for (let j = 0; j < grid.rows; j++) {
        for (let i = 0; i < grid.cols; i++) {
          const gpu = px[(j * grid.cols + i) * 4] / 255;
          const cpu = surface((i + 0.5) * grid.cellCss, (j + 0.5) * grid.cellCss, frame.z, d.params.shape);
          maxErr = Math.max(maxErr, Math.abs(gpu - cpu));
          if (tierOf(gpu, i, j, t2, t3) !== tierOf(cpu, i, j, t2, t3)) mismatch++;
        }
      }
      const cells = grid.cols * grid.rows;
      return { maxErr255: maxErr * 255, tierMismatchPct: (100 * mismatch) / cells, cells };
    },

    async gpuTime(frames) {
      const d = app.debug();
      const gl = d.renderer.gl;
      if (!gl || !d.renderer.ready) return null;
      const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerQueryExt | null;
      if (!ext) return null;
      const nextFrame = (): Promise<void> => new Promise((resolve) => win.requestAnimationFrame(() => resolve()));
      const times: number[] = [];
      // a query can come back unavailable or disjoint: keep sampling until `frames` results (at most 3 x frames tries)
      for (let attempt = 0; times.length < frames && attempt < frames * 3; attempt++) {
        const inputs = d.lastFrame();
        if (!inputs || !d.renderer.ready) break;
        const query = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
        d.renderer.render(inputs);
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        await nextFrame();
        await nextFrame();
        const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) === true;
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) === true;
        if (available && !disjoint) times.push(Number(gl.getQueryParameter(query, gl.QUERY_RESULT)) / 1e6);
        gl.deleteQuery(query);
      }
      if (times.length === 0) return null;
      times.sort((a, b) => a - b);
      return { medianMs: times[times.length >> 1], p90Ms: times[Math.min(times.length - 1, Math.floor(times.length * 0.9))], frames: times.length };
    },

    grid: () => app.grid,
  };
  (win as Window & { __pn?: PnHooks }).__pn = hooks;
  return hooks;
}
```

- [ ] **Step 6: Replace `src/main.ts` with the slice-2 boot (spec 4.7.1, 4.7.3, 4.7.4, 4.7.6, 3.6.2; index "Produces (`src/main.ts` after Task 15)")**

Full file `src/main.ts`. It is the Task 8 file (Task 8 Step 6) with exactly these changes, so a reviewer can diff the two: the header comment; the imports of `App`, `seedFromLocation`, `DEFAULT_FIELD` and `cloneField`; `PN_DEBUG`; `applyFallback(doc, reason)` with its DEV warning and new doc comment; `async boot()` with `query`, `params` and `let app` first, `holdMs: params.copy.holdMs` in the email copy, `onChange` forwarding to `app?.setColors`, then `reduced`, `entry` and the field gate, `App.start`, `onFallback` and the debug hooks; Task 8's trailing `applyFallback(doc); // no field until Task 15` and its top-level `try`/`catch` are replaced by the `boot().catch(…)` line. `devWarn`, `safeStorage`, `takeEntryControl` and the clock statements keep Task 8's text and comments byte for byte (Tasks 18, 21 and 22 anchor their hunks on them).
```ts
// Boot orchestration (spec 4.7): the rail's DOM modules and the theme, then the field gate (4.7.3) and the App (4.7.4).
import { App } from './app';
import { CONTENT } from './content';
import { seedFromLocation } from './core/prng';
import { DEFAULT_FIELD, cloneField } from './field/params';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';

/** Spec 4.12.1: true on the dev server and preview builds, false (and folded away) in production. */
const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';

/** One console.warn per failure on the dev server; production logs nothing at warn or error level (4.7.6). */
function devWarn(message: string): void {
  if (import.meta.env.DEV) console.warn(`[pn] ${message}`);
}

/** localStorage, or null where reading it throws (blocked storage counts as "system", 3.5.10). */
function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** Spec 3.6.2: no field; the rail shows at once. One DEV warning per failure, nothing in production. */
function applyFallback(doc: Document, reason: string): void {
  devWarn(`static fallback: ${reason}`);
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}

async function boot(): Promise<void> {
  const doc = document;
  const win = window;
  const query = new URLSearchParams(win.location.search);
  const params = cloneField(DEFAULT_FIELD);
  let app: App | null = null;
  initLinks(CONTENT.links.linkedin, doc);
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') });
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  const theme = initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entry = takeEntryControl(doc);

  // 4.7.3 field gate
  if (query.has('nowebgl')) {
    applyFallback(doc, 'nowebgl');
    return;
  }
  if (win.matchMedia('(forced-colors: active)').matches) {
    applyFallback(doc, 'forced-colors');
    return;
  }
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  app = App.start({
    canvas,
    params,
    reduced,
    seed: seedFromLocation(win.location.search),
    colors: theme.colors,
    entry,
    rail: doc.querySelector<HTMLElement>('[data-rail]'),
    scrim: doc.querySelector<HTMLElement>('.scrim'),
    doc,
    win,
  });
  if (!app) {
    applyFallback(doc, 'no-webgl2');
    return;
  }
  app.onFallback(() => {
    app = null;
    applyFallback(doc, 'field');
  });
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
}

boot().catch((error: unknown) => {
  devWarn(String(error));
  applyFallback(document, 'boot');
});
```

- [ ] **Step 7: Run the crossfade test to verify it passes**

Run: `npx vitest run tests/appColors.test.ts`
Expected: PASS, `Test Files  1 passed (1)`, `Tests  1 passed (1)` (the assembler ran it against the App of every state from Task 15 to Task 22; it fails if `ColorTween.start` began from the previous target).

- [ ] **Step 8: Full gate and production bundle check**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  27 passed (27)`, `Tests  237 passed (237)` (Task 14's 26 files and 236 tests plus `tests/appColors.test.ts`); typecheck prints no diagnostics; the build prints one `dist/assets/index-*.js` (no `debugHooks-*.js`: `PN_DEBUG` folds to `false` with `VITE_PN_DEBUG` unset). Then:
```bash
grep -c "__pn\|parity\|gpuTime" dist/assets/*.js
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
```
Expected: `0` for every file; a gzip total far under the 60 KB budget (the assembler's scratch build of this exact Task 15 state measured 12.2 KB; record the real number). `VITE_PN_DEBUG=1 npx vite build` additionally emits `dist/assets/debugHooks-*.js` (about 1.5 kB); run `npm run build` again afterwards so `dist/` is the production build.

- [ ] **Step 9: Browser evidence (spec 8.2.2, 8.2.3, 8.2.5, 8.2.7–8.2.10, 8.3)**

Load the `frontend-design` skill first (Skill `frontend-design:frontend-design`, Execution Notes) and judge the screenshots against the Blueprint Dither look (Appendix A `shot-idle-dark.png`). Start `npm run dev` with the Bash tool's `run_in_background` (it prints `Local:   http://localhost:5173/`; use the port it prints) and load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__select_page`. Evidence directory `E` = `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-15\` (create it: `mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-15`). Use a fresh `new_page` with its own `isolatedContext` for each numbered check, pass its `pageId` on every call, and `close_page` it at the end of the check. URLs are `http://localhost:5173/` unless stated. Expected values in brackets are what the writer measured on the owner's PC (RTX 2080 SUPER, 165 Hz display) with this exact code.

1. **First frame, parity, GPU time (8.2.2, 6.1.13).** `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, then `navigate_page` `type: "reload"`. `evaluate_script`:
   ```js
   async () => { await new Promise((r) => setTimeout(r, 1000)); const h = document.documentElement; return { cls: h.className, ready: h.hasAttribute('data-field-ready'), entry: h.getAttribute('data-entry'), grid: window.__pn.grid(), parity: window.__pn.parity(), gpu: await window.__pn.gpuTime(60) }; }
   ```
   Expected: `cls` `""`, `ready` true, `entry` null (P9: no entry yet), `grid` = `{ dpr: 1, widthDev: 1440, heightDev: 900, cellDev: 5, cellCss: 5, cols: 288, rows: 180, maskW: 576, maskH: 360 }`; `parity.maxErr255` ≤ 3 [0.56–0.58] and `parity.tierMismatchPct` ≤ 0.5 [0.15–0.30], `cells` 51840; `gpu.medianMs` ≤ 2 [0.036–0.059], `gpu.frames` 60. `take_screenshot` → `E\1440x900-dark.png`.
2. **Two draws per frame (6.1.3, 8.2.3).** `navigate_page` `type: "url"`, `url: "http://localhost:5173/"` with `initScript`:
   ```js
   (() => { const proto = WebGL2RenderingContext.prototype; const draw = proto.drawArrays; let n = 0; window.__draws = []; proto.drawArrays = function (...a) { n++; return draw.apply(this, a); }; const tick = () => { window.__draws.push(n); n = 0; if (window.__draws.length < 2000) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })();
   ```
   Wait 6 s inside `evaluate_script`, then: `async () => { await new Promise((r) => setTimeout(r, 6000)); const d = window.__draws.slice(-300); const hist = {}; for (const n of d) hist[n] = (hist[n] ?? 0) + 1; return { frames: d.length, hist }; }`. Expected: `{ "frames": 300, "hist": { "2": 300 } }` (only the frames before the programs were ready have 0 draws, and they are older than the last 300).
3. **Frame interval under pointer movement (6.1.12, 8.2.3).** Same page, `evaluate_script`:
   ```js
   async () => {
     const dts = []; let last = null; const t0 = performance.now();
     await new Promise((resolve) => {
       const step = (now) => {
         if (last !== null) dts.push(now - last);
         last = now;
         const a = ((now - t0) / 1000) * 2;
         window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1000 + 250 * Math.cos(a), clientY: 450 + 250 * Math.sin(a), pointerType: 'mouse', isPrimary: true, bubbles: true }));
         if (now - t0 < 10000) requestAnimationFrame(step); else resolve();
       };
       requestAnimationFrame(step);
     });
     return { frames: dts.length, meanMs: dts.reduce((s, v) => s + v, 0) / dts.length, maxMs: Math.max(...dts) };
   }
   ```
   Expected: `meanMs` ≤ 16.7 [6.06 at 165 Hz, 1650 frames]. Record `maxMs`.
4. **Repel and Shockwave (3.3.7, 3.3.8, 11.26).** Same page. Rings render as field-3, which the idle field never reaches (3.3.10), so counting `#e8eeff` pixels proves them:
   ```js
   async () => {
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const field3 = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(1440 * 900 * 4); gl.readPixels(0, 0, 1440, 900, gl.RGBA, gl.UNSIGNED_BYTE, px); let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] === 232 && px[i + 1] === 238 && px[i + 2] === 255) n++; resolve(n); }));
     const down = (x, y, target) => target.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true }));
     const before = await field3();
     down(80, 165, document.querySelector('[data-link="github"]'));
     await new Promise((r) => setTimeout(r, 500));
     const afterLink = await field3();
     down(1100, 450, document.querySelector('canvas[data-field]'));
     await new Promise((r) => setTimeout(r, 500));
     return { before, afterLink, afterField: await field3() };
   }
   ```
   Expected: `before` 0, `afterLink` 0 (a press on a link never spawns a ring), `afterField` > 0 [116400]. Screenshots: the MCP screenshot arrives seconds after a call, longer than a ring lives, so keep rings coming while it is taken: `evaluate_script` `() => { window.dispatchEvent(new PointerEvent('pointermove', { clientX: 1100, clientY: 450, pointerType: 'mouse', isPrimary: true, bubbles: true })); return true; }`, then `take_screenshot` → `E\1440x900-dark-repel.png` (the repel lens around (1100, 450)); then `evaluate_script` `() => { window.__rings = setInterval(() => document.querySelector('canvas[data-field]').dispatchEvent(new PointerEvent('pointerdown', { clientX: 1100, clientY: 450, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true })), 300); return true; }`, `take_screenshot` → `E\1440x900-dark-ring.png`, then `evaluate_script` `() => { clearInterval(window.__rings); return true; }`.
5. **Theme crossfade, field part (8.2.5, 4.6.6, Index amendment A3).** Fresh page, `emulate` `1440x900x1` dark, reload, then (the field's off cells are the most frequent colour of a row in the open field):
   ```js
   async () => {
     await new Promise((r) => setTimeout(r, 1000));
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const rgb = (s) => s.match(/[\d.]+/g).map(Number).slice(0, 3);
     const from = rgb(getComputedStyle(document.body).backgroundColor);
     document.querySelector('[data-theme-toggle]').click();
     const frames = await new Promise((resolve) => {
       const out = []; let f1 = null;
       const step = (now) => {
         f1 ??= now;
         const px = new Uint8Array(4 * 400);
         gl.readPixels(900, 450, 400, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
         const count = new Map();
         for (let i = 0; i < 400; i++) { const k = `${px[i * 4]},${px[i * 4 + 1]},${px[i * 4 + 2]}`; count.set(k, (count.get(k) ?? 0) + 1); }
         out.push({ t: now - f1, off: [...count.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number), bg: rgb(getComputedStyle(document.body).backgroundColor) });
         if (now - f1 < 400) requestAnimationFrame(step); else resolve(out);
       };
       requestAnimationFrame(step);
     });
     const to = frames.at(-1).bg;
     const at = frames.reduce((a, b) => (Math.abs(b.t - 150) < Math.abs(a.t - 150) ? b : a));
     const mid = from.map((c, k) => (c + to[k]) / 2);
     const dist = (a, b) => Math.max(...a.map((v, k) => Math.abs(v - b[k])));
     return { t: at.t, mid, off: at.off, bg: at.bg, offVsMid: dist(at.off, mid), bgVsMid: dist(at.bg, mid), offVsBg: dist(at.off, at.bg) };
   }
   ```
   Expected: `offVsMid` ≤ 3 and `bgVsMid` ≤ 3 [t 151.4 ms, `off` = `bg` = `122,127,143`, `mid` `123.5,128,144`, both 1.5]. `t` is measured from the first frame after the click (the frame where both the CSS transition and the tween start). On a 60 Hz display the closest frame can be 8 ms from 150, which alone is up to 6.4 of 255: then judge `offVsBg` ≤ 3 and record both. Press the toggle once more (`evaluate_script` `() => { document.querySelector('[data-theme-toggle]').click(); return localStorage.getItem('pn.theme'); }` → `null`).
6. **Fallbacks (8.2.7, 3.6.2, 3.6.5).** Three fresh pages at `1440x900x1`:
   - `navigate_page` `http://localhost:5173/?nowebgl`;
   - `navigate_page` `http://localhost:5173/` with `initScript` `(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return type === 'webgl2' ? null : get.call(this, type, ...rest); }; })();`;
   - `navigate_page` `http://localhost:5173/` with `initScript` `(() => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => (q === '(forced-colors: active)' ? mm('all') : mm(q)); })();`.
   On each: `evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 500)); const h = document.documentElement; return { cls: h.className, ready: h.hasAttribute('data-field-ready'), entry: h.getAttribute('data-entry'), canvas: getComputedStyle(document.querySelector('canvas[data-field]')).display, pn: typeof window.__pn }; }` → `{ cls: "no-webgl", ready: false, entry: null, canvas: "none", pn: "undefined" }`; `list_console_messages` `types: ["error"]` → none; `types: ["warn"]` → exactly one DEV line, `[pn] static fallback: nowebgl` / `no-webgl2` / `forced-colors` (3.6.2: one `console.warn` per failure in DEV only). `take_screenshot` of the getContext case → `E\1440x900-dark-nowebgl.png` (the rail on `--bg`, no field).
7. **Context loss (8.2.8, 3.6.3).** Fresh page at `1440x900x1`, then:
   ```js
   async () => {
     const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
     await sleep(800);
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const ext = gl.getExtension('WEBGL_lose_context');
     ext.loseContext();
     await sleep(500);
     const whileLost = { lost: gl.isContextLost(), cls: document.documentElement.className };
     ext.restoreContext();
     await sleep(800);
     const read = await new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(4); gl.readPixels(1200, 450, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); resolve(Array.from(px)); }));
     return { whileLost, after: { lost: gl.isContextLost(), cls: document.documentElement.className, parity: window.__pn.parity(), read } };
   }
   ```
   Expected: `whileLost` `{ lost: true, cls: "" }`; `after.lost` false, `after.cls` `""`, `after.parity.maxErr255` ≤ 3 and `tierMismatchPct` ≤ 0.5, `after.read` a field colour, not `[0,0,0,255]` [`[5,10,34,255]`, field-0 dark]. Then, on the same page: `async () => { const gl = document.querySelector('canvas[data-field]').getContext('webgl2'); gl.getExtension('WEBGL_lose_context').loseContext(); await new Promise((r) => setTimeout(r, 2900)); const at2900 = document.documentElement.className; await new Promise((r) => setTimeout(r, 300)); return { at2900, at3200: document.documentElement.className }; }` → `{ at2900: "", at3200: "no-webgl" }`, and the console shows only the DEV line `[pn] static fallback: field`.
8. **Hidden at load (8.2.9, 3.4.3, 11.8).** `new_page` `http://localhost:5173/` with `background: true` and a fresh `isolatedContext`, then `evaluate_script` `() => document.visibilityState`. If it reports `hidden`: wait 4 s, check `data-field-ready` is absent and `className` is `""`, `select_page` the page, wait 1 s, check `data-field-ready` is present, `className` `""`. If it reports `visible` (the writer's run on this PC did: background pages still render), exercise the same path with this `initScript` on a fresh page (hidden document, rAF held while hidden):
   ```js
   (() => { let hidden = true; const queued = []; Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') }); Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => hidden }); const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => (hidden ? (queued.push(cb), 0) : raf(cb)); window.__show = () => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); for (const cb of queued.splice(0)) raf(cb); }; })();
   ```
   and `evaluate_script` `async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); await sleep(4000); const h = document.documentElement; const before = { vis: document.visibilityState, ready: h.hasAttribute('data-field-ready'), cls: h.className }; window.__show(); await sleep(600); return { before, after: { vis: document.visibilityState, ready: h.hasAttribute('data-field-ready'), cls: h.className, parity: window.__pn.parity() } }; }` → `before` `{ vis: "hidden", ready: false, cls: "" }` (4 s hidden, no 3000 ms timeout fired), `after` `{ vis: "visible", ready: true, cls: "" }` with a passing parity. Record which method ran.
9. **DPR and moiré (8.2.10, 3.3.2, 4.5.9, Index amendment A2).** Save this script as `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-15/runs.mjs` (it measures colour runs over the rightmost 64 cells of nine rows of a screenshot; every run must be a whole number of cells):
   ```js
   // usage: node runs.mjs <screenshot.png> <cellDev> -> on-runs over the rightmost 64 cells of 9 rows, and the ones that are not whole cells
   import sharp from 'sharp';
   const [file, cellDev] = [process.argv[2], Number(process.argv[3])];
   const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
   const x0 = (Math.floor(info.width / cellDev) - 64) * cellDev;
   let runs = 0;
   const bad = [];
   for (let k = 1; k <= 9; k++) {
     const y = Math.floor((info.height * k) / 10);
     const at = (x) => { const i = (y * info.width + x) * info.channels; return `${data[i]},${data[i + 1]},${data[i + 2]}`; };
     let run = 1;
     for (let x = x0 + 1; x <= x0 + 64 * cellDev; x++) {
       if (x < x0 + 64 * cellDev && at(x) === at(x - 1)) { run++; continue; }
       runs++;
       if (run % cellDev !== 0) bad.push([y, x, run]);
       run = 1;
     }
   }
   console.log(JSON.stringify({ size: [info.width, info.height], cellDev, runs, bad }));
   ```
   For each `viewport` of `1440x900x1`, `1440x900x1.25`, `1440x900x1.5`, `1440x900x2` (one fresh page, `emulate` then reload each time): `evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 800)); const c = document.querySelector('canvas[data-field]'); return { grid: window.__pn.grid(), canvas: [c.width, c.height] }; }`, `take_screenshot` → `E\1440x900-dark-dpr<1|125|150|200>.png`, then in Bash `node .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-15/runs.mjs <that png> <grid.cellDev>`. Expected grids and runs [writer's run]:
   | DPR | grid (`cellDev`, `cellCss`, `cols` × `rows`) | canvas | runs.mjs |
   |---|---|---|---|
   | 1 | 5, 5, 288 × 180 | 1440 × 900 | `bad: []` [346 runs] |
   | 1.25 | 6, 4.8, 300 × 188 | 1800 × 1125 | `bad: []` [408 runs] |
   | 1.5 | 7, 4.667, 309 × 193 | 2160 × 1350 | `bad: []` [449 runs] |
   | 2 | 9, 4.5, 320 × 200 | 2880 × 1800 | `bad: []` [277 runs] |
   (Before Index amendment A2 the ×1.25 grid came out as a 1440 × 900 backing store with `cellDev` 6, because DevTools emulation reports the physical device box.)
10. **Phone band, touch (3.1.13, 3.3.2.5, R10).** Fresh page, `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`, reload, `evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 800)); const c = document.querySelector('canvas[data-field]'); const r = c.getBoundingClientRect(); return { grid: window.__pn.grid(), canvas: [c.width, c.height], band: [r.top, r.height], parity: window.__pn.parity() }; }` → `grid` `{ dpr: 2, widthDev: 780, heightDev: 473, cellDev: 4, cellCss: 2, cols: 195, rows: 119, maskW: 390, maskH: 238 }`, canvas `[780, 473]`, band height about 236.3, parity passing. Then `evaluate_script` `() => { const c = document.querySelector('canvas[data-field]'); const r = c.getBoundingClientRect(); window.__rings = setInterval(() => c.dispatchEvent(new PointerEvent('pointerdown', { clientX: 195, clientY: r.top + r.height / 2, pointerType: 'touch', isPrimary: true, button: 0, bubbles: true })), 300); return true; }`, `take_screenshot` → `E\390x844-dark-ring.png`, `evaluate_script` `() => { clearInterval(window.__rings); window.dispatchEvent(new PointerEvent('pointercancel', { pointerType: 'touch', bubbles: true })); return true; }`.
11. **Console and screenshots (8.2.1, 8.3.2, 8.3.3).** For each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` and each `colorScheme` `dark`, `light`: `new_page` with `isolatedContext: "t15-console-<width>-<look>"`, `emulate`, `navigate_page` reload, wait 2 s (`evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 2000)); return document.documentElement.hasAttribute('data-field-ready'); }` → true), `list_console_messages` `types: ["error", "warn"]` → `<no console messages found>`, `take_screenshot` → `E\<width>x<height>-<look>.png`, `close_page`.

12. **Back from `github` (3.7.5, 3.7.3; Review Focus).** The `github` link opens in the same tab (3.5.12), so Back from GitHub is the most common way a visitor returns, and Chrome restores the page from the back/forward cache: the field must resume where it was. The dev server's HMR WebSocket keeps pages out of that cache, so this check runs on a local preview build. Stop the dev server (the background Bash task, then PowerShell `Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`), run `VITE_PN_DEBUG=1 npm run build`, and start `npx vite preview --port 4173 --strictPort` with `run_in_background`. Fresh page (`isolatedContext: "t15-bfcache"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:4173/` with `initScript` `window.__shows = []; addEventListener('pageshow', (e) => window.__shows.push(e.persisted));`; wait 1 s (`evaluate_script` `async () => { await new Promise((r) => setTimeout(r, 1000)); return document.documentElement.hasAttribute('data-field-ready'); }` → true). Then `navigate_page` `type: "url"`, `url: "http://localhost:4173/robots.txt"` (a same-origin page; the résumé enters the cache), wait 2 s, `navigate_page` `type: "back"`, and run:
   ```js
   async () => {
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const snap = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(400 * 400 * 4); gl.readPixels(900, 250, 400, 400, gl.RGBA, gl.UNSIGNED_BYTE, px); let h = 2166136261; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 16777619); } resolve(h >>> 0); }));
     const a = await snap();
     await new Promise((r) => setTimeout(r, 500));
     const b = await snap();
     const nav = performance.getEntriesByType('navigation')[0];
     return { shows: window.__shows, ready: document.documentElement.hasAttribute('data-field-ready'), cls: document.documentElement.className, moving: a !== b, parity: window.__pn.parity(), clock: document.querySelector('time[data-clock-time]').textContent, notRestored: nav && 'notRestoredReasons' in nav ? nav.notRestoredReasons : 'n/a' };
   }
   ```
   Expected: `shows` `[false, true]` (the first load, then the restore from the back/forward cache), `ready` true, `cls` `""` (no fallback fired), `moving` true (the loop resumed after `pageshow`), `parity.maxErr255` ≤ 3 and `tierMismatchPct` ≤ 0.5, `clock` the current `h:mm AM|PM PDT|PST`; `list_console_messages` `types: ["error", "warn"]` → none. `take_screenshot` → `E\1440x900-dark-back.png`. A `shows` of `[false]` means Chrome did not restore the page from the cache (the Back was a fresh load): record `notRestored`, which names the blocker, and report it as a finding for the controller; it is not a Task 15 failure. Stop the preview server (`Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`) and `close_page`.

Then run `npm run build` so `dist/` is the production build again, and stop any leftover `vite` node child (PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parsanaji.com*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm:$false }`). Write every measured value above into `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-15-report.md`.

- [ ] **Step 10: Commit**

```bash
git add src/app.ts src/debugHooks.ts src/main.ts src/vite-env.d.ts tests/appColors.test.ts
git commit -m "feat(app): the live dither field under the rail

App owns the renderer, pointer, rings, loop and lifecycle: pointer
repel, click Shockwave, resize and DPR regrids, visibility, bfcache,
context loss with restore, the 3 s readiness fallback, the FPS probe
and the field side of the theme crossfade. main.ts gates the field and
installs window.__pn behind PN_DEBUG.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Debug panel and preview builds

- **Files:** Create `src/tweaks.ts`; Modify `src/main.ts` (the `?debug` branch), `.github/workflows/deploy.yml` (only the 7.3.2 build step: `- run: npm run build` with `env: VITE_PN_DEBUG: ${{ github.ref_name == 'main' && '0' || '1' }}`).
- **Interfaces:**
  - Consumes: Task 15 `App` (`applyParams(): void`, `konami(): void`, `replayEntry(): void`, `get grid(): Grid | null`, `debug(): AppDebug` with `setFrozen(frozen: boolean): void`), `PN_DEBUG`, the slice-2 `main.ts`; Task 9 `FieldParams`, `DEFAULT_FIELD`, `Density`, `Intensity`.
  - Produces:
    ```ts
    // src/tweaks.ts (loaded only by `await import('./tweaks')` when PN_DEBUG && ?debug)
    export function prepareTweaks(params: FieldParams): (app: App) => void;
    ```
    `prepareTweaks` applies saved values from `localStorage['pn.tweaks']` to `params` before `App.start` (only changed keys are stored; `deepAssign` and `diff` copied verbatim from the teaser panel, `git show 3e64808:src/tweaks.ts`) and returns `mount(app)`. `mount` creates `new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 })` with `import '../node_modules/lil-gui/dist/lil-gui.css'` (Index amendment A1: lil-gui's `exports` map hides the bare `lil-gui/dist/lil-gui.css`), the 4.12.3 folders, ranges and steps (`t3 ≤ t2` sets `t3 = t2 + 0.01`), and the buttons replay entry (`app.replayEntry()`), Konami (`app.konami()`), toggle theme (clicks `[data-theme-toggle]`), freeze time (`app.debug().setFrozen(…)`), copy JSON, reset (removes `pn.tweaks` and reloads). Cell and density changes call `app.applyParams()` (regrid).
  - Produces (`src/main.ts` after Task 16): in `boot()`, just before `App.start`: `let mountTweaks: ((a: App) => void) | null = null; if (PN_DEBUG && query.has('debug')) { const { prepareTweaks } = await import('./tweaks'); mountTweaks = prepareTweaks(params); }`; after the debug hooks: `if (app) mountTweaks?.(app);`.

No new unit-test file (index). The panel's persistence helpers are the teaser's `deepAssign` and `diff`, verbatim (`git show 3e64808:src/tweaks.ts`).

- [ ] **Step 1: Write `src/tweaks.ts` (spec 4.12.2, 4.12.3; Index amendment A1)**

Every control calls `live()`: it stores only the changed keys and runs `App.applyParams()` (uniforms on the next frame, regrid for cell and density). Storage failures and parse errors are silent (4.12.2: no warnings on previews).
```ts
// Debug panel (spec 4.12). Loaded only by `await import('./tweaks')` when PN_DEBUG && ?debug, so production never carries it.
import GUI from 'lil-gui';
// lil-gui 0.21.0's package.json "exports" exposes only ".", so the bare 'lil-gui/dist/lil-gui.css' of spec 4.12.2 fails to
// resolve; the relative path reaches the same file. A same-origin stylesheet is what the CSP (style-src 'self') allows.
import '../node_modules/lil-gui/dist/lil-gui.css';
import type { App } from './app';
import type { FieldParams } from './field/params';

const STORAGE_KEY = 'pn.tweaks';

type Tree = Record<string, unknown>;

function isPlainObject(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copies saved values onto `target` only where the key exists and the type matches; objects recurse into objects. */
function deepAssign(target: Tree, source: Tree): void {
  for (const [key, value] of Object.entries(source)) {
    if (!Object.hasOwn(target, key)) continue;
    const current = target[key];
    if (isPlainObject(current)) {
      if (isPlainObject(value)) deepAssign(current, value);
    } else if (value !== null && typeof value === typeof current) {
      target[key] = value;
    }
  }
}

/** The subset of `current` that differs from `base` (same shape), or undefined when nothing differs. */
function diff(current: Tree, base: Tree): Tree | undefined {
  const out: Tree = {};
  for (const [key, value] of Object.entries(current)) {
    const before = base[key];
    if (isPlainObject(value) && isPlainObject(before)) {
      const sub = diff(value, before);
      if (sub) out[key] = sub;
    } else if (value !== before) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Spec 4.12.2: applies the saved changes (pn.tweaks) to `params` before App.start and returns mount(app). */
export function prepareTweaks(params: FieldParams): (app: App) => void {
  const baseline = structuredClone(params);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isPlainObject(parsed)) deepAssign(params as unknown as Tree, parsed);
    }
  } catch {
    // unreadable or blocked storage: start from the defaults, silently (4.12.2: no warnings on previews)
  }
  return (app: App) => {
    mount(params, baseline, app);
  };
}

function mount(params: FieldParams, baseline: FieldParams, app: App): GUI {
  const gui = new GUI({ injectStyles: false, title: 'parsanaji tweaks', width: 320 });
  const persist = (): void => {
    try {
      const changed = diff(params as unknown as Tree, baseline as unknown as Tree);
      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(changed));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage blocked: the change still applies for this session
    }
  };
  /** Every change persists and goes through App.applyParams(): uniforms on the next frame, regrid for cells. */
  const live = (): void => {
    persist();
    app.applyParams();
  };

  const cells = gui.addFolder('cells');
  cells.add(params, 'density', ['sparse', 'medium', 'dense']).onChange(live);
  cells.add(params.cell, 'k', 0.001, 0.008, 0.0001).onChange(live);
  cells.add(params.cell, 'minCss', 1, 6, 0.5).onChange(live);
  cells.add(params.cell, 'maxCss', 2, 12, 0.5).onChange(live);

  const surface = gui.addFolder('surface');
  surface.add(params, 'intensity', ['subtle', 'medium', 'lively']).onChange(live);
  surface.add(params, 'flowSpeed', 0, 3, 0.05).onChange(live);
  surface.add(params.shape, 'warpScalePx', 80, 600, 10).onChange(live);
  surface.add(params.shape, 'mainScalePx', 60, 400, 5).onChange(live);
  surface.add(params.shape, 'warpAmp', 0, 6, 0.1).onChange(live);
  surface.add(params.shape, 'level', 0, 0.6, 0.01).onChange(live);
  surface.add(params.shape, 'gain', 0.5, 4, 0.05).onChange(live);

  const tiers = gui.addFolder('tiers');
  const keepOrder = (): void => {
    if (params.tiers.t3 <= params.tiers.t2) {
      params.tiers.t3 = Math.round((params.tiers.t2 + 0.01) * 1000) / 1000; // 4.12.3: t3 stays above t2
      t3.updateDisplay();
    }
    live();
  };
  tiers.add(params.tiers, 't2', 0.4, 0.9, 0.005).onChange(keepOrder);
  const t3 = tiers.add(params.tiers, 't3', 0.6, 1, 0.005).onChange(keepOrder);

  const pointer = gui.addFolder('pointer');
  pointer.add(params.pointer, 'radiusK', 0.1, 0.5, 0.01).onChange(live);
  pointer.add(params.pointer, 'radiusSp', 0, 6, 0.5).onChange(live);
  pointer.add(params.pointer, 'warpK', 0, 1, 0.01).onChange(live);
  pointer.add(params.pointer, 'boost', 0, 0.4, 0.01).onChange(live);
  pointer.add(params.pointer, 'lerp', 0.02, 1, 0.01).onChange(live);
  pointer.add(params.pointer, 'riseMs', 0, 1000, 10).onChange(live);
  pointer.add(params.pointer, 'fallMs', 0, 2000, 10).onChange(live);
  pointer.add(params.pointer, 'velNorm', 200, 4000, 50).onChange(live);
  pointer.add(params.pointer, 'velRadiusGain', 0, 0.5, 0.01).onChange(live);

  const ripple = gui.addFolder('ripple');
  ripple.add(params.ripple, 'max', 1, 8, 1).onChange(live);
  ripple.add(params.ripple, 'lifeS', 0.5, 6, 0.1).onChange(live);
  ripple.add(params.ripple, 'amp', 0, 2, 0.05).onChange(live);
  ripple.add(params.ripple, 'speedSp', 1, 20, 0.5).onChange(live);
  ripple.add(params.ripple, 'sigmaSp', 0.5, 4, 0.1).onChange(live);
  ripple.add(params.ripple, 'gain', 0, 2, 0.05).onChange(live);

  const breath = gui.addFolder('breath');
  breath.add(params.breath, 'amp', 0, 0.05, 0.001).onChange(live);
  breath.add(params.breath, 'periodMs', 1000, 20000, 100).onChange(live);

  const mask = gui.addFolder('mask');
  mask.add(params.mask, 'holdDim', 0, 1, 0.01).onChange(live);
  mask.add(params.mask, 'ink', 0.7, 1, 0.01).onChange(live);
  mask.add(params.mask, 'edge', 0.01, 0.3, 0.01).onChange(live);
  mask.add(params.mask, 'meltPx', 0, 150, 1).onChange(live);
  mask.add(params.mask, 'heightFrac', 0.1, 0.8, 0.01).onChange(live);
  mask.add(params.mask, 'widthFrac', 0.3, 1, 0.01).onChange(live);

  const entry = gui.addFolder('entry');
  for (const key of ['gatherMs', 'holdMs', 'dissolveMs', 'scrimAtMs', 'revealAtMs', 'cleanupAtMs'] as const) {
    entry.add(params.entry, key, 0, 6000, 10).onChange(live);
  }
  entry.add(params.entry, 'skipMs', 0, 1000, 10).onChange(live);

  const konami = gui.addFolder('konami');
  for (const key of ['gatherMs', 'holdMs', 'dissolveMs'] as const) konami.add(params.konami, key, 0, 6000, 10).onChange(live);

  let frozen = false;
  gui.add({ replay: () => app.replayEntry() }, 'replay').name('replay entry');
  gui.add({ konami: () => app.konami() }, 'konami').name('Konami');
  gui.add({ toggle: () => document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click() }, 'toggle').name('toggle theme');
  const freeze = gui
    .add(
      {
        freeze: () => {
          frozen = !frozen;
          app.debug().setFrozen(frozen);
          freeze.name(frozen ? 'unfreeze time' : 'freeze time');
        },
      },
      'freeze',
    )
    .name('freeze time');
  gui.add({ copy: () => void navigator.clipboard?.writeText(JSON.stringify(params, null, 2)).catch(() => {}) }, 'copy').name('copy JSON');
  gui
    .add(
      {
        reset: () => {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // nothing stored
          }
          location.reload();
        },
      },
      'reset',
    )
    .name('reset');
  return gui;
}
```

- [ ] **Step 2: Add the `?debug` branch to `src/main.ts` (index "Produces (`src/main.ts` after Task 16)")**

Both hunks are exact before/after pairs in the Task 15 file.

`src/main.ts`, before (Task 15):
```ts
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  app = App.start({
```
After:
```ts
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  let mountTweaks: ((a: App) => void) | null = null;
  if (PN_DEBUG && query.has('debug')) {
    const { prepareTweaks } = await import('./tweaks');
    mountTweaks = prepareTweaks(params);
  }
  app = App.start({
```
`src/main.ts`, before (Task 15):
```ts
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
}
```
After:
```ts
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
  if (app) mountTweaks?.(app);
}
```

- [ ] **Step 3: Preview builds get `VITE_PN_DEBUG` (spec 7.3.2, the only workflow change)**

In `.github/workflows/deploy.yml`, before:
```yaml
      - run: npm test
      - run: npm run build
      - name: Deploy to Cloudflare Pages
```
After:
```yaml
      - run: npm test
      - run: npm run build
        env:
          VITE_PN_DEBUG: ${{ github.ref_name == 'main' && '0' || '1' }}
      - name: Deploy to Cloudflare Pages
```
Run `git diff --stat .github/workflows/deploy.yml` → `1 file changed, 2 insertions(+)`.

- [ ] **Step 4: Full gate, production build and preview build**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Test Files  27 passed (27)`, `Tests  237 passed (237)` (no new test file); typecheck prints no diagnostics; the build lists one `dist/assets/index-*.js` and one CSS file, no `tweaks-*` or `debugHooks-*` chunk. Then:
```bash
grep -c "lil-gui\|parsanaji tweaks\|__pn" dist/assets/*.js
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
VITE_PN_DEBUG=1 npx vite build
ls dist/assets
npm run build
```
Expected: `0` for every file; the 8.1.4 gzip number (record it; ≤ 60 KB; the assembler's scratch build of this exact Task 16 state measured 12.2 KB); the `VITE_PN_DEBUG=1` build lists `debugHooks-*.js` (about 1.5 kB), `tweaks-*.js` (about 34 kB, 9.3 kB gzip) and `tweaks-*.css` (about 10 kB, the lil-gui stylesheet); the final `npm run build` leaves `dist/` as the production build.

- [ ] **Step 5: Browser evidence on the dev server (spec 4.12.1–4.12.3)**

Start `npm run dev` with `run_in_background` (port 5173 or the one it prints), load the DevTools tools with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__select_page`, then `new_page` `http://localhost:5173/?debug` with `isolatedContext: "t16"`, `emulate` `1440x900x1` dark, reload.
1. Panel and regrid:
   ```js
   async () => {
     await new Promise((r) => setTimeout(r, 1000));
     const gui = document.querySelector('.lil-gui.lil-root');
     const folders = [...gui.querySelectorAll(':scope > .lil-children > .lil-gui > .lil-title')].map((t) => t.textContent);
     const buttons = [...gui.querySelectorAll(':scope > .lil-children > .lil-controller.lil-function .lil-name')].map((n) => n.textContent);
     const colsBefore = window.__pn.grid().cols;
     const select = gui.querySelector('select');
     select.value = 'dense';
     select.dispatchEvent(new Event('change'));
     await new Promise((r) => setTimeout(r, 200));
     return { title: gui.querySelector(':scope > .lil-title').textContent, folders, buttons, colsBefore, colsAfter: window.__pn.grid().cols, stored: localStorage.getItem('pn.tweaks'), position: getComputedStyle(gui).position };
   }
   ```
   Expected: `title` `parsanaji tweaks`; `folders` `["cells","surface","tiers","pointer","ripple","breath","mask","entry","konami"]`; `buttons` `["replay entry","Konami","toggle theme","freeze time","copy JSON","reset"]`; `colsBefore` 288, `colsAfter` 480 (dense: 3.456 CSS px → `cellDev` 3); `stored` `{"density":"dense"}` (only the changed key is stored); `position` `fixed` (the lil-gui stylesheet loaded, `injectStyles: false`).
2. Tiers apply on the next frame and keep their order:
   ```js
   async () => {
     const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
     const field2 = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(1440 * 900 * 4); gl.readPixels(0, 0, 1440, 900, gl.RGBA, gl.UNSIGNED_BYTE, px); let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] === 141 && px[i + 1] === 176 && px[i + 2] === 255) n++; resolve(n); }));
     const ctl = (name) => [...document.querySelectorAll('.lil-gui .lil-controller')].find((c) => c.querySelector('.lil-name')?.textContent === name);
     const setNumber = (name, value) => { const input = ctl(name).querySelector('input'); input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); };
     const before = await field2();
     setNumber('t2', 0.5);
     const after = await field2();
     setNumber('t2', 0.8);
     setNumber('t3', 0.7);
     return { before, after, t3: ctl('t3').querySelector('input').value, stored: localStorage.getItem('pn.tweaks') };
   }
   ```
   Expected: `after` clearly above `before` [190550 → 394625 field-2 pixels]; `t3` `0.81` (4.12.3: `t3 ≤ t2` sets `t3 = t2 + 0.01`); `stored` `{"density":"dense","tiers":{"t2":0.8,"t3":0.81}}`.
3. Freeze time: `async () => { const gl = document.querySelector('canvas[data-field]').getContext('webgl2'); const snap = () => new Promise((resolve) => requestAnimationFrame(() => { const px = new Uint8Array(400 * 400 * 4); gl.readPixels(900, 300, 400, 400, gl.RGBA, gl.UNSIGNED_BYTE, px); let h = 2166136261; for (let i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 16777619); } resolve(h >>> 0); })); const btn = (label) => [...document.querySelectorAll('.lil-gui .lil-controller.lil-function')].find((c) => c.textContent.trim() === label).querySelector('button'); const a1 = await snap(); await new Promise((r) => setTimeout(r, 300)); const a2 = await snap(); btn('freeze time').click(); const b1 = await snap(); await new Promise((r) => setTimeout(r, 300)); const b2 = await snap(); btn('unfreeze time').click(); return { running: a1 !== a2, frozen: b1 === b2 }; }` → `{ running: true, frozen: true }`.
4. Reload keeps only the changed keys: `navigate_page` `type: "reload"`, then `async () => { await new Promise((r) => setTimeout(r, 800)); const ctl = (name) => [...document.querySelectorAll('.lil-gui .lil-controller')].find((c) => c.querySelector('.lil-name')?.textContent === name); return { t2: ctl('t2').querySelector('input').value, cols: window.__pn.grid().cols, stored: localStorage.getItem('pn.tweaks') }; }` → `t2` `0.8`, `cols` 480, `stored` unchanged.
5. Reset: `() => { [...document.querySelectorAll('.lil-gui .lil-controller.lil-function')].find((c) => c.textContent.trim() === 'reset').querySelector('button').click(); return true; }`, wait for the reload, then `async () => { await new Promise((r) => setTimeout(r, 800)); return { stored: localStorage.getItem('pn.tweaks'), cols: window.__pn.grid().cols }; }` → `{ stored: null, cols: 288 }`.
6. `list_console_messages` `types: ["error", "warn"]` → `<no console messages found>` (DevTools may list an `issue` "A form field element should have an id or name attribute" for lil-gui's inputs; it is neither an error nor a warning). `take_screenshot` → `E\1440x900-dark-debug.png` with `E` = `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\evidence\task-16\` (`mkdir -p` it first). `close_page`; stop the dev server (the background Bash task) and any leftover `vite` node child (PowerShell: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*parsanaji.com*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm:$false }`).

- [ ] **Step 6: Commit**

```bash
git add src/tweaks.ts src/main.ts .github/workflows/deploy.yml
git commit -m "feat(debug): ?debug tuning panel and preview builds

lil-gui panel over FieldParams with the spec 4.12.3 folders, ranges
and buttons, saved as changed keys in pn.tweaks. CI builds every
branch except main with VITE_PN_DEBUG=1, so previews carry the panel
and window.__pn; production builds carry neither.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Push and watch the deploy (slice 2 closes)**

```bash
git push
export PATH="$PATH:/c/Program Files/GitHub CLI"
git rev-parse HEAD
gh run list --branch resume-screen --limit 1 --json databaseId,headSha,status,conclusion
gh run watch "$(gh run list --branch resume-screen --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```
Expected: the push updates `origin/resume-screen`; the newest run's `headSha` equals `git rev-parse HEAD` (if the list still shows the previous run, run the `gh run list` line again after a few seconds); `gh run watch` ends with `✓ … deploy` and exit code 0 (steps `npm ci`, `npm test`, `npm run build` with `VITE_PN_DEBUG=1`, Deploy). A red run stops the task: read `gh run view --log-failed` and report it.

- [ ] **Step 8: Preview evidence (slice-2 close, spec 8.2.1, 8.3, 7.2.1)**

`P` = `https://resume-screen.parsanaji-com.pages.dev`. Evidence directory `E` as in Step 5.
1. `curl -sI https://resume-screen.parsanaji-com.pages.dev/ | grep -i "content-security-policy"` → the unchanged CSP of `public/_headers` (`script-src 'self' https://static.cloudflareinsights.com`, `style-src 'self'`, …).
2. Console check: for each viewport `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` and `colorScheme` `dark`, `light`: `new_page` `P/` with `isolatedContext: "t16-preview-<width>-<look>"`, `emulate`, reload, wait 2 s, `evaluate_script` `() => document.documentElement.hasAttribute('data-field-ready')` → true, `list_console_messages` `types: ["error", "warn"]` → `<no console messages found>`, `take_screenshot` → `E\preview-<width>x<height>-<look>.png`, `close_page`.
3. Debug build on the preview: `new_page` `P/?debug` (`isolatedContext: "t16-preview-debug"`), `emulate` `1440x900x1` dark, reload, then `async () => { await new Promise((r) => setTimeout(r, 1500)); return { panel: !!document.querySelector('.lil-gui.lil-root'), position: getComputedStyle(document.querySelector('.lil-gui.lil-root')).position, styles: document.querySelectorAll('style').length, parity: window.__pn.parity(), grid: window.__pn.grid() }; }` → `panel` true, `position` `fixed` (the `tweaks-*.css` link loaded under the CSP), `styles` 0 (no injected `<style>`), `parity.maxErr255` ≤ 3 and `tierMismatchPct` ≤ 0.5, `grid.cols` 288. `list_console_messages` `types: ["error", "warn"]` → none (no "Refused to apply inline style" CSP report). `take_screenshot` → `E\preview-1440x900-dark-debug.png`. `close_page`.
4. Record the run id, the gzip number of Step 4, every value above and the screenshot names in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-16-report.md`. The controller then writes the slice-2 ledger line, updates the vault note and the memory file, and compacts (Execution Notes).

### Task 17: Entry state machine

**Files:**
- Create: `src/field/entry.ts`
- Test: `tests/entry.test.ts`

**Interfaces:**
- Consumes: none (pure).
- Produces (`src/field/entry.ts`):
  ```ts
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
  ```
- Semantics: `arm()` also re-arms from `done`; `pending` leaves for `gather` (emitting `start`) on the first tick with `ready` and `visible`; a tick with `visible` false does not advance; `cleanup` is emitted only when `cleanupAtMs` is non-null; a `skip()` in `done` emits `cleanup` at once; the fast dissolve is `e = e0 × smoothstep(1 − elapsed / fastMs)`; 0 ms gather and dissolve are allowed (P7).
- Plan details pinned by the tests below (they refine the index, they do not rename anything): `arm()` is ignored while the machine runs and clears readiness (the caller uploads a fresh mask, then `setReady(true)`); the tick that leaves `pending` sets entry time 0 and does not advance by its `dt`; timed events (`scrim`, `reveal`, `done` at `gatherMs + holdMs + dissolveMs`, `cleanup`) fire in time order, ties in that order, so one long `dt` fires every event it passes; during a skip the phase reads `dissolve`, pending `scrim` / `reveal` never fire, and a 0 ms skip completes inside the call.

Golden timeline (computed by running the module below with 1 ms ticks; it is the 3.4.2 table):

| entry t (ms) | phase | e | event |
|---|---|---|---|
| 0 | gather | 0 | `start` |
| 225 | gather | 0.15625 | |
| 450 | gather | 0.5 | |
| 675 | gather | 0.84375 | |
| 900 | hold | 1 | |
| 1400 | hold | 1 | |
| 1900 | dissolve | 1 | `scrim` |
| 2100 | dissolve | 0.84375 | `reveal` |
| 2300 | dissolve | 0.5 | |
| 2500 | dissolve | 0.15625 | |
| 2700 | done | 0 | `done` |
| 3300 | done | 0 | `cleanup` |

Konami (`KONAMI_TIMINGS`): `start` at 0, hold 900–2400 (e = 1), e = 0.95703125 at 2500 and 0.68359375 at 2700, `done` at 3200, nothing else.

- [ ] **Step 1: Write the failing test**

`tests/entry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  ENTRY_TIMINGS,
  EntryMachine,
  KONAMI_TIMINGS,
  entryProgress,
  type EntryEvent,
  type EntryTimings,
} from '../src/field/entry';

/** A machine with an event log that records the entry time of every emission. */
function machine(t: EntryTimings = ENTRY_TIMINGS) {
  const log: { ev: EntryEvent; at: number }[] = [];
  const m: EntryMachine = new EntryMachine(t, (ev) => log.push({ ev, at: m.elapsedMs }));
  return { m, log, events: () => log.map((x) => x.ev) };
}

/** arm, mark ready, and run the first visible tick (entry time 0, emits 'start'). */
function started(t: EntryTimings = ENTRY_TIMINGS) {
  const s = machine(t);
  s.m.arm();
  s.m.setReady(true);
  s.m.tick(16, true);
  return s;
}

/** Advance in 1 ms ticks so every boundary is hit exactly. */
function run(m: EntryMachine, ms: number): number {
  let e = 0;
  for (let i = 0; i < ms; i++) e = m.tick(1, true);
  return e;
}

describe('timings (spec 3.4.2, 3.4.11)', () => {
  it('pins the entry and Konami timings', () => {
    expect(ENTRY_TIMINGS).toEqual({ gatherMs: 900, holdMs: 1000, dissolveMs: 800, scrimAtMs: 1900, revealAtMs: 2100, cleanupAtMs: 3300 });
    expect(KONAMI_TIMINGS).toEqual({ gatherMs: 900, holdMs: 1500, dissolveMs: 800, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null });
  });
});

describe('entryProgress (spec 3.4.2)', () => {
  it('matches the spec values e = 0, 0.5, 1, 1, 0.5, 0', () => {
    const at = [0, 450, 900, 1400, 2300, 2700].map((t) => entryProgress(t, ENTRY_TIMINGS));
    expect(at).toEqual([0, 0.5, 1, 1, 0.5, 0]);
  });

  it('is the smoothstep u²(3 − 2u) on both ramps', () => {
    expect(entryProgress(225, ENTRY_TIMINGS)).toBe(0.15625);
    expect(entryProgress(675, ENTRY_TIMINGS)).toBe(0.84375);
    expect(entryProgress(2100, ENTRY_TIMINGS)).toBe(0.84375);
    expect(entryProgress(2500, ENTRY_TIMINGS)).toBe(0.15625);
  });

  it('is 0 before the start and after the dissolve', () => {
    expect(entryProgress(-5, ENTRY_TIMINGS)).toBe(0);
    expect(entryProgress(Number.NaN, ENTRY_TIMINGS)).toBe(0);
    expect(entryProgress(9000, ENTRY_TIMINGS)).toBe(0);
  });

  it('jumps for 0 ms gather and dissolve phases (P7)', () => {
    const jump: EntryTimings = { gatherMs: 0, holdMs: 1500, dissolveMs: 0, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null };
    expect(entryProgress(0, jump)).toBe(1);
    expect(entryProgress(1499, jump)).toBe(1);
    expect(entryProgress(1500, jump)).toBe(0);
  });
});

describe('EntryMachine (spec 3.4.2, 8.1.7)', () => {
  it('starts idle and ignores ticks until armed', () => {
    const { m, events } = machine();
    expect(m.phase).toBe('idle');
    expect(m.tick(16, true)).toBe(0);
    expect(m.phase).toBe('idle');
    expect(events()).toEqual([]);
  });

  it('stays pending until it is ready and the page is visible (3.4.3, 3.4.8)', () => {
    const { m, events } = machine();
    m.arm();
    expect(m.phase).toBe('pending');
    m.tick(16, true);
    expect(m.phase).toBe('pending');
    m.setReady(true);
    m.tick(16, false);
    expect(m.phase).toBe('pending');
    expect(events()).toEqual([]);
    expect(m.tick(16, true)).toBe(0);
    expect(m.phase).toBe('gather');
    expect(m.elapsedMs).toBe(0);
    expect(events()).toEqual(['start']);
  });

  it('changes phase exactly at 900, 1900 and 2700 ms', () => {
    const { m } = started();
    run(m, 899);
    expect(m.phase).toBe('gather');
    run(m, 1);
    expect(m.phase).toBe('hold');
    run(m, 999);
    expect(m.phase).toBe('hold');
    run(m, 1);
    expect(m.phase).toBe('dissolve');
    run(m, 799);
    expect(m.phase).toBe('dissolve');
    run(m, 1);
    expect(m.phase).toBe('done');
  });

  it('returns e along the curve as it runs', () => {
    const { m } = started();
    expect(run(m, 450)).toBe(0.5);
    expect(run(m, 450)).toBe(1);
    expect(run(m, 500)).toBe(1);
    expect(run(m, 900)).toBe(0.5);
    expect(run(m, 400)).toBe(0);
  });

  it('emits start, scrim, reveal, done and cleanup in order, once each, at 0, 1900, 2100, 2700, 3300', () => {
    const { m, log } = started();
    run(m, 5000);
    expect(log).toEqual([
      { ev: 'start', at: 0 },
      { ev: 'scrim', at: 1900 },
      { ev: 'reveal', at: 2100 },
      { ev: 'done', at: 2700 },
      { ev: 'cleanup', at: 3300 },
    ]);
    expect(m.elapsedMs).toBe(3300);
  });

  it('fires every event a long dt passes, in order (the caller clamps dt)', () => {
    const { m, events } = started();
    m.tick(4000, true);
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup']);
  });

  it('does not advance on a hidden tick mid-entry (3.4.8)', () => {
    const { m } = started();
    run(m, 1000);
    expect(m.tick(500, false)).toBe(1);
    expect(m.elapsedMs).toBe(1000);
    expect(m.phase).toBe('hold');
  });

  it('runs the Konami for 3200 ms with no scrim, reveal or cleanup (3.4.11)', () => {
    const { m, log } = started(KONAMI_TIMINGS);
    run(m, 3199);
    expect(m.phase).toBe('dissolve');
    run(m, 1);
    expect(m.phase).toBe('done');
    run(m, 2000);
    expect(log).toEqual([
      { ev: 'start', at: 0 },
      { ev: 'done', at: 3200 },
    ]);
  });

  it('jumps e to 1, holds and jumps to 0 with 0 ms gather and dissolve (P7, reduced-motion Konami)', () => {
    const jump: EntryTimings = { gatherMs: 0, holdMs: 1500, dissolveMs: 0, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null };
    const { m, events } = machine(jump);
    m.arm();
    m.setReady(true);
    expect(m.tick(16, true)).toBe(1);
    expect(m.phase).toBe('hold');
    expect(run(m, 1499)).toBe(1);
    expect(run(m, 1)).toBe(0);
    expect(m.phase).toBe('done');
    expect(events()).toEqual(['start', 'done']);
  });

  it('re-arms from done and plays again', () => {
    const { m, events } = started();
    run(m, 4000);
    m.arm();
    expect(m.phase).toBe('pending');
    expect(m.elapsedMs).toBe(0);
    m.tick(16, true);
    expect(m.phase).toBe('pending'); // arm() cleared readiness: a fresh mask must be uploaded first
    m.setReady(true);
    m.tick(16, true);
    run(m, 4000);
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup', 'start', 'scrim', 'reveal', 'done', 'cleanup']);
  });

  it('ignores arm() while running', () => {
    const { m } = started();
    run(m, 1000);
    m.arm();
    expect(m.phase).toBe('hold');
    expect(m.elapsedMs).toBe(1000);
  });
});

describe('EntryMachine.skip (spec 3.4.9, 8.1.7)', () => {
  it('emits skip, dissolves from the current e over 250 ms, then done and cleanup together', () => {
    const { m, log, events } = started();
    run(m, 1000); // hold, e = 1
    m.skip();
    expect(events()).toEqual(['start', 'skip']);
    expect(m.phase).toBe('dissolve');
    expect(run(m, 125)).toBe(0.5); // 1 × smoothstep(1 − 125/250)
    run(m, 124);
    expect(events()).toEqual(['start', 'skip']);
    expect(run(m, 1)).toBe(0);
    expect(m.phase).toBe('done');
    expect(log.slice(2)).toEqual([
      { ev: 'done', at: 1000 },
      { ev: 'cleanup', at: 1000 },
    ]);
    run(m, 3000);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('scales the fast dissolve by e at the moment of the skip', () => {
    const { m } = started();
    run(m, 450); // gather, e = 0.5
    m.skip(250);
    expect(run(m, 125)).toBe(0.25);
  });

  it('honours a custom fast-dissolve length', () => {
    const { m, events } = started();
    run(m, 1000);
    m.skip(100);
    run(m, 99);
    expect(events()).toEqual(['start', 'skip']);
    run(m, 1);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('completes a 0 ms skip inside the call', () => {
    const { m, events } = started();
    run(m, 300);
    m.skip(0);
    expect(m.phase).toBe('done');
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('skips from pending (focus before the field is ready)', () => {
    const { m, events } = machine();
    m.arm();
    m.skip();
    expect(events()).toEqual(['skip']);
    expect(m.tick(16, false)).toBe(0); // a hidden tick does not advance the fast dissolve either
    run(m, 250);
    expect(events()).toEqual(['skip', 'done', 'cleanup']);
  });

  it('never emits scrim or reveal after a skip', () => {
    const { m, events } = started();
    run(m, 1800);
    m.skip();
    run(m, 4000);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('runs cleanup at once when skipped in done (between 2700 and 3300 ms)', () => {
    const { m, events } = started();
    run(m, 2800);
    expect(m.phase).toBe('done');
    m.skip();
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup']);
    run(m, 1000);
    expect(events()).toEqual(['start', 'scrim', 'reveal', 'done', 'cleanup']);
  });

  it('ignores a second skip, a skip after cleanup, and a skip while idle', () => {
    const idle = machine();
    idle.m.skip();
    expect(idle.events()).toEqual([]);

    const { m, events } = started();
    run(m, 1000);
    m.skip();
    m.skip();
    run(m, 250);
    m.skip();
    run(m, 1000);
    expect(events()).toEqual(['start', 'skip', 'done', 'cleanup']);
  });

  it('emits skip and done but no cleanup for a Konami machine', () => {
    const { m, events } = started(KONAMI_TIMINGS);
    run(m, 1000);
    m.skip();
    run(m, 250);
    expect(events()).toEqual(['start', 'skip', 'done']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/entry.test.ts`
Expected: FAIL. `FAIL  tests/entry.test.ts [ tests/entry.test.ts ]` with `Error: Cannot find module '../src/field/entry' imported from C:/Users/parsa/parsanaji.com/tests/entry.test.ts`, then `Test Files  1 failed (1)` and `Tests  no tests`.

- [ ] **Step 3: Write the module**

`src/field/entry.ts`:
```ts
/**
 * The entry and Konami state machine (spec 3.4.2, 3.4.8, 3.4.9, 3.4.11; Appendix A §5).
 * Pure: time arrives through tick(dt), DOM effects leave through emit(). App owns one machine
 * for the load entry and one per Konami.
 */
export type EntryPhase = 'idle' | 'pending' | 'gather' | 'hold' | 'dissolve' | 'done';
export type EntryEvent = 'start' | 'scrim' | 'reveal' | 'skip' | 'done' | 'cleanup';

export interface EntryTimings {
  gatherMs: number;
  holdMs: number;
  dissolveMs: number;
  scrimAtMs: number | null;
  revealAtMs: number | null;
  cleanupAtMs: number | null;
}

/** 3.4.2: gather 900, hold 1000, dissolve 800; scrim at 1900, reveal at 2100, cleanup at 3300. */
export const ENTRY_TIMINGS: EntryTimings = {
  gatherMs: 900,
  holdMs: 1000,
  dissolveMs: 800,
  scrimAtMs: 1900,
  revealAtMs: 2100,
  cleanupAtMs: 3300,
};

/** 3.4.11: gather 900, hold 1500, dissolve 800 (3200 ms in total); no scrim, reveal or cleanup. */
export const KONAMI_TIMINGS: EntryTimings = {
  gatherMs: 900,
  holdMs: 1500,
  dissolveMs: 800,
  scrimAtMs: null,
  revealAtMs: null,
  cleanupAtMs: null,
};

const DEFAULT_SKIP_MS = 250; // 3.4.9

/** smoothstep(u) = u²(3 − 2u) with u clamped to [0, 1]: the Blueprint playEntry curve (3.4.2). */
function smooth(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

function finiteNonNegative(ms: number): number {
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

/**
 * Mask progress e at entry time tMs (3.4.2): smoothstep up over the gather, 1 through the hold,
 * smoothstep down over the dissolve, 0 after. A 0 ms gather or dissolve jumps (P7).
 */
export function entryProgress(tMs: number, t: EntryTimings): number {
  if (!(tMs >= 0)) return 0;
  if (tMs < t.gatherMs) return smooth(tMs / t.gatherMs);
  const holdEnd = t.gatherMs + t.holdMs;
  if (tMs < holdEnd) return 1;
  if (tMs < holdEnd + t.dissolveMs) return smooth(1 - (tMs - holdEnd) / t.dissolveMs);
  return 0;
}

function phaseAt(tMs: number, t: EntryTimings): EntryPhase {
  if (tMs < t.gatherMs) return 'gather';
  if (tMs < t.gatherMs + t.holdMs) return 'hold';
  if (tMs < t.gatherMs + t.holdMs + t.dissolveMs) return 'dissolve';
  return 'done';
}

interface TimedEvent {
  at: number;
  ev: EntryEvent;
}

/** scrim, reveal, done and cleanup in time order; ties keep this order (done before cleanup). */
function timeline(t: EntryTimings): TimedEvent[] {
  const list: TimedEvent[] = [];
  if (t.scrimAtMs !== null) list.push({ at: t.scrimAtMs, ev: 'scrim' });
  if (t.revealAtMs !== null) list.push({ at: t.revealAtMs, ev: 'reveal' });
  list.push({ at: t.gatherMs + t.holdMs + t.dissolveMs, ev: 'done' });
  if (t.cleanupAtMs !== null) list.push({ at: t.cleanupAtMs, ev: 'cleanup' });
  return list.sort((a, b) => a.at - b.at); // Array.prototype.sort is stable (ES2019)
}

export class EntryMachine {
  private readonly t: EntryTimings;
  private readonly emit: (e: EntryEvent) => void;
  private readonly events: readonly TimedEvent[];
  private phaseValue: EntryPhase = 'idle';
  private elapsed = 0;
  private next = 0; // events[0 .. next) have fired
  private ready = false;
  private skipping = false;
  private skipMs = DEFAULT_SKIP_MS;
  private skipElapsed = 0;
  private skipFrom = 0;

  constructor(t: EntryTimings, emit: (e: EntryEvent) => void) {
    this.t = { ...t };
    this.emit = emit;
    this.events = timeline(this.t);
  }

  /** idle (or done) -> pending. Clears readiness: the caller uploads a fresh mask, then calls setReady(true). */
  arm(): void {
    if (this.phaseValue !== 'idle' && this.phaseValue !== 'done') return;
    this.phaseValue = 'pending';
    this.elapsed = 0;
    this.next = 0;
    this.ready = false;
    this.skipping = false;
    this.skipElapsed = 0;
    this.skipFrom = 0;
  }

  /** 3.4.3: programs linked, font settled and mask uploaded. */
  setReady(ready: boolean): void {
    this.ready = ready;
  }

  /**
   * Advances entry time by dtMs and returns e in 0..1. pending leaves for the first phase on the first
   * tick that is ready and visible (entry time 0, emits 'start'); a tick with visible false never
   * advances (3.4.8); events fire in time order, once each.
   */
  tick(dtMs: number, visible: boolean): number {
    const p = this.phaseValue;
    if (p === 'idle') return 0;
    if (p === 'pending') {
      if (!this.ready || !visible) return 0;
      this.phaseValue = phaseAt(0, this.t);
      this.emit('start');
      this.fire();
      return this.current();
    }
    if (!visible) return this.current();
    if (this.skipping) {
      this.skipElapsed += finiteNonNegative(dtMs);
      if (this.skipElapsed >= this.skipMs) this.finishSkip();
      return this.current();
    }
    if (p !== 'done' || this.next < this.events.length) {
      this.elapsed += finiteNonNegative(dtMs);
      this.phaseValue = phaseAt(this.elapsed, this.t);
      this.fire();
    }
    return this.current();
  }

  /**
   * 3.4.9: emits 'skip' and dissolves the mask from its current e to 0 over fastMs as
   * e0 × smoothstep(1 − elapsed / fastMs); then 'done' and (when cleanupAtMs is set) 'cleanup'
   * fire together. In done, a pending 'cleanup' fires at once. A 0 ms skip completes in this call.
   */
  skip(fastMs: number = DEFAULT_SKIP_MS): void {
    const p = this.phaseValue;
    if (p === 'idle' || this.skipping) return;
    if (p === 'done') {
      this.flushCleanup();
      return;
    }
    this.skipFrom = this.current();
    this.skipping = true;
    this.skipElapsed = 0;
    this.skipMs = finiteNonNegative(fastMs);
    this.phaseValue = 'dissolve';
    this.emit('skip');
    if (this.skipMs === 0) this.finishSkip();
  }

  get phase(): EntryPhase {
    return this.phaseValue;
  }

  get elapsedMs(): number {
    return this.elapsed;
  }

  private current(): number {
    const p = this.phaseValue;
    if (p === 'idle' || p === 'pending' || p === 'done') return 0;
    if (this.skipping) return this.skipFrom * smooth(1 - this.skipElapsed / this.skipMs);
    return entryProgress(this.elapsed, this.t);
  }

  private fire(): void {
    while (this.next < this.events.length && this.events[this.next].at <= this.elapsed) {
      const { ev } = this.events[this.next];
      this.next += 1;
      this.emit(ev);
    }
  }

  private finishSkip(): void {
    const rest = this.events.slice(this.next).map((x) => x.ev);
    this.next = this.events.length;
    this.skipping = false;
    this.phaseValue = 'done';
    if (rest.includes('done')) this.emit('done');
    if (rest.includes('cleanup')) this.emit('cleanup');
  }

  private flushCleanup(): void {
    const rest = this.events.slice(this.next).map((x) => x.ev);
    this.next = this.events.length;
    if (rest.includes('cleanup')) this.emit('cleanup');
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/entry.test.ts`
Expected: PASS, `Test Files  1 passed (1)` and `Tests  25 passed (25)`.

- [ ] **Step 5: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`:
- `npm test` → `Test Files  28 passed (28)`, `Tests  262 passed (262)` (Task 16's 27 files and 237 tests plus `tests/entry.test.ts` with 25; paste the real summary lines into the report).
- `npm run typecheck` → prints nothing (exit 0).
- `npm run build` → `tsc` prints nothing, then Vite ends with `✓ built in …` (the module is not imported yet, so the bundle is unchanged).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/field/entry.ts tests/entry.test.ts
git commit -m "feat(field): entry and Konami state machine

EntryMachine drives the 3.4.2 timeline (gather 900, hold 1000, dissolve 800;
scrim 1900, reveal 2100, done 2700, cleanup 3300), waits in pending until
ready and visible, never advances on a hidden tick, and skips with the
250 ms fast dissolve of 3.4.9. KONAMI_TIMINGS is 3200 ms with no scrim,
reveal or cleanup; 0 ms phases jump (P7).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: The entry on screen

**Files:**
- Modify: `src/app.ts` (entry machine, font wait, mask lifecycle, readiness, events → DOM, focus and context-loss skip, mask re-raster debounce, probe at `done`, `replayEntry()`)
- Modify: `src/main.ts` (4.7.2 takeover)
- Modify: `src/debugHooks.ts` (`setTime`, `setE`)
- Test: none new (the machine is pinned by `tests/entry.test.ts`); browser evidence under `evidence/task-18/`

**Interfaces:**
- Consumes: Task 17 `EntryPhase`, `EntryEvent`, `EntryTimings`, `EntryMachine`, `entryProgress(tMs: number, t: EntryTimings): number`; Task 11 `MaskBox`, `MaskGrid`, `MaskPlane`, `CanvasFactory`, `Canvas2DLike`, `MASK_FONT_FAMILY`, `rasterizeMask(text: string, box: MaskBox, grid: MaskGrid, font: { family: string; weight: number }, p: FieldParams['mask'], create: CanvasFactory): MaskPlane`, `maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox`; Task 15 `App` public API, its internals (`stepMask`, `onProgramsReady`, `regrid`, `fail`, `contextLost`, `firstFrameMs`, `programsReady`), `AppDebug`, `PnHooks`, the slice-2 `main.ts`; Task 1 `waitForFont(spec: string, timeoutMs: number, fonts?: FontFaceSetLike, schedule?: (fn: () => void, ms: number) => unknown): Promise<FontWaitResult>`; Task 5 `CONTENT.name`.
- Produces:
  - `App` behaviour: with `o.entry` true, `App.start` arms the entry (timings from `params.entry`), adds the `focusin` listener on `o.rail` and starts `waitForFont('700 10px "JetBrains Mono"', params.boot.fontTimeoutMs)`; readiness = programs ready + font settled + mask rasterised (`CONTENT.name`, `maskBoxFor('entry', …)`) and uploaded; events map to `<html>` per 4.4.5 (`start` → `data-field-ready`; `scrim` / `reveal` → `data-entry`; `skip` → `data-entry="skip"` + `data-field-ready`; `done` → `setMask(null)`, probe starts; `cleanup` → `data-entry` removed); `focusin` inside the rail while `data-entry` is present and context loss mid-entry call `skip(params.entry.skipMs)`; a resize re-rasterises an active mask 150 ms after the last resize; `replayEntry()` re-arms the full entry including `data-entry="wait"`.
  - `AppDebug` gains `pinEntry(ms: number | null): void` (advances the running entry or Konami machine to elapsed `ms`, forward only, firing the events passed, and holds it there; `null` releases) and `forceE(e: number | null): void` (overrides `maskE` while a mask is uploaded; `null` releases).
  - `PnHooks` gains `setTime(ms: number | null): void` (→ `pinEntry`) and `setE(e: number | null): void` (→ `forceE`).
  - `src/main.ts`: `function takeEntryControl(doc: Document, nowMs: number): boolean` implements 4.7.2 (`data-entry="run"` and `nowMs < 4000` → set `"wait"` and return `true`; otherwise remove `data-entry` and return `false`); `boot()` calls `takeEntryControl(doc, win.performance.now())` and passes the result as `AppOptions.entry`; a fallback after takeover removes `data-entry` (already in `applyFallback`).
- New `App` internals (private; Tasks 19 and 20 extend them by name): module-level `type MaskKind = 'entry'` and `function isRunning(m: EntryMachine | null): boolean`; fields `entry`, `maskKind`, `maskTimer`, `fontSettled`, `probeStarted`, `ended`, `pinnedMs`, `forcedE`; methods `beginEntry()`, `entryTimings()`, `onEntryEvent(ev)`, `prepareEntryMask()`, `uploadMask(kind)`, `maskBoxNow(kind)`, `maskCanvas(w, h)`, `clearMask()`, `scheduleMaskRaster()`, `cancelMaskRaster()`, `skipEntry()`, `startProbe()`, `maskBusy()`, `pinnedDt(m, dt)`, `pinEntry(ms)`, `forceE(e)`.
- Two readings recorded here so reviewers see them as plan, not drift: the `focusin` listener and the font wait are installed on every `App.start` (not only when `o.entry` is true), so a debug `replayEntry()` gets the same keyboard skip (3.4.9) and the font state is known (4.7.4 step 4 lists the font wait unconditionally); a `skip` releases a debug pin, so a Tab or a context loss during a pinned filmstrip still finishes its 250 ms dissolve.

- [ ] **Step 1: Record the RED state in the browser**

Start the dev server (Bash, `run_in_background: true`): `cd /c/Users/parsa/parsanaji.com && npm run dev`. Create the evidence folder: `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-18`.

`new_page` `http://localhost:5173/` with `isolatedContext: "t18-red"`, `emulate` `viewport: "1440x900x1"`, then `navigate_page` (`type: "url"`, same URL) with this `initScript` (ENTRY_LOG; it records every `data-entry` / `data-field-ready` change with its time and samples every `[data-reveal]` opacity 2997 ms after the canvas is shown):
```js
(() => {
  const log = (window.__entryLog = []);
  let t0 = null;
  const sample = () => ({
    t: performance.now(),
    entry: document.documentElement.getAttribute('data-entry'),
    opacities: [...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity),
  });
  new MutationObserver(() => {
    const h = document.documentElement;
    const entry = h.getAttribute('data-entry');
    const ready = h.hasAttribute('data-field-ready');
    const prev = log[log.length - 1];
    if (prev && prev.entry === entry && prev.ready === ready) return;
    log.push({ t: performance.now(), entry, ready });
    if (ready && t0 === null) {
      t0 = performance.now();
      window.__t0 = t0;
      setTimeout(() => { window.__at2997 = sample(); }, 2997);
    }
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-entry', 'data-field-ready'] });
})();
```
After 5 s, `evaluate_script` (READ_LOG, reused below):
```js
() => {
  const t0 = window.__t0;
  const rows = window.__entryLog.map((r) => ({ dt: t0 === undefined ? null : Math.round(r.t - t0), entry: r.entry, ready: r.ready }));
  const s = window.__at2997;
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];
  return {
    rows,
    at2997: s ? { dt: Math.round(s.t - t0), entry: s.entry, opacities: s.opacities } : null,
    t0: t0 === undefined ? null : Math.round(t0),
    fcp: fcp ? Math.round(fcp.startTime) : null,
  };
}
```
Expected before this task (P9: `takeEntryControl` removes `data-entry` at once): `rows` shows `entry: "run"` and then `entry: null` with no `"wait"`, `"scrim"` or `"reveal"` row. Record it in the report as the RED reading.

- [ ] **Step 2: Take control of the entry in `src/main.ts` (4.7.2)**

Every hunk in this task is an exact before/after pair: the "before" text occurs exactly once in the file named on its label line (as Tasks 15 and 16 left it, or as an earlier hunk of this task left it); replace it with the "after" text. Apply the hunks in the order given.

Replace Task 8's interim function (Task 15 kept it byte for byte).

`src/main.ts`, before (Tasks 8 and 15):
```ts
/** P9: there is no entry machine until Task 18, so main.ts releases the pre-hidden rail and plans no entry. */
function takeEntryControl(doc: Document): boolean {
  doc.documentElement.removeAttribute('data-entry');
  return false;
}
```
After:
```ts
/**
 * 4.7.2: when theme-boot.js set data-entry="run" and main.ts runs before 4000 ms, switch to "wait"
 * (cancelling the CSS failsafe) and plan the entry; otherwise the failsafe already showed the rail,
 * so remove data-entry and plan none (11.7).
 */
function takeEntryControl(doc: Document, nowMs: number): boolean {
  const html = doc.documentElement;
  if (html.getAttribute('data-entry') === 'run' && nowMs < 4000) {
    html.setAttribute('data-entry', 'wait');
    return true;
  }
  html.removeAttribute('data-entry');
  return false;
}
```
`src/main.ts`, before (Task 15):
```ts
  const entry = takeEntryControl(doc);
```
After:
```ts
  const entry = takeEntryControl(doc, win.performance.now());
```
Nothing else in `main.ts` changes: `entry` already flows into `App.start({ …, entry, … })`, and `applyFallback` already removes `data-entry` (3.6.2).

- [ ] **Step 3: `src/app.ts` imports, module helpers and `AppDebug`**

`src/app.ts`, before (Task 15):
```ts
import { FpsProbe } from './core/quality';
import { breathScale, effectiveIntensity } from './field/flow';
import type { FieldParams } from './field/params';
```
After (the imports stay sorted by path):
```ts
import { waitForFont } from './boot/fonts';
import { CONTENT } from './content';
import { FpsProbe } from './core/quality';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
import { breathScale, effectiveIntensity } from './field/flow';
import { MASK_FONT_FAMILY, maskBoxFor, rasterizeMask, type Canvas2DLike, type MaskBox } from './field/nameMask';
import type { FieldParams } from './field/params';
```
`src/app.ts`, before (Task 15, the end of `AppDebug`):
```ts
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
}
```
After:
```ts
  setFrozen(frozen: boolean): void; // freezes sim time and τ (panel "freeze time")
  pinEntry(ms: number | null): void; // P4, 4.7.5: __pn.setTime
  forceE(e: number | null): void; // P4, 4.7.5: __pn.setE
}
```
`src/app.ts`, before (Task 15, the last module constant before `export class App`):
```ts
const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');
```
After:
```ts
const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pointerType : 'mouse');

/** Which text the uploaded mask holds (4.5.7: one mask texture, built at arm, deleted at done). */
type MaskKind = 'entry';

/** A machine runs from arm() until its dissolve ends (3.4.2, 3.4.11). */
function isRunning(m: EntryMachine | null): boolean {
  return m !== null && m.phase !== 'idle' && m.phase !== 'done';
}
```

- [ ] **Step 4: Fields, `App.start`, `replayEntry()` and `debug()`**

`src/app.ts`, before (Task 15, the last two fields):
```ts
  private last: FrameInputs | null = null;
  private pendingColors: FieldColors | null = null;
```
After:
```ts
  private last: FrameInputs | null = null;
  private pendingColors: FieldColors | null = null;
  private entry: EntryMachine | null = null;                      // 3.4: the load entry; replayEntry() makes a new one
  private maskKind: MaskKind | null = null;                       // 4.5.7: which text the uploaded mask holds
  private maskTimer: ReturnType<typeof setTimeout> | null = null; // 3.7.1: re-raster debounce
  private fontSettled = false;                                    // 3.4.3 item 2
  private probeStarted = false;                                   // 3.7.9: the probe runs once per session
  private ended = false;                                          // set when fail() or dispose() runs the unbinds
  private pinnedMs: number | null = null;                         // __pn.setTime (P4)
  private forcedE: number | null = null;                          // __pn.setE (P4)
```
`src/app.ts`, before (Task 15, `App.start`):
```ts
      app.loop.start();
      return app;
```
After:
```ts
      app.loop.start();
      app.beginEntry(); // 4.7.4 steps 3–4
      return app;
```
`src/app.ts`, before (Task 15, the P11 no-op):
```ts
  /** P11: ignored until Task 18 adds the entry. */
  replayEntry(): void {}
```
After:
```ts
  /** Debug panel: re-arms the full entry including data-entry="wait" (4.3). Ignored while a mask runs. */
  replayEntry(): void {
    if (this.ended || this.disposed || this.reduced || !this.programsReady || this.maskBusy()) return;
    this.entry = new EntryMachine(this.entryTimings(), (ev) => this.onEntryEvent(ev));
    this.o.doc.documentElement.setAttribute('data-entry', 'wait');
    this.entry.arm();
    this.prepareEntryMask();
  }
```
`src/app.ts`, before (Task 15, `debug()`):
```ts
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
    };
```
After:
```ts
      setFrozen: (frozen) => {
        this.frozen = frozen;
      },
      pinEntry: (ms: number | null) => this.pinEntry(ms),
      forceE: (e: number | null) => this.forceE(e),
    };
```

- [ ] **Step 5: Replace `stepMask`, `onProgramsReady`; extend `regrid` and `contextLost`**

`src/app.ts`, before (Task 15):
```ts
  /** Mask progress e; Task 18 drives the entry and Konami machines here. */
  private stepMask(_dtMs: number, _visible: boolean): number {
    return 0;
  }
```
After:
```ts
  /** 4.4.3 step 2: e from the running machine; a debug pin holds it at the pinned entry time. */
  private stepMask(dtMs: number, visible: boolean): number {
    let e = 0;
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
    if (this.forcedE !== null && this.maskKind !== null) e = this.forcedE;
    return e;
  }
```
`src/app.ts`, before (Task 15: it sets `data-field-ready` and starts the FPS probe):
```ts
  /** The first real frame (3.4.7.1): show the canvas and start the FPS probe (3.7.9, 11.30). */
  private onProgramsReady(): void {
    this.o.doc.documentElement.setAttribute('data-field-ready', '');
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }
```
After:
```ts
  /** Programs ready (3.4.3 item 1): a planned entry now waits for its mask; without one this is the first real frame (3.4.7.1). */
  private onProgramsReady(): void {
    this.programsReady = true; // idempotent (frame() set it just before); prepareEntryMask() reads it
    if (isRunning(this.entry)) {
      this.prepareEntryMask(); // 3.4.3; 'start' or 'skip' shows the canvas, 'done' starts the probe
      return;
    }
    this.o.doc.documentElement.setAttribute('data-field-ready', ''); // 3.4.7.1: no-entry path
    this.startProbe(); // 3.7.9: first real frame without an entry
  }
```
`src/app.ts`, before (Task 15, the end of `regrid`):
```ts
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
  }
```
After:
```ts
    this.gridValue = computeGrid(r.width, r.height, this.o.win.devicePixelRatio, cellCss, deviceBox);
    this.renderer.resize(this.gridValue);
    this.scheduleMaskRaster(); // 3.7.1: an active mask is re-rasterised 150 ms after the last resize
  }
```
`src/app.ts`, before (Task 15):
```ts
  contextLost(): void {
    if (this.disposed) return;
    this.loop.stop();
```
After:
```ts
  contextLost(): void {
    if (this.disposed) return;
    this.skipEntry(); // 3.6.3, 3.4.9: context loss mid-entry makes the rail usable at once
    this.loop.stop();
```

- [ ] **Step 6: Add the entry methods**

They go after `bindPointer()`, the last method of the class. `src/app.ts`, before (Task 15, the end of `bindPointer()` and of the class):
```ts
      doc.documentElement.removeEventListener('pointerleave', onRelease);
    });
  }
}
```
After:
```ts
      doc.documentElement.removeEventListener('pointerleave', onRelease);
    });
  }

  /** 4.7.4 steps 3–4: arm the planned entry, skip it on rail focus (3.4.9, 3.5.11), wait for the mask font (3.4.3). */
  private beginEntry(): void {
    const rail = this.o.rail;
    if (rail) {
      const onFocusIn = (): void => {
        if (this.o.doc.documentElement.hasAttribute('data-entry')) this.skipEntry();
      };
      rail.addEventListener('focusin', onFocusIn);
      this.unbinds.push(() => rail.removeEventListener('focusin', onFocusIn));
    }
    this.unbinds.push(() => {
      this.ended = true;
      this.cancelMaskRaster();
    });
    const settle = (): void => {
      this.fontSettled = true;
      this.prepareEntryMask();
    };
    // 3.4.3 item 2, 3.6.7: loaded, timeout or unavailable all settle; MASK_FONT_FAMILY carries the fallback stack
    waitForFont('700 10px "JetBrains Mono"', this.params.boot.fontTimeoutMs, this.o.doc.fonts).then(settle, settle);
    if (this.o.entry && !this.reduced) {
      this.entry = new EntryMachine(this.entryTimings(), (ev) => this.onEntryEvent(ev));
      this.entry.arm();
    }
  }

  /** 4.9: the live (panel-tunable) entry times. */
  private entryTimings(): EntryTimings {
    const t = this.params.entry;
    return {
      gatherMs: t.gatherMs,
      holdMs: t.holdMs,
      dissolveMs: t.dissolveMs,
      scrimAtMs: t.scrimAtMs,
      revealAtMs: t.revealAtMs,
      cleanupAtMs: t.cleanupAtMs,
    };
  }

  /** 4.4.5: entry events to <html> state (3.4.7); no inline styles. */
  private onEntryEvent(ev: EntryEvent): void {
    const html = this.o.doc.documentElement;
    switch (ev) {
      case 'start':
        html.setAttribute('data-field-ready', '');
        break;
      case 'scrim':
        html.setAttribute('data-entry', 'scrim');
        break;
      case 'reveal':
        html.setAttribute('data-entry', 'reveal');
        break;
      case 'skip':
        this.pinnedMs = null; // a skip releases a debug pin so its 250 ms dissolve can run
        html.setAttribute('data-entry', 'skip');
        html.setAttribute('data-field-ready', '');
        break;
      case 'done':
        if (this.maskKind === 'entry') this.clearMask();
        if (this.programsReady) this.startProbe(); // 3.7.9: the probe starts at the entry's done
        break;
      case 'cleanup':
        html.removeAttribute('data-entry');
        break;
    }
  }

  /** 3.4.3: the entry leaves pending only when programs, font and mask are all ready. */
  private prepareEntryMask(): void {
    const entry = this.entry;
    if (!entry || entry.phase !== 'pending' || !this.programsReady || !this.fontSettled || this.ended || this.disposed) return;
    if (this.maskKind !== 'entry' && !this.uploadMask('entry')) {
      entry.skip(0); // no mask, no entry: show the rail and carry on as the no-entry path
      return;
    }
    entry.setReady(true);
  }

  /** 4.8, 4.5.7: rasterise the mask text for the current grid and upload it; false when that fails. */
  private uploadMask(kind: MaskKind): boolean {
    const grid = this.gridValue;
    if (!grid || this.ended || this.disposed) return false;
    try {
      const plane = rasterizeMask(
        CONTENT.name,
        this.maskBoxNow(kind),
        { cols: grid.cols, rows: grid.rows, cellCss: grid.cellCss, supersample: this.params.mask.supersample },
        { family: MASK_FONT_FAMILY, weight: this.params.mask.fontWeight },
        this.params.mask,
        (w, h) => this.maskCanvas(w, h),
      );
      this.renderer.setMask(plane);
      this.maskKind = kind;
      return true;
    } catch {
      return false;
    }
  }

  /** 3.4.6: the entry mask box is the whole field box (field-space CSS px). */
  private maskBoxNow(kind: MaskKind): MaskBox {
    return maskBoxFor(kind, { w: this.rect.width, h: this.rect.height }, null, false);
  }

  /** An offscreen 2D canvas for the rasteriser (4.8.1); never attached to the page. */
  private maskCanvas(w: number, h: number): Canvas2DLike {
    const c = this.o.doc.createElement('canvas');
    c.width = w;
    c.height = h;
    return c as unknown as Canvas2DLike;
  }

  /** 4.5.7: the mask texture is deleted at done. */
  private clearMask(): void {
    this.cancelMaskRaster();
    this.renderer.setMask(null);
    this.maskKind = null;
  }

  /** 3.7.1: an active mask is re-rasterised 150 ms after the last resize; until then the old one is drawn. */
  private scheduleMaskRaster(): void {
    if (this.maskKind === null || this.ended || this.disposed) return;
    this.cancelMaskRaster();
    this.maskTimer = setTimeout(() => {
      this.maskTimer = null;
      if (this.maskKind !== null) this.uploadMask(this.maskKind);
    }, this.params.boot.resizeDebounceMs);
  }

  private cancelMaskRaster(): void {
    if (this.maskTimer !== null) clearTimeout(this.maskTimer);
    this.maskTimer = null;
  }

  /** 3.4.9 triggers: focus inside the rail, reduced motion turning on, context loss. */
  private skipEntry(): void {
    this.entry?.skip(this.params.entry.skipMs);
  }

  /** 3.7.9: 60 frames from the entry's done, or from the first real frame without an entry; once per session. */
  private startProbe(): void {
    if (this.probeStarted) return;
    this.probeStarted = true;
    this.probe = new FpsProbe(this.params.probe.frames, this.params.probe.thresholdFps);
  }

  /** True while a mask machine runs (3.4.11: the Konami is ignored then; 3.6.4: the loop stays awake). */
  private maskBusy(): boolean {
    return isRunning(this.entry);
  }

  /** A pinned machine advances to the pinned entry time, forward only, then holds (dt 0). */
  private pinnedDt(m: EntryMachine, dtMs: number): number {
    return this.pinnedMs === null ? dtMs : Math.max(0, this.pinnedMs - m.elapsedMs);
  }

  /** P4: __pn.setTime(ms); null releases. Takes effect on the next frame. */
  private pinEntry(ms: number | null): void {
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
  }

  /** P4: __pn.setE(e) while a mask is uploaded; null releases. */
  private forceE(e: number | null): void {
    this.forcedE = e === null || !Number.isFinite(e) ? null : Math.min(1, Math.max(0, e));
  }
}
```

- [ ] **Step 7: `src/debugHooks.ts` gains `setTime` and `setE` (4.7.5)**

`src/debugHooks.ts`, before (Task 15, the end of `PnHooks`):
```ts
  grid(): Grid | null;
}
```
After:
```ts
  grid(): Grid | null;
  setTime(ms: number | null): void; // pins the running entry or Konami at entry time ms (forward only); null releases
  setE(e: number | null): void; // forces the mask progress while a mask is uploaded; null releases
}
```
`src/debugHooks.ts`, before (Task 15, the end of the hooks object that `installDebugHooks` assigns to `win.__pn`):
```ts
    grid: () => app.grid,
  };
```
After:
```ts
    grid: () => app.grid,
    setTime: (ms: number | null) => app.debug().pinEntry(ms),
    setE: (e: number | null) => app.debug().forceE(e),
  };
```

- [ ] **Step 8: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`:
- `npm test` → `Test Files  28 passed (28)`, `Tests  262 passed (262)` (Task 17's counts; no new test file).
- `npm run typecheck` → prints nothing.
- `npm run build` → `✓ built in …`. Then `grep -c "__pn" dist/assets/*.js` prints `:0` for every file (with `VITE_PN_DEBUG` unset, `debugHooks.ts` stays out of the production build, 4.12.1; `App.debug()` and its `pinEntry` / `forceE` exist in every build by P4).

- [ ] **Step 9: Entry timeline and the 6.1.8 reading (8.2.4)**

On the running dev server: `new_page` `http://localhost:5173/` (`isolatedContext: "t18-timeline"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` with the ENTRY_LOG `initScript` of Step 1. After 5 s run READ_LOG.

Expected `rows` (every `dt` may be up to one frame, 17 ms, late):
| dt | entry | ready |
|---|---|---|
| null or < 0 | `run` | false |
| null or < 0 | `wait` | false |
| 0 | `wait` | true |
| 1900–1917 | `scrim` | true |
| 2100–2117 | `reveal` | true |
| 3300–3317 | null | true |

and `at2997.opacities` is nine `"1"` strings (the eight blocks and the toggle), read at `at2997.dt` = 2997 plus a few ms of timer slack (6.1.8: the rail is fully visible by t = 2980 ms; designed 2980). Also record `t0` (navigation-relative ms of the entry's t = 0) and `fcp`: on the entry path the first contentful paint is the first visible field frame, so `fcp` lands within a frame or two after `t0` (6.1.7; the throttled budget run is Task 23). Save the result with `evaluate_script` `filePath` `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-18/entry-timeline.json` and write the six `dt` values into the report.

- [ ] **Step 10: Filmstrip with `__pn.setTime` (8.2.4)**

For each `T` in 450, 1400, 2300, 3400: `navigate_page` (`type: "url"`, `http://localhost:5173/`) with this `initScript` (PIN, with `T` replaced by the number). It pins the entry the moment `installDebugHooks` assigns `window.__pn`, which happens before the programs are ready, so the entry starts and jumps straight to `T`:
```js
(() => {
  const T = 450;
  Object.defineProperty(window, '__pn', {
    configurable: true,
    get() { return undefined; },
    set(hooks) {
      Object.defineProperty(window, '__pn', { value: hooks, writable: true, configurable: true });
      window.__pinnedBy = 'trap';
      hooks.setTime(T);
    },
  });
})();
```
Wait 1500 ms, then `evaluate_script`:
```js
() => ({ pinned: window.__pinnedBy, entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), noWebgl: document.documentElement.classList.contains('no-webgl') })
```
Expected (3.4.2): T 450 → `{ pinned: 'trap', entry: 'wait', ready: true, noWebgl: false }` (the name half formed); T 1400 → `entry: 'wait'` (name formed); T 2300 → `entry: 'reveal'` (scrim and reveal fired; the rail fades on the wall clock from the moment `reveal` fired); T 3400 → `entry: null` (cleanup fired, mask gone). (`installDebugHooks` assigns `win.__pn` with a plain assignment, so the trap's setter runs.)

The rail fade runs on the wall clock, so for T 2300 take the screenshot the moment `reveal` lands instead of after the 1500 ms wait: navigate with the PIN `initScript`, then run
```js
async () => {
  const h = document.documentElement;
  const t = performance.now();
  while (h.getAttribute('data-entry') !== 'reveal' && performance.now() - t < 5000) await new Promise((r) => setTimeout(r, 10));
  return h.getAttribute('data-entry');
}
```
(→ `reveal`) and `take_screenshot` at once (the blocks are mid-fade: each fades over 600 ms after its n × 40 ms delay); the attribute check above still reads `entry: 'reveal'` afterwards.

For T 1400 only, before the screenshot, bend the letters with the pointer over the `N` of "Naji" (about x 900, y 450 at 1440×900):
```js
async () => {
  for (let i = 0; i < 20; i++) {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 880 + i, clientY: 450, pointerType: 'mouse', isPrimary: true, bubbles: true }));
    await new Promise((r) => setTimeout(r, 16));
  }
  await new Promise((r) => setTimeout(r, 400));
  return 'moved';
}
```
`take_screenshot` each into `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-18/`: `1440x900-dark-t450.png` (the name half condensed out of the flow), `1440x900-dark-t1400.png` (the letters spread around the pointer: the 3.4.4 bend), `1440x900-dark-t2300.png` (letters melting, rail fading in), `1440x900-dark-t3400.png` (idle field under the rail). Open each with the Read tool and describe it in the report.

- [ ] **Step 11: Keyboard skip and context-loss skip (3.4.9, 3.5.11, 3.6.3)**

Tab: `navigate_page` with the PIN `initScript` at `T = 1400`, wait 1500 ms, `press_key` `Tab`, then within 100 ms `evaluate_script`:
```js
async () => {
  const h = document.documentElement;
  const now = { entry: h.getAttribute('data-entry'), focus: document.activeElement?.getAttribute('data-link'), opacity: getComputedStyle(document.querySelector('[data-reveal="5"]')).opacity };
  await new Promise((r) => setTimeout(r, 400));
  return { now, later: { entry: h.getAttribute('data-entry') } };
}
```
Expected: `now` = `{ entry: 'skip', focus: 'github', opacity: '1' }` (rail visible at once, no transition), `later.entry` = `null` (the 250 ms fast dissolve ended, `done` deleted the mask, `cleanup` removed `data-entry`). Screenshot `1440x900-dark-tab-skip.png` after `later`.

Context loss: `navigate_page` with the PIN `initScript` at `T = 1400`, wait 1500 ms, then:
```js
async () => {
  const gl = document.querySelector('canvas[data-field]').getContext('webgl2');
  const ext = gl.getExtension('WEBGL_lose_context');
  const h = document.documentElement;
  ext.loseContext();
  await new Promise((r) => setTimeout(r, 50));
  const lost = { entry: h.getAttribute('data-entry'), ready: h.hasAttribute('data-field-ready'), noWebgl: h.classList.contains('no-webgl') };
  ext.restoreContext();
  await new Promise((r) => setTimeout(r, 800));
  return { lost, after: { entry: h.getAttribute('data-entry'), noWebgl: h.classList.contains('no-webgl') } };
}
```
Expected: `lost` = `{ entry: 'skip', ready: true, noWebgl: false }`, `after` = `{ entry: null, noWebgl: false }`.

- [ ] **Step 12: Hidden at load (8.2.9)**

`new_page` `http://localhost:5173/` with `background: true` and `isolatedContext: "t18-hidden"`. Wait 3 s, then `evaluate_script` on that page (`pageId` of the new page, `waitForStableDom: false`):
```js
() => ({ vis: document.visibilityState, entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), noWebgl: document.documentElement.classList.contains('no-webgl') })
```
Expected: `{ vis: 'hidden', entry: 'wait', ready: false, noWebgl: false }` (the machine waits in pending; no readiness timeout, 11.8). Then `select_page` with `bringToFront: true`, wait 700 ms, `take_screenshot` `1440x900-dark-hidden-start.png` (the name forming now), wait 4 s more and run the same script: `{ vis: 'visible', entry: null, ready: true, noWebgl: false }`.

- [ ] **Step 13: Slow network: `main.ts` runs after the 4 s failsafe (4.7.2, 11.7; Review Focus)**

On a slow phone connection the module script can arrive after the CSS failsafe has already shown the rail. Then `takeEntryControl` must remove `data-entry` and plan no entry, never switch to `wait` (which would hide the rail the visitor is already reading). This `initScript` (LATE) shifts `performance.now()` 5000 ms ahead, which is exactly what `takeEntryControl(doc, win.performance.now())` sees in that case; the App's frame loop runs on `requestAnimationFrame` timestamps, which it leaves alone:
```js
(() => {
  const now = performance.now.bind(performance);
  performance.now = () => now() + 5000;
})();
```
Fresh page (`isolatedContext: "t18-late"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/` with LATE followed by the ENTRY_LOG script of Step 1 (concatenate the two IIFEs; ENTRY_LOG reads the shifted clock too, so its `dt` values stay relative). After 5 s run READ_LOG, then:
```js
() => ({ entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), noWebgl: document.documentElement.classList.contains('no-webgl'), opacities: [...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity) })
```
Expected: READ_LOG `rows` are `run` with `ready: false` (theme-boot.js), then `null` with `ready: false` (main.ts released the rail at once), then `null` with `ready: true` (the no-entry path fades the field in, 3.4.7.1); no `wait`, `scrim` or `reveal` row; `at2997.opacities` is nine `"1"`. The state script returns `{ entry: null, ready: true, noWebgl: false }` and nine `"1"` opacities. `list_console_messages` `types: ["error", "warn"]` → none. `take_screenshot` `1440x900-dark-late-boot.png` (the rail over the idle field, no name mask). Record the rows in the report.

- [ ] **Step 14: Shader programs that never finish compiling (3.4.3, 3.6.2, 11.8; Review Focus)**

A stalled or very slow driver must never leave the pre-hidden rail on a blank page: the readiness timeout falls back 3000 ms after the first animation frame. This `initScript` (STALL) makes `KHR_parallel_shader_compile` answer "still compiling" forever (the fake extension object also stands in where the real one is missing), records every change of the `<html>` state, and notes the first animation frame and the state at 2500 ms:
```js
(() => {
  const COMPLETION_STATUS_KHR = 0x91b1;
  const proto = WebGL2RenderingContext.prototype;
  const getExtension = proto.getExtension;
  proto.getExtension = function (name) {
    return name === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR } : getExtension.call(this, name);
  };
  const getProgramParameter = proto.getProgramParameter;
  proto.getProgramParameter = function (program, pname) {
    return pname === COMPLETION_STATUS_KHR ? false : getProgramParameter.call(this, program, pname);
  };
  const state = () => {
    const h = document.documentElement;
    return {
      t: Math.round(performance.now()),
      entry: h.getAttribute('data-entry'),
      noWebgl: h.classList.contains('no-webgl'),
      ready: h.hasAttribute('data-field-ready'),
      opacities: [...new Set([...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity))],
    };
  };
  window.__stall = [];
  requestAnimationFrame((t) => { window.__firstRaf = Math.round(t); });
  new MutationObserver(() => window.__stall.push(state())).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-entry', 'data-field-ready'] });
  setTimeout(() => { window.__stallAt2500 = state(); }, 2500);
})();
```
Fresh page (`isolatedContext: "t18-stall"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/` with STALL; wait 5 s, then:
```js
() => {
  const fallback = window.__stall.find((s) => s.noWebgl) ?? null;
  return { firstRaf: window.__firstRaf, at2500: window.__stallAt2500, fallback, afterFirstRaf: fallback ? fallback.t - window.__firstRaf : null, now: window.__stall.at(-1) };
}
```
Expected: `at2500` = `{ entry: 'wait', noWebgl: false, ready: false, opacities: ['0'] }` (the entry waits for its programs and the canvas stays hidden); `fallback` = `{ entry: null, noWebgl: true, ready: false, opacities: ['1'] }` with `afterFirstRaf` between 3000 and 4000 (the 3000 ms readiness timeout counts from the App's first frame, which can trail the page's first frame while the dev server serves the modules); `now` equals `fallback` (nothing changes afterwards). `list_console_messages` `types: ["warn"]` → exactly one message, `[pn] static fallback: field`; `types: ["error"]` → none. `take_screenshot` `1440x900-dark-stalled.png` (the rail on `--bg`, no field).

- [ ] **Step 15: Band entry and hold screenshots in both looks**

1440×900 light: `emulate` `colorScheme: "light"`, `navigate_page` with PIN `T = 1400`, wait 1500 ms, `take_screenshot` `1440x900-light-hold.png`; the dark one is `1440x900-dark-t1400.png` from Step 10 (also save a copy as `1440x900-dark-hold.png` with a fresh PIN load and no pointer).
390×844: `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`, `navigate_page` with PIN `T = 1400`, wait 1500 ms, `take_screenshot` `390x844-dark-hold.png` and, with `colorScheme: "light"`, `390x844-light-hold.png`. Expected: "Parsa Naji" spans about 84 % of the band width (3.4.6: about 54.6 CSS px, 40 px cap height at 2 CSS px cells) and sits centred in the band.
Resize debounce (3.7.1): with the 1440×900 PIN `T = 1400` page open, `emulate` `viewport: "1280x720x1"`, wait 400 ms, `take_screenshot` `1280x720-dark-hold-resized.png`: the name is re-centred in the new field (re-rasterised 150 ms after the resize).

- [ ] **Step 16: Console check (8.2.1, 8.3.2)**

Six fresh pages (`new_page` with `isolatedContext` `t18-c1` … `t18-c6`): viewports `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, each in `colorScheme` `dark` and `light`; for each, `emulate`, then `navigate_page` `type: "reload"`, wait 4 s (the entry completes), `list_console_messages` with `types: ["error", "warn"]` → no messages. Record the six results; `close_page` each page.

- [ ] **Step 17: Finish gate and report**

Load the `frontend-design` skill (Skill tool, `frontend-design:frontend-design`, Execution Notes) and review the filmstrip and hold screenshots against it; write the verdict, every measured number of Steps 9–15 and the evidence file list into `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-18-report.md`. Stop the dev server and close every page (Global Constraints, browser procedure).

- [ ] **Step 18: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/app.ts src/main.ts src/debugHooks.ts
git commit -m "feat(entry): the field forms the name on every load

main.ts takes control before 4000 ms (data-entry wait, 4.7.2); App arms the
EntryMachine, waits for the mask font, rasterises Parsa Naji over the whole
field and starts on the first visible ready frame. Events drive <html>
(4.4.5): field-ready at start, scrim, reveal, mask deleted and the FPS probe
at done, data-entry removed at cleanup. Rail focus and context loss skip
(3.4.9); an active mask re-rasterises 150 ms after a resize (3.7.1).
__pn.setTime and __pn.setE pin the timeline for the filmstrip (4.7.5).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Reduced motion

**Files:**
- Modify: `src/app.ts`
- Test: none new; browser evidence under `evidence/task-19/`

**Interfaces:**
- Consumes: Task 13 `Loop.wake()`; Task 10 `PointerModel.settled`; Task 8 `ColorTween.active`; Task 17 `EntryMachine.skip(fastMs?: number): void`; Task 15 internals `idle`, `reduced`, `tau`, `ripples`, `probe`, `onProgramsReady`, `spawnAllowed`; Task 18 entry wiring.
- Produces (`App` behaviour): under reduced motion τ starts at `params.staticTimeS` (12) and stays frozen; turning reduced motion on mid-session freezes the current τ (11.25) and skips a running entry; breath is 1; no rings spawn and existing rings are cleared; the FPS probe never runs; `idle()` returns true once the pointer is `settled` and no colour tween, Konami or resize is pending, so the loop idles; pointer events, resizes and `setColors` wake it (the tween keeps it awake until it ends); pointer repel stays on.
- New `App` internals: field `idling` (set by `idle()`, the only place that decides the loop goes idle); methods `beginReducedMotion()` and `wakeIfIdle()`. `wakeIfIdle()` calls `loop.wake()` only after a frame returned "idle", so a wake never doubles a frame that is already scheduled.

- [ ] **Step 1: Record the RED state in the browser**

Start the dev server (`npm run dev`, `run_in_background: true`) and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-19`. The reduced-motion init script (RM; `START` is `true` here; it also counts `requestAnimationFrame` calls):
```js
(() => {
  const START = true;
  const real = window.matchMedia.bind(window);
  const mql = new EventTarget();
  Object.assign(mql, {
    matches: START,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener(fn) { mql.addEventListener('change', fn); },
    removeListener(fn) { mql.removeEventListener('change', fn); },
  });
  window.__setReduced = (on) => {
    mql.matches = on;
    const ev = new Event('change');
    Object.assign(ev, { matches: on, media: mql.media });
    mql.dispatchEvent(ev);
  };
  window.matchMedia = (q) => (q.includes('prefers-reduced-motion') ? mql : real(q));
  const raf = window.requestAnimationFrame.bind(window);
  window.__raf = 0;
  window.requestAnimationFrame = (cb) => { window.__raf += 1; return raf(cb); };
})();
```
`new_page` `http://localhost:5173/` (`isolatedContext: "t19-red"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` with RM. Wait 2 s, `take_screenshot` `red-a.png`, wait 1 s, `take_screenshot` `red-b.png` (both with `filePath` in `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-19/`; every screenshot of this task goes there). Compare the field region right of the scrim (x 1000–1440) with sharp from the repo's devDependencies:
```bash
cd /c/Users/parsa/parsanaji.com && node -e "const s=require('sharp'),d='.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-19/';const f=(p)=>s(d+p).extract({left:1000,top:0,width:440,height:900}).raw().toBuffer();Promise.all([f(process.argv[1]),f(process.argv[2])]).then(([a,b])=>console.log(a.equals(b)?'identical':'different'))" red-a.png red-b.png
```
Expected before this task: `different` (τ and breath still advance). Record it as the RED reading.

- [ ] **Step 2: Field, start hook and the wake points**

Every hunk in this task is an exact before/after pair: the "before" text occurs exactly once in `src/app.ts` as Tasks 15 and 18 left it (or as an earlier hunk of this task left it); replace it with the "after" text, in the order given.

`src/app.ts`, before (Task 18, the last field):
```ts
  private forcedE: number | null = null;                          // __pn.setE (P4)
```
After:
```ts
  private forcedE: number | null = null;                          // __pn.setE (P4)
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
```
`src/app.ts`, before (Task 18, `App.start`):
```ts
      app.loop.start();
      app.beginEntry(); // 4.7.4 steps 3–4
```
After:
```ts
      app.loop.start();
      app.beginReducedMotion(); // 3.3.6.3, 3.6.4
      app.beginEntry(); // 4.7.4 steps 3–4
```
`src/app.ts`, before (Task 15, the end of `setColors`):
```ts
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
  }
```
After:
```ts
      this.pendingColors = null;
      this.tween.set(c);
    }
    this.loop.wake();
    this.wakeIfIdle(); // 4.6.6: under reduced motion the loop is woken until the tween ends
  }
```
`src/app.ts`, before (Task 15):
```ts
  resume(): void {
    if (this.disposed) return;
```
After:
```ts
  resume(): void {
    this.idling = false; // the restarted loop schedules its own frame
    if (this.disposed) return;
```
`src/app.ts`, before (Task 15, `resize` and `dprChanged`):
```ts
    this.regrid(deviceBox);
    this.loop.wake();
  }

  dprChanged(): void {
    this.resize(null);
  }
```
After:
```ts
    this.regrid(deviceBox);
    this.loop.wake();
    this.wakeIfIdle(); // 3.6.4: a resize renders one frame at the new size
  }

  dprChanged(): void {
    this.resize(null);
    this.wakeIfIdle(); // 3.6.4: a resize renders one frame at the new size
  }
```

- [ ] **Step 3: Reduced-motion rules in the frame and the guards**

`src/app.ts`, before (Task 15):
```ts
  /** Task 19 adds the reduced-motion behaviour; slice 2 only tracks the flag. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
  }
```
After:
```ts
  /** 3.6.4, 11.25: turning reduced motion on freezes the current τ (no jump), skips a running entry, clears rings. */
  reducedChanged(r: boolean): void {
    this.reduced = r;
    if (r) {
      this.skipEntry(); // 3.4.9 trigger
      this.ripples.clear(); // 3.3.8: rings are off under reduced motion
      this.probe = null; // 3.7.9: the probe never runs under reduced motion
    }
    this.wakeIfIdle(); // on: render the frozen still; off: restart the continuous loop
  }
```
`src/app.ts`, before (Task 15, the τ statement in `frame`):
```ts
        this.tau += (dtMs / 1000) * effectiveIntensity(this.params);
```
After:
```ts
        if (!this.reduced) this.tau += (dtMs / 1000) * effectiveIntensity(this.params); // 3.3.6.3: τ frozen under reduced motion
```
`src/app.ts`, before (Task 15, the `breath` member of the frame inputs):
```ts
        breath: breathScale(this.simMs, p.breath.amp, p.breath.periodMs),
```
After:
```ts
        breath: this.reduced ? 1 : breathScale(this.simMs, p.breath.amp, p.breath.periodMs), // 3.3.9
```
`src/app.ts`, before (Task 15):
```ts
  /** Spec 4.4.3 step 6: only reduced motion renders on demand; Task 19 adds the 3.6.4 settled condition. */
  private idle(): boolean {
    if (!this.reduced) return false;
    return false;
  }
```
After:
```ts
  /**
   * 3.6.4: on-demand rendering. Idle once the pointer is settled and no colour tween, Konami (or entry
   * skip) or mask re-raster is pending. Called once per frame by frame()'s return.
   */
  private idle(): boolean {
    const idle =
      this.reduced && this.programsReady && this.pointer.settled && !this.tween.active && !this.maskBusy() && this.maskTimer === null;
    this.idling = idle;
    return idle;
  }
```
`src/app.ts`, before (Task 15, the start of `spawnAllowed`):
```ts
  private spawnAllowed(e: PointerEvent): boolean {
    if (!e.isPrimary || e.button !== 0) return false;
```
After:
```ts
  private spawnAllowed(e: PointerEvent): boolean {
    if (this.reduced) return false; // 3.3.8, 3.6.4: no rings under reduced motion
    if (!e.isPrimary || e.button !== 0) return false;
```
`src/app.ts`, before (Task 18, `startProbe`):
```ts
    if (this.probeStarted) return;
```
After:
```ts
    if (this.probeStarted || this.reduced) return; // 3.7.9, 11.30: never under reduced motion
```

- [ ] **Step 4: Wake the loop from the mask timer and the debug hooks; add the two methods**

`src/app.ts`, before (Task 18, the timer callback of `scheduleMaskRaster`):
```ts
      if (this.maskKind !== null) this.uploadMask(this.maskKind);
    }, this.params.boot.resizeDebounceMs);
```
After:
```ts
      if (this.maskKind !== null) this.uploadMask(this.maskKind);
      this.wakeIfIdle();
    }, this.params.boot.resizeDebounceMs);
```
`src/app.ts`, before (Task 18, the end of `pinEntry`):
```ts
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
  }
```
After:
```ts
    this.pinnedMs = ms === null || !Number.isFinite(ms) ? null : Math.max(0, ms);
    this.wakeIfIdle();
  }
```
`src/app.ts`, before (Task 18, the end of `forceE`, the last method of the class):
```ts
    this.forcedE = e === null || !Number.isFinite(e) ? null : Math.min(1, Math.max(0, e));
  }
```
After (the two new private methods follow `forceE`):
```ts
    this.forcedE = e === null || !Number.isFinite(e) ? null : Math.min(1, Math.max(0, e));
    this.wakeIfIdle();
  }

  /** 3.3.6.3: the reduced-motion still is τ = staticTimeS (the OG still); pointer input wakes the on-demand loop (3.6.4). */
  private beginReducedMotion(): void {
    if (this.reduced) this.tau = this.params.staticTimeS;
    const win = this.o.win;
    const root = this.o.doc.documentElement;
    const wake = (): void => this.wakeIfIdle();
    const types = ['pointermove', 'pointerdown', 'pointerup', 'pointercancel'] as const;
    for (const type of types) win.addEventListener(type, wake, { passive: true });
    win.addEventListener('blur', wake);
    root.addEventListener('pointerleave', wake, { passive: true });
    this.unbinds.push(() => {
      for (const type of types) win.removeEventListener(type, wake);
      win.removeEventListener('blur', wake);
      root.removeEventListener('pointerleave', wake);
    });
  }

  /** Restarts an idle loop (one frame, then idle() decides again); a no-op while frames are running. */
  private wakeIfIdle(): void {
    if (!this.idling) return;
    this.idling = false;
    this.loop.wake();
  }
```
These wake listeners are added next to Task 15's own pointer listeners, which keep feeding `PointerModel`; they only restart the loop.

- [ ] **Step 5: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  28 passed (28)`, `Tests  262 passed (262)`; no new test file), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`).

- [ ] **Step 6: The static field (8.2.6)**

On the dev server, `new_page` (`isolatedContext: "t19-still"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/` with RM (`START = true`). Right after the navigation returns, `evaluate_script`:
```js
() => ({ entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready'), rail: [...document.querySelectorAll('[data-reveal]')].map((el) => getComputedStyle(el).opacity) })
```
Expected: `entry: null`, `ready: true`, `rail` nine `"1"` (the rail is visible in the first paint: `theme-boot.js` never set `data-entry`, 3.4.10).
Still: wait 2 s, `take_screenshot` `1440x900-dark-still-a.png`, wait 1 s, `take_screenshot` `1440x900-dark-still-b.png`, then run the Step 1 comparison with `1440x900-dark-still-a.png 1440x900-dark-still-b.png` → `identical`.
Repel: `evaluate_script` dispatching `new PointerEvent('pointermove', { clientX: 1200, clientY: 300, pointerType: 'mouse', isPrimary: true, bubbles: true })` on `window` 20 times 16 ms apart, wait 1200 ms (settled), `take_screenshot` `1440x900-dark-still-pointer.png`; comparison with `still-b` → `different` (pointer repel stays on, R13).
No rings: `take_screenshot` `1440x900-dark-ring-before.png`, then on the canvas
```js
() => {
  const c = document.querySelector('canvas[data-field]');
  const o = { clientX: 1200, clientY: 300, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true };
  c.dispatchEvent(new PointerEvent('pointerdown', o));
  c.dispatchEvent(new PointerEvent('pointerup', o));
  return 'clicked';
}
```
wait 500 ms, `take_screenshot` `1440x900-dark-ring-after.png`; comparison → `identical` (no Shockwave).
CSS side (3.6.4, 3.5.8): `grep -n -A8 "prefers-reduced-motion" src/styles.css` shows `.dot::after { animation: none; opacity: 0; }`, the `transition: none` list for `.lnk`, the toggle and `.keys`, and the `html[data-entry]` rule; paste it into the report (the CSS media block cannot be emulated by the init script).

- [ ] **Step 7: Reduced motion turning on mid-entry (3.4.9, 11.25)**

`navigate_page` with RM where `START = false` and, in the same `initScript` after it, the Task 18 PIN script with `T = 1400` (concatenate the two IIFEs). Wait 1500 ms (the name is held), then:
```js
async () => {
  const h = document.documentElement;
  window.__setReduced(true);
  const now = h.getAttribute('data-entry');
  await new Promise((r) => setTimeout(r, 500));
  return { now, later: h.getAttribute('data-entry') };
}
```
Expected: `{ now: 'skip', later: null }`. Then wait 1500 ms, `take_screenshot` `1440x900-dark-midswitch-a.png`, wait 1 s, `take_screenshot` `1440x900-dark-midswitch-b.png`, comparison → `identical` (τ frozen where it was, not jumped to 12).

- [ ] **Step 8: Crossfade under reduced motion, then idle (4.6.6, 3.6.4)**

`navigate_page` with RM (`START = true`), wait 2 s, then:
```js
async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const c0 = window.__raf;
  await wait(1000);
  const idleBefore = window.__raf - c0;
  document.querySelector('[data-theme-toggle]').click();
  await wait(1000);
  const c1 = window.__raf;
  await wait(2000);
  return { idleBefore, crossfade: c1 - c0 - idleBefore, idleAfter: window.__raf - c1, theme: document.documentElement.getAttribute('data-theme') };
}
```
Expected: `idleBefore: 0`; `crossfade` between 15 and 30 (the 300 ms tween keeps the loop awake, then one more frame); `idleAfter: 0` (no rAF callbacks for 2 s); `theme` is `light`. `take_screenshot` `1440x900-light-reduced.png`. Press the toggle once more to restore the OS look (`localStorage` key removed, 3.5.10).

- [ ] **Step 9: Console check**

`list_console_messages` with `types: ["error", "warn"]` on the Step 6–8 page → none. Then the normal-motion path still plays: a fresh page (`isolatedContext: "t19-normal"`) without RM at 1440×900 dark, wait 4 s, `evaluate_script` `() => document.documentElement.hasAttribute('data-entry')` → `false` and `list_console_messages` (`types: ["error", "warn"]`) → none. Write every comparison result into `task-19-report.md`, stop the dev server and close every page.

- [ ] **Step 10: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/app.ts
git commit -m "feat(field): reduced motion: frozen still, no rings, on-demand frames

Under prefers-reduced-motion τ starts at 12 s (the OG still) and stays
frozen, breath is 1, clicks spawn no rings and the FPS probe never runs.
The loop idles once the pointer is settled and no tween, Konami or mask
re-raster is pending; pointer input, resizes and theme changes wake it.
Turning reduced motion on mid-session freezes the current τ and skips a
running entry (3.6.4, 3.4.9, 11.25).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Konami "nice."

**Files:**
- Create: `src/eggs/konami.ts`
- Modify: `src/app.ts` (`konami()`), `src/main.ts` (the keydown listener)
- Test: `tests/konami.test.ts`

**Interfaces:**
- Consumes: Task 17 `EntryMachine`, `EntryTimings`; Task 11 `maskBoxFor(kind: 'entry' | 'konami', field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox`, `rasterizeMask`; Task 9 `BAND_QUERY`; Task 5 `CONTENT.konamiText`; Task 18 mask wiring; Task 19 reduced-motion flag.
- Produces:
  ```ts
  // src/eggs/konami.ts
  export const KONAMI: readonly string[]; // ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a
  export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void }; // b and a case-insensitive
  export function konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null; // maskBoxFor('konami', …), null when empty (Index amendment A11)
  ```
  `push` returns `true` only on the key that completes the code; any other key resets, and an overlapping prefix still matches. A `key` that is not a string (a synthetic keydown) is neutral like a lone Shift: it neither advances nor resets, and `push` never throws (Index amendment A12).
- Produces (`App.konami()` behaviour): ignored while the entry or another Konami runs, when the field is not running, and when `konamiMaskBox` returns null (the scrim leaves no clear field: rail windows about 720–790 px wide; Index amendment A11); mask box measured at trigger time from `o.scrim.getBoundingClientRect().right` and `o.win.matchMedia(BAND_QUERY).matches`; timings from `params.konami` with `scrimAtMs`, `revealAtMs` and `cleanupAtMs` null (3200 ms); under reduced motion `{ gatherMs: 0, holdMs: params.konami.holdMs, dissolveMs: 0 }` (P7); the rail stays visible.
- Produces (`src/main.ts`): after the scramble position of 4.7.1, `const konami = createKonami(() => app?.konami());` and `doc.addEventListener('keydown', (e) => { if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; konami.push(e.key); });`.
- New `App` internals: `MaskKind` widens to `'entry' | 'konami'`; field `konamiM`; `maskBusy()`, `stepMask()`, `uploadMask()` and `maskBoxNow()` learn the Konami; `maskBoxNow()` returns `MaskBox | null` (null from `konamiMaskBox`) and `uploadMask()` returns false on null. Until Task 22 adds `initScramble`, the listener sits directly before `const reduced = …`, which is the same position once Tasks 21 and 22 insert their calls above it.
- 3.4.11 reading pinned by a test: lone `Shift` and `CapsLock` keydowns neither advance nor reset the sequence, so `B` and `A` typed with Shift match ("either case"); every other key breaks the run.

- [ ] **Step 1: Write the failing test**

`tests/konami.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { KONAMI, createKonami, konamiMaskBox } from '../src/eggs/konami';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function detector() {
  let matches = 0;
  const k = createKonami(() => {
    matches += 1;
  });
  return { k, matches: () => matches, pushAll: (keys: readonly string[]) => keys.map((key) => k.push(key)) };
}

describe('KONAMI (spec 3.4.11)', () => {
  it('is the classic sequence', () => {
    expect(KONAMI).toEqual(CODE);
  });
});

describe('createKonami (spec 3.4.11, 8.1.15)', () => {
  it('fires once on the full sequence and push is true only on the completing key', () => {
    const d = detector();
    const results = d.pushAll(CODE);
    expect(results).toEqual([false, false, false, false, false, false, false, false, false, true]);
    expect(d.matches()).toBe(1);
  });

  it('fires again when the code is typed again', () => {
    const d = detector();
    d.pushAll(CODE);
    d.pushAll(CODE);
    expect(d.matches()).toBe(2);
  });

  it('matches after an overlapping prefix (↑ ↑ ↑ ↓ ↓ …)', () => {
    const d = detector();
    d.pushAll(['ArrowUp', ...CODE]);
    expect(d.matches()).toBe(1);
  });

  it('matches B and A in upper case (Caps Lock or Shift)', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'B', 'A']);
    expect(d.matches()).toBe(1);
  });

  it('lets Shift and CapsLock keydowns through without breaking the run', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'Shift', 'B', 'CapsLock', 'a']);
    expect(d.matches()).toBe(1);
  });

  it('ignores a keydown without a string key (a synthetic event) without throwing or breaking the run', () => {
    const d = detector();
    const odd = [undefined, null, 42] as unknown as string[]; // what a synthetic new Event('keydown') carries in e.key
    expect(() => d.pushAll([...CODE.slice(0, 4), ...odd, ...CODE.slice(4)])).not.toThrow();
    expect(d.matches()).toBe(1);
  });

  it('resets on a wrong key', () => {
    const d = detector();
    d.pushAll([...CODE.slice(0, 8), 'x', 'b', 'a']);
    expect(d.matches()).toBe(0);
    d.pushAll(['ArrowUp', 'ArrowUp', 'ArrowDown', 'Enter', ...CODE.slice(3)]);
    expect(d.matches()).toBe(0);
    d.pushAll(CODE);
    expect(d.matches()).toBe(1);
  });

  it('reset() forgets a partial sequence', () => {
    const d = detector();
    d.pushAll(CODE.slice(0, 5));
    d.k.reset();
    d.pushAll(CODE.slice(5));
    expect(d.matches()).toBe(0);
  });
});

describe('konamiMaskBox (spec 3.4.11, 11.17)', () => {
  it('is the clear field right of the scrim in the rail layout', () => {
    expect(konamiMaskBox({ w: 1440, h: 900 }, 950, false)).toEqual({ x: 950, y: 0, w: 490, h: 900 });
  });

  it('is the whole field on the band, and when there is no scrim', () => {
    expect(konamiMaskBox({ w: 390, h: 236 }, null, true)).toEqual({ x: 0, y: 0, w: 390, h: 236 });
    expect(konamiMaskBox({ w: 1440, h: 900 }, null, false)).toEqual({ x: 0, y: 0, w: 1440, h: 900 });
  });

  it('is null when the scrim reaches the field edge (rail windows about 720-790 px wide), so the Konami is skipped', () => {
    expect(konamiMaskBox({ w: 760, h: 700 }, 762, false)).toBeNull();
    expect(konamiMaskBox({ w: 760, h: 700 }, 760, false)).toBeNull();
    expect(konamiMaskBox({ w: 0, h: 0 }, null, true)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/konami.test.ts`
Expected: FAIL with `Error: Cannot find module '../src/eggs/konami' imported from C:/Users/parsa/parsanaji.com/tests/konami.test.ts`, `Test Files  1 failed (1)`, `Tests  no tests`.

- [ ] **Step 3: Write the detector**

`src/eggs/konami.ts`:
```ts
import { maskBoxFor, type MaskBox } from '../field/nameMask';

/** Konami detector (spec 3.4.11, R12c): ↑ ↑ ↓ ↓ ← → ← → b a, compared by KeyboardEvent.key. */
export const KONAMI: readonly string[] = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** Lone modifier keydowns neither advance nor reset, so Shift+B and Caps Lock work (3.4.11 "either case"). */
const NEUTRAL = new Set(['Shift', 'CapsLock']);

/**
 * Keeps the last KONAMI.length keys. Any other key breaks the run (it stays in the window, so the code
 * must be typed whole again), and an overlapping prefix such as ↑ ↑ ↑ ↓ ↓ … still matches.
 * The caller filters Ctrl, Meta, Alt and auto-repeat events before push (they neither advance nor reset).
 * A keydown without a string key (a synthetic event from an extension) is neutral too, so push never throws.
 */
export function createKonami(onMatch: () => void): { push(key: string): boolean; reset(): void } {
  let recent: string[] = [];
  return {
    push(key: string): boolean {
      if (typeof key !== 'string' || NEUTRAL.has(key)) return false;
      recent.push(key.length === 1 ? key.toLowerCase() : key);
      if (recent.length > KONAMI.length) recent.shift();
      if (recent.length < KONAMI.length || recent.some((k, i) => k !== KONAMI[i])) return false;
      recent = [];
      onMatch();
      return true;
    },
    reset(): void {
      recent = [];
    },
  };
}

/**
 * 3.4.11: the Konami mask box in field-space CSS px (maskBoxFor), or null when it is empty. On a rail
 * window about 720–790 px wide the scrim reaches past the field, so there is nowhere to write "nice.":
 * App.konami() then ignores the code instead of dimming the field around no text.
 */
export function konamiMaskBox(field: { w: number; h: number }, scrimRight: number | null, band: boolean): MaskBox | null {
  const box = maskBoxFor('konami', field, scrimRight, band);
  return box.w > 0 && box.h > 0 ? box : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/konami.test.ts`
Expected: PASS, `Test Files  1 passed (1)`, `Tests  12 passed (12)`.

- [ ] **Step 5: `App.konami()` and the Konami mask in `src/app.ts`**

Every hunk below is an exact before/after pair in `src/app.ts` as Tasks 15, 18 and 19 left it; apply them in order.

`src/app.ts`, before (Task 15, the `./field/sizing` import):
```ts
import { cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
```
After:
```ts
import { BAND_QUERY, cellCssFor, computeGrid, latticeSpacing, pointerRadius, type Grid } from './field/sizing';
```
`src/app.ts`, before (Task 18 imports):
```ts
import { FpsProbe } from './core/quality';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
```
After:
```ts
import { FpsProbe } from './core/quality';
import { konamiMaskBox } from './eggs/konami';
import { EntryMachine, type EntryEvent, type EntryTimings } from './field/entry';
```
`src/app.ts`, before (Task 18, the mask kind):
```ts
type MaskKind = 'entry';
```
After:
```ts
type MaskKind = 'entry' | 'konami';
```
`src/app.ts`, before (Task 19, the field `idling`):
```ts
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
```
After:
```ts
  private idling = false; // 3.6.4: the last frame returned idle; wakeIfIdle() restarts the loop
  private konamiM: EntryMachine | null = null; // 3.4.11: the running (or last) Konami
```
`src/app.ts`, before (Task 15, the P11 no-op):
```ts
  /** P11: ignored until Task 20 adds the Konami machine. */
  konami(): void {}
```
After:
```ts
  /**
   * 3.4.11: the field forms "nice." with the entry pipeline. Ignored while the entry or another Konami
   * runs, when the field is not running (fallback, lost context), and when the scrim leaves no clear
   * field to write in (konamiMaskBox). The rail stays visible.
   */
  konami(): void {
    if (this.ended || this.disposed || !this.programsReady || this.renderer.lost || this.maskBusy()) return;
    const k = this.params.konami;
    const timings: EntryTimings = this.reduced
      ? { gatherMs: 0, holdMs: k.holdMs, dissolveMs: 0, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null } // P7: jump, hold, jump
      : { gatherMs: k.gatherMs, holdMs: k.holdMs, dissolveMs: k.dissolveMs, scrimAtMs: null, revealAtMs: null, cleanupAtMs: null };
    if (!this.uploadMask('konami')) return; // no grid, a raster failure, or no clear field right of the scrim
    const m = new EntryMachine(timings, (ev) => {
      if (ev === 'done' && this.maskKind === 'konami') this.clearMask(); // 4.5.7; the FPS probe is not restarted (3.7.9)
    });
    m.arm();
    m.setReady(true);
    this.konamiM = m;
    this.wakeIfIdle();
  }
```
`src/app.ts`, before (Task 18, `stepMask`):
```ts
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
```
After:
```ts
    if (this.entry) e = this.entry.tick(this.pinnedDt(this.entry, dtMs), visible);
    if (this.konamiM) e = Math.max(e, this.konamiM.tick(this.pinnedDt(this.konamiM, dtMs), visible));
```
`src/app.ts`, before (Task 18, `maskBusy`):
```ts
    return isRunning(this.entry);
```
After:
```ts
    return isRunning(this.entry) || isRunning(this.konamiM);
```
`src/app.ts`, before (Task 18, the start of `uploadMask`):
```ts
    if (!grid || this.ended || this.disposed) return false;
    try {
      const plane = rasterizeMask(
        CONTENT.name,
        this.maskBoxNow(kind),
```
After:
```ts
    if (!grid || this.ended || this.disposed) return false;
    const box = this.maskBoxNow(kind);
    if (!box) return false; // 3.4.11: the scrim leaves no clear field, so there is nowhere to write "nice."
    try {
      const plane = rasterizeMask(
        kind === 'konami' ? CONTENT.konamiText : CONTENT.name, // 3.4.6, 3.4.11
        box,
```
`src/app.ts`, before (Task 18, the whole `maskBoxNow` method):
```ts
  /** 3.4.6: the entry mask box is the whole field box (field-space CSS px). */
  private maskBoxNow(kind: MaskKind): MaskBox {
    return maskBoxFor(kind, { w: this.rect.width, h: this.rect.height }, null, false);
  }
```
After:
```ts
  /**
   * 3.4.6: the entry box is the whole field. 3.4.11: the Konami box starts at the scrim's clear edge,
   * measured now (11.17); on the band, or without a scrim, it is the whole band. Null when the scrim
   * leaves no clear field (konamiMaskBox).
   */
  private maskBoxNow(kind: MaskKind): MaskBox | null {
    const field = { w: this.rect.width, h: this.rect.height };
    if (kind === 'entry') return maskBoxFor('entry', field, null, false);
    const band = this.o.win.matchMedia(BAND_QUERY).matches;
    const scrim = this.o.scrim;
    const scrimRight = !band && scrim ? scrim.getBoundingClientRect().right - this.rect.left : null;
    return konamiMaskBox(field, scrimRight, band || scrimRight === null);
  }
```
The Task 18 resize debounce re-runs `uploadMask(this.maskKind)`, so a Konami mask is re-measured and re-rasterised 150 ms after a resize too (3.7.1); if the resize leaves no clear field, the old mask keeps its old extent until the Konami's `done` deletes it.

- [ ] **Step 6: The keydown listener in `src/main.ts`**

`src/main.ts`, before (Task 15 imports):
```ts
import { seedFromLocation } from './core/prng';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
After:
```ts
import { seedFromLocation } from './core/prng';
import { createKonami } from './eggs/konami';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
`src/main.ts`, before (Task 15, in `boot()`):
```ts
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
After:
```ts
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
  doc.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; // these neither advance nor reset the sequence
    konami.push(e.key);
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

- [ ] **Step 7: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  29 passed (29)`, `Tests  274 passed (274)`: Task 19's 28 files and 262 tests plus `tests/konami.test.ts` with 12), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`).

- [ ] **Step 8: Browser evidence (8.2.11)**

Start the dev server (`npm run dev`, `run_in_background: true`) and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-20`. KONAMI_SERIES (dispatches `KEYS` as keydowns on `document`, then reads the canvas back once per 100 ms for 3.6 s inside an animation frame after the app's frame, counting field-3 pixels and the leftmost one in CSS px; the idle field never reaches field-3, 3.3.10):
```js
async () => {
  const KEYS = [{ key: 'ArrowUp' }, { key: 'ArrowUp' }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'ArrowLeft' }, { key: 'ArrowRight' }, { key: 'ArrowLeft' }, { key: 'ArrowRight' }, { key: 'b' }, { key: 'a' }];
  const c = document.querySelector('canvas[data-field]');
  const gl = c.getContext('webgl2');
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--field-3').trim();
  const f3 = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const read = () => new Promise((resolve) => requestAnimationFrame(() => {
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let n = 0, minX = w;
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      if (Math.abs(px[o] - f3[0]) <= 3 && Math.abs(px[o + 1] - f3[1]) <= 3 && Math.abs(px[o + 2] - f3[2]) <= 3) { n += 1; minX = Math.min(minX, i % w); }
    }
    resolve({ n, minXCss: n ? Math.round((minX * c.getBoundingClientRect().width) / w) : null });
  }));
  for (const d of KEYS) document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...d }));
  const t0 = performance.now();
  const series = [];
  while (performance.now() - t0 < 3600) {
    const r = await read();
    series.push([Math.round(performance.now() - t0), r.n, r.minXCss]);
    await new Promise((s) => setTimeout(s, 100));
  }
  const peak = series.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { scrimRight: Math.round(document.querySelector('.scrim').getBoundingClientRect().right), peak, series };
}
```
1. Rail layout: `new_page` `http://localhost:5173/?noentry` (`isolatedContext: "t20"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, reload, wait 1 s, run KONAMI_SERIES with `filePath` `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-20/konami-1440.json`. Expected: `scrimRight` about 950; `peak[1]` > 0; `peak[2]` (leftmost field-3 x) ≥ `scrimRight` (about `scrimRight` + 40, the "nice." box is x 950–1440 and the 137 px text is centred in it); the counts rise through about 900 ms, hold to about 2400 ms and are 0 from about 3200 ms (3.4.11, 3200 ms in total). Then the real keys: reload, wait 1 s, `press_key` `ArrowUp`, `ArrowUp`, `ArrowDown`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `ArrowLeft`, `ArrowRight`, `b`, `a`, wait 1200 ms, `take_screenshot` `1440x900-dark-konami.png` ("nice." right of the scrim, rail visible); repeat with `colorScheme: "light"` → `1440x900-light-konami.png`.
2. Band: `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`, reload `/?noentry`, wait 1 s, KONAMI_SERIES → `peak[1]` > 0 and `peak[2]` well left of 100 (the box is the whole band); press the keys again and `take_screenshot` `390x844-dark-konami.png`.
3. Ignored during the entry: `emulate` `viewport: "1440x900x1"`, `navigate_page` `http://localhost:5173/` with the Task 18 PIN `initScript` at `T = 1400`, wait 1500 ms, then SEND_KEYS:
   ```js
   () => {
     const KEYS = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
     for (const key of KEYS) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
     return { entry: document.documentElement.getAttribute('data-entry'), noWebgl: document.documentElement.classList.contains('no-webgl') };
   }
   ```
   → `{ entry: 'wait', noWebgl: false }`; then `() => window.__pn.setTime(null)`, wait 4 s (the entry finishes), run KONAMI_SERIES with `KEYS = []` → every `n` is 0 (the code was ignored, not queued).
4. Static fallback: reload `/?nowebgl`, run SEND_KEYS → it returns `{ entry: null, noWebgl: true }` without an exception, and `list_console_messages` `types: ["error", "warn"]` lists exactly one message, the DEV-only `[pn] static fallback: nowebgl` warning of 4.7.6 (production prints none), and no error.
5. Modifiers and repeats: reload `/?noentry`, run KONAMI_SERIES with `KEYS` = the code with `{ key: 'x', ctrlKey: true }`, `{ key: 'ArrowUp', repeat: true }`, `{ key: 'q', metaKey: true }` and `{ key: 'z', altKey: true }` inserted after the 2nd, 4th, 6th and 8th entries → `peak[1]` > 0 (they neither advanced nor reset). Then with `{ key: 'x' }` inserted after the 8th entry → every `n` is 0 (a plain wrong key resets).
6. Reduced motion: `navigate_page` `http://localhost:5173/?noentry` with the Task 19 RM `initScript` (`START = true`), wait 2 s, KONAMI_SERIES → the first sample already has the plateau count, the count is identical in every sample until about 1500 ms, and 0 afterwards (e jumps 0 → 1, holds 1500 ms, jumps to 0; P7; once the loop idles again a read returns the cleared drawing buffer, which also counts 0).
7. Narrow rail window (3.4.11, Review Focus; Index amendment A11): a fresh page (`isolatedContext: "t20-narrow"`), `emulate` `viewport: "740x700x1"`, `colorScheme: "dark"` (the rail layout: at least 720 px wide and not portrait), `navigate_page` `http://localhost:5173/?noentry`, wait 1 s, then (LIT counts the drawing-buffer pixels that are not field-0 before the code and at 1200 ms, which is inside a Konami's hold):
   ```js
   async () => {
     const c = document.querySelector('canvas[data-field]');
     const gl = c.getContext('webgl2');
     const hex = getComputedStyle(document.documentElement).getPropertyValue('--field-0').trim();
     const f0 = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
     const lit = () => new Promise((resolve) => requestAnimationFrame(() => {
       const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
       gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
       let n = 0;
       for (let i = 0; i < px.length; i += 4) if (Math.abs(px[i] - f0[0]) > 3 || Math.abs(px[i + 1] - f0[1]) > 3 || Math.abs(px[i + 2] - f0[2]) > 3) n += 1;
       resolve(n);
     }));
     const before = await lit();
     for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
     await new Promise((r) => setTimeout(r, 1200));
     const during = await lit();
     return {
       band: matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches,
       fieldW: Math.round(c.getBoundingClientRect().width),
       scrimRight: Math.round(document.querySelector('.scrim').getBoundingClientRect().right),
       before,
       during,
       ratio: Math.round((during / before) * 100) / 100,
     };
   }
   ```
   Expected: `band: false`, `fieldW: 740`, `scrimRight` ≥ 740 (the scrim reaches past the field, so `konamiMaskBox` returns null and `App.konami()` ignores the code); `ratio` between 0.8 and 1.25 (the field keeps flowing undimmed; a Konami running on an empty mask would cut the lit pixels to roughly a third by 1200 ms, through `mask.holdDim` 0.3); `list_console_messages` `types: ["error", "warn"]` → none. Save `take_screenshot` `740x700-dark-konami-skipped.png`. If `scrimRight` is below 740, this viewport has a clear strip after all: record the value and report it, because then the Konami must form `nice.` in that strip (KONAMI_SERIES shows `peak[1]` > 0 there).
8. `list_console_messages` `types: ["error", "warn"]` on every page except the `?nowebgl` one → none.

Write the measured `scrimRight`, `peak` and the series shapes into `task-20-report.md`; stop the dev server and close every page.

- [ ] **Step 9: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/eggs/konami.ts tests/konami.test.ts src/app.ts src/main.ts
git commit -m "feat(eggs): Konami code forms \"nice.\" in the field

createKonami watches document keydowns (Ctrl, Meta, Alt and repeats
ignored; b and a in either case; overlapping prefixes match). App.konami()
measures the scrim's clear edge (or the whole band) at trigger time and
plays gather 900, hold 1500, dissolve 800 with the entry pipeline; under
reduced motion e jumps to 1 and back. Ignored during the entry, another
Konami, or the static fallback (3.4.11).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Keyboard shortcuts and the "?" overlay

**Files:**
- Create: `src/eggs/shortcuts.ts`, `src/ui/overlay.ts`
- Modify: `src/main.ts`
- Test: `tests/shortcuts.test.ts`, `tests/overlay.test.ts`

**Interfaces:**
- Consumes: Task 7 `initLinks(linkedinUrl: string, doc?: Document): { linkedin: boolean }`, `initEmailCopy(…): { trigger(): Promise<CopyResult>; dispose(): void }`; Task 5 DOM contract (`dialog[data-keys]`, `[data-keys-close]`, `a[data-link]`).
- Produces:
  ```ts
  // src/eggs/shortcuts.ts
  export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';
  export interface KeyLike { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean; target: EventTarget | null }
  export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null;
  export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void;

  // src/ui/overlay.ts
  export function initOverlay(panel: HTMLDialogElement, doc: Document): { toggle(): void; close(): void; readonly open: boolean; dispose(): void };
  ```
- Produces (`src/main.ts`): `boot()` keeps `const { linkedin } = initLinks(…)` and the `initEmailCopy` handle; after `initTheme` it calls `initOverlay` on `dialog[data-keys]` (when present) and `initShortcuts(doc, run, { linkedin })`, where `run` ignores everything except `'overlay'` and `'close'` while the overlay is open, `'github'` / `'linkedin'` call `win.location.assign` with the matching anchor's `href`, `'email'` calls the email handle's `trigger()`, `'overlay'` toggles and `'close'` closes.
- Plan details: editable targets are `INPUT`, `TEXTAREA`, `SELECT` and any element whose `isContentEditable` is true (this covers `[contenteditable]` and its descendants); `initOverlay` returns focus to the opener on `close` only when the engine has not already done so (3.5.5); `showModal()` throwing (detached dialog) is caught (4.3.1).

- [ ] **Step 1: Write the failing tests**

`tests/shortcuts.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { initShortcuts, shortcutFor, type KeyLike, type ShortcutAction } from '../src/eggs/shortcuts';

const key = (k: string, extra: Partial<KeyLike> = {}): KeyLike => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  repeat: false,
  target: null,
  ...extra,
});
const ON = { linkedin: true };
const OFF = { linkedin: false };

/** A keydown as Node can build it: an Event carrying the KeyboardEvent fields the module reads. */
function keydown(k: string, mods: Partial<Pick<KeyLike, 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>> = {}): Event {
  return Object.assign(new Event('keydown'), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...mods });
}

describe('shortcutFor (spec 3.5.4, 8.1.15)', () => {
  it('maps g, l, e, ? and Escape', () => {
    expect(shortcutFor(key('g'), ON)).toBe('github');
    expect(shortcutFor(key('l'), ON)).toBe('linkedin');
    expect(shortcutFor(key('e'), ON)).toBe('email');
    expect(shortcutFor(key('?'), ON)).toBe('overlay');
    expect(shortcutFor(key('Escape'), ON)).toBe('close');
  });

  it('maps upper-case G, L and E like lower case (Caps Lock)', () => {
    expect(shortcutFor(key('G'), ON)).toBe('github');
    expect(shortcutFor(key('L'), ON)).toBe('linkedin');
    expect(shortcutFor(key('E'), ON)).toBe('email');
  });

  it('returns null for l while LinkedIn is absent (3.1.12)', () => {
    expect(shortcutFor(key('l'), OFF)).toBeNull();
    expect(shortcutFor(key('L'), OFF)).toBeNull();
    expect(shortcutFor(key('g'), OFF)).toBe('github');
  });

  it('ignores Ctrl, Meta and Alt chords and allows Shift', () => {
    expect(shortcutFor(key('g', { ctrlKey: true }), ON)).toBeNull();
    expect(shortcutFor(key('g', { metaKey: true }), ON)).toBeNull();
    expect(shortcutFor(key('?', { altKey: true }), ON)).toBeNull();
    const shifted = { ...key('?'), shiftKey: true };
    expect(shortcutFor(shifted, ON)).toBe('overlay');
  });

  it('ignores auto-repeat', () => {
    expect(shortcutFor(key('e', { repeat: true }), ON)).toBeNull();
  });

  it('ignores editable targets', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'input']) {
      expect(shortcutFor(key('g', { target: { tagName } as unknown as EventTarget }), ON)).toBeNull();
    }
    const editable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget;
    expect(shortcutFor(key('e', { target: editable }), ON)).toBeNull();
    const link = { tagName: 'A', isContentEditable: false } as unknown as EventTarget;
    expect(shortcutFor(key('e', { target: link }), ON)).toBe('email');
  });

  it('returns null for every other key', () => {
    for (const k of ['x', 'Enter', ' ', 'Tab', '/', 'ArrowUp', 'b', 'a']) expect(shortcutFor(key(k), ON)).toBeNull();
  });
});

describe('initShortcuts (spec 3.5.4)', () => {
  it('runs the mapped action for each document keydown and stops after dispose', () => {
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    const dispose = initShortcuts(doc as unknown as Document, (a) => ran.push(a), OFF);
    doc.dispatchEvent(keydown('g'));
    doc.dispatchEvent(keydown('l'));
    doc.dispatchEvent(keydown('E'));
    doc.dispatchEvent(keydown('?', { ctrlKey: true }));
    doc.dispatchEvent(keydown('Escape'));
    expect(ran).toEqual(['github', 'email', 'close']);
    dispose();
    doc.dispatchEvent(keydown('g'));
    expect(ran).toEqual(['github', 'email', 'close']);
  });

  it('ignores a keydown without a string key (a synthetic event) and never throws', () => {
    expect(shortcutFor(key(undefined as unknown as string), ON)).toBeNull();
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    const dispose = initShortcuts(doc as unknown as Document, (a) => ran.push(a), ON);
    expect(() => doc.dispatchEvent(new Event('keydown'))).not.toThrow();
    doc.dispatchEvent(keydown('g'));
    expect(ran).toEqual(['github']);
    dispose();
  });
});
```

`tests/overlay.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { initShortcuts, type ShortcutAction } from '../src/eggs/shortcuts';
import { initOverlay } from '../src/ui/overlay';

/** A <dialog> as far as the module uses it: open, showModal, close (fires 'close'), the close button. */
class FakeDialog extends EventTarget {
  open = false;
  showModalCalls = 0;
  closeCalls = 0;
  readonly button = new EventTarget();
  readonly inner = new EventTarget();
  showModal(): void {
    this.showModalCalls += 1;
    this.open = true;
  }
  close(): void {
    this.closeCalls += 1;
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }
  querySelector(selector: string): EventTarget | null {
    return selector === '[data-keys-close]' ? this.button : null;
  }
}

function setup() {
  const panel = new FakeDialog();
  const opener = { isConnected: true, focus: vi.fn() };
  const doc = { body: {}, activeElement: opener as unknown };
  const overlay = initOverlay(panel as unknown as HTMLDialogElement, doc as unknown as Document);
  return { panel, opener, doc, overlay };
}

/** A click whose target is `target`, dispatched on the dialog (Node has no DOM tree to bubble through). */
function clickOn(panel: FakeDialog, target: EventTarget): void {
  const ev = new Event('click');
  Object.defineProperty(ev, 'target', { value: target });
  panel.dispatchEvent(ev);
}

describe('initOverlay (spec 3.5.5)', () => {
  it('toggle() calls showModal() when closed and close() when open; open reflects the state', () => {
    const { panel, overlay } = setup();
    expect(overlay.open).toBe(false);
    overlay.toggle();
    expect(panel.showModalCalls).toBe(1);
    expect(overlay.open).toBe(true);
    overlay.toggle();
    expect(panel.closeCalls).toBe(1);
    expect(overlay.open).toBe(false);
  });

  it('closes on a backdrop click (target === dialog) and not on a click inside', () => {
    const { panel, overlay } = setup();
    overlay.toggle();
    clickOn(panel, panel.inner);
    expect(overlay.open).toBe(true);
    clickOn(panel, panel);
    expect(overlay.open).toBe(false);
  });

  it('closes from the close button', () => {
    const { panel, overlay } = setup();
    overlay.toggle();
    panel.button.dispatchEvent(new Event('click'));
    expect(overlay.open).toBe(false);
  });

  it('close() on a closed overlay does nothing', () => {
    const { panel, overlay } = setup();
    overlay.close();
    expect(panel.closeCalls).toBe(0);
  });

  it('returns focus to the opener when the dialog closes', () => {
    const { panel, doc, overlay, opener } = setup();
    overlay.toggle();
    doc.activeElement = panel.button; // showModal() moved focus to "close"
    overlay.close();
    expect(opener.focus).toHaveBeenCalledTimes(1);
  });

  it('leaves focus alone when the engine already returned it to the opener', () => {
    const { overlay, opener } = setup();
    overlay.toggle();
    overlay.close();
    expect(opener.focus).not.toHaveBeenCalled();
  });

  it('never throws when showModal() throws', () => {
    const { panel, overlay } = setup();
    panel.showModal = () => {
      throw new Error('InvalidStateError');
    };
    expect(() => overlay.toggle()).not.toThrow();
    expect(overlay.open).toBe(false);
  });

  it('dispose() removes the listeners', () => {
    const { panel, overlay } = setup();
    overlay.toggle();
    overlay.dispose();
    panel.button.dispatchEvent(new Event('click'));
    clickOn(panel, panel);
    expect(overlay.open).toBe(true);
  });

  it('leaves the shortcuts working when main.ts finds no panel (overlay null)', () => {
    const doc = new EventTarget();
    const ran: ShortcutAction[] = [];
    initShortcuts(doc as unknown as Document, (a) => ran.push(a), { linkedin: false });
    for (const k of ['g', '?', 'Escape']) {
      doc.dispatchEvent(Object.assign(new Event('keydown'), { key: k, ctrlKey: false, metaKey: false, altKey: false, repeat: false }));
    }
    expect(ran).toEqual(['github', 'overlay', 'close']);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/shortcuts.test.ts tests/overlay.test.ts`
Expected: FAIL, both suites with `Error: Cannot find module '../src/eggs/shortcuts' imported from …` (and `'../src/ui/overlay'` once the first module exists), `Test Files  2 failed (2)`, `Tests  no tests`.

- [ ] **Step 3: Write the modules**

`src/eggs/shortcuts.ts`:
```ts
/** Keyboard shortcuts (spec 3.5.4, R12a): g GitHub, l LinkedIn, e copy email, ? overlay, Escape close. */
export type ShortcutAction = 'github' | 'linkedin' | 'email' | 'overlay' | 'close';

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
  target: EventTarget | null;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** input, textarea, select and [contenteditable] targets keep their keys (3.5.4). */
function isEditable(target: EventTarget | null): boolean {
  const el = target as { tagName?: unknown; isContentEditable?: unknown } | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return EDITABLE_TAGS.has(el.tagName.toUpperCase()) || el.isContentEditable === true;
}

/**
 * Maps one keydown to an action. Ctrl, Meta and Alt chords, auto-repeat and editable targets map to
 * null; Shift is allowed (`?` needs it on US layouts, Caps Lock gives `G`). `?` is matched on
 * event.key, so any layout works. `l` maps only while the LinkedIn link exists (3.1.12).
 */
export function shortcutFor(e: KeyLike, opts: { linkedin: boolean }): ShortcutAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isEditable(e.target)) return null;
  switch (e.key) {
    case 'g':
    case 'G':
      return 'github';
    case 'l':
    case 'L':
      return opts.linkedin ? 'linkedin' : null;
    case 'e':
    case 'E':
      return 'email';
    case '?':
      return 'overlay';
    case 'Escape':
      return 'close';
    default:
      return null;
  }
}

/** One keydown listener on the document (3.5.4). Returns the function that removes it. */
export function initShortcuts(doc: Document, run: (a: ShortcutAction) => void, opts: { linkedin: boolean }): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    const action = shortcutFor(e, opts);
    if (action !== null) run(action);
  };
  doc.addEventListener('keydown', onKeyDown);
  return () => doc.removeEventListener('keydown', onKeyDown);
}
```

`src/ui/overlay.ts`:
```ts
/**
 * The "?" shortcuts overlay (spec 3.5.5): the native modal <dialog data-keys>. showModal() makes the
 * page inert, moves focus to the close button and closes natively on Escape; this module adds the
 * close button, the backdrop click for engines without `closedby`, and focus return to the opener.
 */
export function initOverlay(
  panel: HTMLDialogElement,
  doc: Document,
): { toggle(): void; close(): void; readonly open: boolean; dispose(): void } {
  const closeButton = panel.querySelector<HTMLButtonElement>('[data-keys-close]');
  let opener: HTMLElement | null = null;

  const close = (): void => {
    if (!panel.open) return;
    try {
      panel.close();
    } catch {
      // a detached dialog cannot close; nothing to undo
    }
  };
  const onCloseClick = (): void => close();
  const onPanelClick = (e: Event): void => {
    if (e.target === panel) close(); // the backdrop reports the dialog itself as the target
  };
  const onClosed = (): void => {
    const back = opener;
    opener = null;
    if (back && back.isConnected && doc.activeElement !== back) back.focus();
  };

  closeButton?.addEventListener('click', onCloseClick);
  panel.addEventListener('click', onPanelClick);
  panel.addEventListener('close', onClosed);

  return {
    toggle(): void {
      if (panel.open) {
        close();
        return;
      }
      const active = doc.activeElement;
      opener = active && active !== doc.body && typeof (active as HTMLElement).focus === 'function' ? (active as HTMLElement) : null;
      try {
        panel.showModal();
      } catch {
        opener = null; // not connected, or already open as a non-modal dialog
      }
    },
    close,
    get open(): boolean {
      return panel.open;
    },
    dispose(): void {
      closeButton?.removeEventListener('click', onCloseClick);
      panel.removeEventListener('click', onPanelClick);
      panel.removeEventListener('close', onClosed);
    },
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/shortcuts.test.ts tests/overlay.test.ts`
Expected: PASS, `Test Files  2 passed (2)`, `Tests  18 passed (18)` (9 + 9).

- [ ] **Step 5: Wire them in `src/main.ts`**

Every hunk below is an exact before/after pair in `src/main.ts` as Tasks 15, 16, 18 and 20 left it; apply them in order.

`src/main.ts`, before (Task 20 imports):
```ts
import { createKonami } from './eggs/konami';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
After:
```ts
import { createKonami } from './eggs/konami';
import { initShortcuts } from './eggs/shortcuts';
import { DEFAULT_FIELD, cloneField } from './field/params';
```
`src/main.ts`, before (Task 8 imports):
```ts
import { initLinks } from './ui/links';
```
After:
```ts
import { initLinks } from './ui/links';
import { initOverlay } from './ui/overlay';
```
Keep the LinkedIn presence. `src/main.ts`, before (Tasks 8 and 15):
```ts
  initLinks(CONTENT.links.linkedin, doc);
```
After:
```ts
  const { linkedin } = initLinks(CONTENT.links.linkedin, doc);
```
Keep the email handle (the anchor variable becomes `emailLink`, the handle `email`). `src/main.ts`, before (Task 15):
```ts
  const email = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  if (email) initEmailCopy(email, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') });
```
After:
```ts
  const emailLink = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  const email = emailLink
    ? initEmailCopy(emailLink, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') })
    : null;
```
The overlay and the shortcuts go directly after the `initTheme({ … })` statement and before the Task 20 Konami block. `src/main.ts`, before (Tasks 15 and 20):
```ts
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```
After:
```ts
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const keysPanel = doc.querySelector<HTMLDialogElement>('dialog[data-keys]');
  const overlay = keysPanel ? initOverlay(keysPanel, doc) : null; // 3.5.5; shortcuts work without it (4.3.1)
  initShortcuts(
    doc,
    (action) => {
      if (overlay?.open && action !== 'overlay' && action !== 'close') return; // 3.5.4: only ? and Escape while open
      switch (action) {
        case 'github':
        case 'linkedin': {
          const href = doc.querySelector<HTMLAnchorElement>(`a[data-link="${action}"]`)?.href;
          if (href) win.location.assign(href); // 11.28: same tab, like a click
          break;
        }
        case 'email':
          email?.trigger().catch(() => undefined); // 3.5.3: same copy, live region and mailto fallback
          break;
        case 'overlay':
          overlay?.toggle();
          break;
        case 'close':
          overlay?.close();
          break;
      }
    },
    { linkedin },
  );
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```

- [ ] **Step 6: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  31 passed (31)`, `Tests  292 passed (292)`: Task 20's counts plus these 2 files and 18 tests), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`).

- [ ] **Step 7: Browser evidence (8.2.11)**

Start the dev server and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-21`. `Location.assign` is unforgeable in Chrome (own, non-writable, non-configurable), so the evidence observes navigations through the Navigation API instead, cancelling them so the page stays (NAV `initScript`; verified in Chrome while writing this plan: `location.assign('https://github.com/parsanaji')` reports one cancelable `push` navigate event and the page stays):
```js
(() => {
  window.__navs = [];
  navigation.addEventListener('navigate', (e) => {
    window.__navs.push(e.destination.url);
    if (e.cancelable) e.preventDefault();
  });
})();
```
`new_page` (`isolatedContext: "t21"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/?noentry` with NAV. Then, reading state with `evaluate_script` after each key:
1. `press_key` `g` → `window.__navs` = `["https://github.com/parsanaji"]` and `location.pathname` = `/`.
2. `press_key` `e`, wait 150 ms → `document.querySelector('a[data-email]').hasAttribute('data-copied')` = `true` and `document.querySelector('[data-live]').textContent` = `Email address copied.`; `take_screenshot` `1440x900-dark-copied.png` (`copied` in place of `say hi`). If the clipboard refused, `__navs` gains `mailto:info@parsanaji.com` instead; record which.
3. Reload (NAV again), `press_key` `Tab` (focus on `github`), `press_key` `?` → `document.querySelector('dialog[data-keys]').open` = `true` and `document.activeElement.hasAttribute('data-keys-close')` = `true`; `take_screenshot` `1440x900-dark-overlay.png`, then with `colorScheme: "light"` `1440x900-light-overlay.png`.
4. While open: `press_key` `g` and `e` → `__navs` stays `[]` and `data-copied` stays absent (3.5.4).
5. `press_key` `Escape` → `open` = `false` and `document.activeElement.getAttribute('data-link')` = `github` (focus returned).
6. `press_key` `?` twice → open, then closed (toggle). Open it once more and `evaluate_script` `() => { const d = document.querySelector('dialog[data-keys]'); d.dispatchEvent(new MouseEvent('click', { bubbles: true })); return d.open; }` → `false` (backdrop rule).
7. Editable target: `evaluate_script` `() => { const i = document.createElement('input'); i.id = 't21-probe'; document.body.append(i); i.focus(); return document.activeElement === i; }` → `true`; `press_key` `g` → `__navs` unchanged; remove it with `() => document.getElementById('t21-probe').remove()`.
8. Tab order: reload, `press_key` `Tab` three times, recording `document.activeElement` after each with `() => document.activeElement.getAttribute('data-link') ?? (document.activeElement.hasAttribute('data-email') ? 'email' : document.activeElement.hasAttribute('data-theme-toggle') ? 'toggle' : document.activeElement.tagName)` → `github`, `email`, `toggle` (3.5.11, unchanged).
9. `list_console_messages` `types: ["error", "warn"]` → none, in both looks.

Write every reading into `task-21-report.md`; stop the dev server and close every page.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/eggs/shortcuts.ts src/ui/overlay.ts tests/shortcuts.test.ts tests/overlay.test.ts src/main.ts
git commit -m "feat(eggs): g/l/e/?/Esc shortcuts and the shortcuts overlay

One document keydown listener maps g, l (only with LinkedIn), e, ? and
Escape, ignoring Ctrl/Meta/Alt chords, repeats and editable targets; while
the native modal dialog is open only ? and Escape act. The overlay adds
the close button, the backdrop click and focus return (3.5.4, 3.5.5).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: Name scramble and console line

**Files:**
- Create: `src/eggs/scramble.ts`, `src/eggs/greeting.ts`
- Modify: `src/main.ts`
- Test: `tests/scramble.test.ts`, `tests/greeting.test.ts`

**Interfaces:**
- Consumes: Task 1 `mulberry32(seed: number): () => number`, `seedFromLocation(search: string, fallback?: () => number): number`; Task 5 `CONTENT`; Task 9 `params.scramble` (`DEFAULT_FIELD.scramble`).
- Produces:
  ```ts
  // src/eggs/scramble.ts
  export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';
  export function scrambleText(target: string, tMs: number, durMs: number, stepMs: number, rand: (step: number, i: number) => number): string;
  export function initScramble(el: HTMLElement, text: string, opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean }): () => void;

  // src/eggs/greeting.ts
  export function greet(log?: (...args: unknown[]) => void, email?: string): void; // exactly the call in 3.5.7
  ```
- Produces (`src/main.ts`, final 4.7.1 order): `greet()` is the first statement of `boot()`; after `initShortcuts`, `initScramble([data-name], CONTENT.name, { durMs: params.scramble.durMs, stepMs: params.scramble.stepMs, seed: seedFromLocation(win.location.search), reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches })`, then the Konami listener of Task 20, then `reduced`.
- Plan details: run k of a page uses `mulberry32(seed + k)` and draws a 15 × 10 table of glyph choices up front (`rand(step, i)` reads it), so a seed gives the same frames every time; frame k shows `scrambleText(text, k × stepMs, …)` and is scheduled at click time + k × stepMs, so timer lateness never accumulates; the frame at k = 15 (600 ms) writes the exact text and removes `aria-label`. Golden frames for seed 42 (computed by running this code): t = 0 `rg#wM Tt%i`, 40 `S&2WO ysAi`, 80 `9DrCT N5mB`, 200 `Pwxy= ?f?K`, 400 `Parsa QeLv`, 600 `Parsa Naji`.

- [ ] **Step 1: Write the failing tests**

`tests/scramble.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mulberry32 } from '../src/core/prng';
import { SCRAMBLE_GLYPHS, initScramble, scrambleText } from '../src/eggs/scramble';

const NAME = 'Parsa Naji';
const DUR = 600;
const STEP = 40;
/** scrambleText at t = 0, 40, 80, 200 and 400 ms for seed 42 (computed by running this code). */
const GOLDEN_42: readonly string[] = ['rg#wM Tt%i', 'S&2WO ysAi', '9DrCT N5mB', 'Pwxy= ?f?K', 'Parsa QeLv'];

/** rand from a seeded mulberry32 table, the way initScramble builds it. */
function seededRand(seed: number): (step: number, i: number) => number {
  const next = mulberry32(seed);
  const table = Array.from({ length: 15 }, () => Array.from({ length: NAME.length }, () => next()));
  return (step, i) => table[step]?.[i] ?? 0;
}

/** The h1 as far as the module uses it. */
class FakeName extends EventTarget {
  textContent: string = NAME;
  readonly attrs = new Map<string, string>();
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }
  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }
  click(): void {
    this.dispatchEvent(new Event('click'));
  }
}

describe('SCRAMBLE_GLYPHS (spec 3.5.6)', () => {
  it('is letters, digits and #%&*+=?@<>/, all printable ASCII inside the font subset', () => {
    expect(SCRAMBLE_GLYPHS).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/');
    expect(new Set(SCRAMBLE_GLYPHS).size).toBe(SCRAMBLE_GLYPHS.length);
    for (const ch of SCRAMBLE_GLYPHS) {
      const code = ch.charCodeAt(0);
      expect(code).toBeGreaterThanOrEqual(0x21);
      expect(code).toBeLessThanOrEqual(0x7e);
    }
  });
});

describe('scrambleText (spec 3.5.6, 8.1.15)', () => {
  const rand = seededRand(42);

  it('ends on the exact target', () => {
    expect(scrambleText(NAME, DUR, DUR, STEP, rand)).toBe(NAME);
    expect(scrambleText(NAME, 5000, DUR, STEP, rand)).toBe(NAME);
  });

  it('keeps the space and the length at every step', () => {
    for (let t = 0; t <= DUR; t += STEP) {
      const s = scrambleText(NAME, t, DUR, STEP, rand);
      expect(s).toHaveLength(NAME.length);
      expect(s[5]).toBe(' ');
    }
  });

  it('draws every unsettled glyph from SCRAMBLE_GLYPHS', () => {
    for (let t = 0; t < DUR; t += STEP) {
      const s = scrambleText(NAME, t, DUR, STEP, rand);
      for (let i = 0; i < s.length; i++) if (i !== 5 && s[i] !== NAME[i]) expect(SCRAMBLE_GLYPHS).toContain(s[i]);
    }
  });

  it('settles letter i by durMs × (0.3 + 0.7 × i / (n − 1))', () => {
    const slash = (): number => 0.9999; // always "/", which "Parsa Naji" does not contain
    for (let i = 0; i < NAME.length; i++) {
      if (i === 5) continue;
      const settle = DUR * (0.3 + (0.7 * i) / (NAME.length - 1));
      expect(scrambleText(NAME, settle, DUR, STEP, slash)[i]).toBe(NAME[i]);
      expect(scrambleText(NAME, settle - 1, DUR, STEP, slash)[i]).toBe('/');
    }
  });

  it('is deterministic for a seed', () => {
    const a = seededRand(7);
    const b = seededRand(7);
    const c = seededRand(8);
    const frames = (r: (s: number, i: number) => number) => Array.from({ length: 15 }, (_, k) => scrambleText(NAME, k * STEP, DUR, STEP, r));
    expect(frames(a)).toEqual(frames(b));
    expect(frames(a)).not.toEqual(frames(c));
  });

  it('matches the golden first frames for seed 42', () => {
    expect([0, 40, 80, 200, 400].map((t) => scrambleText(NAME, t, DUR, STEP, rand))).toEqual(GOLDEN_42);
  });
});

describe('initScramble (spec 3.5.6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const opts = (reduced = false) => ({ durMs: DUR, stepMs: STEP, seed: 42, reduced: () => reduced });

  it('scrambles on click, carries aria-label while running, and settles at 600 ms', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    expect(el.attrs.get('aria-label')).toBe(NAME);
    expect(el.textContent).toBe(GOLDEN_42[0]);
    vi.advanceTimersByTime(40);
    expect(el.textContent).toBe(GOLDEN_42[1]);
    vi.advanceTimersByTime(519);
    expect(el.textContent).not.toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(true);
    vi.advanceTimersByTime(41);
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
  });

  it('ignores a click during a running scramble', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    vi.advanceTimersByTime(300);
    el.click();
    vi.advanceTimersByTime(300);
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
  });

  it('uses a new seed for the next run', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    const first = el.textContent;
    vi.advanceTimersByTime(600);
    el.click();
    expect(el.textContent).not.toBe(first);
    expect(el.textContent).toBe(scrambleText(NAME, 0, DUR, STEP, seededRand(43)));
  });

  it('does nothing under reduced motion', () => {
    const el = new FakeName();
    initScramble(el as unknown as HTMLElement, NAME, opts(true));
    el.click();
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dispose() stops a running scramble on the exact text and removes the listener', () => {
    const el = new FakeName();
    const dispose = initScramble(el as unknown as HTMLElement, NAME, opts());
    el.click();
    dispose();
    expect(el.textContent).toBe(NAME);
    expect(el.attrs.has('aria-label')).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    el.click();
    expect(el.textContent).toBe(NAME);
  });
});
```

`tests/greeting.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { greet } from '../src/eggs/greeting';

describe('greet (spec 3.5.7, 8.1.15)', () => {
  it('logs exactly one styled line with the email', () => {
    const log = vi.fn();
    greet(log);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]).toEqual([
      '%cParsa Naji — say hi: info@parsanaji.com',
      'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0',
    ]);
  });

  it('defaults to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    greet();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('%cParsa Naji — say hi: info@parsanaji.com');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/scramble.test.ts tests/greeting.test.ts`
Expected: FAIL with `Error: Cannot find module '../src/eggs/scramble' imported from …` and `Error: Cannot find module '../src/eggs/greeting' imported from …`, `Test Files  2 failed (2)`, `Tests  no tests`.

- [ ] **Step 3: Write the modules**

`src/eggs/scramble.ts`:
```ts
import { mulberry32 } from '../core/prng';

/** Printable ASCII letters, digits and #%&*+=?@<>/: every glyph is inside the font subset (3.5.6, 3.5.13). */
export const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?@<>/';

/**
 * The text at scramble time tMs (3.5.6): letter i (0-based, n letters) settles at
 * durMs × (0.3 + 0.7 × i / (n − 1)); before that it shows the glyph rand(step, i) picks for the
 * current stepMs step. Spaces never change, so the mono advance keeps the layout still.
 */
export function scrambleText(
  target: string,
  tMs: number,
  durMs: number,
  stepMs: number,
  rand: (step: number, i: number) => number,
): string {
  const n = target.length;
  const step = stepMs > 0 ? Math.floor(tMs / stepMs) : 0;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = target[i];
    const settleMs = n > 1 ? durMs * (0.3 + (0.7 * i) / (n - 1)) : durMs;
    if (ch === ' ' || tMs >= settleMs) {
      out += ch;
      continue;
    }
    const r = rand(step, i);
    const k = Math.min(SCRAMBLE_GLYPHS.length - 1, Math.max(0, Math.floor(r * SCRAMBLE_GLYPHS.length)));
    out += SCRAMBLE_GLYPHS[k];
  }
  return out;
}

/**
 * A click on the name scrambles it and settles back over durMs, one frame every stepMs (3.5.6).
 * Glyph choices come from mulberry32, seeded per run from `seed`. A click during a run is ignored;
 * reduced() true disables it. While running the element carries aria-label = text. Returns dispose.
 */
export function initScramble(
  el: HTMLElement,
  text: string,
  opts: { durMs: number; stepMs: number; seed: number; reduced: () => boolean },
): () => void {
  const steps = opts.stepMs > 0 ? Math.ceil(opts.durMs / opts.stepMs) : 0;
  let runs = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (): void => {
    timer = null;
    el.textContent = text;
    el.removeAttribute('aria-label');
  };

  const onClick = (): void => {
    if (timer !== null || opts.reduced()) return;
    const next = mulberry32((opts.seed + runs) >>> 0);
    runs += 1;
    const table = Array.from({ length: steps }, () => Array.from({ length: text.length }, () => next()));
    const rand = (step: number, i: number): number => table[step]?.[i] ?? 0;
    const t0 = Date.now();
    let step = 0;
    el.setAttribute('aria-label', text);
    const frame = (): void => {
      if (step >= steps) {
        finish();
        return;
      }
      el.textContent = scrambleText(text, step * opts.stepMs, opts.durMs, opts.stepMs, rand);
      step += 1;
      // anchored to the click time, so timer lateness never accumulates past durMs
      timer = setTimeout(frame, Math.max(0, t0 + step * opts.stepMs - Date.now()));
    };
    frame();
  };

  el.addEventListener('click', onClick);
  return () => {
    el.removeEventListener('click', onClick);
    if (timer !== null) {
      clearTimeout(timer);
      finish();
    }
  };
}
```

`src/eggs/greeting.ts`:
```ts
import { CONTENT } from '../content';

const STYLE = 'font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 700; color: #3b5df0';

/** 3.5.7 (R12d): the one console line, and the only production log. Defaults are read at call time. */
export function greet(log: (...args: unknown[]) => void = console.log, email: string = CONTENT.email): void {
  log(`%cParsa Naji — say hi: ${email}`, STYLE);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /c/Users/parsa/parsanaji.com && npx vitest run tests/scramble.test.ts tests/greeting.test.ts`
Expected: PASS, `Test Files  2 passed (2)`, `Tests  14 passed (14)` (12 + 2).

- [ ] **Step 5: Wire them in `src/main.ts` (final 4.7.1 order)**

Every hunk below is an exact before/after pair in `src/main.ts` as Tasks 15–21 left it; apply them in order.

`src/main.ts`, before (Task 15 and 20 imports):
```ts
import { seedFromLocation } from './core/prng';
import { createKonami } from './eggs/konami';
```
After:
```ts
import { seedFromLocation } from './core/prng';
import { greet } from './eggs/greeting';
import { createKonami } from './eggs/konami';
import { initScramble } from './eggs/scramble';
```
The greeting is the first statement of `boot()`. `src/main.ts`, before (Task 15):
```ts
async function boot(): Promise<void> {
  const doc = document;
```
After:
```ts
async function boot(): Promise<void> {
  greet(); // 3.5.7, 4.7.1
  const doc = document;
```
The scramble goes directly after the `initShortcuts(…);` statement of Task 21 and before the Task 20 Konami block. `src/main.ts`, before (Tasks 20 and 21):
```ts
    { linkedin },
  );
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```
After:
```ts
    { linkedin },
  );
  const nameEl = doc.querySelector<HTMLElement>('[data-name]');
  if (nameEl) {
    initScramble(nameEl, CONTENT.name, {
      durMs: params.scramble.durMs,
      stepMs: params.scramble.stepMs,
      seed: seedFromLocation(win.location.search),
      reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches, // 3.6.4: read per click
    });
  }
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
```
After this step `src/main.ts` is exactly the file below (Tasks 8, 15, 16, 18, 20, 21 and 22). Save it to a scratch path and compare: `diff <(tr -d '\r' < src/main.ts) <scratch copy>` prints nothing; any difference is a wiring bug to fix before the gate.
```ts
// Boot orchestration (spec 4.7): the rail's DOM modules and the theme, then the field gate (4.7.3) and the App (4.7.4).
import { App } from './app';
import { CONTENT } from './content';
import { seedFromLocation } from './core/prng';
import { greet } from './eggs/greeting';
import { createKonami } from './eggs/konami';
import { initScramble } from './eggs/scramble';
import { initShortcuts } from './eggs/shortcuts';
import { DEFAULT_FIELD, cloneField } from './field/params';
import { initTheme } from './theme/themeController';
import { startClock } from './ui/clock';
import { initEmailCopy } from './ui/emailCopy';
import { initLinks } from './ui/links';
import { initOverlay } from './ui/overlay';

/** Spec 4.12.1: true on the dev server and preview builds, false (and folded away) in production. */
const PN_DEBUG = import.meta.env.DEV || import.meta.env.VITE_PN_DEBUG === '1';

/** One console.warn per failure on the dev server; production logs nothing at warn or error level (4.7.6). */
function devWarn(message: string): void {
  if (import.meta.env.DEV) console.warn(`[pn] ${message}`);
}

/** localStorage, or null where reading it throws (blocked storage counts as "system", 3.5.10). */
function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** Spec 3.6.2: no field; the rail shows at once. One DEV warning per failure, nothing in production. */
function applyFallback(doc: Document, reason: string): void {
  devWarn(`static fallback: ${reason}`);
  doc.documentElement.classList.add('no-webgl');
  doc.documentElement.removeAttribute('data-entry');
}

/**
 * 4.7.2: when theme-boot.js set data-entry="run" and main.ts runs before 4000 ms, switch to "wait"
 * (cancelling the CSS failsafe) and plan the entry; otherwise the failsafe already showed the rail,
 * so remove data-entry and plan none (11.7).
 */
function takeEntryControl(doc: Document, nowMs: number): boolean {
  const html = doc.documentElement;
  if (html.getAttribute('data-entry') === 'run' && nowMs < 4000) {
    html.setAttribute('data-entry', 'wait');
    return true;
  }
  html.removeAttribute('data-entry');
  return false;
}

async function boot(): Promise<void> {
  greet(); // 3.5.7, 4.7.1
  const doc = document;
  const win = window;
  const query = new URLSearchParams(win.location.search);
  const params = cloneField(DEFAULT_FIELD);
  let app: App | null = null;
  const { linkedin } = initLinks(CONTENT.links.linkedin, doc);
  const emailLink = doc.querySelector<HTMLAnchorElement>('a[data-email]');
  const email = emailLink
    ? initEmailCopy(emailLink, CONTENT.email, { holdMs: params.copy.holdMs, live: doc.querySelector<HTMLElement>('[data-live]') })
    : null;
  const time = doc.querySelector<HTMLTimeElement>('time[data-clock-time]');
  const clock = doc.querySelector<HTMLElement>('[data-clock]');
  if (time && clock) {
    startClock(time, CONTENT.clock.timeZone);
    clock.hidden = false; // no JavaScript, no clock (3.5.13)
  }
  const theme = initTheme({
    doc,
    storage: safeStorage(win),
    systemDark: win.matchMedia('(prefers-color-scheme: dark)'),
    button: doc.querySelector<HTMLButtonElement>('[data-theme-toggle]'),
    onChange: (colors, animate) => app?.setColors(colors, animate),
  });
  const keysPanel = doc.querySelector<HTMLDialogElement>('dialog[data-keys]');
  const overlay = keysPanel ? initOverlay(keysPanel, doc) : null; // 3.5.5; shortcuts work without it (4.3.1)
  initShortcuts(
    doc,
    (action) => {
      if (overlay?.open && action !== 'overlay' && action !== 'close') return; // 3.5.4: only ? and Escape while open
      switch (action) {
        case 'github':
        case 'linkedin': {
          const href = doc.querySelector<HTMLAnchorElement>(`a[data-link="${action}"]`)?.href;
          if (href) win.location.assign(href); // 11.28: same tab, like a click
          break;
        }
        case 'email':
          email?.trigger().catch(() => undefined); // 3.5.3: same copy, live region and mailto fallback
          break;
        case 'overlay':
          overlay?.toggle();
          break;
        case 'close':
          overlay?.close();
          break;
      }
    },
    { linkedin },
  );
  const nameEl = doc.querySelector<HTMLElement>('[data-name]');
  if (nameEl) {
    initScramble(nameEl, CONTENT.name, {
      durMs: params.scramble.durMs,
      stepMs: params.scramble.stepMs,
      seed: seedFromLocation(win.location.search),
      reduced: () => win.matchMedia('(prefers-reduced-motion: reduce)').matches, // 3.6.4: read per click
    });
  }
  const konami = createKonami(() => app?.konami()); // 3.4.11; app is null on the static fallback
  doc.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return; // these neither advance nor reset the sequence
    konami.push(e.key);
  });
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entry = takeEntryControl(doc, win.performance.now());

  // 4.7.3 field gate
  if (query.has('nowebgl')) {
    applyFallback(doc, 'nowebgl');
    return;
  }
  if (win.matchMedia('(forced-colors: active)').matches) {
    applyFallback(doc, 'forced-colors');
    return;
  }
  const canvas = doc.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) {
    applyFallback(doc, 'no-canvas');
    return;
  }
  let mountTweaks: ((a: App) => void) | null = null;
  if (PN_DEBUG && query.has('debug')) {
    const { prepareTweaks } = await import('./tweaks');
    mountTweaks = prepareTweaks(params);
  }
  app = App.start({
    canvas,
    params,
    reduced,
    seed: seedFromLocation(win.location.search),
    colors: theme.colors,
    entry,
    rail: doc.querySelector<HTMLElement>('[data-rail]'),
    scrim: doc.querySelector<HTMLElement>('.scrim'),
    doc,
    win,
  });
  if (!app) {
    applyFallback(doc, 'no-webgl2');
    return;
  }
  app.onFallback(() => {
    app = null;
    applyFallback(doc, 'field');
  });
  if (PN_DEBUG) {
    const { installDebugHooks } = await import('./debugHooks');
    if (app) installDebugHooks(app, win);
  }
  if (app) mountTweaks?.(app);
}

boot().catch((error: unknown) => {
  devWarn(String(error));
  applyFallback(document, 'boot');
});
```

- [ ] **Step 6: Full gate**

Run, from `/c/Users/parsa/parsanaji.com`: `npm test` (`Test Files  33 passed (33)`, `Tests  306 passed (306)`: Task 21's counts plus these 2 files and 14 tests; paste the real summary), `npm run typecheck` (prints nothing), `npm run build` (`✓ built in …`), then `grep -c "Parsa Naji — say hi" dist/assets/*.js` (the greeting is in the bundle: the entry chunk reports 1) and `grep -c "__pn\|parsanaji tweaks" dist/assets/*.js` (`:0` everywhere).

- [ ] **Step 7: Browser evidence (8.2.11, 8.2.6 scramble part)**

Start the dev server and `mkdir -p /c/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-22`. SCRAMBLE (clicks the name, clicks again at 300 ms, and records every text and `aria-label` change with its time and the h1 width):
```js
async () => {
  const h1 = document.querySelector('[data-name]');
  const range = document.createRange();
  const inkWidth = () => {
    range.selectNodeContents(h1);
    return Math.round(range.getBoundingClientRect().width * 100) / 100; // the text's own box, not the block's
  };
  const frames = [];
  const t0 = performance.now();
  const mo = new MutationObserver(() => frames.push({ dt: Math.round(performance.now() - t0), text: h1.textContent, label: h1.getAttribute('aria-label'), w: inkWidth() }));
  mo.observe(h1, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
  h1.click();
  await new Promise((r) => setTimeout(r, 300));
  h1.click();
  await new Promise((r) => setTimeout(r, 500));
  mo.disconnect();
  const settled = frames.find((f) => f.text === 'Parsa Naji' && f.label === null);
  return {
    count: frames.length,
    first: frames[0],
    settledAt: settled ? settled.dt : null,
    final: { text: h1.textContent, label: h1.getAttribute('aria-label') },
    lengths: [...new Set(frames.map((f) => f.text.length))],
    widths: [...new Set(frames.map((f) => f.w))],
    spaces: frames.every((f) => f.text[5] === ' '),
  };
}
```
1. `new_page` (`isolatedContext: "t22"`), `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`, `navigate_page` `http://localhost:5173/?noentry&seed=42`, wait 1 s, run SCRAMBLE. Expected: `first.text` = `rg#wM Tt%i` and `first.label` = `Parsa Naji` (seed 42, run 0); `settledAt` between 600 and 616 (one frame of timer slack; the second click at 300 ms was ignored, otherwise it would settle near 900); `final` = `{ text: 'Parsa Naji', label: null }`; `lengths` = `[10]`; `widths` has one value (mono advances, zero layout shift); `spaces` = `true`; `count` 16. Click once more by `evaluate_script` `() => { document.querySelector('[data-name]').click(); return true; }` and `take_screenshot` at once → `1440x900-dark-scramble.png`.
2. Reduced motion: `navigate_page` `http://localhost:5173/?seed=42` with the Task 19 RM `initScript` (`START = true`), wait 1 s, SCRAMBLE → `count` 0 and `final.text` = `Parsa Naji` (3.6.4: no scramble).
3. Console on the dev server: a fresh page (`isolatedContext: "t22-dev"`) at `/`, wait 4 s, `list_console_messages` with `types: ["log", "info", "warn", "error"]` → exactly one message, the greeting `Parsa Naji — say hi: info@parsanaji.com` (Vite's own `[vite] connecting…` lines are `debug` messages and are excluded).
4. Production build: stop the dev server, run `npm run build` (with `VITE_PN_DEBUG` unset) and start `npm run preview` with `run_in_background: true` (`http://localhost:4173/`). For each of `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch` in `dark` and `light`, a fresh page (`isolatedContext` `t22-p1` … `t22-p6`), `emulate`, reload, wait 4 s, `list_console_messages` (all types) → exactly one `log` message, the greeting, and nothing at warning or error level (3.5.7, 6.1.14). Stop the preview server: stop its background Bash task, then in PowerShell `Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`; close every page.

Write the readings into `task-22-report.md`.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/parsa/parsanaji.com
git add src/eggs/scramble.ts src/eggs/greeting.ts tests/scramble.test.ts tests/greeting.test.ts src/main.ts
git commit -m "feat(eggs): name scramble and the console greeting

A click on the name scrambles it through subset-safe glyphs and settles
letter by letter over 600 ms (seeded mulberry32, aria-label while it runs,
ignored while running and under reduced motion). boot() starts with the one
styled console line, the only production log (3.5.6, 3.5.7, 4.7.1).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Push and watch the slice-3 deploy (7.2.1)**

```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
cd /c/Users/parsa/parsanaji.com
git push
RUN_ID=$(gh run list --branch resume-screen --commit "$(git rev-parse HEAD)" --limit 1 --json databaseId --jq '.[0].databaseId')
echo "run: $RUN_ID"
gh run watch "$RUN_ID" --exit-status
```
`echo` prints the run id; if it is empty the run has not registered yet, so run the `RUN_ID=…` line again a few seconds later before `gh run watch`. Expected: `gh run watch` exits 0 and the run (workflow `deploy`, branch `resume-screen`) completes with `success`: `npm test`, `npm run build` with `VITE_PN_DEBUG=1`, and the Pages deploy all green. A red run stops the task: fix, commit, push again.

- [ ] **Step 10: Preview checks (slice close, 8.3)**

On `https://resume-screen.parsanaji-com.pages.dev/` (a preview build: PN_DEBUG is true, so `__pn` exists; CSP applies here):
1. Console: six fresh pages (`isolatedContext` `t22-v1` … `t22-v6`) at `1440x900x1`, `1280x720x1` and `390x844x3,mobile,touch` in `dark` and `light`; each `emulate`, reload, wait 4 s, `list_console_messages` (all types) → exactly one `log` message (the greeting) and zero `warn` / `error` messages (no CSP violations).
2. Entry spot check: at 1440×900 dark, `navigate_page` with the Task 18 PIN `initScript` at `T = 1400`, wait 2 s, `evaluate_script` `() => ({ entry: document.documentElement.getAttribute('data-entry'), ready: document.documentElement.hasAttribute('data-field-ready') })` → `{ entry: 'wait', ready: true }`; `take_screenshot` `preview-1440x900-dark-hold.png`; then `() => window.__pn.setTime(null)`, wait 3 s → `entry: null`.
3. Eggs spot check: `/?noentry` at 1440×900 dark: the ten Konami keys with `press_key`, wait 1200 ms, `take_screenshot` `preview-1440x900-dark-konami.png`; `press_key` `?` → the overlay opens, `Escape` closes it.
4. Screenshots of the resting page (wait 4 s after load): `preview-1440x900-dark.png`, `preview-1440x900-light.png`, `preview-1280x720-dark.png`, `preview-1280x720-light.png`, `preview-390x844-dark.png`, `preview-390x844-light.png`.

Close every page. Add the run id, the preview console results and the screenshot list to `task-22-report.md`. The controller then appends the slice-3 ledger line, updates the vault note and the memory file, and compacts before slice 4 (Execution Notes).

### Task 23: Quality bar: budgets, Lighthouse, fit and README

**Files:**
- Modify: `README.md` (one-line description `One-screen résumé over a WebGL2 dither field.`, run recipes including `npm run og` and `npm run fonts`, the deploy rules for `resume-screen` previews, spec and plan paths, and a "Budgets" table with the numbers measured here).
- Not committed (git-ignored): the measurement kit under `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/` (Step 2), evidence under `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/`, and the report `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-23-report.md`.

**Interfaces:**
- Consumes: the whole product of Tasks 1–22; `window.__pn` (`parity()`, `gpuTime(frames)`, `grid()`, `setTime(ms)`, `setE(e)`) on the dev server and the preview.
- Produces: the measured numbers (README table and task report) that the approval message of Task 24 quotes.

**Spec:** 1.3.1–1.3.6, 3.1.17, 3.2.5, 6.1.1–6.1.18, 6.2, 7.3.1 (verify unchanged), 7.6.1, 8.2.1, 8.2.3, 8.2.12–8.2.14, 8.3.5 (`anti-ui-slop`); Index amendments A5 (Lighthouse CLI for Performance and TBT) and A6 (SEO gated on the local production build, previews are `noindex`).

**Conventions (slice 4; Tasks 23 and 24 share them).**
- DevTools tools are deferred. Load them first with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__take_snapshot,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__list_network_requests,mcp__plugin_ecc_chrome-devtools__performance_start_trace,mcp__plugin_ecc_chrome-devtools__performance_stop_trace,mcp__plugin_ecc_chrome-devtools__performance_analyze_insight,mcp__plugin_ecc_chrome-devtools__lighthouse_audit,mcp__plugin_ecc_chrome-devtools__select_page,mcp__plugin_ecc_chrome-devtools__press_key,mcp__plugin_ecc_chrome-devtools__hover,mcp__plugin_ecc_chrome-devtools__click,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__list_pages`.
- Every measurement runs in a fresh page: `new_page` with `url: "about:blank"` and a new `isolatedContext` name, then `emulate`, then `navigate_page` (`type: "url"`, plus `initScript` where a step names one). `new_page` returns the page list; `P` below is the id of the page you just opened. Never touch pages other agents opened (`list_pages` shows their contexts).
- Viewports only through `emulate`: `"1440x900x1"`, `"1280x720x1"`, `"390x844x3,mobile,touch"` and the fit-pass list. Looks through `emulate` `colorScheme: "dark" | "light"`.
- "Wait N ms" means `evaluate_script` with `() => new Promise((resolve) => setTimeout(() => resolve('waited'), N))` on the named page.
- Paths: `EV=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-<N>` and `KIT=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23` in Git Bash (both git-ignored by `.superpowers/sdd/.gitignore`); DevTools `filePath` / `outputDirPath` values use the absolute form `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-<N>/…`.
- Servers start with the Bash tool's `run_in_background`. To stop them, stop the background Bash task, then in PowerShell: `Get-NetTCPConnection -LocalPort 5173,4173,4174 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`, and `close_page` every page you opened.
- SECURITY (7.4.1): `.env` is never read, printed, grepped or staged. No step needs it.

**Budget rows.** Every check below fills one row of the report table (Step 20). Row ids are fixed, because Task 24 and the README quote them:

| id | spec | metric | pass threshold |
|---|---|---|---|
| B01 | 6.1.1 | production JS, gzip level 9, `VITE_PN_DEBUG` unset (8.1.4 command) | ≤ 60.0 KB |
| B02 | 6.1.2 | fonts: `npm run fonts` check and the sum of `public/fonts/*.woff2` | ≤ 40.0 KB, exit code 0 |
| B03 | 6.1.3 | `drawArrays` calls per animation frame while the field runs | exactly 2 in every frame |
| B04 | 6.1.4 | `__pn.grid()` at `390x844x3,mobile,touch` | `dpr` 2 (grid in Step 12) |
| B05 | 6.1.5 | `requestAnimationFrame` callbacks while hidden; requests after a hide | 0 and 0 |
| B06 | 6.1.6 | LCP, no-entry path, Fast 4G, fresh context: `?noentry`, reduced motion, `?nowebgl` | median of 3 ≤ 1500 ms each |
| B07 | 6.1.7 | FCP, entry path, Fast 4G, fresh context | median of 3 ≤ 1000 ms |
| B08 | 6.1.8 | every `[data-reveal]` at opacity 1, measured from the entry's t = 0 | median of 3 ≤ 3000 ms |
| B09 | 6.1.9 | CLS in traces, in-page and Lighthouse | 0 everywhere (Lighthouse `< 0.0005`) |
| B10 | 6.1.10 | TBT, Lighthouse CLI, `/` and `/?noentry`, mobile and desktop | median of 3 < 100 ms in all four |
| B11 | 6.1.11 | Lighthouse Accessibility, Best Practices, SEO (Index amendment A6 for SEO) | ≥ 95 |
| B12 | 6.1.11 | Lighthouse Performance, `/?noentry`, mobile and desktop | median of 3 ≥ 95 |
| B13 | 6.1.11 | Lighthouse Performance, entry path `/`, mobile and desktop | recorded, not gated |
| B14 | 6.1.12 | mean rAF interval over 10 s of pointer movement; long tasks after the entry; FPS probe kept | ≤ 16.7 ms; none; `cellDev` 5 |
| B15 | 6.1.13 | GPU time per frame at 1440×900 | median ≤ 2 ms |
| B16 | 6.1.14 | console errors, warnings and issues: 3 viewports × 2 looks × (preview, local production build) | 0 in all 12 pages |
| B17 | 6.1.15 | `engines.node` | `>=22.18.0` |
| B18 | 6.1.16 | third-party requests on the preview and on the local build | 0 |
| B19 | 6.1.17, 7.3.1 | headers unchanged and served; one inline script (JSON-LD); no inline styles | as Step 4 and Step 5 print |
| B20 | 1.3.2, 8.2.2 | `__pn.parity()` on the preview | `maxErr255` ≤ 3, `tierMismatchPct` ≤ 0.5 |
| B21 | 1.3.1, 3.1.17, 8.2.13 | fit pass, 16 viewports × 2 looks | no hard failure |
| B22 | 1.3.4, 3.2.5 | contrast audit, both looks and both light paths | no failed requirement, no mismatch |
| B23 | 1.3.6 | no JS, `?nowebgl`, no WebGL2, reduced motion, forced colours, print | all readable as Step 15 states |
| B24 | 8.3.5 | `anti-ui-slop` finish gate | no finding that violates a spec requirement |

**Failure rule (applies to every step).** Task 23 never edits product code, CSS, budgets or thresholds (6.1.18: nothing is tuned to pass a metric).
1. A check fails: first validate the measurement, never the product. Right URL and page id; a fresh `isolatedContext`; the emulation applied (viewport, look, `networkConditions: "Fast 4G"` where required); fonts loaded; `html.no-webgl` absent where the field must run; nothing else heavy running (no build, no other Lighthouse run). Fix only the setup.
2. Re-measure. A median gate gets two more runs (the median of all runs counts; every run is recorded). A single-shot check is repeated once in a new context.
3. Still failing: mark the row `FAIL` with every measured number and its evidence path, add a diagnosis (for traces, `performance_analyze_insight` on the insight the summary lists for that metric, for example `LCPBreakdown`, `RenderBlocking`, `DocumentLatency` or `CLSCulprits`), finish the remaining measurement steps, then do Step 18 (BLOCKED) instead of Steps 19–21. The controller adds a fix task.

Fit-pass `deviations` (Step 13) and Lighthouse runs that are slower than an earlier task measured are not failures; they are recorded in the report.

- [ ] **Step 1: Preconditions**

```bash
cd /c/Users/parsa/parsanaji.com
export PATH="$PATH:/c/Program Files/GitHub CLI"
git fetch origin
git branch --show-current
git status --porcelain
git rev-parse HEAD origin/resume-screen
gh run list --branch resume-screen --limit 1 --json databaseId,headSha,status,conclusion
curl -s -o /dev/null -w "%{http_code}\n" https://resume-screen.parsanaji-com.pages.dev/
git rev-parse --short=7 HEAD
```
Expected: `resume-screen`; no `git status` output; the two SHAs are identical (Task 22 pushed the slice-3 close and nothing came after it); the run JSON shows `"status":"completed"`, `"conclusion":"success"` and the same `headSha`; `200`; the short SHA is the "measured commit" the README and the report quote. If any line differs, stop and report to the controller: Task 23 measures only the pushed slice-3 state.

- [ ] **Step 2: Create the measurement kit**

Create these files with the Write tool, exactly as shown, under `C:\Users\parsa\parsanaji.com\.superpowers\sdd\2026-10-19-parsanaji-resume-screen\scratch\task-23\`. Init scripts (`init-*.js`) are pasted as `navigate_page` `initScript`; to install two, concatenate the files with a newline. Page functions (`fn-*.js`) are pasted as the `evaluate_script` `function`. Task 24 reuses this kit.

`init-probe.js` (entry timing for 6.1.7–6.1.8, long tasks for 6.1.12):
```js
(() => {
  // Task 23 probe. Records data-entry / data-field-ready changes, long tasks, and the first frame after the
  // entry's t = 0 (data-field-ready, 3.4.7.1) at which every [data-reveal] block has computed opacity 1.
  const t = { fieldReady: null, allVisible: null, entry: [], longTasks: [] };
  window.__t23 = t;
  new MutationObserver((records) => {
    const html = document.documentElement;
    for (const rec of records) {
      if (rec.target !== html) continue;
      const now = Math.round(performance.now());
      if (rec.attributeName === 'data-field-ready' && t.fieldReady === null && html.hasAttribute('data-field-ready')) t.fieldReady = now;
      if (rec.attributeName === 'data-entry') t.entry.push([html.getAttribute('data-entry'), now]);
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-entry', 'data-field-ready'] });
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) t.longTasks.push([Math.round(e.startTime), Math.round(e.duration)]);
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  const poll = () => {
    if (t.fieldReady !== null && t.allVisible === null) {
      const els = document.querySelectorAll('[data-reveal]');
      let all = els.length > 0;
      for (const el of els) if (getComputedStyle(el).opacity !== '1') { all = false; break; }
      if (all) t.allVisible = Math.round(performance.now());
    }
    if (t.allVisible === null) requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
})();
```

`init-draws.js` (6.1.3; the counter runs before the app's frame callback, so each entry is the previous frame's count):
```js
(() => {
  const proto = WebGL2RenderingContext.prototype;
  const real = proto.drawArrays;
  const counts = [];
  let n = 0;
  proto.drawArrays = function (...args) { n += 1; return real.apply(this, args); };
  const tick = () => { counts.push(n); n = 0; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  window.__t23draws = counts;
})();
```

`init-gpu-fallback.js` (6.1.13 only when `__pn.gpuTime` returns `null`: CPU-observed completion time of both passes, an upper bound of GPU time):
```js
(() => {
  const proto = WebGL2RenderingContext.prototype;
  const real = proto.drawArrays;
  const samples = [];
  let n = 0;
  let start = 0;
  proto.drawArrays = function (...args) {
    if (n === 0) { this.finish(); start = performance.now(); }
    const out = real.apply(this, args);
    n += 1;
    if (n === 2) { this.finish(); samples.push(performance.now() - start); n = 0; }
    return out;
  };
  window.__t23gpu = samples;
})();
```

`init-hidden.js` (6.1.5):
```js
(() => {
  const log = { initial: document.visibilityState, events: [], frames: 0, hiddenCallbacks: 0, requestsWhileHiddenAfterVisible: 0 };
  let seenVisible = document.visibilityState === 'visible';
  window.__t23hidden = log;
  document.addEventListener('visibilitychange', () => {
    log.events.push([document.visibilityState, Math.round(performance.now())]);
    if (document.visibilityState === 'visible') seenVisible = true;
  }, true);
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    if (document.visibilityState === 'hidden' && seenVisible) log.requestsWhileHiddenAfterVisible += 1;
    return raf((ts) => {
      log.frames += 1;
      if (document.visibilityState === 'hidden') log.hiddenCallbacks += 1;
      cb(ts);
    });
  };
})();
```

`init-reduced-motion.js` (JS side only; `emulate` has no reduced-motion option and the CSS media blocks stay inactive):
```js
(() => {
  const real = window.matchMedia.bind(window);
  window.matchMedia = (query) => (/prefers-reduced-motion:\s*reduce/.test(query) ? real('all') : real(query));
})();
```

`init-forced-colors.js`:
```js
(() => {
  const real = window.matchMedia.bind(window);
  window.matchMedia = (query) => (/forced-colors:\s*active/.test(query) ? real('all') : real(query));
})();
```

`init-no-webgl2.js`:
```js
(() => {
  const real = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    return type === 'webgl2' ? null : real.call(this, type, ...rest);
  };
})();
```

`fn-metrics.js` (6.1.6–6.1.9, read after a traced load):
```js
async () => {
  const lcp = await new Promise((resolve) => {
    let last = null;
    const po = new PerformanceObserver((list) => { const e = list.getEntries(); if (e.length) last = e[e.length - 1]; });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => { po.disconnect(); resolve(last); }, 200);
  });
  const shifts = await new Promise((resolve) => {
    const out = [];
    const po = new PerformanceObserver((list) => { for (const e of list.getEntries()) out.push(e); });
    po.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => { po.disconnect(); resolve(out); }, 200);
  });
  const fcp = performance.getEntriesByName('first-contentful-paint')[0] ?? null;
  const t = window.__t23 ?? null;
  const html = document.documentElement;
  return {
    url: location.href,
    lcpMs: lcp ? Math.round(lcp.startTime) : null,
    lcpElement: lcp && lcp.element ? `${lcp.element.tagName.toLowerCase()}.${[...lcp.element.classList].join('.')}` : null,
    fcpMs: fcp ? Math.round(fcp.startTime) : null,
    cls: +shifts.filter((s) => !s.hadRecentInput).reduce((a, s) => a + s.value, 0).toFixed(4),
    shiftCount: shifts.length,
    fieldReadyMs: t ? t.fieldReady : null,
    railVisibleAfterT0Ms: t && t.fieldReady !== null && t.allVisible !== null ? t.allVisible - t.fieldReady : null,
    entry: t ? t.entry : null,
    dataEntry: html.getAttribute('data-entry'),
    fieldReady: html.hasAttribute('data-field-ready'),
    noWebgl: html.classList.contains('no-webgl'),
  };
}
```

`fn-interact.js` (console checks, 8.2.1: one second of pointer movement, then one primary click on the open field, 3.3.8):
```js
async () => {
  const canvas = document.querySelector('[data-field]');
  const r = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  const fire = (type, x, y, extra) => (document.elementFromPoint(x, y) ?? document.documentElement)
    .dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'mouse', isPrimary: true, bubbles: true, composed: true, ...extra }));
  for (let i = 0; i <= 60; i += 1) {
    fire('pointermove', r.left + r.width * (0.55 + 0.35 * i / 60), r.top + r.height * (0.5 + 0.3 * Math.sin(i / 9)), {});
    await new Promise((res) => requestAnimationFrame(res));
  }
  const x = r.left + r.width * 0.8;
  const y = r.top + r.height * 0.5;
  fire('pointerdown', x, y, { button: 0, buttons: 1 });
  fire('pointerup', x, y, { button: 0, buttons: 0 });
  await new Promise((res) => setTimeout(res, 1000));
  const html = document.documentElement;
  return { dataEntry: html.getAttribute('data-entry'), fieldReady: html.hasAttribute('data-field-ready'), noWebgl: html.classList.contains('no-webgl'), look: html.getAttribute('data-theme') ?? 'system' };
}
```

`fn-pointer-10s.js` (6.1.12 frame interval, 6.1.3 draws, long tasks after the entry, the FPS probe through the grid):
```js
async () => {
  const rect = document.querySelector('[data-field]').getBoundingClientRect();
  const draws = window.__t23draws ?? null;
  const drawStart = draws ? draws.length : 0;
  const stamps = [];
  const t0 = performance.now();
  await new Promise((done) => {
    const step = (now) => {
      stamps.push(now);
      const k = (now - t0) / 1000;
      const x = rect.left + rect.width * (0.72 + 0.2 * Math.sin(k * 1.7));
      const y = rect.top + rect.height * (0.5 + 0.35 * Math.sin(k * 2.3));
      (document.elementFromPoint(x, y) ?? document.documentElement)
        .dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', isPrimary: true, bubbles: true, composed: true }));
      if (now - t0 < 10000) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  const d = stamps.slice(1).map((s, i) => s - stamps[i]);
  const sorted = [...d].sort((a, b) => a - b);
  const hist = {};
  if (draws) for (const n of draws.slice(drawStart + 1)) hist[n] = (hist[n] ?? 0) + 1;
  const t = window.__t23 ?? null;
  const entryDone = t && t.fieldReady !== null ? t.fieldReady + 2700 : null;
  return {
    frames: d.length,
    meanMs: +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(3),
    p95Ms: +sorted[Math.floor(d.length * 0.95)].toFixed(2),
    maxMs: +sorted[d.length - 1].toFixed(2),
    over20ms: d.filter((x) => x > 20).length,
    drawsPerFrame: hist,
    longTasksAfterEntry: t && entryDone !== null ? t.longTasks.filter(([start]) => start > entryDone) : null,
    grid: window.__pn ? window.__pn.grid() : null,
  };
}
```

`fn-fit.js` (8.2.13; expected values are Appendix C §2.2 and §3, plus the plan writer's 2026-10-19 measurement of Agent C's prototype with this same function for 853×480, 844×390, 640×360, 768×1024 and the band ends, which matched Appendix C exactly at 1280×720, 1440×900, 1280×519, 1280×470, 1366×657, 390×844 and 430×932):
```js
async () => {
  const EXPECTED = {
    '1280x720': { band: false, scroll: 0, rows: 8, tags: 7, tagRows: 2, spare: 73, name: 59.9, body: 13, S: 337, R: 623, edge: 612, alpha: 0.865, bottom: 231 },
    '1366x768': { band: false, scroll: 0, rows: 8, tags: 7, spare: 98, name: 63.9, body: 13, S: 341, R: 627, edge: 616, alpha: 0.865, bottom: 234 },
    '1440x900': { band: false, scroll: 0, rows: 8, tags: 7, spare: 142, name: 74.88, body: 14.4, S: 374, R: 691, edge: 665, alpha: 0.872, bottom: 246 },
    '1920x1080': { band: false, scroll: 0, rows: 8, tags: 7, spare: 171, name: 89.86, body: 17.28, S: 457, R: 837, edge: 806, alpha: 0.872, bottom: 302 },
    '2560x1440': { band: false, scroll: 0, rows: 8, tags: 7, spare: 396, name: 104, body: 18, S: 492, R: 888, edge: 859, alpha: 0.87, bottom: 333 },
    '1366x657': { band: false, scroll: 0, rows: 8, tags: 7, spare: 39, name: 54.66, body: 13 },
    '1280x600': { band: false, scroll: 0, rows: 8, tags: 7, spare: 8 },
    '1280x599': { band: false, scroll: 0, rows: 6, tags: 7, spare: 52 },
    '1280x519': { band: false, scroll: 0, rows: 6, tags: 3, tagRows: 1, spare: 27 },
    '1280x470': { band: false, scroll: 6, rows: 6, tags: 3, tagRows: 1 },
    '853x480': { band: false, scroll: 0, rows: 6, tags: 3, tagRows: 1, spare: 1, name: 40 },
    '844x390': { band: false, scroll: 84, rows: 6, tags: 3, name: 40 },
    '640x360': { band: true, name: 60, footer: 180, fade: 203, bandTop: 259 },
    '768x1024': { band: true, scroll: 97, name: 60, footer: 657, fade: 681, bandTop: 737 },
    '390x844': { band: true, scroll: 455, name: 46.8, footer: 528, fade: 552, bandTop: 608 },
    '430x932': { band: true, scroll: 458, name: 51.6, footer: 591, fade: 615, bandTop: 671 },
  };
  const TOL = { spare: 2, name: 0.01, body: 0.01, S: 2, R: 2, edge: 2, alpha: 0.003, bottom: 2, footer: 2, fade: 2, bandTop: 2, scroll: 3 };
  await document.fonts.ready;
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const r = (el) => el.getBoundingClientRect();
  const fs = (el) => parseFloat(getComputedStyle(el).fontSize);
  const lh = (el) => { const v = getComputedStyle(el).lineHeight; return v === 'normal' ? fs(el) * 1.2 : parseFloat(v); };
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && r(el).height > 1.5;
  const lines = (el) => Math.round(r(el).height / lh(el));
  const textRight = (el) => { const x = document.createRange(); x.selectNodeContents(el); return Math.max(0, ...[...x.getClientRects()].filter((c) => c.width > 2 && c.height > 2).map((c) => c.right)); };
  const se = document.scrollingElement;
  const rail = q('.rail'), edu = q('.block--edu'), misc = q('.block--misc'), scrim = q('.scrim'), field = q('.field');
  const vp = `${innerWidth}x${innerHeight}`;
  const exp = EXPECTED[vp] ?? null;
  const band = matchMedia('(max-width: 719.98px), not all and (min-aspect-ratio: 1/1)').matches;
  const m = {
    vp, band,
    look: document.documentElement.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    fontsOK: document.fonts.check('700 16px "JetBrains Mono"') && document.fonts.check('400 16px "JetBrains Mono"'),
    noWebgl: document.documentElement.classList.contains('no-webgl'),
    scroll: se.scrollHeight - se.clientHeight,
    hScroll: se.scrollWidth - se.clientWidth,
    railOverflow: rail.scrollHeight - rail.clientHeight,
    spare: Math.round(r(misc).top - (r(edu).bottom + parseFloat(getComputedStyle(edu).marginBottom))),
    name: +fs(q('.name')).toFixed(2),
    body: +fs(q('.row .what')).toFixed(2),
    rows: qa('.row').filter(vis).length,
    wrapped: qa('.row').filter(vis).map((x) => x.querySelector('.what')).filter((w) => lines(w) > 1).map((w) => w.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)),
    taglineLines: lines(q('.tagline')),
    tags: qa('.tags li').filter(vis).length,
    tagRows: new Set(qa('.tags li').filter(vis).map((li) => Math.round(r(li).top))).size,
    overflowHidden: ['html', 'body'].filter((s) => getComputedStyle(q(s)).overflowY === 'hidden'),
  };
  if (!band) {
    const gutter = parseFloat(getComputedStyle(rail).paddingLeft);
    const R = r(rail).right, S = gutter + (R - gutter) * 0.5;
    const edge = Math.max(...qa('.name, .tagline, .eyebrow, .row .what, .row .when, .tags, .links ul, .status, .place').map(textRight));
    const bottom = Math.max(textRight(q('.links ul')), textRight(q('.status')), textRight(q('.place')));
    Object.assign(m, {
      S: Math.round(S), R: Math.round(R), clearAt: Math.round(r(scrim).right), edge: Math.round(edge),
      alpha: edge <= S ? 1 : edge <= R ? +(1 - 0.14 * (edge - S) / (R - S)).toFixed(3) : null,
      bottom: Math.round(bottom), bottomInSolid: bottom <= S,
    });
  } else {
    const top = se.scrollTop;
    se.scrollTop = se.scrollHeight;
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    Object.assign(m, {
      footer: Math.round(r(q('.place')).bottom), fade: Math.round(r(scrim).top), bandTop: Math.round(r(field).top),
      bandH: +r(field).height.toFixed(2), footerGap: +(r(scrim).top - r(q('.place')).bottom).toFixed(1),
    });
    se.scrollTop = top;
  }
  const hard = [];
  const deviations = [];
  if (!exp) hard.push(`no expectation row for ${vp}`);
  if (!m.fontsOK) hard.push('JetBrains Mono not loaded: wait and re-run');
  if (m.noWebgl) hard.push('html.no-webgl is set: the field is not running');
  if (m.hScroll > 0) hard.push(`horizontal scroll ${m.hScroll}px`);
  if (m.overflowHidden.length) hard.push(`overflow hidden on ${m.overflowHidden.join(', ')} (3.1.11 item 4)`);
  if (exp) {
    if (m.band !== exp.band) hard.push(`layout ${m.band ? 'band' : 'rail'}, expected ${exp.band ? 'band' : 'rail'} (3.1.1)`);
    if (!exp.band) {
      if (exp.scroll === 0 && m.scroll !== 0) hard.push(`document scrolls ${m.scroll}px (1.3.1)`);
      if (exp.scroll === 0 && m.railOverflow !== 0) hard.push(`rail overflows ${m.railOverflow}px`);
      if (exp.scroll > 0 && m.scroll <= 0) hard.push('expected the document to scroll (3.1.11 item 4 / 3.1.15)');
      if (m.rows !== exp.rows) hard.push(`rows shown ${m.rows}, expected ${exp.rows} (3.1.11)`);
      if (m.tags !== exp.tags) hard.push(`tags shown ${m.tags}, expected ${exp.tags} (3.1.11)`);
      if (exp.tagRows !== undefined && m.tagRows !== exp.tagRows) hard.push(`tag rows ${m.tagRows}, expected ${exp.tagRows}`);
      if (m.wrapped.length) hard.push(`rows wrap: ${m.wrapped.join(' | ')} (3.1.17)`);
      if (m.edge > m.R) hard.push(`text edge ${m.edge} right of R ${m.R} (3.1.10.1)`);
      if (m.alpha === null || m.alpha < 0.86) hard.push(`scrim alpha ${m.alpha} at the widest text pixel (3.1.10.1)`);
      if (!m.bottomInSolid) hard.push(`links/status/footer edge ${m.bottom} right of S ${m.S} (3.1.10.2, 3.2.5.1)`);
    } else {
      if (Math.abs(m.footerGap - 24) > 1) hard.push(`footer rests ${m.footerGap}px above the fade, expected 24 (3.1.13)`);
      if (Math.abs(m.bandH - 0.28 * innerHeight) > 0.5) hard.push(`band ${m.bandH}px, expected 28svh = ${(0.28 * innerHeight).toFixed(2)} (3.1.13)`);
    }
    for (const [k, tol] of Object.entries(TOL)) {
      if (exp[k] === undefined || m[k] === undefined || m[k] === null) continue;
      if (Math.abs(m[k] - exp[k]) > tol) deviations.push(`${k}: measured ${m[k]}, expected ${exp[k]} ±${tol}`);
    }
  }
  return { measured: m, hard, deviations };
}
```

`fn-contrast.js` (3.2.5; golden ratios computed by the plan writer from the 3.2.1 tokens with this same arithmetic, and reproduced in Chrome from `@property`-registered tokens: they equal the 3.2.5 table):
```js
() => {
  const EXPECTED = {
    dark: { fg_bg: 16.87, fg2_bg: 6.52, accent_bg: 9.12, accent2_bg: 5.62, scrim_contract: 4.72, scrim_fg_min: 12.2, scrim_fg2_min: 4.72, f1_f0: 3.74, f2_f0: 9.12, f3_f0: 16.87, step21: 2.44, step32: 1.85, focus_bg: 9.12, selection: 5.24, chip_fg_min: 15.13, chip_accent2_min: 5.04, scrimMidAlpha: 0.86, chipAlpha: 0.94 },
    light: { fg_bg: 16.21, fg2_bg: 6.53, accent_bg: 6.47, accent2_bg: 5.31, scrim_contract: 4.86, scrim_fg_min: 12.64, scrim_fg2_min: 5.09, f1_f0: 1.98, f2_f0: 4.84, f3_f0: 8.98, step21: 2.44, step32: 1.86, focus_bg: 6.47, selection: 5.24, chip_fg_min: 14.87, chip_accent2_min: 4.87, scrimMidAlpha: 0.86, chipAlpha: 0.95 },
  };
  const cs = getComputedStyle(document.documentElement);
  const parse = (name) => {
    const s = cs.getPropertyValue(name).trim();
    let m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) return { rgb: [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255), a: 1 };
    m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i.exec(s);
    if (m) return { rgb: [m[1], m[2], m[3]].map((v) => parseFloat(v) / 255), a: m[4] === undefined ? 1 : parseFloat(m[4]) / (m[5] ? 100 : 1) };
    throw new Error(`unparsed ${name}: ${s}`);
  };
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, a, under) => top.map((t, i) => t * a + under[i] * (1 - a));
  const r2 = (n) => Math.round(n * 100) / 100;
  const look = document.documentElement.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const bg = parse('--bg').rgb, fg = parse('--fg').rgb, fg2 = parse('--fg-2').rgb, ac = parse('--accent').rgb, ac2 = parse('--accent-2').rgb;
  const tiers = ['--field-0', '--field-1', '--field-2', '--field-3'].map((n) => parse(n).rgb);
  const mid = parse('--scrim-mid'), chip = parse('--overlay-bg');
  const scrim = tiers.map((f) => over(mid.rgb, mid.a, f));
  const chipOn = tiers.map((f) => over(chip.rgb, chip.a, f));
  const m = {
    fg_bg: r2(ratio(fg, bg)), fg2_bg: r2(ratio(fg2, bg)), accent_bg: r2(ratio(ac, bg)), accent2_bg: r2(ratio(ac2, bg)),
    scrim_contract: r2(look === 'dark' ? Math.min(...scrim.map((s) => ratio(fg2, s))) : ratio(ac2, scrim[1])),
    scrim_fg_min: r2(Math.min(...scrim.map((s) => ratio(fg, s)))), scrim_fg2_min: r2(Math.min(...scrim.map((s) => ratio(fg2, s)))),
    f1_f0: r2(ratio(tiers[1], tiers[0])), f2_f0: r2(ratio(tiers[2], tiers[0])), f3_f0: r2(ratio(tiers[3], tiers[0])),
    step21: r2(ratio(tiers[2], tiers[1])), step32: r2(ratio(tiers[3], tiers[2])),
    focus_bg: r2(ratio(parse('--focus-ring').rgb, bg)),
    selection: r2(ratio(parse('--selection-fg').rgb, parse('--selection-bg').rgb)),
    chip_fg_min: r2(Math.min(...chipOn.map((s) => ratio(fg, s)))), chip_accent2_min: r2(Math.min(...chipOn.map((s) => ratio(ac2, s)))),
    scrimMidAlpha: mid.a, chipAlpha: chip.a,
  };
  const failedRequirements = [
    ['fg_bg', m.fg_bg >= 7], ['fg2_bg', m.fg2_bg >= 4.5], ['accent_bg', m.accent_bg >= 4.5], ['accent2_bg', m.accent2_bg >= 4.5],
    ['scrim_contract', m.scrim_contract >= 4.5], ['scrim_fg_min', m.scrim_fg_min >= 4.5], ['scrim_fg2_min', m.scrim_fg2_min >= 4.5],
    ['f1_f0', look === 'dark' ? m.f1_f0 >= 2 && m.f1_f0 <= 4 : m.f1_f0 >= 1.8 && m.f1_f0 <= 3.5],
    ['f2_f0', m.f2_f0 > m.f1_f0 && m.f2_f0 < m.f3_f0], ['f3_f0', m.f3_f0 >= 7], ['step21', m.step21 >= 1.3], ['step32', m.step32 >= 1.3],
    ['focus_bg', m.focus_bg >= 3], ['selection', m.selection >= 4.5], ['chip_fg_min', m.chip_fg_min >= 4.5], ['chip_accent2_min', m.chip_accent2_min >= 4.5],
  ].filter(([, ok]) => !ok).map(([k]) => k);
  const mismatches = Object.entries(EXPECTED[look]).filter(([k, v]) => Math.abs(m[k] - v) > 0.01).map(([k, v]) => `${k}: ${m[k]} vs ${v}`);
  return { look, measured: m, failedRequirements, mismatches };
}
```

`fn-state.js` (fallback states, 1.3.6):
```js
() => {
  const html = document.documentElement;
  const q = (s) => document.querySelector(s);
  const field = q('[data-field]');
  return {
    dataEntry: html.getAttribute('data-entry'),
    fieldReady: html.hasAttribute('data-field-ready'),
    noWebgl: html.classList.contains('no-webgl'),
    revealOpacities: [...new Set([...document.querySelectorAll('[data-reveal]')].filter((el) => !el.hidden).map((el) => getComputedStyle(el).opacity))],
    fieldDisplay: field ? getComputedStyle(field).display : null,
    fieldOpacity: field ? getComputedStyle(field).opacity : null,
    scrimDisplay: q('.scrim') ? getComputedStyle(q('.scrim')).display : null,
    toggleHidden: q('[data-theme-toggle]') ? q('[data-theme-toggle]').hidden : null,
    clockHidden: q('[data-clock]') ? q('[data-clock]').hidden : null,
    footer: q('.place') ? q('.place').innerText.replace(/\s+/g, ' ').trim() : null, // rendered text: hidden clock span excluded, CSS uppercase applied
    h1: q('h1') ? q('h1').textContent.trim() : null,
  };
}
```

`lh-summary.mjs` (run with Node from the repo root; tested by the writer on a Lighthouse 13.5.0 report):
```js
// Usage: node <this file> <dir>
// One row per Lighthouse JSON in <dir> (named <config>-<run>.json), then the median per config.
// Writes each run's final screenshot next to its JSON as <config>-<run>-final.jpg.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const rows = [];
for (const file of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const report = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const a = report.audits;
  rows.push({
    file,
    config: file.replace(/-\d+\.json$/, ''),
    lh: report.lighthouseVersion,
    url: report.finalDisplayedUrl,
    error: report.runtimeError ? report.runtimeError.code : '',
    warnings: report.runWarnings.length,
    score: Math.round(report.categories.performance.score * 100),
    fcpMs: Math.round(a['first-contentful-paint'].numericValue),
    lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
    tbtMs: Math.round(a['total-blocking-time'].numericValue),
    cls: Number(a['cumulative-layout-shift'].numericValue.toFixed(4)),
    siMs: Math.round(a['speed-index'].numericValue),
  });
  const shot = a['final-screenshot']?.details?.data;
  if (typeof shot === 'string') writeFileSync(join(dir, file.replace(/\.json$/, '-final.jpg')), Buffer.from(shot.split(',')[1], 'base64'));
}
console.table(rows);
const median = (xs) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];
for (const config of [...new Set(rows.map((r) => r.config))]) {
  const rs = rows.filter((r) => r.config === config);
  console.log(`${config}: runs ${rs.length}, median score ${median(rs.map((r) => r.score))}, TBT ${median(rs.map((r) => r.tbtMs))} ms, CLS ${median(rs.map((r) => r.cls))}, LCP ${median(rs.map((r) => r.lcpMs))} ms, FCP ${median(rs.map((r) => r.fcpMs))} ms`);
}
```

`crop-compare.mjs` (static-field check; compares the open-field region of two 1440×900 screenshots, right of the scrim's clear edge at 950 and below the toggle chip):
```js
// Usage (repo root, so 'sharp' resolves): node <this file> <a.png> <b.png>
import sharp from 'sharp';

const [a, b] = process.argv.slice(2);
const crop = (file) => sharp(file).extract({ left: 1000, top: 120, width: 440, height: 780 }).raw().toBuffer();
const [x, y] = await Promise.all([crop(a), crop(b)]);
console.log(x.equals(y) ? `identical (${x.length} bytes)` : 'DIFFERENT');
process.exit(x.equals(y) ? 0 : 1);
```

Then:
```bash
cd /c/Users/parsa/parsanaji.com
KIT=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23
ls "$KIT"
git check-ignore -v "$KIT/fn-fit.js"
git status --porcelain
```
Expected: exactly these 15 files: `crop-compare.mjs`, `fn-contrast.js`, `fn-fit.js`, `fn-interact.js`, `fn-metrics.js`, `fn-pointer-10s.js`, `fn-state.js`, `init-draws.js`, `init-forced-colors.js`, `init-gpu-fallback.js`, `init-hidden.js`, `init-no-webgl2.js`, `init-probe.js`, `init-reduced-motion.js`, `lh-summary.mjs`; `check-ignore` prints `.superpowers/sdd/.gitignore:1:*` and the path; `git status` prints nothing.

- [ ] **Step 3: Full gate**

```bash
cd /c/Users/parsa/parsanaji.com
npm test
npm run typecheck
env -u VITE_PN_DEBUG npm run build
```
Expected: Vitest summary `Test Files  33 passed (33)` and `Tests  306 passed (306)` (Task 22's counts; paste the real summary into the report); typecheck prints nothing; the build ends with `✓ built in …`.

- [ ] **Step 4: Bundle, fonts, Node floor and markup (B01, B02, B17, B19)**

`dist/` now holds the production build of Step 3 (`VITE_PN_DEBUG` unset, 6.1.1).
```bash
cd /c/Users/parsa/parsanaji.com
ls -l dist/assets/
node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')))t+=z.gzipSync(fs.readFileSync('dist/assets/'+f),{level:9}).length;console.log((t/1024).toFixed(1)+' KB')"
grep -l -E '__pn|parsanaji tweaks|lil-gui' dist/assets/*.js || echo "no debug code"
wc -c < dist/theme-boot.js
grep -o '<script[^>]*>' dist/index.html
grep -c 'style=' dist/index.html || true
grep -c '<style' dist/index.html || true
npm run fonts
git status --porcelain public/fonts
node -e "const fs=require('fs');let t=0;for(const f of fs.readdirSync('public/fonts').filter(f=>f.endsWith('.woff2'))){const n=fs.statSync('public/fonts/'+f).size;t+=n;console.log(f,n)}console.log((t/1024).toFixed(1)+' KB')"
node -p "require('./package.json').engines.node"
```
Expected:
- the 8.1.4 line prints about `14.0 KB` (6.2 estimate); B01 passes at ≤ 60.0 KB;
- `no debug code` (production carries no `__pn`, panel or `lil-gui`, 4.12.1);
- `theme-boot.js` under 500 bytes (6.2);
- exactly three script tags: `<script src="/theme-boot.js">`, `<script type="application/ld+json">` and `<script type="module" crossorigin src="/assets/index-<hash>.js">` (any order); `0` and `0` (5.2.5, 6.1.17);
- `npm run fonts` prints both subsets (about 12.0 KB and 12.1 KB) and its total under the 40 KB budget with exit code 0; `git status --porcelain public/fonts` prints nothing (the subsets are reproducible). If it lists the fonts, run `git restore --source=HEAD -- public/fonts` and write "subset output not byte-reproducible" under Gotchas in the report;
- the font sum prints the two files and about `24.1 KB`; B02 passes at ≤ 40.0 KB;
- `>=22.18.0` (B17).

- [ ] **Step 5: Headers unchanged and served (B19, 7.3.1)**

```bash
cd /c/Users/parsa/parsanaji.com
git diff --stat main -- public/_headers public/robots.txt
curl -sI https://resume-screen.parsanaji-com.pages.dev/ | tr -d '\r' | grep -i -E '^(content-security-policy|x-content-type-options|referrer-policy|permissions-policy|x-frame-options|cache-control|x-robots-tag):'
curl -sI https://resume-screen.parsanaji-com.pages.dev/theme-boot.js | tr -d '\r' | grep -i '^cache-control:'
curl -sI https://resume-screen.parsanaji-com.pages.dev/fonts/JetBrainsMono-Bold.subset.woff2 | tr -d '\r' | grep -i '^cache-control:'
```
Expected: the `git diff` prints nothing. The page headers, in any order and letter case:
```text
content-security-policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
x-frame-options: DENY
cache-control: no-cache
x-robots-tag: noindex
```
`theme-boot.js`: `cache-control: public, max-age=0, must-revalidate` (Pages default, 7.3.1). The font: `cache-control: public, max-age=31536000, immutable`. Record whether `x-robots-tag: noindex` is present; Step 9 applies Index amendment A6 only when it is.

- [ ] **Step 6: Start the local servers**

`dist/` is the production build. Make a no-JavaScript copy of it for 1.3.6 (all `<script>` elements removed), then serve both (two Bash calls with `run_in_background: true`):
```bash
cd /c/Users/parsa/parsanaji.com
SCR=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23
rm -rf "$SCR/nojs" && cp -r dist "$SCR/nojs"
node -e "const fs=require('fs');const p=process.argv[1];const h=fs.readFileSync(p,'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');fs.writeFileSync(p,h);console.log((h.match(/<script/g)||[]).length+' scripts left')" "$SCR/nojs/index.html"
```
Expected: `0 scripts left`.
```bash
cd /c/Users/parsa/parsanaji.com && npm run preview
```
```bash
cd /c/Users/parsa/parsanaji.com && npx vite preview --outDir .superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/nojs --port 4174 --strictPort
```
Expected output of each: `➜  Local:   http://localhost:4173/` and `➜  Local:   http://localhost:4174/`. Below, "local" is `http://localhost:4173/` (production build) and "no-JS" is `http://localhost:4174/`. Also `mkdir -p` the evidence folders: `mkdir -p .superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/{console,traces,lighthouse,lighthouse-cli,fit,fallbacks,slop}`.

- [ ] **Step 7: Console checks and third-party requests (B16, B18; 6.1.14, 6.1.16, 8.2.1)**

Twelve fresh pages: target ∈ {preview `https://resume-screen.parsanaji-com.pages.dev/`, local `http://localhost:4173/`} × viewport ∈ {`1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`} × look ∈ {`dark`, `light`}. For each:
1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-console-<target>-<w>x<h>-<look>"` → `P`.
2. `emulate` `pageId: P`, `viewport`, `colorScheme: <look>`.
3. `navigate_page` `pageId: P`, `type: "url"`, `url: <target>`.
4. Wait 6000 ms (the entry ends at about t = 3.3 s; the probe runs 60 frames after it).
5. `evaluate_script` with `fn-interact.js` → `{ dataEntry: null, fieldReady: true, noWebgl: false, look: "system" }`.
6. `list_console_messages` `pageId: P` → exactly one message, type `log`, whose text contains `Parsa Naji — say hi: info@parsanaji.com` (3.5.7); no message of type `error`, `warn` or `issue`.
7. `take_screenshot` `pageId: P`, `filePath: "C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/console/<w>x<h>-<look>-<target>.png"`.
8. On the two `1440x900` dark pages only: `list_network_requests` `pageId: P` → every URL starts with the page's own origin (`https://resume-screen.parsanaji-com.pages.dev/` or `http://localhost:4173/`) or is a `data:` URL; there is no `cloudflareinsights.com` request on either (the beacon exists only in production, 6.1.16). Record the request list in the report.
9. `close_page` `P`.
B16 passes with zero error, warning or issue messages on all twelve; B18 passes with zero third-party requests.

- [ ] **Step 8: Fast 4G traces: LCP, FCP, rail visible, CLS (B06–B09; 6.1.6–6.1.9, 9.1)**

Four variants, three cold loads each, every load in its own context so nothing is cached:

| variant | URL | `initScript` |
|---|---|---|
| `noentry` | `https://resume-screen.parsanaji-com.pages.dev/?noentry` | none |
| `reduced` | `https://resume-screen.parsanaji-com.pages.dev/` | `init-reduced-motion.js` |
| `nowebgl` | `https://resume-screen.parsanaji-com.pages.dev/?nowebgl` | none |
| `entry` | `https://resume-screen.parsanaji-com.pages.dev/` | `init-probe.js` |

For each variant `V` and run `n` ∈ 1, 2, 3:
1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-f4g-<V>-<n>"` → `P`.
2. `emulate` `pageId: P`, `viewport: "1440x900x1"`, `colorScheme: "dark"`, `networkConditions: "Fast 4G"`.
3. `performance_start_trace` `pageId: P`, `reload: false`, `autoStop: false` (a reload would come from the cache; the trace starts on `about:blank` and records the cold navigation).
4. `navigate_page` `pageId: P`, `type: "url"`, the variant URL and `initScript`, `timeout: 60000`.
5. Wait 6000 ms.
6. `performance_stop_trace` `pageId: P`, `filePath: "C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/traces/<V>-<n>.json.gz"`. Record the summary's LCP and CLS lines and its insight-set id.
7. `evaluate_script` with `fn-metrics.js`. Record `lcpMs`, `lcpElement`, `fcpMs`, `cls`, `shiftCount`, `railVisibleAfterT0Ms`, `entry`.
8. `close_page` `P`.

Expected and gates:
- `noentry`, `reduced`, `nowebgl`: `dataEntry` `null`; `noentry` and `reduced` have `fieldReady: true` and `noWebgl: false`; `nowebgl` has `noWebgl: true`. LCP is the trace summary's LCP; when a summary has no LCP for the navigation, the in-page `lcpMs` is the measurement and the report says so. B06: median of three ≤ 1500 ms for each of the three variants (the LCP element is a rail text element such as `h1.name`; it is never gamed, 6.1.18).
- `entry`: `entry` holds `run`, `wait`, `scrim`, `reveal` and finally `null`, in that order (3.4.7); B07: median `fcpMs` ≤ 1000 (the first contentful paint is the first visible field frame, 6.1.7); B08: median `railVisibleAfterT0Ms` ≤ 3000 (designed 2980, 3.4.2).
- B09: every trace summary shows CLS `0` (or `0.00`) and every in-page `cls` is `0`.

- [ ] **Step 9: Lighthouse Accessibility, Best Practices, SEO (B11; 6.1.11, 8.2.12, Index amendment A6)**

Eight audits: target ∈ {preview, local} × path ∈ {`/`, `/?noentry`} × device ∈ {`mobile`, `desktop`}. For each:
1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-lh-<target>-<root|noentry>-<device>"` → `P`.
2. `navigate_page` `pageId: P`, `type: "url"`, `url: <target><path>`.
3. `lighthouse_audit` `pageId: P`, `device: <device>`, `mode: "navigation"`, `outputDirPath: "C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/lighthouse/<target>-<root|noentry>-<device>"`.
4. Record the Accessibility, Best Practices and SEO scores and the ids of every failed audit.
5. `close_page` `P`.

Gates: on the four preview audits Accessibility ≥ 95 and Best Practices ≥ 95. SEO: if Step 5 showed `x-robots-tag: noindex`, the only failed SEO audit on the preview is `is-crawlable` and its details name the `x-robots-tag` header, and SEO ≥ 95 on all four local audits; if the header was absent, SEO ≥ 95 on the four preview audits as well. The local Accessibility and Best Practices scores are recorded, not gated.

- [ ] **Step 10: Lighthouse CLI Performance and TBT (B09, B10, B12, B13; Index amendment A5)**

Mobile uses Lighthouse's default mobile emulation and simulated throttling; desktop uses `--preset=desktop`. Each command opens a visible Chrome window (headed, so WebGL runs on the GPU). Run the two blocks as two Bash calls with `timeout: 600000`:
```bash
cd /c/Users/parsa/parsanaji.com
export CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
OUT=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/lighthouse-cli
for run in 1 2 3; do
  npx --yes lighthouse@13.5.0 'https://resume-screen.parsanaji-com.pages.dev/?noentry' --only-categories=performance --output=json --output-path="$OUT/noentry-mobile-$run.json" --quiet
  npx --yes lighthouse@13.5.0 'https://resume-screen.parsanaji-com.pages.dev/?noentry' --only-categories=performance --preset=desktop --output=json --output-path="$OUT/noentry-desktop-$run.json" --quiet
done
ls "$OUT"
```
```bash
cd /c/Users/parsa/parsanaji.com
export CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
OUT=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/lighthouse-cli
for run in 1 2 3; do
  npx --yes lighthouse@13.5.0 'https://resume-screen.parsanaji-com.pages.dev/' --only-categories=performance --output=json --output-path="$OUT/entry-mobile-$run.json" --quiet
  npx --yes lighthouse@13.5.0 'https://resume-screen.parsanaji-com.pages.dev/' --only-categories=performance --preset=desktop --output=json --output-path="$OUT/entry-desktop-$run.json" --quiet
done
node .superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/lh-summary.mjs "$OUT"
```
Expected: twelve JSON files; the summary table has `lh` `13.5.0`, an empty `error` and `warnings` 0 on every row, then four median lines (`entry-desktop`, `entry-mobile`, `noentry-desktop`, `noentry-mobile`). Open `noentry-mobile-1-final.jpg` and `entry-desktop-1-final.jpg` with the Read tool: the dither field is drawn behind the rail (if the page shows the flat static fallback instead, the run measured the fallback path: write that in the report and rerun once with `--chrome-flags="--ignore-gpu-blocklist"` added to every command).
Gates: B12 `noentry-mobile` and `noentry-desktop` median score ≥ 95; B10 median TBT < 100 ms in all four configurations; B09 median CLS `0` in all four (every `cls` < 0.0005). B13 records the two `entry-*` median scores (not gated, 6.1.11).

- [ ] **Step 11: Frame rate, draws, long tasks, FPS probe, GPU time, parity (B03, B14, B15, B20; 6.1.3, 6.1.12, 6.1.13, 8.2.2, 8.2.3)**

1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-frame"` → `P`; `emulate` `pageId: P`, `viewport: "1440x900x1"`, `colorScheme: "dark"` (no throttling).
2. `navigate_page` `pageId: P`, `type: "url"`, `url: "https://resume-screen.parsanaji-com.pages.dev/"`, `initScript`: `init-probe.js` + newline + `init-draws.js`.
3. Wait 6000 ms (entry done at t = 2.7 s, then the 60-frame probe).
4. `performance_start_trace` `pageId: P`, `reload: false`, `autoStop: false`.
5. `evaluate_script` with `fn-pointer-10s.js`.
6. `performance_stop_trace` `pageId: P`, `filePath: "C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/traces/pointer-10s.json.gz"`; record any long task the summary reports.
Expected from step 5: `meanMs` ≤ 16.7 (B14; on a 144 Hz display it is about 6.9); `longTasksAfterEntry` `[]` and the trace lists no task over 50 ms (B14); `drawsPerFrame` has the single key `"2"` (for example `{ "2": 599 }`, B03); `grid` deep-equals `{ "dpr": 1, "widthDev": 1440, "heightDev": 900, "cellDev": 5, "cellCss": 5, "cols": 288, "rows": 180, "maskW": 576, "maskH": 360 }` (3.3.2.5, P6). A degraded probe would show `cellDev` 7 and `cols` 206 (3.7.9); `cellDev` 5 is the "FPS probe kept" reading (B14).
7. GPU time (B15): `evaluate_script` `async () => [await window.__pn.gpuTime(60), await window.__pn.gpuTime(60), await window.__pn.gpuTime(60)]` → three `{ medianMs, p90Ms, frames: 60 }`; the median of the three `medianMs` is ≤ 2 (the prototype measured 0.075 ms). If the result is `[null, null, null]` (no `EXT_disjoint_timer_query_webgl2`): open `new_page` `isolatedContext: "t23-gpu-fallback"`, `emulate` `1440x900x1`, `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/?noentry` with `init-gpu-fallback.js`, wait 4000 ms, `evaluate_script` `() => { const s = window.__t23gpu.slice(-60).sort((a, b) => a - b); return { frames: s.length, medianMs: +s[30].toFixed(3), p90Ms: +s[54].toFixed(3) }; }`; this upper bound passes B15 when `medianMs` ≤ 2 and is "inconclusive, FAIL" above 2. Close that page.
8. Parity (B20): `evaluate_script` `() => window.__pn.parity()` → `maxErr255` ≤ 3, `tierMismatchPct` ≤ 0.5, `cells` 51840 (288 × 180).
9. `close_page` `P`.

- [ ] **Step 12: DPR cap and hidden tab (B04, B05; 6.1.4, 6.1.5, 8.2.9)**

DPR (B04):
1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-dpr"` → `P`; `emulate` `viewport: "390x844x3,mobile,touch"`, `colorScheme: "dark"`.
2. `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/?noentry`; wait 3000 ms.
3. `evaluate_script` `() => ({ grid: window.__pn.grid(), canvas: [document.querySelector('[data-field]').width, document.querySelector('[data-field]').height], raw: devicePixelRatio })` → `grid` deep-equals `{ "dpr": 2, "widthDev": 780, "heightDev": 473, "cellDev": 4, "cellCss": 2, "cols": 195, "rows": 119, "maskW": 390, "maskH": 238 }`, `canvas` `[780, 473]`, `raw` `3` (3.3.2.4–3.3.2.5: the band is 236.32 CSS px, `round(472.64)` = 473, `ceil(473 / 4)` = 119). `close_page` `P`.

Hidden (B05). The test page must share a window with a foreground page, so open the foreground page first in the same context:
1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-hidden"` → `A` (foreground).
2. `new_page` `url: "about:blank"`, `isolatedContext: "t23-hidden"`, `background: true` → `P`.
3. `emulate` `pageId: P`, `viewport: "1440x900x1"`, `colorScheme: "dark"`; `navigate_page` `pageId: P`, `https://resume-screen.parsanaji-com.pages.dev/`, `initScript`: `init-probe.js` + newline + `init-hidden.js`.
4. Wait 3000 ms on `A`.
5. `select_page` `pageId: P`, `bringToFront: true`; wait 5000 ms on `P` (the entry plays now).
6. `select_page` `pageId: A`, `bringToFront: true`; wait 2000 ms on `A` (P is hidden mid-session).
7. `select_page` `pageId: P`, `bringToFront: true`; wait 1000 ms on `P`; `evaluate_script` `() => ({ hidden: window.__t23hidden, probe: window.__t23, noWebgl: document.documentElement.classList.contains('no-webgl') })`.
Expected: `hidden.initial` `"hidden"`; `hidden.events` = `[["visible", t1], ["hidden", t2], ["visible", t3]]`; `hidden.hiddenCallbacks` 0 and `hidden.requestsWhileHiddenAfterVisible` 0 (B05); `probe.fieldReady` ≥ t1 and the `scrim` entry state comes after t1 (the entry started only once visible, 3.4.8); `noWebgl` false (no fallback fired, 3.4.3). If `hidden.initial` is `"visible"`, the background tab was not hidden by the browser: record that, and B05 rests on the mid-session part (`events`, counters). `close_page` `P` and `A`.

- [ ] **Step 13: Fit pass (B21; 1.3.1, 3.1.10, 3.1.11, 3.1.13–3.1.15, 3.1.17, 5.1.8, 8.2.13)**

One page: `new_page` `url: "about:blank"`, `isolatedContext: "t23-fit"` → `P`. For each viewport below and each look (`dark`, then `light`): `emulate` `pageId: P` with the `viewport` string and `colorScheme`; `navigate_page` `pageId: P`, `type: "url"`, `https://resume-screen.parsanaji-com.pages.dev/?noentry`; wait 1500 ms; `evaluate_script` with `fn-fit.js`. Record `measured`, `hard` and `deviations` per row.

| viewport string | layout and what the row proves |
|---|---|
| `1280x720x1`, `1366x768x1`, `1440x900x1`, `1920x1080x1`, `2560x1440x1` | rail, no scroll, no wraps, scrim placement (3.1.17, 3.1.10) |
| `1366x657x1` | rail, 1366×768 minus browser chrome, no scroll |
| `1280x600x1`, `1280x599x1`, `1280x519x1`, `1280x470x1` | the collapse steps of 3.1.11 (all; Projects 2 rows; + Misc 3 tags; scroll fallback 6 px) |
| `853x480x1` | 150 % zoom of 1280×720 fits at step 2 (5.1.8) |
| `844x390x1` | landscape phone: rail with both collapses, scrolls about 84 px (3.1.15; the spec estimated 86) |
| `640x360x1` | 200 % zoom of 1280×720: band, reflow and scroll (5.1.8) |
| `768x1024x2,mobile,touch` | portrait tablet: band, name 60 px, scrolls 97 px (3.1.15) |
| `390x844x3,mobile,touch`, `430x932x3,mobile,touch` | phone band: footer 24 px above the fade (3.1.13) |

At `1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`, `1366x768x1` and `768x1024x2,mobile,touch`, also `take_screenshot` `filePath: "C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23/fit/<w>x<h>-<look>.png"` (8.3.3). `close_page` `P` at the end.
Gate: `hard` is `[]` on all 32 rows (B21). Every `deviations` entry is copied into the report's "Deviations" section with its viewport and look; deviations do not fail the row.

- [ ] **Step 14: Contrast audit (B22; 1.3.4, 3.2.5)**

1. `new_page` `url: "about:blank"`, `isolatedContext: "t23-contrast"` → `P`; `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`; `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/?noentry`; wait 1000 ms; `evaluate_script` with `fn-contrast.js` → `look` `"dark"`, `failedRequirements` `[]`, `mismatches` `[]`.
2. `emulate` `pageId: P`, `colorScheme: "light"`; `navigate_page` `type: "reload"`; wait 1000 ms; `fn-contrast.js` → `look` `"light"`, `[]`, `[]` (the `prefers-color-scheme: light` block).
3. `emulate` `pageId: P`, `colorScheme: "dark"`; reload; wait 1000 ms; `take_snapshot` → the uid of the button named `Switch to light mode`; `click` it; wait 500 ms (the 300 ms crossfade, 3.2.6); `fn-contrast.js` → `look` `"light"` (from `data-theme`), `[]`, `[]` (the `:root[data-theme="light"]` block).
4. `take_snapshot` → the button now named `Switch to dark mode`; `click` it; wait 500 ms; `fn-contrast.js` → `look` `"dark"`, `[]`, `[]` (back to system: no `data-theme`, 3.5.10). `close_page` `P`.
B22 passes when all four runs return empty `failedRequirements` and `mismatches`. Copy the four `measured` objects into the report.

- [ ] **Step 15: Fallbacks (B23; 1.3.6, 3.6.1–3.6.6)**

Each in a fresh page at `1440x900x1` (`isolatedContext: "t23-fb-<name>"`), `colorScheme: "dark"` unless stated; after each, `list_console_messages` shows no `error`, `warn` or `issue` message, then `close_page`.
1. `nowebgl`: `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/?nowebgl`; immediately `evaluate_script` `fn-state.js` → `dataEntry` `null`, `noWebgl` `true`, `revealOpacities` `["1"]`, `fieldDisplay` `"none"`, `scrimDisplay` `"none"`, `clockHidden` `false`; `take_screenshot` `fallbacks/1440x900-dark-nowebgl.png`.
2. `nogl2`: `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/` with `init-no-webgl2.js`; wait 1000 ms; `fn-state.js` → `noWebgl` `true`, `dataEntry` `null`, `revealOpacities` `["1"]`.
3. `reduced`: `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/` with `init-reduced-motion.js`; immediately `fn-state.js` → `dataEntry` `null`, `revealOpacities` `["1"]` (visible in the first paint, 3.4.10), `fieldReady` `true`. Wait 2000 ms, `take_screenshot` `fallbacks/1440x900-dark-reduced-a.png`, wait 1000 ms, `take_screenshot` `fallbacks/1440x900-dark-reduced-b.png`, then in Bash:
   ```bash
   cd /c/Users/parsa/parsanaji.com
   EV=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-23
   node .superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/crop-compare.mjs "$EV/fallbacks/1440x900-dark-reduced-a.png" "$EV/fallbacks/1440x900-dark-reduced-b.png"
   ```
   Expected: `identical (1372800 bytes)` (440 × 780 × 4; the field is a still at τ = 12, 3.6.4; the crop leaves out the status dot, whose CSS pulse the JS-only override does not stop).
4. `forced`: `navigate_page` `https://resume-screen.parsanaji-com.pages.dev/` with `init-forced-colors.js`; immediately `fn-state.js` → `noWebgl` `true`, `dataEntry` `null`, `revealOpacities` `["1"]` (3.6.5).
5. `nojs` (dark, then a second page in `light`): `navigate_page` `http://localhost:4174/`; `fn-state.js` → `dataEntry` `null`, `fieldReady` `false`, `noWebgl` `false`, `revealOpacities` `["1"]`, `fieldOpacity` `"0"`, `toggleHidden` `true`, `clockHidden` `true`, `footer` `"IRVINE, CA"` (the HTML text `Irvine, CA` rendered uppercase by CSS, no clock, 3.5.13), `h1` `"Parsa Naji"` (3.6.1); `list_console_messages` is empty; `take_screenshot` `fallbacks/1440x900-<look>-nojs.png`.
6. CSS-only rules (forced colours and print cannot be emulated):
   ```bash
   cd /c/Users/parsa/parsanaji.com
   grep -n -A 6 '@media (forced-colors: active)' src/styles.css
   grep -n -A 4 '@media print' src/styles.css
   ```
   Expected: the forced-colours block hides `.field, .scrim` and sets `CanvasText` on the dot and the eyebrow rule plus a `2px solid LinkText` outline on `.lnk:focus-visible`; the print block contains `.field, .scrim, .theme-toggle, .keys, .dot { display: none !important; }` and `.lnk::before, .lnk::after { display: none; }` (3.6.5, 3.6.6). Paste both into the report.
B23 passes when every expectation above holds.

- [ ] **Step 16: `anti-ui-slop` finish gate (B24; 8.3.5)**

1. Invoke the `anti-ui-slop` skill with the Skill tool; load its `reference/audit.md` playbook (an audit of an implemented interface; it does not modify the product). The optional Uizze MCP is not connected; continue without it.
2. Inspect the rendered preview with the spec open: the Step 13 screenshots at 1440×900, 1280×720, 390×844, 1366×768 and 768×1024 in both looks, plus these states on a fresh `1440x900x1` dark page (`isolatedContext: "t23-slop"`, URL `https://resume-screen.parsanaji-com.pages.dev/?noentry`): `take_snapshot`, `hover` the `github` link uid, `take_screenshot` `slop/1440x900-dark-hover.png`; `press_key` `?`, `take_screenshot` `slop/1440x900-dark-overlay.png`, `press_key` `Escape`; `emulate` `colorScheme: "light"`, reload, the same two shots as `slop/1440x900-light-hover.png` and `slop/1440x900-light-overlay.png`. `close_page`.
3. Write at most three material findings, ordered by user impact, each with its observable evidence (screenshot file) and the smallest concrete correction. Triage every finding:
   - violates a numbered spec requirement (clipping, overlap, contrast, a dead control, a focus or target-size failure): row B24 `FAIL`, cite the requirement (Failure rule step 3);
   - contradicts the approved design (more colour, icons, gradients, a second typeface, a hero call to action, a form, a newsletter, a cookie banner, anything 1.4 or 2.3 rules out): rejected, cite the requirement;
   - optional taste-level improvement compatible with the spec: listed under "For Parsa (optional)" in the report; Task 24 puts it in the approval message; nothing is changed now.
B24 passes with no finding in the first group.

- [ ] **Step 17: Stop the servers and close the pages**

Stop both background Bash tasks, then in PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 5173,4173,4174 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }
Get-NetTCPConnection -LocalPort 5173,4173,4174 -State Listen -ErrorAction SilentlyContinue
```
Expected: the second command prints nothing. `list_pages` shows no `t23-*` page (close any left). `git status --porcelain` prints nothing.

- [ ] **Step 18: Only if a row failed: the BLOCKED report**

If any row B01–B24 is `FAIL` after the Failure rule, write `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-23-report.md` with the Step 20 skeleton, `Status: BLOCKED`, `Commit: none`, every row filled (passing rows too), and under `## Failures` one block per failed row:
```markdown
### B<nn> — <metric>
- Threshold: <threshold from the Budget rows table>
- Measured: <every run, with units>; median <value>
- Evidence: <paths>
- Setup re-checked: <what was validated in Failure rule step 1>
- Diagnosis: <insight name and its key lines, or the observed cause>
```
Do not write the README and do not commit. Report BLOCKED to the controller with the failed row ids and numbers. Steps 19–21 are skipped.

- [ ] **Step 19: README**

Replace `README.md` completely with the text below. Every `⟨Bnn⟩` slot takes the "measured" cell of that report row in exactly the format given in Step 20; `⟨date⟩` is today (`YYYY-MM-DD`) and `⟨sha7⟩` the Step 1 short SHA. No other text changes.
```markdown
# parsanaji.com

One-screen résumé over a WebGL2 dither field.

A plain-HTML left rail (experience, projects, education, links, a live Irvine clock) sits over a full-screen ordered-dither field that forms the name on every load, bends away from the pointer and sends out a ring on click. Two looks, "Dither Blue" dark and its daylight version, follow the OS; a small toggle overrides them. Vite and vanilla TypeScript with raw WebGL2 and no runtime dependencies. The résumé stays readable without JavaScript, WebGL2 or motion.

- Spec: `docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-design.md` (appendices A–C in `docs/superpowers/specs/2026-10-19-parsanaji-resume-screen-appendix/`)
- Plan: `docs/superpowers/plans/2026-10-19-parsanaji-resume-screen.md`
- Operator steps (Parsa): `docs/OPERATOR.md`

## Run

Node 24 locally (`engines.node >=22.18.0`; `npm run og` imports `src/field/surface.ts` through Node's type stripping).

    npm install
    npm run dev          # http://localhost:5173
    npm test             # vitest, Node environment, no DOM
    npm run typecheck    # tsc --noEmit, prints nothing when clean
    npm run build        # production build in dist/ (no debug panel, no window.__pn)
    npm run preview      # serves dist/ on http://localhost:4173 (ignores public/_headers)
    VITE_PN_DEBUG=1 npm run build   # the build CI deploys to previews: ?debug panel and window.__pn included
    npm run og           # regenerates public/og.png and the favicon PNGs from src/field/surface.ts; commit the outputs
    npm run fonts        # regenerates the JetBrains Mono subsets in public/fonts/ (exits 1 above 40 KB)

URL flags: `?noentry` skips the entry, `?nowebgl` forces the static fallback, `?seed=7` fixes the random seed, `?debug` opens the tuning panel (dev server and preview builds only).

## Tuning the field (`?debug`)

Open `/?debug` on the dev server or on https://resume-screen.parsanaji-com.pages.dev/?debug. The "parsanaji tweaks" panel changes the live field on the next frame; changed values persist in that browser only (`localStorage['pn.tweaks']`).

- `cells`: density (sparse / medium / dense: larger / default / smaller dither cells), `cell.k`, `minCss`, `maxCss` (cell size in CSS px). Changes regrid.
- `surface`: intensity (subtle / medium / lively flow speed), `flowSpeed` (extra speed factor), `warpScalePx` and `mainScalePx` (size of the swirls and of the shapes), `warpAmp` (how strongly the swirls bend the shapes), `level` (higher means less ink), `gain` (higher means harder edges).
- `tiers`: `t2` (lower means more light-blue highlight cells), `t3` (the core tier; the idle field never reaches it).
- `pointer`, `ripple`, `breath`, `mask`, `entry`, `konami`: the repel, the click rings, the ±1 % breathing zoom, the name mask and the timings.
- Buttons: replay entry, Konami, toggle theme, freeze time, copy JSON, reset (clears the saved values and reloads).

Approved values go into `DEFAULT_FIELD` in `src/field/params.ts` and the pinned literal in `tests/params.test.ts` (spec 4.12.4). The panel never ships to production.

## Deploy

Every push runs `.github/workflows/deploy.yml` (`npm ci`, `npm test`, `npm run build`, `wrangler pages deploy dist`):

- branch `resume-screen` → https://resume-screen.parsanaji-com.pages.dev, built with `VITE_PN_DEBUG=1` (`?debug` panel and `window.__pn`); Pages serves previews with `x-robots-tag: noindex`;
- `main` → https://parsanaji.com, built with `VITE_PN_DEBUG=0`. The résumé screen reaches `main` only after Parsa approves the preview: merging `resume-screen` into `main` publishes it.

`npm run deploy` and `npm run deploy:preview` deploy the local working tree directly and need `.env` (the Cloudflare token: never print or commit it); the normal path is a push.

## Budgets (spec 6.1; measured ⟨date⟩ on the preview at `⟨sha7⟩`)

| budget | limit | measured |
|---|---|---|
| production JS, gzip level 9 (`VITE_PN_DEBUG` unset) | ≤ 60 KB | ⟨B01⟩ |
| fonts (two JetBrains Mono subsets) | ≤ 40 KB | ⟨B02⟩ |
| WebGL draws per frame | 2 | ⟨B03⟩ |
| device-pixel ratio | capped at 2 | ⟨B04⟩ |
| LCP without the entry (`?noentry` / reduced motion / no WebGL2), Fast 4G | ≤ 1.5 s | ⟨B06⟩ |
| FCP with the entry, Fast 4G | ≤ 1.0 s | ⟨B07⟩ |
| rail fully visible after the entry starts | ≤ 3.0 s | ⟨B08⟩ |
| CLS | 0 | ⟨B09⟩ |
| TBT (Lighthouse, worst of four configurations) | < 100 ms | ⟨B10⟩ |
| Lighthouse Accessibility / Best Practices / SEO | ≥ 95 | ⟨B11⟩ |
| Lighthouse Performance, `?noentry` (mobile / desktop) | ≥ 95 | ⟨B12⟩ |
| frame interval, 10 s of pointer movement, 1440×900 | ≤ 16.7 ms | ⟨B14⟩ |
| GPU time per frame, 1440×900 | ≤ 2 ms | ⟨B15⟩ |
| console errors and warnings | 0 | ⟨B16⟩ |

## Infrastructure scripts (idempotent, need `.env`, see docs/OPERATOR.md)

    node scripts/cf-env.mjs          # verify token, record account + zone ids
    node scripts/cf-setup-pages.mjs  # custom domains, DNS, www redirect, HTTPS
    node scripts/cf-setup-email.mjs  # info@parsanaji.com -> private-inbox@example.com
    npm run fonts                    # regenerate the font subsets from scripts/fonts-src
```
Then:
```bash
cd /c/Users/parsa/parsanaji.com
grep -c '⟨' README.md || true
grep -n '^One-screen résumé over a WebGL2 dither field.$' README.md
```
Expected: `0` (no slot left) and `3:One-screen résumé over a WebGL2 dither field.` (7.6.1).

- [ ] **Step 20: The task report**

Write `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-23-report.md` with this skeleton, every cell filled from Steps 3–16 (formats are binding; Task 24 copies the "Numbers for the approval message" lines verbatim):
```markdown
# Task 23 report — quality bar

Status: DONE
Commit: <short sha of the Step 21 commit>
Measured preview: https://resume-screen.parsanaji-com.pages.dev at <Step 1 short sha>, Actions run <id> green

## Gate
npm test: <n> files, <m> tests passed; typecheck: clean; build: OK

## Budgets
| id | spec | metric | budget | measured | result | evidence |
|---|---|---|---|---|---|---|
| B01 | 6.1.1 | production JS gzip | ≤ 60 KB | <x.x> KB | PASS | Step 4 output |
| B02 | 6.1.2 | fonts | ≤ 40 KB | <x.x> KB | PASS | Step 4 output |
| B03 | 6.1.3 | draws per frame | 2 | 2 in <n> of <n> frames | PASS | Step 11 |
| B04 | 6.1.4 | DPR cap | 2 | dpr 2 at ×3 (780×473 device px) | PASS | Step 12 |
| B05 | 6.1.5 | rAF while hidden | 0 / 0 | <a> callbacks / <b> requests | PASS | Step 12 |
| B06 | 6.1.6 | LCP no entry, Fast 4G, median | ≤ 1500 ms | <a> / <b> / <c> ms (`?noentry` / reduced / `?nowebgl`) | PASS | traces/ |
| B07 | 6.1.7 | FCP entry, Fast 4G, median | ≤ 1000 ms | <a> ms | PASS | traces/ |
| B08 | 6.1.8 | rail visible after t = 0, median | ≤ 3000 ms | <a> ms | PASS | traces/ |
| B09 | 6.1.9 | CLS | 0 | 0 | PASS | traces/, lighthouse-cli/ |
| B10 | 6.1.10 | TBT, worst median | < 100 ms | <a> ms | PASS | lighthouse-cli/ |
| B11 | 6.1.11 | A11y / BP / SEO, lowest | ≥ 95 | <a> / <b> / <c> | PASS | lighthouse/ |
| B12 | 6.1.11 | Performance `?noentry`, mobile / desktop | ≥ 95 | <a> / <b> | PASS | lighthouse-cli/ |
| B13 | 6.1.11 | Performance entry path, mobile / desktop | recorded | <a> / <b> | RECORDED | lighthouse-cli/ |
| B14 | 6.1.12 | mean frame interval; long tasks; probe | ≤ 16.7 ms; 0; cellDev 5 | <a> ms; 0; 5 | PASS | Step 11 |
| B15 | 6.1.13 | GPU time median | ≤ 2 ms | <a> ms (<source: timer query or finish() upper bound>) | PASS | Step 11 |
| B16 | 6.1.14 | console errors / warnings / issues | 0 | 0 in 12 pages | PASS | console/ |
| B17 | 6.1.15 | engines.node | >=22.18.0 | >=22.18.0 | PASS | Step 4 |
| B18 | 6.1.16 | third-party requests | 0 | 0 | PASS | Step 7 |
| B19 | 6.1.17, 7.3.1 | headers, inline script, inline style | unchanged; 1; 0 | unchanged; 1; 0 | PASS | Steps 4–5 |
| B20 | 1.3.2 | parity | ≤ 3/255, ≤ 0.5 % | <a>/255, <b> % | PASS | Step 11 |
| B21 | 1.3.1, 3.1.17 | fit pass | no hard failure | 32 of 32 rows clean | PASS | fit/ |
| B22 | 1.3.4, 3.2.5 | contrast | table | 4 of 4 runs clean | PASS | Step 14 |
| B23 | 1.3.6 | fallbacks | readable | 6 of 6 | PASS | fallbacks/ |
| B24 | 8.3.5 | anti-ui-slop | no spec violation | <n> findings, 0 violations | PASS | slop/ |

## Lighthouse (DevTools MCP)
| target | path | device | Accessibility | Best Practices | SEO | failed audits |
|---|---|---|---|---|---|---|
(eight rows)

## Lighthouse CLI 13.5.0
(the lh-summary.mjs table and the four median lines, verbatim)

## Traces (Fast 4G)
(one line per load: variant, run, trace LCP, in-page LCP / FCP / CLS / rail-visible, LCP element)

## Fit
(one line per viewport and look: the measured object; hard failures none)

## Deviations
(every fit-pass deviation with viewport and look, or "none")

## Contrast
(the four measured objects)

## anti-ui-slop
(the findings with evidence, the triage of each, and the "For Parsa (optional)" list)

## Gotchas found
(anything a later session must know, or "none")

## Numbers for the approval message
- js_gzip_kb: <B01 number>
- fonts_kb: <B02 number>
- lcp_noentry_ms: <largest of the three B06 medians>
- fcp_entry_ms: <B07>
- rail_visible_ms: <B08>
- cls: 0
- tbt_worst_ms: <B10>
- lh_min_a11y_bp_seo: <lowest gated score of B11>
- lh_perf_noentry: <B12 mobile> / <B12 desktop>
- lh_perf_entry: <B13 mobile> / <B13 desktop>
- frame_mean_ms: <B14 mean>
- gpu_median_ms: <B15>
- parity: <B20 maxErr255>/255, <B20 tierMismatchPct> %
- slop_for_parsa: <one line per optional finding, or "none">
```
README slot formats: `⟨B01⟩` = `<x.x> KB`; `⟨B02⟩` = `<x.x> KB`; `⟨B03⟩` = `2`; `⟨B04⟩` = `2 (at ×3)`; `⟨B06⟩` = `<a> / <b> / <c> ms`; `⟨B07⟩` = `<a> ms`; `⟨B08⟩` = `<a> ms`; `⟨B09⟩` = `0`; `⟨B10⟩` = `<a> ms`; `⟨B11⟩` = `≥ <lowest gated score>`; `⟨B12⟩` = `<a> / <b>`; `⟨B14⟩` = `<a> ms`; `⟨B15⟩` = `<a> ms`; `⟨B16⟩` = `0`.

- [ ] **Step 21: Gate and commit**

```bash
cd /c/Users/parsa/parsanaji.com
npm test
npm run typecheck
npm run build
git status --porcelain
git add README.md
git commit -m "docs(readme): résumé-screen description, recipes and measured budgets

One-line description and run, tuning and deploy recipes (spec 7.6.1),
and the spec 6.1 budgets measured on the preview: every budget passes;
numbers and evidence in the Task 23 report.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log --oneline -1
```
Expected: the suite, typecheck and build as in Step 3; `git status` shows only ` M README.md` before the commit; the last line is the new commit. Put its short SHA into the report's `Commit:` line. Task 23 does not push (Task 24 closes the slice).

---

### Task 24: Handoff: OPERATOR, LinkedIn, tuning, vault and the approval message

**Files:**
- Modify: `docs/OPERATOR.md` (§5 becomes exactly the 7.6.2 text; new "## 7. LinkedIn link" with the 3.1.12 one-commit procedure).
- Only when the dispatch carries the LinkedIn URL from Parsa: Modify `src/content.ts`, `index.html` (uncomment the `<li>` with `href`, `rel="me"`, `data-link="linkedin"`; add the URL to the JSON-LD `sameAs`).
- Only when the dispatch carries tuned values Parsa approved in the `?debug` panel: Modify `src/field/params.ts` and `tests/params.test.ts` (4.12.4).
- Index amendment A7: Modify `tests/content.test.ts` only when the Step 4 dry run fails the suite. Index amendment A8: Modify `README.md` only when approved tuning changes a Budgets row.
- Outside the repo: the vault note `C:/Users/parsa/Documents/Obsidian Vault/Projects/parsanaji.com.md` (preview state, recipes, gotchas found). Not committed: `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24/`, `evidence/task-24/`, `task-24-report.md`.

**Interfaces:**
- Consumes: Task 5 `CONTENT` and the commented LinkedIn `<li>`; Task 7 `initLinks` (un-hides the overlay row); Task 21 the `l` shortcut; Task 9 `DEFAULT_FIELD`; Task 23 measured numbers.
- Produces: the approval message text of 7.5.2 (preview URL; the parked items: email verification, CI token, LinkedIn URL; whether the idle-field tuning of 9.18 is final), written into the task report for the controller.

**Spec:** 1.3.7, 2.1.7, 2.4.1–2.4.3, 3.1.12, 4.12.4, 7.5.1, 7.5.2, 7.6.2, 7.6.3 (preview-state part), 9.18; Index amendments A7 and A8.

**Conventions (slice 4; Tasks 23 and 24 share them).**
- DevTools tools are deferred. Load them first with ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__emulate,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__take_snapshot,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__list_network_requests,mcp__plugin_ecc_chrome-devtools__performance_start_trace,mcp__plugin_ecc_chrome-devtools__performance_stop_trace,mcp__plugin_ecc_chrome-devtools__performance_analyze_insight,mcp__plugin_ecc_chrome-devtools__lighthouse_audit,mcp__plugin_ecc_chrome-devtools__select_page,mcp__plugin_ecc_chrome-devtools__press_key,mcp__plugin_ecc_chrome-devtools__hover,mcp__plugin_ecc_chrome-devtools__click,mcp__plugin_ecc_chrome-devtools__close_page,mcp__plugin_ecc_chrome-devtools__list_pages`.
- Every measurement runs in a fresh page: `new_page` with `url: "about:blank"` and a new `isolatedContext` name, then `emulate`, then `navigate_page` (`type: "url"`, plus `initScript` where a step names one). `new_page` returns the page list; `P` below is the id of the page you just opened. Never touch pages other agents opened (`list_pages` shows their contexts).
- Viewports only through `emulate`: `"1440x900x1"`, `"1280x720x1"`, `"390x844x3,mobile,touch"` and the fit-pass list. Looks through `emulate` `colorScheme: "dark" | "light"`.
- "Wait N ms" means `evaluate_script` with `() => new Promise((resolve) => setTimeout(() => resolve('waited'), N))` on the named page.
- Paths: `EV=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-<N>` and `KIT=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23` in Git Bash (both git-ignored by `.superpowers/sdd/.gitignore`); DevTools `filePath` / `outputDirPath` values use the absolute form `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-<N>/…`.
- Servers start with the Bash tool's `run_in_background`. To stop them, stop the background Bash task, then in PowerShell: `Get-NetTCPConnection -LocalPort 5173,4173,4174 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -Confirm:$false }`, and `close_page` every page you opened.
- SECURITY (7.4.1): `.env` is never read, printed, grepped or staged. No step needs it.

**Inputs from the dispatch.** The controller writes two values into the brief: `LINKEDIN_URL` (the exact URL string Parsa sent, or `none`) and `TUNING_JSON` (the exact JSON Parsa pasted after pressing "copy JSON" in the `?debug` panel together with his "approved", or `none`). No step invents, completes or guesses either value (Global Constraints, 2.4). A value that fails validation is parked with the reason, never repaired.

- [ ] **Step 1: Preconditions and inputs**

```bash
cd /c/Users/parsa/parsanaji.com
git fetch origin
git branch --show-current
git status --porcelain
git log --oneline origin/resume-screen..HEAD
grep -m1 '^Status:' .superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-23-report.md
sed -n '/^## Numbers for the approval message/,$p' .superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-23-report.md
```
Expected: `resume-screen`; nothing; exactly one line, the Task 23 commit `docs(readme): résumé-screen description, recipes and measured budgets`; `Status: DONE`; the fourteen `key: value` lines Step 15 quotes. If Task 23 is BLOCKED, stop: Task 24 runs only on a passing quality bar. Write the two dispatch inputs (`LINKEDIN_URL`, `TUNING_JSON`, verbatim) at the top of `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-24-report.md`.

- [ ] **Step 2: OPERATOR.md: intro line and §5 (7.6.2)**

Two edits in `docs/OPERATOR.md`. The intro would otherwise count five steps while the file lists seven:
```diff
-Everything else in this repo runs from the terminal. These five need you.
+Everything else in this repo runs from the terminal. These steps need you.
```
§5 becomes the 7.6.2 text. The spec quotes it on one line with an em dash between the heading and the sentence; the file keeps its heading-plus-body layout, so the heading is `## 5. iPhone check` and the body is the sentence after the dash, word for word:
```diff
-## 5. iPhone check (slice 5)
-Open https://parsanaji.com in Safari: tap to morph, drag to repel, no scroll bounce, clock correct.
+## 5. iPhone check
+Open https://resume-screen.parsanaji-com.pages.dev in Safari: the name forms in the band, the page scrolls, a tap makes a ring, a drag repels, the clock is correct, the toggle switches looks.
```

- [ ] **Step 3: OPERATOR.md §7: the LinkedIn procedure (3.1.12)**

Append to the end of `docs/OPERATOR.md` (after §6, separated by one blank line):
````markdown
## 7. LinkedIn link
The `linkedin` link stays out of the page until it is real (spec 3.1.12). When you have your profile URL, either send it to Claude ("add LinkedIn per OPERATOR §7: <url>") or run the block below in Git Bash. It makes one commit that sets `CONTENT.links.linkedin` in `src/content.ts`, turns the commented LinkedIn `<li>` in `index.html` into a live link (`rel="me"`, `data-link="linkedin"`) and adds the URL to the JSON-LD `sameAs`; `tests/content.test.ts` checks that the three agree. The `l` shortcut and the LinkedIn row of the `?` list switch on by themselves.

Branch: `resume-screen` while the résumé screen waits for approval (the push updates the preview); `main` once it is merged (the push publishes https://parsanaji.com). `git status --porcelain` must print nothing before you start. Put your exact profile URL between the quotes on the `export` line.

```bash
cd /c/Users/parsa/parsanaji.com
git switch resume-screen      # after the merge: git switch main
git status --porcelain
export LINKEDIN_URL='https://www.linkedin.com/in/your-handle'
node --input-type=module <<'EOF'
import { readFileSync, writeFileSync } from 'node:fs';
const url = process.env.LINKEDIN_URL ?? '';
if (!/^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9%_-]+\/?$/.test(url) || url.includes('your-handle')) {
  throw new Error(`not a LinkedIn profile URL: ${url}`);
}
const edits = [
  ['src/content.ts', /linkedin:\s*''/g, `linkedin: '${url}'`],
  ['index.html', /<!--(?:(?!-->)[\s\S])*?<li><a class="lnk" href="\{links\.linkedin\}" rel="me" data-link="linkedin">linkedin<\/a><\/li>\s*-->/g,
    `<li><a class="lnk" href="${url}" rel="me" data-link="linkedin">linkedin</a></li>`],
  ['index.html', /"sameAs":\["https:\/\/github\.com\/parsanaji"\]/g, `"sameAs":["https://github.com/parsanaji","${url}"]`],
];
const files = new Map();
for (const [file, pattern, replacement] of edits) {
  const text = files.get(file) ?? readFileSync(file, 'utf8');
  const hits = text.match(pattern)?.length ?? 0;
  if (hits !== 1) throw new Error(`${file}: expected exactly 1 match, found ${hits}; nothing was written`);
  files.set(file, text.replace(pattern, replacement));
}
for (const [file, text] of files) writeFileSync(file, text);
console.log(`LinkedIn added in 3 places: ${url}`);
EOF
npm test && npm run typecheck && npm run build
git add src/content.ts index.html
git commit -m "feat(content): add the LinkedIn link (3.1.12)"
git push
```

If the script stops with "expected exactly 1 match", nothing was changed: send the message to Claude. After the push the Actions run turns green; the page then shows `github  linkedin  say hi`, `l` opens your profile and `?` lists it.
````
The writer ran this program on fixtures shaped like the Task 5 files (CRLF line endings, a second HTML comment in the head): it printed `LinkedIn added in 3 places: …`, kept the head comment and produced the live `<li>` and the two-entry `sameAs`.

- [ ] **Step 4: Dry-run the §7 program (RED check for Index amendment A7)**

The program in the doc is the one under test. Extract it and run it with an obviously fake URL that is never committed:
```bash
cd /c/Users/parsa/parsanaji.com
SCR=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24
mkdir -p "$SCR"
tr -d '\r' < docs/OPERATOR.md | awk '/^node --input-type=module <<.EOF.$/{f=1;next} /^EOF$/{f=0} f' > "$SCR/linkedin-edit.mjs"
head -1 "$SCR/linkedin-edit.mjs"; tail -1 "$SCR/linkedin-edit.mjs"
git status --porcelain
LINKEDIN_URL='https://www.linkedin.com/in/dry-run-not-real' node "$SCR/linkedin-edit.mjs"
git diff --stat -- src/content.ts index.html
npm test
```
Expected: `import { readFileSync, writeFileSync } from 'node:fs';` and ``console.log(`LinkedIn added in 3 places: ${url}`);``; `git status` shows only ` M docs/OPERATOR.md`; `LinkedIn added in 3 places: https://www.linkedin.com/in/dry-run-not-real`; the diff stat lists `src/content.ts` and `index.html`. Then `npm test`:
- all green: Task 5's test already holds in both states. Restore the two files (`git restore src/content.ts index.html`), confirm `git status --porcelain` shows only ` M docs/OPERATOR.md`, write "dry run green, Index amendment A7 not needed" in the report and skip Step 5;
- failures in `tests/content.test.ts` only (typically the JSON-LD expectation still lists GitHub alone): this is the RED state for Step 5. Keep the dry-run edits in place and go to Step 5;
- failures anywhere else: restore the two files, stop and report to the controller with the failing test names (LinkedIn presence breaks something outside the content test).

- [ ] **Step 5: Only if Step 4 failed: make `tests/content.test.ts` hold in both states (GREEN)**

Append this block to the end of `tests/content.test.ts` (aliased imports, so it cannot collide with the file's own imports; the function is hoisted, so earlier assertions can use it):
```ts
// Task 24 (spec 3.1.12, 5.2.1, 5.2.3): CONTENT.links.linkedin, the LinkedIn <li> and the JSON-LD sameAs stay equal
// with and without the URL, so docs/OPERATOR.md section 7 stays a one-commit change.
import { readFileSync as readTextForLinkedin } from 'node:fs';
import { describe as describeLinkedin, expect as expectLinkedin, it as itLinkedin } from 'vitest';
import { CONTENT as CONTENT_LINKEDIN } from '../src/content';

function linkedinSameAs(): string[] {
  const url: string = CONTENT_LINKEDIN.links.linkedin;
  return url === '' ? ['https://github.com/parsanaji'] : ['https://github.com/parsanaji', url];
}

describeLinkedin('LinkedIn presence (3.1.12)', () => {
  const html = readTextForLinkedin(new URL('../index.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const live = html.replace(/<!--[\s\S]*?-->/g, '');
  const url: string = CONTENT_LINKEDIN.links.linkedin;

  itLinkedin('JSON-LD sameAs is GitHub, plus LinkedIn exactly when CONTENT has the URL (5.2.3)', () => {
    const block = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/.exec(html);
    expectLinkedin(block).not.toBeNull();
    expectLinkedin(JSON.parse(block![1]).sameAs).toEqual(linkedinSameAs());
  });

  itLinkedin('the live LinkedIn anchor exists exactly when CONTENT has the URL, between github and say hi', () => {
    const anchors = live.match(/<a [^>]*data-link="linkedin"[^>]*>/g) ?? [];
    if (url === '') {
      expectLinkedin(anchors).toEqual([]);
      return;
    }
    expectLinkedin(anchors).toEqual([`<a class="lnk" href="${url}" rel="me" data-link="linkedin">`]);
    expectLinkedin(live.indexOf('data-link="github"')).toBeLessThan(live.indexOf('data-link="linkedin"'));
    expectLinkedin(live.indexOf('data-link="linkedin"')).toBeLessThan(live.indexOf('data-email="info@parsanaji.com"'));
  });
});
```
Then fix the assertion Step 4 reported, and only that assertion:
- its expected value is an object literal with `sameAs: ['https://github.com/parsanaji']`: replace that property with `sameAs: linkedinSameAs()`;
- it compares two JSON strings (the page's JSON-LD text and the 5.2.1 literal): change it to `expect(JSON.parse(<actual>)).toEqual({ ...JSON.parse(<literal>), sameAs: linkedinSameAs() })`, where `<actual>` and `<literal>` are the two expressions the assertion already compares.
Every other Task 5 assertion stays as written.
```bash
cd /c/Users/parsa/parsanaji.com
npx vitest run tests/content.test.ts
git restore src/content.ts index.html
npm test
npm run typecheck
git status --porcelain
```
Expected: with the dry-run URL in place, `tests/content.test.ts` passes (GREEN for the LinkedIn state); after the restore the full suite passes (the empty state) and typecheck prints nothing; `git status` shows ` M docs/OPERATOR.md` and ` M tests/content.test.ts` only.

- [ ] **Step 6: Gate and the docs commit**

```bash
cd /c/Users/parsa/parsanaji.com
grep -n -E '^## [0-9]\.' docs/OPERATOR.md
grep -n 'These steps need you.' docs/OPERATOR.md
npm test
npm run typecheck
npm run build
git add docs/OPERATOR.md
git add tests/content.test.ts   # only if Step 5 ran
git commit -m "docs(operator): iPhone check on the preview and the LinkedIn one-commit procedure

Section 5 is the spec 7.6.2 iPhone check against the resume-screen
preview; new section 7 is the spec 3.1.12 LinkedIn procedure as a
copy-paste recipe, dry-run against the suite with a throwaway URL.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: seven headings `## 1. GitHub CLI` through `## 7. LinkedIn link`; the intro line; the suite green (`Test Files  33 passed (33)`, `Tests  306 passed (306)`, or 308 tests when Step 5 appended its two cases), typecheck clean, build OK. If Step 5 ran, add this line to the commit body before the trailer: `tests/content.test.ts now holds in both LinkedIn states (sameAs derived from CONTENT).`

- [ ] **Step 7: Only with `LINKEDIN_URL`: apply it (3.1.12)**

```bash
cd /c/Users/parsa/parsanaji.com
SCR=.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24
git status --porcelain
LINKEDIN_URL='<the exact LINKEDIN_URL from the dispatch>' node "$SCR/linkedin-edit.mjs"
git diff -- src/content.ts index.html
npm test
npm run typecheck
npm run build
```
Expected: nothing before the edit; `LinkedIn added in 3 places: <url>`; the diff shows exactly three changes: `linkedin: '<url>'` in `src/content.ts`, the comment replaced by `<li><a class="lnk" href="<url>" rel="me" data-link="linkedin">linkedin</a></li>`, and `"sameAs":["https://github.com/parsanaji","<url>"]`; the suite green (the content test now holds the LinkedIn state), typecheck clean, build OK. If the program throws `not a LinkedIn profile URL`, nothing changed: park LinkedIn with that message in the report and skip Step 8.

- [ ] **Step 8: Only with `LINKEDIN_URL`: browser evidence on the dev server**

Start `npm run dev` (`run_in_background: true`; the URLs below use `http://localhost:5173/`, use the port Vite prints if it differs). Create `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24/init-nav-spy.js`:
```js
(() => {
  // Records page-initiated navigations and cancels them (Navigation API), so `l` can be checked without leaving
  // the page; location.assign itself cannot be spied (unforgeable). Verified in Chrome while writing this plan.
  window.__t24nav = [];
  if (window.navigation) navigation.addEventListener('navigate', (e) => { window.__t24nav.push(e.destination.url); e.preventDefault(); });
})();
```
1. `new_page` `url: "about:blank"`, `isolatedContext: "t24-linkedin"` → `P`; `emulate` `viewport: "1440x900x1"`, `colorScheme: "dark"`; `navigate_page` `http://localhost:5173/?noentry` with that `initScript`; wait 1500 ms.
2. `take_snapshot` → the links read `github`, `linkedin`, `say hi` in that order (3.5.11).
3. `press_key` `l`; `evaluate_script` `() => window.__t24nav` → `["<url>"]` (3.5.4).
4. `press_key` `?`; `evaluate_script` `() => { const row = document.querySelector('[data-key="linkedin"]'); return { open: document.querySelector('dialog[data-keys]').open, rowHidden: row.hidden, rowDisplay: getComputedStyle(row).display }; }` → `{ open: true, rowHidden: false }` and `rowDisplay` not `"none"` (3.5.5, Task 7 `initLinks`); `take_screenshot` `C:/Users/parsa/parsanaji.com/.superpowers/sdd/2026-10-19-parsanaji-resume-screen/evidence/task-24/1440x900-dark-overlay-linkedin.png`; `press_key` `Escape`.
5. `evaluate_script` `() => { const r = document.querySelector('a[data-link="linkedin"]').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }` (rect at rest); `take_snapshot`, `hover` the `linkedin` link uid, wait 300 ms, then `() => { const a = document.querySelector('a[data-link="linkedin"]'); const r = a.getBoundingClientRect(); return { before: getComputedStyle(a, '::before').opacity, after: getComputedStyle(a, '::after').opacity, rect: [r.x, r.y, r.width, r.height] }; }` → `before` `"1"`, `after` `"1"`, `rect` identical to the rest rect (3.5.1); `take_screenshot` `evidence/task-24/1440x900-dark-linkedin-hover.png`.
6. Fit with three links: `emulate` `viewport: "1280x720x1"`, reload, wait 1500 ms, `evaluate_script` with Task 23's `fn-fit.js` (`.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/fn-fit.js`) → `hard` `[]` (the links row still ends left of S, 3.2.5.1); a `bottom` deviation is expected and recorded.
7. `list_console_messages` → only the 3.5.7 greeting. `close_page` `P`; stop the dev server (PowerShell line of the Conventions above).

- [ ] **Step 9: Only with `TUNING_JSON`: check the values (4.12.3, 4.12.4, 9.18)**

Write the dispatch's `TUNING_JSON` verbatim to `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24/tuning.json` with the Write tool, and create `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24/tuning-diff.mjs`:
```js
// Usage (from the repo root): node <this file> <tuning.json>
// Compares the JSON Parsa copied from the ?debug panel ("copy JSON": the full params or only the changed keys)
// with DEFAULT_FIELD, checks every changed leaf against the spec 4.12.3 ranges and the 4.9.1 / 6.1.8 rules,
// and prints the changed leaves. Exit code 1 (and nothing to apply) on any violation.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { DEFAULT_FIELD } = await import(pathToFileURL(resolve('src/field/params.ts')).href);
const tuned = JSON.parse(readFileSync(process.argv[2], 'utf8'));

// spec 4.12.3: [min, max, step] for sliders, the option list for selects
const RANGES = {
  density: ['sparse', 'medium', 'dense'],
  'cell.k': [0.001, 0.008, 0.0001], 'cell.minCss': [1, 6, 0.5], 'cell.maxCss': [2, 12, 0.5],
  intensity: ['subtle', 'medium', 'lively'],
  flowSpeed: [0, 3, 0.05],
  'shape.warpScalePx': [80, 600, 10], 'shape.mainScalePx': [60, 400, 5], 'shape.warpAmp': [0, 6, 0.1],
  'shape.level': [0, 0.6, 0.01], 'shape.gain': [0.5, 4, 0.05],
  'tiers.t2': [0.4, 0.9, 0.005], 'tiers.t3': [0.6, 1, 0.005],
  'pointer.radiusK': [0.1, 0.5, 0.01], 'pointer.radiusSp': [0, 6, 0.5], 'pointer.warpK': [0, 1, 0.01],
  'pointer.boost': [0, 0.4, 0.01], 'pointer.lerp': [0.02, 1, 0.01], 'pointer.riseMs': [0, 1000, 10],
  'pointer.fallMs': [0, 2000, 10], 'pointer.velNorm': [200, 4000, 50], 'pointer.velRadiusGain': [0, 0.5, 0.01],
  'ripple.max': [1, 8, 1], 'ripple.lifeS': [0.5, 6, 0.1], 'ripple.amp': [0, 2, 0.05],
  'ripple.speedSp': [1, 20, 0.5], 'ripple.sigmaSp': [0.5, 4, 0.1], 'ripple.gain': [0, 2, 0.05],
  'breath.amp': [0, 0.05, 0.001], 'breath.periodMs': [1000, 20000, 100],
  'mask.holdDim': [0, 1, 0.01], 'mask.ink': [0.7, 1, 0.01], 'mask.edge': [0.01, 0.3, 0.01],
  'mask.meltPx': [0, 150, 1], 'mask.heightFrac': [0.1, 0.8, 0.01], 'mask.widthFrac': [0.3, 1, 0.01],
  'entry.gatherMs': [0, 6000, 10], 'entry.holdMs': [0, 6000, 10], 'entry.dissolveMs': [0, 6000, 10],
  'entry.scrimAtMs': [0, 6000, 10], 'entry.revealAtMs': [0, 6000, 10], 'entry.cleanupAtMs': [0, 6000, 10],
  'entry.skipMs': [0, 1000, 10],
  'konami.gatherMs': [0, 6000, 10], 'konami.holdMs': [0, 6000, 10], 'konami.dissolveMs': [0, 6000, 10],
};

const errors = [];
const changes = [];
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const decimals = (step) => (String(step).split('.')[1] ?? '').length;
function walk(value, base, path) {
  for (const [key, v] of Object.entries(value)) {
    const p = path ? `${path}.${key}` : key;
    if (!(isObj(base) && Object.hasOwn(base, key))) { errors.push(`${p}: not a key of DEFAULT_FIELD`); continue; }
    const b = base[key];
    if (isObj(v) || isObj(b)) {
      if (isObj(v) && isObj(b)) walk(v, b, p); else errors.push(`${p}: shape differs from DEFAULT_FIELD`);
      continue;
    }
    const range = RANGES[p];
    const norm = typeof v === 'number' && Array.isArray(range) && typeof range[2] === 'number' ? Number(v.toFixed(decimals(range[2]))) : v;
    if (norm === b) continue;
    if (!range) { errors.push(`${p}: ${JSON.stringify(b)} -> ${JSON.stringify(v)} is not a 4.12.3 tunable`); continue; }
    if (typeof range[0] === 'string') {
      if (!range.includes(norm)) errors.push(`${p}: ${JSON.stringify(v)} is not one of ${range.join(' / ')}`);
    } else if (typeof norm !== 'number' || !Number.isFinite(norm) || norm < range[0] || norm > range[1]) {
      errors.push(`${p}: ${JSON.stringify(v)} is outside ${range[0]}..${range[1]}`);
    }
    changes.push([p, b, norm]);
  }
}
walk(tuned, DEFAULT_FIELD, '');

const merged = structuredClone(DEFAULT_FIELD);
for (const [p, , v] of changes) { const keys = p.split('.'); keys.slice(0, -1).reduce((o, k) => o[k], merged)[keys.at(-1)] = v; }
if (!(merged.tiers.t2 < merged.tiers.t3)) errors.push(`tiers: t2 ${merged.tiers.t2} must stay below t3 ${merged.tiers.t3} (4.9.1)`);
if (!Number.isInteger(merged.ripple.max) || merged.ripple.max > 8) errors.push(`ripple.max ${merged.ripple.max} must be an integer <= 8 (4.9.1)`);
if (merged.cell.minCss > merged.cell.maxCss) errors.push(`cell: minCss ${merged.cell.minCss} > maxCss ${merged.cell.maxCss}`);
const e = merged.entry;
if (changes.some(([p]) => p.startsWith('entry.'))) {
  if (e.revealAtMs + 7 * 40 + 600 > 3000) errors.push(`entry: revealAtMs ${e.revealAtMs} + 880 > 3000 breaks 6.1.8 (rail fully visible <= 3.0 s)`);
  if (e.scrimAtMs > e.revealAtMs) errors.push(`entry: scrimAtMs ${e.scrimAtMs} after revealAtMs ${e.revealAtMs}`);
  if (e.gatherMs + e.holdMs + e.dissolveMs > e.cleanupAtMs) errors.push(`entry: gather + hold + dissolve ${e.gatherMs + e.holdMs + e.dissolveMs} > cleanupAtMs ${e.cleanupAtMs}`);
}

for (const [p, b, v] of changes) console.log(`${p}: ${JSON.stringify(b)} -> ${JSON.stringify(v)}`);
console.log(`${changes.length} changed leaves`);
if (changes.some(([p]) => p.startsWith('shape.') || p.startsWith('tiers.'))) console.log('NOTE: shape/tiers changed: public/og.png and the reduced-motion still no longer match (follow-up for the controller)');
if (errors.length) { for (const m of errors) console.error(`ERROR ${m}`); process.exit(1); }
```
```bash
cd /c/Users/parsa/parsanaji.com
node .superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24/tuning-diff.mjs .superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-24/tuning.json
```
Expected: one `path: old -> new` line per changed leaf, then `<n> changed leaves`, exit code 0. (The writer's runs on samples: a partial paste `{"density":"sparse","tiers":{"t2":0.6200000000000001,"t3":0.9},"flowSpeed":0.6000000000000001}` printed `density: "medium" -> "sparse"`, `tiers.t2: 0.66 -> 0.62`, `flowSpeed: 1 -> 0.6`; a full paste with intensity subtle and the 9.5 shape printed three leaves; an out-of-range paste exited 1 with one `ERROR` line per violation.) Then:
- exit code 1, or `0 changed leaves`: park the tuning, paste the output into the report and skip Steps 10–11;
- a `NOTE:` line: record it in the report as a controller follow-up (`public/og.png` is drawn from `BLUEPRINT_SHAPE` and the 0.66 / 0.90 tiers of `src/field/surface.ts`; Task 24 does not change them).

- [ ] **Step 10: Only with `TUNING_JSON`: pin, then apply (RED → GREEN)**

RED: in `tests/params.test.ts`, edit the `DEFAULT_FIELD` expected literal (the 4.9 object) at exactly the changed leaves, each with a trailing comment. For the sample `tiers.t2 0.66 -> 0.62` the hunk is:
```diff
-  tiers: { t2: 0.66, t3: 0.9 },
+  tiers: { t2: 0.62, t3: 0.9 }, // 4.12.4: t2 approved by Parsa <YYYY-MM-DD> (spec 4.9: 0.66)
```
```bash
cd /c/Users/parsa/parsanaji.com
npx vitest run tests/params.test.ts
```
Expected: FAIL, the deep-equality case of `DEFAULT_FIELD` naming the changed leaves.
GREEN: make the same edits in the `DEFAULT_FIELD` literal of `src/field/params.ts`, same comment per leaf, nothing else. Then:
```bash
cd /c/Users/parsa/parsanaji.com
npx vitest run tests/params.test.ts
npm test
npm run typecheck
```
Expected: the params test passes; the full suite passes; typecheck prints nothing. If any test other than `tests/params.test.ts` fails, that test pins a 4.9 value through `DEFAULT_FIELD`: run `git restore src/field/params.ts tests/params.test.ts`, park the tuning with the failing test names in the report (the controller decides), and skip Step 11.

- [ ] **Step 11: Only with applied tuning: re-measure the affected budgets (Index amendment A8)**

Tuning changes the frames, so B03, B14, B15 and B20 are re-measured on a local preview-equivalent build, and B08 too when an `entry.*` leaf changed:
```bash
cd /c/Users/parsa/parsanaji.com && VITE_PN_DEBUG=1 npm run build
```
then `npm run preview` with `run_in_background: true` (`http://localhost:4173/`). Use Task 23's kit in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/`:
1. `new_page` `isolatedContext: "t24-frame"`, `emulate` `1440x900x1` dark, `navigate_page` `http://localhost:4173/` with `init-probe.js` + newline + `init-draws.js`, wait 6000 ms, `evaluate_script` with `fn-pointer-10s.js` → `meanMs` ≤ 16.7, `longTasksAfterEntry` `[]`, `drawsPerFrame` only key `"2"`, `grid.cellDev` equal to `max(2, round(clamp(k × 1440, minCss, maxCss) × densityK[density]))` for the tuned values (5 with the defaults; 3.3.2.1–3.3.2.2 at DPR 1, probe kept); then `async () => [await window.__pn.gpuTime(60), await window.__pn.gpuTime(60), await window.__pn.gpuTime(60)]` → median of the three `medianMs` ≤ 2; then `() => window.__pn.parity()` → `maxErr255` ≤ 3, `tierMismatchPct` ≤ 0.5. `close_page`.
2. Only when an `entry.*` leaf changed: three fresh pages (`isolatedContext: "t24-f4g-entry-<n>"`), `emulate` `1440x900x1` dark with `networkConditions: "Fast 4G"`, `navigate_page` `http://localhost:4173/` with `init-probe.js`, wait 6000 ms, `evaluate_script` with `fn-metrics.js` → median `railVisibleAfterT0Ms` ≤ 3000. Close each page.
3. Stop the server (PowerShell line of the Conventions above) and rebuild production: `env -u VITE_PN_DEBUG npm run build`.
A threshold failure parks the tuning: `git restore src/field/params.ts tests/params.test.ts`, numbers into the report, skip the rest of this step. Otherwise, when a re-measured number differs from the README "Budgets" cell, update that cell (`frame interval` row from `meanMs`, `GPU time` row from the median, `rail fully visible` row from the median) in `README.md` and note the change in the report.

- [ ] **Step 12: Only with applied operator input: gate and the operator-input commit**

```bash
cd /c/Users/parsa/parsanaji.com
npm test
npm run typecheck
npm run build
git status --porcelain
```
Expected: green, clean, OK; `git status` lists only the files of the inputs that were applied (`src/content.ts`, `index.html`; `src/field/params.ts`, `tests/params.test.ts`; `README.md` when Step 11 changed it). Stage exactly those files, then commit with the message that matches what was applied.
LinkedIn only:
```bash
git add src/content.ts index.html
git commit -m "feat(content): add the LinkedIn link (3.1.12)

CONTENT.links.linkedin, the live <li> (rel=me, data-link=linkedin) and
the JSON-LD sameAs carry <url>; the l shortcut and its overlay row
switch on through initLinks.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Tuning only:
```bash
git add src/field/params.ts tests/params.test.ts
git add README.md   # only if Step 11 changed it
git commit -m "feat(field): Parsa's approved field defaults (4.12.4)

<one line per changed leaf: path old -> new>
Re-measured on a preview build: frame <meanMs> ms, GPU <median> ms,
parity <maxErr255>/255.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Both (one commit for all operator input):
```bash
git add src/content.ts index.html src/field/params.ts tests/params.test.ts
git add README.md   # only if Step 11 changed it
git commit -m "feat: LinkedIn link (3.1.12) and Parsa's approved field defaults (4.12.4)

LinkedIn: <url> in CONTENT, the live <li> and the JSON-LD sameAs.
Field: <one line per changed leaf: path old -> new>
Re-measured on a preview build: frame <meanMs> ms, GPU <median> ms,
parity <maxErr255>/255.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
The `<…>` parts are the literal values from Steps 7, 9 and 11. With neither input applied, there is no second commit.

- [ ] **Step 13: Push and CI (closes the slice)**

```bash
cd /c/Users/parsa/parsanaji.com
export PATH="$PATH:/c/Program Files/GitHub CLI"
git log --oneline origin/resume-screen..HEAD
git push origin resume-screen
git rev-parse HEAD
gh run list --branch resume-screen --limit 3 --json databaseId,headSha,status
```
Expected: two or three commits listed (Task 23, the docs commit, the optional operator-input commit); the push succeeds; the run list shows a run whose `headSha` equals `HEAD` (repeat only the `gh run list` command until it appears). Then, with `timeout: 600000`:
```bash
export PATH="$PATH:/c/Program Files/GitHub CLI"
gh run watch <databaseId> --exit-status
curl -s -o /dev/null -w "%{http_code}\n" https://resume-screen.parsanaji-com.pages.dev/
```
Expected: the run ends with `✓ … completed with 'success'` and exit code 0 (7.2.1); `200`. A red run stops the task: report the failing step's log (`gh run view <databaseId> --log-failed`) to the controller.

- [ ] **Step 14: Preview checks**

1. Console (8.2.1): six fresh pages on `https://resume-screen.parsanaji-com.pages.dev/`, viewport ∈ {`1440x900x1`, `1280x720x1`, `390x844x3,mobile,touch`} × look ∈ {`dark`, `light`}, `isolatedContext: "t24-console-<w>x<h>-<look>"`: `emulate`, `navigate_page`, wait 6000 ms, `evaluate_script` with Task 23's `fn-interact.js` → `{ dataEntry: null, fieldReady: true, noWebgl: false }`; `list_console_messages` → only the greeting, no `error`, `warn` or `issue`; `take_screenshot` `evidence/task-24/<w>x<h>-<look>-preview.png`; `close_page`.
2. With LinkedIn applied: on a fresh `1440x900x1` page with `init-nav-spy.js` (`/?noentry`): `press_key` `l` → `window.__t24nav` is `["<url>"]`; `press_key` `?` → the LinkedIn row is visible; `Escape`.
3. With tuning applied: on a fresh `1440x900x1` page (`/?noentry`), `() => window.__pn.parity()` passes as in Step 11, and `take_screenshot` `evidence/task-24/1440x900-<look>-tuned.png` in both looks.
Close every page. `git status --porcelain` prints nothing.

- [ ] **Step 15: Vault note (7.6.3 preview-state part)**

Read `C:/Users/parsa/Documents/Obsidian Vault/Projects/parsanaji.com.md` first (the controller edits it after every slice), then make these edits with the Edit tool. Slots: `⟨sha7⟩` = `git rev-parse --short=7 HEAD`; `⟨run⟩` = the Step 13 run id; `⟨date⟩` = today; `⟨…_ms⟩`-style slots = the Task 23 "Numbers for the approval message" values (post-tuning values from Step 11 where re-measured); `⟨linkedin⟩` = `added ⟨date⟩: <url>` or `parked: the link stays absent; docs/OPERATOR.md §7 adds it in one commit`; `⟨tuning⟩` = `applied ⟨date⟩: <changed leaves>` or `not given: defaults stay the approved Blueprint medium / medium`.

1. Below the line that starts with `* **Live:**`, insert (or, if a line starting with `* **Preview (résumé screen` exists, replace it with):
```markdown
* **Preview (résumé screen, awaiting Parsa's approval):** https://resume-screen.parsanaji-com.pages.dev (branch `resume-screen` at `⟨sha7⟩`). Production stays on the teaser until the merge.
```
2. Directly above the first line that starts with `## ⚠️ Status:`, insert the block below, and change that old line's prefix `## ⚠️ Status:` to `### Previous status:` (the rest of the line stays):
```markdown
## ⚠️ Status: AWAITING PARSA'S APPROVAL ⟨date⟩ — résumé screen feature-complete on the preview

- **Preview:** https://resume-screen.parsanaji-com.pages.dev (branch `resume-screen` at `⟨sha7⟩`, Actions run ⟨run⟩ green). https://parsanaji.com still serves the teaser. Approval = merge `resume-screen` into `main`; the Actions run on `main` publishes production (spec 7.5.1).
- **Built (24 tasks, 4 slices):** plain-HTML rail over a raw WebGL2 two-pass Bayer dither field (pointer repel, click Shockwave, ±1 % breath); "field forms the name" entry on every load (rail fully visible 2.98 s after it starts); Dither Blue dark + daylight looks with a stored toggle; live Irvine clock; "say hi" copies the address; `g` / `l` / `e` / `?` shortcuts; Konami `nice.`; name scramble; console greeting; fallbacks for no JS, no WebGL2, reduced motion, forced colours and print.
- **Measured (Task 23, ⟨date⟩):** JS ⟨js_gzip_kb⟩ KB gzip; fonts ⟨fonts_kb⟩ KB; LCP without the entry ⟨lcp_noentry_ms⟩ ms and FCP with it ⟨fcp_entry_ms⟩ ms (Fast 4G); rail visible ⟨rail_visible_ms⟩ ms after t = 0; CLS 0; TBT ≤ ⟨tbt_worst_ms⟩ ms; Lighthouse A11y / BP / SEO ≥ ⟨lh_min_a11y_bp_seo⟩, Performance `?noentry` ⟨lh_perf_noentry⟩; frame ⟨frame_mean_ms⟩ ms; GPU ⟨gpu_median_ms⟩ ms; console clean on the preview and the local production build.
- **Operator input:** LinkedIn ⟨linkedin⟩. Idle-field tuning (spec 9.18) ⟨tuning⟩.
- **Next:** Fable's whole-branch review → the approval message (draft in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-24-report.md`) → on "approved": the controller merges `resume-screen` into `main`, watches the run, checks the production console and Lighthouse SEO on https://parsanaji.com, then updates this note and memory (7.6.3).
```
3. Replace the whole section from the line that starts with `## ⚙️ How to Run / Deploy` up to (not including) the next line that is exactly `---` with the text below. Before replacing, compare the old section with it: any bullet of the old section whose fact the new text does not carry is appended unchanged at the end of the new section.
````markdown
## ⚙️ How to Run / Deploy (résumé screen on branch `resume-screen`; updated ⟨date⟩)

```bash
cd /c/Users/parsa/parsanaji.com
git switch resume-screen      # main still serves the teaser until Parsa approves
npm install                   # Node 24.19 locally; engines >= 22.18 (npm run og uses Node type stripping)
npm run dev                   # http://localhost:5173  (?debug panel, ?noentry, ?nowebgl, ?seed=7)
npm test                      # vitest 5, Node environment, no DOM (minimal reporter under Claude Code)
npm run typecheck             # prints nothing when clean
npm run build                 # production build: no ?debug panel, no window.__pn
VITE_PN_DEBUG=1 npm run build && npm run preview   # what CI deploys to the preview, on http://localhost:4173
npm run og                    # public/og.png + favicon PNGs from src/field/surface.ts (commit the outputs)
npm run fonts                 # JetBrains Mono subsets; fails above 40 KB
```

* **Deploy = push.** `.github/workflows/deploy.yml`: checkout@v7, setup-node@v7 Node 22, `npm ci && npm test`, `npm run build` with `VITE_PN_DEBUG` = `1` on every branch except `main` (`0` on `main`), then wrangler-action@v4 `pages deploy dist --project-name=parsanaji-com --branch=<ref>`. `resume-screen` → https://resume-screen.parsanaji-com.pages.dev (debug build); `main` → https://parsanaji.com. Production changes only by merging `resume-screen` into `main` after Parsa approves (spec 7.5). `npm run deploy` / `deploy:preview` deploy the working tree directly and need `.env`; the build process never uses them. Repo secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (still the broad operator token; Pages-only swap per `docs/OPERATOR.md` §6).
* **Tuning on the preview (`?debug`):** https://resume-screen.parsanaji-com.pages.dev/?debug opens the "parsanaji tweaks" panel; values persist only in that browser (`localStorage['pn.tweaks']`). Folders: `cells` (density sparse / medium / dense = cell size ×1.35 / ×1 / ×0.75; `cell.k`, `minCss`, `maxCss`; regrids), `surface` (intensity subtle / medium / lively = flow ×0.55 / ×1 / ×1.7; `flowSpeed`; `warpScalePx` / `mainScalePx` = size of the swirls / shapes; `warpAmp` = bend; `level` = less ink when higher; `gain` = harder edges), `tiers` (`t2`: lower = more light-blue highlight cells; `t3`: core tier, never reached by the idle field), `pointer` (repel radius, push, brightening, smoothing, fade in / out, speed widening), `ripple` (count, life, strength, speed, width), `breath` (±zoom and period), `mask` (field strength around the letters, letter brightness, dissolve softness, melt distance, size limits), `entry` / `konami` (timings). Buttons: replay entry, Konami, toggle theme, freeze time, copy JSON, reset. First things to try if the full-screen field feels busy (risks 9.3, 9.5, 9.18): density sparse; intensity subtle or flowSpeed 0.6; `t2` 0.62; `mainScalePx` 200 + `warpScalePx` 300. To ship values: "copy JSON" → paste to Claude → the Task 24 `tuning-diff.mjs` check (4.12.3 ranges, `t2 < t3`, `ripple.max ≤ 8`, entry reveal + 880 ≤ 3000 ms) → only the changed leaves go into `DEFAULT_FIELD` (`src/field/params.ts`) and `tests/params.test.ts` (spec 4.12.4). Shape or tier changes leave `public/og.png` on the old look (it uses `BLUEPRINT_SHAPE` and 0.66 / 0.90).
* **LinkedIn:** `docs/OPERATOR.md` §7 (one commit; the `l` shortcut and the overlay row switch on by themselves).
* **Measuring (Task 23 recipes):** fresh `isolatedContext` page per check; cold Fast 4G loads = `performance_start_trace` (`reload: false`, `autoStop: false`) on `about:blank`, then `navigate_page`, then `performance_stop_trace`; Lighthouse A11y / BP / SEO via the DevTools MCP `lighthouse_audit`, Performance and TBT via `npx --yes lighthouse@13.5.0 <url> --only-categories=performance [--preset=desktop] --output=json --output-path=<file>`; JS budget = the spec 8.1.4 `node -e` gzip sum of `dist/assets/*.js` with `VITE_PN_DEBUG` unset. The measurement kit (init scripts, page functions, `lh-summary.mjs`) lives in `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/scratch/task-23/`.
* **Cloudflare:** Pages project `parsanaji-com` (Direct Upload, production branch `main`); custom domain = apex only; `www` = proxied CNAME + zone Single Redirect 301 to the apex (query preserved); Always Use HTTPS on; `email_obfuscation` off; zone-level Web Analytics already injects the Insights beacon on the apex (do NOT enable the per-project toggle, it would add a second beacon). Idempotent scripts, all read `.env`: `node scripts/cf-env.mjs`, `node scripts/cf-setup-pages.mjs`, `node scripts/cf-setup-email.mjs [--no-wait]`.
* **Email:** Email Routing enabled (3 MX + SPF + DKIM); destination `private-inbox@example.com` created, **verification click pending**; after the click run `node scripts/cf-setup-email.mjs` to create `info@parsanaji.com -> private-inbox@example.com` (catch-all stays off).
* **`.env`** (gitignored, never read or printed by agents): `CLOUDFLARE_API_TOKEN` (custom token `parsanaji-com-deploy`), `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`. `gh` 2.102.0 at `C:\Program Files\GitHub CLI\gh.exe` (export it onto PATH in shells older than the install), account `parsanaji`.
* **SDD ledgers** (git-ignored, inside the repo folder): résumé screen `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/progress.md` (task reports, evidence, kit); teaser `.superpowers/sdd/2026-10-16-parsanaji-teaser/progress.md`. Plan checkboxes mirror them.
````
If the old section's Email bullet already says the verification is done (or the ledger says so), keep that state instead of "verification click pending".
4. Append to the list under `### Gotchas found so far (this Windows PC)`:
```markdown
* The DevTools MCP `lighthouse_audit` reports Accessibility, Best Practices, SEO and agentic browsing only, never Performance. Performance / TBT: `npx --yes lighthouse@13.5.0 <url> --only-categories=performance` (headed Chrome, WebGL on the GPU; `CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'` if Chrome is not found). Verified 2026-10-19.
* Cloudflare Pages sends `x-robots-tag: noindex` on every `*.pages.dev` preview (the apex sends none), so Lighthouse SEO fails `is-crawlable` on previews by design: gate SEO on the local production build (`npm run build && npm run preview`) or on production. Verified 2026-10-19.
* `location.assign` cannot be spied (unforgeable own property). An init script with the Navigation API (`navigation.addEventListener('navigate', (e) => { record(e.destination.url); e.preventDefault(); })`) records and cancels page-initiated navigations. Verified 2026-10-19.
* A JS-only reduced-motion override (matchMedia init script) leaves the CSS status-dot pulse running: compare static-field screenshots on a cropped open-field region (sharp `extract`), not whole pages.
```
then one bullet per entry under "Gotchas found" in `task-23-report.md` and in this task's report.
5. Under `### Open inputs`: replace the bullet that starts with `* LinkedIn URL` with `* LinkedIn URL — ⟨linkedin⟩.`, and append these bullets unless an equivalent one is already there:
```markdown
* Cloudflare Email Routing verification click (mail to private-inbox@example.com), then the controller runs `node scripts/cf-setup-email.mjs`.
* CI token swap to a Pages-only token (`docs/OPERATOR.md` §6).
* Idle-field tuning (spec 9.18) — ⟨tuning⟩.
* Parsa's approval of the preview: merging `resume-screen` into `main` publishes https://parsanaji.com.
```
Then:
```bash
grep -n -E "AWAITING PARSA'S APPROVAL|^### Previous status:|How to Run / Deploy \(résumé|lighthouse@13.5.0|x-robots-tag: noindex|Preview \(résumé screen" "/c/Users/parsa/Documents/Obsidian Vault/Projects/parsanaji.com.md"
grep -c '⟨' "/c/Users/parsa/Documents/Obsidian Vault/Projects/parsanaji.com.md" || true
```
Expected: every pattern matches at least once; `0` slots left. The vault is outside the repo: nothing to commit.

- [ ] **Step 16: The approval message and the report**

Append to `.superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-24-report.md`: `Status: DONE`, the commits (`git log --oneline origin/main..HEAD | head -5`), the Step 13 run id, every check result of Steps 4–14 with its evidence path, what was applied or parked (with the reason), follow-ups (the Step 9 `NOTE:` if any), "Gotchas found", and then, under `## Approval message (7.5.2)`, the message below with every slot filled (Task 23 "Numbers for the approval message", Step 11 values where re-measured, `⟨date⟩` = today). Exactly one variant of each bracketed choice stays; the brackets and the unused variant go.
```text
parsanaji.com résumé screen: ready for your OK.
Preview: https://resume-screen.parsanaji-com.pages.dev

1. Open the preview on your PC in a fresh tab and watch the first 3 seconds: the blue dither field gathers into "Parsa Naji", holds, then melts away while the résumé fades in on the left. (No animation at all? Windows "Animation effects" is off under Settings → Accessibility → Visual effects; the site respects it and shows the résumé at once.)
2. Move the mouse over the open field: it bends away from the cursor. Click the open field: a ring runs out from the click.
3. Press the small word at the top right ("light" or "dark") to switch looks and check both:
   - dark = Dither Blue: deep navy, near-white text, the blue field;
   - light = Dither Blue in daylight: pale paper, navy ink, the field as blue ink.
   Your choice sticks. Pressing back to your system's look returns to "follow the system".
4. Click "say hi": it shows "copied" and info@parsanaji.com is on your clipboard. Then press g (GitHub), e (copy email), ? (shortcut list) and Esc. Click your name to scramble it. Hidden extra: ↑ ↑ ↓ ↓ ← → ← → b a.
5. On your iPhone in Safari, open the same URL: the name forms in the bottom band, the page scrolls, a tap makes a ring, a drag repels, the clock is right, the toggle switches looks (docs/OPERATOR.md §5).
6. Field tuning — [final: your values from ⟨date⟩ are now the defaults: ⟨changed leaves⟩ | not final: the field uses the approved Blueprint defaults (density medium, intensity medium)]. To change it, open https://resume-screen.parsanaji-com.pages.dev/?debug and try one at a time in the "parsanaji tweaks" panel: cells → density "sparse" (bigger, calmer cells); surface → intensity "subtle" or flowSpeed 0.6 (slower drift); tiers → t2 0.62 (fewer flat light patches); surface → mainScalePx 200 with warpScalePx 300 (larger shapes on big screens). Changes apply at once and stay in your browser only; "reset" goes back. When you like it, press "copy JSON" and paste it to me with "approved".
7. Reply "approved" when you're happy. Approval means I merge the branch resume-screen into main, and the GitHub Actions run on main publishes it to https://parsanaji.com, replacing the teaser. Nothing reaches parsanaji.com before you say so.

Measured on the preview (⟨date⟩): JS ⟨js_gzip_kb⟩ KB gzip (budget 60); fonts ⟨fonts_kb⟩ KB (budget 40); without the entry the page paints its main content in ⟨lcp_noentry_ms⟩ ms on simulated fast 4G (budget 1500); with the entry the field shows at ⟨fcp_entry_ms⟩ ms (budget 1000) and the résumé is fully visible ⟨rail_visible_ms⟩ ms after the entry starts (budget 3000); no layout shift; Lighthouse Accessibility / Best Practices / SEO ≥ ⟨lh_min_a11y_bp_seo⟩, Performance ⟨lh_perf_noentry⟩ (mobile / desktop, without the entry); ⟨frame_mean_ms⟩ ms per frame and ⟨gpu_median_ms⟩ ms of GPU per frame at 1440×900; zero console errors or warnings.
[A design audit (anti-ui-slop) flagged nothing material. | A design audit suggested, optionally: ⟨slop_for_parsa⟩.]

Still waiting on you (none of these blocks approval):
- Email: click "Verify email address" in the Cloudflare mail sent to private-inbox@example.com, then tell me. Until then mail to info@parsanaji.com does not arrive (the copy button still works).
- CI token: swap the GitHub Actions secret for a Pages-only token (docs/OPERATOR.md §6, about 2 minutes).
- LinkedIn: [send me your profile URL and I add it in one commit (docs/OPERATOR.md §7) | added: ⟨url⟩].
```
Drop the "Email" line if the ledger or the vault note says the verification is done, and the "CI token" line if the ledger says the swap is done. Then:
```bash
cd /c/Users/parsa/parsanaji.com
grep -c '⟨' .superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-24-report.md || true
grep -n 'https://resume-screen.parsanaji-com.pages.dev' .superpowers/sdd/2026-10-19-parsanaji-resume-screen/task-24-report.md | head -3
git status --porcelain
```
Expected: `0`; the preview URL lines of the message; nothing (the report is git-ignored). Report DONE to the controller with the run id, the commits, what was applied or parked, and the path of the approval message. The controller then runs the Fable whole-branch review and sends the message (Execution Notes); Task 24 never merges and never touches `main`.
