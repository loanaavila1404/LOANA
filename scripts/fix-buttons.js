const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/loana/Documents/Codex/ERP BRUSBEN/ERP-Brusben-Fase-1/erp-brusben-web/src/app/(erp)';
const dirs = fs.readdirSync(dir);
for (const d of dirs) {
  const p = path.join(dir, d, 'page.tsx');
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/ size="[^"]*"/g, '');
    fs.writeFileSync(p, content);
  }
}
console.log('Fixed Button props');
