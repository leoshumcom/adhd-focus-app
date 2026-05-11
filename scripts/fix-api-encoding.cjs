const fs = require('fs');
const path = require('path');

// Find all API route.ts files
const apiDir = path.resolve(__dirname, '..', 'src', 'app', 'api');
function findFiles(dir) {
  const files = [];
  try {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) files.push(...findFiles(full));
      else if (e.name === 'route.ts') files.push(full);
    });
  } catch {}
  return files;
}

const files = findFiles(apiDir);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let modified = content;

  // 1. Replace: const env = process.env as any;\n  [...DB check/null]\n  const db = env.DB as D1Database;
  modified = modified.replace(
    /const\s+env\s*=\s*process\.env\s+as\s+any;[\s\S]*?const\s+db\s*=\s*env\.DB\s+as\s+(D1Database|any);/g,
    'const db = getDB();'
  );

  // 2. Replace: const env = process.env as any;\n  if (!env.DB) { ... }\n  const db = env.DB as D1Database;
  modified = modified.replace(
    /const\s+env\s*=\s*process\.env\s+as\s+any;[\s\S]*?if\s*\(!env\.DB\)[\s\S]*?return\s+NextResponse\.json[\s\S]*?}[\s\S]*?const\s+db\s*=\s*env\.DB\s+as\s+(D1Database|any);/g,
    'const db = getDB();'
  );

  // 3. Remove standalone const env = process.env as any; (if nothing after)
  modified = modified.replace(/const\s+env\s*=\s*process\.env\s+as\s+any;(\s*\n)?/g, '');

  // 4. Add getDB to import from '@/lib/db'
  if (modified.includes('getDB()') && !modified.includes('getDB')) {
    modified = modified.replace(
      /(import\s*\{)([^}]+)(\}\s*from\s*['"]@\/lib\/db['"])/,
      (match, start, middle, end) => {
        const items = middle.split(',').map(s => s.trim()).filter(Boolean);
        if (!items.includes('getDB')) items.push('getDB');
        return `${start} ${items.join(', ')} ${end}`;
      }
    );
  }

  // 5. Add import if getDB is used but no import exists
  if (modified.includes('getDB()') && !modified.includes('@/lib/db')) {
    modified = "import { getDB } from '@/lib/db';\n" + modified;
  }

  if (modified !== content) {
    fs.writeFileSync(file, modified, 'utf8');
    console.log('Fixed:', path.relative(apiDir, file));
  }
});

// Fix db.ts
const dbPath = path.resolve(__dirname, '..', 'src', 'lib', 'db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf8');
if (!dbContent.includes('getCloudflareEnv')) {
  // db.ts already has the new code from our earlier edit
  console.log('db.ts already updated');
} else {
  // write the new version
  console.log('db.ts needs check');
}

console.log('Done');
