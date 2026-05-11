const fs = require('fs');
const https = require('https');
const GH_TOKEN = process.env.GH_TOKEN || process.argv[2];
if (!GH_TOKEN) { console.error('Set GH_TOKEN env or pass as arg'); process.exit(1); }

const pages = ['profile', 'train', 'homework', 'rewards', 'register', 'login'];
let idx = 0;

function next() {
  if (idx >= pages.length) { console.log('DONE'); return; }
  const page = pages[idx];
  const localPath = 'F:/OpenClaw/workspace/adhd-focus-app/src/app/' + page + '/page.tsx';
  if (!fs.existsSync(localPath)) { console.log('SKIP ' + page); idx++; next(); return; }
  const content = fs.readFileSync(localPath).toString();
  const lines = content.split('\n');
  const useClientIdx = lines.findIndex(l => l.includes("'use client'"));
  if (useClientIdx >= 0) {
    const nextLine = useClientIdx + 1;
    if (!lines[nextLine]?.includes('force-dynamic')) {
      lines.splice(nextLine, 0, '', "export const dynamic = 'force-dynamic';");
    }
  }
  const newContent = Buffer.from(lines.join('\n'));

  https.request({
    hostname: 'api.github.com',
    path: '/repos/leoshumcom/adhd-focus-app/contents/src/app/' + page + '/page.tsx',
    method: 'GET',
    headers: { 'Authorization': 'token ' + GH_TOKEN, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'nodejs' }
  }, res => {
    let b = '';
    res.on('data', d => b += d);
    res.on('end', () => {
      try {
        const r = JSON.parse(b);
        if (!r.sha) { console.log('ERR ' + page + ': no sha'); idx++; next(); return; }
        https.request({
          hostname: 'api.github.com',
          path: '/repos/leoshumcom/adhd-focus-app/contents/src/app/' + page + '/page.tsx',
          method: 'PUT',
          headers: { 'Authorization': 'token ' + GH_TOKEN, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'nodejs' }
        }, res2 => {
          let b2 = '';
          res2.on('data', d => b2 += d);
          res2.on('end', () => { console.log('OK ' + page); idx++; next(); });
        }).end(JSON.stringify({ message: 'Force dynamic for ' + page, content: newContent.toString('base64'), sha: r.sha, branch: 'main' }));
      } catch(e) { console.log('ERR ' + page + ': ' + e.message); idx++; next(); }
    });
  }).end();
}
next();
