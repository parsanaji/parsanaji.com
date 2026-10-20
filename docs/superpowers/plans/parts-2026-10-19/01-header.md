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
