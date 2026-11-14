// Email Routing: info@parsanaji.com -> the private inbox in EMAIL_ROUTING_DEST (.env).
// Run: node scripts/cf-setup-email.mjs [--no-wait]
import { api, env, requireEnv, sleep } from './cf-api.mjs';

requireEnv('token', 'accountId', 'zoneId');
const DEST = process.env.EMAIL_ROUTING_DEST ?? '';
if (!DEST) {
  console.error('missing EMAIL_ROUTING_DEST in .env (the inbox info@parsanaji.com forwards to)');
  process.exit(1);
}
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

// 3. wait for the verification click in the destination inbox
while (!dest.verified) {
  if (noWait) {
    console.log('destination not verified yet; rerun this script after clicking the link');
    process.exit(0);
  }
  console.log('waiting for the verification click in the destination inbox (checking every 15 s)...');
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
