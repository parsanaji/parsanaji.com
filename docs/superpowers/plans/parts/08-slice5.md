## Slice 5 — Polish and proof

### Task 22: Open Graph image from the real engine

**Files:**
- Modify: `src/main.ts` (`?og` still mode), `.gitignore`
- Create: `scripts/og-image.mjs`
- Replace: `public/og.png`

**Interfaces:**
- Produces: `?og` renders the name fully formed, no vibration, no breath, no ripple, no chrome, no cursor ring — a still frame. `npm run og` turns a 2400×1260 capture at `scripts/.cache/og-raw.png` into `public/og.png` (1200×630).

- [ ] **Step 1: Add the still mode to `src/main.ts`**

Inside `boot()`, right after `const params = cloneParams(DEFAULTS);` add:
```ts
  const still = query.has('og');
  if (still) {
    params.vibAmp = 0;
    params.breathAmp = 0;
    params.ripple.intervalMs = Number.MAX_SAFE_INTEGER;
    document.getElementById('chrome')?.setAttribute('hidden', '');
  }
```

Change the `reduced` line to:
```ts
  const reduced = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

And guard the cursor ring: change `if (cursorEl) initCursorRing(cursorEl);` to `if (cursorEl && !new URLSearchParams(location.search).has('og')) initCursorRing(cursorEl);` (the ring is initialized before `query` exists; keep the two lines where they are).

- [ ] **Step 2: Write `scripts/og-image.mjs` and ignore the cache folder**

```js
// Downscale the DevTools capture of /?og&seed=7 (2400×1260) to the 1200×630 Open Graph image. Run: npm run og
import { access } from 'node:fs/promises';
import sharp from 'sharp';

const input = 'scripts/.cache/og-raw.png';
await access(input).catch(() => {
  console.error(`missing ${input}: capture http://localhost:5173/?og&seed=7 at 1200x630, DPR 2, and save it there`);
  process.exit(1);
});
const meta = await sharp(input).metadata();
console.log(`input ${meta.width}x${meta.height}`);
await sharp(input).resize(1200, 630, { fit: 'cover', position: 'centre' }).png({ compressionLevel: 9 }).toFile('public/og.png');
const out = await sharp('public/og.png').metadata();
console.log(`public/og.png ${out.width}x${out.height}, ${((out.size ?? 0) / 1024).toFixed(0)} KB`);
```

Append to `.gitignore`:
```
scripts/.cache
```

- [ ] **Step 3: Capture and generate**

Run `npm run dev`. With the DevTools MCP: `emulate` `{ width: 1200, height: 630, deviceScaleFactor: 2 }` (or `resize_page` 1200×630 plus a DPR-2 emulation), `navigate_page` to `http://localhost:5173/?og&seed=7`, wait 1 s, `take_screenshot` (viewport only). Copy the saved PNG to `scripts/.cache/og-raw.png`, then:

Run: `npm run og`
Expected: `public/og.png 1200x630`, under 400 KB; open it: the dotted `PARSA NAJI` on the dark vignette, no chrome.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts scripts/og-image.mjs .gitignore public/og.png
git commit -m "feat: Open Graph image rendered from the particle engine (?og still mode)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: Lighthouse, performance trace, CSP, HSTS (effort: xhigh)

**Files:**
- Create: `scripts/cf-hsts.mjs`
- Modify as findings require: `src/styles.css`, `index.html`, `public/_headers`

**Interfaces:**
- Produces: Lighthouse >= 95 in Performance, Accessibility, Best Practices and SEO on the preview URL (mobile and desktop); a performance trace with no long task over 50 ms after the entry; zero CSP violations; HSTS on.

- [ ] **Step 1: Deploy the current state to preview**

Run: `npm run build && npm run deploy:preview`
Expected: `https://preview.parsanaji-com.pages.dev` serves the latest build.

- [ ] **Step 2: Lighthouse, both form factors**

DevTools MCP: `lighthouse_audit` on `https://preview.parsanaji-com.pages.dev/` with mobile emulation, then again with desktop. Record the four scores for each.

Known likely findings and the fix for each (apply only what the audit reports, then redeploy and re-audit):
- **Color contrast of the exit line / clock**: `--muted` ships at 0.5 (about 4.95:1 on `#070707`, already above the 4.5:1 audit floor). If the audit still flags it (sub-pixel rendering of 12 px text), raise `--muted` to `rgba(245, 245, 245, 0.56)` and record the value in the spec's section 12 (Task 26).
- **Font display**: the display face uses `font-display: block` on purpose (the sampler waits for it); this is a diagnostic, not a scored item. Leave it.
- **Unused JavaScript**: `three` is tree-shaken by the build; if the audit still flags more than 30 KB, confirm the import is `import * as THREE from 'three'` only in `ParticleField.ts` and no `three/examples` module is pulled in.
- **CSP evaluated as weak**: the policy already has `object-src 'none'` and `base-uri 'self'`; if the audit mentions `script-src` and the analytics host, that is expected and acceptable.
- **`<time>` without `datetime`**: add a `datetime` attribute update in `startClock` only if the audit flags it.

Expected after fixes: all four scores >= 95 on both form factors. Put the final numbers in the commit message.

- [ ] **Step 3: Performance trace**

DevTools MCP on the preview URL: `performance_start_trace` (reload on), wait for the entry, then `hover`/`drag` across the name for about 10 s, `performance_stop_trace`, `performance_analyze_insight` for long tasks and render-blocking. Expected: no long task over 50 ms after the first 2 s; LCP under 1.2 s on the simulated profile; CLS 0.

- [ ] **Step 4: CSP and headers on the live edge**

```bash
curl -sI https://preview.parsanaji-com.pages.dev/ | grep -i -E "content-security-policy|x-content-type|referrer-policy|permissions-policy|x-frame|cache-control"
```
Expected: every header from `public/_headers`. In the browser, `list_console_messages` after 20 s of interaction: no `Refused to …` CSP messages.

- [ ] **Step 5: HSTS**

`scripts/cf-hsts.mjs`:
```js
// Enable HSTS on the zone (6 months, no subdomains, no preload). Run: node scripts/cf-hsts.mjs
import { api, env, requireEnv } from './cf-api.mjs';

requireEnv('token', 'zoneId');
const result = await api('PATCH', `/zones/${env.zoneId}/settings/security_header`, {
  value: {
    strict_transport_security: { enabled: true, max_age: 15_552_000, include_subdomains: false, preload: false, nosniff: true },
  },
});
console.log(JSON.stringify(result.value, null, 2));
```

Run: `node scripts/cf-hsts.mjs && curl -sI https://parsanaji.com/ | grep -i strict-transport-security`
Expected: `strict-transport-security: max-age=15552000`.

- [ ] **Step 6: Commit**

```bash
git add scripts/cf-hsts.mjs src/styles.css index.html public/_headers
git commit -m "perf: Lighthouse >=95 x4 (mobile <scores>, desktop <scores>), HSTS on

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 24: Accessibility and fallback pass

**Files:**
- Modify only if a check fails: `index.html`, `src/styles.css`, `src/ui/*`

- [ ] **Step 1: Keyboard and semantics** (DevTools MCP on the preview URL)

1. `take_snapshot` (accessibility tree): a level-1 heading `Parsa Naji`, the paragraph `Building something new.`, links `github` and `say hi` (no `linkedin` while the URL is empty), the clock group (`role="group"`) with its `aria-label`; the canvas absent from the tree.
2. `press_key` Tab twice: focus lands on `github`, then `say hi`; `take_screenshot` after each shows the 2 px focus ring and the underline. Enter on `github` opens the profile (then navigate back).
3. Zoom approximation: `evaluate_script` → `document.documentElement.style.zoom = '2'`: the exit line and clock stay inside the viewport without overlapping the name. Reset afterwards.

- [ ] **Step 2: No-JS and no-WebGL**

```bash
curl -s https://preview.parsanaji-com.pages.dev/ | grep -c "static-name"
```
Expected: 2 (the live static block and the `<noscript>` copy). Then `navigate_page` to `https://preview.parsanaji-com.pages.dev/?nowebgl`: the typographic page renders in Geist, chrome fades in after 2 s, no console errors.

- [ ] **Step 3: Reduced motion on the deployed build**

`emulate` `prefers-reduced-motion: reduce`, reload the preview: instant name, no vibration, click gives the crossfade, chrome visible immediately (the CSS animation delay is 0 in this mode).

- [ ] **Step 4: Fix anything that failed, re-verify, commit**

```bash
git add -A
git commit -m "a11y: keyboard, semantics and fallback fixes from the slice-5 pass

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
(Skip the commit if nothing changed.)

---

### Task 25: Finish gate, frozen defaults, production

**Files:**
- Modify: `src/engine/defaults.ts` (only values Parsa tuned), anything the finish gate flags

- [ ] **Step 1: Ask Parsa for tuned values**

Parsa opens `http://localhost:5173/?debug` (the orchestrator can run the dev server for him), tunes, presses `copy JSON`, and pastes the JSON into the conversation. If he has not tuned anything, the shipped defaults stay.

- [ ] **Step 2: Freeze them**

Apply only the differing values to `src/engine/defaults.ts` (keep the file's shape and comments). Run `npm test && npm run typecheck`.

- [ ] **Step 3: Run the UI finish gate**

Invoke the `anti-ui-slop` skill's finish gate and the `frontend-design` review against the preview URL with the spec open. Address every concrete finding (spacing, contrast, motion feel, copy casing); reject anything that adds color, icons, gradients, or a second typeface. Record what changed in the commit body.

- [ ] **Step 4: iPhone check (operator step 5)**

Parsa opens `https://preview.parsanaji-com.pages.dev` in Safari: tap morph, drag repel, no scroll bounce, no address-bar jump, clock correct, text sharp. Fix anything he reports; redeploy preview; repeat.

- [ ] **Step 5: Ship**

```bash
git add -A
git commit -m "release: teaser v1 - frozen defaults, finish-gate fixes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
gh run watch --exit-status
curl -sI https://parsanaji.com/ | head -3
```

Then one more `lighthouse_audit` on `https://parsanaji.com/` (mobile): all four >= 95. Screenshot the live page at 1440×900 and 390×844 for the record.

---

### Task 26: Documentation and closing checkpoint

**Files:**
- Modify: `docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md` (append section 12), `README.md`
- Orchestrator: vault note `Projects/parsanaji.com.md`, memory `parsanaji-com.md`, dashboard line

- [ ] **Step 1: Append "12. Shipped state" to the spec**

Record: live URL and date, final Lighthouse numbers (mobile and desktop), measured `N` at 1440×900 and 390×844, any value that differs from the spec tables (with the reason, e.g. muted contrast 0.56), the preview URL pattern, and the operator steps' status (GitHub CLI, token, email verified or not).

- [ ] **Step 2: README**

Add a "Tuning" section: `?debug` panel, `copy JSON`, where defaults live; and an "OG image" section pointing at `npm run og` and the `?og&seed=7` capture.

- [ ] **Step 3: Commit and push**

```bash
git add docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md README.md
git commit -m "docs: shipped state, tuning and OG recipes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 4: Orchestrator closes the loop**

Update the vault note (status: live, deploy recipe, gotchas met during the build, side quests still open), the memory file (one paragraph: live, where things are, what is next = full-site brainstorm), and the dashboard line. Tell Parsa: live URL, what to click, the three side quests waiting (GitHub rename, resume rebuild, LinkedIn).

---

## Spec coverage map

| Spec section | Task(s) |
|---|---|
| 1 Purpose, 1.3 success criteria | 14, 20, 23, 25 |
| 2 Scope | all; out-of-scope items untouched |
| 3.1 Layout, 3.2 Look | 3 (markup, CSS, fonts, favicon, OG placeholder), 11 (name width/stacking), 12 (dot look), 22 (real OG) |
| 3.3 Density | 10 (`dotCount`), 11 (sampler), 14 (`App.layout`) |
| 3.4 Coordinates | 12 (camera), 17 (`toWorld`) |
| 3.5 Entry / Idle | 12 (shader), 13 (breath, ripple), 14 (wiring) |
| 3.5 Pointer | 12 (shader repel), 16, 17 |
| 3.5 Morph / Auto-tease / Touch | 19, 20 |
| 3.5 Reduced motion | 3 (CSS), 12 (shader), 19, 20 |
| 3.5 Hidden tab | 9 (`clampDt`), 14 (visibility), 21 |
| 3.6 Adaptive quality | 10 (`FpsProbe`), 21 |
| 3.7 Resize | 14, 21 |
| 3.8 Fallbacks | 3 (`<noscript>`, static block), 14 (`hasWebGL2`, `waitForFont`), 24 |
| 3.9 Content | 3 (`content.ts`, markup) |
| 4 Architecture | 1 (toolchain), 9–21 (modules), 15 (debug panel) |
| 5 A11y / SEO | 3 (markup, JSON-LD), 24 |
| 6 Budget | 2 (fonts), 15 (bundle), 23 (Lighthouse, trace) |
| 7.1 Repo | 1, 4, 5 |
| 7.2 Pages | 5 (Actions), 6 |
| 7.3 Headers | 3, 23 |
| 7.4 Email | 7 |
| 7.5 Analytics | operator toggle (OPERATOR.md, Task 4) |
| 7.6 Operator steps | 4, 7, 25 |
| 8 Testing | every task's test/verify steps; 23–24 |
| 9 Slices | plan structure |
| 10 Open inputs | 3 (LinkedIn hidden), 26 |
