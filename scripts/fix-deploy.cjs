const https = require('https');
const crypto = require('crypto');
const TOKEN = process.env.CF_TOKEN_ADHD || process.argv[2];
if (!TOKEN) { console.error('Set CF_TOKEN_ADHD env or pass as arg'); process.exit(1); }
const ACCT = 'd1240a198695f63bdc76bb1433f50119';
const PROJECT = 'adhd-focus-app';
const DB_ID = '18771ffa-7422-4330-8eb0-fc58cf593087';

const AUTH_SECRET = crypto.randomBytes(32).toString('hex');
console.log('AUTH_SECRET: ' + AUTH_SECRET);

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'api.cloudflare.com', path, method, headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } }); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  console.log('Updating Pages project config...');
  const r = await api('PATCH', '/client/v4/accounts/' + ACCT + '/pages/projects/' + PROJECT, JSON.stringify({
    build_config: { build_command: 'npx @opennextjs/cloudflare build', destination_dir: '.open-next', root_dir: null },
    deployment_configs: {
      preview: { env_vars: { AUTH_SECRET: { value: AUTH_SECRET, type: 'secret_text' }, AUTH_URL: { value: 'https://adhd-focus-app.pages.dev', type: 'secret_text' }, NEXTAUTH_SECRET: { value: AUTH_SECRET, type: 'secret_text' }, NEXTAUTH_URL: { value: 'https://adhd-focus-app.pages.dev', type: 'secret_text' } }, d1_databases: { DB: { id: DB_ID } }, compatibility_date: '2026-05-11', compatibility_flags: ['nodejs_compat'] },
      production: { env_vars: { AUTH_SECRET: { value: AUTH_SECRET, type: 'secret_text' }, AUTH_URL: { value: 'https://adhd-focus-app.pages.dev', type: 'secret_text' }, NEXTAUTH_SECRET: { value: AUTH_SECRET, type: 'secret_text' }, NEXTAUTH_URL: { value: 'https://adhd-focus-app.pages.dev', type: 'secret_text' } }, d1_databases: { DB: { id: DB_ID } }, compatibility_date: '2026-05-11', compatibility_flags: ['nodejs_compat'] },
    },
  }));
  console.log(r.success ? '✅ Updated' : '❌ Failed: ' + JSON.stringify(r.errors));
})();
