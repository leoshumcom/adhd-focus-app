const fs = require('fs');
const workerPath = process.argv[2] || '.open-next/_worker.js';
const sourcePath = process.argv[3] || '.open-next/worker.js';

// Copy worker.js to _worker.js
fs.copyFileSync(sourcePath, workerPath);
console.log('Copied ' + sourcePath + ' -> ' + workerPath);

// Read
let content = fs.readFileSync(workerPath, 'utf8');

// Find the middleware handler call and insert static asset serving before it
const oldCode = `// - \`Request\`s are handled by the Next server
            const reqOrResp = await middlewareHandler(request, env, ctx);`;

const newCode = `// - Serve static assets from Pages (CSS, JS, images, favicon)
            const staticUrl = new URL(request.url);
            if (staticUrl.pathname.startsWith('/_next/') ||
                staticUrl.pathname.startsWith('/favicon') ||
                staticUrl.pathname.startsWith('/icon-') ||
                staticUrl.pathname === '/manifest.json') {
              try {
                const staticResp = await env.ASSETS.fetch(staticUrl);
                if (staticResp.status < 400) {
                  return staticResp;
                }
              } catch (e) {
                // ASSETS not available, fall through to Next.js handler
              }
            }
            // - \`Request\`s are handled by the Next server
            const reqOrResp = await middlewareHandler(request, env, ctx);`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(workerPath, content, 'utf8');
  console.log('Static asset serving injected successfully');
} else {
  console.log('WARNING: Could not find injection point in worker.js');
  console.log('Content has ' + content.length + ' chars');
  // Debug: find the matching part
  const idx = content.indexOf('middlewareHandler');
  if (idx >= 0) {
    console.log('Found middlewareHandler at position ' + idx);
    console.log('Context: ' + content.substring(Math.max(0, idx-60), idx+60));
  }
}
