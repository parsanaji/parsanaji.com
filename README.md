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
