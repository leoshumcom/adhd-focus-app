const https = require('https');
const TOKEN = process.env.CF_TOKEN_ADHD || process.argv[2];
if (!TOKEN) { console.error('Set CF_TOKEN_ADHD env or pass as arg'); process.exit(1); }
const ACCT = 'd1240a198695f63bdc76bb1433f50119';
const DB_ID = '18771ffa-7422-4330-8eb0-fc58cf593087';

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
  console.log('=== D1 Tables ===');
  const r = await api('POST', '/client/v4/accounts/' + ACCT + '/d1/database/' + DB_ID + '/query', JSON.stringify({ sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name" }));
  if (r.result?.[0]?.results) {
    r.result[0].results.forEach(row => console.log('  ' + row.name));
  } else {
    console.log('Error: ' + JSON.stringify(r.errors));
  }
})();
