const https = require('https');
const TOKEN = process.env.CF_TOKEN_ADHD || process.argv[2];
if (!TOKEN) { console.error('Set CF_TOKEN_ADHD env or pass as arg'); process.exit(1); }
const ACCT = 'd1240a198695f63bdc76bb1433f50119';

const opts = {
  hostname: 'api.cloudflare.com',
  path: '/client/v4/accounts/' + ACCT + '/pages/projects/adhd-focus-app/deployments',
  headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }
};

https.get(opts, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const r = JSON.parse(d);
    if (!r.result) { console.log('Error:', r.errors); return; }
    r.result.forEach(dep => {
      const aliases = dep.aliases ? dep.aliases.join(', ') : 'none';
      const stage = dep.latest_stage ? dep.latest_stage.name : 'unknown';
      console.log(dep.id + ' | env:' + dep.environment + ' | ' + dep.url + ' | aliases:' + aliases + ' | stage:' + stage);
    });
  });
});
