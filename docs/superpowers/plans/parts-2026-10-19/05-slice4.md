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
