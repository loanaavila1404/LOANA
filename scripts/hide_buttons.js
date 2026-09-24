const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'src', 'app', '(erp)', 'dashboard', 'page.tsx');
let dContent = fs.readFileSync(dashboardPath, 'utf-8');
dContent = dContent.replace(/<button type="button" className="hidden sm:inline-flex/g, '<button type="button" className="hidden');
dContent = dContent.replace(/<button type="button" className="sm:hidden bg-white border border-slate-300 hover:bg-slate-50/g, '<button type="button" className="hidden');
fs.writeFileSync(dashboardPath, dContent, 'utf-8');

const crmHeaderPath = path.join(__dirname, '..', 'src', 'components', 'features', 'crm', 'CRMHeader.tsx');
let cContent = fs.readFileSync(crmHeaderPath, 'utf-8');
cContent = cContent.replace(/<button className="inline-flex items-center gap-1\.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm">\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<span>Exportar CSV\/Excel<\/span>\s*<\/button>/g, '');
cContent = cContent.replace(/<button className="inline-flex items-center gap-1\.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm">\s*<span>⚡ Reasignar en lote<\/span>\s*<\/button>/g, '');
fs.writeFileSync(crmHeaderPath, cContent, 'utf-8');

console.log('Hidden decorative buttons.');
