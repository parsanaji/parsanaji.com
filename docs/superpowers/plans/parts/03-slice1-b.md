### Task 4: Operator prerequisites and Cloudflare environment

Tasks 5–7 need two things only Parsa can create: a GitHub CLI login and a scoped Cloudflare API token. This task documents them, checks them, and records the account and zone ids. **If either check fails, stop here and report the exact missing item; do not continue to Task 5.**

**Files:**
- Create: `docs/OPERATOR.md`, `scripts/cf-env.mjs`, `scripts/cf-api.mjs`

**Interfaces:**
- Produces: `.env` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`; `scripts/cf-api.mjs` exporting `env`, `requireEnv(...keys)`, `api(method, path, body?)`, `sleep(ms)` for Tasks 6, 7 and 25.

- [ ] **Step 1: Write `docs/OPERATOR.md`**

```markdown
# Operator steps (Parsa, one time each)

Everything else in this repo runs from the terminal. These five need you.

## 1. GitHub CLI
In PowerShell:

    winget install GitHub.cli
    gh auth login

Pick GitHub.com, HTTPS, "Login with a web browser", and sign in as **parsanaji**.
Verify: `gh auth status` shows `Logged in to github.com account parsanaji`.
Shells opened by a VS Code process that predates the install lack `gh` on PATH. Run `export PATH="$PATH:/c/Program Files/GitHub CLI"` (Git Bash) or `$env:Path += ";C:\Program Files\GitHub CLI"` (PowerShell) first, or restart VS Code.

## 2. Cloudflare API token
Dashboard → My Profile → API Tokens → Create Token → Create Custom Token.
Name: `parsanaji-com-deploy`. Permissions, exactly:

- Account · Cloudflare Pages · Edit
- Account · Email Routing Addresses · Edit
- Account · Account Settings · Read
- Zone · Zone · Read
- Zone · DNS · Edit
- Zone · Zone Settings · Edit
- Zone · Email Routing Rules · Edit
- Zone · Single Redirect · Edit (older dashboards call it "Dynamic Redirect")

Account Resources: Include → your account. Zone Resources: Include → Specific zone → parsanaji.com.
Create, copy the token once, then in the repo root:

    cp .env.example .env
    # edit .env and paste:  CLOUDFLARE_API_TOKEN=<token>

`.env` is gitignored. The builder runs `node scripts/cf-env.mjs` to verify it and fill in the ids.

## 3. Email verification
After the builder runs `node scripts/cf-setup-email.mjs`, Cloudflare emails **private-inbox@example.com**. Click "Verify email address".

## 4. Web Analytics (optional)
Dashboard → Workers & Pages → parsanaji-com → Metrics → Enable Web Analytics. One toggle, cookieless.

## 5. iPhone check (slice 5)
Open https://parsanaji.com in Safari: tap to morph, drag to repel, no scroll bounce, clock correct.
```

- [ ] **Step 2: Write `scripts/cf-api.mjs`** (shared by the Cloudflare scripts)

```js
// Shared Cloudflare REST helper. Reads .env; exits with a clear message when a value is missing.
process.loadEnvFile('.env');

export const env = {
  token: process.env.CLOUDFLARE_API_TOKEN ?? '',
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
  zoneId: process.env.CLOUDFLARE_ZONE_ID ?? '',
};

export function requireEnv(...keys) {
  for (const key of keys) {
    if (!env[key]) {
      console.error(`missing ${key} in .env (run: node scripts/cf-env.mjs)`);
      process.exit(1);
    }
  }
}

export async function api(method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`${method} ${path} -> HTTP ${res.status} ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

- [ ] **Step 3: Write `scripts/cf-env.mjs`**

```js
// Verifies the Cloudflare API token and records the account + zone ids for parsanaji.com in .env.
// Run: node scripts/cf-env.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { api, requireEnv } from './cf-api.mjs';

requireEnv('token');
const verify = await api('GET', '/user/tokens/verify');
console.log(`token status: ${verify.status}`);

const zones = await api('GET', '/zones?name=parsanaji.com');
if (!zones.length) {
  console.error('zone parsanaji.com is not visible to this token (check Zone Resources on the token)');
  process.exit(1);
}
const zone = zones[0];
const keep = (await readFile('.env', 'utf8'))
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('CLOUDFLARE_ACCOUNT_ID=') && !line.startsWith('CLOUDFLARE_ZONE_ID='));
keep.push(`CLOUDFLARE_ACCOUNT_ID=${zone.account.id}`, `CLOUDFLARE_ZONE_ID=${zone.id}`);
await writeFile('.env', `${keep.join('\n')}\n`);
console.log(`account ${zone.account.id}`);
console.log(`zone    ${zone.id} (${zone.name}, status ${zone.status})`);
console.log(`nameservers: ${zone.name_servers?.join(', ')}`);
console.log('written to .env');
```

- [ ] **Step 4: Check GitHub CLI**

Run: `gh auth status 2>&1 || "/c/Program Files/GitHub CLI/gh.exe" auth status 2>&1`
Expected: `Logged in to github.com account parsanaji`. If `gh` is missing or logged into another account: STOP, report "Operator step 1 (GitHub CLI) is missing", and wait.

- [ ] **Step 5: Check the Cloudflare token and record ids**

Run: `test -f .env && node scripts/cf-env.mjs`
Expected: `token status: active`, an account id, a zone id with `status active`, `written to .env`. If `.env` is missing or the token is rejected: STOP, report "Operator step 2 (Cloudflare API token) is missing or lacks Zone:Read on parsanaji.com", and wait.

- [ ] **Step 6: Commit** (never `.env`)

```bash
git status --short   # confirm .env is NOT listed
git add docs/OPERATOR.md scripts/cf-api.mjs scripts/cf-env.mjs
git commit -m "docs: operator steps and Cloudflare environment scripts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: GitHub repository and push-to-deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: remote `origin` = `https://github.com/parsanaji/parsanaji.com` (private); repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; a workflow that tests, builds and deploys every push (production for `main`, preview for other branches).

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: deploy

on:
  push:
    branches: ['**']

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=parsanaji-com --branch=${{ github.ref_name }} --commit-dirty=true
```

- [ ] **Step 2: Commit, create the repository, push**

```bash
cd /c/Users/parsa/parsanaji.com
git add .github/workflows/deploy.yml
git commit -m "ci: test, build and deploy to Cloudflare Pages on push

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
export PATH="$PATH:/c/Program Files/GitHub CLI"
gh repo create parsanaji/parsanaji.com --private --source=. --remote=origin --push
```

Expected: `✓ Created repository parsanaji/parsanaji.com on GitHub` and `main` pushed. (The first workflow run fails at the deploy step because the Pages project does not exist yet; Task 6 fixes that.)

- [ ] **Step 3: Set the repository secrets from `.env`**

```bash
set -a; . ./.env; set +a
export PATH="$PATH:/c/Program Files/GitHub CLI"
gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
gh secret list
```

Expected: both secrets listed.

---

### Task 6: Cloudflare Pages project, first deploy, custom domains, redirect, HTTPS

**Files:**
- Create: `scripts/cf-setup-pages.mjs`

**Interfaces:**
- Produces: Pages project `parsanaji-com` (Direct Upload, production branch `main`), a production deployment serving `dist/`, custom domains `parsanaji.com` + `www.parsanaji.com`, proxied CNAMEs to `parsanaji-com.pages.dev`, a 301 `www → apex` Single Redirect, Always Use HTTPS on.

- [ ] **Step 1: Create the project and deploy**

```bash
cd /c/Users/parsa/parsanaji.com
set -a; . ./.env; set +a
npx wrangler pages project create parsanaji-com --production-branch main
npm run deploy
```

Expected: `✨ Successfully created the 'parsanaji-com' project.` then `✨ Deployment complete! Take a peek over at https://<hash>.parsanaji-com.pages.dev`. Verify: `curl -sI https://parsanaji-com.pages.dev/ | head -20` shows `HTTP/2 200`, a `content-security-policy:` header starting `default-src 'self'`, and `cache-control: no-cache`.

- [ ] **Step 2: Write `scripts/cf-setup-pages.mjs`** (idempotent; safe to rerun)

```js
// Custom domains, DNS, www redirect and HTTPS for the Pages project. Run: node scripts/cf-setup-pages.mjs
import { api, env, requireEnv, sleep } from './cf-api.mjs';

requireEnv('token', 'accountId', 'zoneId');
const PROJECT = 'parsanaji-com';
const APEX = 'parsanaji.com';
const WWW = 'www.parsanaji.com';
const PAGES_HOST = `${PROJECT}.pages.dev`;

// 1. custom domains on the Pages project
const domains = await api('GET', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains`);
for (const name of [APEX, WWW]) {
  if (domains.some((d) => d.name === name)) {
    console.log(`Pages domain ${name}: already present`);
  } else {
    await api('POST', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains`, { name });
    console.log(`Pages domain ${name}: added`);
  }
}

// 2. DNS: proxied CNAMEs to the pages.dev host (Cloudflare flattens the apex CNAME)
const records = await api('GET', `/zones/${env.zoneId}/dns_records?per_page=100`);
for (const name of [APEX, WWW]) {
  const existing = records.find((r) => r.name === name && ['CNAME', 'A', 'AAAA'].includes(r.type));
  const want = { type: 'CNAME', name, content: PAGES_HOST, proxied: true, ttl: 1 };
  if (!existing) {
    await api('POST', `/zones/${env.zoneId}/dns_records`, want);
    console.log(`DNS ${name}: CNAME -> ${PAGES_HOST} created`);
  } else if (existing.type !== 'CNAME' || existing.content !== PAGES_HOST || !existing.proxied) {
    await api('PATCH', `/zones/${env.zoneId}/dns_records/${existing.id}`, want);
    console.log(`DNS ${name}: updated to CNAME -> ${PAGES_HOST}`);
  } else {
    console.log(`DNS ${name}: already correct`);
  }
}

// 3. www -> apex, 301, query string preserved (Single Redirect, zone entrypoint ruleset).
//    PUT replaces every rule in this phase; the zone has no other redirect rules.
await api('PUT', `/zones/${env.zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
  rules: [
    {
      description: 'www to apex',
      expression: `(http.host eq "${WWW}")`,
      action: 'redirect',
      action_parameters: {
        from_value: {
          status_code: 301,
          target_url: { expression: `concat("https://${APEX}", http.request.uri.path)` },
          preserve_query_string: true,
        },
      },
      enabled: true,
    },
  ],
});
console.log('redirect rule: www -> apex set');

// 4. always use HTTPS
await api('PATCH', `/zones/${env.zoneId}/settings/always_use_https`, { value: 'on' });
console.log('always_use_https: on');

// 5. wait for the Pages domains to validate (certificate issuance can take a few minutes)
for (const name of [APEX, WWW]) {
  let status = 'unknown';
  for (let i = 0; i < 30; i++) {
    const d = await api('GET', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains/${name}`);
    status = d.status;
    if (status === 'active') break;
    await sleep(10_000);
  }
  console.log(`${name}: ${status}`);
}
```

- [ ] **Step 3: Run it**

Run: `node scripts/cf-setup-pages.mjs`
Expected: both domains `added`, both CNAMEs `created`, redirect set, HTTPS on, and finally `parsanaji.com: active` and `www.parsanaji.com: active` (up to 5 minutes; rerun if the last lines still say `pending`).

- [ ] **Step 4: Verify from outside**

```bash
curl -sI https://parsanaji.com/ | head -12
curl -sI https://www.parsanaji.com/ | head -5
curl -sI http://parsanaji.com/ | head -3
curl -s https://parsanaji.com/ | grep -c "Parsa Naji"
```

Expected: first `HTTP/2 200` with the CSP header; second `HTTP/2 301` with `location: https://parsanaji.com/`; third a `301` to https; fourth a count of at least 3.

Browser verification: `navigate_page` to `https://parsanaji.com/`, `take_screenshot`; the static page renders in Geist (no fallback-font flash), `list_console_messages` shows no CSP violations.

- [ ] **Step 5: Commit, push, confirm the workflow is green**

```bash
git add scripts/cf-setup-pages.mjs
git commit -m "feat: Cloudflare Pages domains, www redirect and HTTPS setup script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
gh run watch --exit-status
```

Expected: the run completes with the deploy step green.

---

### Task 7: Email routing for info@parsanaji.com

**Files:**
- Create: `scripts/cf-setup-email.mjs`

**Interfaces:**
- Produces: Email Routing enabled on the zone, destination `private-inbox@example.com` (verified by Parsa), rule `info@parsanaji.com → private-inbox@example.com`, catch-all disabled.

- [ ] **Step 1: Write `scripts/cf-setup-email.mjs`** (idempotent; `--no-wait` exits instead of polling for the verification click)

```js
// Email Routing: info@parsanaji.com -> private-inbox@example.com. Run: node scripts/cf-setup-email.mjs [--no-wait]
import { api, env, requireEnv, sleep } from './cf-api.mjs';

requireEnv('token', 'accountId', 'zoneId');
const DEST = 'private-inbox@example.com';
const ADDRESS = 'info@parsanaji.com';
const noWait = process.argv.includes('--no-wait');

// 1. enable routing on the zone (Cloudflare adds the MX and SPF records)
const settings = await api('GET', `/zones/${env.zoneId}/email/routing`);
if (settings.enabled) {
  console.log('email routing: already enabled');
} else {
  await api('POST', `/zones/${env.zoneId}/email/routing/enable`);
  console.log('email routing: enabled');
}

// 2. destination address (Cloudflare sends the verification email)
const addresses = await api('GET', `/accounts/${env.accountId}/email/routing/addresses?per_page=50`);
let dest = addresses.find((a) => a.email === DEST);
if (!dest) {
  dest = await api('POST', `/accounts/${env.accountId}/email/routing/addresses`, { email: DEST });
  console.log(`destination ${DEST}: created, verification email sent`);
} else {
  console.log(`destination ${DEST}: ${dest.verified ? 'verified' : 'awaiting verification'}`);
}

// 3. wait for Parsa to click the link (operator step 3)
while (!dest.verified) {
  if (noWait) {
    console.log('destination not verified yet; rerun this script after Parsa clicks the link');
    process.exit(0);
  }
  console.log('waiting for the verification click in the iCloud inbox (checking every 15 s)...');
  await sleep(15_000);
  dest = await api('GET', `/accounts/${env.accountId}/email/routing/addresses/${dest.id}`);
}
console.log(`destination ${DEST}: verified at ${dest.verified}`);

// 4. forwarding rule
const rules = await api('GET', `/zones/${env.zoneId}/email/routing/rules?per_page=50`);
if (rules.some((r) => r.matchers?.some((m) => m.value === ADDRESS))) {
  console.log(`rule ${ADDRESS}: already present`);
} else {
  await api('POST', `/zones/${env.zoneId}/email/routing/rules`, {
    name: 'info',
    enabled: true,
    matchers: [{ type: 'literal', field: 'to', value: ADDRESS }],
    actions: [{ type: 'forward', value: [DEST] }],
  });
  console.log(`rule ${ADDRESS} -> ${DEST}: created`);
}

// 5. catch-all stays off
const catchAll = await api('GET', `/zones/${env.zoneId}/email/routing/rules/catch_all`);
if (catchAll.enabled) {
  await api('PUT', `/zones/${env.zoneId}/email/routing/rules/catch_all`, { ...catchAll, enabled: false });
  console.log('catch-all: disabled');
} else {
  console.log('catch-all: off');
}
```

- [ ] **Step 2: Run it**

Run: `node scripts/cf-setup-email.mjs --no-wait`
Expected: routing enabled, destination created (verification email sent). Report to the orchestrator: "Parsa: click the Cloudflare verification link in private-inbox@example.com." Rerun without `--no-wait` after the click (the rule is the only remaining step; it can also happen in a later slice).

If `POST …/email/routing/enable` is rejected, fall back to one dashboard click (Email → Email Routing → Get started on the parsanaji.com zone) and rerun the script.

- [ ] **Step 3: Verify the DNS Cloudflare added**

Run: `node -e "import('./scripts/cf-api.mjs').then(async ({api, env}) => { const r = await api('GET', '/zones/' + env.zoneId + '/dns_records?type=MX'); console.log(r.map(x => x.content)); })"`
Expected: three `route*.mx.cloudflare.net` entries.

- [ ] **Step 4: Commit and push**

```bash
git add scripts/cf-setup-email.mjs
git commit -m "feat: Email Routing setup script for info@parsanaji.com

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 8: README and slice-1 checkpoint

**Files:**
- Create: `README.md`
- Orchestrator (not the builder): update `C:\Users\parsa\Documents\Obsidian Vault\Projects\parsanaji.com.md` (real deploy recipe, status "slice 1 live"), update `C:\Users\parsa\.claude\projects\C--Users-parsa\memory\parsanaji-com.md`, then compact.

- [ ] **Step 1: Write `README.md`**

```markdown
# parsanaji.com

Personal domain. Phase 1 teaser: the name in GPU particles (Three.js), one screen, no scroll.
Spec: `docs/superpowers/specs/2026-10-16-parsanaji-teaser-design.md`. Plan: `docs/superpowers/plans/2026-10-16-parsanaji-teaser.md`.

## Run

    npm install
    npm run dev          # http://localhost:5173  (add ?debug for the tuning panel)
    npm test             # vitest
    npm run build        # dist/

## Deploy

Every push deploys through GitHub Actions (`.github/workflows/deploy.yml`): `main` → https://parsanaji.com,
any other branch → `https://<branch>.parsanaji-com.pages.dev`. From a terminal with `.env` present:

    npm run deploy            # production
    npm run deploy:preview    # https://preview.parsanaji-com.pages.dev

## Infrastructure scripts (idempotent, need `.env`, see docs/OPERATOR.md)

    node scripts/cf-env.mjs          # verify token, record account + zone ids
    node scripts/cf-setup-pages.mjs  # custom domains, DNS, www redirect, HTTPS
    node scripts/cf-setup-email.mjs  # info@parsanaji.com -> private-inbox@example.com
    npm run fonts                    # regenerate the font subsets from scripts/fonts-src
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: README with run, deploy and infrastructure recipes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 3: Orchestrator checkpoint**

Update the vault note and memory file with: live URL confirmed, deploy recipe, email state (verified or waiting), any API surprises. Tell Parsa slice 1 is live. Compact before slice 2.

---
