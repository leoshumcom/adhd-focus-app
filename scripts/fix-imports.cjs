const fs = require('fs');
const path = require('path');
const glob = require('glob') || { sync: (p) => { const r = []; return r; } };

// Find all API route.ts files
const dir = path.resolve(__dirname, '..', 'src', 'app', 'api');
function findRoutes(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        files.push(...findRoutes(full));
      } else if (e.name === 'route.ts') {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

const files = findRoutes(dir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const old = content;

  // 1. Fix the broken \n scenario
  content = content.replace(/from ['"][^'"]*['"];?\\n.*$/gm, m => m.replace(/\\.*$/, "'"));
  
  // 2. Fix broken double imports "from X', { Y }" 
  content = content.replace(/from\s+['"][^'"]*['"]\s*,\s*\{[^}]+\}\s*from\s+['"][^'"]*['"]/g, match => {
    const m = match.match(/from\s+['"]([^'"]+)['"]/);
    return m ? `from '${m[1]}'` : match;
  });

  // 3. Clean up any random \n in import lines
  content = content.replace(/['"];\s*\\\\n\s*import/g, "', import");
  content = content.replace(/';\s*\\n\s*import/g, "', import");
  
  // 4. Ensure getDB is imported when used
  if (content.includes('getDB()') && !content.includes('getDB')) {
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/db['"]/,
      (match, imports) => `import {${imports}, getDB} from '@/lib/db'`
    );
  }
  
  // 5. Clean up duplicate items in imports
  content = content.replace(/(import\s*\{)([^}]+)(\}\s*from)/g, (m, start, middle, end) => {
    const items = [...new Set(middle.split(',').map(s => s.trim()).filter(Boolean))];
    return `${start} ${items.join(', ')} ${end}`;
  });
  
  if (content !== old) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', path.relative(dir, file));
  }
});

console.log('Done');
