// Custom domains, DNS, www redirect and HTTPS for the Pages project. Run: node scripts/cf-setup-pages.mjs
import { api, env, requireEnv, sleep } from './cf-api.mjs';

requireEnv('token', 'accountId', 'zoneId');
const PROJECT = 'parsanaji-com';
const APEX = 'parsanaji.com';
const WWW = 'www.parsanaji.com';
const PAGES_HOST = `${PROJECT}.pages.dev`;

// 1. custom domain on the Pages project: the apex only. www is handled at the zone edge
//    (proxied CNAME + Single Redirect). A www Pages domain never validates because the
//    redirect rule also catches Cloudflare's http validation path (found in Task 6).
const domains = await api('GET', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains`);
if (domains.some((d) => d.name === APEX)) {
  console.log(`Pages domain ${APEX}: already present`);
} else {
  await api('POST', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains`, { name: APEX });
  console.log(`Pages domain ${APEX}: added`);
}
if (domains.some((d) => d.name === WWW)) {
  await api('DELETE', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains/${WWW}`);
  console.log(`Pages domain ${WWW}: removed (www is a zone-level redirect)`);
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

// 4b. Scrape Shield off: email obfuscation would rewrite mailto:info@parsanaji.com into a
//     /cdn-cgi/l/email-protection link and inject a script (spec: plain mailto, strict CSP).
await api('PATCH', `/zones/${env.zoneId}/settings/email_obfuscation`, { value: 'off' });
console.log('email_obfuscation: off');

// 5. wait for the apex Pages domain to validate (certificate issuance can take a few minutes)
for (const name of [APEX]) {
  let status = 'unknown';
  for (let i = 0; i < 30; i++) {
    const d = await api('GET', `/accounts/${env.accountId}/pages/projects/${PROJECT}/domains/${name}`);
    status = d.status;
    if (status === 'active') break;
    await sleep(10_000);
  }
  console.log(`${name}: ${status}`);
}
