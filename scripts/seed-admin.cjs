const https = require('https');
const fs = require('fs');
const TOKEN = process.env.CF_TOKEN_ADHD || process.argv[2];
const ACCT = 'd1240a198695f63bdc76bb1433f50119';
const DB_ID = '18771ffa-7422-4330-8eb0-fc58cf593087';

function query(sql) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'api.cloudflare.com', path: '/client/v4/accounts/' + ACCT + '/d1/database/' + DB_ID + '/query', method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } };
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } }); });
    req.on('error', reject);
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

(async () => {
  // Check if admin exists
  const check = await query("SELECT id, email, name, is_admin FROM parents WHERE email = 'adhd@leoshum.com'");
  if (check.result?.[0]?.results?.length > 0) {
    console.log('Admin already exists:', JSON.stringify(check.result[0].results[0]));
  } else {
    console.log('Admin not found, seeding...');
    const seedSql = fs.readFileSync(__dirname + '/../migrations/002_seed_admin.sql', 'utf8');
    const result = await query(seedSql);
    console.log('Seed result:', JSON.stringify(result?.result?.[0]?.meta || result.errors));
  }
})();
