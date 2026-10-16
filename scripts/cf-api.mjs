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
