const fs = require('fs');

function fixPage(f) {
  let data = fs.readFileSync(f, 'utf8');
  data = data.replace(/profiles!prospectos_asesor_id_fkey \(id, nombre, apellido\)/g, 'profiles!prospectos_asesor_id_fkey (id, first_name, last_name)');
  data = data.replace(/profiles!prospectos_asesor_id_fkey \(nombre, apellido\)/g, 'profiles!prospectos_asesor_id_fkey (first_name, last_name)');
  data = data.replace(/profiles!seguimientos_asesor_id_fkey \(nombre, apellido\)/g, 'profiles!seguimientos_asesor_id_fkey (first_name, last_name)');
  data = data.replace(/profiles!tareas_comerciales_asesor_id_fkey \(nombre, apellido\)/g, 'profiles!tareas_comerciales_asesor_id_fkey (first_name, last_name)');
  data = data.replace(/select\('id, nombre, apellido, role_id'\)/g, "select('id, first_name, last_name, role_id')");
  data = data.replace(/{ profiles: { nombre: string, apellido: string } }/g, '{ profiles: { first_name: string, last_name: string } }');
  data = data.replace(/\.profiles\.nombre/g, '.profiles.first_name');
  data = data.replace(/\.profiles\.apellido/g, '.profiles.last_name');
  data = data.replace(/prospecto\.status === 'PERDIDO' \? 'destructive' : 'outline'/g, "prospecto.status === 'PERDIDO' ? 'danger' : 'default'");
  data = data.replace(/p\.status === 'PERDIDO' \? 'destructive' : 'outline'/g, "p.status === 'PERDIDO' ? 'danger' : 'default'");
  fs.writeFileSync(f, data);
}

fixPage('src/app/(erp)/crm/prospectos/[id]/page.tsx');
fixPage('src/app/(erp)/crm/page.tsx');
fixPage('src/app/(erp)/crm/prospectos/[id]/TransferenciaModalClient.tsx');

let actF = 'src/app/actions/crm/actividades.ts';
let actData = fs.readFileSync(actF, 'utf8');
actData = actData.replace(/CRM\.EDITAR/g, 'CRM.GESTIONAR');
fs.writeFileSync(actF, actData);

let proF = 'src/app/actions/crm/prospectos.ts';
let proData = fs.readFileSync(proF, 'utf8');
proData = proData.replace(/CRM\.EDITAR/g, 'CRM.GESTIONAR');
fs.writeFileSync(proF, proData);
