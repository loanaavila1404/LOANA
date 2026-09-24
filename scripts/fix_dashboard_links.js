const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(erp)', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace Nuevo Estudiante button
content = content.replace(/<button type="button" className="flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start px-4 sm:px-4 py-2\.5 sm:py-2 text-xs font-semibold text-white bg-brusben-red sm:bg-brand-700 hover:bg-brusben-redHover sm:hover:bg-brand-800 active:scale-\[0\.98\] sm:active:scale-100 rounded-lg shadow-sm hover:shadow transition focus:ring-2 focus:ring-offset-2 focus:ring-brand-700 gap-1\.5 sm:gap-0">\s*<Plus className="w-4 h-4 sm:mr-1\.5" \/>\s*<span>Nuevo estudiante<\/span>\s*<\/button>/, 
`<Link href="/personas" className="flex-1 sm:flex-none inline-flex items-center justify-center sm:justify-start px-4 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-brusben-red sm:bg-brand-700 hover:bg-brusben-redHover sm:hover:bg-brand-800 active:scale-[0.98] sm:active:scale-100 rounded-lg shadow-sm hover:shadow transition focus:ring-2 focus:ring-offset-2 focus:ring-brand-700 gap-1.5 sm:gap-0">
  <Plus className="w-4 h-4 sm:mr-1.5" />
  <span>Nuevo estudiante</span>
</Link>`);

// Fix "Ver todos" link
content = content.replace(/<Link href="#" className="text-\[11px\] sm:text-xs font-bold sm:font-semibold text-brand-700 hover:text-brand-800 sm:hover:underline inline-flex items-center gap-1 transition">\s*<span>Ver todos \(0\)<\/span>/, 
`<Link href="/personas" className="text-[11px] sm:text-xs font-bold sm:font-semibold text-brand-700 hover:text-brand-800 sm:hover:underline inline-flex items-center gap-1 transition">
  <span>Ver todos ({estudiantesActivos || '0'})</span>`);

// Replace Module Links
let mCount = 0;
content = content.replace(/<Link href="#" className="bg-white/g, (match) => {
  mCount++;
  if (mCount === 1) return `<Link href="/crm" className="bg-white`;
  if (mCount === 2) return `<Link href="/oferta" className="bg-white`;
  if (mCount === 3) return `<Link href="/matriculas" className="bg-white`;
  if (mCount === 4) return `<Link href="/personas" className="bg-white`;
  return match;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Dashboard links updated.');
