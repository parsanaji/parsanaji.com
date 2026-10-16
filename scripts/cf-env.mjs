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
