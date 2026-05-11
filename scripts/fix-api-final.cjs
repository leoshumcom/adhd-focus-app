const fs = require('fs');

const files = [
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/checkin/route.ts',
  'src/app/api/rewards/route.ts',
];

const root = __dirname + '/..';

function getDBImport(existingImports) {
  const imports = existingImports.split(',').map(s => s.trim()).filter(Boolean);
  if (!imports.includes('getDB')) imports.push('getDB');
  return imports.join(', ');
}

files.forEach(f => {
  const path = root + '/' + f;
  let content = fs.readFileSync(path, 'utf8');
  const old = content;

  // Replace: const env = process.env as any; then db = env.DB
  content = content.replace(
    /const env = process\.env as any;[\s\S]*?const db = env\.DB as (D1Database|any);/,
    'const db = getDB();'
  );
  
  // Replace: const env = ... followed by if (!env.DB) {...} then db = env.DB
  content = content.replace(
    /const env = process\.env as any;[\s\S]*?if \(!env\.DB\) \{[\s\S]*?\}[\s\S]*?const db = env\.DB as (D1Database|any);/,
    'const db = getDB();'
  );

  // Add getDB to imports
  if (content.includes('getDB()') && !content.includes('getDB')) {
    content = content.replace(
      /(import\s*\{)([^}]+)(\}\s*from\s*['"]@\/lib\/db['"];)/,
      (m, start, middle, end) => start + ' ' + getDBImport(middle) + ' ' + end
    );
  }

  // Also add import line if no import from @/lib/db exists
  if (content.includes('getDB()') && !content.includes('@/lib/db')) {
    content = content.replace(
      /(import.*from.*;)\n/,
      '$1\nimport { getDB } from \'@/lib/db\';\n'
    );
  }

  if (content !== old) {
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed:', f);
  } else {
    console.log('No change needed:', f);
  }
});

console.log('Done');
