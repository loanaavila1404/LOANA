const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(erp)', 'crm', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace fake CRM metrics
content = content.replace(/↑ \+18\.2% este mes/g, '—');
content = content.replace(/>164</g, '>{prospectos?.filter(p => p.status === "CONTACTADO").length || 0}<');
content = content.replace(/38\.3% del embudo/g, '—');
content = content.replace(/>52</g, '>{prospectos?.filter(p => p.status === "INTERESADO").length || 0}<'); // just a proxy, real prematriculas logic isn't queried here
content = content.replace(/Meta: 70 cupos/g, '—');
content = content.replace(/>28\.4%</g, '>0%<');
content = content.replace(/↑ \+3\.1% vs anterior/g, '—');
content = content.replace(/19 nuevos/g, '0 nuevos');
content = content.replace(/34 tareas pendientes/g, '0 tareas pendientes');
content = content.replace(/6 en turno de atención/g, '0 en turno de atención');
content = content.replace(/14 min/g, '—');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('CRM fake data stripped.');
