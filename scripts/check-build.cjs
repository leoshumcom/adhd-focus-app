const https = require('https');
const TOKEN = process.env.CF_TOKEN_ADHD || process.argv[2];
if (!TOKEN) { console.error('Set CF_TOKEN_ADHD env or pass as arg'); process.exit(1); }
const ACCT = 'd1240a198695f63bdc76bb1433f50119';

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
  const dep = (await api('GET', '/client/v4/accounts/' + ACCT + '/pages/projects/adhd-focus-app/deployments?per_page=1')).result?.[0];
  console.log(JSON.stringify({ id: dep?.id, url: dep?.url, env: dep?.environment, stage: dep?.latest_stage, build_config: dep?.build_config, source: dep?.source }, null, 2));
  const proj = (await api('GET', '/client/v4/accounts/' + ACCT + '/pages/projects/adhd-focus-app'));
  console.log('Build config:', JSON.stringify(proj.result?.build_config));
  console.log('Source:', JSON.stringify(proj.result?.source));
})();
