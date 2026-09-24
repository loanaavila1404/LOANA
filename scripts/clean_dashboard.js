const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(erp)', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace fake metrics with real/empty ones
content = content.replace(/\+12\.4%/, '—');
content = content.replace(/71\.4%/, '—');
content = content.replace(/28\.6%/, '—');
content = content.replace(/>142</g, '>0<');
content = content.replace(/>64 </g, '>0 <');
content = content.replace(/18,450/g, '0');
content = content.replace(/28 pendientes/g, '0 pendientes');
content = content.replace(/14 Carreras • 4 Cert\./g, 'Sin datos');
content = content.replace(/14 Carreras Técnicas · 4 Certificaciones/g, 'Sin datos');
content = content.replace(/\(1,248\)/g, '(0)');
content = content.replace(/Todos \(5\)/g, 'Todos (0)');

// Replace the desktop table rows with empty state
const desktopTableStart = content.indexOf('<tbody className="divide-y divide-slate-100 text-slate-700">');
const desktopTableEnd = content.indexOf('</tbody>', desktopTableStart);
if (desktopTableStart !== -1 && desktopTableEnd !== -1) {
  content = content.substring(0, desktopTableStart) + 
  `<tbody className="divide-y divide-slate-100 text-slate-700">
    <tr>
      <td colSpan={6} className="py-8 text-center text-slate-500">
        Sin datos recientes
      </td>
    </tr>\n              ` +
  content.substring(desktopTableEnd);
}

// Replace the mobile list rows with empty state
const mobileListStart = content.indexOf('<div className="sm:hidden flex flex-col px-3.5 pb-4 space-y-2.5">');
if (mobileListStart !== -1) {
  const nextSection = content.indexOf('</section>', mobileListStart);
  content = content.substring(0, mobileListStart) +
  `<div className="sm:hidden flex flex-col px-3.5 pb-4 space-y-2.5">
    <div className="py-8 text-center text-slate-500 text-xs">Sin datos recientes</div>
  </div>\n        ` +
  content.substring(nextSection);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Dashboard fake data stripped.');
