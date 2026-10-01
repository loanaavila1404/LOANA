const fs = require('fs');

function fix(f) {
  let d = fs.readFileSync(f, 'utf8');
  d = d.replace(/profiles!prospectos_asesor_id_fkey \(id, first_name, last_name\)/g, 'profiles!prospectos_asesor_id_fkey (id, display_name)');
  d = d.replace(/profiles!prospectos_asesor_id_fkey \(first_name, last_name\)/g, 'profiles!prospectos_asesor_id_fkey (display_name)');
  d = d.replace(/profiles!seguimientos_asesor_id_fkey \(first_name, last_name\)/g, 'profiles!seguimientos_asesor_id_fkey (display_name)');
  d = d.replace(/profiles!tareas_comerciales_asesor_id_fkey \(first_name, last_name\)/g, 'profiles!tareas_comerciales_asesor_id_fkey (display_name)');
  d = d.replace(/select\('id, first_name, last_name, role_id'\)/g, "select('id, display_name, role_id')");
  
  d = d.replace(/{ profiles: { first_name: string, last_name: string } }/g, '{ profiles: { display_name: string } }');
  
  // replace: `${...profiles.first_name} ${...profiles.last_name}`
  // with: `${...profiles.display_name}`
  d = d.replace(/\$\{\([^)]+\)\.profiles\.first_name\} \$\{\([^)]+\)\.profiles\.last_name\}/g, "$$${$$1.profiles.display_name}");
  
  // page.tsx line 123 in crm/page.tsx:
  d = d.replace(/`\$\{\(p as unknown as \{ profiles: \{ display_name: string \} \}\)\.profiles\.first_name\} \$\{\(p as unknown as \{ profiles: \{ display_name: string \} \}\)\.profiles\.last_name\}`/g, "((p as unknown as { profiles: { display_name: string } }).profiles.display_name)");
  
  d = d.replace(/asesores: { id: string, first_name: string, last_name: string, role_id: string }\[\];/g, 'asesores: { id: string, display_name: string, role_id: string }[];');
  d = d.replace(/a\.first_name\} \{a\.last_name/g, 'a.display_name');
  fs.writeFileSync(f, d);
}

fix('src/app/(erp)/crm/prospectos/[id]/page.tsx');
fix('src/app/(erp)/crm/page.tsx');
fix('src/app/(erp)/crm/prospectos/[id]/TransferenciaModalClient.tsx');
