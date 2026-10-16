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
