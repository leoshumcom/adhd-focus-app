const https = require('https');
const TOKEN = process.env.CF_TOKEN_ADHD || process.argv[2];
if (!TOKEN) { console.error('Set CF_TOKEN_ADHD env or pass as arg'); process.exit(1); }
const ACCOUNT = 'd1240a198695f63bdc76bb1433f50119';
const HEADERS = { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

function api(path) {
  return new Promise((resolve, reject) => {
    https.get({ hostname: 'api.cloudflare.com', path, headers: HEADERS }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  console.log('=== 1. D1 Databases ===');
  try {
    const d1 = await api('/client/v4/accounts/' + ACCOUNT + '/d1/database');
    if (d1.result && d1.result.length > 0) {
      d1.result.forEach(db => console.log('  DB: ' + db.name + ' | id: ' + db.uuid));
    } else {
      console.log('  No D1 databases found!');
    }
  } catch(e) { console.log('  Error: ' + e.message); }

  console.log('\n=== 2. Pages Project ===');
  try {
    const proj = await api('/client/v4/accounts/' + ACCOUNT + '/pages/projects/adhd-focus-app');
    if (proj.result) {
      const p = proj.result;
      console.log('  Name: ' + p.name);
      console.log('  URL: ' + (p.canonical_deployment ? p.canonical_deployment.url : 'none'));
      console.log('  Domains: ' + (p.domains || []).join(', '));
    }
  } catch(e) { console.log('  Error: ' + e.message); }

  console.log('\n=== DONE ===');
})();
