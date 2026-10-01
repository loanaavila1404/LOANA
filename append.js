const fs = require('fs');
let f = 'src/app/actions/crm/prospectos.ts';
let content = fs.readFileSync(f, 'utf8');

content += `
export async function convertirAEstudianteAction(prospectoId: string) {
  const permissions = await getUserPermissions();
  if (!permissions.includes('CRM.EDITAR') && !permissions.includes('SISTEMA.ADMINISTRAR')) return { error: 'No tienes permiso' };
  
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  
  const { data: p } = await supabase.from('prospectos').select('*').eq('id', prospectoId).single();
  if (!p) return { error: 'Prospecto no encontrado' };
  if (p.status === 'MATRICULADO') return { error: 'Ya fue convertido' };
  
  const { data: persona, error: perError } = await supabase.from('personas').insert({ 
    tipo_documento: p.tipo_documento, 
    numero_documento: p.numero_documento, 
    nombres: p.nombres, 
    apellidos: p.apellidos, 
    email: p.email, 
    telefono: p.telefono, 
    created_by: user?.id 
  }).select().single();
  
  if (perError) return { error: 'Error al crear persona' };
  
  const { data: estudiante, error: estError } = await supabase.from('estudiantes').insert({ 
    persona_id: persona.id, 
    status: 'ACTIVO', 
    created_by: user?.id 
  }).select().single();
  
  if (estError) return { error: 'Error al crear estudiante' };
  
  await supabase.from('prospectos').update({ 
    status: 'MATRICULADO', 
    persona_id: persona.id, 
    estudiante_id: estudiante.id, 
    fecha_conversion: new Date().toISOString(), 
    asesor_conversion_id: p.asesor_id || user?.id,
    updated_by: user?.id
  }).eq('id', prospectoId);
  
  revalidatePath('/crm/prospectos/' + prospectoId);
  revalidatePath('/crm');
  return { success: true };
}
`;

fs.writeFileSync(f, content);
